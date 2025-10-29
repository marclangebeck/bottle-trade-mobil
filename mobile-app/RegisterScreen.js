import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, ScrollView, Platform } from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Footer from './Footer';
import { registerUser } from './services/testAuth';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';

export default function RegisterScreen({ onRegister, onShowLogin, onNavigate, isLoggedIn }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    street: '',
    houseNumber: '',
    zipCode: '',
    city: '',
    publishProfile: false,
    newsletter: false
  });
  const [profileImage, setProfileImage] = useState(null);

  const handleRegister = async () => {
    const { username, email, password, confirmPassword, firstName, lastName, street, houseNumber, zipCode, city, publishProfile, newsletter } = formData;
    
    if (!username || !email || !password || !confirmPassword || !firstName || !lastName || !street || !houseNumber || !zipCode || !city) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein');
      return;
    }
    
    // Passwort-Validierung
    if (password.length < 8) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    // Prüfe auf Groß- und Kleinschreibung
    if (!/[a-z]/.test(password)) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens einen Großbuchstaben enthalten');
      return;
    }

    // Prüfe auf Zahlen
    if (!/\d/.test(password)) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens eine Zahl enthalten');
      return;
    }

    // Prüfe auf Sonderzeichen
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens ein Sonderzeichen enthalten');
      return;
    }
    
    // BTP-Berechnung
    let btpEarned = 0;
    if (formData.publishProfile) btpEarned += 10;
    if (formData.newsletter) btpEarned += 10;

    // Erweiterte Registrierungsdaten für Admin
    const registrationData = {
      ...formData,
      btpEarned,
      status: 'pending',
      registrationDate: new Date().toISOString(),
      address: {
        street: formData.street,
        houseNumber: formData.houseNumber,
        zipCode: formData.zipCode,
        city: formData.city
      }
    };
    
    try {
      console.log('🔄 Attempting registration for:', email);
      
      const userData = {
        username,
        firstName,
        lastName,
        street: `${street} ${houseNumber}`,
        zipCode,
        city,
        publishProfile,
        newsletter
      };
      
      const user = await registerUser(email, password, userData);
      console.log('✅ Registration successful:', user.email);
      
      Alert.alert('Erfolg', `Registrierung erfolgreich! Du erhältst ${btpEarned} BTP. Bitte bestätigen Sie Ihre E-Mail.`, [
        { text: 'OK', onPress: () => onRegister(registrationData) }
      ]);
    } catch (error) {
      console.error('❌ Registration failed:', error);
      Alert.alert('Fehler', 'Registrierung fehlgeschlagen: ' + error.message);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    // Berechtigung anfragen
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Berechtigung erforderlich', 'Wir benötigen Zugriff auf deine Galerie, um ein Profilbild auszuwählen.');
      return;
    }

    // Bild auswählen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

         return (
           <View style={{
             flex: 1,
             backgroundColor: '#d5dfe0', // Neue Primärfarbe
           }}>
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
             <DynamicHamburgerMenu 
               onNavigate={onNavigate || (() => {})} 
               isLoggedIn={isLoggedIn || false} 
               onLogout={() => {}} 
               isAdmin={false} 
               unreadNotifications={0}
               renderButton={false}
               externalMenuVisible={isMenuVisible}
               onMenuToggle={setIsMenuVisible}
             />
             
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
                 <Text style={styles.greeting}>Registrierung</Text>
               </View>
               <View style={styles.headerRight} />
             </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, paddingTop: 20 }}>
        <View style={styles.glassContainer}>
        <Text style={styles.title}>Registrierung</Text>
      
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Benutzername"
            placeholderTextColor="rgba(0, 0, 0, 0.6)"
            value={formData.username}
            onChangeText={(value) => updateFormData('username', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="E-Mail"
            placeholderTextColor="rgba(0, 0, 0, 0.6)"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.rowContainer}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Vorname"
              placeholderTextColor="rgba(0, 0, 0, 0.6)"
              value={formData.firstName}
              onChangeText={(value) => updateFormData('firstName', value)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Nachname"
              placeholderTextColor="rgba(0, 0, 0, 0.6)"
              value={formData.lastName}
              onChangeText={(value) => updateFormData('lastName', value)}
            />
          </View>

          <View style={styles.rowContainer}>
            <TextInput
              style={[styles.input, styles.streetInput]}
              placeholder="Straße"
              placeholderTextColor="rgba(0, 0, 0, 0.6)"
              value={formData.street}
              onChangeText={(value) => updateFormData('street', value)}
            />
            <TextInput
              style={[styles.input, styles.houseNumberInput]}
              placeholder="Hausnr."
              placeholderTextColor="rgba(0, 0, 0, 0.6)"
              value={formData.houseNumber}
              onChangeText={(value) => updateFormData('houseNumber', value)}
            />
          </View>

          <View style={styles.rowContainer}>
            <TextInput
              style={[styles.input, styles.zipInput]}
              placeholder="PLZ"
              placeholderTextColor="rgba(0, 0, 0, 0.6)"
              value={formData.zipCode}
              onChangeText={(value) => updateFormData('zipCode', value)}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.cityInput]}
              placeholder="Wohnort"
              placeholderTextColor="rgba(0, 0, 0, 0.6)"
              value={formData.city}
              onChangeText={(value) => updateFormData('city', value)}
            />
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Passwort"
            placeholderTextColor="rgba(0, 0, 0, 0.6)"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            secureTextEntry
          />
          
          {/* Passwort-Anforderungen */}
          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Passwort-Anforderungen:</Text>
            <Text style={[styles.requirement, formData.password.length >= 8 && styles.requirementMet]}>
              ✓ Mindestens 8 Zeichen
            </Text>
            <Text style={[styles.requirement, /[a-z]/.test(formData.password) && styles.requirementMet]}>
              ✓ Mindestens ein Kleinbuchstabe
            </Text>
            <Text style={[styles.requirement, /[A-Z]/.test(formData.password) && styles.requirementMet]}>
              ✓ Mindestens ein Großbuchstabe
            </Text>
            <Text style={[styles.requirement, /\d/.test(formData.password) && styles.requirementMet]}>
              ✓ Mindestens eine Zahl
            </Text>
            <Text style={[styles.requirement, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) && styles.requirementMet]}>
              ✓ Mindestens ein Sonderzeichen
            </Text>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Passwort bestätigen"
            placeholderTextColor="rgba(0, 0, 0, 0.6)"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            secureTextEntry
          />

          {/* BTP & Einstellungen Container */}
          <View style={styles.btpSettingsContainer}>
            {/* BTP Information */}
            <View style={styles.btpInfo}>
              <Text style={styles.btpTitle}>🎁 Willkommens-BTP</Text>
              <Text style={styles.btpText}>Du erhältst 10 BTP für das erstmalige Veröffentlichen deines Profils</Text>
              <Text style={styles.btpText}>Du erhältst 10 BTP für die erstmalige Anmeldung zum Newsletter</Text>
            </View>

            {/* Checkboxen */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity 
                style={styles.checkboxItem}
                onPress={() => updateFormData('publishProfile', !formData.publishProfile)}
              >
                <View style={[styles.checkbox, formData.publishProfile && styles.checkboxChecked]}>
                  {formData.publishProfile && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>Profil veröffentlichen (+10 BTP)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.checkboxItem}
                onPress={() => updateFormData('newsletter', !formData.newsletter)}
              >
                <View style={[styles.checkbox, formData.newsletter && styles.checkboxChecked]}>
                  {formData.newsletter && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>Newsletter abonnieren (+10 BTP)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profilbild Upload */}
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileImageLabel}>Profilbild (optional)</Text>
            {profileImage ? (
              <View style={styles.imagePreviewContainer}>
                <OptimizedImage source={{ uri: profileImage }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                  <Text style={styles.changeImageText}>Bild ändern</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.profileImageButton} onPress={pickImage}>
                <Text style={styles.profileImageText}>📷 Profilbild hochladen</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <LinearGradient
            colors={['#6B8E23', '#556B2F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <TouchableOpacity style={styles.glassButton} onPress={handleRegister}>
              <Text style={styles.glassButtonText}>Registrieren</Text>
            </TouchableOpacity>
          </LinearGradient>

          <Text style={styles.adminNote}>
            Nach der Registrierung muss Ihr Konto vom Administrator freigeschaltet werden.
          </Text>
          
          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={onShowLogin}
          >
            <Text style={styles.linkText}>Bereits ein Konto? Jetzt anmelden</Text>
          </TouchableOpacity>
        </View>
               </View>
             </ScrollView>
             <Footer />
             <BottomNavigation onNavigate={onNavigate || (() => {})} isLoggedIn={isLoggedIn || false} />
           </View>
         );
       }

const styles = StyleSheet.create({
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
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)', // Dunkelgrau mit Transparenz
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtiler weißer Border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    color: '#000000',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gradientBorder: {
    borderRadius: 20,
    marginTop: 10,
    padding: 1,
  },
  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    borderRadius: 19,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glassButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textDecorationLine: 'underline',
  },
  // Row Layout Styles
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfInput: {
    width: '48%',
  },
  streetInput: {
    width: '70%',
  },
  houseNumberInput: {
    width: '25%',
  },
  zipInput: {
    width: '30%',
  },
  cityInput: {
    width: '65%',
  },
  // BTP & Einstellungen Container
  btpSettingsContainer: {
    backgroundColor: '#2c2c2c',
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // BTP Info Styles
  btpInfo: {
    marginBottom: 15,
  },
  btpTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  btpText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  // Checkbox Styles
  checkboxContainer: {
    marginTop: 10,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
    backgroundColor: '#404040',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 6,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkboxChecked: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  checkmark: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 15,
    flex: 1,
    fontWeight: '500',
  },
  // Admin Note
  adminNote: {
    color: '#FFD700',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  // Profilbild Upload Styles
  profileImageContainer: {
    marginVertical: 15,
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImageLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileImageButton: {
    backgroundColor: '#404040',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  // Bildvorschau Styles
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changeImageButton: {
    backgroundColor: '#404040',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  // Passwort-Anforderungen Styles
  passwordRequirements: {
    backgroundColor: '#2c2c2c',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  requirementsTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  requirement: {
    color: '#CCCCCC',
    fontSize: 11,
    marginBottom: 4,
  },
  requirementMet: {
    color: '#90EE90',
    fontWeight: 'bold',
  },
});
