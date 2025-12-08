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
  writeBatch,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase-web';
import { onSnapshot } from 'firebase/firestore';
import { logNotificationEvent } from './notificationLogger';

// WICHTIG: Globale Tracking-Maps für Subscriptions (verhindert Duplikate)
// Diese Maps tracken bekannte Notifications pro User, um zu verhindern, dass existierende Notifications als "neu" erkannt werden
const knownNotificationIdsPerUser = new Map(); // Map<userId, Set<notificationId>>

/**
 * Konvertiert altes labelImage zu labelImages Array für Rückwärtskompatibilität
 * @param {Object} wine - Wein-Objekt aus Firestore
 * @returns {Object} Wein mit normalisiertem labelImages Array
 */
const normalizeWineImages = (wine) => {
  if (!wine) return wine;
  
  // Wenn labelImages bereits existiert, verwende es
  if (wine.labelImages && Array.isArray(wine.labelImages) && wine.labelImages.length > 0) {
    return wine;
  }
  
  // Wenn nur labelImage existiert, konvertiere zu labelImages
  if (wine.labelImage) {
    return {
      ...wine,
      labelImages: [wine.labelImage]
    };
  }
  
  // Kein Bild vorhanden
  return {
    ...wine,
    labelImages: []
  };
};

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
      subscriptionType: userData.subscriptionType || 'basic', // Standard: basic
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
    
    // Prüfe ob es ein Firestore-Verbindungsfehler ist
    if (error.message && (
      error.message.includes('Could not reach Cloud Firestore') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('offline') ||
      error.message.includes('Backend didn\'t respond')
    )) {
      const connectionError = new Error('Could not reach Cloud Firestore backend');
      connectionError.originalError = error;
      throw connectionError;
    }
    
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

// BTP-Funktionen entfernt - BTP wird nicht mehr verwendet

/**
 * Löscht das Profilbild eines Users
 * @param {string} uid - User UID
 * @returns {Promise<boolean>} Erfolg
 */
