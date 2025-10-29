import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, Image, ScrollView, Platform, StatusBar as RNStatusBar, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import OptimizedImage from './components/OptimizedImage';
// Asset import entfernt - nicht mehr benötigt

// Firebase-Konfiguration (nur Firestore)
import './config/firebase-web';

// Test-Auth Service (simuliert Authentication)
import { loginUser, registerUser, logoutUser, getCurrentUser, onAuthStateChange } from './services/testAuth';

import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import StartScreen from './screens/StartScreen';
import TestApp from './TestApp';
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
import NotificationsScreen from './screens/NotificationsScreen';
import SurveyAnswerScreen from './screens/SurveyAnswerScreen';
import SurveyResultsScreen from './screens/SurveyResultsScreen';
import NewsletterReaderScreen from './screens/NewsletterReaderScreen';
import AdminSystemMessagesScreen from './screens/AdminSystemMessagesScreen';
import SystemMessageReaderScreen from './screens/SystemMessageReaderScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import { createAdminTestChat, createTestAdminChat, createAdminTestMessages, TEST_USERS } from './services/testChatData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from './Footer';
import BottomNavigation from './components/BottomNavigation';
import NotificationBadge from './components/NotificationBadge';

const Tab = createBottomTabNavigator();

function MainTabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#8B4513',
          borderTopColor: '#D2691E',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#F5DEB3',
        tabBarInactiveTintColor: '#CD853F',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Start" 
        component={StartScreen}
        options={{
          tabBarIcon: () => <Text style={styles.tabIcon}>🏠</Text>,
        }}
      />
      <Tab.Screen 
        name="Weine" 
        component={WeineScreen}
        options={{
          tabBarIcon: () => <Text style={styles.tabIcon}>🍷</Text>,
        }}
      />
      <Tab.Screen 
        name="BTP" 
        component={BtpScreen}
        options={{
          tabBarIcon: () => <Text style={styles.tabIcon}>💰</Text>,
        }}
      />
      <Tab.Screen 
        name="Profil" 
        options={{
          tabBarIcon: () => <Text style={styles.tabIcon}>👤</Text>,
        }}
      >
        {() => <ProfilScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [imagesLoaded, setImagesLoaded] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [route, setRoute] = useState(null); // route state for passing data
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [surveys, setSurveys] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [surveyAnswers, setSurveyAnswers] = useState([]); // Track welche User an welchen Surveys teilgenommen haben
  const [chats, setChats] = useState([]); // Chat-Kanäle
  const [messages, setMessages] = useState({}); // Chat-Nachrichten: { chatId: [messages] }
  const [isMenuVisible, setIsMenuVisible] = useState(false); // State für Hamburger-Menü im Welcome-Screen
  
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
  

  // Bilder werden lazy geladen - keine Preload-Verzögerung
  useEffect(() => {
    // Sofort als geladen markieren für bessere Performance
        setImagesLoaded(true);
  }, []);


  // Initiale Daten laden (später durch Firebase ersetzt)
  useEffect(() => {
    // Leere Arrays für echte Daten (ohne Chat-Benachrichtigungen)
    setNotifications([]);
    
    // LÖSCHE ALLE CHATS UND NACHRICHTEN ZUM NEUSTART
    const clearAllData = async () => {
      try {
        await AsyncStorage.removeItem('bottle-trade-chats');
        await AsyncStorage.removeItem('bottle-trade-messages');
        console.log('🧹 Alle Chat-Daten gelöscht für sauberen Neustart');
      } catch (error) {
        console.error('❌ Error clearing data:', error);
      }
    };
    
    // Lade Chats aus AsyncStorage (globale Speicherung)
    const loadChats = async () => {
      try {
        const savedChats = await AsyncStorage.getItem('bottle-trade-chats');
        if (savedChats) {
          setChats(JSON.parse(savedChats));
        } else {
          setChats([]);
        }
      } catch (error) {
        console.error('❌ Error loading chats from AsyncStorage:', error);
        setChats([]);
      }
    };
    
    // Lade Nachrichten aus AsyncStorage
    const loadMessages = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem('bottle-trade-messages');
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          setMessages({});
        }
      } catch (error) {
        console.error('❌ Error loading messages from AsyncStorage:', error);
        setMessages({});
      }
    };
    
    clearAllData();
    loadChats();
    loadMessages();
    
    setUnreadNotifications(0);
    
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
    
    console.log('🔧 Test-Funktionen verfügbar:');
    console.log('  - createTestChat() - Erstellt einen Test-Chat (Admin → Test)');
    console.log('  - createTestChatReverse() - Erstellt einen Test-Chat (Test → Admin)');
    console.log('  - createTestMessages() - Erstellt Test-Nachrichten');
    console.log('  - clearAllChats() - Löscht alle Chats');
    console.log('  - showAllChats() - Zeigt alle Chats und Nachrichten');
    console.log('  - removeDuplicates() - Entfernt Duplikate aus Nachrichten');
  }, []);

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
        console.log('ℹ️ Kein User gefunden');
      }
    } catch (error) {
      console.error('❌ Fehler bei User-Erkennung:', error);
      setIsAdmin(false);
      setUserName('');
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
      setUser(null);
    setCurrentScreen('welcome');
      console.log('✅ User logged out - Admin-Status und User-Info zurückgesetzt');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback: trotzdem ausloggen
    setIsLoggedIn(false);
      setIsAdmin(false);
      setUserName('');
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
    setCurrentScreen(screen);
    setRoute({ params });
    
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
  };

  // Funktionen für Chat-Nachrichten
  const addMessage = async (chatId, message) => {
    // Prüfe, ob Nachricht bereits existiert (verhindert Duplikate)
    const existingMessages = messages[chatId] || [];
    const messageExists = existingMessages.some(msg => msg.id === message.id);
    
    if (messageExists) {
      console.log('⚠️ Nachricht bereits vorhanden, überspringe:', message.id);
      return;
    }
    
    // Prüfe, ob es eine System-Nachricht ist (gelöschte Nachricht)
    if (message.id.startsWith('deleted-')) {
      console.log('⚠️ System-Nachricht, überspringe:', message.id);
      return;
    }
    
    // Prüfe, ob es eine ungültige Nachricht ist
    if (!message.id || !message.text || !message.senderId) {
      console.log('⚠️ Ungültige Nachricht, überspringe:', message);
      return;
    }
    
    // Prüfe, ob die Nachricht-ID bereits in anderen Chats existiert
    const messageExistsInOtherChats = Object.values(messages).some(chatMessages => 
      chatMessages.some(msg => msg.id === message.id)
    );
    
    if (messageExistsInOtherChats) {
      console.log('⚠️ Nachricht-ID bereits in anderen Chats vorhanden, überspringe:', message.id);
      return;
    }
    
    console.log('✅ Füge neue Nachricht hinzu:', message.id);
    
    const newMessages = {
      ...messages,
      [chatId]: [...existingMessages, message]
    };
    
    setMessages(newMessages);
    
    // Speichere in AsyncStorage
    try {
      await AsyncStorage.setItem('bottle-trade-messages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('❌ Error saving messages to AsyncStorage:', error);
    }
    
    // Update last message in chat
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          lastMessage: message.text,
          lastMessageTime: message.timestamp,
          unreadCount: chat.unreadCount + 1
        };
      }
      return chat;
    });
    
    setChats(updatedChats);
    
    // Speichere Chats in AsyncStorage
    try {
      await AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('❌ Error saving chats to AsyncStorage:', error);
    }
    
    // Erstelle Benachrichtigung für neue Nachricht (nur wenn nicht vom aktuellen User)
    const currentUser = getCurrentUser();
    if (currentUser && message.senderId !== currentUser.uid) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        const otherParticipant = chat.participantNames.find(name => name !== message.senderName);
        const notification = {
          id: `chat-${message.id}`,
          type: 'message',
          title: `Neue Nachricht von ${message.senderName}`,
          message: message.text,
          timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
          priority: 'medium',
          chatId: chatId,
          senderId: message.senderId,
          senderName: message.senderName
        };
        
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotifications(prev => prev + 1);
        console.log('🔔 Benachrichtigung erstellt für neue Nachricht:', message.id);
      }
    }
  };

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
    
    const newMessages = {
      ...messages,
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
    return messages[chatId] || [];
  };

  const markChatAsRead = (chatId) => {
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, unreadCount: 0 };
      }
      return chat;
    });
    
    setChats(updatedChats);
    
    // Speichere in AsyncStorage
    AsyncStorage.setItem('bottle-trade-chats', JSON.stringify(updatedChats)).catch(error => {
      console.error('❌ Error saving chats to AsyncStorage:', error);
    });
    
    // Markiere alle Chat-Benachrichtigungen als gelesen
    const updatedNotifications = notifications.map(notification => {
      if (notification.type === 'message' && notification.chatId === chatId) {
        return { ...notification, isRead: true };
      }
      return notification;
    });
    
    setNotifications(updatedNotifications);
    
    // Aktualisiere unreadNotifications Zähler
    const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
    setUnreadNotifications(unreadCount);
    
    console.log('✅ Chat als gelesen markiert:', chatId);
  };

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
    setUnreadNotifications(prev => {
      const newCount = prev + 1;
      console.log('🔔 App.js: Unread notifications updated:', prev, '→', newCount);
      return newCount;
    });
    console.log('✅ App.js: Umfrage und Benachrichtigung erfolgreich hinzugefügt');
    
    return newSurvey;
  };

  const updateNotificationReadStatus = (notificationId, isRead) => {
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead }
          : notification
      );
      
      // Unread count aktualisieren
      const unreadCount = updated.filter(n => !n.isRead).length;
      setUnreadNotifications(unreadCount);
      
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadNotifications(0);
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
    
    // Unread count reduzieren (nur wenn die Benachrichtigung vorher ungelesen war)
    setUnreadNotifications(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log('🔔 Unread notifications reduced:', prev, '→', newCount);
      return newCount;
    });
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
      setUnreadNotifications(prev => prev + 1);
    }
    
    return true; // Teilnahme erfolgreich
  };

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
      setUnreadNotifications(prev => prev + 1);
      console.log('✅ App.js: Newsletter und Benachrichtigung erfolgreich hinzugefügt');
    } else {
      console.log('ℹ️ App.js: Keine Newsletter-Benachrichtigung - User ist nicht für Newsletter abonniert');
    }
    
    return newNewsletter;
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    
    // Unread count aktualisieren
    const unreadCount = notifications.filter(n => !n.isRead && n.id !== notificationId).length;
    setUnreadNotifications(unreadCount);
    
    console.log('Benachrichtigung gelöscht:', notificationId);
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
    
    // Unread count reduzieren
    setUnreadNotifications(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log('🔔 Unread notifications reduced:', prev, '→', newCount);
      return newCount;
    });
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
        setUnreadNotifications(prev => prev + 1);
        
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
    
    // Unread count reduzieren
    setUnreadNotifications(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log('🔔 Unread notifications reduced:', prev, '→', newCount);
      return newCount;
    });
  }, []);

         // Loading Screen entfernt für bessere Performance

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
               <ShopScreen onNavigate={handleNavigate} isLoggedIn={isLoggedIn} unreadNotifications={unreadNotifications} />
             </>
           );
         }

         if (currentScreen === 'weinregal') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <WeinregalBefuellenScreen onNavigate={handleNavigate} onLogout={handleLogout} isAdmin={isAdmin} unreadNotifications={unreadNotifications} isLoggedIn={isLoggedIn} />
             </>
           );
         }

         if (currentScreen === 'mein-weinregal') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <MeinWeinregalScreen onNavigate={handleNavigate} onLogout={handleLogout} isAdmin={isAdmin} unreadNotifications={unreadNotifications} isLoggedIn={isLoggedIn} />
             </>
           );
         }

         if (currentScreen === 'weinboerse') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <WeinboerseScreen onNavigate={handleNavigate} onLogout={handleLogout} isAdmin={isAdmin} unreadNotifications={unreadNotifications} chats={chats} isLoggedIn={isLoggedIn} />
             </>
           );
         }

         if (currentScreen === 'community') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <CommunityScreen onNavigate={handleNavigate} onLogout={handleLogout} isAdmin={isAdmin} unreadNotifications={unreadNotifications} isLoggedIn={isLoggedIn} />
             </>
           );
         }

         if (currentScreen === 'btp') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <BtpScreen onNavigate={handleNavigate} onLogout={handleLogout} unreadNotifications={unreadNotifications} isLoggedIn={isLoggedIn} />
             </>
           );
         }

         if (currentScreen === 'profil') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <ProfilScreen onNavigate={handleNavigate} onLogout={handleLogout} isAdmin={isAdmin} isLoggedIn={isLoggedIn} />
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
                 isLoggedIn={isLoggedIn}
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
                 userName={userName || "Gast"}
                 isAdmin={isAdmin}
                 unreadNotifications={unreadNotifications}
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
                 onMarkAllAsRead={markAllNotificationsAsRead}
                 onDeleteNotification={deleteNotification}
                 surveys={surveys}
                 newsletters={newsletters}
                 systemMessages={systemMessages}
                 chats={chats}
                 isLoggedIn={isLoggedIn}
               />
             </>
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
               />
             </>
           );
         }

        // Chat Screens
        if (currentScreen === 'chat-list') {
          return (
            <>
              <StatusBar style="light" />
              <ChatListScreen 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                chats={chats}
                unreadNotifications={unreadNotifications}
                onMarkChatAsRead={markChatAsRead}
                isLoggedIn={isLoggedIn}
              />
            </>
          );
        }

        if (currentScreen === 'chat-room') {
          return (
            <>
              <StatusBar style="light" />
        <ChatRoomScreen 
          onNavigate={handleNavigate} 
          onLogout={handleLogout}
          chat={route?.params?.chat}
          unreadNotifications={unreadNotifications}
          messages={getMessages(route?.params?.chat?.id)}
          onAddMessage={addMessage}
          onUpdateMessage={updateMessage}
          onMarkChatAsRead={markChatAsRead}
          isLoggedIn={isLoggedIn}
        />
            </>
          );
        }

        // Welcome screen (default)
        const bottomNavHeight = 75;
        const headerHeight = 155; // Erhöht von 135 auf 155
        const headerMarginTop = Platform.OS === 'ios' ? 60 : 50;
        // Gesamte Header-Höhe: marginTop + height (StatusBar wird separat behandelt)
        const totalHeaderHeight = headerMarginTop + headerHeight;
        const availableContentHeight = screenHeight - totalHeaderHeight - bottomNavHeight;
        
        return (
          <View style={{
            flex: 1,
            width: '100%',
            backgroundColor: '#d5dfe0', // Neue Primärfarbe
            paddingHorizontal: 0,
            marginHorizontal: 0,
            paddingLeft: 0,
            paddingRight: 0,
            marginLeft: 0,
            marginRight: 0,
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
            <StatusBar style="light" />
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
              borderBottomColor: 'rgba(255, 255, 255, 0.1)' // Dezenter gemacht
            }} />
            
            <View style={styles.container}>
              <DynamicHamburgerMenu 
                onNavigate={handleNavigate} 
                isLoggedIn={isLoggedIn} 
                onLogout={handleLogout} 
                isAdmin={isAdmin} 
                unreadNotifications={unreadNotifications}
                renderButton={false}
                externalMenuVisible={isMenuVisible}
                onMenuToggle={setIsMenuVisible}
              />
              
              {/* Header - Layout: Links "Willkommen bei", Rechts großes Logo */}
              <View style={styles.header}>
                {/* Linke Seite: Willkommen und bei */}
                <View style={styles.headerLeft}>
                  <Text style={styles.greeting} numberOfLines={1}>Willkommen</Text>
                  <Text style={styles.greetingSub}>bei</Text>
                </View>
                
                {/* Rechte Seite: Großes Logo */}
                <View style={styles.headerRightLogo}>
                  {!isLoggedIn ? (
                    <Image 
                      source={require('./assets/images/Logo_white.png')}
                      style={styles.headerLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <TouchableOpacity 
                      style={styles.notificationButton}
                      onPress={() => handleNavigate('notifications')}
                    >
                      <Text style={styles.notificationIcon}>🔔</Text>
                      <NotificationBadge 
                        count={unreadNotifications}
                        onPress={() => handleNavigate('notifications')}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              {/* Content Container - Buttons füllen den gesamten Bereich zwischen Header und Footer */}
              <LinearGradient
                colors={[
                  'rgba(212, 175, 55, 0.88)',      // Dunkles Gold (unten am untersten Button)
                  'rgba(225, 190, 70, 0.84)',      // Gold
                  'rgba(238, 205, 95, 0.80)',      // Mittleres Gold
                  'rgba(245, 220, 130, 0.76)',     // Hellgold
                  'rgba(250, 235, 165, 0.72)',     // Sehr helles Gold
                  'rgba(253, 245, 195, 0.68)',     // Creme
                  'rgba(255, 251, 235, 0.64)'      // Fast Weiß (oben am obersten Button)
                ]} // Durchgehender Champagner-Gradient von unten nach oben über alle Buttons
                start={{ x: 0, y: 1 }} // Unten
                end={{ x: 0, y: 0 }} // Oben
                style={{
                  position: 'absolute',
                  top: totalHeaderHeight,
                  left: 0,
                  width: screenWidth,
                  height: availableContentHeight,
                }}
              >
                <View style={{ 
                  height: availableContentHeight,
                  width: screenWidth,
                  flexDirection: 'column',
                  paddingHorizontal: 0,
                  marginHorizontal: 0,
                  backgroundColor: 'transparent',
                  flex: 1,
                  position: 'relative',
                }}
                >
                  
                  {/* Login Button (unten) - Transparent, Gradient zeigt durch */}
                  <TouchableOpacity
                    style={[
                      styles.fullWidthButton,
                      styles.loginButton,
                      { backgroundColor: 'transparent' }
                    ]}
                    onPress={handleShowLogin}
                  >
                    <View style={styles.buttonContent}>
                      <View style={styles.loginBadge}>
                        <Text style={styles.badgeTextLight}>L</Text>
                      </View>
                      <Text style={[styles.fullWidthButtonText, styles.darkButtonText]}>Login</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Registrieren Button (mitte) - Transparent, Gradient zeigt durch */}
                  <TouchableOpacity
                    style={[
                      styles.fullWidthButton,
                      styles.registerButton,
                      { backgroundColor: 'transparent' }
                    ]}
                    onPress={handleShowRegister}
                  >
                    <View style={styles.buttonContent}>
                      <View style={styles.registerBadge}>
                        <Text style={styles.badgeTextLight}>R</Text>
                      </View>
                      <Text style={[styles.fullWidthButtonText, styles.darkButtonText]}>Registrieren</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Info Button (oben) - Transparent, Gradient zeigt durch */}
                  <TouchableOpacity
                    style={[
                      styles.fullWidthButton,
                      styles.infoButton,
                      { backgroundColor: 'transparent' }
                    ]}
                    onPress={() => handleNavigate('info')}
                  >
                    <View style={styles.buttonContent}>
                      <View style={styles.infoBadge}>
                        <Text style={styles.badgeTextLight}>I</Text>
                      </View>
                      <Text style={[styles.fullWidthButtonText, styles.darkButtonText]}>Das ist BT</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
            <BottomNavigation onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)', // Dezenter gemacht
    borderBottomWidth: 1,
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
    fontSize: 40, // Vergrößert von 32 auf 40
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    borderTopWidth: 1,
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
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
  // Loading Screen Styles entfernt
});