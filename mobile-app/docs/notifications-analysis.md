# Notification-System – Analyse (Stand: 10. Nov 2025)

## Ziele dieser Analyse
- Verstehen, **wo** Benachrichtigungen entstehen (Trades, Chats, Hinweise)
- Nachvollziehen, **wie** sie in Firestore landen und in der App ankommen
- Identifizieren, **warum** sie nicht zuverlässig im InfoBox/Newspaper-Icon erscheinen
- Grundlage für Refactoring (Single Source of Truth, klarer Datenfluss)

---

## Phase 0 – Smoke-Test-Checkliste (Stand: 11. Nov 2025)
- **Status:** offen; Ausführung folgt, sobald Instrumentierung bereitsteht.
- **App-Start & Navigation:** Welcome-Screen lädt, BottomNavigation reagiert, Wechsel zu `dashboard` möglich.
- **Login/Logout:** Nutzer kann sich mit Test-Account anmelden, Dashboard erscheint; Logout führt zurück zu `welcome`.
- **Trade-Flow:** Trade-Request erstellen, Empfang auf Gegenkonto prüfen, Entscheidung (accept/reject) auslösen.
- **Chat-Nachricht:** Bestehenden Chat öffnen, neue Nachricht senden, Empfang auf Zweitgerät/zweiter Session bestätigen.
- **Info/Newsletter/System:** Trigger für Newsletter/Systemnachrichten vorbereiten, Anzeige in `NotificationsScreen` kontrollieren.
- **Regressionskontrolle:** Keine Crashes, Header/BottomNavigation bleiben funktionsfähig.

---

## 1. Datenquellen & Erzeuger

| Auslöser                              | Verantwortlicher Code (Auszug)                             | Typ / Payload                                                                 |
|---------------------------------------|-------------------------------------------------------------|--------------------------------------------------------------------------------|
| Neue/ausgehende Trade-Requests        | `ensureTradeNotification` (App.js ~2600)                   | erzeugt **Hints** + Notifications (`type: 'trade'` oder `'trade-info'`)       |
| Trade-Entscheidung (accept/reject)    | `createTradeDecisionHints` (App.js ~2900)                  | aktualisiert/erstellt Hints + Notifications (`'trade-info'`) für beide Seiten |
| Chat-Nachricht                        | `addMessage` (App.js ~1240)                                | `fsAddChatMessage` + Notification `type: 'message'` für Empfänger             |
| Chat nach erfolgreichem Tausch        | `acceptTradeRequest` (App.js ~3450)                        | erstellt Chat + Notifications `type: 'chat'` für beide Teilnehmer             |
| Sonstige (Newsletter, System, Tests)  | diverse Stellen (Newsletter, Surveys, Admin-Tools)         | `type: 'newsletter'`, `'system'`, etc.                                        |

**Beobachtungen**
- Erzeugung erfolgt direkt in `App.js` (Monolith), teils mehrfach (Fallbacks, Subscriptions).
- Hints (`entryType: 'hint'`) liegen in `chats` Collection; Notifications liegen pro User unter `users/{uid}/notifications`.
- Es existiert zusätzlicher **Fallback-Code**, der bei neuen Chat-Messages/Hint-Status-Änderungen erneut Notifications erzeugt (siehe unten).

---

## 2. Speicherung & Synchronisation

### Firestore
- **Notifications** (`users/{uid}/notifications`): `createNotification` (`services/database-web.js`) schreibt sofort (`addDoc`) + `createdAt`.
- **Hints & Chats** (`chats` Collection): `entryType` differenziert Chat vs. Hinweis; `hintType` (`trade-involved`, `trade-decision` …).

### Client-Cache
- `setNotifications` + `setChats` halten lokalen Zustand.
- **AsyncStorage** wird als Shadow benutzt (`bottle-trade-notifications`, `bottle-trade-chats`, `bottle-trade-messages`).
- `notificationsRef`, `chatsRef` etc. (neu hinzugefügt) spiegeln aktuellen State für Callback-Kontext.

### Subscriptions
- `fsSubscribeNotificationsForUser` (App.js ~700) liefert ungelesene Notifications (bereits in Firestore gefiltert).
- `fsSubscribeChatsForUser` + `fsSubscribeChatMessages` halten Chats / Messages aktuell.
- Trade-Request-Subscriptions (incoming & outgoing) triggern `ensureTradeNotification`.

---

## 3. Aggregation & Anzeige

### Zentrale Aggregatoren
- `recalculateUnreadCount` (`App.js`, Zeile ~1940) → Glocke (Nachrichten-Badge)
  - Filtert `notifications` + `chats`, ignoriert `entryType: 'hint'`.
  - Schließt `type: 'trade-info'` aus, wenn kein Chat; versucht Chat-Existenz abzugleichen.
  - Reset auf `setUnreadNotifications(0)` bei Fehlern.

