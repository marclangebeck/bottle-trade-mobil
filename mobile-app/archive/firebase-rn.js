// React Native Firebase Konfiguration
import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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

// Firebase App initialisieren
const app = initializeApp(firebaseConfig);

// Services exportieren
export const db = firestore();
export const authService = auth();

export default app;
