/**
 * PHASE 4: Trade-Notification-Handler
 * 
 * Spezifische Handler für Trade-Notifications
 * WICHTIG: Trade-Requests sind die Basis für Chats und Hinweise!
 */

import { createNotification } from './notificationService';
import { 
  getTradeRequest,
  updateTradeRequestStatus as fsUpdateTradeRequestStatus,
  deleteTradeRequest as fsDeleteTradeRequest,
  createChat as fsCreateChat,
  createTradeHint as fsCreateTradeHint,
  updateTradeHint as fsUpdateTradeHint,
  deleteChat as fsDeleteChat,
  deleteNotificationsForTradeRequest as fsDeleteNotificationsForTradeRequest,
} from './database-web';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import { serverTimestamp } from 'firebase/firestore';
import { logNotificationEvent } from './notificationLogger';

// Lock-Mechanismus um Race Conditions zu vermeiden
const processingRequests = new Set();

/**
 * Erstellt Notifications für einen Trade-Request
 * @param {string} requestId - Trade-Request-ID
 * @param {object} payload - Trade-Request-Daten
 * @param {string} currentUserId - Aktueller User-ID
 * @returns {Promise<void>}
 */
export const createTradeRequestNotifications = async (requestId, payload, currentUserId) => {
  // Lock-Mechanismus
  if (processingRequests.has(requestId)) {
    console.log('⚠️ createTradeRequestNotifications läuft bereits für requestId:', requestId);
    return;
  }

  processingRequests.add(requestId);

  try {
    // Prüfe Trade-Request Status
    const tradeRequest = await getTradeRequest(requestId);
    if (!tradeRequest || tradeRequest.status !== 'pending') {
      console.log('⚠️ Trade-Request nicht gefunden oder nicht pending');
      return;
    }

    // WICHTIG: Korrigiere payload.toUserName und payload.fromUserName aus dem Trade-Request
    // Verwende immer die Namen aus dem Trade-Request, da diese die korrekten sind
    if (tradeRequest.toUserName) {
      payload.toUserName = tradeRequest.toUserName;
      console.log('🔧 tradeNotificationHandler: toUserName aus Trade-Request verwendet:', payload.toUserName);
    }
    if (tradeRequest.fromUserName) {
      payload.fromUserName = tradeRequest.fromUserName;
      console.log('🔧 tradeNotificationHandler: fromUserName aus Trade-Request verwendet:', payload.fromUserName);
    }

    const isSender = currentUserId === payload.fromUserId;
    const isReceiver = currentUserId === payload.toUserId;

    if (!isSender && !isReceiver) {
      console.log('⚠️ User ist weder Absender noch Empfänger');
      return;
    }

    // Prüfe ob bereits Hinweise existieren
    const hintsQuery = query(
      collection(db, 'chats'),
      where('tradeRequestId', '==', requestId),
      where('entryType', '==', 'hint')
    );
    const hintsSnapshot = await getDocs(hintsQuery);
    const allHints = hintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const hasDecisionHint = allHints.some(hint => {
      const isDecision = hint.hintType === 'trade-decision';
      if (!isDecision) return false;
      const isForFromUser = hint.userId === payload.fromUserId;
      const isForToUser = hint.userId === payload.toUserId;
      return isForFromUser || isForToUser;
    });

    if (hasDecisionHint) {
      console.log('ℹ️ Entscheidungshinweis existiert bereits');
      return;
    }

    // Erstelle Hinweise und Notifications
    if (isSender) {
      // A (Absender): hint-small
      const existingHintA = allHints.find(hint => 
        hint.userId === currentUserId && 
        hint.hintType === 'trade-involved'
      );

      if (!existingHintA) {
        const hintDataA = {
          entryType: 'hint',
          hintType: 'trade-involved',
          tradeRequestId: requestId,
          userId: currentUserId,
          status: 'requested',
          participantNames: [payload.fromUserName, payload.toUserName],
          lastMessage: `Du bist in einen Tausch involviert: Du möchtest mit ${payload.toUserName} den Wein "${payload.wineTitle}" tauschen`,
          lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          wineId: payload.wineId,
          wineTitle: payload.wineTitle,
          unreadCount: 1,
          fromUserId: payload.fromUserId,
          fromUserName: payload.fromUserName,
          toUserId: payload.toUserId,
          toUserName: payload.toUserName
        };

        await fsCreateTradeHint(hintDataA);

        // Notification für A
        const notificationDataA = {
          type: 'hint-small',
          title: 'Tausch involviert',
          message: `Du bist in einen Tausch involviert: Du möchtest mit ${payload.toUserName} den Wein "${payload.wineTitle}" tauschen`,
          priority: 'high',
          requestId,
          fromUserId: payload.fromUserId,
          fromUserName: payload.fromUserName,
          toUserId: payload.toUserId,
          toUserName: payload.toUserName,
          wineId: payload.wineId,
          wineTitle: payload.wineTitle
        };

        await createNotification(currentUserId, notificationDataA);
      }
    } else if (isReceiver) {
      // B (Empfänger): hint-decision
      const existingHintBDecision = allHints.find(hint => 
        hint.userId === currentUserId && 
        hint.hintType === 'trade-decision'
      );

      if (!existingHintBDecision) {
        const hintDataBDecision = {
          entryType: 'hint',
          hintType: 'trade-decision',
          tradeRequestId: requestId,
          userId: currentUserId,
          lastMessage: `Entscheide dich: ${payload.fromUserName} möchte deinen Wein "${payload.wineTitle}" tauschen. Wähle einen Wein aus dem Regal von ${payload.fromUserName} oder lehne ab.`,
          lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          wineId: payload.wineId,
          wineTitle: payload.wineTitle,
          unreadCount: 1,
          status: 'received',
          fromUserId: payload.fromUserId,
          fromUserName: payload.fromUserName,
          toUserId: payload.toUserId,
          toUserName: payload.toUserName
        };

        await fsCreateTradeHint(hintDataBDecision);

        // Notification für B
        const notificationDataBDecision = {
          type: 'hint-decision',
          title: `Tauschanfrage von ${payload.fromUserName}`,
          message: `${payload.fromUserName} möchte deinen Wein "${payload.wineTitle}" tauschen. Entscheide dich!`,
          priority: 'high',
          requestId,
          fromUserId: payload.fromUserId,
          fromUserName: payload.fromUserName,
          toUserId: payload.toUserId,
          toUserName: payload.toUserName,
          wineId: payload.wineId,
          wineTitle: payload.wineTitle
        };

        await createNotification(currentUserId, notificationDataBDecision);
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Erstellen von Trade-Notifications:', error);
    logNotificationEvent({
      stage: 'trade/notification/error',
      type: 'hint-decision',
      data: { requestId },
      meta: { message: error?.message },
    });
  } finally {
    // Entferne Lock nach 2 Sekunden
    setTimeout(() => {
      processingRequests.delete(requestId);
    }, 2000);
  }
};

/**
 * Handle Trade-Request-Akzeptierung (KOMPLETTE SEQUENZ)
 * @param {string} tradeRequestId - Trade-Request-ID
 * @param {object} tradeRequestData - Trade-Request-Daten
 * @param {string} selectedWineId - Ausgewählter Wein-ID
 * @param {string} currentUserId - Aktueller User-ID (B - Empfänger)
 * @returns {Promise<object>} - { chatId, hintIds }
 */
export const handleTradeRequestAccepted = async (tradeRequestId, tradeRequestData, selectedWineId, currentUserId) => {
  try {
    console.log('🔄 Handle Trade-Request-Akzeptierung:', { tradeRequestId, selectedWineId, currentUserId });

    // REIHENFOLGE (KRITISCH!):
    // 1. Trade-Request Status auf 'accepted' setzen
    await fsUpdateTradeRequestStatus(tradeRequestId, {
      status: 'accepted',
      selectedWineId,
      acceptedAt: serverTimestamp()
    });

    // 2. GLEICHZEITIG erstellen: Hinweise und Chat
    const [hintForA, hintForB, chat] = await Promise.all([
      // Hinweis für A
      fsCreateTradeHint({
        entryType: 'hint',
        hintType: 'trade-involved',
        tradeRequestId,
        userId: tradeRequestData.fromUserId,
        status: 'accepted',
        participantNames: [tradeRequestData.fromUserName, tradeRequestData.toUserName],
        lastMessage: `Tauschanfrage angenommen: ${tradeRequestData.toUserName} hat deine Tauschanfrage für den Wein "${tradeRequestData.wineTitle}" angenommen`,
        lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        wineId: tradeRequestData.wineId,
        wineTitle: tradeRequestData.wineTitle,
        selectedWineId,
        unreadCount: 0,
        fromUserId: tradeRequestData.fromUserId,
        fromUserName: tradeRequestData.fromUserName,
        toUserId: tradeRequestData.toUserId,
        toUserName: tradeRequestData.toUserName
      }),

      // Hinweis für B
      fsCreateTradeHint({
        entryType: 'hint',
        hintType: 'trade-decision',
        tradeRequestId,
        userId: tradeRequestData.toUserId,
        status: 'accepted',
        participantNames: [tradeRequestData.fromUserName, tradeRequestData.toUserName],
        lastMessage: `Tauschanfrage angenommen: Du hast die Tauschanfrage von ${tradeRequestData.fromUserName} für den Wein "${tradeRequestData.wineTitle}" angenommen`,
        lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        wineId: tradeRequestData.wineId,
        wineTitle: tradeRequestData.wineTitle,
        selectedWineId,
        unreadCount: 0,
        fromUserId: tradeRequestData.fromUserId,
        fromUserName: tradeRequestData.fromUserName,
        toUserId: tradeRequestData.toUserId,
        toUserName: tradeRequestData.toUserName
      }),

      // Chat erstellen
      fsCreateChat({
        participants: [tradeRequestData.fromUserId, tradeRequestData.toUserId],
        participantNames: [tradeRequestData.fromUserName, tradeRequestData.toUserName],
        lastMessage: `Tauschvorschlag: ${selectedWineId}`,
        lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        unreadCount: 0,
        tradeRequestId,
        tradeStatus: 'accepted',
        entryType: 'chat'
      })
    ]);

    // 3. Notifications erstellen (benötigen chatId und hintId!)
    await Promise.all([
      // Notification für A (hint-small)
      createNotification(tradeRequestData.fromUserId, {
        type: 'hint-small',
        title: 'Tauschanfrage angenommen',
        message: `${tradeRequestData.toUserName} hat deine Tauschanfrage für den Wein "${tradeRequestData.wineTitle}" angenommen`,
        priority: 'high',
        requestId: tradeRequestId,
        hintId: hintForA,
        fromUserId: tradeRequestData.fromUserId,
        fromUserName: tradeRequestData.fromUserName,
        toUserId: tradeRequestData.toUserId,
        toUserName: tradeRequestData.toUserName,
        wineId: tradeRequestData.wineId,
        wineTitle: tradeRequestData.wineTitle
      }),

      // Notification für B (hint-small) - wird automatisch als gelesen markiert wenn ChatRoomScreen geöffnet wird
      createNotification(tradeRequestData.toUserId, {
        type: 'hint-small',
        title: 'Tauschanfrage angenommen',
        message: `Du hast die Tauschanfrage von ${tradeRequestData.fromUserName} für den Wein "${tradeRequestData.wineTitle}" angenommen`,
        priority: 'high',
        requestId: tradeRequestId,
        hintId: hintForB,
        fromUserId: tradeRequestData.fromUserId,
        fromUserName: tradeRequestData.fromUserName,
        toUserId: tradeRequestData.toUserId,
        toUserName: tradeRequestData.toUserName,
        wineId: tradeRequestData.wineId,
        wineTitle: tradeRequestData.wineTitle
      }),

      // ENTFERNT: "Neuer Chat erstellt" Notification wird nicht mehr erstellt
      // Stattdessen wird beim Senden der ersten Nachricht automatisch eine "Neue Nachricht von ..." Notification erstellt
    ]);

    // 4. Lösche alte Trade-Notifications
    await Promise.all([
      fsDeleteNotificationsForTradeRequest(tradeRequestData.fromUserId, tradeRequestId),
      fsDeleteNotificationsForTradeRequest(tradeRequestData.toUserId, tradeRequestId)
    ]);

    console.log('✅ Trade-Request akzeptiert - Alle Schritte abgeschlossen');
    return { chatId: chat, hintIds: { hintForA, hintForB } };
  } catch (error) {
    console.error('❌ Fehler bei Trade-Request-Akzeptierung:', error);
    throw error;
  }
};

/**
 * Handle Trade-Request-Ablehnung
 * @param {string} tradeRequestId - Trade-Request-ID
 * @param {object} tradeRequestData - Trade-Request-Daten
 * @param {string} rejectedBy - Wer hat abgelehnt ('fromUser' oder 'toUser')
 * @returns {Promise<void>}
 */
export const handleTradeRequestRejected = async (tradeRequestId, tradeRequestData, rejectedBy) => {
  try {
    console.log('🔄 Handle Trade-Request-Ablehnung:', { tradeRequestId, rejectedBy });

    // Setze Status auf rejected
    await fsUpdateTradeRequestStatus(tradeRequestId, {
      status: 'rejected',
      rejectedBy: rejectedBy === 'fromUser' ? tradeRequestData.fromUserId : tradeRequestData.toUserId,
      rejectedAt: serverTimestamp()
    });

    // Erstelle Notifications
    if (rejectedBy === 'fromUser') {
      // A hat abgelehnt → B bekommt hint-small
      await createNotification(tradeRequestData.toUserId, {
        type: 'hint-small',
        title: 'Tauschanfrage abgelehnt',
        message: `${tradeRequestData.fromUserName} hat die Tauschanfrage für den Wein "${tradeRequestData.wineTitle}" abgelehnt`,
        priority: 'high',
        requestId: tradeRequestId,
        fromUserId: tradeRequestData.fromUserId,
        fromUserName: tradeRequestData.fromUserName,
        toUserId: tradeRequestData.toUserId,
        toUserName: tradeRequestData.toUserName,
        wineId: tradeRequestData.wineId,
        wineTitle: tradeRequestData.wineTitle
      });
    } else {
      // B hat abgelehnt → A bekommt hint-small
      await createNotification(tradeRequestData.fromUserId, {
        type: 'hint-small',
        title: 'Tauschanfrage abgelehnt',
        message: `${tradeRequestData.toUserName} hat deine Tauschanfrage für den Wein "${tradeRequestData.wineTitle}" abgelehnt`,
        priority: 'high',
        requestId: tradeRequestId,
        fromUserId: tradeRequestData.fromUserId,
        fromUserName: tradeRequestData.fromUserName,
        toUserId: tradeRequestData.toUserId,
        toUserName: tradeRequestData.toUserName,
        wineId: tradeRequestData.wineId,
        wineTitle: tradeRequestData.wineTitle
      });
    }

    // Markiere alte hint-decision Notification als abgeschlossen
    // (wird in App.js durch createTradeDecisionHints behandelt)

    console.log('✅ Trade-Request abgelehnt - Notifications erstellt');
  } catch (error) {
    console.error('❌ Fehler bei Trade-Request-Ablehnung:', error);
    throw error;
  }
};

/**
 * Löscht alle Trade-Notifications für einen Trade-Request
 * @param {string} userId - User-ID
 * @param {string} tradeRequestId - Trade-Request-ID
 * @returns {Promise<number>} - Anzahl gelöschter Notifications
 */
export const deleteTradeNotifications = async (userId, tradeRequestId) => {
  return await fsDeleteNotificationsForTradeRequest(userId, tradeRequestId);
};

