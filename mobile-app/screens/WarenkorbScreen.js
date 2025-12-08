import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';
import { 
  getCart, 
  updateCartItemQuantity, 
  removeFromCart,
  clearCart,
  subscribeCart,
  createOrder,
  calculateShippingCost
} from '../services/database-web';
import { generatePayPalPaymentUrl } from '../services/paypalService';
import { Linking } from 'react-native';

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

export default function WarenkorbScreen({ onNavigate, isLoggedIn = false, unreadCount = 0, isPro = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserId(user.uid);
      loadProfileImage(user.uid);
    }
  }, []);

  useEffect(() => {
    if (currentUserId && isLoggedIn) {
      loadCart();
      
      // Echtzeit-Updates via Subscription
      const unsubscribe = subscribeCart(currentUserId, (items) => {
        setCartItems(items);
        setIsLoading(false);
      });
      
      return () => unsubscribe();
    } else {
      setCartItems([]);
      setIsLoading(false);
    }
  }, [currentUserId, isLoggedIn]);

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

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const items = await getCart(currentUserId);
      setCartItems(items);
    } catch (error) {
      console.error('❌ Fehler beim Laden des Warenkorbs:', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, productId, currentQuantity, change) => {
    try {
      const newQuantity = Math.max(1, Math.min(10, currentQuantity + change));
      await updateCartItemQuantity(currentUserId, itemId, newQuantity);
    } catch (error) {
      console.error('❌ Fehler beim Ändern der Menge:', error);
      Alert.alert('Fehler', 'Menge konnte nicht geändert werden.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      Alert.alert(
        'Artikel entfernen',
        'Möchten Sie diesen Artikel aus dem Warenkorb entfernen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Entfernen',
            style: 'destructive',
            onPress: async () => {
              await removeFromCart(currentUserId, itemId);
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Fehler beim Entfernen:', error);
      Alert.alert('Fehler', 'Artikel konnte nicht entfernt werden.');
    }
  };

  const handleClearCart = async () => {
    try {
      Alert.alert(
        'Warenkorb leeren',
        'Möchten Sie wirklich alle Artikel aus dem Warenkorb entfernen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Leeren',
            style: 'destructive',
            onPress: async () => {
              await clearCart(currentUserId);
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Fehler beim Leeren des Warenkorbs:', error);
      Alert.alert('Fehler', 'Warenkorb konnte nicht geleert werden.');
    }
  };

  const handleCheckout = async () => {
    try {
      if (cartItems.length === 0) {
        Alert.alert('Warenkorb leer', 'Ihr Warenkorb ist leer.');
        return;
      }

      // Berechne Preise
      let subtotal = 0; // Netto
      const items = [];

      for (const item of cartItems) {
        const product = item.product;
        const quantity = item.quantity;
        let itemPrice = item.priceAtTime || product.price;

        // Wenn Variante, hole Varianten-Preis
        if (item.variantId && product.variants) {
          const variant = product.variants.find(v => v.id === item.variantId);
          if (variant && variant.price) {
            itemPrice = variant.price;
          }
        }

        const itemSubtotal = itemPrice * quantity;
        subtotal += itemSubtotal;

        items.push({
          productId: product.id,
          variantId: item.variantId || null,
          name: product.name,
          variantName: item.variantId ? product.variants?.find(v => v.id === item.variantId)?.name : null,
          quantity: quantity,
          price: itemPrice,
          priceGross: Math.round(itemPrice * 1.19 * 100) / 100,
          product: product
        });
      }

      // Berechne MwSt (19%)
      const tax = Math.round(subtotal * 0.19 * 100) / 100;

      // Berechne Versandkosten
      const shippingCost = calculateShippingCost(items, subtotal + tax);
      const shippingCostFree = (subtotal + tax) >= 100;

      // Gesamtpreis (Brutto + Versand)
      const total = Math.round((subtotal + tax + shippingCost) * 100) / 100;

      // Erstelle Bestellung
      const orderId = await createOrder({
        userId: currentUserId,
        items: items,
        paymentMethod: 'paypal',
        shippingAddress: null // Wird später von PayPal geholt
      });

      // Generiere PayPal Payment URL mit Return-URLs
      const returnUrl = `bottletrade://payment-success?orderId=${orderId}`;
      const cancelUrl = `bottletrade://payment-cancel?orderId=${orderId}`;
      
      // Bereite Bestelldaten für PayPal vor
      const orderData = {
        total: total,
        subtotal: subtotal,
        tax: tax,
        shippingCost: shippingCost,
        userId: currentUserId,
        items: cartItems.map(item => ({
          name: item.product.name,
          variantName: item.variantId ? item.product.variants?.find(v => v.id === item.variantId)?.name : null,
          quantity: item.quantity,
          price: item.priceAtTime || item.product.price,
        })),
      };
      
      const paypalUrl = await generatePayPalPaymentUrl(orderData, orderId, returnUrl, cancelUrl);
      
      Alert.alert(
        'Zur Kasse',
        `Gesamtbetrag: ${total.toFixed(2)} €\n\nSie werden zu PayPal weitergeleitet.`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Weiter zu PayPal',
            onPress: async () => {
              try {
                // Prüfe ob URL gültig ist
                if (!paypalUrl || paypalUrl.includes('YOUR_')) {
                  Alert.alert(
                    'Konfiguration erforderlich',
                    'PayPal ist noch nicht vollständig konfiguriert. Bitte trage die PayPal API-Credentials in config/paypal.js ein.',
                    [{ text: 'OK' }]
                  );
                  return;
                }

                const supported = await Linking.canOpenURL(paypalUrl);
                if (supported) {
                  await Linking.openURL(paypalUrl);
                  console.log('✅ PayPal URL geöffnet:', paypalUrl);
                } else {
                  Alert.alert(
                    'Fehler',
                    'PayPal konnte nicht geöffnet werden. Bitte installiere die PayPal App oder verwende einen Browser.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (error) {
                console.error('❌ Fehler beim Öffnen von PayPal:', error);
                Alert.alert(
                  'Fehler',
                  `PayPal konnte nicht geöffnet werden: ${error.message}`,
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Fehler beim Checkout:', error);
      Alert.alert('Fehler', 'Bestellung konnte nicht erstellt werden.');
    }
  };

  // Berechne Preise
  let subtotal = 0; // Netto
  let totalQuantity = 0;

  cartItems.forEach(item => {
    const product = item.product;
    const quantity = item.quantity;
    let itemPrice = item.priceAtTime || product.price;

    // Wenn Variante, hole Varianten-Preis
    if (item.variantId && product.variants) {
      const variant = product.variants.find(v => v.id === item.variantId);
      if (variant && variant.price) {
        itemPrice = variant.price;
      }
    }

    subtotal += itemPrice * quantity;
    totalQuantity += quantity;
  });

  const tax = Math.round(subtotal * 0.19 * 100) / 100;
  const totalGross = subtotal + tax;
  const shippingCost = calculateShippingCost(cartItems, totalGross);
  const shippingCostFree = totalGross >= 100;
  const total = Math.round((totalGross + shippingCost) * 100) / 100;

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
          isAdmin={false} 
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
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>Warenkorb</Text>
              </View>
            </View>
          </View>
          
          {/* Zurück-Button und Warenkorb leeren */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => onNavigate('shop')}
            >
              <Text style={styles.backButtonText}>← Zurück zum Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleClearCart}
            >
              <Text style={styles.backButtonText}>Warenkorb leeren</Text>
            </TouchableOpacity>
          </View>
          
          {/* Warenkorb-Inhalt */}
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainerStyle}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#a9c7cd" />
                <Text style={styles.loadingText}>Warenkorb wird geladen...</Text>
              </View>
            ) : cartItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>Ihr Warenkorb ist leer</Text>
                <Text style={styles.emptySubtitle}>Fügen Sie Produkte hinzu, um zu beginnen</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => onNavigate('shop')}
                >
                  <Text style={styles.emptyButtonText}>Zum Shop</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Produktliste */}
                <View style={styles.itemsContainer}>
                  {cartItems.map((item) => {
                    const product = item.product;
                    let itemPrice = item.priceAtTime || product.price;
                    let variantName = null;

                    // Wenn Variante, hole Varianten-Preis
                    if (item.variantId && product.variants) {
                      const variant = product.variants.find(v => v.id === item.variantId);
                      if (variant) {
                        if (variant.price) itemPrice = variant.price;
                        variantName = variant.name;
                      }
                    }

                    const itemTotal = itemPrice * item.quantity;
                    const itemTotalGross = Math.round(itemTotal * 1.19 * 100) / 100;

                    return (
                      <View key={item.id} style={styles.cartItem}>
                        {/* Produktbild */}
                        <View style={styles.cartItemImageContainer}>
                          {product.images && product.images.length > 0 ? (
                            <OptimizedImage
                              source={{ uri: product.images[0] }}
                              style={styles.cartItemImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.cartItemPlaceholder}>
                              <Text style={styles.cartItemPlaceholderText}>📦</Text>
                            </View>
                          )}
                        </View>
                        
                        {/* Produktinfo */}
                        <View style={styles.cartItemInfo}>
                          <Text style={styles.cartItemName} numberOfLines={2}>
                            {product.name}
                          </Text>
                          {variantName && (
                            <Text style={styles.cartItemVariant}>{variantName}</Text>
                          )}
                          <Text style={styles.cartItemPrice}>
                            {itemPrice.toFixed(2)} € (netto) × {item.quantity} = {itemTotalGross.toFixed(2)} €
                          </Text>
                        </View>
                        
                        {/* Mengensteuerung */}
                        <View style={styles.cartItemControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleQuantityChange(item.id, product.id, item.quantity, -1)}
                          >
                            <Text style={styles.quantityButtonText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => handleQuantityChange(item.id, product.id, item.quantity, 1)}
                            disabled={item.quantity >= 10}
                          >
                            <Text style={[styles.quantityButtonText, item.quantity >= 10 && styles.quantityButtonTextDisabled]}>+</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveItem(item.id)}
                          >
                            <Text style={styles.removeButtonText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
                
                {/* Preisübersicht */}
                <View style={styles.priceSummary}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Zwischensumme (netto):</Text>
                    <Text style={styles.priceValue}>{subtotal.toFixed(2)} €</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>MwSt. (19%):</Text>
                    <Text style={styles.priceValue}>{tax.toFixed(2)} €</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Zwischensumme (brutto):</Text>
                    <Text style={styles.priceValue}>{totalGross.toFixed(2)} €</Text>
                  </View>
                  <View style={[styles.priceRow, styles.shippingRow]}>
                    <Text style={styles.priceLabel}>
                      Versandkosten:
                      {shippingCostFree && (
                        <Text style={styles.shippingFreeText}> (versandkostenfrei ab 100€)</Text>
                      )}
                    </Text>
                    <Text style={styles.priceValue}>
                      {shippingCostFree ? '0,00 €' : `${shippingCost.toFixed(2)} €`}
                    </Text>
                  </View>
                  <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Gesamt:</Text>
                    <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
                  </View>
                </View>
                
                {/* PayPal Bezahl-Button */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    onPress={handleCheckout}
                    activeOpacity={0.7}
                  >
                    <OptimizedImage
                      source={require('../assets/images/paypal-logo.png')}
                      style={styles.paypalLogo}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    paddingBottom: 0,
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
    fontSize: 18,
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
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greetingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
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
    borderRadius: 22,
    backgroundColor: 'rgba(47, 58, 59, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    marginVertical: 3,
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
  },
  contentContainerStyle: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#a9c7cd',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#2c2c2c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemsContainer: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.2)',
  },
  cartItemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  cartItemImage: {
    width: 80,
    height: 80,
  },
  cartItemPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemPlaceholderText: {
    fontSize: 32,
  },
  cartItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  cartItemVariant: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DAA520', // Gold
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf Gold
  },
  quantityButtonTextDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
  },
  priceSummary: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.2)',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shippingRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 8,
    marginTop: 8,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#a9c7cd',
    paddingTop: 12,
    marginTop: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  shippingFreeText: {
    fontSize: 12,
    color: '#a9c7cd',
    fontStyle: 'italic',
  },
  priceValue: {
    fontSize: 14,
    color: '#2c2c2c',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c', // Schwarz
  },
  buttonsContainer: {
    padding: 20,
    gap: 12,
  },
  clearButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paypalLogo: {
    width: '100%', // Volle Breite des Containers
    height: 100, // Größere Höhe für bessere Sichtbarkeit
    maxWidth: 400, // Maximale Breite für größere Screens
    alignSelf: 'center',
  },
  backButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2c2c2c',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

