#!/usr/bin/env node

/**
 * Phase 2 Test-Script
 * Prüft ob alle Code-Bereinigungen korrekt durchgeführt wurden
 */

const fs = require('fs');
const path = require('path');

const APP_JS = path.join(__dirname, '../App.js');
const COMPONENTS_DIR = path.join(__dirname, '../components');
const SCREENS_DIR = path.join(__dirname, '../screens');

// Farben für Terminal-Output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ Datei nicht gefunden: ${filePath}`, 'red');
    return { exists: false, content: null };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  return { exists: true, content };
}

function checkPattern(content, pattern, description, shouldExist = false) {
  const regex = new RegExp(pattern, 'g');
  const matches = content.match(regex) || [];
  
  if (shouldExist) {
    if (matches.length > 0) {
      log(`✅ ${description}: ${matches.length} Treffer gefunden`, 'green');
      return { passed: true, count: matches.length };
    } else {
      log(`❌ ${description}: Keine Treffer gefunden (erwartet)`, 'red');
      return { passed: false, count: 0 };
    }
  } else {
    // Filtere Kommentare und Logs heraus
    const filteredMatches = matches.filter((match, index) => {
      const matchIndex = content.indexOf(match, index > 0 ? content.indexOf(matches[index - 1]) + matches[index - 1].length : 0);
      const beforeMatch = content.substring(Math.max(0, matchIndex - 50), matchIndex);
      const afterMatch = content.substring(matchIndex, matchIndex + match.length + 50);
      
      // Ignoriere wenn in Kommentar oder Log-Statement
      if (beforeMatch.includes('//') || beforeMatch.includes('logNotificationEvent') || beforeMatch.includes('console.log')) {
        return false;
      }
      return true;
    });
    
    if (filteredMatches.length === 0) {
      log(`✅ ${description}: Keine Treffer (OK)`, 'green');
      return { passed: true, count: 0 };
    } else {
      log(`❌ ${description}: ${filteredMatches.length} Treffer gefunden (sollten nicht vorhanden sein)`, 'red');
      return { passed: false, count: filteredMatches.length };
    }
  }
}

