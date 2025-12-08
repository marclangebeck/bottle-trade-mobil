import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';
import { getOrder, updateOrderStatus } from '../services/database-web';

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

export default function PaymentSuccessScreen({ onNavigate, isLoggedIn = false, unreadCount = 0, route }, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderId = route?.params?.orderId;
  const paymentId = route?.params?.paymentId;

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      loadProfileImage(user.uid);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      // WICHTIG: Aktualisiere Bestellung automatisch, falls noch nicht geschehen
      updateOrderStatusIfNeeded();
      loadOrder();
    } else {
      setIsLoading(false);
    }
  }, [orderId]);

  // Aktualisiere Bestellstatus, falls noch nicht geschehen (Fallback für Deep Link Handler)
  const updateOrderStatusIfNeeded = async () => {
    if (!orderId) return;
    
    try {
      console.log('🔄 PaymentSuccessScreen: Prüfe Bestellstatus für:', orderId);
      const currentOrder = await getOrder(orderId);
      
      // Wenn Bestellung noch "pending" ist, aktualisiere auf "paid"
      if (currentOrder.status === 'pending') {
        console.log('⚠️ Bestellung ist noch "pending", aktualisiere auf "paid"...');
        await updateOrderStatus(orderId, 'paid', paymentId || undefined);
        console.log('✅ Bestellstatus auf "paid" aktualisiert (Fallback)');
      } else {
        console.log('✅ Bestellung hat bereits Status:', currentOrder.status);
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Bestellstatus (Fallback):', error);
      // Nicht kritisch, weiter mit normalem Laden
    }
  };

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

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const orderData = await getOrder(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Bestellung:', error);
      Alert.alert('Fehler', 'Bestellung konnte nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentUser = getCurrentUser();

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
        onLogout={() => {}}
        isAdmin={false}
        unreadCount={unreadCount}
        renderButton={false}
        externalMenuVisible={isMenuVisible}
        onMenuToggle={setIsMenuVisible}
      />

      <View style={styles.contentContainer}>
        {/* Logo-Header */}
        <View style={styles.logoHeaderContainer}>
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
                    {getInitials(currentUser)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>Zahlung erfolgreich</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Vielen Dank für Ihre Bestellung!</Text>
            <Text style={styles.successText}>
              Ihre Zahlung wurde erfolgreich verarbeitet.
            </Text>

            {orderId && (
              <View style={styles.orderInfo}>
                <Text style={styles.orderInfoLabel}>Bestellnummer:</Text>
                <Text style={styles.orderInfoValue}>{orderId.substring(0, 8)}</Text>
              </View>
            )}

            {paymentId && (
              <View style={styles.orderInfo}>
                <Text style={styles.orderInfoLabel}>Transaktions-ID:</Text>
                <Text style={styles.orderInfoValue}>{paymentId}</Text>
              </View>
            )}

            {order && (
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailsTitle}>Bestelldetails:</Text>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Zwischensumme (Netto):</Text>
                  <Text style={styles.orderDetailValue}>{order.subtotal?.toFixed(2)} €</Text>
                </View>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>MwSt. (19%):</Text>
                  <Text style={styles.orderDetailValue}>{order.tax?.toFixed(2)} €</Text>
                </View>
                {order.shippingCost > 0 && (
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Versandkosten:</Text>
                    <Text style={styles.orderDetailValue}>{order.shippingCost?.toFixed(2)} €</Text>
                  </View>
                )}
                <View style={[styles.orderDetailRow, styles.orderDetailRowTotal]}>
                  <Text style={styles.orderDetailLabelTotal}>Gesamtbetrag:</Text>
                  <Text style={styles.orderDetailValueTotal}>{order.total?.toFixed(2)} €</Text>
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onNavigate('shop')}
              >
                <Text style={styles.primaryButtonText}>Zurück zum Shop</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onNavigate('profil')}
              >
                <Text style={styles.secondaryButtonText}>Zu meinen Bestellungen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
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
  hamburgerContainer: {},
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#2c2c2c',
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  orderInfo: {
    width: '100%',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  orderInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  orderDetails: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  orderDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 15,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  orderDetailRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
    paddingTop: 15,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderDetailValue: {
    fontSize: 14,
    color: '#2c2c2c',
    fontWeight: '600',
  },
  orderDetailLabelTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  orderDetailValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 30,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#a9c7cd',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

