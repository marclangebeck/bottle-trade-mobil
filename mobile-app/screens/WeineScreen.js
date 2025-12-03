import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Platform, StatusBar } from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';

export default function WeineScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false }) {
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
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        width: '100%',
      }} />
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
        {/* Logo und Schriftzug mit Hamburger-Menü und Profil-Icon */}
        <View style={styles.logoHeaderContainer}>
          {/* Hamburger-Menü links */}
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
          
          {/* Bottle (Logo) Trade in der Mitte */}
          <View style={styles.logoHeaderCenter}>
            <Text style={styles.logoHeaderText}>Bottle</Text>
            <View style={styles.logoImageWrapper}>
              <OptimizedImage
                source={require('../assets/images/Logo_white.png')}
                style={styles.logoHeaderImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoHeaderText}>Trade</Text>
          </View>
          
          {/* Profil-Icon rechts */}
          <TouchableOpacity 
            style={styles.profileIconContainer}
            onPress={() => onNavigate('profil')}
          >
            <View style={styles.profileIconCircle}>
              <Text style={styles.profileIconText}>P</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Header mit Überschrift */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Weine</Text>
            </View>
          </View>
        </View>
      </View>
      
                {/* Tagline unter dem Logo-Header */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
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
      </View>
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
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40, // 10px für iOS, damit StatusBar nicht verdeckt wird
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
  },
  logoHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoHeaderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  logoImageWrapper: {
    width: 40,
    height: 40,
    marginLeft: 6, // Reduziert von 12 auf 6 (50%)
    marginRight: 6, // Reduziert von 12 auf 6 (50%)
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHeaderImage: {
    width: 40,
    height: 40,
  },
  profileIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileIconText: {
    fontSize: 25,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  taglineContainer: {
    paddingHorizontal: 20,
    paddingTop: 0, // Auf 0px gesetzt
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.85,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#2c2c2c',
    position: 'relative',
    marginTop: 0,
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 44,
    alignItems: 'center',
    marginBottom: 8,
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
  greetingContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  greeting: {
    fontSize: 45,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    fontStyle: 'italic',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 215, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    includeFontPadding: false,
  },
  content: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
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
    borderWidth: 1,
    borderColor: '#FFFFFF', // Weiße Border
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
