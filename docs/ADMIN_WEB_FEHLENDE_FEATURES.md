# Admin-Web: Fehlende Features - Implementierungsübersicht

**Stand:** 08. Dezember 2025  
**Ziel:** Vollständige Feature-Parität zwischen Admin-Web und Admin-App

---

## ✅ Bereits implementiert (MVP)

1. **Login-System** (`/login`)
   - Test-Auth-System (wie in der App)
   - Session-Management (sessionStorage)
   - Admin-Status-Prüfung

2. **Dashboard** (`/`)
   - Echtzeit-Statistiken:
     - Aktive User (nicht gesperrt)
     - Weine in Weinbörse (status: 'public')
     - Weine in Weinregals (status != 'traded')

3. **User-Verwaltung** (`/users`)
   - User-Liste mit Echtzeit-Updates
   - Suchfunktion (E-Mail, Username)
   - User-Details anzeigen
   - User sperren/entsperren (`isBlocked`)
   - Status-Anzeige (aktiv, gesperrt, pending)

---

## ❌ Noch zu implementieren (11 Module)

### 1. Wein-Verwaltung (`/wines`)
**Entspricht:** `AdminWinesScreen.js`

**Features:**
- [ ] Wein-Liste (nur öffentliche Weine: `status == 'public'`)
- [ ] Suche nach Name, Weingut, Owner
- [ ] Wein-Details anzeigen:
  - Name, Jahrgang, Weingut
  - Bilder (labelImages Array)
  - Status, Owner
  - Trade-Status
- [ ] Wein-Aktionen:
  - Einzelnen Wein löschen
  - Alle Weine löschen (Bulk-Delete)
- [ ] Filter:
  - Nach Status
  - Nach Owner
  - Nach Weingut

**Firestore:**
- Collection: `wines`
- Query: `where('status', '==', 'public')`
- Firebase Storage für Bilder

---

### 2. Weingüter-Verwaltung (`/wineries`)
**Entspricht:** `AdminWineriesScreen.js`

**Features:**
- [ ] Weingüter-Liste
- [ ] Weingut-Details:
  - Name, Adresse, Kontakt
  - Owner-Informationen
  - Verifizierungsstatus
  - Alle Weine des Weinguts
- [ ] Weingut-Aktionen:
  - Weingut verifizieren
  - Weingut löschen
  - Verwaiste Weingüter finden und löschen (kein Owner)

**Firestore:**
- Collection: `wineries`
- Verknüpfung zu `users` (Owner)

---

### 3. Umfragen-Verwaltung (`/surveys`)
**Entspricht:** `AdminSurveysScreen.js`

**Features:**
- [ ] Umfragen-Liste
- [ ] Umfrage erstellen:
  - Titel, Beschreibung
  - Fragen (Multiple Choice, Text)
  - Status (draft, active, closed)
  - Zielgruppe (alle User, bestimmte Gruppen)
- [ ] Umfrage-Aktionen:
  - Status ändern (draft → active → closed)
  - Umfrage löschen
  - Benachrichtigungen an User senden
- [ ] Umfrage-Ergebnisse anzeigen:
  - Antworten pro Frage
  - Statistiken
  - Export-Funktion

**Firestore:**
- Collection: `surveys`
- Subcollection: `surveys/{surveyId}/answers`
- Benachrichtigungen über `createNotificationsForSurvey`

---

### 4. Newsletter-Verwaltung (`/newsletter`)
**Entspricht:** `AdminNewsletterScreen.js`

**Features:**
- [ ] Newsletter-Liste
- [ ] Newsletter erstellen:
  - Titel, Inhalt (Rich Text Editor)
  - Status (draft, sent)
  - Zielgruppe
- [ ] Newsletter-Aktionen:
  - Status ändern
  - Newsletter versenden
  - Benachrichtigungen an User senden
  - Newsletter löschen

**Firestore:**
- Collection: `newsletters`
- Rich Text Editor (z.B. React Quill, TinyMCE)
- Benachrichtigungen über `createNotificationsForNewsletter`

