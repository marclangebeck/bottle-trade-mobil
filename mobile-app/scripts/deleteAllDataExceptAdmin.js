// Skript zum Löschen aller Daten außer Admin-Account
// Verwende dieses Skript mit: node mobile-app/scripts/deleteAllDataExceptAdmin.js
// ODER importiere es und rufe deleteAllDataExceptAdmin() auf

import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase-web.js';

const ADMIN_UID = 'admin-123'; // Admin UID aus testAuth.js

export const deleteAllDataExceptAdmin = async () => {
  try {
    console.log('🗑️ Starte Löschvorgang - behalte nur Admin-Account:', ADMIN_UID);
    
    // 1. Lösche alle User außer Admin
    console.log('📝 Lösche alle User außer Admin...');
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    let deletedUsers = 0;
    
    const batch1 = writeBatch(db);
    usersSnapshot.forEach(userDoc => {
      const userData = userDoc.data();
      if (userData.uid !== ADMIN_UID) {
        batch1.delete(doc(db, 'users', userDoc.id));
        deletedUsers++;
      }
    });
    if (deletedUsers > 0) {
      await batch1.commit();
      console.log(`✅ ${deletedUsers} User gelöscht`);
    } else {
      console.log('ℹ️ Keine User zu löschen');
    }
    
    // 2. Lösche alle Chats (auch Hinweise)
    console.log('💬 Lösche alle Chats...');
    const chatsQuery = query(collection(db, 'chats'));
    const chatsSnapshot = await getDocs(chatsQuery);
    let deletedChats = 0;
    
    const batch2 = writeBatch(db);
    chatsSnapshot.forEach(chatDoc => {
      batch2.delete(doc(db, 'chats', chatDoc.id));
      deletedChats++;
    });
    if (deletedChats > 0) {
      await batch2.commit();
      console.log(`✅ ${deletedChats} Chats/Hinweise gelöscht`);
    } else {
      console.log('ℹ️ Keine Chats zu löschen');
    }
    
    // 3. Lösche alle Weine
    console.log('🍷 Lösche alle Weine...');
    const winesQuery = query(collection(db, 'wines'));
    const winesSnapshot = await getDocs(winesQuery);
    let deletedWines = 0;
    
    const batch3 = writeBatch(db);
    winesSnapshot.forEach(wineDoc => {
      batch3.delete(doc(db, 'wines', wineDoc.id));
      deletedWines++;
    });
    if (deletedWines > 0) {
      await batch3.commit();
      console.log(`✅ ${deletedWines} Weine gelöscht`);
    } else {
      console.log('ℹ️ Keine Weine zu löschen');
    }
    
    // 4. Lösche alle Trade Requests
    console.log('🔄 Lösche alle Trade Requests...');
    const tradeRequestsQuery = query(collection(db, 'tradeRequests'));
    const tradeRequestsSnapshot = await getDocs(tradeRequestsQuery);
    let deletedTradeRequests = 0;
    
    const batch4 = writeBatch(db);
    tradeRequestsSnapshot.forEach(tradeDoc => {
      batch4.delete(doc(db, 'tradeRequests', tradeDoc.id));
      deletedTradeRequests++;
    });
    if (deletedTradeRequests > 0) {
      await batch4.commit();
      console.log(`✅ ${deletedTradeRequests} Trade Requests gelöscht`);
    } else {
      console.log('ℹ️ Keine Trade Requests zu löschen');
    }
    
    // 5. Lösche alle Notifications (für alle User, auch Admin)
    console.log('🔔 Lösche alle Notifications...');
    const usersQuery2 = query(collection(db, 'users'));
    const usersSnapshot2 = await getDocs(usersQuery2);
    let deletedNotifications = 0;
    
    for (const userDoc of usersSnapshot2.docs) {
      const userData = userDoc.data();
      // Auch Admin-Notifications löschen für sauberen Start
      const notificationsQuery = query(
        collection(db, 'users', userDoc.id, 'notifications')
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      const batch5 = writeBatch(db);
      notificationsSnapshot.forEach(notifDoc => {
        batch5.delete(doc(db, 'users', userDoc.id, 'notifications', notifDoc.id));
        deletedNotifications++;
      });
      if (notificationsSnapshot.size > 0) {
        await batch5.commit();
      }
    }
    
    if (deletedNotifications > 0) {
      console.log(`✅ ${deletedNotifications} Notifications gelöscht`);
    } else {
      console.log('ℹ️ Keine Notifications zu löschen');
    }
    
    console.log('\n✅ Löschvorgang abgeschlossen!');
    console.log(`📊 Zusammenfassung:`);
    console.log(`   - User gelöscht: ${deletedUsers}`);
    console.log(`   - Chats gelöscht: ${deletedChats}`);
    console.log(`   - Weine gelöscht: ${deletedWines}`);
    console.log(`   - Trade Requests gelöscht: ${deletedTradeRequests}`);
    console.log(`   - Notifications gelöscht: ${deletedNotifications}`);
    console.log(`\n✅ Admin-Account (${ADMIN_UID}) wurde beibehalten`);
    
    return {
      deletedUsers,
      deletedChats,
      deletedWines,
      deletedTradeRequests,
      deletedNotifications
    };
    
  } catch (error) {
    console.error('❌ Fehler beim Löschen:', error);
    throw error;
  }
};

// Falls direkt aufgerufen (nicht als Import)
if (import.meta.url === `file://${process.argv[1]}`) {
  deleteAllDataExceptAdmin()
    .then(() => {
      console.log('✅ Script erfolgreich abgeschlossen');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script fehlgeschlagen:', error);
      process.exit(1);
    });
}










