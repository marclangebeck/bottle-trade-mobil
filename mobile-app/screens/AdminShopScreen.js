import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions
} from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';
import * as ImagePicker from 'expo-image-picker';
import {
  getActiveProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  PRODUCT_CATEGORIES,
  subscribeActiveProducts
} from '../services/database-web';

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

export default function AdminShopScreen({ onNavigate, isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState('container');
  const [searchText, setSearchText] = useState('');

  // Formular-States
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('weinglaeser');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formSize, setFormSize] = useState('medium');
  const [formShippingCost, setFormShippingCost] = useState('');
  const [formImages, setFormImages] = useState([]);
  const [formVariants, setFormVariants] = useState([]);
  const [formActive, setFormActive] = useState(true);
  const [formSku, setFormSku] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      loadProfileImage(user.uid);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    
    // Echtzeit-Updates
    const unsubscribe = subscribeActiveProducts((updatedProducts) => {
      setProducts(updatedProducts);
    });
    
    return () => unsubscribe();
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

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const loadedProducts = await getActiveProducts();
      setProducts(loadedProducts);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Produkte:', error);
      Alert.alert('Fehler', 'Produkte konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = (productsList, searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
      return productsList;
    }
    const query = searchQuery.toLowerCase().trim();
    return productsList.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      const sku = product.sku?.toLowerCase() || '';
      return name.includes(query) || description.includes(query) || sku.includes(query);
    });
  };

  const filteredProducts = filterProducts(products, searchText);

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setIsEditMode(false);
    resetForm();
    setIsModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditMode(true);
    setFormName(product.name || '');
    setFormDescription(product.description || '');
    setFormCategory(product.category || 'weinglaeser');
    // Preis: Punkt zu Komma konvertieren für deutsche Anzeige
    setFormPrice(product.price ? product.price.toString().replace('.', ',') : '');
    setFormStock(product.stock !== null ? product.stock.toString() : '');
    setFormSize(product.size || 'medium');
    // Versandkosten: Punkt zu Komma konvertieren für deutsche Anzeige
    setFormShippingCost(product.shippingCost ? product.shippingCost.toString().replace('.', ',') : '');
    setFormImages(product.images || []);
    setFormVariants(product.variants || []);
    setFormActive(product.active !== undefined ? product.active : true);
    setFormSku(product.sku || '');
    setIsModalVisible(true);
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Produkt löschen',
      'Möchten Sie dieses Produkt wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              Alert.alert('Erfolg', 'Produkt wurde gelöscht.');
              loadProducts();
            } catch (error) {
              console.error('❌ Fehler beim Löschen:', error);
              Alert.alert('Fehler', 'Produkt konnte nicht gelöscht werden.');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormCategory('weinglaeser');
    setFormPrice('');
    setFormStock('');
    setFormSize('medium');
    setFormShippingCost('');
    setFormImages([]);
    setFormVariants([]);
    setFormActive(true);
    setFormSku('');
  };

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung erforderlich', 'Bitte erlauben Sie den Zugriff auf die Galerie.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.slice(0, 5 - formImages.length);
        setFormImages([...formImages, ...newImages.map(asset => asset.uri)]);
      }
    } catch (error) {
      console.error('❌ Fehler beim Auswählen der Bilder:', error);
      Alert.alert('Fehler', 'Bilder konnten nicht ausgewählt werden.');
    }
  };

  const handleRemoveImage = (index) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    setFormVariants([...formVariants, {
      id: `variant-${Date.now()}`,
      name: '',
      price: null,
      stock: null,
      sku: ''
    }]);
  };

  const handleRemoveVariant = (index) => {
    setFormVariants(formVariants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index, field, value) => {
    const updated = [...formVariants];
    updated[index] = { ...updated[index], [field]: value };
    setFormVariants(updated);
  };

  const handleSaveProduct = async () => {
    try {
      if (!formName.trim()) {
        Alert.alert('Fehler', 'Produktname ist erforderlich.');
        return;
      }
      
      // Normalisiere Preis: Komma zu Punkt konvertieren
      const normalizedPrice = formPrice.replace(',', '.');
      if (!normalizedPrice || isNaN(parseFloat(normalizedPrice)) || parseFloat(normalizedPrice) < 0) {
        Alert.alert('Fehler', 'Gültiger Preis ist erforderlich.');
        return;
      }

      setIsUploading(true);

      // WICHTIG: Wenn Stock > 0, automatisch auf active = true setzen
      const stockValue = formStock ? parseInt(formStock) : null;
      const shouldBeActive = stockValue !== null && stockValue > 0 ? true : formActive;
      
      // Normalisiere Versandkosten: Komma zu Punkt konvertieren
      const normalizedShippingCost = formShippingCost 
        ? formShippingCost.replace(',', '.') 
        : '';
      const shippingCostValue = normalizedShippingCost 
        ? parseFloat(normalizedShippingCost) 
        : 0;
      
      const productData = {
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        price: parseFloat(normalizedPrice),
        stock: stockValue,
        size: formSize,
        shippingCost: shippingCostValue,
        variants: formVariants.filter(v => v.name.trim()),
        active: shouldBeActive,
        sku: formSku.trim() || null,
        createdBy: getCurrentUser()?.uid || null
      };

      let productId;
      if (isEditMode && selectedProduct) {
        // Update
        productId = selectedProduct.id;
        
        // Upload neue Bilder, falls vorhanden
        const newImageUris = formImages.filter(uri => uri.startsWith('file://') || uri.startsWith('content://'));
        if (newImageUris.length > 0) {
          const uploadedUrls = await uploadProductImages(productId, newImageUris);
          productData.images = [...formImages.filter(uri => uri.startsWith('http')), ...uploadedUrls];
        } else {
          productData.images = formImages;
        }
        
        await updateProduct(productId, productData);
        Alert.alert('Erfolg', 'Produkt wurde aktualisiert.');
      } else {
        // Create
        const uploadedUrls = formImages.length > 0 
          ? await uploadProductImages('temp', formImages.filter(uri => uri.startsWith('file://') || uri.startsWith('content://')))
          : [];
        productData.images = uploadedUrls;
        
        productId = await createProduct(productData);
        Alert.alert('Erfolg', 'Produkt wurde erstellt.');
      }

      setIsUploading(false);
      setIsModalVisible(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      setIsUploading(false);
      Alert.alert('Fehler', 'Produkt konnte nicht gespeichert werden.');
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 60) / 2;

  return (
    <View style={styles.container}>
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
          unreadNotifications={unreadNotifications}
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
                      {getInitials(getCurrentUser())}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
          </View>
          
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Shop-Verwaltung</Text>
            </View>
          </View>
          
          {/* Zurück-Button und Bestellübersicht */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => onNavigate('admin-dashboard')}
            >
              <Text style={styles.backButtonText}>← Zurück zum Admin-Bereich</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ordersButton}
              onPress={() => onNavigate('admin-orders')}
            >
              <Text style={styles.ordersButtonText}>📦 Bestellübersicht</Text>
            </TouchableOpacity>
          </View>
          
          {/* Toggle-Buttons */}
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'container' && styles.viewToggleButtonActive]}
              onPress={() => setViewMode('container')}
            >
              <Text style={[styles.viewToggleButtonText, viewMode === 'container' && styles.viewToggleButtonTextActive]}>
                Kacheln
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.viewToggleButtonText, viewMode === 'list' && styles.viewToggleButtonTextActive]}>
                Liste
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Suchfeld */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Suche nach Produktname..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchText}
              onChangeText={setSearchText}
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
            <ScrollView style={styles.content}>
              <View style={styles.productsList}>
                {isLoading ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#a9c7cd" />
                    <Text style={styles.loadingText}>Lade Produkte...</Text>
                  </View>
                ) : filteredProducts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>Keine Produkte gefunden</Text>
                  </View>
                ) : (
                  filteredProducts.map((product) => (
                    <View key={product.id} style={[styles.productCard, { width: itemWidth }]}>
                      {product.images && product.images.length > 0 && (
                        <OptimizedImage
                          source={{ uri: product.images[0] }}
                          style={styles.productImage}
                          resizeMode="contain"
                        />
                      )}
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                        <Text style={styles.productPrice}>{product.priceGross?.toFixed(2) || (product.price * 1.19).toFixed(2)} €</Text>
                        <View style={styles.productActions}>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEditProduct(product)}
                          >
                            <Text style={styles.editButtonText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteProduct(product.id)}
                          >
                            <Text style={styles.deleteButtonText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item: product }) => (
                <View style={styles.listItem}>
                  {product.images && product.images.length > 0 && (
                    <OptimizedImage
                      source={{ uri: product.images[0] }}
                      style={styles.listItemImage}
                      resizeMode="contain"
                    />
                  )}
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{product.name}</Text>
                    <Text style={styles.listItemPrice}>{product.priceGross?.toFixed(2) || (product.price * 1.19).toFixed(2)} €</Text>
                  </View>
                  <View style={styles.listItemActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditProduct(product)}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProduct(product.id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📦</Text>
                  <Text style={styles.emptyTitle}>Keine Produkte gefunden</Text>
                </View>
              }
            />
          )}
          
          {/* FAB für neues Produkt */}
          <TouchableOpacity
            style={styles.fab}
            onPress={handleNewProduct}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Produkt-Formular-Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Produkt bearbeiten' : 'Neues Produkt'}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.formInput}
              placeholder="Produktname *"
              value={formName}
              onChangeText={setFormName}
            />
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Beschreibung"
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
              numberOfLines={4}
            />
            
            <Text style={styles.formLabel}>Kategorie *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {PRODUCT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryChip, formCategory === category.id && styles.categoryChipActive]}
                  onPress={() => setFormCategory(category.id)}
                >
                  <Text style={[styles.categoryChipText, formCategory === category.id && styles.categoryChipTextActive]}>
                    {category.icon} {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TextInput
              style={styles.formInput}
              placeholder="Preis (netto) *"
              value={formPrice}
              onChangeText={setFormPrice}
              keyboardType="decimal-pad"
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="Lagerbestand (leer = unbegrenzt)"
              value={formStock}
              onChangeText={setFormStock}
              keyboardType="number-pad"
            />
            
            <Text style={styles.formLabel}>Größe (für Versandkosten) *</Text>
            <View style={styles.sizeButtons}>
              {['small', 'medium', 'large', 'xlarge'].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeButton, formSize === size && styles.sizeButtonActive]}
                  onPress={() => setFormSize(size)}
                >
                  <Text style={[styles.sizeButtonText, formSize === size && styles.sizeButtonTextActive]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={styles.formInput}
              placeholder="Versandkosten"
              value={formShippingCost}
              onChangeText={setFormShippingCost}
              keyboardType="decimal-pad"
            />
            
            <TextInput
              style={styles.formInput}
              placeholder="SKU (optional)"
              value={formSku}
              onChangeText={setFormSku}
            />
            
            <Text style={styles.formLabel}>Bilder (max. 5)</Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={handlePickImages}
              disabled={formImages.length >= 5}
            >
              <Text style={styles.imagePickerButtonText}>
                {formImages.length >= 5 ? 'Max. 5 Bilder' : 'Bilder auswählen'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.imagesContainer}>
              {formImages.map((imageUri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <OptimizedImage
                    source={{ uri: imageUri }}
                    style={styles.imagePreviewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            <Text style={styles.formLabel}>Varianten (optional)</Text>
            {formVariants.map((variant, index) => (
              <View key={variant.id} style={styles.variantContainer}>
                <TextInput
                  style={styles.variantInput}
                  placeholder="Variantenname (z.B. Größe: Groß)"
                  value={variant.name}
                  onChangeText={(value) => handleUpdateVariant(index, 'name', value)}
                />
                <TextInput
                  style={styles.variantInput}
                  placeholder="Preis (optional)"
                  value={variant.price?.toString() || ''}
                  onChangeText={(value) => handleUpdateVariant(index, 'price', value ? parseFloat(value) : null)}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={styles.variantInput}
                  placeholder="Lagerbestand (optional)"
                  value={variant.stock?.toString() || ''}
                  onChangeText={(value) => handleUpdateVariant(index, 'stock', value ? parseInt(value) : null)}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={styles.removeVariantButton}
                  onPress={() => handleRemoveVariant(index)}
                >
                  <Text style={styles.removeVariantButtonText}>Entfernen</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addVariantButton}
              onPress={handleAddVariant}
            >
              <Text style={styles.addVariantButtonText}>+ Variante hinzufügen</Text>
            </TouchableOpacity>
            
            <View style={styles.formCheckbox}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setFormActive(!formActive)}
              >
                <Text style={styles.checkboxText}>
                  {formActive ? '☑️' : '☐'} Produkt aktiv
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProduct}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Speichern</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
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
  },
  logoImageWrapper: {
    width: 40,
    height: 40,
    marginLeft: 6,
    marginRight: 6,
  },
  logoHeaderImage: {
    width: 40,
    height: 40,
  },
  profileSection: {
    minWidth: 48,
    alignItems: 'center',
  },
  profileIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
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
  },
  profileIconImage: {
    width: 45,
    height: 45,
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
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  hamburgerContainer: {
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2c2c2c',
  },
  viewToggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewToggleButtonActive: {
    backgroundColor: '#DAA520', // Gold
    borderColor: '#DAA520',
  },
  viewToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
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
  productsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.2)',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a9c7cd',
    marginBottom: 8,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#4a4a4a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.2)',
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listItemInfo: {
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
    color: '#a9c7cd',
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DAA520', // Gold
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#2c2c2c', // Schwarz
    fontWeight: 'bold',
  },
  ordersButton: {
    flex: 0.5, // 50% der Breite
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordersButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#2c2c2c',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formInput: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
    color: '#2c2c2c',
  },
  formTextArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 8,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 16,
  },
  categoryChipActive: {
    backgroundColor: '#DAA520', // Gold
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#2c2c2c',
    fontWeight: '600',
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sizeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: '#DAA520', // Gold
  },
  sizeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sizeButtonTextActive: {
    color: '#2c2c2c',
    fontWeight: '600',
  },
  imagePickerButton: {
    height: 44,
    backgroundColor: '#DAA520', // Gold
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerButtonText: {
    color: '#2c2c2c', // Schwarz
    fontSize: 14,
    fontWeight: '600',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
  },
  imagePreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  variantContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  variantInput: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 14,
    color: '#2c2c2c',
  },
  removeVariantButton: {
    padding: 8,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  removeVariantButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addVariantButton: {
    padding: 12,
    backgroundColor: '#DAA520', // Gold
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addVariantButtonText: {
    color: '#2c2c2c', // Schwarz
    fontSize: 14,
    fontWeight: '600',
  },
  formCheckbox: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    color: '#2c2c2c',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#DAA520', // Gold
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#2c2c2c', // Schwarz
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#DAA520', // Gold
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#2c2c2c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2c2c2c',
    gap: 12,
  },
  backButton: {
    flex: 0.5, // 50% der Breite
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