---

### 5. System-Nachrichten (`/system-messages`)
**Entspricht:** `AdminSystemMessagesScreen.js`

**Features:**
- [ ] System-Nachrichten-Liste
- [ ] System-Nachricht erstellen:
  - Titel, Inhalt
  - Typ (info, warning, error)
  - Status (draft, active, archived)
- [ ] System-Nachricht-Aktionen:
  - Status ändern
  - Benachrichtigungen senden
  - Nachricht löschen

**Firestore:**
- Collection: `systemMessages`
- Benachrichtigungen über `createNotificationsForSystemMessage`

---

### 6. Daten-Verwaltung (`/data-management`)
**Entspricht:** `AdminDataManagementScreen.js`

**Features:**
- [ ] Tabs für:
  - Chats
  - Hinweise
  - Trade Requests
- [ ] Chats/Hinweise verwalten:
  - Liste aller Chats
  - Chat-Details anzeigen
  - Chat löschen
- [ ] Trade Requests verwalten:
  - Liste aller Trade Requests
  - Trade-Status anzeigen
  - Alte Trade Requests bereinigen (rejected, accepted)
  - Alle Trade Requests löschen
- [ ] Notifications verwalten:
  - Notifications pro User anzeigen
  - Notifications löschen
- [ ] Bulk-Bereinigung:
  - Alle Chats löschen
  - Alle Trade Requests löschen
  - Alle Notifications löschen
  - Komplette Datenbank-Bereinigung (außer Admin)

**Firestore:**
- Collections: `chats`, `tradeRequests`, `users/{userId}/notifications`
- Batch-Operationen für Bulk-Delete

---

### 7. Shop-Verwaltung (`/shop`)
**Entspricht:** `AdminShopScreen.js`

**Features:**
- [ ] Produkte verwalten:
  - Produkt-Liste
  - Produkt erstellen/bearbeiten
  - Produkt löschen
  - Bilder hochladen
- [ ] Produkt-Details:
  - Name, Beschreibung, Preis
  - Kategorie
  - Verfügbarkeit
  - Bilder

**Firestore:**
- Collection: `products` oder `shopItems`
- Firebase Storage für Produktbilder

---

### 8. Bestellungen-Verwaltung (`/orders`)
**Entspricht:** `AdminOrdersScreen.js`

**Features:**
- [ ] Bestellungen-Liste
- [ ] Bestellungs-Details:
  - Bestellnummer, Datum
  - Kunde, Lieferadresse
  - Produkte, Gesamtpreis
  - Status (pending, paid, shipped, delivered, cancelled)
- [ ] Bestellungs-Aktionen:
  - Status ändern
  - Rechnung generieren (über FastAPI Backend)
  - Bestellung stornieren

**Firestore:**
- Collection: `orders`
- Integration mit FastAPI Backend für Rechnungsgenerierung
- PayPal-Integration-Status prüfen

---

### 9. Chat-Verwaltung (`/chats`)
**Entspricht:** `AdminChatsScreen.js`

**Features:**
- [ ] Chat-Liste
- [ ] Chat-Details:
  - Teilnehmer
  - Nachrichten-Verlauf
  - Chat-Typ (chat, hint)
- [ ] Chat-Aktionen:
  - Chat löschen
  - Nachrichten löschen

**Firestore:**
- Collection: `chats`
- Subcollection: `chats/{chatId}/messages`

**Hinweis:** 1-zu-1 Kommunikation darf nicht von Dritten (auch nicht Admins) eingesehen werden (Datenschutz)

---

### 10. Trade-Verwaltung (`/trades`)
**Entspricht:** `AdminTradesScreen.js`

**Features:**
- [ ] Trade Requests-Liste
- [ ] Trade-Details:
  - Von/Bis User
  - Weine
  - Status
  - Datum
- [ ] Trade-Aktionen:
  - Trade-Status ändern
  - Trade löschen

**Firestore:**
- Collection: `tradeRequests`

---

