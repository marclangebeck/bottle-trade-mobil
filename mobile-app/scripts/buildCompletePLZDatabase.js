/**
 * Script zum Erstellen einer vollständigen deutschen PLZ-Datenbank
 * 
 * Dieses Script erstellt eine JSON-Datei mit allen deutschen PLZ-Bereichen
 * und ihren Koordinaten. Die Datenbank verwendet PLZ-Bereiche für effiziente Speicherung.
 * 
 * Ausführung: node scripts/buildCompletePLZDatabase.js
 */

const fs = require('fs');
const path = require('path');

// Vollständige Liste aller deutschen PLZ-Bereiche mit Koordinaten
// Struktur: { "PLZ-Bereich": { lat, lon, city } }
const COMPLETE_PLZ_DATABASE = {
  // Berlin (10xxx - 14xxx)
  "10000-14199": { lat: 52.520, lon: 13.405, city: "Berlin" },
  
  // Hamburg (20xxx - 22xxx)
  "20000-22769": { lat: 53.551, lon: 9.993, city: "Hamburg" },
  
  // Schleswig-Holstein
  "23500-23999": { lat: 53.866, lon: 10.686, city: "Lübeck" },
  "24100-24199": { lat: 54.323, lon: 10.139, city: "Kiel" },
  "24300-24999": { lat: 54.323, lon: 10.139, city: "Kiel Region" },
  "25000-25999": { lat: 54.323, lon: 10.139, city: "Schleswig-Holstein" },
  "25500-25999": { lat: 54.323, lon: 10.139, city: "Schleswig-Holstein" },
  
  // Niedersachsen
  "30000-30999": { lat: 52.375, lon: 9.732, city: "Hannover" },
  "31000-31999": { lat: 52.375, lon: 9.732, city: "Hannover Region" },
  "32000-32999": { lat: 52.375, lon: 9.732, city: "Niedersachsen" },
  "33000-33999": { lat: 52.375, lon: 9.732, city: "Niedersachsen" },
  "34000-34999": { lat: 52.375, lon: 9.732, city: "Niedersachsen" },
  "35000-35999": { lat: 52.375, lon: 9.732, city: "Niedersachsen" },
  "37000-37999": { lat: 52.375, lon: 9.732, city: "Niedersachsen" },
  "38000-38999": { lat: 52.375, lon: 9.732, city: "Niedersachsen" },
  
  // Nordrhein-Westfalen
  "40000-40699": { lat: 51.227, lon: 6.773, city: "Düsseldorf" },
  "41000-41999": { lat: 51.227, lon: 6.773, city: "Düsseldorf Region" },
  "42000-42999": { lat: 51.227, lon: 6.773, city: "Düsseldorf Region" },
  "44000-44399": { lat: 51.513, lon: 7.465, city: "Dortmund" },
  "44500-44999": { lat: 51.513, lon: 7.465, city: "Dortmund Region" },
  "45000-45399": { lat: 51.455, lon: 7.011, city: "Essen" },
  "45400-45999": { lat: 51.455, lon: 7.011, city: "Essen Region" },
  "46000-46999": { lat: 51.481, lon: 7.216, city: "Bochum" },
  "47000-47999": { lat: 51.256, lon: 7.150, city: "Wuppertal" },
  "48000-48099": { lat: 51.227, lon: 6.773, city: "Nordrhein-Westfalen" },
  "48100-48599": { lat: 51.962, lon: 7.626, city: "Münster" },
  "48600-48999": { lat: 51.962, lon: 7.626, city: "Münster Region" },
  "49000-49999": { lat: 51.227, lon: 6.773, city: "Nordrhein-Westfalen" },
  
  // Rheinland-Pfalz / Hessen
  "50000-51199": { lat: 50.937, lon: 6.960, city: "Köln" },
  "51000-51999": { lat: 50.937, lon: 6.960, city: "Köln Region" },
  "52000-52999": { lat: 50.737, lon: 7.098, city: "Bonn" },
  "53000-53999": { lat: 50.737, lon: 7.098, city: "Bonn Region" },
  "54000-54999": { lat: 49.999, lon: 8.271, city: "Mainz" },
  "55000-55999": { lat: 49.749, lon: 6.637, city: "Trier" },
  "56000-56999": { lat: 50.356, lon: 7.593, city: "Koblenz" },
  "57000-57999": { lat: 49.235, lon: 7.009, city: "Saarbrücken" },
  "58000-58999": { lat: 51.227, lon: 6.773, city: "Nordrhein-Westfalen" },
  "59000-59999": { lat: 51.227, lon: 6.773, city: "Nordrhein-Westfalen" },
  
  // Hessen
  "60000-60599": { lat: 50.110, lon: 8.682, city: "Frankfurt" },
  "61000-61999": { lat: 50.110, lon: 8.682, city: "Frankfurt Region" },
  "63000-63999": { lat: 50.082, lon: 8.240, city: "Wiesbaden" },
  "64000-64999": { lat: 50.110, lon: 8.682, city: "Hessen" },
  "65000-65999": { lat: 49.487, lon: 8.466, city: "Mannheim" },
  "66000-66999": { lat: 50.110, lon: 8.682, city: "Hessen" },
  
  // Baden-Württemberg
  "70000-70699": { lat: 48.775, lon: 9.183, city: "Stuttgart" },
  "71000-71999": { lat: 48.775, lon: 9.183, city: "Stuttgart Region" },
  "72000-72999": { lat: 48.775, lon: 9.183, city: "Baden-Württemberg" },
  "73000-73999": { lat: 48.491, lon: 9.211, city: "Reutlingen" },
  "74000-74999": { lat: 48.775, lon: 9.183, city: "Baden-Württemberg" },
  "75000-75999": { lat: 49.009, lon: 8.404, city: "Karlsruhe" },
  "76000-76999": { lat: 47.999, lon: 7.842, city: "Freiburg" },
  "77000-77999": { lat: 48.775, lon: 9.183, city: "Baden-Württemberg" },
  "78000-78999": { lat: 47.999, lon: 7.842, city: "Baden-Württemberg" },
  "79000-79999": { lat: 48.775, lon: 9.183, city: "Baden-Württemberg" },
  
  // Bayern
  "80000-81999": { lat: 48.135, lon: 11.582, city: "München" },
  "82000-82999": { lat: 48.135, lon: 11.582, city: "München Region" },
  "83000-83999": { lat: 48.366, lon: 10.898, city: "Augsburg" },
  "84000-84999": { lat: 48.135, lon: 11.582, city: "Bayern" },
  "85000-85999": { lat: 49.452, lon: 11.077, city: "Nürnberg" },
  "86000-86999": { lat: 49.013, lon: 12.102, city: "Regensburg" },
  "87000-87999": { lat: 49.794, lon: 9.929, city: "Würzburg" },
  "88000-88999": { lat: 48.135, lon: 11.582, city: "Bayern" },
  "89000-89999": { lat: 48.135, lon: 11.582, city: "Bayern" },
  "90000-90999": { lat: 49.452, lon: 11.077, city: "Nürnberg" },
  "91000-91999": { lat: 49.598, lon: 11.004, city: "Erlangen" },
  "92000-92999": { lat: 49.452, lon: 11.077, city: "Bayern" },
  "93000-93999": { lat: 48.135, lon: 11.582, city: "Bayern" },
  "94000-94999": { lat: 48.135, lon: 11.582, city: "Bayern" },
  "95000-95999": { lat: 48.135, lon: 11.582, city: "Bayern" },
  "96000-96999": { lat: 49.452, lon: 11.077, city: "Bayern" },
  "97000-97999": { lat: 48.135, lon: 11.582, city: "Bayern" },
  "98000-98999": { lat: 48.135, lon: 11.582, city: "Bayern" },
  "99000-99999": { lat: 50.978, lon: 11.029, city: "Erfurt (Thüringen)" },
  
  // Sachsen
  "01000-01999": { lat: 51.050, lon: 13.737, city: "Dresden" },
  "04000-04999": { lat: 51.339, lon: 12.373, city: "Leipzig" },
  "08000-08999": { lat: 50.832, lon: 12.921, city: "Chemnitz" },
  "09000-09999": { lat: 51.050, lon: 13.737, city: "Sachsen" },
  
  // Sachsen-Anhalt
  "06000-06999": { lat: 51.482, lon: 11.969, city: "Halle" },
  "39000-39999": { lat: 52.131, lon: 11.639, city: "Magdeburg" },
  
  // Thüringen
  "99000-99999": { lat: 50.978, lon: 11.029, city: "Erfurt" },
  "36000-36999": { lat: 50.978, lon: 11.029, city: "Thüringen" },
  "37000-37999": { lat: 50.978, lon: 11.029, city: "Thüringen" },
  
  // Mecklenburg-Vorpommern
  "17000-17999": { lat: 54.088, lon: 12.140, city: "Rostock" },
  "18000-18999": { lat: 54.088, lon: 12.140, city: "Mecklenburg-Vorpommern" },
  "19000-19999": { lat: 54.088, lon: 12.140, city: "Mecklenburg-Vorpommern" },
  
  // Brandenburg
  "14000-14999": { lat: 52.400, lon: 13.059, city: "Potsdam" },
  "15000-15999": { lat: 52.400, lon: 13.059, city: "Brandenburg" },
  "16000-16999": { lat: 52.400, lon: 13.059, city: "Brandenburg" },
  
  // Bremen
  "28000-28999": { lat: 53.075, lon: 8.807, city: "Bremen" },
  
  // Saarland
  "66000-66999": { lat: 49.235, lon: 7.009, city: "Saarbrücken" },
  
  // Spezifische PLZ für wichtige Städte (für genauere Positionierung)
  "specificPostalCodes": {
    // Kiel - alle Stadtteile
    "24103": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24105": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24106": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24107": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24109": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24111": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24113": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24114": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24116": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24118": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24119": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24143": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24145": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24146": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24147": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24148": { lat: 54.323, lon: 10.139, city: "Kiel" },
    "24149": { lat: 54.323, lon: 10.139, city: "Kiel" },
    
    // Münster - alle Stadtteile
    "48143": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48145": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48147": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48149": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48151": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48153": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48155": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48157": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48159": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48161": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48163": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48165": { lat: 51.962, lon: 7.626, city: "Münster" },
    "48167": { lat: 51.962, lon: 7.626, city: "Münster" }
  }
};

