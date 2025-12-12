# Konzept: Webbasiertes Admin-Backend für Bottle-Trade

**Stand:** 08. Dezember 2025  
**Domain:** bottle-trade.de  
**Ziel:** 1:1 Abbildung des Admin-Bereichs aus der Mobile-App

---

## 📋 Übersicht

Dieses Dokument beschreibt das Konzept für ein webbasiertes Admin-Backend, das alle Funktionen des Admin-Bereichs aus der Mobile-App auf einer Web-Oberfläche bereitstellt.

---

## 🎯 Ziele

1. **Vollständige Feature-Parität:** Alle Admin-Funktionen aus der App sollen im Web verfügbar sein
2. **Einheitliche Datenbasis:** Nutzung der gleichen Firebase Firestore-Datenbank
3. **Konsistentes Design:** Anlehnung an das Mobile-App-Design (dunkles Theme, Gold-Akzente)
4. **Responsive Design:** Funktioniert auf Desktop, Tablet und Mobile
5. **Sicherheit:** Admin-Authentifizierung mit Firebase Auth oder eigenem System

---

## 🏗️ Architektur

### Technologie-Stack (Empfehlung)

**Option 1: React + Firebase (Empfohlen)**
- **Frontend:** React 18+ mit TypeScript
- **Styling:** Tailwind CSS oder Material-UI (dunkles Theme)
- **State Management:** React Query / SWR für Firebase-Daten
- **Firebase:** Firestore Web SDK (gleiche Datenbank wie App)
- **Routing:** React Router
- **Build:** Vite oder Create React App
- **Hosting:** Statische Dateien auf bottle-trade.de

**Option 2: Next.js + Firebase**
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Firebase:** Firestore Web SDK
- **Hosting:** Vercel oder eigenes Server-Hosting

**Option 3: Vue.js + Firebase**
- **Framework:** Vue 3 + TypeScript
- **Styling:** Tailwind CSS
- **Firebase:** Firestore Web SDK
- **Hosting:** Statische Dateien

---

## 📱 Admin-Features (1:1 Abbildung)

### 1. Admin Dashboard (`AdminDashboardScreen`)

**Features:**
- ✅ Echtzeit-Statistiken:
  - Aktive User (nicht gesperrt)
  - Weine in Weinbörse (status: 'public')
  - Weine in Weinregals (status != 'traded')
- ✅ Verwaltungs-Funktionen Grid:
  - Umfragen
  - Newsletter
  - System-Ankündigungen
  - Daten-Verwaltung
  - Weinbörsen-Verwaltung
  - User-Verwaltung
  - Weingüter-Verwaltung
  - Weinregal KI
  - Shop-Verwaltung
- ✅ System-Funktionen:
  - Firestore-Daten anzeigen
  - Migrations-Status prüfen
  - Bild-Migration starten

**Technische Umsetzung:**
- Firestore `onSnapshot` für Echtzeit-Updates
- Grid-Layout mit Karten für Features
- Statistiken als Dashboard-Karten

---

### 2. User-Verwaltung (`AdminUsersScreen`)

**Features:**
- ✅ User-Liste mit Suche
- ✅ User-Details anzeigen:
  - Basis-Informationen (Email, Username, Status)
  - E-Mail-Bestätigungsstatus
  - User-Status (pending, confirmed, active)
  - Weingut-Informationen (falls vorhanden)
  - Alle Weine des Users
  - Alle Chats des Users
  - Alle Trade Requests des Users
  - Alle Wünsche des Users
- ✅ User-Aktionen:
  - User sperren/entsperren (`isBlocked`)
  - User-Status ändern (pending → confirmed → active)
  - User löschen
  - E-Mail-Bestätigung manuell setzen
  - Weingut verifizieren
- ✅ Bulk-Aktionen:
  - Alle User löschen (außer Admin)
  - User-Datenbank bereinigen

**Technische Umsetzung:**
- Firestore Collection `users` abfragen
- Subcollections: `users/{userId}/notifications`
- Suchfunktion (Client-seitig oder Firestore-Query)
- Modals für Details und Aktionen

---

### 3. Wein-Verwaltung (`AdminWinesScreen`)

**Features:**
- ✅ Wein-Liste (nur öffentliche Weine: `status == 'public'`)
- ✅ Suche nach Name, Weingut, Owner
- ✅ Wein-Details anzeigen:
  - Name, Jahrgang, Weingut
  - Bilder (labelImages Array)
  - Status, Owner
  - Trade-Status
