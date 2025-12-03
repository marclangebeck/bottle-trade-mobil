// PLZ-basierter Geocoding-Service für Entfernungsberechnung
// Verwendet die Haversine-Formel für Entfernungsberechnung zwischen zwei PLZ

// Lade PLZ-Datenbank
let postalCodeDatabase = null;

/**
 * Lädt die PLZ-Datenbank aus der JSON-Datei
 */
const loadPostalCodeDatabase = () => {
  if (postalCodeDatabase) {
    return postalCodeDatabase;
  }
  
  try {
    const database = require('../data/germanPostalCodes.json');
    postalCodeDatabase = database;
    console.log(`✅ PLZ-Datenbank geladen: ${Object.keys(database.specificPostalCodes || {}).length} spezifische PLZ, ${Object.keys(database.postalCodeRanges || {}).length} PLZ-Bereiche`);
    return database;
  } catch (error) {
    console.warn('⚠️ PLZ-Datenbank konnte nicht geladen werden, verwende Fallback:', error.message);
    return null;
  }
};

/**
 * Prüft ob eine PLZ in einem Bereich liegt
 */
const isInRange = (postalCode, range) => {
  const [start, end] = range.split('-').map(Number);
  const code = Number(postalCode);
  return code >= start && code <= end;
};

/**
 * PLZ zu ungefähren Koordinaten (Mittelpunkt der PLZ-Region)
 * Verwendet die PLZ-Datenbank für präzise Koordinaten
 */