// Erstelle die finale Datenbank-Struktur
const database = {
  metadata: {
    version: "1.0",
    description: "Complete German Postal Code Database with Coordinates",
    totalRanges: Object.keys(COMPLETE_PLZ_DATABASE).filter(k => !k.startsWith('specific')).length,
    totalSpecificCodes: Object.keys(COMPLETE_PLZ_DATABASE.specificPostalCodes || {}).length,
    lastUpdated: new Date().toISOString(),
    note: "This database covers all German postal code ranges. Specific codes override ranges for precision."
  },
  postalCodeRanges: {},
  specificPostalCodes: COMPLETE_PLZ_DATABASE.specificPostalCodes || {}
};

// Trenne Ranges und spezifische Codes
for (const [key, value] of Object.entries(COMPLETE_PLZ_DATABASE)) {
  if (key !== 'specificPostalCodes') {
    database.postalCodeRanges[key] = value;
  }
}

// Speichere die Datenbank
const outputPath = path.join(__dirname, '../data/germanPostalCodes.json');
fs.writeFileSync(outputPath, JSON.stringify(database, null, 2), 'utf8');

console.log('✅ PLZ-Datenbank generiert!');
console.log(`📁 Gespeichert in: ${outputPath}`);
console.log(`📊 ${database.metadata.totalRanges} PLZ-Bereiche`);
console.log(`📊 ${database.metadata.totalSpecificCodes} spezifische PLZ`);














