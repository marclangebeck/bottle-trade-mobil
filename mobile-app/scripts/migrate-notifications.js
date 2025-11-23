#!/usr/bin/env node

/**
 * Migration-Skript für Notifications (Phase 3)
 * 
 * Migriert bestehende Notifications:
 * 1. Alte Typen → Neue Typen
 * 2. Fügt isArchived und isCompleted Felder hinzu
 * 
 * WICHTIG: Dieses Skript ist OPTIONAL und sollte nur ausgeführt werden,
 * wenn bestehende Notifications migriert werden sollen.
 * 
 * Neue Notifications haben bereits die neuen Felder (durch createNotification).
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDK initialisieren
// WICHTIG: Service Account Key muss vorhanden sein
const serviceAccount = require(path.join(__dirname, '../../firebase-service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Migriert eine einzelne Notification
 */
async function migrateNotification(userId, notificationId, notificationData) {
  const updates = {};
  let needsUpdate = false;

  // 1. Typ-Migration
  if (notificationData.type === 'trade') {
    // Prüfe ob es für Empfänger (B) ist → hint-decision
    // Oder für Absender (A) ist → hint-small
    // Standard: hint-decision (für Empfänger)
    updates.type = 'hint-decision';
    needsUpdate = true;
  } else if (notificationData.type === 'trade-info') {
    updates.type = 'hint-small';
    needsUpdate = true;
  } else if (notificationData.type === 'message') {
    updates.type = 'chat';
    needsUpdate = true;
  }

  // 2. Neue Felder hinzufügen (wenn nicht vorhanden)
  if (notificationData.isArchived === undefined) {
    updates.isArchived = false;
    needsUpdate = true;
  }
  
  if (notificationData.isCompleted === undefined) {
    updates.isCompleted = false;
    needsUpdate = true;
  }

  if (needsUpdate) {
    await db.collection('users').doc(userId)
      .collection('notifications').doc(notificationId)
      .update(updates);
    
    console.log(`✅ Migriert: ${userId}/notifications/${notificationId}`, updates);
    return true;
  }

  return false;
}

/**
 * Migriert alle Notifications für einen User
 */
async function migrateUserNotifications(userId) {
  console.log(`\n🔄 Migriere Notifications für User: ${userId}`);
  
  const notificationsRef = db.collection('users').doc(userId)
    .collection('notifications');
  
  const snapshot = await notificationsRef.get();
  
  if (snapshot.empty) {
    console.log(`ℹ️ Keine Notifications für User ${userId}`);
    return { migrated: 0, total: 0 };
  }

  let migrated = 0;
  const batch = db.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500; // Firestore Batch-Limit

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // Typ-Migration
    if (data.type === 'trade') {
      updates.type = 'hint-decision';
      needsUpdate = true;
    } else if (data.type === 'trade-info') {
      updates.type = 'hint-small';
      needsUpdate = true;
    } else if (data.type === 'message') {
      updates.type = 'chat';
      needsUpdate = true;
    }

    // Neue Felder
    if (data.isArchived === undefined) {
      updates.isArchived = false;
      needsUpdate = true;
    }
    
    if (data.isCompleted === undefined) {
      updates.isCompleted = false;
      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(doc.ref, updates);
      batchCount++;
      migrated++;

      // Firestore Batch-Limit: Max 500 Operationen
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`✅ Batch committed: ${batchCount} Notifications`);
        batchCount = 0;
      }
    }
  }

  // Restliche Batches committen
  if (batchCount > 0) {
    await batch.commit();
    console.log(`✅ Final batch committed: ${batchCount} Notifications`);
  }

  console.log(`✅ Migriert: ${migrated}/${snapshot.size} Notifications für User ${userId}`);
  return { migrated, total: snapshot.size };
}

/**
 * Migriert alle Notifications für alle User
 */
async function migrateAllNotifications() {
  console.log('🚀 Starte Migration aller Notifications...\n');

  const usersRef = db.collection('users');
  const usersSnapshot = await usersRef.get();

  if (usersSnapshot.empty) {
    console.log('ℹ️ Keine User gefunden');
    return;
  }

  let totalMigrated = 0;
  let totalNotifications = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const result = await migrateUserNotifications(userId);
    totalMigrated += result.migrated;
    totalNotifications += result.total;
  }

  console.log('\n=== Migration abgeschlossen ===');
  console.log(`✅ Migriert: ${totalMigrated}/${totalNotifications} Notifications`);
  console.log(`📊 User: ${usersSnapshot.size}`);
}

// CLI-Interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  node migrate-notifications.js --all          # Migriert alle Notifications');
  console.log('  node migrate-notifications.js --user <id>    # Migriert Notifications für einen User');
  console.log('');
  console.log('⚠️  WICHTIG: Service Account Key muss vorhanden sein!');
  process.exit(1);
}

if (args[0] === '--all') {
  migrateAllNotifications()
    .then(() => {
      console.log('\n✅ Migration erfolgreich abgeschlossen');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fehler bei Migration:', error);
      process.exit(1);
    });
} else if (args[0] === '--user' && args[1]) {
  migrateUserNotifications(args[1])
    .then(() => {
      console.log('\n✅ Migration erfolgreich abgeschlossen');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fehler bei Migration:', error);
      process.exit(1);
    });
} else {
  console.error('❌ Ungültige Argumente');
  process.exit(1);
}

