# Analyse: Ansetzpunkte für Notification-Refactor

**Datum:** 12. November 2025  
**Status:** Analyse abgeschlossen

---

## ✅ Was bereits funktioniert (BEIBEHALTEN)

### Trade-Request-System (FERTIG)
1. **`createTradeRequest`** (App.js Zeile 2968-3075)
   - ✅ Erstellt Trade-Request in Firestore
   - ✅ Markiert Wein als "in Tausch involviert"
   - ✅ **WICHTIG:** Kein direkter Aufruf von `ensureTradeNotification` mehr
   - ✅ Subscriptions übernehmen automatisch die Erstellung

2. **Trade-Request-Subscriptions** (App.js Zeile 330-379)
   - ✅ `subscribeIncomingTradeRequests` - für B (Empfänger)
   - ✅ `subscribeOutgoingTradeRequests` - für A (Absender)
   - ✅ Rufen `ensureTradeNotification` auf bei neuen Trade-Requests
   - ✅ **BEIBEHALTEN:** Diese Logik funktioniert!

3. **`ensureTradeNotification`** (App.js Zeile 3088-3383)
   - ✅ Erstellt Hinweise (`hint-decision` für B, `hint-small` für A)
   - ✅ Erstellt Notifications (`type: 'trade'` oder `type: 'trade-info'`)
   - ✅ **ANPASSEN:** Notification-Typen ändern zu `hint-decision` und `hint-small`

4. **`createTradeDecisionHints`** (App.js Zeile 3407-3780)
   - ✅ Erstellt Hinweise bei Trade-Akzeptierung/Ablehnung
   - ✅ Erstellt Notifications (`type: 'trade-info'`)
   - ✅ **ANPASSEN:** Notification-Typen ändern zu `hint-small`

5. **`acceptTradeRequest`** (App.js Zeile 4079-4280)
   - ✅ Setzt Trade-Request Status auf 'accepted'
   - ✅ Erstellt Chat (`fsCreateChat`)
   - ✅ Erstellt Notifications für beide User
   - ✅ **ANPASSEN:** Reihenfolge und Notification-Typen

6. **Firestore-Funktionen** (`database-web.js`)
   - ✅ `createNotification` - funktioniert, aber Typen anpassen
   - ✅ `getNotificationsForUser` - funktioniert, Filter anpassen
   - ✅ `subscribeNotificationsForUser` - funktioniert, Filter anpassen
   - ✅ `createChat`, `createTradeHint` - funktionieren, beibehalten

---

## 🔧 Was angepasst werden muss

### 1. Notification-Typen ändern

**Aktuell:**
- `type: 'trade'` → für Trade-Requests
- `type: 'trade-info'` → für Trade-Informationen
- `type: 'message'` → für Chat-Messages
- `type: 'chat'` → für Chat-Erstellung

**Neu:**
- `type: 'hint-decision'` → EntscheidungsHinweis (Rot)
- `type: 'hint-small'` → Kleiner Hinweis (Gelb)
- `type: 'chat'` → Chat-Message (Grün)
- `type: 'system'` → System-Nachricht (Blau)

**Ansetzpunkte:**
- `ensureTradeNotification` (App.js Zeile 3088) - Zeile 3263, 3343
- `createTradeDecisionHints` (App.js Zeile 3407) - Zeile 3674, 3752
- `acceptTradeRequest` (App.js Zeile 4079) - Zeile 4252, 4261
- `createNotification` (database-web.js Zeile 1926) - Typ-Validierung anpassen

---

### 2. Badge-Berechnung vereinfachen

**Aktuell:**
- `refreshNotificationBadges` (App.js Zeile 2400-2700)
- Trennt `unreadNotifications` und `unreadHints`
- Komplexe Berechnung mit `chatUnreadFromChats` und `extraChatNotifications`

**Neu:**
- Nur noch `unreadCount` (Gesamtanzahl)
- Einfache Zählung: `notifications.filter(n => !n.isRead).length`
- Keine Trennung mehr

