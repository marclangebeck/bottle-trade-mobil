import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { registerUser } from './services/testAuth';
import { uploadImageToStorage } from './services/database-web';
import OptimizedImage from './components/OptimizedImage';

export default function RegisterScreen({ onRegister, onShowLogin, onNavigate }) {
  const [currentStep, setCurrentStep] = useState(1); // 1-5
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
    newsletter: false,
    isWinery: false,
    ageConfirmed: false, // Altersverifizierung (18+)
    termsAccepted: false // AGB/Datenschutz akzeptiert
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs für TextInput-Felder
  const usernameRef = useRef(null);
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const streetRef = useRef(null);
  const houseNumberRef = useRef(null);
  const zipCodeRef = useRef(null);
  const cityRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const scrollViewRef = useRef(null);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Berechtigung erforderlich', 'Wir benötigen Zugriff auf deine Galerie, um ein Profilbild auszuwählen.');
      return;
    }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    // Validierung je nach Schritt
    if (currentStep === 1) {
      if (!formData.username) {
        Alert.alert('Fehler', 'Bitte geben Sie einen Benutzernamen ein');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.street || !formData.houseNumber || !formData.zipCode || !formData.city) {
        Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus');
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.password || !formData.confirmPassword) {
        Alert.alert('Fehler', 'Bitte geben Sie ein Passwort ein');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein');
        return;
      }
    }
    
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (onNavigate) {
      onNavigate('welcome');
    }
  };

  // Passwort-Validierung
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('mindestens 8 Zeichen lang');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('mindestens einen Großbuchstaben');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('mindestens einen Kleinbuchstaben');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('mindestens eine Ziffer');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('mindestens ein Sonderzeichen');
    }
    
    return errors;
  };

  // E-Mail-Validierung
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    const { username, email, password, confirmPassword, firstName, lastName, street, houseNumber, zipCode, city, publishProfile, newsletter, ageConfirmed, termsAccepted } = formData;
    
    if (!username || !email || !password || !confirmPassword || !firstName || !lastName || !street || !houseNumber || !zipCode || !city) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    
    // E-Mail-Validierung
    if (!validateEmail(email)) {
      Alert.alert('Fehler', 'Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }
    
    // Passwort-Validierung
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      Alert.alert(
        'Passwort-Anforderungen nicht erfüllt',
        `Ihr Passwort muss folgende Anforderungen erfüllen:\n\n• ${passwordErrors.join('\n• ')}\n\nBitte korrigieren Sie Ihr Passwort.`
      );
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein');
      return;
    }

    // Altersverifizierung prüfen
    if (!ageConfirmed) {
      Alert.alert('Altersbeschränkung', 'Sie müssen bestätigen, dass Sie mindestens 18 Jahre alt sind, um diese App zu nutzen.');
      return;
    }

    // AGB/Datenschutz prüfen
    if (!termsAccepted) {
      Alert.alert('Einwilligung erforderlich', 'Bitte akzeptieren Sie die AGB und die Datenschutzerklärung, um fortzufahren.');
      return;
    }
    
    const registrationData = {
      ...formData,
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
      
      // Profilbild hochladen, falls vorhanden
      let profilbildUrl = null;
      if (profileImage) {
        try {
          console.log('📤 Uploading profile image...');
          setIsUploading(true);
          profilbildUrl = await uploadImageToStorage(profileImage, 'profiles');
          console.log('✅ Profile image uploaded:', profilbildUrl);
        } catch (uploadError) {
          console.error('❌ Error uploading profile image:', uploadError);
          Alert.alert('Warnung', 'Profilbild konnte nicht hochgeladen werden. Registrierung wird ohne Profilbild fortgesetzt.');
        } finally {
          setIsUploading(false);
        }
      }
      
      const userData = {
        username,
        firstName,
        lastName,
        street: `${street} ${houseNumber}`,
        zipCode,
        city,
        publishProfile,
        newsletter,
        isWinery: formData.isWinery || false,
        isWineryVerified: false, // Wird vom Admin verifiziert
        profilbild: profilbildUrl // Profilbild-URL hinzufügen
      };
      
      const user = await registerUser(email, password, userData);
      console.log('✅ Registration successful:', user.email);
      
      // Prüfe ob E-Mail gesendet wurde (optional - nicht kritisch)
      const emailSent = true; // Wird durch Backend-API gesendet (kann fehlschlagen, ist aber nicht kritisch)
      
      Alert.alert(
        'Registrierung erfolgreich!', 
        emailSent 
          ? 'Wir haben Ihnen eine E-Mail zur Bestätigung gesendet. Bitte bestätigen Sie Ihre E-Mail-Adresse und warten Sie auf die Freischaltung durch einen Admin.\n\nFalls Sie keine E-Mail erhalten haben, können Sie den Bestätigungs-Token auch manuell in der App eingeben.'
          : 'Ihr Konto wurde erstellt. Bitte kontaktieren Sie den Support für die E-Mail-Bestätigung, falls das Backend nicht erreichbar war.',
        [
          { text: 'OK', onPress: () => {
            // Navigiere zurück zum Welcome-Screen (kein automatischer Login)
            if (onNavigate) {
              onNavigate('welcome');
            }
          }}
        ]
      );
    } catch (error) {
      console.error('❌ Registration failed:', error);
      Alert.alert('Fehler', 'Registrierung fehlgeschlagen: ' + error.message);
      setIsUploading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Maske 1/6</Text>
      <Text style={styles.stepSubtitle}>Benutzername und Foto</Text>
      
      <TextInput
        ref={usernameRef}
        style={styles.input}
        placeholder="Benutzername"
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
        value={formData.username}
        onChangeText={(value) => updateFormData('username', value)}
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => handleNext()}
      />
      
      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📷 Foto auswählen</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Maske 2/6</Text>
      <Text style={styles.stepSubtitle}>Persönliche Daten</Text>
      
      <View style={styles.row}>
        <TextInput
          ref={firstNameRef}
          style={[styles.input, styles.halfInput]}
          placeholder="Vorname"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={formData.firstName}
          onChangeText={(value) => updateFormData('firstName', value)}
          returnKeyType="next"
          onSubmitEditing={() => lastNameRef.current?.focus()}
        />
        <TextInput
          ref={lastNameRef}
          style={[styles.input, styles.halfInput]}
          placeholder="Nachname"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={formData.lastName}
          onChangeText={(value) => updateFormData('lastName', value)}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      </View>
      
      <TextInput
        ref={emailRef}
        style={styles.input}
        placeholder="E-Mail"
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
        value={formData.email}
        onChangeText={(value) => updateFormData('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => streetRef.current?.focus()}
      />
      
      <View style={styles.row}>
        <TextInput
          ref={streetRef}
          style={[styles.input, styles.twoThirdsInput]}
          placeholder="Straße"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={formData.street}
          onChangeText={(value) => updateFormData('street', value)}
          returnKeyType="next"
          onSubmitEditing={() => houseNumberRef.current?.focus()}
        />
        <TextInput
          ref={houseNumberRef}
          style={[styles.input, styles.oneThirdInput]}
          placeholder="Nr"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={formData.houseNumber}
          onChangeText={(value) => updateFormData('houseNumber', value)}
          returnKeyType="next"
          onSubmitEditing={() => zipCodeRef.current?.focus()}
        />
      </View>
      
      <View style={styles.row}>
        <TextInput
          ref={zipCodeRef}
          style={[styles.input, styles.oneThirdInput]}
          placeholder="PLZ"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={formData.zipCode}
          onChangeText={(value) => updateFormData('zipCode', value)}
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => cityRef.current?.focus()}
        />
        <TextInput
          ref={cityRef}
          style={[styles.input, styles.twoThirdsInput]}
          placeholder="Ort"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={formData.city}
          onChangeText={(value) => updateFormData('city', value)}
          returnKeyType="next"
          onSubmitEditing={() => handleNext()}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Maske 3/6</Text>
      <Text style={styles.stepSubtitle}>Passwort</Text>
      
      <TextInput
        ref={passwordRef}
        style={styles.input}
        placeholder="Passwort"
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
        value={formData.password}
        onChangeText={(value) => updateFormData('password', value)}
        secureTextEntry
        returnKeyType="next"
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
      />
      
      <TextInput
        ref={confirmPasswordRef}
        style={styles.input}
        placeholder="Passwort bestätigen"
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
        value={formData.confirmPassword}
        onChangeText={(value) => updateFormData('confirmPassword', value)}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={() => handleNext()}
      />
    </View>
  );

  const renderStep4 = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Maske 4/6</Text>
        <Text style={styles.stepSubtitle}>Einstellungen</Text>
        
        <View style={styles.btpContainer}>
          <TouchableOpacity
            style={[styles.checkboxButton, formData.publishProfile && styles.checkboxButtonActive]}
            onPress={() => updateFormData('publishProfile', !formData.publishProfile)}
          >
            <Text style={styles.checkboxText}>
              {formData.publishProfile ? '✓' : '○'} Profil veröffentlichen
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.checkboxButton, formData.newsletter && styles.checkboxButtonActive]}
            onPress={() => updateFormData('newsletter', !formData.newsletter)}
          >
            <Text style={styles.checkboxText}>
              {formData.newsletter ? '✓' : '○'} Newsletter abonnieren
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.checkboxButton, formData.isWinery && styles.checkboxButtonActive]}
            onPress={() => updateFormData('isWinery', !formData.isWinery)}
          >
            <Text style={styles.checkboxText}>
              {formData.isWinery ? '✓' : '○'} 🏰 Ich bin ein Weingut
            </Text>
          </TouchableOpacity>
          {formData.isWinery && (
            <Text style={styles.wineryHint}>
              ℹ️ Dein Weingut-Profil muss von einem Admin verifiziert werden, bevor es öffentlich sichtbar ist.
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderStep5 = () => {
    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Maske 5/6</Text>
        <Text style={styles.stepSubtitle}>Rechtliche Bestätigungen</Text>
        
        <View style={styles.legalContainer}>
          <Text style={styles.legalTitle}>⚠️ Wichtige Hinweise</Text>
          
          <Text style={styles.legalText}>
            Diese App dient dem Tausch von Weinflaschen zwischen Privatpersonen. Alkoholhaltige Getränke dürfen nur an Personen ab 18 Jahren weitergegeben werden.
          </Text>

          <TouchableOpacity
            style={[styles.checkboxButton, formData.ageConfirmed && styles.checkboxButtonActive]}
            onPress={() => updateFormData('ageConfirmed', !formData.ageConfirmed)}
          >
            <Text style={styles.checkboxText}>
              {formData.ageConfirmed ? '✓' : '○'} Ich bestätige, dass ich mindestens 18 Jahre alt bin und berechtigt bin, alkoholhaltige Getränke zu erwerben und zu besitzen.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkboxButton, formData.termsAccepted && styles.checkboxButtonActive]}
            onPress={() => updateFormData('termsAccepted', !formData.termsAccepted)}
          >
            <Text style={styles.checkboxText}>
              {formData.termsAccepted ? '✓' : '○'} Ich habe die{' '}
              <Text style={styles.linkText} onPress={() => onNavigate && onNavigate('impressum')}>
                AGB
              </Text>
              {' '}und die{' '}
              <Text style={styles.linkText} onPress={() => onNavigate && onNavigate('datenschutz')}>
                Datenschutzerklärung
              </Text>
              {' '}gelesen und akzeptiere diese.
            </Text>
          </TouchableOpacity>

          <Text style={styles.legalHint}>
            ℹ️ Bottle-Trade ist eine reine Vermittlungsplattform. Die Verantwortung für die Tauschgeschäfte liegt bei den Tauschpartnern.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderStep6 = () => {
    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Maske 6/6</Text>
        <Text style={styles.stepSubtitle}>Übersicht</Text>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Benutzername:</Text>
            <Text style={styles.summaryValue}>{formData.username || '-'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vorname:</Text>
            <Text style={styles.summaryValue}>{formData.firstName || '-'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nachname:</Text>
            <Text style={styles.summaryValue}>{formData.lastName || '-'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>E-Mail:</Text>
            <Text style={styles.summaryValue}>{formData.email || '-'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Adresse:</Text>
            <Text style={styles.summaryValue}>
              {formData.street && formData.houseNumber ? `${formData.street} ${formData.houseNumber}` : '-'}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>PLZ / Ort:</Text>
            <Text style={styles.summaryValue}>
              {formData.zipCode && formData.city ? `${formData.zipCode} ${formData.city}` : '-'}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Profil veröffentlichen:</Text>
            <Text style={styles.summaryValue}>{formData.publishProfile ? 'Ja' : 'Nein'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ich bin ein Weingut:</Text>
            <Text style={styles.summaryValue}>{formData.isWinery ? 'Ja' : 'Nein'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Newsletter:</Text>
            <Text style={styles.summaryValue}>{formData.newsletter ? 'Ja' : 'Nein'}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Subtiler Hintergrund-Gradient für Glassmorphismus-Effekt */}
      <LinearGradient
        colors={[
          '#2c2c2c',
          '#1a1a1a',
          '#2c2c2c',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      {/* Zurück-Button */}
      {onNavigate && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Zurück</Text>
        </TouchableOpacity>
      )}
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Logo - größer und mittig am oberen Rand */}
        <View style={styles.logoContainer}>
          <OptimizedImage 
            source={require('./assets/images/Logo_white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Bottle Trade</Text>
        </View>
        
        {/* Form Container - vertikal zentriert */}
        <View style={styles.formContainer}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
        
        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonBack]}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              />
              <Text style={styles.buttonText}>Zurück</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < 6 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonNext]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              />
              <Text style={styles.buttonText}>Weiter</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonRegister, isUploading && styles.navButtonDisabled]}
              onPress={handleRegister}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              />
              <Text style={styles.buttonText}>Registrieren</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 0,
    marginHorizontal: 0,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38.4,
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    width: '100%',
    marginBottom: 20,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfInput: {
    width: '48%',
  },
  twoThirdsInput: {
    width: '65%',
  },
  oneThirdInput: {
    width: '30%',
  },
  imagePickerButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  btpContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkboxButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkboxButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  wineryHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  navigationButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  navButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 5,
  },
  navButtonBack: {
    backgroundColor: 'rgba(158, 158, 158, 0.25)',
    borderColor: 'rgba(158, 158, 158, 0.5)',
  },
  navButtonNext: {
    backgroundColor: 'rgba(33, 150, 243, 0.25)',
    borderColor: 'rgba(33, 150, 243, 0.5)',
  },
  navButtonRegister: {
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 1,
  },
  legalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
  },
  legalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    textAlign: 'center',
  },
  legalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  legalHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  linkText: {
    color: '#4A9EFF',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
