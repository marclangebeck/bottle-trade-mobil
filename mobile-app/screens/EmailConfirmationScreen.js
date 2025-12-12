import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OptimizedImage from '../components/OptimizedImage';
import { BACKEND_API_URL } from '../config/api';
import axios from 'axios';

export default function EmailConfirmationScreen({ token, onConfirm, onNavigate }) {
  const [confirmationToken, setConfirmationToken] = useState(token || '');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Keyboard-Listener, um den unteren Bereich zu minimieren
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub?.remove();
      hideSub?.remove();
    };
  }, []);

  useEffect(() => {
    // Wenn Token per Deep Link übergeben wurde, automatisch bestätigen
    if (token) {
      handleConfirm();
    }
  }, [token]);

  const handleConfirm = async () => {
    if (!confirmationToken || confirmationToken.trim().length === 0) {
      Alert.alert('Fehler', 'Bitte geben Sie den Bestätigungs-Token ein.');
      return;
    }

    setIsConfirming(true);

    try {
      const response = await axios.post(`${BACKEND_API_URL}/auth/confirm-email`, {
        token: confirmationToken.trim()
      });

      if (response.data.status === 'already_confirmed') {
        Alert.alert('Bereits bestätigt', 'Ihre E-Mail-Adresse wurde bereits bestätigt.');
        setIsConfirmed(true);
      } else {
        Alert.alert(
          'E-Mail bestätigt!',
          'Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie erhalten eine E-Mail, sobald ein Admin Ihr Konto freigeschaltet hat.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsConfirmed(true);
                if (onConfirm) {
                  onConfirm();
                }
                if (onNavigate) {
                  onNavigate('welcome');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Fehler bei E-Mail-Bestätigung:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unbekannter Fehler';
      Alert.alert('Fehler', `E-Mail-Bestätigung fehlgeschlagen: ${errorMessage}`);
    } finally {
      setIsConfirming(false);
    }
  };

  if (isConfirmed) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#2c2c2c', '#1a1a1a', '#2c2c2c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        />
        <View style={styles.contentContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>E-Mail bestätigt!</Text>
          <Text style={styles.successText}>
            Ihre E-Mail-Adresse wurde erfolgreich bestätigt.{'\n\n'}
            Sie erhalten eine E-Mail, sobald ein Admin Ihr Konto freigeschaltet hat.
          </Text>
          {onNavigate && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => onNavigate('welcome')}
            >
              <Text style={styles.buttonText}>Zur Startseite</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2c2c2c', '#1a1a1a', '#2c2c2c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#2c2c2c' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 10}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: isKeyboardVisible ? 2 : 40 }]}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.logoContainer}>
          <OptimizedImage
            source={require('../assets/images/Logo_white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Bottle Trade</Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.heading}>E-Mail-Adresse bestätigen</Text>
          <Text style={styles.subtitle}>
            Bitte geben Sie den Bestätigungs-Token ein, den Sie per E-Mail erhalten haben.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Bestätigungs-Token"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={confirmationToken}
            onChangeText={setConfirmationToken}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isConfirming}
          />

          <TouchableOpacity
            style={[styles.button, isConfirming && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>E-Mail bestätigen</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Der Token wurde Ihnen per E-Mail zugesendet. Falls Sie keine E-Mail erhalten haben, prüfen Sie bitte Ihren Spam-Ordner.
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
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
    width: '100%',
    maxWidth: 400,
  },
  button: {
    backgroundColor: '#DAA520',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#2c2c2c',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  successText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
    lineHeight: 24,
  },
});

