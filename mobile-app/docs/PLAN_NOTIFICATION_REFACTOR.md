# Notification-System Refactor – Vollständiger Plan

**Datum:** 12. November 2025  
**Status:** Planungsphase  
**Backup:** `Backup_Notification_Refactor_20251112_144034.tar.gz` (84 MB)

---

## 📋 Übersicht

Das Notification-System wird komplett neu aufgebaut mit dem Ziel:
- **Vereinheitlichung:** Nur noch eine Notification-Art (keine Trennung zwischen Chats, Hinweisen, etc.)
- **Vereinfachung:** Klare, fehlerresistente Architektur
- **Robustheit:** Transparente Datenflüsse, keine Redundanzen
- **Erweiterbarkeit:** Leicht erweiterbar für zukünftige Features

---

## 🎯 Ziel-Architektur

### Konzept
- **Eine Notification-Art** mit `type`-Feld zur Unterscheidung (chat, trade, system, etc.)
- **Eine InfoBox** zeigt alle Notifications in einer Liste
- **Farbcodierung** zur visuellen Unterscheidung der Typen
- **Firestore als Single Source of Truth**
- **Keine Redundanzen** zwischen Chats, Hints und Notifications

### Datenstruktur

#### Firestore: `users/{userId}/notifications/{notificationId}`
```javascript
{
  id: string,                    // Auto-generiert von Firestore
  type: 'hint-decision' | 'hint-small' | 'chat' | 'system',  // Notification-Typ (fehlerresistent)
  title: string,                  // Titel der Notification
  message: string,                // Nachrichtentext
  priority: 'low' | 'medium' | 'high',
  isRead: boolean,                // Gelesen-Status
  isArchived: boolean,            // Archiviert-Status (nach Swipe-to-Delete)
  isCompleted: boolean,           // Abgeschlossen-Status (grau ausgrauen)
  createdAt: Timestamp,           // Erstellungszeitpunkt
  readAt: Timestamp | null,       // Gelesen-Zeitpunkt
  archivedAt: Timestamp | null,   // Archivierungszeitpunkt
  
  // Typ-spezifische Daten (optional, je nach type)
  chatId: string | null,          // Für type: 'chat'
  tradeRequestId: string | null,  // Für type: 'hint-decision' | 'hint-small'
  hintId: string | null,          // Für type: 'hint-decision' | 'hint-small'
  senderId: string | null,        // Für type: 'chat'
  senderName: string | null,      // Für type: 'chat'
  messageId: string | null,       // Für type: 'chat' (spezifische Message)
  
  // Metadata
  actionUrl: string | null,       // URL/Screen zum Navigieren
  actionData: object | null,      // Zusätzliche Daten für Navigation
}
```

