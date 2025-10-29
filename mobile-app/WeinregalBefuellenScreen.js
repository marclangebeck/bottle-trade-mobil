import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, ScrollView, Platform, ImageBackground } from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from './Footer';
import * as ImagePicker from 'expo-image-picker';
import { addWine } from './data/mockData';
import { getCurrentUser } from './services/testAuth';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import NotificationBadge from './components/NotificationBadge';
import BottomNavigation from './components/BottomNavigation';

export default function WeinregalBefuellenScreen({ onNavigate, onLogout, unreadNotifications = 0, isAdmin = false, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [formData, setFormData] = useState({
    wineName: '',
    winery: '',
    website: '',
    vintage: '',
    region: '',
    grapeVariety: '',
    wineType: '',
    tasteProfile: '',
    price: '',
    description: '',
    labelImage: null,
  });

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleNavigation = (screen) => {
    setIsMenuVisible(false);
    onNavigate(screen);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung erforderlich', 'Bitte erlauben Sie den Zugriff auf die Galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      updateFormData('labelImage', result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const { wineName, winery, vintage, region, grapeVariety, wineType, price, description, labelImage } = formData;
    
    if (!wineName || !winery || !vintage || !region || !grapeVariety || !wineType) {
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
        wineType: wineType,
        price: price ? parseFloat(price.replace(',', '.')) : null,
        description: description || '',
        labelImage: labelImage,
        ownerId: currentUserId,
        owner: currentUserName, // Besitzer-Name hinzufügen
        status: 'private', // Standard: privat
        availableForTrade: false
      });

      console.log('✅ Wein erfolgreich hinzugefügt:', newWine);
      
      // Formular zurücksetzen
      setFormData({
        wineName: '',
        winery: '',
        website: '',
        vintage: '',
        region: '',
        grapeVariety: '',
        wineType: '',
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)'
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
          {/* Header */}
          <View style={styles.header}>
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
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Wein hinzufügen</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => onNavigate('notifications')}
              >
                <Text style={styles.notificationIcon}>🔔</Text>
                <NotificationBadge 
                  count={unreadNotifications}
                  onPress={() => onNavigate('notifications')}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              <Text style={styles.dashboardSubtitle}>Machen Sie bitte Angaben zu dem Wein, den Sie tauschen möchten.</Text>

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
                      placeholderTextColor="rgba(255,255,255,0.6)"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Weingut *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.winery}
                      onChangeText={(text) => updateFormData('winery', text)}
                      placeholder="z.B. Weingut Müller"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Website des Weingutes</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.website}
                      onChangeText={(text) => updateFormData('website', text)}
                      placeholder="z.B. www.weingut-mueller.de"
                      placeholderTextColor="rgba(255,255,255,0.6)"
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
                        placeholderTextColor="rgba(255,255,255,0.6)"
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
                        placeholderTextColor="rgba(255,255,255,0.6)"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.label}>Rebsorte *</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.grapeVariety}
                        onChangeText={(text) => updateFormData('grapeVariety', text)}
                        placeholder="z.B. Riesling"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                      />
                    </View>
                    
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Sorte *</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.wineType}
                        onChangeText={(text) => updateFormData('wineType', text)}
                        placeholder="z.B. Weißwein"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Geschmacksrichtung</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.tasteProfile}
                      onChangeText={(text) => updateFormData('tasteProfile', text)}
                      placeholder="z.B. trocken, halbtrocken, süß"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Preis (optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.price}
                      onChangeText={(text) => updateFormData('price', text)}
                      placeholder="z.B. 15.99"
                      placeholderTextColor="rgba(255,255,255,0.6)"
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
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </View>

                {/* Etikett-Foto */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Etikett-Foto</Text>
                  
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
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
      <BottomNavigation onNavigate={onNavigate} isLoggedIn={isLoggedIn} />
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
    backgroundColor: '#F8F8F8',
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 33.75,
    paddingBottom: 33.75,
    backgroundColor: '#2f3a3b',
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 135,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 40,
    alignItems: 'center',
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
    color: '#FFFFFF',
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Hamburger Button Styles entfernt - wird durch DynamicHamburgerMenu ersetzt
  content: {
    flex: 1,
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
  },
  formContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 222, 179, 0.3)',
    paddingBottom: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  imageButton: {
    alignItems: 'center',
    marginVertical: 10,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  imagePlaceholderLabel: {
    color: '#F5DEB3',
    fontSize: 14,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: 'rgba(75, 0, 0, 0.8)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 222, 179, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#F5DEB3',
    fontSize: 18,
    fontWeight: 'bold',
  },
});