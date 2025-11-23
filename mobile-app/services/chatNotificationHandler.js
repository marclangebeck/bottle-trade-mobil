/**
 * PHASE 4: Chat-Notification-Handler
 * 
 * Spezifische Handler für Chat-Notifications
 */

import { createNotification } from './notificationService';
import { getChat as fsGetChat } from './database-web';
import { deleteNotificationsForChat as fsDeleteNotificationsForChat } from './database-web';
import { markNotificationAsRead } from './notificationService';
import { logNotificationEvent } from './notificationLogger';

/**
 * Erstellt eine Chat-Notification für eine neue Nachricht
 * @param {string} chatId - Chat-ID
 * @param {object} message - Message-Objekt
 * @param {string} recipientId - Empfänger-ID
 * @param {object} options - Optionen
 * @param {boolean} options.isChatOpen - Ist Chat aktuell geöffnet?
 * @returns {Promise<string|null>} - Notification-ID oder null
 */
export const createChatNotification = async (chatId, message, recipientId, options = {}) => {
  const { isChatOpen = false } = options;

  // Prüfe ob Chat geöffnet ist
  if (isChatOpen) {
    console.log(`ℹ️ Chat ${chatId} ist aktuell geöffnet, keine Notification erstellt`);
    logNotificationEvent({
      stage: 'chat/notification/skipped',
      type: 'chat',
      data: { chatId, reason: 'chat-is-open', recipientId },
    });
    return null;
  }

  // Prüfe ob Message gültig ist
  if (!message || !message.senderId || !message.text) {
    console.log('⚠️ Ungültige Nachricht, keine Notification erstellt');
    return null;
  }

  // Prüfe ob Sender = Empfänger (eigene Nachricht)
  if (message.senderId === recipientId) {
    console.log('ℹ️ Eigene Nachricht, keine Notification erstellt');
    return null;
  }

  // Lade Chat-Daten (falls nicht vorhanden)
  let chat;
  try {
    chat = await fsGetChat(chatId);
    if (!chat) {
      console.log('⚠️ Chat nicht gefunden, keine Notification erstellt:', chatId);
      return null;
    }
  } catch (error) {
    console.error('❌ Fehler beim Laden des Chats:', error);
    return null;
  }

  // Prüfe ob Chat gelöscht wurde
  if (chat.deletedBy) {
    console.log('⚠️ Chat wurde gelöscht, keine Notification erstellt');
    return null;
  }

  // Prüfe ob es wirklich ein Chat ist
  if (chat.entryType === 'hint') {
    console.log('⚠️ Eintrag ist ein Hinweis, keine Chat-Notification erstellt');
    return null;
  }

  // Erstelle Notification
  const notificationData = {
    type: 'chat',
    title: `Neue Nachricht von ${message.senderName || 'Unbekannt'}`,
    message: message.text,
    priority: 'medium',
    chatId: chatId,
    messageId: message.id,
    senderId: message.senderId,
    senderName: message.senderName,
    toUserId: recipientId,
    fromUserId: message.senderId,
    messageText: message.text,
  };

  console.log('🔄 Erstelle Chat-Notification:', { chatId, recipientId, senderId: message.senderId });
  const notificationId = await createNotification(recipientId, notificationData);
  
  if (notificationId) {
    logNotificationEvent({
      stage: 'chat/notification/created',
      type: 'chat',
      data: { chatId, notificationId, recipientId, messageId: message.id },
    });
  }

  return notificationId;
};

/**
 * Erstellt Notifications für mehrere neue Nachrichten
 * @param {string} chatId - Chat-ID
 * @param {Array} newMessages - Array von neuen Nachrichten
 * @param {string} currentUserId - Aktueller User-ID (Empfänger)
 * @param {object} options - Optionen
 * @param {boolean} options.isChatOpen - Ist Chat aktuell geöffnet?
 * @returns {Promise<Array>} - Array von erstellten Notification-IDs
 */
export const createNotificationsForNewMessages = async (chatId, newMessages, currentUserId, options = {}) => {
  if (!newMessages || newMessages.length === 0) {
    return [];
  }

  if (!currentUserId) {
    console.log('⚠️ Kein currentUserId, keine Notifications erstellt');
    return [];
  }

  // Lade Chat-Daten
  let chat;
  try {
    chat = await fsGetChat(chatId);
    if (!chat) {
      console.log('⚠️ Chat nicht gefunden, keine Notifications erstellt:', chatId);
      return [];
    }
  } catch (error) {
    console.error('❌ Fehler beim Laden des Chats:', error);
    return [];
  }

  // Prüfe ob Chat gültig ist
  if (!chat.participants || !Array.isArray(chat.participants)) {
    console.log('⚠️ Chat hat keine Teilnehmer-Liste');
    return [];
  }

  if (chat.deletedBy) {
    console.log('⚠️ Chat wurde gelöscht');
    return [];
  }

  if (chat.entryType === 'hint') {
    console.log('⚠️ Eintrag ist ein Hinweis');
    return [];
  }

  const { isChatOpen = false } = options;
  const createdNotifications = [];

  // Erstelle Notifications für jede neue Nachricht
  for (const message of newMessages) {
    // Finde Empfänger (anderer Teilnehmer als Sender)
    const toUserId = chat.participants.find(pid => pid !== message.senderId);
    
    if (!toUserId || toUserId !== currentUserId) {
      continue; // Nicht für aktuellen User
    }

    if (message.senderId === currentUserId) {
      continue; // Eigene Nachricht
    }

    const notificationId = await createChatNotification(chatId, message, toUserId, { isChatOpen });
    if (notificationId) {
      createdNotifications.push(notificationId);
    }
  }

  return createdNotifications;
};

/**
 * Löscht alle Notifications für einen Chat
 * @param {string} userId - User-ID
 * @param {string} chatId - Chat-ID
 * @param {string|null} tradeRequestId - Optional: Trade-Request-ID
 * @returns {Promise<number>} - Anzahl gelöschter Notifications
 */
export const deleteChatNotifications = async (userId, chatId, tradeRequestId = null) => {
  return await fsDeleteNotificationsForChat(userId, chatId, tradeRequestId);
};

/**
 * Markiert alle Chat-Notifications als gelesen
 * @param {string} userId - User-ID
 * @param {string} chatId - Chat-ID
 * @returns {Promise<number>} - Anzahl markierter Notifications
 */
export const markChatNotificationsAsRead = async (userId, chatId) => {
  try {
    console.log('🔄 Markiere Chat-Notifications als gelesen:', { userId, chatId });
    logNotificationEvent({
      stage: 'chat/markAsRead/start',
      type: 'chat',
      data: { userId, chatId },
    });

    // WICHTIG: Verwende deleteChatNotifications, da Notifications beim Lesen gelöscht werden
    // (laut aktueller Logik werden Notifications beim Lesen gelöscht, nicht nur als gelesen markiert)
    const deletedCount = await deleteChatNotifications(userId, chatId);
    
    console.log(`✅ ${deletedCount} Chat-Notifications gelöscht (als gelesen markiert)`);
    logNotificationEvent({
      stage: 'chat/markAsRead/success',
      type: 'chat',
      data: { userId, chatId, deletedCount },
    });

    return deletedCount;
  } catch (error) {
    console.error('❌ Fehler beim Markieren der Chat-Notifications als gelesen:', error);
    logNotificationEvent({
      stage: 'chat/markAsRead/error',
      type: 'chat',
      data: { userId, chatId },
      meta: { message: error?.message },
    });
    throw error;
  }
};

