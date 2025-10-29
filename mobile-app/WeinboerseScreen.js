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
import { getAvailableWines, deleteWine } from './data/mockData';
import { getCurrentUser } from './services/testAuth';

export default function WeinboerseScreen({ onNavigate, onLogout, isAdmin = false, unreadNotifications = 0, chats = [], isLoggedIn = false }) {
  const [wines, setWines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Admin-Status wird von App.js übergeben
  console.log('🔍 WeinboerseScreen: Admin-Status:', isAdmin ? 'Admin' : 'Standard-User');

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
    } finally {
      setIsLoading(false);
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
        { text: 'Tausch anfragen', onPress: () => {
          // Hier wird später die Tausch-Anfrage erstellt
          Alert.alert('Info', 'Tausch-Anfrage wird später implementiert.\n\nNach Bestätigung wird automatisch ein Chat erstellt.');
        }},
        { text: 'Direkt chatten', onPress: () => {
          // Erstelle direkten Chat
          createDirectChat(wine);
        }}
      ]
    );
  };

  const createDirectChat = (wine) => {
    // Hole aktuelle User-Info
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Fehler', 'Kein User angemeldet!');
      return;
    }

    // Erstelle Chat-ID basierend auf Wein-Besitzer
    // Fallback: Verwende Test-User-ID wenn keine ownerId vorhanden
    const wineOwnerId = wine.ownerId || 'test-456'; // Max Mustermann als Fallback
    const currentUserId = currentUser.uid;
    
    console.log('🔍 Chat-Erstellung:');
    console.log('  - Wein:', wine.name);
    console.log('  - Owner:', wine.owner);
    console.log('  - OwnerId:', wineOwnerId);
    console.log('  - Current User:', currentUserId);
    
    // Prüfe, ob Chat bereits existiert
    const existingChat = chats.find(chat => 
      chat.participants.includes(currentUserId) && 
      chat.participants.includes(wineOwnerId)
    );

    if (existingChat) {
      // Chat existiert bereits - öffne ihn
      onNavigate('chat-room', { chat: existingChat });
    } else {
      // Erstelle neuen Chat
      const newChat = {
        id: `chat-${Date.now()}`,
        participants: [currentUserId, wineOwnerId],
        participantNames: [
          `${currentUser.firstName} ${currentUser.lastName}`,
          wine.owner
        ],
        lastMessage: 'Chat gestartet',
        lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        unreadCount: 0,
        type: 'direct',
        tradeRequestId: null,
        wineId: wine.id,
        wineTitle: wine.name || wine.title
      };
      
      console.log('✅ Neuer Chat erstellt:', newChat);

      // Füge Chat zur Liste hinzu (über onNavigate an App.js weiterleiten)
      onNavigate('chat-room', { chat: newChat, addToChatList: true });
      
      Alert.alert(
        'Chat erstellt', 
        `Chat mit ${wine.owner} wurde erstellt!`,
        [{ text: 'OK' }]
      );
    }
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
              <Text style={styles.greeting}>Weinbörse</Text>
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
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {isLoading ? (
                <Text style={styles.dashboardTitle}>
                  Lade Weine...
                </Text>
              ) : (
                <Text style={styles.dashboardTitle}>
                  {wines.length} {wines.length === 1 ? 'Wein' : 'Weine'} verfügbar zum Tausch
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
  // Header Styles
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
    width: 80, // Mehr Platz für beide Buttons
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
