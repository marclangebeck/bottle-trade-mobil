# Bottle-Trade Mobile App - Projekt Dokumentation

**Stand:** 29. Oktober 2025  
**Version:** 1.1  
**Letzte Aktualisierung:** Welcome-Screen Buttons-Layout optimiert & modernisiert

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
- **Hintergrundfarbe:** `#d5dfe0` (Helles Blau-Grau) - Auf allen Screens als Haupt-Hintergrundfarbe
- **Header-Hintergrund:** `#2f3a3b` (Dunkles Grau-Grün)
- **Header-Borders:** `rgba(255, 255, 255, 0.3)` - Subtil weiße Linien oben/unten

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
- Titel: `fontSize: 32`, `fontWeight: 'bold'`, `color: '#FFFFFF'`, `textAlign: 'center'`
- Text und Logo vertikal zentriert mit `alignItems: 'center'`

**Hamburger-Menü:**
- 3 weiße Linien (`hamburgerLine`)
- `width: 22`, `height: 2.5`, `marginVertical: 3`
- `backgroundColor: '#FFFFFF'`, `borderRadius: 1.5`

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
│   ├── BtpScreen.js
│   ├── ProfilScreen.js
│   ├── AdminSurveysScreen.js
│   ├── SurveyAnswerScreen.js
│   ├── SurveyResultsScreen.js
│   ├── AdminNewsletterScreen.js
│   ├── NewsletterReaderScreen.js
│   ├── AdminSystemMessagesScreen.js
│   ├── SystemMessageReaderScreen.js
│   └── WeineScreen.js
├── services/
│   ├── testAuth.js                # Test-Authentication Service
│   ├── testChatData.js            # Test-Chat-Daten
│   └── ...
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
  - BtpScreen.js
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
2. **LoginScreen** - Anmeldung
3. **RegisterScreen** - Registrierung
4. **InfoScreen** - App-Informationen
5. **DashboardScreen** - Haupt-Dashboard (nach Login)
6. **WeinboerseScreen** - Weinbörse/Marktplatz
7. **MeinWeinregalScreen** - Nutzer-Weinregal
8. **WeinregalBefuellenScreen** - Wein hinzufügen
9. **ShopScreen** - Bottle-Trade-Shop
10. **CommunityScreen** - Community-Bereich
11. **StartScreen** - Startseite

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
- **BtpScreen** - Bottle Trade Points
- **ProfilScreen** - Nutzer-Profil
- **SurveyAnswerScreen** - Umfrage beantworten
- **SurveyResultsScreen** - Umfrage-Ergebnisse
- **NewsletterReaderScreen** - Newsletter lesen
- **SystemMessageReaderScreen** - Systemnachricht lesen
- **WeineScreen** - Weine-Übersicht

---

## 🔐 Authentication & Benutzer-Management

**Service:** `services/testAuth.js`

**Funktionen:**
- `loginUser(emailOrUsername, password)`
- `registerUser(email, password, userData)`
- `logoutUser()`
- `getCurrentUser()`
- `onAuthStateChange(callback)`

**Login-Logik:**
- Automatische Weiterleitung nach erfolgreichem Login zu `'home'` (Dashboard)
- Admin-Status wird erkannt und gesetzt
- Logout führt zurück zu `'welcome'`

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

### Benachrichtigungen
- System-Benachrichtigungen
- Survey-Benachrichtigungen
- Newsletter-Benachrichtigungen
- Chat-Benachrichtigungen
- Ungelesen-Counter (`unreadNotifications`)

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
5. Hintergrundfarbe `#d5dfe0` verwenden

### Testing:
- Expo Server läuft auf Port 8081 mit Tunnel-Modus
- `npx expo start --tunnel --clear --port 8081`

---

## 🔄 Backup-Informationen

**Letztes Backup:**
- **Datei:** `backup_20251029_141154.tar.gz`
- **Größe:** 129 MB
- **Datum:** 29. Oktober 2025, 14:11:54
- **Speicherort:** `/home/bottleadmin/bottle-trade-mobile/`
- **Inhalt:** Vollständiger Projektstand nach Welcome-Screen Button-Modernisierung & Layout-Optimierung

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

---

**Hinweis für neue Agents:**  
Diese Dokumentation sollte bei größeren Änderungen aktualisiert werden. Insbesondere:
- Neue Screens hinzufügen
- Design-Änderungen dokumentieren
- Bug-Fixes eintragen
- Neue Features beschreiben

**Aktualisiert am:** 29. Oktober 2025, 14:30 Uhr

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

