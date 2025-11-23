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
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
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
  unreadNotifications = 0,
  unreadHints = 0,
}) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [openTradeRequests, setOpenTradeRequests] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingTradeRequests, setIsLoadingTradeRequests] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStats, setMigrationStats] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  // Berechne die echten Statistiken
  const activeSurveys = surveys.filter(survey => survey.status === 'active').length;
  const unreadNotificationCount = notifications.filter(notification => !notification.read).length;
  const totalNewsletters = newsletters.length;
  const totalSystemMessages = systemMessages.length;

  useEffect(() => {
    loadActiveUsers();
    loadOpenTradeRequests();
  }, []);

  const loadActiveUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersCount = usersSnapshot.docs.length;
      setActiveUsers(usersCount);
      console.log(`✅ AdminDashboard: ${usersCount} User gefunden`);
    } catch (error) {
      console.error('❌ Fehler beim Laden der User-Anzahl:', error);
      setActiveUsers(0);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadOpenTradeRequests = async () => {
    try {
      setIsLoadingTradeRequests(true);
      const tradeRequestsQuery = query(
        collection(db, 'tradeRequests'),
        where('status', '==', 'pending')
      );
      const tradeRequestsSnapshot = await getDocs(tradeRequestsQuery);
      const pendingCount = tradeRequestsSnapshot.docs.length;
      setOpenTradeRequests(pendingCount);
      console.log(`✅ AdminDashboard: ${pendingCount} offene Trade Requests gefunden`);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Trade Requests:', error);
      setOpenTradeRequests(0);
    } finally {
      setIsLoadingTradeRequests(false);
    }
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
      id: 'trades',
      title: 'Trade-Verwaltung',
      description: 'Trades, Chats und Hinweise einzeln löschen',
      icon: '🔄',
      color: '#FF5722',
      bgColor: '#FFEBEE' // Hellrot
    },
    {
      id: 'chats',
      title: 'Chat-Verwaltung',
      description: 'Alle Chats anzeigen und löschen',
      icon: '💬',
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
      description: 'Alle User anzeigen und löschen',
      icon: '👤',
      color: '#2196F3',
      bgColor: '#E1F5FE' // Helles Cyan
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
      case 'trades':
        onNavigate('admin-trades');
        break;
      case 'chats':
        onNavigate('admin-chats');
        break;
      case 'wines':
        onNavigate('admin-wines');
        break;
      case 'users':
        onNavigate('admin-users');
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
              
              await loadActiveUsers();
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
              
              // Aktualisiere lokale Stats
              await loadActiveUsers();
              
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
          unreadNotifications={unreadNotifications}
          unreadHints={unreadHints}
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
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>Admin-Bereich</Text>
              </View>
            </View>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {/* Admin Features Grid */}
              <View style={styles.featuresGrid}>
                {adminFeatures.map((feature, index) => (
                  <TouchableOpacity 
                    key={feature.id}
                    style={[
                      styles.featureCard, 
                      { backgroundColor: feature.bgColor },
                      index % 2 === 1 ? styles.featureCardRight : null,
                      index >= 2 ? styles.featureCardBottom : null
                    ]}
                    onPress={() => handleFeaturePress(feature.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                    </View>
                    <View style={styles.featureInfoContainer}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription} numberOfLines={2}>{feature.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Stats */}
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Schnellübersicht</Text>
                <View style={styles.statsList}>
                  <View style={[styles.statCard, { backgroundColor: '#E1F5FE' }]}>
                    <Text style={styles.statNumber}>{activeUsers}</Text>
                    <Text style={styles.statLabel}>Aktive Benutzer</Text>
                  </View>
                  <View style={[styles.statCard, styles.statCardRight, { backgroundColor: '#FFF3E0' }]}>
                    <Text style={styles.statNumber}>{openTradeRequests}</Text>
                    <Text style={styles.statLabel}>Offene Tausch-Anfragen</Text>
                  </View>
                  <View style={[styles.statCard, styles.statCardBottom, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={styles.statNumber}>{activeSurveys}</Text>
                    <Text style={styles.statLabel}>Aktive Umfragen</Text>
                  </View>
                  <View style={[styles.statCard, styles.statCardRight, styles.statCardBottom, { backgroundColor: '#F3E5F5' }]}>
                    <Text style={styles.statNumber}>{unreadNotificationCount}</Text>
                    <Text style={styles.statLabel}>Ungelesene Nachrichten</Text>
                  </View>
                </View>
              </View>

              {/* PHASE3: Separate Datenbereinigung Buttons */}
              <View style={styles.cleanupContainer}>
                <Text style={styles.cleanupSectionTitle}>🔧 Einzelne Datenbereinigung</Text>
                
                <View style={styles.cleanupButtonsGrid}>
                  <TouchableOpacity 
                    style={[
                      styles.cleanupButtonSmall, 
                      { backgroundColor: '#E8F5E9' },
                      0 % 2 === 1 ? styles.cleanupButtonSmallRight : null,
                      0 >= 2 ? styles.cleanupButtonSmallBottom : null
                    ]}
                    onPress={handleCleanupUsers}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cleanupButtonIconContainer}>
                      <Text style={styles.cleanupButtonIconSmall}>👤</Text>
                    </View>
                    <View style={styles.cleanupButtonInfoContainer}>
                      <Text style={styles.cleanupButtonTextSmall}>User löschen</Text>
                      <Text style={styles.cleanupButtonDescriptionSmall} numberOfLines={2}>(außer Admin)</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.cleanupButtonSmall, 
                      { backgroundColor: '#EFEBE9' },
                      1 % 2 === 1 ? styles.cleanupButtonSmallRight : null,
                      1 >= 2 ? styles.cleanupButtonSmallBottom : null
                    ]}
                    onPress={handleCleanupWines}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cleanupButtonIconContainer}>
                      <Text style={styles.cleanupButtonIconSmall}>🍷</Text>
                    </View>
                    <View style={styles.cleanupButtonInfoContainer}>
                      <Text style={styles.cleanupButtonTextSmall}>Weine löschen</Text>
                      <Text style={styles.cleanupButtonDescriptionSmall} numberOfLines={2}>(alle Weine)</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.cleanupButtonSmall, 
                      { backgroundColor: '#F3E5F5' },
                      2 % 2 === 1 ? styles.cleanupButtonSmallRight : null,
                      2 >= 2 ? styles.cleanupButtonSmallBottom : null
                    ]}
                    onPress={handleCleanupChats}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cleanupButtonIconContainer}>
                      <Text style={styles.cleanupButtonIconSmall}>💬</Text>
                    </View>
                    <View style={styles.cleanupButtonInfoContainer}>
                      <Text style={styles.cleanupButtonTextSmall}>Chats/Hinweise löschen</Text>
                      <Text style={styles.cleanupButtonDescriptionSmall} numberOfLines={2}>(alle Chats & Hinweise)</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.cleanupButtonSmall, 
                      { backgroundColor: '#E8F5E9' },
                      3 % 2 === 1 ? styles.cleanupButtonSmallRight : null,
                      3 >= 2 ? styles.cleanupButtonSmallBottom : null
                    ]}
                    onPress={handleCleanupOldTradeRequests}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cleanupButtonIconContainer}>
                      <Text style={styles.cleanupButtonIconSmall}>🧹</Text>
                    </View>
                    <View style={styles.cleanupButtonInfoContainer}>
                      <Text style={styles.cleanupButtonTextSmall}>Alte Trade Requests bereinigen</Text>
                      <Text style={styles.cleanupButtonDescriptionSmall} numberOfLines={2}>(nur rejected/accepted)</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.cleanupButtonSmall, 
                      { backgroundColor: '#FFF3E0' },
                      4 % 2 === 1 ? styles.cleanupButtonSmallRight : null,
                      4 >= 2 ? styles.cleanupButtonSmallBottom : null
                    ]}
                    onPress={handleCleanupTradeRequests}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cleanupButtonIconContainer}>
                      <Text style={styles.cleanupButtonIconSmall}>🔄</Text>
                    </View>
                    <View style={styles.cleanupButtonInfoContainer}>
                      <Text style={styles.cleanupButtonTextSmall}>Alle Trade Requests löschen</Text>
                      <Text style={styles.cleanupButtonDescriptionSmall} numberOfLines={2}>(inkl. pending)</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.cleanupButtonSmall, 
                      { backgroundColor: '#E1F5FE' },
                      5 % 2 === 1 ? styles.cleanupButtonSmallRight : null,
                      5 >= 2 ? styles.cleanupButtonSmallBottom : null
                    ]}
                    onPress={handleCleanupNotifications}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cleanupButtonIconContainer}>
                      <Text style={styles.cleanupButtonIconSmall}>🔔</Text>
                    </View>
                    <View style={styles.cleanupButtonInfoContainer}>
                      <Text style={styles.cleanupButtonTextSmall}>Notifications löschen</Text>
                      <Text style={styles.cleanupButtonDescriptionSmall} numberOfLines={2}>(alle Notifications)</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.cleanupSectionTitle}>🗑️ Komplette Datenbereinigung</Text>
                <TouchableOpacity 
                  style={styles.cleanupButton}
                  onPress={() => handleCleanupDatabase()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cleanupButtonIcon}>🗑️</Text>
                  <Text style={styles.cleanupButtonText}>Alle Daten löschen</Text>
                  <Text style={styles.cleanupButtonDescription}>Alle Daten außer Admin löschen</Text>
                </TouchableOpacity>
                
                {/* Firestore-Daten anzeigen Button */}
                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={handleShowFirestoreData}
                  activeOpacity={0.8}
                >
                  <Text style={styles.debugButtonIcon}>📊</Text>
                  <Text style={styles.debugButtonText}>Firestore-Daten anzeigen</Text>
                  <Text style={styles.debugButtonDescription}>Zeige alle vorhandenen Daten in Firestore</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.debugButton, isCheckingStatus && styles.debugButtonDisabled]}
                  onPress={handleCheckMigrationStatus}
                  disabled={isCheckingStatus}
                  activeOpacity={0.8}
                >
                  <Text style={styles.debugButtonIcon}>🔍</Text>
                  <Text style={styles.debugButtonText}>
                    {isCheckingStatus ? 'Status wird geprüft...' : 'Migrations-Status prüfen'}
                  </Text>
                  <Text style={styles.debugButtonDescription}>
                    Zeigt an, welche Bilder migriert sind und welche noch lokal sind
                  </Text>
                  {migrationStatus && (
                    <Text style={styles.migrationStats}>
                      Gesamt: {migrationStatus.total} | ✅ Migriert: {migrationStatus.migrated} | ⚠️ Lokal: {migrationStatus.local} | ❌ Kein Bild: {migrationStatus.noImage}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.debugButton, isMigrating && styles.debugButtonDisabled]}
                  onPress={handleMigrateImages}
                  disabled={isMigrating || isCheckingStatus}
                  activeOpacity={0.8}
                >
                  <Text style={styles.debugButtonIcon}>🖼️</Text>
                  <Text style={styles.debugButtonText}>
                    {isMigrating ? 'Migration läuft...' : 'Bild-Migration durchführen'}
                  </Text>
                  <Text style={styles.debugButtonDescription}>
                    Migriert alle lokalen Weinbilder zu Firebase Storage
                  </Text>
                  {migrationStats && (
                    <Text style={styles.migrationStats}>
                      Erfolgreich: {migrationStats.success} | Fehlgeschlagen: {migrationStats.failed} | Übersprungen: {migrationStats.skipped}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        <Footer />
      </View>
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadNotifications={unreadNotifications}
        unreadHints={unreadHints}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40, // 10px für iOS, damit StatusBar nicht verdeckt wird
    paddingBottom: 10,
    borderBottomWidth: 0,
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
    marginLeft: 12,
    marginRight: 12,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 25,
    backgroundColor: '#2c2c2c',
    position: 'relative',
    marginTop: 0,
    minHeight: 70,
    borderTopWidth: 0,
    borderBottomWidth: 0,
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
  greetingContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  greeting: {
    fontSize: 45,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    fontStyle: 'italic',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 215, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
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
  },
  featureCard: {
    height: 88,
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.18)',
  },
  featureCardRight: {
    borderRightWidth: 0,
  },
  featureCardBottom: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.18)',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
  },
  featureInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 11,
    color: '#4b4b4b',
    lineHeight: 13,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 15,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  statsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    height: 50,
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.18)',
  },
  statCardRight: {
    borderRightWidth: 0,
  },
  statCardBottom: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.18)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#2f3a3b',
    fontWeight: '600',
  },
  cleanupContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
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
