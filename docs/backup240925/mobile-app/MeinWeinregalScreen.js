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
import { getWinesByOwner, deleteWine, publishWine, unpublishWine } from './data/mockData';

export default function MeinWeinregalScreen({ onNavigate, onLogout }) {
  const [wines, setWines] = useState([]);

  // Test user ID - muss mit der echten Firestore-User-ID übereinstimmen
  const currentUserId = 'BHaJrc22Qn2njHeeHZNH'; // Saubere Test-User-ID aus Firestore

  useEffect(() => {
    loadWines();
  }, []);

  const loadWines = async () => {
    try {
      console.log('🔄 MeinWeinregalScreen: Loading wines for user:', currentUserId);
      const userWines = await getWinesByOwner(currentUserId);
      console.log('✅ MeinWeinregalScreen: Loaded', userWines.length, 'wines');
      setWines(userWines);
    } catch (error) {
      console.error('❌ MeinWeinregalScreen: Error loading wines:', error);
      setWines([]);
    }
  };

  // Hamburger-Menü-Funktionen entfernt - wird durch DynamicHamburgerMenu gehandhabt

  const handleDeleteWine = (wineId, wineName) => {
    Alert.alert(
      'Wein löschen',
      `Möchten Sie "${wineName}" wirklich aus allen Datenbanken entfernen?\n\nDies kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWine(wineId);
              console.log('✅ Wein erfolgreich gelöscht:', wineId);
              Alert.alert('Erfolg', `"${wineName}" wurde erfolgreich aus allen Datenbanken gelöscht.`);
              loadWines(); // Liste aktualisieren
            } catch (error) {
              console.error('❌ Fehler beim Löschen des Weins:', error);
              Alert.alert('Fehler', 'Wein konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.');
            }
          }
        }
      ]
    );
  };

  const handleEditWine = (wine) => {
    // Navigation zum Bearbeiten-Screen mit Wein-Daten
    onNavigate('weinregalEdit', { wineData: wine });
  };

  const handleTogglePublish = async (wine) => {
    try {
      if (wine.status === 'public') {
        // Wein zurückziehen
        await unpublishWine(wine.id);
        Alert.alert('Erfolg', `"${wine.name}" wurde aus der Weinbörse zurückgezogen.`);
      } else {
        // Wein veröffentlichen
        await publishWine(wine.id, currentUserId);
        Alert.alert('Erfolg', `"${wine.name}" wurde in der Weinbörse veröffentlicht!`);
      }
      loadWines(); // Weine neu laden
    } catch (error) {
      console.error('Error toggling wine publish status:', error);
      Alert.alert('Fehler', 'Status konnte nicht geändert werden.');
    }
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
              <Text style={styles.greeting}>🍷 Mein Weinregal</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Platz für zukünftige Elemente */}
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              <Text style={styles.dashboardSubtitle}>
                Aktuell hast du {wines.length} {wines.length === 1 ? 'Wein' : 'Weine'} in deinem Weinregal.
              </Text>

              {wines.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🍷</Text>
                  <Text style={styles.emptyTitle}>Noch keine Weine</Text>
                  <Text style={styles.emptySubtitle}>
                    Füge deinen ersten Wein hinzu, um zu tauschen!
                  </Text>
                  <TouchableOpacity 
                    style={styles.addWineButton}
                    onPress={() => onNavigate('weinregal')}
                  >
                    <Text style={styles.addWineButtonText}>+ Wein hinzufügen</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.winesList}>
                  {wines.map((wine) => (
                    <View key={wine.id} style={styles.wineCard}>
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
                        <Text style={styles.wineStatus}>
                          Status: {wine.status === 'public' ? '🔐 In Weinbörse veröffentlicht' : '🔒 Privat - nicht veröffentlicht'}
                        </Text>
                      </View>

                      <View style={styles.wineActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEditWine(wine)}
                        >
                          <Text style={styles.actionButtonText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[
                            styles.actionButton, 
                            wine.status === 'public' ? styles.publishedButton : styles.unpublishedButton
                          ]}
                          onPress={() => handleTogglePublish(wine)}
                        >
                          <Text style={styles.actionButtonText}>
                            {wine.status === 'public' ? '🔐' : '🔒'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteWine(wine.id, wine.name)}
                        >
                          <Text style={styles.actionButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        <Footer />
      </View>

      {/* Hamburger Menu Modal entfernt - wird durch DynamicHamburgerMenu ersetzt */}
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
    width: 50,
    alignItems: 'flex-start',
  },
  hamburgerButton: {
    padding: 10,
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: 'white',
    marginVertical: 1.5,
    borderRadius: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
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
    color: '#FFFFFF',
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
    marginBottom: 30,
    opacity: 0.8,
  },
  addWineButton: {
    backgroundColor: 'rgba(75, 0, 0, 0.8)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(245, 222, 179, 0.3)',
  },
  addWineButtonText: {
    color: '#F5DEB3',
    fontSize: 16,
    fontWeight: 'bold',
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
  wineStatus: {
    fontSize: 12,
    color: wine => wine.status === 'available' ? '#90EE90' : '#FFB6C1',
    fontWeight: '500',
  },
  wineActions: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  publishedButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.4)', // Grün für veröffentlicht
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 0, 0.6)',
  },
  unpublishedButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.4)', // Rot für nicht veröffentlicht
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 0, 0.6)',
  },
  actionButtonText: {
    fontSize: 16,
  },
  // Hamburger Menu Styles
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuBackdrop: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    backgroundColor: 'rgba(245, 245, 220, 0.95)',
    width: 220,
    height: 400,
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0000',
  },
  closeButton: {
    fontSize: 24,
    color: '#4B0000',
    fontWeight: 'bold',
  },
  menuItems: {
    // Style for menu items container
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuItemText: {
    fontSize: 16,
    color: '#4B0000',
    fontWeight: '500',
  },
  logoutMenuItem: {
    backgroundColor: 'rgba(75, 0, 0, 0.1)',
    marginTop: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: '#4B0000',
    fontWeight: 'bold',
  },
});

