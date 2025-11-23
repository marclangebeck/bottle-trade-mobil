import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, ScrollView, Platform, ImageBackground, Modal } from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import Footer from './Footer';
import * as ImagePicker from 'expo-image-picker';
import { addWine } from './services/database-web';
import { getCurrentUser } from './services/testAuth';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import { getAllWinesByOwner } from './services/database-web';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WeinregalBefuellenScreen({ onNavigate, onLogout, unreadNotifications = 0, unreadHints = 0, isAdmin = false, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [previousWines, setPreviousWines] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isLoadingWines, setIsLoadingWines] = useState(false);
  const [btp, setBtp] = useState(0);
  const [formData, setFormData] = useState({
    wineName: '',
    winery: '',
    website: '',
    vintage: '',
    region: '',
    grapeVariety: '',
    tasteProfile: '',
    price: '',
    description: '',
    labelImage: null,
  });

  // Lade bereits eingestellte Weine beim Öffnen des Screens
  useEffect(() => {
    loadPreviousWines();
  }, []);

  const loadPreviousWines = async () => {
    try {
      setIsLoadingWines(true);
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        setIsLoadingWines(false);
        setBtp(0);
        return;
      }
      setBtp(currentUser?.btp ?? 0);

      // WICHTIG: Lade Weine aus der Historie (AsyncStorage), nicht aus dem aktuellen Weinregal
      // Die Historie enthält alle Weine, die jemals eingestellt wurden, auch wenn sie gelöscht wurden
      const historyKey = `wine-history-${currentUser.uid}`;
      const savedHistory = await AsyncStorage.getItem(historyKey);
      let wineHistory = savedHistory ? JSON.parse(savedHistory) : [];
      
      // Falls keine Historie existiert, lade aus dem aktuellen Weinregal und erstelle Historie
      if (wineHistory.length === 0) {
        const wines = await getAllWinesByOwner(currentUser.uid);
        wineHistory = wines;
        // Speichere als Historie
        await AsyncStorage.setItem(historyKey, JSON.stringify(wineHistory));
      }
      
      // Sortiere nach Name und entferne Duplikate basierend auf Name + Weingut + Jahrgang
      const uniqueWines = wineHistory.reduce((acc, wine) => {
        const key = `${wine.name || ''}_${wine.winery || ''}_${wine.vintage || ''}`;
        if (!acc.find(w => `${w.name || ''}_${w.winery || ''}_${w.vintage || ''}` === key)) {
          acc.push(wine);
        }
        return acc;
      }, []);
      
      // Sortiere nach Name
      uniqueWines.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setPreviousWines(uniqueWines);
      console.log('✅ Vorherige Weine aus Historie geladen:', uniqueWines.length);
    } catch (error) {
      console.error('❌ Fehler beim Laden der vorherigen Weine:', error);
    } finally {
      setIsLoadingWines(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleNavigation = (screen) => {
    setIsMenuVisible(false);
    onNavigate(screen);
  };

  const handleSelectPreviousWine = (wine) => {
    // Fülle das Formular mit den Daten des ausgewählten Weins
    setFormData({
      wineName: wine.name || '',
      winery: wine.winery || '',
      website: wine.website || '',
      vintage: wine.vintage ? String(wine.vintage) : '',
      region: wine.region || '',
      grapeVariety: wine.grapeVariety || '',
      tasteProfile: wine.tasteProfile || '',
      price: wine.price ? String(wine.price) : '',
      description: wine.description || '',
      labelImage: wine.labelImage || null,
    });
    setDropdownVisible(false);
  };

  const handleClearWineHistory = () => {
    Alert.alert(
      'Historie löschen',
      'Möchten Sie wirklich alle gespeicherten Weine aus der Historie löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
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

              const historyKey = `wine-history-${currentUser.uid}`;
              await AsyncStorage.removeItem(historyKey);
              
              // Leere auch den State
              setPreviousWines([]);
              setDropdownVisible(false);
              
              Alert.alert('Erfolg', 'Wein-Historie wurde erfolgreich gelöscht.');
              console.log('✅ Wein-Historie gelöscht');
            } catch (error) {
              console.error('❌ Fehler beim Löschen der Wein-Historie:', error);
              Alert.alert('Fehler', 'Historie konnte nicht gelöscht werden.');
            }
          },
        },
      ]
    );
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      console.log('🖼️ Bild-Auswahl gestartet');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung erforderlich', 'Bitte erlauben Sie den Zugriff auf die Galerie');
        return;
      }

      console.log('📸 Öffne Bild-Auswahl...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('✅ Bild ausgewählt:', result.assets[0].uri);
        updateFormData('labelImage', result.assets[0].uri);
      } else {
        console.log('ℹ️ Bild-Auswahl abgebrochen');
      }
    } catch (error) {
      console.error('❌ Fehler bei der Bild-Auswahl:', error);
      Alert.alert('Fehler', 'Fehler beim Öffnen der Galerie. Bitte versuchen Sie es erneut.');
    }
  };

  const handleSave = async () => {
    const { wineName, winery, vintage, region, grapeVariety, price, description, labelImage } = formData;
    
    if (!wineName || !winery || !vintage || !region || !grapeVariety) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    // User-ID und Name aus der Authentication holen
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid || 'test-456'; // Fallback für Test
    const currentUserName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Max Mustermann';
    
    console.log('🔍 WeinregalBefuellenScreen: User-ID:', currentUserId, 'für', currentUser?.email || 'Unbekannt');

    // Wein zu Firestore hinzufügen
    try {
      const newWine = await addWine({
        name: wineName,
        winery: winery,
        vintage: parseInt(vintage),
        region: region,
        grapeVariety: grapeVariety,
        price: price ? parseFloat(price.replace(',', '.')) : null,
        description: description || '',
        labelImage: labelImage,
        ownerId: currentUserId,
        owner: currentUserName, // Besitzer-Name hinzufügen
        status: 'private', // Standard: privat
        availableForTrade: false
      });

      console.log('✅ Wein erfolgreich hinzugefügt:', newWine);
      
      // WICHTIG: Füge Wein zur Historie hinzu (unabhängig vom aktuellen Weinregal)
      // Die Historie bleibt bestehen, auch wenn der Wein später gelöscht wird
      try {
        if (currentUserId) {
          const historyKey = `wine-history-${currentUserId}`;
          const savedHistory = await AsyncStorage.getItem(historyKey);
          let wineHistory = savedHistory ? JSON.parse(savedHistory) : [];
          
          // Prüfe ob Wein bereits in Historie existiert (basierend auf Name + Weingut + Jahrgang)
          const key = `${wineName}_${winery}_${vintage}`;
          const exists = wineHistory.find(w => `${w.name || ''}_${w.winery || ''}_${w.vintage || ''}` === key);
          
          if (!exists) {
            // Füge neuen Wein zur Historie hinzu
            wineHistory.push({
              name: wineName,
              winery: winery,
              website: formData.website || '',
              vintage: vintage ? parseInt(vintage) : null,
              region: region,
              grapeVariety: grapeVariety,
              tasteProfile: formData.tasteProfile || '',
              price: price ? parseFloat(price.replace(',', '.')) : null,
              description: description || '',
              labelImage: labelImage || null,
              createdAt: new Date().toISOString(),
            });
            
            await AsyncStorage.setItem(historyKey, JSON.stringify(wineHistory));
            console.log('✅ Wein zur Historie hinzugefügt');
            
            // Aktualisiere auch die Anzeige im Dropdown
            setPreviousWines(prev => {
              const updated = [...prev, {
                name: wineName,
                winery: winery,
                website: formData.website || '',
                vintage: vintage ? parseInt(vintage) : null,
                region: region,
                grapeVariety: grapeVariety,
                tasteProfile: formData.tasteProfile || '',
                price: price ? parseFloat(price.replace(',', '.')) : null,
                description: description || '',
                labelImage: labelImage || null,
              }];
              // Sortiere nach Name
              updated.sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
              });
              return updated;
            });
          }
        }
      } catch (historyError) {
        console.error('❌ Fehler beim Speichern in Historie:', historyError);
        // Fehler beim Speichern der Historie sollte den Hauptprozess nicht blockieren
      }
      
      // Formular zurücksetzen
      setFormData({
        wineName: '',
        winery: '',
        website: '',
        vintage: '',
        region: '',
        grapeVariety: '',
        tasteProfile: '',
        price: '',
        description: '',
        labelImage: null,
      });
      
      // Direkt zu Mein Weinregal navigieren
      onNavigate('mein-weinregal');
      
      Alert.alert('Erfolg', 'Wein erfolgreich zum Weinregal hinzugefügt!');
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen des Weins:', error);
      Alert.alert('Fehler', 'Wein konnte nicht hinzugefügt werden. Bitte versuchen Sie es erneut.');
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
      <View style={styles.container}>
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
                <Text style={styles.profileBtpText}>{`${btp ?? 0} BTP`}</Text>
              </View>
            </View>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Weinregal befüllen</Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.dashboardContainer}>
              <Text style={styles.dashboardSubtitle}>Machen Sie bitte Angaben zu dem Wein, den Sie tauschen möchten.</Text>

              {/* Dropdown für vorherige Weine */}
              {previousWines.length > 0 && (
                <View style={styles.dropdownContainer}>
                  <View style={styles.dropdownHeader}>
                    <TouchableOpacity 
                      style={[styles.dropdownButton, dropdownVisible && styles.dropdownButtonOpen]}
                      onPress={() => setDropdownVisible(!dropdownVisible)}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {dropdownVisible ? '▼' : '▶'} Vorherige Weine auswählen ({previousWines.length})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.clearButton}
                      onPress={handleClearWineHistory}
                    >
                      <Text style={styles.clearButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {dropdownVisible && (
                    <ScrollView 
                      style={styles.dropdownList}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {previousWines.map((item, index) => (
                        <TouchableOpacity
                          key={item.id || `wine-${index}`}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectPreviousWine(item)}
                        >
                          <Text style={styles.dropdownItemText}>
                            {item.name || 'Unbekannter Wein'}
                            {item.winery ? ` - ${item.winery}` : ''}
                            {item.vintage ? ` (${item.vintage})` : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              <View style={styles.formContainer}>
                {/* Grunddaten */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Grunddaten</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name des Weines *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.wineName}
                      onChangeText={(text) => updateFormData('wineName', text)}
                      placeholder="z.B. Riesling Spätlese"
                      placeholderTextColor="#999999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Weingut *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.winery}
                      onChangeText={(text) => updateFormData('winery', text)}
                      placeholder="z.B. Weingut Müller"
                      placeholderTextColor="#999999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Website des Weingutes</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.website}
                      onChangeText={(text) => updateFormData('website', text)}
                      placeholder="z.B. www.weingut-mueller.de"
                      placeholderTextColor="#999999"
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Wein-Details */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Wein-Details</Text>
                  
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.label}>Jahrgang *</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.vintage}
                        onChangeText={(text) => updateFormData('vintage', text)}
                        placeholder="2020"
                        placeholderTextColor="#999999"
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <View style={[styles.inputGroup, { flex: 2 }]}>
                      <Text style={styles.label}>Anbauregion *</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.region}
                        onChangeText={(text) => updateFormData('region', text)}
                        placeholder="z.B. Mosel"
                        placeholderTextColor="#999999"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Rebsorte *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.grapeVariety}
                      onChangeText={(text) => updateFormData('grapeVariety', text)}
                      placeholder="z.B. Riesling"
                      placeholderTextColor="#999999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Geschmacksrichtung</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.tasteProfile}
                      onChangeText={(text) => updateFormData('tasteProfile', text)}
                      placeholder="z.B. trocken, halbtrocken, süß"
                      placeholderTextColor="#999999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Preis (optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.price}
                      onChangeText={(text) => updateFormData('price', text)}
                      placeholder="z.B. 15.99"
                      placeholderTextColor="#999999"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Beschreibung</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.description}
                      onChangeText={(text) => updateFormData('description', text)}
                      placeholder="Eine kurze Beschreibung des Weines..."
                      placeholderTextColor="#999999"
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </View>

                {/* Etikett-Foto */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Etikett-Foto</Text>
                  
                  <TouchableOpacity 
                    style={styles.imageButton} 
                    onPress={pickImage}
                    activeOpacity={0.7}
                  >
                    {formData.labelImage ? (
                      <OptimizedImage source={{ uri: formData.labelImage }} 
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>📷</Text>
                        <Text style={styles.imagePlaceholderLabel}>Etikett-Foto hinzufügen</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Speichern Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Wein speichern</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        <Footer />
      </View>
      
      {/* Fixed Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <BottomNavigation
          onNavigate={onNavigate}
          isLoggedIn={isLoggedIn}
          unreadNotifications={unreadNotifications}
          unreadHints={unreadHints}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d5dfe0',
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
    paddingBottom: 10,
    borderBottomWidth: 0,
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
  profileSection: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 25,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 25,
    backgroundColor: '#2c2c2c',
    position: 'relative',
    marginTop: 0,
    minHeight: 70,
    borderTopWidth: 0,
    borderBottomWidth: 0,
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
    width: 80,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dashboardButtonText: {
    fontSize: 22,
    color: '#2c2c2c', // Dunkler Text
  },
  greetingContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '600',
    color: '#DAA520',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(218, 165, 32, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
  // Hamburger Button Styles entfernt - wird durch DynamicHamburgerMenu ersetzt
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 150, // Genug Platz für Footer und BottomNavigation (erhöht für Sicherheit)
    flexGrow: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(47, 58, 59, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E',
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    color: '#2f3a3b',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  imageButton: {
    alignItems: 'center',
    marginVertical: 10,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D2691E',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  imagePlaceholderLabel: {
    color: '#D2691E',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#D2691E',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D2691E',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  dropdownButton: {
    flex: 1,
    padding: 14,
  },
  dropdownButtonOpen: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  clearButton: {
    padding: 14,
    paddingLeft: 10,
    paddingRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#DC3545',
  },
  dropdownButtonText: {
    color: '#D2691E',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownList: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    color: '#333333',
    fontSize: 15,
  },
  bottomNavContainer: {
    position: 'relative',
    zIndex: 1,
  },
});