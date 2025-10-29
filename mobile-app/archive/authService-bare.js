// Bare React Native Firebase Auth Service
import auth from '@react-native-firebase/auth';
import { createUser, getUser } from './database-bare';

// ===== AUTHENTICATION FUNCTIONS =====

export const registerUser = async (email, password, userData) => {
  try {
    console.log('🔄 Registering user:', email);
    
    // Firebase Auth User erstellen
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log('✅ Firebase Auth user created:', user.uid);
    
    // Email-Verifizierung senden
    await user.sendEmailVerification();
    console.log('✅ Email verification sent');
    
    // User-Profil in Firestore erstellen
    const userId = await createUser({
      ...userData,
      email: user.email,
      uid: user.uid,
      emailVerified: user.emailVerified
    });
    
    console.log('✅ User profile created in Firestore:', userId);
    
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      profileId: userId
    };
    
  } catch (error) {
    console.error('❌ Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log('🔄 Logging in user:', email);
    
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log('✅ User logged in:', user.uid);
    
    // User-Profil aus Firestore laden
    const userProfile = await getUser(user.uid);
    
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      profile: userProfile
    };
    
  } catch (error) {
    console.error('❌ Error logging in user:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    console.log('🔄 Logging out user');
    await auth().signOut();
    console.log('✅ User logged out');
  } catch (error) {
    console.error('❌ Error logging out user:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth().currentUser;
};

export const onAuthStateChange = (callback) => {
  return auth().onAuthStateChanged(callback);
};

// ===== AUTH STATE MANAGEMENT =====

export const getAuthState = () => {
  const user = auth().currentUser;
  return {
    isLoggedIn: !!user,
    user: user ? {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    } : null
  };
};

// ===== EMAIL VERIFICATION =====

export const sendEmailVerification = async () => {
  try {
    const user = auth().currentUser;
    if (user) {
      console.log('🔄 Sending email verification');
      await user.sendEmailVerification();
      console.log('✅ Email verification sent');
    } else {
      throw new Error('No user logged in');
    }
  } catch (error) {
    console.error('❌ Error sending email verification:', error);
    throw error;
  }
};

// ===== PASSWORD RESET =====

export const sendPasswordReset = async (email) => {
  try {
    console.log('🔄 Sending password reset email to:', email);
    await auth().sendPasswordResetEmail(email);
    console.log('✅ Password reset email sent');
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};
