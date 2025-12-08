import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform, StatusBar, TextInput, Modal, AppState } from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import { getCurrentUser } from '../services/testAuth';
import { 
  getUser, 
  updateUser, 
  deleteUserProfileImage, 
  validateProfileImage, 
  deleteImageFromStorage,
  uploadImageToStorage,
  getWineryByOwner, 
  createWinery, 
  updateWinery,
  getUserOrders,
  deleteOrder
} from '../services/database-web';
import { cacheProfileImage, getCachedProfileImage, clearCachedProfileImage } from '../services/profileImageCache';
import * as ImagePicker from 'expo-image-picker';

export default function ProfilScreen({ onNavigate, onLogout, isAdmin = false, isLoggedIn = false, unreadCount = 0, currentUser = null, isPro = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    street: '',
    zipCode: '',
    city: '',
    bio: '',
    profilePublic: false,
    newsletter: false,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isWineryModalVisible, setIsWineryModalVisible] = useState(false);
  const [wineryData, setWineryData] = useState(null);
  const [wineryFormData, setWineryFormData] = useState({
    name: '',
    description: '',
    region: '',
    address: '',
    website: '',
    contactEmail: '',
    phone: '',
    images: []
  });
  const [isUploadingWineryImages, setIsUploadingWineryImages] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user && user.uid) {
      loadOrders();
    }
  }, [user]);

  // Lade Bestellungen neu, wenn die App wieder aktiv wird (z.B. nach PayPal-Zahlung)
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App ist wieder aktiv geworden, lade Bestellungen neu
        if (user && user.uid) {
          console.log('🔄 App wieder aktiv, lade Bestellungen neu...');
          loadOrders();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [user]);

  useEffect(() => {
    if (user && user.isWinery && user.isWineryVerified) {
      loadWineryData();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) return;
      
      const userOrders = await getUserOrders(currentUser.uid);
      console.log('📦 Bestellungen geladen:', userOrders.length);
      userOrders.forEach(order => {
        console.log(`  - Bestellung ${order.id.substring(0, 8)}: Status = ${order.status || 'unbekannt'}`);
      });
      setOrders(userOrders);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Bestellungen:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unbekannt';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unbekannt';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'paid': return 'Bezahlt';
      case 'shipped': return 'Versendet';
      case 'delivered': return 'Geliefert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'paid': return '#4CAF50';
      case 'shipped': return '#2196F3';
      case 'delivered': return '#9C27B0';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        Alert.alert('Fehler', 'Kein eingeloggter User gefunden');
        return;
      }

      // Versuche zuerst aus Cache zu laden (für schnelleres Laden)
      let cachedImageUrl = await getCachedProfileImage(currentUser.uid);
      if (cachedImageUrl) {
        setProfileImage(cachedImageUrl);
      }

      const userData = await getUser(currentUser.uid);
      if (userData) {
        setUser(userData);
        
        // Wenn Firestore ein anderes Bild hat, aktualisiere Cache und State
        if (userData.profilbild) {
          if (userData.profilbild !== cachedImageUrl) {
            // Neues Bild in Firestore, aktualisiere Cache
            await cacheProfileImage(currentUser.uid, userData.profilbild);
            setProfileImage(userData.profilbild);
          } else {
            // Gleiches Bild, verwende gecachte URL
            setProfileImage(cachedImageUrl);
          }
        } else {
          // Kein Bild in Firestore, lösche Cache
          if (cachedImageUrl) {
            await clearCachedProfileImage(currentUser.uid);
          }
          setProfileImage(null);
        }
        
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          street: userData.street || '',
          zipCode: userData.zipCode || '',
          city: userData.city || '',
          bio: userData.bio || '',
          profilePublic: userData.profilePublic !== undefined ? userData.profilePublic : true,
          newsletter: userData.newsletter !== undefined ? userData.newsletter : false,
        });
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der User-Daten:', error);
      Alert.alert('Fehler', 'Profil-Daten konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        Alert.alert('Fehler', 'Kein eingeloggter User gefunden');
        return;
      }

      // Validierung (Benutzername wird nicht geprüft, da er nicht geändert werden kann)
      if (!formData.email || !formData.firstName || !formData.lastName) {
        Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus (E-Mail, Vorname, Nachname)');
        return;
      }

      // Upload Profilbild, falls ein neues ausgewählt wurde
      let profilbildUrl = profileImage;
      const oldProfileImageUrl = user?.profilbild; // Speichere URL des alten Bildes
      
      if (profileImage && (profileImage.startsWith('file://') || profileImage.startsWith('content://'))) {
        try {
          setIsUploadingImage(true);
          profilbildUrl = await uploadImageToStorage(profileImage, 'users');
          console.log('✅ Profilbild erfolgreich hochgeladen:', profilbildUrl);
          
          // Lösche das alte Profilbild aus Storage, falls vorhanden
          if (oldProfileImageUrl && oldProfileImageUrl !== profilbildUrl) {
            try {
              await deleteImageFromStorage(oldProfileImageUrl);
              console.log('✅ Altes Profilbild aus Storage gelöscht');
            } catch (error) {
              console.warn('⚠️ Fehler beim Löschen des alten Profilbildes (nicht kritisch):', error);
              // Fehler beim Löschen ist nicht kritisch, fahre fort
            }
          }
        } catch (error) {
          console.error('❌ Fehler beim Hochladen des Profilbildes:', error);
          Alert.alert('Fehler', 'Profilbild konnte nicht hochgeladen werden. Profil wird ohne Bild gespeichert.');
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Update User in Firestore (Benutzername wird nicht geändert, da er nur einmal gesetzt werden kann)
      await updateUser(currentUser.uid, {
        // username wird absichtlich nicht aktualisiert - kann nur bei der Registrierung gesetzt werden
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        street: formData.street,
        zipCode: formData.zipCode,
        city: formData.city,
        bio: formData.bio,
        profilePublic: formData.profilePublic,
        newsletter: formData.newsletter,
        profilbild: profilbildUrl,
        updatedAt: new Date(),
      });

      // Aktualisiere Cache mit neuem Profilbild
      if (profilbildUrl) {
        await cacheProfileImage(currentUser.uid, profilbildUrl);
      } else {
        await clearCachedProfileImage(currentUser.uid);
      }

      // Lade Daten neu
      await loadUserData();
      setIsEditing(false);
      Alert.alert('Erfolg', 'Profil erfolgreich aktualisiert!');
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden: ' + error.message);
    }
  };

  const handleCancel = () => {
    // Lade Daten neu, um Änderungen zu verwerfen
    loadUserData();
    setIsEditing(false);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async () => {
    try {
      // Berechtigungen anfordern
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung erforderlich', 'Bitte erlauben Sie den Zugriff auf Ihre Fotos.');
        return;
      }

      // Bild auswählen mit verbesserter Komprimierung und Cropping
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Cropping aktiviert
        aspect: [1, 1], // Quadratisches Format
        quality: 0.7, // Reduzierte Qualität für bessere Komprimierung (0.7 statt 0.8)
        exif: false, // EXIF-Daten entfernen für kleinere Dateigröße
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Validierung des ausgewählten Bildes
        const validation = await validateProfileImage(
          selectedImage.uri,
          selectedImage.fileSize || null,
          selectedImage.mimeType || null
        );
        
        if (!validation.valid) {
          Alert.alert('Ungültiges Bild', validation.error || 'Das Bild konnte nicht validiert werden.');
          return;
        }
        
        // Bild ist gültig, setze es
        setProfileImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('❌ Fehler beim Auswählen des Bildes:', error);
      Alert.alert('Fehler', 'Bild konnte nicht ausgewählt werden.');
    }
  };

  const handleDeleteProfileImage = async () => {
    try {
      // Bestätigungsdialog
      Alert.alert(
        'Profilbild löschen',
        'Möchten Sie Ihr Profilbild wirklich löschen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Löschen',
            style: 'destructive',
            onPress: async () => {
              try {
                const currentUser = getCurrentUser();
                if (!currentUser || !currentUser.uid) {
                  Alert.alert('Fehler', 'Kein eingeloggter User gefunden');
                  return;
                }

                // Lösche Profilbild
                await deleteUserProfileImage(currentUser.uid);
                
                // Lösche Cache
                await clearCachedProfileImage(currentUser.uid);
                
                // Aktualisiere lokalen State
                setProfileImage(null);
                
                // Lade Daten neu
                await loadUserData();
                
                Alert.alert('Erfolg', 'Profilbild wurde erfolgreich gelöscht.');
              } catch (error) {
                console.error('❌ Fehler beim Löschen des Profilbildes:', error);
                Alert.alert('Fehler', 'Profilbild konnte nicht gelöscht werden: ' + error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Profilbildes:', error);
      Alert.alert('Fehler', 'Profilbild konnte nicht gelöscht werden.');
    }
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase();
    } else if (formData.username) {
      return formData.username.substring(0, 2).toUpperCase();
    } else if (formData.email) {
      return formData.email.substring(0, 2).toUpperCase();
    }
    return 'P';
  };

  const loadWineryData = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) return;
      
      const winery = await getWineryByOwner(currentUser.uid);
      if (winery) {
        setWineryData(winery);
        setWineryFormData({
          name: winery.name || '',
          description: winery.description || '',
          region: winery.region || '',
          address: winery.address || '',
          website: winery.website || '',
          contactEmail: winery.contactEmail || '',
          phone: winery.phone || '',
          images: winery.images || []
        });
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Weingut-Daten:', error);
    }
  };

  const handleOpenWineryModal = () => {
    // Prüfe, ob User als Weingut verifiziert ist
    if (!user || !user.isWineryVerified) {
      Alert.alert('Nicht verifiziert', 'Sie müssen als Weingut verifiziert sein, um ein Weingut-Profil zu erstellen.');
      return;
    }
    setIsWineryModalVisible(true);
  };

  const handleCloseWineryModal = () => {
    setIsWineryModalVisible(false);
  };

  const handleSaveWinery = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        Alert.alert('Fehler', 'Kein eingeloggter User gefunden');
        return;
      }

      // Prüfe, ob User als Weingut verifiziert ist
      if (!user || !user.isWineryVerified) {
        Alert.alert('Fehler', 'Sie müssen als Weingut verifiziert sein, um ein Weingut-Profil zu erstellen.');
        return;
      }

      if (!wineryFormData.name || !wineryFormData.name.trim()) {
        Alert.alert('Fehler', 'Bitte geben Sie einen Namen für das Weingut ein');
        return;
      }

      // Upload Bilder, falls neue hinzugefügt wurden
      let uploadedImages = [...wineryFormData.images];
      const imagesToUpload = wineryFormData.images.filter(img => 
        img.startsWith('file://') || img.startsWith('content://')
      );

      if (imagesToUpload.length > 0) {
        setIsUploadingWineryImages(true);
        try {
          const uploadPromises = imagesToUpload.map(uri => 
            uploadImageToStorage(uri, 'wineries')
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          
          // Ersetze lokale URIs durch hochgeladene URLs
          uploadedImages = wineryFormData.images.map(img => {
            const index = imagesToUpload.indexOf(img);
            return index !== -1 ? uploadedUrls[index] : img;
          });
        } catch (error) {
          console.error('❌ Fehler beim Hochladen der Bilder:', error);
          Alert.alert('Fehler', 'Bilder konnten nicht hochgeladen werden');
          setIsUploadingWineryImages(false);
          return;
        } finally {
          setIsUploadingWineryImages(false);
        }
      }

      const wineryDataToSave = {
        ...wineryFormData,
        images: uploadedImages,
        ownerId: currentUser.uid,
        // Wenn User als Weingut verifiziert ist, setze isVerified auf true
        isVerified: user.isWineryVerified === true
      };

      if (wineryData) {
        // Update bestehendes Weingut
        await updateWinery(wineryData.id, wineryDataToSave);
        Alert.alert('Erfolg', 'Weingut-Profil wurde erfolgreich aktualisiert');
      } else {
        // Erstelle neues Weingut
        // Wenn User verifiziert ist, setze isVerified direkt auf true, sonst false
        const wineryToCreate = {
          ...wineryDataToSave,
          isVerified: user.isWineryVerified === true
        };
        await createWinery(wineryToCreate);
        if (user.isWineryVerified) {
          Alert.alert('Erfolg', 'Weingut-Profil wurde erfolgreich erstellt und ist verifiziert.');
        } else {
          Alert.alert('Erfolg', 'Weingut-Profil wurde erfolgreich erstellt. Es muss von einem Admin verifiziert werden.');
        }
      }

      await loadWineryData();
      setIsWineryModalVisible(false);
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Weingut-Profils:', error);
      Alert.alert('Fehler', 'Weingut-Profil konnte nicht gespeichert werden: ' + error.message);
    }
  };

  const handlePickWineryImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung erforderlich', 'Wir benötigen Zugriff auf deine Galerie.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const currentImages = wineryFormData.images || [];
        const newImages = result.assets.map(asset => asset.uri);
        const totalImages = currentImages.length + newImages.length;

        if (totalImages > 5) {
          Alert.alert('Fehler', 'Sie können maximal 5 Bilder hochladen');
          return;
        }

        setWineryFormData({
          ...wineryFormData,
          images: [...currentImages, ...newImages]
        });
      }
    } catch (error) {
      console.error('❌ Fehler beim Auswählen der Bilder:', error);
      Alert.alert('Fehler', 'Bilder konnten nicht ausgewählt werden');
    }
  };

  const handleRemoveWineryImage = (index) => {
    const newImages = [...wineryFormData.images];
    newImages.splice(index, 1);
    setWineryFormData({
      ...wineryFormData,
      images: newImages
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Abmelden', onPress: onLogout },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Lade Profil...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Kein Profil gefunden</Text>
        </View>
      </View>
    );
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username || user.email || 'Unbekannt';
  const displayLocation = user.city 
    ? `${user.zipCode ? user.zipCode + ' ' : ''}${user.city}`
    : 'Keine Adresse angegeben';

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        width: '100%',
      }} />
      <View style={styles.container}>
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={isAdmin} 
          unreadCount={0}
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
        
        {/* Profil-Icon und Aktionen rechts */}
          <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.profileIconContainer}
            onPress={() => onNavigate('profil')}
          >
            {user?.profilbild ? (
              <OptimizedImage
                source={{ uri: user.profilbild }}
                style={styles.profileIconImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileIconCircle}>
                <Text style={styles.profileIconText}>
                  {getInitials()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.profileActions}>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.profileActionButton}>
                <Text style={styles.editButton}>✏️</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>❌</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>✅</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
              <Text style={styles.greeting}>Profil</Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.profileCard}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={isEditing ? handlePickImage : undefined}
              disabled={!isEditing}
            >
              {profileImage ? (
                <OptimizedImage
                  source={{ uri: profileImage }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                </View>
              )}
              {isEditing && (
                <View style={styles.avatarEditOverlay}>
                  <Text style={styles.avatarEditText}>📷</Text>
                </View>
              )}
            </TouchableOpacity>
            {isEditing && (
              <>
                <Text style={styles.avatarHint}>
                  📷 Tippen Sie auf das Profilbild, um es zu ändern{'\n'}
                  ✂️ Sie können das Bild zuschneiden und anpassen
                </Text>
                {profileImage && (
                  <TouchableOpacity 
                    style={styles.deleteImageButton}
                    onPress={handleDeleteProfileImage}
                  >
                    <Text style={styles.deleteImageButtonText}>🗑️ Profilbild löschen</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            {isEditing ? (
              <>
                <Text style={styles.inputLabel}>Benutzername (kann nicht geändert werden)</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  placeholder="Benutzername"
                  value={formData.username}
                  editable={false}
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-Mail *"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            ) : (
              <>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.userEmail}>{user.email || 'Keine E-Mail'}</Text>
                <Text style={styles.userUsername}>@{user.username || 'unbekannt'}</Text>
              </>
            )}
            
            {user.isAdmin && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>👑 Admin</Text>
              </View>
            )}
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user.createdAt ? new Date(user.createdAt.seconds * 1000).getFullYear() : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Mitglied seit</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>-</Text>
              <Text style={styles.statLabel}>Weine</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Persönliche Daten</Text>
            
            {isEditing ? (
              <>
                <Text style={styles.inputLabel}>E-Mail-Adresse *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="E-Mail-Adresse"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <Text style={styles.inputLabel}>Vorname *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vorname"
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', value)}
                />
                
                <Text style={styles.inputLabel}>Nachname *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nachname"
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                />
                
                <Text style={styles.inputLabel}>Straße</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Straße"
                  value={formData.street}
                  onChangeText={(value) => updateFormData('street', value)}
                />
                
                <Text style={styles.inputLabel}>PLZ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="PLZ"
                  value={formData.zipCode}
                  onChangeText={(value) => updateFormData('zipCode', value)}
                  keyboardType="numeric"
                />
                
                <Text style={styles.inputLabel}>Stadt</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Stadt"
                  value={formData.city}
                  onChangeText={(value) => updateFormData('city', value)}
                />
                
                <Text style={styles.inputLabel}>Über mich</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Beschreibung"
                  value={formData.bio}
                  onChangeText={(value) => updateFormData('bio', value)}
                  multiline
                  numberOfLines={4}
                />
              </>
            ) : (
              <>
                <Text style={styles.infoText}>Benutzername: @{user.username || 'unbekannt'}</Text>
                <Text style={styles.infoText}>E-Mail: {user.email || 'Keine E-Mail'}</Text>
                <Text style={styles.infoText}>Name: {displayName}</Text>
                {(user.street || user.city) && (
                  <Text style={styles.infoText}>Adresse: {user.street || ''} {user.zipCode || ''} {user.city || ''}</Text>
                )}
                {user.bio && (
                  <Text style={styles.bio}>{user.bio}</Text>
                )}
                <Text style={styles.location}>📍 {displayLocation}</Text>
              </>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Einstellungen</Text>
            
            {isEditing ? (
              <>
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => updateFormData('profilePublic', !formData.profilePublic)}
                >
                  <Text style={styles.checkboxLabel}>Profil öffentlich</Text>
                  <Text style={styles.checkbox}>{formData.profilePublic ? '✅' : '☐'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => updateFormData('newsletter', !formData.newsletter)}
                >
                  <Text style={styles.checkboxLabel}>Newsletter abonnieren</Text>
                  <Text style={styles.checkbox}>{formData.newsletter ? '✅' : '☐'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.infoText}>
                  Profil öffentlich: {user.profilePublic ? 'Ja' : 'Nein'}
                </Text>
                <Text style={styles.infoText}>
                  Newsletter: {user.newsletter ? 'Abonniert' : 'Nicht abonniert'}
                </Text>
              </>
            )}
          </View>

          {/* Weingut-Profil Info (nur wenn isWinery: true, aber noch nicht verifiziert) */}
          {user.isWinery && !user.isWineryVerified && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>🏰 Weingut-Profil</Text>
              <Text style={styles.infoText}>
                ⏳ Ihr Weingut-Account wartet auf Verifizierung durch einen Administrator. 
                Sobald Sie verifiziert wurden, können Sie hier Ihr Weingut-Profil erstellen.
              </Text>
            </View>
          )}
          
          {/* Weingut-Profil Button (nur wenn isWinery: true und verifiziert) */}
          {user.isWinery && user.isWineryVerified && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>🏰 Weingut-Profil</Text>
              <Text style={styles.infoText}>
                {wineryData 
                  ? wineryData.isVerified 
                    ? '✅ Verifiziert' 
                    : '⏳ Wartet auf Verifizierung'
                  : 'Noch nicht erstellt'}
              </Text>
              <TouchableOpacity 
                style={styles.wineryButton}
                onPress={handleOpenWineryModal}
              >
                <Text style={styles.wineryButtonText}>
                  {wineryData ? '✏️ Weingut-Profil bearbeiten' : '➕ Weingut-Profil erstellen'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bestellhistorie */}
          {!isEditing && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>🛍️ Meine Bestellungen</Text>
              {isLoadingOrders ? (
                <Text style={styles.infoText}>Lade Bestellungen...</Text>
              ) : orders.length === 0 ? (
                <Text style={styles.infoText}>Noch keine Bestellungen</Text>
              ) : (
                <>
                  {orders.slice(0, 5).map((order) => (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.orderItem}
                      onPress={() => {
                        setSelectedOrder(order);
                        setIsOrderModalVisible(true);
                      }}
                    >
                      <View style={styles.orderItemHeader}>
                        <Text style={styles.orderItemId}>Bestellung #{order.id.substring(0, 8)}</Text>
                        <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                          <Text style={styles.orderStatusBadgeText}>{getStatusLabel(order.status)}</Text>
                        </View>
                      </View>
                      <Text style={styles.orderItemDate}>{formatDate(order.createdAt)}</Text>
                      <Text style={styles.orderItemTotal}>{order.total?.toFixed(2) || 0} €</Text>
                    </TouchableOpacity>
                  ))}
                  {orders.length > 5 && (
                    <Text style={styles.orderMoreText}>
                      ... und {orders.length - 5} weitere Bestellungen
                    </Text>
                  )}
                </>
              )}
            </View>
          )}

          {!isEditing && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Abmelden</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        </View>
        <Footer />
      </View>

      {/* Bestell-Detail-Modal */}
      <Modal
        visible={isOrderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Bestellung #{selectedOrder?.id?.substring(0, 8)}
              </Text>
              <TouchableOpacity onPress={() => setIsOrderModalVisible(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedOrder && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Status</Text>
                  <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                    <Text style={styles.orderStatusBadgeText}>{getStatusLabel(selectedOrder.status)}</Text>
                  </View>
                </View>
                
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Bestelldatum</Text>
                  <Text style={styles.orderDetailText}>{formatDate(selectedOrder.createdAt)}</Text>
                </View>
                
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Artikel</Text>
                  {selectedOrder.items?.map((item, index) => (
                    <View key={index} style={styles.orderItemDetail}>
                      <Text style={styles.orderItemDetailName}>
                        {item.name} {item.variantName ? `(${item.variantName})` : ''}
                      </Text>
                      <Text style={styles.orderItemDetailQuantity}>Menge: {item.quantity}</Text>
                      <Text style={styles.orderItemDetailPrice}>
                        {item.priceGross?.toFixed(2) || (item.price * 1.19).toFixed(2)} €
                      </Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Preisübersicht</Text>
                  <View style={styles.orderPriceRow}>
                    <Text style={styles.orderPriceLabel}>Zwischensumme (netto):</Text>
                    <Text style={styles.orderPriceValue}>{selectedOrder.subtotal?.toFixed(2) || 0} €</Text>
                  </View>
                  <View style={styles.orderPriceRow}>
                    <Text style={styles.orderPriceLabel}>MwSt. (19%):</Text>
                    <Text style={styles.orderPriceValue}>{selectedOrder.tax?.toFixed(2) || 0} €</Text>
                  </View>
                  <View style={styles.orderPriceRow}>
                    <Text style={styles.orderPriceLabel}>Versandkosten:</Text>
                    <Text style={styles.orderPriceValue}>
                      {selectedOrder.shippingCostFree ? '0,00 € (versandkostenfrei)' : `${selectedOrder.shippingCost?.toFixed(2) || 0} €`}
                    </Text>
                  </View>
                  <View style={[styles.orderPriceRow, styles.orderTotalRow]}>
                    <Text style={styles.orderTotalLabel}>Gesamt:</Text>
                    <Text style={styles.orderTotalValue}>{selectedOrder.total?.toFixed(2) || 0} €</Text>
                  </View>
                </View>
                
                {selectedOrder.shippingAddress && (
                  <View style={styles.orderDetailSection}>
                    <Text style={styles.orderDetailLabel}>Lieferadresse</Text>
                    <Text style={styles.orderDetailText}>
                      {selectedOrder.shippingAddress.street}{'\n'}
                      {selectedOrder.shippingAddress.zipCode} {selectedOrder.shippingAddress.city}{'\n'}
                      {selectedOrder.shippingAddress.country}
                    </Text>
                  </View>
                )}
                
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailLabel}>Zahlungsmethode</Text>
                  <Text style={styles.orderDetailText}>{selectedOrder.paymentMethod || 'PayPal'}</Text>
                  {selectedOrder.paymentId && (
                    <Text style={styles.orderDetailTextSmall}>
                      Transaction ID: {selectedOrder.paymentId}
                    </Text>
                  )}
                </View>
              </ScrollView>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={async () => {
                  if (!selectedOrder) return;
                  
                  Alert.alert(
                    'Bestellung löschen',
                    'Möchten Sie diese Bestellung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
                    [
                      { text: 'Abbrechen', style: 'cancel' },
                      {
                        text: 'Löschen',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const currentUser = getCurrentUser();
                            if (!currentUser || !currentUser.uid) {
                              Alert.alert('Fehler', 'Kein eingeloggter User gefunden');
                              return;
                            }
                            
                            await deleteOrder(selectedOrder.id, currentUser.uid);
                            setIsOrderModalVisible(false);
                            setSelectedOrder(null);
                            await loadOrders();
                            Alert.alert('Erfolg', 'Bestellung wurde erfolgreich gelöscht');
                          } catch (error) {
                            console.error('❌ Fehler beim Löschen der Bestellung:', error);
                            Alert.alert('Fehler', `Bestellung konnte nicht gelöscht werden: ${error.message}`);
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.modalButtonTextDanger}>🗑️ Bestellung löschen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weingut-Profil Modal */}
      <Modal
        visible={isWineryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseWineryModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {wineryData ? 'Weingut-Profil bearbeiten' : 'Weingut-Profil erstellen'}
              </Text>
              <TouchableOpacity onPress={handleCloseWineryModal}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Name des Weinguts *</Text>
              <TextInput
                style={styles.input}
                placeholder="z.B. Weingut Müller"
                value={wineryFormData.name}
                onChangeText={(value) => setWineryFormData({ ...wineryFormData, name: value })}
              />

              <Text style={styles.inputLabel}>Beschreibung</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Beschreiben Sie Ihr Weingut..."
                value={wineryFormData.description}
                onChangeText={(value) => setWineryFormData({ ...wineryFormData, description: value })}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Region</Text>
              <TextInput
                style={styles.input}
                placeholder="z.B. Mosel, Rheingau"
                value={wineryFormData.region}
                onChangeText={(value) => setWineryFormData({ ...wineryFormData, region: value })}
              />

              <Text style={styles.inputLabel}>Adresse</Text>
              <TextInput
                style={styles.input}
                placeholder="Straße, PLZ Ort"
                value={wineryFormData.address}
                onChangeText={(value) => setWineryFormData({ ...wineryFormData, address: value })}
              />

              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.input}
                placeholder="https://www.example.com"
                value={wineryFormData.website}
                onChangeText={(value) => setWineryFormData({ ...wineryFormData, website: value })}
                keyboardType="url"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Kontakt-E-Mail</Text>
              <TextInput
                style={styles.input}
                placeholder="kontakt@weingut.de"
                value={wineryFormData.contactEmail}
                onChangeText={(value) => setWineryFormData({ ...wineryFormData, contactEmail: value })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                placeholder="+49 123 456789"
                value={wineryFormData.phone}
                onChangeText={(value) => setWineryFormData({ ...wineryFormData, phone: value })}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Bilder (max. 5)</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handlePickWineryImages}
                disabled={wineryFormData.images.length >= 5 || isUploadingWineryImages}
              >
                <Text style={styles.imagePickerButtonText}>
                  📷 Bilder auswählen ({wineryFormData.images.length}/5)
                </Text>
              </TouchableOpacity>

              {wineryFormData.images.length > 0 && (
                <View style={styles.imagesPreview}>
                  {wineryFormData.images.map((image, index) => (
                    <View key={index} style={styles.imagePreviewItem}>
                      <OptimizedImage
                        source={{ uri: image }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveWineryImage(index)}
                      >
                        <Text style={styles.removeImageButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {isUploadingWineryImages && (
                <Text style={styles.uploadingText}>⏳ Bilder werden hochgeladen...</Text>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleCloseWineryModal}
              >
                <Text style={styles.modalButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveWinery}
                disabled={isUploadingWineryImages}
              >
                <Text style={styles.modalButtonText}>
                  {isUploadingWineryImages ? '⏳ Speichern...' : '💾 Speichern'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  outerContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
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
  profileSection: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 25,
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
  wishlistHeart: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileActions: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActionButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 80,
    alignItems: 'flex-end',
  },
  greetingContainer: {
    // Hintergrund und Border entfernt für elegantes Design
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  editButton: {
    fontSize: 24,
    padding: 5,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    fontSize: 20,
  },
  saveButton: {
    padding: 5,
  },
  saveButtonText: {
    fontSize: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF', // Weiße Border
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#a9c7cd',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarEditText: {
    fontSize: 14,
  },
  avatarHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  userUsername: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  badge: {
    backgroundColor: '#D2691E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 10,
  },
  location: {
    fontSize: 14,
    color: '#888',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  disabledInput: {
    backgroundColor: '#E0E0E0',
    color: '#999',
    borderColor: '#CCC',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#666',
  },
  checkbox: {
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteImageButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteImageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  wineryButton: {
    backgroundColor: '#a9c7cd',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  wineryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    maxHeight: 500,
    padding: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePickerButtonText: {
    color: '#2c2c2c',
    fontSize: 14,
    fontWeight: '600',
  },
  imagesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imagePreviewItem: {
    width: 100,
    height: 100,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  modalButtonSecondary: {
    backgroundColor: '#e0e0e0',
  },
  modalButtonPrimary: {
    backgroundColor: '#a9c7cd',
  },
  modalButtonDanger: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#2c2c2c',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextDanger: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  orderItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderItemId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  orderItemDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a9c7cd',
  },
  orderMoreText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  orderDetailSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderDetailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  orderDetailTextSmall: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  orderItemDetail: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  orderItemDetailName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  orderItemDetailQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  orderItemDetailPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#a9c7cd',
  },
  orderPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderPriceValue: {
    fontSize: 14,
    color: '#2c2c2c',
    fontWeight: '500',
  },
  orderTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#a9c7cd',
    paddingTop: 12,
    marginTop: 12,
  },
  orderTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a9c7cd',
  },
});
