import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, Platform, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import OptimizedImage from '../components/OptimizedImage';

export default function BtpScreen({ onNavigate, onLogout, unreadCount = 0, isLoggedIn = false }) {
  // State für aktiven Tab
  const [activeTab, setActiveTab] = useState('kaufen');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Mock-Daten für BTP
  const userBtp = 1250;
  
  const transactions = [
    {
      id: 1,
      amount: 100,
      reason: 'Wein verkauft - Chardonnay 2020',
      timestamp: '2024-01-15 14:30',
      type: 'earned'
    },
    {
      id: 2,
      amount: -50,
      reason: 'Wein gekauft - Pinot Noir 2019',
      timestamp: '2024-01-14 10:15',
      type: 'spent'
    },
    {
      id: 3,
      amount: 25,
      reason: 'Newsletter-Anmeldung',
      timestamp: '2024-01-13 09:00',
      type: 'bonus'
    },
    {
      id: 4,
      amount: -200,
      reason: 'Wein gekauft - Cabernet Sauvignon 2018',
      timestamp: '2024-01-12 16:45',
      type: 'spent'
    },
  ];

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
          isAdmin={false} 
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
              <Text style={styles.profileIconText}>P</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.profileBtpBadge}>
            <Text style={styles.profileBtpText}>{`${userBtp} BTP`}</Text>
          </View>
        </View>
        </View>
        
        {/* Header mit Überschrift */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>BTP</Text>
            </View>
          </View>
        </View>
        
        {/* BTP Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceAmount}>{userBtp}</Text>
            <Image 
              source={require('../assets/images/btp.png')}
              style={styles.btpImage}
              resizeMode="contain"
              fadeDuration={0}
              cache="force-cache"
            />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'kaufen' && styles.activeTab]}
            onPress={() => setActiveTab('kaufen')}
          >
            <Text style={[styles.tabText, activeTab === 'kaufen' && styles.activeTabText]}>
              BTP kaufen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'free' && styles.activeTab]}
            onPress={() => setActiveTab('free')}
          >
            <Text style={[styles.tabText, activeTab === 'free' && styles.activeTabText]}>
              BTP for free
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'nutzen' && styles.activeTab]}
            onPress={() => setActiveTab('nutzen')}
          >
            <Text style={[styles.tabText, activeTab === 'nutzen' && styles.activeTabText]}>
              BTP nutzen
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* Tab Content */}
          {activeTab === 'kaufen' && (
            <View style={styles.tabContent}>
              <Text style={styles.tabTitle}>BTP kaufen</Text>
              <Text style={styles.tabSubtitle}>Inhalt kommt hier hin</Text>
            </View>
          )}

          {activeTab === 'free' && (
            <View style={styles.tabContent}>
              <Text style={styles.tabTitle}>BTP for free</Text>
              <Text style={styles.tabSubtitle}>Inhalt kommt hier hin</Text>
            </View>
          )}

          {activeTab === 'nutzen' && (
            <View style={styles.tabContent}>
              <Text style={styles.tabTitle}>BTP nutzen</Text>
              <Text style={styles.tabSubtitle}>Inhalt kommt hier hin</Text>
            </View>
          )}
        </ScrollView>
        </View>
        <Footer />
      </View>
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadCount={unreadCount}
      />
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
    borderBottomWidth: 0,
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
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profileSection: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
  greetingContainer: {
    // Hintergrund und Border entfernt für elegantes Design
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
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    margin: 20,
    marginTop: 0,
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF', // Weiße Border
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2c2c2c',
  },
  tabText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  // Tab Content Styles
  tabContent: {
    padding: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2f3a3b', // Schwarz auf hellem Hintergrund
    marginBottom: 10,
    textAlign: 'center',
  },
  tabSubtitle: {
    fontSize: 16,
    color: '#2f3a3b', // Schwarz auf hellem Hintergrund
    textAlign: 'center',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
    color: '#2c2c2c', // Dunkler auf hellem Header
  },
  dashboardButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dashboardButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  balanceCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF', // Weiße Border
  },
  balanceLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAmount: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 15,
  },
  btpImage: {
    width: 60,
    height: 60,
  },
  actionsSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoSection: {
    margin: 20,
    marginTop: 0,
  },
  infoText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  transactionsSection: {
    margin: 20,
    marginTop: 0,
  },
  transactionCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
