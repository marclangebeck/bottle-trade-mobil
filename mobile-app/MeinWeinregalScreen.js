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
import NotificationBadge from './components/NotificationBadge';
import BottomNavigation from './components/BottomNavigation';
import { getWinesByOwner, deleteWine, publishWine, unpublishWine } from './data/mockData';
import { getCurrentUser } from './services/testAuth';

export default function MeinWeinregalScreen({ onNavigate, onLogout, isAdmin = false, unreadNotifications = 0, isLoggedIn = false }) {
  const [wines, setWines] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Admin-Status wird von App.js übergeben
  console.log('🔍 MeinWeinregalScreen: Admin-Status:', isAdmin ? 'Admin' : 'Standard-User');

  useEffect(() => {
    setCurrentUserIdFromAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadWines();
    }
  }, [currentUserId]);

  const setCurrentUserIdFromAuth = () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.uid) {
        setCurrentUserId(currentUser.uid);
        console.log('✅ MeinWeinregalScreen: User-ID gesetzt:', currentUser.uid, 'für', currentUser.email);
      } else {
        console.error('❌ MeinWeinregalScreen: Kein User gefunden');
        setCurrentUserId('test-456'); // Fallback für Test
      }
    } catch (error) {
      console.error('❌ MeinWeinregalScreen: Fehler beim Laden der User-ID:', error);
      setCurrentUserId('test-456'); // Fallback für Test
    }
  };

  const loadWines = async () => {
    try {
      console.log('🔄 MeinWeinregalScreen: Loading wines for user:', currentUserId);
      const userWines = await getWinesByOwner(currentUserId);
      console.log('✅ MeinWeinregalScreen: Loaded', userWines.length, 'wines');
      setWines(userWines);
    } catch (error) {
      console.error('❌ MeinWeinregalScreen: Error loading wines:', error);
      setWines([]);
    } finally {
      setIsLoading(false);
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
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={isAdmin} 
          unreadNotifications={unreadNotifications}
          renderButton={false}
          externalMenuVisible={isMenuVisible}
          onMenuToggle={setIsMenuVisible}
        />
        
        <View style={styles.contentContainer}>
          {/* Header */}
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
              <Text style={styles.greeting}>Weinregal</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => onNavigate('notifications')}
              >
                <Text style={styles.notificationIcon}>🔔</Text>
                <NotificationBadge 
                  count={unreadNotifications}
                  onPress={() => onNavigate('notifications')}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {isLoading ? (
                <Text style={styles.dashboardSubtitle}>
                  Lade dein Weinregal...
                </Text>
              ) : (
                <Text style={styles.dashboardSubtitle}>
                  Aktuell hast du {wines.length} {wines.length === 1 ? 'Wein' : 'Weine'} in deinem Weinregal.
                </Text>
              )}

              {isLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingIcon}>⏳</Text>
                  <Text style={styles.loadingText}>Weine werden geladen...</Text>
                </View>
              ) : wines.length === 0 ? (
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
      
      {/* Fixed Bottom Navigation */}
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
    backgroundColor: '#F8F8F8',
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
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  dashboardButtonContainer: {
    position: 'relative',
  },
  dashboardButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dashboardButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
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
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

