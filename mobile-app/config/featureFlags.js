/**
 * Zentrale Feature-Flags für die Mobile-App.
 * Werte können über Expo-Umgebungsvariablen (EXPO_PUBLIC_*) gesteuert werden.
 */

const ENABLE_NOTIFICATION_DEBUG =
  (typeof process !== 'undefined' &&
    process?.env?.EXPO_PUBLIC_NOTIFICATION_DEBUG === 'true') ||
  false;

export { ENABLE_NOTIFICATION_DEBUG };



