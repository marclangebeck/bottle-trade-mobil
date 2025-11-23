// Test-Auth Service (simuliert Authentication ohne Firebase Auth)
import { createUser, getUser, getUserByEmailOrUsername } from './database-web';

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
    btp: 1000,
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
    btp: 50,
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
    btp: 100,
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

export const loginUser = async (emailOrUsername, password) => {
  try {
    // Suche nur in Firestore
    const user = await getUserByEmailOrUsername(emailOrUsername);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Prüfe Passwort
    if (!user.password || user.password !== password) {
      throw new Error('Invalid credentials');
    }
    
    // Aktuellen User setzen (nur für Session-Management)
    currentLoggedInUser = user;
    
    // User-Profil aus Firestore zurückgeben
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: true,
      profile: user
    };
    
  } catch (error) {
    console.error('❌ Error logging in user:', error);
    throw error;
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
      btp: 20, // Start-BTP
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
  } catch (error) {
    console.error('❌ Error logging out user:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  // Gibt den aktuell eingeloggten User zurück
  return currentLoggedInUser;
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


