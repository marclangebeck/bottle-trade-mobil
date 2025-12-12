# Bottle Trade Mobile - Projektdokumentation

**Stand:** 11. Dezember 2025 (Aktualisiert)  
**Version:** 1.6  
**Domain:** bottle-trade.de

---

## 📋 Projekt-Überblick

Bottle Trade ist eine mobile und webbasierte Plattform für Weinliebhaber zum Tauschen von Weinen. Das Projekt besteht aus drei Hauptkomponenten:

1. **Mobile-App** (React Native)
2. **Admin-Web** (React + TypeScript + Vite)
3. **Backend-API** (FastAPI)

Alle Komponenten nutzen **Firebase Firestore** als zentrale Datenbank für Echtzeit-Synchronisation.

---

## 🏗️ Architektur

### Technologie-Stack

#### Mobile-App
- **Framework:** React Native (Expo)
- **Firebase:** Firestore Web SDK v9.23.0
- **State Management:** React Hooks
- **Navigation:** React Navigation
- **Styling:** StyleSheet (React Native)

#### Admin-Web
- **Framework:** React 19 + TypeScript
- **Build-Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **State Management:** React Query (@tanstack/react-query)
- **Firebase:** Firestore Web SDK v12.6.0

#### Backend-API
- **Framework:** FastAPI (Python)
- **E-Mail-Service:** SMTP (Mailbox.org)
- **Rechnungsgenerierung:** PDF-Export
- **Firebase:** Firebase Admin SDK

### Datenbank
- **Firebase Firestore** (`bottle-trade-app`)
- **Echtzeit-Synchronisation:** `onSnapshot` für Live-Updates
- **Storage:** Firebase Storage für Bilder

---

## 📱 Mobile-App

### Hauptfunktionen
- User-Registrierung und -Authentifizierung
- Wein-Verwaltung (Weinregal, Weinbörse)
- Tausch-System (Trade Requests)
- Chat-System
- Wunschliste
- Weingüter-Verwaltung
- Weinhandel-Verwaltung
- Shop & Bestellungen
- Newsletter & Umfragen
- Schwarzes Brett (✅ Bearbeiten/Löschen für Ersteller, ✅ Admin-Löschung)
- Admin-Bereich

### Admin-Bereich (Mobile-App)
Vollständige Admin-Funktionen in der Mobile-App:
- Dashboard mit Statistiken
- User-Verwaltung
- Wein-Verwaltung
- Weingüter-Verwaltung
- Weinhandel-Verwaltung
- Umfragen-Verwaltung
- Newsletter-Verwaltung
- System-Nachrichten
- Daten-Verwaltung
- Shop-Verwaltung
- Bestellungen-Verwaltung
- Trade-Verwaltung
- Chat-Verwaltung
- Hinweise-Verwaltung

---

## 🌐 Admin-Web

### Status
**Stand:** 08. Dezember 2025

#### ✅ Implementiert
- **Login-System** mit Session-Management
- **Dashboard** mit Echtzeit-Statistiken
- **User-Verwaltung** (vollständig, 1:1 mit Mobile-App):
  - User-Liste mit Suche
  - User-Details Modal mit vollständigen Statistiken
  - User aktivieren/deaktivieren
  - User sperren/entsperren (✅ Fix: Blockierung funktioniert korrekt in App)
  - E-Mail-Verifizierung setzen/entfernen
  - Basic/Pro Version umstellen
  - Weingut verifizieren
  - User löschen
  - User-Datenbank bereinigen
- **Wein-Verwaltung** (`/wines`)
- **Weingüter-Verwaltung** (`/wineries`)
- **Weinhandel-Verwaltung** (`/winehandel`):
  - ✅ **Neue Seite** für Weinhandel-Unternehmen-Verwaltung
  - ✅ **Filter und Suche** nach Name, Owner, Region
  - ✅ **Detail-Ansicht** mit Bildern
  - ✅ **Verifizierungs-Funktion** für Weinhandel-Unternehmen
  - ✅ **Lösch-Funktion** für alle Unternehmen (nur Admin)
  - ✅ **Cleanup-Funktion** für verwaiste Unternehmen
- **Daten-Verwaltung** (`/data-management`)
- **Umfragen-Verwaltung** (`/surveys`):
  - Umfrage erstellen, bearbeiten, löschen
  - Status-Verwaltung (draft, active, closed)
  - ✅ **Notification-Versand** bei Umfrage-Erstellung
  - ✅ **Ergebnisübersicht** mit Statistiken pro Option
