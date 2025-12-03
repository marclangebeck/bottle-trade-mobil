/**
 * Script zum Importieren einer vollständigen PLZ-Datenbank
 * 
 * Unterstützt folgende Formate:
 * - CSV: PLZ,Latitude,Longitude,City (oder ähnlich)
 * - JSON: Array mit {plz, lat, lon, city} oder {postalCode, latitude, longitude, city}
 * - Excel: Spalten PLZ, Latitude, Longitude, City
 * 
 * Ausführung: node scripts/importCompletePLZDatabase.js <dateipfad>
 */

const fs = require('fs');
const path = require('path');

// Unterstützte Dateiformate
const SUPPORTED_FORMATS = {
  '.csv': 'csv',
  '.json': 'json',
  '.xlsx': 'excel',
  '.xls': 'excel'
};

/**
 * Liest eine tab-separierte Datei (DE.txt Format) ein
 */
function parseTabSeparated(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const entries = {};
  const plzCoords = {}; // Für Aggregation bei mehreren Einträgen pro PLZ
  
  // Format: DE	PLZ	Name	Bundesland	...	Latitude	Longitude	...
  // Spalten: 0=Land, 1=PLZ, 2=Name, 3=Bundesland, ..., 9=Lat, 10=Lon, ...
  
  for (const line of lines) {
    const values = line.split('\t');
    
    if (values.length < 11) continue;
    
    const plz = String(values[1] || '').trim().padStart(5, '0');
    const lat = parseFloat(values[9]);
    const lon = parseFloat(values[10]);
    const name = (values[2] || '').trim();
    const bundesland = (values[3] || '').trim();
    
    if (plz && plz.length === 5 && !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
      // Wenn PLZ bereits existiert, aggregiere Koordinaten (Durchschnitt)
      if (plzCoords[plz]) {
        plzCoords[plz].lats.push(lat);
        plzCoords[plz].lons.push(lon);
        plzCoords[plz].names.push(name);
      } else {
        plzCoords[plz] = {
          lats: [lat],
          lons: [lon],
          names: [name],
          bundesland: bundesland
        };
      }
    }
  }
  
  // Berechne Durchschnittskoordinaten für jede PLZ
  for (const [plz, data] of Object.entries(plzCoords)) {
    const avgLat = data.lats.reduce((a, b) => a + b, 0) / data.lats.length;
    const avgLon = data.lons.reduce((a, b) => a + b, 0) / data.lons.length;
    
    // Verwende den häufigsten Namen oder ersten Namen
    const mostCommonName = data.names[0] || 'Unknown';
    
    entries[plz] = {
      lat: Math.round(avgLat * 10000) / 10000, // Runde auf 4 Dezimalstellen
      lon: Math.round(avgLon * 10000) / 10000,
      city: mostCommonName,
      bundesland: data.bundesland
    };
  }
  
  return entries;
}

/**
 * Liest eine CSV-Datei ein
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Finde Spalten-Indizes
  const plzIndex = headers.findIndex(h => h.includes('plz') || h.includes('postal') || h.includes('zip'));
  const latIndex = headers.findIndex(h => h.includes('lat') || h.includes('latitude'));
  const lonIndex = headers.findIndex(h => h.includes('lon') || h.includes('longitude') || h.includes('lng'));
  const cityIndex = headers.findIndex(h => h.includes('city') || h.includes('stadt') || h.includes('ort'));
  
  if (plzIndex === -1 || latIndex === -1 || lonIndex === -1) {
    throw new Error('CSV muss Spalten für PLZ, Latitude und Longitude enthalten');
  }
  
  const entries = {};
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const plz = String(values[plzIndex]).padStart(5, '0');
    const lat = parseFloat(values[latIndex]);
    const lon = parseFloat(values[lonIndex]);
    const city = cityIndex !== -1 ? values[cityIndex] : '';
    
    if (plz && !isNaN(lat) && !isNaN(lon)) {
      entries[plz] = {
        lat: lat,
        lon: lon,
        city: city || 'Unknown'
      };
    }
  }
  
  return entries;
}

/**
 * Liest eine JSON-Datei ein
 */
function parseJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  const entries = {};
  
  // Array-Format: [{plz, lat, lon, city}, ...]
  if (Array.isArray(data)) {
    for (const item of data) {
      const plz = String(item.plz || item.postalCode || item.zip || item.postcode || '').padStart(5, '0');
      const lat = parseFloat(item.lat || item.latitude || item.lat);
      const lon = parseFloat(item.lon || item.longitude || item.lng || item.lon);
      const city = item.city || item.stadt || item.ort || '';
      
      if (plz && !isNaN(lat) && !isNaN(lon)) {
        entries[plz] = {
          lat: lat,
          lon: lon,
          city: city || 'Unknown'
        };
      }
    }
  }
  // Objekt-Format: {"12345": {lat, lon, city}, ...}
  else if (typeof data === 'object') {
    for (const [plz, coords] of Object.entries(data)) {
      const plzStr = String(plz).padStart(5, '0');
      const lat = parseFloat(coords.lat || coords.latitude);
      const lon = parseFloat(coords.lon || coords.longitude || coords.lng);
      const city = coords.city || coords.stadt || coords.ort || '';
      
      if (plzStr && !isNaN(lat) && !isNaN(lon)) {
        entries[plzStr] = {
          lat: lat,
          lon: lon,
          city: city || 'Unknown'
        };
      }
    }
  }
  
  return entries;
}