const PLZ_TO_COORDINATES = {
  // Berlin
  '1': { lat: 52.52, lon: 13.405 },
  // Hamburg
  '2': { lat: 53.551, lon: 9.993 },
  // München
  '8': { lat: 48.135, lon: 11.582 },
  // Köln
  '5': { lat: 50.937, lon: 6.960 },
  // Frankfurt
  '6': { lat: 50.110, lon: 8.682 },
  // Stuttgart
  '7': { lat: 48.775, lon: 9.183 },
  // Düsseldorf
  '4': { lat: 51.227, lon: 6.773 },
  // Dortmund
  '4': { lat: 51.513, lon: 7.465 },
  // Essen
  '4': { lat: 51.455, lon: 7.011 },
  // Leipzig
  '0': { lat: 51.339, lon: 12.373 },
  // Dresden
  '0': { lat: 51.050, lon: 13.737 },
  // Hannover
  '3': { lat: 52.375, lon: 9.732 },
  // Nürnberg
  '9': { lat: 49.452, lon: 11.077 },
  // Duisburg
  '4': { lat: 51.434, lon: 6.762 },
  // Bochum
  '4': { lat: 51.481, lon: 7.216 },
  // Wuppertal
  '4': { lat: 51.256, lon: 7.150 },
  // Bielefeld
  '3': { lat: 52.030, lon: 8.532 },
  // Bonn
  '5': { lat: 50.737, lon: 7.098 },
  // Münster
  '4': { lat: 51.962, lon: 7.626 },
  // Karlsruhe
  '7': { lat: 49.009, lon: 8.404 },
  // Mannheim
  '6': { lat: 49.487, lon: 8.466 },
  // Augsburg
  '8': { lat: 48.366, lon: 10.898 },
  // Wiesbaden
  '6': { lat: 50.082, lon: 8.240 },
  // Gelsenkirchen
  '4': { lat: 51.518, lon: 7.083 },
  // Mönchengladbach
  '4': { lat: 51.191, lon: 6.442 },
  // Braunschweig
  '3': { lat: 52.268, lon: 10.527 },
  // Chemnitz
  '0': { lat: 50.832, lon: 12.921 },
  // Kiel
  '2': { lat: 54.323, lon: 10.139 },
  // Aachen
  '5': { lat: 50.776, lon: 6.083 },
  // Halle
  '0': { lat: 51.482, lon: 11.969 },
  // Magdeburg
  '3': { lat: 52.131, lon: 11.639 },
  // Freiburg
  '7': { lat: 47.999, lon: 7.842 },
  // Krefeld
  '4': { lat: 51.338, lon: 6.565 },
  // Lübeck
  '2': { lat: 53.866, lon: 10.686 },
  // Oberhausen
  '4': { lat: 51.470, lon: 6.851 },
  // Erfurt
  '9': { lat: 50.978, lon: 11.029 },
  // Rostock
  '1': { lat: 54.088, lon: 12.140 },
  // Mainz
  '5': { lat: 50.001, lon: 8.271 },
  // Kassel
  '3': { lat: 51.312, lon: 9.479 },
  // Hagen
  '5': { lat: 51.360, lon: 7.471 },
  // Hamm
  '5': { lat: 51.673, lon: 7.816 },
  // Saarbrücken
  '6': { lat: 49.235, lon: 7.009 },
  // Mülheim
  '4': { lat: 51.432, lon: 6.880 },
  // Potsdam
  '1': { lat: 52.400, lon: 13.059 },
  // Ludwigshafen
  '6': { lat: 49.481, lon: 8.446 },
  // Oldenburg
  '2': { lat: 53.143, lon: 8.214 },
  // Leverkusen
  '5': { lat: 51.030, lon: 6.984 },
  // Osnabrück
  '4': { lat: 52.279, lon: 8.047 },
  // Solingen
  '4': { lat: 51.172, lon: 7.085 },
  // Heidelberg
  '6': { lat: 49.398, lon: 8.672 },
  // Herne
  '4': { lat: 51.538, lon: 7.226 },
  // Neuss
  '4': { lat: 51.204, lon: 6.687 },
  // Darmstadt
  '6': { lat: 49.872, lon: 8.651 },
  // Paderborn
  '3': { lat: 51.718, lon: 8.757 },
  // Regensburg
  '9': { lat: 49.013, lon: 12.102 },
  // Ingolstadt
  '8': { lat: 48.765, lon: 11.425 },
  // Würzburg
  '9': { lat: 49.794, lon: 9.929 },
  // Fürth
  '9': { lat: 49.477, lon: 10.988 },
  // Wolfsburg
  '3': { lat: 52.422, lon: 10.786 },
  // Offenbach
  '6': { lat: 50.103, lon: 8.766 },
  // Ulm
  '8': { lat: 48.401, lon: 9.987 },
  // Heilbronn
  '7': { lat: 49.142, lon: 9.218 },
  // Pforzheim
  '7': { lat: 48.894, lon: 8.691 },
  // Göttingen
  '3': { lat: 51.541, lon: 9.915 },
  // Bottrop
  '4': { lat: 51.523, lon: 6.925 },
  // Trier
  '5': { lat: 49.749, lon: 6.637 },
  // Recklinghausen
  '4': { lat: 51.614, lon: 7.197 },
  // Reutlingen
  '7': { lat: 48.491, lon: 9.211 },
  // Bremerhaven
  '2': { lat: 53.539, lon: 8.580 },
  // Koblenz
  '5': { lat: 50.356, lon: 7.593 },
  // Bergisch Gladbach
  '5': { lat: 50.988, lon: 7.123 },
  // Jena
  '0': { lat: 50.927, lon: 11.586 },
  // Remscheid
  '4': { lat: 51.179, lon: 7.192 },
  // Erlangen
  '9': { lat: 49.598, lon: 11.004 },
  // Moers
  '4': { lat: 51.452, lon: 6.621 },
  // Siegen
  '5': { lat: 50.875, lon: 8.024 },
  // Hildesheim
  '3': { lat: 52.150, lon: 9.951 },
  // Salzgitter
  '3': { lat: 52.150, lon: 10.339 },
};

/**
 * PLZ-Bereiche zu Koordinaten (erste 3 Ziffern für bessere Genauigkeit)
 */
