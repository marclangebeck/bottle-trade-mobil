import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Lädt ein Bild zu Firebase Storage hoch (für Web)
 */
export const uploadImageToStorage = async (
  file: File,
  folder: string = 'products',
  fileName?: string
): Promise<string> => {
  try {
    console.log('🔄 Starte Bild-Upload:', file.name);

    // Generiere Dateinamen falls nicht angegeben
    if (!fileName) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      fileName = `${folder}_${timestamp}_${randomString}.${extension}`;
    }

    // Erstelle Storage-Referenz
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // Erstelle Metadaten-Objekt
    const metadata = {
      contentType: file.type || 'image/jpeg',
    };

    // Upload zu Firebase Storage
    console.log('📤 Upload zu Firebase Storage:', `${folder}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file, metadata);

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
 * Lädt mehrere Bilder hoch
 */
export const uploadProductImages = async (
  productId: string,
  files: File[]
): Promise<string[]> => {
  try {
    if (!files || files.length === 0) {
      return [];
    }

    if (files.length > 5) {
      throw new Error('Maximal 5 Bilder pro Produkt erlaubt');
    }

    const uploadPromises = files.map(async (file, index) => {
      const fileName = `product_${productId}_${index}_${Date.now()}.jpg`;
      return await uploadImageToStorage(file, 'products', fileName);
    });

    const imageUrls = await Promise.all(uploadPromises);
    console.log('✅ Produkt-Bilder hochgeladen:', imageUrls.length);
    return imageUrls;
  } catch (error) {
    console.error('❌ Fehler beim Hochladen der Produkt-Bilder:', error);
    throw error;
  }
};

