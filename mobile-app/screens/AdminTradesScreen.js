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
import { collection, getDocs, query, orderBy, deleteDoc, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import { deleteTradeRequest, deleteNotificationsForTradeRequest, deleteNotificationsForChat, deleteNotificationsForHint } from '../services/database-web';
import { getCurrentUser } from '../services/testAuth';

export default function AdminTradesScreen({ onNavigate, onLogout, chats = [], onDeleteSingleTrade = null, onDeleteChatOnly = null, onDeleteHintOnly = null, isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [allTrades, setAllTrades] = useState([]);
  const [allChats, setAllChats] = useState([]);
  const [allHints, setAllHints] = useState([]);
  const [activeTab, setActiveTab] = useState('trades'); // 'trades', 'chats', 'hints'

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTradeRequests(),
        loadChats(),
        loadHints()
      ]);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Daten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTradeRequests = async () => {
    try {
      // Lade alle Trade-Requests (auch rejected/completed für Admin-Übersicht)
      const tradeRequestsQuery = query(
        collection(db, 'tradeRequests'),
        orderBy('createdAt', 'desc')
      );
      const tradeRequestsSnapshot = await getDocs(tradeRequestsQuery);
      const tradesData = tradeRequestsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(trade => trade.status !== 'rejected' || !trade.deleted); // Filtere nur gelöschte rejected Trades
      setAllTrades(tradesData);
      console.log(`✅ ${tradesData.length} Trade-Requests geladen`);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Trade-Requests:', error);
      // Fallback: Lade alle ohne Query
      try {
        const tradeRequestsSnapshot = await getDocs(collection(db, 'tradeRequests'));
        const tradesData = tradeRequestsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(trade => trade.status !== 'rejected' || !trade.deleted);
        setAllTrades(tradesData);
        console.log(`✅ ${tradesData.length} Trade-Requests geladen (Fallback)`);
      } catch (fallbackError) {
        console.error('❌ Fehler beim Laden der Trade-Requests (Fallback):', fallbackError);
        setAllTrades([]);
      }
    }
  };

  const loadChats = async () => {
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
          // Nur echte Chats, keine Hinweise
          if (chat.entryType === 'hint') return false;
          // Filtere gelöschte Chats (deleted: true oder deletedBy enthält alle Teilnehmer)
          if (chat.deleted === true) return false;
          // Prüfe deletedBy Array: Wenn alle Teilnehmer gelöscht haben, nicht anzeigen
          if (chat.deletedBy && Array.isArray(chat.deletedBy) && chat.participants) {
            const allDeleted = chat.participants.every(pid => chat.deletedBy.includes(pid));
            if (allDeleted) return false;
          }
          return true;
        });
      setAllChats(chatsData);
      console.log(`✅ ${chatsData.length} Chats geladen`);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Chats:', error);
      // Fallback: Lade alle ohne Query
      try {
        const chatsSnapshot = await getDocs(collection(db, 'chats'));
        const chatsData = chatsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(chat => {
            if (chat.entryType === 'hint') return false;
            if (chat.deleted === true) return false;
            if (chat.deletedBy && Array.isArray(chat.deletedBy) && chat.participants) {
              const allDeleted = chat.participants.every(pid => chat.deletedBy.includes(pid));
              if (allDeleted) return false;
            }
            return true;
          });
        setAllChats(chatsData);
        console.log(`✅ ${chatsData.length} Chats geladen (Fallback)`);
      } catch (fallbackError) {
        console.error('❌ Fehler beim Laden der Chats (Fallback):', fallbackError);
        setAllChats([]);
      }
    }
  };

  const loadHints = async () => {
    try {
      const hintsQuery = query(
        collection(db, 'chats'),
        orderBy('createdAt', 'desc')
      );
      const hintsSnapshot = await getDocs(hintsQuery);
      const hintsData = hintsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(hint => hint.entryType === 'hint' && !hint.deleted); // Nur Hinweise
      setAllHints(hintsData);
      console.log(`✅ ${hintsData.length} Hinweise geladen`);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Hinweise:', error);
      setAllHints([]);
    }
  };

  const handleDeleteTrade = async (tradeId) => {
    Alert.alert(
      'Trade-Request löschen',
      `Möchten Sie diesen Trade-Request wirklich löschen?\n\nID: ${tradeId}\n\nDiese Aktion kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            const targetTrade = allTrades.find(trade => trade.id === tradeId);

            if (onDeleteSingleTrade) {
              await onDeleteSingleTrade(tradeId);
            } else {
              // Fallback: Direkt löschen
              await deleteTradeRequest(tradeId);
            }
            
            // Lösche auch Notifications
            try {
              const userIds = new Set();
              if (targetTrade?.fromUserId) userIds.add(targetTrade.fromUserId);
              if (targetTrade?.toUserId) userIds.add(targetTrade.toUserId);

              if (userIds.size === 0) {
                const currentUser = getCurrentUser();
                if (currentUser?.uid) {
                  userIds.add(currentUser.uid);
                }
              }

              await Promise.all(
                Array.from(userIds).map(async uid => {
                  await deleteNotificationsForTradeRequest(uid, tradeId);
                  await deleteNotificationsForHint(uid, tradeId);
                })
              );
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Notifications:', notifError);
            }
            
            // Aktualisiere die Liste
            setAllTrades(prev => prev.filter(trade => trade.id !== tradeId));
            
            // Lade die Liste neu, um sicherzustellen, dass alles synchronisiert ist
            await loadTradeRequests();
            
            Alert.alert('Erfolg', 'Trade-Request wurde gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'Trade-Request konnte nicht gelöscht werden: ' + error.message);
          }
        }}
      ]
    );
  };

  const handleDeleteChat = async (chatId) => {
    Alert.alert(
      'Chat löschen',
      `Möchten Sie diesen Chat wirklich löschen?\n\nID: ${chatId}\n\nDiese Aktion kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            if (onDeleteChatOnly) {
              await onDeleteChatOnly(chatId);
            } else {
              Alert.alert('Fehler', 'Lösch-Funktion nicht verfügbar');
              return;
            }

            try {
              const targetChat = allChats.find(chat => chat.id === chatId);
              const userIds = new Set(
                (targetChat?.participants || []).filter(Boolean)
              );

              if (userIds.size === 0) {
                const currentUser = getCurrentUser();
                if (currentUser?.uid) {
                  userIds.add(currentUser.uid);
                }
              }

              await Promise.all(
                Array.from(userIds).map(uid =>
                  deleteNotificationsForChat(
                    uid,
                    chatId,
                    targetChat?.tradeRequestId || targetChat?.requestId || null
                  )
                )
              );
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Chat-Notifications:', notifError);
            }
            
            // Aktualisiere die Liste
            setAllChats(prev => prev.filter(chat => chat.id !== chatId));
            
            // Lade die Liste neu, um sicherzustellen, dass alles synchronisiert ist
            await loadChats();
            
            Alert.alert('Erfolg', 'Chat wurde gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'Chat konnte nicht gelöscht werden: ' + error.message);
          }
        }}
      ]
    );
  };

  const handleDeleteHint = async (hintId) => {
    Alert.alert(
      'Hinweis löschen',
      `Möchten Sie diesen Hinweis wirklich löschen?\n\nID: ${hintId}\n\nDiese Aktion kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            if (onDeleteHintOnly) {
              await onDeleteHintOnly(hintId);
            } else {
              Alert.alert('Fehler', 'Lösch-Funktion nicht verfügbar');
              return;
            }

            try {
              const targetHint = allHints.find(hint => hint.id === hintId);
              const tradeRequestId = targetHint?.tradeRequestId || targetHint?.requestId || targetHint?.id;
              const userIds = new Set();

              if (targetHint?.userId) userIds.add(targetHint.userId);
              if (targetHint?.fromUserId) userIds.add(targetHint.fromUserId);
              if (targetHint?.toUserId) userIds.add(targetHint.toUserId);

              if (userIds.size === 0) {
                const currentUser = getCurrentUser();
                if (currentUser?.uid) {
                  userIds.add(currentUser.uid);
                }
              }

              if (tradeRequestId) {
                await Promise.all(
                  Array.from(userIds).map(uid =>
                    deleteNotificationsForHint(uid, tradeRequestId)
                  )
                );
              }
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Hinweis-Notifications:', notifError);
            }
            
            // Aktualisiere die Liste
            setAllHints(prev => prev.filter(hint => hint.id !== hintId));
            
            // Lade die Liste neu, um sicherzustellen, dass alles synchronisiert ist
            await loadHints();
            
            Alert.alert('Erfolg', 'Hinweis wurde gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'Hinweis konnte nicht gelöscht werden: ' + error.message);
          }
        }}
      ]
    );
  };

  const handleDeleteAllTrades = async () => {
    Alert.alert(
      'Alle Trade-Requests löschen',
      'Möchten Sie wirklich ALLE Trade-Requests löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Alle löschen', style: 'destructive', onPress: async () => {
          try {
            // Lade ALLE Trade-Requests direkt aus Firestore
            let tradesSnapshot;
            try {
              const tradesQuery = query(
                collection(db, 'tradeRequests'),
                orderBy('createdAt', 'desc')
              );
              tradesSnapshot = await getDocs(tradesQuery);
            } catch (error) {
              // Fallback: Lade alle ohne Query
              console.warn('⚠️ Query fehlgeschlagen, lade alle Trades direkt:', error);
              tradesSnapshot = await getDocs(collection(db, 'tradeRequests'));
            }
            
            // Filtere manuell: Nur Trades die noch nicht rejected/gelöscht sind
            const tradesToDelete = tradesSnapshot.docs.filter(docSnapshot => {
              const tradeData = docSnapshot.data();
              // Überspringe bereits rejected/gelöschte Trades
              if (tradeData.status === 'rejected' && tradeData.deleted === true) return false;
              return true;
            });
            
            console.log(`🔄 Gefunden: ${tradesSnapshot.docs.length} Trades total, ${tradesToDelete.length} zum Löschen`);
            
            if (tradesToDelete.length === 0) {
              Alert.alert('Info', 'Keine Trade-Requests zum Löschen gefunden.');
              return;
            }
            
            // Lösche alle Trade-Requests direkt aus Firestore
            const batch = writeBatch(db);
            tradesToDelete.forEach(docSnapshot => {
              batch.delete(docSnapshot.ref);
            });
            await batch.commit();
            
            console.log(`✅ ${tradesToDelete.length} Trade-Requests gelöscht`);
            
            // Lösche auch zugehörige Notifications
            try {
              const allUsersSnapshot = await getDocs(collection(db, 'users'));
              const notificationDeletions = [];
              
              for (const userDoc of allUsersSnapshot.docs) {
                const userId = userDoc.id;
                const notificationsSnapshot = await getDocs(
                  collection(db, 'users', userId, 'notifications')
                );
                
                notificationsSnapshot.docs.forEach(notifDoc => {
                  const notifData = notifDoc.data();
                  // Lösche alle Notifications die zu gelöschten Trades gehören
                  if (notifData.requestId && tradesToDelete.find(t => t.id === notifData.requestId)) {
                    notificationDeletions.push(deleteDoc(doc(db, 'users', userId, 'notifications', notifDoc.id)));
                  }
                });
              }
              
              if (notificationDeletions.length > 0) {
                await Promise.all(notificationDeletions);
                console.log(`✅ ${notificationDeletions.length} Notifications gelöscht`);
              }
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Notifications (fortsetzen):', notifError);
            }
            
            // Aktualisiere die Liste
            setAllTrades([]);
            
            // Lade die Liste neu
            await loadTradeRequests();
            
            Alert.alert('Erfolg', `${tradesToDelete.length} Trade-Requests wurden gelöscht!`);
          } catch (error) {
            console.error('❌ Fehler beim Löschen aller Trade-Requests:', error);
            Alert.alert('Fehler', 'Trade-Requests konnten nicht gelöscht werden: ' + error.message);
          }
        }}
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unbekannt';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('de-DE');
    } catch (error) {
      return 'Unbekannt';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#757575';
    }
  };

  const renderTrades = () => (
    <View style={styles.listContainer}>
      {isLoading ? (
        <Text style={styles.loadingText}>Lade Trade-Requests...</Text>
      ) : allTrades.length === 0 ? (
        <Text style={styles.emptyText}>Keine Trade-Requests gefunden</Text>
      ) : (
        allTrades.map(trade => (
          <View key={trade.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Trade-Request #{trade.id.substring(0, 8)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trade.status) }]}>
                <Text style={styles.statusText}>{trade.status || 'pending'}</Text>
              </View>
            </View>
            <Text style={styles.itemInfo}>Von: {trade.fromUserId?.substring(0, 8) || 'Unbekannt'}</Text>
            <Text style={styles.itemInfo}>An: {trade.toUserId?.substring(0, 8) || 'Unbekannt'}</Text>
            <Text style={styles.itemInfo}>Erstellt: {formatDate(trade.createdAt)}</Text>
            {trade.wineFrom && <Text style={styles.itemInfo}>Wein von: {trade.wineFrom.name || 'Unbekannt'}</Text>}
            {trade.wineTo && <Text style={styles.itemInfo}>Wein zu: {trade.wineTo.name || 'Unbekannt'}</Text>}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteTrade(trade.id)}
            >
              <Text style={styles.deleteButtonText}>🗑️ Löschen</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderChats = () => (
    <View style={styles.listContainer}>
      {isLoading ? (
        <Text style={styles.loadingText}>Lade Chats...</Text>
      ) : allChats.length === 0 ? (
        <Text style={styles.emptyText}>Keine Chats gefunden</Text>
      ) : (
        allChats.map(chat => (
          <View key={chat.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Chat #{chat.id.substring(0, 8)}</Text>
              {chat.type && (
                <View style={[styles.statusBadge, { backgroundColor: '#9C27B0' }]}>
                  <Text style={styles.statusText}>{chat.type}</Text>
                </View>
              )}
            </View>
            {chat.participants && (
              <Text style={styles.itemInfo}>Teilnehmer: {chat.participants.length}</Text>
            )}
            {chat.lastMessage && (
              <Text style={styles.itemInfo} numberOfLines={2}>Letzte Nachricht: {chat.lastMessage}</Text>
            )}
            <Text style={styles.itemInfo}>Erstellt: {formatDate(chat.createdAt)}</Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteChat(chat.id)}
            >
              <Text style={styles.deleteButtonText}>🗑️ Löschen</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderHints = () => (
    <View style={styles.listContainer}>
      {isLoading ? (
        <Text style={styles.loadingText}>Lade Hinweise...</Text>
      ) : allHints.length === 0 ? (
        <Text style={styles.emptyText}>Keine Hinweise gefunden</Text>
      ) : (
        allHints.map(hint => (
          <View key={hint.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Hinweis #{hint.id.substring(0, 8)}</Text>
              {hint.hintType && (
                <View style={[styles.statusBadge, { backgroundColor: '#FF9800' }]}>
                  <Text style={styles.statusText}>{hint.hintType}</Text>
                </View>
              )}
            </View>
            {hint.userId && (
              <Text style={styles.itemInfo}>User: {hint.userId.substring(0, 8)}</Text>
            )}
            {hint.lastMessage && (
              <Text style={styles.itemInfo} numberOfLines={2}>Nachricht: {hint.lastMessage}</Text>
            )}
            <Text style={styles.itemInfo}>Erstellt: {formatDate(hint.createdAt)}</Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteHint(hint.id)}
            >
              <Text style={styles.deleteButtonText}>🗑️ Löschen</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

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
        unreadNotifications={unreadNotifications}
        renderButton={false}
        externalMenuVisible={isMenuVisible}
        onMenuToggle={setIsMenuVisible}
      />
      
      <View style={styles.contentContainer}>
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
            <Text style={styles.greeting}>Trade-Verwaltung</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'trades' && styles.tabActive]}
            onPress={() => setActiveTab('trades')}
          >
            <Text style={[styles.tabText, activeTab === 'trades' && styles.tabTextActive]}>
              Trades ({allTrades.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'chats' && styles.tabActive]}
            onPress={() => setActiveTab('chats')}
          >
            <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>
              Chats ({allChats.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'hints' && styles.tabActive]}
            onPress={() => setActiveTab('hints')}
          >
            <Text style={[styles.tabText, activeTab === 'hints' && styles.tabTextActive]}>
              Hinweise ({allHints.length})
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Reload Button */}
        <View style={styles.reloadButtonContainer}>
          <TouchableOpacity 
            style={styles.reloadButton}
            onPress={loadAllData}
          >
            <Text style={styles.reloadButtonText}>🔄 Lade Firestore Daten</Text>
          </TouchableOpacity>
        </View>
        
        {/* Delete All Buttons */}
        <View style={styles.deleteAllButtonsContainer}>
          {activeTab === 'trades' && allTrades.length > 0 && (
            <TouchableOpacity 
              style={styles.deleteAllButton}
              onPress={handleDeleteAllTrades}
            >
              <Text style={styles.deleteAllButtonText}>🗑️ Alle Trades löschen</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'trades' && renderTrades()}
          {activeTab === 'chats' && renderChats()}
          {activeTab === 'hints' && renderHints()}
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
    backgroundColor: '#d5dfe0',
  },
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  hamburgerContainer: {
    width: 40,
  },
  hamburgerButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: '#fff',
    marginVertical: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  itemInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 20,
  },
  reloadButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  reloadButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteAllButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteAllButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  deleteAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