function main() {
  log('\n=== Phase 2: Code-Bereinigung - Automatische Verifikation ===\n', 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };
  
  // Prüfung 1: App.js existiert
  log('📄 Prüfung 1: App.js Datei', 'yellow');
  const appJs = checkFile(APP_JS, 'App.js');
  if (!appJs.exists) {
    log('❌ App.js nicht gefunden!', 'red');
    process.exit(1);
  }
  log('✅ App.js gefunden\n', 'green');
  
  // Prüfung 2: Alte Notification-Typen
  log('🔍 Prüfung 2: Alte Notification-Typen (sollten NICHT vorhanden sein)', 'yellow');
  results.total += 3;
  
  const tradeType = checkPattern(appJs.content, /type\s*[:=]\s*['"]trade['"]/, "type: 'trade' (außer in Logs)", false);
  if (tradeType.passed) results.passed++; else results.failed++;
  
  const tradeInfoType = checkPattern(appJs.content, /type\s*[:=]\s*['"]trade-info['"]/, "type: 'trade-info' (außer in Logs)", false);
  if (tradeInfoType.passed) results.passed++; else results.failed++;
  
  const messageType = checkPattern(appJs.content, /type\s*[:=]\s*['"]message['"]/, "type: 'message' (außer in Logs)", false);
  if (messageType.passed) results.passed++; else results.failed++;
  
  log('');
  
  // Prüfung 3: Alte State-Variablen
  log('🔍 Prüfung 3: Alte State-Variablen (sollten NICHT vorhanden sein)', 'yellow');
  results.total += 2;
  
  const unreadNotifications = checkPattern(appJs.content, /\bunreadNotifications\b/, 'unreadNotifications (außer lokale Variablen/Kommentare)', false);
  if (unreadNotifications.passed) results.passed++; else results.failed++;
  
  const setUnreadNotifications = checkPattern(appJs.content, /\bsetUnreadNotifications\b/, 'setUnreadNotifications', false);
  if (setUnreadNotifications.passed) results.passed++; else results.failed++;
  
  log('');
  
  // Prüfung 4: Neue Typen vorhanden
  log('🔍 Prüfung 4: Neue Notification-Typen (sollten vorhanden sein)', 'yellow');
  results.total += 3;
  
  const hintDecision = checkPattern(appJs.content, /type\s*[:=]\s*['"]hint-decision['"]/, "type: 'hint-decision'", true);
  if (hintDecision.passed) results.passed++; else results.failed++;
  
  const hintSmall = checkPattern(appJs.content, /type\s*[:=]\s*['"]hint-small['"]/, "type: 'hint-small'", true);
  if (hintSmall.passed) results.passed++; else results.failed++;
  
  const chatType = checkPattern(appJs.content, /type\s*[:=]\s*['"]chat['"]/, "type: 'chat'", true);
  if (chatType.passed) results.passed++; else results.failed++;
  
  log('');
  
  // Prüfung 5: Neuer State vorhanden
  log('🔍 Prüfung 5: Neuer State (sollte vorhanden sein)', 'yellow');
  results.total += 2;
  
  const unreadCount = checkPattern(appJs.content, /\bunreadCount\b/, 'unreadCount', true);
  if (unreadCount.passed) results.passed++; else results.failed++;
  
  const setUnreadCount = checkPattern(appJs.content, /\bsetUnreadCount\b/, 'setUnreadCount', true);
  if (setUnreadCount.passed) results.passed++; else results.failed++;
  
  log('');
  
  // Prüfung 6: Komponenten
  log('🔍 Prüfung 6: Komponenten (sollten keine alten Props haben)', 'yellow');
  results.total += 3;
  
  const bottomNav = checkFile(path.join(COMPONENTS_DIR, 'BottomNavigation.js'), 'BottomNavigation.js');
  if (bottomNav.exists) {
    const bottomNavCheck = checkPattern(bottomNav.content, /\bunreadNotifications\b|\bunreadHints\b/, 'BottomNavigation: unreadNotifications/unreadHints', false);
    if (bottomNavCheck.passed) results.passed++; else results.failed++;
  } else {
    log('⚠️ BottomNavigation.js nicht gefunden', 'yellow');
    results.total--;
  }
  
  const newsPopup = checkFile(path.join(COMPONENTS_DIR, 'NewsPopup.js'), 'NewsPopup.js');
  if (newsPopup.exists) {
    const newsPopupCheck = checkPattern(newsPopup.content, /\bunreadNotifications\b|\bunreadHints\b/, 'NewsPopup: unreadNotifications/unreadHints', false);
    if (newsPopupCheck.passed) results.passed++; else results.failed++;
  } else {
    log('⚠️ NewsPopup.js nicht gefunden', 'yellow');
    results.total--;
  }
  
  const dynamicMenu = checkFile(path.join(__dirname, '../DynamicHamburgerMenu.js'), 'DynamicHamburgerMenu.js');
  if (dynamicMenu.exists) {
    const dynamicMenuCheck = checkPattern(dynamicMenu.content, /\bunreadNotifications\b|\bunreadHints\b/, 'DynamicHamburgerMenu: unreadNotifications/unreadHints', false);
    if (dynamicMenuCheck.passed) results.passed++; else results.failed++;
  } else {
    log('⚠️ DynamicHamburgerMenu.js nicht gefunden', 'yellow');
    results.total--;
  }
  
  log('');
  
  // Zusammenfassung
  log('\n=== Zusammenfassung ===', 'blue');
  log(`✅ Bestanden: ${results.passed}/${results.total}`, results.passed === results.total ? 'green' : 'yellow');
  log(`❌ Fehlgeschlagen: ${results.failed}/${results.total}`, results.failed > 0 ? 'red' : 'green');
  
  const percentage = Math.round((results.passed / results.total) * 100);
  log(`📊 Erfolgsquote: ${percentage}%\n`, percentage === 100 ? 'green' : 'yellow');
  
  if (results.failed === 0) {
    log('🎉 Alle Tests bestanden! Phase 2 Code-Bereinigung erfolgreich.', 'green');
    process.exit(0);
  } else {
    log('⚠️ Einige Tests fehlgeschlagen. Bitte überprüfe die oben genannten Probleme.', 'yellow');
    process.exit(1);
  }
}

main();

