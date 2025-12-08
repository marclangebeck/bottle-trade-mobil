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
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import { collection, getDocs, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import { 
  getAllWineries, 
  getUser,
  getWineryByOwner 
} from '../services/database-web';

export default function AdminWineriesScreen({ onNavigate, onLogout, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [wineries, setWineries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadWineries();
  }, []);

  const loadWineries = async () => {
    try {
      setIsLoading(true);
      const allWineries = await getAllWineries();
      
      // Für jedes Weingut den Owner-Status prüfen
      const wineriesWithOwnerStatus = await Promise.all(
        allWineries.map(async (winery) => {
          try {
            const owner = await getUser(winery.ownerId);
            return {
              ...winery,
              ownerExists: !!owner,
              ownerActive: owner?.status === 'active' || owner?.isActive === true,
              ownerEmail: owner?.email || 'Unbekannt',
              ownerUsername: owner?.username || 'Unbekannt'
            };
          } catch (error) {
            console.error(`❌ Fehler beim Laden des Owners für Weingut ${winery.id}:`, error);
            return {
              ...winery,
              ownerExists: false,
              ownerActive: false,
              ownerEmail: 'Fehler beim Laden',
              ownerUsername: 'Fehler beim Laden'
            };
          }
        })
      );
      
      setWineries(wineriesWithOwnerStatus);
    } catch (error) {
      console.error('❌ Error loading wineries:', error);
      Alert.alert('Fehler', 'Weingüter konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWinery = (winery) => {
    Alert.alert(
      'Weingut löschen',
      `Möchten Sie das Weingut "${winery.name}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'wineries', winery.id));
            Alert.alert('Erfolg', 'Weingut wurde gelöscht.');
            loadWineries(); // Liste neu laden
          } catch (error) {
            console.error('❌ Fehler beim Löschen des Weinguts:', error);
            Alert.alert('Fehler', 'Weingut konnte nicht gelöscht werden: ' + (error.message || 'Unbekannter Fehler'));
          }
        }}
      ]
    );
  };

  const handleCleanupOrphanedWineries = () => {
    const orphanedWineries = wineries.filter(w => !w.ownerExists || !w.ownerActive);
    
    if (orphanedWineries.length === 0) {
      Alert.alert('Info', 'Keine verwaisten Weingüter gefunden.');
      return;
    }

    Alert.alert(
      'Verwaiste Weingüter löschen',
      `Es wurden ${orphanedWineries.length} verwaiste Weingüter gefunden (Owner existiert nicht mehr oder ist nicht aktiv).\n\nMöchten Sie alle verwaisten Weingüter löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Alle löschen', style: 'destructive', onPress: async () => {
          try {
            let deletedCount = 0;
            let errorCount = 0;

            for (const winery of orphanedWineries) {
              try {
                await deleteDoc(doc(db, 'wineries', winery.id));
                deletedCount++;
              } catch (error) {
                console.error(`❌ Fehler beim Löschen von Weingut ${winery.id}:`, error);
                errorCount++;
              }
            }

            if (errorCount > 0) {
              Alert.alert(
                'Teilweise erfolgreich',
                `${deletedCount} Weingüter wurden gelöscht.\n${errorCount} Weingüter konnten nicht gelöscht werden.`
              );
            } else {
              Alert.alert('Erfolg', `${deletedCount} verwaiste Weingüter wurden gelöscht.`);
            }
            
            loadWineries(); // Liste neu laden
          } catch (error) {
            console.error('❌ Fehler beim Löschen verwaister Weingüter:', error);
            Alert.alert('Fehler', 'Verwaiste Weingüter konnten nicht gelöscht werden: ' + (error.message || 'Unbekannter Fehler'));
          }
        }}
      ]
    );
  };

  // Filtere Weingüter nach Suchtext
  const filteredWineries = wineries.filter(winery => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      winery.name?.toLowerCase().includes(query) ||
      winery.ownerEmail?.toLowerCase().includes(query) ||
      winery.ownerUsername?.toLowerCase().includes(query) ||
      winery.region?.toLowerCase().includes(query) ||
      winery.address?.toLowerCase().includes(query)
    );
  });

  // Statistik berechnen
  const stats = {
    total: wineries.length,
    verified: wineries.filter(w => w.isVerified).length,
    unverified: wineries.filter(w => !w.isVerified).length,
    orphaned: wineries.filter(w => !w.ownerExists || !w.ownerActive).length
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
          <Text style={styles.headerTitle}>Weingüter-Verwaltung</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Dynamic Hamburger Menu */}
      <DynamicHamburgerMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onNavigate={onNavigate}
        onLogout={onLogout}
        isLoggedIn={isLoggedIn}
        isAdmin={true}
        unreadCount={unreadCount}
        renderButton={false}
      />

      {/* Statistiken */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Gesamt</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.verified}</Text>
          <Text style={styles.statLabel}>Verifiziert</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.unverified}</Text>
          <Text style={styles.statLabel}>Nicht verifiziert</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F44336' }]}>{stats.orphaned}</Text>
          <Text style={styles.statLabel}>Verwaist</Text>
        </View>
      </View>

      {/* Cleanup-Button für verwaiste Weingüter */}
      {stats.orphaned > 0 && (
        <TouchableOpacity
          style={styles.cleanupButton}
          onPress={handleCleanupOrphanedWineries}
        >
          <Text style={styles.cleanupButtonText}>
            🗑️ {stats.orphaned} verwaiste Weingüter löschen
          </Text>
        </TouchableOpacity>
      )}

      {/* Suchfeld */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Nach Name, Owner, Region suchen..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DAA520" />
          <Text style={styles.loadingText}>Lade Weingüter...</Text>
        </View>
      )}

      {/* Weingüter-Liste */}
      {!isLoading && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {filteredWineries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Keine Weingüter gefunden.' : 'Keine Weingüter vorhanden.'}
              </Text>
            </View>
          ) : (
            filteredWineries.map((winery) => (
              <View
                key={winery.id}
                style={[
                  styles.wineryCard,
                  !winery.ownerExists || !winery.ownerActive ? styles.wineryCardOrphaned : null
                ]}
              >
                <View style={styles.wineryHeader}>
                  <View style={styles.wineryHeaderLeft}>
                    <Text style={styles.wineryName}>{winery.name || 'Unbenannt'}</Text>
                    <View style={styles.wineryBadges}>
                      {winery.isVerified && (
                        <View style={styles.badgeVerified}>
                          <Text style={styles.badgeText}>✅ Verifiziert</Text>
                        </View>
                      )}
                      {!winery.isVerified && (
                        <View style={styles.badgeUnverified}>
                          <Text style={styles.badgeText}>⏳ Nicht verifiziert</Text>
                        </View>
                      )}
                      {!winery.ownerExists && (
                        <View style={styles.badgeOrphaned}>
                          <Text style={styles.badgeText}>⚠️ Owner existiert nicht</Text>
                        </View>
                      )}
                      {winery.ownerExists && !winery.ownerActive && (
                        <View style={styles.badgeInactive}>
                          <Text style={styles.badgeText}>⛔ Owner nicht aktiv</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteWinery(winery)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.wineryDetails}>
                  <Text style={styles.wineryDetailText}>
                    <Text style={styles.wineryDetailLabel}>Owner: </Text>
                    {winery.ownerEmail} ({winery.ownerUsername})
                  </Text>
                  {winery.region && (
                    <Text style={styles.wineryDetailText}>
                      <Text style={styles.wineryDetailLabel}>Region: </Text>
                      {winery.region}
                    </Text>
                  )}
                  {winery.address && (
                    <Text style={styles.wineryDetailText}>
                      <Text style={styles.wineryDetailLabel}>Adresse: </Text>
                      {winery.address}
                    </Text>
                  )}
                  {winery.description && (
                    <Text style={styles.wineryDetailText} numberOfLines={2}>
                      <Text style={styles.wineryDetailLabel}>Beschreibung: </Text>
                      {winery.description}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

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
  header: {
    flexDirection: 'row',
    backgroundColor: '#2f3a3b',
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    height: 155,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerLeft: {
    width: 50,
  },
  hamburgerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerRight: {
    width: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2f3a3b',
    paddingVertical: 15,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DAA520',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  cleanupButton: {
    backgroundColor: '#F44336',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cleanupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2c2c2c',
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  wineryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  wineryCardOrphaned: {
    borderColor: '#F44336',
    borderWidth: 2,
    backgroundColor: '#2a1a1a',
  },
  wineryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  wineryHeaderLeft: {
    flex: 1,
  },
  wineryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  wineryBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeVerified: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeUnverified: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeOrphaned: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeInactive: {
    backgroundColor: '#9E9E9E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  deleteButtonText: {
    fontSize: 20,
  },
  wineryDetails: {
    marginTop: 10,
  },
  wineryDetailText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
    opacity: 0.8,
  },
  wineryDetailLabel: {
    fontWeight: '600',
    opacity: 1,
  },
});

