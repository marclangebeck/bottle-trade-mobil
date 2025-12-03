/**
 * Script zum Generieren einer vollständigen deutschen PLZ-Datenbank
 * Nutzt OpenStreetMap Nominatim API für Geocoding
 * 
 * WICHTIG: Dieses Script sollte nur einmal ausgeführt werden, da es viele API-Calls macht
 * Die generierte JSON-Datei kann dann in der App verwendet werden
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Alle deutschen PLZ-Bereiche (erste 2-3 Ziffern)
const PLZ_RANGES = {
  // Berlin (10xxx - 14xxx)
  '10': { city: 'Berlin', ranges: ['100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '12', '13', '14'] },
  // Hamburg (20xxx - 22xxx)
  '20': { city: 'Hamburg', ranges: ['200', '201', '202', '203', '204', '205', '210', '220', '221', '222', '223', '224', '225', '226', '227'] },
  // Kiel (24xxx)
  '24': { city: 'Kiel', ranges: ['241'] },
  // Lübeck (23xxx)
  '23': { city: 'Lübeck', ranges: ['235', '236', '237', '238', '239'] },
  // Münster (48xxx)
  '48': { city: 'Münster', ranges: ['481', '482', '483', '484', '485'] },
  // München (80xxx - 81xxx)
  '80': { city: 'München', ranges: ['800', '803', '804', '805', '806', '807', '808', '809', '812', '813', '814', '815', '816', '817', '818', '819'] },
  // Köln (50xxx - 51xxx)
  '50': { city: 'Köln', ranges: ['500', '501', '502', '503', '504', '505', '506', '507', '508', '509', '510', '511'] },
  // Frankfurt (60xxx - 60xxx)
  '60': { city: 'Frankfurt', ranges: ['600', '603', '604', '605'] },
  // Stuttgart (70xxx - 70xxx)
  '70': { city: 'Stuttgart', ranges: ['700', '701', '703', '704', '705', '706'] },
  // Düsseldorf (40xxx - 40xxx)
  '40': { city: 'Düsseldorf', ranges: ['400', '402', '404', '405', '406'] },
  // Dortmund (44xxx - 44xxx)
  '44': { city: 'Dortmund', ranges: ['440', '441', '442', '443'] },
  // Essen (45xxx - 45xxx)
  '45': { city: 'Essen', ranges: ['450', '451', '452', '453'] },
  // Leipzig (04xxx - 04xxx)
  '04': { city: 'Leipzig', ranges: ['4000', '4001', '4100', '4101', '4200', '4201', '4300', '4301', '4310', '4311', '4320', '4321', '4330', '4331', '4340', '4341', '4350', '4351'] },
  // Dresden (01xxx - 01xxx)
  '01': { city: 'Dresden', ranges: ['1000', '1001', '1100', '1101', '1200', '1201', '1300', '1301', '1320', '1321'] },
};

// Rate-Limiting: Max 1 Request pro Sekunde
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Geocode eine PLZ über OpenStreetMap Nominatim
 */
async function geocodePostalCode(postalCode) {
  try {
    await delay(1000); // Rate-Limiting: 1 Request pro Sekunde
    
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&countrycodes=de&format=json&limit=1`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Bottle-Trade-App/1.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        city: result.address?.city || result.address?.town || result.address?.village || 'Unknown'
      };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Fehler beim Geocoding von PLZ ${postalCode}:`, error.message);
    return null;
  }
}

/**
 * Generiert alle PLZ in einem Bereich
 */
function generatePostalCodesInRange(range) {
  const codes = [];
  
  if (range.length === 3) {
    // 3-stelliger Bereich (z.B. "481")
    for (let i = 0; i <= 99; i++) {
      const code = `${range}${String(i).padStart(2, '0')}`;
      codes.push(code);
    }
  } else if (range.length === 4) {
    // 4-stelliger Bereich (z.B. "4000")
    for (let i = 0; i <= 99; i++) {
      const code = `${range}${String(i).padStart(2, '0')}`;
      codes.push(code);
    }
  } else if (range.length === 2) {
    // 2-stelliger Bereich (z.B. "12")
    for (let i = 0; i <= 999; i++) {
      const code = `${range}${String(i).padStart(3, '0')}`;
      codes.push(code);
    }
  }
  
  return codes;
}

/**
 * Hauptfunktion zum Generieren der PLZ-Datenbank
 */
async function generatePostalCodeDatabase() {
  console.log('🔄 Starte Generierung der PLZ-Datenbank...');
  
  const database = {
    metadata: {
      version: "1.0",
      description: "German Postal Code Database with Coordinates",
      totalEntries: 0,
      lastUpdated: new Date().toISOString(),
      source: "OpenStreetMap Nominatim"
    },
    postalCodes: {}
  };
  
  // Für jede PLZ-Range
  for (const [prefix, data] of Object.entries(PLZ_RANGES)) {
    console.log(`\n📍 Verarbeite ${data.city} (${prefix}xxx)...`);
    
    for (const range of data.ranges) {
      const postalCodes = generatePostalCodesInRange(range);
      console.log(`  📦 Generiere ${postalCodes.length} PLZ für Bereich ${range}...`);
      
      // Geocode die erste PLZ im Bereich als Referenz
      const sampleCode = postalCodes[0];
      const coords = await geocodePostalCode(sampleCode);
      
      if (coords) {
        // Verwende die gleichen Koordinaten für alle PLZ in diesem Bereich
        // (Für genauere Koordinaten müsste jede PLZ einzeln geocoded werden)
        for (const code of postalCodes) {
          database.postalCodes[code] = {
            lat: coords.lat,
            lon: coords.lon,
            city: coords.city
          };
        }
        console.log(`  ✅ ${postalCodes.length} PLZ hinzugefügt (${coords.city}: ${coords.lat}, ${coords.lon})`);
      } else {
        console.log(`  ⚠️ Keine Koordinaten für Bereich ${range} gefunden`);
      }
    }
  }
  
  database.metadata.totalEntries = Object.keys(database.postalCodes).length;
  
  // Speichere die Datenbank
  const outputPath = path.join(__dirname, '../data/germanPostalCodes.json');
  fs.writeFileSync(outputPath, JSON.stringify(database, null, 2), 'utf8');
  
  console.log(`\n✅ PLZ-Datenbank generiert: ${database.metadata.totalEntries} Einträge`);
  console.log(`📁 Gespeichert in: ${outputPath}`);
  
  return database;
}

// Führe das Script aus, wenn direkt aufgerufen
if (require.main === module) {
  generatePostalCodeDatabase()
    .then(() => {
      console.log('\n✅ Fertig!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fehler:', error);
      process.exit(1);
    });
}

module.exports = { generatePostalCodeDatabase };














