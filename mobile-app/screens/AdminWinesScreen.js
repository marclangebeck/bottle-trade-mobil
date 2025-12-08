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
import ProVersionButton from '../components/ProVersionButton';
import OptimizedImage from '../components/OptimizedImage';
import { collection, getDocs, deleteDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '../config/firebase-web';

export default function AdminWinesScreen({ onNavigate, onLogout, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [wines, setWines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadWines();
  }, []);

  const loadWines = async () => {
    try {
      setIsLoading(true);
      const winesQuery = query(
        collection(db, 'wines'),
        where('status', '==', 'public')
      );
      const winesSnapshot = await getDocs(winesQuery);
      const winesData = winesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWines(winesData);
    } catch (error) {
      console.error('❌ Error loading wines:', error);
      Alert.alert('Fehler', 'Weine konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWine = (wine) => {
    Alert.alert(
      'Wein löschen',
      `Möchten Sie den Wein "${wine.name || wine.title}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'wines', wine.id));
            setWines(prev => prev.filter(w => w.id !== wine.id));
            Alert.alert('Erfolg', 'Wein wurde gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'Wein konnte nicht gelöscht werden.');
          }
        }}
      ]
    );
  };

  const handleDeleteAllWines = () => {
    Alert.alert(
      'Alle Weine löschen',
      'Möchten Sie wirklich ALLE Weine aus der Weinbörse löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Alle löschen', style: 'destructive', onPress: async () => {
          try {
            const winesQuery = query(
              collection(db, 'wines'),
              where('status', '==', 'public')
            );
            const winesSnapshot = await getDocs(winesQuery);
            const batch = writeBatch(db);
            
            winesSnapshot.docs.forEach(docSnapshot => {
              batch.delete(docSnapshot.ref);
            });
            
            await batch.commit();
            setWines([]);
            Alert.alert('Erfolg', 'Alle Weine wurden gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen aller Weine:', error);
            Alert.alert('Fehler', 'Weine konnten nicht gelöscht werden.');
          }
        }}
      ]
    );
  };

  const filteredWines = wines.filter(wine => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (wine.name || '').toLowerCase().includes(searchLower) ||
      (wine.title || '').toLowerCase().includes(searchLower) ||
      (wine.weingut || '').toLowerCase().includes(searchLower) ||
      (wine.owner || '').toLowerCase().includes(searchLower)
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
              <Text style={styles.greeting}>Weinbörsen-Verwaltung</Text>
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
              
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Gesamt: {wines.length} Weine</Text>
                <Text style={styles.statsSubtitle}>Verfügbar in der Weinbörse</Text>
              </View>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Weine suchen..."
                  placeholderTextColor="#999999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {wines.length > 0 && (
                <TouchableOpacity 
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAllWines}
                >
                  <Text style={styles.deleteAllButtonText}>🗑️ Alle Weine löschen</Text>
                </TouchableOpacity>
              )}

              {isLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>Lade Weine...</Text>
                </View>
              ) : filteredWines.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🍷</Text>
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? 'Keine Weine gefunden' : 'Keine Weine in der Weinbörse'}
                  </Text>
                </View>
              ) : (
                <View style={styles.winesList}>
                  {filteredWines.map((wine) => (
                    <View key={wine.id} style={styles.wineCard}>
                      <View style={styles.wineHeader}>
                        <View style={styles.wineInfo}>
                          <Text style={styles.wineName}>{wine.name || wine.title || 'Unbekannter Wein'}</Text>
                          <Text style={styles.wineDetails}>
                            {wine.weingut || 'Unbekanntes Weingut'} • {wine.jahrgang || 'N/A'}
                          </Text>
                          <Text style={styles.wineOwner}>von {wine.owner || wine.ownerName || 'Unbekannt'}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteWine(wine)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      {wine.description && (
                        <Text style={styles.wineDescription}>{wine.description}</Text>
                      )}
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

  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
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
  deleteAllButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  winesList: {
    marginBottom: 20,
  },
  wineCard: {
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
  wineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  wineInfo: {
    flex: 1,
  },
  wineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 5,
  },
  wineDetails: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 3,
  },
  wineOwner: {
    fontSize: 12,
    color: '#666666',
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
  wineDescription: {
    fontSize: 14,
    color: '#333333',
    marginTop: 10,
    fontStyle: 'italic',
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

