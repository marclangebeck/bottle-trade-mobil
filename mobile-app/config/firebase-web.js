// Firebase Web-SDK Konfiguration für React Native (Firestore + Storage)
// HINWEIS: Firebase Auth wird nicht verwendet, da die App ein Test-Auth-System verwendet
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// import { getAuth } from 'firebase/auth'; // Nicht verwendet - App nutzt Test-Auth-System

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyC-bnVaESKpnGnT6KixdGV8sAIKbwN3_FQ",
  authDomain: "bottle-trade-app.firebaseapp.com",
  projectId: "bottle-trade-app",
  storageBucket: "bottle-trade-app.firebasestorage.app",
  messagingSenderId: "114096417958",
  appId: "1:114096417958:web:4b9f9868342a3e9b2f5867",
  measurementId: "G-14EFSBKCVN"
};

// Firebase nur einmal initialisieren
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized (Firestore only)');
} else {
  app = getApps()[0];
  console.log('✅ Firebase app already initialized');
}

// WICHTIG: Prüfe ob app korrekt initialisiert wurde
if (!app) {
  console.error('❌ Firebase app initialization failed!');
  throw new Error('Firebase app initialization failed');
}

// Services exportieren (nur Firestore und Storage)
// Firebase Auth wird nicht verwendet, da die App ein Test-Auth-System verwendet
// WICHTIG: Verwende const statt let, um sicherzustellen, dass db sofort initialisiert wird
export const db = getFirestore(app);
export const storage = getStorage(app);

// WICHTIG: Prüfe ob db korrekt initialisiert wurde
if (!db) {
  console.error('❌ Firestore db initialization failed!');
  throw new Error('Firestore db initialization failed');
}

console.log('✅ Firestore db initialized successfully');
// export const auth = getAuth(app); // Nicht verwendet - App nutzt Test-Auth-System

export default app;
