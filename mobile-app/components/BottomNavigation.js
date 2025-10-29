import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function BottomNavigation({ onNavigate, isLoggedIn = false }) {
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
        <Text style={styles.tabLabel}>Mein Weinregal</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => handleNavigate('weinregal')}
      >
        <Text style={styles.tabIcon}>📝</Text>
        <Text style={styles.tabLabel}>Weinregal befüllen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#2c2c2c',
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    height: 75,
    paddingBottom: 10,
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