export const deleteUserProfileImage = async (uid) => {
  try {
    console.log('🔄 Löschen des Profilbildes für User:', uid);
    
    // Hole User-Daten
    const userData = await getUser(uid);
    if (!userData) {
      throw new Error('User not found');
    }
    
    // Wenn ein Profilbild existiert, lösche es aus Storage
    if (userData.profilbild) {
      try {
        await deleteImageFromStorage(userData.profilbild);
        console.log('✅ Profilbild aus Storage gelöscht');
      } catch (error) {
        console.warn('⚠️ Fehler beim Löschen des Profilbildes aus Storage (nicht kritisch):', error);
        // Fehler beim Löschen aus Storage ist nicht kritisch, fahre fort
      }
    }
    
    // Setze Profilbild in Firestore auf null
    const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), {
      profilbild: null,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Profilbild erfolgreich gelöscht');
    return true;
    
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Profilbildes:', error);
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

// Lade alle User aus Firestore
export const getAllUsers = async () => {
  try {
    const usersQuery = query(collection(db, 'users'));
    const querySnapshot = await getDocs(usersQuery);
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return users;
  } catch (error) {
    console.error('❌ Error getting all users:', error);
    throw error;
  }
};

/**
 * Ruft alle Admin-User aus Firestore ab
 * @returns {Promise<Array>} Array von Admin-Usern
 */
export const getAllAdmins = async () => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('isAdmin', '==', true)
    );
    const querySnapshot = await getDocs(usersQuery);
    
    const admins = querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Found ${admins.length} admin(s)`);
    return admins;
  } catch (error) {
    console.error('❌ Error getting all admins:', error);
    throw error;
  }
};

/**
 * Erstellt Notifications für alle Admins, wenn ein neuer User sich registriert
 * @param {string} newUserId - UID des neuen Users
 * @param {string} newUserUsername - Username des neuen Users
 * @param {string} newUserEmail - E-Mail des neuen Users
 * @returns {Promise<void>}
 */
export const notifyAdminsAboutNewRegistration = async (newUserId, newUserUsername, newUserEmail) => {
  try {
    console.log('🔄 Notifying admins about new registration:', newUserUsername);
    
    // Alle Admins abrufen
    const admins = await getAllAdmins();
    
    if (admins.length === 0) {
      console.log('ℹ️ No admins found, skipping notification');
      return;
    }
    
    // Für jeden Admin eine Notification erstellen
    const notificationPromises = admins.map(admin => {
      return createNotification(admin.uid, {
        type: 'system',
        title: 'Neue Registrierung',
        message: `Neuer User "${newUserUsername}" (${newUserEmail}) hat sich registriert.`,
        userId: newUserId,
        username: newUserUsername,
        email: newUserEmail,
        action: 'view_user', // Optional: für spätere Navigation zum User-Profil
        isRead: false,
        isArchived: false,
        isCompleted: false
      });
    });
    
    // Alle Notifications parallel erstellen
    await Promise.all(notificationPromises);
    
    console.log(`✅ Created registration notifications for ${admins.length} admin(s)`);
  } catch (error) {
    console.error('❌ Error notifying admins about new registration:', error);
    // Fehler nicht weiterwerfen, damit Registrierung nicht fehlschlägt
  }
};

/**
 * Ruft den ersten Admin-User aus Firestore ab (für Support-Chat)
 * @returns {Promise<Object|null>} Admin-User oder null wenn kein Admin gefunden
 */
export const getFirstAdmin = async () => {
  try {
    const admins = await getAllAdmins();
    if (admins.length === 0) {
      console.log('ℹ️ No admin found');
      return null;
    }
    // Gibt den ersten Admin zurück
    return admins[0];
  } catch (error) {
    console.error('❌ Error getting first admin:', error);
    throw error;
  }
};

/**
 * Erstellt einen Support-Chat zwischen einem User und dem Admin
 * @param {string} userId - UID des Users, der Support anfragt
 * @returns {Promise<string>} Chat-ID des erstellten Chats
 */
export const createSupportChat = async (userId) => {
  try {
    console.log('🔄 Creating support chat for user:', userId);
    
    // Admin finden
    const admin = await getFirstAdmin();
    if (!admin) {
      throw new Error('Kein Admin gefunden. Support-Chat kann nicht erstellt werden.');
    }
    
    // Prüfe, ob bereits ein Support-Chat existiert
    const existingChats = await getChatsForUser(userId);
    const existingSupportChat = existingChats.find(chat => 
      chat.participants && 
      chat.participants.includes(admin.uid) && 
      chat.type === 'chat' &&
      chat.entryType === 'chat'
    );
    
    if (existingSupportChat) {
      console.log('ℹ️ Support-Chat existiert bereits:', existingSupportChat.id);
      return existingSupportChat.id;
    }
    
    // Neuen Support-Chat erstellen
    const chatData = {
      type: 'chat',
      entryType: 'chat',
      participants: [userId, admin.uid],
      createdBy: userId,
      lastMessage: 'Support-Anfrage gestartet',
      lastMessageSenderId: userId,
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: 0,
      readBy: [],
      isSupportChat: true // Markierung als Support-Chat
    };
    
    const chatId = await createChat(chatData);
    
    // System-Nachricht hinzufügen
    try {
      await addChatMessage(chatId, {
        senderId: 'system',
        message: `Dies ist der Support-Chat. ${admin.username || admin.email || 'Admin'} wird dir hierbei helfen.`,
        timestamp: serverTimestamp(),
        isSystemMessage: true
      });
    } catch (messageError) {
      console.error('⚠️ Fehler beim Hinzufügen der System-Nachricht (Chat wurde trotzdem erstellt):', messageError);
    }
    
    console.log('✅ Support-Chat erstellt:', chatId);
    return chatId;
  } catch (error) {
    console.error('❌ Error creating support chat:', error);
    throw error;
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
    const wines = winesSnapshot.docs.map(doc => normalizeWineImages({ id: doc.id, ...doc.data() }));
    
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
    const wines = winesSnapshot.docs.map(doc => normalizeWineImages({ id: doc.id, ...doc.data() }));
    
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
 * Validiert ein Profilbild vor dem Upload
 * @param {string} imageUri - URI des Bildes
 * @param {number} fileSize - Dateigröße in Bytes (optional)
 * @param {string} mimeType - MIME-Type des Bildes (optional)
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export const validateProfileImage = async (imageUri, fileSize = null, mimeType = null) => {
  try {
    // Maximale Dateigröße: 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in Bytes
    
    // Erlaubte Formate
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
    const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
    
    // Prüfe Dateigröße, falls verfügbar
    if (fileSize !== null && fileSize > MAX_FILE_SIZE) {
      const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `Das Bild ist zu groß (${sizeInMB} MB). Maximale Größe: 5 MB.`
      };
    }
    
    // Prüfe MIME-Type, falls verfügbar
    if (mimeType) {
      if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
        return {
          valid: false,
          error: 'Nur JPG- und PNG-Bilder sind erlaubt.'
        };
      }
    }
    
    // Prüfe Dateierweiterung aus URI
    const uriLower = imageUri.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => uriLower.includes(ext));
    
    if (!hasValidExtension && !mimeType) {
      // Wenn keine MIME-Type verfügbar ist und keine gültige Erweiterung gefunden wurde
      // Versuche, das Format aus dem Blob zu bestimmen
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        if (blob.type && !ALLOWED_MIME_TYPES.includes(blob.type.toLowerCase())) {
          return {
            valid: false,
            error: 'Nur JPG- und PNG-Bilder sind erlaubt.'
          };
        }
      } catch (error) {
        console.warn('⚠️ Konnte Bild-Format nicht prüfen:', error);
        // Wenn Prüfung fehlschlägt, erlaube es (Fallback)
      }
    }
    
    return { valid: true };
  } catch (error) {
    console.error('❌ Fehler bei der Bild-Validierung:', error);
    return {
      valid: false,
      error: 'Fehler bei der Bild-Validierung. Bitte versuchen Sie es erneut.'
    };
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
    
    // Prüfe Limit für Weinregal
    if (wineData.ownerId) {
      const { checkWineRegalLimit } = await import('./subscriptionLimits');
      const limitCheck = await checkWineRegalLimit(wineData.ownerId);
      
      if (!limitCheck.allowed) {
        const error = new Error(limitCheck.message || 'Limit für Weinregal erreicht');
        error.limitExceeded = true;
        error.limitType = 'wineRegal';
        error.current = limitCheck.current;
        error.limit = limitCheck.limit;
        throw error;
      }
    }
    
    // Unterstütze sowohl labelImage (alt) als auch labelImages (neu) für Rückwärtskompatibilität
    let labelImages = wineData.labelImages || (wineData.labelImage ? [wineData.labelImage] : []);
    
    // Lade alle lokalen Bilder hoch
    const uploadedImages = [];
    for (const imageUri of labelImages) {
      if (isLocalImageUri(imageUri)) {
        try {
          const uploadedUrl = await uploadImageToStorage(imageUri, 'wines');
          uploadedImages.push(uploadedUrl);
          console.log('✅ Bild erfolgreich hochgeladen:', uploadedUrl);
        } catch (uploadError) {
          console.error('❌ Fehler beim Hochladen des Bildes:', uploadError);
          // Wenn Upload fehlschlägt, verwende die lokale URI als Fallback
          uploadedImages.push(imageUri);
        }
      } else {
        // Bereits eine URL (Firebase Storage oder andere)
        uploadedImages.push(imageUri);
      }
    }
    
    // Entferne undefined Felder, da Firestore diese nicht akzeptiert
    const cleanWineData = Object.keys(wineData).reduce((acc, key) => {
      if (wineData[key] !== undefined && key !== 'labelImage') { // Entferne altes labelImage
        acc[key] = wineData[key];
      }
      return acc;
    }, {});
    
    // Setze labelImages Array (und labelImage für Rückwärtskompatibilität)
    cleanWineData.labelImages = uploadedImages;
    if (uploadedImages.length > 0) {
      cleanWineData.labelImage = uploadedImages[0]; // Erstes Bild als Fallback für alte Clients
    }
    
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
      .map(doc => normalizeWineImages({
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
    
    let wines = snap1.docs.map(doc => normalizeWineImages({ id: doc.id, ...doc.data() })).sort((a, b) => {
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
    
    // Hole alte Daten für Migration
    const wineDoc = await getDoc(doc(db, 'wines', wineId));
    const oldWineData = wineDoc.exists() ? wineDoc.data() : {};
    const oldLabelImages = oldWineData.labelImages || (oldWineData.labelImage ? [oldWineData.labelImage] : []);
    
    // Unterstütze sowohl labelImage (alt) als auch labelImages (neu) für Rückwärtskompatibilität
    let labelImages = wineData.labelImages || (wineData.labelImage ? [wineData.labelImage] : oldLabelImages);
    
    // Lade alle neuen lokalen Bilder hoch
    const uploadedImages = [];
    for (const imageUri of labelImages) {
      if (isLocalImageUri(imageUri)) {
        try {
          const uploadedUrl = await uploadImageToStorage(imageUri, 'wines');
          uploadedImages.push(uploadedUrl);
          console.log('✅ Bild erfolgreich hochgeladen:', uploadedUrl);
        } catch (uploadError) {
          console.error('❌ Fehler beim Hochladen des Bildes:', uploadError);
          uploadedImages.push(imageUri); // Fallback
        }
      } else {
        uploadedImages.push(imageUri);
      }
    }
    
    // Ersetze labelImages mit den Upload-URLs
    const updateData = {
      ...wineData,
      labelImages: uploadedImages,
      labelImage: uploadedImages.length > 0 ? uploadedImages[0] : null, // Fallback für alte Clients
      updatedAt: serverTimestamp()
    };
    
    // Entferne labelImage aus updateData, wenn labelImages vorhanden ist (verhindert Konflikte)
    if (updateData.labelImages && updateData.labelImages.length > 0) {
      // labelImage wird als Fallback gesetzt
    }
    
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
    
    // Hole Wein-Daten um ownerId zu bekommen
    const wineDoc = await getDoc(doc(db, 'wines', wineId));
    if (!wineDoc.exists()) {
      throw new Error('Wein nicht gefunden');
    }
    const wineData = wineDoc.data();
    const ownerId = wineData.ownerId;
    
    if (!ownerId) {
      throw new Error('Owner-ID nicht gefunden');
    }
    
    // Prüfe Limit für veröffentlichte Weine (nur wenn Wein noch nicht veröffentlicht ist)
    if (wineData.status !== 'public') {
      const { checkPublishedWinesLimit } = await import('./subscriptionLimits');
      const limitCheck = await checkPublishedWinesLimit(ownerId);
      
      if (!limitCheck.allowed) {
        const error = new Error(limitCheck.message || 'Limit für veröffentlichte Weine erreicht');
        error.limitExceeded = true;
        error.limitType = 'publishedWines';
        error.current = limitCheck.current;
        error.limit = limitCheck.limit;
        throw error;
      }
    }
    
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
    
    // Prüfe Limit für vollzogene Trades (nur wenn Status auf 'completed' gesetzt wird)
    if (updates.status === 'completed') {
      // Hole Trade-Request Daten
      const tradeRequestDoc = await getDoc(doc(db, 'tradeRequests', requestId));
      if (tradeRequestDoc.exists()) {
        const tradeData = tradeRequestDoc.data();
        const fromUserId = tradeData.fromUserId;
        const toUserId = tradeData.toUserId;
        
        // Prüfe Limit für beide User (Absender und Empfänger)
        const { checkMonthlyTradesLimit } = await import('./subscriptionLimits');
        
        // Prüfe für Absender
        if (fromUserId) {
          const limitCheckFrom = await checkMonthlyTradesLimit(fromUserId);
          if (!limitCheckFrom.allowed) {
            const error = new Error(limitCheckFrom.message || 'Limit für Trades pro Monat erreicht');
            error.limitExceeded = true;
            error.limitType = 'monthlyTrades';
            error.current = limitCheckFrom.current;
            error.limit = limitCheckFrom.limit;
            error.userId = fromUserId;
            throw error;
          }
        }
        
        // Prüfe für Empfänger
        if (toUserId) {
          const limitCheckTo = await checkMonthlyTradesLimit(toUserId);
          if (!limitCheckTo.allowed) {
            const error = new Error(limitCheckTo.message || 'Limit für Trades pro Monat erreicht');
            error.limitExceeded = true;
            error.limitType = 'monthlyTrades';
            error.current = limitCheckTo.current;
            error.limit = limitCheckTo.limit;
            error.userId = toUserId;
            throw error;
          }
        }
      }
    }
    
    await updateDoc(doc(db, 'tradeRequests', requestId), {
      ...updates,
      updatedAt: serverTimestamp(),
      // Setze completedAt wenn Status auf 'completed' gesetzt wird
      ...(updates.status === 'completed' ? { completedAt: serverTimestamp() } : {})
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

// ============================================================================
// SCHWARZES BRETT / INSERATE FUNKTIONEN
// ============================================================================

/**
 * Erstellt ein neues Inserat im Schwarzen Brett
 * @param {Object} inseratData - Inserat-Daten
 * @param {string} inseratData.type - "suche" oder "biete"
 * @param {string} inseratData.title - Titel des Inserats
 * @param {string} inseratData.description - Beschreibung
 * @param {Array<string>} inseratData.images - Array von Bild-URLs
 * @param {string} inseratData.userId - User-ID des Erstellers
 * @param {string} [inseratData.contactInfo] - Kontaktinformationen (optional)
 * @returns {Promise<string>} ID des erstellten Inserats
 */
export const createInserat = async (inseratData) => {
  try {
    const {
      type,
      title,
      description,
      images = [],
      userId,
      contactInfo = null,
    } = inseratData;

    // Validierung
    if (!type || !['suche', 'biete'].includes(type)) {
      throw new Error('Type muss "suche" oder "biete" sein');
    }
    if (!title || !description || !userId) {
      throw new Error('Titel, Beschreibung und User-ID sind Pflichtfelder');
    }

    const inseratRef = collection(db, 'inserate');
    const newInserat = {
      type,
      title,
      description,
      images,
      userId,
      contactInfo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(inseratRef, newInserat);
    console.log('✅ Inserat erstellt:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Inserats:', error);
    throw error;
  }
};

/**
 * Aktualisiert ein bestehendes Inserat
 * @param {string} inseratId - ID des Inserats
 * @param {Object} updates - Zu aktualisierende Felder
 * @returns {Promise<void>}
 */
export const updateInserat = async (inseratId, updates) => {
  try {
    const inseratRef = doc(db, 'inserate', inseratId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(inseratRef, updateData);
    console.log('✅ Inserat aktualisiert:', inseratId);
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Inserats:', error);
    throw error;
  }
};

/**
 * Löscht ein Inserat
 * @param {string} inseratId - ID des Inserats
 * @returns {Promise<void>}
 */
export const deleteInserat = async (inseratId) => {
  try {
    const inseratRef = doc(db, 'inserate', inseratId);
    await deleteDoc(inseratRef);
    console.log('✅ Inserat gelöscht:', inseratId);
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Inserats:', error);
    throw error;
  }
};

/**
 * Holt ein einzelnes Inserat
 * @param {string} inseratId - ID des Inserats
 * @returns {Promise<Object|null>} Inserat-Daten oder null
 */
export const getInserat = async (inseratId) => {
  try {
    const inseratRef = doc(db, 'inserate', inseratId);
    const docSnap = await getDoc(inseratRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Fehler beim Laden des Inserats:', error);
    throw error;
  }
};

/**
 * Holt alle Inserate (optional gefiltert nach Typ)
 * @param {string} [type] - Optional: "suche" oder "biete" zum Filtern
 * @returns {Promise<Array>} Array von Inseraten
 */
export const getAllInserate = async (type = null) => {
  try {
    const inserateRef = collection(db, 'inserate');
    // Sortiere immer nach createdAt (ohne Filter), dann filtere clientseitig
    // Dies vermeidet die Notwendigkeit eines zusammengesetzten Index
    const q = query(inserateRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const inserate = [];
    
    querySnapshot.forEach((doc) => {
      const data = {
        id: doc.id,
        ...doc.data(),
      };
      
      // Clientseitiges Filtern nach Typ (falls angegeben)
      if (!type || data.type === type) {
        inserate.push(data);
      }
    });
    
    console.log(`✅ ${inserate.length} Inserate geladen${type ? ` (Typ: ${type})` : ''}`);
    return inserate;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Inserate:', error);
    throw error;
  }
};

/**
 * Holt alle Inserate eines Users
 * @param {string} userId - User-ID
 * @returns {Promise<Array>} Array von Inseraten des Users
 */
export const getInserateByUser = async (userId) => {
  try {
    const inserateRef = collection(db, 'inserate');
    const q = query(
      inserateRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const inserate = [];
    
    querySnapshot.forEach((doc) => {
      inserate.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    console.log(`✅ ${inserate.length} Inserate von User ${userId} geladen`);
    return inserate;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Inserate des Users:', error);
    throw error;
  }
};

/**
 * Abonniert Inserate in Echtzeit (optional gefiltert nach Typ)
 * @param {string} [type] - Optional: "suche" oder "biete" zum Filtern
 * @param {Function} callback - Callback-Funktion, die mit dem Array von Inseraten aufgerufen wird
 * @returns {Function} Unsubscribe-Funktion
 */
export const subscribeInserate = (type = null, callback) => {
  try {
    const inserateRef = collection(db, 'inserate');
    // Sortiere immer nach createdAt (ohne Filter), dann filtere clientseitig
    // Dies vermeidet die Notwendigkeit eines zusammengesetzten Index
    const q = query(inserateRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const inserate = [];
        querySnapshot.forEach((doc) => {
          const data = {
            id: doc.id,
            ...doc.data(),
          };
          
          // Clientseitiges Filtern nach Typ (falls angegeben)
          if (!type || data.type === type) {
            inserate.push(data);
          }
        });
        callback(inserate);
      },
      (error) => {
        console.error('❌ Fehler bei Inserate-Subscription:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Fehler beim Abonnieren der Inserate:', error);
    return () => {}; // Leere Unsubscribe-Funktion bei Fehler
  }
};

// ============================================================================
// WUNSCHLISTE FUNKTIONEN
// ============================================================================

/**
 * Erstellt einen neuen Weinwunsch
 * @param {string} userId - User-ID
 * @param {Object} wishData - Wunsch-Daten
 * @param {string} [wishData.name] - Weinname (optional)
 * @param {string} [wishData.winery] - Weingut (optional)
 * @param {number} [wishData.vintage] - Jahrgang (optional)
 * @param {string} [wishData.region] - Region (optional)
 * @param {string} [wishData.grapeVariety] - Rebsorte (optional)
 * @param {string} [wishData.notes] - Notizen (optional)
 * @returns {Promise<string>} ID des erstellten Wunsches
 */
export const createWish = async (userId, wishData) => {
  try {
    // Prüfe Limit für Wunschliste
    const { checkWishlistLimit } = await import('./subscriptionLimits');
    const limitCheck = await checkWishlistLimit(userId);
    
    if (!limitCheck.allowed) {
      const error = new Error(limitCheck.message || 'Limit für Wunschliste erreicht');
      error.limitExceeded = true;
      error.limitType = 'wishlist';
      error.current = limitCheck.current;
      error.limit = limitCheck.limit;
      throw error;
    }
    
    // Validierung: Mindestens ein Feld muss ausgefüllt sein
    const hasAnyField = wishData.name || wishData.winery || wishData.vintage || 
                       wishData.region || wishData.grapeVariety;
    if (!hasAnyField) {
      throw new Error('Mindestens ein Feld (Name, Weingut, Jahrgang, Region oder Rebsorte) muss ausgefüllt sein');
    }

    const wishRef = collection(db, 'users', userId, 'wishlist');
    const newWish = {
      ...wishData,
      hasMatch: false,
      matchedWineIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastCheckedAt: serverTimestamp(),
    };

    const docRef = await addDoc(wishRef, newWish);
    console.log('✅ Wunsch erstellt:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Wunsches:', error);
    throw error;
  }
};

/**
 * Aktualisiert einen Weinwunsch
 * @param {string} userId - User-ID
 * @param {string} wishId - Wunsch-ID
 * @param {Object} wishData - Aktualisierte Wunsch-Daten
 * @returns {Promise<boolean>} Erfolg
 */
export const updateWish = async (userId, wishId, wishData) => {
  try {
    // Validierung: Mindestens ein Feld muss ausgefüllt sein
    const hasAnyField = wishData.name || wishData.winery || wishData.vintage || 
                       wishData.region || wishData.grapeVariety;
    if (!hasAnyField) {
      throw new Error('Mindestens ein Feld (Name, Weingut, Jahrgang, Region oder Rebsorte) muss ausgefüllt sein');
    }

    const wishRef = doc(db, 'users', userId, 'wishlist', wishId);
    await updateDoc(wishRef, {
      ...wishData,
      updatedAt: serverTimestamp(),
      // Reset Match-Status beim Update (wird später neu geprüft)
      hasMatch: false,
      matchedWineIds: [],
    });

    console.log('✅ Wunsch aktualisiert:', wishId);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Wunsches:', error);
    throw error;
  }
};

/**
 * Löscht einen Weinwunsch
 * @param {string} userId - User-ID
 * @param {string} wishId - Wunsch-ID
 * @returns {Promise<boolean>} Erfolg
 */
export const deleteWish = async (userId, wishId) => {
  try {
    const wishRef = doc(db, 'users', userId, 'wishlist', wishId);
    await deleteDoc(wishRef);
    console.log('✅ Wunsch gelöscht:', wishId);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Wunsches:', error);
    throw error;
  }
};

/**
 * Holt alle Wünsche eines Users
 * @param {string} userId - User-ID
 * @returns {Promise<Array>} Array von Wünschen
 */
export const getWishesForUser = async (userId) => {
  try {
    const wishRef = collection(db, 'users', userId, 'wishlist');
    const q = query(wishRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const wishes = [];
    
    querySnapshot.forEach((doc) => {
      wishes.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    console.log(`✅ ${wishes.length} Wünsche von User ${userId} geladen`);
    return wishes;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Wünsche:', error);
    throw error;
  }
};

/**
 * Abonniert Wünsche eines Users in Echtzeit
 * @param {string} userId - User-ID
 * @param {Function} callback - Callback-Funktion, die mit dem Array von Wünschen aufgerufen wird
 * @returns {Function} Unsubscribe-Funktion
 */
export const subscribeWishesForUser = (userId, callback) => {
  try {
    const wishRef = collection(db, 'users', userId, 'wishlist');
    const q = query(wishRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const wishes = [];
        querySnapshot.forEach((doc) => {
          wishes.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        callback(wishes);
      },
      (error) => {
        console.error('❌ Fehler bei Wunschliste-Subscription:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Fehler beim Abonnieren der Wünsche:', error);
    return () => {}; // Leere Unsubscribe-Funktion bei Fehler
  }
};

/**
 * Prüft, ob ein Wunsch Matches in der Weinbörse hat
 * @param {string} userId - User-ID
 * @param {string} wishId - Wunsch-ID
 * @param {Array} publicWines - Array aller öffentlichen Weine (optional, wird geladen wenn nicht übergeben)
 * @returns {Promise<Object>} { hasMatch: boolean, matchedWineIds: string[] }
 */
export const checkWishMatches = async (userId, wishId, publicWines = null) => {
  try {
    // Lade Wunsch
    const wishRef = doc(db, 'users', userId, 'wishlist', wishId);
    const wishDoc = await getDoc(wishRef);
    
    if (!wishDoc.exists()) {
      throw new Error('Wunsch nicht gefunden');
    }
    
    const wish = wishDoc.data();
    
    // Lade öffentliche Weine, falls nicht übergeben
    if (!publicWines) {
      publicWines = await getAvailableWines();
    }
    
    // Filtere eigene Weine heraus
    const currentUser = await getUser(userId);
    const otherUsersWines = publicWines.filter(wine => {
      return wine.ownerId !== userId && 
             wine.owner !== currentUser?.username && 
             wine.owner !== currentUser?.email;
    });
    
    // Matching-Logik
    const matchedWineIds = [];
    
    for (const wine of otherUsersWines) {
      let matches = false;
      
      // Prüfe jedes Kriterium (mindestens eines muss passen)
      if (wish.name && wine.name) {
        if (wine.name.toLowerCase().includes(wish.name.toLowerCase())) {
          matches = true;
        }
      }
      
      if (wish.winery && wine.winery) {
        if (wine.winery.toLowerCase().includes(wish.winery.toLowerCase())) {
          matches = true;
        }
      }
      
      if (wish.vintage && wine.vintage) {
        if (wine.vintage === wish.vintage) {
          matches = true;
        }
      }
      
      if (wish.region && wine.region) {
        if (wine.region.toLowerCase().includes(wish.region.toLowerCase())) {
          matches = true;
        }
      }
      
      if (wish.grapeVariety && wine.grapeVariety) {
        if (wine.grapeVariety.toLowerCase().includes(wish.grapeVariety.toLowerCase())) {
          matches = true;
        }
      }
      
      if (matches) {
        matchedWineIds.push(wine.id);
      }
    }
    
    const hasMatch = matchedWineIds.length > 0;
    
    // Update Wunsch mit Match-Status
    await updateDoc(wishRef, {
      hasMatch,
      matchedWineIds,
      lastCheckedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log(`✅ Match-Prüfung für Wunsch ${wishId}: ${matchedWineIds.length} Matches gefunden`);
    return { hasMatch, matchedWineIds };
  } catch (error) {
    console.error('❌ Fehler bei Match-Prüfung:', error);
    throw error;
  }
};

/**
 * Prüft alle Wünsche eines Users auf Matches
 * @param {string} userId - User-ID
 * @returns {Promise<number>} Anzahl der Wünsche mit Matches
 */
export const checkAllWishMatches = async (userId) => {
  try {
    // Lade alle Wünsche
    const wishes = await getWishesForUser(userId);
    
    if (wishes.length === 0) {
      return 0;
    }
    
    // Lade alle öffentlichen Weine einmal
    const publicWines = await getAvailableWines();
    
    // Prüfe jeden Wunsch
    let matchCount = 0;
    for (const wish of wishes) {
      const result = await checkWishMatches(userId, wish.id, publicWines);
      if (result.hasMatch) {
        matchCount++;
      }
    }
    
    console.log(`✅ Match-Prüfung abgeschlossen: ${matchCount} von ${wishes.length} Wünschen haben Matches`);
    return matchCount;
  } catch (error) {
    console.error('❌ Fehler bei Match-Prüfung aller Wünsche:', error);
    throw error;
  }
};

// ===== WINERY MANAGEMENT =====

/**
 * Erstellt ein neues Weingut-Profil
 * @param {Object} wineryData - Weingut-Daten
 * @returns {Promise<string>} Weingut-ID
 */
export const createWinery = async (wineryData) => {
  try {
    if (!wineryData.ownerId) {
      throw new Error('ownerId ist erforderlich');
    }
    if (!wineryData.name || !wineryData.name.trim()) {
      throw new Error('Name ist erforderlich');
    }

    // Prüfe, ob bereits ein Weingut für diesen Owner existiert
    const existingQuery = query(
      collection(db, 'wineries'),
      where('ownerId', '==', wineryData.ownerId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('Ein Weingut-Profil für diesen Benutzer existiert bereits');
    }

    const wineryRef = await addDoc(collection(db, 'wineries'), {
      ...wineryData,
      // Verwende isVerified aus wineryData, falls vorhanden, sonst false
      isVerified: wineryData.isVerified !== undefined ? wineryData.isVerified : false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Weingut erstellt:', wineryRef.id);
    return wineryRef.id;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Weinguts:', error);
    throw error;
  }
};

/**
 * Aktualisiert ein Weingut-Profil
 * @param {string} wineryId - Weingut-ID
 * @param {Object} updates - Zu aktualisierende Felder
 * @returns {Promise<boolean>} Erfolg
 */
export const updateWinery = async (wineryId, updates) => {
  try {
    const wineryRef = doc(db, 'wineries', wineryId);
    await updateDoc(wineryRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Weingut aktualisiert:', wineryId);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Weinguts:', error);
    throw error;
  }
};

/**
 * Löscht ein Weingut-Profil
 * @param {string} wineryId - Weingut-ID
 * @returns {Promise<boolean>} Erfolg
 */
export const deleteWinery = async (wineryId) => {
  try {
    await deleteDoc(doc(db, 'wineries', wineryId));
    console.log('✅ Weingut gelöscht:', wineryId);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Weinguts:', error);
    throw error;
  }
};

/**
 * Holt ein Weingut nach ID
 * @param {string} wineryId - Weingut-ID
 * @returns {Promise<Object|null>} Weingut-Daten
 */
export const getWinery = async (wineryId) => {
  try {
    const wineryDoc = await getDoc(doc(db, 'wineries', wineryId));
    if (!wineryDoc.exists()) {
      return null;
    }
    return { id: wineryDoc.id, ...wineryDoc.data() };
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Weinguts:', error);
    throw error;
  }
};

/**
 * Holt ein Weingut nach Owner-ID
 * @param {string} ownerId - Owner-UID
 * @returns {Promise<Object|null>} Weingut-Daten
 */
export const getWineryByOwner = async (ownerId) => {
  try {
    const wineryQuery = query(
      collection(db, 'wineries'),
      where('ownerId', '==', ownerId)
    );
    const querySnapshot = await getDocs(wineryQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const wineryDoc = querySnapshot.docs[0];
    return { id: wineryDoc.id, ...wineryDoc.data() };
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Weinguts nach Owner:', error);
    throw error;
  }
};

/**
 * Holt alle verifizierten Weingüter
 * @returns {Promise<Array>} Liste der Weingüter
 */
export const getVerifiedWineries = async () => {
  try {
    const wineriesQuery = query(
      collection(db, 'wineries'),
      where('isVerified', '==', true)
    );
    const querySnapshot = await getDocs(wineriesQuery);
    
    const wineries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Clientseitig nach Name sortieren (vermeidet Firestore-Index)
    return wineries.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der verifizierten Weingüter:', error);
    throw error;
  }
};

/**
 * Holt alle Weingüter (auch nicht verifizierte) - nur für Admins
 * @returns {Promise<Array>} Liste der Weingüter
 */
export const getAllWineries = async () => {
  try {
    const wineriesQuery = query(
      collection(db, 'wineries'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(wineriesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Fehler beim Abrufen aller Weingüter:', error);
    throw error;
  }
};

/**
 * Verifiziert ein Weingut (nur für Admins)
 * @param {string} wineryId - Weingut-ID
 * @param {boolean} isVerified - Verifizierungsstatus
 * @returns {Promise<boolean>} Erfolg
 */
export const verifyWinery = async (wineryId, isVerified = true) => {
  try {
    await updateWinery(wineryId, { isVerified });
    console.log(`✅ Weingut ${isVerified ? 'verifiziert' : 'Verifizierung entfernt'}:`, wineryId);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Verifizieren des Weinguts:', error);
    throw error;
  }
};

/**
 * Subscription für verifizierte Weingüter
 * @param {Function} callback - Callback-Funktion
 * @returns {Function} Unsubscribe-Funktion
 */
export const subscribeVerifiedWineries = (callback) => {
  try {
    const wineriesQuery = query(
      collection(db, 'wineries'),
      where('isVerified', '==', true)
    );

    return onSnapshot(wineriesQuery, (snapshot) => {
      const wineries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Clientseitig nach Name sortieren (vermeidet Firestore-Index)
      const sortedWineries = wineries.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      callback(sortedWineries);
    }, (error) => {
      console.error('❌ Fehler bei Weingüter-Subscription:', error);
      callback([]);
    });
  } catch (error) {
    console.error('❌ Fehler beim Einrichten der Weingüter-Subscription:', error);
    callback([]);
    return () => {};
  }
};

// ===== ADMIN NACHRICHTEN: ZIELGRUPPEN-FILTER =====

/**
 * Ruft alle aktiven User ab (User, die in den letzten 30 Tagen aktiv waren)
 * @returns {Promise<Array>} Array von aktiven Usern
 */
export const getActiveUsers = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usersQuery = query(
      collection(db, 'users'),
      where('lastActive', '>=', thirtyDaysAgo)
    );
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.data().uid || doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error getting active users:', error);
    // Fallback: Wenn Index fehlt, lade alle User und filtere clientseitig
    const allUsers = await getAllUsers();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return allUsers.filter(user => {
      if (!user.lastActive) return false;
      const lastActive = user.lastActive.toDate ? user.lastActive.toDate() : new Date(user.lastActive);
      return lastActive >= thirtyDaysAgo;
    });
  }
};

/**
 * Ruft alle Premium-User ab (User mit Premium-Abo)
 * @returns {Promise<Array>} Array von Premium-Usern
 */
export const getPremiumUsers = async () => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('is_subscriber', '==', true)
    );
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.data().uid || doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error getting premium users:', error);
    // Fallback: Lade alle User und filtere clientseitig
    const allUsers = await getAllUsers();
    return allUsers.filter(user => user.is_subscriber === true || user.isSubscriber === true);
  }
};

/**
 * Ruft alle Newsletter-Abonnenten ab (User mit newsletter_optin: true)
 * @returns {Promise<Array>} Array von Newsletter-Abonnenten
 */
export const getNewsletterSubscribers = async () => {
  try {
    // Versuche zuerst, User mit newsletter_optin === true zu finden
    const usersQuery = query(
      collection(db, 'users'),
      where('newsletter_optin', '==', true)
    );
    const querySnapshot = await getDocs(usersQuery);
    
    const subscribers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.data().uid || doc.id,
      ...doc.data()
    }));
    
    console.log(`📧 Newsletter-Abonnenten gefunden: ${subscribers.length}`);
    
    // Wenn keine Abonnenten gefunden wurden, verwende alle User als Fallback
    // (für Testzwecke oder wenn das Feld noch nicht gesetzt ist)
    if (subscribers.length === 0) {
      console.warn('⚠️ Keine Newsletter-Abonnenten gefunden, verwende alle User als Fallback');
      const allUsers = await getAllUsers();
      return allUsers.map(user => ({
        id: user.id,
        uid: user.uid || user.id,
        ...user
      }));
    }
    
    return subscribers;
  } catch (error) {
    console.error('❌ Error getting newsletter subscribers:', error);
    // Fallback: Lade alle User und filtere clientseitig
    try {
      const allUsers = await getAllUsers();
      const filtered = allUsers.filter(user => 
        user.newsletter_optin === true || 
        user.newsletterOptin === true ||
        user.newsletter === true
      );
      
      if (filtered.length === 0) {
        console.warn('⚠️ Keine Newsletter-Abonnenten gefunden (auch im Fallback), verwende alle User');
        return allUsers.map(user => ({
          id: user.id,
          uid: user.uid || user.id,
          ...user
        }));
      }
      
      return filtered.map(user => ({
        id: user.id,
        uid: user.uid || user.id,
        ...user
      }));
    } catch (fallbackError) {
      console.error('❌ Error in fallback for newsletter subscribers:', fallbackError);
      // Letzter Fallback: Leeres Array
      return [];
    }
  }
};

/**
 * Ruft User basierend auf Zielgruppe ab
 * @param {string} targetGroup - Zielgruppe: "all" | "active" | "premium" | "newsletter_subscribers"
 * @returns {Promise<Array>} Array von Usern
 */
export const getTargetUsers = async (targetGroup) => {
  try {
    switch (targetGroup) {
      case "all":
        return await getAllUsers();
      case "active":
        return await getActiveUsers();
      case "premium":
        return await getPremiumUsers();
      case "newsletter_subscribers":
        return await getNewsletterSubscribers();
      default:
        console.warn(`⚠️ Unbekannte Zielgruppe: ${targetGroup}, verwende "all"`);
        return await getAllUsers();
    }
  } catch (error) {
    console.error('❌ Error getting target users:', error);
    throw error;
  }
};

// ===== ADMIN NACHRICHTEN: SURVEYS (UMFRAGEN) =====

/**
 * Erstellt eine neue Umfrage
 * @param {Object} surveyData - Umfrage-Daten
 * @returns {Promise<string>} Survey-ID
 */
export const createSurvey = async (surveyData) => {
  try {
    const surveyRef = await addDoc(collection(db, 'surveys'), {
      title: surveyData.title,
      question: surveyData.question,
      options: surveyData.options,
      targetGroup: surveyData.targetGroup || 'all',
      status: 'active',
      createdAt: serverTimestamp(),
      createdBy: surveyData.createdBy || null,
      expiresAt: surveyData.expiresAt || null,
      maxResponses: surveyData.maxResponses || null
    });
    
    console.log('✅ Survey created:', surveyRef.id);
    return surveyRef.id;
  } catch (error) {
    console.error('❌ Error creating survey:', error);
    throw error;
  }
};

/**
 * Ruft eine Umfrage ab
 * @param {string} surveyId - Survey-ID
 * @returns {Promise<Object|null>} Survey-Daten oder null
 */
export const getSurvey = async (surveyId) => {
  try {
    const surveyDoc = await getDoc(doc(db, 'surveys', surveyId));
    if (!surveyDoc.exists()) {
      return null;
    }
    return { id: surveyDoc.id, ...surveyDoc.data() };
  } catch (error) {
    console.error('❌ Error getting survey:', error);
    throw error;
  }
};

/**
 * Ruft alle Umfragen ab
 * @returns {Promise<Array>} Array von Umfragen
 */
export const getAllSurveys = async () => {
  try {
    const surveysQuery = query(
      collection(db, 'surveys'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(surveysQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error getting all surveys:', error);
    // Fallback: Ohne orderBy
    const surveysQuery = query(collection(db, 'surveys'));
    const querySnapshot = await getDocs(surveysQuery);
    const surveys = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Clientseitig sortieren
    return surveys.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds || 0) * 1000;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds || 0) * 1000;
      return bTime - aTime;
    });
  }
};

/**
 * Aktualisiert den Status einer Umfrage
 * @param {string} surveyId - Survey-ID
 * @param {string} status - Neuer Status: "active" | "closed" | "draft"
 * @returns {Promise<void>}
 */
export const updateSurveyStatus = async (surveyId, status) => {
  try {
    await updateDoc(doc(db, 'surveys', surveyId), {
      status,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Survey status updated:', surveyId, status);
  } catch (error) {
    console.error('❌ Error updating survey status:', error);
    throw error;
  }
};

/**
 * Prüft, ob ein User bereits an einer Umfrage teilgenommen hat
 * @param {string} userId - User-ID (uid)
 * @param {string} surveyId - Survey-ID
 * @returns {Promise<boolean>} true wenn bereits beantwortet
 */
export const hasUserAnsweredSurvey = async (userId, surveyId) => {
  try {
    const answersQuery = query(
      collection(db, 'surveyAnswers', userId, 'answers'),
      where('surveyId', '==', surveyId),
      limit(1)
    );
    const querySnapshot = await getDocs(answersQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('❌ Error checking if user answered survey:', error);
    return false;
  }
};

/**
 * Speichert eine Umfrage-Antwort
 * @param {string} userId - User-ID (uid)
 * @param {string} surveyId - Survey-ID
 * @param {number} selectedOption - Index der gewählten Option
 * @returns {Promise<string>} Answer-ID
 */
export const submitSurveyAnswer = async (userId, surveyId, selectedOption) => {
  try {
    console.log('🔄 Submitting survey answer:', { userId, surveyId, selectedOption });
    
    // Prüfe, ob User bereits geantwortet hat
    const alreadyAnswered = await hasUserAnsweredSurvey(userId, surveyId);
    if (alreadyAnswered) {
      throw new Error('User hat bereits an dieser Umfrage teilgenommen');
    }
    
    // Speichere Antwort
    const answerRef = await addDoc(collection(db, 'surveyAnswers', userId, 'answers'), {
      surveyId,
      selectedOption,
      answeredAt: serverTimestamp()
    });
    
    console.log('✅ Survey answer saved:', answerRef.id);
    
    console.log('✅ Survey answer submitted:', answerRef.id);
    return answerRef.id;
  } catch (error) {
    console.error('❌ Error submitting survey answer:', error);
    throw error;
  }
};

/**
 * Ruft alle Antworten zu einer Umfrage ab
 * @param {string} surveyId - Survey-ID
 * @returns {Promise<Array>} Array von Antworten
 */
export const getSurveyAnswers = async (surveyId) => {
  try {
    // Hole alle User
    const allUsers = await getAllUsers();
    const allAnswers = [];
    
    // Durchsuche alle User nach Antworten
    for (const user of allUsers) {
      const userId = user.uid || user.id;
      try {
        const answersQuery = query(
          collection(db, 'surveyAnswers', userId, 'answers'),
          where('surveyId', '==', surveyId)
        );
        const querySnapshot = await getDocs(answersQuery);
        
        querySnapshot.docs.forEach(doc => {
          allAnswers.push({
            id: doc.id,
            userId,
            ...doc.data()
          });
        });
      } catch (error) {
        // Ignoriere Fehler bei einzelnen Usern
        console.warn(`⚠️ Fehler beim Laden von Antworten für User ${userId}:`, error);
      }
    }
    
    return allAnswers;
  } catch (error) {
    console.error('❌ Error getting survey answers:', error);
    throw error;
  }
};

// ===== ADMIN NACHRICHTEN: NEWSLETTER =====

/**
 * Erstellt einen neuen Newsletter
 * @param {Object} newsletterData - Newsletter-Daten
 * @returns {Promise<string>} Newsletter-ID
 */
export const createNewsletter = async (newsletterData) => {
  try {
    const newsletterRef = await addDoc(collection(db, 'newsletters'), {
      title: newsletterData.title,
      content: newsletterData.content,
      targetGroup: newsletterData.targetGroup || 'newsletter_subscribers',
      status: 'draft',
      createdAt: serverTimestamp(),
      createdBy: newsletterData.createdBy || null,
      sentAt: null
    });
    
    console.log('✅ Newsletter created:', newsletterRef.id);
    return newsletterRef.id;
  } catch (error) {
    console.error('❌ Error creating newsletter:', error);
    throw error;
  }
};

/**
 * Ruft einen Newsletter ab
 * @param {string} newsletterId - Newsletter-ID
 * @returns {Promise<Object|null>} Newsletter-Daten oder null
 */
export const getNewsletter = async (newsletterId) => {
  try {
    const newsletterDoc = await getDoc(doc(db, 'newsletters', newsletterId));
    if (!newsletterDoc.exists()) {
      return null;
    }
    return { id: newsletterDoc.id, ...newsletterDoc.data() };
  } catch (error) {
    console.error('❌ Error getting newsletter:', error);
    throw error;
  }
};

/**
 * Ruft alle Newsletter ab
 * @returns {Promise<Array>} Array von Newslettern
 */
export const getAllNewsletters = async () => {
  try {
    const newslettersQuery = query(
      collection(db, 'newsletters'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(newslettersQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error getting all newsletters:', error);
    // Fallback: Ohne orderBy
    const newslettersQuery = query(collection(db, 'newsletters'));
    const querySnapshot = await getDocs(newslettersQuery);
    const newsletters = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Clientseitig sortieren
    return newsletters.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds || 0) * 1000;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds || 0) * 1000;
      return bTime - aTime;
    });
  }
};

/**
 * Aktualisiert den Status eines Newsletters
 * @param {string} newsletterId - Newsletter-ID
 * @param {string} status - Neuer Status: "draft" | "sent"
 * @returns {Promise<void>}
 */
export const updateNewsletterStatus = async (newsletterId, status) => {
  try {
    await updateDoc(doc(db, 'newsletters', newsletterId), {
      status,
      sentAt: status === 'sent' ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Newsletter status updated:', newsletterId, status);
  } catch (error) {
    console.error('❌ Error updating newsletter status:', error);
    throw error;
  }
};

// ===== ADMIN NACHRICHTEN: SYSTEM MESSAGES =====

/**
 * Erstellt eine neue System-Ankündigung
 * @param {Object} messageData - System-Message-Daten
 * @returns {Promise<string>} SystemMessage-ID
 */
export const createSystemMessage = async (messageData) => {
  try {
    const messageRef = await addDoc(collection(db, 'systemMessages'), {
      title: messageData.title,
      content: messageData.content,
      priority: messageData.priority || 'normal',
      targetGroup: messageData.targetGroup || 'all',
      status: 'draft',
      createdAt: serverTimestamp(),
      createdBy: messageData.createdBy || null,
      sentAt: null
    });
    
    console.log('✅ System message created:', messageRef.id);
    return messageRef.id;
  } catch (error) {
    console.error('❌ Error creating system message:', error);
    throw error;
  }
};

/**
 * Ruft eine System-Ankündigung ab
 * @param {string} messageId - SystemMessage-ID
 * @returns {Promise<Object|null>} SystemMessage-Daten oder null
 */
export const getSystemMessage = async (messageId) => {
  try {
    const messageDoc = await getDoc(doc(db, 'systemMessages', messageId));
    if (!messageDoc.exists()) {
      return null;
    }
    return { id: messageDoc.id, ...messageDoc.data() };
  } catch (error) {
    console.error('❌ Error getting system message:', error);
    throw error;
  }
};

/**
 * Ruft alle System-Ankündigungen ab
 * @returns {Promise<Array>} Array von System-Ankündigungen
 */
export const getAllSystemMessages = async () => {
  try {
    const messagesQuery = query(
      collection(db, 'systemMessages'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(messagesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error getting all system messages:', error);
    // Fallback: Ohne orderBy
    const messagesQuery = query(collection(db, 'systemMessages'));
    const querySnapshot = await getDocs(messagesQuery);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Clientseitig sortieren
    return messages.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds || 0) * 1000;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds || 0) * 1000;
      return bTime - aTime;
    });
  }
};

/**
 * Aktualisiert den Status einer System-Ankündigung
 * @param {string} messageId - SystemMessage-ID
 * @param {string} status - Neuer Status: "draft" | "sent"
 * @returns {Promise<void>}
 */
export const updateSystemMessageStatus = async (messageId, status) => {
  try {
    await updateDoc(doc(db, 'systemMessages', messageId), {
      status,
      sentAt: status === 'sent' ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });
    console.log('✅ System message status updated:', messageId, status);
  } catch (error) {
    console.error('❌ Error updating system message status:', error);
    throw error;
  }
};

// ===== ADMIN NACHRICHTEN: NOTIFICATION-ERSTELLUNG FÜR ZIELGRUPPEN =====

/**
 * Erstellt Notifications für alle Ziel-User einer Umfrage
 * @param {string} surveyId - Survey-ID
 * @param {string} targetGroup - Zielgruppe
 * @returns {Promise<number>} Anzahl erstellter Notifications
 */
export const createNotificationsForSurvey = async (surveyId, targetGroup) => {
  try {
    const survey = await getSurvey(surveyId);
    if (!survey) {
      throw new Error('Survey nicht gefunden');
    }
    
    const targetUsers = await getTargetUsers(targetGroup);
    console.log(`📊 Erstelle Notifications für ${targetUsers.length} User (Survey: ${surveyId})`);
    
    // Batch-Processing für große Zielgruppen (500 pro Batch)
    const batchSize = 500;
    let notificationCount = 0;
    
    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUsers = targetUsers.slice(i, i + batchSize);
      
      for (const user of batchUsers) {
        const userId = user.uid || user.id;
        if (!userId) continue;
        
        try {
          const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
          batch.set(notificationRef, {
            type: 'survey',
            title: survey.title,
            message: survey.question || 'Neue Umfrage verfügbar',
            surveyId: surveyId,
            isRead: false,
            isArchived: false,
            isCompleted: false,
            createdAt: serverTimestamp()
          });
          notificationCount++;
        } catch (error) {
          console.error(`❌ Fehler beim Erstellen der Notification für User ${userId}:`, error);
        }
      }
      
      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} abgeschlossen (${notificationCount} Notifications)`);
    }
    
    console.log(`✅ ${notificationCount} Notifications für Survey ${surveyId} erstellt`);
    return notificationCount;
  } catch (error) {
    console.error('❌ Error creating notifications for survey:', error);
    throw error;
  }
};

