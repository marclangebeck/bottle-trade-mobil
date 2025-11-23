// Einfaches Löschskript für alle Daten außer Admin
// Nutzung: Im Browser-Konsole oder als Admin-Funktion importieren

import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase-web.js';

const ADMIN_UID = 'admin-123'; // Admin UID

export const cleanupDatabase = async () => {
  const results = {
    users: 0,
    chats: 0,
    wines: 0,
    tradeRequests: 0,
    notifications: 0
  };
  
  try {
    console.log('🗑️ Starte Datenbereinigung (behalte nur Admin)...');
    
    // 1. Lösche alle User außer Admin
    console.log('📝 Lösche User...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersBatch = writeBatch(db);
    let userCount = 0;
    
    usersSnapshot.forEach(userDoc => {
      const userData = userDoc.data();
      if (userData.uid !== ADMIN_UID) {
        usersBatch.delete(doc(db, 'users', userDoc.id));
        userCount++;
      }
    });
    if (userCount > 0) {
      await usersBatch.commit();
      results.users = userCount;
      console.log(`✅ ${userCount} User gelöscht`);
    }
    
    // 2. Lösche alle Chats
    console.log('💬 Lösche Chats...');
    const chatsSnapshot = await getDocs(collection(db, 'chats'));
    const chatsBatch = writeBatch(db);
    let chatCount = 0;
    
    chatsSnapshot.forEach(chatDoc => {
      chatsBatch.delete(doc(db, 'chats', chatDoc.id));
      chatCount++;
    });
    if (chatCount > 0) {
      await chatsBatch.commit();
      results.chats = chatCount;
      console.log(`✅ ${chatCount} Chats gelöscht`);
    }
    
    // 3. Lösche alle Weine
    console.log('🍷 Lösche Weine...');
    const winesSnapshot = await getDocs(collection(db, 'wines'));
    const winesBatch = writeBatch(db);
    let wineCount = 0;
    
    winesSnapshot.forEach(wineDoc => {
      winesBatch.delete(doc(db, 'wines', wineDoc.id));
      wineCount++;
    });
    if (wineCount > 0) {
      await winesBatch.commit();
      results.wines = wineCount;
      console.log(`✅ ${wineCount} Weine gelöscht`);
    }
    
    // 4. Lösche alle Trade Requests
    console.log('🔄 Lösche Trade Requests...');
    const tradeRequestsSnapshot = await getDocs(collection(db, 'tradeRequests'));
    const tradeRequestsBatch = writeBatch(db);
    let tradeRequestCount = 0;
    
    tradeRequestsSnapshot.forEach(tradeDoc => {
      tradeRequestsBatch.delete(doc(db, 'tradeRequests', tradeDoc.id));
      tradeRequestCount++;
    });
    if (tradeRequestCount > 0) {
      await tradeRequestsBatch.commit();
      results.tradeRequests = tradeRequestCount;
      console.log(`✅ ${tradeRequestCount} Trade Requests gelöscht`);
    }
    
    // 5. Lösche alle Notifications (auch für Admin)
    console.log('🔔 Lösche Notifications...');
    const allUsersSnapshot = await getDocs(collection(db, 'users'));
    let notificationCount = 0;
    
    for (const userDoc of allUsersSnapshot.docs) {
      try {
        const notificationsSnapshot = await getDocs(
          collection(db, 'users', userDoc.id, 'notifications')
        );
        const notifBatch = writeBatch(db);
        let userNotifCount = 0;
        
        notificationsSnapshot.forEach(notifDoc => {
          notifBatch.delete(doc(db, 'users', userDoc.id, 'notifications', notifDoc.id));
          userNotifCount++;
        });
        
        if (userNotifCount > 0) {
          await notifBatch.commit();
          notificationCount += userNotifCount;
        }
      } catch (error) {
        console.warn(`⚠️ Fehler beim Löschen von Notifications für User ${userDoc.id}:`, error);
      }
    }
    
    results.notifications = notificationCount;
    if (notificationCount > 0) {
      console.log(`✅ ${notificationCount} Notifications gelöscht`);
    }
    
    console.log('\n✅ Bereinigung abgeschlossen!');
    console.log('📊 Zusammenfassung:', results);
    
    return results;
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    throw error;
  }
};

// Für Browser-Konsole: window.cleanupDatabase = cleanupDatabase;










