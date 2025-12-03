import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import OptimizedImage from '../components/OptimizedImage';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';

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

export default function KontaktScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        loadProfileImage(currentUser.uid);
      }
    }
  }, [isLoggedIn]);

  const loadProfileImage = async (userId) => {
    try {
      if (!userId) return;
      const userData = await getUser(userId);
      if (userData && userData.profilbild) {
        setProfileImage(userData.profilbild);
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des Profilbildes:', error);
      setProfileImage(null);
    }
  };

  const handleEmailPress = async () => {
    const email = 'kontakt@bottle-trade.de';
    const url = `mailto:${email}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      alert(`E-Mail kann nicht geöffnet werden: ${email}`);
    }
  };

  const handlePhonePress = async () => {
    const phone = '017663129242'; // Ohne Leerzeichen und Bindestriche für tel: URL
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      alert(`Telefon kann nicht geöffnet werden: ${phone}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        width: '100%',
      }} />
      
      <DynamicHamburgerMenu 
        onNavigate={onNavigate} 
        isLoggedIn={isLoggedIn} 
        onLogout={onLogout} 
        isAdmin={isAdmin} 
        unreadCount={unreadCount}
        renderButton={false}
        externalMenuVisible={isMenuVisible}
        onMenuToggle={setIsMenuVisible}
      />
      
      <View style={styles.contentContainer}>
          {/* Logo und Schriftzug mit Hamburger-Menü */}
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
            {isLoggedIn ? (
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
                        {getInitials(getCurrentUser())}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.headerRight} />
            )}
          </View>
          
          {/* Tagline unter dem Logo-Header */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Kontakt</Text>
            </View>
          </View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dashboardContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kontaktieren Sie uns</Text>
              <Text style={styles.text}>
                Wir freuen uns auf Ihre Nachricht! Bei Fragen, Anregungen oder Problemen können Sie uns gerne kontaktieren.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>E-Mail</Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleEmailPress}
              >
                <Text style={styles.contactButtonText}>📧 kontakt@bottle-trade.de</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Soziale Medien</Text>
              <Text style={styles.text}>
                Folgen Sie uns auf Instagram für aktuelle Neuigkeiten und Updates:
              </Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={async () => {
                  const url = 'https://www.instagram.com/1bottletrade';
                  const supported = await Linking.canOpenURL(url);
                  if (supported) {
                    await Linking.openURL(url);
                  } else {
                    alert(`Link kann nicht geöffnet werden: ${url}`);
                  }
                }}
              >
                <Text style={styles.contactButtonText}>📷 @1bottletrade</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Telefon</Text>
              <Text style={styles.text}>
                Rufen Sie uns gerne an:
              </Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handlePhonePress}
              >
                <Text style={styles.contactButtonText}>📞 0176 - 6 31 29 242</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Fixed Bottom Navigation */}
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
    backgroundColor: '#2c2c2c',
  },
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 48,
    flexDirection: 'column',
  },
  hamburgerContainer: {
    // Kein marginRight mehr, da in headerLeft
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
    marginBottom: 8,
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
  profileIconImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
  profileBtpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#a9c7cd',
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
  headerRight: {
    flex: 0,
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#2c2c2c',
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  dashboardContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    color: '#2c2c2c',
    marginBottom: 15,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 10,
  },
  contactButton: {
    backgroundColor: '#DAA520', // Gold
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c', // Schwarz
  },
});