const PLZ_RANGE_MAPPING = {
  // Münster (481xx - 485xx)
  '481': { lat: 51.962, lon: 7.626 },
  '482': { lat: 51.962, lon: 7.626 },
  '483': { lat: 51.962, lon: 7.626 },
  '484': { lat: 51.962, lon: 7.626 },
  '485': { lat: 51.962, lon: 7.626 },
  // Hamburg (200xx - 227xx)
  '200': { lat: 53.551, lon: 9.993 },
  '201': { lat: 53.551, lon: 9.993 },
  '202': { lat: 53.551, lon: 9.993 },
  '203': { lat: 53.551, lon: 9.993 },
  '204': { lat: 53.551, lon: 9.993 },
  '205': { lat: 53.551, lon: 9.993 },
  '210': { lat: 53.551, lon: 9.993 },
  '220': { lat: 53.551, lon: 9.993 },
  '221': { lat: 53.551, lon: 9.993 },
  '222': { lat: 53.551, lon: 9.993 },
  '223': { lat: 53.551, lon: 9.993 },
  '224': { lat: 53.551, lon: 9.993 },
  '225': { lat: 53.551, lon: 9.993 },
  '226': { lat: 53.551, lon: 9.993 },
  '227': { lat: 53.551, lon: 9.993 },
  // Kiel (241xx - 241xx)
  '241': { lat: 54.323, lon: 10.139 },
  // Lübeck (235xx - 239xx)
  '235': { lat: 53.866, lon: 10.686 },
  '236': { lat: 53.866, lon: 10.686 },
  '237': { lat: 53.866, lon: 10.686 },
  '238': { lat: 53.866, lon: 10.686 },
  '239': { lat: 53.866, lon: 10.686 },
  // Berlin (100xx - 141xx)
  '100': { lat: 52.52, lon: 13.405 },
  '101': { lat: 52.52, lon: 13.405 },
  '102': { lat: 52.52, lon: 13.405 },
  '103': { lat: 52.52, lon: 13.405 },
  '104': { lat: 52.52, lon: 13.405 },
  '105': { lat: 52.52, lon: 13.405 },
  '106': { lat: 52.52, lon: 13.405 },
  '107': { lat: 52.52, lon: 13.405 },
  '108': { lat: 52.52, lon: 13.405 },
  '109': { lat: 52.52, lon: 13.405 },
  '120': { lat: 52.52, lon: 13.405 },
  '121': { lat: 52.52, lon: 13.405 },
  '122': { lat: 52.52, lon: 13.405 },
  '123': { lat: 52.52, lon: 13.405 },
  '124': { lat: 52.52, lon: 13.405 },
  '125': { lat: 52.52, lon: 13.405 },
  '126': { lat: 52.52, lon: 13.405 },
  '130': { lat: 52.52, lon: 13.405 },
  '131': { lat: 52.52, lon: 13.405 },
  '133': { lat: 52.52, lon: 13.405 },
  '134': { lat: 52.52, lon: 13.405 },
  '135': { lat: 52.52, lon: 13.405 },
  '136': { lat: 52.52, lon: 13.405 },
  '140': { lat: 52.52, lon: 13.405 },
  '141': { lat: 52.52, lon: 13.405 },
  // München (800xx - 819xx)
  '800': { lat: 48.135, lon: 11.582 },
  '803': { lat: 48.135, lon: 11.582 },
  '804': { lat: 48.135, lon: 11.582 },
  '805': { lat: 48.135, lon: 11.582 },
  '806': { lat: 48.135, lon: 11.582 },
  '807': { lat: 48.135, lon: 11.582 },
  '808': { lat: 48.135, lon: 11.582 },
  '809': { lat: 48.135, lon: 11.582 },
  '812': { lat: 48.135, lon: 11.582 },
  '813': { lat: 48.135, lon: 11.582 },
  '814': { lat: 48.135, lon: 11.582 },
  '815': { lat: 48.135, lon: 11.582 },
  '816': { lat: 48.135, lon: 11.582 },
  '817': { lat: 48.135, lon: 11.582 },
  '818': { lat: 48.135, lon: 11.582 },
  '819': { lat: 48.135, lon: 11.582 },
  // Köln (500xx - 511xx)
  '500': { lat: 50.937, lon: 6.960 },
  '501': { lat: 50.937, lon: 6.960 },
  '502': { lat: 50.937, lon: 6.960 },
  '503': { lat: 50.937, lon: 6.960 },
  '504': { lat: 50.937, lon: 6.960 },
  '505': { lat: 50.937, lon: 6.960 },
  '506': { lat: 50.937, lon: 6.960 },
  '507': { lat: 50.937, lon: 6.960 },
  '508': { lat: 50.937, lon: 6.960 },
  '509': { lat: 50.937, lon: 6.960 },
  '510': { lat: 50.937, lon: 6.960 },
  '511': { lat: 50.937, lon: 6.960 },
  // Frankfurt (600xx - 605xx)
  '600': { lat: 50.110, lon: 8.682 },
  '603': { lat: 50.110, lon: 8.682 },
  '604': { lat: 50.110, lon: 8.682 },
  '605': { lat: 50.110, lon: 8.682 },
  // Stuttgart (700xx - 706xx)
  '700': { lat: 48.775, lon: 9.183 },
  '701': { lat: 48.775, lon: 9.183 },
  '703': { lat: 48.775, lon: 9.183 },
  '704': { lat: 48.775, lon: 9.183 },
  '705': { lat: 48.775, lon: 9.183 },
  '706': { lat: 48.775, lon: 9.183 },
  // Düsseldorf (400xx - 406xx)
  '400': { lat: 51.227, lon: 6.773 },
  '402': { lat: 51.227, lon: 6.773 },
  '404': { lat: 51.227, lon: 6.773 },
  '405': { lat: 51.227, lon: 6.773 },
  '406': { lat: 51.227, lon: 6.773 },
  // Dortmund (440xx - 443xx)
  '440': { lat: 51.513, lon: 7.465 },
  '441': { lat: 51.513, lon: 7.465 },
  '442': { lat: 51.513, lon: 7.465 },
  '443': { lat: 51.513, lon: 7.465 },
  // Essen (450xx - 453xx)
  '450': { lat: 51.455, lon: 7.011 },
  '451': { lat: 51.455, lon: 7.011 },
  '452': { lat: 51.455, lon: 7.011 },
  '453': { lat: 51.455, lon: 7.011 },
  // Leipzig (4000 - 4357)
  '4000': { lat: 51.339, lon: 12.373 },
  '4001': { lat: 51.339, lon: 12.373 },
  '4100': { lat: 51.339, lon: 12.373 },
  '4101': { lat: 51.339, lon: 12.373 },
  '4200': { lat: 51.339, lon: 12.373 },
  '4201': { lat: 51.339, lon: 12.373 },
  '4300': { lat: 51.339, lon: 12.373 },
  '4301': { lat: 51.339, lon: 12.373 },
  '4310': { lat: 51.339, lon: 12.373 },
  '4311': { lat: 51.339, lon: 12.373 },
  '4320': { lat: 51.339, lon: 12.373 },
  '4321': { lat: 51.339, lon: 12.373 },
  '4330': { lat: 51.339, lon: 12.373 },
  '4331': { lat: 51.339, lon: 12.373 },
  '4340': { lat: 51.339, lon: 12.373 },
  '4341': { lat: 51.339, lon: 12.373 },
  '4350': { lat: 51.339, lon: 12.373 },
  '4351': { lat: 51.339, lon: 12.373 },
  // Dresden (1000 - 1328)
  '1000': { lat: 51.050, lon: 13.737 },
  '1001': { lat: 51.050, lon: 13.737 },
  '1100': { lat: 51.050, lon: 13.737 },
  '1101': { lat: 51.050, lon: 13.737 },
  '1200': { lat: 51.050, lon: 13.737 },
  '1201': { lat: 51.050, lon: 13.737 },
  '1300': { lat: 51.050, lon: 13.737 },
  '1301': { lat: 51.050, lon: 13.737 },
  '1320': { lat: 51.050, lon: 13.737 },
  '1321': { lat: 51.050, lon: 13.737 },
};