**Farbcodierung in InfoBox:**
- `hint-decision`: **Rot** (#F44336) - EntscheidungsHinweis
- `hint-small`: **Gelb** (#FFC107) - Kleiner Hinweis
- `chat`: **Grün** (#4CAF50) - Chat-Message
- `system`: **Blau** (#2196F3) - Nachricht vom Administrator

#### Firestore: `chats/{chatId}`
```javascript
{
  id: string,
  participants: string[],         // User-IDs
  participantNames: string[],     // Namen der Teilnehmer
  lastMessage: string,            // Letzte Nachricht
  lastMessageTime: string,        // Zeit der letzten Nachricht
  lastMessageSenderId: string,    // Sender der letzten Nachricht
  unreadCount: number,            // Anzahl ungelesener Nachrichten
  readBy: string[],               // User-IDs, die gelesen haben
  createdAt: Timestamp,
  updatedAt: Timestamp,
  // ... weitere Chat-Felder
}
```

**WICHTIG:** 
- Chats bleiben als separate Entität bestehen, aber Notifications werden nur noch für ungelesene Nachrichten erstellt.
- **Trade-Requests sind die Basis:** Chats und Hinweise entstehen durch akzeptierte Trade-Requests!
- Bei Trade-Request-Akzeptierung werden automatisch Chat und Hinweis erstellt, sowie entsprechende Notifications.

---

## 📅 Zeitplan

### Phase 1: Backup & Analyse (1-2 Stunden) ✅
- ✅ Vollständiges Backup erstellen
- ✅ Aktuelle Struktur dokumentieren
- ✅ Zu entfernende Code-Bereiche identifizieren
- ✅ **ANALYSE_ANSETZPUNKTE.md** erstellt mit detaillierten Ansetzpunkten

**Wichtige Erkenntnisse:**
- ✅ Trade-Request-System ist **FERTIG** und funktioniert
- ✅ Hinweis-Erstellung funktioniert (`ensureTradeNotification`, `createTradeDecisionHints`)
- ✅ Chat-Erstellung funktioniert (`acceptTradeRequest`)
- ✅ Notification-System funktioniert grundsätzlich
- 🔧 **NUR anpassen:** Notification-Typen, Badge-Berechnung, UI

### Phase 2: Code-Bereinigung (3-4 Stunden)
- **WICHTIG:** Trade-Request-System ist bereits fertig und funktioniert!
- **KRITISCH:** Alte Codezeilen müssen **KOMPLETT** entfernt/ersetzt werden, damit sie keine Auswirkung mehr haben!

**Aufgaben:**
1. **Notification-Typen komplett ersetzen:**
   - Alle `type: 'trade'` → `type: 'hint-decision'` oder `'hint-small'`
   - Alle `type: 'trade-info'` → `type: 'hint-small'`
   - Alle `type: 'message'` → `type: 'chat'`
   - **WICHTIG:** Keine alten Typen mehr verwenden!
2. **State vereinfachen:**
   - `unreadNotifications` und `unreadHints` → `unreadCount`
   - **KOMPLETT entfernen:** Alle Verwendungen von `unreadNotifications` und `unreadHints`
   - **KOMPLETT ersetzen:** In allen Komponenten und Screens

3. **Badge-Berechnung komplett neu:**
   - Alte `refreshNotificationBadges` komplett entfernen
   - Neue einfache Berechnung: `notifications.filter(n => !n.isRead && !n.isArchived).length`
   - **WICHTIG:** Keine alte Logik mehr verwenden!

4. **Filter komplett ersetzen:**
   - Alle Filter für `'trade'`, `'trade-info'`, `'message'` entfernen
   - Neue Filter für `'hint-decision'`, `'hint-small'`, `'chat'`, `'system'`
   - **WICHTIG:** Keine alten Filter mehr verwenden!

5. **Komponenten anpassen:**
   - Alle Props `unreadNotifications` und `unreadHints` → `unreadCount`
   - `NewsPopup.js` entfernen oder komplett umbauen
   - `BottomNavigation.js` Props anpassen

**Siehe:** 
- `ANALYSE_ANSETZPUNKTE.md` für detaillierte Ansetzpunkte mit Zeilen-Nummern
- `PHASE2_CHECKLIST.md` für vollständige Checkliste aller zu ändernden Dateien

### Phase 3: Neue Datenstruktur (1-2 Stunden) ✅
- ✅ Firestore-Schema definieren (`FIRESTORE_SCHEMA.md`)
- ✅ Neue Felder implementiert (`isArchived`, `isCompleted`)
- ✅ Filter in `getNotificationsForUser` und `subscribeNotificationsForUser` angepasst
- ✅ Migration-Skript erstellt (`scripts/migrate-notifications.js`) - OPTIONAL

### Phase 4: Core-Services (3-4 Stunden) ✅
- ✅ Neue `notificationService.js` erstellt (zentrale Verwaltung)
- ✅ `chatNotificationHandler.js` erstellt (Chat-spezifisch)
- ✅ `tradeNotificationHandler.js` erstellt (Trade-spezifisch)
- ✅ Neue Funktionen: `archiveNotification`, `markNotificationAsCompleted`
- ⏳ Integration in App.js (optional - kann später erfolgen)

### Phase 5: UI-Integration (2-3 Stunden) ✅
- ✅ InfoBoxScreen.js erstellt (WhatsApp-ähnliche Liste)
- ✅ Farbcodierung implementiert (Rot, Gelb, Grün, Blau)
- ✅ Swipe-to-Delete implementiert (archiviert Notification)
- ✅ Mark as Completed implementiert (grau ausgrauen)
- ✅ Navigation integriert (ChatRoomScreen, HinweisScreen)
- ✅ BottomNavigation angepasst (direkter Screen-Aufruf)
- ✅ App.js Integration

### Phase 6: Event-Trigger (1-2 Stunden)
- **WICHTIG:** Event-Trigger funktionieren bereits!
- **NUR anpassen:** Notification-Typen in bestehenden Triggern
- Chat-Nachrichten → `type: 'chat'` Notification (bereits implementiert)
- Trade-Requests → `type: 'hint-decision'` / `'hint-small'` Notifications (anpassen)
- System-Nachrichten → `type: 'system'` Notification (anpassen)

### Phase 7: Testing & Optimierung (2-3 Stunden)
- Tests durchführen
- Edge Cases prüfen
- Performance optimieren

### Phase 8: Trade-Request-Anpassung (1-2 Stunden)
- **WICHTIG:** Trade-Request-System ist bereits fertig!
- **NUR anpassen:** Notification-Typen in Trade-Request-Handlern
- Reihenfolge optimieren (gleichzeitige Erstellung)
- ChatRoomScreen automatisch für B öffnen
- Finale Tests

**Gesamtzeit:** ~15-21 Stunden (2-3 Arbeitstage)

**WICHTIG:** Trade-Requests funktionieren bereits - wir passen nur die Notification-Typen und UI an!

---

## 🧹 Schritt 2: Code-Bereinigung

### Zu entfernende Funktionen in `App.js`:
- `refreshNotificationBadges` (komplett neu)
- `createNotificationsForNewMessages` (wird ersetzt)
- `addMessage` Notification-Logik (wird vereinfacht)
- Alle `unreadNotifications` / `unreadHints` State-Management
- Badge-Berechnungslogik

### Zu entfernende Funktionen in `database-web.js`:
- `createNotification` (wird neu geschrieben)
- `getNotificationsForUser` (wird neu geschrieben)
- `subscribeNotificationsForUser` (wird neu geschrieben)
- `markNotificationAsRead` (wird neu geschrieben)
- `deleteNotification` (wird neu geschrieben)
- `deleteNotificationsForHint` (wird durch `type`-Filter ersetzt)
- `deleteNotificationsForChat` (wird durch `type`-Filter ersetzt)
- `deleteNotificationsForTradeRequest` (wird durch `type`-Filter ersetzt)

### Zu entfernende Komponenten:
- `NotificationBadge.js` (wird durch einfache Badge ersetzt)
- `NewsPopup.js` (wird komplett entfernt, durch InfoBoxScreen ersetzt)

### Neue Komponenten:
- `InfoBoxScreen.js` (NEU) - Vollständiger Screen mit WhatsApp-ähnlicher Liste

### Beizubehalten:
- `ChatListScreen.js` (UI bleibt, wird nach WhatsApp-Plan angepasst)
- `ChatRoomScreen.js` (UI bleibt)
- `HinweisScreen.js` (UI bleibt, wird nach WhatsApp-Plan angepasst)
- `NotificationsScreen.js` (wird angepasst oder mit InfoBoxScreen zusammengeführt)
- `BottomNavigation.js` (UI bleibt, Logik angepasst: direkter Screen-Aufruf)

---

## ⚙️ Schritt 3: Neue Architektur

### Service-Struktur

#### `services/notificationService.js` (NEU)
```javascript
// Zentrale Notification-Verwaltung
export const createNotification = async (userId, notificationData)
export const getNotificationsForUser = async (userId, filters = {})
export const subscribeNotificationsForUser = (userId, callback, filters = {})
export const markNotificationAsRead = async (userId, notificationId)
export const deleteNotification = async (userId, notificationId)
export const getUnreadCount = async (userId, type = null)
```

#### `services/chatNotificationHandler.js` (NEU)
```javascript
// Spezifische Handler für Chat-Notifications
export const createChatNotification = async (chatId, message, recipientId)
export const deleteChatNotifications = async (userId, chatId)
export const markChatNotificationsAsRead = async (userId, chatId)
```

#### `services/tradeNotificationHandler.js` (NEU)
```javascript
// Spezifische Handler für Trade-Notifications
// WICHTIG: Trade-Requests sind die Basis für Chats und Hinweise!

// Erstelle Notification für Trade-Request
export const createTradeNotification = async (tradeRequestId, recipientId, type)

// Handle Trade-Request-Akzeptierung (KOMPLETTE SEQUENZ)
export const handleTradeRequestAccepted = async (tradeRequestId, tradeRequestData, selectedWineId) {
  // REIHENFOLGE (KRITISCH!):
  // 1. Trade-Request Status auf 'accepted' setzen
  // 2. Hinweise erstellen (für beide Teilnehmer)
  // 3. Chat erstellen (nur wenn noch nicht vorhanden)
  // 4. Notifications erstellen (benötigen chatId und hintId!)
  // 5. Lösche alte Trade-Notifications
}

// Erstelle Notifications für Chat und Hinweis (nach Erstellung)
export const createChatAndHintNotifications = async (tradeRequestId, chatId, hintId, participants)

// Lösche Trade-Notifications
export const deleteTradeNotifications = async (userId, tradeRequestId)

// Handle Trade-Request-Ablehnung
export const handleTradeRequestRejected = async (tradeRequestId, participants)
```

### Event-Trigger

#### Trade-Requests (WICHTIG: Basis für Chats und Hinweise!)
**Kritisch:** Chats und Hinweise entstehen durch Trade-Requests!

**Trigger-Events:**
1. **Trade-Request erstellt (A → B):**
   - **Aktion:** 
     - Erstelle `type: 'hint-decision'` Notification an B (EntscheidungsHinweis)
     - Erstelle `type: 'hint-small'` Notification an A (Anfrage gestellt)
   - **Metadata:** `tradeRequestId`, `hintId`, `actionUrl: 'hinweise'`
   - **Farbcodierung:** Rot (B), Gelb (A)
   - **JIT:** Notifications sofort für beide User sichtbar

2. **Trade-Request akzeptiert:**
   - **Reihenfolge (GLEICHZEITIG/PARALLEL für Performance):**
     1. **Trade-Request Status auf 'accepted' setzen** (`fsUpdateTradeRequestStatus`)
     2. **GLEICHZEITIG erstellen:**
        - **Hinweise** (`fsCreateTradeHint` für beide Teilnehmer) - `type: 'hint-small'`
        - **Chat** (`fsCreateChat` - nur wenn noch nicht vorhanden)
     3. **Notifications erstellen (nach Schritt 2, benötigen IDs):**
        - `type: 'hint-small'` Notification für beide Teilnehmer (Tausch akzeptiert)
        - `type: 'chat'` Notification für A (Chat wurde erstellt)
        - **WICHTIG:** Für B wird ChatRoomScreen automatisch geöffnet → Notification für B wird als gelesen markiert
     4. **Lösche `type: 'hint-decision'` Notifications** für diesen Trade-Request
     5. **Markiere alte Hinweise als abgeschlossen** (`isCompleted: true`)
   - **Metadata:** `chatId`, `tradeRequestId`, `hintId`
   - **JIT (Just-In-Time):** Alle Aktionen sofort für beide User sichtbar!

3. **Trade-Request abgelehnt (B lehnt ab):**
   - **Aktion:** 
     - Erstelle `type: 'hint-small'` Notification an A
     - Markiere `type: 'hint-decision'` Notification für B als abgeschlossen (`isCompleted: true`)
   - **Metadata:** `tradeRequestId`, `hintId`
   - **Farbcodierung:** Gelb (A)
   - **JIT:** Notification sofort für A sichtbar

#### Chat-Nachrichten
**WICHTIG:** Chats entstehen durch akzeptierte Trade-Requests!

- **Trigger:** Neue Nachricht in `chats/{chatId}/messages`
- **Aktion:** Erstelle `type: 'chat'` Notification für Empfänger (wenn Chat nicht geöffnet)
- **Metadata:** `chatId`, `senderId`, `senderName`, `messageId`, `actionUrl: 'chat-room'`
- **Löschung:** Wenn Chat geöffnet wird oder als gelesen markiert
- **JIT:** Notification sofort für Empfänger sichtbar

#### Hinweise (Trade-Hints)
**WICHTIG:** Hinweise entstehen durch Trade-Requests!

- **Trigger:** Trade-Hint erstellt/aktualisiert
- **Aktion:** 
  - `type: 'hint-decision'` für EntscheidungsHinweise (B erhält Trade-Request)
  - `type: 'hint-small'` für kleine Hinweise (A erhält Bestätigung, B lehnt ab, etc.)
- **Metadata:** `hintId`, `tradeRequestId`, `actionUrl: 'hinweise'`
- **Abschluss:** Wenn Trade abgeschlossen → `isCompleted: true` (grau ausgrauen)
- **JIT:** Notification sofort für betroffenen User sichtbar

#### System-Nachrichten
- **Trigger:** Admin erstellt System-Nachricht
- **Aktion:** Erstelle `type: 'system'` Notification für alle User (oder bestimmte Gruppe)
- **Metadata:** `actionUrl: 'system-message-reader'`
- **JIT:** Notification sofort für alle betroffenen User sichtbar

#### Chat schließen
- **Trigger:** User schließt Chat (ChatRoomScreen verlassen)
- **Aktion:** 
  - Erstelle `type: 'hint-small'` Notification für den anderen User ("Chat verlassen")
  - Markiere Chat als beendet (`isCompleted: true` oder `status: 'ended'`)
  - Chat nur noch archiviert sichtbar
- **JIT:** Notification sofort für anderen User sichtbar

---

## 🎨 Schritt 4: UI-Anpassungen

### InfoBox (NewsPopup.js → InfoBoxScreen.js)

**WICHTIG:** InfoBox wird zu einem vollständigen Screen, nicht mehr ein Popup!

**Aktuell:**
- Popup mit zwei Icons (Glocke, Glühbirne)
- Separate Badges
- Wird über BottomNavigation-Button geöffnet

**Neu:**
- **Vollständiger Screen** (`InfoBoxScreen.js`)
- **WhatsApp-ähnliche Liste** aller Notifications (siehe `PLAN_WHATSAPP_UI.md`)
- **Layout-Struktur:**
  ```
  ┌─────────────────────────────────────────┐
  │ [Farbrand] Titel                Zeit    │
  │           Nachricht...          [Badge] │
  └─────────────────────────────────────────┘
  ```
- **Farbcodierung nach Typ (linker Rand oder Icon-Hintergrund):**
  - `hint-decision`: **Rot** (#F44336) - EntscheidungsHinweis
  - `hint-small`: **Gelb** (#FFC107) - Kleiner Hinweis
  - `chat`: **Grün** (#4CAF50) - Chat-Message
  - `system`: **Blau** (#2196F3) - Nachricht vom Administrator
- **Abgeschlossene Einträge:** Grau ausgrauen (`isCompleted: true`)
- **Swipe-to-Delete:** Nach rechts wischen zum Löschen → Archivierung in Firestore
- **Komponenten pro Zeile:**
  - **Icon/Farbe (links):** Farbcodierter Indikator oder Icon
  - **Titel (oben links):** Notification-Titel (fett)
  - **Nachricht (unten links):** Vorschau der Nachricht (max. 2 Zeilen, grau)
  - **Zeitstempel (oben rechts):** "HH:MM", "Gestern", "DD.MM"
  - **Badge (unten rechts):** Nur bei ungelesenen Notifications
- **Navigation:**
  - Tap auf Notification → Navigation zum entsprechenden Screen
  - `chat` → `ChatRoomScreen` mit `chatId`
  - `trade` → Trade-Request-Details oder Chat
  - `hint` → `HinweisScreen` oder Trade-Request-Details
  - `system` → System-Nachricht-Details

### BottomNavigation.js

**WICHTIG:** Direkter Aufruf des InfoBoxScreen, kein Popup mehr!

**Anpassungen:**
- **InfoBox-Button (📰 Newspaper):**
  - Direkter Aufruf von `InfoBoxScreen` (kein Popup)
  - `onNavigate('infobox')` statt `setNewsPopupVisible(true)`
- **Badge:**
  - Zeigt **Gesamtanzahl aller ungelesenen Notifications** (`unreadCount`)
  - Position: Oben rechts am Newspaper-Icon
  - Wird auf 0 gesetzt, sobald User Notification liest
  - Keine Trennung mehr zwischen verschiedenen Typen
- **Entfernt:**
  - `NewsPopup` Komponente wird nicht mehr verwendet
  - `anchorLayout` State wird nicht mehr benötigt

### NotificationsScreen.js

**Anpassungen:**
- Zeigt alle Notifications in einer gemeinsamen Liste (wie InfoBoxScreen)
- Gleiche WhatsApp-ähnliche Liste wie InfoBoxScreen
- **Farbcodierung:**
  - Rot = EntscheidungsHinweis (`hint-decision`)
  - Gelb = Kleiner Hinweis (`hint-small`)
  - Grün = Chat (`chat`)
  - Blau = System (`system`)
- **Abgeschlossene Einträge:** Grau ausgrauen
- **Swipe-to-Delete:** Nach rechts wischen zum Löschen → Archivierung
- **KEIN** "Alle als gelesen"-Button

---

## 📝 Schritt 5: Umsetzungsschritte

### Schritt 5.1: Backup & Analyse ✅
- [x] Backup erstellen
- [ ] Code-Analyse dokumentieren
- [ ] Zu entfernende Funktionen auflisten

### Schritt 5.2: Code-Bereinigung
- [ ] `App.js`: Notification-Logik entfernen
- [ ] `database-web.js`: Alte Notification-Funktionen entfernen
- [ ] `NewsPopup.js`: Icons entfernen, Platzhalter für Liste
- [ ] `NotificationBadge.js`: Vereinfachen oder entfernen

### Schritt 5.3: Neue Services
- [ ] `notificationService.js` erstellen
- [ ] `chatNotificationHandler.js` erstellen
- [ ] `tradeNotificationHandler.js` erstellen
- [ ] Firestore-Integration testen

### Schritt 5.4: UI-Anpassungen
- [ ] `InfoBoxScreen.js` erstellen (WhatsApp-ähnliche Liste)
  - [ ] Farbcodierung: Rot (hint-decision), Gelb (hint-small), Grün (chat), Blau (system)
  - [ ] Abgeschlossene Einträge grau ausgrauen (`isCompleted: true`)
  - [ ] Swipe-to-Delete implementieren (→ Archivierung)
- [ ] `BottomNavigation.js` anpassen (direkter Screen-Aufruf, Badge am Newspaper-Button)
  - [ ] Badge zeigt Gesamtanzahl aller ungelesenen Notifications
- [ ] `NewsPopup.js` entfernen
- [ ] `NotificationsScreen.js` anpassen (gleiche Liste wie InfoBoxScreen)
- [ ] `ChatListScreen.js` nach WhatsApp-Plan umbauen (siehe `PLAN_WHATSAPP_UI.md`)
- [ ] `HinweisScreen.js` nach WhatsApp-Plan umbauen (siehe `PLAN_WHATSAPP_UI.md`)
- [ ] Zeitstempel-Formatierung implementieren
- [ ] ChatRoomScreen: Automatisches Öffnen für B bei Trade-Akzeptierung

### Schritt 5.5: Event-Trigger
- [ ] **Trade-Request erstellt (A → B):**
  - [ ] `type: 'hint-decision'` Notification an B (EntscheidungsHinweis)
  - [ ] `type: 'hint-small'` Notification an A (Anfrage gestellt)
- [ ] **Trade-Request abgelehnt (B lehnt ab):**
  - [ ] `type: 'hint-small'` Notification an A
- [ ] **Trade-Request akzeptiert (B akzeptiert):**
  - [ ] 1. Trade-Request Status auf 'accepted' setzen
  - [ ] 2. **GLEICHZEITIG:** Hinweise + Chat erstellen
  - [ ] 3. `type: 'hint-small'` Notification an A und B (Tausch akzeptiert)
  - [ ] 4. `type: 'chat'` Notification an A (Chat erstellt)
  - [ ] 5. ChatRoomScreen für B automatisch öffnen (Notification für B als gelesen)
  - [ ] 6. Lösche `type: 'hint-decision'` Notifications
  - [ ] 7. Markiere alte Hinweise als abgeschlossen (`isCompleted: true`)
- [ ] **Chat-Message gesendet:**
  - [ ] `type: 'chat'` Notification an Empfänger (wenn Chat nicht geöffnet)
- [ ] **Chat geschlossen:**
  - [ ] `type: 'hint-small'` Notification an anderen User
  - [ ] Chat als beendet markieren (nur noch archiviert sichtbar)
- [ ] **System-Nachricht:**
  - [ ] `type: 'system'` Notification an alle/ausgewählte User
- [ ] **JIT (Just-In-Time):** Alle Aktionen sofort für beide User sichtbar!

### Schritt 5.6: Integration
- [ ] `App.js` mit neuen Services verbinden
- [ ] Subscriptions einrichten
- [ ] Navigation integrieren

### Schritt 5.7: Testing
- [ ] Unit-Tests (optional)
- [ ] Integration-Tests
- [ ] Edge Cases prüfen
- [ ] Performance-Tests

### Schritt 5.8: Trade-Request-Integration
- [ ] Trade-Requests wieder integrieren
- [ ] Finale Tests
- [ ] Dokumentation aktualisieren

---

## 🔍 Detaillierte Code-Analyse

### App.js – Notification-bezogene Funktionen

#### Zu entfernen/ersetzen:
1. **`refreshNotificationBadges`** (Zeile ~2400-2500)
   - Komplexe Badge-Berechnung
   - Wird durch einfache `getUnreadCount` ersetzt

2. **`createNotificationsForNewMessages`** (Zeile ~1350-1500)
   - Wird durch `chatNotificationHandler.createChatNotification` ersetzt

3. **`addMessage`** Notification-Logik (Zeile ~1500-1750)
   - Notification-Erstellung entfernen
   - Wird durch Event-Trigger ersetzt

4. **State-Management:**
   - `unreadNotifications` → `unreadCount`
   - `unreadHints` → entfernen (wird in `unreadCount` integriert)

#### Beizubehalten:
- Chat-Subscriptions
- Message-Handling
- Navigation-Logik

### database-web.js – Notification-Funktionen

#### Zu entfernen/ersetzen:
1. **`createNotification`** (Zeile ~1926-2004)
   - Zentrale Prüfungen entfernen
   - Wird durch `notificationService.createNotification` ersetzt

2. **`getNotificationsForUser`** (Zeile ~2005-2076)
   - Filter-Logik vereinfachen
   - Wird durch `notificationService.getNotificationsForUser` ersetzt

3. **`subscribeNotificationsForUser`** (Zeile ~2077-2212)
   - Filter-Logik vereinfachen
   - Wird durch `notificationService.subscribeNotificationsForUser` ersetzt

4. **`markNotificationAsRead`** (Zeile ~2213-2229)
   - Wird durch `notificationService.markNotificationAsRead` ersetzt

5. **`deleteNotification`** (Zeile ~2230-2244)
   - Wird durch `notificationService.deleteNotification` ersetzt

6. **`deleteNotificationsForHint`** (Zeile ~2245-2266)
   - Wird durch `notificationService.deleteNotificationsForUser` mit Filter ersetzt

7. **`deleteNotificationsForChat`** (Zeile ~2267-2316)
   - Wird durch `notificationService.deleteNotificationsForUser` mit Filter ersetzt

8. **`deleteNotificationsForTradeRequest`** (Zeile ~2317-2366)
   - Wird durch `notificationService.deleteNotificationsForUser` mit Filter ersetzt

#### Beizubehalten:
- Chat-Funktionen (unverändert)
- Trade-Request-Funktionen (vorerst unverändert)

---

## 🚀 Implementierungsreihenfolge

### 1. Neue Services erstellen (Basis)
```bash
# Erstelle neue Service-Dateien
touch mobile-app/services/notificationService.js
touch mobile-app/services/chatNotificationHandler.js
touch mobile-app/services/tradeNotificationHandler.js
```

### 2. Firestore-Schema definieren
- Dokumentiere neue Datenstruktur
- Erstelle Migration-Skript (optional)

### 3. Core-Services implementieren
- `notificationService.js` vollständig implementieren
- Firestore-Integration testen

### 4. Handler implementieren
- `chatNotificationHandler.js` implementieren
- `tradeNotificationHandler.js` implementieren

### 5. UI-Anpassungen
- `InfoBoxScreen.js` erstellen (WhatsApp-ähnliche Liste, siehe `PLAN_WHATSAPP_UI.md`)
- `BottomNavigation.js` anpassen (direkter Screen-Aufruf, Badge am Newspaper-Button)
- `ChatListScreen.js` nach WhatsApp-Plan umbauen
- `HinweisScreen.js` nach WhatsApp-Plan umbauen
- `NotificationsScreen.js` anpassen oder mit InfoBoxScreen zusammenführen

### 6. Integration in App.js
- Alte Logik entfernen
- Neue Services einbinden
- Subscriptions einrichten

### 7. Event-Trigger einrichten
- **Trade-Request akzeptiert** → **Reihenfolge beachten:**
  1. Hinweise erstellen
  2. Chat erstellen
  3. Notifications erstellen (benötigen chatId und hintId!)
- Chat-Nachrichten → Notification
- Trade-Requests → Notification
- System-Nachrichten → Notification

### 8. Testing & Optimierung
- Tests durchführen
- Edge Cases prüfen
- Performance optimieren

---

## ⚠️ Risiken & Mitigation

### Risiko 1: Datenverlust bei Migration
**Mitigation:** Vollständiges Backup vor Start, Migration-Skript testen

### Risiko 2: Breaking Changes in UI
**Mitigation:** UI-Screens beibehalten, nur Logik anpassen

### Risiko 3: Performance-Probleme
**Mitigation:** Firestore-Queries optimieren, Pagination implementieren

### Risiko 4: Trade-Request-Integration
**Mitigation:** Trade-Requests vorerst unberührt, am Ende integrieren

---

## 📊 Erfolgs-Kriterien

- [ ] Alle Notifications werden in einer gemeinsamen InfoBox-Liste angezeigt
- [ ] Farbcodierung funktioniert korrekt:
  - [ ] Rot = EntscheidungsHinweis (`hint-decision`)
  - [ ] Gelb = Kleiner Hinweis (`hint-small`)
  - [ ] Grün = Chat (`chat`)
  - [ ] Blau = System (`system`)
- [ ] Badge zeigt korrekte Gesamtanzahl aller ungelesenen Notifications
- [ ] Badge wird auf 0 gesetzt, sobald User Notification liest
- [ ] Abgeschlossene Einträge werden grau ausgegraut
- [ ] Swipe-to-Delete funktioniert (→ Archivierung)
- [ ] ChatRoomScreen öffnet sich automatisch für B bei Trade-Akzeptierung
- [ ] Navigation zu entsprechenden Screens funktioniert
- [ ] JIT: Alle Aktionen sofort für beide User sichtbar
- [ ] Keine Redundanzen zwischen Chats, Hints und Notifications
- [ ] Firestore ist Single Source of Truth
- [ ] Performance ist akzeptabel (< 1s Ladezeit)
- [ ] KEIN "Alle als gelesen"-Button vorhanden

---

## 📚 Referenzen

- **Backup:** `Backup_Notification_Refactor_20251112_144034.tar.gz`
- **Analyse:** `ANALYSE_ANSETZPUNKTE.md` - **WICHTIG:** Detaillierte Ansetzpunkte mit Zeilen-Nummern
- **Aktuelle Dokumentation:** `NOTES_NOTIFICATIONS.md`
- **Projekt-Dokumentation:** `PROJEKT_DOKUMENTATION.md`
- **WhatsApp-UI-Plan:** `PLAN_WHATSAPP_UI.md` (für InfoBoxScreen, ChatListScreen, HinweisScreen)
- **Firestore-Dokumentation:** [Firebase Docs](https://firebase.google.com/docs/firestore)

---

## 🔗 Integration mit WhatsApp-UI-Plan

### Gemeinsame UI-Komponenten

Die InfoBoxScreen, ChatListScreen und HinweisScreen verwenden alle das gleiche WhatsApp-ähnliche Layout:

**Layout-Struktur:**
```
┌─────────────────────────────────────────┐
│ [Bild/Icon] Titel                Zeit   │
│           Nachricht...            [Badge]│
└─────────────────────────────────────────┘
```

**Gemeinsame Funktionen:**
- `formatMessageTime(timestamp)` - Zeitstempel-Formatierung
- `getOtherUserWineImage(chat/hint)` - Weinbild-Logik
- Sortierung nach `lastMessageTime` oder `updatedAt`

**Siehe:** `PLAN_WHATSAPP_UI.md` für detaillierte Implementierung

---

## 📋 Vollständige Abläufe (User-Stories)

### Ablauf 1: Trade-Request erstellt (A → B)

**Aktion:**
1. A stellt Trade-Request an B in der Weinbörse

**Ergebnis:**
- ✅ EntscheidungsHinweis (`hint-decision`) an B erstellt
- ✅ Kleiner Hinweis (`hint-small`) an A erstellt
- ✅ `type: 'hint-decision'` Notification an B (InfoBox Badge)
- ✅ `type: 'hint-small'` Notification an A (InfoBox Badge)

**Farbcodierung:**
- B sieht rote Notification (EntscheidungsHinweis)
- A sieht gelbe Notification (Kleiner Hinweis)

---

### Ablauf 2a: Trade-Request abgelehnt (B lehnt ab)

**Aktion:**
1. B lehnt Trade-Request ab

**Ergebnis:**
- ✅ Kleiner Hinweis (`hint-small`) an A erstellt
- ✅ `type: 'hint-small'` Notification an A (InfoBox Badge)
- ✅ `type: 'hint-decision'` Notification für B als abgeschlossen markiert (`isCompleted: true`)

**Farbcodierung:**
- A sieht gelbe Notification (Kleiner Hinweis)

---

### Ablauf 2b: Trade-Request akzeptiert (B akzeptiert)

**Aktion:**
1. B schaut sich Weinregal von A an
2. B wählt Flasche aus und akzeptiert Tausch

**Ergebnis:**
1. ✅ Trade-Request Status auf 'accepted' gesetzt
2. ✅ **GLEICHZEITIG erstellt:**
   - Kleine Hinweise (`hint-small`) für A und B (Tausch akzeptiert)
   - Chat für A und B
3. ✅ Notifications erstellt:
   - `type: 'hint-small'` Notification an A (Tausch akzeptiert)
   - `type: 'hint-small'` Notification an B (Tausch akzeptiert)
   - `type: 'chat'` Notification an A (Chat erstellt)
4. ✅ ChatRoomScreen für B **automatisch geöffnet** (Notification für B als gelesen markiert)
5. ✅ `type: 'hint-decision'` Notifications gelöscht
6. ✅ Alte Hinweise als abgeschlossen markiert (`isCompleted: true`)

**Farbcodierung:**
- A sieht gelbe Notifications (Kleiner Hinweis + Chat)
- B sieht ChatRoomScreen direkt geöffnet

---

### Ablauf 3: B sendet Message an A

**Aktion:**
1. B sendet Message im ChatRoomScreen

**Ergebnis:**
- ✅ Message in Firestore gespeichert
- ✅ `type: 'chat'` Notification an A (InfoBox Badge)
- ✅ Notification sofort für A sichtbar (JIT)

**Farbcodierung:**
- A sieht grüne Notification (Chat)

---

### Ablauf 4: A antwortet B

**Aktion:**
1. A sendet Message im ChatRoomScreen

**Ergebnis:**
- ✅ Message in Firestore gespeichert
- ✅ `type: 'chat'` Notification an B (InfoBox Badge)
- ✅ Notification sofort für B sichtbar (JIT)

**Farbcodierung:**
- B sieht grüne Notification (Chat)

---

### Ablauf 5: Hinweise abschließen

**Aktion:**
1. Trade ist abgeschlossen

**Ergebnis:**
- ✅ Kleiner Hinweis als abgeschlossen markiert (`isCompleted: true`)
- ✅ EntscheidungsHinweis als abgeschlossen markiert (`isCompleted: true`)
- ✅ Beide Hinweise werden grau ausgegraut in InfoBox

**Visuell:**
- Graue Einträge in InfoBox (nicht mehr aktiv)

---

### Ablauf 6: Chat schließen

**Aktion:**
1. A oder B verlässt ChatRoomScreen (Chat schließen)

**Ergebnis:**
- ✅ `type: 'hint-small'` Notification an anderen User ("Chat verlassen")
- ✅ Chat als beendet markiert (`status: 'ended'`)
- ✅ Chat nur noch archiviert sichtbar
- ✅ Notification sofort für anderen User sichtbar (JIT)

**Farbcodierung:**
- Anderer User sieht gelbe Notification (Kleiner Hinweis)

---

### Ablauf 7: Swipe-to-Delete

**Aktion:**
1. User wischt Notification nach rechts (Swipe-to-Delete)

**Ergebnis:**
- ✅ Notification als archiviert markiert (`isArchived: true`)
- ✅ `archivedAt` Timestamp gesetzt
- ✅ Notification nicht mehr in InfoBox sichtbar
- ✅ Notification in Firestore archiviert (nicht mehr für User aufrufbar)

---

## 🔄 Detaillierte Reihenfolge: Trade-Request-Akzeptierung

### Sequenz-Diagramm

```
Trade-Request akzeptiert
    ↓
1. Trade-Request Status → 'accepted'
    ↓
2. Hinweise erstellen (fsCreateTradeHint)
    ├─→ Hinweis für User A
    └─→ Hinweis für User B
    ↓
3. Chat erstellen (fsCreateChat) - nur wenn nicht vorhanden
    └─→ Chat mit tradeRequestId verknüpft
    ↓
4. Notifications erstellen (benötigen chatId und hintId!)
    ├─→ type: 'hint' Notification für User A (mit hintId)
    ├─→ type: 'hint' Notification für User B (mit hintId)
    ├─→ type: 'chat' Notification für User A (mit chatId)
    └─→ type: 'chat' Notification für User B (mit chatId)
    ↓
5. Lösche type: 'trade' Notifications
    └─→ Für beide Teilnehmer
```

### Implementierungs-Checkliste

**In `handleTradeRequestAccepted` (tradeNotificationHandler.js):**

```javascript
export const handleTradeRequestAccepted = async (
  tradeRequestId, 
  tradeRequestData, 
  selectedWineId
) => {
  const { fromUserId, toUserId } = tradeRequestData;
  const participants = [fromUserId, toUserId];
  
  // 1. Trade-Request Status auf 'accepted' setzen
  await fsUpdateTradeRequestStatus(tradeRequestId, { 
    status: 'accepted',
    selectedWineId 
  });
  
  // 2. GLEICHZEITIG erstellen (Performance-Optimierung)
  const [hintIdA, hintIdB, chatId] = await Promise.all([
    // Hinweis für A
    fsCreateTradeHint({
      tradeRequestId,
      userId: fromUserId,
      hintType: 'hint-small',
      // ... weitere Hint-Daten
    }),
    // Hinweis für B
    fsCreateTradeHint({
      tradeRequestId,
      userId: toUserId,
      hintType: 'hint-small',
      // ... weitere Hint-Daten
    }),
    // Chat erstellen (nur wenn noch nicht vorhanden)
    (async () => {
      const existingChat = await findExistingChat(tradeRequestId);
      if (existingChat) {
        return existingChat.id;
      } else {
        return await fsCreateChat({
          participants,
          tradeRequestId,
          // ... weitere Chat-Daten
        });
      }
    })()
  ]);
  
  // 3. Notifications erstellen (JETZT haben wir chatId und hintId!)
  await createChatAndHintNotifications(
    tradeRequestId,
    chatId,
    [hintIdA, hintIdB], // Array von Hint-IDs
    participants
  );
  
  // 4. ChatRoomScreen für B automatisch öffnen
  // (wird in App.js gehandhabt, Notification für B als gelesen markieren)
  
  // 5. Lösche alte Trade-Notifications
  await deleteTradeNotifications(fromUserId, tradeRequestId);
  await deleteTradeNotifications(toUserId, tradeRequestId);
};
```

**WICHTIG:**
- Hinweise und Chat können **GLEICHZEITIG** erstellt werden (Performance-Optimierung)
- Notifications benötigen chatId und hintId → erst nach Schritt 2 erstellen
- **JIT (Just-In-Time):** Alle Aktionen sofort für beide User sichtbar!
- ChatRoomScreen für B automatisch öffnen → Notification für B als gelesen markieren
- Abgeschlossene Hinweise: `isCompleted: true` (grau ausgrauen)
- Swipe-to-Delete: Archivierung in Firestore (nicht mehr für User aufrufbar)

---

## 🔄 Nächste Schritte

1. ✅ **Plan reviewen** - Abgeschlossen
2. ✅ **Analyse der Ansetzpunkte** - Abgeschlossen (`ANALYSE_ANSETZPUNKTE.md`)
3. **Phase 2 starten:** Code-Bereinigung (Notification-Typen anpassen)
4. **Phase 4:** Neue Services parallel entwickeln
5. **Phase 5:** UI-Anpassungen (InfoBoxScreen, Farbcodierung)
6. **Phase 6:** Event-Trigger anpassen
7. **Phase 7:** Testing & Optimierung

---

## 🎯 Zusammenfassung: Was funktioniert bereits

### ✅ Fertig und funktionsfähig (BEIBEHALTEN):
1. **Trade-Request-Erstellung** (`createTradeRequest` in App.js Zeile 2968) - ✅ funktioniert
2. **Trade-Request-Subscriptions** (App.js Zeile 330-379) - ✅ funktionieren
3. **Hinweis-Erstellung** (`ensureTradeNotification` Zeile 3088, `createTradeDecisionHints` Zeile 3407) - ✅ funktioniert
4. **Chat-Erstellung** (`acceptTradeRequest` Zeile 4079) - ✅ funktioniert
5. **Notification-System** (Firestore-Integration in `database-web.js`) - ✅ funktioniert grundsätzlich
6. **Chat-Message-Subscriptions** (App.js Zeile 1303, 1796) - ✅ funktionieren

### 🔧 Nur anpassen (keine komplette Neuerstellung):
1. **Notification-Typen:** `'trade'` → `'hint-decision'`, `'trade-info'` → `'hint-small'`
2. **Badge-Berechnung:** Vereinfachen (nur `unreadCount` statt `unreadNotifications` + `unreadHints`)
3. **UI:** InfoBox zu Screen umbauen, Farbcodierung implementieren
4. **Reihenfolge:** Gleichzeitige Erstellung bei Trade-Akzeptierung optimieren

**→ Siehe `ANALYSE_ANSETZPUNKTE.md` für konkrete Zeilen-Nummern und Ansetzpunkte!**

---

**Status:** ✅ Plan erstellt, Analyse abgeschlossen, bereit für Phase 2 (Code-Bereinigung)

