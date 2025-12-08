import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OptimizedImage from './components/OptimizedImage';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import ProVersionButton from './components/ProVersionButton';
import { getCurrentUser } from './services/testAuth';
import { getUser } from './services/database-web';

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

export default function CommunityScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false, wishlistMatchCount = 0, isPro = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userBtp, setUserBtp] = useState(0);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserBtp(user?.btp ?? 0);
      // Versuche zuerst aus getCurrentUser zu laden (schneller)
      if (user.profilbild) {
        setProfileImage(user.profilbild);
      } else {
        // Fallback: Lade aus Firestore
        loadProfileImage(user.uid);
      }
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
  
  const communitySections = [
    {
      id: 'userinnen',
      title: 'Userinnen/User',
      icon: '👤',
      description: 'Community-Mitglieder entdecken',
      color: '#4A90E2', // Blau
      gradientColors: ['rgba(74, 144, 226, 0.15)', 'rgba(74, 144, 226, 0.05)'],
    },
    {
      id: 'schwarzes-brett',
      title: 'Schwarzes Brett',
      icon: '📋',
      description: 'Ankündigungen und Nachrichten',
      color: '#F5A623', // Orange
      gradientColors: ['rgba(245, 166, 35, 0.15)', 'rgba(245, 166, 35, 0.05)'],
    },
    {
      id: 'weingueter',
      title: 'Weingüter',
      icon: '🏰',
      description: 'Entdecke Weingüter',
      color: '#a9c7cd', // Gold
      gradientColors: ['rgba(218, 165, 32, 0.15)', 'rgba(218, 165, 32, 0.05)'],
    },
    {
      id: 'statistiken',
      title: 'Statistiken',
      icon: '📊',
      description: 'Ranglisten und Statistiken',
      color: '#9C27B0', // Lila
      gradientColors: ['rgba(156, 39, 176, 0.15)', 'rgba(156, 39, 176, 0.05)'],
    }
  ];

  const handleSectionPress = (section) => {
    if (section.id === 'userinnen') {
      // Navigiere zum UserScreen
      if (onNavigate) {
        onNavigate('users');
      }
    } else if (section.id === 'schwarzes-brett') {
      // Navigiere zum SchwarzesBrettScreen
      if (onNavigate) {
        onNavigate('schwarzes-brett');
      }
    } else if (section.id === 'weingueter') {
      // Navigiere zum WeingueterScreen
      if (onNavigate) {
        onNavigate('weingueter');
      }
    } else if (section.id === 'statistiken') {
      // Navigiere zum StatistikScreen
      if (onNavigate) {
        onNavigate('statistiken');
      }
    } else {
      Alert.alert(
        section.title,
        `${section.description}\n\nDiese Funktion wird bald verfügbar sein!`,
        [{ text: 'OK' }]
      );
    }
  };

  // Komponente für moderne Community-Card
  const ModernCommunityCard = ({ section, isFullWidth = false }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };

    const handlePress = () => {
      handleSectionPress(section);
    };

    if (isFullWidth) {
      return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={styles.modernCardFullWidth}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glassmorphismBackgroundFullWidth}
            >
              <View style={styles.modernCardContent}>
                <View style={[styles.iconCircle, styles.iconCircleHorizontal, { backgroundColor: `${section.color}20` }]}>
                  <Text style={styles.modernIcon}>{section.icon}</Text>
                </View>
                <View style={styles.modernCardTextContainer}>
                  <Text style={styles.modernCardTitle}>{section.title}</Text>
                  <Text style={styles.modernCardDescription}>{section.description}</Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrowIcon}>→</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[{ flex: 1, marginHorizontal: 5 }, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={styles.modernCard}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassmorphismBackground}
          >
            <View style={styles.modernCardContentVertical}>
              <View style={[styles.iconCircle, { backgroundColor: `${section.color}20` }]}>
                <Text style={styles.modernIcon}>{section.icon}</Text>
              </View>
              <Text style={styles.modernCardTitle}>{section.title}</Text>
              <Text style={styles.modernCardDescription}>{section.description}</Text>
              <View style={styles.arrowContainerVertical}>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
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
        
        {/* Header mit Überschrift */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>Community</Text>
          </View>
        </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {/* Community Kacheln - Modernisiert */}
              <View style={styles.tilesGrid}>
                {/* Zeile 1 */}
                <View style={styles.tilesRow}>
                  <ModernCommunityCard section={communitySections[0]} />
                  <ModernCommunityCard section={communitySections[1]} />
                </View>

                {/* Zeile 2 */}
                <View style={styles.tilesRow}>
                  <ModernCommunityCard section={communitySections[2]} />
                  <ModernCommunityCard section={communitySections[3]} />
                </View>
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
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Header Styles
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
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 44,
    alignItems: 'center',
    marginBottom: 8,
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
  wishlistButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wishlistHeartContainer: {
    position: 'relative',
  },
  wishlistHeart: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  wishlistBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1000,
    elevation: 10,
  },
  wishlistBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 80, // Mehr Platz für beide Buttons
    alignItems: 'center',
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
    color: '#FFFFFF',
  },
  dashboardButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(218, 165, 32, 0.3)', // Warmes Gold
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.5)',
  },
  dashboardButtonText: {
    fontSize: 22,
    color: '#2c2c2c', // Dunkler Text
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
  },
  dashboardContainer: {
    padding: 20,
  },
  tilesGrid: {
    marginTop: 10,
  },
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  // Moderne Glassmorphism Cards
  modernCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 240, // Mindesthöhe für gleichmäßige Cards
  },
  modernCardFullWidth: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 5,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glassmorphismBackground: {
    borderRadius: 20,
    padding: 20, // Reduziertes Padding
    paddingVertical: 18, // Weniger vertikales Padding
    flex: 1, // Nimmt verfügbaren Platz ein
  },
  glassmorphismBackgroundFullWidth: {
    borderRadius: 20,
    padding: 20, // Reduziertes Padding für Full-Width
    paddingVertical: 18, // Weniger vertikales Padding
  },
  modernCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 0, // Keine Mindesthöhe für Full-Width
  },
  modernCardContentVertical: {
    alignItems: 'center',
    justifyContent: 'flex-start', // Startet oben
    flex: 1, // Nimmt verfügbaren Platz ein
    paddingTop: 4, // Kleiner Abstand oben
  },
  iconCircle: {
    width: 70, // Etwas kleiner
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12, // Reduzierter Abstand
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconCircleHorizontal: {
    marginBottom: 0,
    marginRight: 0,
  },
  modernIcon: {
    fontSize: 36, // Etwas kleiner für kompakteres Layout
  },
  modernCardTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  modernCardTitle: {
    fontSize: 18, // Etwas kleiner
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4, // Reduzierter Abstand
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  modernCardDescription: {
    fontSize: 13, // Etwas kleiner
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18, // Kompaktere Zeilenhöhe
    marginTop: 2,
    textAlign: 'center',
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  arrowContainerVertical: {
    marginTop: 8, // Reduzierter Abstand
    width: 32, // Etwas kleiner
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Legacy Styles (werden nicht mehr verwendet, aber für Kompatibilität behalten)
  tile: {
    flex: 1,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
});