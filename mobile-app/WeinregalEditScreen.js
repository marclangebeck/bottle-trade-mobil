import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Footer from './Footer';
import OptimizedImage from './components/OptimizedImage';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import { updateWine } from './services/database-web';

export default function WeinregalEditScreen({ onNavigate, onLogout, wineData, isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [formData, setFormData] = useState({
    wineName: wineData?.name || '',
    winery: wineData?.winery || '',
    website: wineData?.website || '',
    vintage: wineData?.vintage?.toString() || '',
    region: wineData?.region || '',
    grapeVariety: wineData?.grapeVariety || '',
    tasteProfile: wineData?.tasteProfile || '',
    price: wineData?.price?.toString() || '',
    description: wineData?.description || '',
    labelImage: wineData?.labelImage || null,
  });

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
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

    if (!result.canceled) {
      updateFormData('labelImage', result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const { wineName, winery, website, vintage, region, grapeVariety, tasteProfile, price, description } = formData;
    
    if (!wineName || !winery || !vintage || !region || !grapeVariety) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    try {
      await updateWine(wineData.id, {
        name: wineName,
        winery: winery,
        website: website || '',
        vintage: parseInt(vintage),
        region: region,
        grapeVariety: grapeVariety,
        tasteProfile: tasteProfile || '',
        price: price ? parseFloat(price.replace(',', '.')) : null,
        description: description || '',
        labelImage: formData.labelImage || null,
      });

      console.log('✅ Wein erfolgreich aktualisiert:', wineData.id);
      
      Alert.alert('Erfolg', 'Wein wurde erfolgreich aktualisiert!', [
        { text: 'OK', onPress: () => onNavigate('mein-weinregal') }
      ]);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Weins:', error);
      Alert.alert('Fehler', 'Wein konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <View
      style={styles.fullScreenBackground}
    >
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
          isAdmin={false}
          unreadNotifications={0}
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
              <Text style={styles.greeting}>Wein bearbeiten</Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              <Text style={styles.dashboardSubtitle}>Bearbeiten Sie die Angaben zu Ihrem Wein.</Text>

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
                  
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    {formData.labelImage ? (
                      <OptimizedImage 
                        source={{ uri: formData.labelImage }} 
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>📷</Text>
                        <Text style={styles.imagePlaceholderLabel}>Kein Etikett-Foto</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Speichern Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Wein aktualisieren</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        <Footer onNavigate={onNavigate} />
      </View>
      {/* Fixed Bottom Navigation */}
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
  fullScreenBackground: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Gleiche Farbe wie StatusBar-Ersatz-View, verhindert weißen Strich
  },
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Gleiche Farbe wie StatusBar-Ersatz-View, verhindert weißen Strich
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.4)', // Warmes Gold mit Glassmorphism
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 90,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(218, 165, 32, 0.5)', // Warmes Gold Akzent
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(218, 165, 32, 0.3)',
    // Glassmorphism Effekt
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    backgroundColor: '#2c2c2c', // Dunkler auf hellem Header
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Header
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#333333',
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
});
