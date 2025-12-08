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
import { LinearGradient } from 'expo-linear-gradient';
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import { collection, getDocs, query, where, doc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanupOldTradeRequests, migrateAllLocalWineImagesToStorage, checkImageMigrationStatus } from '../services/database-web';

export default function AdminDashboardScreen({
  onNavigate,
  onLogout,
  surveys = [],
  newsletters = [],
  systemMessages = [],
  notifications = [],
  isLoggedIn = false,
  unreadCount = 0,
}, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [winesInBoerse, setWinesInBoerse] = useState(0);
  const [winesInRegals, setWinesInRegals] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStats, setMigrationStats] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    // Echtzeit-Subscriptions für Statistiken
    const cleanup = setupRealtimeStats();
    
    // Cleanup bei Unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const setupRealtimeStats = () => {
    setIsLoadingStats(true);
    
    // 1. Echtzeit-Subscription für aktive User (nicht gesperrt)
    const usersUnsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const activeCount = snapshot.docs.filter(doc => {
          const userData = doc.data();
          return !userData.isBlocked; // Nur nicht gesperrte User
        }).length;
        setActiveUsers(activeCount);
        console.log(`✅ AdminDashboard: ${activeCount} aktive User`);
        setIsLoadingStats(false);
      },
      (error) => {
        console.error('❌ Fehler bei User-Subscription:', error);
        setActiveUsers(0);
        setIsLoadingStats(false);
      }
    );

    // 2. Echtzeit-Subscription für Weine in Weinbörse (öffentlich)
    const publicWinesUnsubscribe = onSnapshot(
      query(collection(db, 'wines'), where('status', '==', 'public')),
      (snapshot) => {
        const count = snapshot.docs.length;
        setWinesInBoerse(count);
        console.log(`✅ AdminDashboard: ${count} Weine in Weinbörse`);
      },
      (error) => {
        console.error('❌ Fehler bei Weinbörse-Subscription:', error);
        setWinesInBoerse(0);
      }
    );

    // 3. Echtzeit-Subscription für alle Weine in Weinregals (nicht getauscht)
    const allWinesUnsubscribe = onSnapshot(
      collection(db, 'wines'),
      (snapshot) => {
        const count = snapshot.docs.filter(doc => {
          const wineData = doc.data();
          return wineData.status !== 'traded'; // Alle Weine außer getauschte
        }).length;
        setWinesInRegals(count);
        console.log(`✅ AdminDashboard: ${count} Weine in allen Weinregals`);
      },
      (error) => {
        console.error('❌ Fehler bei Weinregal-Subscription:', error);
        setWinesInRegals(0);
      }
    );

    // Cleanup-Funktion gibt alle Unsubscribe-Funktionen zurück
    return () => {
      usersUnsubscribe();
      publicWinesUnsubscribe();
      allWinesUnsubscribe();
    };
  };
  const adminFeatures = [
    {
      id: 'surveys',
      title: 'Umfragen',
      description: 'Umfragen erstellen und verwalten',
      icon: '📊',
      color: '#4CAF50',
      bgColor: '#E8F5E9' // Hellgrün
    },
    {
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Newsletter erstellen und versenden',
      icon: '📧',
      color: '#2196F3',
      bgColor: '#E3F2FD' // Hellblau
    },
    {
      id: 'system-announcements',
      title: 'System-Ankündigungen',
      description: 'Wichtige Ankündigungen senden',
      icon: '📢',
      color: '#FF9800',
      bgColor: '#FFF3E0' // Hellorange
    },
    {
      id: 'data-management',
      title: 'Daten-Verwaltung',
      description: 'Chats, Hinweise und Trades verwalten',
      icon: '🗂️',
      color: '#9C27B0',
      bgColor: '#F3E5F5' // Helllila
    },
    {
      id: 'wines',
      title: 'Weinbörsen-Verwaltung',
      description: 'Alle Weine anzeigen und löschen',
      icon: '🍷',
      color: '#8B4513',
      bgColor: '#EFEBE9' // Hellbraun/Beige
    },
    {
      id: 'users',
      title: 'User-Verwaltung',
      description: 'User anzeigen, löschen und sperren',
      icon: '👤',
      color: '#607D8B',
      bgColor: '#ECEFF1' // Hellgrau
    },
    {
      id: 'wineries',
      title: 'Weingüter-Verwaltung',
      description: 'Weingüter verwalten und verwaiste löschen',
      icon: '🏰',
      color: '#DAA520',
      bgColor: '#FFF8DC' // Gold/Gelb
    },
    {
      id: 'wine-ki',
      title: 'Weinregal KI',
      description: 'Weinregal mit KI-Analyse befüllen',
      icon: '🤖',
      color: '#a9c7cd',
      bgColor: '#FFF8DC' // Hellgelb/Gold
    },
    {
      id: 'shop',
      title: 'Shop-Verwaltung',
      description: 'Produkte verwalten und Bestellungen einsehen',
      icon: '🛍️',
      color: '#a9c7cd',
      bgColor: '#FFF8DC' // Hellgelb/Gold
    }
  ];

  const handleCheckMigrationStatus = async () => {
    try {
      setIsCheckingStatus(true);
      setMigrationStatus(null);
      
      const status = await checkImageMigrationStatus();
      
      setMigrationStatus(status);
      setIsCheckingStatus(false);
      
      const localWines = status.wines.filter(w => w.status === 'lokal');
      const migratedWines = status.wines.filter(w => w.status === 'migriert');
      
      Alert.alert(
        'Migrations-Status',
        `Gesamt: ${status.total} Weine\n\n✅ Migriert: ${status.migrated}\n⚠️ Lokal: ${status.local}\n❌ Kein Bild: ${status.noImage}\n\n${localWines.length > 0 ? `\nLokale Bilder gefunden:\n${localWines.slice(0, 5).map(w => `- ${w.name}`).join('\n')}${localWines.length > 5 ? `\n... und ${localWines.length - 5} weitere` : ''}` : 'Alle Bilder sind migriert!'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Fehler bei der Status-Prüfung:', error);
      setIsCheckingStatus(false);
      Alert.alert('Fehler', 'Status-Prüfung fehlgeschlagen.');
    }
  };

  const handleMigrateImages = async () => {
    Alert.alert(
      'Bild-Migration',
      'Möchten Sie alle lokalen Weinbilder zu Firebase Storage migrieren?\n\nDies kann einige Zeit dauern.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Migration starten',
          onPress: async () => {
            try {
              setIsMigrating(true);
              setMigrationStats(null);
              
              Alert.alert('Migration gestartet', 'Die Migration läuft im Hintergrund. Bitte warten Sie...');
              
              const stats = await migrateAllLocalWineImagesToStorage();
              
              setMigrationStats(stats);
              setIsMigrating(false);
              
              let message = `Erfolgreich: ${stats.success}\nFehlgeschlagen: ${stats.failed}\nÜbersprungen: ${stats.skipped}`;
              
              if (stats.failed > 0) {
                message += `\n\n⚠️ Fehlgeschlagene Migrationen:\nDie lokalen Dateien sind möglicherweise nicht mehr verfügbar (gelöscht oder auf anderem Gerät erstellt). Diese Bilder können nicht migriert werden.`;
              }
              
              Alert.alert(
                'Migration abgeschlossen',
                message,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ Fehler bei der Migration:', error);
              setIsMigrating(false);
              Alert.alert('Fehler', 'Migration fehlgeschlagen. Bitte versuchen Sie es erneut.');
            }
          }
        }
      ]
    );
  };

  const handleFeaturePress = (featureId) => {
    switch(featureId) {
      case 'surveys':
        onNavigate('admin-surveys');
        break;
      case 'newsletter':
        onNavigate('admin-newsletter');
        break;
      case 'system-announcements':
        onNavigate('admin-system-messages');
        break;
      case 'data-management':
        onNavigate('admin-data-management');
        break;
      case 'wines':
        onNavigate('admin-wines');
        break;
      case 'users':
        onNavigate('admin-users');
        break;
      case 'wineries':
        onNavigate('admin-wineries');
        break;
      case 'wine-ki':
        onNavigate('weinregal-ki');
        break;
      case 'shop':
        onNavigate('admin-shop');
        break;
      default:
        console.log('Feature not implemented yet:', featureId);
    }
  };

  const handleShowFirestoreData = async () => {
    try {
      Alert.alert('📊 Lade Firestore-Daten...', 'Bitte warten...');
      
      const data = {
        users: [],
        wines: [],
        chats: [],
        tradeRequests: [],
        notifications: {}
      };
      
      // 1. Lade alle User
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        data.users.push({
          id: doc.id,
          uid: userData.uid,
          email: userData.email,
          username: userData.username,
          isAdmin: userData.isAdmin || false
        });
      });
      
      // 2. Lade alle Weine
      const winesSnapshot = await getDocs(collection(db, 'wines'));
      winesSnapshot.forEach(doc => {
        const wineData = doc.data();
        data.wines.push({
          id: doc.id,
          name: wineData.name,
          ownerId: wineData.ownerId,
          status: wineData.status
        });
      });
      
      // 3. Lade alle Chats/Hinweise
      const chatsSnapshot = await getDocs(collection(db, 'chats'));
      chatsSnapshot.forEach(doc => {
        const chatData = doc.data();
        data.chats.push({
          id: doc.id,
          entryType: chatData.entryType || 'chat',
          hintType: chatData.hintType || null,
          status: chatData.status || null,
          participants: chatData.participants || [],
          userId: chatData.userId || null,
          tradeRequestId: chatData.tradeRequestId || null
        });
      });
      
      // 4. Lade alle Trade Requests
      const tradeRequestsSnapshot = await getDocs(collection(db, 'tradeRequests'));
      tradeRequestsSnapshot.forEach(doc => {
        const tradeData = doc.data();
        data.tradeRequests.push({
          id: doc.id,
          status: tradeData.status,
          fromUserId: tradeData.fromUserId,
          toUserId: tradeData.toUserId,
          wineId: tradeData.wineId
        });
      });
      
      // 5. Lade alle Notifications (pro User)
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      for (const userDoc of allUsersSnapshot.docs) {
        try {
          const notificationsQuery = query(collection(db, 'users', userDoc.id, 'notifications'));
          const notificationsSnapshot = await getDocs(notificationsQuery);
          const userNotifications = [];
          notificationsSnapshot.forEach(notifDoc => {
            const notifData = notifDoc.data();
            userNotifications.push({
              id: notifDoc.id,
              type: notifData.type,
              title: notifData.title,
              isRead: notifData.isRead || false
            });
          });
          if (userNotifications.length > 0) {
            data.notifications[userDoc.data().uid || userDoc.id] = userNotifications;
          }
        } catch (error) {
          // Ignoriere Fehler bei Notifications
        }
      }
      
      // Zeige Zusammenfassung
      const summary = 
        `📊 Firestore-Daten:\n\n` +
        `👤 User: ${data.users.length}\n` +
        `🍷 Weine: ${data.wines.length}\n` +
        `💬 Chats/Hinweise: ${data.chats.length}\n` +
        `🔄 Trade Requests: ${data.tradeRequests.length}\n` +
        `🔔 Notifications: ${Object.values(data.notifications).reduce((sum, arr) => sum + arr.length, 0)}\n\n` +
        `Details in der Browser-Konsole (F12)`;
      
      console.log('📊 ========== FIRESTORE DATEN ==========');
      console.log('👤 USER:', data.users);
      console.log('🍷 WEINE:', data.wines);
      console.log('💬 CHATS/HINWEISE:', data.chats);
      console.log('🔄 TRADE REQUESTS:', data.tradeRequests);
      console.log('🔔 NOTIFICATIONS:', data.notifications);
      console.log('========================================');
      
      Alert.alert('📊 Firestore-Daten', summary);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Firestore-Daten:', error);
      Alert.alert('❌ Fehler', 'Fehler beim Laden der Firestore-Daten: ' + error.message);
    }
  };

  // PHASE3: Separate Bereinigungsfunktionen für jede Kategorie
  const handleCleanupUsers = async () => {
    Alert.alert(
      '⚠️ User löschen',
      'Dies löscht ALLE User außer dem Admin-Account.\n\nDiese Aktion kann NICHT rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('🔄 Bereinigung läuft...', 'Bitte warten...');
              const ADMIN_UID = 'admin-123';
              let deletedCount = 0;
              
              const usersQuery = query(collection(db, 'users'));
              const usersSnapshot = await getDocs(usersQuery);
              let batchCount = 0;
              let currentBatch = writeBatch(db);
              
              for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                if (userData.uid !== ADMIN_UID) {
                  currentBatch.delete(doc(db, 'users', userDoc.id));
                  deletedCount++;
                  batchCount++;
                  
                  // Firestore Batches haben ein Limit von 500 Operationen
                  if (batchCount >= 500) {
                    await currentBatch.commit();
                    currentBatch = writeBatch(db);
                    batchCount = 0;
                  }
                }
              }
              
              if (batchCount > 0) await currentBatch.commit();
              
              // Statistiken werden automatisch via Echtzeit-Subscription aktualisiert
              Alert.alert('✅ User gelöscht', `${deletedCount} User wurden gelöscht.\nAdmin-Account wurde beibehalten.`);
            } catch (error) {
              console.error('❌ Fehler beim Löschen der User:', error);
              Alert.alert('❌ Fehler', 'Fehler beim Löschen der User: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleCleanupWines = async () => {
    Alert.alert(
      '⚠️ Weine löschen',
      'Dies löscht ALLE Weine aus Firestore.\n\nDiese Aktion kann NICHT rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('🔄 Bereinigung läuft...', 'Bitte warten...');
              let deletedCount = 0;
              
              const winesQuery = query(collection(db, 'wines'));
              const winesSnapshot = await getDocs(winesQuery);
              let batchCount = 0;
              let currentBatch = writeBatch(db);
              
              for (const wineDoc of winesSnapshot.docs) {
                currentBatch.delete(doc(db, 'wines', wineDoc.id));
                deletedCount++;
                batchCount++;
                
                if (batchCount >= 500) {
                  await currentBatch.commit();
                  currentBatch = writeBatch(db);
                  batchCount = 0;
                }
              }
              
              if (batchCount > 0) await currentBatch.commit();
              
              Alert.alert('✅ Weine gelöscht', `${deletedCount} Weine wurden gelöscht.`);
            } catch (error) {
              console.error('❌ Fehler beim Löschen der Weine:', error);
              Alert.alert('❌ Fehler', 'Fehler beim Löschen der Weine: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleCleanupChats = async () => {
    Alert.alert(
      '⚠️ Chats/Hinweise löschen',
      'Dies löscht ALLE Chats und Hinweise aus Firestore.\n\nDiese Aktion kann NICHT rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('🔄 Bereinigung läuft...', 'Bitte warten...');
              let deletedCount = 0;
              
              const chatsQuery = query(collection(db, 'chats'));
              const chatsSnapshot = await getDocs(chatsQuery);
              let batchCount = 0;
              let currentBatch = writeBatch(db);
              
              for (const chatDoc of chatsSnapshot.docs) {
                currentBatch.delete(doc(db, 'chats', chatDoc.id));
                deletedCount++;
                batchCount++;
                
                if (batchCount >= 500) {
                  await currentBatch.commit();
                  currentBatch = writeBatch(db);
                  batchCount = 0;
                }
              }
              
              if (batchCount > 0) await currentBatch.commit();
              
              Alert.alert('✅ Chats/Hinweise gelöscht', `${deletedCount} Chats/Hinweise wurden gelöscht.`);
            } catch (error) {
              console.error('❌ Fehler beim Löschen der Chats:', error);
              Alert.alert('❌ Fehler', 'Fehler beim Löschen der Chats: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleCleanupOldTradeRequests = async () => {
    Alert.alert(
      '🧹 Alte Trade Requests bereinigen',
      'Dies löscht nur abgelehnte (rejected) und beendete (accepted) Trade Requests.\n\nOffene (pending) Trade Requests bleiben erhalten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Bereinigen',
          style: 'default',
          onPress: async () => {
            try {
              Alert.alert('🔄 Bereinigung läuft...', 'Bitte warten...');
              const result = await cleanupOldTradeRequests();
              Alert.alert(
                '✅ Bereinigung abgeschlossen',
                `${result.deleted} alte Trade Requests wurden gelöscht.\n\nOffene Trade Requests bleiben erhalten.`
              );
            } catch (error) {
              console.error('❌ Fehler beim Bereinigen der Trade Requests:', error);
              Alert.alert('❌ Fehler', 'Fehler beim Bereinigen: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleCleanupTradeRequests = async () => {
    Alert.alert(
      '⚠️ Trade Requests löschen',
      'Dies löscht ALLE Trade Requests aus Firestore (inkl. pending).\n\nDiese Aktion kann NICHT rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('🔄 Bereinigung läuft...', 'Bitte warten...');
              let deletedCount = 0;
              
              const tradeRequestsQuery = query(collection(db, 'tradeRequests'));
              const tradeRequestsSnapshot = await getDocs(tradeRequestsQuery);
              let batchCount = 0;
              let currentBatch = writeBatch(db);
              
              for (const tradeDoc of tradeRequestsSnapshot.docs) {
                currentBatch.delete(doc(db, 'tradeRequests', tradeDoc.id));
                deletedCount++;
                batchCount++;
                
                if (batchCount >= 500) {
                  await currentBatch.commit();
                  currentBatch = writeBatch(db);
                  batchCount = 0;
                }
              }
              
              if (batchCount > 0) await currentBatch.commit();
              
              Alert.alert('✅ Trade Requests gelöscht', `${deletedCount} Trade Requests wurden gelöscht.`);
            } catch (error) {
              console.error('❌ Fehler beim Löschen der Trade Requests:', error);
              Alert.alert('❌ Fehler', 'Fehler beim Löschen der Trade Requests: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleCleanupNotifications = async () => {
    Alert.alert(
      '⚠️ Notifications löschen',
      'Dies löscht ALLE Notifications aus Firestore.\n\nDiese Aktion kann NICHT rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('🔄 Bereinigung läuft...', 'Bitte warten...');
              let deletedCount = 0;
              
              // Notifications sind in Subcollections unter users/{userId}/notifications
              const allUsersSnapshot = await getDocs(collection(db, 'users'));
              
              for (const userDoc of allUsersSnapshot.docs) {
                try {
                  const notificationsQuery = query(collection(db, 'users', userDoc.id, 'notifications'));
                  const notificationsSnapshot = await getDocs(notificationsQuery);
                  
                  let notifBatchCount = 0;
                  let notifCurrentBatch = writeBatch(db);
                  
                  for (const notifDoc of notificationsSnapshot.docs) {
                    notifCurrentBatch.delete(doc(db, 'users', userDoc.id, 'notifications', notifDoc.id));
                    deletedCount++;
                    notifBatchCount++;
                    
                    if (notifBatchCount >= 500) {
                      await notifCurrentBatch.commit();
                      notifCurrentBatch = writeBatch(db);
                      notifBatchCount = 0;
                    }
                  }
                  
                  if (notifBatchCount > 0) await notifCurrentBatch.commit();
                } catch (error) {
                  console.warn(`⚠️ Fehler bei Notifications für User ${userDoc.id}:`, error);
                }
              }
              
              Alert.alert('✅ Notifications gelöscht', `${deletedCount} Notifications wurden gelöscht.`);
            } catch (error) {
              console.error('❌ Fehler beim Löschen der Notifications:', error);
              Alert.alert('❌ Fehler', 'Fehler beim Löschen der Notifications: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleCleanupDatabase = () => {
    Alert.alert(
      '⚠️ Datenbereinigung',
      'Dies löscht ALLE Daten außer dem Admin-Account:\n\n' +
      '• Alle User (außer Admin)\n' +
      '• Alle Chats/Hinweise\n' +
      '• Alle Weine\n' +
      '• Alle Trade Requests\n' +
      '• Alle Notifications\n\n' +
      'Diese Aktion kann NICHT rückgängig gemacht werden!',
      [
        {
          text: 'Abbrechen',
          style: 'cancel'
        },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('🔄 Bereinigung läuft...', 'Bitte warten...');
              const ADMIN_UID = 'admin-123';
              const results = { users: 0, chats: 0, wines: 0, tradeRequests: 0, notifications: 0 };
              
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
              
              // 2. Lösche alle Chats
              const chatsQuery = query(collection(db, 'chats'));
              const chatsSnapshot = await getDocs(chatsQuery);
              const chatsBatch = writeBatch(db);
              chatsSnapshot.forEach(chatDoc => {
                chatsBatch.delete(doc(db, 'chats', chatDoc.id));
                results.chats++;
              });
              if (results.chats > 0) await chatsBatch.commit();
              
              // 3. Lösche alle Weine
              const winesQuery = query(collection(db, 'wines'));
              const winesSnapshot = await getDocs(winesQuery);
              const winesBatch = writeBatch(db);
              winesSnapshot.forEach(wineDoc => {
                winesBatch.delete(doc(db, 'wines', wineDoc.id));
                results.wines++;
              });
              if (results.wines > 0) await winesBatch.commit();
              
              // 4. Lösche alle Trade Requests
              const tradeRequestsQuery = query(collection(db, 'tradeRequests'));
              const tradeRequestsSnapshot = await getDocs(tradeRequestsQuery);
              const tradeRequestsBatch = writeBatch(db);
              tradeRequestsSnapshot.forEach(tradeDoc => {
                tradeRequestsBatch.delete(doc(db, 'tradeRequests', tradeDoc.id));
                results.tradeRequests++;
              });
              if (results.tradeRequests > 0) await tradeRequestsBatch.commit();
              
              // 5. Lösche alle Notifications
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
              
              // 6. Lösche auch AsyncStorage (lokale Backup-Daten) - ALLE Keys
              try {
                // Lösche die Haupt-Keys
                await AsyncStorage.removeItem('bottle-trade-notifications');
                await AsyncStorage.removeItem('bottle-trade-chats');
                await AsyncStorage.removeItem('bottle-trade-messages');
                
                // Lösche auch alle user-spezifischen Notification-Keys (auch für gelöschte User)
                // Lade alle Keys aus AsyncStorage und lösche alle die mit 'bottle-trade' beginnen
                const allKeys = await AsyncStorage.getAllKeys();
                const bottleTradeKeys = allKeys.filter(key => 
                  key.startsWith('bottle-trade') || 
                  key.startsWith('wine-history-') ||
                  key.includes('notifications-')
                );
                
                for (const key of bottleTradeKeys) {
                  try {
                    await AsyncStorage.removeItem(key);
                    console.log(`🗑️ AsyncStorage Key gelöscht: ${key}`);
                  } catch (err) {
                    console.warn(`⚠️ Fehler beim Löschen von Key ${key}:`, err);
                  }
                }
                
                console.log(`✅ AsyncStorage bereinigt (${bottleTradeKeys.length} Keys gelöscht)`);
              } catch (asyncError) {
                console.warn('⚠️ Fehler beim Löschen von AsyncStorage:', asyncError);
              }
              
              // Statistiken werden automatisch via Echtzeit-Subscription aktualisiert
              
              Alert.alert(
                '✅ Bereinigung abgeschlossen',
                `Gelöscht:\n` +
                `• ${results.users} User\n` +
                `• ${results.chats} Chats\n` +
                `• ${results.wines} Weine\n` +
                `• ${results.tradeRequests} Trade Requests\n` +
                `• ${results.notifications} Notifications\n` +
                `• AsyncStorage (${bottleTradeKeys.length} Keys)\n\n` +
                `Admin-Account wurde beibehalten.\n\n` +
                `Bitte App neu laden für vollständige Bereinigung.`
              );
            } catch (error) {
              console.error('❌ Fehler beim Bereinigen:', error);
              Alert.alert('❌ Fehler', 'Fehler beim Bereinigen der Daten: ' + error.message);
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
        width: '100%',
      }} />
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
            <View style={styles.headerLeft}>
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
            <View style={styles.profileSection}>
              <TouchableOpacity 
                style={styles.profileIconContainer}
                onPress={() => onNavigate('profil')}
              >
                <View style={styles.profileIconCircle}>
                  <Text style={styles.profileIconText}>A</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Tagline unter dem Logo-Header */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Admin-Bereich</Text>
            </View>
          </View>
          
<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {/* Überschrift für Admin Features */}
              <Text style={styles.sectionTitle}>⚙️ Verwaltungs-Funktionen</Text>
              
              {/* Admin Features Grid */}
              <View style={styles.featuresGrid}>
                {adminFeatures.map((feature, index) => (
                  <TouchableOpacity 
                    key={feature.id}
                    style={styles.featureCardTouchable}
                    onPress={() => handleFeaturePress(feature.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.featureCardGlass}
                    >
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription} numberOfLines={2}>{feature.description}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Stats */}
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitleWhite}>📊 Schnellübersicht</Text>
                {isLoadingStats ? (
                  <View style={styles.statsLoadingContainer}>
                    <Text style={styles.statsLoadingText}>Lade Statistiken...</Text>
                  </View>
                ) : (
                  <View style={styles.statsList}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.statCardTouchable}
                    >
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCardGlass}
                      >
                        <Text style={styles.statLabel}>Aktive User</Text>
                        <Text style={styles.statNumber}>{activeUsers}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.statCardTouchable}
                    >
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCardGlass}
                      >
                        <Text style={styles.statLabel}>Weine in Weinbörse</Text>
                        <Text style={styles.statNumber}>{winesInBoerse}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.statCardTouchable}
                    >
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCardGlass}
                      >
                        <Text style={styles.statLabel}>Weine in Weinregals</Text>
                        <Text style={styles.statNumber}>{winesInRegals}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Debug-Funktionen */}
              <View style={styles.debugContainer}>
                <Text style={styles.debugSectionTitleWhite}>🔧 System-Funktionen</Text>
                <View style={styles.debugButtonsGrid}>
                  <TouchableOpacity
                    style={styles.debugButtonCardTouchable}
                    onPress={handleShowFirestoreData}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.debugButtonCardGlass}
                    >
                      <Text style={styles.debugButtonIconCard}>📊</Text>
                      <Text style={styles.debugButtonTitle}>Firestore-Daten</Text>
                      <Text style={styles.debugButtonDescriptionCard} numberOfLines={2}>Alle Daten anzeigen</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.debugButtonCardTouchable}
                    onPress={handleCheckMigrationStatus}
                    disabled={isCheckingStatus}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.debugButtonCardGlass}
                    >
                      <Text style={styles.debugButtonIconCard}>🔍</Text>
                      <Text style={styles.debugButtonTitle}>
                        {isCheckingStatus ? 'Status prüfen...' : 'Migrations-Status'}
                      </Text>
                      <Text style={styles.debugButtonDescriptionCard} numberOfLines={2}>
                        {migrationStatus 
                          ? `✅ ${migrationStatus.migrated} | ⚠️ ${migrationStatus.local}`
                          : 'Bild-Status prüfen'
                        }
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.debugButtonCardTouchable}
                    onPress={handleMigrateImages}
                    disabled={isMigrating || isCheckingStatus}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.debugButtonCardGlass}
                    >
                      <Text style={styles.debugButtonIconCard}>🖼️</Text>
                      <Text style={styles.debugButtonTitle}>
                        {isMigrating ? 'Migration läuft...' : 'Bild-Migration'}
                      </Text>
                      <Text style={styles.debugButtonDescriptionCard} numberOfLines={2}>
                        {migrationStats
                          ? `✅ ${migrationStats.success} | ❌ ${migrationStats.failed}`
                          : 'Bilder migrieren'
                        }
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40, // 10px für iOS, damit StatusBar nicht verdeckt wird
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
  },
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
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
  profileSection: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileIconText: {
    fontSize: 25,
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
    marginBottom: 8,
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
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  dashboardButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(218, 165, 32, 0.3)', // Warmes Gold
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.5)',
  },
  dashboardButtonText: {
    fontSize: 22,
    color: '#2c2c2c', // Dunkler Text
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  featuresGrid: {
    paddingTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  featureCardTouchable: {
    flex: 1,
    minWidth: '30%',
  },
  featureCardGlass: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    opacity: 0.95,
  },
  featureDescription: {
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 13,
    textAlign: 'center',
    opacity: 0.75,
  },
  statsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    paddingHorizontal: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 15,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  statsTitleWhite: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  statsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  statCardTouchable: {
    flex: 1,
    minWidth: '30%',
  },
  statCardGlass: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.85,
    letterSpacing: 0.3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a9c7cd',
    textAlign: 'center',
    textShadowColor: 'rgba(218, 165, 32, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statsLoadingText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  cleanupContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  debugContainer: {
    paddingHorizontal: 0,
    paddingVertical: 20,
    marginBottom: 20,
  },
  debugSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 15,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  debugSectionTitleWhite: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  debugButtonsGrid: {
    paddingTop: 0,
    marginBottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  debugButtonCardTouchable: {
    flex: 1,
    minWidth: '30%',
  },
  debugButtonCardGlass: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  debugButtonIconCard: {
    fontSize: 32,
    marginBottom: 8,
  },
  debugButtonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    opacity: 0.95,
  },
  debugButtonDescriptionCard: {
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 13,
    textAlign: 'center',
    opacity: 0.75,
  },
  cleanupSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  cleanupButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  cleanupButtonSmall: {
    height: 88,
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.18)',
  },
  cleanupButtonSmallRight: {
    borderRightWidth: 0,
  },
  cleanupButtonSmallBottom: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.18)',
  },
  cleanupButtonIconContainer: {
    width: 50,
    height: 50,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cleanupButtonIconSmall: {
    fontSize: 28,
  },
  cleanupButtonInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cleanupButtonTextSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 2,
  },
  cleanupButtonDescriptionSmall: {
    fontSize: 11,
    color: '#4b4b4b',
    lineHeight: 13,
  },
  cleanupButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D32F2F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 10,
  },
  cleanupButtonIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cleanupButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  cleanupButtonDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1976D2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 15,
  },
  debugButtonIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  debugButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  debugButtonDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  debugButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#9E9E9E',
  },
  migrationStats: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '600',
  },
});
