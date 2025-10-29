import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking } from 'react-native';

export default function DynamicHamburgerMenu({ onNavigate, isLoggedIn = false, onLogout, isAdmin = false, unreadNotifications = 0, renderButton = true, externalMenuVisible = null, onMenuToggle = null }) {
  const [internalMenuVisible, setInternalMenuVisible] = useState(false);
  
  // Verwende Innern-State oder externen State
  const isMenuVisible = externalMenuVisible !== null ? externalMenuVisible : internalMenuVisible;
  const setIsMenuVisible = externalMenuVisible !== null ? (onMenuToggle || (() => {})) : setInternalMenuVisible;

  const toggleMenu = () => {
    if (externalMenuVisible !== null && onMenuToggle) {
      onMenuToggle(!isMenuVisible);
    } else {
      setInternalMenuVisible(!internalMenuVisible);
    }
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
    if (onLogout) {
      onLogout();
    }
  };

  // Menü-Items für nicht eingeloggte Benutzer (Gast-Menü)
  const guestMenuItems = [
    { id: 'login', icon: '🔐', text: 'Login' },
    { id: 'register', icon: '📝', text: 'Registrieren' },
    { id: 'info', icon: 'ℹ️', text: 'Was ist Bottle-Trade?' },
    { id: 'shop', icon: '🛒', text: 'Shop' },
  ];

  // Menü-Items für eingeloggte Benutzer - vereinfacht
  const loggedInMenuItems = [
    { id: 'home', icon: '🏠', text: 'Dashboard' },
    { id: 'notifications', icon: '🔔', text: 'Nachrichten' },
    { id: 'profil', icon: '👤', text: 'Profil' },
  ];

  // Admin-Menü-Items (nur für Admins sichtbar)
  const adminMenuItems = [
    { id: 'admin-dashboard', icon: '⚙️', text: 'Admin-Bereich' },
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
      {/* Hamburger Button - nur rendern wenn renderButton=true */}
      {renderButton && (
        <TouchableOpacity style={styles.hamburgerButton} onPress={toggleMenu}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          {isLoggedIn && unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

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

              {/* Admin-Bereich (nur für Admins) */}
              {isLoggedIn && isAdmin && (
                <>
                  <View style={styles.separator} />
                  {adminMenuItems.map((item) => (
                    <TouchableOpacity 
                      key={item.id}
                      style={[styles.menuItem, styles.adminMenuItem]} 
                      onPress={() => handleNavigation(item.id)}
                    >
                      <Text style={[styles.menuItemText, styles.adminMenuItemText]}>{item.icon} {item.text}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

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
  // sectionTitle entfernt - nicht mehr benötigt
  adminMenuItem: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    marginTop: 5,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  adminMenuItemText: {
    color: '#B8860B',
    fontWeight: 'bold',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

