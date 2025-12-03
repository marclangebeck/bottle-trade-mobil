// Profilbild-Caching Service
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = 'profile_image_cache_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

/**
 * Speichert ein Profilbild im Cache
 * @param {string} userId - User ID
 * @param {string} imageUrl - URL des Profilbildes
 * @returns {Promise<void>}
 */
export const cacheProfileImage = async (userId, imageUrl) => {
  try {
    if (!userId || !imageUrl) {
      return;
    }
    
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    const cacheData = {
      imageUrl,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('✅ Profilbild im Cache gespeichert:', userId);
  } catch (error) {
    console.warn('⚠️ Fehler beim Caching des Profilbildes:', error);
    // Fehler beim Caching ist nicht kritisch, fahre fort
  }
};

/**
 * Lädt ein Profilbild aus dem Cache
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Gecachte URL oder null
 */
export const getCachedProfileImage = async (userId) => {
  try {
    if (!userId) {
      return null;
    }
    
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return null;
    }
    
    const { imageUrl, timestamp } = JSON.parse(cachedData);
    
    // Prüfe ob Cache abgelaufen ist
    const age = Date.now() - timestamp;
    if (age > CACHE_EXPIRY_MS) {
      // Cache abgelaufen, lösche ihn
      await AsyncStorage.removeItem(cacheKey);
      console.log('🗑️ Abgelaufener Profilbild-Cache gelöscht:', userId);
      return null;
    }
    
    console.log('✅ Profilbild aus Cache geladen:', userId);
    return imageUrl;
  } catch (error) {
    console.warn('⚠️ Fehler beim Laden des Profilbildes aus Cache:', error);
    return null;
  }
};

/**
 * Löscht ein Profilbild aus dem Cache
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const clearCachedProfileImage = async (userId) => {
  try {
    if (!userId) {
      return;
    }
    
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    await AsyncStorage.removeItem(cacheKey);
    console.log('✅ Profilbild-Cache gelöscht:', userId);
  } catch (error) {
    console.warn('⚠️ Fehler beim Löschen des Profilbild-Caches:', error);
  }
};

/**
 * Prüft ob ein Profilbild im Cache vorhanden und noch gültig ist
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const hasCachedProfileImage = async (userId) => {
  try {
    if (!userId) {
      return false;
    }
    
    const cachedUrl = await getCachedProfileImage(userId);
    return cachedUrl !== null;
  } catch (error) {
    return false;
  }
};











