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
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import OptimizedImage from '../components/OptimizedImage';
import { collection, getDocs, query, orderBy, deleteDoc, doc, writeBatch, getDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import { deleteTradeRequest, deleteNotificationsForTradeRequest, deleteNotificationsForChat, deleteNotificationsForHint, rejectTradeRequestsForChat } from '../services/database-web';
import { getCurrentUser } from '../services/testAuth';

export default function AdminDataManagementScreen({ onNavigate, onLogout, isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [allChats, setAllChats] = useState([]);
  const [allHints, setAllHints] = useState([]);
  const [allTrades, setAllTrades] = useState([]);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'hints', 'trades'

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadChats(),
        loadHints(),
        loadTradeRequests()
      ]);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Daten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      // Lade ALLE Chats aus Firestore (inkl. gelöschte für Admin-Übersicht)
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
          return true; // Zeige ALLE Chats, auch gelöschte
        });
      setAllChats(chatsData);
      console.log(`✅ ${chatsData.length} Chats geladen (inkl. gelöschte)`);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Chats:', error);
      try {
        const chatsSnapshot = await getDocs(collection(db, 'chats'));
        const chatsData = chatsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(chat => chat.entryType !== 'hint');
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
        .filter(hint => hint.entryType === 'hint'); // Nur Hinweise
      setAllHints(hintsData);
      console.log(`✅ ${hintsData.length} Hinweise geladen`);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Hinweise:', error);
      setAllHints([]);
    }
  };

  const loadTradeRequests = async () => {
    try {
      const tradeRequestsQuery = query(
        collection(db, 'tradeRequests'),
        orderBy('createdAt', 'desc')
      );
      const tradeRequestsSnapshot = await getDocs(tradeRequestsQuery);
      const tradesData = tradeRequestsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setAllTrades(tradesData);
      console.log(`✅ ${tradesData.length} Trade-Requests geladen`);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Trade-Requests:', error);
      try {
        const tradeRequestsSnapshot = await getDocs(collection(db, 'tradeRequests'));
        const tradesData = tradeRequestsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setAllTrades(tradesData);
        console.log(`✅ ${tradesData.length} Trade-Requests geladen (Fallback)`);
      } catch (fallbackError) {
        console.error('❌ Fehler beim Laden der Trade-Requests (Fallback):', fallbackError);
        setAllTrades([]);
      }
    }
  };

  const handleDeleteChat = async (chatId) => {
    Alert.alert(
      'Chat löschen',
      'Möchten Sie diesen Chat wirklich PHYSISCH aus Firestore löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!\n\nAlle Nachrichten werden ebenfalls gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'PHYSISCH löschen', style: 'destructive', onPress: async () => {
          try {
            // WICHTIG: Zuerst Trade-Requests auf 'rejected' setzen
            try {
              const chatDoc = await getDoc(doc(db, 'chats', chatId));
              if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                const tradeRequestId = chatData.tradeRequestId;
                if (tradeRequestId) {
                  await rejectTradeRequestsForChat(chatId, tradeRequestId);
                  console.log('✅ Trade-Requests für Chat auf rejected gesetzt:', chatId);
                }
              }
            } catch (tradeError) {
              console.error('⚠️ Fehler beim Rejecten der Trade-Requests (fortsetzen):', tradeError);
            }
            
            // Lösche alle zugehörigen Nachrichten aus Firestore (Subcollection)
            // WICHTIG: Messages sind als Subcollection unter chats/{chatId}/messages gespeichert
            try {
              const messagesSubcollectionRef = collection(db, 'chats', chatId, 'messages');
              const messagesSnapshot = await getDocs(messagesSubcollectionRef);
              const messageBatch = writeBatch(db);
              let messageCount = 0;
              
              messagesSnapshot.docs.forEach(messageDoc => {
                messageBatch.delete(messageDoc.ref);
                messageCount++;
              });
              
              if (messageCount > 0) {
                await messageBatch.commit();
                console.log(`✅ ${messageCount} Nachrichten aus Subcollection gelöscht`);
              }
              
              // Fallback: Prüfe auch Root-Collection "messages" (für alte Datenstruktur)
              try {
                const messagesRootQuery = query(
                  collection(db, 'messages'),
                  where('chatId', '==', chatId)
                );
                const messagesRootSnapshot = await getDocs(messagesRootQuery);
                if (messagesRootSnapshot.docs.length > 0) {
                  const rootBatch = writeBatch(db);
                  messagesRootSnapshot.docs.forEach(messageDoc => {
                    rootBatch.delete(messageDoc.ref);
                  });
                  await rootBatch.commit();
                  console.log(`✅ ${messagesRootSnapshot.docs.length} Nachrichten aus Root-Collection gelöscht`);
                }
              } catch (rootError) {
                console.warn('⚠️ Keine Root-Collection Messages gefunden (normal):', rootError);
              }
            } catch (subcollectionError) {
              console.error('⚠️ Fehler beim Löschen der Messages-Subcollection:', subcollectionError);
            }
            
            // Lösche zugehörige Notifications
            try {
              const targetChat = allChats.find(chat => chat.id === chatId);
              const userIds = new Set(
                (targetChat?.participants || []).filter(Boolean)
              );
              if (userIds.size > 0) {
                await Promise.all(
                  Array.from(userIds).map(uid =>
                    deleteNotificationsForChat(
                      uid,
                      chatId,
                      targetChat?.tradeRequestId || null
                    )
                  )
                );
              }
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Notifications:', notifError);
            }
            
            // PHYSISCH löschen aus Firestore
            await deleteDoc(doc(db, 'chats', chatId));
            console.log('✅ Chat physisch gelöscht:', chatId);
            
            // Aktualisiere die Liste
            setAllChats(prev => prev.filter(chat => chat.id !== chatId));
            await loadChats();
            
            Alert.alert('Erfolg', 'Chat wurde physisch aus Firestore gelöscht!');
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
      'Möchten Sie diesen Hinweis wirklich PHYSISCH aus Firestore löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'PHYSISCH löschen', style: 'destructive', onPress: async () => {
          try {
            const targetHint = allHints.find(hint => hint.id === hintId);
            const tradeRequestId = targetHint?.tradeRequestId || targetHint?.requestId || null;
            
            // Lösche zugehörige Notifications
            try {
              const userIds = new Set();
              if (targetHint?.userId) userIds.add(targetHint.userId);
              if (targetHint?.fromUserId) userIds.add(targetHint.fromUserId);
              if (targetHint?.toUserId) userIds.add(targetHint.toUserId);
              
              if (tradeRequestId && userIds.size > 0) {
                await Promise.all(
                  Array.from(userIds).map(uid =>
                    deleteNotificationsForHint(uid, tradeRequestId)
                  )
                );
              }
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Notifications:', notifError);
            }
            
            // PHYSISCH löschen aus Firestore
            await deleteDoc(doc(db, 'chats', hintId));
            console.log('✅ Hinweis physisch gelöscht:', hintId);
            
            // Aktualisiere die Liste
            setAllHints(prev => prev.filter(hint => hint.id !== hintId));
            await loadHints();
            
            Alert.alert('Erfolg', 'Hinweis wurde physisch aus Firestore gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'Hinweis konnte nicht gelöscht werden: ' + error.message);
          }
        }}
      ]
    );
  };

  const handleDeleteTrade = async (tradeId) => {
    Alert.alert(
      'Trade-Request löschen',
      'Möchten Sie diesen Trade-Request wirklich PHYSISCH aus Firestore löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'PHYSISCH löschen', style: 'destructive', onPress: async () => {
          try {
            const targetTrade = allTrades.find(trade => trade.id === tradeId);
            
            // Lösche zugehörige Notifications
            try {
              const userIds = new Set();
              if (targetTrade?.fromUserId) userIds.add(targetTrade.fromUserId);
              if (targetTrade?.toUserId) userIds.add(targetTrade.toUserId);
              
              if (userIds.size > 0) {
                await Promise.all(
                  Array.from(userIds).map(uid => {
                    return Promise.all([
                      deleteNotificationsForTradeRequest(uid, tradeId),
                      deleteNotificationsForHint(uid, tradeId)
                    ]);
                  })
                );
              }
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Notifications:', notifError);
            }
            
            // PHYSISCH löschen aus Firestore
            await deleteDoc(doc(db, 'tradeRequests', tradeId));
            console.log('✅ Trade-Request physisch gelöscht:', tradeId);
            
            // Aktualisiere die Liste
            setAllTrades(prev => prev.filter(trade => trade.id !== tradeId));
            await loadTradeRequests();
            
            Alert.alert('Erfolg', 'Trade-Request wurde physisch aus Firestore gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'Trade-Request konnte nicht gelöscht werden: ' + error.message);
          }
        }}
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'ALLE Daten löschen',
      'Möchten Sie wirklich ALLE Chats, Hinweise UND Trades PHYSISCH aus Firestore löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!\n\nEs werden gelöscht:\n• Alle Chats\n• Alle Hinweise\n• Alle Trade-Requests\n• Alle zugehörigen Nachrichten\n• Alle zugehörigen Notifications',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'ALLE löschen', style: 'destructive', onPress: async () => {
          try {
            Alert.alert('🔄 Löschung läuft...', 'Bitte warten, dies kann einige Zeit dauern...');
            
            let deletedChats = 0;
            let deletedHints = 0;
            let deletedTrades = 0;
            let deletedMessages = 0;
            
            // 1. Lösche alle Chats
            for (const chat of allChats) {
              try {
                // Lösche Messages-Subcollection
                const messagesSubcollectionRef = collection(db, 'chats', chat.id, 'messages');
                const messagesSnapshot = await getDocs(messagesSubcollectionRef);
                const messageBatch = writeBatch(db);
                messagesSnapshot.docs.forEach(messageDoc => {
                  messageBatch.delete(messageDoc.ref);
                  deletedMessages++;
                });
                if (messagesSnapshot.docs.length > 0) {
                  await messageBatch.commit();
                }
                
                // Lösche Chat-Dokument
                await deleteDoc(doc(db, 'chats', chat.id));
                deletedChats++;
              } catch (error) {
                console.error(`⚠️ Fehler beim Löschen von Chat ${chat.id}:`, error);
              }
            }
            
            // 2. Lösche alle Hinweise
            for (const hint of allHints) {
              try {
                await deleteDoc(doc(db, 'chats', hint.id));
                deletedHints++;
              } catch (error) {
                console.error(`⚠️ Fehler beim Löschen von Hinweis ${hint.id}:`, error);
              }
            }
            
            // 3. Lösche alle Trade-Requests
            for (const trade of allTrades) {
              try {
                await deleteDoc(doc(db, 'tradeRequests', trade.id));
                deletedTrades++;
              } catch (error) {
                console.error(`⚠️ Fehler beim Löschen von Trade ${trade.id}:`, error);
              }
            }
            
            // 4. Lösche zugehörige Notifications
            try {
              const allUsersSnapshot = await getDocs(collection(db, 'users'));
              for (const userDoc of allUsersSnapshot.docs) {
                const userId = userDoc.id;
                const notificationsSnapshot = await getDocs(
                  collection(db, 'users', userId, 'notifications')
                );
                
                const notifBatch = writeBatch(db);
                notificationsSnapshot.docs.forEach(notifDoc => {
                  const notifData = notifDoc.data();
                  if (notifData.type === 'chat' || notifData.type === 'hint-decision' || notifData.type === 'hint-small' || notifData.chatId || notifData.requestId) {
                    notifBatch.delete(doc(db, 'users', userId, 'notifications', notifDoc.id));
                  }
                });
                if (notificationsSnapshot.docs.length > 0) {
                  await notifBatch.commit();
                }
              }
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Notifications:', notifError);
            }
            
            // Aktualisiere Listen
            setAllChats([]);
            setAllHints([]);
            setAllTrades([]);
            
            Alert.alert(
              '✅ Erfolg',
              `Alle Daten wurden gelöscht:\n\n• ${deletedChats} Chats\n• ${deletedHints} Hinweise\n• ${deletedTrades} Trade-Requests\n• ${deletedMessages} Nachrichten`
            );
          } catch (error) {
            console.error('❌ Fehler beim Löschen aller Daten:', error);
            Alert.alert('Fehler', 'Fehler beim Löschen: ' + error.message);
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

  const renderChats = () => (
    <View style={styles.listContainer}>
      {isLoading ? (
        <Text style={styles.loadingText}>Lade Chats...</Text>
      ) : allChats.length === 0 ? (
        <Text style={styles.emptyText}>Keine Chats gefunden</Text>
      ) : (
        allChats.map(chat => (
          <View key={chat.id} style={styles.itemCardWrapper}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.itemCard, chat.deleted && styles.itemCardDeleted]}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Chat #{chat.id.substring(0, 8)}</Text>
                {chat.deleted && (
                  <View style={styles.deletedBadge}>
                    <Text style={styles.deletedBadgeText}>GELÖSCHT</Text>
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
                <Text style={styles.deleteButtonText}>🗑️ PHYSISCH löschen</Text>
              </TouchableOpacity>
            </LinearGradient>
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
          <View key={hint.id} style={styles.itemCardWrapper}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.itemCard, hint.deleted && styles.itemCardDeleted]}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Hinweis #{hint.id.substring(0, 8)}</Text>
                {hint.deleted && (
                  <View style={styles.deletedBadge}>
                    <Text style={styles.deletedBadgeText}>GELÖSCHT</Text>
                  </View>
                )}
              </View>
              {hint.hintType && (
                <Text style={styles.itemInfo}>Typ: {hint.hintType}</Text>
              )}
              {hint.userId && (
                <Text style={styles.itemInfo}>User: {hint.userId.substring(0, 8)}</Text>
              )}
              {hint.tradeRequestId && (
                <Text style={styles.itemInfo}>Trade-Request: {hint.tradeRequestId.substring(0, 8)}</Text>
              )}
              <Text style={styles.itemInfo}>Erstellt: {formatDate(hint.createdAt)}</Text>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteHint(hint.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️ PHYSISCH löschen</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ))
      )}
    </View>
  );

  const renderTrades = () => (
    <View style={styles.listContainer}>
      {isLoading ? (
        <Text style={styles.loadingText}>Lade Trade-Requests...</Text>
      ) : allTrades.length === 0 ? (
        <Text style={styles.emptyText}>Keine Trade-Requests gefunden</Text>
      ) : (
        allTrades.map(trade => (
          <View key={trade.id} style={styles.itemCardWrapper}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.itemCard}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Trade-Request #{trade.id.substring(0, 8)}</Text>
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: trade.status === 'pending' ? 'rgba(255, 152, 0, 0.3)' : trade.status === 'accepted' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
                    borderColor: trade.status === 'pending' ? 'rgba(255, 152, 0, 0.5)' : trade.status === 'accepted' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'
                  }
                ]}>
                  <Text style={styles.statusText}>{trade.status || 'pending'}</Text>
                </View>
              </View>
              <Text style={styles.itemInfo}>Von: {trade.fromUserId?.substring(0, 8) || 'Unbekannt'}</Text>
              <Text style={styles.itemInfo}>An: {trade.toUserId?.substring(0, 8) || 'Unbekannt'}</Text>
              <Text style={styles.itemInfo}>Erstellt: {formatDate(trade.createdAt)}</Text>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteTrade(trade.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️ PHYSISCH löschen</Text>
              </TouchableOpacity>
            </LinearGradient>
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
              <Text style={styles.greeting}>Daten-Verwaltung</Text>
            </View>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabContainer}>
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
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'trades' && styles.tabActive]}
              onPress={() => setActiveTab('trades')}
            >
              <Text style={[styles.tabText, activeTab === 'trades' && styles.tabTextActive]}>
                Trades ({allTrades.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Reload Button und Delete All Button */}
          <View style={styles.reloadButtonContainer}>
            <TouchableOpacity 
              style={styles.reloadButton}
              onPress={loadAllData}
            >
              <Text style={styles.reloadButtonText}>🔄 Daten neu laden</Text>
            </TouchableOpacity>
            {(allChats.length > 0 || allHints.length > 0 || allTrades.length > 0) && (
              <TouchableOpacity 
                style={styles.deleteAllButton}
                onPress={handleDeleteAll}
              >
                <Text style={styles.deleteAllButtonText}>🗑️ ALLE löschen</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => onNavigate('admin-dashboard')}
              >
                <Text style={styles.backButtonText}>← Zurück zum Admin-Bereich</Text>
              </TouchableOpacity>
              
              {activeTab === 'chats' && renderChats()}
              {activeTab === 'hints' && renderHints()}
              {activeTab === 'trades' && renderTrades()}
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
    backgroundColor: '#2c2c2c',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
    
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)', // Helleres Grün
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
  reloadButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  reloadButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)', // Helleres Grün
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteAllButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)', // Helleres Rot
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.5)',
  },
  deleteAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 16,
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
  listContainer: {
    marginBottom: 20,
  },
  itemCardWrapper: {
    marginBottom: 15,
  },
  itemCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  itemCardDeleted: {
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(244, 67, 54, 0.6)',
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
    color: '#FFFFFF',
    flex: 1,
    opacity: 0.95,
  },
  deletedBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)', // Helleres Rot
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.5)',
  },
  deletedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.3)', // Helleres Grün
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  itemInfo: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 4,
    opacity: 0.85,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.9,
  },
  loadingText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
  },
});

