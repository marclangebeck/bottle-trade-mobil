// Test-Auth Service (simuliert Authentication ohne Firebase Auth)
import { createUser, getUser, getUserByEmailOrUsername, notifyAdminsAboutNewRegistration } from './database-web';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test-User-Daten
let currentLoggedInUser = null; // Aktuell eingeloggter User

// Stelle sicher, dass alle Test-User in der Datenbank existieren
const ensureTestUsersExist = async (testUsers) => {
  try {
    if (!testUsers || typeof testUsers !== 'object') {
      console.log('⚠️ Test users not available yet, skipping database check');
      return;
    }
    
    for (const [email, userData] of Object.entries(testUsers)) {
      const existingUser = await getUser(userData.uid);
      if (!existingUser) {
        await createUser(userData);
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring test users:', error);
  }
};

const testUsers = {
  'admin@bottle-trade.de': {
    uid: 'admin-123',
    email: 'admin@bottle-trade.de',
    password: 'emma',
    username: 'admin',
    firstName: 'Marc',
    lastName: 'Langebeck',
    street: 'Moltkestraße 41',
    zipCode: '24105',
    city: 'Kiel',
    isAdmin: true,
    profilePublic: true,
    newsletter: true,
    adFree: true,
    wishlist: true
  },
  'test@bottle-trade.de': {
    uid: 'test-456',
    email: 'test@bottle-trade.de',
    password: 'test123',
    username: 'testuser',
    firstName: 'Max',
    lastName: 'Mustermann',
    street: 'Musterstraße 123',
    zipCode: '12345',
    city: 'Musterstadt',
    isAdmin: false,
    profilePublic: true,
    newsletter: true,
    adFree: false,
    wishlist: false
  },
  'weinliebhaber': {
    uid: 'user-789',
    email: 'weinliebhaber@example.com',
    password: 'wein123',
    username: 'weinliebhaber',
    firstName: 'Anna',
    lastName: 'Weinberg',
    street: 'Weinbergstraße 42',
    zipCode: '54321',
    city: 'Weinheim',
    isAdmin: false,
    profilePublic: true,
    newsletter: true,
    adFree: false,
    wishlist: false
  }
};

// Beim ersten Import sicherstellen, dass Test-User existieren
// DEAKTIVIERT: Nur noch Registrierung über RegisterScreen erlaubt
// ensureTestUsersExist(testUsers);

// ===== TEST AUTHENTICATION FUNCTIONS =====

export const loginUser = async (emailOrUsername, password, rememberMe = false) => {
  try {
    // Suche nur in Firestore
    let user;
    try {
      user = await getUserByEmailOrUsername(emailOrUsername);
    } catch (firestoreError) {
      // Prüfe ob es ein Firestore-Verbindungsfehler ist
      if (firestoreError.message && (
        firestoreError.message.includes('Could not reach Cloud Firestore') ||
        firestoreError.message.includes('network') ||
        firestoreError.message.includes('timeout') ||
        firestoreError.message.includes('offline')
      )) {
        console.error('❌ Firestore-Verbindungsfehler:', firestoreError);
        throw new Error('Keine Verbindung zu Firestore. Bitte prüfen Sie Ihre Internetverbindung.');
      }
      // Andere Firestore-Fehler weiterwerfen
      throw firestoreError;
    }
    
    if (!user) {
      throw new Error('Ungültige Anmeldedaten. Bitte prüfen Sie E-Mail/Username und Passwort.');
    }
    
    // Prüfe Passwort
    if (!user.password || user.password !== password) {
      throw new Error('Ungültige Anmeldedaten. Bitte prüfen Sie E-Mail/Username und Passwort.');
    }
    
    // Prüfe ob User aktiviert ist (nur für nicht-Admin-User)
    if (!user.isAdmin) {
      const isActive = user.isActive || user.status === 'active' || false;
      if (!isActive) {
        const status = user.status || 'pending';
        if (status === 'pending') {
          throw new Error('Ihr Konto wurde noch nicht aktiviert. Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.');
        } else if (status === 'confirmed') {
          throw new Error('Ihr Konto wartet noch auf Freischaltung durch einen Admin. Sie erhalten eine E-Mail, sobald Ihr Konto aktiviert wurde.');
        } else {
          throw new Error('Ihr Konto ist derzeit nicht aktiv. Bitte kontaktieren Sie den Support.');
        }
      }
    }
    
    // Aktuellen User setzen (nur für Session-Management)
    currentLoggedInUser = user;
    
    // Session in AsyncStorage speichern, wenn "Remember Me" aktiviert ist
    if (rememberMe) {
      try {
        await AsyncStorage.setItem('bottle-trade-session', JSON.stringify({
          userId: user.uid,
          email: user.email,
          timestamp: Date.now()
        }));
        console.log('✅ Session gespeichert für Auto-Login');
      } catch (storageError) {
        console.error('⚠️ Fehler beim Speichern der Session:', storageError);
        // Fehler beim Speichern ist nicht kritisch, Login funktioniert trotzdem
      }
    }
    
    // User-Profil aus Firestore zurückgeben
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: true,
      profile: user
    };
    
  } catch (error) {
    console.error('❌ Error logging in user:', error);
    // Wenn es bereits eine benutzerfreundliche Fehlermeldung ist, weiterwerfen
    if (error.message && (
      error.message.includes('Keine Verbindung') ||
      error.message.includes('Ungültige Anmeldedaten') ||
      error.message.includes('noch nicht aktiviert') ||
      error.message.includes('wartet noch auf Freischaltung') ||
      error.message.includes('nicht aktiv')
    )) {
      throw error;
    }
    // Sonst generische Fehlermeldung
    throw new Error('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  }
};

export const registerUser = async (email, password, userData) => {
  try {
    // Prüfe in Firestore ob User bereits existiert
    const existingUser = await getUserByEmailOrUsername(email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Prüfe auch Username in Firestore
    if (userData.username) {
      const existingUsername = await getUserByEmailOrUsername(userData.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }
    
    // Generiere Bestätigungs-Token
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';
      for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    };
    const confirmationToken = generateToken();
    
    // Bestätigungs-URL erstellen (Deep Link zur App)
    const { BACKEND_API_URL } = require('../config/api');
    // Deep Link zur App (funktioniert auf iOS und Android)
    const confirmationUrl = `bottletrade://confirm-email?token=${confirmationToken}`;
    // Fallback: Web-URL (falls Deep Link nicht funktioniert)
    const webConfirmationUrl = `https://bottle-trade.de/confirm?token=${confirmationToken}`;
    
    // Neuen User erstellen (Status: pending, E-Mail nicht bestätigt)
    const newUser = {
      uid: `user-${Date.now()}`,
      email: email,
      password: password,
      ...userData,
      isAdmin: false,
      profilePublic: true,
      newsletter: true,
      adFree: false,
      wishlist: false,
      status: 'pending', // pending -> confirmed -> active
      emailConfirmed: false,
      emailConfirmationToken: confirmationToken,
      isActive: false // Wird vom Admin aktiviert
    };
    
    // User-Profil in Firestore erstellen
    const userId = await createUser(newUser);
    
    // KEIN automatischer Login nach Registrierung - User muss erst E-Mail bestätigen und Admin muss freischalten
    // currentLoggedInUser = null;
    
    // E-Mails senden (über Backend API)
    try {
      const axios = require('axios').default;
      const { BACKEND_API_URL } = require('../config/api');
      
      // 1. Bestätigungs-E-Mail an User senden
      console.log(`📤 [APP] Sende Registrierungs-E-Mail-Request an: ${BACKEND_API_URL}/auth/send-registration-email`);
      const emailStartTime = Date.now();
      await axios.post(`${BACKEND_API_URL}/auth/send-registration-email`, {
        userEmail: email,
        username: userData.username || email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        confirmationToken: confirmationToken,
        confirmationUrl: confirmationUrl, // Deep Link zur App
        webConfirmationUrl: webConfirmationUrl // Fallback Web-URL
      }, {
        timeout: 10000 // 10 Sekunden Timeout (sollte ausreichen, da Backend sofort antwortet)
      }).catch(err => {
        if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
          console.warn('⚠️ Backend-API nicht erreichbar. E-Mail wird nicht gesendet. Backend muss gestartet werden:');
          console.warn(`   cd backend-api && uvicorn main:app --reload --host 0.0.0.0 --port 8000`);
          console.warn(`   Oder prüfe BACKEND_API_URL in config/api.js (aktuell: ${BACKEND_API_URL})`);
        } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
          console.warn('⚠️ Timeout beim Senden der Registrierungs-E-Mail. E-Mail wird trotzdem im Hintergrund versendet.');
        } else {
          console.error('⚠️ Fehler beim Senden der Registrierungs-E-Mail:', err.message || err);
        }
        // Fehler nicht weiterwerfen, damit Registrierung nicht fehlschlägt
        // User wurde bereits erstellt, E-Mail kann später manuell gesendet werden
      });
      
      // 2. Benachrichtigung an Admin senden
      console.log(`📤 [APP] Sende Admin-Benachrichtigungs-Request an: ${BACKEND_API_URL}/auth/notify-admin-new-user`);
      const adminStartTime = Date.now();
      await axios.post(`${BACKEND_API_URL}/auth/notify-admin-new-user`, {
        userEmail: email,
        username: userData.username || email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || ''
      }, {
        timeout: 10000 // 10 Sekunden Timeout (sollte ausreichen, da Backend sofort antwortet)
      }).then(response => {
        const adminDuration = Date.now() - adminStartTime;
        console.log(`✅ [APP] Admin-Benachrichtigungs-Request erfolgreich (Dauer: ${adminDuration}ms):`, response.data);
      }).catch(err => {
        const adminDuration = Date.now() - adminStartTime;
        console.error(`❌ [APP] Admin-Benachrichtigungs-Request fehlgeschlagen (Dauer: ${adminDuration}ms):`, err.message || err);
        if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
          console.warn('⚠️ Backend-API nicht erreichbar. Admin-Benachrichtigung wird nicht gesendet.');
        } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
          console.warn('⚠️ Timeout beim Senden der Admin-Benachrichtigung. E-Mail wird trotzdem im Hintergrund versendet.');
        } else {
          console.error('⚠️ Fehler beim Benachrichtigen des Admins:', err.message || err);
        }
        // Fehler nicht weiterwerfen
      });
      
    } catch (emailError) {
      console.error('⚠️ Fehler beim Senden der E-Mails:', emailError);
      // Fehler nicht weiterwerfen, damit Registrierung nicht fehlschlägt
      // Aber: User wurde bereits erstellt, also müssen wir die Registrierung als erfolgreich betrachten
    }
    
    // Admins über neue Registrierung benachrichtigen (in-App Notification)
    notifyAdminsAboutNewRegistration(newUser.uid, newUser.username, newUser.email)
      .catch(error => {
        console.error('⚠️ Fehler beim Benachrichtigen der Admins (Notification):', error);
        // Fehler wird ignoriert
      });
    
    return {
      uid: newUser.uid,
      email: newUser.email,
      emailVerified: false, // E-Mail noch nicht bestätigt
      profileId: userId,
      status: 'pending'
    };
    
  } catch (error) {
    console.error('❌ Error registering user:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    // Aktuellen User zurücksetzen
    currentLoggedInUser = null;
    
    // Session aus AsyncStorage löschen
    try {
      await AsyncStorage.removeItem('bottle-trade-session');
      console.log('✅ Session gelöscht');
    } catch (storageError) {
      console.error('⚠️ Fehler beim Löschen der Session:', storageError);
      // Fehler beim Löschen ist nicht kritisch
    }
  } catch (error) {
    console.error('❌ Error logging out user:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  // Gibt den aktuell eingeloggten User zurück
  return currentLoggedInUser;
};

// Funktion zum Aktualisieren des aktuellen Users (für Echtzeit-Updates)
export const updateCurrentUser = (updatedUserData) => {
  if (currentLoggedInUser) {
    currentLoggedInUser = {
      ...currentLoggedInUser,
      ...updatedUserData
    };
      console.log('✅ currentLoggedInUser aktualisiert');
  }
};

export const onAuthStateChange = (callback) => {
  // Simuliert Auth State Change (wird von App.js verwaltet)
  return () => {};
};

// ===== AUTH STATE MANAGEMENT =====

export const getAuthState = () => {
  // Simuliert Auth State (wird von App.js verwaltet)
  return {
    isLoggedIn: false,
    user: null
  };
};

// ===== EMAIL VERIFICATION =====

export const sendEmailVerification = async () => {
  try {
    console.log('🔄 Test email verification sent');
    console.log('✅ Test email verification sent');
  } catch (error) {
    console.error('❌ Error sending email verification:', error);
    throw error;
  }
};

// ===== PASSWORD RESET =====

export const sendPasswordReset = async (email) => {
  try {
    console.log('🔄 Test password reset email sent to:', email);
    console.log('✅ Test password reset email sent');
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

// ===== AUTO-LOGIN / SESSION RESTORATION =====

/**
 * Prüft, ob eine gespeicherte Session existiert und loggt den User automatisch ein
 * @returns {Promise<Object|null>} User-Objekt wenn Session gefunden, sonst null
 */
export const restoreSession = async () => {
  try {
    const sessionData = await AsyncStorage.getItem('bottle-trade-session');
    if (!sessionData) {
      console.log('ℹ️ Keine gespeicherte Session gefunden');
      return null;
    }

    const session = JSON.parse(sessionData);
    const { userId, timestamp } = session;

    // Prüfe ob Session zu alt ist (optional: z.B. 30 Tage)
    const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 Tage in Millisekunden
    if (Date.now() - timestamp > SESSION_MAX_AGE) {
      console.log('ℹ️ Session abgelaufen, lösche gespeicherte Session');
      await AsyncStorage.removeItem('bottle-trade-session');
      return null;
    }

    // Lade User-Daten aus Firestore
    const user = await getUser(userId);
    if (!user) {
      console.log('⚠️ User nicht mehr in Firestore gefunden, lösche Session');
      await AsyncStorage.removeItem('bottle-trade-session');
      return null;
    }

    // Setze aktuellen User
    currentLoggedInUser = user;
    console.log('✅ Session wiederhergestellt für:', user.email);

    return {
      uid: user.uid,
      email: user.email,
      emailVerified: true,
      profile: user
    };
  } catch (error) {
    console.error('❌ Fehler beim Wiederherstellen der Session:', error);
    // Bei Fehler Session löschen
    try {
      await AsyncStorage.removeItem('bottle-trade-session');
    } catch {}
    return null;
  }
};