/**
 * Holt die Koordinaten für eine PLZ
 * Verwendet die PLZ-Datenbank für präzise Koordinaten
 */
export const getCoordinatesForZipCode = (zipCode) => {
  if (!zipCode) return null;
  
  const zipString = String(zipCode).padStart(5, '0'); // Stelle sicher, dass PLZ 5-stellig ist
  
  // Lade PLZ-Datenbank
  const database = loadPostalCodeDatabase();
  
  if (database) {
    // Neue Struktur: postalCodes (jede PLZ einzeln)
    if (database.postalCodes && database.postalCodes[zipString]) {
      const entry = database.postalCodes[zipString];
      return { lat: entry.lat, lon: entry.lon };
    }
    
    // Alte Struktur: specificPostalCodes (für Kompatibilität)
    if (database.specificPostalCodes && database.specificPostalCodes[zipString]) {
      const entry = database.specificPostalCodes[zipString];
      return { lat: entry.lat, lon: entry.lon };
    }
    
    // Alte Struktur: PLZ-Bereiche (für Kompatibilität)
    if (database.postalCodeRanges) {
      for (const [range, coords] of Object.entries(database.postalCodeRanges)) {
        if (isInRange(zipString, range)) {
          return { lat: coords.lat, lon: coords.lon };
        }
      }
    }
  }
  
  // 3. Fallback: Alte PLZ_RANGE_MAPPING (für Kompatibilität)
  const firstThree = zipString.substring(0, 3);
  if (PLZ_RANGE_MAPPING[firstThree]) {
    return PLZ_RANGE_MAPPING[firstThree];
  }
  
  // 4. Fallback: Näherung basierend auf dem ersten Zeichen
  const firstDigit = zipString[0];
  const regionMapping = {
    '0': { lat: 51.339, lon: 12.373 }, // Ostdeutschland (Leipzig/Dresden)
    '1': { lat: 52.52, lon: 13.405 }, // Berlin/Brandenburg
    '2': { lat: 53.551, lon: 9.993 }, // Hamburg/Schleswig-Holstein
    '3': { lat: 52.375, lon: 9.732 }, // Niedersachsen
    '4': { lat: 51.227, lon: 6.773 }, // Nordrhein-Westfalen (Düsseldorf)
    '5': { lat: 50.937, lon: 6.960 }, // Nordrhein-Westfalen/Rheinland-Pfalz (Köln)
    '6': { lat: 50.110, lon: 8.682 }, // Hessen/Rheinland-Pfalz (Frankfurt)
    '7': { lat: 48.775, lon: 9.183 }, // Baden-Württemberg (Stuttgart)
    '8': { lat: 48.135, lon: 11.582 }, // Bayern (München)
    '9': { lat: 49.452, lon: 11.077 }, // Bayern/Thüringen (Nürnberg)
  };
  
  return regionMapping[firstDigit] || { lat: 51.165, lon: 10.451 }; // Deutschland-Mittelpunkt als Fallback
};

