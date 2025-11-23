# Bottle-Trade Mobile App - Projekt Dokumentation

**Stand:** 19. November 2025  
**Version:** 1.3  
**Letzte Aktualisierung:** InfoBoxScreen Chat-Integration (WhatsApp-ähnlich), Chat-Löschung mit "Chat verlassen" Status

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

- Chat muss 2x geswiped werden, um gelöscht zu werden (sollte nur 1x sein)
- Wenn einer den Chat löscht, soll beim anderen "Chat verlassen" angezeigt werden
- "Chat verlassen" Einträge sollen im ersten Versuch gelöscht werden können

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

### 9. November 2025 - Header-Herz & InfoBox Popup
- Herz-Icon unter dem Hamburger-Menü auf allen relevanten Headern vereinheitlicht und Animation angepasst
- `NewsPopup` der InfoBox präzise über dem Button verankert, Icons vertikal gestapelt und Glasmorph-Styling hinzugefügt
- Dashboard-Kacheln mit linearem Verlauf (`#f1e9dd → #e6dccf`) modernisiert
- Backup erstellt: `Backup_20251109_193012.tar.gz`

---

**Hinweis für neue Agents:**  
Diese Dokumentation sollte bei größeren Änderungen aktualisiert werden. Insbesondere:
- Neue Screens hinzufügen
- Design-Änderungen dokumentieren
- Bug-Fixes eintragen
- Neue Features beschreiben

**Aktualisiert am:** 19. November 2025, 22:19 Uhr

---

## 🔄 Backup-Informationen

**Letztes Backup:**
- **Datei:** `backup_20251119_221712.tar.gz`
- **Größe:** 2.97 GB
- **Datum:** 19. November 2025, 22:17:12
- **Speicherort:** `/home/bottleadmin/bottle-trade-mobile/`
- **Inhalt:** Vollständiger Projektstand nach Notification-Duplikat-Fixes und Chat-Persistenz-Fixes

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

