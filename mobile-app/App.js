
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, Image, ScrollView, Platform, StatusBar as RNStatusBar, Animated, Dimensions, AppState, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
// NavigationContainer und Tab Navigator werden nicht verwendet - App nutzt State-basiertes Routing
import OptimizedImage from './components/OptimizedImage';
// Asset import entfernt - nicht mehr benötigt
import { Asset } from 'expo-asset';

// Firebase-Konfiguration (nur Firestore)
import './config/firebase-web';

// Test-Auth Service (simuliert Authentication)
import { loginUser, registerUser, logoutUser, getCurrentUser, onAuthStateChange } from './services/testAuth';

import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import StartScreen from './screens/StartScreen';
// TestApp wird nicht verwendet
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import InfoScreen from './InfoScreen';
import ShopScreen from './ShopScreen';
import WeinregalBefuellenScreen from './WeinregalBefuellenScreen';
import MeinWeinregalScreen from './MeinWeinregalScreen';
import DashboardScreen from './DashboardScreen';
import WeinboerseScreen from './WeinboerseScreen';
import CommunityScreen from './CommunityScreen';
import WeineScreen from './screens/WeineScreen';
import BtpScreen from './screens/BtpScreen';
import ProfilScreen from './screens/ProfilScreen';
import WeinregalEditScreen from './WeinregalEditScreen';
import WeinDetailScreen from './WeinDetailScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminSurveysScreen from './screens/AdminSurveysScreen';
import AdminNewsletterScreen from './screens/AdminNewsletterScreen';
import AdminChatsScreen from './screens/AdminChatsScreen';
import AdminTradesScreen from './screens/AdminTradesScreen';
import AdminWinesScreen from './screens/AdminWinesScreen';
import AdminUsersScreen from './screens/AdminUsersScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SurveyAnswerScreen from './screens/SurveyAnswerScreen';
import SurveyResultsScreen from './screens/SurveyResultsScreen';
import NewsletterReaderScreen from './screens/NewsletterReaderScreen';
import AdminSystemMessagesScreen from './screens/AdminSystemMessagesScreen';
import SystemMessageReaderScreen from './screens/SystemMessageReaderScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import HinweisScreen from './screens/HinweisScreen';
import WunschlisteScreen from './screens/WunschlisteScreen';
import InfoBoxScreen from './screens/InfoBoxScreen';
import { createAdminTestChat, createTestAdminChat, createAdminTestMessages, TEST_USERS } from './services/testChatData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from './Footer';
import BottomNavigation from './components/BottomNavigation';
import NotificationBadge from './components/NotificationBadge';
import { createTradeRequest as fsCreateTradeRequest } from './services/database-web';
import { updateTradeRequestStatus as fsUpdateTradeRequestStatus } from './services/database-web';
import { deleteTradeRequest as fsDeleteTradeRequest } from './services/database-web';
import { findExistingOpenTradeRequest } from './services/database-web';
import { subscribeIncomingTradeRequests, subscribeOutgoingTradeRequests } from './services/database-web';
import { updateUserLastActive } from './services/database-web';
import { getTradeRequest } from './services/database-web';
import { markWinesAsInTradeRequest, unmarkWinesFromTradeRequest, unpublishWine, updateWine as fsUpdateWine, migrateAllLocalWineImagesToStorage } from './services/database-web';
import { 
  createChat as fsCreateChat,
  createTradeHint as fsCreateTradeHint,
  updateTradeHint as fsUpdateTradeHint,
  getChat as fsGetChat,
  getChatsForUser as fsGetChatsForUser,
  subscribeChatsForUser as fsSubscribeChatsForUser,
  updateChat as fsUpdateChat,
  deleteChat as fsDeleteChat,
  addChatMessage as fsAddChatMessage,
  getChatMessages as fsGetChatMessages,
  subscribeChatMessages as fsSubscribeChatMessages,
  markChatAsRead as fsMarkChatAsRead,
  createNotification as fsCreateNotification,
  getNotificationsForUser as fsGetNotificationsForUser,
  subscribeNotificationsForUser as fsSubscribeNotificationsForUser,
  markNotificationAsRead as fsMarkNotificationAsRead,
  deleteNotification as fsDeleteNotification,
  deleteNotificationsForHint as fsDeleteNotificationsForHint,
  deleteNotificationsForChat as fsDeleteNotificationsForChat,
  deleteNotificationsForTradeRequest as fsDeleteNotificationsForTradeRequest
} from './services/database-web';
import { unpublishWine as unpublishWineData } from './data/mockData';
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './config/firebase-web';
import { logNotificationEvent } from './services/notificationLogger';

// MainTabs Komponente entfernt - wird nicht verwendet
// App nutzt State-basiertes Routing über currentScreen statt Tab Navigator

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [imagesLoaded, setImagesLoaded] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [route, setRoute] = useState(null); // route state for passing data
  const [unreadCount, setUnreadCount] = useState(0);
  const [surveys, setSurveys] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [surveyAnswers, setSurveyAnswers] = useState([]); // Track welche User an welchen Surveys teilgenommen haben
  const [chats, setChats] = useState([]); // Chat-Kanäle
  const [messages, setMessages] = useState({}); // Chat-Nachrichten: { chatId: [messages] }
  const [isMenuVisible, setIsMenuVisible] = useState(false); // State für Hamburger-Menü im Welcome-Screen
  const [activeChatMessages, setActiveChatMessages] = useState({}); // Nachrichten für aktuell geöffneten Chat
  const messageSubscriptionsRef = useRef({}); // Track aktive Nachrichten-Subscriptions
  const pendingNotificationDeletionsRef = useRef(new Set()); // Track Notifications, die gerade gelöscht werden
  
  // Screen dimensions für volle Breite und Höhe
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Komponente für Moussierungs-Perlen (Champagner-Effekt)
  // Durchgehende Moussierung über alle Buttons
  const MousseEffect = ({ buttonColor, containerHeight }) => {
    const bubbles = useRef(
      Array(30).fill(null).map((_, index) => ({
        anim: new Animated.Value(0),
        delay: (index * 200) % 2000, // Gleichmäßig verteilte Delays für kontinuierlichen Effekt
        size: Math.random() * 4 + 3, // Größe zwischen 3-7 (größer für bessere Sichtbarkeit)
        left: Math.random() * 100, // Position links-rechts
        duration: 3000 + Math.random() * 2000, // Variable Dauer zwischen 3-5 Sekunden
      }))
    ).current;
    
    useEffect(() => {
      // Jede Perle hat ihre eigene kontinuierliche Loop-Animation
      const animationLoops = bubbles.map((bubble) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.delay(bubble.delay),
            Animated.timing(bubble.anim, {
              toValue: 1,
              duration: bubble.duration,
              useNativeDriver: true,
            }),
            Animated.delay(100), // Kurze Pause vor Reset
            Animated.timing(bubble.anim, {
              toValue: 0,
              duration: 0, // Sofortiger Reset für nächsten Zyklus
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 } // Unendlich viele Iterationen
        );
        return loop;
      });
      
      // Alle Animationen parallel starten
      animationLoops.forEach(loop => loop.start());
      
      return () => {
        animationLoops.forEach(loop => {
          loop.stop();
          loop.reset();
        });
      };
    }, []);
    
    // Berechne die Animationsdistanz basierend auf der Container-Höhe
    const animationRange = containerHeight ? containerHeight + 200 : 800; // Standard falls nicht gesetzt
    
    return (
      <View style={[styles.mousseContainer, { height: containerHeight || '100%' }]} pointerEvents="none">
        {bubbles.map((bubble, index) => {
          // Starte von ganz unten (containerHeight) und gehe bis ganz oben (-200)
          const bottomPosition = containerHeight ? containerHeight + 50 : 600;
          const translateY = bubble.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -animationRange], // Von 0 nach oben (negative Richtung)
          });
          
          const opacity = bubble.anim.interpolate({
            inputRange: [0, 0.1, 0.5, 0.9, 1],
            outputRange: [0, 0.8, 1, 0.8, 0],
          });
          
          const scale = bubble.anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.5, 1, 0.8],
          });
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.bubble,
                {
                  width: bubble.size,
                  height: bubble.size,
                  left: `${bubble.left}%`,
                  bottom: bottomPosition, // Starte von ganz unten
                  backgroundColor: buttonColor === '#8B4A5C' 
                    ? 'rgba(255, 255, 255, 0.8)' // Weiße Perlen für Rotwein - deutlich sichtbar
                    : buttonColor === '#F5E6D3'
                    ? 'rgba(47, 58, 59, 0.4)' // Dunklere Perlen für Weißwein - besser sichtbar auf hellem Hintergrund
                    : 'rgba(255, 255, 255, 0.7)', // Weiße/helle Perlen für Champagner
                  transform: [{ translateY }, { scale }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };
  

  // Logo vorab laden für schnelleres Laden auf allen Screens
  useEffect(() => {
    // Logo vorab laden
    const logoImage = require('./assets/images/Logo_white.png');
    Asset.fromModule(logoImage).downloadAsync().catch(err => {
      console.error('⚠️ Fehler beim Preload des Logos:', err);
    });
    
    // Sofort als geladen markieren für bessere Performance
    setImagesLoaded(true);
    // Offline-Queue nach App-Start verarbeiten
    processOfflineTradeQueue();
  }, []);

  // Automatische Migration lokaler Weinbilder beim App-Start (nur einmal pro User)
  useEffect(() => {
    // Nur ausführen, wenn User eingeloggt ist
    if (!isLoggedIn || !user) {
      return;
    }

    const runAutoMigration = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.uid) {
          console.log('ℹ️ Kein User gefunden, überspringe Migration');
          return; // Nicht eingeloggt, keine Migration nötig
        }

        // Prüfe ob Migration bereits für diesen User durchgeführt wurde
        const migrationKey = `image-migration-${currentUser.uid}`;
        const migrationDone = await AsyncStorage.getItem(migrationKey);
        
        if (migrationDone === 'true') {
          console.log('ℹ️ Bild-Migration bereits durchgeführt für User:', currentUser.uid);
          return;
        }

        console.log('🔄 Starte automatische Bild-Migration für User:', currentUser.uid);
        
        // Migration nur für die eigenen Weine durchführen (weniger belastend)
        const stats = await migrateAllLocalWineImagesToStorage(currentUser.uid);
        
        // Markiere Migration als durchgeführt (auch wenn einige fehlgeschlagen sind)
        await AsyncStorage.setItem(migrationKey, 'true');
        
        console.log(`✅ Automatische Migration abgeschlossen: ${stats.success} erfolgreich, ${stats.failed} fehlgeschlagen, ${stats.skipped} übersprungen`);
        
        // Zeige nur bei Erfolg eine Meldung
        if (stats.success > 0) {
          console.log(`✅ ${stats.success} Bilder erfolgreich migriert`);
        }
      } catch (error) {
        console.error('❌ Fehler bei automatischer Migration:', error);
        // Fehler nicht anzeigen, da Migration im Hintergrund läuft
        // Migration wird beim nächsten App-Start erneut versucht (da Flag nicht gesetzt wurde)
      }
    };

    // Führe Migration nach kurzer Verzögerung durch (damit App vollständig geladen ist)
    const timeoutId = setTimeout(() => {
      runAutoMigration();
    }, 3000); // 3 Sekunden Verzögerung für stabileren App-Start

    return () => clearTimeout(timeoutId);
  }, [isLoggedIn, user]); // Abhängig von Login-Status und User

  // Heartbeat: lastActive regelmäßig aktualisieren, solange App im Vordergrund
  useEffect(() => {
    let intervalId = null;
    const beat = async () => {
      const me = getCurrentUser();
      if (me?.uid) {
        try { await updateUserLastActive(me.uid); } catch {}
      }
    };
    const handleAppStateChange = (state) => {
      if (state === 'active') {
        beat();
        if (!intervalId) intervalId = setInterval(beat, 30000);
      } else {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    // initial
    handleAppStateChange(AppState.currentState || 'active');
    return () => {
      sub && sub.remove();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Trade-Request-Subscriptions für Echtzeit-Updates
  // Datum: Phase 3 - Schritt 8
  // ============================================
  useEffect(() => {
    const current = getCurrentUser();
    if (!current || !current.uid || !isLoggedIn) return;

    console.log('🔄 PHASE3: Setting up Trade-Request-Subscriptions for user:', current.uid);

    // Subscribe zu eingehenden Trade-Requests (für B - Empfänger)
    const unsubIncoming = subscribeIncomingTradeRequests(current.uid, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = { id: change.doc.id, ...change.doc.data() };
        
        // PHASE3: Nur für B (Empfänger) - prüfe dass current.uid === toUserId
        if (current.uid !== data.toUserId) {
          return; // Nicht der Empfänger - überspringe
        }
        
        // PHASE3: Nur 'pending' Anfragen behandeln
        if (change.type === 'added' && data.status === 'pending') {
          // PHASE3: Prüfe dass fromUserId !== toUserId
          if (data.fromUserId === data.toUserId) {
            console.error('❌ PHASE3: Trade-Request hat gleiche fromUserId und toUserId:', data.id);
            return;
          }
          
          // PHASE3: Rufe ensureTradeNotification auf - die Funktion prüft selbst auf Duplikate
          ensureTradeNotification({ requestId: data.id, payload: {
            fromUserId: data.fromUserId,
            fromUserName: data.fromUserName,
            toUserId: data.toUserId,
            toUserName: data.toUserName,
            wineId: data.wineId,
            wineTitle: data.wineTitle,
          }});
        }
      });
    });

    // Subscribe zu ausgehenden Trade-Requests (für A - Absender)
    const unsubOutgoing = subscribeOutgoingTradeRequests(current.uid, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = { id: change.doc.id, ...change.doc.data() };
        
        // PHASE3: Nur für A (Absender) - prüfe dass current.uid === fromUserId
        if (current.uid !== data.fromUserId) {
          return; // Nicht der Absender - überspringe
        }
        
        // PHASE3: Nur 'pending' Anfragen behandeln
        if (change.type === 'added' && data.status === 'pending') {
          // PHASE3: Prüfe dass fromUserId !== toUserId
          if (data.fromUserId === data.toUserId) {
            console.error('❌ PHASE3: Trade-Request hat gleiche fromUserId und toUserId:', data.id);
            return;
          }
          
          // PHASE3: Rufe ensureTradeNotification auf - die Funktion prüft selbst auf Duplikate
          ensureTradeNotification({ requestId: data.id, payload: {
            fromUserId: data.fromUserId,
            fromUserName: data.fromUserName,
            toUserId: data.toUserId,
            toUserName: data.toUserName,
            wineId: data.wineId,
            wineTitle: data.wineTitle,
          }});
        }
      });
    });

    return () => {
      try { unsubIncoming && unsubIncoming(); } catch {}
      try { unsubOutgoing && unsubOutgoing(); } catch {}
      console.log('🔌 PHASE3: Trade-Request-Subscriptions unsubscribed');
    };
  }, [isLoggedIn]);
  // ============================================
  // PHASE3 ENDE
  // ============================================


  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Loading-Funktionen als Fallback (Subscriptions machen bereits initiales Laden)
  // Datum: Phase 3 - Schritt 9
  // ============================================
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid;
    
    if (!currentUserId) return;
    
    // PHASE3: Lade Notifications (als Fallback wenn Subscriptions noch nicht geladen haben)
    const loadNotifications = async () => {
      try {
        // PHASE3: Prüfe zuerst Firestore
        try {
            const firestoreNotifications = await fsGetNotificationsForUser(currentUserId);
            if (firestoreNotifications.length > 0) {
              setNotifications(firestoreNotifications);
              // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
              console.log('✅ PHASE3: Notifications aus Firestore geladen:', firestoreNotifications.length);
              return;
          }
        } catch (firestoreError) {
          console.warn('⚠️ PHASE3: Firestore-Ladung fehlgeschlagen, verwende AsyncStorage-Fallback:', firestoreError);
        }
        
        // PHASE3: Fallback zu AsyncStorage
        const saved = await AsyncStorage.getItem('bottle-trade-notifications');
        if (saved) {
          let parsed = JSON.parse(saved);
          // WICHTIG: Filtere gelesene Notifications auch beim Laden aus AsyncStorage
          parsed = parsed.filter(n => n.isRead !== true);
          
          // WICHTIG: Prüfe welche Notifications in Firestore noch existieren und nicht gelöscht sind
          // Dies stellt sicher, dass gelöschte Notifications nicht wieder aus AsyncStorage geladen werden
          if (currentUserId && parsed.length > 0) {
            try {
              console.log(`🔍 PHASE3: Prüfe ${parsed.length} Notifications gegen Firestore...`);
              
              // Hole ALLE Notifications aus Firestore für diesen User
              const allFirestoreNotifications = await fsGetNotificationsForUser(currentUserId);
              const existingNotificationIds = new Set(allFirestoreNotifications.map(n => n.id));
              
              if (existingNotificationIds.size > 0) {
                console.log(`📋 PHASE3: Gefundene Notifications in Firestore: ${existingNotificationIds.size}`);
              }
              
              // Filtere Notifications die NICHT in Firestore existieren
              const beforeCount = parsed.length;
              parsed = parsed.filter(notif => {
                // Wenn Notification-ID nicht in Firestore existiert, entferne sie (komplett gelöscht)
                if (!existingNotificationIds.has(notif.id)) {
                  console.log(`🗑️ PHASE3: Entferne nicht-existierende Notification aus AsyncStorage: ${notif.id} (${notif.title || notif.type})`);
                  return false;
                }
                return true;
              });
              
              const removedCount = beforeCount - parsed.length;
              if (removedCount > 0) {
                // Speichere gefilterte Notifications zurück
                await AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(parsed));
                console.log(`✅ PHASE3: ${removedCount} nicht-existierende Notifications aus AsyncStorage entfernt`);
              }
            } catch (firestoreError) {
              console.warn('⚠️ PHASE3: Fehler beim Prüfen gelöschter Notifications in Firestore:', firestoreError);
              // Weiter mit Notifications aus AsyncStorage auch bei Fehler
            }
          }
          
          setNotifications(parsed);
          // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
          console.log(`✅ PHASE3: ${parsed.length} ungelesene Notifications aus AsyncStorage geladen`);
        }
      } catch (error) {
        console.error('❌ PHASE3: Error loading notifications:', error);
      }
    };
    
    // PHASE3: Lade Chats (als Fallback wenn Subscriptions noch nicht geladen haben)
    const loadChats = async () => {
      try {
        // PHASE3: Prüfe zuerst Firestore
        try {
          const firestoreChats = await fsGetChatsForUser(currentUserId);
          
          // WICHTIG: Firestore ist die Quelle der Wahrheit - überschreibe AsyncStorage
          const filteredChats = firestoreChats.filter(chat => {
            if (chat.deletedBy && Array.isArray(chat.deletedBy) && chat.deletedBy.includes(currentUserId)) {
              return false;
            }
            if (chat.entryType === 'hint' && chat.userId !== currentUserId) {
              return false;
            }
            if (chat.entryType === 'chat' && chat.participants && !chat.participants.includes(currentUserId)) {
              return false;
            }
            return true;
          });
          
          setChats(filteredChats);
          
          // WICHTIG: Synchronisiere IMMER mit AsyncStorage - überschreibt alte Einträge
          // Dies stellt sicher, dass gelöschte Chats auch aus AsyncStorage entfernt werden
          await AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(filteredChats));
          
          console.log(`✅ PHASE3: ${filteredChats.length} Chats aus Firestore geladen und mit AsyncStorage synchronisiert`);
          
          // WICHTIG: Prüfe welche Chats in AsyncStorage noch existieren, aber nicht mehr in Firestore
          // Entferne sie aus AsyncStorage (komplett gelöschte Chats)
          const savedChats = await AsyncStorage.getItem('bottle-trade-chats');
          if (savedChats) {
            const asyncChats = JSON.parse(savedChats);
            const firestoreChatIds = new Set(filteredChats.map(c => c.id));
            const chatsToRemove = asyncChats.filter(c => !firestoreChatIds.has(c.id));
            
            if (chatsToRemove.length > 0) {
              console.log(`🔧 PHASE3: Entferne ${chatsToRemove.length} Chats aus AsyncStorage, die nicht mehr in Firestore existieren`);
              // AsyncStorage wurde bereits oben mit Firestore-Daten überschrieben
            }
          }
          
          return;
        } catch (firestoreError) {
          console.warn('⚠️ PHASE3: Firestore-Ladung fehlgeschlagen, verwende AsyncStorage-Fallback:', firestoreError);
        }
        
        // PHASE3: Fallback zu AsyncStorage - nur wenn Firestore komplett fehlschlägt
        const savedChats = await AsyncStorage.getItem('bottle-trade-chats');
        if (savedChats) {
          const chats = JSON.parse(savedChats);
          const filteredChats = chats.filter(chat => {
            if (chat.deletedBy && Array.isArray(chat.deletedBy) && chat.deletedBy.includes(currentUserId)) {
              return false;
            }
            return true;
          });
          setChats(filteredChats);
          console.log(`⚠️ PHASE3: Fallback: ${filteredChats.length} Chats aus AsyncStorage geladen (Firestore nicht verfügbar)`);
        }
      } catch (error) {
        console.error('❌ PHASE3: Error loading chats:', error);
      }
    };
    
    // PHASE3: Lade initial (Subscriptions werden parallel geladen)
    loadNotifications();
    loadChats();
    
  }, [isLoggedIn]);
  // ============================================
  // PHASE3 ENDE
  // ============================================
  
  // WICHTIG: Bereinige nur GELESENE Notifications nach Login
  // Notifications werden nur gelöscht, wenn sie explizit als gelesen markiert wurden
  useEffect(() => {
    if (!isLoggedIn || notifications.length === 0) return;
    
    const cleanupAfterLogin = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) return;
      
      // Entferne nur gelesene Notifications (isRead === true)
      setNotifications(current => {
        const filtered = current.filter(n => {
          // Entferne nur, wenn explizit als gelesen markiert
          if (n.isRead === true) {
            return false; // Entferne gelesene Notifications
          }
          return true; // Behalte ungelesene Notifications
        });
        
        const removedCount = current.length - filtered.length;
        if (removedCount > 0) {
          console.log(`✅ ${removedCount} gelesene Notifications nach Login entfernt`);
          AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(filtered)).catch(() => {});
          // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
        }
        
        return filtered;
      });
    };
    
    // Führe Bereinigung nach kurzer Verzögerung aus
    const timeoutId = setTimeout(cleanupAfterLogin, 2000);
    return () => clearTimeout(timeoutId);
  }, [isLoggedIn, notifications.length]); // Reagiere auf Login und Notifications-Änderungen
  
  // ENTFERNT: Automatische Bereinigung von Notifications basierend auf Trade-Request-Status
  // Notifications werden jetzt nur noch gelöscht, wenn sie explizit als gelesen markiert wurden
  // (siehe cleanupAfterLogin oben)
  
  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Firestore-Subscriptions für Chats/Hinweise und Notifications
  // Datum: Phase 3 - Schritt 8
  // ============================================
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid;
    
    if (!currentUserId) return;
    
    console.log('🔄 PHASE3: Setting up Firestore subscriptions for user:', currentUserId);
    
    // PHASE3: Subscribe zu Chats/Hinweisen
    const unsubscribeChats = fsSubscribeChatsForUser(currentUserId, (snapshot, chatsArray) => {
      console.log('📡 PHASE3: Chat/Hint update received from Firestore:', chatsArray.length);
      
      // WICHTIG: Firestore ist die Quelle der Wahrheit - überschreibe AsyncStorage komplett
      // Wenn ein Chat in Firestore gelöscht wurde (physisch), wird er nicht mehr im Array sein
      
      // PHASE3: Filtere gelöschte Einträge (für diesen User)
      const filteredChats = chatsArray.filter(chat => {
        if (chat.deletedBy && Array.isArray(chat.deletedBy) && chat.deletedBy.includes(currentUserId)) {
          return false;
        }
        // PHASE3: Filtere nur Einträge, die für diesen User bestimmt sind
        if (chat.entryType === 'hint' && chat.userId !== currentUserId) {
          return false; // Hinweise sind user-spezifisch
        }
        // PHASE3: Für Chats: Nur wenn User in participants ist
        if (chat.entryType === 'chat' && chat.participants && !chat.participants.includes(currentUserId)) {
          return false;
        }
        return true;
      });
      
      setChats(filteredChats);
      
      // WICHTIG: Synchronisiere IMMER mit AsyncStorage - überschreibt alte Einträge
      // Dies stellt sicher, dass gelöschte Chats auch aus AsyncStorage entfernt werden
      AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(filteredChats)).catch(err => {
        console.error('❌ PHASE3: Error syncing chats to AsyncStorage:', err);
      });
      
      console.log(`✅ PHASE3: ${filteredChats.length} Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)`);
      
      // WICHTIG: Prüfe ob aktuell geöffnete Chats noch existieren
      const currentChatId = route?.params?.chat?.id;
      if (currentChatId) {
        const chatStillExists = filteredChats.some(c => c.id === currentChatId);
        if (!chatStillExists) {
          console.log(`🗑️ PHASE3: Aktuell geöffneter Chat ${currentChatId} existiert nicht mehr, navigiere zurück`);
          // Cleanup: Entferne Nachrichten-Subscription für diesen Chat
          if (messageSubscriptionsRef.current[currentChatId]) {
            try {
              messageSubscriptionsRef.current[currentChatId]();
              delete messageSubscriptionsRef.current[currentChatId];
            } catch (err) {
              console.error('❌ Fehler beim Entfernen der Nachrichten-Subscription:', err);
            }
          }
          // Entferne aus activeChatMessages
          setActiveChatMessages(prev => {
            const safePrev = prev || {};
            const updated = { ...safePrev };
            delete updated[currentChatId];
            return updated;
          });
          handleNavigate('chat-list');
        }
      }
    });
    
    // PHASE3: Lade initial auch direkt (für schnelleres Laden)
    fsGetChatsForUser(currentUserId).then(chats => {
      // WICHTIG: Firestore ist die Quelle der Wahrheit - überschreibe AsyncStorage
      const filteredChats = chats.filter(chat => {
        if (chat.deletedBy && Array.isArray(chat.deletedBy) && chat.deletedBy.includes(currentUserId)) {
          return false;
        }
        if (chat.entryType === 'hint' && chat.userId !== currentUserId) {
          return false;
        }
        if (chat.entryType === 'chat' && chat.participants && !chat.participants.includes(currentUserId)) {
          return false;
        }
        return true;
      });
      setChats(filteredChats);
      
      // WICHTIG: Synchronisiere IMMER mit AsyncStorage - überschreibt alte Einträge
      AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(filteredChats)).catch(err => {
        console.error('❌ PHASE3: Error syncing initial chats to AsyncStorage:', err);
      });
      
      console.log(`✅ PHASE3: Initial ${filteredChats.length} chats loaded and synced to AsyncStorage`);
    }).catch(err => {
      console.error('❌ PHASE3: Error loading initial chats from Firestore:', err);
      // PHASE3: Fallback zu AsyncStorage - aber nur wenn Firestore komplett fehlschlägt
      AsyncStorage.getItem('bottle-trade-chats').then(savedChats => {
        if (savedChats) {
          const chats = JSON.parse(savedChats);
          const filteredChats = chats.filter(chat => !chat.deletedBy || !chat.deletedBy.includes(currentUserId));
          setChats(filteredChats);
          console.log(`⚠️ PHASE3: Fallback: ${filteredChats.length} Chats aus AsyncStorage geladen (Firestore nicht verfügbar)`);
        }
      }).catch(() => {});
    });
    
    // PHASE3: Subscribe zu Notifications
    const unsubscribeNotifications = fsSubscribeNotificationsForUser(currentUserId, (snapshot, notificationsArray) => {
      logNotificationEvent({
        stage: 'subscription/notifications-update',
        type: 'notifications',
        data: {
          count: notificationsArray.length,
          userId: currentUserId,
        },
      });
      
      // WICHTIG: Filtere Notifications heraus, die gerade gelöscht werden (pending deletions)
      // Dies verhindert, dass die Subscription den lokalen State überschreibt, wenn wir gerade löschen
      const filteredNotifications = notificationsArray.filter(n => {
        if (!n || !n.id) return false;
        // Wenn diese Notification gerade gelöscht wird, ignoriere sie
        if (pendingNotificationDeletionsRef.current.has(n.id)) {
          logNotificationEvent({
            stage: 'subscription/notification-ignored',
            type: 'notifications',
            data: {
              reason: 'pending-deletion',
              notificationId: n.id,
            },
          });
          return false;
        }
        return true;
      });
      
      // WICHTIG: Notifications aus Firestore sind die Quelle der Wahrheit
      // ABER: Berücksichtige pending deletions, um Race Conditions zu vermeiden
      setNotifications(filteredNotifications);
      
      logNotificationEvent({
        stage: 'subscription/notifications-applied',
        type: 'notifications',
        data: {
          storedCount: filteredNotifications.length,
        },
      });
      
      // PHASE3: Synchronisiere IMMER mit AsyncStorage - überschreibt alte Einträge
      // Dies stellt sicher, dass gelöschte Notifications auch aus AsyncStorage entfernt werden
      AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(notificationsArray)).catch(err => {
        console.error('❌ PHASE3: Error syncing notifications to AsyncStorage:', err);
      });
      
      console.log(`✅ PHASE3: ${notificationsArray.length} Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)`);
    });
    
    // PHASE3: Lade initial auch direkt
    fsGetNotificationsForUser(currentUserId).then(notifs => {
      // WICHTIG: Firestore ist die Quelle der Wahrheit - überschreibe AsyncStorage
      setNotifications(notifs);
      
      logNotificationEvent({
        stage: 'subscription/notifications-initial-load',
        type: 'notifications',
        data: {
          count: notifs.length,
          userId: currentUserId,
        },
      });
      
      // PHASE3: Synchronisiere IMMER mit AsyncStorage - überschreibt alte Einträge
      AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(notifs)).catch(err => {
        console.error('❌ PHASE3: Error syncing initial notifications to AsyncStorage:', err);
      });
      
      // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
      console.log(`✅ PHASE3: Initial ${notifs.length} notifications loaded and synced to AsyncStorage`);
    }).catch(err => {
      console.error('❌ PHASE3: Error loading initial notifications from Firestore:', err);
      // PHASE3: Fallback zu AsyncStorage - aber nur wenn Firestore komplett fehlschlägt
      AsyncStorage.getItem('bottle-trade-notifications').then(savedNotifs => {
        if (savedNotifs) {
          let notifs = JSON.parse(savedNotifs);
          // WICHTIG: Filtere gelesene Notifications auch im Fallback
          notifs = notifs.filter(n => n.isRead !== true);
          setNotifications(notifs);
          console.log(`⚠️ PHASE3: Fallback: ${notifs.length} Notifications aus AsyncStorage geladen (Firestore nicht verfügbar)`);
          // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
        }
      }).catch(() => {});
    });

    return () => {
      console.log('🔌 PHASE3: Unsubscribing from Firestore');
      unsubscribeChats();
      unsubscribeNotifications();
    };
  }, [isLoggedIn]);
  // ============================================
  // PHASE3 ENDE
  // ============================================
  
  useEffect(() => {
    // Test-Funktionen für die Konsole verfügbar machen
    window.createTestChat = () => {
      const testChat = createAdminTestChat();
      if (testChat) {
        setChats(prev => {
          const existingChat = prev.find(chat => chat.id === testChat.id);
          if (!existingChat) {
            return [...prev, testChat];
          }
          return prev;
        });
        console.log('✅ Test-Chat erstellt und hinzugefügt');
      }
    };
    
    window.createTestChatReverse = () => {
      const testChat = createTestAdminChat();
      if (testChat) {
        setChats(prev => {
          const existingChat = prev.find(chat => chat.id === testChat.id);
          if (!existingChat) {
            return [...prev, testChat];
          }
          return prev;
        });
        console.log('✅ Test-Chat (umgekehrt) erstellt und hinzugefügt');
      }
    };
    
    window.createTestMessages = () => {
      const testMessages = createAdminTestMessages();
      console.log('✅ Test-Nachrichten erstellt:', testMessages);
      return testMessages;
    };
    
    window.clearAllChats = async () => {
      setChats([]);
      setMessages({});
      try {
        await AsyncStorage.removeItem('bottle-trade-chats');
        await AsyncStorage.removeItem('bottle-trade-messages');
        console.log('✅ Alle Chats gelöscht');
      } catch (error) {
        console.error('❌ Error clearing AsyncStorage:', error);
      }
    };
    
    window.showAllChats = () => {
      console.log('📋 Alle Chats:', chats);
      console.log('💬 Alle Nachrichten:', messages);
    };
    
    window.removeDuplicates = () => {
      // Entferne Duplikate aus allen Chats
      const cleanedMessages = {};
      Object.keys(messages).forEach(chatId => {
        const chatMessages = messages[chatId];
        const uniqueMessages = [];
        const seenIds = new Set();
        
        chatMessages.forEach(msg => {
          if (!seenIds.has(msg.id)) {
            seenIds.add(msg.id);
            uniqueMessages.push(msg);
          }
        });
        
        cleanedMessages[chatId] = uniqueMessages;
      });
      
      setMessages(cleanedMessages);
      console.log('✅ Duplikate entfernt');
    };
    
    // ADMIN: Lösche alle Daten außer Admin-Account
    window.cleanupDatabase = async () => {
      if (!isAdmin) {
        console.error('❌ Nur für Admins verfügbar!');
        return;
      }
      
      const ADMIN_UID = 'admin-123';
      const results = { users: 0, chats: 0, wines: 0, tradeRequests: 0, notifications: 0 };
      
      try {
        console.log('🗑️ Starte Datenbereinigung (behalte nur Admin)...');
        
        // 1. Lösche alle User außer Admin
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersBatch = writeBatch(db);
        usersSnapshot.forEach(userDoc => {
          const userData = userDoc.data();
          if (userData.uid !== ADMIN_UID) {
            usersBatch.delete(doc(db, 'users', userDoc.id));
            results.users++;
          }
        });
        if (results.users > 0) await usersBatch.commit();
        console.log(`✅ ${results.users} User gelöscht`);
        
        // 2. Lösche alle Chats
        const chatsQuery = query(collection(db, 'chats'));
        const chatsSnapshot = await getDocs(chatsQuery);
        const chatsBatch = writeBatch(db);
        chatsSnapshot.forEach(chatDoc => {
          chatsBatch.delete(doc(db, 'chats', chatDoc.id));
          results.chats++;
        });
        if (results.chats > 0) await chatsBatch.commit();
        console.log(`✅ ${results.chats} Chats gelöscht`);
        
        // 3. Lösche alle Weine
        const winesQuery = query(collection(db, 'wines'));
        const winesSnapshot = await getDocs(winesQuery);
        const winesBatch = writeBatch(db);
        winesSnapshot.forEach(wineDoc => {
          winesBatch.delete(doc(db, 'wines', wineDoc.id));
          results.wines++;
        });
        if (results.wines > 0) await winesBatch.commit();
        console.log(`✅ ${results.wines} Weine gelöscht`);
        
        // 4. Lösche alle Trade Requests
        const tradeRequestsQuery = query(collection(db, 'tradeRequests'));
        const tradeRequestsSnapshot = await getDocs(tradeRequestsQuery);
        const tradeRequestsBatch = writeBatch(db);
        tradeRequestsSnapshot.forEach(tradeDoc => {
          tradeRequestsBatch.delete(doc(db, 'tradeRequests', tradeDoc.id));
          results.tradeRequests++;
        });
        if (results.tradeRequests > 0) await tradeRequestsBatch.commit();
        console.log(`✅ ${results.tradeRequests} Trade Requests gelöscht`);
        
        // 5. Lösche alle Notifications (auch für Admin)
        const allUsersSnapshot = await getDocs(collection(db, 'users'));
        for (const userDoc of allUsersSnapshot.docs) {
          try {
            const notificationsQuery = query(collection(db, 'users', userDoc.id, 'notifications'));
            const notificationsSnapshot = await getDocs(notificationsQuery);
            const notifBatch = writeBatch(db);
            notificationsSnapshot.forEach(notifDoc => {
              notifBatch.delete(doc(db, 'users', userDoc.id, 'notifications', notifDoc.id));
              results.notifications++;
            });
            if (notificationsSnapshot.size > 0) await notifBatch.commit();
          } catch (error) {
            console.warn(`⚠️ Fehler bei Notifications für User ${userDoc.id}:`, error);
          }
        }
        console.log(`✅ ${results.notifications} Notifications gelöscht`);
        
        // Aktualisiere State
        setChats([]);
        setMessages({});
        setNotifications([]);
        setUnreadCount(0);
        
        console.log('\n✅ Bereinigung abgeschlossen!', results);
        return results;
      } catch (error) {
        console.error('❌ Fehler beim Bereinigen:', error);
        throw error;
      }
    };
    
    // Test-Funktionen sind weiterhin verfügbar über window-Objekt, aber ohne Konsolen-Ausgabe
    // Verfügbare Funktionen: createTestChat(), createTestChatReverse(), createTestMessages(), 
    // clearAllChats(), showAllChats(), removeDuplicates(), cleanupDatabase() [nur Admin]
  }, [isAdmin]);

  useEffect(() => {
    console.log('🔄 useEffect -> refreshNotificationBadges', {
      notificationCount: notifications?.length || 0,
      chatCount: chats?.length || 0,
      isLoggedIn,
    });
    refreshNotificationBadges();
  }, [notifications, chats, isLoggedIn, currentScreen, route, refreshNotificationBadges]);

