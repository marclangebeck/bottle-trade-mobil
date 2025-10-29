// Test-Daten für Firestore
import firestore from '@react-native-firebase/firestore';

// Test-User erstellen
export const createTestUser = async () => {
  try {
    console.log('🔄 Creating test user...');
    
    const testUser = {
      username: 'testuser',
      email: 'test@bottle-trade.de',
      firstName: 'Max',
      lastName: 'Mustermann',
      street: 'Musterstraße 123',
      zipCode: '12345',
      city: 'Musterstadt',
      btp: 50,
      totalBtpEarned: 50,
      isWinery: false,
      profilePublic: true,
      newsletter: true,
      adFree: false,
      wishlist: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    
    const userRef = await firestore().collection('users').add(testUser);
    console.log('✅ Test user created with ID:', userRef.id);
    
    return userRef.id;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
};

// Test-Weine erstellen
export const createTestWines = async (userId) => {
  try {
    console.log('🔄 Creating test wines...');
    
    const testWines = [
      {
        name: 'Château Margaux 2015',
        winery: 'Château Margaux',
        vintage: 2015,
        region: 'Bordeaux, Frankreich',
        wineType: 'Rotwein',
        price: 450,
        description: 'Ein außergewöhnlicher Bordeaux aus dem berühmten Château Margaux.',
        ownerId: userId,
        status: 'public',
        availableForTrade: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Barolo Brunate 2018',
        winery: 'Vietti',
        vintage: 2018,
        region: 'Piemont, Italien',
        wineType: 'Rotwein',
        price: 120,
        description: 'Kraftvoller Barolo mit Noten von Kirschen und Trüffel.',
        ownerId: userId,
        status: 'public',
        availableForTrade: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Riesling Trocken 2020',
        winery: 'Dr. Loosen',
        vintage: 2020,
        region: 'Mosel, Deutschland',
        wineType: 'Weißwein',
        price: 25,
        description: 'Frischer Riesling mit mineralischen Noten.',
        ownerId: userId,
        status: 'public',
        availableForTrade: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      }
    ];
    
    const wineRefs = [];
    for (const wine of testWines) {
      const wineRef = await firestore().collection('wines').add(wine);
      wineRefs.push(wineRef.id);
      console.log('✅ Test wine created:', wine.name);
    }
    
    console.log('✅ All test wines created');
    return wineRefs;
  } catch (error) {
    console.error('❌ Error creating test wines:', error);
    throw error;
  }
};

// Alle Test-Daten erstellen
export const createAllTestData = async () => {
  try {
    console.log('🔄 Creating all test data...');
    
    const userId = await createTestUser();
    const wineIds = await createTestWines(userId);
    
    console.log('✅ All test data created successfully!');
    console.log('User ID:', userId);
    console.log('Wine IDs:', wineIds);
    
    return { userId, wineIds };
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
};