- **Newsletter-Verwaltung** (`/newsletter`):
  - Newsletter erstellen, senden, löschen
  - ✅ **Notification-Versand** bei Newsletter-Versand
- **System-Nachrichten** (`/system-messages`):
  - System-Nachrichten erstellen, senden, löschen
  - ✅ **Notification-Versand** bei System-Nachricht-Versand
- **Shop-Verwaltung** (`/shop`):
  - ✅ **Kategorien entfernt** (vereinfachtes Produktmodell)
  - ✅ **Bild-Upload** für Produkte (max. 5 Bilder)
  - ✅ **Bearbeiten-Button** für einzelne Produkte
  - Produkt erstellen, bearbeiten, löschen
  - Lagerbestand-Verwaltung
  - Produkt-Status (aktiv/inaktiv)
- **Bestellungen-Verwaltung** (`/orders`):
  - ✅ **Lösch-Funktion** für Bestellungen
- **Schwarzes Brett-Verwaltung** (`/blackboard`):
  - ✅ **Neue Seite** für Inserat-Verwaltung
  - ✅ **Filter und Suche** nach Typ und Inhalt
  - ✅ **Detail-Ansicht** mit Bildern
  - ✅ **Lösch-Funktion** für alle Inserate (nur Admin)
- **Trade-Verwaltung** (`/trades`)

#### ⏳ In Arbeit
- Vollständige Feature-Parität aller Module zur Mobile-App
- Testing und Optimierung

### Deployment
- **URL:** `https://bottle-trade.de/admin`
- **Build:** `npm run build` (erstellt `dist/` Ordner)
- **Deploy-Skript:** `./deploy.sh`
- **Update-Anleitung:** `admin-web/UPDATE_ANLEITUNG.md`

### Kommunikation mit Mobile-App
✅ **Vollständige Kompatibilität:**
- Gleiche Firebase Firestore-Datenbank
- Echtzeit-Synchronisation über `onSnapshot`
- Änderungen im Web → sofort in App sichtbar
- Änderungen in App → sofort im Web sichtbar
- Keine zusätzliche API nötig

**Implementierte Synchronisation:**
- ✅ User-Blockierung: `isBlocked` Feld in Firestore wird in App geprüft
- ✅ User-Aktivierung: `isActive` Status synchronisiert
- ✅ Notifications: Werden in `users/{userId}/notifications` gespeichert und in App angezeigt
- ✅ Umfragen, Newsletter, Systemnachrichten: Alle Status-Änderungen synchron

---

## 🔌 Backend-API

### Funktionen
- **E-Mail-Versand:**
  - Registrierungsbestätigung
  - Aktivierungs-E-Mails
  - Admin-Benachrichtigungen
- **Rechnungsgenerierung:** PDF-Export für Bestellungen
- **PayPal-Integration:** Payment-Verarbeitung

### Endpoints
- `/auth/send-activation-email` - Aktivierungs-E-Mail senden
- `/send-email` - Allgemeiner E-Mail-Versand
- `/generate-invoice` - Rechnung generieren

### Konfiguration
- **Umgebungsvariablen:** Alle sensiblen Daten über `.env` Datei
  - `DATABASE_URL` - PostgreSQL Verbindungsstring
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - E-Mail-Konfiguration
  - `FIREBASE_CREDENTIALS_PATH` - Pfad zu Firebase Service Account Key
- **Datenbank:** `database.py` liest `DATABASE_URL` aus Umgebungsvariablen
- **Alembic:** `alembic/env.py` verwendet `DATABASE_URL` für Migrations
- **Sicherheit:** ✅ Keine hardcodierten Credentials mehr im Code

---

## 🔐 Authentifizierung

### Mobile-App
- **System:** Test-Auth (eigenes System)
- **Session:** AsyncStorage
- **Admin-Prüfung:** `isAdmin: true` in Firestore
- **User-Blockierung:** ✅ Prüfung auf `isBlocked: true` beim Login
- **Fehlermeldungen:** ✅ User-freundliche Popup-Alerts statt Programmierfehler-Banner

### Admin-Web
- **System:** Test-Auth (wie in Mobile-App)
- **Session:** sessionStorage
- **Admin-Prüfung:** `isAdmin: true` in Firestore

