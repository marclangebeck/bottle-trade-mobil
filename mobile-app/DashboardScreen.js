import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from './Footer';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import NotificationBadge from './components/NotificationBadge';
import BottomNavigation from './components/BottomNavigation';

export default function DashboardScreen({ onNavigate, onLogout, userName = "Gast", isAdmin = false, unreadNotifications = 0, isLoggedIn = false }) {
  console.log('📊 DashboardScreen: unreadNotifications =', unreadNotifications);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)'
      }} />
      <View style={styles.container}>
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={isAdmin} 
          unreadNotifications={unreadNotifications}
          renderButton={false}
          externalMenuVisible={isMenuVisible}
          onMenuToggle={setIsMenuVisible}
        />
        
        <View style={styles.contentContainer}>
          {/* Header */}
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
              <Text style={styles.greeting}>Dashboard</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => onNavigate('notifications')}
              >
                <Text style={styles.notificationIcon}>🔔</Text>
                <NotificationBadge 
                  count={unreadNotifications}
                  onPress={() => onNavigate('notifications')}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* User Info Section */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.loginText}>Du bist eingeloggt als: {userName}</Text>
          </View>

          {/* Dashboard Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>

              {/* Dashboard Kacheln - Neues Layout */}
              <View style={styles.tilesGrid}>
                {/* Zeile 1 - Weinbörse (volle Breite) */}
                <TouchableOpacity style={styles.tileFullWidth} onPress={() => onNavigate('weinboerse')}>
                  <Text style={styles.tileIcon}>🌐</Text>
                  <Text style={styles.tileTitle}>Weinbörse</Text>
                </TouchableOpacity>

                {/* Zeile 2 - Mein Weinregal | Weinregal befüllen */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={styles.tile} onPress={() => onNavigate('mein-weinregal')}>
                    <Text style={styles.tileIcon}>🍷</Text>
                    <Text style={styles.tileTitle}>Mein Weinregal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.tile} onPress={() => onNavigate('weinregal')}>
                    <Text style={styles.tileIcon}>📝</Text>
                    <Text style={styles.tileTitle}>Weinregal befüllen</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 3 - Shop | BTP */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={styles.tile} onPress={() => onNavigate('shop')}>
                    <Text style={styles.tileIcon}>🛒</Text>
                    <Text style={styles.tileTitle}>Shop</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.tile} onPress={() => onNavigate('btp')}>
                    <Text style={styles.tileIcon}>💎</Text>
                    <Text style={styles.tileTitle}>BTP</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 4 - Community (volle Breite) */}
                <TouchableOpacity style={styles.tileFullWidth} onPress={() => onNavigate('community')}>
                  <Text style={styles.tileIcon}>👥</Text>
                  <Text style={styles.tileTitle}>Community</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        <Footer />
      </View>
      
      {/* Fixed Bottom Navigation */}
      <BottomNavigation onNavigate={onNavigate} isLoggedIn={isLoggedIn} />

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
    backgroundColor: '#d5dfe0',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#d5dfe0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 33.75,
    paddingBottom: 33.75,
    backgroundColor: '#2f3a3b',
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 135,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: '#FFFFFF',
    marginVertical: 3,
    borderRadius: 1.5,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  userName: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
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
    borderBottomWidth: 1,
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
    borderBottomWidth: 1,
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
  // User Info Styles
  userInfoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: 0,
    marginHorizontal: 0,
    marginBottom: 15,
    padding: 12,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