/**
 * Berechnet die Entfernung zwischen zwei Koordinaten in Kilometern
 * Verwendet die Haversine-Formel
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius der Erde in Kilometern
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Berechnet die Entfernung zwischen zwei PLZ in Kilometern
 * @param {string|number} zipCode1 - Erste PLZ
 * @param {string|number} zipCode2 - Zweite PLZ
 * @returns {number|null} - Entfernung in Kilometern oder null wenn eine PLZ fehlt
 */
export const calculateDistanceByZipCode = (zipCode1, zipCode2) => {
  if (!zipCode1 || !zipCode2) {
    return null;
  }
  
  const coords1 = getCoordinatesForZipCode(zipCode1);
  const coords2 = getCoordinatesForZipCode(zipCode2);
  
  if (!coords1 || !coords2) {
    return null;
  }
  
  const distance = calculateDistance(coords1.lat, coords1.lon, coords2.lat, coords2.lon);
  return Math.round(distance * 10) / 10; // Auf eine Dezimalstelle runden
};

/**
 * Formatiert die Entfernung für die Anzeige
 * @param {number} distance - Entfernung in Kilometern
 * @returns {string} - Formatierter Text
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined) {
    return null;
  }
  
  if (distance < 1) {
    return `Circa ${Math.round(distance * 10) / 10} km von dir entfernt.`;
  } else {
    return `Circa ${Math.round(distance)} km von dir entfernt.`;
  }
};

/**
 * Kombinierte Funktion: Berechnet und formatiert die Entfernung
 * @param {string|number} zipCode1 - Erste PLZ
 * @param {string|number} zipCode2 - Zweite PLZ
 * @returns {string|null} - Formatierter Text oder null
 */
export const getDistanceText = (zipCode1, zipCode2) => {
  const distance = calculateDistanceByZipCode(zipCode1, zipCode2);
  if (distance === null) {
    return null;
  }
  return formatDistance(distance);
};

