import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  Modal,
  Dimensions,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import ProVersionButton from './components/ProVersionButton';
import { getCurrentUser } from './services/testAuth';
import { getUser } from './services/database-web';
import { 
  getActiveProducts, 
  searchProducts,
  subscribeActiveProducts,
  addToCart
} from './services/database-web';

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

export default function ShopScreen({ onNavigate, onLogout, isLoggedIn = false, isAdmin = false, unreadCount = 0, cartItemCount = 0, isPro = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('container');
  const [searchText, setSearchText] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserId(user.uid);
      loadProfileImage(user.uid);
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadProducts();
    }
  }, [currentUserId]);

  useEffect(() => {
    // Echtzeit-Updates via Subscription
    if (currentUserId) {
      const unsubscribe = subscribeActiveProducts((updatedProducts) => {
        setProducts(updatedProducts);
      });
      return () => unsubscribe();
    }
  }, [currentUserId]);

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

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const loadedProducts = await getActiveProducts();
      setProducts(loadedProducts);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Produkte:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter-Funktion für Produkte
  const filterProducts = (productsList, searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
      return productsList;
    }

    const query = searchQuery.toLowerCase().trim();
    return productsList.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      const tags = product.tags?.join(' ').toLowerCase() || '';
      const sku = product.sku?.toLowerCase() || '';

      return name.includes(query) ||
             description.includes(query) ||
             tags.includes(query) ||
             sku.includes(query);
    });
  };

  const filteredProducts = filterProducts(products, searchText);

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = async (product, quantity = 1, variantId = null) => {
    try {
      if (!isLoggedIn || !currentUserId) {
        Alert.alert('Anmeldung erforderlich', 'Bitte melde dich an, um Produkte zum Warenkorb hinzuzufügen.');
        onNavigate('login');
        return;
      }

      // Prüfe Lagerbestand
      if (product.stock !== null && product.stock < quantity) {
        Alert.alert('Nicht verfügbar', `Nur noch ${product.stock} Stück verfügbar.`);
        return;
      }

      // Wenn Variante, prüfe Varianten-Lagerbestand
      if (variantId && product.variants) {
        const variant = product.variants.find(v => v.id === variantId);
        if (variant && variant.stock !== null && variant.stock < quantity) {
          Alert.alert('Nicht verfügbar', `Nur noch ${variant.stock} Stück dieser Variante verfügbar.`);
          return;
        }
      }

      await addToCart(currentUserId, product.id, quantity, variantId);
      Alert.alert('Erfolg', 'Produkt wurde zum Warenkorb hinzugefügt!');
      handleCloseModal();
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen zum Warenkorb:', error);
      Alert.alert('Fehler', 'Produkt konnte nicht zum Warenkorb hinzugefügt werden.');
    }
  };


  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 60) / 2; // 2 Spalten mit Padding

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
            <View style={styles.headerRight}>
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
                <Text style={styles.greeting}>Shop</Text>
              </View>
            </View>
          </View>
          
          {/* Toggle-Buttons für Ansicht mit Warenkorb */}
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'container' && styles.viewToggleButtonActive
              ]}
              onPress={() => setViewMode('container')}
            >
              <Text style={[
                styles.viewToggleButtonText,
                viewMode === 'container' && styles.viewToggleButtonTextActive
              ]}>
                Kacheln
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'list' && styles.viewToggleButtonActive
              ]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[
                styles.viewToggleButtonText,
                viewMode === 'list' && styles.viewToggleButtonTextActive
              ]}>
                Liste
              </Text>
            </TouchableOpacity>
            {/* Warenkorb-Icon */}
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => onNavigate('warenkorb')}
            >
              <Text style={styles.cartIcon}>🛒</Text>
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Suchfeld */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Suche nach Produktname, Beschreibung..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.searchClearButton}
                onPress={() => setSearchText('')}
              >
                <Text style={styles.searchClearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Produkt-Liste */}
          {viewMode === 'container' ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.dashboardContainer}>
                {isLoading ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#a9c7cd" />
                    <Text style={styles.loadingText}>Produkte werden geladen...</Text>
                  </View>
                ) : filteredProducts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🛍️</Text>
                    <Text style={styles.emptyTitle}>
                      {searchText ? 'Keine Produkte gefunden' : 'Keine Produkte verfügbar'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {searchText ? 'Versuchen Sie eine andere Suche' : 'Schauen Sie später wieder vorbei!'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.productsList}>
                    {filteredProducts.map((product) => {
                      const isOutOfStock = product.stock !== null && product.stock === 0;
                      
                      return (
                        <TouchableOpacity 
                          key={product.id} 
                          style={[styles.productCard, { width: itemWidth }]}
                          activeOpacity={0.8}
                          onPress={() => handleProductPress(product)}
                        >
                          {/* Produktbild mit Padding */}
                          <View style={styles.productImageContainer}>
                            {product.images && product.images.length > 0 ? (
                              <OptimizedImage
                                source={{ uri: product.images[0] }}
                                style={styles.productImage}
                                resizeMode="contain"
                              />
                            ) : (
                              <View style={styles.productPlaceholder}>
                                <Text style={styles.productPlaceholderText}>📦</Text>
                              </View>
                            )}
                            {/* Ausverkauft-Badge */}
                            {isOutOfStock && (
                              <View style={styles.outOfStockBadge}>
                                <Text style={styles.outOfStockBadgeText}>Ausverkauft</Text>
                              </View>
                            )}
                          </View>
                          
                          {/* Info-Bereich */}
                          <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={2}>
                              {product.name}
                            </Text>
                            <Text style={styles.productPrice}>
                              {product.priceGross?.toFixed(2) || (product.price * 1.19).toFixed(2)} €
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.content}>
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={({ item: product }) => {
                  const isOutOfStock = product.stock !== null && product.stock === 0;
                  
                  return (
                    <TouchableOpacity
                      style={styles.listItem}
                      onPress={() => handleProductPress(product)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.listItemImageContainer}>
                        {product.images && product.images.length > 0 ? (
                          <OptimizedImage
                            source={{ uri: product.images[0] }}
                            style={styles.listItemImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.listItemPlaceholder}>
                            <Text style={styles.listItemPlaceholderText}>📦</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.listItemTextContainer}>
                        <Text style={styles.listItemName} numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text style={styles.listItemPrice}>
                          {product.priceGross?.toFixed(2) || (product.price * 1.19).toFixed(2)} €
                        </Text>
                        {isOutOfStock && (
                          <Text style={styles.listItemOutOfStock}>Ausverkauft</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  isLoading ? (
                    <View style={styles.loadingState}>
                      <ActivityIndicator size="large" color="#a9c7cd" />
                      <Text style={styles.loadingText}>Produkte werden geladen...</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyIcon}>🛍️</Text>
                      <Text style={styles.emptyTitle}>
                        {searchText ? 'Keine Produkte gefunden' : 'Keine Produkte verfügbar'}
                      </Text>
                      <Text style={styles.emptySubtitle}>
                        {searchText ? 'Versuchen Sie eine andere Suche' : 'Schauen Sie später wieder vorbei!'}
                      </Text>
                    </View>
                  )
                }
                contentContainerStyle={styles.listContent}
              />
            </View>
          )}
        </View>
      </View>
      
      {/* Produkt-Detail-Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>{selectedProduct.name}</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.modalCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.modalScrollView} 
                  contentContainerStyle={styles.modalScrollViewContent}
                  showsVerticalScrollIndicator={true}
                >
                  {/* Bildergalerie */}
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <View style={styles.modalImageContainer}>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => {
                          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                          setCurrentImageIndex(index);
                        }}
                      >
                        {selectedProduct.images.map((imageUri, index) => (
                          <View key={index} style={[styles.modalImageWrapper, { width: screenWidth * 0.9 }]}>
                            <OptimizedImage
                              source={{ uri: imageUri }}
                              style={styles.modalImage}
                              resizeMode="contain"
                            />
                          </View>
                        ))}
                      </ScrollView>
                      {selectedProduct.images.length > 1 && (
                        <View style={styles.imageIndicator}>
                          <Text style={styles.imageIndicatorText}>
                            {currentImageIndex + 1} / {selectedProduct.images.length}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <Text style={styles.modalImagePlaceholderText}>📦</Text>
                      <Text style={styles.modalImagePlaceholderLabel}>Kein Bild verfügbar</Text>
                    </View>
                  )}
                  
                  {/* Preis - Immer angezeigt */}
                  <View style={styles.modalPriceContainer}>
                    <Text style={styles.modalPrice}>
                      {selectedProduct.priceGross?.toFixed(2) || (selectedProduct.price * 1.19).toFixed(2)} €
                    </Text>
                    <Text style={styles.modalPriceSubtext}>
                      inkl. 19% MwSt. ({selectedProduct.price?.toFixed(2) || 0} € netto)
                    </Text>
                  </View>
                  
                  {/* Varianten */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <View style={styles.modalVariantsContainer}>
                      <Text style={styles.modalVariantsLabel}>Variante wählen:</Text>
                      {selectedProduct.variants.map((variant) => (
                        <TouchableOpacity
                          key={variant.id}
                          style={styles.variantButton}
                          onPress={() => handleAddToCart(selectedProduct, 1, variant.id)}
                        >
                          <Text style={styles.variantButtonText}>
                            {variant.name} - {variant.price ? (variant.price * 1.19).toFixed(2) : selectedProduct.priceGross?.toFixed(2)} €
                            {variant.stock !== null && ` (${variant.stock} verfügbar)`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  
                  {/* Beschreibung - Immer angezeigt, auch wenn leer */}
                  <View style={styles.modalDescriptionContainer}>
                    <Text style={styles.modalDescriptionLabel}>Beschreibung:</Text>
                    <Text style={styles.modalDescription}>
                      {selectedProduct.description || 'Keine Beschreibung verfügbar'}
                    </Text>
                  </View>
                  
                  {/* Lagerbestand */}
                  {selectedProduct.stock !== null && (
                    <View style={styles.modalStockContainer}>
                      <Text style={styles.modalStockText}>
                        {selectedProduct.stock > 0 
                          ? `Noch ${selectedProduct.stock} Stück verfügbar`
                          : 'Ausverkauft'}
                      </Text>
                    </View>
                  )}
                </ScrollView>
                
                {/* Modal Buttons */}
                <View style={styles.modalButtonsContainer}>
                  {(!selectedProduct.variants || selectedProduct.variants.length === 0) && (
                    <TouchableOpacity 
                      style={[
                        styles.modalButton,
                        styles.modalAddToCartButton,
                        (selectedProduct.stock !== null && selectedProduct.stock === 0) && styles.modalButtonDisabled
                      ]}
                      onPress={() => handleAddToCart(selectedProduct, 1)}
                      disabled={selectedProduct.stock !== null && selectedProduct.stock === 0}
                    >
                      <Text style={styles.modalButtonText}>
                        {selectedProduct.stock !== null && selectedProduct.stock === 0 
                          ? 'Ausverkauft' 
                          : 'In den Warenkorb'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      
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
  headerRight: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButton: {
    position: 'relative',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2c2c2c',
    gap: 12,
  },
  viewToggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  viewToggleButtonActive: {
    backgroundColor: '#DAA520', // Gold
    borderColor: '#DAA520',
  },
  viewToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  viewToggleButtonTextActive: {
    color: '#2c2c2c',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2c2c2c',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  searchClearButton: {
    position: 'absolute',
    right: 30,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchClearButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  productsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: 176, // 220px - 20% = 176px
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPlaceholderText: {
    fontSize: 48,
    opacity: 0.3,
    color: '#999999',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStockBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 16,
    paddingTop: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2c2c2c',
    marginBottom: 8,
    lineHeight: 20,
    minHeight: 40,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.2)',
  },
  listItemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  listItemImage: {
    width: 80,
    height: 80,
  },
  listItemPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemPlaceholderText: {
    fontSize: 32,
  },
  listItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  listItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c', // Schwarz
  },
  listItemOutOfStock: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 4,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#2c2c2c',
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  modalScrollViewContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  modalImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalImagePlaceholderText: {
    fontSize: 64,
    marginBottom: 8,
  },
  modalImagePlaceholderLabel: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  modalImageWrapper: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalPriceContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a9c7cd',
    marginBottom: 4,
  },
  modalPriceSubtext: {
    fontSize: 12,
    color: '#666',
  },
  modalVariantsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalVariantsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 12,
  },
  variantButton: {
    padding: 12,
    backgroundColor: 'rgba(218, 165, 32, 0.15)', // Helleres Gold für bessere Sichtbarkeit
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DAA520', // Gold Border
  },
  variantButtonText: {
    fontSize: 14,
    color: '#2c2c2c',
    fontWeight: '500',
  },
  modalDescriptionContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalDescriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalStockContainer: {
    padding: 20,
  },
  modalStockText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  modalButtonsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DAA520', // Gold
  },
  modalAddToCartButton: {
    backgroundColor: '#DAA520', // Gold
  },
  modalButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf Gold
  },
});