/**
 * Erstellt Notifications für alle Ziel-User eines Newsletters
 * @param {string} newsletterId - Newsletter-ID
 * @param {string} targetGroup - Zielgruppe
 * @returns {Promise<number>} Anzahl erstellter Notifications
 */
export const createNotificationsForNewsletter = async (newsletterId, targetGroup) => {
  try {
    const newsletter = await getNewsletter(newsletterId);
    if (!newsletter) {
      throw new Error('Newsletter nicht gefunden');
    }
    
    console.log(`📧 Newsletter-Daten:`, {
      id: newsletterId,
      title: newsletter.title,
      targetGroup
    });
    
    const targetUsers = await getTargetUsers(targetGroup);
    console.log(`📧 Erstelle Notifications für ${targetUsers.length} User (Newsletter: ${newsletterId})`);
    
    if (targetUsers.length === 0) {
      console.warn('⚠️ Keine Ziel-User gefunden für Newsletter:', newsletterId);
      return 0;
    }
    
    // Batch-Processing für große Zielgruppen (500 pro Batch)
    const batchSize = 500;
    let notificationCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUsers = targetUsers.slice(i, i + batchSize);
      let batchNotificationCount = 0;
      
      for (const user of batchUsers) {
        const userId = user.uid || user.id;
        if (!userId) {
          console.warn('⚠️ User ohne uid/id gefunden:', user);
          continue;
        }
        
        try {
          // Erstelle eine neue Dokument-Referenz mit automatischer ID
          const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
          batch.set(notificationRef, {
            type: 'newsletter',
            title: newsletter.title,
            message: newsletter.content.substring(0, 100) + (newsletter.content.length > 100 ? '...' : ''),
            newsletterId: newsletterId,
            isRead: false,
            isArchived: false,
            isCompleted: false,
            createdAt: serverTimestamp()
          });
          notificationCount++;
          batchNotificationCount++;
        } catch (error) {
          console.error(`❌ Fehler beim Erstellen der Notification für User ${userId}:`, error);
          errorCount++;
        }
      }
      
      if (batchNotificationCount > 0) {
        try {
          await batch.commit();
          console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} abgeschlossen (${batchNotificationCount} Notifications)`);
        } catch (batchError) {
          console.error(`❌ Fehler beim Commit des Batches ${Math.floor(i / batchSize) + 1}:`, batchError);
          errorCount += batchNotificationCount;
        }
      }
    }
    
    console.log(`✅ ${notificationCount} Notifications für Newsletter ${newsletterId} erstellt (${errorCount} Fehler)`);
    return notificationCount;
  } catch (error) {
    console.error('❌ Error creating notifications for newsletter:', error);
    throw error;
  }
};

/**
 * Erstellt Notifications für alle Ziel-User einer System-Ankündigung
 * @param {string} messageId - SystemMessage-ID
 * @param {string} targetGroup - Zielgruppe
 * @returns {Promise<number>} Anzahl erstellter Notifications
 */
export const createNotificationsForSystemMessage = async (messageId, targetGroup) => {
  try {
    const systemMessage = await getSystemMessage(messageId);
    if (!systemMessage) {
      throw new Error('System-Ankündigung nicht gefunden');
    }
    
    const targetUsers = await getTargetUsers(targetGroup);
    console.log(`📢 Erstelle Notifications für ${targetUsers.length} User (SystemMessage: ${messageId})`);
    
    // Batch-Processing für große Zielgruppen (500 pro Batch)
    const batchSize = 500;
    let notificationCount = 0;
    
    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUsers = targetUsers.slice(i, i + batchSize);
      
      for (const user of batchUsers) {
        const userId = user.uid || user.id;
        if (!userId) continue;
        
        try {
          const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
          batch.set(notificationRef, {
            type: 'system',
            title: systemMessage.title,
            message: systemMessage.content.substring(0, 100) + (systemMessage.content.length > 100 ? '...' : ''),
            systemMessageId: messageId,
            priority: systemMessage.priority || 'normal',
            isRead: false,
            isArchived: false,
            isCompleted: false,
            createdAt: serverTimestamp()
          });
          notificationCount++;
        } catch (error) {
          console.error(`❌ Fehler beim Erstellen der Notification für User ${userId}:`, error);
        }
      }
      
      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} abgeschlossen (${notificationCount} Notifications)`);
    }
    
    console.log(`✅ ${notificationCount} Notifications für SystemMessage ${messageId} erstellt`);
    return notificationCount;
  } catch (error) {
    console.error('❌ Error creating notifications for system message:', error);
    throw error;
  }
};