---

## 📊 Datenstruktur (Firestore)

### Collections
- `users` - User-Daten
- `wines` - Weine
- `wineries` - Weingüter
- `winehandel` - Weinhandel-Unternehmen
- `chats` - Chats und Hinweise
- `tradeRequests` - Tauschanfragen
- `surveys` - Umfragen
- `newsletters` - Newsletter
- `systemMessages` - System-Nachrichten
- `products` - Shop-Produkte
- `orders` - Bestellungen
- `wishes` - Wünsche
- `users/{userId}/notifications` - Benachrichtigungen (Subcollection)

---

## 🚀 Deployment

### Admin-Web
1. **Build erstellen:**
   ```bash
   cd ~/bottle-trade-mobile/admin-web
   ./build.sh
   # oder
   ./deploy.sh
   # oder manuell:
   export PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH"
   npm run build
   ```
   - ✅ **Build-Skripte:** `build.sh` und `deploy.sh` setzen automatisch nvm-PATH
   - ✅ **Automatische Prüfung:** Node.js-Verfügbarkeit wird geprüft

2. **Auf Server deployen:**
   - Lokal: Dateien sind bereits in `dist/`
   - Remote: `rsync` oder `scp` nach Server übertragen

3. **Nginx-Konfiguration:**
   - Location: `/admin`
   - Pfad: `/home/bottleadmin/bottle-trade-mobile/admin-web/dist`
   - `try_files $uri $uri/ /admin/index.html;`

### Mobile-App
- **Expo:** `expo build` oder EAS Build
- **Distribution:** App Stores oder Expo Go

### Backend-API
- **Systemd Service:** `bottle-trade-backend.service`
- **Auto-Start:** Konfiguriert
- **Logs:** Systemd Journal

---

## 📁 Projektstruktur

```
bottle-trade-mobile/
├── admin-web/              # Admin-Web (React + TypeScript)
│   ├── src/
│   │   ├── pages/          # Seiten
│   │   │   ├── Winehandel.tsx      # Weinhandel-Verwaltung
│   │   │   └── Users.tsx            # User-Verwaltung (✅ Weinhandel-Toggle)
│   │   ├── components/     # Komponenten
│   │   ├── utils/          # Utility-Funktionen
│   │   │   ├── notifications.ts    # Notification-System
│   │   │   ├── imageUpload.ts      # Bild-Upload-Funktionen
│   │   │   └── surveyAnswers.ts    # Umfrage-Auswertung
│   │   └── config/         # Firebase-Konfiguration
│   ├── dist/               # Build-Output
│   ├── build.sh            # Build-Skript (✅ nvm-PATH)
│   └── deploy.sh           # Deploy-Skript (✅ nvm-PATH)
├── mobile-app/             # Mobile-App (React Native)
│   ├── screens/            # Bildschirme
│   │   ├── WeinhandelScreen.js      # Weinhandel-Anzeige
│   │   └── AdminWeinhandelScreen.js # Weinhandel-Verwaltung (Admin)
│   ├── components/         # Komponenten
│   ├── services/           # Services (Database, Auth)
│   │   └── testAuth.js     # Authentifizierung (✅ User-Blockierung)
│   │   └── database-web.js # Database-Funktionen (✅ Weinhandel-Funktionen)
│   ├── utils/              # Utility-Funktionen
│   │   └── keyboardUtils.js # Tastaturbehandlung (✅ Next-Button, Auto-Scroll)
│   ├── start-expo.sh       # Expo-Start-Skript (✅ nvm-PATH, CI-Fix)
│   └── config/             # Konfiguration
├── backend-api/            # Backend-API (FastAPI)
│   ├── main.py             # Haupt-API
│   ├── email_service.py    # E-Mail-Service
│   └── generate_invoice.py # Rechnungsgenerierung
├── docs/                   # Dokumentation
├── Summarys/               # Session-Summaries
├── Backups/                # Projekt-Backups
└── PROJEKT_DOKUMENTATION.md
```

---

## 🔄 Entwicklungsworkflow

### Code-Änderungen
1. Code ändern
2. Testen (lokal)
3. Build erstellen (`npm run build`)
4. Auf Server deployen
5. Browser-Cache leeren (Hard Refresh)

### Mobile-App Entwicklung
- **Expo starten:**
  ```bash
  cd mobile-app
  ./start-expo.sh
  # oder manuell:
  export PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH"
  unset CI
  npx expo start --tunnel --clear --port 8081
  ```
