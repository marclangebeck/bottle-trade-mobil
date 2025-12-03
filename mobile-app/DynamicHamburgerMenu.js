import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking, Animated, Dimensions } from 'react-native';
import { getCurrentUser } from './services/testAuth';

const MENU_WIDTH = 280;

export default function DynamicHamburgerMenu({ onNavigate, isLoggedIn = false, onLogout, isAdmin = false, unreadCount = 0, renderButton = true, externalMenuVisible = null, onMenuToggle = null, userName = null, userEmail = null }) {
  const [internalMenuVisible, setInternalMenuVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation-Values - Startposition ist die negative Menübreite (vollständig außerhalb links)
  const menuSlideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const line1Rotation = useRef(new Animated.Value(0)).current;
  const line2Opacity = useRef(new Animated.Value(1)).current;
  const line3Rotation = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Hole User-Info direkt, falls nicht über Props übergeben
  const currentUser = isLoggedIn ? getCurrentUser() : null;
  const displayEmail = userEmail || (currentUser?.email || '');
  const displayName = userName || (currentUser?.username || currentUser?.email || '');
  
  // Verwende Innern-State oder externen State
  const isMenuVisible = externalMenuVisible !== null ? externalMenuVisible : internalMenuVisible;
  const setIsMenuVisible = externalMenuVisible !== null ? (onMenuToggle || (() => {})) : setInternalMenuVisible;

  // Animation beim Öffnen/Schließen
  useEffect(() => {
    if (isMenuVisible) {
      // Menü öffnen - Starte immer von der Startposition
      setIsAnimating(true);
      // Setze Startwerte explizit
      menuSlideAnim.setValue(-MENU_WIDTH);
      overlayOpacity.setValue(0);
      
      // Menü öffnen
      Animated.parallel([
        Animated.spring(menuSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Hamburger → X Animation
        Animated.parallel([
          Animated.timing(line1Rotation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(line2Opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(line3Rotation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setIsAnimating(false);
      });
    } else {
      // Menü schließen - Slide zurück nach links
      // Nur animieren, wenn das Menü gerade geschlossen wird (nicht beim ersten Render)
      if (menuSlideAnim._value !== -MENU_WIDTH) {
        setIsAnimating(true);
        Animated.parallel([
          Animated.spring(menuSlideAnim, {
            toValue: -MENU_WIDTH,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          // X → Hamburger Animation
          Animated.parallel([
            Animated.timing(line1Rotation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(line2Opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(line3Rotation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          // Nach dem Schließen: Werte explizit zurücksetzen für nächstes Öffnen
          menuSlideAnim.setValue(-MENU_WIDTH);
          overlayOpacity.setValue(0);
          setIsAnimating(false);
        });
      }
    }
  }, [isMenuVisible]);

  const toggleMenu = () => {
    // Button-Press Animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (externalMenuVisible !== null && onMenuToggle) {
      onMenuToggle(!isMenuVisible);
    } else {
      setInternalMenuVisible(!internalMenuVisible);
    }
  };

  // Interpolierte Werte für Animation
  const line1Rotate = line1Rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });
  const line3Rotate = line3Rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

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
    { id: 'rundgang', icon: '🎯', text: 'Digitaler Rundgang' },
    { id: 'login', icon: '🔐', text: 'Login' },
    { id: 'register', icon: '📝', text: 'Registrieren' },
    { id: 'info', icon: 'ℹ️', text: 'Was ist Bottle-Trade?' },
    { id: 'shop', icon: '🛒', text: 'Shop' },
  ];

  // Menü-Items für eingeloggte Benutzer
  const loggedInMenuItems = [
    { id: 'rundgang', icon: '🎯', text: 'Digitaler Rundgang' },
    { id: 'shop', icon: '🛒', text: 'Shop' },
    { id: 'community', icon: '👥', text: 'Community' },
    { id: 'wunschliste', icon: '❤️', text: 'Wunschliste' },
    { id: 'instagram', icon: '📷', text: 'Instagram', url: 'https://www.instagram.com/1bottletrade' },
  ];

  // Admin-Menü-Items (nur für Admins sichtbar)
  const adminMenuItems = [
    { id: 'admin-dashboard', icon: '⚙️', text: 'Admin-Bereich' },
  ];

  // Externe Links und Screens (für beide Zustände)
  const externalLinks = [
    { id: 'kontakt', icon: '📧', text: 'Kontakt', screen: 'kontakt' },
    { id: 'impressum', icon: '📄', text: 'Impressum', screen: 'impressum' },
    { id: 'datenschutz', icon: '🔒', text: 'Datenschutzerklärung', screen: 'datenschutz' },
  ];

  const currentMenuItems = isLoggedIn ? loggedInMenuItems : guestMenuItems;

  return (
    <>
      {/* Hamburger Button - nur rendern wenn renderButton=true */}
      {renderButton && (
        <Animated.View style={[styles.hamburgerButtonContainer, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity 
            style={styles.hamburgerButton} 
            onPress={toggleMenu}
            activeOpacity={0.7}
          >
            <View style={styles.hamburgerButtonGradient}>
              <View style={styles.hamburgerLinesContainer}>
                <Animated.View 
                  style={[
                    styles.hamburgerLine, 
                    { transform: [{ rotate: line1Rotate }, { translateY: isMenuVisible ? 6 : 0 }] }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.hamburgerLine, 
                    { opacity: line2Opacity }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.hamburgerLine, 
                    { transform: [{ rotate: line3Rotate }, { translateY: isMenuVisible ? -6 : 0 }] }
                  ]} 
                />
              </View>
              {isLoggedIn && unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Menu Modal */}
      <Modal
        visible={isMenuVisible || isAnimating}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <Animated.View 
            style={[
              styles.menuOverlayAnimated,
              { opacity: overlayOpacity }
            ]}
          >
            <Animated.View 
              style={[
                styles.menuContainer,
                { transform: [{ translateX: menuSlideAnim }] }
              ]}
            >
            <View style={styles.menuHeader}>
              <View style={styles.menuTitleContainer}>
                <Text style={styles.menuTitle}>Bottle-Trade</Text>
                {isLoggedIn && (displayName || displayEmail) && (
                  <Text style={styles.menuUserInfo}>
                    {displayName || displayEmail}
                  </Text>
                )}
              </View>
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
                  onPress={() => {
                    if (item.url) {
                      handleExternalLink(item.url);
                    } else {
                      handleNavigation(item.id);
                    }
                  }}
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

              {/* Externe Links und Screens (für alle Benutzer) */}
              <View style={styles.separator} />
              {externalLinks.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.menuItem} 
                  onPress={() => {
                    if (item.screen) {
                      handleNavigation(item.screen);
                    } else if (item.url) {
                      handleExternalLink(item.url);
                    }
                  }}
                >
                  <Text style={styles.menuItemText}>{item.icon} {item.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButtonContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1000,
  },
  hamburgerButton: {
    width: 44,
    height: 44,
    borderRadius: 22, // Vollständig rund (50% der Breite)
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  hamburgerButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 58, 59, 0.85)', // Fester Hintergrund statt Gradient
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hamburgerLinesContainer: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: 'white',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuOverlayAnimated: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    width: MENU_WIDTH,
    minHeight: 200,
    maxHeight: '85%',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    // Position am linken Rand
    position: 'absolute',
    left: 0,
    top: 0,
    // Glasmorphismus-Effekt
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    // Backdrop-Filter Simulation (durch mehrschichtige Schatten)
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(47, 58, 59, 0.15)',
  },
  menuTitleContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  menuUserInfo: {
    fontSize: 12,
    color: '#2f3a3b',
    opacity: 0.7,
    fontWeight: '500',
  },
  closeButton: {
    fontSize: 28,
    color: '#2f3a3b',
    fontWeight: '300',
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(47, 58, 59, 0.1)',
  },
  menuItems: {
    // Style for menu items container
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderRadius: 10,
    borderBottomWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  menuItemText: {
    fontSize: 16,
    color: '#2f3a3b',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(47, 58, 59, 0.15)',
    marginVertical: 10,
    marginHorizontal: 8,
  },
  logoutMenuItem: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    marginTop: 8,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  logoutText: {
    color: '#C62828',
    fontWeight: 'bold',
  },
  // sectionTitle entfernt - nicht mehr benötigt
  adminMenuItem: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    marginTop: 4,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  adminMenuItemText: {
    color: '#F57C00',
    fontWeight: 'bold',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

