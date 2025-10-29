import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import Footer from './Footer';
import OptimizedImage from './components/OptimizedImage';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';

export default function WeinDetailScreen({ onNavigate, onLogout, wineData, isLoggedIn = false }) {
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

  const handleContact = () => {
    // Später: Kontakt-Funktionalität implementieren
    alert('Kontakt-Funktion wird später implementiert');
  };

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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)'
      }} />
      
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
        <View style={styles.contentContainer}>
          {/* Wein-Bild */}
          <View style={styles.imageContainer}>
            {wineData.labelImage ? (
              <OptimizedImage 
                source={{ uri: wineData.labelImage }} 
                style={styles.wineImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>🍷</Text>
              </View>
            )}
          </View>

          {/* Grundinformationen */}
          <View style={styles.section}>
            <Text style={styles.wineName}>{wineData.name}</Text>
            <Text style={styles.winery}>{wineData.winery}</Text>
            <Text style={styles.vintage}>{wineData.vintage}</Text>
          </View>

          {/* Detaillierte Informationen */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wein-Informationen</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Anbauregion:</Text>
              <Text style={styles.infoValue}>{wineData.region}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rebsorte:</Text>
              <Text style={styles.infoValue}>{wineData.grapeVariety}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sorte:</Text>
              <Text style={styles.infoValue}>{wineData.wineType}</Text>
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

          {/* Aktions-Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleContact}>
              <Text style={styles.actionButtonText}>📞 Kontaktieren</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.tradeButton]} onPress={handleTrade}>
              <Text style={styles.actionButtonText}>🔄 Tausch anbieten</Text>
            </TouchableOpacity>
          </View>

          {/* Zurück-Button */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('weinboerse')}>
              <Text style={styles.backButtonText}>← Zurück zur Weinbörse</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Footer onNavigate={onNavigate} />
      <BottomNavigation onNavigate={onNavigate} isLoggedIn={isLoggedIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenBackground: {
    flex: 1,
    backgroundColor: '#d5dfe0',
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
  backButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 10,
    margin: 15,
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wineImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  placeholderText: {
    fontSize: 80,
    color: '#FFFFFF',
    opacity: 0.5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingBottom: 5,
  },
  wineName: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  winery: {
    fontSize: 18,
    color: '#F5DEB3',
    textAlign: 'center',
    marginBottom: 5,
  },
  vintage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 16,
    color: '#F5DEB3',
    fontWeight: 'bold',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 2,
    textAlign: 'right',
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'justify',
  },
  ownerInfo: {
    fontSize: 16,
    color: '#F5DEB3',
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  tradeButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
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
    color: '#FFFFFF',
    fontSize: 18,
  },
});
