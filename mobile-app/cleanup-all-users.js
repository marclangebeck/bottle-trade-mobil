// Script zum Löschen aller Test-User und Weine
const admin = require('firebase-admin');

// Firebase Admin SDK initialisieren
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'bottle-trade-app'
  });
}

const db = admin.firestore();

async function cleanupAllUsers() {
  try {
    console.log('🔄 Starte Bereinigung aller Test-User...');

    // Alle User löschen
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Gefundene User: ${usersSnapshot.size}`);
    
    const batch = db.batch();
    usersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (usersSnapshot.size > 0) {
      await batch.commit();
      console.log(`✅ ${usersSnapshot.size} User gelöscht`);
    }

    // Alle Weine löschen
    const winesSnapshot = await db.collection('wines').get();
    console.log(`📊 Gefundene Weine: ${winesSnapshot.size}`);
    
    const wineBatch = db.batch();
    winesSnapshot.docs.forEach(doc => {
      wineBatch.delete(doc.ref);
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