/**
 * Hauptfunktion
 */
function importPLZDatabase(inputFilePath) {
  console.log(`🔄 Importiere PLZ-Datenbank aus: ${inputFilePath}`);
  
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`Datei nicht gefunden: ${inputFilePath}`);
  }
  
  const ext = path.extname(inputFilePath).toLowerCase();
  const format = SUPPORTED_FORMATS[ext];
  
  // Prüfe ob es eine tab-separierte Datei ist (DE.txt Format)
  const isTabSeparated = ext === '.txt' || ext === '';
  
  if (!format && !isTabSeparated) {
    throw new Error(`Nicht unterstütztes Dateiformat: ${ext}. Unterstützt: ${Object.keys(SUPPORTED_FORMATS).join(', ')}, .txt (tab-separiert)`);
  }
  
  let entries = {};
  
  try {
    if (isTabSeparated) {
      console.log('📄 Erkenne tab-separiertes Format (DE.txt)...');
      entries = parseTabSeparated(inputFilePath);
    } else if (format === 'csv') {
      entries = parseCSV(inputFilePath);
    } else if (format === 'json') {
      entries = parseJSON(inputFilePath);
    } else if (format === 'excel') {
      // Excel benötigt zusätzliches Package (xlsx)
      console.log('⚠️ Excel-Support benötigt das "xlsx" Package. Installiere es...');
      try {
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(inputFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        for (const row of data) {
          const plz = String(row.PLZ || row.plz || row.postalCode || row.Zip || '').padStart(5, '0');
          const lat = parseFloat(row.Latitude || row.lat || row.latitude);
          const lon = parseFloat(row.Longitude || row.lon || row.longitude || row.lng);
          const city = row.City || row.city || row.stadt || row.ort || '';
          
          if (plz && !isNaN(lat) && !isNaN(lon)) {
            entries[plz] = {
              lat: lat,
              lon: lon,
              city: city || 'Unknown'
            };
          }
        }
      } catch (error) {
        console.error('❌ Excel-Parsing fehlgeschlagen. Installiere "xlsx": npm install xlsx');
        throw error;
      }
    }
    
    console.log(`✅ ${Object.keys(entries).length} PLZ-Einträge importiert`);
    
    // Erstelle die finale Datenbank-Struktur
    const database = {
      metadata: {
        version: "2.0",
        description: "Complete German Postal Code Database with Individual Coordinates",
        totalPostalCodes: Object.keys(entries).length,
        lastUpdated: new Date().toISOString(),
        source: path.basename(inputFilePath),
        note: "Each postal code has individual coordinates for precise geocoding."
      },
      postalCodes: entries
    };
    
    // Speichere die Datenbank
    const outputPath = path.join(__dirname, '../data/germanPostalCodes.json');
    fs.writeFileSync(outputPath, JSON.stringify(database, null, 2), 'utf8');
    
    console.log(`✅ PLZ-Datenbank gespeichert: ${outputPath}`);
    console.log(`📊 ${database.metadata.totalPostalCodes} PLZ mit individuellen Koordinaten`);
    
    // Zeige Beispiel-Einträge
    const samplePLZ = Object.keys(entries).slice(0, 5);
    console.log('\n📋 Beispiel-Einträge:');
    for (const plz of samplePLZ) {
      console.log(`  ${plz}: ${entries[plz].lat}, ${entries[plz].lon} (${entries[plz].city})`);
    }
    
    return database;
  } catch (error) {
    console.error('❌ Fehler beim Import:', error.message);
    throw error;
  }
}

// Führe das Script aus, wenn direkt aufgerufen
if (require.main === module) {
  const inputFile = process.argv[2];
  
  if (!inputFile) {
    console.error('❌ Bitte geben Sie eine Datei an:');
    console.error('   node scripts/importCompletePLZDatabase.js <dateipfad>');
    console.error('\nUnterstützte Formate:');
    console.error('  - CSV: PLZ,Latitude,Longitude,City');
    console.error('  - JSON: Array mit {plz, lat, lon, city}');
    console.error('  - Excel: Spalten PLZ, Latitude, Longitude, City');
    process.exit(1);
  }
  
  try {
    importPLZDatabase(inputFile);
    console.log('\n✅ Import erfolgreich abgeschlossen!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import fehlgeschlagen:', error);
    process.exit(1);
  }
}

module.exports = { importPLZDatabase };

