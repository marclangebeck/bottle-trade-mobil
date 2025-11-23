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
  TextInput
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import { collection, getDocs, deleteDoc, doc, query, where, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase-web';

export default function AdminUsersScreen({ onNavigate, onLogout, isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
              <Text style={styles.greeting}>User-Verwaltung</Text>
            </View>
            <View style={styles.headerRight} />
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
                <Text style={styles.statsTitle}>Gesamt: {users.length} User</Text>
                <Text style={styles.statsSubtitle}>
                  {users.filter(u => u.isAdmin).length} Admin(s) • {users.filter(u => !u.isAdmin).length} Standard-User
                </Text>
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
                    <View key={user.id} style={styles.userCard}>
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
                          </View>
                          <Text style={styles.userEmail}>{user.email || 'Keine E-Mail'}</Text>
                          <Text style={styles.userDetails}>
                            {user.firstName || ''} {user.lastName || ''}
                            {user.city && ` • ${user.city}`}
                          </Text>
                          <Text style={styles.userBtp}>BTP: {user.btp || 0}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteUser(user)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.4)', // Warmes Gold mit Glassmorphism
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 90,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(218, 165, 32, 0.5)', // Warmes Gold Akzent
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(218, 165, 32, 0.3)',
    // Glassmorphism Effekt
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    backgroundColor: '#2c2c2c', // Dunkler auf hellem Header
    marginVertical: 3,
    borderRadius: 1.5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Header
    textAlign: 'center',
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    color: '#2f3a3b',
    marginRight: 10,
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
    color: '#333333',
    marginBottom: 3,
  },
  userDetails: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 3,
  },
  userBtp: {
    fontSize: 12,
    color: '#D2691E',
    fontWeight: '600',
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
});

