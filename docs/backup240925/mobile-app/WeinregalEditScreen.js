import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from './Footer';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import { updateWine } from './data/mockData';

export default function WeinregalEditScreen({ onNavigate, onLogout, wineData }) {
  const [formData, setFormData] = useState({
    wineName: wineData?.name || '',
    winery: wineData?.winery || '',
    vintage: wineData?.vintage?.toString() || '',
    region: wineData?.region || '',
    grapeVariety: wineData?.grapeVariety || '',
    wineType: wineData?.wineType || '',
    tasteProfile: wineData?.tasteProfile || '',
    price: wineData?.price?.toString() || '',
    description: wineData?.description || '',
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { wineName, winery, vintage, region, grapeVariety, wineType, price, description } = formData;
    
    if (!wineName || !winery || !vintage || !region || !grapeVariety || !wineType) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    try {
      await updateWine(wineData.id, {
        name: wineName,
        winery: winery,
        vintage: parseInt(vintage),
        region: region,
        grapeVariety: grapeVariety,
        wineType: wineType,
        price: price ? parseFloat(price) : null,
        description: description || '',
      });

      console.log('✅ Wein erfolgreich aktualisiert:', wineData.id);
      
      Alert.alert('Erfolg', 'Wein wurde erfolgreich aktualisiert!', [
        { text: 'OK', onPress: () => onNavigate('meinWeinregal') }
      ]);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Weins:', error);
      Alert.alert('Fehler', 'Wein konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <LinearGradient
      colors={['#4B0000', '#800000', '#A52A2A']}
      style={styles.fullScreenBackground}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('meinWeinregal')} style={styles.hamburgerButton}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✏️ Wein bearbeiten</Text>
      </View>

      <DynamicHamburgerMenu
        isVisible={false}
        onClose={() => {}}
        onNavigate={onNavigate}
        isLoggedIn={true}
        onLogout={onLogout}
      />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.contentContainer}>
          <Text style={styles.subtitle}>Bearbeiten Sie die Angaben zu Ihrem Wein.</Text>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Wein-Informationen</Text>
            
            <Text style={styles.label}>Name des Weines *</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Château Margaux"
              placeholderTextColor="#ccc"
              value={formData.wineName}
              onChangeText={(text) => updateFormData('wineName', text)}
            />

            <Text style={styles.label}>Weingut *</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Château Margaux"
              placeholderTextColor="#ccc"
              value={formData.winery}
              onChangeText={(text) => updateFormData('winery', text)}
            />

            <Text style={styles.label}>Jahrgang *</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. 2015"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={formData.vintage}
              onChangeText={(text) => updateFormData('vintage', text)}
            />

            <Text style={styles.label}>Anbauregion *</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Bordeaux, Frankreich"
              placeholderTextColor="#ccc"
              value={formData.region}
              onChangeText={(text) => updateFormData('region', text)}
            />

            <Text style={styles.label}>Rebsorte *</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Cabernet Sauvignon"
              placeholderTextColor="#ccc"
              value={formData.grapeVariety}
              onChangeText={(text) => updateFormData('grapeVariety', text)}
            />

            <Text style={styles.label}>Sorte *</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Rotwein, Weißwein, Rosé"
              placeholderTextColor="#ccc"
              value={formData.wineType}
              onChangeText={(text) => updateFormData('wineType', text)}
            />

            <Text style={styles.label}>Geschmacksrichtung</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. Trocken, Halbtrocken, Süß"
              placeholderTextColor="#ccc"
              value={formData.tasteProfile}
              onChangeText={(text) => updateFormData('tasteProfile', text)}
            />

            <Text style={styles.label}>Preis (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="z.B. 45.00"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={(text) => updateFormData('price', text)}
            />

            <Text style={styles.label}>Beschreibung</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Beschreiben Sie Ihren Wein..."
              placeholderTextColor="#ccc"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Wein aktualisieren</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Footer onNavigate={onNavigate} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fullScreenBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: Platform.OS === 'ios' ? 100 : 60,
    zIndex: 10,
  },
  hamburgerButton: {
    padding: 10,
    marginRight: 15,
  },
  hamburgerLine: {
    width: 25,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginVertical: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'normal',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 10,
    margin: 15,
    padding: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    color: '#000000',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#D2691E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
