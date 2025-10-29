// Bare React Native Firebase Konfiguration
import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase App initialisieren (automatisch mit google-services.json)
const app = initializeApp();

// Services exportieren
export const db = firestore();
export const authService = auth();

export default app;
