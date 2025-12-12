import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';
import {
  createInserat,
  updateInserat,
  deleteInserat,
  subscribeInserate,
  getInserat,
} from '../services/database-web';
import { uploadImageToStorage } from '../services/database-web';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export default function SchwarzesBrettScreen({
  onNavigate,
  onLogout,
  isAdmin = false,
  unreadCount = 0,
  isLoggedIn = false,
}, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [activeTab, setActiveTab] = useState('suche'); // 'suche' oder 'biete'
  const [inserate, setInserate] = useState([]);
  const [filteredInserate, setFilteredInserate] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInserat, setSelectedInserat] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInseratId, setEditingInseratId] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs für TextInputs im Formular
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const contactInfoInputRef = useRef(null);
  const formScrollViewRef = useRef(null);

  const [formData, setFormData] = useState({
    type: 'suche',
    title: '',
    description: '',
    images: [],
    contactInfo: '',
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      loadProfileImage(user.uid);
    }
  }, []);

  useEffect(() => {
    // Abonniere Inserate in Echtzeit
    const unsubscribe = subscribeInserate(activeTab, (data) => {
      setInserate(data);
      filterInserate(data, searchQuery);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab]);

  useEffect(() => {
    filterInserate(inserate, searchQuery);
  }, [searchQuery, inserate]);

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

  const filterInserate = (data, query) => {
    if (!query.trim()) {
      setFilteredInserate(data);
      return;
    }

    const filtered = data.filter((inserat) => {
      const searchLower = query.toLowerCase();
      return (
        inserat.title?.toLowerCase().includes(searchLower) ||
        inserat.description?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredInserate(filtered);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery(''); // Suche zurücksetzen
  };

  const handleInseratPress = (inserat) => {
    setSelectedInserat(inserat);
    setCurrentImageIndex(0);
    setIsDetailModalVisible(true);
  };

  const handleAddInserat = () => {
    setIsEditing(false);
    setEditingInseratId(null);
    setFormData({
      type: activeTab,
      title: '',
      description: '',
      images: [],
      contactInfo: '',
    });
    setIsFormModalVisible(true);
  };

  const handleEditInserat = (inserat) => {
    const currentUser = getCurrentUser();
    if (inserat.userId !== currentUser?.uid) {
      Alert.alert('Fehler', 'Du kannst nur deine eigenen Inserate bearbeiten.');
      return;
    }

    setIsEditing(true);
    setEditingInseratId(inserat.id);
    setFormData({
      type: inserat.type,
      title: inserat.title || '',
      description: inserat.description || '',
      images: inserat.images || [],
      contactInfo: inserat.contactInfo || '',
    });
    setIsFormModalVisible(true);
  };

  const handleDeleteInserat = async (inserat) => {
    const currentUser = getCurrentUser();
    const isOwner = inserat.userId === currentUser?.uid;
    const canDelete = isOwner || isAdmin;

    if (!canDelete) {
      Alert.alert('Fehler', 'Du kannst nur deine eigenen Inserate löschen.');
      return;
    }

    Alert.alert(
      'Inserat löschen',
      isAdmin && !isOwner
        ? 'Möchtest du dieses Inserat als Admin wirklich löschen?'
        : 'Möchtest du dieses Inserat wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInserat(inserat.id);
              Alert.alert('Erfolg', 'Inserat wurde gelöscht.');
              if (isDetailModalVisible) {
                setIsDetailModalVisible(false);
              }
            } catch (error) {
              console.error('❌ Fehler beim Löschen:', error);
              Alert.alert('Fehler', 'Inserat konnte nicht gelöscht werden.');
            }
          },
        },
      ]
    );
  };

  const handlePickImages = async () => {
    try {
      const remainingSlots = 5 - formData.images.length;
      if (remainingSlots <= 0) {
        Alert.alert('Hinweis', 'Du kannst maximal 5 Bilder hochladen.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung erforderlich', 'Bitte erlauben Sie den Zugriff auf die Galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => asset.uri);
        const updatedImages = [...formData.images, ...newImages].slice(0, 5);
        setFormData({ ...formData, images: updatedImages });
      }
    } catch (error) {
      console.error('❌ Fehler bei der Bild-Auswahl:', error);
      Alert.alert('Fehler', 'Fehler beim Öffnen der Galerie.');
    }
  };

  const removeImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });
  };

  const handleSaveInserat = async () => {
    // Validierung
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.uid) {
      Alert.alert('Fehler', 'Bitte melden Sie sich an.');
      return;
    }

    try {
      setIsUploading(true);

      // Lade Bilder zu Firebase Storage hoch
      const uploadedImages = [];
      for (const imageUri of formData.images) {
        if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
          // Bereits hochgeladen
          uploadedImages.push(imageUri);
        } else {
          // Hochladen
          const downloadURL = await uploadImageToStorage(imageUri, 'inserate');
          uploadedImages.push(downloadURL);
        }
      }

      const inseratData = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        images: uploadedImages,
        userId: currentUser.uid,
        contactInfo: formData.contactInfo.trim() || null,
      };

      if (isEditing && editingInseratId) {
        await updateInserat(editingInseratId, inseratData);
        Alert.alert('Erfolg', 'Inserat wurde aktualisiert.');
      } else {
        await createInserat(inseratData);
        Alert.alert('Erfolg', 'Inserat wurde erstellt.');
      }

      setIsFormModalVisible(false);
      setFormData({
        type: 'suche',
        title: '',
        description: '',
        images: [],
        contactInfo: '',
      });
      setIsEditing(false);
      setEditingInseratId(null);
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      Alert.alert('Fehler', 'Inserat konnte nicht gespeichert werden.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderInseratCard = ({ item }) => {
    const currentUser = getCurrentUser();
    const isOwner = item.userId === currentUser?.uid;
    const canEdit = isOwner;
    const canDelete = isOwner || isAdmin;
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;

    return (
      <TouchableOpacity
        style={styles.inseratCard}
        onPress={() => handleInseratPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          {firstImage ? (
            <OptimizedImage
              source={{ uri: firstImage }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Text style={styles.cardImagePlaceholderText}>📋</Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View
                style={[
                  styles.typeBadge,
                  item.type === 'suche' ? styles.typeBadgeSuche : styles.typeBadgeBiete,
                ]}
              >
                <Text style={styles.typeBadgeText}>
                  {item.type === 'suche' ? 'Suche' : 'Biete'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
            {item.images && item.images.length > 1 && (
              <Text style={styles.cardImageCount}>
                📷 {item.images.length} Bilder
              </Text>
            )}
            {/* Bearbeiten/Löschen Buttons für Owner oder Admin */}
            {(canEdit || canDelete) && (
              <View style={styles.cardActions}>
                {canEdit && (
                  <TouchableOpacity
                    style={styles.cardActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditInserat(item);
                    }}
                  >
                    <Text style={styles.cardActionButtonText}>✏️ Bearbeiten</Text>
                  </TouchableOpacity>
                )}
                {canDelete && (
                  <TouchableOpacity
                    style={[styles.cardActionButton, styles.cardActionButtonDelete]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteInserat(item);
                    }}
                  >
                    <Text style={[styles.cardActionButtonText, styles.cardActionButtonTextDelete]}>
                      🗑️ Löschen
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* StatusBar-Ersatz für iPhone */}
      <View
        style={{
          height: Platform.OS === 'ios' ? 60 : 0,
          backgroundColor: '#2c2c2c',
          width: '100%',
        }}
      />

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
        {/* Logo-Header */}
        <View style={styles.logoHeaderContainer}>
          <View style={styles.headerLeftLogo}>
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

                  {/* Tagline unter dem Logo-Header */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
          </View>
          
{/* Header mit Überschrift */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => onNavigate('community')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting} adjustsFontSizeToFit={true} minimumFontScale={0.7} numberOfLines={1}>Schwarzes Brett</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'suche' && styles.tabActive]}
            onPress={() => handleTabChange('suche')}
          >
            <Text
              style={[styles.tabText, activeTab === 'suche' && styles.tabTextActive]}
            >
              Ich suche ...
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'biete' && styles.tabActive]}
            onPress={() => handleTabChange('biete')}
          >
            <Text
              style={[styles.tabText, activeTab === 'biete' && styles.tabTextActive]}
            >
              Ich biete ...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Suchfeld */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Inserate durchsuchen..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inserate-Liste */}
        <FlatList
          data={filteredInserate}
          renderItem={renderInseratCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Keine Inserate gefunden'
                  : `Noch keine Inserate im Bereich "${activeTab === 'suche' ? 'Ich suche' : 'Ich biete'}"`}
              </Text>
            </View>
          }
        />

        {/* FAB für neues Inserat */}
        <TouchableOpacity style={styles.fab} onPress={handleAddInserat}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadCount={unreadCount}
      />
      
      {/* ProVersion Button - links positioniert wegen FAB rechts */}
      <ProVersionButton
        onNavigate={onNavigate}
        isPro={isPro}
        isLoggedIn={isLoggedIn}
        positionLeft={true}
      />

      {/* Detail-Modal (Bottom Sheet) */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsDetailModalVisible(false)}
          />
          <View style={styles.modalBottomSheet}>
            <View style={styles.modalDragHandle} />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsDetailModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>

            {selectedInserat && (
              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Bild-Slider */}
                {selectedInserat.images && selectedInserat.images.length > 0 ? (
                  <View style={styles.imageSliderContainer}>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(event) => {
                        const index = Math.round(
                          event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                        );
                        setCurrentImageIndex(index);
                      }}
                      ref={(ref) => {
                        if (ref) {
                          ref.scrollTo({
                            x: currentImageIndex * SCREEN_WIDTH,
                            animated: false,
                          });
                        }
                      }}
                    >
                      {selectedInserat.images.map((imageUri, index) => (
                        <OptimizedImage
                          key={index}
                          source={{ uri: imageUri }}
                          style={styles.modalImage}
                          resizeMode="contain"
                        />
                      ))}
                    </ScrollView>
                    {selectedInserat.images.length > 1 && (
                      <View style={styles.imageIndicator}>
                        <Text style={styles.imageIndicatorText}>
                          {currentImageIndex + 1} / {selectedInserat.images.length}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Text style={styles.modalImagePlaceholderText}>📋</Text>
                  </View>
                )}

                {/* Inserat-Informationen */}
                <View style={styles.modalInfo}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedInserat.title}</Text>
                    <View
                      style={[
                        styles.typeBadge,
                        selectedInserat.type === 'suche'
                          ? styles.typeBadgeSuche
                          : styles.typeBadgeBiete,
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {selectedInserat.type === 'suche' ? 'Suche' : 'Biete'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.modalDescription}>
                    {selectedInserat.description}
                  </Text>

                  {selectedInserat.contactInfo && (
                    <View style={styles.contactInfoContainer}>
                      <Text style={styles.contactInfoLabel}>Kontakt:</Text>
                      <Text style={styles.contactInfoText}>
                        {selectedInserat.contactInfo}
                      </Text>
                    </View>
                  )}

                  {/* Bearbeiten/Löschen Buttons (für Owner oder Admin) */}
                  {(() => {
                    const currentUser = getCurrentUser();
                    const isOwner = currentUser?.uid === selectedInserat.userId;
                    const canEdit = isOwner;
                    const canDelete = isOwner || isAdmin;
                    
                    if (!canEdit && !canDelete) return null;
                    
                    return (
                      <View style={styles.modalActions}>
                        {canEdit && (
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                              setIsDetailModalVisible(false);
                              handleEditInserat(selectedInserat);
                            }}
                          >
                            <Text style={styles.actionButtonText}>✏️ Bearbeiten</Text>
                          </TouchableOpacity>
                        )}
                        {canDelete && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonDelete]}
                            onPress={() => handleDeleteInserat(selectedInserat)}
                          >
                            <Text
                              style={[
                                styles.actionButtonText,
                                styles.actionButtonTextDelete,
                              ]}
                            >
                              🗑️ Löschen
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })()}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Formular-Modal */}
      <Modal
        visible={isFormModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsFormModalVisible(false)}
          />
          <View style={styles.formModalBottomSheet}>
            <View style={styles.modalDragHandle} />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsFormModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              ref={formScrollViewRef}
              style={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <Text style={styles.formTitle}>
                {isEditing ? 'Inserat bearbeiten' : 'Neues Inserat erstellen'}
              </Text>

              {/* Typ-Auswahl */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Typ *</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      formData.type === 'suche' && styles.typeOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'suche' })}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        formData.type === 'suche' && styles.typeOptionTextActive,
                      ]}
                    >
                      Ich suche ...
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      formData.type === 'biete' && styles.typeOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'biete' })}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        formData.type === 'biete' && styles.typeOptionTextActive,
                      ]}
                    >
                      Ich biete ...
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Titel */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Titel *</Text>
                <TextInput
                  ref={titleInputRef}
                  style={styles.formInput}
                  placeholder="Titel des Inserats"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, title: text })
                  }
                  returnKeyType="next"
                  onSubmitEditing={() => descriptionInputRef.current?.focus()}
                />
              </View>

              {/* Beschreibung */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Beschreibung *</Text>
                <TextInput
                  ref={descriptionInputRef}
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Beschreibung des Inserats"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  multiline
                  numberOfLines={4}
                  returnKeyType="next"
                  onSubmitEditing={() => contactInfoInputRef.current?.focus()}
                />
              </View>

              {/* Kontaktinformationen */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Kontaktinformationen (optional)</Text>
                <TextInput
                  ref={contactInfoInputRef}
                  style={styles.formInput}
                  placeholder="E-Mail, Telefon, etc."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.contactInfo}
                  onChangeText={(text) =>
                    setFormData({ ...formData, contactInfo: text })
                  }
                  returnKeyType="done"
                />
              </View>

              {/* Bilder */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>
                  Bilder ({formData.images.length}/5)
                </Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={handlePickImages}
                  disabled={formData.images.length >= 5}
                >
                  <Text style={styles.imagePickerButtonText}>
                    📷 Bilder auswählen
                  </Text>
                </TouchableOpacity>

                {formData.images.length > 0 && (
                  <View style={styles.imagePreviewContainer}>
                    {formData.images.map((imageUri, index) => (
                      <View key={index} style={styles.imagePreview}>
                        <OptimizedImage
                          source={{ uri: imageUri }}
                          style={styles.imagePreviewImage}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={styles.imageRemoveButton}
                          onPress={() => removeImage(index)}
                        >
                          <Text style={styles.imageRemoveButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Speichern-Button */}
              <TouchableOpacity
                style={[styles.saveButton, isUploading && styles.saveButtonDisabled]}
                onPress={handleSaveInserat}
                disabled={isUploading}
              >
                <Text style={styles.saveButtonText}>
                  {isUploading
                    ? 'Wird gespeichert...'
                    : isEditing
                    ? 'Aktualisieren'
                    : 'Erstellen'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 10 : 40, // 10px für iOS, damit StatusBar nicht verdeckt wird
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
  },
  headerLeftLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
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
  wishlistHeart: {
    fontSize: 24,
    color: '#FFFFFF',
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
    width: 48,
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#DAA520',
    fontSize: 18,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#DAA520', // Gold
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabTextActive: {
    color: '#2c2c2c',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2c2c2c',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  inseratCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    flexDirection: 'row',
  },
  cardImage: {
    width: 100,
    height: 100,
    backgroundColor: '#3a3a3a',
  },
  cardImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: 40,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeSuche: {
    backgroundColor: '#4A90E2',
  },
  typeBadgeBiete: {
    backgroundColor: '#F5A623',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    lineHeight: 18,
  },
  cardImageCount: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cardActionButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardActionButtonDelete: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderColor: 'rgba(244, 67, 54, 0.4)',
  },
  cardActionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardActionButtonTextDelete: {
    color: '#F44336',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DAA520', // Gold
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#2c2c2c',
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: '#2c2c2c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalCloseButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  imageSliderContainer: {
    height: 300,
    marginBottom: 20,
    position: 'relative',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#3a3a3a',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalImagePlaceholder: {
    height: 200,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderRadius: 12,
  },
  modalImagePlaceholderText: {
    fontSize: 60,
  },
  modalInfo: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    marginBottom: 16,
  },
  contactInfoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  contactInfoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  contactInfoText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  actionButtonDelete: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextDelete: {
    color: '#F44336',
  },
  // Form Modal Styles
  formModalBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.9,
    backgroundColor: '#2c2c2c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
  },
  formContent: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    backgroundColor: '#DAA520', // Gold
    borderColor: '#DAA520',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typeOptionTextActive: {
    color: '#2c2c2c',
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  imagePickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreviewImage: {
    width: 80,
    height: 80,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#a9c7cd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2c2c',
  },
});

