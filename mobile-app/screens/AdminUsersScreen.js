import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import OptimizedImage from '../components/OptimizedImage';
import { collection, getDocs, deleteDoc, doc, query, where, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import { 
  updateUser, 
  getWineryByOwner, 
  verifyWinery, 
  getAllWinesByOwner,
  getChatsForUser,
  getTradeRequestsForUser,
  getWishesForUser
} from '../services/database-web';
import { getCurrentUser } from '../services/testAuth';

export default function AdminUsersScreen({ onNavigate, onLogout, isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsModalVisible, setUserDetailsModalVisible] = useState(false);
  const [userDetailsData, setUserDetailsData] = useState(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      Alert.alert('Fehler', 'User konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupUsers = () => {
    Alert.alert(
      'User-Datenbank bereinigen',
      'Möchten Sie ALLE User löschen, außer dem Admin-Konto?\n\nDiese Aktion kann nicht rückgängig gemacht werden!\n\nEs werden ALLE Konten gelöscht, nur das Admin-Konto bleibt erhalten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Alle löschen', style: 'destructive', onPress: async () => {
          try {
            // Lade alle User
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const allUsers = usersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Finde den richtigen Admin-Account
            const correctAdmin = allUsers.find(user => 
              (user.isAdmin === true && (user.email === 'admin@bottle-trade.de' || user.uid === 'admin-123'))
            ) || allUsers.find(user => user.isAdmin === true); // Fallback: erster Admin
            
            if (!correctAdmin) {
              Alert.alert('Fehler', 'Kein Admin-Account gefunden! Bereinigung abgebrochen.');
              return;
            }
            
            // Lösche ALLE User außer dem Admin-Konto
            const usersToDelete = allUsers.filter(user => user.id !== correctAdmin.id);
            
            // Lösche in Batches (Firestore-Limit: 500 pro Batch)
            const batchSize = 500;
            let deleteCount = 0;
            
            for (let i = 0; i < usersToDelete.length; i += batchSize) {
              const batch = writeBatch(db);
              const batchUsers = usersToDelete.slice(i, i + batchSize);
              
              batchUsers.forEach(user => {
                batch.delete(doc(db, 'users', user.id));
                deleteCount++;
              });
              
              await batch.commit();
            }
            
            // Stelle sicher, dass der Admin-Account korrekt konfiguriert ist
            await updateDoc(doc(db, 'users', correctAdmin.id), {
              isAdmin: true,
              email: 'admin@bottle-trade.de',
              username: 'admin'
            });
            
            // Lade User neu
            await loadUsers();
            
            Alert.alert(
              'Erfolg', 
              `${deleteCount} User wurden gelöscht.\n\nVerbleibendes Admin-Konto:\n${correctAdmin.email || correctAdmin.username || correctAdmin.id}`
            );
          } catch (error) {
            console.error('❌ Fehler bei der Bereinigung:', error);
            Alert.alert('Fehler', 'Bereinigung fehlgeschlagen: ' + error.message);
          }
        }}
      ]
    );
  };

  const handleBlockUser = async (user) => {
    const isBlocked = user.isBlocked || false;
    const action = isBlocked ? 'entsperren' : 'sperren';
    
    Alert.alert(
      `User ${action}`,
      `Möchten Sie den User "${user.username || user.email}" wirklich ${action}?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: action === 'sperren' ? 'Sperren' : 'Entsperren', style: action === 'sperren' ? 'destructive' : 'default', onPress: async () => {
          try {
            await updateDoc(doc(db, 'users', user.id), {
              isBlocked: !isBlocked,
              blockedAt: !isBlocked ? new Date() : null,
              blockedBy: !isBlocked ? 'admin' : null
            });
            
            // Aktualisiere lokalen State
            setUsers(prev => prev.map(u => 
              u.id === user.id 
                ? { ...u, isBlocked: !isBlocked, blockedAt: !isBlocked ? new Date() : null, blockedBy: !isBlocked ? 'admin' : null }
                : u
            ));
            
            Alert.alert('Erfolg', `User wurde ${action === 'sperren' ? 'gesperrt' : 'entsperrt'}!`);
          } catch (error) {
            console.error('❌ Fehler beim Sperren/Entsperren:', error);
            Alert.alert('Fehler', `User konnte nicht ${action} werden.`);
          }
        }}
      ]
    );
  };

  const handleVerifyWinery = async (user) => {
    const isVerified = user.isWineryVerified || false;
    const action = isVerified ? 'Verifizierung entfernen' : 'als Weingut verifizieren';
    
    Alert.alert(
      `Weingut ${isVerified ? 'Verifizierung entfernen' : 'verifizieren'}`,
      `Möchten Sie den User "${user.username || user.email}" wirklich ${action}?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: action === 'als Weingut verifizieren' ? 'Verifizieren' : 'Verifizierung entfernen', 
          style: action === 'als Weingut verifizieren' ? 'default' : 'destructive', 
          onPress: async () => {
            try {
              // Update User
              await updateUser(user.uid, {
                isWineryVerified: !isVerified
              });
              
              // Wenn verifiziert wird, verifiziere auch das Weingut-Profil (falls vorhanden)
              if (!isVerified) {
                const winery = await getWineryByOwner(user.uid);
                if (winery) {
                  await verifyWinery(winery.id, true);
                }
              } else {
                // Wenn Verifizierung entfernt wird, entferne auch vom Weingut-Profil
                const winery = await getWineryByOwner(user.uid);
                if (winery) {
                  await verifyWinery(winery.id, false);
                }
              }
              
              // Aktualisiere lokalen State
              setUsers(prev => prev.map(u => 
                u.id === user.id 
                  ? { ...u, isWineryVerified: !isVerified }
                  : u
              ));
              
              Alert.alert('Erfolg', `User wurde ${!isVerified ? 'als Weingut verifiziert' : 'Verifizierung entfernt'}!`);
            } catch (error) {
              console.error('❌ Fehler beim Verifizieren:', error);
              Alert.alert('Fehler', `User konnte nicht ${action} werden.`);
            }
          }
        }
      ]
    );
  };


  const loadUserDetails = async (user) => {
    try {
      setIsLoadingUserDetails(true);
      setSelectedUser(user);
      setUserDetailsModalVisible(true);
      
      const userId = user.uid || user.id;
      
      // Lade alle relevanten Daten parallel
      // Verwende Queries ohne orderBy, um Index-Probleme zu vermeiden
      const [wines, chats, incomingTradesRaw, outgoingTradesRaw, wishes, winery] = await Promise.all([
        getAllWinesByOwner(userId).catch(() => []),
        getChatsForUser(userId).catch(() => []),
        // Incoming trades: ohne orderBy, dann clientseitig sortieren
        getDocs(query(
          collection(db, 'tradeRequests'),
          where('toUserId', '==', userId)
        )).then(snap => {
          const trades = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Clientseitig sortieren nach createdAt (neueste zuerst)
          return trades.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds || 0) * 1000;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds || 0) * 1000;
            return bTime - aTime;
          });
        }).catch(() => []),
        // Outgoing trades: wo user der Absender ist, ohne orderBy
        getDocs(query(
          collection(db, 'tradeRequests'),
          where('fromUserId', '==', userId)
        )).then(snap => {
          const trades = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Clientseitig sortieren nach createdAt (neueste zuerst)
          return trades.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds || 0) * 1000;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds || 0) * 1000;
            return bTime - aTime;
          });
        }).catch(() => []),
        getWishesForUser(userId).catch(() => []),
        getWineryByOwner(userId).catch(() => null)
      ]);
      
      // Kombiniere incoming und outgoing trades
      const allTrades = [...incomingTradesRaw, ...outgoingTradesRaw];
      
      // Berechne Statistiken
      const publicWines = wines.filter(w => w.isPublic === true);
      const privateWines = wines.filter(w => w.isPublic !== true);
      const tradedWines = wines.filter(w => w.traded === true);
      
      const activeChats = chats.filter(c => !c.deleted && c.type === 'chat');
      const hints = chats.filter(c => !c.deleted && c.type === 'hint');
      
      const pendingTrades = allTrades.filter(t => t.status === 'pending');
      const acceptedTrades = allTrades.filter(t => t.status === 'accepted');
      const rejectedTrades = allTrades.filter(t => t.status === 'rejected');
      const completedTrades = allTrades.filter(t => t.status === 'completed');
      
      const wishesWithMatches = wishes.filter(w => w.hasMatch === true);
      
      setUserDetailsData({
        user,
        statistics: {
          wines: {
            total: wines.length,
            public: publicWines.length,
            private: privateWines.length,
            traded: tradedWines.length
          },
          chats: {
            total: activeChats.length,
            hints: hints.length
          },
          trades: {
            total: allTrades.length,
            pending: pendingTrades.length,
            accepted: acceptedTrades.length,
            rejected: rejectedTrades.length,
            completed: completedTrades.length
          },
          wishes: {
            total: wishes.length,
            withMatches: wishesWithMatches.length
          },
          winery: winery ? {
            name: winery.name,
            verified: winery.isVerified || false,
            hasProfile: true
          } : null
        },
        details: {
          wines: wines.slice(0, 10), // Zeige nur die ersten 10 Weine
          chats: activeChats.slice(0, 10),
          trades: allTrades.slice(0, 10),
          wishes: wishes.slice(0, 10)
        }
      });
    } catch (error) {
      console.error('❌ Fehler beim Laden der User-Details:', error);
      Alert.alert('Fehler', 'User-Details konnten nicht geladen werden.');
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      'User löschen',
      `Möchten Sie den User "${user.username || user.email}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!\n\nEs werden auch alle zugehörigen Daten gelöscht: Weine, Chats, Nachrichten.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            // Lösche User aus Firestore
            await deleteDoc(doc(db, 'users', user.id));
            
            // Lösche auch alle zugehörigen Weine
            const winesQuery = query(
              collection(db, 'wines'),
              where('ownerId', '==', user.uid)
            );
            const winesSnapshot = await getDocs(winesQuery);
            const winesBatch = writeBatch(db);
            winesSnapshot.docs.forEach(wineDoc => {
              winesBatch.delete(wineDoc.ref);
            });
            if (winesSnapshot.docs.length > 0) {
              await winesBatch.commit();
              console.log(`✅ ${winesSnapshot.docs.length} Weine gelöscht`);
            }
            
            // Lösche auch alle zugehörigen Chats (falls Chat-Teilnehmer)
            const chatsQuery = query(
              collection(db, 'chats'),
              where('participants', 'array-contains', user.uid)
            );
            const chatsSnapshot = await getDocs(chatsQuery);
            const chatsBatch = writeBatch(db);
            chatsSnapshot.docs.forEach(chatDoc => {
              chatsBatch.update(chatDoc.ref, {
                deleted: true,
                deletedAt: new Date(),
                deletedBy: 'admin-user-deletion'
              });
            });
            if (chatsSnapshot.docs.length > 0) {
              await chatsBatch.commit();
              console.log(`✅ ${chatsSnapshot.docs.length} Chats als gelöscht markiert`);
            }
            
            // Lösche auch alle zugehörigen Nachrichten
            const messagesQuery = query(
              collection(db, 'messages'),
              where('senderId', '==', user.uid)
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            const messagesBatch = writeBatch(db);
            messagesSnapshot.docs.forEach(messageDoc => {
              messagesBatch.delete(messageDoc.ref);
            });
            if (messagesSnapshot.docs.length > 0) {
              await messagesBatch.commit();
              console.log(`✅ ${messagesSnapshot.docs.length} Nachrichten gelöscht`);
            }
            
            setUsers(prev => prev.filter(u => u.id !== user.id));
            Alert.alert('Erfolg', 'User und alle zugehörigen Daten wurden gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'User konnte nicht gelöscht werden.');
          }
        }}
      ]
    );
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (user.username || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.firstName || '').toLowerCase().includes(searchLower) ||
      (user.lastName || '').toLowerCase().includes(searchLower)
    );
  });

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
          unreadNotifications={0}
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
              <Text style={styles.greeting}>User-Verwaltung</Text>
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
              
              <View style={styles.statsCardWrapper}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statsCard}
                >
                  <Text style={styles.statsTitle}>Gesamt: {users.length} User</Text>
                  <Text style={styles.statsSubtitle}>
                    {users.filter(u => u.isAdmin).length} Admin(s) • {users.filter(u => !u.isAdmin).length} Standard-User
                    {users.filter(u => u.isBlocked).length > 0 && ` • ${users.filter(u => u.isBlocked).length} Gesperrt`}
                    {users.filter(u => u.isWinery).length > 0 && ` • ${users.filter(u => u.isWinery).length} Weingut(e)`}
                    {users.filter(u => u.isWinery && u.isWineryVerified).length > 0 && ` • ${users.filter(u => u.isWinery && u.isWineryVerified).length} Verifiziert`}
                  </Text>
                </LinearGradient>
              </View>

              <TouchableOpacity 
                style={styles.cleanupButton}
                onPress={handleCleanupUsers}
              >
                <Text style={styles.cleanupButtonText}>🧹 User-Datenbank bereinigen</Text>
              </TouchableOpacity>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="User suchen..."
                  placeholderTextColor="#999999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {isLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>Lade User...</Text>
                </View>
              ) : filteredUsers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👤</Text>
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? 'Keine User gefunden' : 'Keine User vorhanden'}
                  </Text>
                </View>
              ) : (
                <View style={styles.usersList}>
                  {filteredUsers.map((user) => (
                    <View key={user.id} style={styles.userCardWrapper}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.userCard}
                      >
                        <View style={styles.userHeader}>
                          <View style={styles.userInfo}>
                            <View style={styles.userNameRow}>
                              <Text style={styles.userName}>
                                {user.username || user.email || 'Unbekannt'}
                              </Text>
                              {user.isAdmin && (
                                <View style={styles.adminBadge}>
                                  <Text style={styles.adminBadgeText}>👑 Admin</Text>
                                </View>
                              )}
                              {user.isBlocked && (
                                <View style={styles.blockedBadge}>
                                  <Text style={styles.blockedBadgeText}>🚫 Gesperrt</Text>
                                </View>
                              )}
                              {user.isWinery && (
                                <View style={[styles.wineryBadge, user.isWineryVerified && styles.wineryBadgeVerified]}>
                                  <Text style={styles.wineryBadgeText}>
                                    {user.isWineryVerified ? '🏰 ✅ Verifiziert' : '🏰 ⏳ Nicht verifiziert'}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.userEmail}>{user.email || 'Keine E-Mail'}</Text>
                            <Text style={styles.userDetails}>
                              {user.firstName || ''} {user.lastName || ''}
                              {user.city && ` • ${user.city}`}
                            </Text>
                          </View>
                          <View style={styles.userActions}>
                            <TouchableOpacity 
                              style={styles.detailsButton}
                              onPress={() => loadUserDetails(user)}
                            >
                              <Text style={styles.detailsButtonText}>👁️</Text>
                            </TouchableOpacity>
                            {user.isWinery && (
                              <TouchableOpacity 
                                style={[
                                  styles.verifyButton, 
                                  user.isWineryVerified && styles.verifyButtonVerified
                                ]}
                                onPress={() => handleVerifyWinery(user)}
                              >
                                <Text style={[
                                  styles.verifyButtonText,
                                  user.isWineryVerified && styles.verifyButtonTextVerified
                                ]}>
                                  {user.isWineryVerified ? '✅' : '⏳'}
                                </Text>
                              </TouchableOpacity>
                            )}
                            {!user.isAdmin && (
                              <TouchableOpacity 
                                style={[styles.blockButton, user.isBlocked && styles.unblockButton]}
                                onPress={() => handleBlockUser(user)}
                              >
                                <Text style={[styles.blockButtonText, user.isBlocked && styles.unblockButtonText]}>
                                  {user.isBlocked ? '🔓' : '🔒'}
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                              style={styles.deleteButton}
                              onPress={() => handleDeleteUser(user)}
                            >
                              <Text style={styles.deleteButtonText}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </LinearGradient>
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
        unreadNotifications={unreadNotifications}
        unreadHints={unreadHints}
      />
      
      {/* User-Details Modal */}
      <Modal
        visible={userDetailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUserDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isLoadingUserDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D2691E" />
                <Text style={styles.loadingText}>Lade User-Daten...</Text>
              </View>
            ) : userDetailsData ? (
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Vollständige User-Daten</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setUserDetailsModalVisible(false);
                      setUserDetailsData(null);
                      setSelectedUser(null);
                    }}
                  >
                    <Text style={styles.modalCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Basis-Informationen */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>👤 Basis-Informationen</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Username:</Text>
                    <Text style={styles.detailsValue}>{userDetailsData.user.username || 'Nicht gesetzt'}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>E-Mail:</Text>
                    <Text style={styles.detailsValue}>{userDetailsData.user.email || 'Nicht gesetzt'}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Name:</Text>
                    <Text style={styles.detailsValue}>
                      {userDetailsData.user.firstName || ''} {userDetailsData.user.lastName || ''}
                      {!userDetailsData.user.firstName && !userDetailsData.user.lastName && 'Nicht gesetzt'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Adresse:</Text>
                    <Text style={styles.detailsValue}>
                      {userDetailsData.user.street || ''} {userDetailsData.user.zipCode || ''} {userDetailsData.user.city || ''}
                      {!userDetailsData.user.street && !userDetailsData.user.zipCode && !userDetailsData.user.city && 'Nicht gesetzt'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Registriert am:</Text>
                    <Text style={styles.detailsValue}>
                      {userDetailsData.user.createdAt 
                        ? new Date(userDetailsData.user.createdAt.toDate ? userDetailsData.user.createdAt.toDate() : userDetailsData.user.createdAt).toLocaleDateString('de-DE')
                        : 'Unbekannt'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Status:</Text>
                    <Text style={styles.detailsValue}>
                      {userDetailsData.user.isAdmin ? '👑 Admin' : 'Standard-User'}
                      {userDetailsData.user.isBlocked && ' • 🚫 Gesperrt'}
                      {userDetailsData.user.isWinery && ' • 🏰 Weingut'}
                      {userDetailsData.user.isWineryVerified && ' • ✅ Verifiziert'}
                    </Text>
                  </View>
                </View>
                
                {/* Statistiken */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>📊 Statistiken</Text>
                  
                  <View style={styles.statsGrid}>
                    <View style={styles.statCardWrapper}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                      >
                        <Text style={styles.statNumber}>{userDetailsData.statistics.wines.total}</Text>
                        <Text style={styles.statLabel}>Weine gesamt</Text>
                        <Text style={styles.statSubtext}>
                          {userDetailsData.statistics.wines.public} öffentlich • {userDetailsData.statistics.wines.private} privat • {userDetailsData.statistics.wines.traded} getauscht
                        </Text>
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.statCardWrapper}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                      >
                        <Text style={styles.statNumber}>{userDetailsData.statistics.chats.total}</Text>
                        <Text style={styles.statLabel}>Chats</Text>
                        <Text style={styles.statSubtext}>
                          {userDetailsData.statistics.chats.hints} Hinweise
                        </Text>
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.statCardWrapper}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                      >
                        <Text style={styles.statNumber}>{userDetailsData.statistics.trades.total}</Text>
                        <Text style={styles.statLabel}>Tauschanfragen</Text>
                        <Text style={styles.statSubtext}>
                          {userDetailsData.statistics.trades.pending} offen • {userDetailsData.statistics.trades.accepted} angenommen • {userDetailsData.statistics.trades.completed} abgeschlossen
                        </Text>
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.statCardWrapper}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                      >
                        <Text style={styles.statNumber}>{userDetailsData.statistics.wishes.total}</Text>
                        <Text style={styles.statLabel}>Wünsche</Text>
                        <Text style={styles.statSubtext}>
                          {userDetailsData.statistics.wishes.withMatches} mit Matches
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                  
                  {userDetailsData.statistics.winery && (
                    <View style={styles.wineryInfoCardWrapper}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.wineryInfoCard}
                      >
                        <Text style={styles.wineryInfoTitle}>🏰 Weingut-Informationen</Text>
                        <Text style={styles.wineryInfoText}>Name: {userDetailsData.statistics.winery.name}</Text>
                        <Text style={styles.wineryInfoText}>
                          Status: {userDetailsData.statistics.winery.verified ? '✅ Verifiziert' : '⏳ Nicht verifiziert'}
                        </Text>
                      </LinearGradient>
                    </View>
                  )}
                </View>
                
                {/* Weine (erste 10) */}
                {userDetailsData.details.wines.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>🍷 Weine ({userDetailsData.details.wines.length} von {userDetailsData.statistics.wines.total})</Text>
                    {userDetailsData.details.wines.map((wine, index) => (
                      <View key={wine.id || index} style={styles.itemCardWrapper}>
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.itemCard}
                        >
                          <Text style={styles.itemTitle}>{wine.name || 'Unbenannt'}</Text>
                          <Text style={styles.itemSubtext}>
                            {wine.weingut || 'Kein Weingut'} • {wine.year || 'Kein Jahrgang'}
                            {wine.isPublic ? ' • ✅ Öffentlich' : ' • 🔒 Privat'}
                            {wine.traded ? ' • 🔄 Getauscht' : ''}
                          </Text>
                        </LinearGradient>
                      </View>
                    ))}
                    {userDetailsData.statistics.wines.total > 10 && (
                      <Text style={styles.moreItemsText}>
                        ... und {userDetailsData.statistics.wines.total - 10} weitere Weine
                      </Text>
                    )}
                  </View>
                )}
                
                {/* Chats (erste 10) */}
                {userDetailsData.details.chats.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>💬 Chats ({userDetailsData.details.chats.length} von {userDetailsData.statistics.chats.total})</Text>
                    {userDetailsData.details.chats.map((chat, index) => (
                      <View key={chat.id || index} style={styles.itemCardWrapper}>
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.itemCard}
                        >
                          <Text style={styles.itemTitle}>
                            Chat {chat.type === 'chat' ? '💬' : '💡'} {chat.entryType || chat.type}
                          </Text>
                          <Text style={styles.itemSubtext}>
                            Erstellt: {chat.createdAt 
                              ? new Date(chat.createdAt.toDate ? chat.createdAt.toDate() : chat.createdAt).toLocaleDateString('de-DE')
                              : 'Unbekannt'}
                            {chat.lastMessage && ` • Letzte Nachricht: ${chat.lastMessage.substring(0, 30)}...`}
                          </Text>
                        </LinearGradient>
                      </View>
                    ))}
                    {userDetailsData.statistics.chats.total > 10 && (
                      <Text style={styles.moreItemsText}>
                        ... und {userDetailsData.statistics.chats.total - 10} weitere Chats
                      </Text>
                    )}
                  </View>
                )}
                
                {/* Trades (erste 10) */}
                {userDetailsData.details.trades.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>🔄 Tauschanfragen ({userDetailsData.details.trades.length} von {userDetailsData.statistics.trades.total})</Text>
                    {userDetailsData.details.trades.map((trade, index) => (
                      <View key={trade.id || index} style={styles.itemCardWrapper}>
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.itemCard}
                        >
                          <Text style={styles.itemTitle}>
                            Trade {trade.status === 'pending' ? '⏳' : trade.status === 'accepted' ? '✅' : trade.status === 'rejected' ? '❌' : '🔄'} {trade.status}
                          </Text>
                          <Text style={styles.itemSubtext}>
                            Erstellt: {trade.createdAt 
                              ? new Date(trade.createdAt.toDate ? trade.createdAt.toDate() : trade.createdAt).toLocaleDateString('de-DE')
                              : 'Unbekannt'}
                            {trade.wineId && ` • Wein-ID: ${trade.wineId}`}
                          </Text>
                        </LinearGradient>
                      </View>
                    ))}
                    {userDetailsData.statistics.trades.total > 10 && (
                      <Text style={styles.moreItemsText}>
                        ... und {userDetailsData.statistics.trades.total - 10} weitere Tauschanfragen
                      </Text>
                    )}
                  </View>
                )}
                
                {/* Wünsche (erste 10) */}
                {userDetailsData.details.wishes.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>❤️ Wünsche ({userDetailsData.details.wishes.length} von {userDetailsData.statistics.wishes.total})</Text>
                    {userDetailsData.details.wishes.map((wish, index) => (
                      <View key={wish.id || index} style={styles.itemCardWrapper}>
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.itemCard}
                        >
                          <Text style={styles.itemTitle}>
                            {wish.name || 'Unbenannter Wunsch'} {wish.hasMatch ? '❤️' : '♡'}
                          </Text>
                          <Text style={styles.itemSubtext}>
                            {wish.weingut || ''} {wish.year || ''} {wish.region || ''} {wish.rebsorte || ''}
                            {wish.hasMatch && ' • ✅ Match gefunden'}
                          </Text>
                        </LinearGradient>
                      </View>
                    ))}
                    {userDetailsData.statistics.wishes.total > 10 && (
                      <Text style={styles.moreItemsText}>
                        ... und {userDetailsData.statistics.wishes.total - 10} weitere Wünsche
                      </Text>
                    )}
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
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
  statsCardWrapper: {
    marginBottom: 20,
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(218, 165, 32, 0.5)',
    paddingBottom: 8,
    opacity: 0.95,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  cleanupButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cleanupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    color: '#333333',
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
  usersList: {
    marginBottom: 20,
  },
  userCardWrapper: {
    marginBottom: 15,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
    opacity: 0.95,
  },
  adminBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 3,
    opacity: 0.85,
  },
  userDetails: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 3,
    opacity: 0.75,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  blockButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#FF9800',
  },
  unblockButton: {
    borderColor: '#4CAF50',
  },
  blockButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
  },
  unblockButtonText: {
    color: '#4CAF50',
  },
  blockedBadge: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  blockedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  wineryBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  wineryBadgeVerified: {
    backgroundColor: '#4CAF50',
  },
  wineryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#FF9800',
  },
  verifyButtonVerified: {
    borderColor: '#4CAF50',
  },
  verifyButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonTextVerified: {
    color: '#4CAF50',
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
  detailsButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#2196F3',
  },
  detailsButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2c2c2c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalCloseButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    opacity: 0.9,
  },
  modalScrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  detailsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    opacity: 0.95,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    opacity: 0.85,
  },
  detailsValue: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 2,
    textAlign: 'right',
    opacity: 0.85,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#a9c7cd',
    marginBottom: 4,
    textShadowColor: 'rgba(218, 165, 32, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.75,
  },
  wineryInfoCardWrapper: {
    marginTop: 12,
  },
  wineryInfoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  wineryInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.95,
  },
  wineryInfoText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    opacity: 0.85,
  },
  itemCardWrapper: {
    marginBottom: 8,
  },
  itemCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(218, 165, 32, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 4,
  },
  itemSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  moreItemsText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.75,
  },
});