// ===== SHOP PRODUCTS =====

/**
 * Erstellt ein neues Produkt im Shop
 * @param {Object} productData - Produktdaten
 * @returns {Promise<string>} Produkt-ID
 */
export const createProduct = async (productData) => {
  try {
    // Validierung
    if (!productData.name || !productData.name.trim()) {
      throw new Error('Produktname ist erforderlich');
    }
    if (!productData.category) {
      throw new Error('Kategorie ist erforderlich');
    }
    if (typeof productData.price !== 'number' || productData.price < 0) {
      throw new Error('Gültiger Preis ist erforderlich');
    }
    if (!productData.size || !['small', 'medium', 'large', 'xlarge'].includes(productData.size)) {
      throw new Error('Gültige Größe ist erforderlich (small, medium, large, xlarge)');
    }

    // Berechne Bruttopreis (MwSt 19%)
    const priceGross = productData.price * 1.19;
    const taxRate = 19;

    // Erstelle Produkt-Dokument
    const productRef = await addDoc(collection(db, 'products'), {
      name: productData.name.trim(),
      description: productData.description || '',
      category: productData.category,
      price: productData.price,
      priceGross: Math.round(priceGross * 100) / 100, // Auf 2 Dezimalstellen runden
      taxRate: taxRate,
      images: productData.images || [],
      variants: productData.variants || [],
      stock: productData.stock !== undefined ? productData.stock : null,
      active: productData.active !== undefined ? productData.active : true,
      size: productData.size,
      shippingCost: productData.shippingCost || 0,
      tags: productData.tags || [],
      sku: productData.sku || null,
      createdBy: productData.createdBy || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Produkt erstellt:', productRef.id);
    return productRef.id;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Produkts:', error);
    throw error;
  }
};

/**
 * Ruft ein Produkt ab
 * @param {string} productId - Produkt-ID
 * @returns {Promise<Object>} Produkt-Daten
 */
export const getProduct = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      throw new Error('Produkt nicht gefunden');
    }

    return {
      id: productSnap.id,
      ...productSnap.data()
    };
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Produkts:', error);
    throw error;
  }
};