- **Hinweise:**
  - nvm muss geladen sein (automatisch in `start-expo.sh`)
  - CI-Variable muss deaktiviert sein für QR-Code-Anzeige
  - `@expo/ngrok` muss global installiert sein für Tunnel-Modus
- **Troubleshooting:**
  - `npx: Kommando nicht gefunden` → nvm-PATH setzen
  - Kein QR-Code → `unset CI` ausführen
  - Tunnel-Fehler → `npm install -g @expo/ngrok@^4.1.0`

### Admin-Web Entwicklung
- **Build ausführen:**
  ```bash
  cd admin-web
  ./build.sh
  # oder
  ./deploy.sh
  # oder manuell:
  export PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH"
  npm run build
  ```
- **Hinweise:**
  - nvm-PATH wird automatisch in `build.sh` und `deploy.sh` gesetzt
  - Node.js-Verfügbarkeit wird automatisch geprüft
  - Build-Output: `dist/` Ordner
- **Troubleshooting:**
  - `npm: Kommando nicht gefunden` → nvm-PATH setzen oder `./build.sh` verwenden
  - Build-Fehler → Prüfe TypeScript-Fehler mit `npm run lint`

### Backup-Strategie
- **Automatische Backups:** Vor größeren Änderungen
- **Format:** `Backup_YYYYMMDD_HHMMSS.tar.gz`
- **Speicherort:** `Backups/`
- **Inhalt:** Alle Projektdateien (außer node_modules, .git, dist)

### Session-Summaries
- **Format:** `Summary_YYYYMMDD_HHMMSS.md`
- **Speicherort:** `Summarys/`
- **Inhalt:** Zusammenfassung der Session-Änderungen

---

## 🎯 Feature-Parität

### Status: Admin-Web ↔ Mobile-App

| Modul | Mobile-App | Admin-Web | Status |
|-------|-----------|-----------|--------|
| Dashboard | ✅ | ✅ | ✅ Vollständig |
| User-Verwaltung | ✅ | ✅ | ✅ Vollständig (1:1) |
| Wein-Verwaltung | ✅ | ✅ | ⚠️ Prüfung nötig |
| Weingüter-Verwaltung | ✅ | ✅ | ⚠️ Prüfung nötig |
| Weinhandel-Verwaltung | ✅ | ✅ | ✅ Vollständig (Verifizierung + Verwaltung) |
| Umfragen | ✅ | ✅ | ✅ Verbessert (Notifications + Ergebnisse) |
| Newsletter | ✅ | ✅ | ✅ Verbessert (Notifications) |
| System-Nachrichten | ✅ | ✅ | ✅ Verbessert (Notifications) |
| Daten-Verwaltung | ✅ | ✅ | ⚠️ Prüfung nötig |
| Shop | ✅ | ✅ | ✅ Verbessert (Bild-Upload + Bearbeiten) |
| Bestellungen | ✅ | ✅ | ⚠️ Prüfung nötig |
| Trades | ✅ | ✅ | ⚠️ Prüfung nötig |

**Letzte Verbesserungen:**
- ✅ User-Blockierung funktioniert korrekt (Web → App)
- ✅ Login-Fehlermeldungen als Popup statt Banner
- ✅ Notifications für Umfragen, Newsletter, Systemnachrichten
- ✅ Umfrage-Ergebnisübersicht im Admin-Web
- ✅ Shop: Kategorien entfernt, Bild-Upload, Bearbeiten-Funktion
- ✅ Weinhandel-Feature: Vollständige Implementierung in App und Web

**Nächster Schritt:** Verbleibende Module auf vollständige Feature-Parität prüfen und fehlende Funktionen implementieren.

---

## 🛠️ Utility-Funktionen

### Admin-Web

#### `admin-web/src/utils/notifications.ts`
Zentrale Funktionen für das Notification-System:
- **User-Abfragen:**
  - `getAllUsers()`: Alle User abrufen
  - `getActiveUsers()`: Aktive User (letzte 30 Tage)
  - `getNewsletterSubscribers()`: Newsletter-Abonnenten
  - `getTargetUsers(targetGroup)`: Zielgruppen-basierte Abfrage
