/**
 * PHASE 4: Zentrale Notification-Verwaltung
 * 
 * Wrapper um database-web.js Funktionen mit zusätzlichen Features:
 * - archiveNotification
 * - markNotificationAsCompleted
 * - getUnreadCount
 * - Erweiterte Filter
 */

import {
  createNotification as fsCreateNotification,
  getNotificationsForUser as fsGetNotificationsForUser,
  subscribeNotificationsForUser as fsSubscribeNotificationsForUser,
  markNotificationAsRead as fsMarkNotificationAsRead,
  deleteNotification as fsDeleteNotification,
} from './database-web';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import { logNotificationEvent } from './notificationLogger';

/**
 * Erstellt eine neue Notification
 * @param {string} userId - User-ID
 * @param {object} notificationData - Notification-Daten
 * @returns {Promise<string|null>} - Notification-ID oder null wenn blockiert
 */
export const createNotification = async (userId, notificationData) => {
  return await fsCreateNotification(userId, notificationData);
};

/**
 * Lädt Notifications für einen User
 * @param {string} userId - User-ID
 * @param {object} filters - Filter-Optionen
 * @param {boolean} filters.includeRead - Gelesene Notifications einschließen (default: false)
 * @param {boolean} filters.includeArchived - Archivierte Notifications einschließen (default: false)
 * @param {string[]} filters.types - Nur bestimmte Typen (default: alle)
 * @returns {Promise<Array>} - Array von Notifications
 */
export const getNotificationsForUser = async (userId, filters = {}) => {
  const {
    includeRead = false,
    includeArchived = false,
    types = null,
  } = filters;

  const notifications = await fsGetNotificationsForUser(userId);

  // Zusätzliche Filter anwenden
  return notifications.filter(n => {
    // Filter: Gelesen
    if (!includeRead && n.isRead === true) {
      return false;
    }

    // Filter: Archiviert
    if (!includeArchived && n.isArchived === true) {
      return false;
    }

    // Filter: Typen
    if (types && Array.isArray(types) && !types.includes(n.type)) {
      return false;
    }

    return true;
  });
};

/**
 * Abonniert Notifications für einen User (Real-time)
 * @param {string} userId - User-ID
 * @param {function} callback - Callback-Funktion
 * @param {object} filters - Filter-Optionen (wie getNotificationsForUser)
 * @returns {function} - Unsubscribe-Funktion
 */
export const subscribeNotificationsForUser = (userId, callback, filters = {}) => {
  // PHASE 5: Passe filters direkt an database-web.js weiter
  // database-web.js filtert jetzt bereits basierend auf includeRead und includeArchived
  const {
    includeRead = false,
    includeArchived = false,
    types = null,
  } = filters;

  return fsSubscribeNotificationsForUser(userId, (snapshot, notifications) => {
    // Zusätzliche Filter: Typen (wird nicht in database-web.js gefiltert)
    const filtered = notifications.filter(n => {
      if (types && Array.isArray(types) && !types.includes(n.type)) return false;
      return true;
    });

    callback(snapshot, filtered);
  }, { includeRead, includeArchived });
};

/**
 * Markiert eine Notification als gelesen
 * @param {string} userId - User-ID
 * @param {string} notificationId - Notification-ID
 * @returns {Promise<boolean>}
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  return await fsMarkNotificationAsRead(userId, notificationId);
};

/**
 * Archiviert eine Notification (Swipe-to-Delete)
 * @param {string} userId - User-ID
 * @param {string} notificationId - Notification-ID
 * @returns {Promise<boolean>}
 */
export const archiveNotification = async (userId, notificationId) => {
  try {
    console.log('🔄 Archiviere Notification:', notificationId);
    logNotificationEvent({
      stage: 'notification/archive/start',
      type: 'notification',
      data: { userId, notificationId },
    });

    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
      isArchived: true,
      archivedAt: serverTimestamp(),
    });

    console.log('✅ Notification archiviert:', notificationId);
    logNotificationEvent({
      stage: 'notification/archive/success',
      type: 'notification',
      data: { userId, notificationId },
    });

    return true;
  } catch (error) {
    console.error('❌ Fehler beim Archivieren der Notification:', error);
    logNotificationEvent({
      stage: 'notification/archive/error',
      type: 'notification',
      data: { userId, notificationId },
      meta: { message: error?.message },
    });
    throw error;
  }
};

/**
 * Markiert eine Notification als abgeschlossen (grau ausgrauen)
 * @param {string} userId - User-ID
 * @param {string} notificationId - Notification-ID
 * @returns {Promise<boolean>}
 */
export const markNotificationAsCompleted = async (userId, notificationId) => {
  try {
    console.log('🔄 Markiere Notification als abgeschlossen:', notificationId);
    logNotificationEvent({
      stage: 'notification/complete/start',
      type: 'notification',
      data: { userId, notificationId },
    });

    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
      isCompleted: true,
      completedAt: serverTimestamp(),
    });

    console.log('✅ Notification als abgeschlossen markiert:', notificationId);
    logNotificationEvent({
      stage: 'notification/complete/success',
      type: 'notification',
      data: { userId, notificationId },
    });

    return true;
  } catch (error) {
    console.error('❌ Fehler beim Markieren der Notification als abgeschlossen:', error);
    logNotificationEvent({
      stage: 'notification/complete/error',
      type: 'notification',
      data: { userId, notificationId },
      meta: { message: error?.message },
    });
    throw error;
  }
};

/**
 * Löscht eine Notification (komplett aus Firestore)
 * @param {string} userId - User-ID
 * @param {string} notificationId - Notification-ID
 * @returns {Promise<boolean>}
 */
export const deleteNotification = async (userId, notificationId) => {
  return await fsDeleteNotification(userId, notificationId);
};

/**
 * Berechnet die Anzahl ungelesener Notifications
 * @param {string} userId - User-ID
 * @param {string|null} type - Optional: Nur bestimmten Typ zählen
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId, type = null) => {
  const filters = {
    includeRead: false,
    includeArchived: false,
  };

  if (type) {
    filters.types = [type];
  }

  const notifications = await getNotificationsForUser(userId, filters);
  return notifications.length;
};