/**
 * Ruft alle aktiven Produkte ab
 * @returns {Promise<Array>} Array von Produkten
 */
export const getActiveProducts = async () => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('active', '==', true)
    );
    const snapshot = await getDocs(productsQuery);

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-seitige Sortierung nach createdAt (neueste zuerst)
    return products.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der aktiven Produkte:', error);
    throw error;
  }
};

/**
 * Ruft Produkte nach Kategorie ab
 * @param {string} category - Kategorie (weinglaeser, oeffner, kuehler, geschenkboxen, sonstiges)
 * @returns {Promise<Array>} Array von Produkten
 */
export const getProductsByCategory = async (category) => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('active', '==', true),
      where('category', '==', category)
    );
    const snapshot = await getDocs(productsQuery);

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-seitige Sortierung nach createdAt (neueste zuerst)
    return products.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Produkte nach Kategorie:', error);
    throw error;
  }
};

/**
 * Sucht Produkte nach Suchbegriff
 * @param {string} searchQuery - Suchbegriff
 * @returns {Promise<Array>} Array von Produkten
 */
export const searchProducts = async (searchQuery) => {
  try {
    // Lade alle aktiven Produkte (client-seitige Suche)
    const allProducts = await getActiveProducts();
    
    if (!searchQuery || !searchQuery.trim()) {
      return allProducts;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return allProducts.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      const category = product.category?.toLowerCase() || '';
      const tags = product.tags?.join(' ').toLowerCase() || '';
      const sku = product.sku?.toLowerCase() || '';

      return name.includes(query) ||
             description.includes(query) ||
             category.includes(query) ||
             tags.includes(query) ||
             sku.includes(query);
    });
  } catch (error) {
    console.error('❌ Fehler bei der Produktsuche:', error);
    throw error;
  }
};

