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
      error.message.includes('Ungültige Anmeldedaten')
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
    
    // Neuen User erstellen
    const newUser = {
      uid: `user-${Date.now()}`,
      email: email,
      password: password,
      ...userData,
      isAdmin: false,
      profilePublic: true,
      newsletter: true,
      adFree: false,
      wishlist: false
    };
    
    // User-Profil in Firestore erstellen
    const userId = await createUser(newUser);
    
    // Aktuellen User setzen (automatischer Login nach Registrierung)
    currentLoggedInUser = newUser;
    
    // Admins über neue Registrierung benachrichtigen (asynchron, blockiert nicht die Registrierung)
    notifyAdminsAboutNewRegistration(newUser.uid, newUser.username, newUser.email)
      .catch(error => {
        console.error('⚠️ Fehler beim Benachrichtigen der Admins:', error);
        // Fehler wird ignoriert, damit Registrierung nicht fehlschlägt
      });
    
    return {
      uid: newUser.uid,
      email: newUser.email,
      emailVerified: true,
      profileId: userId
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


