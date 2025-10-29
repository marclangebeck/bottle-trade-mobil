import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';

export default function HomeScreen({ onLogout }) {
  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Abmelden', onPress: onLogout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍷 Bottle-Trade Mobile</Text>
      <Text style={styles.subtitle}>Willkommen in der Bottle-Trade-App!</Text>
      
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuText}>🍷 Weine</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuText}>💰 BTP</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuText}>👤 Profil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuText}>⚙️ Einstellungen</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Abmelden</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#F5DEB3',
    marginBottom: 40,
    textAlign: 'center',
  },
  menu: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },
  menuButton: {
    backgroundColor: '#D2691E',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 150,
  },
  logoutText: {
    color: '#F5DEB3',
    fontSize: 16,
  },
});