- ✅ Wein-Aktionen:
  - Einzelnen Wein löschen
  - Alle Weine löschen (Bulk-Delete)
- ✅ Filter:
  - Nach Status
  - Nach Owner
  - Nach Weingut

**Technische Umsetzung:**
- Firestore Collection `wines` mit Query `where('status', '==', 'public')`
- Firebase Storage für Bilder
- Batch-Delete für Bulk-Operationen

---

### 4. Weingüter-Verwaltung (`AdminWineriesScreen`)

**Features:**
- ✅ Weingüter-Liste
- ✅ Weingut-Details:
  - Name, Adresse, Kontakt
  - Owner-Informationen
  - Verifizierungsstatus
  - Alle Weine des Weinguts
- ✅ Weingut-Aktionen:
  - Weingut verifizieren
  - Weingut löschen
  - Verwaiste Weingüter finden und löschen (kein Owner)

**Technische Umsetzung:**
- Firestore Collection `wineries`
- Verknüpfung zu `users` (Owner)

---

### 5. Umfragen-Verwaltung (`AdminSurveysScreen`)

**Features:**
- ✅ Umfragen-Liste
- ✅ Umfrage erstellen:
  - Titel, Beschreibung
  - Fragen (Multiple Choice, Text)
  - Status (draft, active, closed)
  - Zielgruppe (alle User, bestimmte Gruppen)
- ✅ Umfrage-Aktionen:
  - Status ändern (draft → active → closed)
  - Umfrage löschen
  - Benachrichtigungen an User senden
- ✅ Umfrage-Ergebnisse anzeigen:
  - Antworten pro Frage
  - Statistiken
  - Export-Funktion

**Technische Umsetzung:**
- Firestore Collection `surveys`
- Subcollection `surveys/{surveyId}/answers`
- Benachrichtigungen über `createNotificationsForSurvey`

---

### 6. Newsletter-Verwaltung (`AdminNewsletterScreen`)

**Features:**
- ✅ Newsletter-Liste
- ✅ Newsletter erstellen:
  - Titel, Inhalt (Rich Text Editor)
  - Status (draft, sent)
  - Zielgruppe
- ✅ Newsletter-Aktionen:
  - Status ändern
  - Newsletter versenden
  - Benachrichtigungen an User senden
  - Newsletter löschen

**Technische Umsetzung:**
- Firestore Collection `newsletters`
- Rich Text Editor (z.B. React Quill, TinyMCE)
- Benachrichtigungen über `createNotificationsForNewsletter`

---

### 7. System-Nachrichten (`AdminSystemMessagesScreen`)

**Features:**
- ✅ System-Nachrichten-Liste
- ✅ System-Nachricht erstellen:
  - Titel, Inhalt
  - Typ (info, warning, error)
  - Status (draft, active, archived)
- ✅ System-Nachricht-Aktionen:
  - Status ändern
  - Benachrichtigungen senden
  - Nachricht löschen

**Technische Umsetzung:**
- Firestore Collection `systemMessages`
- Benachrichtigungen über `createNotificationsForSystemMessage`

---

### 8. Daten-Verwaltung (`AdminDataManagementScreen`)

**Features:**
- ✅ Chats/Hinweise verwalten:
  - Liste aller Chats
  - Chat-Details anzeigen
  - Chat löschen
- ✅ Trade Requests verwalten:
  - Liste aller Trade Requests
  - Trade-Status anzeigen
  - Alte Trade Requests bereinigen (rejected, accepted)
  - Alle Trade Requests löschen
- ✅ Notifications verwalten:
  - Notifications pro User anzeigen
  - Notifications löschen
- ✅ Bulk-Bereinigung:
  - Alle Chats löschen
  - Alle Trade Requests löschen
  - Alle Notifications löschen
  - Komplette Datenbank-Bereinigung (außer Admin)

**Technische Umsetzung:**
- Firestore Collections: `chats`, `tradeRequests`, `users/{userId}/notifications`
- Batch-Operationen für Bulk-Delete

---

### 9. Shop-Verwaltung (`AdminShopScreen`)

**Features:**
- ✅ Produkte verwalten:
  - Produkt-Liste
  - Produkt erstellen/bearbeiten
  - Produkt löschen
  - Bilder hochladen
- ✅ Produkt-Details:
  - Name, Beschreibung, Preis
  - Kategorie
  - Verfügbarkeit
  - Bilder

**Technische Umsetzung:**
- Firestore Collection `products` oder `shopItems`
- Firebase Storage für Produktbilder