- **Notification-Erstellung:**
  - `createNotificationsForSurvey()`: Notifications für Umfragen
  - `createNotificationsForNewsletter()`: Notifications für Newsletter
  - `createNotificationsForSystemMessage()`: Notifications für Systemnachrichten
- **Technik:** Verwendet `writeBatch` für Bulk-Operationen, speichert in `users/{userId}/notifications`

#### `admin-web/src/utils/imageUpload.ts`
Bild-Upload-Funktionen für Firebase Storage:
- **Funktionen:**
  - `uploadImageToStorage()`: Einzelnes Bild hochladen
  - `uploadProductImages()`: Mehrere Produktbilder hochladen (max. 5)
- **Features:** Automatische Dateinamen-Generierung, Metadaten-Verwaltung, URL-Rückgabe

#### `admin-web/src/utils/surveyAnswers.ts`
Umfrage-Auswertung und Ergebnisberechnung:
- **Funktionen:**
  - `getSurveyAnswers()`: Sammelt alle Antworten einer Umfrage aus allen User-Subcollections
  - `calculateSurveyResults()`: Berechnet Statistiken (Anzahl, Prozent) pro Option
- **Verwendung:** Wird für die Ergebnisübersicht in der Umfragen-Verwaltung verwendet

### Mobile-App

#### `mobile-app/services/database-web.js` - Weinhandel-Funktionen
Database-Funktionen für Weinhandel-Unternehmen:
- **Abfragen:**
  - `getWinehandelByOwner(ownerId)`: Holt Weinhandel nach Owner-ID
  - `getVerifiedWinehandel()`: Holt alle verifizierten Weinhandel-Unternehmen
  - `getAllWinehandel()`: Holt alle Weinhandel-Unternehmen (für Admins)
- **Subscriptions:**
  - `subscribeVerifiedWinehandel(callback)`: Echtzeit-Updates für verifizierte Unternehmen
- **Verwaltung:**
  - `updateWinehandel(winehandelId, updates)`: Aktualisiert Weinhandel-Unternehmen
  - `deleteWinehandel(winehandelId)`: Löscht Weinhandel-Unternehmen
  - `verifyWinehandel(winehandelId, isVerified)`: Verifiziert/entfernt Verifizierung
- **Technik:** Verwendet Firestore Collection `winehandel`, ähnlich wie Weingüter

#### `mobile-app/utils/keyboardUtils.js`
Einheitliche Tastaturbehandlung für alle Formular-Screens:
- **Funktionen:**
  - `scrollToInput(scrollViewRef, inputRef)`: Scrollt automatisch zum fokussierten Input-Feld
    - Verwendet `measureLayout` für präzises Scrollen
    - Fallback-Mechanismus für komplexe Layouts
    - Offset von 150px für optimale Sichtbarkeit über der Tastatur
  - `getKeyboardAvoidingViewProps()`: Einheitliche KeyboardAvoidingView-Konfiguration
    - iOS: `behavior: 'padding'`
    - Android: `behavior: 'height'`
- **Verwendung:** Wird in allen Formular-Screens verwendet (Login, Register, Schwarzes Brett, ChatRoom, Weinregal, Wunschliste, Shop, Weinbörse)
- **Features:**
  - Next-Button in der Tastatur (`returnKeyType="next"`)
  - Automatisches Scrollen zum aktiven Feld
  - Einheitliche Konfiguration für iOS und Android

---

## 📝 Wichtige Dokumentation

- **Admin-Web Konzept:** `docs/ADMIN_WEB_BACKEND_KONZEPT.md`
- **Fehlende Features:** `docs/ADMIN_WEB_FEHLENDE_FEATURES.md`
- **Kommunikation:** `docs/ADMIN_WEB_KOMMUNIKATION.md`
- **Backend-Anforderungen:** `docs/ADMIN_WEB_BACKEND_ANFORDERUNGEN.md`
- **Update-Anleitung:** `admin-web/UPDATE_ANLEITUNG.md`
- **Deployment:** `admin-web/DEPLOYMENT_ANLEITUNG.md`

---

## 🔧 Wartung & Updates

### Regelmäßige Aufgaben
- Backups erstellen (vor größeren Änderungen)
- Session-Summaries erstellen (nach jeder Session)
- Projektdokumentation aktualisieren
- Dependencies aktualisieren
- Security-Updates prüfen

