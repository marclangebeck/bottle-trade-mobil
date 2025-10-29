// Script zum Erstellen von Test-Daten in Firestore
import { createAllTestData } from './services/testData.js';

console.log('🚀 Starting test data creation...');

createAllTestData()
  .then((result) => {
    console.log('🎉 Test data creation completed!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test data creation failed:', error);
    process.exit(1);
  });
