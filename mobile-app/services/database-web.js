// Firebase Web-SDK Database Service für React Native (nur Firestore)
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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase-web';

// ===== USER MANAGEMENT =====

export const createUser = async (userData) => {
  try {
    console.log('🔄 Creating user in Firestore:', userData.email);
    
    const userRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ User created with ID:', userRef.id);
    return userRef.id;
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

export const getUser = async (uid) => {
  try {
    console.log('🔄 Getting user:', uid);
    
    const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      console.log('❌ User not found:', uid);
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = { id: userDoc.id, ...userDoc.data() };
    
    console.log('✅ User found:', userData.email);
    return userData;
    
  } catch (error) {
    console.error('❌ Error getting user:', error);
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

// ===== WINE MANAGEMENT =====

export const addWine = async (wineData) => {
  try {
    console.log('🔄 Adding wine:', wineData.name);
    
    const wineRef = await addDoc(collection(db, 'wines'), {
      ...wineData,
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

export const getWinesByOwner = async (ownerId) => {
  try {
    console.log('🔄 Getting wines for owner:', ownerId);
    
    const winesQuery = query(
      collection(db, 'wines'), 
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(winesQuery);
    
    const wines = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
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
    
    const winesQuery = query(
      collection(db, 'wines'),
      where('availableForTrade', '==', true),
      where('status', '==', 'public'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(winesQuery);
    
    const wines = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
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
    
    await updateDoc(doc(db, 'wines', wineId), {
      ...wineData,
      updatedAt: serverTimestamp()
    });
    
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