**Ansetzpunkte:**
- `refreshNotificationBadges` (App.js Zeile 2400) - komplett vereinfachen
- State: `unreadNotifications` und `unreadHints` → `unreadCount`
- `BottomNavigation.js` - Props anpassen

---

### 3. InfoBox zu Screen umbauen

**Aktuell:**
- `NewsPopup.js` - Popup mit zwei Icons (Glocke, Glühbirne)
- Wird über `BottomNavigation.js` geöffnet
- Separate Badges für Notifications und Hints

**Neu:**
- `InfoBoxScreen.js` - vollständiger Screen
- WhatsApp-ähnliche Liste
- Direkter Aufruf über `BottomNavigation.js`

**Ansetzpunkte:**
- `NewsPopup.js` - entfernen oder umbauen
- `BottomNavigation.js` - direkter Screen-Aufruf statt Popup
- `App.js` - neuen Screen `'infobox'` hinzufügen

---

### 4. Neue Services erstellen

**Ansetzpunkte:**
- `services/notificationService.js` - NEU erstellen
- `services/chatNotificationHandler.js` - NEU erstellen
- `services/tradeNotificationHandler.js` - NEU erstellen

**Migration:**
- Alte Logik aus `App.js` in neue Services verschieben
- `ensureTradeNotification` → `tradeNotificationHandler.handleTradeRequestCreated`
- `createTradeDecisionHints` → `tradeNotificationHandler.handleTradeRequestAccepted/Rejected`
- `createNotificationsForNewMessages` → `chatNotificationHandler.createChatNotification`

---

### 5. Event-Trigger anpassen

**Ansetzpunkte:**
- Trade-Request-Subscriptions (App.js Zeile 330) - Notification-Typen anpassen
- Chat-Message-Subscriptions (App.js Zeile 1303, 1796) - Notification-Typen anpassen
- `addMessage` (App.js Zeile 1520) - Notification-Erstellung anpassen

---

### 6. UI-Anpassungen

**Ansetzpunkte:**
- `InfoBoxScreen.js` - NEU erstellen
- `ChatListScreen.js` - nach WhatsApp-Plan umbauen
- `HinweisScreen.js` - nach WhatsApp-Plan umbauen
- `NotificationsScreen.js` - anpassen
- `BottomNavigation.js` - Badge und Navigation anpassen

---

## 📍 Konkrete Ansetzpunkte nach Phase

### Phase 2: Code-Bereinigung

**App.js:**
1. **Zeile 103-104:** State vereinfachen
   ```javascript
   // ALT:
   const [unreadNotifications, setUnreadNotifications] = useState(0);
   const [unreadHints, setUnreadHints] = useState(0);
   
   // NEU:
   const [unreadCount, setUnreadCount] = useState(0);
   ```

2. **Zeile 2400-2700:** `refreshNotificationBadges` vereinfachen
   - Komplexe Berechnung entfernen
   - Einfache Zählung: `notifications.filter(n => !n.isRead && !n.isArchived).length`

3. **Zeile 3088-3383:** `ensureTradeNotification` anpassen
   - Notification-Typen ändern: `'trade'` → `'hint-decision'`, `'trade-info'` → `'hint-small'`

4. **Zeile 3407-3780:** `createTradeDecisionHints` anpassen
   - Notification-Typen ändern: `'trade-info'` → `'hint-small'`

5. **Zeile 4079-4280:** `acceptTradeRequest` anpassen
   - Reihenfolge: Gleichzeitige Erstellung (Promise.all)
   - Notification-Typen anpassen

**database-web.js:**
1. **Zeile 1926-2003:** `createNotification` anpassen
   - Typ-Validierung für neue Typen
   - `isArchived`, `isCompleted` Felder hinzufügen

2. **Zeile 2005-2076:** `getNotificationsForUser` anpassen
   - Filter für neue Typen
   - `isArchived: false` Filter hinzufügen

3. **Zeile 2077-2212:** `subscribeNotificationsForUser` anpassen
   - Filter für neue Typen
   - `isArchived: false` Filter hinzufügen

