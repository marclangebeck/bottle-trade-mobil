import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking } from 'react-native';

export default function DynamicHamburgerMenu({ onNavigate, isLoggedIn = false, onLogout }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleNavigation = (screen) => {
    setIsMenuVisible(false);
    onNavigate(screen);
  };

  const handleExternalLink = async (url) => {
    setIsMenuVisible(false);
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      alert(`Kann Link nicht öffnen: ${url}`);
    }
  };

  const handleLogout = () => {
    setIsMenuVisible(false);
    onLogout();
  };

  // Menü-Items für nicht eingeloggte Benutzer (Gast-Menü)
  const guestMenuItems = [
    { id: 'login', icon: '🔐', text: 'Login' },
    { id: 'register', icon: '📝', text: 'Registrieren' },
    { id: 'info', icon: 'ℹ️', text: 'Was ist Bottle-Trade?' },
    { id: 'shop', icon: '🛒', text: 'Shop' },
  ];

  // Menü-Items für eingeloggte Benutzer
  const loggedInMenuItems = [
    { id: 'home', icon: '📊', text: 'Dashboard' },
    { id: 'mein-weinregal', icon: '🍷', text: 'Mein Weinregal' },
    { id: 'weinregal', icon: '📝', text: 'Weinregal befüllen' },
    { id: 'weinboerse', icon: '🌐', text: 'Weinbörse' },
    { id: 'community', icon: '👥', text: 'Community' },
    { id: 'shop', icon: '🛒', text: 'Shop' },
    { id: 'btp', icon: '💎', text: 'Bottle-Trade-Points' },
    { id: 'profil', icon: '⚙️', text: 'Profil/Verwaltung' },
  ];

  // Externe Links (für beide Zustände)
  const externalLinks = [
    { id: 'contact', icon: '📧', text: 'Kontakt', url: 'mailto:kontakt@bottle-trade.de' },
    { id: 'instagram', icon: '📷', text: 'Instagram', url: 'https://www.instagram.com/bottle_trade' },
    { id: 'impressum', icon: '📄', text: 'Impressum', url: '#' },
    { id: 'datenschutz', icon: '🔒', text: 'Datenschutz', url: '#' },
  ];

  const currentMenuItems = isLoggedIn ? loggedInMenuItems : guestMenuItems;

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity style={styles.hamburgerButton} onPress={toggleMenu}>
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
        <View style={styles.hamburgerLine} />
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
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
              {/* Hauptnavigation */}
              {currentMenuItems.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.menuItem} 
                  onPress={() => handleNavigation(item.id)}
                >
                  <Text style={styles.menuItemText}>{item.icon} {item.text}</Text>
                </TouchableOpacity>
              ))}

              {/* Logout für eingeloggte Benutzer */}
              {isLoggedIn && (
                <>
                  <View style={styles.separator} />
                  <TouchableOpacity 
                    style={[styles.menuItem, styles.logoutMenuItem]} 
                    onPress={handleLogout}
                  >
                    <Text style={[styles.menuItemText, styles.logoutText]}>🚪 Abmelden</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Externe Links entfernt für nicht eingeloggte Benutzer */}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1000,
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
    elevation: 3,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginVertical: 8,
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

