import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import Footer from './Footer';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import { getCurrentUser } from './services/testAuth';

export default function CommunityScreen({ onNavigate, onLogout, isAdmin = false, unreadNotifications = 0, unreadHints = 0, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userBtp, setUserBtp] = useState(0);

  useEffect(() => {
    const user = getCurrentUser();
    setUserBtp(user?.btp ?? 0);
  }, []);
  
  const communitySections = [
    {
      id: 'userinnen',
      title: 'Userinnen/User',
      icon: '👤',
      description: 'Community-Mitglieder entdecken',
    },
    {
      id: 'schwarzes-brett',
      title: 'Schwarzes Brett',
      icon: '📋',
      description: 'Ankündigungen und Nachrichten',
    },
    {
      id: 'statistiken',
      title: 'Statistiken',
      icon: '📊',
      description: 'Community-Übersicht und Daten',
    },
    {
      id: 'gaestebuch',
      title: 'Gästebuch',
      icon: '📝',
      description: 'Hinterlasse deine Nachricht',
    },
    {
      id: 'fotowand',
      title: 'Fotowand',
      icon: '📸',
      description: 'Teile deine Wein-Momente',
    },
    {
      id: 'umfragen',
      title: 'Umfragen',
      icon: '🗳️',
      description: 'Nimm an Abstimmungen teil',
    },
    {
      id: 'weingueter',
      title: 'Weingüter',
      icon: '🏰',
      description: 'Entdecke Weingüter',
    }
  ];

  const handleSectionPress = (section) => {
    Alert.alert(
      section.title,
      `${section.description}\n\nDiese Funktion wird bald verfügbar sein!`,
      [{ text: 'OK' }]
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
        unreadNotifications={unreadNotifications}
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
            <Text style={styles.greeting}>Community</Text>
          </View>
        </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {/* Community Kacheln */}
              <View style={styles.tilesGrid}>
                {/* Zeile 1 */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[0])}>
                    <Text style={styles.tileIcon}>{communitySections[0].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[0].title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[1])}>
                    <Text style={styles.tileIcon}>{communitySections[1].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[1].title}</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 2 */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[2])}>
                    <Text style={styles.tileIcon}>{communitySections[2].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[2].title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[3])}>
                    <Text style={styles.tileIcon}>{communitySections[3].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[3].title}</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 3 */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[4])}>
                    <Text style={styles.tileIcon}>{communitySections[4].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[4].title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[5])}>
                    <Text style={styles.tileIcon}>{communitySections[5].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[5].title}</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 4 - Volle Breite */}
                <TouchableOpacity style={[styles.tileFullWidth, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[6])}>
                  <View style={styles.tileFullContent}>
                    <Text style={styles.tileIcon}>{communitySections[6].icon}</Text>
                    <View style={styles.tileFullText}>
                      <Text style={styles.tileTitle}>{communitySections[6].title}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      <Footer />
      
      {/* Fixed Bottom Navigation */}
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadNotifications={unreadNotifications}
        unreadHints={unreadHints}
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
  tile: {
    flex: 1,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF', // Weiße Border
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