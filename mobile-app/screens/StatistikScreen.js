import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';
import { getCachedProfileImage } from '../services/profileImageCache';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-web';
// PLZ-Datenbank wird dynamisch geladen
let postalCodeDatabase = null;
const loadPostalCodeDatabase = () => {
  if (postalCodeDatabase) {
    return postalCodeDatabase;
  }
  try {
    postalCodeDatabase = require('../data/germanPostalCodes.json');
    return postalCodeDatabase;
  } catch (error) {
    console.error('❌ Fehler beim Laden der PLZ-Datenbank:', error);
    return null;
  }
};

// Hilfsfunktion für Initialen
const getInitials = (user) => {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  } else if (user?.username) {
    return user.username.substring(0, 2).toUpperCase();
  } else if (user?.email) {
    return user.email.substring(0, 2).toUpperCase();
  }
  return 'P';
};

/**
 * Holt Stadt und Bundesland aus PLZ
 */
const getCityAndBundesland = (zipCode) => {
  if (!zipCode) return { city: 'Unbekannt', bundesland: 'Unbekannt' };
  
  const database = loadPostalCodeDatabase();
  if (!database || !database.postalCodes) {
    return { city: 'Unbekannt', bundesland: 'Unbekannt' };
  }
  
  const zipString = String(zipCode).padStart(5, '0');
  const entry = database.postalCodes[zipString];
  
  if (entry) {
    return {
      city: entry.city || 'Unbekannt',
      bundesland: entry.bundesland || 'Unbekannt'
    };
  }
  
  return { city: 'Unbekannt', bundesland: 'Unbekannt' };
};

