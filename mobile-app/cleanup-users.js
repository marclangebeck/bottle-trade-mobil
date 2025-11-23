// Script zum Bereinigen der User-Datenbank
// Löscht alle "Unbekannt"-User und stellt sicher, dass nur ein Admin-Account existiert

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where, writeBatch, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-bnVaESKpnGnT6KixdGV8sAIKbwN3_FQ",
  authDomain: "bottle-trade-app.firebaseapp.com",
  projectId: "bottle-trade-app",
  storageBucket: "bottle-trade-app.firebasestorage.app",
  messagingSenderId: "114096417958",
  appId: "1:114096417958:web:4b9f9868342a3e9b2f5867",
  measurementId: "G-14EFSBKCVN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupUsers() {
  try {
    console.log('🔄 Starte User-Bereinigung...');
    
    // Lade alle User
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Gefundene User: ${allUsers.length}`);
    
    // Finde Admin-Accounts
    const adminUsers = allUsers.filter(user => user.isAdmin === true);
    console.log(`👑 Gefundene Admin-Accounts: ${adminUsers.length}`);
    
    // Finde "Unbekannt"-User (User ohne Email, ohne Username, oder mit "Unbekannt" im Namen)
    const unknownUsers = allUsers.filter(user => {
      const hasNoEmail = !user.email || user.email.trim() === '';
      const hasNoUsername = !user.username || user.username.trim() === '';
      const isUnknown = user.username?.toLowerCase().includes('unbekannt') || 
                       user.email?.toLowerCase().includes('unbekannt') ||
                       user.firstName?.toLowerCase().includes('unbekannt') ||
                       user.lastName?.toLowerCase().includes('unbekannt');
      
      return hasNoEmail || hasNoUsername || isUnknown;
    });
    
    console.log(`❓ Gefundene "Unbekannt"-User: ${unknownUsers.length}`);
    
    // Finde den richtigen Admin-Account (admin@bottle-trade.de)
    const correctAdmin = adminUsers.find(user => 
      user.email === 'admin@bottle-trade.de' || 
      user.uid === 'admin-123'
    );
    
    if (!correctAdmin) {
      console.warn('⚠️ Kein Admin-Account mit admin@bottle-trade.de gefunden!');
    }
    
    // Liste der zu löschenden User
    const usersToDelete = [];
    
    // 1. Alle "Unbekannt"-User löschen
    unknownUsers.forEach(user => {
      usersToDelete.push(user);
    });
    
    // 2. Alle Admin-Accounts außer dem richtigen löschen
    adminUsers.forEach(user => {
      if (!correctAdmin || user.id !== correctAdmin.id) {
        usersToDelete.push(user);
      }
    });
    
    // 3. Duplikate finden und löschen (gleiche Email oder UID)
    const seenEmails = new Set();
    const seenUids = new Set();
    
    allUsers.forEach(user => {
      // Überspringe bereits markierte User
      if (usersToDelete.find(u => u.id === user.id)) {
        return;
      }
      
      // Überspringe den richtigen Admin
      if (correctAdmin && user.id === correctAdmin.id) {
        return;
      }
      
      // Prüfe auf Duplikate
      if (user.email && seenEmails.has(user.email.toLowerCase())) {
        usersToDelete.push(user);
        return;
      }
      
      if (user.uid && seenUids.has(user.uid)) {
        usersToDelete.push(user);
        return;
      }
      
      if (user.email) {
        seenEmails.add(user.email.toLowerCase());
      }
      if (user.uid) {
        seenUids.add(user.uid);
      }
    });
    
    console.log(`🗑️ Zu löschende User: ${usersToDelete.length}`);
    
    // Stelle sicher, dass der richtige Admin isAdmin=true hat
    if (correctAdmin) {
      const adminRef = doc(db, 'users', correctAdmin.id);
      await updateDoc(adminRef, {
        isAdmin: true,
        email: 'admin@bottle-trade.de',
        username: 'admin'
      });
      console.log('✅ Admin-Account korrigiert:', correctAdmin.id);
    }
    
    // Lösche alle zu löschenden User in Batches
    const batchSize = 500; // Firestore-Limit
    let deletedCount = 0;
    
    for (let i = 0; i < usersToDelete.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUsers = usersToDelete.slice(i, i + batchSize);
      
      batchUsers.forEach(user => {
        batch.delete(doc(db, 'users', user.id));
      });
      
      await batch.commit();
      deletedCount += batchUsers.length;
      console.log(`✅ ${deletedCount}/${usersToDelete.length} User gelöscht`);
    }
    
    // Finale Statistik
    const remainingUsersSnapshot = await getDocs(collection(db, 'users'));
    const remainingUsers = remainingUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const remainingAdmins = remainingUsers.filter(user => user.isAdmin === true);
    
    console.log('\n✅ Bereinigung abgeschlossen!');
    console.log(`📊 Verbleibende User: ${remainingUsers.length}`);
    console.log(`👑 Verbleibende Admin-Accounts: ${remainingAdmins.length}`);
    
    if (remainingAdmins.length > 0) {
      console.log('👑 Admin-Account(s):');
      remainingAdmins.forEach(admin => {
        console.log(`   - ${admin.email || admin.username || admin.id} (${admin.id})`);
      });
    }
    
    if (remainingAdmins.length !== 1) {
      console.warn(`⚠️ WARNUNG: Es gibt ${remainingAdmins.length} Admin-Account(s), erwartet: 1`);
    }
    
  } catch (error) {
    console.error('❌ Fehler bei der Bereinigung:', error);
    throw error;
  }
}

// Script ausführen
cleanupUsers()
  .then(() => {
    console.log('✅ Script erfolgreich abgeschlossen');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script fehlgeschlagen:', error);
    process.exit(1);
  });

