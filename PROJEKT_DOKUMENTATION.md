# Bottle-Trade Mobile App - Projekt Dokumentation

**Stand:** 03. Dezember 2025, 10:30 Uhr  
**Version:** 1.30  
**Letzte Aktualisierung:** Code-Überprüfung abgeschlossen (Performance-Optimierungen, Memory Leaks behoben), Dokumentation konsolidiert (Shop-System, PayPal, Firestore Schema in PROJEKT_DOKUMENTATION.md integriert)

---

## 📋 Projekt-Übersicht

**Bottle-Trade** ist eine React Native (Expo) Mobile-Applikation für den Tausch von Weinflaschen. Nutzer können ihre Weine verwalten, in einer Weinbörse anbieten und mit anderen Weinliebhabern tauschen.

### Technologie-Stack
- **Framework:** React Native (Expo)
- **Navigation:** React Navigation (`createBottomTabNavigator`)
- **Backend:** Firebase (Firestore, Auth)
- **Lokale Speicherung:** AsyncStorage
- **Status-Management:** React Hooks (`useState`, `useEffect`)

---

## 🎨 Design-System & UI-Überarbeitung

### Primärfarben
- **Hintergrundfarbe:** `#2c2c2c` (Dunkles Grau) - Auf allen Screens als Haupt-Hintergrundfarbe (seit 28.11.2025)
- **Header-Hintergrund:** `#2c2c2c` (Dunkles Grau) - Einheitlich auf allen Screens
- **Header-Borders:** `rgba(218, 165, 32, 0.2)` - Subtiler goldener Akzent
- **Gold-Akzentfarbe:** `#DAA520` (Gold) - Für alle aktiven Buttons und interaktive Elemente (seit 03.12.2025)
- **Text auf Gold:** `#2c2c2c` (Schwarz) - Für bessere Lesbarkeit auf goldenem Hintergrund

### Gold-Design-System (seit 03.12.2025)
Konsistentes Gold-Design für alle interaktiven Elemente:

