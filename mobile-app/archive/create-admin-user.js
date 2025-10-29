// Admin-User erstellen
import firestore from '@react-native-firebase/firestore';

const createAdminUser = async () => {
  try {
    console.log('🔄 Creating admin user...');
    
    const adminUser = {
      username: 'admin',
      email: 'admin@bottle-trade.de',
      password: '12345', // Passwort für Login
      firstName: 'Marc',
      lastName: 'Langebeck',
      street: 'Moltkestraße',
      houseNumber: '41',
      zipCode: '24105',
      city: 'Kiel',
      btp: 1000, // Admin bekommt mehr BTP
      totalBtpEarned: 1000,
      isWinery: false,
      profilePublic: true,
      newsletter: true,
      adFree: true, // Admin hat werbefreie App
      wishlist: true, // Admin hat Wunschliste
      isAdmin: true, // Wichtig: Admin-Flag
      role: 'admin',
      permissions: ['delete_wines', 'manage_users', 'view_analytics'],
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    
    const userRef = await firestore().collection('users').add(adminUser);
    console.log('✅ Admin user created with ID:', userRef.id);
    console.log('📧 Email: admin@bottle-trade.de');
    console.log('🔑 Admin privileges: Full access');
    
    return userRef.id;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

// Admin-User erstellen
createAdminUser()
  .then((userId) => {
    console.log('🎉 Admin user successfully created!');
    console.log('User ID:', userId);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  });
