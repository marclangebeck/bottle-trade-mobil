#!/usr/bin/env node

/**
 * Skript zum Ersetzen der Farbe #DAA520 durch #a9c7cd in allen Dateien
 * 
 * Verwendung:
 * node scripts/replaceColor.js
 */

const fs = require('fs');
const path = require('path');

const OLD_COLOR = '#DAA520';
const NEW_COLOR = '#a9c7cd';
const MOBILE_APP_DIR = path.join(__dirname, '..');

// Dateien, die übersprungen werden sollen
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'android',
  'ios',
  '.expo',
  'dist',
  'build',
  'archive',
];

// Dateierweiterungen, die verarbeitet werden sollen
const INCLUDE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

let filesChanged = [];
let totalReplacements = 0;

/**
 * Prüft, ob eine Datei übersprungen werden soll
 */
function shouldExclude(filePath) {
  const relativePath = path.relative(MOBILE_APP_DIR, filePath);
  return EXCLUDE_PATTERNS.some(pattern => relativePath.includes(pattern));
}

/**
 * Prüft, ob eine Datei verarbeitet werden soll
 */
function shouldInclude(filePath) {
  const ext = path.extname(filePath);
  return INCLUDE_EXTENSIONS.includes(ext);
}

/**
 * Rekursiv alle Dateien durchsuchen
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldExclude(filePath)) {
        findFiles(filePath, fileList);
      }
    } else if (stat.isFile()) {
      if (shouldInclude(filePath) && !shouldExclude(filePath)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Ersetzt die Farbe in einer Datei
 */
function replaceColorInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Zähle Vorkommen
    const matches = content.match(new RegExp(OLD_COLOR.replace('#', '\\#'), 'g'));
    const count = matches ? matches.length : 0;

    if (count > 0) {
      // Ersetze alle Vorkommen
      const newContent = content.replace(
        new RegExp(OLD_COLOR.replace('#', '\\#'), 'g'),
        NEW_COLOR
      );

      // Schreibe die Datei zurück
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      filesChanged.push({
        path: path.relative(MOBILE_APP_DIR, filePath),
        count: count
      });
      
      totalReplacements += count;
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Fehler beim Verarbeiten von ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Hauptfunktion
 */
function main() {
  console.log('🎨 Farbe ersetzen: #a9c7cd → #a9c7cd\n');
  console.log('📁 Durchsuche Dateien...\n');

  const files = findFiles(MOBILE_APP_DIR);
  console.log(`📄 ${files.length} Dateien gefunden\n`);

  console.log('🔄 Ersetze Farben...\n');

  files.forEach(file => {
    if (replaceColorInFile(file)) {
      const relativePath = path.relative(MOBILE_APP_DIR, file);
      const fileInfo = filesChanged[filesChanged.length - 1];
      console.log(`  ✓ ${relativePath} (${fileInfo.count} Ersetzung${fileInfo.count !== 1 ? 'en' : ''})`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Fertig!`);
  console.log(`📊 ${filesChanged.length} Dateien geändert`);
  console.log(`🔄 ${totalReplacements} Ersetzungen insgesamt`);
  console.log('='.repeat(60));

  if (filesChanged.length > 0) {
    console.log('\n📝 Geänderte Dateien:');
    filesChanged.forEach(file => {
      console.log(`   - ${file.path} (${file.count}x)`);
    });
  }
}

// Skript ausführen
main();

