import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
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

export default function HeaderTestScreen({ onNavigate, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      loadProfileImage(user.uid);
    }
  }, []);

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
          isLoggedIn={isLoggedIn} 
          onLogout={() => {}} 
          isAdmin={true} 
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
                      {getInitials(getCurrentUser())}
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
          
<ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.pageTitle}>Überschriften-Test</Text>
            <Text style={styles.pageSubtitle}>Wähle deinen bevorzugten Stil aus</Text>

            {/* Variante 1: Aktuell (30px, Gold, Text-Shadow) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant1}>Variante 1: Aktuell</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#a9c7cd'{'\n'}
                textShadow: rgba(218, 165, 32, 0.6)
              </Text>
            </View>

            {/* Variante 2: Größer, fetter (36px, Gold, stärkerer Shadow) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant2}>Variante 2: Größer & Fetter</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 36{'\n'}
                fontWeight: 'bold'{'\n'}
                color: '#a9c7cd'{'\n'}
                textShadow: rgba(218, 165, 32, 0.8)
              </Text>
            </View>

            {/* Variante 3: Elegant mit Gradient-Text (LinearGradient) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <LinearGradient
                      colors={['#FFD700', '#a9c7cd', '#B8860B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientTextContainer}
                    >
                      <Text style={styles.variant3}>Variante 3: Gradient-Text</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 32{'\n'}
                fontWeight: '700'{'\n'}
                LinearGradient: Gold → Dunkelgold{'\n'}
                textShadow: rgba(0, 0, 0, 0.3)
              </Text>
            </View>

            {/* Variante 4: Modern mit Outline (Weiß mit Gold-Outline) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant4}>Variante 4: Outline-Style</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 34{'\n'}
                fontWeight: '800'{'\n'}
                color: '#FFFFFF'{'\n'}
                textShadow: Gold-Outline-Effekt
              </Text>
            </View>

            {/* Variante 5: Minimalistisch (Weiß, kleiner) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant5}>Variante 5: Minimalistisch</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 28{'\n'}
                fontWeight: '500'{'\n'}
                color: '#FFFFFF'{'\n'}
                letterSpacing: 1
              </Text>
            </View>

            {/* Variante 6: Premium mit 3D-Effekt */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant6}>Variante 6: 3D-Effekt</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 32{'\n'}
                fontWeight: 'bold'{'\n'}
                color: '#a9c7cd'{'\n'}
                Mehrfacher Text-Shadow für 3D
              </Text>
            </View>

            {/* Variante 7: Elegant mit Unterstrich */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant7}>Variante 7: Mit Unterstrich</Text>
                    <View style={styles.underline} />
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#a9c7cd'{'\n'}
                Goldener Unterstrich
              </Text>
            </View>

            {/* Variante 8: Groß & Weit (Letter Spacing) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant8}>Variante 8: Groß & Weit</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 35{'\n'}
                fontWeight: '600'{'\n'}
                color: '#a9c7cd'{'\n'}
                letterSpacing: 2
              </Text>
            </View>

            {/* Variante 9: Rein Weiß (Elegant) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant9}>Variante 9: Rein Weiß</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 32{'\n'}
                fontWeight: '600'{'\n'}
                color: '#FFFFFF'{'\n'}
                textShadow: rgba(0, 0, 0, 0.5)
              </Text>
            </View>

            {/* Variante 10: Hellgrau (Subtile) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant10}>Variante 10: Hellgrau</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '500'{'\n'}
                color: '#E0E0E0'{'\n'}
                textShadow: rgba(0, 0, 0, 0.3)
              </Text>
            </View>

            {/* Variante 11: Weiß mit starker Betonung */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant11}>Variante 11: Weiß Stark</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 34{'\n'}
                fontWeight: 'bold'{'\n'}
                color: '#FFFFFF'{'\n'}
                textShadow: Mehrfach für Tiefe
              </Text>
            </View>

            {/* Variante 12: Cremeweiß (Warm) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant12}>Variante 12: Cremeweiß</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#F5F5DC'{'\n'}
                textShadow: rgba(0, 0, 0, 0.4)
              </Text>
            </View>

            {/* Variante 13: Silber (Metallisch) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant13}>Variante 13: Silber</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 32{'\n'}
                fontWeight: '600'{'\n'}
                color: '#C0C0C0'{'\n'}
                textShadow: rgba(255, 255, 255, 0.3)
              </Text>
            </View>

            {/* Variante 14: Helles Blau (Akzent) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant14}>Variante 14: Helles Blau</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#87CEEB'{'\n'}
                textShadow: rgba(0, 0, 0, 0.4)
              </Text>
            </View>

            {/* Variante 15: Weiß mit dünnem Gold-Akzent (Unterstrich) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant15}>Variante 15: Weiß + Gold-Akzent</Text>
                    <View style={styles.underlineGold} />
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#FFFFFF'{'\n'}
                Goldener Unterstrich als Akzent
              </Text>
            </View>

            {/* Variante 16: System Default (San Francisco / Roboto) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant16}>Variante 16: System Default</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#FFFFFF'{'\n'}
                fontFamily: System Default
              </Text>
            </View>

            {/* Variante 17: Serif (Times New Roman) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant17}>Variante 17: Serif</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#FFFFFF'{'\n'}
                fontFamily: 'serif'
              </Text>
            </View>

            {/* Variante 18: Monospace (Courier) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant18}>Variante 18: Monospace</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#FFFFFF'{'\n'}
                fontFamily: 'monospace'
              </Text>
            </View>

            {/* Variante 19: Sans-Serif (Arial/Helvetica) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant19}>Variante 19: Sans-Serif</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#FFFFFF'{'\n'}
                fontFamily: 'sans-serif'
              </Text>
            </View>

            {/* Variante 20: Cursive (Script) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant20}>Variante 20: Cursive</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '600'{'\n'}
                color: '#FFFFFF'{'\n'}
                fontFamily: 'cursive'
              </Text>
            </View>

            {/* Variante 21: System Bold (Fett) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant21}>Variante 21: System Bold</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 32{'\n'}
                fontWeight: 'bold'{'\n'}
                color: '#FFFFFF'{'\n'}
                fontFamily: System (Bold)
              </Text>
            </View>

            {/* Variante 22: System Light (Dünn) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant22}>Variante 22: System Light</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '300'{'\n'}
                color: '#FFFFFF'{'\n'}
                fontFamily: System (Light)
              </Text>
            </View>

            {/* Variante 23: System Medium (Mittel) */}
            <View style={styles.variantContainer}>
              <View style={styles.header}>
                <View style={styles.headerCenter}>
                  <View style={styles.greetingContainer}>
                    <Text style={styles.variant23}>Variante 23: System Medium</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.variantInfo}>
                fontSize: 30{'\n'}
                fontWeight: '500'{'\n'}
                color: '#FFFFFF'{'\n'}
                fontFamily: System (Medium)
              </Text>
            </View>

            <View style={styles.spacer} />
          </ScrollView>
        </View>
      </View>
      {/* Fixed Bottom Navigation */}
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
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
    
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
    marginLeft: 6, // Reduziert von 12 auf 6 (50%)
    marginRight: 6, // Reduziert von 12 auf 6 (50%)
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHeaderImage: {
    width: 40,
    height: 40,
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

  profileSection: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 44,
    alignItems: 'center',
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
  },
  greetingContainer: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
  },
  variantContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.6)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  variantInfo: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  spacer: {
    height: 20,
  },
  // Variante 1: Aktuell
  variant1: {
    fontSize: 30,
    fontWeight: '600',
    color: '#a9c7cd',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(218, 165, 32, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
  // Variante 2: Größer & Fetter
  variant2: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#a9c7cd',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(218, 165, 32, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    includeFontPadding: false,
  },
  // Variante 3: Gradient-Text
  gradientTextContainer: {
    paddingHorizontal: 0,
  },
  variant3: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    includeFontPadding: false,
  },
  // Variante 4: Outline-Style
  variant4: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: '#a9c7cd',
    textShadowOffset: { width: -2, height: -2 },
    textShadowRadius: 0,
    includeFontPadding: false,
    // Outline-Effekt durch mehrfachen Shadow
    shadowColor: '#a9c7cd',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  // Variante 5: Minimalistisch
  variant5: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  // Variante 6: 3D-Effekt
  variant6: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#a9c7cd',
    textAlign: 'center',
    letterSpacing: 0.5,
    // Mehrfacher Shadow für 3D-Effekt
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    includeFontPadding: false,
    shadowColor: '#a9c7cd',
    shadowOffset: { width: -1, height: -1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  // Variante 7: Mit Unterstrich
  variant7: {
    fontSize: 30,
    fontWeight: '600',
    color: '#a9c7cd',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(218, 165, 32, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
  underline: {
    width: '60%',
    height: 3,
    backgroundColor: '#a9c7cd',
    marginTop: 5,
    borderRadius: 2,
  },
  // Variante 8: Groß & Weit
  variant8: {
    fontSize: 35,
    fontWeight: '600',
    color: '#a9c7cd',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(218, 165, 32, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
  // Variante 9: Rein Weiß
  variant9: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
  // Variante 10: Hellgrau
  variant10: {
    fontSize: 30,
    fontWeight: '500',
    color: '#E0E0E0',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    includeFontPadding: false,
  },
  // Variante 11: Weiß Stark
  variant11: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    includeFontPadding: false,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  // Variante 12: Cremeweiß
  variant12: {
    fontSize: 30,
    fontWeight: '600',
    color: '#F5F5DC',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
  },
  // Variante 13: Silber
  variant13: {
    fontSize: 32,
    fontWeight: '600',
    color: '#C0C0C0',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    includeFontPadding: false,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  // Variante 14: Helles Blau
  variant14: {
    fontSize: 30,
    fontWeight: '600',
    color: '#87CEEB',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
  },
  // Variante 15: Weiß mit Gold-Akzent
  variant15: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
  },
  underlineGold: {
    width: '60%',
    height: 3,
    backgroundColor: '#a9c7cd',
    marginTop: 5,
    borderRadius: 2,
  },
  // Variante 16: System Default
  variant16: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
    // System Default (keine fontFamily angegeben)
  },
  // Variante 17: Serif
  variant17: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  // Variante 18: Monospace
  variant18: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Variante 19: Sans-Serif
  variant19: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  // Variante 20: Cursive
  variant20: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
  },
  // Variante 21: System Bold
  variant21: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
    // System Default mit Bold
  },
  // Variante 22: System Light
  variant22: {
    fontSize: 30,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
    // System Default mit Light
  },
  // Variante 23: System Medium
  variant23: {
    fontSize: 30,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    includeFontPadding: false,
    // System Default mit Medium
  },
});

