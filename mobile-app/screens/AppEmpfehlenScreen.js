import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Linking, Alert, Clipboard } from 'react-native';
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

export default function AppEmpfehlenScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false }, isPro = false) {
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

  // App Store / Play Store Links (Platzhalter - müssen später durch echte Links ersetzt werden)
  const getAppStoreLink = () => {
    if (Platform.OS === 'ios') {
      // iOS App Store Link (Platzhalter)
      return 'https://apps.apple.com/app/bottle-trade/id123456789'; // TODO: Echten App Store Link eintragen
    } else {
      // Google Play Store Link (Platzhalter)
      return 'https://play.google.com/store/apps/details?id=com.mlangebeck.mobileapp'; // TODO: Echten Play Store Link eintragen
    }
  };

  // WhatsApp-Text generieren
  const getWhatsAppText = () => {
    const appStoreLink = getAppStoreLink();
    const message = `🍷 Hey! Ich nutze die Bottle-Trade App zum Tauschen von Weinflaschen. Die App ist super - du solltest sie dir auch anschauen! 

📱 Hier ist der Link zum Download:
${appStoreLink}

Tausch dich durch die Welt der Weine! 🍇`;
    return message;
  };

  // WhatsApp öffnen mit Text
  const handleShareViaWhatsApp = async () => {
    try {
      const message = getWhatsAppText();
      const encodedMessage = encodeURIComponent(message);
      
      // WhatsApp Deep Link
      const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
      
      // Prüfen ob WhatsApp installiert ist
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback: WhatsApp Web
        const whatsappWebUrl = `https://wa.me/?text=${encodedMessage}`;
        const canOpenWeb = await Linking.canOpenURL(whatsappWebUrl);
        
        if (canOpenWeb) {
          await Linking.openURL(whatsappWebUrl);
        } else {
          Alert.alert(
            'WhatsApp nicht gefunden',
            'WhatsApp ist auf Ihrem Gerät nicht installiert. Der Link wurde in die Zwischenablage kopiert.',
            [
              {
                text: 'OK',
                onPress: () => handleCopyLink(),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Öffnen von WhatsApp:', error);
      Alert.alert(
        'Fehler',
        'WhatsApp konnte nicht geöffnet werden. Der Link wurde in die Zwischenablage kopiert.',
        [
          {
            text: 'OK',
            onPress: () => handleCopyLink(),
          },
        ]
      );
    }
  };

  // Link in Zwischenablage kopieren
  const handleCopyLink = async () => {
    try {
      const appStoreLink = getAppStoreLink();
      await Clipboard.setString(appStoreLink);
      Alert.alert('✅ Erfolg', 'Link wurde in die Zwischenablage kopiert!');
    } catch (error) {
      console.error('❌ Fehler beim Kopieren:', error);
      Alert.alert('Fehler', 'Link konnte nicht kopiert werden.');
    }
  };

  // WhatsApp-Text in Zwischenablage kopieren
  const handleCopyWhatsAppText = async () => {
    try {
      const message = getWhatsAppText();
      await Clipboard.setString(message);
      Alert.alert('✅ Erfolg', 'WhatsApp-Text wurde in die Zwischenablage kopiert!');
    } catch (error) {
      console.error('❌ Fehler beim Kopieren:', error);
      Alert.alert('Fehler', 'Text konnte nicht kopiert werden.');
    }
  };

  // App Store / Play Store direkt öffnen
  const handleOpenAppStore = async () => {
    try {
      const appStoreLink = getAppStoreLink();
      const canOpen = await Linking.canOpenURL(appStoreLink);
      
      if (canOpen) {
        await Linking.openURL(appStoreLink);
      } else {
        Alert.alert('Fehler', 'App Store konnte nicht geöffnet werden.');
      }
    } catch (error) {
      console.error('❌ Fehler beim Öffnen des App Stores:', error);
      Alert.alert('Fehler', 'App Store konnte nicht geöffnet werden.');
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
              <Text style={styles.greeting}>App empfehlen</Text>
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
              <Text style={styles.sectionTitle}>📱 App weiterempfehlen</Text>
              <Text style={styles.text}>
                Teile Bottle-Trade mit deinen Freunden! Empfehle die App über WhatsApp und hilf uns, die Community zu vergrößern.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 Über WhatsApp teilen</Text>
              <Text style={styles.text}>
                Klicke auf den Button, um die App direkt über WhatsApp zu empfehlen. Der Link führt deine Freunde direkt zum {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}.
              </Text>
              <TouchableOpacity 
                style={styles.whatsappButton}
                onPress={handleShareViaWhatsApp}
              >
                <Text style={styles.whatsappButtonText}>📱 Über WhatsApp teilen</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Link kopieren</Text>
              <Text style={styles.text}>
                Du kannst den Link auch manuell kopieren und in anderen Apps teilen:
              </Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={handleCopyLink}
              >
                <Text style={styles.copyButtonText}>🔗 Link kopieren</Text>
              </TouchableOpacity>
              <Text style={styles.linkText}>{getAppStoreLink()}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 WhatsApp-Text kopieren</Text>
              <Text style={styles.text}>
                Du kannst auch nur den WhatsApp-Text kopieren und manuell einfügen:
              </Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={handleCopyWhatsAppText}
              >
                <Text style={styles.copyButtonText}>📋 Text kopieren</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏪 App Store öffnen</Text>
              <Text style={styles.text}>
                Öffne den {Platform.OS === 'ios' ? 'App Store' : 'Play Store'} direkt:
              </Text>
              <TouchableOpacity 
                style={styles.storeButton}
                onPress={handleOpenAppStore}
              >
                <Text style={styles.storeButtonText}>
                  {Platform.OS === 'ios' ? '🍎 App Store öffnen' : '🤖 Play Store öffnen'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ⚠️ <Text style={styles.infoBold}>Hinweis:</Text> Die App ist noch nicht im {Platform.OS === 'ios' ? 'App Store' : 'Play Store'} veröffentlicht. Die Links sind Platzhalter und müssen nach der Veröffentlichung aktualisiert werden.
              </Text>
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
    paddingBottom: 0,
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
  hamburgerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginLeft: 6,
    marginRight: 6,
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
    paddingTop: 0,
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
    borderTopColor: 'rgba(218, 165, 32, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)',
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
    color: '#2c2c2c',
    marginBottom: 15,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 10,
  },
  whatsappButton: {
    backgroundColor: '#25D366', // WhatsApp Grün
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  whatsappButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  copyButton: {
    backgroundColor: '#DAA520', // Gold
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  storeButton: {
    backgroundColor: '#DAA520', // Gold
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  storeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  linkText: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoBox: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: 'bold',
  },
});


