// Temporäres Skript zum Löschen aller Chats zwischen zwei Usern
// Verwende diese Funktion im Browser-Konsole oder als Admin-Tool

import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from './config/firebase-web';

export const deleteAllChatsBetweenUsers = async (userId1, userId2) => {
  try {
    console.log('🗑️ Lösche alle Chats zwischen:', userId1, 'und', userId2);
    
    // Suche alle Chats, die beide User als Teilnehmer haben
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId1)
    );
    
    const snapshot = await getDocs(chatsQuery);
    const chatsToDelete = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Prüfe ob beide User Teilnehmer sind
      if (data.participants && Array.isArray(data.participants)) {
        if (data.participants.includes(userId1) && data.participants.includes(userId2)) {
          chatsToDelete.push({ id: doc.id, ...data });
        }
      }
    });
    
    console.log(`✅ Gefunden: ${chatsToDelete.length} Chats zum Löschen`);
    
    // Lösche alle gefundenen Chats
    for (const chat of chatsToDelete) {
      await deleteDoc(doc(db, 'chats', chat.id));
      console.log(`✅ Chat gelöscht: ${chat.id}`);
    }
    
    console.log(`✅ Alle ${chatsToDelete.length} Chats gelöscht`);
    return chatsToDelete.length;
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Chats:', error);
    throw error;
  }
};
