// Script zum Löschen aller Test-User über Firebase Web-SDK
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

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

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupAllUsers() {
  try {
    console.log('🔄 Starte Bereinigung aller Test-User...');

    // Alle User löschen
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Gefundene User: ${usersSnapshot.size}`);
    
    const batch = writeBatch(db);
    usersSnapshot.docs.forEach(docSnapshot => {
      batch.delete(doc(db, 'users', docSnapshot.id));
    });
    
    if (usersSnapshot.size > 0) {
      await batch.commit();
      console.log(`✅ ${usersSnapshot.size} User gelöscht`);
    }

    // Alle Weine löschen
    const winesSnapshot = await getDocs(collection(db, 'wines'));
    console.log(`📊 Gefundene Weine: ${winesSnapshot.size}`);
    
    const wineBatch = writeBatch(db);
    winesSnapshot.docs.forEach(docSnapshot => {
      wineBatch.delete(doc(db, 'wines', docSnapshot.id));
    });
    
    if (winesSnapshot.size > 0) {
      await wineBatch.commit();
      console.log(`✅ ${winesSnapshot.size} Weine gelöscht`);
    }

    console.log('✅ Bereinigung abgeschlossen!');
    console.log('📝 Du kannst jetzt einen neuen Test-User erstellen.');

  } catch (error) {
    console.error('❌ Fehler bei der Bereinigung:', error);
  }
}

cleanupAllUsers();


