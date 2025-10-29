// Script zum Erstellen eines sauberen Admin-Users
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyC-bnVaESKpnGnT6KixdGV8sAIKbwN3_FQ",
  authDomain: "bottle-trade-app.firebaseapp.com",
  projectId: "bottle-trade-app",
  storageBucket: "bottle-trade-app.firebasestorage.app",
  messagingSenderId: "114096417958",
  appId: "1:114096417958:web:4b9f9868342a3e9b2f5867",
  measurementId: "G-14EFSBKCVN"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createCleanAdmin() {
  try {
    console.log('🔄 Erstelle sauberen Admin-User...');

    // Admin-User erstellen
    const adminUser = {
      uid: 'admin-123',
      email: 'admin@bottle-trade.de',
      username: 'admin',
      firstName: 'Marc',
      lastName: 'Langebeck',
      street: 'Moltkestraße',
      houseNumber: '41',
      zipCode: '24105',
      city: 'Kiel',
      isAdmin: true,
      profilePublished: false,
      newsletter: false,
      profileImage: null,
      btp: 100, // Start-BTP
      createdAt: new Date(),
      lastLogin: new Date()
    };

    // User in Firestore speichern
    await setDoc(doc(db, 'users', 'admin-123'), adminUser);
    console.log('✅ Admin-User erstellt:', adminUser.email);

    // Test-User erstellen
    const testUser = {
      uid: 'test-456',
      email: 'test@bottle-trade.de',
      username: 'testuser',
      firstName: 'Max',
      lastName: 'Mustermann',
      street: 'Teststraße',
      houseNumber: '123',
      zipCode: '12345',
      city: 'Teststadt',
      isAdmin: false,
      profilePublished: false,
      newsletter: false,
      profileImage: null,
      btp: 50, // Start-BTP
      createdAt: new Date(),
      lastLogin: new Date()
    };

    await setDoc(doc(db, 'users', 'test-456'), testUser);
    console.log('✅ Test-User erstellt:', testUser.email);

    // Test-Weine für den Test-User erstellen
    const testWines = [
      {
        name: 'Riesling Spätlese',
        winery: 'Weingut Müller',
        vintage: 2020,
        region: 'Rheingau',
        grapeVariety: 'Riesling',
        wineType: 'Weißwein',
        price: 15.99,
        description: 'Ein fruchtiger Riesling mit feiner Säure',
        ownerId: 'test-456',
        owner: 'Max Mustermann',
        status: 'private',
        availableForTrade: false,
        createdAt: new Date()
      },
      {
        name: 'Pinot Noir Reserve',
        winery: 'Weingut Schmidt',
        vintage: 2019,
        region: 'Baden',
        grapeVariety: 'Pinot Noir',
        wineType: 'Rotwein',
        price: 25.50,
        description: 'Kraftvoller Rotwein mit langer Lagerung',
        ownerId: 'test-456',
        owner: 'Max Mustermann',
        status: 'public',
        availableForTrade: true,
        createdAt: new Date()
      }
    ];

    for (const wine of testWines) {
      await addDoc(collection(db, 'wines'), wine);
    }
    console.log(`✅ ${testWines.length} Test-Weine erstellt`);

    console.log('✅ Setup abgeschlossen!');
    console.log('📝 Du kannst jetzt mit admin@bottle-trade.de (Admin) oder test@bottle-trade.de (User) einloggen.');

  } catch (error) {
    console.error('❌ Fehler beim Erstellen:', error);
  }
}

createCleanAdmin();


