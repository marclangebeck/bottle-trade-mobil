import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from './Footer';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';

export default function DashboardScreen({ onNavigate, onLogout, userName = "Max" }) {
  // Hamburger-Menü-Funktionen entfernt - wird durch DynamicHamburgerMenu gehandhabt

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
        <DynamicHamburgerMenu onNavigate={onNavigate} isLoggedIn={true} onLogout={onLogout} />
        
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.hamburgerContainer}>
              {/* Hamburger-Button entfernt - wird durch DynamicHamburgerMenu ersetzt */}
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>📊 Dashboard</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Platz für zukünftige Elemente */}
            </View>
          </View>

          {/* Dashboard Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>

              {/* Dashboard Kacheln */}
              <View style={styles.tilesGrid}>
                {/* Zeile 1 */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => onNavigate('mein-weinregal')}>
                    <Text style={styles.tileIcon}>🍷</Text>
                    <Text style={styles.tileTitle}>Mein Weinregal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => onNavigate('weinregal')}>
                    <Text style={styles.tileIcon}>📝</Text>
                    <Text style={styles.tileTitle}>Weinregal befüllen</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 2 */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => onNavigate('weinboerse')}>
                    <Text style={styles.tileIcon}>🌐</Text>
                    <Text style={styles.tileTitle}>Weinbörse</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => onNavigate('community')}>
                    <Text style={styles.tileIcon}>👥</Text>
                    <Text style={styles.tileTitle}>Community</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 3 */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => onNavigate('shop')}>
                    <Text style={styles.tileIcon}>🛒</Text>
                    <Text style={styles.tileTitle}>Shop</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => onNavigate('btp')}>
                    <Text style={styles.tileIcon}>💎</Text>
                    <Text style={styles.tileTitle}>Bottle-Trade-Points</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 4 - Volle Breite */}
                <TouchableOpacity style={[styles.tileFullWidth, styles.centeredTile]} onPress={() => onNavigate('profil')}>
                  <View style={styles.tileFullContent}>
                    <Text style={styles.tileIcon}>⚙️</Text>
                    <View style={styles.tileFullText}>
                      <Text style={styles.tileTitle}>Profil/Verwaltung</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        <Footer />
      </View>

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
    backgroundColor: '#4B0000',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#4B0000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
  },
  hamburgerContainer: {
    flex: 0,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 40, // Gleiche Breite wie hamburgerContainer für Zentrierung
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  hamburgerButton: {
    padding: 10,
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: 'white',
    marginVertical: 1.5,
    borderRadius: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '300',
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
    marginTop: 20,
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
  },
  centeredTile: {
    justifyContent: 'center',
  },
  tileFullWidth: {
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
  },
  tileFullContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileFullText: {
    flex: 1,
    marginLeft: 15,
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
});