- `recalculateUnreadHints` (`App.js`, Zeile ~2150) → InfoBox/Hinweise (`unreadHints`)
  - Berücksichtigt `notifications` vom Typ `'trade'` & `'trade-info'` **ohne** `chatId`.
  - Viel Logging, komplexe Regeln (User-Filter, Duplikat-Vermeidung).

### UI-Komponenten
- **NewsPopup** (`components/NewsPopup.js`): zeigt `unreadNotifications` (Glocke) & `unreadHints` (Glühlampe).
- **BottomNavigation** (`components/BottomNavigation.js`): Aggregiert Badges, misst Layout für Popup-Anker.
- **NotificationsScreen**: mischt Notifications & Chats; dedupliziert anhand `requestId`/`id`.

---

## 4. Aktuelle Probleme

1. **Dualer Erzeugungspfad**
   - Fallback-Effekte in `fsSubscribeChatMessages` (neu) und `useEffect([chats])` erzeugen Notifications erneut, obwohl Firestore als Quelle vorgesehen war.
   - Gefahr von Duplikaten, weil Fallbacks keine eindeutigen IDs nutzen (nur Strings, `messageKey`).

2. **Trennung Hinweis vs. Chat unscharf**
   - `recalculateUnreadCount` versucht zwischen Chat/Hint zu unterscheiden, indem es `entryType`, `chatId`, `tradeStatus` usw. prüft.
   - Bei fehlenden Feldern oder gelöschten Objekten gehen Notifications verloren oder tauchen mehrfach auf.

3. **Lösch-/Read-Handling inkonsistent**
   - `markAllHintNotificationsAsRead` → markiert Firestore als gelesen; `updateNotificationsReadByRequestId` löscht Notifications komplett.
   - AsyncStorage kann alte Einträge wiederherstellen, wenn nicht synchron gelöscht.

4. **Debugging erschwert**
   - Logs sind verstreut, teils sehr ausführlich aber ohne Korrelation.
   - Kein zentraler Überblick, wann eine Notification erstellt / empfangen / gefiltert wurde.

5. **Benutzerrollen**
   - `trade`-Notifications gehen nur an Empfänger (`toUserId`), `trade-info` nur an Absender, aber Filter (z. B. in `NotificationsScreen`) spiegeln das nicht konsistent wider.

---

## 5. Empfohlene Schritte (Refactor-Vorbereitung)

### 5.1 Instrumentation / Debug
- Utility `logNotificationEvent({ stage, type, data })` einführen.
- Stages: `created`, `fetched`, `filtered-hints`, `filtered-chats`, `badge-updated`, `ui-render`.
- Optionale Aktivierung über `.env` / Konstante (z. B. `ENABLE_NOTIFICATION_DEBUG`), damit Logs bei Live-Betrieb deaktiviert werden können.

### 5.2 Datenmodell dokumentieren
- Tabellenform (Notification-Typ → Empfänger → Badge → UI-Screen).
- Klar definieren, wann `chatId`, `requestId`, `tradeStatus` verpflichtend sind.
- Festhalten, welche Notification-Typen den InfoBox-Badge (`unreadHints`) beeinflussen.

### 5.3 Architekturentscheidungen vorbereiten
- **Single Source of Truth**: Firestore → Subscriptions → lokaler State. AsyncStorage nur Cache (optional).
- **Trennung der Zustände**:
  - `chatNotifications` (Nachrichten + neue Chats)
  - `tradeNotifications` (Hinweise/Entscheidungen)
  - `systemNotifications`
- Separate Selektoren (`getUnreadHintCount`, `getUnreadChatCount`) statt monolitischem `recalculateUnreadCount`.

### 5.4 Code-Aufräumplan (Ausblick Schritt 2)
1. Fallback-Notification-Code (neu hinzugefügt) **entfernen**, sobald sicher ist, dass Firestore-Stream zuverlässig läuft.
2. `ensureTradeNotification` & `createTradeDecisionHints` modularisieren → eigenes Service-Modul `notificationService.js`.
3. `recalculateUnreadCount`/`Hints` neu aufsetzen → deklarative Filter statt verschachtelter Bedingungen.
4. Konsistente `markAsRead`-Logik etablieren (z. B. ausschließlich `isRead = true` statt Hard-Delete).

---

## 6. Offene Fragen / ToDo für weiteres Vorgehen
- Verifizieren: **Löst Firestore aktuell Notifications für akzeptierte Trades korrekt aus?** → Mit Debug-Logs testen.
- Prüfen, ob alle Notifications mit konsistenten IDs (z. B. `doc.id`) versehen sind, damit Duplikaterkennung in UI funktioniert.
- Entscheiden, ob AsyncStorage weiterhin benötigt wird → falls ja, Synchronisation vereinheitlichen.

---

Diese Analyse bildet die Grundlage für den nächsten Schritt **„Refactor“** (Todo `notifications-refactor`). Ich nutze sie, um gezielt den Code zu entrümpeln und eine klare Struktur mit verlässlichen Badges aufzubauen. Weitere Ergebnisse folgen nach den geplanten Instrumentationen und Tests.***

