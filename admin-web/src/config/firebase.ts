// Firebase Web-SDK Konfiguration für Admin-Web
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase-Konfiguration (gleiche wie in der App)
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
  console.log('✅ Firebase app initialized');
} else {
  app = getApps()[0];
  console.log('✅ Firebase app already initialized');
}

// Services exportieren
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;











