# Phase 2: Testplan - Code-Bereinigung

**Datum:** 12. November 2025  
**Status:** Bereit für Tests

---

## 🎯 Testziele

1. ✅ App startet ohne Fehler
2. ✅ Badge wird korrekt angezeigt (unreadCount)
3. ✅ Notification-Typen funktionieren (hint-decision, hint-small, chat)
4. ✅ Filter funktionieren korrekt
5. ✅ Keine alten Codezeilen greifen mehr

---

## 📋 Test-Szenarien

### Test 1: App-Start
**Ziel:** Prüfen ob App ohne Fehler startet

**Schritte:**
1. App starten: `npm start` oder `expo start`
2. Prüfen ob Console-Fehler vorhanden sind
3. Prüfen ob App normal lädt

**Erwartetes Ergebnis:**
- ✅ Keine Linter-Fehler
- ✅ Keine Runtime-Fehler
- ✅ App lädt normal

---

### Test 2: Badge-Anzeige (unreadCount)
**Ziel:** Prüfen ob Badge korrekt angezeigt wird

**Schritte:**
1. Als User A einloggen
2. BottomNavigation prüfen - Badge sollte 0 sein
3. Trade-Request von User B an User A erstellen
4. Badge sollte > 0 sein (hint-decision Notification)
5. Notification öffnen und lesen
6. Badge sollte wieder 0 sein

**Erwartetes Ergebnis:**
- ✅ Badge zeigt `unreadCount` (nicht mehr `unreadNotifications + unreadHints`)
- ✅ Badge aktualisiert sich korrekt
- ✅ Badge wird auf 0 gesetzt wenn alle Notifications gelesen sind

---

### Test 3: Trade-Request → Notification-Typen
**Ziel:** Prüfen ob neue Notification-Typen funktionieren

**Schritte:**
1. User A erstellt Trade-Request an User B
2. Prüfen Firestore: Notification für B sollte `type: 'hint-decision'` haben
3. Prüfen Firestore: Notification für A sollte `type: 'hint-small'` haben
4. User B akzeptiert Trade-Request
5. Prüfen Firestore: Notifications sollten `type: 'hint-small'` haben

**Erwartetes Ergebnis:**
- ✅ Keine `type: 'trade'` oder `type: 'trade-info'` mehr
- ✅ Nur noch `type: 'hint-decision'` und `type: 'hint-small'`
- ✅ Badge zählt diese korrekt

---

### Test 4: Chat-Message → Notification-Typ
**Ziel:** Prüfen ob Chat-Notifications den neuen Typ verwenden

**Schritte:**
1. User A und User B haben einen Chat (nach Trade-Akzeptierung)
2. User A sendet Message an User B
3. Prüfen Firestore: Notification für B sollte `type: 'chat'` haben
4. Prüfen: Keine `type: 'message'` mehr

**Erwartetes Ergebnis:**
- ✅ Keine `type: 'message'` mehr
- ✅ Nur noch `type: 'chat'`
- ✅ Badge zählt diese korrekt

---

### Test 5: Badge-Berechnung (vereinfacht)
**Ziel:** Prüfen ob Badge-Berechnung korrekt funktioniert

**Schritte:**
1. Als User A einloggen
2. Erstelle verschiedene Notifications:
   - Trade-Request (hint-decision)
   - Trade-Info (hint-small)
   - Chat-Message (chat)
3. Prüfen Badge: Sollte Summe aller ungelesenen Notifications sein
4. Öffne eine Notification
5. Prüfen Badge: Sollte um 1 reduziert sein

**Erwartetes Ergebnis:**
- ✅ Badge zeigt korrekte Summe
- ✅ Badge aktualisiert sich sofort
- ✅ Keine doppelten Zählungen

---

### Test 6: Filter-Funktionalität
**Ziel:** Prüfen ob Filter korrekt funktionieren

**Schritte:**
1. Erstelle Notifications mit verschiedenen Typen
2. Prüfen ob nur unterstützte Typen gezählt werden:
   - `hint-decision` ✅
   - `hint-small` ✅
   - `chat` ✅
   - `system` ✅ (falls vorhanden)
3. Prüfen ob alte Typen NICHT gezählt werden:
   - `trade` ❌
   - `trade-info` ❌
   - `message` ❌