### Troubleshooting
- **Browser-Cache:** Hard Refresh (`Ctrl+Shift+R`)
- **Firebase-Verbindung:** Prüfe Firebase Console
- **Build-Fehler:** Prüfe TypeScript-Fehler
- **Deployment:** Prüfe Nginx-Logs
- **Expo/npx:** nvm-PATH setzen, CI-Variable deaktivieren
- **GitHub Push Protection:** Secrets aus Historie entfernen mit `git filter-branch`
- **Agent Review:** Keine hardcodierten Credentials, Umgebungsvariablen verwenden

---

## 📞 Support & Kontakt

- **Domain:** bottle-trade.de
- **Firebase-Projekt:** bottle-trade-app
- **Server:** v2202505266333339459.bestsrv.de

---

## 🆕 Neueste Änderungen (Dezember 2025)

### Weinhandel-Feature (11. Dezember 2025)
- ✅ **Weinhandel-Feature vollständig implementiert:**
  - Neuer Button "Weinhandel" im CommunityScreen
  - WeinhandelScreen für Anzeige verifizierter Unternehmen
  - Toggle "Ich bin ein Weinhandel" in der Registrierung
  - AdminWeinhandelScreen für Verwaltung (Mobile-App)
  - Weinhandel-Verwaltungsseite im Admin-Web (`/winehandel`)
  - Verifizierungs-Funktion in User-Verwaltung (App + Web)
  - Database-Funktionen: `getVerifiedWinehandel`, `getAllWinehandel`, `verifyWinehandel`, etc.
  - Firestore Collection `winehandel` für Unternehmen-Daten
  - User-Felder: `isWinehandel`, `isWinehandelVerified`
  - Synchronisation: Verifizierung im User synchronisiert mit Weinhandel-Profil

### Admin-Web & Mobile-App Verbesserungen (11. Dezember 2025)
- ✅ **Bestellungen-Löschung:** Admin-Web unterstützt jetzt das Löschen von Bestellungen
- ✅ **Schwarzes Brett Admin-Verwaltung:** 
  - Neue Admin-Web-Seite `/blackboard` für Inserat-Verwaltung
  - Filter, Suche und Detail-Ansicht mit Bildern
  - Lösch-Funktion für alle Inserate
- ✅ **Schwarzes Brett Admin-Löschung in App:** Admins können jetzt alle Inserate löschen (nicht nur eigene)
- ✅ **Keyboard-Handling Optimierung:**
  - KeyboardAvoidingView-Struktur verbessert (View als Container, kein zusätzlicher Balken)
  - Dynamisches Padding: 2px bei offener Tastatur, 40px bei geschlossener
  - KeyboardAvoidingView-Offset auf 10 reduziert für maximalen sichtbaren Bereich
  - Keyboard-Listener für alle Screens mit TextInputs
  - Angepasste Screens: LoginScreen, RegisterScreen, ChatRoomScreen, EmailConfirmationScreen, InfoScreen, WeinregalBefuellenScreen
- ✅ **Keyboard-Handling Fehlerbehebung:**
  - Fehlende Imports für `getKeyboardAvoidingViewProps` behoben
  - Deprecated Deep Import entfernt
  - Export-Struktur verbessert für Hot Reload

### Mobile-App Verbesserungen (09. Dezember 2025)

### User-Management & Authentifizierung
- ✅ **User-Blockierung:** Funktioniert jetzt korrekt - gesperrte User können sich nicht mehr in der App einloggen
- ✅ **Login-Fehlermeldungen:** User-freundliche Popup-Alerts statt Programmierfehler-Banner
- ✅ **Blockierungs-Prüfung:** Mobile-App prüft `isBlocked: true` beim Login und in `restoreSession`

### Notification-System
- ✅ **Notification-Utilities:** Neue Datei `admin-web/src/utils/notifications.ts`
  - Automatischer Notification-Versand für Umfragen, Newsletter, Systemnachrichten
  - Unterstützung für Zielgruppen (alle, aktiv, Newsletter-Abonnenten)
  - Verwendet `writeBatch` für effiziente Bulk-Erstellung
- ✅ **Umfragen:** Notifications werden bei Erstellung automatisch versendet
- ✅ **Newsletter:** Notifications werden beim Versand an Zielgruppe erstellt
- ✅ **Systemnachrichten:** Notifications werden beim Versand an Zielgruppe erstellt

### Umfragen-Verwaltung
- ✅ **Ergebnisübersicht:** Neue Funktion zum Anzeigen von Umfrage-Ergebnissen
  - Anzahl Antworten pro Option
  - Prozentuale Verteilung
  - Visuelle Fortschrittsbalken
