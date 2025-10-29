import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from './Footer';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import OptimizedImage from './components/OptimizedImage';

export default function WeinDetailScreen({ onNavigate, onLogout, wineData }) {
  if (!wineData) {
    return (
      <LinearGradient
        colors={['#4B0000', '#800000', '#A52A2A']}
        style={styles.fullScreenBackground}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('weinboerse')} style={styles.hamburgerButton}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🍷 Wein-Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Keine Weindaten verfügbar</Text>
        </View>
      </LinearGradient>
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
    <LinearGradient
      colors={['#4B0000', '#800000', '#A52A2A']}
      style={styles.fullScreenBackground}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('weinboerse')} style={styles.hamburgerButton}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🍷 Wein-Details</Text>
      </View>

      <DynamicHamburgerMenu
        isVisible={false}
        onClose={() => {}}
        onNavigate={onNavigate}
        isLoggedIn={true}
        onLogout={onLogout}
      />

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
        </View>
      </ScrollView>
      <Footer onNavigate={onNavigate} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fullScreenBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: Platform.OS === 'ios' ? 100 : 60,
    zIndex: 10,
  },
  hamburgerButton: {
    padding: 10,
    marginRight: 15,
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginVertical: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'normal',
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
