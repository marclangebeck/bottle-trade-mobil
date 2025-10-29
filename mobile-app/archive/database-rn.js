// React Native Firebase Database Service
import firestore from '@react-native-firebase/firestore';

// ===== USER MANAGEMENT =====

export const createUser = async (userData) => {
  try {
    console.log('🔄 Creating user in Firestore:', userData.email);
    
    const userRef = await firestore().collection('users').add({
      ...userData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
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
    
    const userQuery = await firestore()
      .collection('users')
      .where('uid', '==', uid)
      .get();
    
    if (userQuery.empty) {
      console.log('❌ User not found:', uid);
      return null;
    }
    
    const userDoc = userQuery.docs[0];
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
    
    const userQuery = await firestore()
      .collection('users')
      .where('uid', '==', uid)
      .get();
    
    if (userQuery.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = userQuery.docs[0];
    await userDoc.ref.update({
      ...userData,
      updatedAt: firestore.FieldValue.serverTimestamp()
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
    
    const wineRef = await firestore().collection('wines').add({
      ...wineData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
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
    
    const winesQuery = await firestore()
      .collection('wines')
      .where('ownerId', '==', ownerId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const wines = winesQuery.docs.map(doc => ({
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
    
    const winesQuery = await firestore()
      .collection('wines')
      .where('availableForTrade', '==', true)
      .where('status', '==', 'public')
      .orderBy('createdAt', 'desc')
      .get();
    
    const wines = winesQuery.docs.map(doc => ({
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
    
    await firestore()
      .collection('wines')
      .doc(wineId)
      .update({
        ...wineData,
        updatedAt: firestore.FieldValue.serverTimestamp()
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
    
    await firestore()
      .collection('wines')
      .doc(wineId)
      .delete();
    
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
    
    await firestore()
      .collection('wines')
      .doc(wineId)
      .update({
        status: 'public',
        availableForTrade: true,
        publishedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
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
    
    await firestore()
      .collection('wines')
      .doc(wineId)
      .update({
        status: 'private',
        availableForTrade: false,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    
    console.log('✅ Wine unpublished:', wineId);
    return true;
    
  } catch (error) {
    console.error('❌ Error unpublishing wine:', error);
    throw error;
  }
};