export default function StatistikScreen({ 
  onNavigate, 
  onLogout, 
  isAdmin = false, 
  isLoggedIn = false, 
  unreadCount = 0, 
  wishlistMatchCount = 0 
}, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  
  // Ranglisten-Daten
  const [topTraders, setTopTraders] = useState([]);
  const [topCities, setTopCities] = useState([]);
  const [topBundeslaender, setTopBundeslaender] = useState([]);

  useEffect(() => {
    loadUserData();
    loadStatistics();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        return;
      }


      let cachedImageUrl = await getCachedProfileImage(currentUser.uid);
      if (cachedImageUrl) {
        setProfileImage(cachedImageUrl);
      }

      const userData = await getUser(currentUser.uid);
      if (userData) {
        setUser(userData);
        if (userData.profilbild) {
          if (userData.profilbild !== cachedImageUrl) {
            setProfileImage(userData.profilbild);
          } else {
            setProfileImage(cachedImageUrl);
          }
        } else {
          setProfileImage(null);
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der User-Daten:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      setIsLoading(true);

      // 1. Top10 Trader: Zähle akzeptierte Trade-Requests
      const acceptedTradeRequests = await getDocs(
        query(collection(db, 'tradeRequests'), where('status', '==', 'accepted'))
      );
      
      const traderCounts = {};
      acceptedTradeRequests.forEach(doc => {
        const data = doc.data();
        const fromUserId = data.fromUserId;
        const toUserId = data.toUserId;
        
        // Beide Partner bekommen einen Punkt
        if (fromUserId) {
          traderCounts[fromUserId] = (traderCounts[fromUserId] || 0) + 1;
        }
        if (toUserId) {
          traderCounts[toUserId] = (traderCounts[toUserId] || 0) + 1;
        }
      });

      // Lade User-Daten für Trader
      const traderEntries = await Promise.all(
        Object.entries(traderCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(async ([userId, count]) => {
            try {
              // Versuche zuerst mit userId als Dokument-ID
              const userDocRef = doc(db, 'users', userId);
              const userDocSnap = await getDoc(userDocRef);
              
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                return {
                  userId,
                  username: userData.username || userData.email || 'Unbekannt',
                  count
                };
              }
              
              // Fallback: Suche nach uid-Feld
              const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
              const userSnapshot = await getDocs(userQuery);
              if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                return {
                  userId,
                  username: userData.username || userData.email || 'Unbekannt',
                  count
                };
              }
              
              return { userId, username: 'Unbekannt', count };
            } catch (error) {
              console.error('❌ Fehler beim Laden des Users:', error);
              return { userId, username: 'Unbekannt', count };
            }
          })
      );
      setTopTraders(traderEntries.filter(t => t.username !== 'Unbekannt'));

      // 2. Top10 Städte: Zähle getauschte Weine nach Stadt
      const tradedWines = await getDocs(
        query(collection(db, 'wines'), where('status', '==', 'traded'))
      );

      const cityCounts = {};
      tradedWines.forEach(doc => {
        const wineData = doc.data();
        const zipCode = wineData.ownerZipCode || wineData.zipCode;
        if (zipCode) {
          const { city } = getCityAndBundesland(zipCode);
          if (city && city !== 'Unbekannt') {
            cityCounts[city] = (cityCounts[city] || 0) + 1;
          }
        }
      });

      const topCitiesList = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([city, count]) => ({ city, count }));
      setTopCities(topCitiesList);

      // 3. Top10 Bundesländer: Zähle getauschte Weine nach Bundesland
      const bundeslandCounts = {};
      tradedWines.forEach(doc => {
        const wineData = doc.data();
        const zipCode = wineData.ownerZipCode || wineData.zipCode;
        if (zipCode) {
          const { bundesland } = getCityAndBundesland(zipCode);
          if (bundesland && bundesland !== 'Unbekannt') {
            bundeslandCounts[bundesland] = (bundeslandCounts[bundesland] || 0) + 1;
          }
        }
      });

      const topBundeslaenderList = Object.entries(bundeslandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([bundesland, count]) => ({ bundesland, count }));
      setTopBundeslaender(topBundeslaenderList);

    } catch (error) {
      console.error('❌ Fehler beim Laden der Statistiken:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
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
          isAdmin={isAdmin} 
          unreadCount={unreadCount}
          renderButton={false}
          externalMenuVisible={isMenuVisible}
          onMenuToggle={setIsMenuVisible}
        />
        
        <View style={styles.contentContainer}>
          {/* Logo und Schriftzug mit Hamburger-Menü und Profil-Icon */}
          <View style={styles.logoHeaderContainer}>
            {/* Hamburger-Menü links */}
            <View style={styles.headerLeftLogo}>
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
                {profileImage ? (
                  <OptimizedImage
                    source={{ uri: profileImage }}
                    style={styles.profileIconImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profileIconCircle}>
                    <Text style={styles.profileIconText}>
                      {getInitials(user || getCurrentUser())}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
                    {/* Tagline unter dem Logo-Header */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
          </View>
          
{/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => onNavigate('community')}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Statistiken</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
          
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#a9c7cd" />
                <Text style={styles.loadingText}>Lade Statistiken...</Text>
              </View>
            ) : (
              <>
                {/* Top10 Trader */}
                <View style={styles.rankingSection}>
                  <Text style={styles.sectionTitle}>🏆 Top 10 Trader</Text>
                  <Text style={styles.sectionSubtitle}>Erfolgreichste Tauschpartner</Text>
                  {topTraders.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>Noch keine Trades vorhanden</Text>
                    </View>
                  ) : (
                    <View style={styles.rankingList}>
                      {topTraders.map((trader, index) => {
                        const position = index + 1;
                        let medalColor = '#a9c7cd'; // Standard
                        if (position === 1) medalColor = '#DAA520'; // Gold
                        else if (position === 2) medalColor = '#C0C0C0'; // Silber
                        else if (position === 3) medalColor = '#CD7F32'; // Bronze
                        
                        return (
                          <View key={trader.userId} style={styles.rankingItem}>
                            <View style={[styles.rankingPosition, { backgroundColor: medalColor }]}>
                              <Text style={styles.positionText}>{position}</Text>
                            </View>
                            <View style={styles.rankingInfo}>
                              <Text style={styles.rankingName}>{trader.username}</Text>
                              <Text style={styles.rankingCount}>{trader.count} {trader.count === 1 ? 'Trade' : 'Trades'}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Top10 Städte */}
                <View style={styles.rankingSection}>
                  <Text style={styles.sectionTitle}>🏙️ Top 10 Städte</Text>
                  <Text style={styles.sectionSubtitle}>Städte mit den meisten Wein-Trades</Text>
                  {topCities.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>Noch keine Trades vorhanden</Text>
                    </View>
                  ) : (
                    <View style={styles.rankingList}>
                      {topCities.map((city, index) => {
                        const position = index + 1;
                        let medalColor = '#a9c7cd'; // Standard
                        if (position === 1) medalColor = '#DAA520'; // Gold
                        else if (position === 2) medalColor = '#C0C0C0'; // Silber
                        else if (position === 3) medalColor = '#CD7F32'; // Bronze
                        
                        return (
                          <View key={city.city} style={styles.rankingItem}>
                            <View style={[styles.rankingPosition, { backgroundColor: medalColor }]}>
                              <Text style={styles.positionText}>{position}</Text>
                            </View>
                            <View style={styles.rankingInfo}>
                              <Text style={styles.rankingName}>{city.city}</Text>
                              <Text style={styles.rankingCount}>{city.count} {city.count === 1 ? 'Trade' : 'Trades'}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Top10 Bundesländer */}
                <View style={styles.rankingSection}>
                  <Text style={styles.sectionTitle}>🗺️ Top 10 Bundesländer</Text>
                  <Text style={styles.sectionSubtitle}>Bundesländer mit den meisten Wein-Trades</Text>
                  {topBundeslaender.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>Noch keine Trades vorhanden</Text>
                    </View>
                  ) : (
                    <View style={styles.rankingList}>
                      {topBundeslaender.map((bundesland, index) => {
                        const position = index + 1;
                        let medalColor = '#a9c7cd'; // Standard
                        if (position === 1) medalColor = '#DAA520'; // Gold
                        else if (position === 2) medalColor = '#C0C0C0'; // Silber
                        else if (position === 3) medalColor = '#CD7F32'; // Bronze
                        
                        return (
                          <View key={bundesland.bundesland} style={styles.rankingItem}>
                            <View style={[styles.rankingPosition, { backgroundColor: medalColor }]}>
                              <Text style={styles.positionText}>{position}</Text>
                            </View>
                            <View style={styles.rankingInfo}>
                              <Text style={styles.rankingName}>{bundesland.bundesland}</Text>
                              <Text style={styles.rankingCount}>{bundesland.count} {bundesland.count === 1 ? 'Trade' : 'Trades'}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
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
  outerContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40, // 10px für iOS, damit StatusBar nicht verdeckt wird
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
  },
  headerLeftLogo: {
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
  wishlistButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistHeart: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    width: 48,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileIconImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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

  profileBtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    gap: 4,
  },
  profileBtpIcon: {
    fontSize: 12,
  },
  profileBtpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2c2c2c',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#DAA520',
    fontSize: 18,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  rankingSection: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DAA520', // Gold
    marginBottom: 4,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    textAlign: 'center',
  },
  rankingList: {
    marginTop: 8,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankingPosition: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#a9c7cd', // Standard, wird dynamisch überschrieben
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  positionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rankingCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});

