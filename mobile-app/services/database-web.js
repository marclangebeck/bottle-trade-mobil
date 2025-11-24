// Firebase Web-SDK Database Service für React Native (Firestore + Storage)
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase-web';
import { onSnapshot } from 'firebase/firestore';
import { logNotificationEvent } from './notificationLogger';

// WICHTIG: Globale Tracking-Maps für Subscriptions (verhindert Duplikate)
// Diese Maps tracken bekannte Notifications pro User, um zu verhindern, dass existierende Notifications als "neu" erkannt werden
const knownNotificationIdsPerUser = new Map(); // Map<userId, Set<notificationId>>

// ===== USER MANAGEMENT =====

export const createUser = async (userData) => {
  try {
    // Validierung: Stelle sicher, dass alle erforderlichen Felder vorhanden sind
    if (!userData.email || !userData.email.trim()) {
      throw new Error('Email ist erforderlich');
    }
    if (!userData.uid || !userData.uid.trim()) {
      throw new Error('UID ist erforderlich');
    }
    if (!userData.username || !userData.username.trim()) {
      throw new Error('Username ist erforderlich');
    }
    
    // Prüfe, ob User mit dieser UID bereits existiert
    const existingUserQuery = query(collection(db, 'users'), where('uid', '==', userData.uid));
    const existingUserSnapshot = await getDocs(existingUserQuery);
    
    if (!existingUserSnapshot.empty) {
      return existingUserSnapshot.docs[0].id;
    }
    
    // Prüfe, ob User mit dieser Email bereits existiert
    const existingEmailQuery = query(collection(db, 'users'), where('email', '==', userData.email));
    const existingEmailSnapshot = await getDocs(existingEmailQuery);
    
    if (!existingEmailSnapshot.empty) {
      return existingEmailSnapshot.docs[0].id;
    }
    
    const userRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return userRef.id;
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

export const getUser = async (uid) => {
  try {
    const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = { id: userDoc.id, ...userDoc.data() };
    
    return userData;
    
  } catch (error) {
    console.error('❌ Error getting user:', error);
    throw error;
  }
};

// Suche User nach Email oder Username in Firestore
export const getUserByEmailOrUsername = async (emailOrUsername) => {
  try {
    // WICHTIG: Prüfe ob db korrekt initialisiert ist
    if (!db) {
      console.error('❌ Firestore db is not initialized!');
      throw new Error('Firestore db is not initialized');
    }
    
    // Zuerst nach Email suchen
    const emailQuery = query(collection(db, 'users'), where('email', '==', emailOrUsername));
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
      const userDoc = emailSnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    }
    
    // Dann nach Username suchen
    const usernameQuery = query(collection(db, 'users'), where('username', '==', emailOrUsername));
    const usernameSnapshot = await getDocs(usernameQuery);
    
    if (!usernameSnapshot.empty) {
      const userDoc = usernameSnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error getting user by email or username:', error);
    console.error('❌ db value:', db);
    throw error;
  }
};

export const updateUser = async (uid, userData) => {
  try {
    console.log('🔄 Updating user:', uid);
    
    const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), {
      ...userData,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ User updated:', uid);
    return true;
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
};

// Heartbeat: lastActive setzen (und optional online true)
export const updateUserLastActive = async (uid) => {
  try {
    const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(userQuery);
    if (querySnapshot.empty) return false;
    const userDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), {
      lastActive: serverTimestamp(),
      online: true,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('❌ Error updating lastActive:', error);
    return false;
  }
};

// ===== IMAGE UPLOAD =====

/**
 * Prüft, ob eine Bild-URL eine lokale URI ist (nicht in Firebase Storage)
 * @param {string} imageUrl - Bild-URL
 * @returns {boolean} true wenn lokale URI, false wenn Firebase Storage URL oder HTTP-URL
 */
export const isLocalImageUri = (imageUrl) => {
  if (!imageUrl) return false;
  return imageUrl.startsWith('file://') || imageUrl.startsWith('content://') || imageUrl.startsWith('ph://');
};

/**
 * Migriert ein altes lokales Bild zu Firebase Storage
 * @param {string} localUri - Lokale URI des Bildes
 * @param {string} folder - Ordner-Pfad in Storage (z.B. 'wines' oder 'users')
 * @returns {Promise<string|null>} Download-URL des hochgeladenen Bildes oder null falls Migration fehlschlägt
 */
export const migrateLocalImageToStorage = async (localUri, folder = 'wines') => {
  try {
    if (!isLocalImageUri(localUri)) {
      console.log('⚠️ Bild ist keine lokale URI, keine Migration nötig:', localUri);
      return null;
    }
    
    console.log('🔄 Migriere lokales Bild zu Firebase Storage:', localUri.substring(0, 50) + '...');
    
    // Prüfe zuerst, ob die Datei überhaupt noch existiert/erreichbar ist
    try {
      const testResponse = await fetch(localUri, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.warn('⚠️ Lokale Datei nicht mehr verfügbar:', localUri.substring(0, 50) + '...');
        return null;
      }
    } catch (testError) {
      console.warn('⚠️ Lokale Datei nicht erreichbar (möglicherweise gelöscht oder nicht mehr verfügbar):', testError.message);
      return null;
    }
    
    const downloadURL = await uploadImageToStorage(localUri, folder);
    console.log('✅ Bild erfolgreich migriert:', downloadURL);
    return downloadURL;
  } catch (error) {
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes('Network request failed')) {
      console.error('❌ Fehler beim Migrieren: Lokale Datei nicht mehr verfügbar oder Netzwerkfehler');
    } else {
      console.error('❌ Fehler beim Migrieren des Bildes:', errorMessage);
    }
    // Migration fehlgeschlagen - Bild bleibt lokal, wird aber möglicherweise nicht mehr verfügbar sein
    return null;
  }
};

/**
 * Prüft den Migrations-Status aller Weinbilder
 * @param {string} userId - Optional: Nur Weine eines bestimmten Users prüfen
 * @returns {Promise<{total: number, migrated: number, local: number, noImage: number, wines: Array}>} Migrations-Status
 */
export const checkImageMigrationStatus = async (userId = null) => {
  try {
    console.log('🔄 Prüfe Migrations-Status der Weinbilder...');
    
    let winesQuery;
    if (userId) {
      winesQuery = query(
        collection(db, 'wines'),
        where('ownerId', '==', userId)
      );
    } else {
      winesQuery = query(collection(db, 'wines'));
    }
    
    const winesSnapshot = await getDocs(winesQuery);
    const wines = winesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let total = 0;
    let migrated = 0;
    let local = 0;
    let noImage = 0;
    const wineDetails = [];
    
    for (const wine of wines) {
      total++;
      
      if (!wine.labelImage) {
        noImage++;
        wineDetails.push({
          id: wine.id,
          name: wine.name || 'Unbekannt',
          status: 'kein_bild',
          imageUrl: null
        });
        continue;
      }
      
      if (wine.labelImage.startsWith('https://firebasestorage.googleapis.com')) {
        migrated++;
        wineDetails.push({
          id: wine.id,
          name: wine.name || 'Unbekannt',
          status: 'migriert',
          imageUrl: wine.labelImage
        });
      } else if (isLocalImageUri(wine.labelImage)) {
        local++;
        wineDetails.push({
          id: wine.id,
          name: wine.name || 'Unbekannt',
          status: 'lokal',
          imageUrl: wine.labelImage
        });
      } else {
        // Andere URL (z.B. HTTP/HTTPS)
        migrated++;
        wineDetails.push({
          id: wine.id,
          name: wine.name || 'Unbekannt',
          status: 'url',
          imageUrl: wine.labelImage
        });
      }
    }
    
    console.log(`✅ Status-Prüfung abgeschlossen: ${total} Weine, ${migrated} migriert, ${local} lokal, ${noImage} ohne Bild`);
    
    return {
      total,
      migrated,
      local,
      noImage,
      wines: wineDetails
    };
  } catch (error) {
    console.error('❌ Fehler bei der Status-Prüfung:', error);
    throw error;
  }
};

/**
 * Migriert alle Weine mit lokalen Bild-URIs zu Firebase Storage
 * WICHTIG: Diese Funktion sollte nur von einem Admin aufgerufen werden
 * @param {string} userId - Optional: Nur Weine eines bestimmten Users migrieren
 * @returns {Promise<{success: number, failed: number, skipped: number}>} Migrations-Statistiken
 */
export const migrateAllLocalWineImagesToStorage = async (userId = null) => {
  try {
    console.log('🔄 Starte Migration aller lokalen Weinbilder zu Firebase Storage...');
    
    let winesQuery;
    if (userId) {
      winesQuery = query(
        collection(db, 'wines'),
        where('ownerId', '==', userId)
      );
    } else {
      winesQuery = query(collection(db, 'wines'));
    }
    
    const winesSnapshot = await getDocs(winesQuery);
    const wines = winesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const wine of wines) {
      if (!wine.labelImage) {
        skipped++;
        continue;
      }
      
      // Prüfe ob Bild eine lokale URI ist
      if (!isLocalImageUri(wine.labelImage)) {
        skipped++;
        continue;
      }
      
      try {
        // Versuche Bild zu migrieren
        console.log(`🔄 Versuche Wein ${wine.id} (${wine.name}) zu migrieren...`);
        const migratedUrl = await migrateLocalImageToStorage(wine.labelImage, 'wines');
        
        if (migratedUrl) {
          // Aktualisiere Wein mit neuer URL
          await updateDoc(doc(db, 'wines', wine.id), {
            labelImage: migratedUrl,
            updatedAt: serverTimestamp()
          });
          success++;
          console.log(`✅ Wein ${wine.id} (${wine.name}) erfolgreich migriert`);
        } else {
          failed++;
          console.warn(`⚠️ Migration fehlgeschlagen für Wein ${wine.id} (${wine.name}) - Bild konnte nicht hochgeladen werden (lokale Datei möglicherweise nicht mehr verfügbar)`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error.message || error.toString();
        if (errorMessage.includes('Network request failed')) {
          console.error(`❌ Fehler beim Migrieren von Wein ${wine.id} (${wine.name}): Lokale Datei nicht mehr verfügbar oder Netzwerkfehler`);
        } else {
          console.error(`❌ Fehler beim Migrieren von Wein ${wine.id} (${wine.name}):`, errorMessage);
        }
      }
    }
    
    console.log(`✅ Migration abgeschlossen: ${success} erfolgreich, ${failed} fehlgeschlagen, ${skipped} übersprungen`);
    return { success, failed, skipped };
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error);
    throw error;
  }
};

/**
 * Lädt ein Bild zu Firebase Storage hoch
 * @param {string} imageUri - Lokale URI des Bildes (file:// oder http://)
 * @param {string} folder - Ordner-Pfad in Storage (z.B. 'wines' oder 'users')
 * @param {string} fileName - Dateiname (optional, wird automatisch generiert wenn nicht angegeben)
 * @returns {Promise<string>} Download-URL des hochgeladenen Bildes
 */
export const uploadImageToStorage = async (imageUri, folder = 'wines', fileName = null) => {
  try {
    console.log('🔄 Starte Bild-Upload:', imageUri);
    
    // Konvertiere URI zu Blob für React Native
    let blob;
    let contentType = 'image/jpeg'; // Standard Content-Type
    
    if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
      // React Native: Lade Bild als Blob
      const response = await fetch(imageUri);
      blob = await response.blob();
      
      // Bestimme Content-Type aus dem Blob
      if (blob.type) {
        contentType = blob.type;
      } else {
        // Fallback: Bestimme Content-Type aus Dateinamen
        const uriLower = imageUri.toLowerCase();
        if (uriLower.includes('.png')) {
          contentType = 'image/png';
        } else if (uriLower.includes('.jpg') || uriLower.includes('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (uriLower.includes('.webp')) {
          contentType = 'image/webp';
        } else if (uriLower.includes('.gif')) {
          contentType = 'image/gif';
        }
      }
    } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      // Bereits eine URL - lade das Bild herunter und hoch
      const response = await fetch(imageUri);
      blob = await response.blob();
      
      // Bestimme Content-Type aus dem Blob oder Response-Header
      if (blob.type) {
        contentType = blob.type;
      } else {
        const responseContentType = response.headers.get('content-type');
        if (responseContentType) {
          contentType = responseContentType;
        }
      }
    } else {
      // Versuche direkt als Blob zu behandeln
      blob = imageUri;
      if (blob && blob.type) {
        contentType = blob.type;
      }
    }
    
    // Generiere Dateinamen falls nicht angegeben
    if (!fileName) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      
      // Bestimme Dateierweiterung basierend auf Content-Type
      let extension = 'jpg';
      if (contentType.includes('png')) {
        extension = 'png';
      } else if (contentType.includes('webp')) {
        extension = 'webp';
      } else if (contentType.includes('gif')) {
        extension = 'gif';
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        extension = 'jpg';
      }
      
      fileName = `${timestamp}_${randomString}.${extension}`;
    }
    
    // Erstelle Storage-Referenz
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // Erstelle Metadaten-Objekt
    const metadata = {
      contentType: contentType,
    };
    
    // Upload zu Firebase Storage mit Metadaten
    console.log('📤 Upload zu Firebase Storage:', `${folder}/${fileName}`, 'Content-Type:', contentType);
    const snapshot = await uploadBytes(storageRef, blob, metadata);
    
    // Hole Download-URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Bild erfolgreich hochgeladen:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Fehler beim Hochladen des Bildes:', error);
    throw error;
  }
};