**Erwartetes Ergebnis:**
- ✅ Nur neue Typen werden gezählt
- ✅ Alte Typen werden ignoriert

---

### Test 7: Komponenten-Props
**Ziel:** Prüfen ob alle Komponenten korrekte Props erhalten

**Schritte:**
1. App starten
2. Durch verschiedene Screens navigieren:
   - StartScreen
   - ProfilScreen
   - WeineScreen
   - BtpScreen
   - DashboardScreen
3. Prüfen Console: Keine Props-Warnungen

**Erwartetes Ergebnis:**
- ✅ Keine Props-Warnungen
- ✅ Alle Komponenten erhalten `unreadCount`
- ✅ Keine `unreadNotifications` oder `unreadHints` mehr

---

## 🔍 Verifikation: Alte Codezeilen

### Prüfung 1: Notification-Typen
```bash
# Sollte KEINE Treffer mehr geben (außer in Dokumentation)
grep -r "type.*'trade'" mobile-app/App.js
grep -r "type.*'trade-info'" mobile-app/App.js
grep -r "type.*'message'" mobile-app/App.js
```

### Prüfung 2: State-Variablen
```bash
# Sollte KEINE Treffer mehr geben (außer lokale Variablen/Kommentare)
grep -r "unreadNotifications\|unreadHints" mobile-app/App.js
grep -r "setUnreadNotifications\|setUnreadHints" mobile-app/App.js
```

### Prüfung 3: Komponenten-Props
```bash
# Sollte KEINE Treffer mehr geben
grep -r "unreadNotifications\|unreadHints" mobile-app/components/
grep -r "unreadNotifications\|unreadHints" mobile-app/screens/StartScreen.js
grep -r "unreadNotifications\|unreadHints" mobile-app/screens/ProfilScreen.js
```

---

## 📊 Test-Ergebnisse

**Status:** ⏳ Noch nicht getestet

### Test 1: App-Start
- [ ] ✅ App startet ohne Fehler
- [ ] ✅ Keine Console-Fehler
- [ ] ✅ App lädt normal

### Test 2: Badge-Anzeige
- [ ] ✅ Badge zeigt unreadCount
- [ ] ✅ Badge aktualisiert sich korrekt
- [ ] ✅ Badge wird auf 0 gesetzt

### Test 3: Trade-Request → Notification-Typen
- [ ] ✅ hint-decision für B
- [ ] ✅ hint-small für A
- [ ] ✅ Keine alten Typen mehr

### Test 4: Chat-Message → Notification-Typ
- [ ] ✅ type: 'chat' verwendet
- [ ] ✅ Keine type: 'message' mehr

### Test 5: Badge-Berechnung
- [ ] ✅ Korrekte Summe
- [ ] ✅ Sofortige Aktualisierung
- [ ] ✅ Keine doppelten Zählungen

### Test 6: Filter-Funktionalität
- [ ] ✅ Nur neue Typen gezählt
- [ ] ✅ Alte Typen ignoriert

### Test 7: Komponenten-Props
- [ ] ✅ Keine Props-Warnungen
- [ ] ✅ Alle Komponenten erhalten unreadCount

---

## 🚀 Nächste Schritte nach Tests

**Wenn alle Tests erfolgreich:**
- ✅ Phase 2 abgeschlossen
- ✅ Weiter mit Phase 3 (Neue Datenstruktur) oder Phase 4 (Core-Services)

**Wenn Tests fehlschlagen:**
- 🔧 Fehler analysieren
- 🔧 Fixes implementieren
- 🔧 Tests wiederholen

---

## 💡 Test-Hinweise

1. **Console-Logs prüfen:**
   - `refreshNotificationBadges` Logs prüfen
   - `badge-refresh/done` Events prüfen
   - `badge-update` Events prüfen

2. **Firestore prüfen:**
   - Notification-Dokumente in Firestore prüfen
   - `type`-Feld prüfen
   - `isRead`-Feld prüfen

3. **UI prüfen:**
   - Badge in BottomNavigation prüfen
   - Badge in DynamicHamburgerMenu prüfen
   - Keine visuellen Fehler

---

**Status:** ⏳ Bereit für Tests

