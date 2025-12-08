import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import OptimizedImage from '../components/OptimizedImage';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';
import { isProUser } from '../services/subscriptionLimits';

export default function ProVersionScreen({ 
  onNavigate, 
  onLogout, 
  isAdmin = false, 
  isLoggedIn = false, 
  unreadCount = 0 
}) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      const user = getCurrentUser();
      if (user) {
        setCurrentUserId(user.uid);
        checkProStatus(user.uid);
        loadProfileImage(user.uid);
      }
    }
  }, [isLoggedIn]);

  const checkProStatus = async (userId) => {
    try {
      const proStatus = await isProUser(userId);
      setIsPro(proStatus);
    } catch (error) {
      console.error('❌ Fehler beim Prüfen des Pro-Status:', error);
      setIsPro(false);
    }
  };

  const loadProfileImage = async (userId) => {
    try {
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

  const handleShopNavigate = () => {
    if (onNavigate) {
      onNavigate('shop');
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
        onNavigate={onNavigate || (() => {})} 
        isLoggedIn={isLoggedIn} 
        onLogout={onLogout || (() => {})} 
        isAdmin={isAdmin} 
        unreadCount={unreadCount}
        renderButton={false}
        externalMenuVisible={isMenuVisible}
        onMenuToggle={setIsMenuVisible}
      />
      
      <View style={styles.contentContainer}>
        {/* Logo und Schriftzug mit Hamburger-Menü und Profil-Icon */}
        <View style={styles.logoHeaderContainer}>
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
          
          <View style={styles.profileIconContainer}>
            {profileImage ? (
              <OptimizedImage
                source={{ uri: profileImage }}
                style={styles.profileIcon}
              />
            ) : (
              <View style={styles.profileIconPlaceholder}>
                <Text style={styles.profileIconText}>P</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>Tausch dich durch die Welt der Weine.</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isPro ? 'Pro-Version aktiv' : 'Pro-Version'}
          </Text>
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {isPro ? (
            // Pro-User: Zeige Vorteile
            <View style={styles.proUserContainer}>
              <View style={styles.successBadge}>
                <Text style={styles.successBadgeText}>✓ Pro aktiv</Text>
              </View>
              
              <Text style={styles.sectionTitle}>Ihre Pro-Vorteile:</Text>
              
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>🍷</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Unbegrenzte Weine</Text>
                  <Text style={styles.benefitDescription}>
                    Veröffentlichen Sie so viele Weine wie Sie möchten in der Weinbörse und verwalten Sie unbegrenzt viele Weine in Ihrem Weinregal.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>📝</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Unbegrenzte Wunschliste</Text>
                  <Text style={styles.benefitDescription}>
                    Speichern Sie so viele Weine wie Sie möchten in Ihrer Wunschliste.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>🔄</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Unbegrenzte Trades</Text>
                  <Text style={styles.benefitDescription}>
                    Tauschen Sie so viele Weine wie Sie möchten - ohne monatliche Limits.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>🚫</Text>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Keine Werbung</Text>
                  <Text style={styles.benefitDescription}>
                    Genießen Sie eine werbefreie Erfahrung ohne Unterbrechungen.
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // Basic-User: Zeige Upgrade-Optionen
            <View style={styles.basicUserContainer}>
              <Text style={styles.introText}>
                Upgrade auf die Pro-Version und genießen Sie alle Vorteile ohne Limits!
              </Text>

              <View style={styles.comparisonContainer}>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Weine in Weinbörse:</Text>
                  <View style={styles.comparisonValues}>
                    <Text style={styles.basicValue}>4 (Basic)</Text>
                    <Text style={styles.proValue}>∞ (Pro)</Text>
                  </View>
                </View>

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Weine im Weinregal:</Text>
                  <View style={styles.comparisonValues}>
                    <Text style={styles.basicValue}>7 (Basic)</Text>
                    <Text style={styles.proValue}>∞ (Pro)</Text>
                  </View>
                </View>

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Wünsche in Wunschliste:</Text>
                  <View style={styles.comparisonValues}>
                    <Text style={styles.basicValue}>2 (Basic)</Text>
                    <Text style={styles.proValue}>∞ (Pro)</Text>
                  </View>
                </View>

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Trades pro Monat:</Text>
                  <View style={styles.comparisonValues}>
                    <Text style={styles.basicValue}>4 (Basic)</Text>
                    <Text style={styles.proValue}>∞ (Pro)</Text>
                  </View>
                </View>

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Werbung:</Text>
                  <View style={styles.comparisonValues}>
                    <Text style={styles.basicValue}>Ja (Basic)</Text>
                    <Text style={styles.proValue}>Nein (Pro)</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.shopButton}
                onPress={handleShopNavigate}
                activeOpacity={0.7}
              >
                <Text style={styles.shopButtonText}>Zum Shop</Text>
              </TouchableOpacity>

              <Text style={styles.noteText}>
                Hinweis: Nach dem Kauf im Shop wird Ihre Pro-Version manuell freigeschaltet.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 0,
    backgroundColor: '#2c2c2c',
  },
  hamburgerContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  hamburgerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
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
    flex: 1,
    justifyContent: 'center',
  },
  logoHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  logoImageWrapper: {
    marginLeft: 6,
    marginRight: 6,
  },
  logoHeaderImage: {
    width: 40,
    height: 40,
  },
  profileIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#DAA520',
    overflow: 'hidden',
    marginBottom: 8,
  },
  profileIcon: {
    width: '100%',
    height: '100%',
  },
  profileIconPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DAA520',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  taglineContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
    backgroundColor: '#2c2c2c',
  },
  tagline: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#2c2c2c',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  proUserContainer: {
    marginTop: 20,
  },
  successBadge: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  successBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: '#3a3a3a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  benefitIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DAA520',
    marginBottom: 5,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  basicUserContainer: {
    marginTop: 20,
  },
  introText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  comparisonContainer: {
    backgroundColor: '#3a3a3a',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  comparisonLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  basicValue: {
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 15,
  },
  proValue: {
    fontSize: 14,
    color: '#DAA520',
    fontWeight: 'bold',
  },
  shopButton: {
    backgroundColor: '#DAA520',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  shopButtonText: {
    color: '#2c2c2c',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

