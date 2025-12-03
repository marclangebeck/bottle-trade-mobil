import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import * as ImagePicker from 'expo-image-picker';
import { addWine } from '../services/database-web';
import { getCurrentUser } from '../services/testAuth';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MeinWeinregalBefuellenKIScreen({ onNavigate, onLogout, unreadNotifications = 0, unreadHints = 0, isAdmin = false, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  
  // Refs für Tastatur-Navigation
  const scrollViewRef = useRef(null);
  const wineNameInputRef = useRef(null);
  const wineryInputRef = useRef(null);
  const websiteInputRef = useRef(null);
  const vintageInputRef = useRef(null);
  const regionInputRef = useRef(null);
  const grapeVarietyInputRef = useRef(null);
  const tasteProfileInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  
  // Funktion zum automatischen Scrollen zum Input-Feld
  const scrollToInput = (inputRef) => {
    if (inputRef.current && scrollViewRef.current) {
      inputRef.current.measureLayout(
        scrollViewRef.current,
        (x, y, width, height) => {
          scrollViewRef.current?.scrollTo({
            y: y - 50,
            animated: true,
          });
        },
        () => {
          inputRef.current.measureInWindow((x, y, width, height) => {
            scrollViewRef.current?.scrollTo({
              y: y - 100,
              animated: true,
            });
          });
        }
      );
    }
  };

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
    labelImages: [], // Array für mehrere Bilder (max 5)
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // KI-Analyse-Funktion (Platzhalter - wird später implementiert)
  const analyzeWineLabel = async (imageUri) => {
    setIsAnalyzing(true);
    setAnalysisProgress('Bild wird analysiert...');
    
    try {
      // TODO: Hier wird später die KI-Integration implementiert
      // Vorläufig: Simulierte Analyse für Demo-Zwecke
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAnalysisProgress('Text wird erkannt...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAnalysisProgress('Daten werden extrahiert...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Beispiel-Daten (später durch KI-Ergebnisse ersetzt)
      const mockAnalysisResult = {
        wineName: 'Riesling Spätlese',
        winery: 'Weingut Müller',
        website: 'www.weingut-mueller.de',
        vintage: '2020',
        region: 'Mosel',
        grapeVariety: 'Riesling',
        tasteProfile: 'trocken',
        price: '15.99',
        description: 'Frischer Riesling mit mineralischen Noten',
      };
      
      // Fülle Formular mit KI-Ergebnissen
      setFormData(prev => ({
        ...prev,
        wineName: mockAnalysisResult.wineName,
        winery: mockAnalysisResult.winery,
        website: mockAnalysisResult.website,
        vintage: mockAnalysisResult.vintage,
        region: mockAnalysisResult.region,
        grapeVariety: mockAnalysisResult.grapeVariety,
        tasteProfile: mockAnalysisResult.tasteProfile,
        price: mockAnalysisResult.price,
        description: mockAnalysisResult.description,
      }));
      
      setAnalysisProgress('');
      setIsAnalyzing(false);
      
      Alert.alert(
        '✅ Analyse abgeschlossen',
        'Die KI hat die Wein-Daten aus dem Etikett extrahiert. Bitte überprüfen und korrigieren Sie die Felder bei Bedarf.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Fehler bei KI-Analyse:', error);
      setAnalysisProgress('');
      setIsAnalyzing(false);
      Alert.alert('Fehler', 'Die KI-Analyse konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut.');
    }
  };

  const pickImages = async () => {
    try {
      const currentImages = formData.labelImages || [];
      const remainingSlots = 5 - currentImages.length;
      
      if (remainingSlots <= 0) {
        Alert.alert('Maximum erreicht', 'Sie können maximal 5 Bilder hinzufügen.');
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
        quality: 1,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        const updatedImages = [...currentImages, ...newImages].slice(0, 5);
        updateFormData('labelImages', updatedImages);
        
        // Automatische KI-Analyse beim ersten Bild
        if (currentImages.length === 0 && newImages.length > 0) {
          Alert.alert(
            'KI-Analyse starten?',
            'Möchten Sie das erste Bild automatisch mit KI analysieren lassen?',
            [
              { text: 'Später', style: 'cancel' },
              {
                text: 'Jetzt analysieren',
                onPress: () => analyzeWineLabel(newImages[0])
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Fehler bei der Bild-Auswahl:', error);
      Alert.alert('Fehler', 'Fehler beim Öffnen der Galerie. Bitte versuchen Sie es erneut.');
    }
  };

  const removeImage = (index) => {
    const updatedImages = formData.labelImages.filter((_, i) => i !== index);
    updateFormData('labelImages', updatedImages);
  };

  const handleSave = async () => {
    const { wineName, winery, vintage, region, grapeVariety, price, description, labelImages } = formData;
    
    if (!wineName || !winery || !vintage || !region || !grapeVariety) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid || 'test-456';
    const currentUserName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Max Mustermann';
    
    try {
      const newWine = await addWine({
        name: wineName,
        winery: winery,
        vintage: parseInt(vintage),
        region: region,
        grapeVariety: grapeVariety,
        price: price ? parseFloat(price.replace(',', '.')) : null,
        description: description || '',
        labelImages: labelImages || [],
        ownerId: currentUserId,
        owner: currentUserName,
        ownerZipCode: currentUser?.zipCode || null,
        status: 'private',
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
        tasteProfile: '',
        price: '',
        description: '',
        labelImages: [],
      });
      
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
                <View style={styles.profileIconCircle}>
                  <Text style={styles.profileIconText}>A</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Tagline */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Weinregal befüllen (KI)</Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.content} 
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.dashboardContainer}>
              <Text style={styles.dashboardSubtitle}>
                Machen Sie ein Foto vom Wein-Etikett oder wählen Sie ein Bild aus. Die KI analysiert das Etikett automatisch und füllt alle Felder aus.
              </Text>

              {/* KI-Analyse Status */}
              {isAnalyzing && (
                <View style={styles.analysisContainer}>
                  <ActivityIndicator size="large" color="#a9c7cd" />
                  <Text style={styles.analysisProgressText}>{analysisProgress}</Text>
                </View>
              )}

              <View style={styles.formContainer}>
                {/* Etikett-Fotos (max 5) */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Etikett-Fotos (max. 5)</Text>
                  
                  {/* Bildergalerie */}
                  {formData.labelImages && formData.labelImages.length > 0 && (
                    <ScrollView 
                      horizontal 
                      style={styles.imageGallery}
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={styles.imageGalleryContent}
                    >
                      {formData.labelImages.map((imageUri, index) => (
                        <View key={index} style={styles.imageItem}>
                          <OptimizedImage 
                            source={{ uri: imageUri }} 
                            style={styles.imagePreview}
                            resizeMode="cover"
                          />
                          <TouchableOpacity 
                            style={styles.removeImageButton}
                            onPress={() => removeImage(index)}
                          >
                            <Text style={styles.removeImageText}>✕</Text>
                          </TouchableOpacity>
                          {index === 0 && (
                            <TouchableOpacity 
                              style={styles.analyzeButton}
                              onPress={() => analyzeWineLabel(imageUri)}
                              disabled={isAnalyzing}
                            >
                              <Text style={styles.analyzeButtonText}>🤖 KI analysieren</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  )}
                  
                  {/* Add Button */}
                  {(!formData.labelImages || formData.labelImages.length < 5) && (
                    <TouchableOpacity 
                      style={styles.imageButton} 
                      onPress={pickImages}
                      activeOpacity={0.7}
                    >
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>📷</Text>
                        <Text style={styles.imagePlaceholderLabel}>
                          {formData.labelImages && formData.labelImages.length > 0 
                            ? `Weitere Fotos hinzufügen (${formData.labelImages.length}/5)`
                            : 'Etikett-Foto hinzufügen (KI-Analyse)'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {formData.labelImages && formData.labelImages.length >= 5 && (
                    <Text style={styles.maxImagesText}>Maximum von 5 Bildern erreicht</Text>
                  )}
                </View>

                {/* Grunddaten */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Grunddaten</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name des Weines *</Text>
                    <TextInput
                      ref={wineNameInputRef}
                      style={styles.input}
                      value={formData.wineName}
                      onChangeText={(text) => updateFormData('wineName', text)}
                      placeholder="z.B. Riesling Spätlese"
                      placeholderTextColor="#999999"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        wineryInputRef.current?.focus();
                        setTimeout(() => scrollToInput(wineryInputRef), 100);
                      }}
                      onFocus={() => scrollToInput(wineNameInputRef)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Weingut *</Text>
                    <TextInput
                      ref={wineryInputRef}
                      style={styles.input}
                      value={formData.winery}
                      onChangeText={(text) => updateFormData('winery', text)}
                      placeholder="z.B. Weingut Müller"
                      placeholderTextColor="#999999"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        websiteInputRef.current?.focus();
                        setTimeout(() => scrollToInput(websiteInputRef), 100);
                      }}
                      onFocus={() => scrollToInput(wineryInputRef)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Website des Weingutes</Text>
                    <TextInput
                      ref={websiteInputRef}
                      style={styles.input}
                      value={formData.website}
                      onChangeText={(text) => updateFormData('website', text)}
                      placeholder="z.B. www.weingut-mueller.de"
                      placeholderTextColor="#999999"
                      keyboardType="url"
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        vintageInputRef.current?.focus();
                        setTimeout(() => scrollToInput(vintageInputRef), 100);
                      }}
                      onFocus={() => scrollToInput(websiteInputRef)}
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
                        ref={vintageInputRef}
                        style={styles.input}
                        value={formData.vintage}
                        onChangeText={(text) => updateFormData('vintage', text)}
                        placeholder="2020"
                        placeholderTextColor="#999999"
                        keyboardType="numeric"
                        returnKeyType="next"
                        onSubmitEditing={() => {
                          regionInputRef.current?.focus();
                          setTimeout(() => scrollToInput(regionInputRef), 100);
                        }}
                        onFocus={() => scrollToInput(vintageInputRef)}
                      />
                    </View>
                    
                    <View style={[styles.inputGroup, { flex: 2 }]}>
                      <Text style={styles.label}>Anbauregion *</Text>
                      <TextInput
                        ref={regionInputRef}
                        style={styles.input}
                        value={formData.region}
                        onChangeText={(text) => updateFormData('region', text)}
                        placeholder="z.B. Mosel"
                        placeholderTextColor="#999999"
                        returnKeyType="next"
                        onSubmitEditing={() => {
                          grapeVarietyInputRef.current?.focus();
                          setTimeout(() => scrollToInput(grapeVarietyInputRef), 100);
                        }}
                        onFocus={() => scrollToInput(regionInputRef)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Rebsorte *</Text>
                    <TextInput
                      ref={grapeVarietyInputRef}
                      style={styles.input}
                      value={formData.grapeVariety}
                      onChangeText={(text) => updateFormData('grapeVariety', text)}
                      placeholder="z.B. Riesling"
                      placeholderTextColor="#999999"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        tasteProfileInputRef.current?.focus();
                        setTimeout(() => scrollToInput(tasteProfileInputRef), 100);
                      }}
                      onFocus={() => scrollToInput(grapeVarietyInputRef)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Geschmacksrichtung</Text>
                    <TextInput
                      ref={tasteProfileInputRef}
                      style={styles.input}
                      value={formData.tasteProfile}
                      onChangeText={(text) => updateFormData('tasteProfile', text)}
                      placeholder="z.B. trocken, halbtrocken, süß"
                      placeholderTextColor="#999999"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        priceInputRef.current?.focus();
                        setTimeout(() => scrollToInput(priceInputRef), 100);
                      }}
                      onFocus={() => scrollToInput(tasteProfileInputRef)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Preis (optional)</Text>
                    <TextInput
                      ref={priceInputRef}
                      style={styles.input}
                      value={formData.price}
                      onChangeText={(text) => updateFormData('price', text)}
                      placeholder="z.B. 15.99"
                      placeholderTextColor="#999999"
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        descriptionInputRef.current?.focus();
                        setTimeout(() => scrollToInput(descriptionInputRef), 100);
                      }}
                      onFocus={() => scrollToInput(priceInputRef)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Beschreibung</Text>
                    <TextInput
                      ref={descriptionInputRef}
                      style={[styles.input, styles.textArea]}
                      value={formData.description}
                      onChangeText={(text) => updateFormData('description', text)}
                      placeholder="Eine kurze Beschreibung des Weines..."
                      placeholderTextColor="#999999"
                      multiline
                      numberOfLines={4}
                      returnKeyType="done"
                      onFocus={() => scrollToInput(descriptionInputRef)}
                    />
                  </View>
                </View>

                {/* Speichern Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Wein speichern</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
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
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
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
  },
  scrollContentContainer: {
    paddingBottom: 150,
    flexGrow: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  analysisContainer: {
    backgroundColor: 'rgba(218, 165, 32, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.3)',
  },
  analysisProgressText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
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
  imageGallery: {
    marginBottom: 15,
  },
  imageGalleryContent: {
    paddingRight: 10,
  },
  imageItem: {
    marginRight: 15,
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#DC3545',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  analyzeButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#a9c7cd',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  maxImagesText: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
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
    color: '#2c2c2c',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomNavContainer: {
    position: 'relative',
    zIndex: 1,
  },
});


