import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BUTTON_WIDTH = SCREEN_WIDTH / 3; // 1/3 der Breite
const BUTTON_HEIGHT = Math.round(45 * 0.65); // 35% kleiner = 29px

/**
 * ProVersion-Button Komponente
 * Zeigt einen roten Button mit Glassmorphismus rechts unten an, der zum ProVersion-Info-Screen führt
 * Nur für Basic-User sichtbar (Pro-User sehen den Button nicht)
 * 
 * @param {Function} onNavigate - Navigation-Funktion
 * @param {boolean} isPro - Ob User Pro-Version hat
 * @param {boolean} isLoggedIn - Ob User eingeloggt ist
 * @param {number} offsetRight - Optional: Verschiebung nach links (für Screens mit FAB)
 * @param {boolean} positionLeft - Optional: Position links statt rechts (für Screens mit FAB rechts)
 */
export default function ProVersionButton({ onNavigate, isPro = false, isLoggedIn = false, offsetRight = 0, positionLeft = false }) {
  // Button nicht anzeigen wenn:
  // - User nicht eingeloggt ist
  // - User bereits Pro-Version hat
  if (!isLoggedIn || isPro) {
    return null;
  }

  const handlePress = () => {
    if (onNavigate) {
      onNavigate('provVersion');
    }
  };

  const containerStyle = {
    position: 'absolute',
    bottom: 90, // Über der BottomNavigation (75px Höhe + 15px Abstand)
    ...(positionLeft 
      ? { left: 20 } // Links positioniert (für Screens mit FAB rechts)
      : { right: 10 - offsetRight } // Rechts positioniert (Standard)
    ),
    zIndex: 1000, // Über anderen Elementen
  };

  return (
    <View style={containerStyle}>
      <TouchableOpacity 
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(220, 20, 60, 0.85)', 'rgba(178, 34, 34, 0.9)', 'rgba(220, 20, 60, 0.85)']} // Rötliche Farben mit Transparenz
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Werde Pro</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    // Glassmorphismus-Effekt
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8, // Für Android
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