useEffect(() => {
  if (!isLoggedIn) {
    return;
  }

  const currentUserId = getCurrentUser()?.uid;
  if (!currentUserId) {
    return;
  }

  const notificationsList = Array.isArray(notifications) ? notifications : [];
  if (notificationsList.length === 0) {
    return;
  }

  const chatsList = Array.isArray(chats) ? chats : [];

  const activeChatIds = new Set(
    chatsList
      .filter(chat => {
        if (!chat) return false;
        if (chat.entryType === 'hint') return false;
        if (chat.deleted === true) return false;
        if (Array.isArray(chat.deletedBy) && chat.deletedBy.includes(currentUserId)) return false;
        if (!Array.isArray(chat.participants) || !chat.participants.includes(currentUserId)) return false;
        return true;
      })
      .map(chat => chat.id)
      .filter(Boolean)
  );

  const existingHintRequestIds = new Set(
    chatsList
      .filter(chat => {
        if (!chat) return false;
        if (chat.entryType !== 'hint') return false;
        if (Array.isArray(chat.deletedBy) && chat.deletedBy.includes(currentUserId)) return false;
        return true;
      })
      .map(hint => hint.tradeRequestId || hint.id)
      .filter(Boolean)
  );

  const orphanedChatNotifications = notificationsList.filter(n => {
    if (!n || n.isRead) return false;
    if (!n.id) return false;
    if (!n.chatId) return false;
    if (pendingNotificationDeletionsRef.current.has(n.id)) return false;
    return !activeChatIds.has(n.chatId);
  });

  const orphanedHintNotifications = notificationsList.filter(n => {
    if (!n || n.isRead) return false;
    if (!n.id) return false;
    if (pendingNotificationDeletionsRef.current.has(n.id)) return false;
    if (!(n.type === 'hint-decision' || n.type === 'hint-small')) return false;
    if (n.chatId) return false;
    if (!n.requestId) return true;
    return !existingHintRequestIds.has(n.requestId);
  });

  if (orphanedChatNotifications.length === 0 && orphanedHintNotifications.length === 0) {
    return;
  }

  const idsToDelete = new Set(
    [...orphanedChatNotifications, ...orphanedHintNotifications]
      .map(n => n.id)
      .filter(Boolean)
  );

  if (idsToDelete.size === 0) {
    return;
  }

  idsToDelete.forEach(id => pendingNotificationDeletionsRef.current.add(id));

  const updatedNotifications = notificationsList.filter(n => !idsToDelete.has(n?.id));

  setNotifications(updatedNotifications);

  AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(updatedNotifications)).catch(err => {
    console.error('❌ Error saving notifications after auto-cleanup:', err);
  });

  logNotificationEvent({
    stage: 'auto-cleanup/orphaned-notifications',
    type: 'notifications',
    data: {
      removedCount: idsToDelete.size,
      orphanedChatNotifications: orphanedChatNotifications.map(n => n.id),
      orphanedHintNotifications: orphanedHintNotifications.map(n => n.id),
    },
  });

  const idsArray = Array.from(idsToDelete);

  Promise.allSettled(
    idsArray.map(id =>
      fsDeleteNotification(currentUserId, id).catch(err => {
        console.warn(`⚠️ Fehler beim automatischen Löschen der Notification ${id}:`, err);
      })
    )
  ).finally(() => {
    setTimeout(() => {
      idsArray.forEach(id => pendingNotificationDeletionsRef.current.delete(id));
    }, 2000);
  });
}, [notifications, chats, isLoggedIn]);

  // Firebase Auth State Listener - temporär deaktiviert
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChange((user) => {
  //     console.log('🔄 Auth state changed:', user ? 'User logged in' : 'User logged out');
  //     if (user) {
  //       setUser(user);
  //       setIsLoggedIn(true);
  //       setCurrentScreen('home');
  //       console.log('✅ User logged in:', user.email);
  //     } else {
  //       setUser(null);
  //       setIsLoggedIn(false);
  //       setCurrentScreen('welcome');
  //       console.log('✅ User logged out');
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);

  const handleLogin = async () => {
    // Temporärer Login für Test
    setIsLoggedIn(true);
    setCurrentScreen('home');
    
    // Admin-Status und User-Info prüfen
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        // User-Name setzen (Benutzername statt Vor- und Nachname)
        const displayName = currentUser.username || `${currentUser.firstName} ${currentUser.lastName}`;
        setUserName(displayName);
        setUserEmail(currentUser.email || '');
        setUser(currentUser);
        
        // Admin-Status prüfen
        if (currentUser.isAdmin === true) {
          setIsAdmin(true);
          console.log('✅ Admin-Rechte erkannt für:', currentUser.email, '(', displayName, ')');
        } else {
          setIsAdmin(false);
          console.log('ℹ️ Standard-User erkannt:', currentUser.email, '(', displayName, ')');
        }
      } else {
        setIsAdmin(false);
        setUserName('');
        setUserEmail('');
        console.log('ℹ️ Kein User gefunden');
      }
    } catch (error) {
      console.error('❌ Fehler bei User-Erkennung:', error);
      setIsAdmin(false);
      setUserName('');
      setUserEmail('');
    }
    
    console.log('✅ Test login successful - using existing test user');
  };

  const handleLogout = async () => {
    try {
      // Echte Logout-Funktion verwenden
      await logoutUser();
    setIsLoggedIn(false);
      setIsAdmin(false);
      setUserName('');
      setUserEmail('');
      setUser(null);
    setCurrentScreen('welcome');
      console.log('✅ User logged out - Admin-Status und User-Info zurückgesetzt');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback: trotzdem ausloggen
    setIsLoggedIn(false);
      setIsAdmin(false);
      setUserName('');
      setUserEmail('');
      setUser(null);
    setCurrentScreen('welcome');
    }
  };

  const handleShowLogin = () => {
    setCurrentScreen('login');
  };

  const handleShowRegister = () => {
    setCurrentScreen('register');
  };

  const handleNavigate = (screen, params = null) => {
    console.log(`🔄 App.js: handleNavigate aufgerufen - screen: "${screen}", params:`, params);
    console.log(`🔄 App.js: Aktueller Screen: "${currentScreen}", wird geändert zu: "${screen}"`);
    
    // WICHTIG: Cleanup von Nachrichten-Subscriptions wenn ChatRoomScreen geschlossen wird
    if (currentScreen === 'chat-room' && screen !== 'chat-room') {
      const oldChatId = route?.params?.chat?.id;
      if (oldChatId && messageSubscriptionsRef.current[oldChatId]) {
        console.log(`🔌 PHASE3: Entferne Nachrichten-Subscription für Chat ${oldChatId}`);
        try {
          messageSubscriptionsRef.current[oldChatId]();
          delete messageSubscriptionsRef.current[oldChatId];
        } catch (err) {
          console.error('❌ Fehler beim Entfernen der Nachrichten-Subscription:', err);
        }
      }
    }
    
    // Spezielle Behandlung für 'notifications' -> sollte zu 'chat-list' navigieren
    if (screen === 'notifications') {
      console.log('🔄 App.js: "notifications" erkannt, navigiere zu "chat-list"');
      setCurrentScreen('chat-list');
      setRoute({ params });
      return;
    }
    
    console.log('🔄 App.js: setCurrentScreen aufgerufen:', screen);
    console.log('🔄 App.js: setRoute aufgerufen mit params:', params);
    if (params?.chat) {
      console.log('🔄 App.js: Chat in params:', { id: params.chat.id, type: params.chat.type, entryType: params.chat.entryType });
    }
    
    setCurrentScreen(screen);
    setRoute({ params });
    
    console.log('✅ App.js: State aktualisiert - currentScreen wird:', screen);
    
    // Wenn ein neuer Chat zur Liste hinzugefügt werden soll
    if (screen === 'chat-room' && params?.addToChatList && params?.chat) {
      setChats(prevChats => {
        // Prüfe, ob Chat bereits existiert
        const existingChat = prevChats.find(chat => chat.id === params.chat.id);
        if (!existingChat) {
          const newChats = [...prevChats, params.chat];
          // Speichere in AsyncStorage
          AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(newChats)).catch(error => {
            console.error('❌ Error saving chats to AsyncStorage:', error);
          });
          return newChats;
        }
        return prevChats;
      });
    }
    
    // WICHTIG: Wenn ChatRoomScreen geöffnet wird, lade Nachrichten sofort und prüfe Existenz
    if (screen === 'chat-room' && params?.chat?.id) {
      const chatId = params.chat.id;
      
      // Prüfe ob Chat noch existiert
      getDoc(doc(db, 'chats', chatId)).then(chatDoc => {
        if (!chatDoc.exists()) {
          console.log(`🗑️ PHASE3: Chat ${chatId} existiert nicht mehr in Firestore`);
          // Chat existiert nicht - entferne aus Liste und navigiere zurück
          setChats(prev => prev.filter(c => c.id !== chatId));
          AsyncStorage.getItem('bottle-trade-chats').then(savedChats => {
            if (savedChats) {
              const chatsArray = JSON.parse(savedChats);
              const filtered = chatsArray.filter(c => c.id !== chatId);
              AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(filtered));
            }
          }).catch(() => {});
          // Navigiere zurück zur Chat-Liste
          setCurrentScreen('chat-list');
          setRoute({ params: null });
          return;
        }
        
        // Chat existiert - lade Nachrichten sofort
        fsGetChatMessages(chatId).then(firestoreMessages => {
          if (firestoreMessages && firestoreMessages.length > 0) {
            console.log(`✅ PHASE3: ${firestoreMessages.length} Nachrichten sofort geladen für Chat ${chatId}`);
            
            // Aktualisiere beide States
            setMessages(prev => {
              const safePrev = prev || {};
              return {
                ...safePrev,
                [chatId]: firestoreMessages
              };
            });
            
            setActiveChatMessages(prev => {
              const safePrev = prev || {};
              return {
                ...safePrev,
                [chatId]: firestoreMessages
              };
            });
            
            // Speichere in AsyncStorage
            setMessages(prev => {
              const safePrev = prev || {};
              const updated = {
                ...safePrev,
                [chatId]: firestoreMessages
              };
              AsyncStorage.setItem('bottle-trade-messages', JSON.stringify(updated)).catch(err => {
                console.error('❌ Fehler beim Speichern der Nachrichten:', err);
              });
              return updated;
            });
          } else {
            console.log(`ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat ${chatId}`);
            setActiveChatMessages(prev => {
              const safePrev = prev || {};
              return {
                ...safePrev,
                [chatId]: []
              };
            });
          }
          
          // Richte Subscription ein, wenn noch nicht aktiv
          if (!messageSubscriptionsRef.current[chatId]) {
            console.log(`📡 PHASE3: Richte Nachrichten-Subscription für Chat ${chatId} ein`);
            const unsubscribe = fsSubscribeChatMessages(chatId, (snapshot, messagesArray, newMessages) => {
              console.log(`📡 PHASE3: Nachrichten-Update für Chat ${chatId}:`, messagesArray.length);
              
              // WICHTIG: Erstelle Notifications für neue Nachrichten, wenn Chat nicht geöffnet ist
              if (newMessages && newMessages.length > 0) {
                createNotificationsForNewMessages(chatId, newMessages).catch(err => {
                  console.error('❌ PHASE3: Fehler beim Erstellen von Notifications für neue Nachrichten:', err);
                });
              }
              
              // Aktualisiere beide States
              setMessages(prev => {
                const safePrev = prev || {};
                return {
                  ...safePrev,
                  [chatId]: messagesArray
                };
              });
              
              setActiveChatMessages(prev => {
                const safePrev = prev || {};
                return {
                  ...safePrev,
                  [chatId]: messagesArray
                };
              });
              
              // Synchronisiere mit AsyncStorage
              setMessages(prev => {
                const safePrev = prev || {};
                const updated = {
                  ...safePrev,
                  [chatId]: messagesArray
                };
                AsyncStorage.setItem('bottle-trade-messages', JSON.stringify(updated)).catch(err => {
                  console.error('❌ Fehler beim Speichern der Nachrichten:', err);
                });
                return updated;
              });
            });
            
            messageSubscriptionsRef.current[chatId] = unsubscribe;
          }
        }).catch(error => {
          console.error('❌ PHASE3: Fehler beim Laden der Nachrichten:', error);
        });
      }).catch(error => {
        console.error('❌ PHASE3: Fehler beim Prüfen des Chats:', error);
      });
    }
  };

  // Wiederverwendbare Funktion: Notification-Erstellung für neue Chat-Nachrichten
  // ============================================
  const createNotificationsForNewMessages = async (chatId, newMessages) => {
    console.log('🔍 DEBUG: createNotificationsForNewMessages aufgerufen:', { chatId, newMessagesCount: newMessages?.length, newMessages: newMessages?.map(m => ({ id: m?.id, senderId: m?.senderId, text: m?.text?.substring(0, 30) })) });
    
    if (!newMessages || newMessages.length === 0) {
      console.log('⚠️ PHASE3: Keine neuen Nachrichten, keine Notifications erstellt');
      return;
    }

    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid;

    console.log('🔍 DEBUG: createNotificationsForNewMessages - currentUserId:', currentUserId);

    if (!currentUserId) {
      console.log('⚠️ PHASE3: Kein currentUserId, keine Notifications erstellt');
      return;
    }

    // Prüfe, ob Chat aktuell geöffnet ist
    const routeChatId = route?.params?.chat?.id;
    const isChatOpen = currentScreen === 'chat-room' && routeChatId === chatId;
    
    // Debug-Logging für Problem-Diagnose
    console.log('🔍 PHASE3: Chat-Open-Prüfung:', {
      currentScreen,
      routeChatId,
      chatId,
      isChatOpen,
      routeParams: route?.params ? 'present' : 'missing',
    });
    
    if (isChatOpen) {
      console.log(`ℹ️ PHASE3: Chat ${chatId} ist aktuell geöffnet, keine Notifications erstellt`);
      logNotificationEvent({
        stage: 'chat/subscription/notification-skipped',
        type: 'chat',
        data: { chatId, reason: 'chat-is-open', newMessagesCount: newMessages.length },
      });
      return;
    }

    // WICHTIG: Chat aus State suchen, falls nicht gefunden aus Firestore laden
    let chat = chats.find(c => c.id === chatId);
    if (!chat) {
      console.log('⚠️ PHASE3: Chat nicht im State gefunden, lade aus Firestore:', chatId);
      try {
        chat = await fsGetChat(chatId);
        if (!chat) {
          console.log('⚠️ PHASE3: Chat nicht in Firestore gefunden, keine Notifications erstellt:', chatId);
          logNotificationEvent({
            stage: 'chat/subscription/notification-skipped',
            type: 'chat',
            data: { chatId, reason: 'chat-not-found-in-firestore', newMessagesCount: newMessages.length },
          });
          return;
        }
        console.log('✅ PHASE3: Chat aus Firestore geladen:', chatId);
      } catch (error) {
        console.error('❌ PHASE3: Fehler beim Laden des Chats aus Firestore:', error);
        logNotificationEvent({
          stage: 'chat/subscription/notification-error',
          type: 'chat',
          data: { chatId, reason: 'error-loading-chat', newMessagesCount: newMessages.length },
          meta: { message: error?.message },
        });
        return;
      }
    }

    if (!chat.participants || !Array.isArray(chat.participants)) {
      console.log('⚠️ PHASE3: Chat hat keine Teilnehmer-Liste, keine Notifications erstellt:', chatId);
      logNotificationEvent({
        stage: 'chat/subscription/notification-skipped',
        type: 'chat',
        data: { chatId, reason: 'missing-participants', newMessagesCount: newMessages.length },
      });
      return;
    }

    // WICHTIG: Prüfe ob Chat gelöscht wurde - keine Notification für gelöschte Chats
    if (chat.deletedBy) {
      console.log('⚠️ PHASE3: Chat wurde gelöscht, keine Notifications erstellt:', chatId);
      logNotificationEvent({
        stage: 'chat/subscription/notification-skipped',
        type: 'chat',
        data: { chatId, reason: 'chat-deleted', newMessagesCount: newMessages.length },
      });
      return;
    }

    // WICHTIG: Prüfe ob es wirklich ein Chat ist, nicht ein Hinweis
    if (chat.entryType === 'hint') {
      console.log('⚠️ PHASE3: Eintrag ist ein Hinweis, keine Chat-Notifications erstellt:', chatId);
      logNotificationEvent({
        stage: 'chat/subscription/notification-skipped',
        type: 'chat',
        data: { chatId, reason: 'entry-is-hint', newMessagesCount: newMessages.length },
      });
      return;
    }

    // Erstelle Notifications für jede neue Nachricht
    for (const message of newMessages) {
      try {
        if (!message.senderId || !message.text) {
          console.log('⚠️ PHASE3: Ungültige Nachricht, überspringe:', message.id);
          continue;
        }

        // Finde Empfänger (anderer Teilnehmer als Sender)
        const toUserId = chat.participants.find(pid => pid !== message.senderId);
        if (!toUserId || toUserId === message.senderId) {
          console.log('⚠️ PHASE3: Kein gültiger Empfänger gefunden, überspringe:', message.id);
          continue;
        }

        // WICHTIG: Erstelle Notification nur für den Empfänger, NICHT für den Sender
        // Wenn der aktuelle User der Sender ist, überspringe (Sender sollte keine Notification von seiner eigenen Nachricht erhalten)
        console.log('🔍 DEBUG: Prüfe Nachricht für Notification-Erstellung:', { 
          messageId: message.id,
          senderId: message.senderId, 
          currentUserId, 
          toUserId,
          participants: chat.participants,
          isSender: message.senderId === currentUserId
        });
        
        if (message.senderId === currentUserId) {
          console.log('ℹ️ PHASE3: Nachricht ist vom aktuellen User (Sender), überspringe:', { senderId: message.senderId, currentUserId, messageId: message.id });
          continue;
        }

        // Erstelle Notification nur für den aktuellen User (Empfänger)
        if (toUserId !== currentUserId) {
          console.log('ℹ️ PHASE3: Nachricht ist nicht für aktuellen User, überspringe:', { toUserId, currentUserId, messageId: message.id });
          continue;
        }

        const notificationData = {
          type: 'chat',
          title: `Neue Nachricht von ${message.senderName || 'Unbekannt'}`,
          message: message.text,
          priority: 'medium',
          chatId: chatId,
          senderId: message.senderId,
          senderName: message.senderName,
          toUserId: toUserId,
          fromUserId: message.senderId
        };

        console.log('🔄 PHASE3: Erstelle Notification für neue Nachricht (Subscription):', { toUserId, chatId, messageId: message.id, senderId: message.senderId, notificationData: { senderId: notificationData.senderId, fromUserId: notificationData.fromUserId } });
        const notificationId = await fsCreateNotification(toUserId, notificationData);
        if (!notificationId) {
          console.log('⚠️ PHASE3: Notification wurde blockiert (zentrale Prüfung in createNotification)');
          return; // Notification wurde blockiert
        }
        console.log('⚡ JIT: Notification für neue Nachricht erstellt (Subscription):', { notificationId, toUserId, chatId, messageId: message.id });
        logNotificationEvent({
          stage: 'chat/subscription/notification-created',
          type: 'chat',
          data: {
            chatId,
            messageId: message.id,
            notificationId,
            toUserId,
          },
        });
      } catch (notifError) {
        console.error('❌ PHASE3: Fehler beim Erstellen der Notification für Nachricht:', message.id, notifError);
        logNotificationEvent({
          stage: 'chat/subscription/notification-error',
          type: 'chat',
          data: { chatId, messageId: message.id },
          meta: { message: notifError?.message },
        });
      }
    }
  };

  // Funktionen für Chat-Nachrichten (vereinfacht - nur AsyncStorage)
  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Chat-Nachrichten-Hinzufügung mit Firestore
  // Datum: Phase 3 - Schritt 7
  // ============================================
  const addMessage = async (chatId, message) => {
    // Debug-Logging: Prüfe, ob Funktion aufgerufen wird
    console.log('🔍 DEBUG: addMessage aufgerufen', {
      chatId,
      messageId: message?.id,
      messageText: message?.text?.substring(0, 50),
      senderId: message?.senderId,
      senderName: message?.senderName,
      timestamp: new Date().toISOString(),
    });
    
    logNotificationEvent({
      stage: 'chat/addMessage/start',
      type: 'chat',
      data: {
        chatId,
        messageId: message?.id,
      },
    });
    try {
      console.log('🔄 PHASE3: Füge Nachricht hinzu...', { chatId, messageId: message.id });
      
      // Prüfe, ob Nachricht bereits existiert (verhindert Duplikate)
      const existingMessages = messages[chatId] || [];
      const messageExists = existingMessages.some(msg => msg.id === message.id);
      
      if (messageExists) {
        console.log('⚠️ PHASE3: Nachricht bereits vorhanden, überspringe:', message.id);
        logNotificationEvent({
          stage: 'chat/addMessage/skipped',
          type: 'chat',
          data: { chatId, messageId: message.id, reason: 'duplicate' },
        });
        return;
      }
      
      // Prüfe, ob es eine ungültige Nachricht ist
      if (!message.text || !message.senderId) {
        console.log('⚠️ PHASE3: Ungültige Nachricht, überspringe:', message);
        logNotificationEvent({
          stage: 'chat/addMessage/skipped',
          type: 'chat',
          data: { chatId, messageId: message.id, reason: 'invalid' },
        });
        return;
      }
      
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      // PHASE3: Speichere Nachricht in Firestore
      const messageData = {
        text: message.text,
        senderId: message.senderId,
        senderName: message.senderName || currentUser?.username || 'Unbekannt',
        timestamp: message.timestamp || new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      };
      
      await fsAddChatMessage(chatId, messageData);
      console.log('✅ PHASE3: Nachricht in Firestore gespeichert');
      logNotificationEvent({
        stage: 'chat/addMessage/saved',
        type: 'chat',
        data: { chatId, messageId: message.id },
      });
      
      // PHASE3: Erstelle Notification für den Empfänger (nicht für den Sender)
      // WICHTIG: Wir können hier NICHT prüfen, ob der Empfänger den Chat geöffnet hat,
      // weil wir im Kontext des Senders sind. Die Notification wird immer erstellt.
      // Wenn der Empfänger den Chat geöffnet hat, wird die Notification durch markChatAsRead gelöscht.
      try {
        const chat = chats.find(c => c.id === chatId);
        console.log('🔍 PHASE3: Suche Chat für Notification:', { chatId, chatGefunden: !!chat, participants: chat?.participants, currentUserId, senderId: message.senderId, currentScreen });
        
        if (!chat) {
          console.log('⚠️ PHASE3: Chat nicht gefunden, keine Notification erstellt:', chatId);
          logNotificationEvent({
            stage: 'chat/addMessage/notification-skipped',
            type: 'chat',
            data: { chatId, messageId: message.id, reason: 'chat-not-found' },
          });
          return;
        }
        
        if (!chat.participants || !Array.isArray(chat.participants)) {
          console.log('⚠️ PHASE3: Chat hat keine Teilnehmer-Liste, keine Notification erstellt:', chatId);
          logNotificationEvent({
            stage: 'chat/addMessage/notification-skipped',
            type: 'chat',
            data: { chatId, messageId: message.id, reason: 'missing-participants' },
          });
          return;
        }
        
        if (!currentUserId) {
          console.log('⚠️ PHASE3: Kein currentUserId, keine Notification erstellt');
          logNotificationEvent({
            stage: 'chat/addMessage/notification-skipped',
            type: 'chat',
            data: { chatId, messageId: message.id, reason: 'no-current-user' },
          });
          return;
        }
        
        // WICHTIG: Erstelle Notification nur für den Empfänger, NICHT für den Sender
        // Wenn der aktuelle User der Sender ist, keine Notification erstellen
        if (message.senderId === currentUserId) {
          console.log('⚠️ PHASE3: Aktueller User ist Sender, keine Notification erstellt (Sender sollte keine Notification von seiner eigenen Nachricht erhalten)');
          logNotificationEvent({
            stage: 'chat/addMessage/notification-skipped',
            type: 'chat',
            data: { chatId, messageId: message.id, reason: 'sender-is-current-user' },
          });
          return;
        }
        
        // WICHTIG: Prüfe ob Chat gelöscht wurde - keine Notification für gelöschte Chats
        if (chat.deletedBy) {
          console.log('⚠️ PHASE3: Chat wurde gelöscht, keine Notification erstellt:', chatId);
          logNotificationEvent({
            stage: 'chat/addMessage/notification-skipped',
            type: 'chat',
            data: { chatId, messageId: message.id, reason: 'chat-deleted' },
          });
          return;
        }
        
        // WICHTIG: Prüfe ob es wirklich ein Chat ist, nicht ein Hinweis
        if (chat.entryType === 'hint') {
          console.log('⚠️ PHASE3: Eintrag ist ein Hinweis, keine Chat-Notification erstellt:', chatId);
          logNotificationEvent({
            stage: 'chat/addMessage/notification-skipped',
            type: 'chat',
            data: { chatId, messageId: message.id, reason: 'entry-is-hint' },
          });
          return;
        }
        
        const toUserId = chat.participants.find(pid => pid !== message.senderId);
        console.log('🔍 PHASE3: Empfänger gefunden:', { toUserId, senderId: message.senderId, participants: chat.participants });
        
        // Erstelle Notification nur wenn der Empfänger nicht der Sender ist
        if (!toUserId) {
          console.log('⚠️ PHASE3: Kein Empfänger gefunden (alle Teilnehmer sind Sender?), keine Notification erstellt');
          logNotificationEvent({
            stage: 'chat/addMessage/notification-skipped',
            type: 'chat',
            data: { chatId, messageId: message.id, reason: 'no-recipient' },
          });
          return;
        }
        
        if (toUserId === message.senderId) {
          console.log('⚠️ PHASE3: Sender ist Empfänger, keine Notification erstellt');
          logNotificationEvent({
            stage: 'chat/addMessage/notification-skipped',
            type: 'chat',
            data: { chatId, messageId: message.id, reason: 'sender-is-recipient' },
          });
          return;
        }
        
        const notificationData = {
          type: 'chat',
          title: `Neue Nachricht von ${message.senderName || 'Unbekannt'}`,
          message: message.text,
          priority: 'medium',
          chatId: chatId,
          senderId: message.senderId,
          senderName: message.senderName,
          toUserId: toUserId, // WICHTIG: toUserId hinzufügen für korrekte Zählung
          fromUserId: message.senderId // WICHTIG: fromUserId für Konsistenz
        };
        
        console.log('🔄 PHASE3: Erstelle Notification für neue Nachricht:', { toUserId, chatId, type: 'chat', notificationData });
        
        // WICHTIG: Erstelle Notification sofort (just-in-time)
        const notificationId = await fsCreateNotification(toUserId, notificationData);
        if (!notificationId) {
          console.log('⚠️ PHASE3: Notification wurde blockiert (zentrale Prüfung in createNotification)');
          return; // Notification wurde blockiert
        }
        console.log('⚡ JIT: Notification für neue Nachricht erstellt:', { notificationId, toUserId, chatId, type: 'chat' });
        logNotificationEvent({
          stage: 'chat/addMessage/notification-created',
          type: 'chat',
          data: {
            chatId,
            messageId: message.id,
            notificationId,
            toUserId,
          },
        });
      } catch (notifError) {
        console.error('❌ PHASE3: Fehler beim Erstellen der Notification:', notifError);
        // Weiterlaufen - Nachricht wurde gespeichert
        logNotificationEvent({
          stage: 'chat/addMessage/notification-error',
          type: 'chat',
          data: { chatId, messageId: message.id },
          meta: { message: notifError?.message },
        });
      }
    } catch (error) {
      console.error('❌ PHASE3: Fehler beim Hinzufügen der Nachricht:', error);
      logNotificationEvent({
        stage: 'chat/addMessage/error',
        type: 'chat',
        data: { chatId, messageId: message?.id },
        meta: { message: error?.message },
      });
      throw error;
    }
  };
  // ============================================
  // PHASE3 ENDE
  // ============================================

  // Funktion zum Aktualisieren einer bestehenden Nachricht (für Reactions)
  const updateMessage = async (chatId, messageId, updates) => {
    const existingMessages = messages[chatId] || [];
    const messageIndex = existingMessages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex === -1) {
      console.log('⚠️ Nachricht nicht gefunden für Update:', messageId);
      return;
    }
    
    // Prüfe, ob die Nachricht bereits aktualisiert wurde
    const currentMessage = existingMessages[messageIndex];
    const hasChanges = Object.keys(updates).some(key => 
      JSON.stringify(currentMessage[key]) !== JSON.stringify(updates[key])
    );
    
    if (!hasChanges) {
      console.log('⚠️ Keine Änderungen für Nachricht:', messageId);
      return;
    }
    
    console.log('✅ Aktualisiere Nachricht:', messageId);
    
    const updatedMessages = [...existingMessages];
    updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updates };
    
    // WICHTIG: Prüfe ob messages definiert ist, um TypeError zu vermeiden
    const safeMessages = messages || {};
    const newMessages = {
      ...safeMessages,
      [chatId]: updatedMessages
    };
    
    setMessages(newMessages);
    
    // Speichere in AsyncStorage
    try {
      await AsyncStorage.setItem('bottle-trade-messages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('❌ Error saving updated messages to AsyncStorage:', error);
    }
  };

  const getMessages = (chatId) => {
    // WICHTIG: Prüfe, ob der aktuelle User ein Teilnehmer des Chats ist
    // 1-zu-1 Kommunikation darf nicht von Dritten (auch nicht Admins) eingesehen werden
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid;
    
    // Wenn kein User eingeloggt ist, keine Nachrichten zurückgeben
    if (!currentUserId) {
      return [];
    }
    
    // Finde den Chat
    const chat = chats.find(c => c.id === chatId);
    if (!chat || !chat.participants || !Array.isArray(chat.participants)) {
      return []; // Chat nicht gefunden oder keine Teilnehmer-Liste
    }
    
    // Wenn Chat gelöscht wurde, keine Nachrichten zurückgeben
    if (chat.deletedBy) {
      return [];
    }
    
    // Prüfe, ob der aktuelle User ein Teilnehmer ist
    if (!chat.participants.includes(currentUserId)) {
      // Keine Warnung - das kann passieren wenn:
      // - Chat gelöscht wurde
      // - User ausgeloggt ist
      // - Chat nicht mehr existiert
      // - Temporäre Zustände während der Navigation
      return []; // Keine Nachrichten zurückgeben, wenn User kein Teilnehmer ist
    }
    
    // WICHTIG: Prüfe zuerst, ob der Chat noch in Firestore existiert
    // Wenn nicht, sollte der Chat nicht mehr angezeigt werden
    if (chatId && (!messages[chatId] || messages[chatId].length === 0)) {
      // Prüfe ob Chat in Firestore existiert und lade Nachrichten
      getDoc(doc(db, 'chats', chatId)).then(chatDoc => {
        if (!chatDoc.exists()) {
          // Chat existiert nicht mehr in Firestore - entferne aus Chats-Liste
          console.log(`🗑️ PHASE3: Chat ${chatId} existiert nicht mehr in Firestore, entferne aus Liste`);
          setChats(prev => prev.filter(c => c.id !== chatId));
          // Entferne auch aus AsyncStorage
          AsyncStorage.getItem('bottle-trade-chats').then(savedChats => {
            if (savedChats) {
              const chatsArray = JSON.parse(savedChats);
              const filtered = chatsArray.filter(c => c.id !== chatId);
              AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(filtered));
            }
          }).catch(() => {});
          return;
        }
        
        // Chat existiert - lade Nachrichten
        fsGetChatMessages(chatId).then(firestoreMessages => {
          if (firestoreMessages && firestoreMessages.length > 0) {
            console.log(`✅ PHASE3: ${firestoreMessages.length} Nachrichten aus Firestore geladen für Chat ${chatId}`);
            // Speichere Nachrichten im State
            setMessages(prev => {
              // WICHTIG: Prüfe ob prev definiert ist, um TypeError zu vermeiden
              const safePrev = prev || {};
              const updated = {
                ...safePrev,
                [chatId]: firestoreMessages
              };
              
              // Aktualisiere auch activeChatMessages für sofortige Anzeige
              setActiveChatMessages(prev => ({
                ...prev,
                [chatId]: firestoreMessages
              }));
              
              // Speichere auch in AsyncStorage
              AsyncStorage.setItem('bottle-trade-messages', JSON.stringify(updated)).catch(err => {
                console.error('❌ Fehler beim Speichern der Nachrichten in AsyncStorage:', err);
              });
              
              return updated;
            });
            
            // WICHTIG: Richte Subscription für Echtzeit-Updates ein, wenn noch nicht aktiv
            if (!messageSubscriptionsRef.current[chatId]) {
              console.log(`📡 PHASE3: Richte Nachrichten-Subscription für Chat ${chatId} ein`);
              const unsubscribe = fsSubscribeChatMessages(chatId, (snapshot, messagesArray, newMessages) => {
                console.log(`📡 PHASE3: Nachrichten-Update für Chat ${chatId}:`, messagesArray.length);
                
                // WICHTIG: Erstelle Notifications für neue Nachrichten, wenn Chat nicht geöffnet ist
                if (newMessages && newMessages.length > 0) {
                  createNotificationsForNewMessages(chatId, newMessages).catch(err => {
                    console.error('❌ PHASE3: Fehler beim Erstellen von Notifications für neue Nachrichten:', err);
                  });
                }
                
                // Aktualisiere beide States
                setMessages(prev => {
                  const safePrev = prev || {};
                  return {
                    ...safePrev,
                    [chatId]: messagesArray
                  };
                });
                
                setActiveChatMessages(prev => ({
                  ...prev,
                  [chatId]: messagesArray
                }));
                
                // Synchronisiere mit AsyncStorage
                setMessages(prev => {
                  const safePrev = prev || {};
                  const updated = {
                    ...safePrev,
                    [chatId]: messagesArray
                  };
                  AsyncStorage.setItem('bottle-trade-messages', JSON.stringify(updated)).catch(err => {
                    console.error('❌ Fehler beim Speichern der Nachrichten:', err);
                  });
                  return updated;
                });
              });
              
              messageSubscriptionsRef.current[chatId] = unsubscribe;
            }
          } else {
            console.log(`ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat ${chatId}`);
            setActiveChatMessages(prev => {
              const safePrev = prev || {};
              return {
                ...safePrev,
                [chatId]: []
              };
            });
          }
        }).catch(error => {
          console.error('❌ PHASE3: Fehler beim Laden der Nachrichten aus Firestore:', error);
        });
      }).catch(error => {
        console.error('❌ PHASE3: Fehler beim Prüfen des Chats in Firestore:', error);
      });
    }
    
    // WICHTIG: Verwende activeChatMessages falls vorhanden, sonst messages
    return activeChatMessages[chatId] || messages[chatId] || [];
  };

  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Chat-als-gelesen-markieren mit Firestore
  // Datum: Phase 3 - Schritt 7
  // ============================================
  const markAllChatsAsRead = async () => {
    try {
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      if (!currentUserId) {
        console.error('❌ PHASE3: Kein User gefunden für markAllChatsAsRead');
        return;
      }
      
      // Markiere alle Chats (KEINE Hinweise) als gelesen
      const unreadChats = chats.filter(chat => {
        // WICHTIG: Nur echte Chats, keine Hinweise
        if (chat.entryType === 'hint') {
          return false;
        }
        // Prüfe ob Chat ungelesene Nachrichten hat
        if (chat.unreadCount && chat.unreadCount > 0) {
          return true;
        }
        return false;
      });
      
      if (unreadChats.length === 0) {
        console.log('✅ Keine ungelesenen Chats gefunden');
        return;
      }
      
      console.log(`🔄 Markiere ${unreadChats.length} Chats als gelesen...`);
      
      // Markiere alle als gelesen
      for (const chat of unreadChats) {
        try {
          await fsMarkChatAsRead(chat.id, currentUserId);
        } catch (error) {
          console.error(`❌ Fehler beim Markieren von Chat ${chat.id} als gelesen:`, error);
        }
      }
      
      console.log(`✅ ${unreadChats.length} Chats als gelesen markiert`);
    } catch (error) {
      console.error('❌ PHASE3: Fehler beim Markieren aller Chats als gelesen:', error);
    }
  };

  // WICHTIG: Markiere alle Hinweise als gelesen
  const markAllHintsAsRead = async () => {
    try {
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      if (!currentUserId) {
        console.error('❌ PHASE3: Kein User gefunden für markAllHintsAsRead');
        return;
      }
      
      // Markiere alle Hinweise als gelesen
      const unreadHints = chats.filter(chat => {
        // WICHTIG: Nur Hinweise, keine Chats
        if (chat.entryType !== 'hint') {
          return false;
        }
        // Prüfe ob Hinweis ungelesene Nachrichten hat
        if (chat.unreadCount && chat.unreadCount > 0) {
          return true;
        }
        return false;
      });
      
      if (unreadHints.length === 0) {
        console.log('✅ Keine ungelesenen Hinweise gefunden');
        return;
      }
      
      console.log(`🔄 Markiere ${unreadHints.length} Hinweise als gelesen...`);
      
      // Markiere alle als gelesen
      for (const hint of unreadHints) {
        try {
          await fsMarkChatAsRead(hint.id, currentUserId);
        } catch (error) {
          console.error(`❌ Fehler beim Markieren von Hinweis ${hint.id} als gelesen:`, error);
        }
      }
      
      console.log(`✅ ${unreadHints.length} Hinweise als gelesen markiert`);
    } catch (error) {
      console.error('❌ PHASE3: Fehler beim Markieren aller Hinweise als gelesen:', error);
    }
  };

  const markChatAsRead = async (chatId) => {
    try {
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      if (!currentUserId) {
        console.error('❌ PHASE3: Kein User gefunden für markChatAsRead');
        return;
      }
      
      // PHASE3: Markiere Chat als gelesen in Firestore
      await fsMarkChatAsRead(chatId, currentUserId);
      console.log('✅ PHASE3: Chat als gelesen markiert in Firestore:', chatId);
      
      // WICHTIG: Lösche alle zugehörigen Notifications automatisch, wenn Chat als gelesen markiert wird
      // Notifications werden nicht mehr benötigt, wenn der User den Chat gelesen hat
      try {
        const chat = chats.find(c => c.id === chatId);
        const tradeRequestId = chat?.tradeRequestId;
        
        // WICHTIG: Markiere Notifications als "wird gelöscht", bevor wir sie aus dem State entfernen
        // Dies verhindert, dass die Firestore-Subscription sie wieder hinzufügt
        const notificationsToDelete = (notifications || []).filter(n => {
          // Entferne Notifications für diesen Chat
          if (n.chatId === chatId) return true;
          // Entferne Trade-Request Notifications für diesen Chat (wenn vorhanden)
          if (tradeRequestId && n.requestId === tradeRequestId && 
              (n.type === 'hint-decision' || n.type === 'chat' || n.type === 'hint-small')) {
            return true;
          }
          return false;
        });
        
        // Markiere alle betroffenen Notifications als "pending deletion"
        notificationsToDelete.forEach(n => {
          if (n.id) {
            pendingNotificationDeletionsRef.current.add(n.id);
          }
        });
        
        // WICHTIG: Aktualisiere lokalen State SOFORT, bevor Firestore-Operation
        // Dies stellt sicher, dass die Zählung sofort aktualisiert wird
        setNotifications(prev => {
          const filtered = prev.filter(n => {
            // Entferne Notifications für diesen Chat
            if (n.chatId === chatId) return false;
            // Entferne Trade-Request Notifications für diesen Chat (wenn vorhanden)
            if (tradeRequestId && n.requestId === tradeRequestId && 
                (n.type === 'hint-decision' || n.type === 'chat' || n.type === 'hint-small')) {
              return false;
            }
            return true;
          });
          console.log(`🔧 Lokaler State aktualisiert: ${prev.length} -> ${filtered.length} Notifications (chatId: ${chatId})`);
          return filtered;
        });
        
        // Lösche aus Firestore (asynchron, aber State ist bereits aktualisiert)
        const deletedCount = await fsDeleteNotificationsForChat(currentUserId, chatId, tradeRequestId);
        console.log(`✅ ${deletedCount} Notifications für Chat gelöscht`);
        
        // Entferne aus pending deletions nach kurzer Verzögerung (Firestore hat Zeit zu aktualisieren)
        setTimeout(() => {
          notificationsToDelete.forEach(n => {
            if (n.id) {
              pendingNotificationDeletionsRef.current.delete(n.id);
            }
          });
        }, 2000); // 2 Sekunden sollten ausreichen
        
        // Zählung wird automatisch durch useEffect aktualisiert, da notifications State sich geändert hat
        
        console.log(`✅ PHASE3: ${deletedCount} Notifications gelöscht für Chat ${chatId}`);
      } catch (notifError) {
        console.error('❌ PHASE3: Fehler beim Löschen der Notifications:', notifError);
        // Weiterlaufen - Chat wurde als gelesen markiert, auch wenn Notification-Löschung fehlgeschlagen ist
      }
    } catch (error) {
      console.error('❌ PHASE3: Fehler beim Markieren des Chats als gelesen:', error);
      throw error;
    }
  };

  // Lösche Notifications für einen Hinweis, wenn User ihn öffnet
  const deleteNotificationsForHint = async (tradeRequestId) => {
    try {
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      if (!currentUserId || !tradeRequestId) {
        return;
      }
      
      // WICHTIG: Markiere Notifications als "wird gelöscht", bevor wir sie aus dem State entfernen
      // Dies verhindert, dass die Firestore-Subscription sie wieder hinzufügt
      const notificationsToDelete = (notifications || []).filter(n => 
        n.requestId === tradeRequestId && (n.type === 'hint-decision' || n.type === 'hint-small') && !n.chatId
      );
      
      // Markiere alle betroffenen Notifications als "pending deletion"
      notificationsToDelete.forEach(n => {
        if (n.id) {
          pendingNotificationDeletionsRef.current.add(n.id);
        }
      });
      
      // WICHTIG: Aktualisiere lokalen State SOFORT, bevor Firestore-Operation
      // Dies stellt sicher, dass die Zählung sofort aktualisiert wird
      setNotifications(prev => {
        const filtered = prev.filter(n => 
          !(n.requestId === tradeRequestId && (n.type === 'hint-decision' || n.type === 'hint-small') && !n.chatId)
        );
        console.log(`🔧 Lokaler State aktualisiert: ${prev.length} -> ${filtered.length} Notifications (tradeRequestId: ${tradeRequestId})`);
        return filtered;
      });
      
      // Lösche aus Firestore (asynchron, aber State ist bereits aktualisiert)
      const deletedCount = await fsDeleteNotificationsForHint(currentUserId, tradeRequestId);
      console.log(`✅ ${deletedCount} Notifications für Hinweis gelöscht (tradeRequestId: ${tradeRequestId})`);
      
      // Entferne aus pending deletions nach kurzer Verzögerung (Firestore hat Zeit zu aktualisieren)
      setTimeout(() => {
        notificationsToDelete.forEach(n => {
          if (n.id) {
            pendingNotificationDeletionsRef.current.delete(n.id);
          }
        });
      }, 2000); // 2 Sekunden sollten ausreichen
      
      // Zählung wird automatisch durch useEffect aktualisiert, da notifications State sich geändert hat
      
      return deletedCount;
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Notifications für Hinweis:', error);
    }
  };
  // ============================================
  // PHASE3 ENDE
  // ============================================

  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Chat-Löschung mit Soft-Delete und Chat-verlassen-Hinweis
  // Datum: Phase 3 - Schritt 7
  // ============================================
  const deleteChatById = async (chatId) => {
    try {
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      if (!currentUserId) {
        console.error('❌ PHASE3: Kein User gefunden für Chat-Löschung');
        return;
      }

      // Finde den Chat/Hinweis
      const chatToDelete = chats.find(c => c.id === chatId);
      if (!chatToDelete) {
        console.error('❌ PHASE3: Chat/Hinweis nicht gefunden:', chatId);
        return;
      }
      
      if (chatToDelete.entryType === 'hint') {
        if (chatToDelete.tradeRequestId) {
          await deleteNotificationsForHint(chatToDelete.tradeRequestId);
        }
      } else {
        await markChatAsRead(chatId);
      }
      
      const isHint = chatToDelete.entryType === 'hint';
      const currentUserName = currentUser?.username || `${currentUser?.firstName} ${currentUser?.lastName}` || 'Unbekannt';

      // PHASE3: Markiere Chat/Hinweis als gelöscht in Firestore (Soft-Delete)
      await fsDeleteChat(chatId, currentUserId);
      console.log('✅ PHASE3: Chat/Hinweis als gelöscht markiert in Firestore:', chatId);
      
      // PHASE3: Erstelle Chat-verlassen-Hinweis für den anderen Teilnehmer (nur für echte Chats, nicht für Hinweise)
      if (!isHint && chatToDelete.participants && Array.isArray(chatToDelete.participants)) {
        const otherParticipantId = chatToDelete.participants.find(pid => pid !== currentUserId);
        const otherParticipantIndex = chatToDelete.participants.findIndex(pid => pid !== currentUserId);
        const otherParticipantName = chatToDelete.participantNames?.[otherParticipantIndex] || 'Unbekannt';
        
        if (otherParticipantId) {
          try {
            const hintData = {
              hintType: 'chat-left',
              chatId: chatId,
              userId: otherParticipantId, // WICHTIG: Nur userId, kein participants Array!
              lastMessage: `${currentUserName} hat den Chat verlassen`,
              lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
              unreadCount: 1,
              fromUserId: currentUserId,
              fromUserName: currentUserName,
              toUserId: otherParticipantId,
              toUserName: otherParticipantName
            };
            
            await fsCreateTradeHint(hintData);
            console.log('✅ PHASE3: Chat-verlassen-Hinweis erstellt für:', otherParticipantId);
            
            // PHASE3: Erstelle Notification für den Hinweis
            const notificationData = {
              type: 'hint-small',
              title: 'Chat verlassen',
              message: `${currentUserName} hat den Chat verlassen`,
              priority: 'medium',
              chatId: chatId
            };
            
            await fsCreateNotification(otherParticipantId, notificationData);
            console.log('✅ PHASE3: Chat-verlassen-Notification erstellt für:', otherParticipantId);
        logNotificationEvent({
          stage: 'chat/delete/notification',
          type: 'chat',
          data: {
            chatId,
            userId: otherParticipantId,
            notificationType: notificationData.type,
          },
        });
          } catch (hintError) {
            console.error('❌ PHASE3: Fehler beim Erstellen des Chat-verlassen-Hinweises:', hintError);
            // Weiterlaufen - Chat wurde gelöscht
        logNotificationEvent({
          stage: 'chat/delete/notification-error',
          type: 'chat',
          data: { chatId, userId: otherParticipantId },
          meta: { message: hintError?.message },
        });
          }
        }
      }

      console.log('✅ PHASE3: Chat gelöscht für User:', currentUserId);
    } catch (error) {
      console.error('❌ PHASE3: Fehler beim Löschen des Chats:', error);
      throw error;
    }
  };

  // Admin-Funktion: Lösche nur einen Chat (nicht Hinweis)
  const deleteChatOnly = async (chatId) => {
    try {
      const chatToDelete = chats.find(c => c.id === chatId);
      if (!chatToDelete) {
        console.error('❌ Chat nicht gefunden:', chatId);
        throw new Error('Chat nicht gefunden');
      }
      
      // Prüfe ob es wirklich ein Chat ist, nicht ein Hinweis
      if (chatToDelete.entryType === 'hint') {
        console.error('❌ Eintrag ist ein Hinweis, nicht ein Chat:', chatId);
        throw new Error('Eintrag ist ein Hinweis, nicht ein Chat');
      }
      
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      // Lösche Chat (als Admin)
      await fsDeleteChat(chatId, currentUserId);
      console.log('✅ Admin: Chat gelöscht:', chatId);
      
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Chats:', error);
      throw error;
    }
  };

  // Admin-Funktion: Lösche nur einen Hinweis (nicht Chat)
  const deleteHintOnly = async (hintId) => {
    try {
      const hintToDelete = chats.find(c => c.id === hintId);
      if (!hintToDelete) {
        console.error('❌ Hinweis nicht gefunden:', hintId);
        throw new Error('Hinweis nicht gefunden');
      }
      
      // Prüfe ob es wirklich ein Hinweis ist, nicht ein Chat
      if (hintToDelete.entryType !== 'hint') {
        console.error('❌ Eintrag ist ein Chat, nicht ein Hinweis:', hintId);
        throw new Error('Eintrag ist ein Chat, nicht ein Hinweis');
      }
      
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      // Lösche Hinweis (als Admin)
      await fsDeleteChat(hintId, currentUserId);
      console.log('✅ Admin: Hinweis gelöscht:', hintId);
      
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Hinweises:', error);
      throw error;
    }
  };

  // Admin-Funktion: Lösche einen einzelnen Trade-Request
  const deleteSingleTrade = async (tradeRequestId) => {
    try {
      await fsDeleteTradeRequest(tradeRequestId);
      console.log('✅ Admin: Trade-Request gelöscht:', tradeRequestId);
      
      // Lösche auch zugehörige Notifications
      try {
        await fsDeleteNotificationsForTradeRequest(getCurrentUser()?.uid, tradeRequestId);
        console.log('✅ Admin: Notifications für Trade-Request gelöscht:', tradeRequestId);
      } catch (notifError) {
        console.error('⚠️ Fehler beim Löschen der Notifications (fortsetzen):', notifError);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Trade-Requests:', error);
      throw error;
    }
  };
  // ============================================
  // PHASE3 ENDE
  // ============================================

  // Funktionen für Umfragen und Benachrichtigungen
  const createSurvey = (surveyData) => {
    console.log('🔄 App.js: Erstelle Umfrage...', surveyData);
    const newSurvey = {
      id: Date.now(), // Einfache ID-Generierung
      ...surveyData,
      responses: 0,
      status: 'active',
      createdAt: new Date().toLocaleDateString('de-DE')
    };
    
    console.log('✅ App.js: Umfrage erstellt:', newSurvey);
    setSurveys(prev => [...prev, newSurvey]);
    
    // Benachrichtigung für alle Benutzer erstellen
    const newNotification = {
      id: Date.now() + 1,
      type: 'system',
      title: 'Neue Umfrage verfügbar',
      message: `"${surveyData.title}" - Teilnahme belohnt mit ${surveyData.btpReward} BTP`,
      timestamp: 'gerade eben',
      isRead: false,
      priority: 'medium'
    };
    
    console.log('📢 App.js: Benachrichtigung erstellt:', newNotification);
    setNotifications(prev => [newNotification, ...prev]);
    // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
    console.log('✅ App.js: Umfrage und Benachrichtigung erfolgreich hinzugefügt');
    
    return newSurvey;
  };

  // PHASE 2: Vereinfachte Badge-Berechnung - nur noch unreadCount
  const refreshNotificationBadges = React.useCallback(() => {
    const current = getCurrentUser();
    const currentId = current?.uid;
    
    if (!currentId || !isLoggedIn) {
      setUnreadCount(prev => (prev !== 0 ? 0 : prev));
      logNotificationEvent({
        stage: 'badge-reset',
        type: 'badges',
        data: { reason: 'no-user-or-logged-out' },
      });
      return;
    }
    
    const allNotifications = notifications || [];
    
    // Einfache Berechnung: Alle ungelesenen, nicht-archivierten Notifications zählen
    // Unterstützte Typen: 'hint-decision', 'hint-small', 'chat', 'system'
    const unreadCount = allNotifications.filter(n => {
      if (!n || n.isRead) return false;
      if (n.isArchived) return false;
      
      // Unterstützte Notification-Typen
      const supportedTypes = ['hint-decision', 'hint-small', 'chat', 'system'];
      if (!supportedTypes.includes(n.type)) return false;
      
      // Filtere Notifications von eigenen Nachrichten (nur für Chat-Typen)
      if (n.type === 'chat') {
        const isOwnMessage = 
          n.senderId === currentId || 
          n.fromUserId === currentId ||
          (n.data && n.data.senderId === currentId) ||
          (n.data && n.data.fromUserId === currentId);
        if (isOwnMessage) return false;
      }
      
      // Prüfe, ob Chat aktuell geöffnet ist (für Chat-Notifications)
      if (n.type === 'chat' && n.chatId) {
        const routeChatId = route?.params?.chat?.id;
        const isChatCurrentlyOpen = currentScreen === 'chat-room' && routeChatId === n.chatId;
        if (isChatCurrentlyOpen) return false;
      }
      
      return true;
    }).length;

    logNotificationEvent({
      stage: 'badge-refresh/done',
      type: 'badges',
      data: {
        unreadCount,
        totalNotifications: allNotifications.length,
      },
    });

    setUnreadCount(prev => {
      if (prev !== unreadCount) {
        logNotificationEvent({
          stage: 'badge-update',
          type: 'badges',
          data: {
            from: prev,
            to: unreadCount,
          },
        });
        return unreadCount;
      }
      return prev;
    });
  }, [notifications, isLoggedIn, currentScreen, route]);

  const updateNotificationReadStatus = (notificationId, isRead) => {
    setNotifications(prev => {
      // WICHTIG: Wenn als gelesen markiert, lösche die Notification sofort
      if (isRead === true) {
        const filtered = prev.filter(n => n.id !== notificationId);
        
        // Speichere auch in AsyncStorage
        AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(filtered)).catch(err => {
          console.error('❌ Error saving filtered notifications to AsyncStorage:', err);
        });
        
        // Lösche auch aus Firestore (falls vorhanden)
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.uid;
        if (currentUserId) {
          try {
            fsDeleteNotification(currentUserId, notificationId).catch(err => {
              console.warn('⚠️ Fehler beim Löschen der Notification aus Firestore:', err);
            });
          } catch (err) {
            console.warn('⚠️ Fehler beim Aufruf von fsDeleteNotification:', err);
          }
        }
        
        console.log(`✅ Notification ${notificationId} gelöscht (als gelesen markiert)`);
        // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
        return filtered;
      } else {
        // Wenn als ungelesen markiert (seltener Fall), nur Status aktualisieren
        const updated = prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead }
            : n
        );
        // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
        return updated;
      }
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      // WICHTIG: Lösche alle Notifications sofort (alle als gelesen markiert = alle löschen)
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      // Lösche alle aus Firestore (falls vorhanden)
      if (currentUserId && prev.length > 0) {
        prev.forEach(notification => {
          try {
            fsDeleteNotification(currentUserId, notification.id).catch(err => {
              console.warn(`⚠️ Fehler beim Löschen der Notification ${notification.id} aus Firestore:`, err);
            });
          } catch (err) {
            console.warn(`⚠️ Fehler beim Aufruf von fsDeleteNotification für ${notification.id}:`, err);
          }
        });
      }
      
      // Lösche auch aus AsyncStorage
      AsyncStorage.removeItem('bottle-trade-notifications').catch(err => {
        console.error('❌ Error removing notifications from AsyncStorage:', err);
      });
      
      console.log(`✅ ${prev.length} Notifications gelöscht (alle als gelesen markiert)`);
      // WICHTIG: setUnreadNotifications(0) entfernt - wird automatisch über refreshNotificationBadges aktualisiert
      return []; // Leeres Array = alle gelöscht
    });
  };

  // WICHTIG: Markiere alle Hinweis-Notifications als gelesen, wenn HinweisScreen geöffnet wird
  const markAllHintNotificationsAsRead = async () => {
    try {
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      if (!currentUserId) {
        return;
      }
      
      // Finde alle ungelesenen Hinweis-Notifications
      const hintNotifications = (notifications || []).filter(n => {
        if (!n || n.isRead) return false;
        // Hinweis-Notifications: trade oder trade-info ohne chatId
        return (n.type === 'hint-decision' || n.type === 'hint-small') && !n.chatId;
      });
      
      if (hintNotifications.length === 0) {
        console.log('✅ Keine ungelesenen Hinweis-Notifications gefunden');
        return;
      }
      
      console.log(`🔄 Markiere ${hintNotifications.length} Hinweis-Notifications als gelesen...`);
      
      // Markiere alle als gelesen in Firestore
      const markPromises = hintNotifications.map(n => {
        if (n.id) {
          return fsMarkNotificationAsRead(currentUserId, n.id).catch(err => {
            console.warn(`⚠️ Fehler beim Markieren der Notification ${n.id} als gelesen:`, err);
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(markPromises);
      
      console.log(`✅ ${hintNotifications.length} Hinweis-Notifications als gelesen markiert`);
    } catch (error) {
      console.error('❌ Fehler beim Markieren aller Hinweis-Notifications als gelesen:', error);
    }
  };

  // WICHTIG: Markiere alle Chat-Notifications als gelesen, wenn ChatListScreen geöffnet wird
  const markAllChatNotificationsAsRead = async () => {
    try {
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      if (!currentUserId) {
        return;
      }
      
      // Finde alle ungelesenen Chat-Notifications
      const chatNotifications = (notifications || []).filter(n => {
        if (!n || n.isRead) return false;
        // Chat-Notifications: message, chat, oder trade-info mit chatId
        if (n.type === 'chat') {
          return true;
        }
        if (n.type === 'hint-small' && n.chatId) {
          // Prüfe ob es wirklich ein Chat ist
          const relatedChat = chats.find(c => c.id === n.chatId);
          return relatedChat && relatedChat.entryType === 'chat';
        }
        return false;
      });
      
      if (chatNotifications.length === 0) {
        console.log('✅ Keine ungelesenen Chat-Notifications gefunden');
        return;
      }
      
      console.log(`🔄 Markiere ${chatNotifications.length} Chat-Notifications als gelesen...`);
      
      // Markiere alle als gelesen in Firestore
      const markPromises = chatNotifications.map(n => {
        if (n.id) {
          return fsMarkNotificationAsRead(currentUserId, n.id).catch(err => {
            console.warn(`⚠️ Fehler beim Markieren der Notification ${n.id} als gelesen:`, err);
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(markPromises);
      
      console.log(`✅ ${chatNotifications.length} Chat-Notifications als gelesen markiert`);
    } catch (error) {
      console.error('❌ Fehler beim Markieren aller Chat-Notifications als gelesen:', error);
    }
  };

  const updateNotificationsReadByRequestId = (requestId, isRead = true) => {
    setNotifications(prev => {
      const current = getCurrentUser();
      const currentId = current?.uid;
      
      // WICHTIG: Wenn als gelesen markiert, lösche alle betroffenen Notifications sofort
      if (isRead === true) {
        // Filtere alle Notifications mit dieser requestId für den aktuellen User heraus
        const filtered = prev.filter(n => {
          if (n.requestId !== requestId) return true; // Behalte andere Notifications
          if (n.type === 'hint-decision') return n.toUserId !== currentId; // Entferne für Empfänger
          if (n.type === 'hint-small') return n.fromUserId !== currentId; // Entferne für Absender
          return false; // Entferne andere Typen mit dieser requestId
        });
        
        // Lösche auch aus Firestore (falls vorhanden)
        if (currentId && prev.length !== filtered.length) {
          const toDelete = prev.filter(n => {
            if (n.requestId !== requestId) return false;
            if (n.type === 'hint-decision') return n.toUserId === currentId;
            if (n.type === 'hint-small') return n.fromUserId === currentId;
            return true;
          });
          
          toDelete.forEach(notification => {
            try {
              fsDeleteNotification(currentId, notification.id).catch(err => {
                console.warn(`⚠️ Fehler beim Löschen der Notification ${notification.id} aus Firestore:`, err);
              });
            } catch (err) {
              console.warn(`⚠️ Fehler beim Aufruf von fsDeleteNotification für ${notification.id}:`, err);
            }
          });
        }
        
        // Speichere auch in AsyncStorage
        AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(filtered)).catch(err => {
          console.error('❌ Error saving filtered notifications to AsyncStorage:', err);
        });
        
        console.log(`✅ ${prev.length - filtered.length} Notifications für Trade-Request ${requestId} gelöscht (als gelesen markiert)`);
        // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
        return filtered;
      } else {
        // Wenn als ungelesen markiert (seltener Fall), nur Status aktualisieren
        const updated = prev.map(n => (n.requestId === requestId ? { ...n, isRead } : n));
        // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
        return updated;
      }
    });
  };

  const answerSurvey = (surveyId, selectedOption) => {
    const currentUserId = getCurrentUser()?.id;
    
    // Prüfen ob User bereits an dieser Umfrage teilgenommen hat
    const hasAnswered = surveyAnswers.some(answer => 
      answer.surveyId === surveyId && answer.userId === currentUserId
    );
    
    if (hasAnswered) {
      console.log('User hat bereits an dieser Umfrage teilgenommen');
      return false; // Teilnahme verweigert
    }
    
    // Survey responses erhöhen
    setSurveys(prev => 
      prev.map(survey => 
        survey.id === surveyId 
          ? { ...survey, responses: survey.responses + 1 }
          : survey
      )
    );
    
    // Antwort speichern
    const newAnswer = {
      id: Date.now(),
      surveyId: surveyId,
      userId: currentUserId,
      selectedOption: selectedOption,
      answeredAt: new Date().toISOString()
    };
    setSurveyAnswers(prev => [...prev, newAnswer]);
    
    // BTP-Belohnung Benachrichtigung erstellen
    const survey = surveys.find(s => s.id === surveyId);
    
    // Umfrage-Benachrichtigung als gelesen markieren
    console.log('📖 Markiere Umfrage-Benachrichtigung als gelesen für Survey:', surveyId);
    setNotifications(prev => 
      prev.map(notification => {
        // Prüfe ob es eine Umfrage-Benachrichtigung für diese Survey ist
        if (notification.type === 'system' && 
            notification.message.includes(survey.title) && 
            notification.title.includes('Umfrage')) {
          console.log('✅ Umfrage-Benachrichtigung als gelesen markiert:', notification.id);
          return { ...notification, isRead: true };
        }
        return notification;
      })
    );
    
    // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
    if (survey) {
      const btpNotification = {
        id: Date.now(),
        type: 'system',
        title: 'BTP gutgeschrieben',
        message: `Du hast ${survey.btpReward} BTP für die Teilnahme an der Umfrage "${survey.title}" erhalten`,
        timestamp: 'gerade eben',
        isRead: false,
        priority: 'medium'
      };
      
      setNotifications(prev => [btpNotification, ...prev]);
      // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
    }
    
    return true; // Teilnahme erfolgreich
  };

  // Trade Request erstellen (mit Dublettenprüfung, Offline-Queue) und Benachrichtigung an Empfänger senden
  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Trade-Request-Erstellung mit Wein-Kennzeichnung und neuen Hinweis-Struktur
  // Datum: Phase 3 - Schritt 2
  // ============================================
  const createTradeRequest = async ({ fromUser, toUser, wine }) => {
    try {
      console.log('🔄 PHASE3: Erstelle Trade-Request...', { fromUser: fromUser.uid, toUser: toUser.uid, wine: wine.id });
      
      // WICHTIG: Prüfe dass fromUserId !== toUserId (kein User sollte mit sich selbst tauschen)
      if (fromUser.uid === toUser.uid) {
        console.error('❌ Fehler: Ein User kann nicht mit sich selbst tauschen:', fromUser.uid);
        throw new Error('Ein User kann nicht mit sich selbst tauschen');
      }
      
      // PHASE3: Prüfe ob Wein bereits in einem Tausch involviert ist
      // WICHTIG: Prüfe nicht nur inTradeRequest, sondern auch ob der Trade-Request noch existiert
      if (wine.inTradeRequest === true && wine.pendingTradeRequestId) {
        try {
          // Prüfe ob der Trade-Request noch existiert
          const tradeRequestDoc = await getDoc(doc(db, 'tradeRequests', wine.pendingTradeRequestId));
          if (tradeRequestDoc.exists()) {
            const tradeRequestData = tradeRequestDoc.data();
            // Prüfe ob Trade-Request noch pending ist (nicht rejected/accepted)
            if (tradeRequestData.status === 'pending') {
              console.error('❌ Fehler: Wein ist bereits in einem Tausch involviert:', wine.id, 'Trade-Request:', wine.pendingTradeRequestId);
              throw new Error('Dieser Wein ist bereits in einem Tausch involviert');
            } else {
              // Trade-Request existiert, aber ist nicht mehr pending - bereinige Kennzeichnung
              console.log(`🔧 Trade-Request ${wine.pendingTradeRequestId} ist ${tradeRequestData.status}, bereinige Wein-Kennzeichnung...`);
              try {
                await updateDoc(doc(db, 'wines', wine.id), {
                  inTradeRequest: false,
                  pendingTradeRequestId: null,
                  updatedAt: serverTimestamp()
                });
                console.log('✅ Wein-Kennzeichnung bereinigt');
              } catch (cleanupError) {
                console.error('❌ Fehler beim Bereinigen der Wein-Kennzeichnung:', cleanupError);
                // Weiterlaufen - erlaube Tausch trotzdem
              }
            }
          } else {
            // Trade-Request existiert nicht mehr - bereinige Kennzeichnung
            console.log(`🔧 Trade-Request ${wine.pendingTradeRequestId} existiert nicht mehr, bereinige Wein-Kennzeichnung...`);
            try {
              await updateDoc(doc(db, 'wines', wine.id), {
                inTradeRequest: false,
                pendingTradeRequestId: null,
                updatedAt: serverTimestamp()
              });
              console.log('✅ Wein-Kennzeichnung bereinigt (Trade-Request existiert nicht)');
            } catch (cleanupError) {
              console.error('❌ Fehler beim Bereinigen der Wein-Kennzeichnung:', cleanupError);
              // Weiterlaufen - erlaube Tausch trotzdem
            }
          }
        } catch (checkError) {
          // Wenn Prüfung fehlschlägt, erlaube Tausch trotzdem (sicherer Fall)
          console.warn('⚠️ Fehler beim Prüfen des Trade-Requests, erlaube Tausch trotzdem:', checkError);
        }
      }
      
      const requestPayload = {
        fromUserId: fromUser.uid,
        fromUserName: fromUser.username || `${fromUser.firstName} ${fromUser.lastName}`,
        toUserId: toUser.uid,
        toUserName: toUser.username || `${toUser.firstName} ${toUser.lastName}`,
        wineId: wine.id, // Rückwärtskompatibilität
        wineToId: wine.id, // Der Wein, den A (fromUser) haben möchte (von B)
        wineTitle: wine.name || wine.title || 'Wein',
        // wineFromId wird später gesetzt, wenn B (toUser) einen Wein aus A's Regal auswählt
      };

      // Dublettenprüfung
      const existing = await findExistingOpenTradeRequest({
        fromUserId: requestPayload.fromUserId,
        toUserId: requestPayload.toUserId,
        wineId: requestPayload.wineId,
      });
      if (existing?.id) {
        console.log('ℹ️ Trade-Request existiert bereits:', existing.id);
        return existing.id;
      }

      // Erstelle Trade-Request in Firestore
      const requestId = await fsCreateTradeRequest(requestPayload);
      console.log('✅ PHASE3: Trade-Request erstellt:', requestId);
      
      // PHASE3: Markiere Wein als "in Tausch involviert"
      // wine.id ist der Wein von B (Empfänger), den A (Absender) haben möchte
      // Der Wein von A wird später markiert, wenn B einen Wein aus A's Regal auswählt
      try {
        // Markiere nur wine.id (Wein von B) - Wein von A wird später markiert wenn B auswählt
        await markWinesAsInTradeRequest(requestId, null, wine.id);
        console.log('✅ PHASE3: Wein-Kennzeichnung gesetzt für Wein B:', wine.id);
      } catch (markError) {
        console.error('❌ PHASE3: Fehler beim Setzen der Wein-Kennzeichnung:', markError);
        // Weiterlaufen - Trade-Request wurde erstellt
      }
      
      // PHASE3: KEIN direkter Aufruf von ensureTradeNotification mehr
      // Die Subscriptions übernehmen die Erstellung der Hinweise automatisch
      // Dies verhindert Race Conditions und doppelte Hinweise
      
      return requestId;
    } catch (e) {
      console.error('❌ PHASE3: Fehler beim Erstellen der Tauschanfrage:', e);
      // Offline-Queue
      enqueueOfflineTradeRequest({ fromUser, toUser, wine });
      throw e;
    }
  };
  // ============================================
  // PHASE3 ENDE
  // ============================================

  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Hinweis-Struktur mit 2 Hinweisen für B und 1 Hinweis für A
  // Datum: Phase 3 - Schritt 3
  // ============================================
  // PHASE3: Lock-Mechanismus um Race Conditions zu vermeiden
  const processingRequests = new Set();
  
  const ensureTradeNotification = async ({ requestId, payload }) => {
    logNotificationEvent({
      stage: 'ensureTradeNotification/start',
      type: 'hint-decision',
      data: {
        requestId,
        fromUserId: payload?.fromUserId,
        toUserId: payload?.toUserId,
        wineId: payload?.wineId,
      },
    });
    // PHASE3: Lock-Mechanismus - verhindert mehrfache gleichzeitige Ausführung
    if (processingRequests.has(requestId)) {
      console.log('⚠️ PHASE3: ensureTradeNotification läuft bereits für requestId:', requestId, '- überspringe');
      logNotificationEvent({
        stage: 'ensureTradeNotification/skipped',
        type: 'hint-decision',
        data: { requestId, reason: 'already-processing' },
      });
      return;
    }
    
    processingRequests.add(requestId);
    
    try {
      const current = getCurrentUser();
      if (!current || !current.uid) {
        console.log('⚠️ PHASE3: Kein eingeloggter User');
        logNotificationEvent({
          stage: 'ensureTradeNotification/skipped',
          type: 'hint-decision',
          data: { requestId, reason: 'no-current-user' },
        });
        return;
      }
      
      const currentUserId = current.uid;
      
      console.log('🔄 PHASE3: Erstelle Trade-Hinweise...', { requestId, currentUserId, fromUserId: payload.fromUserId, toUserId: payload.toUserId });
      
      // WICHTIG: Prüfe dass fromUserId !== toUserId (kein User sollte mit sich selbst tauschen)
      if (payload.fromUserId === payload.toUserId) {
        console.error('❌ Fehler: Ein User kann nicht mit sich selbst tauschen:', payload.fromUserId);
        logNotificationEvent({
          stage: 'ensureTradeNotification/skipped',
          type: 'hint-decision',
          data: { requestId, reason: 'self-trade', userId: payload.fromUserId },
        });
        return;
      }
      
      // WICHTIG: Nur für den aktuellen User (currentUserId) Hinweise erstellen
      // Wenn A die Funktion aufruft, erstelle nur Hinweise für A
      // Wenn B die Funktion aufruft, erstelle nur Hinweise für B
      const isSender = currentUserId === payload.fromUserId;
      const isReceiver = currentUserId === payload.toUserId;
      
      if (!isSender && !isReceiver) {
        console.log('⚠️ PHASE3: User ist weder Absender noch Empfänger, überspringe:', currentUserId);
        logNotificationEvent({
          stage: 'ensureTradeNotification/skipped',
          type: 'hint-decision',
          data: { requestId, reason: 'not-participant', currentUserId },
        });
        return;
      }
      
      // Prüfe Trade-Request Status - NUR für pending Requests
      const tradeRequest = await getTradeRequest(requestId);
      if (!tradeRequest) {
        console.log('⚠️ Trade-Request nicht gefunden:', requestId);
        logNotificationEvent({
          stage: 'ensureTradeNotification/skipped',
          type: 'hint-decision',
          data: { requestId, reason: 'request-not-found' },
        });
        return;
      }
      
      // WICHTIG: Nur für pending Requests Hinweise/Notifications erstellen
      if (tradeRequest.status !== 'pending') {
        console.log('⚠️ Trade-Request ist nicht mehr pending (Status:', tradeRequest.status, '), überspringe:', requestId);
        logNotificationEvent({
          stage: 'ensureTradeNotification/skipped',
          type: 'hint-decision',
          data: { requestId, reason: 'not-pending', status: tradeRequest.status },
        });
        return;
      }
      
      // PHASE3: Atomare Prüfung - lade ALLE Hinweise für diesen Trade-Request
      const hintsQuery = query(
        collection(db, 'chats'),
        where('tradeRequestId', '==', requestId),
        where('entryType', '==', 'hint')
      );
      const hintsSnapshot = await getDocs(hintsQuery);
      const allHints = hintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Prüfe ZUERST ob bereits ein Entscheidungshinweis für EINEN der beiden User existiert
      // Wenn ja, wurde der Trade-Request bereits behandelt - KEIN neuer Hinweis mehr
      const hasDecisionHint = allHints.some(hint => {
        const isDecision = hint.hintType === 'trade-decision';
        if (!isDecision) return false;
        
        // Prüfe ob für einen der beiden User
        const isForFromUser = hint.userId === payload.fromUserId;
        const isForToUser = hint.userId === payload.toUserId;
        return isForFromUser || isForToUser;
      });
      
      if (hasDecisionHint) {
        console.log('ℹ️ Entscheidungshinweis existiert bereits - Trade-Request wurde behandelt, überspringe Erstellung');
        logNotificationEvent({
          stage: 'ensureTradeNotification/skipped',
          type: 'hint-decision',
          data: { requestId, reason: 'decision-hint-exists' },
        });
        return;
      }
      
      // PHASE3: Erstelle Hinweise NUR für den aktuellen User
      if (isSender) {
        // A (Absender): NUR trade-involved Hinweis - NIEMALS trade-decision!
        console.log('🔍 PHASE3: A (Absender) erstellt Hinweis - currentUserId:', currentUserId, 'fromUserId:', payload.fromUserId);
        
        // PHASE3: WICHTIG - Prüfe ob A bereits einen trade-decision Hinweis hat (sollte nicht passieren, aber sicherheitshalber)
        const existingDecisionHintA = allHints.find(hint => 
          hint.userId === currentUserId && 
          hint.hintType === 'trade-decision'
        );
        
        if (existingDecisionHintA) {
          console.error('❌ PHASE3: A hat bereits einen trade-decision Hinweis - das sollte nicht passieren!', existingDecisionHintA.id);
          // PHASE3: Lösche den falschen Hinweis (soft-delete)
          try {
            await fsDeleteChat(existingDecisionHintA.id, currentUserId);
            console.log('✅ PHASE3: Falscher trade-decision Hinweis für A gelöscht');
          } catch (e) {
            console.error('❌ PHASE3: Fehler beim Löschen des falschen Hinweises:', e);
          }
        }
        
        // PHASE3: Prüfe ob A bereits einen trade-involved Hinweis hat
        const existingHintA = allHints.find(hint => 
          hint.userId === currentUserId && 
          hint.hintType === 'trade-involved'
        );
        
        if (!existingHintA) {
          const hintDataA = {
            entryType: 'hint',
            hintType: 'trade-involved', // PHASE3: WICHTIG - NUR trade-involved, NIEMALS trade-decision für A!
            tradeRequestId: requestId,
            userId: currentUserId, // WICHTIG: Nur userId, kein participants Array!
            status: 'requested', // WICHTIG: Für ChatListScreen Titel-Generierung
            participantNames: [payload.fromUserName, payload.toUserName], // Für getOtherParticipantName
            lastMessage: `Du bist in einen Tausch involviert: Du möchtest mit ${payload.toUserName} den Wein "${payload.wineTitle}" tauschen`,
          lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            wineId: payload.wineId,
            wineTitle: payload.wineTitle,
            unreadCount: 1,
            fromUserId: payload.fromUserId,
            fromUserName: payload.fromUserName,
            toUserId: payload.toUserId,
            toUserName: payload.toUserName
          };
          
          console.log('🔍 PHASE3: Erstelle trade-involved Hinweis für A - hintType:', hintDataA.hintType, 'userId:', hintDataA.userId);
          const hintIdA = await fsCreateTradeHint(hintDataA);
          console.log('✅ PHASE3: Trade-involved Hinweis für A (Absender) erstellt:', hintIdA, '- hintType:', hintDataA.hintType);
          
          // Notification für A
          const notificationDataA = {
            type: 'hint-small',
            title: 'Tausch involviert',
            message: `Du bist in einen Tausch involviert: Du möchtest mit ${payload.toUserName} den Wein "${payload.wineTitle}" tauschen`,
            priority: 'high',
            requestId,
            fromUserId: payload.fromUserId,
            fromUserName: payload.fromUserName,
            toUserId: payload.toUserId,
            toUserName: payload.toUserName,
            wineId: payload.wineId,
            wineTitle: payload.wineTitle
          };
          
          await fsCreateNotification(currentUserId, notificationDataA);
          console.log('✅ PHASE3: Notification für A erstellt');
          logNotificationEvent({
            stage: 'ensureTradeNotification/notification-sender',
            type: 'hint-decision',
            data: {
              requestId,
              userId: currentUserId,
              notificationType: notificationDataA.type,
            },
          });
        } else {
          console.log('ℹ️ Trade-involved Hinweis für A existiert bereits');
        }
        
        // PHASE3: ABSOLUT KRITISCH - Stelle sicher, dass KEIN trade-decision Hinweis für A erstellt wird
        console.log('🔒 PHASE3: Sicherheitscheck - A sollte KEINEN trade-decision Hinweis haben');
      } else if (isReceiver) {
        // B (Empfänger): NUR trade-decision Hinweis - KEIN trade-involved!
        // WICHTIG: Wenn jemand einen Entscheidungshinweis bekommt, braucht sie keinen zusätzlichen kleinen Hinweis,
        // da der Entscheidungshinweis gleichzeitig Entscheidung als auch Info ist
        
        // WICHTIG: Prüfe ob bereits ein trade-involved Hinweis für B existiert und lösche ihn, wenn ein trade-decision erstellt wird
        const existingHintBInvolved = allHints.find(hint => 
          hint.userId === currentUserId && 
          hint.hintType === 'trade-involved' &&
          hint.tradeRequestId === requestId
        );
        
        if (existingHintBInvolved) {
          console.log('🔧 PHASE3: Lösche trade-involved Hinweis für B, da trade-decision erstellt wird:', existingHintBInvolved.id);
          try {
            await fsDeleteChat(existingHintBInvolved.id, currentUserId);
            console.log('✅ PHASE3: Trade-involved Hinweis für B gelöscht');
          } catch (e) {
            console.error('❌ PHASE3: Fehler beim Löschen des trade-involved Hinweises:', e);
          }
        }
        
        // trade-decision Hinweis für B
        const existingHintBDecision = allHints.find(hint => 
          hint.userId === currentUserId && 
          hint.hintType === 'trade-decision'
        );
        
        if (!existingHintBDecision) {
          const hintDataBDecision = {
            entryType: 'hint',
            hintType: 'trade-decision',
            tradeRequestId: requestId,
            userId: currentUserId, // WICHTIG: Nur userId, kein participants Array!
            lastMessage: `Entscheide dich: ${payload.fromUserName} möchte deinen Wein "${payload.wineTitle}" tauschen. Wähle einen Wein aus dem Regal von ${payload.fromUserName} oder lehne ab.`,
            lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            wineId: payload.wineId,
            wineTitle: payload.wineTitle,
            unreadCount: 1,
            status: 'received', // Status für Navigation
            fromUserId: payload.fromUserId,
            fromUserName: payload.fromUserName,
            toUserId: payload.toUserId,
            toUserName: payload.toUserName
          };
          
          const hintIdBDecision = await fsCreateTradeHint(hintDataBDecision);
          console.log('✅ PHASE3: Trade-decision Hinweis für B erstellt:', hintIdBDecision);
          
          // Notification für B (trade-decision)
          const notificationDataBDecision = {
        type: 'hint-decision',
        title: `Tauschanfrage von ${payload.fromUserName}`,
            message: `${payload.fromUserName} möchte deinen Wein "${payload.wineTitle}" tauschen. Entscheide dich!`,
        priority: 'high',
        requestId,
        fromUserId: payload.fromUserId,
        fromUserName: payload.fromUserName,
        toUserId: payload.toUserId,
            toUserName: payload.toUserName,
        wineId: payload.wineId,
            wineTitle: payload.wineTitle
          };
          
          await fsCreateNotification(currentUserId, notificationDataBDecision);
          console.log('✅ PHASE3: Trade-decision Notification für B erstellt');
          logNotificationEvent({
            stage: 'ensureTradeNotification/notification-receiver',
            type: 'hint-decision',
            data: {
              requestId,
              userId: currentUserId,
              notificationType: notificationDataBDecision.type,
            },
          });
        } else {
          console.log('ℹ️ Trade-decision Hinweis für B existiert bereits');
        }
      }
      
      console.log('✅ PHASE3: Trade-Hinweise für User', currentUserId, 'erstellt');
    } catch (error) {
      console.error('❌ PHASE3: Fehler beim Erstellen von Trade-Hinweisen/Notifications:', error);
      logNotificationEvent({
        stage: 'ensureTradeNotification/error',
        type: 'hint-decision',
        data: { requestId },
        meta: { message: error?.message },
      });
    } finally {
      logNotificationEvent({
        stage: 'ensureTradeNotification/finish',
        type: 'hint-decision',
        data: { requestId },
      });
      // PHASE3: Entferne Lock nach 2 Sekunden (gibt Zeit für Firestore-Update)
      setTimeout(() => {
        processingRequests.delete(requestId);
      }, 2000);
    }
  };
  // ============================================
  // PHASE3 ENDE
  // ============================================

  const trimNotifications = (list) => {
    const MAX = 100;
    return list.slice(0, MAX);
  };

  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Entscheidungshinweise für beide User bei Ablehnung/Akzeptierung
  // Datum: Phase 3 - Schritt 4
  // ============================================
  const createTradeDecisionHints = async ({ requestId, decision, tradeRequest, selectedWineId = null, rejectedBy = null }) => {
    logNotificationEvent({
      stage: 'createTradeDecisionHints/start',
      type: 'trade-decision',
      data: {
        requestId,
        decision,
        rejectedBy,
        selectedWineId,
      },
    });
    try {
      console.log('🔄 PHASE3: Erstelle Entscheidungshinweise...', { requestId, decision, selectedWineId, rejectedBy });
      
      if (!tradeRequest || !requestId) {
        console.error('❌ PHASE3: Trade-Request Daten fehlen für Entscheidungshinweise');
        logNotificationEvent({
          stage: 'createTradeDecisionHints/skipped',
          type: 'trade-decision',
          data: { requestId, decision, reason: 'missing-trade-request' },
        });
        return;
      }

      const fromUserId = tradeRequest.fromUserId;
      const toUserId = tradeRequest.toUserId;
      const fromUserName = tradeRequest.fromUserName || 'Unbekannt';
      const toUserName = tradeRequest.toUserName || 'Unbekannt';
      const wineTitle = tradeRequest.wineTitle || 'Wein';

      // PHASE3: Prüfe ob bereits Entscheidungshinweise mit DIESEM Status existieren (verhindert Duplikate)
      // Lade ALLE Hinweise für diesen Trade-Request (nicht nur trade-decision)
      const hintsQuery = query(
        collection(db, 'chats'),
        where('tradeRequestId', '==', requestId),
        where('entryType', '==', 'hint')
      );
      const hintsSnapshot = await getDocs(hintsQuery);
      const allExistingHints = hintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // PHASE3: Bei Ablehnung - wer hat abgelehnt bestimmt, wer den kleinen Hinweis bekommt
      // Wenn A ablehnt: B bekommt trade-involved Hinweis (kleiner Hinweis)
      // Wenn B ablehnt: A bekommt trade-involved Hinweis (kleiner Hinweis)
      // Wenn rejectedBy nicht übergeben wurde, bestimme es aus dem Trade-Request (rejectedBy Feld)
      let actualRejectedBy = rejectedBy;
      if (!actualRejectedBy && decision === 'rejected' && tradeRequest.rejectedBy) {
        // Versuche rejectedBy aus Trade-Request zu extrahieren
        if (tradeRequest.rejectedBy === 'fromUser' || tradeRequest.rejectedBy === fromUserId) {
          actualRejectedBy = 'fromUser';
        } else if (tradeRequest.rejectedBy === 'toUser' || tradeRequest.rejectedBy === toUserId) {
          actualRejectedBy = 'toUser';
        }
      }
      
      // Fallback: Wenn immer noch nicht bestimmt, verwende toUser (Standard: B lehnt ab)
      if (!actualRejectedBy && decision === 'rejected') {
        actualRejectedBy = 'toUser';
        console.log('⚠️ PHASE3: rejectedBy nicht bestimmt, verwende Standard: toUser (B lehnt ab)');
        logNotificationEvent({
          stage: 'createTradeDecisionHints/fallback-rejectedBy',
          type: 'trade-decision',
          data: { requestId, decision, fallback: 'toUser' },
        });
      }
      
      let shouldCreateHintForA = false;
      let shouldCreateHintForB = false;
      
      if (decision === 'rejected' && actualRejectedBy) {
        if (actualRejectedBy === 'fromUser') {
          // A hat abgelehnt -> B bekommt kleinen Hinweis
          shouldCreateHintForB = true;
        } else if (actualRejectedBy === 'toUser') {
          // B hat abgelehnt -> A bekommt kleinen Hinweis
          shouldCreateHintForA = true;
        }
      } else if (decision === 'accepted') {
        // Bei Annahme: A bekommt trade-involved, B bekommt trade-decision
        shouldCreateHintForA = true;
        shouldCreateHintForB = true;
      }
      
      // VERBESSERT: Prüfe ob bereits Hinweise mit gleichem hintType und tradeRequestId existieren
      // WICHTIG: Prüfe unabhängig vom Status, um Duplikate zu vermeiden
      const hasHintForA = allExistingHints.some(hint => 
        hint.userId === fromUserId && 
        hint.hintType === 'trade-involved' && 
        hint.tradeRequestId === requestId &&
        !hint.deletedBy // WICHTIG: Gelöschte Hinweise nicht berücksichtigen
      );
      const expectedHintTypeForB = decision === 'accepted' ? 'trade-decision' : 'trade-involved';
      const hasHintForB = allExistingHints.some(hint => 
        hint.userId === toUserId && 
        hint.hintType === expectedHintTypeForB && 
        hint.tradeRequestId === requestId &&
        !hint.deletedBy // WICHTIG: Gelöschte Hinweise nicht berücksichtigen
      );
      
      if ((shouldCreateHintForA && hasHintForA) || (shouldCreateHintForB && hasHintForB)) {
        console.log('ℹ️ PHASE3: Hinweise mit hintType und tradeRequestId existieren bereits, aktualisiere stattdessen');
        logNotificationEvent({
          stage: 'createTradeDecisionHints/update-existing',
          type: 'trade-decision',
          data: {
            requestId,
            decision,
            hasHintForA,
            hasHintForB,
          },
        });
        // VERBESSERT: Statt zu überspringen, aktualisiere die bestehenden Hinweise
        // Dies wird weiter unten in der Funktion behandelt
      }

      // Bestimme Message basierend auf Entscheidung
      let hintMessageForA, hintMessageForB, notificationTitleForA, notificationTitleForB, notificationMessageForA, notificationMessageForB;

      if (decision === 'accepted') {
        hintMessageForA = `Tauschanfrage angenommen: ${toUserName} hat deine Tauschanfrage für den Wein "${wineTitle}" angenommen`;
        hintMessageForB = `Tauschanfrage angenommen: Du hast die Tauschanfrage von ${fromUserName} für den Wein "${wineTitle}" angenommen`;
        notificationTitleForA = 'Tauschanfrage angenommen';
        notificationTitleForB = 'Tauschanfrage angenommen';
        notificationMessageForA = `${toUserName} hat deine Tauschanfrage für den Wein "${wineTitle}" angenommen`;
        notificationMessageForB = `Du hast die Tauschanfrage von ${fromUserName} für den Wein "${wineTitle}" angenommen`;
      } else if (decision === 'rejected') {
        // WICHTIG: Wer hat abgelehnt bestimmt die Nachrichten
        // Verwende actualRejectedBy (kann aus rejectedBy Parameter oder tradeRequest kommen)
        const actualRejectedBy = rejectedBy || (tradeRequest.rejectedBy === 'fromUser' || tradeRequest.rejectedBy === fromUserId ? 'fromUser' : 'toUser');
        
        if (actualRejectedBy === 'fromUser') {
          // A (Absender) hat abgelehnt -> B bekommt kleinen Hinweis
          hintMessageForA = `Tauschanfrage abgelehnt: Du hast deine Tauschanfrage für den Wein "${wineTitle}" abgelehnt`;
          hintMessageForB = `Tauschanfrage abgelehnt: ${fromUserName} hat die Tauschanfrage für den Wein "${wineTitle}" abgelehnt`;
          notificationTitleForA = 'Tauschanfrage abgelehnt';
          notificationTitleForB = 'Tauschanfrage abgelehnt';
          notificationMessageForA = `Du hast deine Tauschanfrage für den Wein "${wineTitle}" abgelehnt`;
          notificationMessageForB = `${fromUserName} hat die Tauschanfrage für den Wein "${wineTitle}" abgelehnt`;
        } else {
          // B (Empfänger) hat abgelehnt -> A bekommt kleinen Hinweis (Standard)
          hintMessageForA = `Tauschanfrage abgelehnt: ${toUserName} hat deine Tauschanfrage für den Wein "${wineTitle}" abgelehnt`;
          hintMessageForB = `Tauschanfrage abgelehnt: Du hast die Tauschanfrage von ${fromUserName} für den Wein "${wineTitle}" abgelehnt`;
          notificationTitleForA = 'Tauschanfrage abgelehnt';
          notificationTitleForB = 'Tauschanfrage abgelehnt';
          notificationMessageForA = `${toUserName} hat deine Tauschanfrage für den Wein "${wineTitle}" abgelehnt`;
          notificationMessageForB = `Du hast die Tauschanfrage von ${fromUserName} für den Wein "${wineTitle}" abgelehnt`;
        }
      } else {
        console.error('❌ PHASE3: Unbekannte Entscheidung:', decision);
        logNotificationEvent({
          stage: 'createTradeDecisionHints/skipped',
          type: 'trade-decision',
          data: { requestId, decision, reason: 'unknown-decision' },
        });
        return;
      }

      // PHASE3: Erstelle Hinweis für A (Absender) - nur wenn nötig
      // Bei Ablehnung durch B: A bekommt trade-involved Hinweis (kleiner Hinweis)
      // Bei Annahme: A bekommt trade-involved Hinweis
      if (shouldCreateHintForA) {
        // VERBESSERT: Prüfe ob bereits ein trade-involved Hinweis für A existiert (unabhängig vom Status)
        const existingInvolvedHintA = allExistingHints.find(hint => 
          hint.userId === fromUserId && 
          hint.hintType === 'trade-involved' &&
          hint.tradeRequestId === requestId &&
          !hint.deletedBy // WICHTIG: Gelöschte Hinweise nicht berücksichtigen
        );
        
        // Erstelle oder aktualisiere trade-involved Hinweis für A
        if (existingInvolvedHintA) {
          // Aktualisiere bestehenden trade-involved Hinweis
          await fsUpdateTradeHint(existingInvolvedHintA.id, {
            status: decision,
            lastMessage: hintMessageForA,
            lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            unreadCount: 1
          });
          console.log('✅ PHASE3: Trade-involved Hinweis für A aktualisiert:', existingInvolvedHintA.id);
          logNotificationEvent({
            stage: 'createTradeDecisionHints/update-hint',
            type: 'trade-decision',
            data: {
              requestId,
              decision,
              userId: fromUserId,
              hintId: existingInvolvedHintA.id,
              hintType: 'trade-involved',
            },
          });
        } else {
          // Erstelle neuen trade-involved Hinweis für A
          const hintDataForA = {
            entryType: 'hint', // PHASE3: WICHTIG für Filterung
            hintType: 'trade-involved', // WICHTIG: A bekommt NUR trade-involved, KEIN trade-decision!
            status: decision,
            tradeRequestId: requestId,
            userId: fromUserId, // WICHTIG: Nur userId, kein participants Array!
            participantNames: [fromUserName, toUserName], // Für getOtherParticipantName
            lastMessage: hintMessageForA,
            lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            wineId: tradeRequest.wineId,
            wineTitle,
            unreadCount: 1,
            selectedWineId: selectedWineId || null,
            fromUserId,
            fromUserName,
            toUserId,
            toUserName
          };

          const hintIdForA = await fsCreateTradeHint(hintDataForA);
          console.log('✅ PHASE3: Trade-involved Hinweis für A erstellt:', hintIdForA);
          logNotificationEvent({
            stage: 'createTradeDecisionHints/create-hint',
            type: 'trade-decision',
            data: {
              requestId,
              decision,
              userId: fromUserId,
              hintId: hintIdForA,
              hintType: 'trade-involved',
            },
          });
        }

        // Notification für A
        const notificationDataForA = {
          type: 'hint-small',
          title: notificationTitleForA,
          message: notificationMessageForA,
          priority: 'high',
          requestId,
          fromUserId,
          fromUserName,
          toUserId,
          toUserName,
          wineId: tradeRequest.wineId,
          wineTitle
        };

        await fsCreateNotification(fromUserId, notificationDataForA);
        console.log('✅ PHASE3: Notification für A erstellt');
        logNotificationEvent({
          stage: 'createTradeDecisionHints/notification',
          type: 'trade-decision',
          data: {
            requestId,
            decision,
            userId: fromUserId,
            notificationType: notificationDataForA.type,
          },
        });
      }

      // PHASE3: Erstelle Hinweis für B (Empfänger) - nur wenn nötig
      // Bei Ablehnung durch A: B bekommt trade-involved Hinweis (kleiner Hinweis)
      // Bei Annahme: B bekommt trade-decision Hinweis
      if (shouldCreateHintForB) {
        const hintTypeForB = decision === 'rejected' ? 'trade-involved' : 'trade-decision';
        
        // VERBESSERT: Prüfe ob bereits ein Hinweis für B existiert (unabhängig vom Status)
        const existingHintB = allExistingHints.find(hint => 
          hint.userId === toUserId && 
          hint.hintType === hintTypeForB &&
          hint.tradeRequestId === requestId &&
          !hint.deletedBy // WICHTIG: Gelöschte Hinweise nicht berücksichtigen
        );
        
        // Erstelle oder aktualisiere Hinweis für B
        if (existingHintB) {
          // Aktualisiere bestehenden Hinweis
          await fsUpdateTradeHint(existingHintB.id, {
            status: decision,
            hintType: hintTypeForB, // WICHTIG: Bei Ablehnung durch A ist es trade-involved
            lastMessage: hintMessageForB,
            lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            unreadCount: 1
          });
          console.log(`✅ PHASE3: ${hintTypeForB} Hinweis für B aktualisiert:`, existingHintB.id);
          logNotificationEvent({
            stage: 'createTradeDecisionHints/update-hint',
            type: 'trade-decision',
            data: {
              requestId,
              decision,
              userId: toUserId,
              hintId: existingHintB.id,
              hintType: hintTypeForB,
            },
          });
        } else {
          // Erstelle neuen Hinweis für B
          const hintDataForB = {
            entryType: 'hint', // PHASE3: WICHTIG für Filterung
            hintType: hintTypeForB, // WICHTIG: Bei Ablehnung durch A ist es trade-involved, bei Annahme trade-decision
            status: decision,
            tradeRequestId: requestId,
            userId: toUserId, // WICHTIG: Nur userId, kein participants Array!
            participantNames: [fromUserName, toUserName], // Für getOtherParticipantName
            lastMessage: hintMessageForB,
            lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            wineId: tradeRequest.wineId,
            wineTitle,
            unreadCount: 1,
            selectedWineId: selectedWineId || null,
            fromUserId,
            fromUserName,
            toUserId,
            toUserName
          };

          const hintIdForB = await fsCreateTradeHint(hintDataForB);
          console.log(`✅ PHASE3: ${hintTypeForB} Hinweis für B erstellt:`, hintIdForB);
          logNotificationEvent({
            stage: 'createTradeDecisionHints/create-hint',
            type: 'trade-decision',
            data: {
              requestId,
              decision,
              userId: toUserId,
              hintId: hintIdForB,
              hintType: hintTypeForB,
            },
          });
        }

        // WICHTIG: Notification für B immer erstellen (auch wenn Hinweis bereits existiert)
        // Dies stellt sicher, dass die Notification beim Angefragten angezeigt wird
        const notificationDataForB = {
          type: 'hint-small',
          title: notificationTitleForB,
          message: notificationMessageForB,
          priority: 'high',
          requestId,
          fromUserId,
          fromUserName,
          toUserId,
          toUserName,
          wineId: tradeRequest.wineId,
          wineTitle
        };

        await fsCreateNotification(toUserId, notificationDataForB);
        console.log('✅ PHASE3: Notification für B erstellt (toUserId:', toUserId, ')');
        logNotificationEvent({
          stage: 'createTradeDecisionHints/notification',
          type: 'trade-decision',
          data: {
            requestId,
            decision,
            userId: toUserId,
            notificationType: notificationDataForB.type,
          },
        });
      }

      // WICHTIG: Wein-Kennzeichnung wird bereits in declineTradeRequestSimple entfernt
      // Hier nicht mehr entfernen, um Doppelung zu vermeiden

      console.log('✅ PHASE3: Alle Entscheidungshinweise erstellt');
      logNotificationEvent({
        stage: 'createTradeDecisionHints/success',
        type: 'trade-decision',
        data: {
          requestId,
          decision,
          createdHintForA: shouldCreateHintForA,
          createdHintForB: shouldCreateHintForB,
        },
      });
    } catch (error) {
      console.error('❌ PHASE3: Fehler beim Erstellen von Entscheidungshinweisen/Notifications:', error);
      logNotificationEvent({
        stage: 'createTradeDecisionHints/error',
        type: 'trade-decision',
        data: { requestId, decision },
        meta: { message: error?.message },
      });
    }
  };
  // ============================================
  // PHASE3 ENDE
  // ============================================

  // Erstelle Chat-Notification für beide Teilnehmer eines neuen Chats
  const createChatNotificationForBothParticipants = (chat, message) => {
    if (!chat || !chat.participants || chat.participants.length < 2) {
      return;
    }
    
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid;
    
    if (!currentUserId) return;
    
    // Finde den anderen Teilnehmer
    const otherParticipantId = chat.participants.find(pid => pid !== currentUserId);
    const otherParticipantIndex = chat.participants.findIndex(pid => pid !== currentUserId);
    const otherParticipantName = chat.participantNames?.[otherParticipantIndex] || 'Unbekannt';
    
    if (!otherParticipantId) return;
    
    // Erstelle Notification für den aktuellen User (der den Chat erstellt hat)
    const notificationForCurrentUser = {
      id: `chat-created-${chat.id}-${currentUserId}`,
      type: 'chat',
      title: 'Neuer Chat erstellt',
      message: message || `Chat mit ${otherParticipantName} gestartet`,
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      priority: 'medium',
      chatId: chat.id,
      chatRef: chat,
      toUserId: currentUserId,
    };
    
    // Füge Notification hinzu und speichere in AsyncStorage
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notificationForCurrentUser.id);
      if (exists) return prev;
      
      const next = trimNotifications([notificationForCurrentUser, ...prev]);
      AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(next)).catch(err => {
        console.error('❌ Error saving chat notification to AsyncStorage:', err);
      });
      return next;
    });
    
    // WICHTIG: unreadNotifications wird automatisch durch useEffect berechnet
    // Keine manuelle Erhöhung mehr - verhindert Doppelzählung
    
    console.log('✅ Chat-Notification erstellt für User:', currentUserId);
  };

  const enqueueOfflineTradeRequest = async ({ fromUser, toUser, wine }) => {
    try {
      const entry = {
        id: `offline-tr-${Date.now()}`,
        fromUser,
        toUser,
        wine,
        createdAt: Date.now(),
      };
      const raw = await AsyncStorage.getItem('bt-trade-queue');
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(entry);
      await AsyncStorage.setItem('bt-trade-queue', JSON.stringify(queue));
      console.log('✅ Offline trade request enqueued');
    } catch (err) {
      console.error('❌ Failed to enqueue offline trade request:', err);
    }
  };

  const processOfflineTradeQueue = async () => {
    try {
      const raw = await AsyncStorage.getItem('bt-trade-queue');
      const queue = raw ? JSON.parse(raw) : [];
      if (!queue.length) return;
      const remaining = [];
      for (const item of queue) {
        try {
          await createTradeRequest({ fromUser: item.fromUser, toUser: item.toUser, wine: item.wine });
        } catch (err) {
          remaining.push(item);
        }
      }
      await AsyncStorage.setItem('bt-trade-queue', JSON.stringify(remaining));
      console.log('🔄 Offline queue processed, remaining:', remaining.length);
    } catch (err) {
      console.error('❌ Failed processing offline queue:', err);
    }
  };

  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Trade-Request-Ablehnung mit Validierung und Entscheidungshinweisen
  // Datum: Phase 3 - Schritt 5
  // ============================================
  // PHASE3: Lock-Mechanismus um mehrfache Ablehnungen zu vermeiden
  const decliningRequests = new Set();
  
  const declineTradeRequestSimple = async ({ requestId, otherUserId }) => {
    // PHASE3: Lock-Mechanismus - verhindert mehrfache gleichzeitige Ablehnungen
    if (decliningRequests.has(requestId)) {
      console.log('⚠️ PHASE3: Ablehnung läuft bereits für requestId:', requestId, '- überspringe');
      return;
    }
    
    decliningRequests.add(requestId);
    
    try {
      console.log('🔄 PHASE3: Lehne Trade-Request ab...', { requestId, otherUserId });
      
      if (!requestId) {
        console.error('❌ PHASE3: Keine requestId angegeben');
        return;
      }
      
      const current = getCurrentUser();
      const currentUserId = current?.uid;
      
      if (!currentUserId) {
        console.error('❌ PHASE3: Kein User gefunden für Ablehnung');
        return;
      }
      
      // Lade Trade-Request-Daten
      const tradeRequest = await getTradeRequest(requestId);
      if (!tradeRequest) {
        console.error('❌ PHASE3: Trade-Request nicht gefunden:', requestId);
        return;
      }
      
      // PHASE3: WICHTIG - Beide (A und B) können ablehnen
      // A (Absender) kann ablehnen -> B bekommt kleinen Hinweis
      // B (Empfänger) kann ablehnen -> A bekommt kleinen Hinweis
      const isFromUser = currentUserId === tradeRequest.fromUserId;
      const isToUser = currentUserId === tradeRequest.toUserId;
      
      if (!isFromUser && !isToUser) {
        console.error('❌ PHASE3: Nur Absender (A) oder Empfänger (B) können eine Tauschanfrage ablehnen! Aktueller User:', currentUserId);
        throw new Error('Nur Absender oder Empfänger können eine Tauschanfrage ablehnen');
      }
      
      // Prüfe ob Trade-Request bereits behandelt wurde
      if (tradeRequest.status !== 'pending') {
        console.log('⚠️ PHASE3: Trade-Request ist bereits behandelt (Status:', tradeRequest.status, '), überspringe Ablehnung');
        return;
      }
      
      // PHASE3: Bestimme wer abgelehnt hat (A oder B)
      const rejectedBy = isFromUser ? 'fromUser' : 'toUser';
      console.log(`📊 PHASE3: ${rejectedBy === 'fromUser' ? 'A (Absender)' : 'B (Empfänger)'} lehnt Trade-Request ab`);
      
      // PHASE3: Setze Status auf rejected mit rejectedBy Information
      try {
        await fsUpdateTradeRequestStatus(requestId, { 
          status: 'rejected',
          rejectedBy: rejectedBy === 'fromUser' ? tradeRequest.fromUserId : tradeRequest.toUserId,
          rejectedAt: serverTimestamp()
        });
        console.log('✅ PHASE3: Trade-Request Status auf rejected gesetzt:', requestId);
        
        // WICHTIG: Warte kurz, damit Firestore die Änderung verarbeitet
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // VERIFIZIERUNG: Lade Trade-Request erneut um zu prüfen ob Status wirklich gesetzt wurde
        const verifyRequest = await getTradeRequest(requestId);
        if (verifyRequest && verifyRequest.status === 'rejected') {
          console.log('✅ PHASE3: Verifiziert - Trade-Request Status ist wirklich rejected');
        } else {
          console.error('❌ PHASE3: FEHLER - Trade-Request Status wurde NICHT auf rejected gesetzt! Aktueller Status:', verifyRequest?.status);
          throw new Error('Trade-Request Status konnte nicht auf rejected gesetzt werden');
        }
        
        // PHASE3: Lösche abgelehnten Trade-Request sofort aus Firestore
        try {
          await fsDeleteTradeRequest(requestId);
          console.log('✅ PHASE3: Abgelehnter Trade-Request gelöscht:', requestId);
        } catch (deleteError) {
          console.error('❌ PHASE3: Fehler beim Löschen des abgelehnten Trade-Requests (nicht kritisch):', deleteError);
          // Weiterlaufen - Hinweise wurden bereits erstellt
        }
      } catch (updateError) {
        console.error('❌ PHASE3: Fehler beim Setzen des Trade-Request Status auf rejected:', updateError);
        throw updateError;
      }
      
      // PHASE3: Aktualisiere tradeRequest Objekt mit rejectedBy für createTradeDecisionHints
      const updatedTradeRequest = {
        ...tradeRequest,
        rejectedBy: rejectedBy === 'fromUser' ? tradeRequest.fromUserId : tradeRequest.toUserId,
        status: 'rejected'
      };
      
      // PHASE3: Entferne Wein-Kennzeichnung BEVOR wir die Hinweise erstellen
      // WICHTIG: Dies muss auch passieren, wenn createTradeDecisionHints fehlschlägt
      try {
        await unmarkWinesFromTradeRequest(requestId);
        console.log('✅ PHASE3: Wein-Kennzeichnung entfernt für abgelehnten Trade-Request');
      } catch (unmarkError) {
        console.error('❌ PHASE3: Fehler beim Entfernen der Wein-Kennzeichnung:', unmarkError);
        // Weiterlaufen - Trade-Request ist bereits auf rejected gesetzt
      }
      
      // PHASE3: Erstelle Entscheidungshinweise für beide User
      // WICHTIG: Auch wenn createTradeDecisionHints fehlschlägt, ist der Status bereits auf rejected gesetzt
      try {
        await createTradeDecisionHints({
          requestId,
          decision: 'rejected',
          tradeRequest: updatedTradeRequest,
          rejectedBy: rejectedBy // WICHTIG: Übergebe wer abgelehnt hat
        });
        console.log('✅ PHASE3: Tauschanfrage abgelehnt - Hinweise und Notifications erstellt:', requestId);
      } catch (hintsError) {
        // WICHTIG: Auch wenn Hinweise fehlschlagen, ist der Trade-Request bereits abgelehnt
        console.error('❌ PHASE3: Fehler beim Erstellen der Entscheidungshinweise (Trade-Request ist trotzdem abgelehnt):', hintsError);
        // Weiterlaufen - Trade-Request ist bereits auf rejected gesetzt
      }
      
      // WICHTIG: Zeige Hinweis, dass der Tausch abgelehnt wurde
      Alert.alert(
        'Tauschanfrage abgelehnt',
        'Sie haben die Tauschanfrage abgelehnt. Es findet kein Tausch statt.',
        [{ 
          text: 'OK',
          onPress: () => {
            // Navigation zurück zur Chat-Liste oder Notifications
            console.log('✅ Navigation nach Ablehnung');
          }
        }]
      );
    } catch (e) {
      console.error('❌ PHASE3: Fehler beim Ablehnen der Tauschanfrage:', e);
      console.error('❌ Fehlerdetails:', JSON.stringify(e, null, 2));
      
      // Zeige Fehler-Alert
      Alert.alert(
        'Fehler',
        `Die Tauschanfrage konnte nicht abgelehnt werden: ${e.message || 'Unbekannter Fehler'}`,
        [{ text: 'OK' }]
      );
      
      throw e; // Weiterwerfen für UI-Feedback
    } finally {
      // PHASE3: Entferne Lock nach 2 Sekunden
      setTimeout(() => {
        decliningRequests.delete(requestId);
      }, 2000);
    }
  };
  // ============================================
  // PHASE3 ENDE
  // ============================================

  const handleTradeAcceptNavigateToForeignCellar = ({ notification }) => {
    // B wählt Wein aus dem Regal von A
    setCurrentScreen('mein-weinregal');
    setRoute({ params: { viewUserId: notification.fromUserId, tradeRequestId: notification.requestId } });
  };

  // ============================================
  // PHASE3: NEU PROGRAMMIERT
  // Grund: Trade-Akzeptierung mit Chat-Erstellung und Wein-Entfernung
  // Datum: Phase 3 - Schritt 6
  // ============================================
  const handleSelectTradeWine = async ({ tradeRequestId, otherUserId, selectedWine }) => {
    try {
      console.log('🔄 PHASE3: Akzeptiere Trade-Request...', { tradeRequestId, otherUserId, selectedWineId: selectedWine?.id });
      
      if (!tradeRequestId || !selectedWine || !selectedWine.id) {
        console.error('❌ PHASE3: Fehlende Daten für Trade-Akzeptierung');
        throw new Error('Fehlende Daten für Trade-Akzeptierung');
      }
      
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;
      
      if (!currentUserId) {
        console.error('❌ PHASE3: Kein User gefunden für Trade-Akzeptierung');
        throw new Error('Kein User gefunden');
      }
      
      // Lade Trade-Request Daten
      const tradeRequest = await getTradeRequest(tradeRequestId);
      if (!tradeRequest) {
        console.error('❌ PHASE3: Trade-Request nicht gefunden:', tradeRequestId);
        throw new Error('Trade-Request nicht gefunden');
      }
      
      // PHASE3: Prüfe ob nur B (Empfänger) akzeptieren kann
      const isToUser = currentUserId === tradeRequest.toUserId;
      if (!isToUser) {
        console.error('❌ PHASE3: Nur der Empfänger (B) kann eine Tauschanfrage akzeptieren!');
        throw new Error('Nur der Empfänger kann eine Tauschanfrage akzeptieren');
      }
      
      // Prüfe ob Trade-Request bereits behandelt wurde
      if (tradeRequest.status !== 'pending') {
        console.log('⚠️ PHASE3: Trade-Request ist bereits behandelt (Status:', tradeRequest.status, '), überspringe Akzeptierung');
        return;
      }
      
      // PHASE3: Setze Status auf accepted
      await fsUpdateTradeRequestStatus(tradeRequestId, { 
        status: 'accepted', 
        selectedWineId: selectedWine.id,
        wineFromId: selectedWine.id // Der Wein, den A (fromUser) anbietet (wird von B ausgewählt)
      });
      console.log('✅ PHASE3: Trade-Request Status auf accepted gesetzt');
      
      // PHASE3: Lösche beendeten Trade-Request sofort aus Firestore
      try {
        await fsDeleteTradeRequest(tradeRequestId);
        console.log('✅ PHASE3: Beendeter Trade-Request gelöscht:', tradeRequestId);
      } catch (deleteError) {
        console.error('❌ PHASE3: Fehler beim Löschen des beendeten Trade-Requests (nicht kritisch):', deleteError);
        // Weiterlaufen - Trade wurde bereits durchgeführt
      }
      
      // PHASE3: Markiere beide Weine als "in Tausch involviert"
      // Wein A: Der Wein, den A anbietet (tradeRequest.wineId - der Wein von B, den A möchte)
      // Wein B: Der Wein, den B auswählt (selectedWine.id - der Wein von A, den B möchte)
      try {
        await markWinesAsInTradeRequest(tradeRequestId, selectedWine.id, tradeRequest.wineId);
        console.log('✅ PHASE3: Wein-Kennzeichnung gesetzt für beide Weine');
      } catch (markError) {
        console.error('❌ PHASE3: Fehler beim Setzen der Wein-Kennzeichnung:', markError);
        // Weiterlaufen - Trade-Request wurde akzeptiert
      }
      
      // PHASE3: Erstelle Entscheidungshinweise für beide User
      await createTradeDecisionHints({
        requestId: tradeRequestId,
        decision: 'accepted',
        tradeRequest,
        selectedWineId: selectedWine.id
      });
      
      // PHASE3: Entferne beide Weine aus der Weinbörse (unpublish) und markiere als getauscht
      try {
        // Entferne Wein B (der Wein, den B auswählt - selectedWine.id) aus Weinbörse
        await unpublishWine(selectedWine.id);
        console.log('✅ PHASE3: Wein B aus Weinbörse entfernt:', selectedWine.id);
        
        // Markiere Wein B als "traded" (getauscht) - wird nicht mehr im Regal angezeigt
        await fsUpdateWine(selectedWine.id, {
          status: 'traded',
          tradedAt: serverTimestamp(),
          availableForTrade: false,
          inTradeRequest: false,
          pendingTradeRequestId: null
        });
        console.log('✅ PHASE3: Wein B als getauscht markiert:', selectedWine.id);
        
        // Entferne Wein A (der Wein, den A anbietet - tradeRequest.wineId) aus Weinbörse
        await unpublishWine(tradeRequest.wineId);
        console.log('✅ PHASE3: Wein A aus Weinbörse entfernt:', tradeRequest.wineId);
        
        // Markiere Wein A als "traded" (getauscht) - wird nicht mehr im Regal angezeigt
        await fsUpdateWine(tradeRequest.wineId, {
          status: 'traded',
          tradedAt: serverTimestamp(),
          availableForTrade: false,
          inTradeRequest: false,
          pendingTradeRequestId: null
        });
        console.log('✅ PHASE3: Wein A als getauscht markiert:', tradeRequest.wineId);
      } catch (unpublishError) {
        console.error('❌ PHASE3: Fehler beim Entfernen/Markieren der Weine:', unpublishError);
        // Weiterlaufen - Trade-Request wurde akzeptiert
      }
      
      // PHASE3: Bestimme den anderen User korrekt
      const actualOtherUserId = tradeRequest.fromUserId; // A (Absender)
      const otherUserName = tradeRequest.fromUserName || 'Unbekannt';
      
      // PHASE3: Prüfe ob bereits ein Chat existiert (ALLE Chats mit diesem tradeRequestId, nicht nur entryType: 'chat')
      // WICHTIG: Prüfe ALLE Chats, um Duplikate zu vermeiden
      const chatsQuery = query(
        collection(db, 'chats'),
        where('tradeRequestId', '==', tradeRequestId)
      );
      const existingChatsSnapshot = await getDocs(chatsQuery);
      let existingChat = null;
      
      // VERBESSERT: Filtere nach echten Chats (entryType: 'chat' oder kein entryType für Rückwärtskompatibilität)
      // WICHTIG: Prüfe auch ob Chat gelöscht wurde
      const realChats = existingChatsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(chat => {
          // Nur echte Chats (entryType: 'chat' oder kein entryType)
          // KEINE Hinweise (entryType: 'hint')
          if (chat.entryType === 'hint' || (chat.entryType && chat.entryType !== 'chat')) {
            return false;
          }
          // WICHTIG: Gelöschte Chats nicht verwenden
          if (chat.deletedBy) {
            if (Array.isArray(chat.deletedBy) && chat.deletedBy.length > 0) {
              return false; // Chat wurde gelöscht
            } else if (chat.deletedBy) {
              return false; // Chat wurde gelöscht
            }
          }
          if (chat.deleted === true) {
            return false; // Chat wurde gelöscht
          }
          return true;
        });
      
      if (realChats.length > 0) {
        existingChat = realChats[0];
        console.log('✅ PHASE3: Bestehender gültiger Chat gefunden für tradeRequestId:', tradeRequestId, 'Chat-ID:', existingChat.id);
        
        // WICHTIG: Wenn mehrere Chats existieren, lösche die Duplikate
        if (realChats.length > 1) {
          console.warn(`⚠️ PHASE3: ${realChats.length} Chats gefunden für tradeRequestId ${tradeRequestId}, lösche Duplikate...`);
          const batch = writeBatch(db);
          // Behalte den ersten Chat, lösche die restlichen
          for (let i = 1; i < realChats.length; i++) {
            const duplicateChat = realChats[i];
            batch.update(doc(db, 'chats', duplicateChat.id), {
              deleted: true,
              deletedAt: serverTimestamp(),
              deletedBy: 'system'
            });
            console.log(`🗑️ PHASE3: Lösche Duplikat-Chat: ${duplicateChat.id}`);
          }
          try {
            await batch.commit();
            console.log(`✅ PHASE3: ${realChats.length - 1} Duplikat-Chats gelöscht`);
          } catch (deleteError) {
            console.error('❌ PHASE3: Fehler beim Löschen der Duplikat-Chats:', deleteError);
          }
        }
      }
      
      let chat;
      
      if (existingChat) {
        // Chat existiert bereits - verwende ihn
        chat = existingChat;
      } else {
        // PHASE3: Erstelle neuen Chat in Firestore (nur nach Akzeptierung!)
        const chatData = {
          participants: [currentUserId, actualOtherUserId],
          participantNames: [
            currentUser?.username || `${currentUser?.firstName} ${currentUser?.lastName}` || 'Du',
            otherUserName
          ],
          lastMessage: `Tauschvorschlag: ${selectedWine.name}`,
          lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          unreadCount: 0,
          type: 'hint-decision',
          tradeRequestId,
          tradeStatus: 'accepted',
          entryType: 'chat' // WICHTIG: Explizit als Chat markieren
        };
        
        const chatId = await fsCreateChat(chatData);
        chat = { id: chatId, ...chatData };
        console.log('✅ PHASE3: Neuer Chat erstellt in Firestore nach Akzeptierung:', chatId);
        
        // PHASE3: Erstelle Notifications für beide User
        const notificationDataForA = {
          type: 'chat',
          title: 'Neuer Chat erstellt',
          message: `Chat mit ${currentUser?.username || `${currentUser?.firstName} ${currentUser?.lastName}` || 'Unbekannt'} gestartet - Tauschvorschlag: ${selectedWine.name}`,
          priority: 'high',
          requestId: tradeRequestId,
          chatId: chatId
        };
        
        const notificationDataForB = {
          type: 'chat',
          title: 'Neuer Chat erstellt',
          message: `Chat mit ${otherUserName} gestartet - Tauschvorschlag: ${selectedWine.name}`,
          priority: 'high',
          requestId: tradeRequestId,
          chatId: chatId
        };
        
        await fsCreateNotification(actualOtherUserId, notificationDataForA);
        await fsCreateNotification(currentUserId, notificationDataForB);
        console.log('✅ PHASE3: Chat-Notifications erstellt in Firestore für beide User');
        logNotificationEvent({
          stage: 'trade/accept/notifications',
          type: 'chat',
          data: {
            requestId: tradeRequestId,
            chatId,
            users: [actualOtherUserId, currentUserId],
          },
        });
      }
      
      // PHASE3: Öffne Chat
      handleNavigate('chat-room', { chat });
      
      console.log('✅ PHASE3: Trade-Request akzeptiert - Chat erstellt:', chat.id);
    } catch (e) {
      console.error('❌ PHASE3: Fehler bei Akzeptierung des Trade-Requests:', e);
      throw e; // Weiterwerfen für UI-Feedback
    }
  };
  // ============================================
  // PHASE3 ENDE
  // ============================================

  const deleteSurvey = (surveyId) => {
    setSurveys(prev => prev.filter(survey => survey.id !== surveyId));
    console.log('Survey gelöscht:', surveyId);
  };

  // Newsletter-Funktionen
  const createNewsletter = (newsletterData) => {
    console.log('🔄 App.js: Erstelle Newsletter...', newsletterData);
    
    const newNewsletter = {
      id: Date.now(),
      ...newsletterData,
      status: 'draft',
      createdAt: new Date().toLocaleDateString('de-DE')
    };
    
    console.log('✅ App.js: Newsletter erstellt:', newNewsletter);
    setNewsletters(prev => [...prev, newNewsletter]);
    
    // Newsletter-Benachrichtigung nur für Newsletter-Abonnenten erstellen
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.newsletter) {
      const newsletterNotification = {
        id: Date.now() + 1,
        type: 'newsletter',
        title: 'Neuer Newsletter verfügbar',
        message: `Ein neuer Newsletter "${newsletterData.title}" ist verfügbar!`,
        timestamp: 'gerade eben',
        isRead: false,
        priority: 'medium'
      };
      
      console.log('📧 App.js: Newsletter-Benachrichtigung erstellt für Newsletter-Abonnent:', newsletterNotification);
      setNotifications(prev => [newsletterNotification, ...prev]);
      // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
      console.log('✅ App.js: Newsletter und Benachrichtigung erfolgreich hinzugefügt');
    } else {
      console.log('ℹ️ App.js: Keine Newsletter-Benachrichtigung - User ist nicht für Newsletter abonniert');
    }
    
    return newNewsletter;
  };

  const deleteNotification = async (notificationId) => {
    setNotifications(prev => {
      // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
      const filtered = prev.filter(n => n.id !== notificationId);
      
      // WICHTIG: Speichere auch in AsyncStorage, damit die Notification beim nächsten Login nicht wieder erscheint
      AsyncStorage.setItem('bottle-trade-notifications', JSON.stringify(filtered)).catch(err => {
        console.error('❌ Error saving filtered notifications to AsyncStorage:', err);
      });
      
      console.log('✅ Benachrichtigung gelöscht und aus AsyncStorage entfernt:', notificationId);
      
      return filtered;
    });
  };

  const markNewsletterAsRead = React.useCallback((newsletterId) => {
    console.log('📖 Markiere Newsletter als gelesen:', newsletterId);
    
    // Newsletter-Benachrichtigung als gelesen markieren
    setNotifications(prev => 
      prev.map(notification => {
        if (notification.type === 'newsletter' && 
            notification.message.includes(newsletterId.toString())) {
          console.log('✅ Newsletter-Benachrichtigung als gelesen markiert:', notification.id);
          return { ...notification, isRead: true };
        }
        return notification;
      })
    );
    
    // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
  }, []);

  const createSystemMessage = (systemMessage) => {
    console.log('📢 Erstelle Systemnachricht:', systemMessage);
    
    // Sicherstellen, dass jede Systemnachricht eine eindeutige ID hat
    const messageWithId = {
      ...systemMessage,
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toLocaleDateString('de-DE'),
      status: 'draft'
    };
    
    console.log('📢 Systemnachricht mit ID erstellt:', messageWithId.id);
    setSystemMessages(prev => {
      const newMessages = [...prev, messageWithId];
      console.log('📢 Neue Systemnachrichten-Liste:', newMessages.length, 'Nachrichten');
      return newMessages;
    });
    return messageWithId;
  };

  const sendSystemMessage = (systemMessageId) => {
    console.log('📤 Sende Systemnachricht an alle Benutzer:', systemMessageId);
    
    // Systemnachricht als gesendet markieren und Benachrichtigung erstellen
    setSystemMessages(prev => {
      const updatedMessages = prev.map(message => 
        message.id === systemMessageId 
          ? { ...message, status: 'sent' }
          : message
      );
      
      // Benachrichtigung für alle Benutzer erstellen
      const systemMessage = prev.find(msg => msg.id === systemMessageId);
      if (systemMessage) {
        const notification = {
          id: `system_${Date.now()}`,
          type: 'system',
          title: '📢 Systemnachricht',
          message: `"${systemMessage.title}" - ${systemMessage.content.substring(0, 50)}...`,
          timestamp: new Date().toLocaleString('de-DE'),
          isRead: false,
          priority: systemMessage.priority
        };
        
        setNotifications(prevNotifications => [...prevNotifications, notification]);
        // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
        console.log('✅ Systemnachricht-Benachrichtigung erstellt für alle Benutzer');
      }
      
      return updatedMessages;
    });
  };

  const markSystemMessageAsRead = React.useCallback((systemMessageId) => {
    console.log('📢 Markiere Systemnachricht als gelesen:', systemMessageId);
    
    // Systemnachricht-Benachrichtigung als gelesen markieren
    setNotifications(prev => 
      prev.map(notification => {
        if (notification.type === 'system' && 
            notification.message.includes(systemMessageId.toString())) {
          console.log('✅ Systemnachricht-Benachrichtigung als gelesen markiert:', notification.id);
          return { ...notification, isRead: true };
        }
        return notification;
      })
    );
    
    // WICHTIG: setUnreadNotifications entfernt - wird automatisch über refreshNotificationBadges aktualisiert
  }, []);

         // Loading Screen entfernt für bessere Performance
         console.log('🔄 App.js: Render-Zyklus - currentScreen:', currentScreen);
         console.log('🔄 App.js: route?.params:', route?.params);

         if (currentScreen === 'login') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <LoginScreen onLogin={handleLogin} onShowRegister={handleShowRegister} onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />
             </>
           );
         }

         if (currentScreen === 'register') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <RegisterScreen onRegister={handleLogin} onShowLogin={handleShowLogin} onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />
             </>
           );
         }

         if (currentScreen === 'info') {
           return (
             <>
               <StatusBar style="light" />
               <InfoScreen onNavigate={handleNavigate} onShowRegister={handleShowRegister} isLoggedIn={isLoggedIn} />
             </>
           );
         }

         if (currentScreen === 'shop') {
           return (
             <>
               <StatusBar style="light" />
              <ShopScreen
                onNavigate={handleNavigate}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
             </>
           );
         }

         if (currentScreen === 'weinregal') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
              <WeinregalBefuellenScreen
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                isAdmin={isAdmin}
                unreadCount={unreadCount}
                isLoggedIn={isLoggedIn}
              />
             </>
           );
         }

         if (currentScreen === 'mein-weinregal') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
              <MeinWeinregalScreen 
                 onNavigate={handleNavigate} 
                 onLogout={handleLogout} 
                 isAdmin={isAdmin} 
                 unreadCount={unreadCount}
                 isLoggedIn={isLoggedIn}
                 viewUserId={route?.params?.viewUserId}
                 tradeRequestId={route?.params?.tradeRequestId}
                 onSelectTradeWine={handleSelectTradeWine}
                 onDeclineTradeRequest={({ requestId, otherUserId }) => declineTradeRequestSimple({ requestId, otherUserId })}
               />
             </>
           );
         }

         if (currentScreen === 'weinboerse') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
             <WeinboerseScreen
               onNavigate={handleNavigate}
               onLogout={handleLogout}
               isAdmin={isAdmin}
               unreadCount={unreadCount}
               chats={chats}
               isLoggedIn={isLoggedIn}
               onCreateTradeRequest={createTradeRequest}
             />
             </>
           );
         }

         if (currentScreen === 'community') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
              <CommunityScreen
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                isAdmin={isAdmin}
                unreadCount={unreadCount}
                isLoggedIn={isLoggedIn}
              />
             </>
           );
         }

         if (currentScreen === 'btp') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
              <BtpScreen
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                unreadCount={unreadCount}
                isLoggedIn={isLoggedIn}
              />
             </>
           );
         }

         if (currentScreen === 'profil') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
              <ProfilScreen
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                isAdmin={isAdmin}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
             </>
           );
         }

        if (currentScreen === 'wunschliste') {
          return (
            <>
              <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
              <StatusBar style="light" />
             <WunschlisteScreen
               onNavigate={handleNavigate}
               onLogout={handleLogout}
               isAdmin={isAdmin}
               isLoggedIn={isLoggedIn}
               unreadCount={unreadCount}
             />
            </>
          );
        }

         if (currentScreen === 'weinregalEdit') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
              <WeinregalEditScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout} 
                wineData={route?.params?.wineData}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
             </>
           );
         }

         if (currentScreen === 'weinDetail') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
              <WeinDetailScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout} 
                wineData={route?.params?.wineData}
                inTradeContext={route?.params?.inTradeContext || false}
                backTarget={route?.params?.backTarget || 'weinboerse'}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
             </>
           );
         }

         if (currentScreen === 'home' || currentScreen === 'dashboard') {
           return (
             <>
               <StatusBar style="light" />
              <DashboardScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                isAdmin={isAdmin}
                unreadCount={unreadCount}
                isLoggedIn={isLoggedIn}
              />
             </>
           );
         }

         // Admin Screens
         if (currentScreen === 'admin-dashboard') {
           return (
             <>
               <StatusBar style="light" />
             <AdminDashboardScreen 
               onNavigate={handleNavigate} 
               onLogout={handleLogout}
               surveys={surveys}
               newsletters={newsletters}
               systemMessages={systemMessages}
               notifications={notifications}
               isLoggedIn={isLoggedIn}
               unreadCount={unreadCount}
              />
             </>
           );
         }

        if (currentScreen === 'admin-surveys') {
          return (
            <>
              <StatusBar style="light" />
             <AdminSurveysScreen 
               onNavigate={handleNavigate} 
               onLogout={handleLogout}
               surveys={surveys}
               onCreateSurvey={createSurvey}
               onDeleteSurvey={deleteSurvey}
               isLoggedIn={isLoggedIn}
               unreadCount={unreadCount}
              />
            </>
          );
        }

        if (currentScreen === 'admin-newsletter') {
          return (
            <>
              <StatusBar style="light" />
              <AdminNewsletterScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                newsletters={newsletters}
                onCreateNewsletter={createNewsletter}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
            </>
          );
        }

         if (currentScreen === 'notifications') {
           return (
             <>
               <StatusBar style="light" />
             <NotificationsScreen 
                 onNavigate={handleNavigate} 
                 onLogout={handleLogout}
                 notifications={notifications}
                 onUpdateNotificationReadStatus={updateNotificationReadStatus}
                 onUpdateNotificationsReadByRequestId={updateNotificationsReadByRequestId}
                 onMarkAllAsRead={markAllNotificationsAsRead}
                 onDeleteNotification={deleteNotification}
                 onMarkChatAsRead={markChatAsRead}
                 onDeleteChat={deleteChatById}
                 surveys={surveys}
                 newsletters={newsletters}
                 systemMessages={systemMessages}
                 chats={chats.filter(chat => {
                   // WICHTIG: Filtere Chats für NotificationsScreen - nur Chats anzeigen, bei denen der User Teilnehmer ist
                   // 1-zu-1 Kommunikation darf nicht von Dritten (auch nicht Admins) eingesehen werden
                   const currentUser = getCurrentUser();
                   const currentUserId = currentUser?.uid;
                   if (!chat.participants || !Array.isArray(chat.participants)) {
                     return false;
                   }
                   return chat.participants.includes(currentUserId);
                 })}
                 isLoggedIn={isLoggedIn}
                onTradeAccept={handleTradeAcceptNavigateToForeignCellar}
                onTradeDecline={({ notification }) => declineTradeRequest({ requestId: notification.requestId, notification })}
                unreadCount={unreadCount}
               />
             </>
           );
         }

         // PHASE 5: InfoBoxScreen - WhatsApp-ähnliche Liste aller Notifications
         if (currentScreen === 'infobox') {
           const currentUser = getCurrentUser();
           const currentUserId = currentUser?.uid;
           return (
             <GestureHandlerRootView style={{ flex: 1 }}>
               <InfoBoxScreen
                 onNavigate={handleNavigate}
                 onLogout={handleLogout}
                 notifications={notifications}
                 currentUserId={currentUserId}
                 isLoggedIn={isLoggedIn}
                 unreadCount={unreadCount}
               />
               <BottomNavigation
                 onNavigate={handleNavigate}
                 isLoggedIn={isLoggedIn}
                 unreadCount={unreadCount}
               />
             </GestureHandlerRootView>
           );
         }

        if (currentScreen === 'survey-answer') {
          const survey = surveys.find(s => s.id === route?.params?.surveyId);
          return (
            <>
              <StatusBar style="light" />
              <SurveyAnswerScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                survey={survey}
                onAnswerSurvey={answerSurvey}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
            </>
          );
        }

        if (currentScreen === 'survey-results') {
          return (
            <>
              <StatusBar style="light" />
              <SurveyResultsScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                survey={route?.params?.survey}
                surveyAnswers={surveyAnswers}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
            </>
          );
        }

        if (currentScreen === 'newsletter-reader') {
          return (
            <>
              <StatusBar style="light" />
              <NewsletterReaderScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                newsletter={route?.params?.newsletter}
                onMarkNewsletterAsRead={markNewsletterAsRead}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
            </>
          );
        }

        if (currentScreen === 'admin-trades') {
          return (
            <>
              <StatusBar style="light" />
              <AdminTradesScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                chats={chats}
                onDeleteSingleTrade={deleteSingleTrade}
                onDeleteChatOnly={deleteChatOnly}
                onDeleteHintOnly={deleteHintOnly}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
            </>
          );
        }

        if (currentScreen === 'admin-chats') {
          return (
            <>
              <StatusBar style="light" />
              <AdminChatsScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                chats={chats}
                onDeleteChat={deleteChatById}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
            </>
          );
        }

        if (currentScreen === 'admin-wines') {
          return (
            <>
              <StatusBar style="light" />
              <AdminWinesScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
            </>
          );
        }

        if (currentScreen === 'admin-users') {
          return (
            <>
              <StatusBar style="light" />
              <AdminUsersScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
            </>
          );
        }

        if (currentScreen === 'admin-system-messages') {
          return (
            <>
              <StatusBar style="light" />
              <AdminSystemMessagesScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                systemMessages={systemMessages || []}
                onCreateSystemMessage={createSystemMessage}
                onSendSystemMessage={sendSystemMessage}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
              />
            </>
          );
        }

        if (currentScreen === 'system-message-reader') {
          return (
            <>
              <StatusBar style="light" />
              <SystemMessageReaderScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                systemMessage={route?.params?.systemMessage}
                onMarkSystemMessageAsRead={markSystemMessageAsRead}
                isLoggedIn={isLoggedIn}
                unreadCount={unreadCount}
               />
             </>
           );
         }

        // Chat Screens
        if (currentScreen === 'chat-list') {
          console.log('🔄 App.js: Rendering ChatListScreen - currentScreen:', currentScreen);
          // WICHTIG: Zähle nur echte Chats (entryType !== 'hint'), nicht Hinweise
          const realChatsCount = chats.filter(c => c.entryType !== 'hint').length;
          const hintsCount = chats.filter(c => c.entryType === 'hint').length;
          console.log('🔄 App.js: Gesamt Einträge (Chats + Hinweise):', chats.length, `(Chats: ${realChatsCount}, Hinweise: ${hintsCount})`);
          console.log('🔄 App.js: markAllChatsAsRead verfügbar?', typeof markAllChatsAsRead);
          return (
            <>
              <StatusBar style="light" />
              <ChatListScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                chats={chats}
                unreadCount={unreadCount}
                onMarkChatAsRead={markChatAsRead}
                onMarkAllChatsAsRead={typeof markAllChatsAsRead === 'function' ? markAllChatsAsRead : null}
                onDeleteChat={deleteChatById}
                notifications={notifications}
                isLoggedIn={isLoggedIn}
                onDeclineTradeRequest={({ requestId, otherUserId }) => declineTradeRequestSimple({ requestId, otherUserId })}
                onMarkAllChatNotificationsAsRead={markAllChatNotificationsAsRead}
              />
            </>
          );
        }

        if (currentScreen === 'hinweise') {
          console.log('🔄 App.js: Rendering HinweisScreen - currentScreen:', currentScreen);
          return (
            <>
              <StatusBar style="light" />
              <HinweisScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                chats={chats}
                unreadCount={unreadCount}
                onMarkChatAsRead={markChatAsRead}
                onDeleteChat={deleteChatById}
                notifications={notifications}
                isLoggedIn={isLoggedIn}
                onDeclineTradeRequest={({ requestId, otherUserId }) => declineTradeRequestSimple({ requestId, otherUserId })}
                onDeleteNotificationsForHint={deleteNotificationsForHint}
                onMarkAllHintNotificationsAsRead={markAllHintNotificationsAsRead}
                onMarkAllHintsAsRead={markAllHintsAsRead}
              />
            </>
          );
        }

        if (currentScreen === 'chat-room') {
          console.log('✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!');
          const chatId = route?.params?.chat?.id;
          const chat = route?.params?.chat;
          
          console.log('🔄 App.js: Rendering ChatRoomScreen - chatId:', chatId);
          console.log('🔄 App.js: Chat vorhanden?', !!chat);
          console.log('🔄 App.js: Chat-Details:', chat ? { id: chat.id, type: chat.type, entryType: chat.entryType } : 'null');
          console.log('🔄 App.js: Messages vorhanden?', !!activeChatMessages[chatId]);
          console.log('🔄 App.js: route?.params:', route?.params);
          
          // Sicherstellen, dass chat und messages definiert sind
          if (!chat || !chatId) {
            console.error('❌ App.js: Chat oder chatId fehlt, navigiere zurück');
            console.error('❌ App.js: chat:', chat);
            console.error('❌ App.js: chatId:', chatId);
            handleNavigate('chat-list');
            return null;
          }
          
          const chatMessages = activeChatMessages[chatId] || getMessages(chatId) || [];
          console.log('🔄 App.js: Anzahl Messages:', chatMessages.length);
          console.log('✅ App.js: Rendere ChatRoomScreen jetzt...');
          
          return (
            <>
              <StatusBar style="light" />
              <ChatRoomScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                chat={chat}
                unreadCount={unreadCount}
                messages={chatMessages}
                onAddMessage={addMessage}
                onUpdateMessage={updateMessage}
                onMarkChatAsRead={markChatAsRead}
                isLoggedIn={isLoggedIn}
              />
            </>
          );
        }

        // Welcome screen (default) - Neues Design mit Glassmorphismus
        return (
          <View style={{
            flex: 1,
            width: '100%',
            backgroundColor: '#2c2c2c', // BottomNavigation-Farbe
            paddingHorizontal: 0,
            marginHorizontal: 0,
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}>
            <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
            <StatusBar style="light" />
            
            {/* Subtiler Hintergrund-Gradient für Glassmorphismus-Effekt */}
            <LinearGradient
              colors={[
                '#2c2c2c',
                '#1a1a1a',
                '#2c2c2c',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            
            {/* Logo - größer und mittig am oberen Rand */}
            <View style={styles.welcomeLogoContainer}>
              <OptimizedImage 
                source={require('./assets/images/Logo_white.png')}
                style={styles.welcomeLogo}
                resizeMode="contain"
              />
              <Text style={styles.welcomeTitle}>Bottle Trade</Text>
            </View>
            
            {/* Buttons Container - vertikal zentriert */}
            <View style={styles.welcomeButtonsContainer}>
              {/* Login Button mit Glassmorphismus */}
              <TouchableOpacity
                style={[styles.welcomeButton, styles.welcomeButtonLogin]}
                onPress={handleShowLogin}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.welcomeButtonGradient}
                />
                <Text style={styles.welcomeButtonText}>Login</Text>
              </TouchableOpacity>

              {/* Registrieren Button mit Glassmorphismus */}
              <TouchableOpacity
                style={[styles.welcomeButton, styles.welcomeButtonRegister]}
                onPress={handleShowRegister}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.welcomeButtonGradient}
                />
                <Text style={styles.welcomeButtonText}>Registrieren</Text>
              </TouchableOpacity>

              {/* Was ist BT Button mit Glassmorphismus */}
              <TouchableOpacity
                style={[styles.welcomeButton, styles.welcomeButtonInfo]}
                onPress={() => handleNavigate('info')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.welcomeButtonGradient}
                />
                <Text style={styles.welcomeButtonText}>Was ist BT</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d5dfe0',
    width: '100%',
    paddingHorizontal: 0,
    marginHorizontal: 0,
    paddingLeft: 0,
    paddingRight: 0,
    marginLeft: 0,
    marginRight: 0,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch', // Stellt sicher dass Children die volle Breite nutzen
    minHeight: 0, // Wichtig für flex: 1 in Column
    overflow: 'hidden', // Verhindert Overflow-Probleme
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#2f3a3b',
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    height: 155, // Feste Höhe bleibt unverändert
    paddingHorizontal: 20,
    paddingVertical: 20, // Leicht reduziert für mehr Platz für größere Elemente
    justifyContent: 'space-between',
    alignItems: 'center', // Vertikale Zentrierung
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.15)', // Dezenter gemacht
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    flexShrink: 0, // Header darf nicht komprimiert werden
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: -12, // Nach oben verschieben, um zwischen "Willkommen" und Untertitel zu kommen
  },
  hamburgerButton: {
    padding: 5,
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    marginVertical: 4,
    borderRadius: 1.5,
  },
  headerLeft: {
    flexShrink: 0,
    flexGrow: 0,
    width: 250, // Erhöht von 220 auf 250 für größere Schrift
    justifyContent: 'center', // Vertikale Zentrierung
    alignItems: 'center', // Horizontal zentriert - "bei" zentriert unter "Willkommen"
    marginRight: 20, // Abstand zum Logo
  },
  headerRightLogo: {
    flex: 1, // Nimmt den restlichen Platz ein
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20, // Mehr Abstand vom rechten Rand, damit Logo nicht abgeschnitten wird
    overflow: 'hidden', // Verhindert, dass Logo über den Rand hinausragt
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center', // Horizontal zentriert
    lineHeight: 48, // Angepasst für größere Schrift
    marginBottom: 4,
    flexShrink: 0, // Verhindert, dass der Text schrumpft
  },
  greetingSub: {
    fontSize: 40, // Vergrößert von 32 auf 40
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center', // Horizontal zentriert - zentriert unter "Willkommen"
    lineHeight: 48, // Angepasst für größere Schrift
  },
  headerLogo: {
    width: '100%', // Nutzt den verfügbaren Platz im Container
    height: 130, // Vergrößert von 110 auf 130
    maxWidth: '100%',
    maxHeight: '100%',
    aspectRatio: 320/110, // Behält das Seitenverhältnis bei
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  content: {
    backgroundColor: 'transparent', // Transparent, damit Button-Container sichtbar wird
    paddingHorizontal: 0,
    marginHorizontal: 0,
    paddingLeft: 0,
    paddingRight: 0,
    marginLeft: 0,
    marginRight: 0,
    position: 'absolute', // Absolute Positionierung nach Header
    left: 0,
    // top, height und width werden dynamisch via inline style gesetzt
    // right wird nicht benötigt, wenn width explizit gesetzt ist
  },
  buttonContainer: {
    flexDirection: 'column',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginHorizontal: 0,
    paddingLeft: 0,
    paddingRight: 0,
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: 'transparent', // Transparent, da Buttons ihre eigenen Hintergründe haben
    flex: 1,
    minHeight: 0,
    position: 'relative',
    alignSelf: 'stretch', // Stellt sicher, dass Container die volle Breite nutzt
    // flex: 1 auf Buttons sorgt für gleichmäßige Verteilung
  },
  fullWidthButton: {
    flex: 1,
    width: Dimensions.get('window').width, // Explizite volle Breite
    alignSelf: 'stretch', // Stellt sicher, dass Buttons die volle Breite nutzen
    borderRadius: 0,
    overflow: 'hidden', // Wichtig: verdeckt Borders am linken Rand beim Slide
    marginHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingHorizontal: 0,
    paddingLeft: 0,
    paddingRight: 0,
    flexShrink: 1,
    flexGrow: 1,
    minHeight: 150, // Reduzierte Mindesthöhe für bessere Anpassung
    shadowColor: 'rgba(47, 58, 59, 0.4)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  loginButton: {
    // backgroundColor entfernt - LinearGradient verwendet
  },
  registerButton: {
    // backgroundColor entfernt - LinearGradient verwendet
  },
  infoButton: {
    // backgroundColor entfernt - LinearGradient verwendet
  },
  buttonContent: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center', // Zentriert Badge und Text
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 10,
    position: 'relative',
    gap: 20, // Mehr Abstand zwischen Badge und Text für aufgelockertes Design
    flexWrap: 'nowrap', // Verhindert Umbruch der Elemente
  },
  buttonIcon: {
    fontSize: 48, // Größeres Icon für bessere Sichtbarkeit
    marginRight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Badge-Styles für Initialen
  loginBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(168, 184, 168, 0.9)', // Helles Silbergrün für Login-Badge
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
    position: 'relative', // Relative Positionierung für zentriertes Layout
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  registerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 182, 193, 0.9)', // Rosa für Register-Badge
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
    position: 'relative', // Relative Positionierung für zentriertes Layout
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 74, 92, 0.95)', // Rotweinfarbe für Info-Badge
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
    position: 'relative', // Relative Positionierung für zentriertes Layout
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF', // Weißer Text für dunklen Badge
    textAlign: 'center',
  },
  badgeTextLight: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2f3a3b', // Dunkler Text für hellen Badge
    textAlign: 'center',
  },
  fullWidthButtonText: {
    fontSize: 36, // Größere Schrift für bessere Sichtbarkeit
    fontWeight: '700', // Fettere Schrift
    textAlign: 'center',
    letterSpacing: 1.5, // Mehr Letter-Spacing für Eleganz
    textTransform: 'none', // Keine Uppercase für moderneren Look
    flexShrink: 0, // Verhindert, dass Text umbricht
    flexWrap: 'nowrap', // Verhindert Zeilenumbruch
  },
  darkButtonText: {
    color: '#2f3a3b', // Dunkles Grau für helle Buttons
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontWeight: '800', // Extra fetter Text für mehr Sichtbarkeit
  },
  registerButtonText: {
    color: '#FFFFFF', // Weißer Text für dunkle Buttons
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    fontWeight: '800', // Extra fetter Text für mehr Sichtbarkeit
  },
  mousseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 50,
    zIndex: 1,
    // bottom wird dynamisch im inline style gesetzt
  },
  testContainer: {
    flex: 1,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#F5DEB3',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 20,
    justifyContent: 'space-between', // Gleichmäßige Verteilung
  },
  imageButton: {
    width: '50%', // Zurück zu 50% für 2x2 Layout
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16, // Moderne abgerundete Ecken
    // Glassmorphism Schatten
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    // Subtiler Border für Glaseffekt
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Subtiler Glow-Effekt
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonImage: {
    width: '100%',
    height: '100%',
  },
  buttonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
    // Glassmorphism Gradient Overlay
    background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },
  button: {
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientBorder: {
    borderRadius: 20,
    marginBottom: 15,
    padding: 1,
  },
  glassButton: {
    width: '50%',
    aspectRatio: 1,
    padding: 18,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
    buttonText: {
      color: 'rgba(255, 255, 255, 0.85)', // Transparenter Text
      fontSize: 14, // Kleinere Schrift
      fontWeight: '300', // Dünnere Schrift
      // Subtiler Text-Schatten
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    buttonTextMultiLine: {
      color: 'rgba(255, 255, 255, 0.85)', // Transparenter Text
      fontSize: 14, // Kleinere Schrift
      fontWeight: '300', // Dünnere Schrift
      textAlign: 'center',
      lineHeight: 18, // Angepasste Zeilenhöhe
      // Subtiler Text-Schatten
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  glassButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tabIcon: {
    fontSize: 20,
  },
  // Info Screen Styles
  infoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoSubtitle: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  infoSection: {
    marginBottom: 25,
  },
  infoHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: 'black',
    lineHeight: 24,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },
  infoCardText: {
    fontSize: 14,
    color: 'black',
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: 'black',
    lineHeight: 20,
  },
  // Welcome Screen Styles
  welcomeLogoContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeLogo: {
    width: 300,
    height: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 38.4, // 32 * 1.2 = 38.4 (20% größer)
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeButtonsContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeButton: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 65,
    marginBottom: 20,
    overflow: 'hidden',
    // Glassmorphismus-Effekt
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeButtonLogin: {
    backgroundColor: 'rgba(33, 150, 243, 0.25)', // Transparentes Blau
    borderColor: 'rgba(33, 150, 243, 0.5)',
    // Subtiler Gradient-Effekt durch Overlay
  },
  welcomeButtonRegister: {
    backgroundColor: 'rgba(76, 175, 80, 0.25)', // Transparentes Grün
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  welcomeButtonInfo: {
    backgroundColor: 'rgba(255, 152, 0, 0.25)', // Transparentes Orange
    borderColor: 'rgba(255, 152, 0, 0.5)',
  },
  welcomeButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  welcomeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 1,
  },
  // Loading Screen Styles entfernt
});