/**
 * Löscht ein Bild aus Firebase Storage
 * @param {string} imageUrl - URL des Bildes in Firebase Storage
 * @returns {Promise<void>}
 */
export const deleteImageFromStorage = async (imageUrl) => {
  try {
    // Extrahiere den Pfad aus der URL
    const urlParts = imageUrl.split('/');
    const pathIndex = urlParts.findIndex(part => part === 'o');
    if (pathIndex === -1 || pathIndex >= urlParts.length - 1) {
      console.warn('⚠️ Konnte Storage-Pfad nicht aus URL extrahieren:', imageUrl);
      return;
    }
    
    // Dekodiere den Pfad (URL-encoded)
    const encodedPath = urlParts[pathIndex + 1].split('?')[0];
    const storagePath = decodeURIComponent(encodedPath);
    
    // Erstelle Storage-Referenz und lösche
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log('✅ Bild erfolgreich gelöscht:', storagePath);
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Bildes:', error);
    // Fehler beim Löschen ist nicht kritisch, daher nicht werfen
  }
};

// ===== WINE MANAGEMENT =====

export const addWine = async (wineData) => {
  try {
    console.log('🔄 Adding wine:', wineData.name);
    
    // Prüfe ob ein Bild hochgeladen werden muss
    let labelImageUrl = wineData.labelImage;
    
    // Prüfe ob es eine lokale URI ist (file://, content://, ph://)
    if (wineData.labelImage && isLocalImageUri(wineData.labelImage)) {
      // Bild hochladen zu Firebase Storage
      try {
        labelImageUrl = await uploadImageToStorage(wineData.labelImage, 'wines');
        console.log('✅ Bild erfolgreich hochgeladen:', labelImageUrl);
      } catch (uploadError) {
        console.error('❌ Fehler beim Hochladen des Bildes:', uploadError);
        // Wenn Upload fehlschlägt, verwende die lokale URI als Fallback
        // WICHTIG: Lokale URIs funktionieren nur auf dem ursprünglichen Gerät!
        labelImageUrl = wineData.labelImage;
      }
    }
    // Wenn es bereits eine HTTP/HTTPS URL ist (Firebase Storage oder andere), verwende sie direkt
    
    // Entferne undefined Felder, da Firestore diese nicht akzeptiert
    const cleanWineData = Object.keys(wineData).reduce((acc, key) => {
      if (wineData[key] !== undefined) {
        acc[key] = wineData[key];
      }
      return acc;
    }, {});
    
    // Ersetze labelImage mit der Upload-URL
    cleanWineData.labelImage = labelImageUrl;
    
    const wineRef = await addDoc(collection(db, 'wines'), {
      ...cleanWineData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Wine added with ID:', wineRef.id);
    return wineRef.id;
    
  } catch (error) {
    console.error('❌ Error adding wine:', error);
    throw error;
  }
};

// Holt alle Weine eines Users (inkl. getauschter Weine) für Historie/Dropdown
// WICHTIG: Getauschte Weine werden NICHT herausgefiltert, damit sie im Dropdown von WeinregalBefuellenScreen verfügbar sind
// Für Weinregal-Anzeige wird getWinesByOwner verwendet, das getauschte Weine filtert
export const getAllWinesByOwner = async (ownerId) => {
  try {
    console.log('🔄 Getting all wines for owner (including traded):', ownerId);
    
    const winesQuery = query(
      collection(db, 'wines'), 
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(winesQuery);
    
    let wines = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // WICHTIG: Filtere getauschte Weine NICHT heraus - werden für Historie/Dropdown in WeinregalBefuellenScreen benötigt
    
    // WICHTIG: Validierung - Prüfe für Weine mit inTradeRequest: true, ob der Trade-Request noch existiert
    // (Wird auch für getAllWinesByOwner durchgeführt, da diese Funktion für Flaschenzählung verwendet wird)
    const winesWithTradeRequest = wines.filter(w => w.inTradeRequest === true && w.pendingTradeRequestId);
    if (winesWithTradeRequest.length > 0) {
      console.log(`🔍 Prüfe ${winesWithTradeRequest.length} Weine mit inTradeRequest: true für Owner ${ownerId}...`);
      
      // Sammle alle eindeutigen Trade-Request-IDs
      const tradeRequestIds = [...new Set(winesWithTradeRequest.map(w => w.pendingTradeRequestId).filter(Boolean))];
      
      // Prüfe welche Trade-Requests noch existieren
      const tradeRequestChecks = await Promise.all(
        tradeRequestIds.map(async (requestId) => {
          try {
            const tradeRequestDoc = await getDoc(doc(db, 'tradeRequests', requestId));
            return { requestId, exists: tradeRequestDoc.exists() };
          } catch (error) {
            console.error(`❌ Fehler beim Prüfen von Trade-Request ${requestId}:`, error);
            return { requestId, exists: false };
          }
        })
      );
      
      const existingRequestIds = new Set(
        tradeRequestChecks.filter(c => c.exists).map(c => c.requestId)
      );
      
      // Bereinige verwaiste Kennzeichnungen
      const winesToClean = winesWithTradeRequest.filter(w => 
        w.pendingTradeRequestId && !existingRequestIds.has(w.pendingTradeRequestId)
      );
      
      if (winesToClean.length > 0) {
        console.log(`🔧 Bereinige ${winesToClean.length} Weine mit verwaisten inTradeRequest Kennzeichnungen...`);
        
        const batch = writeBatch(db);
        winesToClean.forEach(wine => {
          const wineRef = doc(db, 'wines', wine.id);
          batch.update(wineRef, {
            inTradeRequest: false,
            pendingTradeRequestId: null,
            updatedAt: serverTimestamp()
          });
        });
        
        try {
          await batch.commit();
          console.log(`✅ ${winesToClean.length} Weine bereinigt - inTradeRequest entfernt`);
        } catch (cleanupError) {
          console.error('❌ Fehler beim Bereinigen der Weine:', cleanupError);
          // Weiterlaufen - wir korrigieren die Daten clientseitig
        }
        
        // Korrigiere auch die lokalen Daten
        wines = wines.map(wine => {
          if (winesToClean.find(w => w.id === wine.id)) {
            return { ...wine, inTradeRequest: false, pendingTradeRequestId: null };
          }
          return wine;
        });
      }
    }
    
    console.log('✅ Found all wines (for counting):', wines.length);
    return wines;
    
  } catch (error) {
    console.error('❌ Error getting all wines by owner:', error);
    throw error;
  }
};

export const getWinesByOwner = async (ownerId) => {
  try {
    console.log('🔄 Getting wines for owner:', ownerId);
    
    const winesQuery = query(
      collection(db, 'wines'), 
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(winesQuery);
    
    let wines = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Filtere getauschte Weine aus dem Regal heraus
      .filter(wine => wine.status !== 'traded');
    
    // WICHTIG: Validierung - Prüfe für Weine mit inTradeRequest: true, ob der Trade-Request noch existiert
    const winesWithTradeRequest = wines.filter(w => w.inTradeRequest === true && w.pendingTradeRequestId);
    if (winesWithTradeRequest.length > 0) {
      console.log(`🔍 Prüfe ${winesWithTradeRequest.length} Weine mit inTradeRequest: true für Owner ${ownerId}...`);
      
      // Sammle alle eindeutigen Trade-Request-IDs
      const tradeRequestIds = [...new Set(winesWithTradeRequest.map(w => w.pendingTradeRequestId).filter(Boolean))];
      
      // Prüfe welche Trade-Requests noch existieren
      const tradeRequestChecks = await Promise.all(
        tradeRequestIds.map(async (requestId) => {
          try {
            const tradeRequestDoc = await getDoc(doc(db, 'tradeRequests', requestId));
            return { requestId, exists: tradeRequestDoc.exists() };
          } catch (error) {
            console.error(`❌ Fehler beim Prüfen von Trade-Request ${requestId}:`, error);
            return { requestId, exists: false };
          }
        })
      );
      
      const existingRequestIds = new Set(
        tradeRequestChecks.filter(c => c.exists).map(c => c.requestId)
      );
      
      // Bereinige verwaiste Kennzeichnungen
      const winesToClean = winesWithTradeRequest.filter(w => 
        w.pendingTradeRequestId && !existingRequestIds.has(w.pendingTradeRequestId)
      );
      
      if (winesToClean.length > 0) {
        console.log(`🔧 Bereinige ${winesToClean.length} Weine mit verwaisten inTradeRequest Kennzeichnungen...`);
        
        const batch = writeBatch(db);
        winesToClean.forEach(wine => {
          const wineRef = doc(db, 'wines', wine.id);
          batch.update(wineRef, {
            inTradeRequest: false,
            pendingTradeRequestId: null,
            updatedAt: serverTimestamp()
          });
        });
        
        try {
          await batch.commit();
          console.log(`✅ ${winesToClean.length} Weine bereinigt - inTradeRequest entfernt`);
        } catch (cleanupError) {
          console.error('❌ Fehler beim Bereinigen der Weine:', cleanupError);
          // Weiterlaufen - wir korrigieren die Daten clientseitig
        }
        
        // Korrigiere auch die lokalen Daten
        wines = wines.map(wine => {
          if (winesToClean.find(w => w.id === wine.id)) {
            return { ...wine, inTradeRequest: false, pendingTradeRequestId: null };
          }
          return wine;
        });
      }
    }
    
    console.log('✅ Found wines:', wines.length);
    return wines;
    
  } catch (error) {
    console.error('❌ Error getting wines by owner:', error);
    throw error;
  }
};

export const getAvailableWines = async () => {
  try {
    console.log('🔄 Getting available wines');
    
    // Hole 'public' Weine (alle Weine werden zuerst ins Weinregal gepackt, dann veröffentlicht)
    const q1 = query(
      collection(db, 'wines'),
      where('availableForTrade', '==', true),
      where('status', '==', 'public'),
      orderBy('createdAt', 'desc')
    );
    
    const snap1 = await getDocs(q1);
    
    let wines = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => {
      // Sortiere nach createdAt (neueste zuerst)
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    // WICHTIG: Validierung - Prüfe für Weine mit inTradeRequest: true, ob der Trade-Request noch existiert
    const winesWithTradeRequest = wines.filter(w => w.inTradeRequest === true && w.pendingTradeRequestId);
    if (winesWithTradeRequest.length > 0) {
      console.log(`🔍 Prüfe ${winesWithTradeRequest.length} Weine mit inTradeRequest: true...`);
      
      // Sammle alle eindeutigen Trade-Request-IDs
      const tradeRequestIds = [...new Set(winesWithTradeRequest.map(w => w.pendingTradeRequestId).filter(Boolean))];
      
      // Prüfe welche Trade-Requests noch existieren
      const tradeRequestChecks = await Promise.all(
        tradeRequestIds.map(async (requestId) => {
          try {
            const tradeRequestDoc = await getDoc(doc(db, 'tradeRequests', requestId));
            return { requestId, exists: tradeRequestDoc.exists() };
          } catch (error) {
            console.error(`❌ Fehler beim Prüfen von Trade-Request ${requestId}:`, error);
            return { requestId, exists: false };
          }
        })
      );
      
      const existingRequestIds = new Set(
        tradeRequestChecks.filter(c => c.exists).map(c => c.requestId)
      );
      
      // Bereinige verwaiste Kennzeichnungen
      const winesToClean = winesWithTradeRequest.filter(w => 
        w.pendingTradeRequestId && !existingRequestIds.has(w.pendingTradeRequestId)
      );
      
      if (winesToClean.length > 0) {
        console.log(`🔧 Bereinige ${winesToClean.length} Weine mit verwaisten inTradeRequest Kennzeichnungen...`);
        
        const batch = writeBatch(db);
        winesToClean.forEach(wine => {
          const wineRef = doc(db, 'wines', wine.id);
          batch.update(wineRef, {
            inTradeRequest: false,
            pendingTradeRequestId: null,
            updatedAt: serverTimestamp()
          });
        });
        
        try {
          await batch.commit();
          console.log(`✅ ${winesToClean.length} Weine bereinigt - inTradeRequest entfernt`);
        } catch (cleanupError) {
          console.error('❌ Fehler beim Bereinigen der Weine:', cleanupError);
          // Weiterlaufen - wir korrigieren die Daten clientseitig
        }
        
        // Korrigiere auch die lokalen Daten
        wines = wines.map(wine => {
          if (winesToClean.find(w => w.id === wine.id)) {
            return { ...wine, inTradeRequest: false, pendingTradeRequestId: null };
          }
          return wine;
        });
      }
    }
    
    console.log('✅ Found available wines:', wines.length);
    return wines;
    
  } catch (error) {
    console.error('❌ Error getting available wines:', error);
    throw error;
  }
};

export const updateWine = async (wineId, wineData) => {
  try {
    console.log('🔄 Updating wine:', wineId);
    
    // Prüfe ob ein neues Bild hochgeladen werden muss
    let labelImageUrl = wineData.labelImage;
    let oldImageUrl = null;
    
    // Hole altes Bild-URL um es später zu löschen oder zu migrieren
    const wineDoc = await getDoc(doc(db, 'wines', wineId));
    if (wineDoc.exists()) {
      const oldWineData = wineDoc.data();
      oldImageUrl = oldWineData.labelImage;
    }
    
    // Prüfe ob neues Bild eine lokale URI ist (file://, content://, ph://)
    if (wineData.labelImage && isLocalImageUri(wineData.labelImage)) {
      // Neues Bild muss hochgeladen werden
      try {
        // Bild hochladen zu Firebase Storage
        labelImageUrl = await uploadImageToStorage(wineData.labelImage, 'wines');
        console.log('✅ Bild erfolgreich hochgeladen:', labelImageUrl);
        
        // Lösche altes Bild aus Storage (falls vorhanden und es eine Firebase Storage URL ist)
        if (oldImageUrl && oldImageUrl.startsWith('https://firebasestorage.googleapis.com')) {
          try {
            await deleteImageFromStorage(oldImageUrl);
          } catch (deleteError) {
            console.warn('⚠️ Konnte altes Bild nicht löschen:', deleteError);
          }
        }
      } catch (uploadError) {
        console.error('❌ Fehler beim Hochladen des Bildes:', uploadError);
        // Wenn Upload fehlschlägt, verwende die lokale URI als Fallback
        labelImageUrl = wineData.labelImage;
      }
    } else if (!wineData.labelImage && oldImageUrl && isLocalImageUri(oldImageUrl)) {
      // Kein neues Bild angegeben, aber altes Bild ist noch lokal
      // Versuche das alte Bild zu migrieren (nur wenn es noch verfügbar ist)
      console.log('🔄 Versuche altes lokales Bild zu migrieren:', oldImageUrl);
      try {
        const migratedUrl = await migrateLocalImageToStorage(oldImageUrl, 'wines');
        if (migratedUrl) {
          labelImageUrl = migratedUrl;
          console.log('✅ Altes Bild erfolgreich migriert:', migratedUrl);
        } else {
          // Migration fehlgeschlagen - behalte alte URL (wird möglicherweise nicht mehr funktionieren)
          labelImageUrl = oldImageUrl;
          console.warn('⚠️ Migration des alten Bildes fehlgeschlagen, behalte lokale URI');
        }
      } catch (migrationError) {
        console.error('❌ Fehler beim Migrieren des alten Bildes:', migrationError);
        labelImageUrl = oldImageUrl;
      }
    } else if (!wineData.labelImage) {
      // Kein neues Bild und kein altes Bild oder altes Bild ist bereits eine URL
      labelImageUrl = oldImageUrl || null;
    }
    
    // Ersetze labelImage mit der Upload-URL
    const updateData = {
      ...wineData,
      labelImage: labelImageUrl,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'wines', wineId), updateData);
    
    console.log('✅ Wine updated:', wineId);
    return true;
    
  } catch (error) {
    console.error('❌ Error updating wine:', error);
    throw error;
  }
};

export const deleteWine = async (wineId) => {
  try {
    console.log('🔄 Deleting wine:', wineId);
    
    // Hole Wein-Daten, um das Bild aus Storage zu löschen
    const wineDoc = await getDoc(doc(db, 'wines', wineId));
    if (wineDoc.exists()) {
      const wineData = wineDoc.data();
      const labelImageUrl = wineData.labelImage;
      
      // Lösche Bild aus Storage, falls vorhanden und es eine Firebase Storage URL ist
      if (labelImageUrl && labelImageUrl.startsWith('https://firebasestorage.googleapis.com')) {
        try {
          await deleteImageFromStorage(labelImageUrl);
        } catch (deleteError) {
          console.warn('⚠️ Konnte Bild beim Löschen des Weines nicht löschen:', deleteError);
        }
      }
    }
    
    await deleteDoc(doc(db, 'wines', wineId));
    
    console.log('✅ Wine deleted:', wineId);
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting wine:', error);
    throw error;
  }
};

export const publishWine = async (wineId) => {
  try {
    console.log('🔄 Publishing wine:', wineId);
    
    await updateDoc(doc(db, 'wines', wineId), {
      status: 'public',
      availableForTrade: true,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Wine published:', wineId);
    return true;
    
  } catch (error) {
    console.error('❌ Error publishing wine:', error);
    throw error;
  }
};

export const unpublishWine = async (wineId) => {
  try {
    console.log('🔄 Unpublishing wine:', wineId);
    
    await updateDoc(doc(db, 'wines', wineId), {
      status: 'private',
      availableForTrade: false,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Wine unpublished:', wineId);
    return true;
    
  } catch (error) {
    console.error('❌ Error unpublishing wine:', error);
    throw error;
  }
};

// ===== PHASE3: WEIN-KENNZEICHNUNG "IN TAUCH INVOLVIERT" =====

/**
 * Markiert Weine als "in Tausch involviert"
 * @param {string} tradeRequestId - ID des Trade-Requests
 * @param {string} wineAId - ID von Wein A (vom Absender)
 * @param {string} wineBId - ID von Wein B (vom Empfänger)
 */
export const markWinesAsInTradeRequest = async (tradeRequestId, wineAId, wineBId) => {
  try {
    console.log('🔄 Marking wines as in trade request:', { tradeRequestId, wineAId, wineBId });
    
    const batch = writeBatch(db);
    
    // Markiere Wein A
    if (wineAId) {
      const wineARef = doc(db, 'wines', wineAId);
      batch.update(wineARef, {
        inTradeRequest: true,
        pendingTradeRequestId: tradeRequestId,
        updatedAt: serverTimestamp()
      });
    }
    
    // Markiere Wein B
    if (wineBId) {
      const wineBRef = doc(db, 'wines', wineBId);
      batch.update(wineBRef, {
        inTradeRequest: true,
        pendingTradeRequestId: tradeRequestId,
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
    console.log('✅ Wines marked as in trade request');
    return true;
    
  } catch (error) {
    console.error('❌ Error marking wines as in trade request:', error);
    throw error;
  }
};

/**
 * Entfernt die Kennzeichnung "in Tausch involviert" von Weinen
 * @param {string} tradeRequestId - ID des Trade-Requests
 */
export const unmarkWinesFromTradeRequest = async (tradeRequestId) => {
  try {
    console.log('🔄 Unmarking wines from trade request:', tradeRequestId);
    
    // Finde alle Weine mit diesem pendingTradeRequestId
    const winesQuery = query(
      collection(db, 'wines'),
      where('pendingTradeRequestId', '==', tradeRequestId)
    );
    const winesSnapshot = await getDocs(winesQuery);
    
    if (winesSnapshot.empty) {
      console.log('ℹ️ No wines found with pendingTradeRequestId:', tradeRequestId);
      return true;
    }
    
    const batch = writeBatch(db);
    winesSnapshot.forEach((wineDoc) => {
      const wineRef = doc(db, 'wines', wineDoc.id);
      batch.update(wineRef, {
        inTradeRequest: false,
        pendingTradeRequestId: null,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('✅ Wines unmarked from trade request:', winesSnapshot.size);
    return true;
    
  } catch (error) {
    console.error('❌ Error unmarking wines from trade request:', error);
    throw error;
  }
};

// ===== TRADE REQUESTS =====

export const createTradeRequest = async (requestData) => {
  try {
    console.log('🔄 Creating trade request');
    const ref = await addDoc(collection(db, 'tradeRequests'), {
      ...requestData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Trade request created:', ref.id);
    return ref.id;
  } catch (error) {
    console.error('❌ Error creating trade request:', error);
    throw error;
  }
};

export const getTradeRequest = async (requestId) => {
  try {
    console.log('🔄 Getting trade request:', requestId);
    const docRef = doc(db, 'tradeRequests', requestId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting trade request:', error);
    throw error;
  }
};

export const updateTradeRequestStatus = async (requestId, updates) => {
  try {
    console.log('🔄 Updating trade request:', requestId);
    await updateDoc(doc(db, 'tradeRequests', requestId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Trade request updated:', requestId);
    return true;
  } catch (error) {
    console.error('❌ Error updating trade request:', error);
    throw error;
  }
};

// Lösche einen Trade-Request komplett aus Firestore
export const deleteTradeRequest = async (requestId) => {
  try {
    console.log('🔄 Deleting trade request:', requestId);
    
    await deleteDoc(doc(db, 'tradeRequests', requestId));
    
    console.log('✅ Trade request deleted:', requestId);
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting trade request:', error);
    throw error;
  }
};

// Setze alle Trade-Requests eines Chats auf 'rejected' (für Admin-Löschung)
export const rejectTradeRequestsForChat = async (chatId, tradeRequestId) => {
  try {
    console.log('🔄 Rejecting trade requests for chat:', chatId, tradeRequestId);
    
    if (tradeRequestId) {
      // Wenn eine spezifische tradeRequestId vorhanden ist, lösche diese direkt
      try {
        await deleteDoc(doc(db, 'tradeRequests', tradeRequestId));
        console.log('✅ Trade request deleted (rejected):', tradeRequestId);
      } catch (deleteError) {
        // Fallback: Setze Status auf rejected wenn Löschen fehlschlägt
        console.warn('⚠️ Fehler beim Löschen, setze Status auf rejected:', deleteError);
        await updateDoc(doc(db, 'tradeRequests', tradeRequestId), {
          status: 'rejected',
          rejectedBy: 'admin',
          rejectedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('✅ Trade request rejected (Fallback):', tradeRequestId);
      }
    } else {
      // Falls keine tradeRequestId vorhanden, suche nach Trade-Requests die zu diesem Chat gehören
      // (basierend auf Teilnehmern)
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const participants = chatData.participants || [];
        
        if (participants.length === 2) {
          // Suche nach Trade-Requests zwischen diesen beiden Teilnehmern
          const q1 = query(
            collection(db, 'tradeRequests'),
            where('fromUserId', '==', participants[0]),
            where('toUserId', '==', participants[1]),
            where('status', 'in', ['pending', 'rejected', 'accepted']) // Alle Status, da wir alles löschen
          );
          const q2 = query(
            collection(db, 'tradeRequests'),
            where('fromUserId', '==', participants[1]),
            where('toUserId', '==', participants[0]),
            where('status', 'in', ['pending', 'rejected', 'accepted']) // Alle Status, da wir alles löschen
          );
          
          const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
          const batch = writeBatch(db);
          
          // Lösche alle gefundenen Trade-Requests direkt
          [...snap1.docs, ...snap2.docs].forEach(docSnapshot => {
            batch.delete(docSnapshot.ref);
          });
          
          if (snap1.docs.length + snap2.docs.length > 0) {
            await batch.commit();
            console.log(`✅ ${snap1.docs.length + snap2.docs.length} Trade-Requests gelöscht`);
          }
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error rejecting trade requests for chat:', error);
    throw error;
  }
};

// Lösche alle abgelehnten oder beendeten Trade Requests (Cleanup-Funktion)
export const cleanupOldTradeRequests = async () => {
  try {
    console.log('🔄 Cleanup: Lösche alle abgelehnten und beendeten Trade-Requests');
    
    // Suche nach allen rejected Trade Requests
    const rejectedQuery = query(
      collection(db, 'tradeRequests'),
      where('status', '==', 'rejected')
    );
    
    // Suche nach allen accepted Trade Requests
    const acceptedQuery = query(
      collection(db, 'tradeRequests'),
      where('status', '==', 'accepted')
    );
    
    const [rejectedSnapshot, acceptedSnapshot] = await Promise.all([
      getDocs(rejectedQuery),
      getDocs(acceptedQuery)
    ]);
    
    const allDocs = [...rejectedSnapshot.docs, ...acceptedSnapshot.docs];
    
    if (allDocs.length === 0) {
      console.log('✅ Cleanup: Keine alten Trade-Requests zum Löschen gefunden');
      return { deleted: 0 };
    }
    
    console.log(`🔄 Cleanup: Lösche ${allDocs.length} alte Trade-Requests...`);
    
    // Lösche alle in einem Batch
    const batch = writeBatch(db);
    allDocs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    console.log(`✅ Cleanup: ${allDocs.length} alte Trade-Requests gelöscht`);
    
    return { deleted: allDocs.length };
    
  } catch (error) {
    console.error('❌ Error cleaning up old trade requests:', error);
    throw error;
  }
};

// Setze ALLE pending Trade-Requests auf 'rejected' (für Admin-Löschung aller Chats)
export const rejectAllPendingTradeRequests = async () => {
  try {
    console.log('🔄 Rejecting all pending trade requests');
    
    const q = query(
      collection(db, 'tradeRequests'),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('ℹ️ No pending trade requests to reject');
      return 0;
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnapshot => {
      batch.update(docSnapshot.ref, {
        status: 'rejected',
        rejectedBy: 'admin',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log(`✅ ${snapshot.docs.length} Trade-Requests rejected`);
    return snapshot.docs.length;
    
  } catch (error) {
    console.error('❌ Error rejecting all pending trade requests:', error);
    throw error;
  }
};

export const getTradeRequestsForUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'tradeRequests'),
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('❌ Error fetching trade requests:', error);
    throw error;
  }
};

export const findExistingOpenTradeRequest = async ({ fromUserId, toUserId, wineId }) => {
  try {
    const q = query(
      collection(db, 'tradeRequests'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('wineId', '==', wineId),
      where('status', '==', 'pending'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (error) {
    console.error('❌ Error checking existing trade request:', error);
    return null;
  }
};

export const subscribeIncomingTradeRequests = (userId, callback) => {
  try {
    // Überwache nur 'pending' Trade-Requests für eingehende Anfragen
    // 'rejected' wird nicht benötigt, da nur B (Empfänger) ablehnen kann
    // und A wird über subscribeOutgoingTradeRequests benachrichtigt
    const q = query(
      collection(db, 'tradeRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );
    return onSnapshot(q, callback);
  } catch (error) {
    console.error('❌ Error subscribing incoming trade requests:', error);
    return () => {};
  }
};

export const subscribeOutgoingTradeRequests = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'tradeRequests'),
      where('fromUserId', '==', userId)
    );
    return onSnapshot(q, callback);
  } catch (error) {
    console.error('❌ Error subscribing outgoing trade requests:', error);
    return () => {};
  }
};

// ===== DASHBOARD COUNTS (simple queries) =====

export const getAvailableWinesCount = async () => {
  try {
    // Zähle 'public' Weine (alle Weine werden zuerst ins Weinregal gepackt, dann veröffentlicht)
    const q1 = query(
      collection(db, 'wines'),
      where('availableForTrade', '==', true),
      where('status', '==', 'public')
    );
    const snap1 = await getDocs(q1);
    return snap1.size;
  } catch (error) {
    console.error('❌ Error counting available wines:', error);
    return 0;
  }
};

export const getUserWineCounts = async (ownerId) => {
  try {
    // Zähle alle Weine des Users
    const qAll = query(collection(db, 'wines'), where('ownerId', '==', ownerId));
    const snapAll = await getDocs(qAll);
    
    // Filtere client-seitig: Weinregal zeigt nur Weine OHNE 'traded'
    const allWines = snapAll.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const cellarWines = allWines.filter(w => w.status !== 'traded');
    const publishedWines = cellarWines.filter(w => w.status === 'public');
    
    console.log(`📊 getUserWineCounts für ${ownerId}: ${cellarWines.length} im Regal, ${publishedWines.length} veröffentlicht`);
    
    return { 
      total: cellarWines.length, 
      published: publishedWines.length 
    };
  } catch (error) {
    console.error('❌ Error counting user wines:', error);
    return { total: 0, published: 0 };
  }
};

export const getOnlineUsersCount = async () => {
  try {
    // Nutzer mit lastActive innerhalb der letzten 60 Sekunden
    const threshold = new Date(Date.now() - 60 * 1000);
    const q = query(collection(db, 'users'), where('lastActive', '>', threshold));
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.error('❌ Error counting online users:', error);
    return 0;
  }
};

export const getCompletedTradesCount = async () => {
  try {
    const q = query(collection(db, 'tradeRequests'), where('status', '==', 'completed'));
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.error('❌ Error counting completed trades:', error);
    return 0;
  }
};

export const getMyCompletedTradesCount = async (userId) => {
  try {
    const qFrom = query(
      collection(db, 'tradeRequests'),
      where('fromUserId', '==', userId),
      where('status', '==', 'completed')
    );
    const qTo = query(
      collection(db, 'tradeRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'completed')
    );
    const [snapFrom, snapTo] = await Promise.all([getDocs(qFrom), getDocs(qTo)]);
    return snapFrom.size + snapTo.size;
  } catch (error) {
    console.error('❌ Error counting my completed trades:', error);
    return 0;
  }
};

// ===== CHAT MANAGEMENT =====

export const createChat = async (chatData) => {
  try {
    console.log('🔄 Creating chat in Firestore');
    
    // Entferne undefined Felder
    const cleanChatData = Object.keys(chatData).reduce((acc, key) => {
      if (chatData[key] !== undefined) {
        acc[key] = chatData[key];
      }
      return acc;
    }, {});
    
    // Stelle sicher, dass entryType auf 'chat' gesetzt ist
    const chatRef = await addDoc(collection(db, 'chats'), {
      ...cleanChatData,
      entryType: 'chat', // Immer 'chat' für echte Chats
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Chat created in Firestore:', chatRef.id);
    return chatRef.id;
  } catch (error) {
    console.error('❌ Error creating chat:', error);
    throw error;
  }
};

// ===== TRADE HINTS (Tauschhinweise) =====

export const createTradeHint = async (hintData) => {
  try {
    console.log('🔄 Creating trade hint in Firestore');
    
    // Entferne undefined Felder
    const cleanHintData = Object.keys(hintData).reduce((acc, key) => {
      if (hintData[key] !== undefined) {
        acc[key] = hintData[key];
      }
      return acc;
    }, {});
    
    // Erstelle Hinweis mit entryType 'hint'
    const hintRef = await addDoc(collection(db, 'chats'), {
      ...cleanHintData,
      entryType: 'hint', // WICHTIG: Unterscheidung zwischen Chat und Hinweis
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Trade hint created in Firestore:', hintRef.id);
    return hintRef.id;
  } catch (error) {
    console.error('❌ Error creating trade hint:', error);
    throw error;
  }
};

export const updateTradeHint = async (hintId, updates) => {
  try {
    console.log('🔄 Updating trade hint:', hintId);
    
    await updateDoc(doc(db, 'chats', hintId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Trade hint updated:', hintId);
    return true;
  } catch (error) {
    console.error('❌ Error updating trade hint:', error);
    throw error;
  }
};

export const getChat = async (chatId) => {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      return { id: chatDoc.id, ...chatDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting chat:', error);
    throw error;
  }
};

export const getChatsForUser = async (userId) => {
  try {
    console.log('🔄 Getting chats for user:', userId);
    
    // WICHTIG: Hole ALLE Einträge aus 'chats' Collection (sowohl Chats als auch Hinweise)
    // Filtere dann client-seitig:
    // - Für Chats (entryType: 'chat'): Nur wenn userId in participants ist
    // - Für Hinweise (entryType: 'hint'): Nur wenn userId === chat.userId
    const q = query(collection(db, 'chats'));
    
    const querySnapshot = await getDocs(q);
    
    const allEntries = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Konvertiere Firestore Timestamps zu Strings/Dates für Sortierung
      const updatedAt = data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : new Date(0));
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        updatedAtDate: updatedAt, // Für Sortierung
        lastMessageTime: data.lastMessageTime || (updatedAt?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) || '')
      };
    });
    
    // Filtere client-seitig: Nur Einträge, die für diesen User bestimmt sind
    const chats = allEntries.filter(entry => {
      // DEBUG: Logge jeden Eintrag, der gefiltert wird
      const debugInfo = {
        id: entry.id,
        entryType: entry.entryType,
        participants: entry.participants,
        userId: entry.userId,
        deleted: entry.deleted,
        deletedBy: entry.deletedBy
      };
      
      // WICHTIG: Filtere gelöschte Chats heraus (deleted === true oder deletedBy existiert)
      // Wenn deletedBy gesetzt ist, wurde der Chat gelöscht und sollte für ALLE Teilnehmer ausgeblendet werden
      if (entry.deleted === true) {
        console.log('🔍 DEBUG getChatsForUser: Chat herausgefiltert (deleted=true):', debugInfo);
        return false; // Chat wurde gelöscht
      }
      // WICHTIG: Filtere nur Chats heraus, die vom aktuellen User gelöscht wurden
      // Chats, die von anderen Usern gelöscht wurden, sollen noch angezeigt werden (mit "Chat verlassen" Status)
      if (entry.deletedBy) {
        if (Array.isArray(entry.deletedBy)) {
          // Nur herausfiltern, wenn der aktuelle User den Chat gelöscht hat
          if (entry.deletedBy.includes(userId)) {
            console.log('🔍 DEBUG getChatsForUser: Chat herausgefiltert (deletedBy includes userId):', debugInfo);
            return false; // Chat wurde vom aktuellen User gelöscht
          }
          // WICHTIG: Wenn andere User den Chat gelöscht haben, NICHT herausfiltern
          // Der Chat soll noch angezeigt werden, damit der User sieht, dass der andere Teilnehmer den Chat verlassen hat
        } else {
          // Wenn deletedBy existiert aber kein Array ist, auch ausblenden (alte Datenstruktur)
          console.log('🔍 DEBUG getChatsForUser: Chat herausgefiltert (deletedBy ist kein Array):', debugInfo);
          return false;
        }
      }
      
      // Für Chats (entryType: 'chat' oder undefined für Rückwärtskompatibilität): Nur wenn userId in participants ist
      if (entry.entryType === 'chat' || !entry.entryType) {
        const hasParticipants = entry.participants && Array.isArray(entry.participants);
        const includesUserId = hasParticipants && entry.participants.includes(userId);
        if (!includesUserId) {
          console.log('🔍 DEBUG getChatsForUser: Chat herausgefiltert (entryType=chat, aber userId nicht in participants):', {
            ...debugInfo,
            hasParticipants,
            includesUserId,
            participantsArray: entry.participants
          });
        }
        return includesUserId;
      }
      // Für Hinweise (entryType: 'hint'): Nur wenn userId === entry.userId
      if (entry.entryType === 'hint') {
        const matches = entry.userId === userId;
        if (!matches) {
          console.log('🔍 DEBUG getChatsForUser: Hint herausgefiltert (entryType=hint, aber userId stimmt nicht):', debugInfo);
        }
        return matches;
      }
      // Fallback: Für alte Einträge ohne entryType, prüfe participants
      const hasParticipants = entry.participants && Array.isArray(entry.participants);
      const includesUserId = hasParticipants && entry.participants.includes(userId);
      if (!includesUserId) {
        console.log('🔍 DEBUG getChatsForUser: Chat herausgefiltert (Fallback, userId nicht in participants):', {
          ...debugInfo,
          hasParticipants,
          includesUserId,
          participantsArray: entry.participants
        });
      }
      return includesUserId;
    });
    
    // Sortiere client-seitig nach updatedAt (neueste zuerst)
    chats.sort((a, b) => {
      const dateA = a.updatedAtDate || new Date(a.updatedAt || 0);
      const dateB = b.updatedAtDate || new Date(b.updatedAt || 0);
      return dateB.getTime() - dateA.getTime(); // Absteigend (neueste zuerst)
    });
    
    console.log('✅ Found chats/hints:', chats.length, '(aus', allEntries.length, 'gesamten Einträgen)');
    return chats;
  } catch (error) {
    console.error('❌ Error getting chats for user:', error);
    // Fallback: Wenn Query fehlschlägt, gebe leeres Array zurück
    return [];
  }
};

export const subscribeChatsForUser = (userId, callback) => {
  try {
    console.log('🔄 Subscribing to chats/hints for user:', userId);
    
    // WICHTIG: Abonniere ALLE Einträge aus 'chats' Collection
    // Filtere dann client-seitig nach entryType und userId
    // Dies ist notwendig, da Hinweise NICHT in participants sind, sondern userId haben
    const q = query(collection(db, 'chats'));
    
    // WICHTIG: onSnapshot liefert Echtzeit-Updates - neue Chats/Hinweise werden sofort erkannt
    return onSnapshot(q, (snapshot) => {
      // WICHTIG: Erkenne neue Chats/Hinweise sofort
      const newChats = snapshot.docChanges()
        .filter(change => change.type === 'added')
        .map(change => {
          const data = change.doc.data();
          return {
            id: change.doc.id,
            ...data,
            entryType: data.entryType || 'chat'
          };
        });
      
      if (newChats.length > 0) {
        console.log(`⚡ JIT: ${newChats.length} neue Chat(s)/Hinweis(e) empfangen!`, newChats.map(c => ({ id: c.id, entryType: c.entryType, hintType: c.hintType })));
      }
      const allEntries = snapshot.docs.map(doc => {
        const data = doc.data();
        // Konvertiere Firestore Timestamps zu Strings/Dates für Sortierung
        const updatedAt = data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : new Date(0));
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          updatedAtDate: updatedAt, // Für Sortierung
          lastMessageTime: data.lastMessageTime || (updatedAt?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) || '')
        };
      });
      
      // Filtere client-seitig: Nur Einträge, die für diesen User bestimmt sind
      const chats = allEntries.filter(entry => {
        // DEBUG: Logge jeden Eintrag, der gefiltert wird
        const debugInfo = {
          id: entry.id,
          entryType: entry.entryType,
          participants: entry.participants,
          userId: entry.userId,
          deleted: entry.deleted,
          deletedBy: entry.deletedBy
        };
        
        // WICHTIG: Filtere nur Chats heraus, die vom aktuellen User gelöscht wurden
        // Chats, die von anderen Usern gelöscht wurden, sollen noch angezeigt werden (mit "Chat verlassen" Status)
        if (entry.deleted === true) {
          console.log('🔍 DEBUG subscribeChatsForUser: Chat herausgefiltert (deleted=true):', debugInfo);
          return false; // Chat wurde komplett gelöscht
        }
        if (entry.deletedBy && Array.isArray(entry.deletedBy) && entry.deletedBy.includes(userId)) {
          console.log('🔍 DEBUG subscribeChatsForUser: Chat herausgefiltert (deletedBy includes userId):', debugInfo);
          return false; // Chat wurde vom aktuellen User gelöscht
        }
        // WICHTIG: Wenn andere User den Chat gelöscht haben, NICHT herausfiltern
        // Der Chat soll noch angezeigt werden, damit der User sieht, dass der andere Teilnehmer den Chat verlassen hat
        
        // Für Chats (entryType: 'chat' oder undefined für Rückwärtskompatibilität): Nur wenn userId in participants ist
        if (entry.entryType === 'chat' || !entry.entryType) {
          const hasParticipants = entry.participants && Array.isArray(entry.participants);
          const includesUserId = hasParticipants && entry.participants.includes(userId);
          if (!includesUserId) {
            console.log('🔍 DEBUG subscribeChatsForUser: Chat herausgefiltert (entryType=chat, aber userId nicht in participants):', {
              ...debugInfo,
              hasParticipants,
              includesUserId,
              participantsArray: entry.participants
            });
          }
          return includesUserId;
        }
        // Für Hinweise (entryType: 'hint'): Nur wenn userId === entry.userId
        if (entry.entryType === 'hint') {
          const matches = entry.userId === userId;
          if (!matches) {
            console.log('🔍 DEBUG subscribeChatsForUser: Hint herausgefiltert (entryType=hint, aber userId stimmt nicht):', debugInfo);
          }
          return matches;
        }
        // Fallback: Für alte Einträge ohne entryType, prüfe participants
        const hasParticipants = entry.participants && Array.isArray(entry.participants);
        const includesUserId = hasParticipants && entry.participants.includes(userId);
        if (!includesUserId) {
          console.log('🔍 DEBUG subscribeChatsForUser: Chat herausgefiltert (Fallback, userId nicht in participants):', {
            ...debugInfo,
            hasParticipants,
            includesUserId,
            participantsArray: entry.participants
          });
        }
        return includesUserId;
      });
      
      // Sortiere client-seitig nach updatedAt (neueste zuerst)
      chats.sort((a, b) => {
        const dateA = a.updatedAtDate || new Date(a.updatedAt || 0);
        const dateB = b.updatedAtDate || new Date(b.updatedAt || 0);
        return dateB.getTime() - dateA.getTime(); // Absteigend (neueste zuerst)
      });
      
      callback(snapshot, chats);
    });
  } catch (error) {
    console.error('❌ Error subscribing to chats:', error);
    return () => {};
  }
};

export const updateChat = async (chatId, updates) => {
  try {
    console.log('🔄 Updating chat:', chatId);
    
    // WICHTIG: Lade Chat-Daten, um wichtige Felder beizubehalten
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (!chatDoc.exists()) {
      console.error('❌ Chat nicht gefunden beim Update:', chatId);
      throw new Error('Chat nicht gefunden');
    }
    
    const chatData = chatDoc.data();
    
    // DEBUG: Logge aktuelle Chat-Daten vor Update
    console.log('🔍 DEBUG updateChat - Vor Update:', {
      chatId,
      existingEntryType: chatData.entryType,
      existingParticipants: chatData.participants,
      existingType: chatData.type,
      updatesEntryType: updates.entryType,
      updatesParticipants: updates.participants
    });
    
    // WICHTIG: Stelle sicher, dass kritische Felder beibehalten werden
    // Diese Felder dürfen nicht versehentlich entfernt werden
    // WICHTIG: Explizit sicherstellen, dass entryType und participants IMMER gesetzt sind
    const safeUpdates = {
      ...updates,  // Wende Updates an
      // WICHTIG: Explizit sicherstellen, dass entryType und participants IMMER gesetzt sind
      // Diese Felder sind kritisch für die Filterlogik in getChatsForUser
      entryType: updates.entryType !== undefined ? updates.entryType : (chatData.entryType || 'chat'),
      participants: updates.participants !== undefined ? updates.participants : (chatData.participants || []),
      // Behalte type für Rückwärtskompatibilität (wird nicht für Filterung verwendet)
      type: updates.type !== undefined ? updates.type : (chatData.type || 'chat'),
      updatedAt: serverTimestamp()
    };
    
    // DEBUG: Logge finale Updates
    console.log('🔍 DEBUG updateChat - Finale Updates:', {
      chatId,
      entryType: safeUpdates.entryType,
      participants: safeUpdates.participants,
      type: safeUpdates.type
    });
    
    await updateDoc(doc(db, 'chats', chatId), safeUpdates);
    
    console.log('✅ Chat updated:', chatId);
    return true;
  } catch (error) {
    console.error('❌ Error updating chat:', error);
    throw error;
  }
};

export const deleteChat = async (chatId, userId) => {
  try {
    console.log('🔄 Marking chat as deleted for user:', userId, 'chatId:', chatId);
    
    // Markiere Chat als gelöscht für diesen User (nicht physisch löschen)
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const deletedBy = chatData.deletedBy || [];
      if (!deletedBy.includes(userId)) {
        deletedBy.push(userId);
      }
      
      // WICHTIG: Prüfe ob alle Teilnehmer gelöscht haben
      // Für Hinweise: Nur userId prüfen (keine participants)
      // Für Chats: Alle participants prüfen
      const participants = chatData.participants || [];
      const isHint = chatData.entryType === 'hint';
      const hintUserId = chatData.userId; // WICHTIG: Umbenannt, um Konflikt mit Parameter userId zu vermeiden
      
      let allDeleted = false;
      if (isHint && hintUserId) {
        // Hinweis: Nur hintUserId muss gelöscht haben
        allDeleted = deletedBy.includes(hintUserId);
      } else if (participants.length > 0) {
        // Chat: Alle Teilnehmer müssen gelöscht haben
        allDeleted = participants.every(participantId => deletedBy.includes(participantId));
      }
      
      if (allDeleted) {
        // Alle relevanten User haben gelöscht -> physisch aus Firestore löschen
        console.log('✅ Alle User haben gelöscht - lösche Chat/Hinweis physisch aus Firestore:', chatId);
        await deleteDoc(doc(db, 'chats', chatId));
        console.log('✅ Chat/Hinweis physisch gelöscht aus Firestore');
        return { deleted: true, physical: true };
      } else {
        // Nur Soft-Delete (markiere als gelöscht für diesen User)
        await updateDoc(doc(db, 'chats', chatId), {
          deletedBy,
          updatedAt: serverTimestamp()
        });
        console.log('✅ Chat als gelöscht markiert für User:', userId);
        return { deleted: true, physical: false };
      }
    } else {
      // WICHTIG: Chat existiert nicht mehr in Firestore (z.B. wurde bereits vom Admin gelöscht)
      // Dies ist KEIN Fehler - der Chat wurde bereits gelöscht
      console.log('ℹ️ Chat existiert nicht mehr in Firestore (bereits gelöscht):', chatId);
      return { deleted: true, physical: true, alreadyDeleted: true };
    }
  } catch (error) {
    console.error('❌ Error deleting chat:', error);
    throw error;
  }
};

// ===== CHAT MESSAGES =====

export const addChatMessage = async (chatId, messageData) => {
  try {
    console.log('🔄 Adding message to chat:', chatId);
    
    // Entferne undefined Felder
    const cleanMessageData = Object.keys(messageData).reduce((acc, key) => {
      if (messageData[key] !== undefined) {
        acc[key] = messageData[key];
      }
      return acc;
    }, {});
    
    const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
      ...cleanMessageData,
      createdAt: serverTimestamp(),
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    });
    
    // WICHTIG: Lade Chat, um readBy und participants zu erhalten
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    const chatData = chatDoc.exists() ? chatDoc.data() : null;
    
    if (!chatData) {
      console.error('❌ Chat nicht gefunden beim Hinzufügen einer Nachricht:', chatId);
      throw new Error('Chat nicht gefunden');
    }
    
    // WICHTIG: Stelle sicher, dass entryType und participants erhalten bleiben
    // Diese Felder müssen beim Update beibehalten werden, damit der Chat nicht verschwindet
    const chatUpdate = {
      lastMessage: messageData.text || messageData.message || '',
      lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      lastMessageSenderId: messageData.senderId,
      updatedAt: serverTimestamp(),
      // WICHTIG: Behalte entryType und participants beim Update
      // Diese Felder sind kritisch für die Anzeige des Chats in der InfoBox
      entryType: chatData.entryType || 'chat', // Standard: 'chat' wenn nicht gesetzt
      participants: chatData.participants || [], // Behalte participants
      type: chatData.type || 'chat' // Behalte type für Rückwärtskompatibilität
    };
    
    // FIX: Wenn eine neue Nachricht gesendet wird, entferne den Empfänger aus readBy
    // und setze unreadCount auf 1 (damit die Notification gezählt wird)
    if (chatData) {
      const senderId = messageData.senderId;
      const participants = chatData.participants || [];
      const recipientId = participants.find(pid => pid !== senderId);
      
      if (recipientId) {
        // Entferne Empfänger aus readBy (wenn vorhanden)
        const readBy = chatData.readBy || [];
        const updatedReadBy = readBy.filter(userId => userId !== recipientId);
        
        if (updatedReadBy.length !== readBy.length) {
          chatUpdate.readBy = updatedReadBy;
          console.log('🔄 Empfänger aus readBy entfernt:', { recipientId, readBy: updatedReadBy });
        }
        
        // Setze unreadCount auf 1 für den Empfänger (wenn es 0 war)
        // WICHTIG: unreadCount ist global, aber wir setzen es auf 1, damit die Notification gezählt wird
        // Der Empfänger wird es auf 0 setzen, wenn er den Chat öffnet
        if (chatData.unreadCount === 0) {
          chatUpdate.unreadCount = 1;
          console.log('🔄 unreadCount auf 1 gesetzt (war 0)');
        }
      }
    }
    
    // Aktualisiere Chat mit letzter Nachricht und readBy/unreadCount
    await updateChat(chatId, chatUpdate);
    
    console.log('✅ Message added to chat:', messageRef.id);
    return messageRef.id;
  } catch (error) {
    console.error('❌ Error adding message to chat:', error);
    throw error;
  }
};

export const getChatMessages = async (chatId, limitCount = 100) => {
  try {
    console.log('🔄 Getting messages for chat:', chatId);
    
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        timestamp: data.timestamp || (data.createdAt?.toDate?.()?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) || '')
      };
    }).reverse(); // Älteste zuerst
    
    console.log('✅ Found messages:', messages.length);
    return messages;
  } catch (error) {
    console.error('❌ Error getting chat messages:', error);
    return [];
  }
};

// WICHTIG: Map für Chat-Message-Subscription-Start-Zeitpunkte (verhindert, dass initial geladene Nachrichten als "neu" erkannt werden)
// Key: chatId, Value: Start-Zeitpunkt
const chatMessageSubscriptionStartTimes = new Map();

export const subscribeChatMessages = (chatId, callback) => {
  try {
    console.log('🔄 Subscribing to messages for chat:', chatId);
    
    // WICHTIG: Setze Subscription-Start-Zeitpunkt auf null beim Start einer neuen Subscription
    // Dies ermöglicht es, zwischen initial geladenen und echten neuen Nachrichten zu unterscheiden
    chatMessageSubscriptionStartTimes.set(chatId, null);
    
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    // WICHTIG: onSnapshot liefert Echtzeit-Updates - neue Nachrichten werden sofort erkannt
    return onSnapshot(q, (snapshot) => {
      // WICHTIG: Unterscheide zwischen "echt neuen" Nachrichten und "initial geladenen"
      // Beim ersten Subscription-Aufruf sind ALLE Nachrichten 'added', aber sie sind nicht wirklich neu
      const currentStartTime = chatMessageSubscriptionStartTimes.get(chatId);
      const isInitialLoad = currentStartTime === null || currentStartTime === undefined;
      
      if (isInitialLoad) {
        // Erste Subscription: Markiere Start-Zeitpunkt
        const startTime = Date.now();
        chatMessageSubscriptionStartTimes.set(chatId, startTime);
        console.log(`📡 PHASE3: Initialer Chat-Message-Subscription-Start für Chat ${chatId}, ignoriere initial geladene Nachrichten`);
      }
      
      const subscriptionStartTime = chatMessageSubscriptionStartTimes.get(chatId) || Date.now();
      
      // WICHTIG: Erkenne neue Nachrichten sofort
      // WICHTIG: Ignoriere 'added' Events beim initialen Load (sie sind nicht wirklich neu)
      const newMessages = snapshot.docChanges()
        .filter(change => {
          // Nur 'added' Events berücksichtigen
          if (change.type !== 'added') {
            return false;
          }
          
          // Beim initialen Load ALLE 'added' Events ignorieren (sie sind nicht wirklich neu)
          if (isInitialLoad) {
            return false;
          }
          
          // Prüfe, ob die Nachricht NACH dem Subscription-Start erstellt wurde
          const createdAt = change.doc.data().createdAt;
          if (createdAt) {
            const messageTime = createdAt.toDate ? createdAt.toDate().getTime() : new Date(createdAt).getTime();
            // WICHTIG: Nur Nachrichten berücksichtigen, die NACH dem Subscription-Start erstellt wurden
            // Füge 1 Sekunde Puffer hinzu, um Timing-Probleme zu vermeiden
            if (messageTime < subscriptionStartTime - 1000) {
              console.log('🔍 PHASE3: Ignoriere alte Nachricht beim initialen Load:', {
                messageId: change.doc.id,
                messageTime: new Date(messageTime).toISOString(),
                subscriptionStartTime: new Date(subscriptionStartTime).toISOString()
              });
              return false;
            }
          }
          
          return true;
        })
        .map(change => {
          const data = change.doc.data();
          return {
            id: change.doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            timestamp: data.timestamp || (data.createdAt?.toDate?.()?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) || '')
          };
        });
      
      if (newMessages.length > 0) {
        console.log(`⚡ JIT: ${newMessages.length} neue Nachricht(en) empfangen in Chat ${chatId}!`);
      } else if (!isInitialLoad) {
        // Log nur wenn nicht initialer Load (verhindert Spam)
        console.log(`ℹ️ PHASE3: Keine neuen Nachrichten in Chat ${chatId} (${snapshot.docs.length} Nachrichten insgesamt)`);
      }
      
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          timestamp: data.timestamp || (data.createdAt?.toDate?.()?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) || '')
        };
      }).reverse(); // Älteste zuerst
      // WICHTIG: Übergebe auch newMessages für Notification-Erstellung
      callback(snapshot, messages, newMessages);
    }, (error) => {
      // WICHTIG: Fehlerbehandlung für Subscription
      // Firestore versucht automatisch, sich wieder zu verbinden
      // Wir loggen nur kritische Fehler, Transport-Fehler sind normal und werden automatisch behoben
      if (error?.code === 'unavailable' || error?.message?.includes('transport') || error?.type === 'c') {
        // Transport-Fehler sind normal (Netzwerkprobleme, Verbindungswechsel)
        // Firestore verbindet sich automatisch neu
        console.log('⚠️ PHASE3: Firestore Transport-Fehler in Chat-Messages-Subscription (normal, automatische Wiederverbindung):', error?.code || error?.type);
      } else {
        // Andere Fehler sind kritisch und sollten geloggt werden
        console.error('❌ PHASE3: Kritischer Fehler in Chat-Messages-Subscription:', error);
      }
    });
  } catch (error) {
    console.error('❌ Error subscribing to chat messages:', error);
    return () => {};
  }
};

export const markChatAsRead = async (chatId, userId) => {
  try {
    console.log('🔄 Marking chat as read for user:', userId);
    
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      
      // Setze unreadCount auf 0 für diesen User
      // Optional: Tracke unreadCount pro User
      const readBy = chatData.readBy || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
      }
      
      await updateDoc(doc(db, 'chats', chatId), {
        readBy,
        unreadCount: 0, // Für jetzt: ein globaler Count
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('✅ Chat marked as read:', chatId);
    return true;
  } catch (error) {
    console.error('❌ Error marking chat as read:', error);
    throw error;
  }
};

// ===== NOTIFICATIONS MANAGEMENT =====

export const createNotification = async (userId, notificationData) => {
  try {
    console.log('🔄 JIT: Creating notification in Firestore for user:', userId, 'type:', notificationData.type);
    
    // WICHTIG: ZENTRALE PRÜFUNG - Verhindere Notification von eigener Nachricht
    // Wenn senderId oder fromUserId gleich userId ist, ist es eine Notification von der eigenen Nachricht
    // AUSNAHME: hint-small Notifications sollen NICHT blockiert werden, da der Sender seine eigene Tauschanfrage sehen soll
    // WICHTIG: Prüfe NUR, wenn senderId oder fromUserId existiert UND gleich userId ist
    // Wenn toUserId vorhanden ist und NICHT gleich userId ist, dann ist es eine Notification für einen anderen User
    if (notificationData.type === 'message' || notificationData.type === 'chat') {
      // WICHTIG: Wenn toUserId gesetzt ist und NICHT gleich userId ist, dann ist es eine Notification für einen anderen User
      // In diesem Fall soll die Notification NICHT blockiert werden
      const isForAnotherUser = notificationData.toUserId && notificationData.toUserId !== userId;
      
      if (!isForAnotherUser && (notificationData.senderId === userId || notificationData.fromUserId === userId)) {
        console.log('🚫 BLOCKED: Notification von eigener Nachricht wird NICHT erstellt:', {
          userId,
          senderId: notificationData.senderId,
          fromUserId: notificationData.fromUserId,
          toUserId: notificationData.toUserId,
          type: notificationData.type,
          chatId: notificationData.chatId
        });
        logNotificationEvent({
          stage: 'firestore/createNotification/blocked',
          type: notificationData?.type || 'unknown',
          data: {
            userId,
            reason: 'own-message',
            senderId: notificationData.senderId,
            fromUserId: notificationData.fromUserId,
            toUserId: notificationData.toUserId,
            chatId: notificationData?.chatId,
          },
        });
        return null; // Keine Notification erstellen
      }
    }
    
    logNotificationEvent({
      stage: 'firestore/createNotification/start',
      type: notificationData?.type || 'unknown',
      data: {
        userId,
        requestId: notificationData?.requestId,
        chatId: notificationData?.chatId,
        hintType: notificationData?.hintType,
      },
    });
    
    // Entferne undefined Felder
    const cleanNotificationData = Object.keys(notificationData).reduce((acc, key) => {
      if (notificationData[key] !== undefined) {
        acc[key] = notificationData[key];
      }
      return acc;
    }, {});
    
    // WICHTIG: Erstelle Notification sofort - addDoc schreibt synchron in Firestore
    // Die Subscription wird sofort über die Änderung informiert
    const notificationRef = await addDoc(collection(db, 'users', userId, 'notifications'), {
      ...cleanNotificationData,
      isRead: false,
      isArchived: false,  // PHASE 3: Neues Feld
      isCompleted: false, // PHASE 3: Neues Feld
      createdAt: serverTimestamp()
    });
    
    console.log('⚡ JIT: Notification created in Firestore:', notificationRef.id, 'type:', notificationData.type);
    logNotificationEvent({
      stage: 'firestore/createNotification/success',
      type: notificationData?.type || 'unknown',
      data: {
        userId,
        notificationId: notificationRef.id,
      },
    });
    return notificationRef.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    logNotificationEvent({
      stage: 'firestore/createNotification/error',
      type: notificationData?.type || 'unknown',
      data: { userId },
      meta: { message: error?.message },
    });
    throw error;
  }
};

export const getNotificationsForUser = async (userId) => {
  try {
    console.log('🔄 Getting notifications for user:', userId);
    logNotificationEvent({
      stage: 'firestore/getNotifications/start',
      type: 'notifications',
      data: { userId },
    });
    
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    // WICHTIG: Filtere gelesene Notifications und Notifications von eigenen Nachrichten direkt beim Laden
    // Nur ungelesene Notifications werden zurückgegeben (isRead !== true)
    // Filtere auch Notifications, bei denen senderId oder fromUserId gleich userId ist (eigene Nachricht)
    const notifications = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        };
      })
      .filter(notification => {
        // Behalte nur ungelesene Notifications (isRead !== true oder undefined)
        if (notification.isRead === true) {
          return false;
        }
        
        // PHASE 3: Filtere archivierte Notifications
        if (notification.isArchived === true) {
          return false;
        }
        
        // WICHTIG: Filtere Notifications von eigenen Nachrichten
        // WICHTIG: hint-small und hint-decision Notifications sollen IMMER angezeigt werden
        // hint-small: Für den Sender (fromUserId === userId) - er soll seine eigene Tauschanfrage sehen
        // hint-decision: Für den Empfänger (toUserId === userId) - er soll die Tauschanfrage sehen
        // trade-info: Soll auch angezeigt werden, wenn sie für den User bestimmt ist
        
        // WICHTIG: hint-small, hint-decision und trade-info NICHT filtern, egal was
        if (notification.type === 'hint-small' || notification.type === 'hint-decision') {
          return true; // Immer anzeigen
        }
        
        // trade-info: Nur anzeigen, wenn sie für diesen User bestimmt ist
        if (notification.type === 'trade-info') {
          const isForThisUser = (notification.toUserId === userId || notification.fromUserId === userId);
          if (isForThisUser) {
            return true; // Für diesen User bestimmt, anzeigen
          }
        }
        
        // Für andere Notification-Typen: Filtere nur, wenn es wirklich eine eigene Nachricht ist
        // Wenn senderId oder fromUserId gleich userId ist, ist es eine Notification von der eigenen Nachricht
        // AUSNAHME: Chat-Notifications mit toUserId sollen NICHT gefiltert werden, wenn toUserId === userId
        // (d.h. die Notification ist für diesen User bestimmt, auch wenn senderId/fromUserId gleich userId ist)
        const isOwnMessage = notification.senderId === userId || notification.fromUserId === userId;
        const isChatNotificationForThisUser = (notification.type === 'chat' || notification.type === 'message') && 
                                             notification.toUserId && 
                                             notification.toUserId === userId;
        
        if (isOwnMessage && !isChatNotificationForThisUser) {
          console.log('🔍 DEBUG: Filtere Notification von eigener Nachricht beim Laden:', { 
            notificationId: notification.id, 
            senderId: notification.senderId, 
            fromUserId: notification.fromUserId, 
            toUserId: notification.toUserId,
            userId,
            type: notification.type
          });
          return false;
        }
        
        return true;
      });
    
    console.log(`✅ Found ${notifications.length} ungelesene Notifications (von ${querySnapshot.docs.length} insgesamt)`);
    logNotificationEvent({
      stage: 'firestore/getNotifications/success',
      type: 'notifications',
      data: {
        userId,
        count: notifications.length,
        total: querySnapshot.docs.length,
      },
    });
    return notifications;
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    logNotificationEvent({
      stage: 'firestore/getNotifications/error',
      type: 'notifications',
      data: { userId },
      meta: { message: error?.message },
    });
    return [];
  }
};

export const subscribeNotificationsForUser = (userId, callback, filters = {}) => {
  try {
    console.log('🔄 Subscribing to notifications for user:', userId, 'filters:', filters);
    logNotificationEvent({
      stage: 'firestore/subscribeNotifications/start',
      type: 'notifications',
      data: { userId, filters },
    });
    
    const {
      includeRead = false, // Standard: nur ungelesene
      includeArchived = false, // Standard: keine archivierten
    } = filters;
    
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc')
    );
    
    // WICHTIG: Track ob dies der erste Callback ist (initial load)
    // Beim ersten Callback werden ALLE existierenden Notifications als "added" erkannt
    // Wir müssen diese als "initial load" behandeln, nicht als "neue Notifications"
    // WICHTIG: Verwende globale Map, damit alle Subscriptions für denselben User die gleichen bekannten IDs teilen
    if (!knownNotificationIdsPerUser.has(userId)) {
      knownNotificationIdsPerUser.set(userId, new Set());
    }
    const knownNotificationIds = knownNotificationIdsPerUser.get(userId);
    
    // WICHTIG: isFirstSnapshot muss außerhalb des Callbacks definiert werden, damit es über mehrere Callbacks hinweg persistent bleibt
    // Wenn bereits bekannte Notifications existieren, ist es nicht der erste Snapshot
    let isFirstSnapshot = knownNotificationIds.size === 0;
    
    // WICHTIG: Verwende onSnapshot mit sofortiger Reaktion auf Änderungen
    // Die Subscription reagiert sofort auf neue Notifications in Firestore
    return onSnapshot(q, (snapshot) => {
      // PHASE 5: Filtere basierend auf filters-Parameter
      const notifications = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
          };
        })
        .filter(notification => {
          // WICHTIG: Filtere archivierte Notifications ZUERST (auch bei hint-small, hint-decision, etc.)
          // Archivierte Notifications sollen NIEMALS angezeigt werden, unabhängig vom Typ
          if (!includeArchived && notification.isArchived === true) {
            console.log('🗑️ database-web: Filtere archivierte Notification heraus (unabhängig vom Typ):', {
              id: notification.id,
              type: notification.type,
              isArchived: notification.isArchived
            });
            return false;
          }
          
          // WICHTIG: Prüfe auch auf archivedAt (als zusätzliche Sicherheit)
          if (!includeArchived && notification.archivedAt) {
            console.log('🗑️ database-web: Filtere Notification mit archivedAt heraus:', {
              id: notification.id,
              type: notification.type,
              archivedAt: notification.archivedAt
            });
            return false;
          }
          
          // Filter: Gelesen (nur wenn includeRead === false)
          if (!includeRead && notification.isRead === true) {
            return false;
          }
          
          // WICHTIG: Filtere Notifications von eigenen Nachrichten
          // WICHTIG: hint-small und hint-decision Notifications sollen angezeigt werden (wenn nicht archiviert)
          // hint-small: Für den Sender (fromUserId === userId) - er soll seine eigene Tauschanfrage sehen
          // hint-decision: Für den Empfänger (toUserId === userId) - er soll die Tauschanfrage sehen
          // trade-info: Soll auch angezeigt werden, wenn sie für den User bestimmt ist
          
          // WICHTIG: hint-small, hint-decision und trade-info NICHT filtern (wenn nicht archiviert)
          if (notification.type === 'hint-small' || notification.type === 'hint-decision') {
            return true; // Immer anzeigen (wenn nicht archiviert)
          }
          
          // trade-info: Nur anzeigen, wenn sie für diesen User bestimmt ist
          if (notification.type === 'trade-info') {
            const isForThisUser = (notification.toUserId === userId || notification.fromUserId === userId);
            if (isForThisUser) {
              return true; // Für diesen User bestimmt, anzeigen
            }
          }
          
          // Für andere Notification-Typen: Filtere nur, wenn es wirklich eine eigene Nachricht ist
          // Wenn senderId oder fromUserId gleich userId ist, ist es eine Notification von der eigenen Nachricht
          // AUSNAHME: Chat-Notifications mit toUserId sollen NICHT gefiltert werden, wenn toUserId === userId
          // (d.h. die Notification ist für diesen User bestimmt, auch wenn senderId/fromUserId gleich userId ist)
          const isOwnMessage = notification.senderId === userId || notification.fromUserId === userId;
          const isChatNotificationForThisUser = (notification.type === 'chat' || notification.type === 'message') && 
                                               notification.toUserId && 
                                               notification.toUserId === userId;
          
          if (isOwnMessage && !isChatNotificationForThisUser) {
            console.log('🔍 DEBUG: Filtere Notification von eigener Nachricht in Subscription:', { 
              notificationId: notification.id, 
              senderId: notification.senderId, 
              fromUserId: notification.fromUserId, 
              toUserId: notification.toUserId,
              userId,
              type: notification.type
            });
            return false;
          }
          
          return true;
        });
      
      // WICHTIG: Beim ersten Callback (initial load) werden ALLE existierenden Notifications als "added" erkannt
      // Wir müssen diese als "initial load" behandeln, nicht als "neue Notifications"
      // Nur bei nachfolgenden Callbacks sollten wir wirklich neue Notifications erkennen
      
      // Track alle aktuellen Notification-IDs für zukünftige Vergleiche
      const currentNotificationIds = new Set(snapshot.docs.map(doc => doc.id));
      
      // WICHTIG: Beim ersten Callback: Alle Notifications als "bekannt" markieren
      // WICHTIG: Prüfe auch, ob bereits bekannte Notifications existieren (von anderen Subscriptions)
      // Wenn ja, sollten wir diese nicht als "neu" behandeln
      if (isFirstSnapshot) {
        console.log(`📥 PHASE3: Initial Load - ${snapshot.docs.length} existierende Notifications geladen (werden NICHT als "neu" behandelt)`);
        // Markiere ALLE existierenden Notifications als bekannt
        snapshot.docs.forEach(doc => {
          knownNotificationIds.add(doc.id);
        });
        // WICHTIG: Setze isFirstSnapshot auf false, damit nachfolgende Callbacks neue Notifications erkennen
        isFirstSnapshot = false;
        // Beim initial load: KEINE "neuen" Notifications melden
        // Alle existierenden Notifications sind bereits bekannt
        // WICHTIG: Kein return hier - wir müssen trotzdem den Callback mit allen Notifications aufrufen
      } else {
        // Nach dem initial load: Nur wirklich neue Notifications erkennen
        const newNotifications = snapshot.docChanges()
          .filter(change => {
            // Nur "added" Events nach dem initial load
            if (change.type !== 'added') {
              return false;
            }
            // WICHTIG: Prüfe ob diese Notification bereits bekannt ist
            // Wenn ja, ist es kein wirklich neues Dokument
            if (knownNotificationIds.has(change.doc.id)) {
              return false; // Bereits bekannt, nicht als "neu" behandeln
            }
            return true;
          })
          .map(change => {
            const data = change.doc.data();
            return {
              id: change.doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
            };
          })
          .filter(notification => {
            // PHASE 5: Filter basierend auf includeRead
            if (!includeRead && notification.isRead === true) {
              return false;
            }
            
            // PHASE 5: Filter basierend auf includeArchived
            if (!includeArchived && notification.isArchived === true) {
              return false;
            }
            
            // WICHTIG: Filtere Notifications von eigenen Nachrichten
            // Wenn senderId oder fromUserId gleich userId ist, ist es eine Notification von der eigenen Nachricht
            // AUSNAHME: hint-small Notifications sollen NICHT gefiltert werden, da der Sender seine eigene Tauschanfrage sehen soll
            // AUSNAHME: hint-decision Notifications sollen NICHT gefiltert werden, wenn toUserId === userId (Empfänger)
            // AUSNAHME: trade-info Notifications sollen NICHT gefiltert werden, wenn sie für den User bestimmt sind
            // AUSNAHME: Chat-Notifications mit toUserId sollen NICHT gefiltert werden, wenn toUserId === userId
            // (d.h. die Notification ist für diesen User bestimmt, auch wenn senderId/fromUserId gleich userId ist)
            const isOwnMessage = notification.senderId === userId || notification.fromUserId === userId;
            const isHintSmall = notification.type === 'hint-small';
            const isHintDecision = notification.type === 'hint-decision';
            const isTradeInfo = notification.type === 'trade-info';
            const isHintDecisionForThisUser = isHintDecision && notification.toUserId && notification.toUserId === userId;
            const isTradeInfoForThisUser = isTradeInfo && (notification.toUserId === userId || notification.fromUserId === userId);
            const isChatNotificationForThisUser = (notification.type === 'chat' || notification.type === 'message') && 
                                                 notification.toUserId && 
                                                 notification.toUserId === userId;
            
            if (isOwnMessage && !isHintSmall && !isHintDecisionForThisUser && !isTradeInfoForThisUser && !isChatNotificationForThisUser) {
              console.log('🔍 DEBUG: Filtere neue Notification von eigener Nachricht in Subscription:', { 
                notificationId: notification.id, 
                senderId: notification.senderId, 
                fromUserId: notification.fromUserId,
                toUserId: notification.toUserId,
                userId,
                type: notification.type
              });
              return false;
            }
            
            return true;
          });
        
        // Markiere neue Notifications als bekannt
        newNotifications.forEach(n => {
          knownNotificationIds.add(n.id);
        });
        
        // Entferne Notifications aus knownNotificationIds, die nicht mehr in Firestore existieren
        knownNotificationIds.forEach(id => {
          if (!currentNotificationIds.has(id)) {
            knownNotificationIds.delete(id);
          }
        });
        
        if (newNotifications.length > 0) {
          console.log(`⚡ JIT: ${newNotifications.length} WIRKLICH neue Notification(s) empfangen!`, newNotifications.map(n => ({ id: n.id, type: n.type, title: n.title })));
          logNotificationEvent({
            stage: 'firestore/subscribeNotifications/new',
            type: 'notifications',
            data: {
              userId,
              count: newNotifications.length,
              notifications: newNotifications.map(n => ({
                id: n.id,
                type: n.type,
                requestId: n.requestId,
                chatId: n.chatId,
              })),
            },
          });
        }
      }
      
      console.log(`📡 ${notifications.length} ungelesene Notifications (von ${snapshot.docs.length} insgesamt)`);
      
      // WICHTIG: Wenn Firestore leer ist (snapshot.docs.length === 0), sollte auch notifications leer sein
      // Wenn nicht, gibt es ein Problem mit der Filterlogik
      if (snapshot.docs.length === 0 && notifications.length > 0) {
        console.error('❌ KRITISCH: Firestore ist leer, aber notifications Array ist nicht leer!', {
          snapshotDocsCount: snapshot.docs.length,
          notificationsCount: notifications.length,
          notifications: notifications.map(n => ({ id: n.id, type: n.type }))
        });
        // WICHTIG: Setze notifications auf leeres Array, wenn Firestore leer ist
        // Firestore ist die Quelle der Wahrheit
        notifications = [];
      }
      
      logNotificationEvent({
        stage: 'firestore/subscribeNotifications/snapshot',
        type: 'notifications',
        data: {
          userId,
          count: notifications.length,
          total: snapshot.docs.length,
        },
      });
      if (typeof callback === 'function') {
        callback(snapshot, notifications);
      }
    }, (error) => {
      // WICHTIG: Fehlerbehandlung für Subscription
      // Firestore versucht automatisch, sich wieder zu verbinden
      // Wir loggen nur kritische Fehler, Transport-Fehler sind normal und werden automatisch behoben
      if (error?.code === 'unavailable' || error?.message?.includes('transport') || error?.type === 'c') {
        // Transport-Fehler sind normal (Netzwerkprobleme, Verbindungswechsel)
        // Firestore verbindet sich automatisch neu
        console.log('⚠️ PHASE3: Firestore Transport-Fehler (normal, automatische Wiederverbindung):', error?.code || error?.type);
      } else {
        // Andere Fehler sind kritisch und sollten geloggt werden
        console.error('❌ PHASE3: Kritischer Fehler in Notification-Subscription:', error);
        logNotificationEvent({
          stage: 'firestore/subscribeNotifications/error',
          type: 'notifications',
          data: { userId },
          meta: { message: error?.message, code: error?.code },
        });
      }
    });
  } catch (error) {
    console.error('❌ Error subscribing to notifications:', error);
    logNotificationEvent({
      stage: 'firestore/subscribeNotifications/error',
      type: 'notifications',
      data: { userId },
      meta: { message: error?.message },
    });
    return () => {};
  }
};

export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    console.log('🔄 Marking notification as read:', notificationId);
    
    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
      isRead: true,
      readAt: serverTimestamp()
    });
    
    console.log('✅ Notification marked as read:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

// Finde eine ungelesene Chat-Notification für einen bestimmten Chat
// WICHTIG: Finde ALLE Chat-Notifications für einen Chat (auch gelesene) - für Duplikat-Prüfung
export const findAnyChatNotification = async (userId, chatId, senderId = null, toUserId = null) => {
  try {
    console.log('🔍 Finding any chat notification for chat:', chatId, 'user:', userId, 'senderId:', senderId, 'toUserId:', toUserId);
    
    // WICHTIG: Suche zuerst nach Notifications mit dem gleichen chatId
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('chatId', '==', chatId),
      where('type', '==', 'chat')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Wenn mehrere Notifications gefunden wurden, logge das als Warnung und lösche Duplikate
      if (querySnapshot.docs.length > 1) {
        console.warn('⚠️ MEHRERE Chat-Notifications gefunden für denselben Chat! (Duplikate):', {
          userId,
          chatId,
          count: querySnapshot.docs.length,
          notificationIds: querySnapshot.docs.map(doc => doc.id)
        });
        
        // Lösche alle außer der neuesten Notification (Duplikate entfernen)
        const sortedDocs = querySnapshot.docs.sort((a, b) => {
          const aTime = a.data().createdAt?.toDate?.()?.getTime() || 
                       (a.data().updatedAt?.toDate?.()?.getTime() || 0);
          const bTime = b.data().createdAt?.toDate?.()?.getTime() || 
                       (b.data().updatedAt?.toDate?.()?.getTime() || 0);
          return bTime - aTime; // Neueste zuerst
        });
        
        // Behalte nur die neueste, lösche den Rest
        const duplicateDocs = sortedDocs.slice(1);
        if (duplicateDocs.length > 0) {
          console.log(`🗑️ Lösche ${duplicateDocs.length} Duplikat-Chat-Notifications für Chat ${chatId}...`);
          const batch = writeBatch(db);
          duplicateDocs.forEach(doc => {
            batch.delete(doc.ref);
          });
          try {
            await batch.commit();
            console.log(`✅ ${duplicateDocs.length} Duplikat-Chat-Notifications gelöscht`);
          } catch (error) {
            console.error('❌ Fehler beim Löschen von Duplikat-Notifications:', error);
          }
        }
        
        // Gib die neueste Notification zurück
        return {
          id: sortedDocs[0].id,
          ...sortedDocs[0].data(),
          createdAt: sortedDocs[0].data().createdAt?.toDate?.()?.toISOString() || sortedDocs[0].data().createdAt
        };
      }
      
      // Gib die erste Notification zurück (sollte nur eine pro Chat geben)
      const notificationDoc = querySnapshot.docs[0];
      const data = notificationDoc.data();
      console.log('✅ Chat-Notification gefunden:', { notificationId: notificationDoc.id, chatId, userId });
      return {
        id: notificationDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
    }
    
    // WICHTIG: Fallback: Wenn keine Notification mit chatId gefunden wurde,
    // aber senderId und toUserId vorhanden sind, suche nach Notifications mit gleicher Kombination
    // Dies hilft, Duplikate zu finden, die mit verschiedenen chatId's erstellt wurden
    if (senderId && toUserId) {
      console.log('🔍 Keine Notification mit chatId gefunden, suche nach senderId/toUserId Kombination:', { senderId, toUserId });
      
      const fallbackQ = query(
        collection(db, 'users', userId, 'notifications'),
        where('type', '==', 'chat'),
        where('senderId', '==', senderId),
        where('toUserId', '==', toUserId)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQ);
      
      if (!fallbackSnapshot.empty) {
        // Wenn mehrere gefunden, nimm die neueste
        const sorted = fallbackSnapshot.docs.sort((a, b) => {
          const aTime = a.data().createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.data().createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });
        
        const notificationDoc = sorted[0];
        const data = notificationDoc.data();
        console.log('✅ Chat-Notification gefunden über senderId/toUserId:', { 
          notificationId: notificationDoc.id, 
          chatId: data.chatId, 
          requestedChatId: chatId,
          userId 
        });
        
        // WICHTIG: Wenn die gefundene Notification eine andere chatId hat, aktualisiere sie mit der korrekten chatId
        if (data.chatId !== chatId) {
          console.log('🔄 Aktualisiere Notification mit korrekter chatId:', { 
            oldChatId: data.chatId, 
            newChatId: chatId 
          });
          try {
            await updateDoc(doc(db, 'users', userId, 'notifications', notificationDoc.id), {
              chatId: chatId,
              updatedAt: serverTimestamp()
            });
          } catch (error) {
            console.error('❌ Fehler beim Aktualisieren der chatId:', error);
          }
        }
        
        return {
          id: notificationDoc.id,
          ...data,
          chatId: chatId, // Verwende die korrekte chatId
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        };
      }
    }
    
    console.log('🔍 Keine Chat-Notification gefunden für:', { userId, chatId });
    return null;
  } catch (error) {
    console.error('❌ Error finding any chat notification:', error);
    return null;
  }
};

export const findUnreadChatNotification = async (userId, chatId) => {
  try {
    console.log('🔍 Finding unread chat notification for chat:', chatId, 'user:', userId);
    
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('chatId', '==', chatId),
      where('type', '==', 'chat'),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.docs.length > 0) {
      // Gebe die neueste ungelesene Notification zurück
      const latestNotification = querySnapshot.docs
        .sort((a, b) => {
          const aTime = a.data().createdAt?.toMillis() || 0;
          const bTime = b.data().createdAt?.toMillis() || 0;
          return bTime - aTime;
        })[0];
      
      console.log('✅ Found unread chat notification:', latestNotification.id);
      return { id: latestNotification.id, ...latestNotification.data() };
    }
    
    console.log('ℹ️ No unread chat notification found for chat:', chatId);
    return null;
  } catch (error) {
    console.error('❌ Error finding unread chat notification:', error);
    throw error;
  }
};

// Aktualisiere eine bestehende Notification
export const updateNotification = async (userId, notificationId, updates) => {
  try {
    console.log('🔄 Updating notification:', notificationId, 'updates:', updates);
    
    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Notification updated:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Error updating notification:', error);
    throw error;
  }
};

export const deleteNotification = async (userId, notificationId) => {
  try {
    console.log('🔄 Deleting notification:', notificationId);
    
    await deleteDoc(doc(db, 'users', userId, 'notifications', notificationId));
    
    console.log('✅ Notification deleted:', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    throw error;
  }
};

// Lösche alle Notifications für einen bestimmten Hinweis (basierend auf tradeRequestId)
export const deleteNotificationsForHint = async (userId, tradeRequestId) => {
  try {
    console.log('🔄 Deleting notifications for hint (tradeRequestId):', tradeRequestId);
    
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('requestId', '==', tradeRequestId)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Deleted ${querySnapshot.docs.length} notifications for hint (tradeRequestId: ${tradeRequestId})`);
    return querySnapshot.docs.length;
  } catch (error) {
    console.error('❌ Error deleting notifications for hint:', error);
    throw error;
  }
};

// Lösche alle Notifications für einen bestimmten Chat (basierend auf chatId oder tradeRequestId)
export const deleteNotificationsForChat = async (userId, chatId, tradeRequestId = null) => {
  try {
    console.log('🔄 Deleting notifications for chat:', chatId, 'tradeRequestId:', tradeRequestId);
    
    const notificationsToDelete = [];
    
    // Finde Notifications für diesen Chat (chatId)
    // WICHTIG: Lösche NUR Chat-Notifications, NICHT Hinweis-Notifications (hint-decision, hint-small)
    // Hinweise sollen bleiben, bis der User sie manuell löscht
    const q1 = query(
      collection(db, 'users', userId, 'notifications'),
      where('chatId', '==', chatId),
      where('type', '==', 'chat')
    );
    const snapshot1 = await getDocs(q1);
    snapshot1.docs.forEach(doc => notificationsToDelete.push(doc.ref));
    
    // Finde Notifications für diesen Trade-Request (wenn vorhanden)
    if (tradeRequestId) {
      // Firestore unterstützt 'in' Queries, aber wir machen separate Queries für bessere Kompatibilität
      const types = ['trade', 'chat', 'trade-info'];
      const queries = types.map(type => 
        query(
          collection(db, 'users', userId, 'notifications'),
          where('requestId', '==', tradeRequestId),
          where('type', '==', type)
        )
      );
      
      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          // Vermeide Duplikate
          if (!notificationsToDelete.find(ref => ref.id === doc.id)) {
            notificationsToDelete.push(doc.ref);
          }
        });
      });
    }
    
    // Lösche alle gefundenen Notifications
    const deletePromises = notificationsToDelete.map(ref => deleteDoc(ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Deleted ${notificationsToDelete.length} notifications for chat (chatId: ${chatId})`);
    return notificationsToDelete.length;
  } catch (error) {
    console.error('❌ Error deleting notifications for chat:', error);
    throw error;
  }
};

// Lösche alle Notifications für einen Trade-Request (für beide User)
export const deleteNotificationsForTradeRequest = async (userId, requestId) => {
  try {
    console.log('🔄 Deleting notifications for trade request:', requestId);
    
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('requestId', '==', requestId)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Deleted ${querySnapshot.docs.length} notifications for trade request (requestId: ${requestId})`);
    return querySnapshot.docs.length;
  } catch (error) {
    console.error('❌ Error deleting notifications for trade request:', error);
    throw error;
  }
};
