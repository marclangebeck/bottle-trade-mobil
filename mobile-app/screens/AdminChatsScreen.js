import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import OptimizedImage from '../components/OptimizedImage';
import { getCurrentUser } from '../services/testAuth';
import { collection, getDocs, deleteDoc, doc, writeBatch, updateDoc, query, where, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rejectTradeRequestsForChat, rejectAllPendingTradeRequests } from '../services/database-web';

export default function AdminChatsScreen({ onNavigate, onLogout, chats = [], onDeleteChat = null, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [allChats, setAllChats] = useState(chats);
  const [firestoreChats, setFirestoreChats] = useState([]);

  useEffect(() => {
    loadFirestoreChats();
    setIsLoading(false);
  }, []);

  const loadFirestoreChats = async () => {
    try {
      // Lade alle Chats und filtere manuell (Firestore where('deleted', '!=', true) funktioniert nicht für fehlende Felder)
      const chatsQuery = query(
        collection(db, 'chats'),
        orderBy('createdAt', 'desc')
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      const chatsData = chatsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(chat => {
          // Filtere gelöschte Chats (deleted: true oder deletedBy enthält alle Teilnehmer)
          if (chat.deleted === true) return false;
          // Prüfe deletedBy Array: Wenn alle Teilnehmer gelöscht haben, nicht anzeigen
          if (chat.deletedBy && Array.isArray(chat.deletedBy) && chat.participants) {
            const allDeleted = chat.participants.every(pid => chat.deletedBy.includes(pid));
            if (allDeleted) return false;
          }
          return true;
        });
      setFirestoreChats(chatsData);
      console.log(`✅ ${chatsData.length} Firestore Chats geladen`);
    } catch (error) {
      // Fallback: Lade alle Chats ohne Query (für Kompatibilität)
      try {
        const chatsSnapshot = await getDocs(collection(db, 'chats'));
        const chatsData = chatsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(chat => {
            if (chat.deleted === true) return false;
            if (chat.deletedBy && Array.isArray(chat.deletedBy) && chat.participants) {
              const allDeleted = chat.participants.every(pid => chat.deletedBy.includes(pid));
              if (allDeleted) return false;
            }
            return true;
          });
        setFirestoreChats(chatsData);
        console.log(`✅ ${chatsData.length} Firestore Chats geladen (Fallback)`);
      } catch (fallbackError) {
        console.error('❌ Error loading Firestore chats:', fallbackError);
        setFirestoreChats([]);
      }
    }
  };

  const handleDeleteChat = async (chatId, isFirestore = false) => {
    Alert.alert(
      'Chat löschen',
      'Möchten Sie diesen Chat wirklich löschen?\n\nAlle Nachrichten werden unwiderruflich gelöscht.\n\nHinweis: Der Chat wird für alle Teilnehmer entfernt.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            if (isFirestore) {
              // WICHTIG: Zuerst Trade-Requests auf 'rejected' setzen, bevor der Chat gelöscht wird
              // Dies verhindert, dass die Subscription-Logik neue Chats/Notifications erstellt
              try {
                // Lade Chat-Daten, um tradeRequestId zu finden
                const chatDoc = await getDoc(doc(db, 'chats', chatId));
                if (chatDoc.exists()) {
                  const chatData = chatDoc.data();
                  const tradeRequestId = chatData.tradeRequestId;
                  
                  // Setze zugehörige Trade-Requests auf 'rejected'
                  await rejectTradeRequestsForChat(chatId, tradeRequestId);
                  console.log('✅ Trade-Requests für Chat auf rejected gesetzt:', chatId);
                }
              } catch (tradeError) {
                console.error('⚠️ Fehler beim Rejecten der Trade-Requests (fortsetzen):', tradeError);
                // Fehler sollte den Löschprozess nicht blockieren
              }
              
              // Markiere Chat als gelöscht in Firestore (damit alle User es sehen)
              // Verwende "deleted: true" statt kompletter Löschung, damit Listener es erkennen können
              await updateDoc(doc(db, 'chats', chatId), {
                deleted: true,
                deletedAt: new Date(),
                deletedBy: 'admin'
              });
              
              // Lösche auch alle zugehörigen Nachrichten aus Firestore
              const messagesQuery = query(
                collection(db, 'messages'),
                where('chatId', '==', chatId)
              );
              const messagesSnapshot = await getDocs(messagesQuery);
              const batch = writeBatch(db);
              let deleteCount = 0;
              
              messagesSnapshot.docs.forEach(messageDoc => {
                batch.delete(messageDoc.ref);
                deleteCount++;
              });
              
              if (deleteCount > 0) {
                await batch.commit();
                console.log(`✅ ${deleteCount} Nachrichten gelöscht`);
              }
              
              // Lösche auch aus AsyncStorage (falls vorhanden)
              try {
                const savedChats = await AsyncStorage.getItem('bottle-trade-chats');
                if (savedChats) {
                  const chats = JSON.parse(savedChats);
                  const updatedChats = chats.filter(chat => chat.id !== chatId);
                  await AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(updatedChats));
                  
                  // Lösche auch Nachrichten aus AsyncStorage
                  const messagesData = await AsyncStorage.getItem('bottle-trade-messages');
                  if (messagesData) {
                    const messages = JSON.parse(messagesData);
                    const updatedMessages = { ...messages };
                    delete updatedMessages[chatId];
                    await AsyncStorage.setItem('bottle-trade-messages', JSON.stringify(updatedMessages));
                  }
                }
              } catch (err) {
                console.error('Fehler beim Löschen aus AsyncStorage:', err);
              }
              
              // Aktualisiere die Liste
              setFirestoreChats(prev => prev.filter(chat => chat.id !== chatId));
              
              // Lade die Liste neu, um sicherzustellen, dass alles synchronisiert ist
              await loadFirestoreChats();
              
              Alert.alert('Erfolg', 'Chat und alle Nachrichten wurden für alle Teilnehmer gelöscht!');
            } else {
              // Lösche aus AsyncStorage vollständig
              const updatedChats = allChats.filter(chat => chat.id !== chatId);
              await AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(updatedChats));
              
              // Lösche auch alle zugehörigen Nachrichten aus AsyncStorage
              try {
                const messagesData = await AsyncStorage.getItem('bottle-trade-messages');
                if (messagesData) {
                  const messages = JSON.parse(messagesData);
                  const updatedMessages = { ...messages };
                  delete updatedMessages[chatId];
                  await AsyncStorage.setItem('bottle-trade-messages', JSON.stringify(updatedMessages));
                }
              } catch (err) {
                console.error('Fehler beim Löschen der Nachrichten:', err);
              }
              
              setAllChats(updatedChats);
              Alert.alert('Erfolg', 'Chat wurde gelöscht!');
            }
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'Chat konnte nicht gelöscht werden.');
          }
        }}
      ]
    );
  };

  const handleDeleteAllChats = () => {
    Alert.alert(
      'Alle Chats löschen',
      'Möchten Sie wirklich ALLE Chats löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Alle löschen', style: 'destructive', onPress: async () => {
          try {
            // WICHTIG: Zuerst ALLE pending Trade-Requests auf 'rejected' setzen
            // Dies verhindert, dass die Subscription-Logik neue Chats/Notifications erstellt
            try {
              const rejectedCount = await rejectAllPendingTradeRequests();
              console.log(`✅ ${rejectedCount} Trade-Requests auf rejected gesetzt`);
            } catch (tradeError) {
              console.error('⚠️ Fehler beim Rejecten der Trade-Requests (fortsetzen):', tradeError);
              // Fehler sollte den Löschprozess nicht blockieren
            }
            
            // Markiere alle Chats als gelöscht in Firestore
            // Lade ALLE Chats direkt aus Firestore (ohne Filter, da where('deleted', '!=', true) nicht funktioniert)
            const chatsQuery = query(
              collection(db, 'chats'),
              orderBy('createdAt', 'desc')
            );
            let chatsSnapshot;
            try {
              chatsSnapshot = await getDocs(chatsQuery);
            } catch (error) {
              // Fallback: Lade alle Chats ohne Query
              console.warn('⚠️ Query fehlgeschlagen, lade alle Chats direkt:', error);
              chatsSnapshot = await getDocs(collection(db, 'chats'));
            }
            
            // Filtere manuell: Nur Chats die noch nicht gelöscht sind
            const chatsToDelete = chatsSnapshot.docs.filter(docSnapshot => {
              const chatData = docSnapshot.data();
              // Überspringe bereits gelöschte Chats
              if (chatData.deleted === true) return false;
              // Prüfe deletedBy Array: Wenn alle Teilnehmer gelöscht haben, überspringe
              if (chatData.deletedBy && Array.isArray(chatData.deletedBy) && chatData.participants) {
                const allDeleted = chatData.participants.every(pid => chatData.deletedBy.includes(pid));
                if (allDeleted) return false;
              }
              return true;
            });
            
            console.log(`🔄 Gefunden: ${chatsSnapshot.docs.length} Chats total, ${chatsToDelete.length} zum Löschen`);
            
            if (chatsToDelete.length === 0) {
              Alert.alert('Info', 'Keine Chats zum Löschen gefunden.');
              return;
            }
            
            const batch = writeBatch(db);
            chatsToDelete.forEach(docSnapshot => {
              batch.update(docSnapshot.ref, {
                deleted: true,
                deletedAt: new Date(),
                deletedBy: 'admin'
              });
            });
            await batch.commit();
            console.log(`✅ ${chatsToDelete.length} Chats als gelöscht markiert`);
            
            // Lösche auch alle Nachrichten
            const messagesSnapshot = await getDocs(collection(db, 'messages'));
            const messageBatch = writeBatch(db);
            messagesSnapshot.docs.forEach(docSnapshot => {
              messageBatch.delete(docSnapshot.ref);
            });
            await messageBatch.commit();
            
            // Lösche auch aus AsyncStorage
            await AsyncStorage.removeItem('bottle-trade-chats');
            await AsyncStorage.removeItem('bottle-trade-messages');
            
            // WICHTIG: Entferne auch alle Trade-Notifications aus AsyncStorage für alle User
            // Diese werden automatisch wieder geladen und gefiltert, aber besser komplett löschen
            try {
              const allNotifications = await AsyncStorage.getItem('bottle-trade-notifications');
              if (allNotifications) {
                const parsed = JSON.parse(allNotifications);
                // Filtere alle Trade-Notifications heraus (werden automatisch neu erstellt wenn nötig)
                const filtered = parsed.filter(n => n.type !== 'trade' && n.type !== 'trade-info');
                await AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(filtered));
                console.log(`✅ ${parsed.length - filtered.length} Trade-Notifications aus AsyncStorage entfernt`);
              }
            } catch (notifError) {
              console.error('⚠️ Fehler beim Entfernen der Trade-Notifications (fortsetzen):', notifError);
            }
            
            setAllChats([]);
            setFirestoreChats([]);
            
            // Lade die Liste neu, um sicherzustellen, dass alles synchronisiert ist
            await loadFirestoreChats();
            
            Alert.alert('Erfolg', 'Alle Chats und Trade-Requests wurden gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen aller Chats:', error);
            Alert.alert('Fehler', 'Chats konnten nicht gelöscht werden.');
          }
        }}
      ]
    );
  };

  const getOtherParticipantName = (chat) => {
    if (!chat.participantNames || chat.participantNames.length === 0) {
      return 'Unbekannt';
    }
    const currentUser = getCurrentUser();
    const otherName = chat.participantNames.find(n => n !== 'Du' && n !== currentUser?.username);
    return otherName || chat.participantNames[1] || 'Unbekannt';
  };

  const totalChats = allChats.length + firestoreChats.length;

  return (
    <View style={styles.container}>
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        width: '100%',
      }} />
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
      <View style={styles.container}>
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={true} 
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
          
          {/* Tagline unter dem Logo-Header */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Chat-Verwaltung</Text>
            </View>
          </View>
          
<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => onNavigate('admin-dashboard')}
              >
                <Text style={styles.backButtonText}>← Zurück zum Admin-Bereich</Text>
              </TouchableOpacity>
              
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Gesamt: {totalChats} Chats</Text>
                <Text style={styles.statsSubtitle}>
                  {allChats.length} lokal / {firestoreChats.length} in Firestore
                </Text>
              </View>

              {totalChats > 0 && (
                <TouchableOpacity 
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAllChats}
                >
                  <Text style={styles.deleteAllButtonText}>🗑️ Alle Chats löschen</Text>
                </TouchableOpacity>
              )}

              {isLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>Lade Chats...</Text>
                </View>
              ) : totalChats === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={styles.emptyTitle}>Keine Chats vorhanden</Text>
                </View>
              ) : (
                <View style={styles.chatsList}>
                  {/* AsyncStorage Chats */}
                  {allChats.map((chat) => (
                    <View key={`local-${chat.id}`} style={styles.chatCard}>
                      <View style={styles.chatHeader}>
                        <Text style={styles.chatIcon}>{chat.type === 'trade' ? '🍷' : '💬'}</Text>
                        <View style={styles.chatInfo}>
                          <Text style={styles.chatTitle}>
                            {chat.type === 'trade' 
                              ? `Tauschanfrage von ${getOtherParticipantName(chat)}` 
                              : `Nachricht von ${getOtherParticipantName(chat)}`}
                          </Text>
                          <Text style={styles.chatSource}>Lokal (AsyncStorage)</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteChat(chat.id, false)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.lastMessage}>{chat.lastMessage || 'Keine Nachricht'}</Text>
                    </View>
                  ))}
                  
                  {/* Firestore Chats */}
                  {firestoreChats.map((chat) => (
                    <View key={`firestore-${chat.id}`} style={styles.chatCard}>
                      <View style={styles.chatHeader}>
                        <Text style={styles.chatIcon}>{chat.type === 'trade' ? '🍷' : '💬'}</Text>
                        <View style={styles.chatInfo}>
                          <Text style={styles.chatTitle}>
                            {chat.type === 'trade' 
                              ? `Tauschanfrage von ${getOtherParticipantName(chat)}` 
                              : `Nachricht von ${getOtherParticipantName(chat)}`}
                          </Text>
                          <Text style={styles.chatSource}>Firestore</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteChat(chat.id, true)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.lastMessage}>{chat.lastMessage || 'Keine Nachricht'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        <Footer />
      </View>
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadCount={unreadCount}
      />
      
      {/* ProVersion Button */}
      <ProVersionButton 
        onNavigate={onNavigate}
        isPro={isPro}
        isLoggedIn={isLoggedIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileIconText: {
    fontSize: 18,
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
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  headerRight: {
    flex: 0,
    width: 80,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(47, 58, 59, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E',
    paddingBottom: 8,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  deleteAllButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#2f3a3b',
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
    color: '#2f3a3b',
  },
  chatsList: {
    marginBottom: 20,
  },
  chatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#D2691E',
    borderWidth: 1,
    borderColor: 'rgba(47, 58, 59, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  chatIcon: {
    fontSize: 24,
    marginRight: 6, // Reduziert von 12 auf 6 (50%)
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 2,
  },
  chatSource: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#333333',
    marginTop: 5,
  },
  backButton: {
    backgroundColor: '#D2691E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