**Komponenten:**
1. **`NewsPopup.js`** - entfernen oder umbauen
2. **`BottomNavigation.js`** - direkter Screen-Aufruf, Badge vereinfachen

---

### Phase 3: Neue Datenstruktur

**Firestore-Schema:**
- Bestehende Notifications haben alte Typen → Migration optional
- Neue Notifications mit neuen Typen erstellen
- `isArchived`, `isCompleted` Felder hinzufügen

---

### Phase 4: Core-Services

**Neue Dateien:**
- `services/notificationService.js` - Zentrale Notification-Verwaltung
- `services/chatNotificationHandler.js` - Chat-spezifische Handler
- `services/tradeNotificationHandler.js` - Trade-spezifische Handler

**Migration:**
- Logik aus `App.js` in neue Services verschieben
- Schrittweise Migration (alte Logik parallel laufen lassen)

---

### Phase 5: UI-Integration

**Neue Dateien:**
- `screens/InfoBoxScreen.js` - NEU erstellen

**Anpassungen:**
- `BottomNavigation.js` - Navigation und Badge
- `ChatListScreen.js` - WhatsApp-ähnliches Layout
- `HinweisScreen.js` - WhatsApp-ähnliches Layout
- `NotificationsScreen.js` - Anpassen

---

## 🎯 Strategie: Schrittweise Migration

### Schritt 1: Notification-Typen anpassen (Phase 2)
- Alte Typen (`'trade'`, `'trade-info'`) durch neue Typen ersetzen
- Bestehende Logik beibehalten, nur Typen ändern
- **Risiko:** Niedrig - nur String-Änderungen

### Schritt 2: Badge-Berechnung vereinfachen (Phase 2)
- `refreshNotificationBadges` vereinfachen
- State vereinfachen (`unreadCount` statt `unreadNotifications` + `unreadHints`)
- **Risiko:** Mittel - State-Änderungen in vielen Komponenten

### Schritt 3: Neue Services parallel entwickeln (Phase 4)
- Neue Services erstellen
- Alte Logik parallel laufen lassen
- Schrittweise Migration
- **Risiko:** Niedrig - keine Breaking Changes

### Schritt 4: UI umbauen (Phase 5)
- InfoBoxScreen erstellen
- BottomNavigation anpassen
- **Risiko:** Mittel - UI-Änderungen

### Schritt 5: Alte Logik entfernen (Phase 2, nach Migration)
- Alte Funktionen entfernen
- Neue Services vollständig integrieren
- **Risiko:** Niedrig - nach erfolgreicher Migration

---

## ⚠️ Wichtige Erkenntnisse

1. **Trade-Request-System ist FERTIG:**
   - `createTradeRequest` funktioniert
   - Subscriptions funktionieren
   - **NUR:** Notification-Typen anpassen

2. **Hinweis-Erstellung funktioniert:**
   - `ensureTradeNotification` erstellt Hinweise korrekt
   - `createTradeDecisionHints` erstellt Hinweise korrekt
   - **NUR:** Notification-Typen anpassen

3. **Chat-Erstellung funktioniert:**
   - `acceptTradeRequest` erstellt Chat korrekt
   - **NUR:** Reihenfolge optimieren (gleichzeitig) und Notification-Typen anpassen

4. **Notification-System funktioniert grundsätzlich:**
   - Firestore-Integration funktioniert
   - Subscriptions funktionieren
   - **NUR:** Typen, Filter und UI anpassen

---

## 🚀 Empfohlene Reihenfolge

1. **Phase 2.1:** Notification-Typen anpassen (niedriges Risiko)
2. **Phase 2.2:** Badge-Berechnung vereinfachen (mittleres Risiko)
3. **Phase 4:** Neue Services parallel entwickeln (niedriges Risiko)
4. **Phase 5:** UI umbauen (mittleres Risiko)
5. **Phase 2.3:** Alte Logik entfernen (niedriges Risiko, nach Migration)

---

**Status:** ✅ Analyse abgeschlossen, bereit für Phase 2

