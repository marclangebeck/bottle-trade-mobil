import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';

export default function StartScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  // Mock-Daten
  const user = {
    name: 'Max Mustermann',
    is_winery: true,
  };

  const recentWeine = [
    { id: 1, name: 'Chardonnay 2020', weingut: 'Weingut Müller', preis: '25€' },
    { id: 2, name: 'Pinot Noir 2019', weingut: 'Weingut Schmidt', preis: '35€' },
    { id: 3, name: 'Riesling 2021', weingut: 'Weingut Weber', preis: '20€' },
  ];

  return (
    <View style={styles.container}>
      <DynamicHamburgerMenu 
        onNavigate={onNavigate || (() => {})} 
        isLoggedIn={true} 
        onLogout={onLogout || (() => {})} 
        isAdmin={isAdmin} 
        unreadCount={unreadCount}
        renderButton={false}
        externalMenuVisible={isMenuVisible}
        onMenuToggle={setIsMenuVisible}
      />
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.hamburgerContainer}>
            <TouchableOpacity 
              style={styles.hamburgerButton}
              onPress={() => setIsMenuVisible(!isMenuVisible)}
            >
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerGreeting}>Guten Tag, {user.name}! 👋</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Neueste Weine</Text>
        {recentWeine.map((wein) => (
          <TouchableOpacity key={wein.id} style={styles.weinCard}>
            <View style={styles.weinInfo}>
              <Text style={styles.weinName}>{wein.name}</Text>
              <Text style={styles.weingut}>{wein.weingut}</Text>
            </View>
            <Text style={styles.preis}>{wein.preis}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schnellzugriff</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>🍷 Wein hinzufügen</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadCount={unreadCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.4)', // Warmes Gold mit Glassmorphism
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 90,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    // Glassmorphism Effekt
    shadowColor: '#a9c7cd',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 44,
    alignItems: 'center',
  },
  hamburgerButton: {
    width: 44,
    height: 44,
    borderRadius: 22, // Vollständig rund
    backgroundColor: 'rgba(47, 58, 59, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    marginVertical: 3,
    borderRadius: 1.5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 80,
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Header
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: 'rgba(210, 105, 30, 0.9)',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  weinCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  weinInfo: {
    flex: 1,
  },
  weinName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  weingut: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  preis: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D2691E',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#8B4513',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