- ✅ **Survey-Utilities:** Neue Datei `admin-web/src/utils/surveyAnswers.ts`
  - `getSurveyAnswers()`: Sammelt alle Antworten einer Umfrage
  - `calculateSurveyResults()`: Berechnet Statistiken

### Shop-Verwaltung
- ✅ **Kategorien entfernt:** Vereinfachtes Produktmodell ohne Kategorien
- ✅ **Bild-Upload:** 
  - Neue Datei `admin-web/src/utils/imageUpload.ts`
  - Upload von bis zu 5 Bildern pro Produkt
  - Firebase Storage Integration
  - Bild-Vorschau beim Erstellen/Bearbeiten
- ✅ **Bearbeiten-Funktion:** 
  - Bearbeiten-Button für einzelne Produkte
  - Vollständige Produktbearbeitung mit Bild-Upload
  - Bestehende Bilder können entfernt werden
- ✅ **Formular-Verbesserungen:**
  - Korrektes Zurücksetzen beim "+ Neues Produkt" Button
  - Separate States für Create/Edit-Modus

### Entwicklungsumgebung & Sicherheit (08. Dezember 2025)
- ✅ **Expo/npx Problem behoben:**
  - nvm-PATH wird automatisch in `start-expo.sh` gesetzt
  - CI-Variable wird deaktiviert für QR-Code-Anzeige
  - `@expo/ngrok` global installiert für Tunnel-Modus
- ✅ **Admin-Web Build-Problem behoben:**
  - Neues Build-Skript: `admin-web/build.sh`
  - `deploy.sh` aktualisiert mit nvm-PATH-Setting
  - Automatische Node.js-Verfügbarkeits-Prüfung
  - Build erfolgreich durchgeführt
- ✅ **GitHub Push Protection:**
  - `firebase-credentials.json` aus Git-Historie entfernt
  - Datei zur `.gitignore` hinzugefügt (lokal bleibt sie erhalten)
  - Git-Historie mit `git filter-branch` bereinigt
- ✅ **Agent Review Warnungen behoben:**
  - Hardcodierte Datenbank-Credentials entfernt
  - `database.py` verwendet jetzt `DATABASE_URL` aus Umgebungsvariablen
  - `alembic.ini` und `alembic/env.py` aktualisiert für Umgebungsvariablen
  - Best Practice: Alle Credentials über `.env` Dateien

---

### Mobile-App Verbesserungen (09. Dezember 2025)
- ✅ **Schwarzes Brett: Bearbeiten/Löschen-Funktionen:**
  - Bearbeiten- und Löschen-Buttons direkt in Inserat-Karten
  - Nur sichtbar für Ersteller des Inserats
  - Vollständige Bearbeitungs- und Löschfunktionalität
- ✅ **Einheitliche Tastaturbehandlung:**
  - Neue Utility-Datei: `mobile-app/utils/keyboardUtils.js`
  - Next-Button in allen Formular-Screens (Login, Register, Schwarzes Brett, ChatRoom, Weinregal, Wunschliste, Shop, Weinbörse)
  - Automatisches Scrollen zum aktiven Feld
  - Einheitliche KeyboardAvoidingView-Konfiguration
  - Verbesserte scrollToInput Funktion mit präzisem Scrollen



✅ **Tastaturzentrierung im WeinregalBefuellenScreen stabilisiert:**

## Änderungen
- Robuste Messung vor dem Scrollen (doppeltes requestAnimationFrame + kurzer Delay), damit das Layout nach Keyboard-Änderungen stabil ist.
- Zielposition auf ca. 38 % der Bildschirmhöhe (Feldmitte leicht oberhalb der Mitte) für einheitlich wahrgenommene Position aller Inputs.
- Fallbacks bei fehlender Höhenmessung bleiben erhalten, aber mit konsistenter Zielberechnung.

## Offene Punkte
- Bei Bedarf Feintuning des Zielverhältnisses (`targetCenterRatio`, aktuell 0.38) oder Delay erhöhen, falls bestimmte Geräte langsamer reagieren.

---

**Letzte Aktualisierung:** 11. Dezember 2025, 17:19 (Aktualisiert)  
**Nächste Session:** Testing der Weinhandel-Funktionen und weitere Optimierungen

