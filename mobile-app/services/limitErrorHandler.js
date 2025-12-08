// Helper-Funktion für die Behandlung von Limit-Fehlern mit Upgrade-Prompt
import { Alert } from 'react-native';

/**
 * Behandelt Limit-Fehler und zeigt Upgrade-Prompt
 * @param {Error} error - Der Fehler-Objekt
 * @param {Function} onNavigate - Navigation-Funktion zum ProVersion-Screen
 */
export const handleLimitError = (error, onNavigate) => {
  if (error.limitExceeded) {
    const message = error.message || 'Limit erreicht';
    const upgradeMessage = 'Möchten Sie auf die Pro-Version upgraden? Genießen Sie unbegrenzte Weine, Trades und mehr!';
    
    Alert.alert(
      'Limit erreicht',
      `${message}\n\n${upgradeMessage}`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Zur Pro-Version',
          onPress: () => {
            if (onNavigate) {
              onNavigate('provVersion');
            }
          },
          style: 'default',
        },
      ],
      { cancelable: true }
    );
    return true; // Fehler wurde behandelt
  }
  return false; // Fehler wurde nicht behandelt
};

