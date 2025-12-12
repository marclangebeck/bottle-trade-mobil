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
  getAllWinehandel, 
  getUser,
  getWinehandelByOwner,
  verifyWinehandel,
  deleteWinehandel
} from '../services/database-web';

export default function AdminWeinhandelScreen({ onNavigate, onLogout, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [winehandel, setWinehandel] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadWinehandel();
  }, []);

  const loadWinehandel = async () => {
    try {
      setIsLoading(true);
      const allWinehandel = await getAllWinehandel();
      
      // Für jedes Weinhandel-Unternehmen den Owner-Status prüfen
      const winehandelWithOwnerStatus = await Promise.all(
        allWinehandel.map(async (winehandelItem) => {
          try {
            const owner = await getUser(winehandelItem.ownerId);
            return {
              ...winehandelItem,
              ownerExists: !!owner,
              ownerActive: owner?.status === 'active' || owner?.isActive === true,
              ownerEmail: owner?.email || 'Unbekannt',
              ownerUsername: owner?.username || 'Unbekannt'
            };
          } catch (error) {
            console.error(`❌ Fehler beim Laden des Owners für Weinhandel ${winehandelItem.id}:`, error);
            return {
              ...winehandelItem,
              ownerExists: false,
              ownerActive: false,
              ownerEmail: 'Fehler beim Laden',
              ownerUsername: 'Fehler beim Laden'
            };
          }
        })
      );
      
      setWinehandel(winehandelWithOwnerStatus);
    } catch (error) {
      console.error('❌ Error loading winehandel:', error);
      Alert.alert('Fehler', 'Weinhandel-Unternehmen konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWinehandel = (winehandelItem) => {
    Alert.alert(
      'Weinhandel löschen',
      `Möchten Sie das Weinhandel-Unternehmen "${winehandelItem.name}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            await deleteWinehandel(winehandelItem.id);
            Alert.alert('Erfolg', 'Weinhandel-Unternehmen wurde gelöscht.');
            loadWinehandel(); // Liste neu laden
          } catch (error) {
            console.error('❌ Fehler beim Löschen des Weinhandels:', error);
            Alert.alert('Fehler', 'Weinhandel-Unternehmen konnte nicht gelöscht werden: ' + (error.message || 'Unbekannter Fehler'));
          }
        }}
      ]
    );
  };

  const handleVerifyWinehandel = (winehandelItem) => {
    const isVerified = winehandelItem.isVerified || false;
    const action = isVerified ? 'Verifizierung entfernen' : 'verifizieren';
    
    Alert.alert(
      `Weinhandel ${action}`,
      `Möchten Sie das Weinhandel-Unternehmen "${winehandelItem.name}" wirklich ${action}?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: action, onPress: async () => {
          try {
            await verifyWinehandel(winehandelItem.id, !isVerified);
            Alert.alert('Erfolg', `Weinhandel-Unternehmen wurde ${!isVerified ? 'verifiziert' : 'Verifizierung entfernt'}.`);
            loadWinehandel(); // Liste neu laden
          } catch (error) {
            console.error('❌ Fehler beim Verifizieren des Weinhandels:', error);
            Alert.alert('Fehler', 'Verifizierung konnte nicht geändert werden: ' + (error.message || 'Unbekannter Fehler'));
          }
        }}
      ]
    );
  };

  const handleCleanupOrphanedWinehandel = () => {
    const orphanedWinehandel = winehandel.filter(w => !w.ownerExists || !w.ownerActive);
    
    if (orphanedWinehandel.length === 0) {
      Alert.alert('Info', 'Keine verwaisten Weinhandel-Unternehmen gefunden.');
      return;
    }

    Alert.alert(
      'Verwaiste Weinhandel-Unternehmen löschen',
      `Es wurden ${orphanedWinehandel.length} verwaiste Weinhandel-Unternehmen gefunden (Owner existiert nicht mehr oder ist nicht aktiv).\n\nMöchten Sie alle verwaisten Unternehmen löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Alle löschen', style: 'destructive', onPress: async () => {
          try {
            let deletedCount = 0;
            let errorCount = 0;

            for (const winehandelItem of orphanedWinehandel) {
              try {
                await deleteWinehandel(winehandelItem.id);
                deletedCount++;
              } catch (error) {
                console.error(`❌ Fehler beim Löschen von Weinhandel ${winehandelItem.id}:`, error);
                errorCount++;
              }
            }

            if (errorCount > 0) {
              Alert.alert(
                'Teilweise erfolgreich',
                `${deletedCount} Weinhandel-Unternehmen wurden gelöscht.\n${errorCount} Unternehmen konnten nicht gelöscht werden.`
              );
            } else {
              Alert.alert('Erfolg', `${deletedCount} verwaiste Weinhandel-Unternehmen wurden gelöscht.`);
            }
            
            loadWinehandel(); // Liste neu laden
          } catch (error) {
            console.error('❌ Fehler beim Löschen verwaister Weinhandel-Unternehmen:', error);
            Alert.alert('Fehler', 'Verwaiste Unternehmen konnten nicht gelöscht werden: ' + (error.message || 'Unbekannter Fehler'));
          }
        }}
      ]
    );
  };

  // Filtere Weinhandel nach Suchtext
  const filteredWinehandel = winehandel.filter(winehandelItem => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      winehandelItem.name?.toLowerCase().includes(query) ||
      winehandelItem.ownerEmail?.toLowerCase().includes(query) ||
      winehandelItem.ownerUsername?.toLowerCase().includes(query) ||
      winehandelItem.region?.toLowerCase().includes(query) ||
      winehandelItem.address?.toLowerCase().includes(query)
    );
  });

  // Statistik berechnen
  const stats = {
    total: winehandel.length,
    verified: winehandel.filter(w => w.isVerified).length,
    unverified: winehandel.filter(w => !w.isVerified).length,
    orphaned: winehandel.filter(w => !w.ownerExists || !w.ownerActive).length
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
          <Text style={styles.headerTitle}>Weinhandel-Verwaltung</Text>
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

      {/* Cleanup-Button für verwaiste Weinhandel */}
      {stats.orphaned > 0 && (
        <TouchableOpacity
          style={styles.cleanupButton}
          onPress={handleCleanupOrphanedWinehandel}
        >
          <Text style={styles.cleanupButtonText}>
            🗑️ {stats.orphaned} verwaiste Unternehmen löschen
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
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Lade Weinhandel-Unternehmen...</Text>
        </View>
      )}

      {/* Weinhandel-Liste */}
      {!isLoading && (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {filteredWinehandel.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Keine Weinhandel-Unternehmen gefunden.' : 'Keine Weinhandel-Unternehmen vorhanden.'}
              </Text>
            </View>
          ) : (
            filteredWinehandel.map((winehandelItem) => (
              <View
                key={winehandelItem.id}
                style={[
                  styles.winehandelCard,
                  !winehandelItem.ownerExists || !winehandelItem.ownerActive ? styles.winehandelCardOrphaned : null
                ]}
              >
                <View style={styles.winehandelHeader}>
                  <View style={styles.winehandelHeaderLeft}>
                    <Text style={styles.winehandelName}>{winehandelItem.name || 'Unbenannt'}</Text>
                    <View style={styles.winehandelBadges}>
                      {winehandelItem.isVerified && (
                        <View style={styles.badgeVerified}>
                          <Text style={styles.badgeText}>✅ Verifiziert</Text>
                        </View>
                      )}
                      {!winehandelItem.isVerified && (
                        <View style={styles.badgeUnverified}>
                          <Text style={styles.badgeText}>⏳ Nicht verifiziert</Text>
                        </View>
                      )}
                      {!winehandelItem.ownerExists && (
                        <View style={styles.badgeOrphaned}>
                          <Text style={styles.badgeText}>⚠️ Owner existiert nicht</Text>
                        </View>
                      )}
                      {winehandelItem.ownerExists && !winehandelItem.ownerActive && (
                        <View style={styles.badgeInactive}>
                          <Text style={styles.badgeText}>⛔ Owner nicht aktiv</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.verifyButton, winehandelItem.isVerified && styles.verifyButtonActive]}
                      onPress={() => handleVerifyWinehandel(winehandelItem)}
                    >
                      <Text style={styles.verifyButtonText}>
                        {winehandelItem.isVerified ? '✅' : '⏳'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteWinehandel(winehandelItem)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.winehandelDetails}>
                  <Text style={styles.winehandelDetailText}>
                    <Text style={styles.winehandelDetailLabel}>Owner: </Text>
                    {winehandelItem.ownerEmail} ({winehandelItem.ownerUsername})
                  </Text>
                  {winehandelItem.region && (
                    <Text style={styles.winehandelDetailText}>
                      <Text style={styles.winehandelDetailLabel}>Region: </Text>
                      {winehandelItem.region}
                    </Text>
                  )}
                  {winehandelItem.address && (
                    <Text style={styles.winehandelDetailText}>
                      <Text style={styles.winehandelDetailLabel}>Adresse: </Text>
                      {winehandelItem.address}
                    </Text>
                  )}
                  {winehandelItem.description && (
                    <Text style={styles.winehandelDetailText} numberOfLines={2}>
                      <Text style={styles.winehandelDetailLabel}>Beschreibung: </Text>
                      {winehandelItem.description}
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
    color: '#8B4513',
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
  winehandelCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  winehandelCardOrphaned: {
    borderColor: '#F44336',
    borderWidth: 2,
    backgroundColor: '#2a1a1a',
  },
  winehandelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  winehandelHeaderLeft: {
    flex: 1,
  },
  winehandelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  winehandelBadges: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  verifyButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  verifyButtonText: {
    fontSize: 20,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  deleteButtonText: {
    fontSize: 20,
  },
  winehandelDetails: {
    marginTop: 10,
  },
  winehandelDetailText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
    opacity: 0.8,
  },
  winehandelDetailLabel: {
    fontWeight: '600',
    opacity: 1,
  },
});