**Gold-Buttons (#DAA520):**
- Alle aktiven Toggle-Buttons (Kacheln/Liste)
- Alle primären Aktions-Buttons
- FAB-Buttons (Floating Action Buttons)
- Speichern/Erstellen-Buttons
- Filter-Buttons (aktiv)
- Status-Buttons (aktiv)

**Text auf Gold:**
- Schwarzer Text (`#2c2c2c`) für bessere Lesbarkeit
- Konsistent auf allen goldenen Buttons

**Implementiert auf:**
- ShopScreen, RundgangScreen, WarenkorbScreen, UserScreen
- SchwarzesBrettScreen, WeingueterScreen, StatistikScreen
- WunschlisteScreen, KontaktScreen, InfoBoxScreen
- WeinboerseScreen, MeinWeinregalScreen, DashboardScreen
- AdminShopScreen, AdminOrdersScreen

**Terminologie:**
- "Container" → "Kacheln" umbenannt (benutzerfreundlicher)

### Einheitlicher Header
Alle Screens verwenden jetzt ein konsistentes Header-Design:

**Struktur:**
```
[🍔 Hamburger-Menü] [Titel (zentriert)] [🔔 Benachrichtigungen (wenn eingeloggt)]
```

**Style-Eigenschaften:**
- `backgroundColor: '#2f3a3b'`
- `paddingVertical: 25` (gleichmäßiges Padding oben und unten)
- `height: 155` (fest, erhöht von 135px)
- `borderTopWidth: 1`, `borderBottomWidth: 1`
- `borderTopColor/BottomColor: 'rgba(255, 255, 255, 0.3)'`
- Titel: `fontSize: 28`, `fontWeight: '500'`, `color: '#FFFFFF'`, `textAlign: 'center'`, `letterSpacing: 1` (seit 30.11.2025 - Variante 5)
- Text und Logo vertikal zentriert mit `alignItems: 'center'`

**Hamburger-Menü:**
- 3 weiße Linien (`hamburgerLine`)
- `width: 22`, `height: 2.5`, `marginVertical: 3`
- `backgroundColor: '#FFFFFF'`, `borderRadius: 1.5`

**LogoHeaderContainer (oberhalb der Überschrift):**
- `paddingHorizontal: 20`
- `paddingTop: Platform.OS === 'ios' ? 10 : 40`
- `paddingBottom: 0` (seit 02.12.2025 - auf 0px gesetzt, damit Tagline direkt darunter liegt)
- `alignItems: 'flex-start'`
- Struktur: [Hamburger-Menü + Wunschliste] [Bottle Logo Trade] [Profilbild]

**LogoImageWrapper (seit 02.12.2025):**
- `marginLeft: 6` (reduziert von 12 auf 6 - 50% Reduzierung)
- `marginRight: 6` (reduziert von 12 auf 6 - 50% Reduzierung)
- Kompakteres Design, weniger Abstand zwischen Logo und "Bottle Trade" Text

**Tagline (seit 02.12.2025):**
- Text: "Tausch dich durch die Welt der Weine."
- Position: Direkt unter dem Logo-Header, vor dem Header mit Überschrift
- Styling:
  - `paddingHorizontal: 20`
  - `paddingTop: 0` (direkt unter Logo-Header)
  - `paddingBottom: 12`
  - `fontSize: 14`
  - `color: '#FFFFFF'` mit `opacity: 0.85`
  - `textAlign: 'center'`
  - `letterSpacing: 0.5`
  - `fontStyle: 'italic'`
- Implementiert auf allen Screens im Projekt

**Standardisierte Header-Komponenten (seit 30.11.2025):**
- **HamburgerButton**: 44×44px, borderRadius: 22, marginBottom: 8
- **WishlistButton**: position: 'relative', fontSize: 24 für Herz-Icon
- **ProfileIconContainer**: 45×45px, borderRadius: 22.5, marginBottom: 8, borderWidth: 2
- **ProfileIconText**: fontSize: 25 (standardisiert von 18)
- **Header (Überschrift)**: paddingHorizontal: 20, paddingTop/Bottom: 20, minHeight: 60
- Alle Abstände und Symbolgrößen sind jetzt identisch in allen Screens

### BottomNavigation
Einheitliche Navigationsleiste am unteren Bildschirmrand:

**Buttons:**
1. 🏠 Home
2. 🌐 Weinbörse
3. 🍷 Mein Weinregal
4. 📝 Weinregal befüllen

**Navigation-Logik:**
- **Vor Login:** Alle Buttons (außer Home) → Login-Screen
- **Nach Login:** Buttons → entsprechende Screens
- **Home-Button:**
  - Nicht eingeloggt → `'welcome'` (Welcome-Screen)
  - Eingeloggt → `'dashboard'` (DashboardScreen)

**Style:**
- `backgroundColor: '#2c2c2c'`
- `height: 75`
- `position: 'absolute'`, `bottom: 0`

---

## 📁 Projektstruktur

```
mobile-app/
├── App.js                          # Haupt-Entry-Point, Screen-Routing, Global State
├── components/
│   ├── BottomNavigation.js         # Einheitliche Bottom-Navigation
│   ├── DynamicHamburgerMenu.js   # Hamburger-Menü mit externer Steuerung
│   ├── NotificationBadge.js       # Benachrichtigungs-Badge
│   ├── OptimizedImage.js          # Optimierte Bildkomponente
│   └── ...
├── screens/
│   ├── StartScreen.js
│   ├── DashboardScreen.js
│   ├── AdminDashboardScreen.js
│   ├── NotificationsScreen.js
│   ├── ChatListScreen.js
│   ├── ChatRoomScreen.js
│   ├── StatistikScreen.js         # Ranglisten und Statistiken
│   ├── DatenschutzScreen.js       # Datenschutzerklärung
│   ├── HeaderTestScreen.js        # Überschriften-TestScreen (Admin)
│   ├── ProfilScreen.js
│   ├── AdminSurveysScreen.js
│   ├── SurveyAnswerScreen.js
│   ├── SurveyResultsScreen.js
│   ├── AdminNewsletterScreen.js
│   ├── NewsletterReaderScreen.js
│   ├── AdminSystemMessagesScreen.js
│   ├── SystemMessageReaderScreen.js
│   ├── WunschlisteScreen.js
│   └── WeineScreen.js
├── services/
│   ├── testAuth.js                # Test-Authentication Service (inkl. Auto-Login)
│   ├── testChatData.js            # Test-Chat-Daten
│   ├── geocodingService.js        # PLZ-zu-Koordinaten-Mapping und Entfernungsberechnung
│   ├── wineTypeHelper.js          # Bestimmung von Rot-/Weißwein für Pin-Farben
│   ├── profileImageCache.js       # Profilbild-Caching Service (AsyncStorage)
│   └── database-web.js            # Firestore-Datenbank-Funktionen (inkl. Wunschliste)
├── data/
│   └── germanPostalCodes.json     # Vollständige deutsche PLZ-Datenbank (10.813 PLZ)
├── scripts/
│   ├── importCompletePLZDatabase.js # Script zum Importieren von PLZ-Daten
│   └── buildCompletePLZDatabase.js # Script zum Erstellen der PLZ-Datenbank
├── config/
│   └── firebase-web.js            # Firebase-Konfiguration
├── LoginScreen.js
├── RegisterScreen.js
├── InfoScreen.js
├── ShopScreen.js
├── CommunityScreen.js
├── WeinboerseScreen.js
├── MeinWeinregalScreen.js
├── WeinregalBefuellenScreen.js
├── WeinregalEditScreen.js
├── WeinDetailScreen.js
└── Footer.js
```

---

## 🔄 Durchgeführte Änderungen (UI-Überarbeitung)

### Phase 1: Hintergrundfarbe
- ✅ Alle Screens auf Primärfarbe `#d5dfe0` umgestellt
- ✅ `LinearGradient` Komponenten durch einfache `View`-Komponenten ersetzt (wo nötig)
- ✅ `App.js` Hintergrund angepasst

### Phase 2: Header-Design
- ✅ `WeinboerseScreen.js` als Template für neues Header-Design
- ✅ Header-Höhe um 50% erhöht (zweimal: 60 → 90 → 135)
- ✅ Header auf alle Screens übertragen:
  - DashboardScreen.js
  - MeinWeinregalScreen.js
  - WeinregalBefuellenScreen.js
  - ShopScreen.js
  - CommunityScreen.js
  - AdminDashboardScreen.js
  - NotificationsScreen.js
  - ChatListScreen.js
  - ChatRoomScreen.js
  - ProfilScreen.js
  - AdminSurveysScreen.js
  - SurveyAnswerScreen.js
  - SurveyResultsScreen.js
  - AdminNewsletterScreen.js
  - AdminSystemMessagesScreen.js
  - NewsletterReaderScreen.js
  - SystemMessageReaderScreen.js
  - StartScreen.js
  - WeineScreen.js
  - RegisterScreen.js
  - WeinregalEditScreen.js
  - WeinDetailScreen.js
  - **App.js (Welcome-Screen)** - Header-Bild entfernt, Header hinzugefügt
  - **LoginScreen.js** - Header hinzugefügt
  - **RegisterScreen.js** - Header hinzugefügt
  - **InfoScreen.js** - Header hinzugefügt

**Ausgenommen:**
- `InfoScreen.js` - Nutzt `OptimizedImage` als visuellen Header (designbedingt)

### Phase 3: DynamicHamburgerMenu Integration
- ✅ `DynamicHamburgerMenu.js` erweitert:
  - `renderButton` Prop (standardmäßig `true`)
  - `externalMenuVisible` Prop für externe Steuerung
  - `onMenuToggle` Prop für State-Synchronisation
- ✅ Auf allen Screens integriert mit `renderButton={false}`
- ✅ Hamburger-Button wird manuell im Header gerendert

### Phase 4: BottomNavigation
- ✅ `BottomNavigation.js` erstellt/überarbeitet
- ✅ Login-Logik implementiert:
  - Nicht eingeloggt → Login-Screen
  - Eingeloggt → entsprechende Screens
- ✅ Auf allen Screens hinzugefügt (siehe Liste oben)

### Phase 5: Bug-Fixes
- ✅ Doppeltes Hamburger-Menü behoben (App.js für Login/Register)
- ✅ `isLoggedIn` Prop korrekt weitergegeben
- ✅ Home-Button Navigation angepasst:
  - Nicht eingeloggt → `'welcome'`
  - Eingeloggt → `'dashboard'`
- ✅ Syntax-Fehler behoben (fehlende `</View>` Tags, etc.)

---

## 🔧 Technische Details

### State Management in App.js

**Globale States:**
```javascript
const [currentScreen, setCurrentScreen] = useState('welcome');
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [user, setUser] = useState(null);
const [isAdmin, setIsAdmin] = useState(false);
const [unreadNotifications, setUnreadNotifications] = useState(0);
const [chats, setChats] = useState([]);
const [messages, setMessages] = useState({});
const [isMenuVisible, setIsMenuVisible] = useState(false); // Für Welcome-Screen
```

### Navigation Handler
```javascript
const handleNavigate = (screen, params = null) => {
  setCurrentScreen(screen);
  setRoute({ params });
  // ... weitere Logik
};
```

### Screen-Routing
Screens werden durch `if (currentScreen === 'screen-name')` gerendert.  
**Wichtig:** `'home'` und `'dashboard'` führen beide zum `DashboardScreen`.

---

## 📱 Screen-Übersicht

### Haupt-Screens (mit Header & BottomNavigation)
1. **Welcome/App.js** - Startbildschirm mit Login/Register-Optionen
2. **LoginScreen** - Anmeldung (mit "Remember Me" Checkbox)
3. **RegisterScreen** - Registrierung
4. **InfoScreen** - App-Informationen
5. **DashboardScreen** - Haupt-Dashboard (nach Login)
6. **WeinboerseScreen** - Weinbörse/Marktplatz
7. **MeinWeinregalScreen** - Nutzer-Weinregal
8. **WeinregalBefuellenScreen** - Wein hinzufügen
9. **MeinWeinregalBefuellenKIScreen** - Wein hinzufügen mit KI-Analyse (Admin)
10. **ShopScreen** - Bottle-Trade-Shop
11. **CommunityScreen** - Community-Bereich
12. **UserScreen** - User-Übersicht (Community-Bereich)
13. **SchwarzesBrettScreen** - Schwarzes Brett mit Inseraten (Ich suche / Ich biete)
14. **WunschlisteScreen** - Weinwünsche verwalten mit automatischem Matching
15. **StartScreen** - Startseite
16. **WeingueterScreen** - Weingüter-Übersicht mit Container- und Listenansicht
17. **StatistikScreen** - Ranglisten (Top10 Trader, Top10 Städte, Top10 Bundesländer)
18. **DatenschutzScreen** - Datenschutzerklärung (DSGVO-konform)

### Detail-Screens
- **WeinDetailScreen** - Einzelne Wein-Details
- **WeinregalEditScreen** - Wein bearbeiten

### Admin-Screens
- **AdminDashboardScreen** - Admin-Dashboard
- **AdminSurveysScreen** - Umfragen verwalten
- **AdminNewsletterScreen** - Newsletter verwalten
- **AdminSystemMessagesScreen** - Systemnachrichten verwalten

### Feature-Screens
- **NotificationsScreen** - Benachrichtigungen
- **ChatListScreen** - Chat-Übersicht
- **ChatRoomScreen** - Einzelner Chat
- **ProfilScreen** - Nutzer-Profil
- **SurveyAnswerScreen** - Umfrage beantworten
- **SurveyResultsScreen** - Umfrage-Ergebnisse
- **NewsletterReaderScreen** - Newsletter lesen
- **SystemMessageReaderScreen** - Systemnachricht lesen
- **WeineScreen** - Weine-Übersicht
- **ImpressumScreen** - Impressum-Informationen (mit Vermittlerrolle und Altersbeschränkung)
- **KontaktScreen** - Kontakt-Informationen (E-Mail, Instagram, Telefon)
- **DatenschutzScreen** - Datenschutzerklärung (DSGVO-konform)
- **StatistikScreen** - Ranglisten und Statistiken
- **RundgangScreen** - Digitaler Rundgang (Vorbereitung)
- **InfoBoxScreen** - WhatsApp-ähnliche Liste aller Notifications und Chats (mit Support-Button)

---

## 🔐 Authentication & Benutzer-Management

**Service:** `services/testAuth.js`

**Funktionen:**
- `loginUser(emailOrUsername, password, rememberMe = false)` - Login mit optionaler Session-Persistenz
- `registerUser(email, password, userData)`
- `logoutUser()` - Löscht Session beim Logout
- `getCurrentUser()`
- `onAuthStateChange(callback)`
- `restoreSession()` - Stellt Session beim App-Start wieder her (Auto-Login)

**Login-Logik:**
- Automatische Weiterleitung nach erfolgreichem Login zu `'home'` (Dashboard)
- Admin-Status wird erkannt und gesetzt
- Logout führt zurück zu `'welcome'`
- **Auto-Login**: Wenn "Remember Me" aktiviert ist, wird Session in AsyncStorage gespeichert
- **Session-Persistenz**: Session bleibt 30 Tage gültig, wird beim App-Start automatisch wiederhergestellt
- **Sicherheit**: Kein Passwort wird gespeichert, nur User-ID

---

## 📊 Daten-Management

### Chat-System
- **Speicherung:** AsyncStorage (`'bottle-trade-chats'`, `'bottle-trade-messages'`)
- **State:** `chats` (Array), `messages` (Object mit chatId als Key)
- **Features:**
  - Chat-Liste
  - Direkte Chats aus Weinbörse
  - Nachrichten-Verwaltung
  - Gelesen/Ungelesen Status

### Wein-Management
- **Firebase Firestore** für Persistenz
- **Lokale State-Verwaltung** für Performance
- Funktionen in verschiedenen Screens implementiert
- **PLZ-basierte Entfernungsanzeige**: Weine zeigen Entfernung vom eingeloggten User ("Circa X km von dir entfernt")
- **OwnerZipCode**: Jeder Wein speichert die PLZ des Besitzers für Entfernungsberechnung
- **Automatisches Backfill**: Alte Weine ohne PLZ werden automatisch mit PLZ des Besitzers aktualisiert

### Benachrichtigungen
- System-Benachrichtigungen
- Survey-Benachrichtigungen
- Newsletter-Benachrichtigungen
- Chat-Benachrichtigungen
- **Admin-Benachrichtigungen**: Automatische Notifications für Admins bei neuen Registrierungen
- Ungelesen-Counter (`unreadNotifications`)

### Wunschliste
- **Firebase Firestore** für Persistenz (`users/{userId}/wishlist/{wishId}`)
- **Flexible Wunsch-Eingabe**: Alle Felder optional (Name, Weingut, Jahrgang, Region, Rebsorte, Notizen)
- **Automatisches Matching**: Prüft gegen alle öffentlichen Weine in der Weinbörse
- **Herz-Icon Badge**: Rotes gefülltes Herz `❤️` zeigt Matches an, leeres Herz `♡` wenn keine Matches
- **Echtzeit-Updates**: Firestore-Subscription für Live-Updates
- **Match-Status**: Wird in Firestore gespeichert (`hasMatch`, `matchedWineIds`)

### Admin-Benachrichtigungen
- **Automatische Benachrichtigungen**: Admins erhalten Notifications bei neuen Registrierungen
- **System-Notifications**: Typ `system` mit Titel "Neue Registrierung"
- **Metadaten**: Enthält User-ID, Username, E-Mail für schnelle Reaktion
- **Badge-Anzeige**: Notifications erscheinen automatisch im Badge am InfoBox-Icon

### Support-System
- **Support-Button**: FAB-Button (💬) in der InfoBox (rechte untere Ecke)
- **Direkter Kontakt**: Erstellt automatisch Support-Chat mit Admin
- **Duplikat-Prävention**: Prüft auf existierende Support-Chats
- **System-Nachricht**: Automatische Begrüßungsnachricht beim Erstellen

---

## 🐛 Bekannte Probleme / To-Do

### Aktuelle Fehler:
- ✅ Alle bekannten Syntax-Fehler behoben

### Gelöste Probleme:
- ✅ Welcome-Screen Button-Layout optimiert
- ✅ Header-Höhe angepasst (155px)
- ✅ Buttons gleichmäßig über Content-Bereich verteilt
- ✅ Background unterhalb der Buttons entfernt
- ✅ Button-Text Zeilenumbruch verhindert
- ✅ Content-Bereich Positionierung korrigiert

---

## 📝 Entwickler-Notizen

### Wichtige Konventionen:
1. **Screen-Namen:** Verwende konsistente Screen-Namen (z.B. `'weinboerse'`, `'mein-weinregal'`)
2. **Props-Weitergabe:** `isLoggedIn`, `onNavigate`, `isAdmin` sollten an alle relevanten Screens weitergegeben werden
3. **Header-Integration:** Alle neuen Screens sollten das einheitliche Header-Design verwenden
4. **BottomNavigation:** Immer `isLoggedIn` und `onNavigate` Props übergeben

### Beim Hinzufügen neuer Screens:
1. Header-Struktur mit Hamburger, Titel, Benachrichtigung hinzufügen
2. `DynamicHamburgerMenu` mit `renderButton={false}` integrieren
3. `BottomNavigation` am Ende hinzufügen
4. `isLoggedIn` und `onNavigate` Props akzeptieren
5. Hintergrundfarbe `#2c2c2c` verwenden

### Testing:
- Expo Server läuft auf Port 8081 mit Tunnel-Modus
- `npx expo start --tunnel --clear --port 8081`

---

## 🔄 Backup-Informationen

**Letztes Backup:**
- **Datei:** `Backup_20251202_132034.tar.gz`
- **Datum:** 02. Dezember 2025, 13:20:34
- **Speicherort:** `/home/bottleadmin/bottle-trade-mobile/`
- **Inhalt:** Vollständiger Projektstand nach KI-Screen-Implementierung

**Backup-Befehl:**
```bash
cd /home/bottleadmin/bottle-trade-mobile
tar -czf "backup_$(date +%Y%m%d_%H%M%S).tar.gz" --exclude='node_modules' --exclude='.git' --exclude='*.log' --exclude='backup_*.tar.gz' .
```

---

## 📞 Nützliche Befehle

### Expo Server starten:
```bash
cd /home/bottleadmin/bottle-trade-mobile/mobile-app
npx expo start --tunnel --clear --port 8081
```

### Backup erstellen:
```bash
cd /home/bottleadmin/bottle-trade-mobile
tar -czf "backup_$(date +%Y%m%d_%H%M%S).tar.gz" --exclude='node_modules' --exclude='.git' --exclude='*.log' --exclude='backup_*.tar.gz' .
```

### Backup wiederherstellen:
```bash
cd /home/bottleadmin/bottle-trade-mobile
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
```

---

## 🎯 Nächste Schritte / Empfehlungen

1. ✅ Syntax-Fehler in App.js beheben (ScrollView)
2. ⚠️ Weitere Konsistenz-Checks durchführen
3. ⚠️ Performance-Optimierungen prüfen
4. ⚠️ Dokumentation der Firebase-Struktur
5. ⚠️ Unit-Tests hinzufügen (optional)

---

## 🚧 Notifications Refactor – Phase 0 (11. November 2025)

- **Status:** Phase gestartet; Instrumentierung steht noch aus.
- **Aktive Flags:** keine (`ENABLE_NOTIFICATION_DEBUG` ist geplant, derzeit inaktiv).
- **Smoke-Tests (offen):** App-Start, Login/Logout, Trade-Request-Erstellung, Chat-Nachricht senden.
- **Backup:** `backup_20251111_phase0.tar.gz` am 11. Nov 2025 erstellt (ohne `node_modules`, `.git`, Logs).
- **Branch:** `notifications-refactor-plan` von `master` abgezweigt und aktiv; bestehende Änderungen übernommen.
- **Hinweis für nächste Session:** Smoke-Test-Checkliste finalisieren, Debug-Flag-Vorbereitung einplanen, neue Branch-Snapshots regelmäßig sichern.

---

## 🚧 Notifications Refactor – Phase 1 (laufend)

- **Status:** Instrumentierung gestartet (11. November 2025).
- **Debug-Konfiguration:** `ENABLE_NOTIFICATION_DEBUG` via `config/featureFlags.js` (`EXPO_PUBLIC_NOTIFICATION_DEBUG`).
- **Implementiert:**
  - `services/notificationLogger.js` stellt `logNotificationEvent` bereit (Legacy-Signatur bleibt nutzbar).
  - `App.js` loggt strukturierte Events (Subscriptions, Badge-Berechnung, `ensureTradeNotification`, `createTradeDecisionHints`, Chat-Messaging, Chat-Lifecycle).
  - `services/database-web.js` ergänzt Firestore CRUD-Pfade um Debug-Events.
- **ToDos:** Weitere kritische Pfade (z. B. `createTradeDecisionHints`, Chat-Messaging) instrumentieren, erste Log-Samples erfassen & dokumentieren.

**Phase 2 - Fix-Implementierung (12. November 2025):**
- ✅ **Phase 2.1:** Race Condition Fix für Chat-Notifications (Firestore-Fallback wenn Chat nicht im State)
- ✅ **Phase 2.2:** Badge-Berechnung Fix (`extraChatNotifications` berücksichtigt `unreadCount`)

**Wichtige Fixes:**
- ✅ Chat-Notifications werden korrekt erstellt, auch wenn Chat noch nicht im State ist
- ✅ Badge-Berechnung korrigiert: Notifications für Chats mit `unreadCount = 0` werden korrekt gezählt
- ✅ Badge erscheint an der Glocke (nicht mehr an der Glühbirne)
- ✅ Notification wird automatisch gelöscht, wenn Chat geöffnet wird

**Dokumentation:** Siehe `mobile-app/docs/NOTES_NOTIFICATIONS.md` für detaillierte Logs und Beobachtungen.

---

## 🚧 Notification-System Refactor – Vollständiger Neuaufbau (12. November 2025)

**Status:** Planungsphase abgeschlossen, bereit für Umsetzung  
**Backup:** `Backup_Notification_Refactor_20251112_144034.tar.gz` (84 MB)  
**Plan-Dokument:** `mobile-app/docs/PLAN_NOTIFICATION_REFACTOR.md`

### Überblick

Das Notification-System wird komplett neu aufgebaut mit folgenden Zielen:
- **Vereinheitlichung:** Nur noch eine Notification-Art (keine Trennung zwischen Chats, Hinweisen, etc.)
- **Vereinfachung:** Klare, fehlerresistente Architektur
- **Robustheit:** Transparente Datenflüsse, keine Redundanzen
- **Erweiterbarkeit:** Leicht erweiterbar für zukünftige Features

### Wichtige Architektur-Entscheidungen

1. **Trade-Requests sind die Basis:**
   - Chats und Hinweise entstehen durch akzeptierte Trade-Requests
   - Bei Trade-Akzeptierung werden automatisch Chat, Hinweis und entsprechende Notifications erstellt
   - Trade-Request-Integration ist **nicht optional**, sondern Kern des Systems

2. **InfoBox wird zu einem Screen:**
   - Kein Popup mehr, sondern vollständiger Screen (`InfoBoxScreen.js`)
   - Direkter Aufruf über BottomNavigation-Button (📰 Newspaper)
   - WhatsApp-ähnliche Liste aller Notifications
   - Badge am Newspaper-Button zeigt Gesamtanzahl ungelesener Notifications

3. **WhatsApp-ähnliche UI:**
   - InfoBoxScreen, ChatListScreen und HinweisScreen verwenden gleiches Layout
   - Liste mit Bild/Icon, Titel, Nachricht, Zeitstempel, Badge
   - Farbcodierung nach Notification-Typ (chat, trade, system, hint)
   - Siehe: `mobile-app/docs/PLAN_WHATSAPP_UI.md`

### Neue Datenstruktur

**Firestore: `users/{userId}/notifications/{notificationId}`**
- Einheitliche Notification mit `type`-Feld (`chat`, `trade`, `system`, `hint`)
- Typ-spezifische Metadata (chatId, tradeRequestId, hintId, etc.)
- Firestore als Single Source of Truth

### Event-Trigger

1. **Trade-Request erstellt** → `type: 'trade'` Notification
2. **Trade-Request akzeptiert** → `type: 'chat'` + `type: 'hint'` Notifications
3. **Trade-Request abgelehnt** → Lösche `type: 'trade'` Notifications
4. **Chat-Nachricht** → `type: 'chat'` Notification (wenn Chat nicht geöffnet)
5. **Hinweis** → `type: 'hint'` Notification
6. **System-Nachricht** → `type: 'system'` Notification

### Zeitplan

- **Phase 1:** Backup & Analyse (✅ abgeschlossen)
- **Phase 2:** Code-Bereinigung (2-3h)
- **Phase 3:** Neue Datenstruktur (1-2h)
- **Phase 4:** Core-Services (3-4h)
- **Phase 5:** UI-Integration (2-3h)
- **Phase 6:** Event-Trigger (2-3h)
- **Phase 7:** Testing & Optimierung (2-3h)
- **Phase 8:** Trade-Request-Integration (2-3h)

**Gesamtzeit:** ~17-24 Stunden (2-3 Arbeitstage)

### Nächste Schritte

1. Code-Bereinigung starten (alte Notification-Logik entfernen)
2. Neue Services implementieren (`notificationService.js`, `chatNotificationHandler.js`, `tradeNotificationHandler.js`)
3. InfoBoxScreen erstellen (WhatsApp-ähnliche Liste)
4. BottomNavigation anpassen (direkter Screen-Aufruf, Badge am Newspaper-Button)
5. Trade-Request-Event-Trigger implementieren

**Detaillierte Dokumentation:** Siehe `mobile-app/docs/PLAN_NOTIFICATION_REFACTOR.md`

---

## 🚧 Notification-System – Kritische Fixes (19. November 2025)

**Status:** Implementiert und getestet  
**Backup:** `backup_20251119_221712.tar.gz` (2.97 GB)  
**Datum:** 19. November 2025, 22:17 Uhr

### Behobene Probleme

#### 1. Notification verschwindet beim Sender nach dem Zurück-Button
**Problem:** Beim Verlassen des Chat-Rooms wurden alle Notifications für diesen Chat als gelesen markiert, auch die des Senders (die eigentlich nicht existieren sollten).

**Lösung:** 
- Logik in `handleNavigate` angepasst, sodass nur eigene Notifications des aktuellen Users als gelesen markiert werden
- Prüfung auf `toUserId` hinzugefügt, um Notifications für andere User nicht zu markieren
- Code: `App.js` Zeilen ~1205-1249

#### 2. Keine Notification beim Empfänger nach dem Senden einer Nachricht
**Problem:** 
- Blockierende Prüfung in `addMessage` verhinderte Notification-Erstellung, wenn der aktuelle User der Sender war
- Filterlogik in `getNotificationsForUser` filterte Chat-Notifications fälschlicherweise heraus

**Lösung:**
- Blockierende Prüfung in `addMessage` entfernt - Notification wird jetzt immer für den Empfänger (`toUserId`) erstellt
- Filterlogik in `database-web.js` angepasst: Chat-Notifications mit `toUserId === userId` werden nicht mehr herausgefiltert
- Code: `App.js` Zeilen ~1817-1869, `database-web.js` Zeilen ~2066-2087

#### 3. Duplikate beim Antworten
**Problem:** Notifications wurden sowohl in `addMessage` (beim Senden) als auch in `createNotificationsForNewMessages` (über Subscription) erstellt, was zu Duplikaten führte.

**Lösung:**
- Neue Funktion `findAnyChatNotification` in `database-web.js` erstellt, die ALLE Chat-Notifications (auch gelesene) für einen Chat zurückgibt
- Beide Funktionen (`addMessage` und `createNotificationsForNewMessages`) prüfen jetzt mit `fsFindAnyChatNotification`, ob bereits eine Notification existiert, bevor sie eine neue erstellen
- Code: `database-web.js` Zeilen ~2298-2330, `App.js` Zeilen ~1573-1594, ~1880-1899

### Technische Details

**Neue Funktion:**
```javascript
export const findAnyChatNotification = async (userId, chatId)
```
- Findet ALLE Chat-Notifications für einen Chat (auch gelesene)
- Wird verwendet, um Duplikate zu vermeiden
- Gibt die erste gefundene Notification zurück (sollte nur eine pro Chat geben)

**Geänderte Logik:**
1. **Notification-Erstellung für Empfänger:**
   - `addMessage` erstellt Notification für `toUserId` (Empfänger), nicht für `currentUserId` (Sender)
   - Keine Blockierung mehr, wenn der aktuelle User der Sender ist

2. **Duplikat-Prävention:**
   - Prüfung auf bestehende Notifications erfolgt in beiden Funktionen (`addMessage` und `createNotificationsForNewMessages`)
   - Zuerst wird auf ungelesene Notifications geprüft, dann auf alle (auch gelesene)
   - Wenn eine existiert, wird sie aktualisiert statt eine neue zu erstellen

3. **Filterlogik:**
   - Chat-Notifications mit `toUserId === userId` werden nicht mehr herausgefiltert
   - Sender bekommen weiterhin keine Notifications von eigenen Nachrichten

### Chat-Fixes

#### 4. Chat verschwindet nach der ersten Nachricht
**Problem:** Chat verschwand nach dem Senden der ersten Nachricht, weil wichtige Felder (`entryType`, `participants`, `type`) beim Update nicht beibehalten wurden.

**Lösung:**
- Fallback in `addMessage` hinzugefügt, um Chat aus Firestore zu laden, wenn er nicht im State ist
- `addChatMessage` in `database-web.js` aktualisiert, um `entryType`, `participants` und `type` beim Update beizubehalten
- Code: `App.js` Zeilen ~1741-1758, `database-web.js` Zeilen ~1773-1785

#### 5. "Tauschanfrage von..." wird nicht gelöscht nach Akzeptierung
**Problem:** `hint-decision` Notifications ("Tauschanfrage von...") wurden nicht gelöscht, nachdem die Tauschanfrage akzeptiert wurde.

**Lösung:**
- `fsDeleteNotificationsForTradeRequest` wird jetzt für beide User (`fromUserId` und `toUserId`) aufgerufen, um alle Notifications für diesen `tradeRequestId` zu löschen
- Code: `App.js` Zeilen ~4143-4151

#### 6. Chat-Eintrag verschwindet nach der ersten Nachricht
**Problem:** Chat wurde mit falschem `type` erstellt (`'hint-decision'` statt `'chat'`), was dazu führte, dass er nicht korrekt gefiltert wurde.

**Lösung:**
- `type` und `entryType` werden explizit auf `'chat'` gesetzt beim Erstellen eines neuen Chats nach Akzeptierung
- Code: `App.js` Zeilen ~4271, ~4274

### InfoBoxScreen Header-Design

**Änderungen:**
- Header-Struktur angepasst, um mit `WeinboerseScreen` und `MeinWeinregalScreen` übereinzustimmen
- Logo-Header mit "Bottle [Logo] Trade" Struktur hinzugefügt
- Goldgelbe Überschrift (`#DAA520`)
- Hintergrundfarbe auf `#2c2c2c` (wie BottomNavigation) geändert
- StatusBar-Ersatz für iOS hinzugefügt
- Code: `InfoBoxScreen.js` Zeilen ~1-150

### InfoBoxScreen Chat-Integration (19. November 2025)

**Status:** Implementiert  
**Backup:** `backup_20251119_224443.tar.gz` (2.97 GB)  
**Datum:** 19. November 2025, 22:44 Uhr

#### Implementierte Features

1. **Chats werden in InfoBoxScreen angezeigt (WhatsApp-ähnlich):**
   - Chats werden als Prop an InfoBoxScreen übergeben
   - Chats werden mit Notifications kombiniert in `combinedEntries`
   - Chats ohne Notification werden als "gelesene" Chat-Entries angezeigt
   - Chats bleiben sichtbar, auch wenn keine Notification existiert
   - Code: `InfoBoxScreen.js` Zeilen ~124-181, `App.js` Zeilen ~4790-4798

2. **Chat-Entries können gelöscht werden:**
   - `handleArchive` ruft `deleteChat` auf, wenn es ein Chat-Entry ist
   - Der Chat wird als gelöscht markiert (userId wird zu `deletedBy` hinzugefügt)
   - Der Chat verschwindet automatisch aus der Liste
   - Code: `InfoBoxScreen.js` Zeilen ~376-404

3. **Filterlogik für Chat-Notifications korrigiert:**
   - `subscribeNotificationsForUser` prüft jetzt auch `isChatNotificationForThisUser` im Filter für neue Notifications
   - Chat-Notifications für den Empfänger werden nicht mehr herausgefiltert
   - Code: `database-web.js` Zeilen ~2196-2225

#### Bekannte Probleme / To-Do

- ✅ Chat muss 2x geswiped werden, um gelöscht zu werden (sollte nur 1x sein) - **BEHOBEN**
- ✅ Wenn einer den Chat löscht, soll beim anderen "Chat verlassen" angezeigt werden - **IMPLEMENTIERT**
- ✅ "Chat verlassen" Einträge sollen im ersten Versuch gelöscht werden können - **IMPLEMENTIERT**

---

## 🚧 Chat- und Hinweis-Persistenz-Fixes (24. November 2025)

**Status:** Implementiert und getestet  
**Backup:** `Backup_20251124_204745.tar.gz` (160 MB)  
**Datum:** 24. November 2025, 20:47 Uhr

### Behobene Probleme

#### 1. Chat verschwindet nach dem Senden einer Nachricht
**Problem:** Chat verschwand aus der Chatliste, nachdem eine Nachricht gesendet wurde, obwohl er existieren sollte.

**Ursachen:**
- `updateChat` Funktion entfernte kritische Felder (`entryType`, `participants`) beim Update
- `InfoBoxScreen` erhielt keine `chats` Prop von `App.js`
- Filterlogik filterte Chats heraus, wenn kritische Felder fehlten

**Lösung:**
- `updateChat` in `database-web.js` angepasst: Behält jetzt explizit `entryType`, `participants` und `type` beim Update
- `chats={chats}` Prop zu `InfoBoxScreen` in `App.js` hinzugefügt
- Validierungslogik in `InfoBoxScreen.js` verbessert: Prüft, ob `participants` existiert, bevor `.find()` aufgerufen wird
- Code: `database-web.js` Zeilen ~1758-1803, `App.js` Zeile ~4551, `InfoBoxScreen.js` Zeilen ~376-385

#### 2. Hinweise verschwinden nach dem Senden einer Nachricht
**Problem:** Hinweis-Notifications (`hint-decision`, `hint-small`) verschwanden, nachdem eine Nachricht im Chat gesendet wurde.

**Ursachen:**
- `markChatAsRead` löschte alle Notifications mit `chatId`, unabhängig vom Typ
- `deleteNotificationsForChat` löschte alle Notifications mit `chatId`, auch Hinweis-Notifications

**Lösung:**
- `markChatAsRead` in `App.js` angepasst: Löscht nur Chat-Notifications (`type === 'chat'`), nicht Hinweis-Notifications
- `deleteNotificationsForChat` in `database-web.js` angepasst: Filtert jetzt nach `type === 'chat'` in der Query
- Code: `App.js` Zeilen ~2067-2097, `database-web.js` Zeilen ~2857-2863

#### 3. System-Nachricht beim Chat-Erstellen
**Feature:** Beim Erstellen eines neuen Chats nach Akzeptierung eines Tausches wird automatisch eine System-Nachricht hinzugefügt.

**Implementierung:**
- System-Nachricht beschreibt den Tausch: "Dies ist der Chat zum Tausch zwischen [User1] und [User2] mit den Weinen "[Wein1]" von [User1] und "[Wein2]" von [User2]."
- Nachricht wird mit `senderId: 'system'` und `isSystemMessage: true` markiert
- Code: `App.js` Zeilen ~4045-4062

#### 4. Hinweis-Notifications werden nach Akzeptierung gelöscht
**Feature:** Alle Hinweis-Notifications für einen Tausch werden automatisch gelöscht, nachdem der Chat erstellt wurde.

**Implementierung:**
- `fsDeleteNotificationsForTradeRequest` wird für beide User aufgerufen, um alle Hinweis-Notifications zu löschen
- Lokaler State wird sofort aktualisiert, damit Hinweise sofort verschwinden
- Funktioniert sowohl für neue als auch für bestehende Chats
- Code: `App.js` Zeilen ~4064-4095

### Badge-Berechnung Erweiterungen

#### 5. Badge zählt jetzt auch ungelesene Chats
**Feature:** Das Badge zählt nicht nur ungelesene Notifications, sondern auch ungelesene Chats.

**Implementierung:**
- Ein Chat gilt als ungelesen, wenn:
  - `unreadCount > 0` ODER
  - User nicht in `readBy` ist UND keine Notification für diesen Chat existiert
- Duplikate werden vermieden: Wenn ein Chat eine Notification hat, zählt nur die Notification
- Code: `App.js` Zeilen ~2449-2479

#### 6. Badge unterscheidet zwischen eigenen und fremden Nachrichten
**Feature:** Das Badge wird nicht erhöht, wenn die letzte Nachricht von mir selbst stammt.

**Implementierung:**
- Chat-Notifications werden herausgefiltert, wenn `senderId` oder `fromUserId` gleich `currentId` ist
- Ungelesene Chats werden herausgefiltert, wenn `lastMessageSenderId` gleich `currentId` ist
- Prüfung auch in `messages[chat.id]` für die letzte Nachricht
- Code: `App.js` Zeilen ~2429-2446, ~2462-2474

#### 7. Badge für "Chat verlassen" Notifications
**Feature:** Wenn ein Chat-Partner den Chat löscht/verlässt, bekommt der andere Partner eine Notification und ein Badge.

**Implementierung:**
- Notification wird mit `type: 'hint-small'` erstellt
- Enthält `fromUserId` (derjenige, der den Chat verlassen hat) und `toUserId` (derjenige, der die Notification bekommt)
- Derjenige, der den Chat verlassen hat, bekommt keine Notification
- Code: `App.js` Zeilen ~2247-2260

### Technische Details

**Geänderte Funktionen:**
1. **`updateChat` (database-web.js):**
   - Behält jetzt explizit `entryType`, `participants` und `type` beim Update
   - Verwendet `...existingData` als Basis, dann `...updates` für neue Werte
   - Stellt sicher, dass kritische Felder nie verloren gehen

2. **`refreshNotificationBadges` (App.js):**
   - Zählt jetzt auch ungelesene Chats
   - Filtert eigene Nachrichten heraus
   - Berücksichtigt `messages` State für aktuelle Nachrichten

3. **`deleteNotificationsForChat` (database-web.js):**
   - Filtert jetzt nach `type === 'chat'` in der Query
   - Löscht keine Hinweis-Notifications mehr

4. **`markChatAsRead` (App.js):**
   - Löscht nur Chat-Notifications, nicht Hinweis-Notifications
   - Behält Hinweis-Notifications für manuelle Löschung

**Neue Features:**
- System-Nachricht beim Chat-Erstellen
- Automatisches Löschen von Hinweis-Notifications nach Akzeptierung
- Badge-Berechnung für ungelesene Chats
- Badge-Berechnung unterscheidet eigene/fremde Nachrichten

---

## 🔍 Analyse-Dokumente: Bekannte Probleme und Lösungen

### Duplikat-Notifications Problem (19. November 2025)

**Problem-Beschreibung:**
Es werden Duplikat-Notifications erstellt, obwohl bereits Schutzmechanismen implementiert sind.

**Identifizierte Probleme:**

1. **Initial Load Detection fehlt in `subscribeChatMessages`**
   - Beim ersten Snapshot werden ALLE existierenden Nachrichten als `'added'` erkannt
   - Dies führt dazu, dass `createNotificationsForNewMessages` für alle Nachrichten aufgerufen wird
   - **Lösung:** Initial Load Detection implementieren (ähnlich wie bei `subscribeNotificationsForUser`)

2. **Mehrfache Subscriptions für denselben Chat**
   - Subscription wird an zwei verschiedenen Stellen eingerichtet
   - Beide Subscriptions rufen `createNotificationsForNewMessages` auf
   - **Lösung:** Prüfung `if (!messageSubscriptionsRef.current[chatId])` sollte verhindern, dass mehrere Subscriptions eingerichtet werden

3. **Race Condition zwischen mehreren `createNotificationsForNewMessages` Aufrufen**
   - `pendingNotificationCreationsRef` verhindert Race Conditions, aber könnte unvollständig sein
   - **Lösung:** Atomare Prüfung in `createNotification` selbst implementieren

4. **`findAnyChatNotification` findet keine Duplikate mit verschiedenen `chatId`s**
   - Sucht nur nach Notifications mit dem gleichen `chatId`
   - **Lösung:** Prüfung erweitern: Suche nach Notifications mit gleichem `senderId`/`fromUserId` UND `toUserId` UND `type === 'chat'`

5. **Notifications für gelöschte Chats werden nicht gefiltert**
   - Notifications für gelöschte Chats werden angezeigt
   - **Lösung:** Notifications beim Löschen des Chats automatisch löschen

**Status:** Die meisten Probleme wurden durch die Fixes vom 19. November 2025 behoben (siehe Changelog).

---

### Duplikate nach Löschung von Chats/Hints (20. November 2025)

**Problem:** Nach dem Löschen von Chats/Hints durch Admin werden Duplikate erstellt, obwohl Firestore leer ist.

**Identifizierte Fehler:**

1. **Keine Initial Load Detection in Trade-Request-Subscriptions**
   - Beim App-Start werden ALLE bestehenden Trade-Requests als `change.type === 'added'` behandelt
   - Dies führt dazu, dass `ensureTradeNotification` für jeden Trade-Request aufgerufen wird
   - **Lösung:** Initial Load Detection für Trade-Request-Subscriptions hinzufügen

2. **`ensureTradeNotification` prüft nicht auf physisch gelöschte Chats/Hints**
   - Wenn ein Chat/Hint vom Admin physisch gelöscht wurde, existiert er nicht mehr in Firestore
   - Die Query findet den gelöschten Chat/Hint nicht
   - Ein neuer Chat/Hint wird erstellt
   - **Lösung:** Prüfung auf bereits existierende Chats in `ensureTradeNotification`

3. **`deleteChat` gibt `{ deleted: false }` zurück, wenn Chat nicht existiert**
   - Wenn ein Chat/Hint vom Admin physisch gelöscht wurde, existiert er nicht mehr in Firestore
   - `deleteChat` gibt `{ deleted: false }` zurück, aber es gibt keine weitere Behandlung
   - **Lösung:** Verbesserte Behandlung für nicht existierende Chats

4. **Trade-Request-Subscription prüft nicht auf bereits behandelte Trade-Requests**
   - Die Subscription prüft nur auf `change.type === 'added'` und `data.status === 'pending'`
   - Sie prüft NICHT, ob für diesen Trade-Request bereits ein Chat/Hint existiert
   - **Lösung:** Prüfung auf Trade-Request-Status und bereits existierende Chats/Hints

5. **`ensureTradeNotification` prüft nicht, ob Trade-Request bereits einen Chat hat**
   - Prüft nur auf Hints mit `tradeRequestId`
   - Es prüft NICHT, ob bereits ein Chat (nicht Hint) für diesen Trade-Request existiert
   - **Lösung:** Prüfung auf bereits existierende Chats hinzufügen

**Zusammenfassung der Hauptprobleme:**
1. Keine Initial Load Detection: Trade-Request-Subscriptions behandeln alle bestehenden Trade-Requests als "neu"
2. Keine Prüfung auf physisch gelöschte Chats/Hints: `ensureTradeNotification` findet gelöschte Chats/Hints nicht
3. Keine Prüfung auf bereits existierende Chats: Wenn bereits ein Chat existiert, sollte kein Hint erstellt werden
4. Keine Prüfung auf Trade-Request-Status: Trade-Requests, die bereits behandelt wurden, sollten nicht erneut behandelt werden

**Status:** Diese Probleme wurden teilweise durch die Admin-Bereich Änderungen vom 25. November 2025 behoben (physische Löschung aus Firestore).

---

### Firebase Auth Error: "Component auth has not been registered yet" (Datum unbekannt)

**Problem:**
Die App zeigt folgende Fehler:
- `[runtime not ready]: Error: Component auth has not been registered yet`
- `App entry not found`

**Lösung:**

1. **Expo-Server stoppen**
   ```bash
   pkill -f "expo start"
   ```

2. **Cache leeren**
   ```bash
   cd mobile-app
   rm -rf node_modules/.cache
   rm -rf .expo
   rm -rf dist
   ```

3. **App neu starten**
   ```bash
   npx expo start --clear
   ```

4. **Falls das Problem weiterhin besteht:**
   - Node Modules neu installieren: `rm -rf node_modules && npm install`
   - Metro-Bundler-Cache leeren: `npx expo start --clear --reset-cache`

5. **Storage Rules prüfen**
   - Firebase Console öffnen: [Firebase Console](https://console.firebase.google.com/)
   - Projekt: `bottle-trade-app`
   - Storage > Rules aktualisieren (für Entwicklung: öffentlicher Zugriff erlaubt)

**Wichtig:**
- Firebase Auth wird **nicht** verwendet, da die App ein Test-Auth-System nutzt
- Die Storage Rules erlauben momentan **öffentlichen Zugriff** (nur für Entwicklung!)

**Status:** Problem sollte durch Cache-Leeren behoben sein.

---

## 📚 Zusätzliche Informationen

### Komponenten-Details

**DynamicHamburgerMenu:**
- Unterstützt externe Menü-Steuerung
- `renderButton={false}` für manuelle Button-Integration im Header
- Props: `externalMenuVisible`, `onMenuToggle`, `onNavigate`, `isLoggedIn`, `isAdmin`, `unreadNotifications`

**BottomNavigation:**
- Immer sichtbar (auch vor Login)
- Intelligente Navigation basierend auf Login-Status
- Home-Button mit spezieller Logik (welcome/dashboard)

**NotificationBadge:**
- Zeigt Anzahl ungelesener Benachrichtigungen
- Klickbar für Navigation zu NotificationsScreen

---

## 🔄 Changelog

### 03. Dezember 2025, 09:32 Uhr - Konsistentes Gold-Design, Admin-Verbesserungen, Google Maps Pins, Versandkosten-Fix
- ✅ **Konsistentes Gold-Design (#DAA520)**: Alle aktiven Buttons und interaktive Elemente verwenden jetzt Gold mit schwarzem Text
  - ShopScreen, RundgangScreen, WarenkorbScreen, UserScreen
  - SchwarzesBrettScreen, WeingueterScreen, StatistikScreen
  - WunschlisteScreen, KontaktScreen, InfoBoxScreen
  - WeinboerseScreen, MeinWeinregalScreen, DashboardScreen
  - AdminShopScreen, AdminOrdersScreen
- ✅ **"Container" → "Kacheln"**: Umbenennung für bessere Benutzerfreundlichkeit
- ✅ **Admin-Bereich Verbesserungen**:
  - AdminShopScreen: Alle Buttons in Gold, Modal-Padding für iOS, Versandkosten-Fix
  - AdminOrdersScreen: Button-Höhen erhöht, Gold-Buttons, Modal-Padding
- ✅ **Dashboard-Statistiken**: Zahlen in Gold (#DAA520)
- ✅ **Google Maps Pins**: Klassische rote Marker (#EA4335) statt Weinglas-Emoji
- ✅ **Versandkosten-Eingabe**: Komma/Punkt Konvertierung behoben (4,95 → 4.95)
- Backup erstellt: `Backup_20251203_093241.tar.gz`

### 02. Dezember 2025, 08:34 Uhr - Bugfix: Syntaxfehler behoben, finale BTP-Bereinigung
- ✅ **Syntaxfehler in DatenschutzScreen.js behoben**:
  - Problem: Syntaxfehler in Zeile 533 (`Unexpected token`) nach BTP-Style-Entfernung
  - Ursache: Beschädigte StyleSheet-Struktur mit zusätzlicher Klammer und falscher `sectionTitle`-Struktur
  - Lösung: StyleSheet-Struktur korrigiert, alle Style-Objekte korrekt formatiert
  - Linter-Fehler behoben
- ✅ **Finale BTP-Bereinigung abgeschlossen**:
  - `ProfilScreen.js` - BTP-State, BTP-Anzeige und Styles entfernt
  - `WeinboerseScreen.js` - BTP-State und Styles entfernt
  - `MeinWeinregalScreen.js` - BTP-State und Styles entfernt
  - `ChatListScreen.js` - BTP-State und Styles entfernt
  - `NotificationsScreen.js` - BTP-Filter aus Notification-Logik entfernt
  - `RegisterScreen.js` - Ungenutzte BTP-Styles entfernt
  - `StatistikScreen.js` - Letzte `getBtpIconStyle` Referenz entfernt
  - `InfoBoxScreen.js` - `getBtpIconStyle` Import entfernt
- ✅ **Code-Qualität**: Keine Linter-Fehler, alle Dateien kompilieren korrekt
- **Backup:** `Backup_20251202_083441.tar.gz` (55 MB)
- **Summary:** `Summarys/Summary_20251202_083441.md`

### 02. Dezember 2025, 08:30 Uhr - BTP vollständig entfernt
- ✅ **BTP (Bottle Trade Points) komplett aus dem Code entfernt**:
  - BTP-Screens gelöscht: `BTPScreen.js`, `BtpScreen.js`
  - BTP-Services gelöscht: `btpHelper.js`, `btpConfig.js`
  - BTP-Badges aus allen 14 Screens entfernt
  - BTP-Funktionen aus `database-web.js` entfernt (`addBtpToUser`, `getBtpTransactions`)
  - BTP-Referenzen aus `App.js` entfernt (User-Subscription, Survey-Belohnungen)
  - BTP-Referenzen aus `testAuth.js` entfernt (Mock-User, Registrierung)
  - BTP-Referenzen aus `RegisterScreen.js` entfernt (Maske 4)
  - BTP-Referenzen aus `ProfileIcon.js` entfernt
  - BTP-Referenzen aus weiteren Screens entfernt (StartScreen, HomeScreen, SurveyAnswerScreen, AdminUsersScreen)
  - BTP-Mock-Daten aus `mockData.js` entfernt
  - BTP-Erwähnungen aus `tourSteps.js` entfernt
  - Navigation-Links zu BTP-Screens entfernt (DashboardScreen, HamburgerMenu)
  - Dokumentation aktualisiert
- ✅ **Funktionalität erhalten**: Alle Features funktionieren weiterhin, nur BTP-Referenzen entfernt
- **Backup:** `Backup_20251202_075203.tar.gz` (84 MB)
- **Summary:** `Summarys/Summary_20251202_083000.md` (wird erstellt)

### 01. Dezember 2025, 14:06 Uhr - Layout-Fix für Zurück-Button in Reader-Screens
- ✅ **Zurück-Button bleibt sichtbar**: Problem behoben, bei dem der "Zurück"-Button in den Reader-Screens (Umfragen, Newsletter, Systemnachrichten) kurz angezeigt wurde und dann verschwand
  - **Ursache**: `ScrollView` lag außerhalb des `contentContainer` und überdeckte diesen mit `flex: 1`
  - **Lösung**: `ScrollView` in den `contentContainer` verschoben und `contentContainer` erhält `flex: 1`
- ✅ **Konsistente Struktur**: Alle drei Reader-Screens verwenden jetzt die gleiche Layout-Struktur
  - `contentContainer` mit `flex: 1` enthält Logo-Header, Header, Zurück-Button und ScrollView
  - ScrollView mit `flex: 1` innerhalb des `contentContainer`
- ✅ **Geänderte Dateien:**
  - `mobile-app/screens/SurveyAnswerScreen.js` - `contentContainer` erhält `flex: 1`
  - `mobile-app/screens/NewsletterReaderScreen.js` - `ScrollView` in `contentContainer` verschoben, `flex: 1` hinzugefügt
  - `mobile-app/screens/SystemMessageReaderScreen.js` - `ScrollView` in `contentContainer` verschoben, `flex: 1` hinzugefügt
- **Backup:** `Backup_2025-12-01_14-06-54.tar.gz`
- **Summary:** `Summarys/Summary_2025-12-01_14-06-54.md`

### 30. November 2025, 22:08 Uhr - Admin-Benachrichtigungen, Support-Button und Chat-verlassen-Badge
- ✅ **Admin-Benachrichtigungen bei neuen Registrierungen**: Admins erhalten automatisch eine Notification in der InfoBox, wenn sich ein neuer User registriert
  - Neue Funktionen: `getAllAdmins()`, `notifyAdminsAboutNewRegistration()`
  - Integration in `registerUser()` in `testAuth.js`
  - System-Notification mit Typ `system` wird für alle Admins erstellt
- ✅ **Support-Button in InfoBoxScreen**: FAB-Button (💬) in der rechten unteren Ecke ermöglicht direkten Support-Kontakt
  - Neue Funktionen: `getFirstAdmin()`, `createSupportChat()`
  - FAB-Button mit goldenem Design (#DAA520), 56×56px
  - Position: 100px über der BottomNavigation
  - Erstellt automatisch Support-Chat mit Admin und System-Nachricht
  - Prüft auf existierende Support-Chats (verhindert Duplikate)
- ✅ **Chat-verlassen-Notification mit Badge**: Verbesserte Badge-Anzeige bei Chat-Verlassen
  - Explizites Setzen von `isRead: false` bei Chat-verlassen-Notification
  - Badge wird jetzt korrekt angezeigt, wenn ein User den Chat verlässt
- **Geänderte Dateien:**
  - `mobile-app/services/database-web.js` - Neue Admin- und Support-Funktionen
  - `mobile-app/services/testAuth.js` - Integration der Admin-Benachrichtigung
  - `mobile-app/screens/InfoBoxScreen.js` - Support-FAB-Button hinzugefügt
  - `mobile-app/App.js` - Chat-verlassen-Notification verbessert
- **Backup:** `Backup_20251130_220837.tar.gz`

### 30. November 2025, 20:17 Uhr - Header-Bereiche vollständig standardisiert

**Header-Standardisierung:**
- ✅ Alle Header-Bereiche (oberhalb der Überschrift) sind jetzt identisch in allen Screens
- ✅ Abstände zwischen Zeilen standardisiert (marginBottom: 8 für HamburgerContainer und ProfileIconContainer)
- ✅ Symbolgrößen vereinheitlicht:
  - HamburgerButton: 44×44px, borderRadius: 22
  - ProfileIcon: 45×45px (standardisiert von 40×40 oder 32×32)
  - ProfileIconText: fontSize: 25 (standardisiert von 18)
  - WishlistHeart: fontSize: 24
- ✅ Header-Padding standardisiert: paddingHorizontal: 20, paddingTop/Bottom: 20, minHeight: 60
- ✅ WishlistButton: position: 'relative' in allen Screens hinzugefügt
- ✅ Über 40 Screens aktualisiert mit identischen Header-Styles
- ✅ borderBottomWidth: 0 aus logoHeaderContainer entfernt (wo vorhanden)

**Geänderte Dateien:**
- Alle Haupt-Screens (DashboardScreen, WeinboerseScreen, MeinWeinregalScreen, UserScreen, etc.)
- Alle Screens im screens/ Verzeichnis (ProfilScreen, ChatListScreen, WeingueterScreen, etc.)
- Alle Admin-Screens (AdminDashboardScreen, AdminChatsScreen, AdminUsersScreen, etc.)

**Backup:** `Backup_20251130_201738.tar.gz` (28 MB)

### 29. Oktober 2025 - Welcome-Screen Button-Modernisierung & Layout-Optimierung

**Button-Layout:**
- ✅ 3 Buttons gleichmäßig über Content-Bereich verteilt (zwischen Header und BottomNavigation)
- ✅ Buttons füllen gesamte verfügbare Höhe aus
- ✅ Content-Bereich mit absoluter Positionierung nach Header (`top: totalHeaderHeight`)
- ✅ Button-Container nutzt 100% der Content-Höhe

**Button-Design (Modernisiert):**
- ✅ **LinearGradient** für moderne Farbverläufe:
  - Login: `rgba(213, 223, 224, 0.4-0.3)` - Helles Grau-Blau (passend zum Background)
  - Registrieren: `rgba(47, 58, 59, 0.7-0.6)` - Dunkles Grau (passend zum Header)
  - Info: `rgba(139, 74, 92, 0.6-0.5)` - Rotwein-Farbe mit Transparenz
- ✅ **Grafische Elemente:**
  - Icons vor Text: 🍇 (Login), 🍷 (Registrieren), ℹ️ (Info)
  - Pfeil rechts (→) für Navigation-Hinweis
  - Icons: `fontSize: 48px`, Pfeil: `fontSize: 36px`
- ✅ **Typografie:**
  - Schriftgröße: `36px` für bessere Sichtbarkeit
  - Font-Weight: `700` (Grund), `800` für Text-Styles
  - Text-Schatten für bessere Lesbarkeit
  - Kein Zeilenumbruch: `flexShrink: 0`, `flexWrap: 'nowrap'`
- ✅ **Design-Details:**
  - Stärkere Schatten (`shadowOpacity: 0.3`, `shadowRadius: 10`)
  - Border-Effekte mit Transparenz (oben/unten)
  - Mousse-Effekt (Champagner-Perlen) auf allen Buttons
  - Slide-Animation von links nach rechts (300px)

**Header-Anpassung:**
- ✅ Höhe erhöht: `155px` (vorher 135px)
- ✅ Padding: `25px` vertikal für bessere Proportionen
- ✅ Text und Logo vertikal zentriert
- ✅ "bei" horizontal zentriert unter "Willkommen"

**Layout-Fixes:**
- ✅ Content-Bereich Positionierung: `position: absolute`, `top: totalHeaderHeight`
- ✅ Verfügbare Höhe berechnet: `screenHeight - totalHeaderHeight - bottomNavHeight`
- ✅ Button-Container nutzt 100% der Content-Höhe
- ✅ Kein sichtbarer Background unterhalb der Buttons

### 29. Oktober 2025 - UI-Überarbeitung
- Einheitliches Header-Design implementiert
- BottomNavigation auf allen Screens hinzugefügt
- Hintergrundfarbe standardisiert
- Hamburger-Menü-Integration überarbeitet
- Home-Button Navigation angepasst
- Doppeltes Hamburger-Menü behoben

### 9. November 2025 - Header-Herz & InfoBox Popup
- Herz-Icon unter dem Hamburger-Menü auf allen relevanten Headern vereinheitlicht und Animation angepasst
- `NewsPopup` der InfoBox präzise über dem Button verankert, Icons vertikal gestapelt und Glasmorph-Styling hinzugefügt
- Dashboard-Kacheln mit linearem Verlauf (`#f1e9dd → #e6dccf`) modernisiert
- Backup erstellt: `Backup_20251109_193012.tar.gz`

### 24. November 2025 - Chat- und Hinweis-Persistenz-Fixes, Badge-Berechnung erweitert
- ✅ Chat verschwindet nicht mehr nach dem Senden einer Nachricht
- ✅ Hinweise bleiben bestehen, bis sie manuell gelöscht werden
- ✅ System-Nachricht beim Chat-Erstellen hinzugefügt (beschreibt den Tausch)
- ✅ Alle Hinweis-Notifications werden nach Akzeptierung des Tausches automatisch gelöscht
- ✅ Badge-Berechnung erweitert: zählt jetzt auch ungelesene Chats
- ✅ Badge unterscheidet zwischen eigenen und fremden Nachrichten (eigene Nachrichten erhöhen Badge nicht)
- ✅ Badge für "Chat verlassen" Notifications implementiert
- ✅ `updateChat` Funktion verbessert: behält kritische Felder (`entryType`, `participants`) beim Update
- ✅ `InfoBoxScreen` erhält jetzt `chats` Prop von `App.js`
- ✅ Validierungslogik in `InfoBoxScreen` verbessert: prüft `participants` vor `.find()` Aufruf
- ✅ `deleteNotificationsForChat` filtert jetzt nur Chat-Notifications, nicht Hinweis-Notifications
- ✅ `markChatAsRead` löscht nur Chat-Notifications, nicht Hinweis-Notifications
- Backup erstellt: `Backup_20251124_204745.tar.gz` (160 MB)

### 25. November 2025 - Geokarte mit PLZ-basierter Entfernungsanzeige und interaktiver Dashboard-Karte
- ✅ **PLZ-basierte Entfernungsanzeige**: Weine in der Weinbörse zeigen Entfernung vom eingeloggten User ("Circa X km von dir entfernt")
- ✅ **Vollständige PLZ-Datenbank**: 10.813 deutsche PLZ mit individuellen Koordinaten (importiert aus DE.txt)
- ✅ **Geocoding-Service**: Service für PLZ-zu-Koordinaten-Mapping und Entfernungsberechnung (Haversine-Formel)
- ✅ **Dashboard mit interaktiver Karte**: 
  - Geokarte mit modernen goldenen Pins für alle Weinangebote
  - Info-Container über der Karte (Weine in Weinbörse, Mein Weinregal)
  - Bottom-Sheet Modal (75% des Displays) für Weindetails
  - Buttons: "Zurück zum Dashboard", "Zur Weinbörse", "Tausch anfragen"
- ✅ **OwnerZipCode Backfill**: Alte Weine ohne PLZ werden automatisch mit PLZ des Besitzers aktualisiert
- ✅ **Wine Type Helper**: Service zur Bestimmung von Rot-/Weißwein für Pin-Farben (aktuell einheitliche goldene Farbe)
- ✅ **Karte scrollbar**: Karte passt sich zwischen Info-Containern und "User online" Banner an
- Backup erstellt: `Backup_20251125_171029.tar.gz` (161 MB)

### 25. November 2025 - Admin-Bereich aufgeräumt, Logo-Header vereinheitlicht, Daten-Verwaltung zentralisiert
- ✅ **Neuer AdminDataManagementScreen**: Zentraler Screen mit Tabs für Chats, Hinweise und Trades
- ✅ **Physische Löschung aus Firestore**: Chats, Hinweise und Trades werden jetzt physisch aus Firestore gelöscht (nicht nur als gelöscht markiert)
- ✅ **Messages-Subcollection korrekt löschen**: Messages werden jetzt aus der Subcollection `chats/{chatId}/messages` gelöscht
- ✅ **"ALLE löschen" Button**: Löscht alle Chats, Hinweise und Trades auf einmal
- ✅ **Admin-Bereich aufgeräumt**: 
  - Separates Löschen von Chats, Hinweisen, Trades entfernt
  - Alle Lösch-Container entfernt
  - Daten-Verwaltung zentralisiert in einem Button
- ✅ **Logo-Header vereinheitlicht**: Alle Admin-Screens haben jetzt den gleichen Logo-Header (Bottle Trade Logo mit Hamburger-Menü und Profil-Icon)
- ✅ **Hintergrundfarben angepasst**: Alle Admin-Screens verwenden jetzt `#2c2c2c` (dunkel) statt `#d5dfe0` (hellgrau)
- ✅ **Überschriften mit Icons**: Alle Überschriften haben jetzt Icons (⚙️ Verwaltungs-Funktionen, 📊 Schnellübersicht, 🔧 System-Funktionen)
- ✅ **Debug-Buttons dezenter gestaltet**: System-Funktionen (Firestore-Daten, Migrations-Status, Bild-Migration) im Grid-Layout wie Feature-Cards
- ✅ **Farben angepasst**: Heller, weniger grün/rot, weiße Schrift, aber nicht vollständig auf grün/rot verzichtet
- ✅ **Fehlerbehandlung verbessert**: Firestore-Verbindungsfehler werden jetzt besser behandelt mit klaren Fehlermeldungen
- ✅ **Login-Fehlermeldungen verbessert**: Spezifische Fehlermeldungen statt generischer "Invalid credentials"
- Backup erstellt: `Backup_20251125_113900.tar.gz`

### 25. November 2025 - Mehrfachbildauswahl, automatisches Formular-Scrolling, Bildanzeige-Fixes
- ✅ **Mehrfachbildauswahl korrigiert**: `allowsMultipleSelection: true` funktioniert jetzt korrekt im Weinregal befüllen
  - `mediaTypes` korrigiert: `ImagePicker.MediaTypeOptions.Images` statt `['images']`
  - `allowsEditing: false` bei Mehrfachauswahl (Editing funktioniert nicht mit mehreren Bildern)
  - `aspect` entfernt (funktioniert nicht mit `allowsEditing: false`)
- ✅ **Automatisches Formular-Scrolling**: Beim Navigieren zwischen Formularfeldern scrollt die Ansicht automatisch
  - `scrollToInput` Funktion implementiert mit `measureLayout` und Fallback auf `measureInWindow`
  - `onFocus` Handler für alle TextInputs hinzugefügt
  - `onSubmitEditing` erweitert um automatisches Scrollen zum nächsten Feld
  - 50px Offset oben für bessere Sichtbarkeit des Eingabefelds
- ✅ **Bildanzeige-Fixes im Weinregal**: Bilder werden jetzt korrekt angezeigt
  - `Dimensions.get('window').width` für dynamische Bildbreite verwendet
  - Sowohl Liste als auch Modal angepasst
  - `rowImageOnly` und `modalImage` Styles korrigiert (Breite wird dynamisch gesetzt)
- Backup erstellt: `Backup_20251125_174356.tar.gz`

### 25. November 2025 - Impressum/Kontakt-Screens, Badge-System für Karten-Pins, Instagram-Integration
- ✅ **Neue Screens erstellt**:
  - `ImpressumScreen.js`: Impressum-Informationen mit einheitlichem Design
  - `KontaktScreen.js`: Kontakt-Informationen mit klickbaren E-Mail- und Instagram-Links
- ✅ **Hamburger-Menü erweitert**:
  - Impressum: Navigiert zum `ImpressumScreen`
  - Kontakt: Navigiert zum `KontaktScreen`
  - Instagram: Öffnet direkt `https://www.instagram.com/1bottletrade` im Browser
- ✅ **Badge-System für Karten-Pins**:
  - Weine werden nach Koordinaten gruppiert (Toleranz: ~11 Meter)
  - Pins mit mehreren Weinen zeigen rotes Badge mit Anzahl
  - Klick auf Pin mit mehreren Weinen öffnet Auswahl-Modal
  - Einzelne Weine öffnen direkt das Detail-Modal
- ✅ **Design-Anpassungen**:
  - Beide Screens mit einheitlichem Logo-Header (Bottle [Logo] Trade)
  - Profil-Icon rechts (nur wenn eingeloggt)
  - Herz-Icon (Wunschliste) unter Hamburger-Menü
  - Goldene Überschrift (#DAA520) mit Text-Shadow
  - Dunkler Hintergrund (#2c2c2c) im Content-Bereich
  - Weiße Container für Sections
- ✅ **Auswahl-Modal für mehrere Weine**:
  - Bottom Sheet (75% des Displays) mit scrollbarer Liste
  - Zeigt alle Weine an einer Position mit Bild, Name, Weingut, Jahrgang, Besitzer
  - Klick auf Wein öffnet Detail-Modal
- Backup erstellt: `Backup_20251125_181115.tar.gz`

### 25. November 2025 - RundgangScreen erstellt (Vorbereitung)
- ✅ **RundgangScreen erstellt**: Leerer Screen mit einheitlichem Design
- ✅ **Hamburger-Menü erweitert**: "Digitaler Rundgang" an erster Stelle (für alle Benutzer)
- ✅ **Screen in App.js registriert**: Navigation funktioniert
- ⏳ **Implementierung geplant**: Detaillierter Plan in Dokumentation (siehe unten)

### 27. November 2025 - Profilbild-Implementierung in allen Screens
- ✅ **Profilbild-Upload im ProfilScreen**:
  - Benutzer können Profilbild aus Galerie auswählen
  - Bild wird zu Firebase Storage hochgeladen (Ordner: `users`)
  - Profilbild wird in Firestore unter `users/{userId}/profilbild` gespeichert
  - Upload-Feedback während des Hochladens
  - Avatar zeigt Profilbild oder Initialen (Fallback)
- ✅ **Profilbild in allen Screens implementiert**:
  - DashboardScreen: Profilbild im Header
  - WeinboerseScreen: Profilbild im Header
  - MeinWeinregalScreen: Profilbild im Header
  - InfoBoxScreen: Profilbild im Header
  - ShopScreen: Profilbild im Header
  - CommunityScreen: Profilbild im Header
  - KontaktScreen: Profilbild im Header
  - ImpressumScreen: Profilbild im Header
  - RundgangScreen: Profilbild im Header
  - UserScreen: Profilbild im Header
- ✅ **Einheitliches Design**:
  - Profilbild-Größe: 45x45 Pixel
  - Border: 2px weiß, rund (borderRadius: 22.5)
  - Container mit `overflow: 'hidden'` verhindert Abschneiden
  - Fallback: Initialen-Kreis (45x45) mit Initialen basierend auf Vor-/Nachname, Username oder Email
- ✅ **UserScreen erweitert**:
  - Profilbild im Header implementiert
  - Kreis mit "P" entfernt, stattdessen Initialen angezeigt
  - Konsistentes Design mit anderen Screens
- ✅ **Technische Details**:
  - `getUser` Funktion erweitert für Profilbild-Abruf
  - `uploadImageToStorage` Funktion für Bild-Upload zu Firebase Storage
  - `updateUser` Funktion erweitert für Profilbild-Update
  - Hilfsfunktion `getInitials()` für Initialen-Generierung
  - State-Management: `profileImage` State in allen Screens
  - `loadProfileImage()` Funktion zum Laden des Profilbildes aus Firestore
- ✅ **UserScreen User-Karten**:
  - Zeigt Profilbild der anderen User in den Karten
  - Fallback auf Initialen wenn kein Profilbild vorhanden
  - Modal zeigt größeres Profilbild oder Initialen
- Backup erstellt: `backup_20251127_093219.tar.gz` (320 MB)

### 27. November 2025 - Profilbild-Verbesserungen und Bildanzeige-Optimierungen
- ✅ **Profilbild-Löschung implementiert**:
  - Funktion `deleteUserProfileImage` in `database-web.js` erstellt
  - Löscht Profilbild aus Firebase Storage und Firestore
  - Button "🗑️ Profilbild löschen" im ProfilScreen (nur im Bearbeitungsmodus)
  - Bestätigungsdialog vor dem Löschen
  - Automatische Cache-Bereinigung beim Löschen
- ✅ **Profilbild-Validierung implementiert**:
  - Funktion `validateProfileImage` in `database-web.js` erstellt
  - Prüft maximale Dateigröße: 5 MB
  - Prüft erlaubte Formate: JPG, JPEG, PNG
  - Validierung in `handlePickImage` vor dem Setzen des States
  - Fehlermeldungen bei ungültigen Bildern
- ✅ **Profilbild-Caching implementiert**:
  - Neuer Service: `services/profileImageCache.js`
  - AsyncStorage-basiertes Caching für Profilbild-URLs
  - Cache-Gültigkeit: 7 Tage
  - Cache-First-Strategie: Beim Laden wird zuerst Cache geprüft, dann Firestore
  - Automatische Cache-Aktualisierung beim Speichern
- ✅ **Profilbild-Komprimierung verbessert**:
  - Quality von `0.8` auf `0.7` reduziert (bessere Komprimierung)
  - `exif: false` hinzugefügt (entfernt EXIF-Daten für kleinere Dateigröße)
  - Automatische Komprimierung vor Upload
- ✅ **Profilbild-Cropping UI-Verbesserungen**:
  - Verbesserter Hinweistext mit Icons
  - Cropping bereits aktiviert: `allowsEditing: true`, `aspect: [1, 1]`
- ✅ **Bildanzeige-Optimierungen in Weinbörse und Weinregal**:
  - `resizeMode` von `cover` auf `contain` geändert für Thumbnails
  - Bilder zeigen jetzt das gesamte Bild als Thumbnail (nicht nur die linke obere Ecke)
  - Bilder sind zentriert im Container
  - Heller Hintergrund (`#f5f5f5`) für bessere Sichtbarkeit
  - Optimierung für einzelne vs. mehrere Bilder (einzelne ohne ScrollView)
  - Dynamische Breitenmessung mit `onLayout` für präzise Container-Breite
  - Minimale weiße Balken bei mehreren Bildern
- ✅ **Automatisches Löschen alter Profilbilder**:
  - Altes Profilbild wird automatisch aus Storage gelöscht, wenn ein neues hochgeladen wird
  - Speicherplatz-Optimierung
- Backup erstellt: `Backup_20251127_102715.tar.gz` (161 MB)

### 27. November 2025 - Container-/Listenansicht, Echtzeit-Suche und UserScreen-Erweiterungen
- ✅ **Container- und Listenansicht für Weinbörse und Weinregal**:
  - Toggle-Buttons für Ansicht (Container/Liste, zentriert unter Überschrift)
  - Listenansicht mit FlatList und Lazy Loading (80x80px Thumbnails, Name rechts)
  - Container-Ansicht beibehalten (bestehende Grid-Ansicht)
  - "Mein Wein" Badge auch in Listenansicht
  - Entfernungsanzeige in Listenansicht (nur für fremde Weine)
  - Container-Höhe reduziert (padding: 5px statt 12px)
- ✅ **Echtzeit-Suche/Filter-Funktion**:
  - Suchfeld mit identischem Design (transparenter Hintergrund, weißer Text)
  - Clear-Button (✕) erscheint bei Eingabe
  - Filtert nach: Name, Weingut, Jahrgang, Region, Rebsorte
  - Funktioniert in beiden Ansichten (Container und Liste)
  - Angepasste Empty-States bei aktiver Suche
- ✅ **Toggle-Button für "Meine Weine" in Weinbörse**:
  - Button rechts neben Suchfeld (👁️/👁️‍🗨️)
  - Blendet eigene Weine ein/aus
  - Kombiniert mit Suchfunktion
- ✅ **Container- und Listenansicht für UserScreen**:
  - Toggle-Buttons für Container/Liste
  - Suchfeld angepasst (identisch zu WeinboerseScreen)
  - Container-Ansicht: Quadratisches Format (wie Weinbörse)
  - Listenansicht: 80x80px runde Profilbilder, Username/Email
- ✅ **Weinanzahl statt BTP in UserScreen**:
  - Neue Funktion `loadWineCountsForUsers()` lädt für jeden User die Anzahl der öffentlichen Weine
  - Zeigt "🍷 X Wein/Weine in der Weinbörse"
  - Container-Ansicht: Schwarzer Text (`#2c2c2c`)
  - Listenansicht: Grauer Text (`#4a4a4a`)
  - BTP-Anzeige komplett entfernt
- ✅ **Bug-Fixes**:
  - `groupWines` Fehler behoben in `MeinWeinregalScreen.js` (useMemo implementiert)
- Backup erstellt: `Backup_20251127_112515.tar.gz` (28 MB)

### 27. November 2025 - CommunityScreen Modernisierung und SchwarzesBrettScreen
- ✅ **CommunityScreen modernisiert (Glassmorphism Design)**:
  - Transparenter Hintergrund mit LinearGradient
  - Farbcodierte Icon-Kreise (Blau, Orange, Gold)
  - Beschreibungstext unter jedem Titel
  - Press-Animation (Scale 0.95)
  - Pfeil-Icon für Navigation-Hinweis
  - Moderne Schatten und Borders
  - Layout-Optimierungen (feste Mindesthöhe, kompakte Elemente)
- ✅ **SchwarzesBrettScreen implementiert**:
  - Tabs für "Ich suche ..." und "Ich biete ..."
  - Listenansicht mit Card-Design
  - Suchfeld mit Clear-Button
  - FAB (Floating Action Button) für neues Inserat
  - Bottom Sheet Modal für Details (75% Bildschirmhöhe)
  - Bild-Slider/Carousel mit Swipe-Navigation
  - Formular-Modal für Inserat-Erstellung (90% Bildschirmhöhe)
  - Bild-Upload (max. 5 Bilder) zu Firebase Storage
  - Bearbeiten/Löschen-Funktionalität (nur für Owner)
  - Echtzeit-Updates via Firestore-Subscription
- ✅ **Datenbank-Funktionen erweitert**:
  - `createInserat()`, `updateInserat()`, `deleteInserat()`
  - `getInserat()`, `getAllInserate()`, `getInserateByUser()`
  - `subscribeInserate()` für Echtzeit-Updates
- ✅ **Bug-Fixes**:
  - Firestore Index-Problem behoben (clientseitiges Filtern)
  - Zurück-Button aus Logo-Header entfernt
- Backup erstellt: `Backup_20251127_115755.tar.gz`

### 28. November 2025 - WunschlisteScreen implementiert, Matching-System und Herz-Icon Badge
- ✅ **WunschlisteScreen vollständig implementiert**:
  - Card-Design mit Match-Badge
  - Formular-Modal zum Erstellen/Bearbeiten von Wünschen
  - Detail-Modal mit Match-Informationen
  - Suchfunktion
  - FAB für neuen Wunsch
  - "Matches prüfen"-Button
- ✅ **Datenbank-Funktionen erweitert**:
  - `createWish()`, `updateWish()`, `deleteWish()`
  - `getWishesForUser()`, `subscribeWishesForUser()`
  - `checkWishMatches()`, `checkAllWishMatches()`
  - Flexible Suche nach Name, Weingut, Jahrgang, Region, Rebsorte
- ✅ **Matching-System**:
  - Automatische Prüfung gegen alle öffentlichen Weine
  - Filtert eigene Weine heraus
  - Match-Status wird in Firestore gespeichert
  - Sofortige Prüfung nach Wunsch-Erstellung
- ✅ **Herz-Icon Badge-System**:
  - Leeres Herz `♡` wenn keine Matches
  - Rotes gefülltes Herz `❤️` wenn Matches vorhanden
  - Implementiert in: DashboardScreen, WeinboerseScreen, MeinWeinregalScreen, CommunityScreen, WunschlisteScreen
  - Globaler State `wishlistMatchCount` in App.js
  - Automatische Aktualisierung nach Wunsch-Änderungen
- ✅ **UI-Verbesserungen**:
  - Profilbild im WunschlisteScreen zentriert
  - Echtzeit-Updates via Firestore-Subscription
- ✅ **Bug-Fixes**:
  - Syntax-Fehler behoben (doppeltes `},` in WeinboerseScreen.js und MeinWeinregalScreen.js)
- Backup erstellt: `Backup_20251128_090115.tar.gz`

### 28. November 2025 - Weingut-Feature implementiert, Header-Anpassungen, Profilbild-Verbesserungen
- ✅ **Weingut-Feature vollständig implementiert**:
  - **WeingueterScreen erstellt**: Container- und Listenansicht, Suchfunktion, Detail-Modal mit bis zu 5 Bildern
  - **Datenbank-Funktionen**: CRUD-Operationen für Weingüter, Verifizierung, Bild-Upload
  - **Registrierung erweitert**: Toggle "Ich bin ein Weingut" hinzugefügt
  - **ProfilScreen erweitert**: "Weingut-Profil erstellen/bearbeiten" Button (nur für verifizierte Weingüter)
  - **AdminUsersScreen erweitert**: Weingut-Verifizierung mit Toggle-Button, automatische Weingut-Profil-Verifizierung
  - **Verifizierungs-Workflow**: User registriert als Weingut → Admin verifiziert → User kann Profil erstellen
- ✅ **Header-Anpassungen**:
  - Hintergrundfarbe vereinheitlicht: Alle Screens verwenden jetzt `#2c2c2c` statt `#d5dfe0`
  - WeingueterScreen Header identisch zu WeinboerseScreen
  - Goldene Überschrift (#DAA520) mit Text-Shadow
- ✅ **StatusBar-Fixes**:
  - ProfilScreen: `outerContainer` Style hinzugefügt, StatusBar-Ersatz-View korrigiert
  - WeingueterScreen: StatusBar-Import und Komponente hinzugefügt
- ✅ **Profilbild-Verbesserungen**:
  - ProfilScreen Profilbild angepasst: 45x45 Pixel (identisch zu WeinboerseScreen)
  - Verwendet `getInitials()` statt festem "P"
  - Doppelte Definitionen entfernt
- ✅ **UI-Verbesserungen**:
  - Abstände im ProfilScreen angepasst
  - Firestore-Index-Problem behoben (clientseitige Sortierung)
- ✅ **Bug-Fixes**:
  - Modal-Import hinzugefügt
  - Doppelte Imports behoben
  - Verifizierungslogik korrigiert
- Backup erstellt: `Backup_20251128_104922.tar.gz`

### 30. November 2025 - Auto-Login
- ✅ **Auto-Login / Session-Persistenz**:
  - **testAuth.js erweitert**: `loginUser()` speichert Session, `logoutUser()` löscht Session, neue `restoreSession()` Funktion
  - **App.js erweitert**: Auto-Login beim App-Start prüft gespeicherte Session und loggt automatisch ein
  - **LoginScreen.js erweitert**: "Remember Me" Checkbox hinzugefügt ("Angemeldet bleiben")
  - Session-Gültigkeit: 30 Tage
  - Sicherheit: Kein Passwort wird gespeichert, nur User-ID
  - Expo-kompatibel: Funktioniert in allen Expo-Umgebungen (Go, Development Build, Production Build, Web)
- Backup erstellt: `Backup_20251130_102737.tar.gz`

### 30. November 2025 - Überschriften-Stil vereinheitlicht, ShopScreen angepasst, HeaderTestScreen erstellt
- ✅ **Überschriften-Stil vereinheitlicht (Variante 5)**:
  - Alle 24 Screens auf einheitlichen Überschriften-Stil umgestellt
  - **Neue Eigenschaften**: `fontSize: 28`, `fontWeight: '500'`, `color: '#FFFFFF'`, `letterSpacing: 1`
  - Text-Shadow entfernt (vorher goldener Shadow)
  - Minimalistisches, elegantes Design
- ✅ **ShopScreen sprachlich angepasst**:
  - Klarstellung: Nur Bottle-Trade Zubehör (keine Weine)
  - Produktliste aktualisiert: Weingläser, Öffner, Weinkühler, Geschenkboxen
  - Text unter Überschrift auf weiß geändert
  - Weiße Border des Containers entfernt
- ✅ **HeaderTestScreen erstellt**:
  - Neuer TestScreen im Admin-Bereich (`screens/HeaderTestScreen.js`)
  - 23 verschiedene Überschriften-Varianten zum Testen
  - Kategorien: Farb-Varianten (1-15), Schriftarten-Varianten (16-23)
  - Integration in App.js und AdminDashboardScreen
  - Zugriff über Admin-Bereich (🎨 Überschriften-Test)
- ✅ **Aktualisierte Screens** (24):
  - DashboardScreen, WeinboerseScreen, MeinWeinregalScreen, WeinregalBefuellenScreen, ShopScreen, CommunityScreen, UserScreen, ProfilScreen, BTPScreen, WunschlisteScreen, InfoBoxScreen, ImpressumScreen, DatenschutzScreen, KontaktScreen, RundgangScreen, WeingueterScreen, StatistikScreen, SchwarzesBrettScreen, ChatRoomScreen, AdminDashboardScreen, AdminDataManagementScreen, AdminHintsScreen, ChatListScreen, HinweisScreen
- Backup erstellt: `Backup_20251130_191526.tar.gz`

---

## 🔄 Backup-Informationen

**Letztes Backup:**
- **Datei:** `Backup_20251130_220837.tar.gz`
- **Datum:** 30. November 2025, 22:08:37
- **Größe:** 161 MB
- **Speicherort:** `/home/bottleadmin/bottle-trade-mobile/`
- **Inhalt:** Vollständiger Projektstand nach Admin-Benachrichtigungen, Support-Button-Implementierung und Chat-verlassen-Badge-Verbesserung

---

**Hinweis für neue Agents:**  
Diese Dokumentation sollte bei größeren Änderungen aktualisiert werden. Insbesondere:
- Neue Screens hinzufügen
- Design-Änderungen dokumentieren
- Bug-Fixes eintragen
- Neue Features beschreiben

**Aktualisiert am:** 30. November 2025, 22:08 Uhr



---

## 🎨 Welcome-Screen Details

### Button-Layout-Struktur

**Content-Bereich:**
- Position: `absolute`, `top: totalHeaderHeight`
- Höhe: Dynamisch berechnet (`availableContentHeight = screenHeight - totalHeaderHeight - bottomNavHeight`)
- Kein Padding/Margin

**Button-Container:**
- Höhe: `100%` der Content-Höhe
- Flex-Layout: `flexDirection: 'column'`
- Buttons mit `flex: 1` für gleichmäßige Verteilung

**Button-Styles:**
- `minHeight: 150px` (verhindert zu kleine Buttons)
- `flex: 1` (gleichmäßige Verteilung)
- LinearGradient-Hintergrund
- `justifyContent: 'center'`, `alignItems: 'center'`

**Button-Content:**
- Flex-Layout: `flexDirection: 'row'`
- Elemente: Icon + Text + Pfeil
- `justifyContent: 'center'` für horizontale Zentrierung
- Gap zwischen Elementen: `12px`

### Slide-Animation

**PanResponder-Integration:**
- Horizontaler Swipe nach rechts (nur `dx`)
- Maximaler Slide: `300px`
- Mindestens `100px` für Navigation
- Spring-Animation bei Release ohne Navigation
- Slide-Progress Overlay während Animation

**Animation-Werte:**
- `loginSlideAnim`, `registerSlideAnim`, `infoSlideAnim`
- Werte werden beim Zurückkehren zum Welcome-Screen zurückgesetzt

---

## 🎯 Digitaler Rundgang - Implementierungsplan

**Status:** Geplant (noch nicht implementiert)  
**Erstellt:** 25. November 2025

### Überblick

Der digitale Rundgang ist ein interaktives Tutorial-System, das neue Benutzer durch die wichtigsten Funktionen der App führt. Wichtige UI-Elemente werden mit Spots hervorgehoben und mit Erklärungstexten in Sprechblasen versehen.

### Konzept

#### 1. Overlay-System
- **Dunkles Overlay** über dem aktuellen Screen (`rgba(0, 0, 0, 0.75)`)
- **Spotlight-Effekt** um wichtige UI-Elemente (weißer Ring mit Glow)
- **Sprechblasen** mit Erklärungstext neben/über dem Spotlight
- **Navigation-Buttons**: "Weiter", "Zurück", "Überspringen"

#### 2. Technische Architektur

**Option A: Overlay-basiert (empfohlen)**
- Globale `TourOverlay` Komponente, die über allen Screens liegt
- Funktioniert auf allen Screens ohne Screen-Änderungen
- Element-Positionen werden dynamisch berechnet

**Option B: Screen-spezifisch**
- Jeder Screen hat eigene Tour-Implementierung
- Präzisere Positionierung, aber mehr Code-Duplikation

**Empfehlung:** Option A (Overlay-basiert)

#### 3. Komponenten-Struktur

```
components/
├── TourOverlay.js          # Haupt-Overlay-Komponente
├── Spotlight.js             # Spotlight-Effekt für Elemente
├── SpeechBubble.js          # Sprechblase mit Text
└── TourProgress.js          # Fortschrittsanzeige
```

#### 4. State Management

```javascript
// In App.js oder separatem Tour-Context
const [tourActive, setTourActive] = useState(false);
const [currentStep, setCurrentStep] = useState(0);
const [tourSteps, setTourSteps] = useState([]);
const [currentScreen, setCurrentScreen] = useState(null);
```

#### 5. Rundgang-Schritte (Vorschlag)

```javascript
const tourSteps = [
  {
    id: 'welcome',
    screen: 'dashboard',
    target: 'header',
    title: 'Willkommen bei Bottle-Trade!',
    text: 'Dies ist dein Dashboard. Hier siehst du eine Übersicht über deine Weine und die Weinbörse.',
    bubblePosition: 'bottom',
  },
  {
    id: 'weinboerse-button',
    screen: 'dashboard',
    target: 'weinboerse-button',
    title: 'Weinbörse',
    text: 'Hier findest du alle verfügbaren Weine zum Tauschen. Du kannst nach Region, Jahrgang oder Rebsorte filtern.',
    bubblePosition: 'right',
  },
  {
    id: 'weinregal-button',
    screen: 'dashboard',
    target: 'weinregal-button',
    title: 'Mein Weinregal',
    text: 'In deinem Weinregal verwaltest du alle deine Weine. Du kannst sie veröffentlichen oder privat halten.',
    bubblePosition: 'right',
  },
  {
    id: 'weinregal-befuellen-button',
    screen: 'dashboard',
    target: 'weinregal-befuellen-button',
    title: 'Weinregal befüllen',
    text: 'Hier fügst du neue Weine zu deinem Regal hinzu. Du kannst bis zu 5 Bilder pro Wein hochladen.',
    bubblePosition: 'right',
  },
  {
    id: 'karte',
    screen: 'dashboard',
    target: 'map-container',
    title: 'Geokarte',
    text: 'Auf dieser Karte siehst du alle verfügbaren Weine in deiner Umgebung. Pins mit Badge zeigen mehrere Weine an einer Position.',
    bubblePosition: 'top',
  },
  {
    id: 'profil-icon',
    screen: 'dashboard',
    target: 'profile-icon',
    title: 'Profil',
    text: 'Hier kannst du dein Profil bearbeiten und deine Einstellungen verwalten.',
    bubblePosition: 'left',
  },
  {
    id: 'wunschliste-icon',
    screen: 'dashboard',
    target: 'wishlist-icon',
    title: 'Wunschliste',
    text: 'Speichere Weine, die du gerne tauschen möchtest, in deiner Wunschliste.',
    bubblePosition: 'left',
  },
  {
    id: 'infobox',
    screen: 'dashboard',
    target: 'infobox-button',
    title: 'Benachrichtigungen',
    text: 'Hier findest du alle deine Benachrichtigungen, Chats und Tauschanfragen.',
    bubblePosition: 'left',
  },
];
```

#### 6. Element-Positionierung

**Methode:**
- `measureLayout` oder `measureInWindow` für Element-Positionen
- Relative Positionierung zum Screen
- Anpassung bei Scroll/Resize

**Beispiel:**
```javascript
const measureElement = async (elementRef) => {
  return new Promise((resolve) => {
    elementRef.current.measureInWindow((x, y, width, height) => {
      resolve({ x, y, width, height });
    });
  });
};
```

#### 7. Spotlight-Komponente

**Design:**
- Weißer Ring mit Glow-Effekt
- Pulsierende Animation
- Anpassbare Größe (circle oder rectangle)

**Props:**
```javascript
<Spotlight
  x={elementX}
  y={elementY}
  width={elementWidth}
  height={elementHeight}
  shape="circle" // oder "rectangle"
  animated={true}
  glowColor="#FFFFFF"
/>
```

#### 8. Sprechblase-Komponente

**Design:**
- Weißer Hintergrund mit Schatten
- Abgerundete Ecken
- Keine Pfeile (entfernt für klareres Design, Spotlight zeigt bereits das Element)
- Titel + Text
- Fortschrittsanzeige integriert (oben in der Bubble)
- Buttons: "Weiter", "Zurück", "Rundgang beenden"

**Props:**
```javascript
<SpeechBubble
  title="Weinbörse"
  text="Hier findest du alle verfügbaren Weine..."
  position="bottom" // top, bottom, left, right
  arrowDirection="up"
  onNext={handleNext}
  onBack={handleBack}
  onSkip={handleSkip}
  showBack={currentStep > 0}
  showSkip={true}
/>
```

#### 9. Fortschrittsanzeige

**Design:**
- Integriert in SpeechBubble (oben in der Bubble)
- "Schritt 2 von 8"
- Fortschrittsbalken mit goldener Füllung
- Trennlinie unter der Anzeige

#### 10. Navigation-Logik

**Ablauf:**
1. User startet Rundgang (Button im RundgangScreen)
2. Overlay erscheint über aktuellem Screen
3. Erster Step wird angezeigt
4. User klickt "Weiter" → nächster Step
5. Bei Screen-Wechsel: automatische Navigation zum entsprechenden Screen
6. User kann jederzeit "Überspringen" → Rundgang beendet
7. Am Ende: "Rundgang abgeschlossen" + Option zum Wiederholen

#### 11. Persistenz

**Speicherung:**
- AsyncStorage: `tour-completed` Flag
- Optional: `tour-last-seen` Timestamp
- Optional: `tour-skipped-steps` Array

**Logik:**
- Beim ersten App-Start: Rundgang automatisch anbieten
- Nach Abschluss: nicht mehr automatisch anzeigen
- Manueller Start immer möglich über Hamburger-Menü

#### 12. Implementierungsreihenfolge

1. **Phase 1: Basis-Komponenten**
   - `TourOverlay.js` erstellen
   - `Spotlight.js` erstellen
   - `SpeechBubble.js` erstellen
   - `TourProgress.js` erstellen

2. **Phase 2: State Management**
   - Tour-State in App.js oder Context
   - Tour-Steps definieren
   - Navigation-Logik implementieren

3. **Phase 3: Element-Positionierung**
   - `measureElement` Funktion implementieren
   - Refs für alle Tour-Elemente hinzufügen
   - Positionierung testen

4. **Phase 4: Screen-Integration**
   - Refs zu wichtigen Elementen hinzufügen
   - Tour-Steps für jeden Screen definieren
   - Screen-Navigation implementieren

5. **Phase 5: Animationen & Polishing**
   - Fade-In/Out für Overlay
   - Pulsierende Spotlight-Animation
   - Slide-In für Sprechblasen
   - Smooth Transitions zwischen Steps

6. **Phase 6: Persistenz & UX**
   - AsyncStorage Integration
   - "Rundgang abgeschlossen" Dialog
   - Option zum Wiederholen
   - Automatischer Start beim ersten Mal

#### 13. Design-Spezifikationen

**Farben:**
- Overlay: `rgba(0, 0, 0, 0.75)`
- Spotlight: `#FFFFFF` mit Glow (`rgba(255, 255, 255, 0.8)`)
- Sprechblase: `#FFFFFF` Hintergrund, `rgba(0, 0, 0, 0.1)` Schatten
- Button Primary: `#DAA520` (Gold)
- Button Secondary: `#666666` (Grau)

**Schriftgrößen:**
- Titel: 18px, bold
- Text: 14px, regular
- Button: 16px, semibold

**Abstände:**
- Sprechblase Padding: 16px
- Button Abstand: 12px
- Spotlight Padding: 8px (um Element)

#### 14. Wichtige UI-Elemente für Tour

**Dashboard:**
- Header (Logo-Header mit Hamburger, Wishlist, Logo, Profil, BTP)
- Weinbörse-Button (BottomNavigation)
- Mein Weinregal-Button (BottomNavigation)
- Karte (MapView)
- Profil-Icon (im Header)
- Wunschliste-Icon (Herz im Header)
- InfoBox-Button (BottomNavigation)

**Weinbörse:**
- Filter-Optionen (falls vorhanden)
- Wein-Liste
- Wein-Detail-Modal

**Mein Weinregal:**
- Wein-Liste
- Veröffentlichen-Button
- Löschen-Button

**Weinregal befüllen:**
- Formular-Felder
- Bild-Upload
- Speichern-Button

#### 15. Technische Herausforderungen

1. **Element-Positionierung:**
   - Dynamische Berechnung bei verschiedenen Screen-Größen
   - Anpassung bei Scroll
   - Handling von verschachtelten Views

2. **Screen-Navigation:**
   - Smooth Transitions zwischen Screens
   - State beibehalten während Tour
   - Navigation zurück zum Start-Screen

3. **Performance:**
   - Overlay sollte nicht zu viele Re-Renders verursachen
   - Animationen sollten smooth sein
   - Memory-Management bei vielen Steps

4. **Responsive Design:**
   - Funktioniert auf verschiedenen Screen-Größen
   - Sprechblasen-Positionierung anpassen
   - Spotlight-Größe anpassen

#### 16. Testing-Strategie

1. **Unit Tests:**
   - Tour-Step Navigation
   - Element-Positionierung
   - State Management

2. **Integration Tests:**
   - Vollständiger Rundgang-Durchlauf
   - Screen-Navigation
   - Persistenz

3. **UX Tests:**
   - Verständlichkeit der Texte
   - Intuitive Navigation
   - Performance auf verschiedenen Geräten

#### 17. Offene Fragen / Entscheidungen

1. **Automatischer Start:**
   - Soll der Rundgang beim ersten App-Start automatisch starten?
   - Oder nur manuell über Hamburger-Menü?

2. **Rundgang-Wiederholung:**
   - Kann der User den Rundgang mehrfach durchführen?
   - Soll es eine "Rundgang erneut starten" Option geben?

3. **Step-Skipping:**
   - Kann der User einzelne Steps überspringen?
   - Oder nur den gesamten Rundgang?

4. **Mehrsprachigkeit:**
   - Sollen die Tour-Texte mehrsprachig sein?
   - Wie wird die Sprache gewählt?

5. **Tour-Versionen:**
   - Sollen verschiedene Tour-Versionen für verschiedene User-Typen existieren?
   - (z.B. Neue User vs. Erfahrene User)

#### 18. Nächste Schritte (wenn Implementierung startet)

1. Alle Screens müssen fertig sein
2. Alle wichtigen UI-Elemente müssen Refs haben
3. Tour-Steps final definieren
4. Design-Mockups erstellen (optional)
5. Implementierung starten mit Phase 1

---

**Hinweis:** Dieser Plan sollte als Basis für die spätere Implementierung dienen. Alle Details können noch angepasst werden, wenn die Implementierung startet.

---

## 📝 Neueste Änderungen (02.12.2025)

### Padding-Änderungen auf alle Screens übertragen

#### Logo-Header Padding Reduzierung
- **Änderung**: `marginLeft` und `marginRight` in `logoImageWrapper` von `12` auf `6` reduziert (50% Reduzierung)
- **Betroffene Screens**: Alle Screens mit Logo-Header im gesamten Projekt
- **Zweck**: Kompakteres Design, weniger Abstand zwischen Logo und "Bottle Trade" Text

#### Logo-Header Container Padding
- **Änderung**: `paddingBottom` in `logoHeaderContainer` von `10` auf `0` gesetzt
- **Betroffene Screens**: Alle Screens mit Logo-Header im gesamten Projekt
- **Zweck**: Tagline soll direkt unter dem Logo-Header liegen, ohne zusätzlichen Abstand

### Tagline "Tausch dich durch die Welt der Weine." implementiert

#### Tagline-Komponente
- **Text**: "Tausch dich durch die Welt der Weine."
- **Position**: Direkt unter dem Logo-Header, vor dem Header mit Überschrift
- **Styling**:
  - `paddingHorizontal: 20`
  - `paddingTop: 0` (direkt unter Logo-Header)
  - `paddingBottom: 12`
  - `fontSize: 14`
  - `color: '#FFFFFF'` mit `opacity: 0.85`
  - `textAlign: 'center'`
  - `letterSpacing: 0.5`
  - `fontStyle: 'italic'`

#### Implementierte Screens
- **Haupt-Screens**: DashboardScreen, WeinboerseScreen, MeinWeinregalScreen, CommunityScreen, ShopScreen, WeinregalBefuellenScreen, UserScreen
- **Info-Screens**: InfoBoxScreen, ProfilScreen, WunschlisteScreen, StatistikScreen, WeingueterScreen, ImpressumScreen, KontaktScreen, RundgangScreen, DatenschutzScreen
- **Community-Screens**: ChatListScreen, HinweisScreen, SchwarzesBrettScreen
- **Reader-Screens**: NewsletterReaderScreen, SurveyAnswerScreen, SystemMessageReaderScreen
- **Admin-Screens**: Alle Admin-Screens
- **Weitere Screens**: ChatRoomScreen, WeineScreen, BTPScreen, BtpScreen, HeaderTestScreen

### SurveyAnswerScreen (Umfrage-Screen) Fixes

#### Vertikale Zentrierung der Überschrift "Umfrage"
- **Problem**: Überschrift "Umfrage" war vertikal nicht mittig zwischen den beiden Strichen (borderTop und borderBottom)
- **Lösung**:
  - `justifyContent: 'center'` zu `headerCenter` hinzugefügt
  - `justifyContent: 'center'` und `alignItems: 'center'` zu `greetingContainer` hinzugefügt
- **Ergebnis**: Überschrift ist jetzt vertikal mittig zwischen den beiden Strichen

### WunschlisteScreen - Herz-Icon entfernt

#### Herz-Icon aus Header entfernt
- **Änderung**: `wishlistButton` mit `wishlistHeartContainer` und `wishlistHeart` wurde aus dem Header entfernt
- **Grund**: Konsistenz mit anderen Screens, da Herz-Icon bereits aus anderen Headern entfernt wurde

### Technische Details

#### Padding-Änderungen Pattern
```javascript
// logoImageWrapper
marginLeft: 6, // Reduziert von 12 auf 6 (50%)
marginRight: 6, // Reduziert von 12 auf 6 (50%)

// logoHeaderContainer
paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
```

#### Tagline-Implementierung Pattern
```javascript
// JSX
<View style={styles.taglineContainer}>
  <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
</View>

// Styles
taglineContainer: {
  paddingHorizontal: 20,
  paddingTop: 0, // Auf 0px gesetzt
  paddingBottom: 12,
  alignItems: 'center',
  justifyContent: 'center',
},
taglineText: {
  fontSize: 14,
  color: '#FFFFFF',
  textAlign: 'center',
  opacity: 0.85,
  letterSpacing: 0.5,
  fontStyle: 'italic',
},
```

#### Vertikale Zentrierung Pattern
```javascript
// headerCenter
headerCenter: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center', // Vertikale Zentrierung für die Überschrift
},

// greetingContainer
greetingContainer: {
  justifyContent: 'center',
  alignItems: 'center',
},
```

### Design-Konsistenz

#### Einheitliches Header-Design
- Alle Screens haben jetzt ein konsistentes Header-Design mit reduziertem Padding
- Tagline erscheint einheitlich unter dem Logo-Header auf allen Screens
- Vertikale Zentrierung der Überschriften ist konsistent

#### Visuelle Verbesserungen
- Kompakteres Design durch reduzierte Padding-Werte
- Tagline fügt eine einheitliche Markenbotschaft hinzu
- Bessere visuelle Hierarchie durch konsistente Abstände

### Backup-Informationen
- **Backup-Datei**: `Backup_20251202_073500.tar.gz`
- **Datum**: 02. Dezember 2025, 07:35:00
- **Größe**: 55 MB
- **Inhalt**: mobile-app/, backend-api/, landing-page/, shared-types/, PROJEKT_DOKUMENTATION.md, README.md, WERBEKONZEPT.md, Summarys/, docs/

### Session-Summary
- **Datei**: `Summarys/Summary_20251202_073500.md`
- **Datum**: 02. Dezember 2025, 07:35:00
- **Inhalt**: Vollständige Dokumentation aller Änderungen dieser Session

---

## 🐛 Syntaxfehler-Behebung in AdminUsersScreen (02. Dezember 2025, 09:19 Uhr)

**Status:** Behoben  
**Backup:** `Backup_20251202_091910.tar.gz` (55 MB)  
**Datum:** 02. Dezember 2025, 09:19 Uhr

### Behobene Probleme

#### 1. Doppelte Style-Eigenschaft in statLabel
**Problem:** Doppelte `color`-Eigenschaft im `statLabel` Style-Objekt führte zu einem Syntaxfehler.

**Ursache:**
- Beim Design-Refactoring für Glassmorphism wurden zwei `color`-Eigenschaften definiert
- Erste: `color: '#FFFFFF'` (Zeile 1474)
- Zweite: `color: '#2f3a3b'` (Zeile 1476) - überschrieb die erste

**Lösung:**
- Zweite `color`-Eigenschaft entfernt
- Beibehalten: `color: '#FFFFFF'` für konsistentes weißes Text-Design

#### 2. Verwaiste Style-Eigenschaften
**Problem:** Verwaiste Style-Eigenschaften ohne Style-Namen nach dem `userCard` Style-Objekt führten zu einem Syntaxfehler.

**Ursache:**
- Reste aus früheren Bearbeitungen (Zeilen 1185-1194)
- Eigenschaften standen nach dem schließenden `},` von `userCard`
- Nicht Teil eines Style-Objekts, daher ungültige Syntax

**Lösung:**
- Alle verwaisten Style-Eigenschaften entfernt
- StyleSheet-Struktur korrigiert

### Geänderte Dateien
- `mobile-app/screens/AdminUsersScreen.js` - Zwei Syntaxfehler behoben

### Code-Qualität
- ✅ Keine Linter-Fehler
- ✅ Syntaxfehler behoben
- ✅ Alle Style-Objekte korrekt strukturiert
- ✅ Datei kompiliert ohne Fehler

### Backup-Informationen
- **Backup-Datei**: `Backup_20251202_091910.tar.gz`
- **Datum**: 02. Dezember 2025, 09:19:10
- **Größe**: 55 MB
- **Inhalt**: Vollständiger Projektstand nach Syntaxfehler-Behebung

### Session-Summary
- **Datei**: `Summarys/Summary_20251202_091910.md`
- **Datum**: 02. Dezember 2025, 09:19:10
- **Inhalt**: Vollständige Dokumentation aller Änderungen dieser Session

---

## 🤖 KI-basierter Weinregal-Befüllungs-Screen (02. Dezember 2025, 13:20 Uhr)

**Status:** Implementiert (Mock-KI, bereit für echte KI-Integration)  
**Backup:** `Backup_20251202_132034.tar.gz`  
**Datum:** 02. Dezember 2025, 13:20 Uhr

### Neue Features

#### 1. MeinWeinregalBefuellenKIScreen
- ✅ **Neuer Screen erstellt**: `screens/MeinWeinregalBefuellenKIScreen.js`
- ✅ **KI-Analyse-Funktionalität**: Automatische oder manuelle Analyse von Wein-Etiketten
- ✅ **Formular-Autofill**: Alle Felder werden automatisch ausgefüllt nach KI-Analyse
- ✅ **Fortschrittsanzeige**: ActivityIndicator mit Status-Text während der Analyse
- ✅ **Bild-Upload**: Unterstützt bis zu 5 Bilder (wie Standard-Screen)
- ✅ **Manuelle Bearbeitung**: Alle Felder können nachträglich korrigiert werden

#### 2. Admin-Integration
- ✅ **Button im AdminDashboardScreen**: "Weinregal KI" (🤖 Icon, goldene Farbe)
- ✅ **Navigation**: Direkter Zugriff über Admin-Bereich
- ✅ **Feature-Grid**: Integriert in bestehende Admin-Features

#### 3. KI-Konzept-Dokument
- ✅ **Dokument erstellt**: `docs/KONZEPT_KI_ETIKETT_ERKENNUNG.md`
- ✅ **4 Ansätze beschrieben**:
  1. OCR + NLP (Tesseract.js) - kostenlos, offline
  2. Cloud Vision API (Google/AWS) - hohe Genauigkeit
  3. Custom ML Model (TensorFlow.js) - höchste Genauigkeit
  4. Hybrid-Ansatz (empfohlen) - beste Balance
- ✅ **Implementierungs-Phasen**: Detaillierte Roadmap für KI-Integration
- ✅ **Kostenanalyse**: Vergleich aller Optionen

### Technische Details

**Aktueller Status:**
- Mock-KI-Analyse implementiert (Demo-Zwecke)
- Vollständige UI-Integration
- Platzhalter für echte KI-Implementierung

**Geplante KI-Integration:**
- Service: `services/wineLabelAnalyzer.js` (noch zu erstellen)
- Empfohlener Ansatz: Hybrid (Google Cloud Vision + Tesseract.js Fallback)
- Kosten: Erste 1.000 Bilder/Monat kostenlos, danach ~$1.50 pro 1.000 Bilder

### Bugfixes

#### setBtp Referenzen entfernt
- ✅ **WeinregalBefuellenScreen.js bereinigt**:
  - Zwei `setBtp()` Aufrufe in `loadPreviousWines` entfernt
  - Fehler behoben: "Property 'setBtp' doesn't exist"
  - Überbleibsel aus der BTP-Bereinigung entfernt

### Geänderte Dateien
- `mobile-app/screens/MeinWeinregalBefuellenKIScreen.js` - Neuer KI-Screen
- `mobile-app/screens/AdminDashboardScreen.js` - Button hinzugefügt
- `mobile-app/App.js` - Screen importiert und registriert
- `mobile-app/WeinregalBefuellenScreen.js` - setBtp Referenzen entfernt
- `mobile-app/docs/KONZEPT_KI_ETIKETT_ERKENNUNG.md` - KI-Konzept-Dokument

### Nächste Schritte
1. Entscheidung über KI-Ansatz treffen
2. Google Cloud Vision API einrichten (falls gewählt)
3. `services/wineLabelAnalyzer.js` implementieren
4. Mock-Funktion durch echte KI-Analyse ersetzen
5. Testing mit echten Wein-Etiketten

### Backup-Informationen
- **Backup-Datei**: `Backup_20251202_132034.tar.gz`
- **Datum**: 02. Dezember 2025, 13:20:34
- **Größe**: 161 MB
- **Inhalt**: Vollständiger Projektstand nach KI-Screen-Implementierung

### Session-Summary
- **Datei**: `Summarys/Summary_20251202_132034.md`
- **Datum**: 02. Dezember 2025, 13:20:34
- **Inhalt**: Vollständige Dokumentation aller Änderungen dieser Session

---

## 🐛 Render-Fehler behoben & Rechtliche Screens überarbeitet (02. Dezember 2025, 18:20 Uhr)

**Status:** Abgeschlossen  
**Backup:** `Backup_20251202_182010.tar.gz`  
**Datum:** 02. Dezember 2025, 18:20:10

### Behobene Probleme

#### 1. Render-Fehler: setBtp Referenzen in 5 Screens
**Problem:** Die Funktion `setBtp` wurde in mehreren Screens aufgerufen, war aber nicht als State definiert, was zu Render-Fehlern führte.

**Betroffene Screens:**
- ✅ **RundgangScreen.js**: `setBtp(currentUser?.btp ?? 0)` entfernt (Zeile 29)
- ✅ **KontaktScreen.js**: `setBtp(currentUser?.btp ?? 0)` entfernt (Zeile 29)
- ✅ **ImpressumScreen.js**: `setBtp(currentUser?.btp ?? 0)` entfernt (Zeile 29)
- ✅ **WeinboerseScreen.js**: `setBtp(0)` im Error-Handler entfernt (Zeile 157)
- ✅ **MeinWeinregalScreen.js**: `setBtp(0)` im Error-Handler entfernt (Zeile 186)

**Lösung:** Alle nicht benötigten `setBtp`-Aufrufe wurden entfernt, da diese Funktionen nicht verwendet werden.

**Hinweis:** `InfoBoxScreen.js` und `WeingueterScreen.js` haben einen `btp` State definiert (`const [btp, setBtp] = useState(0)`), daher sind die Aufrufe dort korrekt.

#### 2. RundgangScreen Button Design-Update
**Änderung:** Button-Styling von gelbem Button zu Glassmorphism-Design wie Dashboard-Container.

**Neue Features:**
- LinearGradient mit transparentem Hintergrund (`rgba(255, 255, 255, 0.08)` bis `rgba(255, 255, 255, 0.02)`)
- Weißer Border (`rgba(255, 255, 255, 0.2)`)
- Schatten wie Dashboard-Container
- Abgerundete Ecken (16px)
- Mindesthöhe 100px
- Responsive Breite (90%, max 300px)

**Neue Styles:**
- `startButtonTouchable`: Container für den Button
- `startButtonGlass`: LinearGradient-Container mit Glassmorphism-Effekt
- `startButtonLabel`: Text-Style mit weißer Schrift

### Rechtliche Screens überarbeitet

#### 3. ImpressumScreen vollständig überarbeitet
**Neue Struktur:** 9 Hauptabschnitte mit Trennlinien (⸻)

**Hauptänderungen:**
- Adresse erweitert: "Deutschland" hinzugefügt
- Überschrift geändert: "Rechtlicher Hinweis: Vermittlerrolle" → "Hinweis zur Plattform Bottle-Trade (Vermittlerrolle)"
- Texte aktualisiert: Vermittlerrolle, Altersbeschränkung und Haftungsausschluss überarbeitet
- Neuer Abschnitt: "Online-Streitbeilegung gemäß Art. 14 Abs. 1 ODR-VO" mit Link zur EU-Plattform
- Datenschutz-Abschnitt: Überarbeitet mit Hinweis auf die Datenschutzerklärung
- Styles korrigiert: Fehlerhafte `sectionTitle`-Definition behoben und `divider`-Style für Trennlinien hinzugefügt

**Abschnitte:**
1. Angaben gemäß § 5 TMG (mit Deutschland)
2. Kontakt
3. Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
4. Hinweis zur Plattform Bottle-Trade (Vermittlerrolle)
5. Altersbeschränkung
6. Haftungsausschluss (Haftung für Inhalte, Links, Tauschgeschäfte)
7. Online-Streitbeilegung gemäß Art. 14 Abs. 1 ODR-VO
8. Datenschutz

#### 4. DatenschutzScreen vollständig überarbeitet
**Neue Struktur:** 9 Hauptabschnitte mit Trennlinien (⸻)

**Hauptänderungen:**
- Neue Überschrift: "📄 Datenschutzerklärung für die Bottle-Trade App" mit Stand-Datum (01.12.2025)
- Detaillierte Datenkategorien:
  - 3.1 Registrierungs- und Profildaten
  - 3.2 Inhaltsdaten in der App
  - 3.3 Kommunikationsdaten
  - 3.4 Nutzungs- und Gerätedaten
  - 3.5 Adressweitergabe an Tauschpartner
- Firebase/Google Cloud: Abschnitt mit Details zu Dienstanbieter, EU-Standardvertragsklauseln und Rechtsgrundlagen
- Werbezwecke: Abschnitt, dass aktuell keine Werbe-Tracking-Tools verwendet werden
- Speicherdauer und Löschung: Erweitert mit Details zu Chat-Inhalten und Tausch-Historien
- Ihre Rechte: Erweitert mit Kontaktinformationen und zuständiger Aufsichtsbehörde (ULD Schleswig-Holstein)
- Datensicherheit: Abschnitt mit technischen Maßnahmen (TLS/HTTPS, Zugriffskontrollen, etc.)
- Änderungen: Abschnitt zur Aktualisierung der Datenschutzerklärung
- Styles hinzugefügt: `divider` und `boldText` Styles für die Formatierung

**Abschnitte:**
1. Verantwortlicher
2. Überblick über die Datenverarbeitung
3. Welche Daten verarbeiten wir?
   - 3.1 Registrierungs- und Profildaten
   - 3.2 Inhaltsdaten in der App
   - 3.3 Kommunikationsdaten
   - 3.4 Nutzungs- und Gerätedaten
   - 3.5 Adressweitergabe an Tauschpartner
4. Firebase / Google Cloud
5. Werden Daten zu Werbezwecken genutzt?
6. Speicherdauer und Löschung
7. Ihre Rechte
8. Datensicherheit
9. Änderungen dieser Datenschutzerklärung

### Geänderte Dateien
- `mobile-app/screens/RundgangScreen.js` - setBtp entfernt, Button Design geändert
- `mobile-app/screens/KontaktScreen.js` - setBtp entfernt
- `mobile-app/screens/ImpressumScreen.js` - setBtp entfernt, komplett überarbeitet
- `mobile-app/WeinboerseScreen.js` - setBtp entfernt
- `mobile-app/MeinWeinregalScreen.js` - setBtp entfernt
- `mobile-app/screens/DatenschutzScreen.js` - komplett überarbeitet

### Code-Qualität
- ✅ Keine Linter-Fehler
- ✅ Alle Render-Fehler behoben
- ✅ Styles korrekt definiert und verwendet
- ✅ Design-Konsistenz verbessert

### Rechtliche Compliance
- ✅ **ImpressumScreen**: Vollständige Angaben gemäß TMG, EU-konforme Online-Streitbeilegung, klare Vermittlerrolle, Altersbeschränkung (18+), Haftungsausschluss für Tauschgeschäfte
- ✅ **DatenschutzScreen**: DSGVO-konform, detaillierte Rechtsgrundlagen (Art. 6 DSGVO), Firebase/Google Cloud Transparenz, EU-Standardvertragsklauseln erwähnt, zuständige Aufsichtsbehörde (ULD Schleswig-Holstein), alle Nutzerrechte aufgelistet

### Backup-Informationen
- **Backup-Datei**: `Backup_20251202_182010.tar.gz`
- **Datum**: 02. Dezember 2025, 18:20:10
- **Inhalt**: Vollständiger Projektstand nach Render-Fehler-Behebung und rechtlicher Überarbeitung

### Session-Summary
- **Datei**: `Summarys/Summary_20251202_182010.md`
- **Datum**: 02. Dezember 2025, 18:20:10
- **Inhalt**: Vollständige Dokumentation aller Änderungen dieser Session

---

## 💰 Shop-System & PayPal-Integration (02. Dezember 2025, 22:39 Uhr)

**Status:** Production-ready  
**Backup:** `Backup_20251202_223921.tar.gz`  
**Datum:** 02. Dezember 2025, 22:39:21

### Implementierte Features

#### 1. Automatische Rechnungsgenerierung (PDF + E-Mail)

**Backend-Implementierung:**
- ✅ **Neue Datei**: `backend-api/generate_invoice.py`
  - PDF-Generierung mit ReportLab (A4-Format, deutsche Formatierung)
  - E-Mail-Versand mit SMTP (konfigurierbar)
  - Firestore-Integration für Bestell- und User-Daten
  - Vollständige Rechnung mit Firmendaten, Kundenadresse, Artikel-Liste, Preisübersicht

- ✅ **Endpoint**: `POST /orders/{order_id}/generate-invoice` in `main.py`
- ✅ **CORS-Middleware**: Hinzugefügt für Production-Kompatibilität
- ✅ **Dependencies**: `firebase-admin`, `reportlab`, `python-dotenv` zu `requirements.txt` hinzugefügt

**App-Integration:**
- ✅ **Neue Datei**: `mobile-app/services/invoiceService.js`
  - Service für Backend-Aufruf
  - Robuste Fehlerbehandlung mit Timeout (10 Sekunden)
  - Non-blocking: Bestellung bleibt als "paid" markiert, auch wenn Rechnung fehlschlägt

- ✅ **Neue Datei**: `mobile-app/config/api.js`
  - Zentrale API-URL-Konfiguration
  - Unterscheidung zwischen Development (`localhost`) und Production
  - Unterstützung für lokale IP-Adressen (echtes Gerät)

- ✅ **App.js**: Automatischer Aufruf nach erfolgreicher Zahlung
  - Deep Link Handler (nach PayPal-Rückkehr)
  - AppState-Fallback (wenn App wieder aktiv wird)
  - Non-blocking: Bestellung bleibt als "paid" markiert, auch wenn Rechnung fehlschlägt

**PDF-Rechnung enthält:**
- Firmendaten (Bottle-Trade)
- Bestellnummer und Datum
- Kundenadresse
- Artikel-Liste mit Preisen (inkl. Varianten)
- Preisübersicht (Netto, MwSt 19%, Versand, Gesamt)
- Zahlungsinformationen (PayPal Transaction ID)

**E-Mail-Versand:**
- Automatischer Versand nach PDF-Generierung
- PDF als Anhang
- Deutsche E-Mail-Vorlage
- Konfigurierbar über Umgebungsvariablen (SMTP)

#### 2. Bestellhistorie-Löschfunktion

- ✅ **Neue Funktion**: `deleteOrder` in `database-web.js`
  - Prüft, dass nur der Besitzer löschen kann
  - Löscht Bestellung aus Firestore

- ✅ **ProfilScreen.js**: Lösch-Button im Bestell-Detail-Modal hinzugefügt
  - Bestätigungsdialog vor dem Löschen
  - Automatisches Neuladen der Bestellungen nach Löschen
  - Styling: Roter Button mit weißem Text

#### 3. PayPal-Redirect-Verbesserungen

**HTML-Redirect-Seiten überarbeitet:**
- ✅ **payment-success.html** und **payment-cancel.html**:
  - iOS/Safari: Button-basierter Ansatz (vermeidet Popup)
  - Andere Browser: Automatischer Redirect
  - Bessere Browser-Erkennung
  - Klarere Anweisungen für Benutzer
  - Order-ID wird angezeigt

**Server-Dateien:**
- Dateien auf Server aktualisiert (`/home/bottleadmin/bottle-trade/app/static/`)
- Lokale Dateien synchronisiert
- Konsistente Implementierung

#### 4. Bestellstatus-Update-Verbesserungen

- ✅ **AppState-Fallback**: Prüft Bestellungen beim Zurückkommen zur App
  - Prüft alle "pending"-Bestellungen der letzten 10 Minuten
  - Aktualisiert automatisch auf "paid", wenn Zahlung erfolgreich war

- ✅ **ProfilScreen.js**: Lädt Bestellungen neu, wenn App wieder aktiv wird
  - AppState-Listener hinzugefügt
  - Automatisches Neuladen nach PayPal-Zahlung

- ✅ **PaymentSuccessScreen.js**: Fallback-Mechanismus
  - Aktualisiert Bestellung automatisch, wenn noch "pending"

### Geänderte Dateien

**Backend:**
- `backend-api/generate_invoice.py` (NEU)
- `backend-api/main.py` (CORS-Middleware hinzugefügt, Endpoint hinzugefügt)
- `backend-api/requirements.txt` (firebase-admin, reportlab hinzugefügt)
- `backend-api/README_INVOICE.md` (NEU - Setup-Anleitung)
- `backend-api/TESTEN_REchnung.md` (NEU - Test-Anleitung)
- `backend-api/PRODUCTION_SETUP.md` (NEU - Production-Setup)
- `backend-api/QUICK_START.md` (NEU - Quick Start)

**App:**
- `mobile-app/services/invoiceService.js` (NEU)
- `mobile-app/config/api.js` (NEU)
- `mobile-app/App.js` (Rechnungsgenerierung nach Zahlung, AppState-Fallback verbessert)
- `mobile-app/services/database-web.js` (deleteOrder Funktion hinzugefügt)
- `mobile-app/screens/ProfilScreen.js` (Lösch-Button hinzugefügt, AppState-Listener)
- `mobile-app/screens/PaymentSuccessScreen.js` (Fallback-Mechanismus)
- `mobile-app/public/payment/payment-success.html` (überarbeitet)
- `mobile-app/public/payment/payment-cancel.html` (überarbeitet)

### Dokumentation

**Neue Dokumentation:**
- `backend-api/README_INVOICE.md`: Setup-Anleitung für Rechnungsgenerierung
- `backend-api/TESTEN_REchnung.md`: Anleitung zum Testen der Rechnungsstellung
- `backend-api/PRODUCTION_SETUP.md`: Production-Setup-Anleitung
- `backend-api/QUICK_START.md`: Quick Start Guide
- `mobile-app/docs/FIRESTORE_INDEX_ERSTELLEN.md`: Anleitung zum Erstellen des Firestore Index

### Technische Details

**Rechnungsgenerierung:**
- **PDF-Bibliothek**: ReportLab
- **E-Mail**: SMTP (konfigurierbar)
- **Firebase**: Firestore für Bestell- und User-Daten
- **Format**: A4, deutsche Formatierung
- **Inhalt**: Vollständige Rechnung mit allen Details

**API-Konfiguration:**
- **Development**: `http://localhost:8000` (Emulator/Simulator)
- **Production**: `https://api.bottle-trade.de` (TODO: Anpassen)
- **Echtes Gerät**: Lokale IP-Adresse (z.B. `http://192.168.1.100:8000`)

**Fehlerbehandlung:**
- **Non-blocking**: Bestellung bleibt als "paid" markiert, auch wenn Rechnung fehlschlägt
- **Logging**: Detaillierte Logs für Debugging
- **Timeout**: 10 Sekunden Timeout für Backend-Aufrufe
- **Fallback**: Warnung statt Fehler, wenn Backend nicht erreichbar

### Status

**✅ Fertig implementiert:**
- PDF-Generierung
- E-Mail-Versand
- App-Integration
- Bestellhistorie-Löschfunktion
- PayPal-Redirect-Verbesserungen
- Bestellstatus-Update-Verbesserungen
- Konsistentes Gold-Design (#DAA520) für alle Buttons
- "Container" zu "Kacheln" Umbenennung
- Admin-Bereich Verbesserungen (Shop-Verwaltung, Bestellübersicht)
- Dashboard-Statistiken in Gold
- Google Maps-ähnliche rote Pins
- Versandkosten-Eingabe (Komma/Punkt) behoben

**⚠️ Noch zu konfigurieren (für Production):**
- Backend auf Server deployen
- Firebase Credentials hochladen
- E-Mail-SMTP konfigurieren
- Production-URL in `config/api.js` eintragen
- Dependencies installieren (`pip install -r requirements.txt`)

### Code-Qualität
- ✅ Keine Linter-Fehler
- ✅ Robuste Fehlerbehandlung
- ✅ Detaillierte Logging
- ✅ Production-ready Code

### Backup-Informationen
- **Backup-Datei**: `Backup_20251203_093241.tar.gz`
- **Datum**: 03. Dezember 2025, 09:32:41
- **Inhalt**: Vollständiger Projektstand nach Implementierung des Gold-Designs und Admin-Verbesserungen

### Session-Summary
- **Datei**: `Summarys/Summary_20251203_093241.md`
- **Datum**: 03. Dezember 2025, 09:32:41
- **Inhalt**: Vollständige Dokumentation aller Änderungen dieser Session (Gold-Design, Admin-Verbesserungen, Google Maps Pins, Versandkosten-Fix)

---

## 🛒 Shop-System

**Status:** ✅ Vollständig implementiert  
**Datum:** 02. Dezember 2025

### Überblick

Das Shop-System ermöglicht es, Bottle-Trade eigene Produkte (Zubehör, Weingläser, etc.) zu verkaufen. Der Shop wird vollständig durch Admins verwaltet und bietet eine vollständige E-Commerce-Funktionalität mit Warenkorb und PayPal-Integration.

### Implementierte Features

#### ShopScreen
- ✅ Container- und Listenansicht
- ✅ Echtzeit-Suche nach Produktname, Kategorie, Beschreibung
- ✅ Warenkorb-Icon mit Badge im Header
- ✅ Produkt-Detailansicht (Modal/Bottom-Sheet)
- ✅ "In den Warenkorb"-Button

#### WarenkorbScreen
- ✅ Produktliste mit Mengenänderung (+/-)
- ✅ Entfernen-Funktion
- ✅ Preisberechnung (Netto, MwSt 19%, Versand, Gesamt)
- ✅ PayPal-Checkout-Integration

#### AdminShopScreen
- ✅ Vollständige CRUD-Funktionalität
- ✅ Bild-Upload (bis zu 5 Bilder pro Produkt)
- ✅ Produkt-Varianten (Größen, etc.)
- ✅ Kategorien-Verwaltung
- ✅ Versandkosten-Verwaltung

### Datenstruktur (Firestore)

#### Collection: `products`
```javascript
{
  id: "product-123",
  name: "Premium Weinglas-Set",
  description: "Hochwertiges Set aus 6 Weingläsern...",
  category: "weinglaeser", // weinglaeser, oeffner, kuehler, geschenkboxen, sonstiges
  price: 29.99, // Netto-Preis (Float)
  priceGross: 35.69, // Brutto-Preis (berechnet: price * 1.19)
  taxRate: 19, // MwSt-Satz in Prozent (immer 19%)
  images: ["https://firebase-storage/.../image1.jpg", ...], // max 5 Bilder
  variants: [{ id: "variant-1", name: "Größe: Groß", price: 29.99, stock: 20 }], // Optional
  stock: 50, // Gesamt-Lagerbestand
  active: true, // Produkt aktiv/inaktiv
  size: "medium", // small, medium, large, xlarge (für Versandkosten)
  shippingCost: 4.99, // Versandkosten für diese Größe
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "admin-user-id"
}
```

#### Collection: `cart/{userId}/items`
```javascript
{
  productId: "product-123",
  quantity: 2,
  addedAt: Timestamp,
  priceAtTime: 29.99 // Preis zum Zeitpunkt des Hinzufügens
}
```

#### Collection: `orders`
```javascript
{
  id: "order-123",
  userId: "user-456",
  items: [{ productId: "product-123", quantity: 2, price: 29.99, priceGross: 35.69 }],
  subtotal: 59.98, // Netto
  tax: 11.40, // MwSt (19%)
  shippingCost: 4.99,
  total: 76.37, // Brutto
  status: "pending", // pending, paid, shipped, delivered, cancelled
  paymentMethod: "paypal",
  paymentId: "PAYPAL-123456",
  shippingAddress: { street: "...", zipCode: "...", city: "...", country: "Deutschland" },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Preisberechnung

- **Netto-Preis**: Basis-Preis (ohne MwSt)
- **MwSt**: 19% (immer)
- **Brutto-Preis**: Netto × 1.19
- **Versandkosten**: Abhängig von Produktgröße (small: 2.99€, medium: 4.99€, large: 6.99€, xlarge: 9.99€)
- **Versandkostenfrei**: Ab Bestellwert von 100€

### Integration

- **PayPal**: Vollständige Integration für Zahlungen
- **Rechnungsgenerierung**: Automatische PDF-Generierung nach Zahlung
- **E-Mail-Versand**: Rechnung wird per E-Mail versendet

---

## 💳 PayPal-Integration

**Status:** ✅ Production-ready  
**Datum:** 02. Dezember 2025

### Überblick

Vollständige PayPal-Integration für Shop-Zahlungen. Funktioniert sowohl in Sandbox als auch in Production. Die Umschaltung erfordert nur eine Änderung in der Konfiguration.

### Konfiguration

**Datei:** `mobile-app/config/paypal.js`

```javascript
export const PAYPAL_MODE = 'sandbox'; // oder 'production'
```

### Umschaltung auf Production

1. **Return URLs prüfen:**
   - `https://bottle-trade.de/shop/payment-success.html` muss existieren
   - `https://bottle-trade.de/shop/payment-cancel.html` muss existieren
   - Dateien müssen zum Deep Link weiterleiten: `bottletrade://payment-success?orderId=XXX`

2. **Production-Credentials prüfen:**
   - Production-App in PayPal Developer Dashboard erstellt
   - `clientId` und `secret` in `config/paypal.js` eingetragen
   - Business E-Mail verknüpft

3. **Modus umschalten:**
   ```javascript
   export const PAYPAL_MODE = 'production'; // ← Ändern!
   ```

### Automatische Features

- ✅ API-Credentials werden automatisch gewählt
- ✅ API-Endpunkte werden automatisch umgeschaltet
- ✅ OAuth 2.0 Token funktioniert identisch
- ✅ Payment Creation funktioniert identisch
- ✅ Return URLs werden automatisch angepasst
- ✅ Deep Link Handler funktioniert identisch
- ✅ AppState-Fallback prüft automatisch Bestellungen
- ✅ Rechnungsgenerierung funktioniert unabhängig vom Modus

### Return URLs

**Sandbox & Production:**
- Success: `https://bottle-trade.de/shop/payment-success.html?orderId=XXX`
- Cancel: `https://bottle-trade.de/shop/payment-cancel.html?orderId=XXX`

**WICHTIG:** Dateien müssen auf Server existieren und zum Deep Link weiterleiten.

---

## 🗄️ Firestore Datenbank-Schema

**Stand:** 12. November 2025  
**Version:** 2.0 (Phase 3)

### Notification-Dokument

**Pfad:** `users/{userId}/notifications/{notificationId}`

#### Standard-Felder
| Feld | Typ | Beschreibung | Standard |
|------|-----|--------------|----------|
| `id` | string | Dokument-ID | - |
| `type` | string | Notification-Typ | - |
| `title` | string | Titel | - |
| `message` | string | Nachrichtentext | - |
| `isRead` | boolean | Gelesen-Status | `false` |
| `isArchived` | boolean | Archiviert-Status | `false` |
| `isCompleted` | boolean | Abgeschlossen-Status | `false` |
| `priority` | string | Priorität (`low`, `medium`, `high`) | `medium` |
| `createdAt` | timestamp | Erstellungszeitpunkt | `serverTimestamp()` |

#### Notification-Typen

**`type: 'hint-decision'`** (EntscheidungsHinweis - Rot)
- `requestId`, `fromUserId`, `toUserId`, `wineId`, `wineTitle`

**`type: 'hint-small'`** (Kleiner Hinweis - Gelb)
- `requestId`, `fromUserId`, `toUserId`, `chatId` (optional)

**`type: 'chat'`** (Chat-Message - Grün)
- `chatId`, `senderId`, `toUserId`, `messageText`

**`type: 'system'`** (System-Nachricht - Blau)
- `systemType`, `actionUrl` (optional)

### Firestore-Indizes

**WICHTIG:** Folgende Indizes müssen erstellt werden:

1. **Ungelesene Notifications:**
   - Collection: `users/{userId}/notifications`
   - Fields: `isRead` (ASC), `createdAt` (DESC)

2. **Bestellungen:**
   - Collection: `orders`
   - Fields: `userId` (ASC), `createdAt` (DESC)

**Anleitung:** Siehe `mobile-app/docs/FIRESTORE_INDEX_ERSTELLEN.md`

---

## 🤖 Zukünftige Features

### KI-basierte Wein-Etikett-Erkennung

**Status:** 🚧 Konzeptphase  
**Datum:** 02. Dezember 2025

#### Überblick

Automatische Extraktion von Wein-Daten aus Etikett-Bildern. Das System analysiert Wein-Etiketten und füllt automatisch alle relevanten Formularfelder aus.

#### Extrahierte Daten

- Name des Weines
- Weingut
- Website (falls vorhanden)
- Jahrgang
- Anbauregion
- Rebsorte
- Geschmacksrichtung
- Preis (falls vorhanden)
- Beschreibung (optional)

#### Empfohlener Ansatz: Hybrid

**Technologien:**
- **Primär**: Google Cloud Vision API (hohe Genauigkeit)
- **Fallback**: Tesseract.js (kostenlos, offline)
- **NLP**: Regex-Patterns + Wein-Datenbank-Lookup

**Kosten:**
- Google Cloud Vision: ~$1.50 pro 1.000 Bilder (erste 1.000/Monat kostenlos)
- Tesseract.js: Kostenlos

**Vorteile:**
- ✅ Beste Genauigkeit durch Kombination
- ✅ Fallback bei API-Ausfällen
- ✅ Kostenoptimiert
- ✅ Flexibel erweiterbar

**Implementierung:**
- Service: `services/wineLabelAnalyzer.js` (noch zu erstellen)
- Screen: `screens/MeinWeinregalBefuellenKIScreen.js` (bereits erstellt, Mock-KI)

**Detaillierte Dokumentation:** Siehe `mobile-app/docs/KONZEPT_KI_ETIKETT_ERKENNUNG.md`

---

## 🔍 Code-Überprüfung & Optimierung

**Status:** ✅ Abgeschlossen  
**Datum:** 03. Dezember 2025

### Überblick

Umfassende Code-Überprüfung wurde in 3 Phasen durchgeführt. Alle Änderungen sind sicher, reversibel und die Funktionalität bleibt vollständig erhalten.

### Phase 1: Analyse
- ✅ App.js analysiert (~6800 Zeilen)
- ✅ Services analysiert (database-web.js, testAuth.js)
- ✅ Screens analysiert
- ✅ Probleme identifiziert
- ✅ Analyse-Report erstellt

### Phase 2: Sichere Änderungen
- ✅ Unused Imports entfernt (ImageBackground, Image, ScrollView, TEST_USERS)
- ✅ Doppeltes Auto-Login useEffect entfernt
- ✅ Message-Subscriptions Cleanup verbessert

### Phase 3: Performance-Optimierungen
- ✅ useMemo/useCallback Imports hinzugefügt
- ✅ Event-Handler optimiert (handleLogin, handleLogout, handleNavigate, etc.)
- ✅ Performance verbessert (weniger Re-Renders)

### Ergebnis

**Vorher:**
- ⚠️ Code-Duplikation
- ⚠️ Unused Imports
- ⚠️ Memory Leaks (Message-Subscriptions)
- ⚠️ Performance (Handler bei jedem Render neu)

**Nachher:**
- ✅ Keine Code-Duplikation
- ✅ Sauberer Code
- ✅ Memory Leaks behoben
- ✅ Performance optimiert

**Detaillierte Dokumentation:** Siehe `mobile-app/docs/CODE_UEBERPRUEFUNG_ABGESCHLOSSEN.md`

---

## 📚 Weitere Dokumentation

### Wichtige Dokumente im `docs/` Ordner

**Code-Überprüfung:**
- `CODE_UEBERPRUEFUNG_ABGESCHLOSSEN.md` - Finale Zusammenfassung
- `PHASE2_AENDERUNGEN.md` - Phase 2 Dokumentation
- `PHASE3_AENDERUNGEN.md` - Phase 3 Dokumentation
- `ANALYSE_REPORT_CODE_UEBERPRUEFUNG.md` - Detaillierter Analyse-Report

**PayPal:**
- `PAYPAL_PRODUCTION_UMSCHALTUNG.md` - Production-Umschaltung Anleitung
- `PAYPAL_TESTEN_MIT_PRODUCTION.md` - Testing-Anleitung

**Firestore:**
- `FIRESTORE_SCHEMA.md` - Datenbank-Schema
- `FIRESTORE_INDEX_ERSTELLEN.md` - Index-Erstellung Anleitung

**Zukünftige Features:**
- `KONZEPT_KI_ETIKETT_ERKENNUNG.md` - KI-Etikett-Erkennung Konzept
- `KONZEPT_SHOP_SYSTEM.md` - Shop-System Konzept (bereits implementiert)

---

**Aktualisiert am:** 03. Dezember 2025, 10:30 Uhr

