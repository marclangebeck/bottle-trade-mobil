import React, { useState, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import NewsPopup from './NewsPopup';

export default function BottomNavigation({ onNavigate, isLoggedIn = false, unreadCount = 0 }) {
  const [newsPopupVisible, setNewsPopupVisible] = useState(false);
  const [anchorLayout, setAnchorLayout] = useState(null);
  const infoTabRef = useRef(null);

  const updateAnchorLayout = useCallback(() => {
    if (infoTabRef.current?.measureInWindow) {
      infoTabRef.current.measureInWindow((x, y, width, height) => {
        console.log('[BottomNavigation] InfoBox layout measured', { x, y, width, height });
        setAnchorLayout({ x, y, width, height });
      });
    }
  }, []);
  // Navigation-Handler: Wenn nicht eingeloggt, auf Login-Screen verweisen, sonst auf entsprechenden Screen
  const handleNavigate = (screen) => {
    // Spezielle Behandlung für Home-Button
    if (screen === 'home') {
      if (!isLoggedIn) {
        // Vor dem Login: Auf Welcome-Screen (App.js) verweisen
        if (onNavigate) {
          onNavigate('welcome');
        }
      } else {
        // Nach dem Login: Auf Dashboard verweisen
        if (onNavigate) {
          onNavigate('dashboard');
        }
      }
      return;
    }

    // Für alle anderen Buttons: Standard-Logik
    if (!isLoggedIn) {
      // Vor dem Login: Auf Login-Screen verweisen
      if (onNavigate) {
        onNavigate('login');
      }
    } else {
      // Nach dem Login: Auf entsprechenden Screen verweisen
      if (onNavigate) {
        onNavigate(screen);
      }
    }
  };

  return (
    <>
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => handleNavigate('home')}
      >
        <Text style={styles.tabIcon}>🏠</Text>
        <Text style={styles.tabLabel}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => handleNavigate('weinboerse')}
      >
        <Text style={styles.tabIcon}>🌐</Text>
        <Text style={styles.tabLabel}>Weinbörse</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => handleNavigate('mein-weinregal')}
      >
        <Text style={styles.tabIcon}>🍷</Text>
        <Text style={styles.tabLabel}>Weinregal</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        ref={infoTabRef}
        style={styles.tab} 
        onPress={() => {
          if (!isLoggedIn) {
            handleNavigate('login');
            return;
          }

          // PHASE 5: Direkter Aufruf des InfoBoxScreen statt Popup
          if (onNavigate) {
            onNavigate('infobox');
          }
        }}
        onLayout={updateAnchorLayout}
      >
        <View style={styles.tabIconContainer}>
          <Text style={styles.tabIcon}>📰</Text>
          {unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.tabLabel}>InfoBox</Text>
      </TouchableOpacity>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#2c2c2c',
    // ALTE EINSTELLUNG (für Rückgängigmachen): borderTopWidth: 1,
    // ALTE EINSTELLUNG (für Rückgängigmachen): borderTopColor: '#3a3a3a',
    borderTopWidth: 0, // Entfernt
    height: 75,
    paddingBottom: 20, // Weiter erhöht, um Buttons noch höher zu drücken
    paddingTop: 0, // Kein Padding oben, Buttons ganz oben
    justifyContent: 'space-around',
    // ALTE EINSTELLUNG (für Rückgängigmachen): alignItems: 'center',
    alignItems: 'flex-start', // Buttons oben ausrichten statt zentrieren
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    // ALTE EINSTELLUNG (für Rückgängigmachen): shadowColor: '#000',
    // ALTE EINSTELLUNG (für Rückgängigmachen): shadowOffset: { width: 0, height: -2 },
    // ALTE EINSTELLUNG (für Rückgängigmachen): shadowOpacity: 0.1,
    // ALTE EINSTELLUNG (für Rückgängigmachen): shadowRadius: 3,
    // ALTE EINSTELLUNG (für Rückgängigmachen): elevation: 5,
    // Schatten entfernt für nahtlosen Übergang
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4, // Reduziert von 8 auf 4 für mehr Platz nach oben
  },
  tabIconContainer: {
    position: 'relative',
    marginBottom: 2, // Reduziert von 4 auf 2
  },
  tabIcon: {
    fontSize: 32, // Weiter vergrößert von 28 auf 32
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2c2c2c',
    zIndex: 10,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabLabel: {
    fontSize: 14, // Vergrößert von 12 auf 14
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
