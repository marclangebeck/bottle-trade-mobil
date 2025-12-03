// Firebase functions importieren
import { 
  getWinesByOwner as getWinesByOwnerFirebase,
  addWine as addWineFirebase,
  updateWine as updateWineFirebase,
  deleteWine as deleteWineFirebase,
  getAvailableWines as getAvailableWinesFirebase,
  publishWine as publishWineFirebase,
  unpublishWine as unpublishWineFirebase
} from '../services/database-web';

// Mock-Daten für die Bottle-Trade App (Fallback)

// Verfügbare Weine in der Weinbörse
export const getAvailableWines = async () => {
  try {
    console.log('🔄 Loading wines from Firestore...');
    const wines = await getAvailableWinesFirebase();
    console.log('✅ Loaded', wines.length, 'wines from Firestore');
    return wines;
  } catch (error) {
    console.error('❌ Error loading wines from Firestore:', error);
    console.log('🔄 Returning empty array (no mock data)');
    return [];
  }
};

const getAvailableWinesMock = () => {
  return [
    {
      id: 1,
      name: 'Château Margaux 2015',
      winery: 'Château Margaux',
      vintage: 2015,
      region: 'Bordeaux, Frankreich',
      wineType: 'Rotwein',
      price: 450,
      owner: 'Max Mustermann',
      description: 'Ein außergewöhnlicher Bordeaux aus dem berühmten Château Margaux. Perfekt gereift und bereit zum Genießen.',
      labelImage: null,
      available: true,
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'Barolo Brunate 2018',
      winery: 'Vietti',
      vintage: 2018,
      region: 'Piemont, Italien',
      wineType: 'Rotwein',
      price: 120,
      owner: 'Anna Schmidt',
      description: 'Kraftvoller Barolo mit Noten von Kirschen und Trüffel. Ideal für besondere Anlässe.',
      labelImage: null,
      available: true,
      createdAt: '2024-01-10'
    },
    {
      id: 3,
      name: 'Riesling Spätlese 2020',
      winery: 'Dr. Loosen',
      vintage: 2020,
      region: 'Mosel, Deutschland',
      wineType: 'Weißwein',
      price: 25,
      owner: 'Peter Weber',
      description: 'Fruchtiger Riesling mit perfekter Säure. Perfekt zu Fisch und Meeresfrüchten.',
      labelImage: null,
      available: true,
      createdAt: '2024-01-08'
    },
    {
      id: 4,
      name: 'Champagne Dom Pérignon 2012',
      winery: 'Moët & Chandon',
      vintage: 2012,
      region: 'Champagne, Frankreich',
      wineType: 'Schaumwein',
      price: 180,
      owner: 'Sarah Müller',
      description: 'Exquisite Champagner mit feinen Perlen und komplexen Aromen.',
      labelImage: null,
      available: true,
      createdAt: '2024-01-05'
    },
    {
      id: 5,
      name: 'Pinot Noir Reserve 2019',
      winery: 'Domaine de la Côte',
      vintage: 2019,
      region: 'Santa Barbara, USA',
      wineType: 'Rotwein',
      price: 85,
      owner: 'Thomas Klein',
      description: 'Eleganter Pinot Noir mit Noten von Erdbeeren und Gewürzen.',
      labelImage: null,
      available: true,
      createdAt: '2024-01-03'
    }
  ];
};

// Benutzer-Weinregal (eigene Weine) - Mock-Daten deaktiviert
export const getUserWines = () => {
  console.log('🔄 getUserWines: Mock data disabled, returning empty array');
  return [];
};

// Weine nach Besitzer filtern
export const getWinesByOwner = async (ownerId) => {
  try {
    return await getWinesByOwnerFirebase(ownerId);
  } catch (error) {
    console.error('Error getting wines by owner:', error);
    console.log('🔄 Returning empty array (no mock data)');
    return [];
  }
};

// Wein hinzufügen
export const addWine = async (wineData) => {
  try {
    return await addWineFirebase(wineData);
  } catch (error) {
    console.error('Error adding wine:', error);
    throw error;
  }
};

// Wein aktualisieren
export const updateWine = async (wineId, updates) => {
  try {
    return await updateWineFirebase(wineId, updates);
  } catch (error) {
    console.error('Error updating wine:', error);
    throw error;
  }
};

// Wein löschen
export const deleteWine = async (wineId) => {
  try {
    return await deleteWineFirebase(wineId);
  } catch (error) {
    console.error('Error deleting wine:', error);
    throw error;
  }
};

// Wein veröffentlichen
export const publishWine = async (wineId, userId) => {
  try {
    return await publishWineFirebase(wineId, userId);
  } catch (error) {
    console.error('Error publishing wine:', error);
    throw error;
  }
};

// Wein zurückziehen
export const unpublishWine = async (wineId) => {
  try {
    return await unpublishWineFirebase(wineId);
  } catch (error) {
    console.error('Error unpublishing wine:', error);
    throw error;
  }
};

// BTP-Daten entfernt - BTP wird nicht mehr verwendet

// Community-Daten
export const getCommunityData = () => {
  return {
    activeMembers: 1247,
    successfulTrades: 3891,
    events: 156,
    recentActivity: [
      {
        id: 1,
        user: 'Max Mustermann',
        action: 'hat einen neuen Wein hinzugefügt',
        wine: 'Château Margaux 2015',
        time: 'vor 2 Stunden',
        avatar: null
      },
      {
        id: 2,
        user: 'Anna Schmidt',
        action: 'hat einen Tausch abgeschlossen',
        wine: 'Barolo Brunate 2018',
        time: 'vor 4 Stunden',
        avatar: null
      }
    ]
  };
};