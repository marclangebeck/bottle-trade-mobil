import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Image,
  Platform,
  Alert
} from 'react-native';
import { ImageBackground } from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from './Footer';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import { getAvailableWines, deleteWine } from './data/mockData';

export default function WeinboerseScreen({ onNavigate, onLogout }) {
  const [wines, setWines] = useState([]);
  
  // Admin-Erkennung - nur für echte Admin-User
  const isAdmin = false; // Test-User hat KEINE Admin-Rechte!

  useEffect(() => {
    loadWines();
  }, []);

  const loadWines = async () => {
    try {
      console.log('🔄 WeinboerseScreen: Loading wines...');
      const availableWines = await getAvailableWines();
      console.log('✅ WeinboerseScreen: Loaded', availableWines.length, 'wines');
      setWines(availableWines);
    } catch (error) {
      console.error('❌ WeinboerseScreen: Error loading wines:', error);
      setWines([]);
    }
  };

  // Hamburger-Menü-Funktionen entfernt - wird durch DynamicHamburgerMenu gehandhabt

  const handleWinePress = (wine) => {
    // Navigation zum Detail-Screen
    onNavigate('weinDetail', { wineData: wine });
  };

  const handleInfoPress = (wine) => {
    // Navigation zum Detail-Screen
    onNavigate('weinDetail', { wineData: wine });
  };

  const contactOwner = (wine) => {
    Alert.alert(
      'Kontakt',
      `Möchten Sie ${wine.owner} kontaktieren?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Kontaktieren', onPress: () => {
          // Hier würde die Kontakt-Funktionalität implementiert
          Alert.alert('Info', 'Kontakt-Funktion wird später implementiert.');
        }}
      ]
    );
  };

  const handleDeleteWine = (wine) => {
    Alert.alert(
      'Wein löschen',
      `Möchten Sie "${wine.name}" wirklich aus der Weinbörse löschen?\n\nDies kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWine(wine.id);
              console.log('✅ Wein erfolgreich gelöscht:', wine.id);
              Alert.alert('Erfolg', `"${wine.name}" wurde erfolgreich gelöscht.`);
              loadWines(); // Liste aktualisieren
            } catch (error) {
              console.error('❌ Fehler beim Löschen des Weins:', error);
              Alert.alert('Fehler', 'Wein konnte nicht gelöscht werden.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
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
      
      <View style={styles.container}>
        <DynamicHamburgerMenu onNavigate={onNavigate} isLoggedIn={true} onLogout={onLogout} />
        
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.hamburgerContainer}>
              {/* Hamburger-Button entfernt - wird durch DynamicHamburgerMenu ersetzt */}
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>🌐 Weinbörse</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Platz für zukünftige Elemente */}
            </View>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              <Text style={styles.dashboardTitle}>
                {wines.length} {wines.length === 1 ? 'Wein' : 'Weine'} verfügbar zum Tausch
              </Text>

              {wines.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🍷</Text>
                  <Text style={styles.emptyTitle}>Keine Weine verfügbar</Text>
                  <Text style={styles.emptySubtitle}>
                    Schauen Sie später wieder vorbei!
                  </Text>
                </View>
              ) : (
                <View style={styles.winesList}>
                  {wines.map((wine) => (
                    <TouchableOpacity 
                      key={wine.id} 
                      style={styles.wineCard}
                      onPress={() => handleWinePress(wine)}
                    >
                      <View style={styles.wineImageContainer}>
                        {wine.labelImage ? (
                          <OptimizedImage source={{ uri: wine.labelImage }} 
                            style={styles.wineImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderText}>🍷</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.wineInfo}>
                        <Text style={styles.wineName}>{wine.name}</Text>
                        <Text style={styles.wineWinery}>{wine.winery}</Text>
                        <Text style={styles.wineDetails}>
                          {wine.vintage} • {wine.region} • {wine.wineType}
                        </Text>
                        <Text style={styles.winePrice}>
                          {wine.price ? `${wine.price}€` : 'Preis auf Anfrage'}
                        </Text>
                        <Text style={styles.wineOwner}>
                          Von: {wine.owner}
                        </Text>
                      </View>

                      <View style={styles.wineActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleInfoPress(wine)}
                        >
                          <Text style={styles.actionButtonText}>📋</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => contactOwner(wine)}
                        >
                          <Text style={styles.actionButtonText}>💬</Text>
                        </TouchableOpacity>
                        {isAdmin && (
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDeleteWine(wine)}
                          >
                            <Text style={styles.actionButtonText}>🗑️</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        <Footer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4B0000',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#4B0000',
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 40, // Gleiche Breite wie hamburgerContainer für Zentrierung
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'normal',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#F5DEB3',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#F5DEB3',
    textAlign: 'center',
    opacity: 0.8,
  },
  winesList: {
    // Style for wines list container
  },
  wineCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wineImageContainer: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  wineImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    opacity: 0.5,
  },
  wineInfo: {
    flex: 1,
  },
  wineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  wineWinery: {
    fontSize: 14,
    color: '#F5DEB3',
    marginBottom: 4,
  },
  wineDetails: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },
  winePrice: {
    fontSize: 14,
    color: '#F5DEB3',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wineOwner: {
    fontSize: 12,
    color: '#90EE90',
    fontWeight: '500',
  },
  wineActions: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginVertical: 3,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
});