/**
 * Aktualisiert ein Produkt
 * @param {string} productId - Produkt-ID
 * @param {Object} updates - Zu aktualisierende Felder
 * @returns {Promise<void>}
 */
export const updateProduct = async (productId, updates) => {
  try {
    const productRef = doc(db, 'products', productId);
    
    // Wenn Preis aktualisiert wird, berechne Bruttopreis neu
    if (updates.price !== undefined) {
      updates.priceGross = Math.round(updates.price * 1.19 * 100) / 100;
    }

    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Produkt aktualisiert:', productId);
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Produkts:', error);
    throw error;
  }
};

/**
 * Löscht ein Produkt (soft delete: active = false)
 * @param {string} productId - Produkt-ID
 * @returns {Promise<void>}
 */
export const deleteProduct = async (productId) => {
  try {
    await updateProduct(productId, { active: false });
    console.log('✅ Produkt deaktiviert:', productId);
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Produkts:', error);
    throw error;
  }
};

/**
 * Lädt Produkt-Bilder zu Firebase Storage hoch
 * @param {string} productId - Produkt-ID
 * @param {Array<string>} imageUris - Array von Bild-URIs
 * @returns {Promise<Array<string>>} Array von Download-URLs
 */
export const uploadProductImages = async (productId, imageUris) => {
  try {
    if (!imageUris || imageUris.length === 0) {
      return [];
    }

    if (imageUris.length > 5) {
      throw new Error('Maximal 5 Bilder pro Produkt erlaubt');
    }

    const uploadPromises = imageUris.map(async (imageUri, index) => {
      const fileName = `product_${productId}_${index}_${Date.now()}.jpg`;
      return await uploadImageToStorage(imageUri, 'products', fileName);
    });

    const imageUrls = await Promise.all(uploadPromises);
    console.log('✅ Produkt-Bilder hochgeladen:', imageUrls.length);
    return imageUrls;
  } catch (error) {
    console.error('❌ Fehler beim Hochladen der Produkt-Bilder:', error);
    throw error;
  }
};