### 11. Hinweise-Verwaltung (`/hints`)
**Entspricht:** `AdminHintsScreen.js`

**Features:**
- [ ] Hinweise-Liste
- [ ] Hinweis-Details:
  - Typ (trade_hint, wish_match)
  - Status
  - Verknüpfte User/Trades
- [ ] Hinweis-Aktionen:
  - Hinweis löschen
  - Status ändern

**Firestore:**
- Collection: `chats` mit `entryType: 'hint'`
- Oder separate Collection `hints`

---

## 🎨 Design-Anforderungen

### Konsistentes Design-System
- **Hintergrund:** `#2c2c2c` (Dunkles Grau)
- **Akzentfarbe:** `#DAA520` (Gold)
- **Text:** `#FFFFFF` (Weiß)
- **Borders:** `rgba(218, 165, 32, 0.2)` (Gold, transparent)

### Komponenten
- **Layout:** Header mit Navigation (wie bereits implementiert)
- **Karten:** Glassmorphism-Effekt (transparenter Hintergrund)
- **Buttons:** Gold-Hintergrund mit schwarzem Text
- **Tabellen:** Dunkles Theme mit Hover-Effekten
- **Modals:** Dunkles Theme mit Gold-Akzenten

---

## 🔌 Technische Anforderungen

### Firebase Firestore
- **Direkte Verbindung:** Firestore Web SDK (bereits konfiguriert)
- **Echtzeit-Updates:** `onSnapshot` für Live-Daten
- **Sicherheit:** Firestore Security Rules für Admin-Zugriff

### FastAPI Backend Integration
- **E-Mail-Versand:** Integration mit `/send-email` Endpoint
- **Rechnungsgenerierung:** Integration mit `/generate-invoice` Endpoint
- **CORS:** Backend muss Web-Domain erlauben

---

## 📋 Implementierungsreihenfolge (Empfehlung)

### Phase 1: Core-Verwaltung (Priorität: Hoch)
1. **Wein-Verwaltung** (`/wines`)
2. **Weingüter-Verwaltung** (`/wineries`)
3. **Daten-Verwaltung** (`/data-management`)

### Phase 2: Kommunikation (Priorität: Mittel)
4. **Umfragen-Verwaltung** (`/surveys`)
5. **Newsletter-Verwaltung** (`/newsletter`)
6. **System-Nachrichten** (`/system-messages`)

### Phase 3: Shop & Bestellungen (Priorität: Mittel)
7. **Shop-Verwaltung** (`/shop`)
8. **Bestellungen-Verwaltung** (`/orders`)

### Phase 4: Erweiterte Verwaltung (Priorität: Niedrig)
9. **Chat-Verwaltung** (`/chats`)
10. **Trade-Verwaltung** (`/trades`)
11. **Hinweise-Verwaltung** (`/hints`)

---

## 🔄 Synchronisation App ↔ Web

### Wichtige Punkte:
- ✅ **Gleiche Firestore-Datenbank:** Beide Systeme nutzen identische Firestore-Instanz
- ✅ **Automatische Echtzeit-Synchronisation:** Änderungen in App erscheinen sofort im Web (und umgekehrt)
- ✅ **Gleiche Datenstrukturen:** Firestore-Schema ist identisch
- ✅ **Gleiche Admin-Rechte:** `isAdmin: true` in Firestore

### Keine zusätzliche API nötig:
- Web und App lesen/schreiben direkt in Firestore
- Keine Synchronisations-Logik erforderlich
- Echtzeit-Updates über `onSnapshot`

---

## 📝 Nächste Schritte

1. **Implementierungsreihenfolge festlegen** (siehe oben)
2. **Erste Module implementieren** (Phase 1)
3. **Design-Konsistenz prüfen** (mit bestehenden Seiten)
4. **Testing:** Funktionalität in App und Web testen
5. **Dokumentation:** Features dokumentieren

---

**Erstellt am:** 08. Dezember 2025  
**Status:** Übersicht - Bereit für Implementierung











