import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import Footer from './Footer';
import OptimizedImage from './components/OptimizedImage';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';

export default function WeinDetailScreen({ onNavigate, onLogout, wineData, isLoggedIn = false, inTradeContext = false, backTarget = 'weinboerse', unreadNotifications = 0, unreadHints = 0 }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  if (!wineData) {
    return (
      <View style={styles.fullScreenBackground}>
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={false} 
          unreadNotifications={0}
          renderButton={false}
          externalMenuVisible={isMenuVisible}
          onMenuToggle={setIsMenuVisible}
        />
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
            <Text style={styles.greeting}>🍷 Details</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Keine Weindaten verfügbar</Text>
        </View>
      </View>
    );
  }

  const handleTrade = () => {
    // Später: Tausch-Funktionalität implementieren
    alert('Tausch-Funktion wird später implementiert');
  };

  return (
    <View style={styles.fullScreenBackground}>
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        width: '100%',
      }} />
      <View style={styles.container}>
        <DynamicHamburgerMenu 
        onNavigate={onNavigate} 
        isLoggedIn={true} 
        onLogout={onLogout} 
        isAdmin={false} 
        unreadNotifications={0}
        renderButton={false}
        externalMenuVisible={isMenuVisible}
        onMenuToggle={setIsMenuVisible}
      />
      
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
          <Text style={styles.greeting}>🍷 Details</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.formContainer}>
          {/* Etikett-Foto */}
          <View style={styles.imageContainer}>
            {wineData.labelImage ? (
              <OptimizedImage 
                source={{ uri: wineData.labelImage }} 
                style={styles.wineImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>📷</Text>
                <Text style={styles.imagePlaceholderLabel}>Kein Etikett-Foto</Text>
              </View>
            )}
          </View>

          {/* Grunddaten */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Grunddaten</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name des Weines:</Text>
              <Text style={styles.infoValue}>{wineData.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weingut:</Text>
              <Text style={styles.infoValue}>{wineData.winery}</Text>
            </View>
            
            {wineData.website && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Website des Weingutes:</Text>
                <Text style={styles.infoValue}>{wineData.website}</Text>
              </View>
            )}
          </View>

          {/* Wein-Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wein-Details</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jahrgang:</Text>
              <Text style={styles.infoValue}>{wineData.vintage}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Anbauregion:</Text>
              <Text style={styles.infoValue}>{wineData.region}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rebsorte:</Text>
              <Text style={styles.infoValue}>{wineData.grapeVariety}</Text>
            </View>
            
            {wineData.tasteProfile && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Geschmacksrichtung:</Text>
                <Text style={styles.infoValue}>{wineData.tasteProfile}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Preis:</Text>
              <Text style={styles.infoValue}>
                {wineData.price ? `${wineData.price}€` : 'Preis auf Anfrage'}
              </Text>
            </View>
          </View>

          {/* Beschreibung */}
          {wineData.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Beschreibung</Text>
              <Text style={styles.description}>{wineData.description}</Text>
            </View>
          )}

          {/* Besitzer-Informationen */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Besitzer</Text>
            <Text style={styles.ownerInfo}>
              {wineData.owner || 'Unbekannt'}
            </Text>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {wineData.status === 'public' ? '🌐 In Weinbörse verfügbar' : '🔒 Nicht verfügbar'}
              </Text>
            </View>
          </View>

          {/* Aktions-Buttons (nur in Börsen-Ansicht) */}
          {!inTradeContext && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleTrade}>
                <Text style={styles.actionButtonText}>🔄 Tausch anbieten</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Zurück-Button */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => onNavigate(backTarget)}>
              <Text style={styles.backButtonText}>{inTradeContext ? '← Zurück zum Tausch' : '← Zurück zur Weinbörse'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
        <Footer onNavigate={onNavigate} />
      </View>
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadNotifications={unreadNotifications}
        unreadHints={unreadHints}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenBackground: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Gleiche Farbe wie StatusBar-Ersatz-View, verhindert weißen Strich
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Header
    textAlign: 'center',
  },
  backButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: '#D2691E',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(47, 58, 59, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wineImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D2691E',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  imagePlaceholderLabel: {
    color: '#D2691E',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E',
    paddingBottom: 8,
    width: '100%',
  },
  wineName: {
    fontSize: 24,
    color: '#2f3a3b',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  winery: {
    fontSize: 18,
    color: '#D2691E',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '600',
  },
  vintage: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    opacity: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#2f3a3b',
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    flex: 2,
    textAlign: 'right',
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    textAlign: 'justify',
  },
  ownerInfo: {
    fontSize: 16,
    color: '#D2691E',
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  statusText: {
    fontSize: 16,
    color: '#2f3a3b',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#D2691E',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#2f3a3b',
    fontSize: 18,
  },
});