/**
 * Abonniert Änderungen an aktiven Produkten
 * @param {Function} callback - Callback-Funktion für Updates
 * @returns {Function} Unsubscribe-Funktion
 */
export const subscribeActiveProducts = (callback) => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('active', '==', true)
    );

    return onSnapshot(productsQuery, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Client-seitige Sortierung nach createdAt (neueste zuerst)
      const sortedProducts = products.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      callback(sortedProducts);
    });
  } catch (error) {
    console.error('❌ Fehler bei der Produkt-Subscription:', error);
    throw error;
  }
};

// ===== WARENKORB =====

/**
 * Fügt ein Produkt zum Warenkorb hinzu
 * @param {string} userId - User-ID
 * @param {string} productId - Produkt-ID
 * @param {number} quantity - Menge (Standard: 1)
 * @param {string} variantId - Optional: Varianten-ID
 * @returns {Promise<void>}
 */
export const addToCart = async (userId, productId, quantity = 1, variantId = null) => {
  try {
    if (!userId || !productId) {
      throw new Error('User-ID und Produkt-ID sind erforderlich');
    }

    if (quantity < 1 || quantity > 10) {
      throw new Error('Menge muss zwischen 1 und 10 liegen');
    }

    // Prüfe, ob Artikel bereits im Warenkorb
    const cartItemsRef = collection(db, 'cart', userId, 'items');
    const existingItemQuery = query(
      cartItemsRef,
      where('productId', '==', productId),
      where('variantId', '==', variantId || null)
    );
    const existingItemSnapshot = await getDocs(existingItemQuery);

    if (!existingItemSnapshot.empty) {
      // Artikel existiert bereits - erhöhe Menge
      const existingItem = existingItemSnapshot.docs[0];
      const currentQuantity = existingItem.data().quantity || 0;
      const newQuantity = Math.min(currentQuantity + quantity, 10); // Max 10

      await updateDoc(existingItem.ref, {
        quantity: newQuantity,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Warenkorb-Artikel-Menge aktualisiert:', productId);
    } else {
      // Neuer Artikel - hole Produkt-Daten für Preis
      const product = await getProduct(productId);
      let itemPrice = product.price;
      
      // Wenn Variante gewählt wurde, hole Varianten-Preis
      if (variantId && product.variants) {
        const variant = product.variants.find(v => v.id === variantId);
        if (variant && variant.price) {
          itemPrice = variant.price;
        }
      }

      // Erstelle neuen Warenkorb-Eintrag
      await addDoc(cartItemsRef, {
        productId: productId,
        variantId: variantId || null,
        quantity: quantity,
        priceAtTime: itemPrice, // Preis zum Zeitpunkt des Hinzufügens
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Artikel zum Warenkorb hinzugefügt:', productId);
    }
  } catch (error) {
    console.error('❌ Fehler beim Hinzufügen zum Warenkorb:', error);
    throw error;
  }
};

/**
 * Ruft den Warenkorb eines Users ab
 * @param {string} userId - User-ID
 * @returns {Promise<Array>} Array von Warenkorb-Items mit Produkt-Details
 */
export const getCart = async (userId) => {
  try {
    if (!userId) {
      return [];
    }

    const cartItemsRef = collection(db, 'cart', userId, 'items');
    const snapshot = await getDocs(cartItemsRef);

    // Lade Produkt-Details für jedes Item
    const cartItems = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const itemData = doc.data();
        try {
          const product = await getProduct(itemData.productId);
          return {
            id: doc.id,
            ...itemData,
            product: product
          };
        } catch (error) {
          console.error(`❌ Fehler beim Laden des Produkts ${itemData.productId}:`, error);
          return {
            id: doc.id,
            ...itemData,
            product: null // Produkt nicht gefunden
          };
        }
      })
    );

    // Filtere Items mit nicht gefundenen Produkten heraus
    return cartItems.filter(item => item.product !== null);
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Warenkorbs:', error);
    throw error;
  }
};

/**
 * Aktualisiert die Menge eines Warenkorb-Items
 * @param {string} userId - User-ID
 * @param {string} itemId - Warenkorb-Item-ID
 * @param {number} quantity - Neue Menge (0 = entfernen)
 * @returns {Promise<void>}
 */
export const updateCartItemQuantity = async (userId, itemId, quantity) => {
  try {
    if (quantity < 0 || quantity > 10) {
      throw new Error('Menge muss zwischen 0 und 10 liegen');
    }

    const itemRef = doc(db, 'cart', userId, 'items', itemId);

    if (quantity === 0) {
      // Entferne Item
      await deleteDoc(itemRef);
      console.log('✅ Warenkorb-Item entfernt:', itemId);
    } else {
      // Aktualisiere Menge
      await updateDoc(itemRef, {
        quantity: quantity,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Warenkorb-Item-Menge aktualisiert:', itemId);
    }
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Warenkorb-Item-Menge:', error);
    throw error;
  }
};

/**
 * Entfernt ein Item aus dem Warenkorb
 * @param {string} userId - User-ID
 * @param {string} itemId - Warenkorb-Item-ID
 * @returns {Promise<void>}
 */
export const removeFromCart = async (userId, itemId) => {
  try {
    await updateCartItemQuantity(userId, itemId, 0);
  } catch (error) {
    console.error('❌ Fehler beim Entfernen aus dem Warenkorb:', error);
    throw error;
  }
};

/**
 * Leert den Warenkorb eines Users
 * @param {string} userId - User-ID
 * @returns {Promise<void>}
 */
export const clearCart = async (userId) => {
  try {
    const cartItemsRef = collection(db, 'cart', userId, 'items');
    const snapshot = await getDocs(cartItemsRef);

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('✅ Warenkorb geleert:', userId);
  } catch (error) {
    console.error('❌ Fehler beim Leeren des Warenkorbs:', error);
    throw error;
  }
};

/**
 * Abonniert Änderungen am Warenkorb eines Users
 * @param {string} userId - User-ID
 * @param {Function} callback - Callback-Funktion für Updates
 * @returns {Function} Unsubscribe-Funktion
 */
export const subscribeCart = (userId, callback) => {
  try {
    if (!userId) {
      return () => {}; // Leere Unsubscribe-Funktion
    }

    const cartItemsRef = collection(db, 'cart', userId, 'items');
    return onSnapshot(cartItemsRef, async (snapshot) => {
      // Lade Produkt-Details für jedes Item
      const cartItems = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const itemData = doc.data();
          try {
            const product = await getProduct(itemData.productId);
            return {
              id: doc.id,
              ...itemData,
              product: product
            };
          } catch (error) {
            return {
              id: doc.id,
              ...itemData,
              product: null
            };
          }
        })
      );

      // Filtere Items mit nicht gefundenen Produkten heraus
      const validItems = cartItems.filter(item => item.product !== null);
      callback(validItems);
    });
  } catch (error) {
    console.error('❌ Fehler bei der Warenkorb-Subscription:', error);
    throw error;
  }
};

