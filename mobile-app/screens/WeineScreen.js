import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Platform, StatusBar } from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';

export default function WeineScreen({ onNavigate, onLogout, isAdmin = false, unreadNotifications = 0, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock-Daten für Weine
  const weine = [
    {
      id: 1,
      name: 'Chardonnay 2020',
      weingut: 'Weingut Müller',
      jahrgang: 2020,
      preis: '25€',
      beschreibung: 'Frischer Weißwein mit Noten von Zitrus und Vanille',
      verfuegbar: true,
      user: 'Max Mustermann'
    },
    {
      id: 2,
      name: 'Pinot Noir 2019',
      weingut: 'Weingut Schmidt',
      jahrgang: 2019,
      preis: '35€',
      beschreibung: 'Eleganter Rotwein mit Beerenaromen',
      verfuegbar: true,
      user: 'Anna Schmidt'
    },
    {
      id: 3,
      name: 'Riesling 2021',
      weingut: 'Weingut Weber',
      jahrgang: 2021,
      preis: '20€',
      beschreibung: 'Trockener Riesling mit mineralischen Noten',
      verfuegbar: false,
      user: 'Peter Weber'
    },
    {
      id: 4,
      name: 'Cabernet Sauvignon 2018',
      weingut: 'Weingut Klein',
      jahrgang: 2018,
      preis: '45€',
      beschreibung: 'Kraftvoller Rotwein mit Eichennoten',
      verfuegbar: true,
      user: 'Maria Klein'
    },
  ];

  const filteredWeine = weine.filter(wein =>
    wein.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wein.weingut.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
      
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)'
      }} />
      
      <DynamicHamburgerMenu 
        onNavigate={onNavigate || (() => {})} 
        isLoggedIn={true} 
        onLogout={onLogout || (() => {})} 
        isAdmin={isAdmin} 
        unreadNotifications={unreadNotifications}
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
            <Text style={styles.greeting}>🍷 Weine</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Weine suchen..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredWeine.map((wein) => (
          <TouchableOpacity key={wein.id} style={styles.weinCard}>
            <View style={styles.weinHeader}>
              <Text style={styles.weinName}>{wein.name}</Text>
              <View style={styles.weinBadges}>
                <Text style={styles.jahrgang}>{wein.jahrgang}</Text>
                <View style={[
                  styles.availabilityBadge,
                  { backgroundColor: wein.verfuegbar ? '#4CAF50' : '#F44336' }
                ]}>
                  <Text style={styles.availabilityText}>
                    {wein.verfuegbar ? 'Verfügbar' : 'Verkauft'}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.weingut}>{wein.weingut}</Text>
            <Text style={styles.beschreibung}>{wein.beschreibung}</Text>
            
            <View style={styles.weinFooter}>
              <Text style={styles.preis}>{wein.preis}</Text>
              <Text style={styles.user}>von {wein.user}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Wein hinzufügen</Text>
      </TouchableOpacity>
      <BottomNavigation onNavigate={onNavigate} isLoggedIn={isLoggedIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d5dfe0',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 33.75,
    paddingBottom: 33.75,
    backgroundColor: '#2f3a3b',
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 135,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 40,
    alignItems: 'center',
  },
  hamburgerButton: {
    padding: 5,
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
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#d5dfe0',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  weinCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  weinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  weinName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    flex: 1,
  },
  weinBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jahrgang: {
    backgroundColor: '#D2691E',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 8,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  weingut: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  beschreibung: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    lineHeight: 20,
  },
  weinFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preis: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D2691E',
  },
  user: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#8B4513',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
