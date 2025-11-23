// Script zum Löschen aller Chats und Nachrichten aus Firestore
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

async function cleanupChatsAndMessages() {
  try {
    console.log('🔄 Starte Bereinigung aller Chats und Nachrichten...');

    // Alle Nachrichten löschen
    const messagesSnapshot = await getDocs(collection(db, 'messages'));
    console.log(`📊 Gefundene Nachrichten: ${messagesSnapshot.size}`);
    
    const messageBatch = writeBatch(db);
    let messageCount = 0;
    messagesSnapshot.docs.forEach(docSnapshot => {
      messageBatch.delete(doc(db, 'messages', docSnapshot.id));
      messageCount++;
      // Firestore Batch-Limit: max 500 Operationen
      if (messageCount >= 500) {
        messageBatch.commit();
        messageCount = 0;
      }
    });
    
    if (messageCount > 0) {
      await messageBatch.commit();
    }
    console.log(`✅ ${messagesSnapshot.size} Nachrichten gelöscht`);

    // Alle Chats löschen
    const chatsSnapshot = await getDocs(collection(db, 'chats'));
    console.log(`📊 Gefundene Chats: ${chatsSnapshot.size}`);
    
    const chatBatch = writeBatch(db);
    chatsSnapshot.docs.forEach(docSnapshot => {
      chatBatch.delete(doc(db, 'chats', docSnapshot.id));
    });
    
    if (chatsSnapshot.size > 0) {
      await chatBatch.commit();
      console.log(`✅ ${chatsSnapshot.size} Chats gelöscht`);
    }

    console.log('✅ Bereinigung abgeschlossen!');
    console.log('📝 Hinweis: AsyncStorage muss manuell in der App geleert werden.');

  } catch (error) {
    console.error('❌ Fehler bei der Bereinigung:', error);
    process.exit(1);
  }
}

cleanupChatsAndMessages()
  .then(() => {
    console.log('✅ Script erfolgreich abgeschlossen');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fehler:', error);
    process.exit(1);
  });