---

### 10. Bestellungen-Verwaltung (`AdminOrdersScreen`)

**Features:**
- ✅ Bestellungen-Liste
- ✅ Bestellungs-Details:
  - Bestellnummer, Datum
  - Kunde, Lieferadresse
  - Produkte, Gesamtpreis
  - Status (pending, paid, shipped, delivered, cancelled)
- ✅ Bestellungs-Aktionen:
  - Status ändern
  - Rechnung generieren (über FastAPI Backend)
  - Bestellung stornieren

**Technische Umsetzung:**
- Firestore Collection `orders`
- Integration mit FastAPI Backend für Rechnungsgenerierung
- PayPal-Integration-Status prüfen

---

### 11. Chat-Verwaltung (`AdminChatsScreen`)

**Features:**
- ✅ Chat-Liste
- ✅ Chat-Details:
  - Teilnehmer
  - Nachrichten-Verlauf
  - Chat-Typ (chat, hint)
- ✅ Chat-Aktionen:
  - Chat löschen
  - Nachrichten löschen

**Technische Umsetzung:**
- Firestore Collection `chats`
- Subcollection `chats/{chatId}/messages`

---

### 12. Trade-Verwaltung (`AdminTradesScreen`)

**Features:**
- ✅ Trade Requests-Liste
- ✅ Trade-Details:
  - Von/Bis User
  - Weine
  - Status
  - Datum
- ✅ Trade-Aktionen:
  - Trade-Status ändern
  - Trade löschen

**Technische Umsetzung:**
- Firestore Collection `tradeRequests`

---

### 13. Hinweise-Verwaltung (`AdminHintsScreen`)

**Features:**
- ✅ Hinweise-Liste
- ✅ Hinweis-Details:
  - Typ (trade_hint, wish_match)
  - Status
  - Verknüpfte User/Trades
- ✅ Hinweis-Aktionen:
  - Hinweis löschen
  - Status ändern

**Technische Umsetzung:**
- Firestore Collection `chats` mit `entryType: 'hint'`
- Oder separate Collection `hints`

---

## 🎨 Design-System

### Farben (aus Mobile-App)
- **Hintergrund:** `#2c2c2c` (Dunkles Grau)
- **Akzentfarbe:** `#DAA520` (Gold)
- **Text:** `#FFFFFF` (Weiß)
- **Borders:** `rgba(218, 165, 32, 0.2)` (Gold, transparent)

### Komponenten
- **Header:** Logo "Bottle Trade" mit Navigation
- **Karten:** Glassmorphism-Effekt (transparenter Hintergrund)
- **Buttons:** Gold-Hintergrund mit schwarzem Text
- **Tabellen:** Dunkles Theme mit Hover-Effekten
- **Modals:** Dunkles Theme mit Gold-Akzenten

### Responsive Design
- **Desktop:** Multi-Column-Layout, Sidebar-Navigation
- **Tablet:** 2-Column-Layout
- **Mobile:** Single-Column, Hamburger-Menü

---

## 🔐 Authentifizierung

### Option 1: Firebase Authentication (Empfohlen)
- Admin-Login mit E-Mail/Passwort
- Firebase Admin SDK für Server-seitige Validierung
- Session-Management mit Firebase Auth Tokens

### Option 2: Eigenes Auth-System
- Integration mit bestehendem `testAuth.js` System
- JWT-Tokens für Web-Session
- Admin-Status-Prüfung über Firestore

### Sicherheits-Anforderungen
- ✅ Nur User mit `isAdmin: true` können sich anmelden
- ✅ HTTPS erforderlich
- ✅ CSRF-Schutz
- ✅ Rate Limiting für Login-Versuche

---

## 🔌 API-Integration

### Firebase Firestore
- **Direkte Verbindung:** Firestore Web SDK
- **Sicherheit:** Firestore Security Rules für Admin-Zugriff
- **Echtzeit-Updates:** `onSnapshot` für Live-Daten

### FastAPI Backend
- **E-Mail-Versand:** Integration mit `/send-email` Endpoint
- **Rechnungsgenerierung:** Integration mit `/generate-invoice` Endpoint
- **CORS:** Backend muss Web-Domain erlauben

---

## 📁 Projektstruktur (Vorschlag)