// ===== BESTELLUNGEN =====

/**
 * Berechnet Versandkosten basierend auf Produkt-Größen
 * @param {Array} cartItems - Warenkorb-Items mit Produkt-Daten
 * @param {number} subtotal - Zwischensumme (Brutto)
 * @returns {number} Versandkosten
 */
export const calculateShippingCost = (cartItems, subtotal) => {
  try {
    // Versandkostenfrei ab 100€
    if (subtotal >= 100) {
      return 0;
    }

    // Finde höchste Versandkosten aus allen Produkten
    let maxShippingCost = 0;
    cartItems.forEach(item => {
      const product = item.product;
      if (product && product.shippingCost) {
        maxShippingCost = Math.max(maxShippingCost, product.shippingCost);
      }
    });

    return maxShippingCost;
  } catch (error) {
    console.error('❌ Fehler bei der Versandkosten-Berechnung:', error);
    return 0;
  }
};

/**
 * Erstellt eine neue Bestellung
 * @param {Object} orderData - Bestelldaten
 * @returns {Promise<string>} Bestell-ID
 */
export const createOrder = async (orderData) => {
  try {
    if (!orderData.userId) {
      throw new Error('User-ID ist erforderlich');
    }
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Bestellung muss mindestens ein Item enthalten');
    }

    // Berechne Preise
    let subtotal = 0; // Netto
    const items = [];

    for (const item of orderData.items) {
      const product = item.product;
      const quantity = item.quantity;
      let itemPrice = item.priceAtTime || product.price;

      // Wenn Variante, hole Varianten-Preis
      if (item.variantId && product.variants) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (variant && variant.price) {
          itemPrice = variant.price;
        }
      }

      const itemSubtotal = itemPrice * quantity;
      subtotal += itemSubtotal;

      items.push({
        productId: product.id,
        variantId: item.variantId || null,
        name: product.name,
        variantName: item.variantId ? product.variants?.find(v => v.id === item.variantId)?.name : null,
        quantity: quantity,
        price: itemPrice, // Netto
        priceGross: Math.round(itemPrice * 1.19 * 100) / 100 // Brutto
      });
    }

    // Berechne MwSt (19%)
    const tax = Math.round(subtotal * 0.19 * 100) / 100;

    // Berechne Versandkosten
    const shippingCost = calculateShippingCost(orderData.items, subtotal + tax);
    const shippingCostFree = (subtotal + tax) >= 100;

    // Gesamtpreis (Brutto + Versand)
    const total = Math.round((subtotal + tax + shippingCost) * 100) / 100;

    // Erstelle Bestellung
    const orderRef = await addDoc(collection(db, 'orders'), {
      userId: orderData.userId,
      items: items,
      subtotal: Math.round(subtotal * 100) / 100, // Netto
      tax: tax, // MwSt
      shippingCost: shippingCost,
      shippingCostFree: shippingCostFree,
      total: total, // Brutto + Versand
      status: 'pending',
      paymentMethod: orderData.paymentMethod || 'paypal',
      paymentId: null, // Wird nach PayPal-Zahlung gesetzt
      shippingAddress: orderData.shippingAddress || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Reduziere Lagerbestand
    for (const item of orderData.items) {
      const product = item.product;
      if (product.stock !== null && product.stock !== undefined) {
        const newStock = Math.max(0, product.stock - item.quantity);
        await updateProduct(product.id, { stock: newStock });

        // Wenn Variante, reduziere auch Varianten-Lagerbestand
        if (item.variantId && product.variants) {
          const variantIndex = product.variants.findIndex(v => v.id === item.variantId);
          if (variantIndex !== -1 && product.variants[variantIndex].stock !== null) {
            const variantStock = product.variants[variantIndex].stock;
            const newVariantStock = Math.max(0, variantStock - item.quantity);
            product.variants[variantIndex].stock = newVariantStock;
            await updateProduct(product.id, { variants: product.variants });
          }
        }
      }
    }

    // Leere Warenkorb
    await clearCart(orderData.userId);

    console.log('✅ Bestellung erstellt:', orderRef.id);
    return orderRef.id;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Bestellung:', error);
    throw error;
  }
};

/**
 * Ruft eine Bestellung ab
 * @param {string} orderId - Bestell-ID
 * @returns {Promise<Object>} Bestell-Daten
 */
export const getOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('Bestellung nicht gefunden');
    }

    return {
      id: orderSnap.id,
      ...orderSnap.data()
    };
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Bestellung:', error);
    throw error;
  }
};

/**
 * Ruft alle Bestellungen eines Users ab
 * @param {string} userId - User-ID
 * @returns {Promise<Array>} Array von Bestellungen
 */
export const getUserOrders = async (userId) => {
  try {
    // WICHTIG: Firestore benötigt einen Composite Index für where + orderBy
    // Falls Index fehlt, verwende Fallback: Filter im Code
    let ordersQuery;
    try {
      // Versuche Query mit orderBy (benötigt Index)
      ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(ordersQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (indexError) {
      // Fallback: Query ohne orderBy, dann im Code sortieren
      if (indexError.message && indexError.message.includes('index')) {
        console.warn('⚠️ Firestore Index fehlt, verwende Fallback (Sortierung im Code)');
        console.warn('💡 Erstelle den Index hier:', indexError.message.match(/https:\/\/[^\s]+/)?.[0] || 'Firebase Console');
        
        // Query ohne orderBy
        ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(ordersQuery);
        
        // Sortiere im Code
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sortiere nach createdAt (neueste zuerst)
        orders.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bTime - aTime; // Descending
        });
        
        return orders;
      } else {
        // Anderer Fehler, weiterwerfen
        throw indexError;
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der User-Bestellungen:', error);
    throw error;
  }
};

/**
 * Ruft alle Bestellungen ab (Admin)
 * @returns {Promise<Array>} Array von Bestellungen
 */
export const getAllOrders = async () => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(ordersQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Fehler beim Abrufen aller Bestellungen:', error);
    throw error;
  }
};

/**
 * Aktualisiert den Status einer Bestellung
 * @param {string} orderId - Bestell-ID
 * @param {string} status - Neuer Status (pending, paid, shipped, delivered, cancelled)
 * @param {string} paymentId - Optional: PayPal Transaction ID
 * @returns {Promise<void>}
 */
export const updateOrderStatus = async (orderId, status, paymentId = null) => {
  try {
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Ungültiger Status: ${status}`);
    }

    const updates = {
      status: status,
      updatedAt: serverTimestamp()
    };

    if (paymentId) {
      updates.paymentId = paymentId;
    }

    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, updates);

    console.log('✅ Bestell-Status aktualisiert:', orderId, status);
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Bestell-Status:', error);
    throw error;
  }
};

/**
 * Löscht eine Bestellung
 * @param {string} orderId - Bestell-ID
 * @param {string} userId - User-ID (zur Sicherheit: nur der Besitzer kann löschen)
 * @returns {Promise<void>}
 */
export const deleteOrder = async (orderId, userId) => {
  try {
    // Prüfe, ob Bestellung existiert und dem User gehört
    const order = await getOrder(orderId);
    if (order.userId !== userId) {
      throw new Error('Sie können nur Ihre eigenen Bestellungen löschen');
    }

    // Lösche Bestellung
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);

    console.log('✅ Bestellung gelöscht:', orderId);
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Bestellung:', error);
    throw error;
  }
};

// ===== KATEGORIEN =====

/**
 * Standard-Kategorien für Produkte
 */
export const PRODUCT_CATEGORIES = [
  { id: 'weinglaeser', name: 'Weingläser', icon: '🍷' },
  { id: 'oeffner', name: 'Öffner', icon: '🍾' },
  { id: 'kuehler', name: 'Weinkühler', icon: '🧊' },
  { id: 'geschenkboxen', name: 'Geschenkboxen', icon: '🎁' },
  { id: 'sonstiges', name: 'Sonstiges', icon: '📦' }
];

/**
 * Ruft alle Kategorien ab (aus Firestore oder Standard-Liste)
 * @returns {Promise<Array>} Array von Kategorien
 */
export const getProductCategories = async () => {
  try {
    // Versuche Kategorien aus Firestore zu laden
    const categoriesRef = collection(db, 'productCategories');
    const snapshot = await getDocs(categoriesRef);

    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    // Fallback: Standard-Kategorien
    return PRODUCT_CATEGORIES;
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Kategorien:', error);
    // Fallback: Standard-Kategorien
    return PRODUCT_CATEGORIES;
  }
};

/**
 * Erstellt eine neue Kategorie (Admin)
 * @param {Object} categoryData - Kategoriedaten
 * @returns {Promise<string>} Kategorie-ID
 */
export const createProductCategory = async (categoryData) => {
  try {
    if (!categoryData.id || !categoryData.name) {
      throw new Error('Kategorie-ID und Name sind erforderlich');
    }

    const categoryRef = await addDoc(collection(db, 'productCategories'), {
      id: categoryData.id,
      name: categoryData.name,
      icon: categoryData.icon || '📦',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Kategorie erstellt:', categoryRef.id);
    return categoryRef.id;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Kategorie:', error);
    throw error;
  }
};
