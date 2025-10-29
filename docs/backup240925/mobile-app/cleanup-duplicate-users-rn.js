// Doppelte Test-User löschen (React Native Firebase)
import firestore from '@react-native-firebase/firestore';

const cleanupDuplicateUsers = async () => {
  try {
    console.log('🔄 Cleaning up duplicate test users...');
    
    // Alle test@bottle-trade.de User finden
    const usersQuery = await firestore()
      .collection('users')
      .where('email', '==', 'test@bottle-trade.de')
      .get();
    
    console.log(`📊 Found ${usersQuery.docs.length} test users`);
    
    if (usersQuery.docs.length > 1) {
      console.log('🗑️ Deleting duplicate users...');
      
      // Alle außer dem ersten löschen
      for (let i = 1; i < usersQuery.docs.length; i++) {
        const userDoc = usersQuery.docs[i];
        const userId = userDoc.id;
        
        console.log(`🗑️ Deleting user: ${userId}`);
        
        // Zuerst alle Weine des Users löschen
        const winesQuery = await firestore()
          .collection('wines')
          .where('ownerId', '==', userId)
          .get();
        
        console.log(`🍷 Found ${winesQuery.docs.length} wines for user ${userId}`);
        
        for (const wineDoc of winesQuery.docs) {
          await firestore().collection('wines').doc(wineDoc.id).delete();
          console.log(`🗑️ Deleted wine: ${wineDoc.id}`);
        }
        
        // Dann den User löschen
        await firestore().collection('users').doc(userId).delete();
        console.log(`✅ Deleted user: ${userId}`);
      }
      
      console.log('✅ Cleanup completed!');
    } else {
      console.log('✅ No duplicates found');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

// Script ausführen
cleanupDuplicateUsers();
