// Test React Native Firebase-Konfiguration
import { initializeApp } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

console.log('Testing React Native Firebase initialization...');

try {
  // Firebase initialisieren
  const app = initializeApp();
  console.log('✅ Firebase app initialized successfully');
  
  // Services testen
  const db = firestore();
  console.log('✅ Firestore initialized successfully');
  
  const authService = auth();
  console.log('✅ Auth initialized successfully');
  
  const storageService = storage();
  console.log('✅ Storage initialized successfully');
  
  console.log('🎉 React Native Firebase working!');
  
  // Export nur wenn erfolgreich
  module.exports = { app, db, auth: authService, storage: storageService };
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Export leere Objekte bei Fehler
  module.exports = { app: null, db: null, auth: null, storage: null };
}