```
admin-web/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── Dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   └── FeatureGrid.tsx
│   │   ├── Users/
│   │   │   ├── UserList.tsx
│   │   │   ├── UserCard.tsx
│   │   │   └── UserDetailsModal.tsx
│   │   ├── Wines/
│   │   │   ├── WineList.tsx
│   │   │   └── WineCard.tsx
│   │   └── common/
│   │       ├── SearchBar.tsx
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Wines.tsx
│   │   ├── Wineries.tsx
│   │   ├── Surveys.tsx
│   │   ├── Newsletter.tsx
│   │   ├── SystemMessages.tsx
│   │   ├── DataManagement.tsx
│   │   ├── Shop.tsx
│   │   ├── Orders.tsx
│   │   ├── Chats.tsx
│   │   ├── Trades.tsx
│   │   └── Hints.tsx
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── wines.ts
│   │   ├── surveys.ts
│   │   └── api.ts (FastAPI Integration)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFirestore.ts
│   │   └── useRealtime.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts (oder webpack.config.js)
└── .env.example
```

---

## 🚀 Deployment

### Option 1: Statische Dateien auf Server
- Build-Prozess generiert statische HTML/CSS/JS-Dateien
- Upload auf bottle-trade.de (z.B. `/admin` Verzeichnis)
- Nginx/Apache konfigurieren für Routing

### Option 2: Node.js Server
- Express.js Server für Server-Side Rendering (optional)
- PM2 für Process-Management
- Reverse Proxy (Nginx) für bottle-trade.de

### Option 3: Vercel/Netlify
- Automatisches Deployment
- Custom Domain: admin.bottle-trade.de

---

## 📋 Checkliste: Was benötigt wird

### 1. Server-Informationen
- [ ] Server-Zugriff (SSH)
- [ ] Web-Server (Nginx/Apache) Konfiguration
- [ ] Domain-Konfiguration (bottle-trade.de)
- [ ] SSL-Zertifikat (Let's Encrypt)
- [ ] Port-Konfiguration (80, 443)

### 2. Firebase-Konfiguration
- [ ] Firebase-Projekt-Zugriff
- [ ] Firestore Security Rules für Admin
- [ ] Firebase Storage Rules
- [ ] Firebase Admin SDK Credentials (für Server-seitige Operationen)

### 3. FastAPI Backend
- [ ] Backend-URL (z.B. `https://api.bottle-trade.de`)
- [ ] CORS-Konfiguration für Web-Domain
- [ ] API-Keys/Tokens für Authentifizierung

### 4. Admin-Account
- [ ] Admin-User in Firestore (`isAdmin: true`)
- [ ] E-Mail-Adresse für Admin-Login
- [ ] Passwort (wenn Firebase Auth verwendet wird)

### 5. Design-Assets
- [ ] Logo-Dateien (PNG/SVG)
- [ ] Farb-Palette (falls abweichend)
- [ ] Icon-Set (falls benötigt)

### 6. Entwicklungsumgebung
- [ ] Node.js Version (18+)
- [ ] Package Manager (npm/yarn/pnpm)
- [ ] Git Repository (optional)

---

## 🔄 Entwicklungs-Phasen

### Phase 1: Setup & Grundstruktur
- [ ] Projekt-Setup (React/Next.js)
- [ ] Firebase-Integration
- [ ] Authentifizierung
- [ ] Basis-Layout (Header, Sidebar, Footer)
- [ ] Routing

### Phase 2: Core-Features
- [ ] Dashboard mit Statistiken
- [ ] User-Verwaltung
- [ ] Wein-Verwaltung
- [ ] Weingüter-Verwaltung

### Phase 3: Erweiterte Features
- [ ] Umfragen-Verwaltung
- [ ] Newsletter-Verwaltung
- [ ] System-Nachrichten
- [ ] Daten-Verwaltung

### Phase 4: Shop & Bestellungen
- [ ] Shop-Verwaltung
- [ ] Bestellungen-Verwaltung
- [ ] FastAPI-Integration

### Phase 5: Finalisierung
- [ ] Design-Polish
- [ ] Responsive Design
- [ ] Performance-Optimierung
- [ ] Sicherheits-Checks
- [ ] Deployment

---

## 📝 Nächste Schritte

1. **Technologie-Stack bestätigen** (React/Next.js/Vue?)
2. **Server-Zugriff klären** (SSH, Domain, SSL)
3. **Firebase-Zugriff bestätigen** (Credentials, Security Rules)
4. **Design-Vorlage erstellen** (Mockups, Komponenten-Bibliothek)
5. **Entwicklungs-Start** (Phase 1)

---

**Erstellt am:** 08. Dezember 2025  
**Status:** Konzept - Bereit für Umsetzung











