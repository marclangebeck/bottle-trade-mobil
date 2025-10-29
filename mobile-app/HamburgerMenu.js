import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

export default function HamburgerMenu({ onNavigate, isLoggedIn = false, onLogout }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleNavigation = (screen) => {
    setIsMenuVisible(false);
    onNavigate(screen);
  };

  const handleLogout = () => {
    setIsMenuVisible(false);
    onLogout();
  };

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
              {/* Menü für nicht eingeloggte Benutzer */}
              {!isLoggedIn && (
                <>
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => handleNavigation('login')}
                  >
                    <Text style={styles.menuItemText}>🔐 Login</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => handleNavigation('register')}
                  >
                    <Text style={styles.menuItemText}>📝 Registrieren</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => handleNavigation('info')}
                  >
                    <Text style={styles.menuItemText}>ℹ️ Was ist Bottle-Trade?</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => handleNavigation('shop')}
                  >
                    <Text style={styles.menuItemText}>🛒 Shop</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Menü für eingeloggte Benutzer */}
              {isLoggedIn && (
                <>
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
                    onPress={handleLogout}
                  >
                    <Text style={[styles.menuItemText, styles.logoutText]}>🚪 Abmelden</Text>
                  </TouchableOpacity>
                </>
              )}

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
    width: 220, // Schmaler (280 → 220)
    height: 400, // Auf 400 gesetzt
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
    color: 'black',
  },
  closeButton: {
    fontSize: 18,
    color: 'black',
    padding: 5,
  },
  menuItems: {
    // flex: 1 entfernt, da wir feste Höhe verwenden
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 40, // Alle Container gleich groß
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 14,
    color: 'black',
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
