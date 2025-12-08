// Subscription Limit Helper Functions
// Prüft Basic-Version Limits für verschiedene Features

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import { getUser } from './database-web';

/**
 * Prüft ob ein User Pro-Version hat
 * @param {string} userId - User-ID
 * @returns {Promise<boolean>} true wenn Pro, false wenn Basic
 */
export const isProUser = async (userId) => {
  try {
    const user = await getUser(userId);
    return user?.subscriptionType === 'pro';
  } catch (error) {
    console.error('❌ Error checking subscription type:', error);
    return false; // Bei Fehler: Basic annehmen
  }
};

/**
 * Prüft ob ein User das Limit für veröffentlichte Weine in der Weinbörse erreicht hat
 * Basic: max. 4 veröffentlichte Weine
 * Pro: unbegrenzt
 * @param {string} userId - User-ID
 * @returns {Promise<{allowed: boolean, current: number, limit: number, message?: string}>}
 */
export const checkPublishedWinesLimit = async (userId) => {
  try {
    const isPro = await isProUser(userId);
    const limit = isPro ? Infinity : 4;
    
    // Zähle veröffentlichte Weine des Users
    const winesQuery = query(
      collection(db, 'wines'),
      where('ownerId', '==', userId),
      where('status', '==', 'public')
    );
    const winesSnapshot = await getDocs(winesQuery);
    const current = winesSnapshot.size;
    
    const allowed = current < limit;
    
    if (!allowed) {
      return {
        allowed: false,
        current,
        limit,
        message: `Sie haben bereits ${current} Weine in der Weinbörse veröffentlicht. Basic-Version erlaubt maximal ${limit} Weine.`
      };
    }
    
    return { allowed: true, current, limit };
  } catch (error) {
    console.error('❌ Error checking published wines limit:', error);
    return { allowed: false, current: 0, limit: 4, message: 'Fehler beim Prüfen des Limits.' };
  }
};

/**
 * Prüft ob ein User das Limit für Weine im Weinregal erreicht hat
 * Basic: max. 7 Weine gesamt
 * Pro: unbegrenzt
 * @param {string} userId - User-ID
 * @returns {Promise<{allowed: boolean, current: number, limit: number, message?: string}>}
 */
export const checkWineRegalLimit = async (userId) => {
  try {
    const isPro = await isProUser(userId);
    const limit = isPro ? Infinity : 7;
    
    // Zähle alle Weine des Users (inkl. getauschter)
    const winesQuery = query(
      collection(db, 'wines'),
      where('ownerId', '==', userId)
    );
    const winesSnapshot = await getDocs(winesQuery);
    const current = winesSnapshot.size;
    
    const allowed = current < limit;
    
    if (!allowed) {
      return {
        allowed: false,
        current,
        limit,
        message: `Sie haben bereits ${current} Weine in Ihrem Weinregal. Basic-Version erlaubt maximal ${limit} Weine.`
      };
    }
    
    return { allowed: true, current, limit };
  } catch (error) {
    console.error('❌ Error checking wine regal limit:', error);
    return { allowed: false, current: 0, limit: 7, message: 'Fehler beim Prüfen des Limits.' };
  }
};

/**
 * Prüft ob ein User das Limit für Wünsche in der Wunschliste erreicht hat
 * Basic: max. 2 Wünsche
 * Pro: unbegrenzt
 * @param {string} userId - User-ID
 * @returns {Promise<{allowed: boolean, current: number, limit: number, message?: string}>}
 */
export const checkWishlistLimit = async (userId) => {
  try {
    const isPro = await isProUser(userId);
    const limit = isPro ? Infinity : 2;
    
    // Zähle Wünsche des Users
    const wishesQuery = query(collection(db, 'users', userId, 'wishlist'));
    const wishesSnapshot = await getDocs(wishesQuery);
    const current = wishesSnapshot.size;
    
    const allowed = current < limit;
    
    if (!allowed) {
      return {
        allowed: false,
        current,
        limit,
        message: `Sie haben bereits ${current} Wünsche in Ihrer Wunschliste. Basic-Version erlaubt maximal ${limit} Wünsche.`
      };
    }
    
    return { allowed: true, current, limit };
  } catch (error) {
    console.error('❌ Error checking wishlist limit:', error);
    return { allowed: false, current: 0, limit: 2, message: 'Fehler beim Prüfen des Limits.' };
  }
};

/**
 * Prüft ob ein User das Limit für vollzogene Trades pro Monat erreicht hat
 * Basic: max. 4 vollzogene Trades pro Kalendermonat
 * Pro: unbegrenzt
 * @param {string} userId - User-ID
 * @returns {Promise<{allowed: boolean, current: number, limit: number, message?: string}>}
 */
export const checkMonthlyTradesLimit = async (userId) => {
  try {
    const isPro = await isProUser(userId);
    const limit = isPro ? Infinity : 4;
    
    if (isPro) {
      return { allowed: true, current: 0, limit: Infinity };
    }
    
    // Aktuelles Datum
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayTimestamp = Math.floor(firstDayOfMonth.getTime() / 1000);
    
    // Zähle vollzogene Trades im aktuellen Monat
    // Status muss 'completed' sein und completedAt muss im aktuellen Monat liegen
    const tradesQuery = query(
      collection(db, 'tradeRequests'),
      where('status', '==', 'completed')
    );
    const tradesSnapshot = await getDocs(tradesQuery);
    
    let current = 0;
    tradesSnapshot.forEach((doc) => {
      const data = doc.data();
      // Prüfe ob Trade vom User ist (als Absender oder Empfänger)
      const isUserTrade = (data.fromUserId === userId || data.toUserId === userId);
      
      if (isUserTrade && data.completedAt) {
        // Prüfe ob completedAt im aktuellen Monat liegt
        const completedAt = data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt.seconds * 1000);
        if (completedAt >= firstDayOfMonth) {
          current++;
        }
      }
    });
    
    const allowed = current < limit;
    
    if (!allowed) {
      return {
        allowed: false,
        current,
        limit,
        message: `Sie haben bereits ${current} vollzogene Trades in diesem Monat. Basic-Version erlaubt maximal ${limit} Trades pro Monat.`
      };
    }
    
    return { allowed: true, current, limit };
  } catch (error) {
    console.error('❌ Error checking monthly trades limit:', error);
    return { allowed: false, current: 0, limit: 4, message: 'Fehler beim Prüfen des Limits.' };
  }
};

/**
 * Gibt eine Upgrade-Nachricht zurück
 * @returns {string}
 */
export const getUpgradeMessage = () => {
  return 'Möchten Sie auf die Pro-Version upgraden? Genießen Sie unbegrenzte Weine, Trades und mehr!';
};

