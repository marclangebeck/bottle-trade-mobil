import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, RefreshControl } from 'react-native';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OptimizedImage from './components/OptimizedImage';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import { getCurrentUser } from './services/testAuth';
import { getAvailableWinesCount, getUserWineCounts, getOnlineUsersCount, getCompletedTradesCount, getMyCompletedTradesCount } from './services/database-web';

export default function DashboardScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false }) {
  // Log nur bei Änderung, nicht bei jedem Render
  const prevUnreadRef = React.useRef(unreadCount);
  React.useEffect(() => {
    if (prevUnreadRef.current !== unreadCount) {
      console.log('📊 DashboardScreen: unreadCount =', unreadCount);
      prevUnreadRef.current = unreadCount;
    }
  }, [unreadCount]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ availableWines: 0, myWines: 0, myWinesPublished: 0, onlineUsers: 0, tradesCompleted: 0, myTradesCompleted: 0, btp: 0 });

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const me = getCurrentUser();
      const myId = me?.uid;
      const [availableWines, userCounts, onlineUsers, tradesCompleted, myTradesCompleted] = await Promise.all([
        getAvailableWinesCount(),
        myId ? getUserWineCounts(myId) : Promise.resolve({ total: 0, published: 0 }),
        getOnlineUsersCount(),
        getCompletedTradesCount(),
        myId ? getMyCompletedTradesCount(myId) : Promise.resolve(0)
      ]);
      setStats({
        availableWines,
        myWines: userCounts.total,
        myWinesPublished: userCounts.published,
        onlineUsers,
        tradesCompleted,
        myTradesCompleted,
        btp: me?.btp ?? 0,
      });
    } catch (e) {
      console.error('❌ Dashboard load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
              <TouchableOpacity
                style={styles.wishlistButton}
                onPress={() => onNavigate('wunschliste')}
              >
                <Text style={styles.wishlistHeart}>♡</Text>
              </TouchableOpacity>
            </View>
            
            {/* Bottle (Logo) Trade in der Mitte */}
            <View style={styles.logoHeaderCenter}>
              <Text style={styles.logoHeaderText}>Bottle</Text>
              <View style={styles.logoImageWrapper}>
                <OptimizedImage
                  source={require('./assets/images/Logo_white.png')}
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
                  <Text style={styles.profileIconText}>P</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.profileBtpBadge}>
                <Text style={styles.profileBtpText}>{`${stats.btp ?? 0} BTP`}</Text>
              </View>
            </View>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Dashboard</Text>
            </View>
          </View>

          {/* Dashboard Content */}
          <ScrollView style={styles.dashboardContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
            <View style={styles.grid}>
              {/* Meine Weine */}
              <LinearGradient
                colors={['#f1e9dd', '#e6dccf']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={[styles.cardHeader, styles.cardHeaderWine]}>
                  <Text style={styles.cardHeaderTitle}>Meine Weine</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardSplit}>
                    <View style={styles.cardSplitItem}>
                      <Text style={styles.cardLabel}>im Weinregal</Text>
                      <Text style={styles.cardValueSmall}>{stats.myWines}</Text>
                    </View>
                    <View style={styles.cardSplitItem}>
                      <Text style={styles.cardLabel}>in der Weinbörse</Text>
                      <Text style={styles.cardValueSmall}>{stats.myWinesPublished}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
              {/* Verfügbare Weine */}
              <LinearGradient
                colors={['#f1e9dd', '#e6dccf']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={[styles.cardHeader, styles.cardHeaderMarket]}>
                  <Text style={styles.cardHeaderTitle}>Verfügbare Weine in der Weinbörse</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardValue}>{stats.availableWines}</Text>
                </View>
              </LinearGradient>
              {/* Tausche */}
              <LinearGradient
                colors={['#f1e9dd', '#e6dccf']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={[styles.cardHeader, styles.cardHeaderTrades]}>
                  <Text style={styles.cardHeaderTitle}>Tausche</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardSplit}>
                    <View style={styles.cardSplitItem}>
                      <Text style={styles.cardLabel}>Alle</Text>
                      <Text style={styles.cardValueSmall}>{stats.tradesCompleted}</Text>
                    </View>
                    <View style={styles.cardSplitItem}>
                      <Text style={styles.cardLabel}>Meine</Text>
                      <Text style={styles.cardValueSmall}>{stats.myTradesCompleted}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </View>
        {/* Footer entfällt hier zugunsten der BottomNavigation */}
      </View>
      
      {/* Hinweis zu User Online */}
      <View style={styles.onlineUsersBanner}>
        <Text style={styles.onlineUsersText}>
          {`${stats.onlineUsers} User online`}
        </Text>
      </View>

      {/* Fixed Bottom Navigation */}
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadCount={unreadCount}
      />

      {/* Hamburger Menu Modal entfernt - wird durch DynamicHamburgerMenu ersetzt */}
      {false && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity 
            style={styles.menuBackdrop} 
            activeOpacity={1}
            onPress={() => setIsMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Bottle-Trade</Text>
                <TouchableOpacity onPress={() => setIsMenuVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.menuItems}>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('home')}
                >
                  <Text style={styles.menuItemText}>📊 Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('mein-weinregal')}
                >
                  <Text style={styles.menuItemText}>🍷 Mein Weinregal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('weinregal')}
                >
                  <Text style={styles.menuItemText}>📝 Weinregal befüllen</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('weinboerse')}
                >
                  <Text style={styles.menuItemText}>🌐 Weinbörse</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('community')}
                >
                  <Text style={styles.menuItemText}>👥 Community</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('shop')}
                >
                  <Text style={styles.menuItemText}>🛒 Shop</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('btp')}
                >
                  <Text style={styles.menuItemText}>💎 Bottle-Trade-Points</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('profil')}
                >
                  <Text style={styles.menuItemText}>⚙️ Profil/Verwaltung</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, styles.logoutMenuItem]} 
                  onPress={onLogout}
                >
                  <Text style={[styles.menuItemText, styles.logoutText]}>🚪 Abmelden</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    paddingBottom: 10,
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
  profileSection: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    fontSize: 25,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profileBtpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DAA520',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileBtpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2c2c2c',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
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
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 40,
    alignItems: 'center',
    marginBottom: 8,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 80,
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  greeting: {
    fontSize: 30,
    fontWeight: '600',
    color: '#DAA520', // Warmes Gold
    textAlign: 'center',
    letterSpacing: 0.5,
    // Eleganter Gradient-Effekt durch Text-Shadow
    textShadowColor: 'rgba(218, 165, 32, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
  userName: {
    fontSize: 20,
    color: '#2c2c2c', // Dunkler Text auf hellem Header
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    flex: 1,
    padding: 16,
  },
  grid: { flexDirection: 'column', gap: 14 },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardHeaderTitle: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '700',
    opacity: 0.9,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  cardHeaderWine: {
    backgroundColor: 'rgba(244, 236, 226, 0.75)',
  },
  cardHeaderMarket: {
    backgroundColor: 'rgba(226, 239, 249, 0.75)',
  },
  cardHeaderTrades: {
    backgroundColor: 'rgba(231, 243, 233, 0.75)',
  },
  cardBody: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardValue: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  cardSplit: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
    gap: 18,
  },
  cardSplitItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  cardValueSmall: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  onlineUsersBanner: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#2c2c2c',
    marginBottom: 80,
  },
  onlineUsersText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  // Dashboard Kacheln
  tilesGrid: {
    marginTop: 10,
  },
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  tile: {
    flex: 1,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    minHeight: 120, // Feste Mindesthöhe für alle Buttons
    justifyContent: 'center', // Zentriert den Inhalt vertikal
  },
  // centeredTile entfernt - justifyContent: 'center' ist jetzt direkt im tile Style
  tileFullWidth: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  tileIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  tileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  tileSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.8,
  },
  tileButton: {
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 222, 179, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
    minHeight: 32,
  },
  tileButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  // Hamburger Menu Styles (wie StartScreen)
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuBackdrop: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    backgroundColor: 'rgba(245, 245, 220, 0.95)',
    width: 220,
    minHeight: 200,
    maxHeight: '80%',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0000',
  },
  closeButton: {
    fontSize: 24,
    color: '#4B0000',
    fontWeight: 'bold',
  },
  menuItems: {
    // Style for menu items container
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuItemText: {
    fontSize: 16,
    color: '#4B0000',
    fontWeight: '500',
  },
  logoutMenuItem: {
    backgroundColor: 'rgba(75, 0, 0, 0.1)',
    marginTop: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: '#4B0000',
    fontWeight: 'bold',
  },
});
