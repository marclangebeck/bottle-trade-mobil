# Notifications Refactor – Laufende Notizen

## Überblick
- **Datum Start:** 11. November 2025
- **Projektbereich:** Mobile-App (`App.js`, Notification-Services, Firestore-Integration)
- **Ziel:** Notification-System rückbauen, anschließend sauber und zuverlässig neu aufsetzen (App + Firestore), ohne bestehende Funktionen zu beeinträchtigen.
- **Referenzen:** `PROJEKT_DOKUMENTATION.md`, `docs/notifications-analysis.md`, Chat-Request-ID `7052aa48-b95a-403f-a748-23f8e92d81c4`

---

## Phase 0 – Vorbereitung & Sicherungen
- **Status:** abgeschlossen.
- **Highlights:**
  - Status/Sicherungsplan in `PROJEKT_DOKUMENTATION.md` ergänzt.
  - Smoke-Test-Checkliste in `docs/notifications-analysis.md` dokumentiert.
  - Backup `backup_20251111_phase0.tar.gz` erstellt (11. Nov 2025).
  - Branch `notifications-refactor-plan` angelegt und aktiviert.
- **Offene Punkte:** keine; Phase 1 kann starten.

---

## Phase 1 – Transparenz & Instrumentierung (laufend)
- **Status:** gestartet am 11. Nov 2025.
- **Ergebnisse bisher:**
  - `ENABLE_NOTIFICATION_DEBUG` in `config/featureFlags.js` hinterlegt (Expo-Umgebungsvariable).
  - Logger-Utility `services/notificationLogger.js` auf `logNotificationEvent` umgestellt (Legacy-Signatur kompatibel).
  - `App.js` und `services/database-web.js` mit strukturierten `logNotificationEvent`-Hooks (Subscriptions, Badge-Refresh, Trade-Notifications, Firestore CRUD, Chat-Messaging, Chat-Lifecycle).
- **Nächste Schritte:**
  - Log-Samples (u. a. Request `7052aa48-b95a-403f-a748-23f8e92d81c4`) erfassen und hier referenzieren.
  - Debug-Flag aktiv testen (Expo-Env setzen) und relevante Ausschnitte sichern.
- **Checkliste:** Backup `backup_20251111_phase0.tar.gz` vorhanden, Branch `notifications-refactor-plan` aktiv.

---

## Offene Fragen & Notizen
- AsyncStorage-Rolle klären (Cache vs. Primärquelle) – Entscheidung für Phase 3 vorbereiten.
- Prüfen, ob bestehende Admin-Tools zusätzliche Notifications generieren, die in den neuen Selektoren berücksichtigt werden müssen.
- Bei jedem Phasenabschluss: kurze Zusammenfassung + nächste Schritte in diesem Dokument ergänzen.

---

## Ablaufhinweise für weitere Sessions
- Bei Chat-Abbruch: Hier eintragen, was zuletzt gemacht wurde und welcher Schritt als nächstes folgt.
- Log-Dateien/Debug-Ausgaben kurz referenzieren (Pfad oder Timestamp), um spätere Analysen zu beschleunigen.

---

## Phase 1 – Log-Runde (Vorbereitung)
- **Debug-Flag aktivieren:** `EXPO_PUBLIC_NOTIFICATION_DEBUG=true npx expo start --tunnel --clear --port 8081`.
- **Szenarien:** Login → Dashboard; Trade-Request `7052aa48-b95a-403f-a748-23f8e92d81c4` (Erstellung, Entscheidung); Chat-Nachricht senden; Chat verlassen; Notifications/Badges prüfen.
### Scenario 1 - Login (11.11.25, 8:59 Uhr)
 LOG  ✅ Firebase app initialized (Firestore only)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: welcome
 LOG  🔄 App.js: route?.params: undefined
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 0, "isLoggedIn": false, "notificationCount": 0}
 LOG  [Notification][badge-reset] 2025-11-11T07:58:18.964Z {"data": {"reason": "no-user-or-logged-out"}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: login
 LOG  🔄 App.js: route?.params: undefined
 LOG  🔄 App.js: Render-Zyklus - currentScreen: login
 LOG  🔄 App.js: route?.params: undefined
 LOG  ✅ Login successful: mucki@postei.de
 LOG  ℹ️ Standard-User erkannt: mucki@postei.de ( mucki )
 LOG  ✅ Test login successful - using existing test user
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: undefined
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 PHASE3: Setting up Trade-Request-Subscriptions for user: user-1762182785600
 LOG  🔄 Getting notifications for user: user-1762182785600
 LOG  [Notification][firestore/getNotifications/start] 2025-11-11T07:59:43.292Z {"data": {"userId": "user-1762182785600"}, "type": "notifications"}
 LOG  🔄 Getting chats for user: user-1762182785600
 LOG  🔄 PHASE3: Setting up Firestore subscriptions for user: user-1762182785600
 LOG  🔄 Subscribing to chats/hints for user: user-1762182785600
 LOG  🔄 Getting chats for user: user-1762182785600
 LOG  🔄 Subscribing to notifications for user: user-1762182785600
 LOG  [Notification][firestore/subscribeNotifications/start] 2025-11-11T07:59:43.296Z {"data": {"userId": "user-1762182785600"}, "type": "notifications"}
 LOG  🔄 Getting notifications for user: user-1762182785600
 LOG  [Notification][firestore/getNotifications/start] 2025-11-11T07:59:43.297Z {"data": {"userId": "user-1762182785600"}, "type": "notifications"}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 0, "isLoggedIn": true, "notificationCount": 0}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-11T07:59:43.297Z {"data": {"chatBadgeCount": 0, "chatCount": 0, "hintBadgeCount": 0, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: undefined
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📊 getUserWineCounts für user-1762182785600: 3 im Regal, 3 veröffentlicht
 LOG  ✅ Found 1 ungelesene Notifications (von 8 insgesamt)
 LOG  [Notification][firestore/getNotifications/success] 2025-11-11T07:59:43.502Z {"data": {"count": 1, "total": 8, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  ✅ PHASE3: Notifications aus Firestore geladen: 1
 LOG  ⚡ JIT: 1 neue Notification(s) empfangen! [{"id": "RQwXnUhwgNSDcAN5MYjo", "title": "Chat verlassen", "type": "trade-info"}]
 LOG  [Notification][firestore/subscribeNotifications/new] 2025-11-11T07:59:43.502Z {"data": {"count": 1, "notifications": [[Object]], "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  📡 1 ungelesene Notifications (von 8 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T07:59:43.503Z {"data": {"count": 1, "total": 8, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T07:59:43.503Z {"data": {"count": 1, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T07:59:43.503Z {"data": {"storedCount": 1}, "type": "notifications"}
 LOG  ✅ PHASE3: 1 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  ✅ Found 1 ungelesene Notifications (von 8 insgesamt)
 LOG  [Notification][firestore/getNotifications/success] 2025-11-11T07:59:43.503Z {"data": {"count": 1, "total": 8, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-initial-load] 2025-11-11T07:59:43.504Z {"data": {"count": 1, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  ✅ PHASE3: Initial 1 notifications loaded and synced to AsyncStorage
 LOG  ✅ Found chats/hints: 0 (aus 0 gesamten Einträgen)
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 0
 LOG  ✅ PHASE3: 0 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  ✅ Found chats/hints: 0 (aus 0 gesamten Einträgen)
 LOG  ✅ PHASE3: Initial 0 chats loaded and synced to AsyncStorage
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: undefined
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ PHASE3: 0 Chats aus Firestore geladen und mit AsyncStorage synchronisiert
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 0, "isLoggedIn": true, "notificationCount": 1}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 1}
 LOG  [Notification][badge-refresh/done] 2025-11-11T07:59:43.511Z {"data": {"chatBadgeCount": 1, "chatCount": 0, "hintBadgeCount": 0, "notificationCount": 1}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T07:59:43.511Z {"data": {"badge": "chat", "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "from": 0, "to": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: undefined
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📊 DashboardScreen: unreadNotifications = 1
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: undefined
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 0, "isLoggedIn": true, "notificationCount": 1}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 1}
 LOG  [Notification][badge-refresh/done] 2025-11-11T07:59:45.538Z {"data": {"chatBadgeCount": 1, "chatCount": 0, "hintBadgeCount": 0, "notificationCount": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: undefined
 LOG  ℹ️ Bild-Migration bereits durchgeführt für User: user-1762182785600

**Beobachtung:** Subscriptions greifen direkt nach dem Login; Firestore liefert 1 ungelesene Notification, und die Badge-Anzeigen setzen korrekt auf 1.

### Scenario 2 - Trade angefragt (11.11.25, 9:10 Uhr)
 LOG  🔄 App.js: handleNavigate aufgerufen - screen: "weinboerse", params: null
 LOG  🔄 App.js: Aktueller Screen: "home", wird geändert zu: "weinboerse"
 LOG  🔄 App.js: setCurrentScreen aufgerufen: weinboerse
 LOG  🔄 App.js: setRoute aufgerufen mit params: null
 LOG  ✅ App.js: State aktualisiert - currentScreen wird: weinboerse
 LOG  🔄 App.js: Render-Zyklus - currentScreen: weinboerse
 LOG  🔄 App.js: route?.params: null
 LOG  🔍 WeinboerseScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔍 WeinboerseScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 WeinboerseScreen: Loading wines...
 LOG  🔄 Loading wines from Firestore...
 LOG  🔄 Getting available wines
 LOG  🔄 Getting all wines for owner (including traded): user-1762182785600
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Found available wines: 9
 LOG  ✅ Loaded 9 wines from Firestore
 LOG  ✅ WeinboerseScreen: Loaded 9 wines
 LOG  ✅ Found all wines (for counting): 6
 LOG  🔍 WeinboerseScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔍 WeinboerseScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔍 WeinboerseScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 PHASE3: Erstelle Trade-Request... {"fromUser": "user-1762182785600", "toUser": "user-1762182855175", "wine": "I1l0xz2hHEtdJL8fUPZ4"}
 LOG  🔄 Creating trade request
 LOG  [Notification][ensureTradeNotification/start] 2025-11-11T08:10:10.051Z {"data": {"fromUserId": "user-1762182785600", "requestId": "ZIfe9J6HkLDH3ZM22E9O", "toUserId": "user-1762182855175", "wineId": "I1l0xz2hHEtdJL8fUPZ4"}, "type": "trade"}
 LOG  🔄 PHASE3: Erstelle Trade-Hinweise... {"currentUserId": "user-1762182785600", "fromUserId": "user-1762182785600", "requestId": "ZIfe9J6HkLDH3ZM22E9O", "toUserId": "user-1762182855175"}
 LOG  🔄 Getting trade request: ZIfe9J6HkLDH3ZM22E9O
 LOG  ✅ Trade request created: ZIfe9J6HkLDH3ZM22E9O
 LOG  ✅ PHASE3: Trade-Request erstellt: ZIfe9J6HkLDH3ZM22E9O
 LOG  🔄 Marking wines as in trade request: {"tradeRequestId": "ZIfe9J6HkLDH3ZM22E9O", "wineAId": null, "wineBId": "I1l0xz2hHEtdJL8fUPZ4"}
 LOG  ✅ Wines marked as in trade request
 LOG  ✅ PHASE3: Wein-Kennzeichnung gesetzt für Wein B: I1l0xz2hHEtdJL8fUPZ4
 LOG  🔍 PHASE3: A (Absender) erstellt Hinweis - currentUserId: user-1762182785600 fromUserId: user-1762182785600
 LOG  🔍 PHASE3: Erstelle trade-involved Hinweis für A - hintType: trade-involved userId: user-1762182785600
 LOG  🔄 Creating trade hint in Firestore
 LOG  ⚡ JIT: 1 neue Chat(s)/Hinweis(e) empfangen! [{"entryType": "hint", "hintType": "trade-involved", "id": "tISPlr3xOrpoi119TFo4"}]
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 1
 LOG  ✅ PHASE3: 1 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: weinboerse
 LOG  🔄 App.js: route?.params: null
 LOG  🔍 WeinboerseScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 1}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 1}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:10:10.349Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 0, "notificationCount": 1}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T08:10:10.416Z {"data": {"badge": "info", "from": 0, "notificationsConsidered": 1, "to": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: weinboerse
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 2}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:10:10.416Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T08:10:10.416Z {"data": {"badge": "info", "from": 0, "notificationsConsidered": 1, "to": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: weinboerse
 LOG  🔄 App.js: route?.params: null
 LOG  ⚡ JIT: Notification created in Firestore: CW2vQE1F8NnRGz1FsB0p type: trade-info
 LOG  [Notification][firestore/createNotification/success] 2025-11-11T08:10:10.454Z {"data": {"notificationId": "CW2vQE1F8NnRGz1FsB0p", "userId": "user-1762182785600"}, "type": "trade-info"}
 LOG  ✅ PHASE3: Notification für A erstellt
 LOG  [Notification][ensureTradeNotification/notification-sender] 2025-11-11T08:10:10.455Z {"data": {"notificationType": "trade-info", "requestId": "ZIfe9J6HkLDH3ZM22E9O", "userId": "user-1762182785600"}, "type": "trade"}
 LOG  🔒 PHASE3: Sicherheitscheck - A sollte KEINEN trade-decision Hinweis haben
 LOG  ✅ PHASE3: Trade-Hinweise für User user-1762182785600 erstellt
 LOG  [Notification][ensureTradeNotification/finish] 2025-11-11T08:10:10.455Z {"data": {"requestId": "ZIfe9J6HkLDH3ZM22E9O"}, "type": "trade"}
 LOG  📡 2 ungelesene Notifications (von 9 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T08:10:10.479Z {"data": {"count": 2, "total": 9, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T08:10:10.479Z {"data": {"count": 2, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T08:10:10.479Z {"data": {"storedCount": 2}, "type": "notifications"}
 LOG  ✅ PHASE3: 2 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: weinboerse
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 2}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:10:10.493Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: weinboerse
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Render-Zyklus - currentScreen: weinboerse
 LOG  🔄 App.js: route?.params: null
 LOG  🔍 WeinboerseScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 2}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:10:12.458Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: weinboerse
 LOG  🔄 App.js: route?.params: null

**Beobachtung:** Trade-Anfrage erzeugt `trade-involved`-Hinweis sowie Info-Badge für den Absender; Badges (Chat = 1, Info = 1) und Firestore/AsyncStorage sind synchron.

### Scenario 3 - Anderer Benutzer loggt sich ein, nimmt den Trade an und schreibt die erste Chatnachricht (11.11.25, 9:15 Uhr)

🔄 App.js: Render-Zyklus - currentScreen: welcome
 LOG  🔄 App.js: route?.params: null
 LOG  🔌 PHASE3: Trade-Request-Subscriptions unsubscribed
 LOG  🔌 PHASE3: Unsubscribing from Firestore
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": false, "notificationCount": 2}
 LOG  [Notification][badge-reset] 2025-11-11T08:12:37.125Z {"data": {"reason": "no-user-or-logged-out"}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: welcome
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Render-Zyklus - currentScreen: login
 LOG  🔄 App.js: route?.params: null
 LOG  ✅ Login successful: diggi@posteo.de
 LOG  ℹ️ Standard-User erkannt: diggi@posteo.de ( diggi )
 LOG  ✅ Test login successful - using existing test user
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 PHASE3: Setting up Trade-Request-Subscriptions for user: user-1762182855175
 LOG  🔄 Getting notifications for user: user-1762182855175
 LOG  [Notification][firestore/getNotifications/start] 2025-11-11T08:12:44.115Z {"data": {"userId": "user-1762182855175"}, "type": "notifications"}
 LOG  🔄 Getting chats for user: user-1762182855175
 LOG  🔄 PHASE3: Setting up Firestore subscriptions for user: user-1762182855175
 LOG  🔄 Subscribing to chats/hints for user: user-1762182855175
 LOG  🔄 Getting chats for user: user-1762182855175
 LOG  🔄 Subscribing to notifications for user: user-1762182855175
 LOG  [Notification][firestore/subscribeNotifications/start] 2025-11-11T08:12:44.116Z {"data": {"userId": "user-1762182855175"}, "type": "notifications"}
 LOG  🔄 Getting notifications for user: user-1762182855175
 LOG  [Notification][firestore/getNotifications/start] 2025-11-11T08:12:44.116Z {"data": {"userId": "user-1762182855175"}, "type": "notifications"}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 2}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:12:44.117Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T08:12:44.122Z {"data": {"badge": "chat", "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "from": 0, "to": 1}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T08:12:44.123Z {"data": {"badge": "info", "from": 0, "notificationsConsidered": 1, "to": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  📊 DashboardScreen: unreadNotifications = 1
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📊 getUserWineCounts für user-1762182855175: 6 im Regal, 6 veröffentlicht
 LOG  [Notification][ensureTradeNotification/start] 2025-11-11T08:12:44.310Z {"data": {"fromUserId": "user-1762182785600", "requestId": "ZIfe9J6HkLDH3ZM22E9O", "toUserId": "user-1762182855175", "wineId": "I1l0xz2hHEtdJL8fUPZ4"}, "type": "trade"}
 LOG  🔄 PHASE3: Erstelle Trade-Hinweise... {"currentUserId": "user-1762182855175", "fromUserId": "user-1762182785600", "requestId": "ZIfe9J6HkLDH3ZM22E9O", "toUserId": "user-1762182855175"}
 LOG  🔄 Getting trade request: ZIfe9J6HkLDH3ZM22E9O
 LOG  ✅ Found 3 ungelesene Notifications (von 11 insgesamt)
 LOG  [Notification][firestore/getNotifications/success] 2025-11-11T08:12:44.311Z {"data": {"count": 3, "total": 11, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  ✅ PHASE3: Notifications aus Firestore geladen: 3
 LOG  ⚡ JIT: 3 neue Notification(s) empfangen! [{"id": "wmG1N3QxqkZeUhgFXAE4", "title": "Chat verlassen", "type": "trade-info"}, {"id": "AhfAkokBAVrbXqOrM572", "title": "Chat verlassen", "type": "trade-info"}, {"id": "a28bLDDRoFbxEtdxBJ1t", "title": "Chat verlassen", "type": "trade-info"}]
 LOG  [Notification][firestore/subscribeNotifications/new] 2025-11-11T08:12:44.311Z {"data": {"count": 3, "notifications": [[Object], [Object], [Object]], "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  📡 3 ungelesene Notifications (von 11 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T08:12:44.312Z {"data": {"count": 3, "total": 11, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T08:12:44.312Z {"data": {"count": 3, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T08:12:44.312Z {"data": {"storedCount": 3}, "type": "notifications"}
 LOG  ✅ PHASE3: 3 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  ✅ Found 3 ungelesene Notifications (von 11 insgesamt)
 LOG  [Notification][firestore/getNotifications/success] 2025-11-11T08:12:44.313Z {"data": {"count": 3, "total": 11, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-initial-load] 2025-11-11T08:12:44.313Z {"data": {"count": 3, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  ✅ PHASE3: Initial 3 notifications loaded and synced to AsyncStorage
 LOG  ✅ Found chats/hints: 0 (aus 1 gesamten Einträgen)
 LOG  ⚡ JIT: 1 neue Chat(s)/Hinweis(e) empfangen! [{"entryType": "hint", "hintType": "trade-involved", "id": "tISPlr3xOrpoi119TFo4"}]
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 0
 LOG  ✅ PHASE3: 0 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  ✅ Found chats/hints: 0 (aus 1 gesamten Einträgen)
 LOG  ✅ PHASE3: Initial 0 chats loaded and synced to AsyncStorage
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 0, "isLoggedIn": true, "notificationCount": 3}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 3, "chatNotificationEntries": 3, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 3}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:12:44.320Z {"data": {"chatBadgeCount": 3, "chatCount": 0, "hintBadgeCount": 0, "notificationCount": 3}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T08:12:44.320Z {"data": {"badge": "chat", "chatNotificationEntries": 3, "chatUnreadFromChats": 0, "from": 1, "to": 3}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T08:12:44.321Z {"data": {"badge": "info", "from": 1, "notificationsConsidered": 0, "to": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ PHASE3: 0 Chats aus Firestore geladen und mit AsyncStorage synchronisiert
 LOG  📊 DashboardScreen: unreadNotifications = 3
 LOG  🔄 Creating trade hint in Firestore
 LOG  ⚡ JIT: 1 neue Chat(s)/Hinweis(e) empfangen! [{"entryType": "hint", "hintType": "trade-decision", "id": "Qf3lzqyehMxJAsJTMaf0"}]
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 1
 LOG  ✅ PHASE3: 1 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 3}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 3, "chatNotificationEntries": 3, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 3}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:12:44.580Z {"data": {"chatBadgeCount": 3, "chatCount": 1, "hintBadgeCount": 0, "notificationCount": 3}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  ✅ Trade hint created in Firestore: Qf3lzqyehMxJAsJTMaf0
 LOG  ✅ PHASE3: Trade-decision Hinweis für B erstellt: Qf3lzqyehMxJAsJTMaf0
 LOG  🔄 JIT: Creating notification in Firestore for user: user-1762182855175 type: trade
 LOG  [Notification][firestore/createNotification/start] 2025-11-11T08:12:44.624Z {"data": {"chatId": undefined, "hintType": undefined, "requestId": "ZIfe9J6HkLDH3ZM22E9O", "userId": "user-1762182855175"}, "type": "trade"}
 LOG  ⚡ JIT: 1 neue Notification(s) empfangen! [{"id": "klcMNuCRRF9I7Ot8Jq1A", "title": "Tauschanfrage von mucki", "type": "trade"}]
 LOG  [Notification][firestore/subscribeNotifications/new] 2025-11-11T08:12:44.634Z {"data": {"count": 1, "notifications": [[Object]], "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  📡 4 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T08:12:44.635Z {"data": {"count": 4, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T08:12:44.636Z {"data": {"count": 4, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T08:12:44.636Z {"data": {"storedCount": 4}, "type": "notifications"}
 LOG  ✅ PHASE3: 4 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 1
 LOG  ✅ PHASE3: 1 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 4}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 3, "chatNotificationEntries": 3, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 4}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:12:44.656Z {"data": {"chatBadgeCount": 3, "chatCount": 1, "hintBadgeCount": 1, "notificationCount": 4}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T08:12:44.656Z {"data": {"badge": "info", "from": 0, "notificationsConsidered": 1, "to": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ⚡ JIT: Notification created in Firestore: klcMNuCRRF9I7Ot8Jq1A type: trade
 LOG  [Notification][firestore/createNotification/success] 2025-11-11T08:12:44.701Z {"data": {"notificationId": "klcMNuCRRF9I7Ot8Jq1A", "userId": "user-1762182855175"}, "type": "trade"}
 LOG  ✅ PHASE3: Trade-decision Notification für B erstellt
 LOG  [Notification][ensureTradeNotification/notification-receiver] 2025-11-11T08:12:44.702Z {"data": {"notificationType": "trade", "requestId": "ZIfe9J6HkLDH3ZM22E9O", "userId": "user-1762182855175"}, "type": "trade"}
 LOG  ✅ PHASE3: Trade-Hinweise für User user-1762182855175 erstellt
 LOG  [Notification][ensureTradeNotification/finish] 2025-11-11T08:12:44.702Z {"data": {"requestId": "ZIfe9J6HkLDH3ZM22E9O"}, "type": "trade"}
 LOG  📡 4 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T08:12:44.724Z {"data": {"count": 4, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T08:12:44.724Z {"data": {"count": 4, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T08:12:44.724Z {"data": {"storedCount": 4}, "type": "notifications"}
 LOG  ✅ PHASE3: 4 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 4}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 3, "chatNotificationEntries": 3, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 4}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:12:44.739Z {"data": {"chatBadgeCount": 3, "chatCount": 1, "hintBadgeCount": 1, "notificationCount": 4}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 4}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 3, "chatNotificationEntries": 3, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 4}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:12:46.682Z {"data": {"chatBadgeCount": 3, "chatCount": 1, "hintBadgeCount": 1, "notificationCount": 4}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 Starte automatische Bild-Migration für User: user-1762182855175
 LOG  🔄 Starte Migration aller lokalen Weinbilder zu Firebase Storage...
 LOG  ✅ Migration abgeschlossen: 0 erfolgreich, 0 fehlgeschlagen, 9 übersprungen
 LOG  ✅ Automatische Migration abgeschlossen: 0 erfolgreich, 0 fehlgeschlagen, 9 übersprungen
 LOG  [BottomNavigation] InfoBox measure on press {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 App.js: handleNavigate aufgerufen - screen: "hinweise", params: null
 LOG  🔄 App.js: Aktueller Screen: "home", wird geändert zu: "hinweise"
 LOG  🔄 App.js: setCurrentScreen aufgerufen: hinweise
 LOG  🔄 App.js: setRoute aufgerufen mit params: null
 LOG  ✅ App.js: State aktualisiert - currentScreen wird: hinweise
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 Getting trade request: ZIfe9J6HkLDH3ZM22E9O
 LOG  🔄 Markiere 1 Hinweis-Notifications als gelesen...
 LOG  🔄 Marking notification as read: klcMNuCRRF9I7Ot8Jq1A
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📡 3 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T08:12:52.569Z {"data": {"count": 3, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T08:12:52.570Z {"data": {"count": 3, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T08:12:52.570Z {"data": {"storedCount": 3}, "type": "notifications"}
 LOG  ✅ PHASE3: 3 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Hinweis-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 3}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 3, "chatNotificationEntries": 3, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 3}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:12:52.581Z {"data": {"chatBadgeCount": 3, "chatCount": 1, "hintBadgeCount": 0, "notificationCount": 3}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T08:12:52.581Z {"data": {"badge": "info", "from": 1, "notificationsConsidered": 0, "to": 0}, "type": "badges"}
**Beobachtung:** Trade-Annahme erzeugt für Nutzer B den trade-decision-Hinweis und eine `trade`-Notification; Chat-Badge steigt auf 3, Info-Badge fällt nach dem Lesen wieder auf 0 – Firestore und AsyncStorage bleiben synchron.

 - **Hinweis:** Während der Session Console filtern (`Notification`) und optional Raw-Logs sichern (`logs/notifications-phase1-YYYYMMDD.txt`).

### Scenario 4 - Chatnachricht löschen (11.11.25, 9:48 Uhr)

LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  🔄 ChatListScreen: handleChatImagePress aufgerufen für Chat: ZD4MmMBSROLsv4CXm7G4 trade
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "ZD4MmMBSROLsv4CXm7G4", "participants": 2, "type": "trade"}]
 LOG  🔄 Rendering Chat 1/1: ZD4MmMBSROLsv4CXm7G4 trade
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "ZD4MmMBSROLsv4CXm7G4", "participants": 2, "type": "trade"}]
 LOG  🔄 Rendering Chat 1/1: ZD4MmMBSROLsv4CXm7G4 trade
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "ZD4MmMBSROLsv4CXm7G4", "participants": 2, "type": "trade"}]
 LOG  🔄 Rendering Chat 1/1: ZD4MmMBSROLsv4CXm7G4 trade
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 Marking chat as deleted for user: user-1762182785600
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 1
 LOG  ✅ PHASE3: 1 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 1 (Chats: 0, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 0
 LOG  📊 ChatListScreen V2.0 - Final allChats: 0
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Chat-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 3}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 2, "notificationCount": 3}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:47:19.718Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 2, "notificationCount": 3}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 1 (Chats: 0, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ Chat als gelöscht markiert für User: user-1762182785600
 LOG  ✅ PHASE3: Chat/Hinweis als gelöscht markiert in Firestore: ZD4MmMBSROLsv4CXm7G4
 LOG  🔄 Creating trade hint in Firestore
 LOG  ⚡ JIT: 1 neue Chat(s)/Hinweis(e) empfangen! [{"entryType": "hint", "hintType": "chat-left", "id": "uIKVYRcKOBfnepXwIuff"}]
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 1
 LOG  ✅ PHASE3: 1 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 1
 LOG  ✅ PHASE3: 1 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 1 (Chats: 0, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 0
 LOG  📊 ChatListScreen V2.0 - Final allChats: 0
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Chat-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 3}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 2, "notificationCount": 3}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:47:19.788Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 2, "notificationCount": 3}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 1 (Chats: 0, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ Trade hint created in Firestore: uIKVYRcKOBfnepXwIuff
 LOG  ✅ PHASE3: Chat-verlassen-Hinweis erstellt für: user-1762182855175
 LOG  🔄 JIT: Creating notification in Firestore for user: user-1762182855175 type: trade-info
 LOG  [Notification][firestore/createNotification/start] 2025-11-11T08:47:19.835Z {"data": {"chatId": "ZD4MmMBSROLsv4CXm7G4", "hintType": undefined, "requestId": undefined, "userId": "user-1762182855175"}, "type": "trade-info"}
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 1
 LOG  ✅ PHASE3: 1 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 1 (Chats: 0, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 0
 LOG  📊 ChatListScreen V2.0 - Final allChats: 0
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Chat-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 3}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 2, "notificationCount": 3}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:47:19.861Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 2, "notificationCount": 3}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 1 (Chats: 0, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ⚡ JIT: Notification created in Firestore: mVvEs614hVBzPkqzejXD type: trade-info
 LOG  [Notification][firestore/createNotification/success] 2025-11-11T08:47:19.887Z {"data": {"notificationId": "mVvEs614hVBzPkqzejXD", "userId": "user-1762182855175"}, "type": "trade-info"}
 LOG  ✅ PHASE3: Chat-verlassen-Notification erstellt für: user-1762182855175
 LOG  [Notification][chat/delete/notification] 2025-11-11T08:47:19.887Z {"data": {"chatId": "ZD4MmMBSROLsv4CXm7G4", "notificationType": "trade-info", "userId": "user-1762182855175"}, "type": "chat"}
 LOG  ✅ PHASE3: Chat gelöscht für User: user-1762182785600

**Beobachtung:** Chat-Löschung erzeugt für den verbleibenden Teilnehmer einen `chat-left`-Hinweis plus `trade-info`-Notification; Badges bleiben konsistent und AsyncStorage/Firestore spiegeln den gelöschten Chat korrekt wider.


### Scenario 5 - Beobachtung der Notifications

**Beobachtung meinerseits:** Es werden die falschen Notifications angegeben. Die Zahlen stimmen nicht überein zwischen tatsächlichen Hinweisen (1) und er Angabe der Notification (2). Gelöscht wird die Notification. Auch beim Chat wird 1 angezeigt, obwohl es gar keinen Chat mehr gibt.Fix-Plan direkt ausformulieren _'

LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 App.js: handleNavigate aufgerufen - screen: "notifications", params: null
 LOG  🔄 App.js: Aktueller Screen: "chat-list", wird geändert zu: "notifications"
 LOG  🔄 App.js: "notifications" erkannt, navigiere zu "chat-list"
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 1 (Chats: 0, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 0
 LOG  📊 ChatListScreen V2.0 - Final allChats: 0
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Chat-Notifications gefunden
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 0
 LOG  📊 ChatListScreen V2.0 - Final allChats: 0
 LOG  [BottomNavigation] InfoBox measure on press {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 App.js: handleNavigate aufgerufen - screen: "hinweise", params: null
 LOG  🔄 App.js: Aktueller Screen: "chat-list", wird geändert zu: "hinweise"
 LOG  🔄 App.js: setCurrentScreen aufgerufen: hinweise
 LOG  🔄 App.js: setRoute aufgerufen mit params: null
 LOG  ✅ App.js: State aktualisiert - currentScreen wird: hinweise
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 Getting trade request: ZIfe9J6HkLDH3ZM22E9O
 LOG  🔄 Markiere 2 Hinweis-Notifications als gelesen...
 LOG  🔄 Marking notification as read: KQE80u4wz7RY1OrtKuWD
 LOG  🔄 Marking notification as read: CW2vQE1F8NnRGz1FsB0p
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📡 2 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T08:51:33.085Z {"data": {"count": 2, "total": 12, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T08:51:33.085Z {"data": {"count": 2, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T08:51:33.085Z {"data": {"storedCount": 2}, "type": "notifications"}
 LOG  ✅ PHASE3: 2 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  📡 1 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T08:51:33.086Z {"data": {"count": 1, "total": 12, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T08:51:33.086Z {"data": {"count": 1, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T08:51:33.086Z {"data": {"storedCount": 1}, "type": "notifications"}
 LOG  ✅ PHASE3: 1 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Hinweis-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 1}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 1}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:51:33.097Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 0, "notificationCount": 1}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-11T08:51:33.098Z {"data": {"badge": "info", "from": 2, "notificationsConsidered": 0, "to": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Hinweis-Notifications gefunden
 LOG  ✅ Notification marked as read: KQE80u4wz7RY1OrtKuWD
 LOG  📡 1 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T08:51:33.158Z {"data": {"count": 1, "total": 12, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T08:51:33.159Z {"data": {"count": 1, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T08:51:33.159Z {"data": {"storedCount": 1}, "type": "notifications"}
 LOG  ✅ PHASE3: 1 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Hinweis-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 1}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 1}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:51:33.168Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 0, "notificationCount": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ Notification marked as read: CW2vQE1F8NnRGz1FsB0p
 LOG  ✅ 2 Hinweis-Notifications als gelesen markiert
 LOG  📡 1 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T08:51:33.208Z {"data": {"count": 1, "total": 12, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T08:51:33.208Z {"data": {"count": 1, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T08:51:33.208Z {"data": {"storedCount": 1}, "type": "notifications"}
 LOG  ✅ PHASE3: 1 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Hinweis-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 1}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 1}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:51:33.218Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 0, "notificationCount": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Hinweis-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 1, "isLoggedIn": true, "notificationCount": 1}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 1}
 LOG  [Notification][badge-refresh/done] 2025-11-11T08:51:35.129Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 0, "notificationCount": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  🔄 App.js: handleNavigate aufgerufen - screen: "dashboard", params: null
 LOG  🔄 App.js: Aktueller Screen: "hinweise", wird geändert zu: "dashboard"
 LOG  🔄 App.js: setCurrentScreen aufgerufen: dashboard
 LOG  🔄 App.js: setRoute aufgerufen mit params: null
 LOG  ✅ App.js: State aktualisiert - currentScreen wird: dashboard
 LOG  🔄 App.js: Render-Zyklus - currentScreen: dashboard
 LOG  🔄 App.js: route?.params: null
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📊 getUserWineCounts für user-1762182785600: 2 im Regal, 2 veröffentlicht
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  [BottomNavigation] InfoBox measure on press {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 App.js: handleNavigate aufgerufen - screen: "hinweise", params: null
 LOG  🔄 App.js: Aktueller Screen: "dashboard", wird geändert zu: "hinweise"
 LOG  🔄 App.js: setCurrentScreen aufgerufen: hinweise
 LOG  🔄 App.js: setRoute aufgerufen mit params: null
 LOG  ✅ App.js: State aktualisiert - currentScreen wird: hinweise
 LOG  🔄 App.js: Render-Zyklus - currentScreen: hinweise
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering HinweisScreen - currentScreen: hinweise
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 Getting trade request: ZIfe9J6HkLDH3ZM22E9O
 LOG  ✅ Keine ungelesenen Hinweis-Notifications gefunden
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ HinweisScreen geladen - Nur Hinweise
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}

+**Beobachtung:** Badge-Anzeigen bleiben nach Navigation zwischen `chat-list` und `hinweise` inkonsistent (Info zeigt 2, obwohl nur 1 Hinweis existiert; Chat-Badge bleibt 1 trotz gelöschtem Chat) – deutet auf erneuten Abgleich in `refreshNotificationBadges` oder Datenquelle hin.
+**Details:**
+- `trade-info`-Notification mit `chatId` bleibt ungelesen und wird weiterhin als Chat-Benachrichtigung gezählt.
+- Hinweis-Badge zählt ehemalige `trade-info`-Einträge ohne `chatId`, obwohl sie im UI nicht mehr sichtbar sind.
+- `pendingNotificationDeletionsRef` verhindert zwar Überschreiben während Löschvorgängen, räumt aber veraltete Notifications nicht zuverlässig auf.
+
+**Datenanalyse (Todo Phase 2):** Für Request `ZIfe9J6HkLDH3ZM22E9O` / Chat `ZD4MmMBSROLsv4CXm7G4` Firestore- und AsyncStorage-Einträge sichern:
+- `users/{uid}/notifications` – prüfen, welche `trade-info`-Dokumente verblieben sind.
+- `chats`-Collection – Status `deleted`, `entryType`, `deletedBy` kontrollieren.
+- AsyncStorage: `bottle-trade-notifications`, `bottle-trade-chats` exportieren (z. B. via Debug-Console) und mit Firestore vergleichen.
+- Ergebnisse in `NOTES_NOTIFICATIONS.md` dokumentieren, um Fix-Plan abzuleiten.
+
+**Fix-Plan Phase 2:**
+1. **Notification-Cleanup verbessern**
+   - Beim Löschen/Lesen von Chats/Hinweisen `fsDeleteNotificationsForChat` bzw. `fsDeleteNotificationsForHint` sofort aufrufen und sicherstellen, dass zugehörige Einträge auch lokal entfernt werden (`setNotifications`).
+   - Zusätzliche Prüfung: `trade-info`-Notifications mit `chatId` sollen nach Chat-Löschung automatisch als gelesen/gelöscht markiert werden.
+2. **Badge-Berechnung umbauen**
+   - `refreshNotificationBadges` auf gefilterte `chats`-/`hints`-Arrays stützen (statt Roh-`notifications`), damit Soft-Delete (`deletedBy`) direkt berücksichtigt wird.
+   - Optional: `trade-info`-Notifications mit `chatId` separat behandeln, sodass sie nicht mehr in `chatNotificationEntries` landen.
+3. **Logging & Tests**
+   - `logNotificationEvent` für Badge-Pfade erweitern (z. B. `badge-pre-calculation`) um vor Umsetzung zu sehen, welche Listen genau gezählt werden.
+   - Szenarien 2–5 nach Anpassung erneut durchspielen; Ergebnisse dokumentieren.
+4. **Migration/One-Off Cleanup**
+   - Einmaliges Skript/Helper, um bestehende Altlasten (`trade-info`-Notifications für gelöschte Chats) aus Firestore/AsyncStorage zu entfernen, damit Nutzer sofort korrekte Badges erhalten.
+
+**Umsetzung (11.11.25, 10:05 Uhr):** Cleanup-Logik und Badge-Berechnung angepasst (`App.js`), neue `badge-pre-calculation`-Logs aktiv. Testszenarien folgen.
+ 
+## Phase 2 – Logging-Tests (laufend)
+- **Ziel:** Wirkung der Cleanup-/Badge-Anpassungen verifizieren und verbleibende Inkonsistenzen identifizieren.
+- **Debug-Flag:** Expo weiterhin mit `EXPO_PUBLIC_NOTIFICATION_DEBUG=true` starten, damit `badge-pre-calculation`-Logs sichtbar bleiben.
+- **Szenarien:** Phase‑1 Sequenz erneut ab Szenario 2 (Trade-Flow, Gegenkonto, Chat-Löschung, Notifications) durchlaufen, Fokus auf Badge-Updates.
+- **Auswertung:** Logeinträge zu `badge-pre-calculation`, `badge-refresh/done`, `subscription/notifications-update` sammeln und Differenzen zwischen Firestore ↔ AsyncStorage notieren.
+- **Dokumentation:** Relevante Log-Ausschnitte und Beobachtungen direkt unter diesem Abschnitt ergänzen, inklusive Datum/Uhrzeit.

### Scenario 1 - Login (11.11.25, 15:48 Uhr)
LOG  ✅ Login successful: mucki@postei.de
LOG  [Notification][badge-pre-calculation] 2025-11-11T14:50:47.293Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 0, "filteredHints": 0, "hintUnreadFromHints": 0, "totalNotifications": 0}, "type": "badges"}
LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 0}
LOG  ⚡ JIT: 1 neue Notification(s) empfangen! [{"id": "RQwXnUhwgNSDcAN5MYjo", "title": "Chat verlassen", "type": "trade-info"}]
LOG  [Notification][badge-pre-calculation] 2025-11-11T14:50:47.518Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 1, "extraHintNotifications": 0, "filteredChats": 0, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 1}, "type": "badges"}
LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "chatNotificationEntries": 1, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 1}
LOG  [Notification][badge-refresh/done] 2025-11-11T14:50:47.518Z {"data": {"chatBadgeCount": 1, "chatCount": 1, "hintBadgeCount": 1, "notificationCount": 1}, "type": "badges"}

**Beobachtung:** Login-Run liefert zuerst Nullwerte; sobald Firestore `trade-info` + Hint bringt, zeigt `badge-pre-calculation` den Sprung auf `{extraChatNotifications: 1, filteredHints: 1}` und das Badge setzt sauber auf 1.

### Scenario 1 - 2. Login-Test und Trade-Anfrage (11.11.25, 16:02 Uhr)
LOG  ✅ Login successful: mucki@postei.de
LOG  [Notification][badge-pre-calculation] 2025-11-11T15:00:30.298Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 0, "filteredHints": 0, "hintUnreadFromHints": 0, "totalNotifications": 0}, "type": "badges"}
LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 0}
LOG  ⚡ JIT: 1 neue Notification(s) empfangen! [{"id": "RQwXnUhwgNSDcAN5MYjo", "title": "Chat verlassen", "type": "trade-info"}]
LOG  [Notification][badge-pre-calculation] 2025-11-11T15:00:30.514Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 1, "extraHintNotifications": 0, "filteredChats": 0, "filteredHints": 1, "hintUnreadFromHints": 0, "totalNotifications": 1}, "type": "badges"}
LOG  [Notification][auto-cleanup/orphaned-notifications] 2025-11-11T15:00:30.515Z {"data": {"orphanedChatNotifications": ["RQwXnUhwgNSDcAN5MYjo"], "orphanedHintNotifications": [], "removedCount": 1}, "type": "notifications"}
LOG  [Notification][badge-pre-calculation] 2025-11-11T15:00:30.523Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 0, "filteredHints": 1, "hintUnreadFromHints": 0, "totalNotifications": 0}, "type": "badges"}
LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 0}
LOG  [Notification][badge-refresh/done] 2025-11-11T15:00:30.523Z {"data": {"chatBadgeCount": 0, "chatCount": 1, "hintBadgeCount": 0, "notificationCount": 0}, "type": "badges"}
LOG  [Notification][badge-update] 2025-11-11T15:00:30.523Z {"data": {"badge": "chat", "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "from": 1, "to": 0}, "type": "badges"}

**Beobachtung:** Auto-Cleanup entfernt die verwaiste `trade-info`-Notification (`RQwXnUhwgNSDcAN5MYjo`) sofort und setzt Chat-/Hint-Badges auf 0. Das Info-Icon leert sich, am Hinweis-Container bleibt die rote 1 jedoch bestehen – für die Kartenansicht fehlt noch ein Refresh.

### Scenario 2 -  Chatten mit einem User
 "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 3, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-11T15:59:46.323Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 2, "filteredHints": 1, "hintUnreadFromHints": 0, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-11T15:59:46.323Z {"data": {"chatBadgeCount": 0, "chatCount": 3, "hintBadgeCount": 0, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ Chat marked as read: 8bn8qa8Pyy6yYmmRhsyC
 LOG  ✅ PHASE3: Chat als gelesen markiert in Firestore: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔧 Lokaler State aktualisiert: 0 -> 0 Notifications (chatId: 8bn8qa8Pyy6yYmmRhsyC)
 LOG  🔄 Deleting notifications for chat: 8bn8qa8Pyy6yYmmRhsyC tradeRequestId: YoDHHtfPijI6KvxYCOrW
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 3, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-11T15:59:46.360Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 2, "filteredHints": 1, "hintUnreadFromHints": 0, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-11T15:59:46.360Z {"data": {"chatBadgeCount": 0, "chatCount": 3, "hintBadgeCount": 0, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ Found messages: 2
 LOG  ✅ PHASE3: 2 Nachrichten sofort geladen für Chat 8bn8qa8Pyy6yYmmRhsyC
 LOG  📡 PHASE3: Richte Nachrichten-Subscription für Chat 8bn8qa8Pyy6yYmmRhsyC ein
 LOG  🔄 Subscribing to messages for chat: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Chat marked as read: 8bn8qa8Pyy6yYmmRhsyC
 LOG  ✅ PHASE3: Chat als gelesen markiert in Firestore: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 Deleting notifications for chat: 8bn8qa8Pyy6yYmmRhsyC tradeRequestId: YoDHHtfPijI6KvxYCOrW
 LOG  🔧 Lokaler State aktualisiert: 0 -> 0 Notifications (chatId: 8bn8qa8Pyy6yYmmRhsyC)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 3, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-11T15:59:46.406Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 2, "filteredHints": 1, "hintUnreadFromHints": 0, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-11T15:59:46.406Z {"data": {"chatBadgeCount": 0, "chatCount": 3, "hintBadgeCount": 0, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 3
 LOG  ✅ PHASE3: 3 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 3, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-11T15:59:46.418Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 2, "filteredHints": 1, "hintUnreadFromHints": 0, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-11T15:59:46.418Z {"data": {"chatBadgeCount": 0, "chatCount": 3, "hintBadgeCount": 0, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ⚡ JIT: 2 neue Nachricht(en) empfangen in Chat 8bn8qa8Pyy6yYmmRhsyC!
 LOG  📡 PHASE3: Nachrichten-Update für Chat 8bn8qa8Pyy6yYmmRhsyC: 2
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📡 0 ungelesene Notifications (von 8 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-11T15:59:46.562Z {"data": {"count": 0, "total": 8, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-11T15:59:46.562Z {"data": {"count": 0, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-11T15:59:46.562Z {"data": {"storedCount": 0}, "type": "notifications"}
 LOG  ✅ PHASE3: 0 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 3, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-11T15:59:46.574Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 2, "filteredHints": 1, "hintUnreadFromHints": 0, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 0, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-11T15:59:46.575Z {"data": {"chatBadgeCount": 0, "chatCount": 3, "hintBadgeCount": 0, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"createdAt": "2025-11-11T15:36:23.757Z", "entryType": "chat", "id": "8bn8qa8Pyy6yYmmRhsyC", "lastMessage": "hallo", "lastMessageSenderId": "user-1762182785600", "lastMessageTime": "16:59", "participantNames": ["diggi", "mucki"], "participants": ["user-1762182855175", "user-1762182785600"], "readBy": ["user-1762182855175", "user-1762182785600"], "tradeRequestId": "YoDHHtfPijI6KvxYCOrW", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0, "updatedAt": "2025-11-11T15:59:27.881Z", "updatedAtDate": 2025-11-11T15:59:27.881Z}}
 LOG  🔄 App.js: Anzahl Messages: 2
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ Deleted 1 notifications for chat (chatId: 8bn8qa8Pyy6yYmmRhsyC)
 LOG  ✅ 1 Notifications für Chat gelöscht
 LOG  ✅ PHASE3: 1 Notifications gelöscht für Chat 8bn8qa8Pyy6yYmmRhsyC
 LOG  ✅ Deleted 1 notifications for chat (chatId: 8bn8qa8Pyy6yYmmRhsyC)
 LOG  ✅ 1 Notifications für Chat gelöscht
 LOG  ✅ PHASE3: 1 Notifications gelöscht für Chat 8bn8qa8Pyy6yYmmRhsyC
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 App.js: handleNavigate aufgerufen - screen: "mein-weinregal", params: null
 LOG  🔄 App.js: Aktueller Screen: "chat-room", wird geändert zu: "mein-weinregal"
 LOG  🔌 PHASE3: Entferne Nachrichten-Subscription für Chat 8bn8qa8Pyy6yYmmRhsyC
 LOG  🔄 App.js: setCurrentScreen aufgerufen: mein-weinregal
 LOG  🔄 App.js: setRoute aufgerufen mit params: null
 LOG  ✅ App.js: State aktualisiert - currentScreen wird: mein-weinregal
 LOG  🔄 App.js: Render-Zyklus - currentScreen: mein-weinregal
 LOG  🔄 App.js: route?.params: null
 LOG  🔍 MeinWeinregalScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  ✅ MeinWeinregalScreen: User-ID gesetzt: user-1762182855175 für diggi@posteo.de
 LOG  🔍 MeinWeinregalScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 MeinWeinregalScreen: Loading wines for user: user-1762182855175
 LOG  🔄 Getting wines for owner: user-1762182855175
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Found wines: 4
 LOG  ✅ MeinWeinregalScreen: Loaded 4 wines
 LOG  🔄 Getting all wines for owner (including traded): user-1762182855175
 LOG  🔍 MeinWeinregalScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Found all wines (for counting): 9
 LOG  🔍 MeinWeinregalScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}

*** Meine Beobachtung: *** Es werden die Messages erzeugt und in einem Chat angezeigt, aber die Notification fehlt in der Glocke.

---

## Phase 2.1 – Fehlersuche: Chat-Notifications fehlen (11.11.25, 17:00 Uhr)

### Problembeschreibung
**Symptom:** Wenn ein Chat geöffnet ist und der andere User eine Nachricht sendet, wird die Nachricht im Chat angezeigt, aber es erscheint keine Notification in der Glocke.

**Beobachtung aus Scenario 2:**
- Chat wird geöffnet → Notifications werden gelöscht (Zeile 802, 849: `🔄 Deleting notifications for chat`)
- Neue Nachricht wird empfangen (Zeile 907: `⚡ JIT: 2 neue Nachricht(en) empfangen`)
- Firestore zeigt 0 ungelesene Notifications (Zeile 922-926)
- Badge bleibt bei 0 (Zeile 786-788, 817-819, etc.)

### Root Cause Analyse

**Aktueller Flow:**
1. **Chat öffnen:** `ChatRoomScreen` wird geladen → `markChatAsRead` wird aufgerufen → `deleteNotificationsForChat` löscht alle Notifications für diesen Chat
2. **Nachricht senden:** `addMessage` wird aufgerufen → `fsAddChatMessage` speichert Nachricht → Notification wird für den **Empfänger** erstellt (nur wenn der Sender `addMessage` aufruft)
3. **Nachricht empfangen (Subscription):** `fsSubscribeChatMessages` triggert Callback → Nachricht wird im UI angezeigt → **KEINE Notification wird erstellt**

**Das Problem:**
- Notification-Erstellung passiert nur in `addMessage` (Zeile 1506 in `App.js`)
- Wenn User A den Chat geöffnet hat und User B eine Nachricht sendet:
  - User B ruft `addMessage` auf → Notification wird für User A erstellt
  - ABER: User A hat den Chat geöffnet → Notifications wurden bereits gelöscht
  - Wenn User A den Chat verlässt und User B eine weitere Nachricht sendet:
    - User B ruft `addMessage` auf → Notification wird erstellt
    - User A empfängt Nachricht über Subscription → **KEINE Notification wird erstellt**, weil die Erstellung nur in `addMessage` passiert

**Kritischer Punkt:**
Die Subscription-Callback für Chat-Nachrichten (Zeile 1303-1319, 1668-1696 in `App.js`) aktualisiert nur den lokalen State, erstellt aber keine Notifications für neue Nachrichten, die über die Subscription eintreffen.

### Untersuchungsplan

**Schritt 1: Subscription-Callback analysieren**
- [ ] Prüfen, ob in `fsSubscribeChatMessages`-Callback neue Nachrichten erkannt werden
- [ ] Prüfen, ob `currentScreen === 'chat-room'` korrekt erkannt wird
- [ ] Prüfen, ob `route?.params?.chat?.id === chatId` korrekt ist

**Schritt 2: Notification-Erstellung in Subscription**
- [ ] In Subscription-Callback neue Nachrichten identifizieren (`change.type === 'added'`)
- [ ] Prüfen, ob Chat aktuell geöffnet ist
- [ ] Wenn Chat **nicht** geöffnet → Notification erstellen
- [ ] Wenn Chat geöffnet → keine Notification (User sieht Nachricht direkt)

**Schritt 3: Edge Cases**
- [ ] Was passiert, wenn User Chat öffnet, dann App minimiert?
- [ ] Was passiert bei mehreren neuen Nachrichten gleichzeitig?
- [ ] Was passiert, wenn Chat gelöscht wurde?

### Fix-Plan

**Lösung: Notification-Erstellung in Subscription-Callback**

1. **In `fsSubscribeChatMessages`-Callback (Zeile 1303, 1668):**
   - Neue Nachrichten identifizieren (bereits vorhanden: `newMessages` in `database-web.js` Zeile 1823-1833)
   - Prüfen, ob Chat aktuell geöffnet ist: `currentScreen === 'chat-room' && route?.params?.chat?.id === chatId`
   - Wenn Chat **nicht** geöffnet → Notification für jede neue Nachricht erstellen
   - Wenn Chat geöffnet → keine Notification (User sieht Nachricht direkt)

2. **Notification-Erstellung:**
   - Gleiche Logik wie in `addMessage` (Zeile 1410-1527)
   - Prüfen: Chat existiert, Teilnehmer vorhanden, nicht gelöscht, nicht Hinweis
   - Empfänger identifizieren (anderer Teilnehmer als Sender)
   - Notification mit `type: 'message'` erstellen

3. **Logging:**
   - `logNotificationEvent` für Subscription-basierte Notification-Erstellung
   - Unterscheidung: `chat/addMessage/notification-created` vs `chat/subscription/notification-created`

### Nächste Schritte
1. Code-Review: Subscription-Callback erweitern
2. Test: Chat öffnen, andere User sendet Nachricht, Chat verlassen, weitere Nachricht → Notification sollte erscheinen
3. Dokumentation: Fix in `NOTES_NOTIFICATIONS.md` dokumentieren

---

### Fix-Implementierung (11.11.25, 17:15 Uhr)

**Umsetzung:**
1. ✅ `subscribeChatMessages` erweitert (`database-web.js` Zeile 1849):
   - `newMessages` wird jetzt als dritter Parameter an Callback übergeben
   - Ermöglicht Identifikation neuer Nachrichten in Subscription-Callbacks

2. ✅ Wiederverwendbare Funktion `createNotificationsForNewMessages` erstellt (`App.js` Zeile 1350-1474):
   - Prüft, ob Chat aktuell geöffnet ist (`currentScreen === 'chat-room' && route?.params?.chat?.id === chatId`)
   - Wenn Chat **nicht** geöffnet → erstellt Notifications für neue Nachrichten
   - Wenn Chat geöffnet → keine Notifications (User sieht Nachricht direkt)
   - Gleiche Validierungslogik wie in `addMessage` (Chat existiert, nicht gelöscht, nicht Hinweis, etc.)
   - Erstellt Notification nur für den aktuellen User (Empfänger)

3. ✅ Beide Subscription-Callbacks aktualisiert (`App.js` Zeile 1303, 1796):
   - Erster Callback: ChatRoomScreen-Load (Zeile 1303)
   - Zweiter Callback: ChatRoomScreen-Refresh (Zeile 1796)
   - Beide rufen `createNotificationsForNewMessages` auf, wenn `newMessages.length > 0`

4. ✅ Logging hinzugefügt:
   - `chat/subscription/notification-created` für erfolgreiche Erstellung
   - `chat/subscription/notification-skipped` mit Grund (chat-is-open, chat-not-found, etc.)
   - `chat/subscription/notification-error` für Fehler

**Erwartetes Verhalten:**
- User A öffnet Chat → Notifications werden gelöscht
- User B sendet Nachricht → User A sieht Nachricht im geöffneten Chat, **keine** Notification
- User A verlässt Chat → User B sendet weitere Nachricht → User A erhält **Notification** in Glocke
- Badge wird korrekt aktualisiert durch `refreshNotificationBadges`

**Nächster Schritt:**
- Test durchführen: Szenario 2 erneut durchspielen und Logs prüfen
- Verifizieren, dass Notifications erscheinen, wenn Chat nicht geöffnet ist

### Szenario 2: Message versenden und empfangen und auf Notification überprüfen
 LOG  🔄 Creating chat in Firestore
 LOG  ⚡ JIT: 1 neue Chat(s)/Hinweis(e) empfangen! [{"entryType": "chat", "hintType": undefined, "id": "FBob72V36ZvNoDMFAFOv"}]
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 2
 LOG  ✅ PHASE3: 2 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: mein-weinregal
 LOG  🔄 App.js: route?.params: {"tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "viewUserId": "user-1762182855175"}
 LOG  🔍 MeinWeinregalScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 1}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:08.800Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 1}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 1}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:08.801Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: mein-weinregal
 LOG  🔄 App.js: route?.params: {"tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "viewUserId": "user-1762182855175"}
 LOG  ✅ Chat created in Firestore: FBob72V36ZvNoDMFAFOv
 LOG  ✅ PHASE3: Neuer Chat erstellt in Firestore nach Akzeptierung: FBob72V36ZvNoDMFAFOv
 LOG  🔄 JIT: Creating notification in Firestore for user: user-1762182855175 type: chat
 LOG  [Notification][firestore/createNotification/start] 2025-11-12T08:22:08.832Z {"data": {"chatId": "FBob72V36ZvNoDMFAFOv", "hintType": undefined, "requestId": "3Z9kjqfOzKQNalrxffKl", "userId": "user-1762182855175"}, "type": "chat"}
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 2
 LOG  ✅ PHASE3: 2 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: mein-weinregal
 LOG  🔄 App.js: route?.params: {"tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "viewUserId": "user-1762182855175"}
 LOG  🔍 MeinWeinregalScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 1}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:08.881Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 1}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 1}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:08.881Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: mein-weinregal
 LOG  🔄 App.js: route?.params: {"tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "viewUserId": "user-1762182855175"}
 LOG  ⚡ JIT: Notification created in Firestore: LQWYSYtBHilm68ZcSsLX type: chat
 LOG  [Notification][firestore/createNotification/success] 2025-11-12T08:22:08.900Z {"data": {"notificationId": "LQWYSYtBHilm68ZcSsLX", "userId": "user-1762182855175"}, "type": "chat"}
 LOG  🔄 JIT: Creating notification in Firestore for user: user-1762182785600 type: chat
 LOG  [Notification][firestore/createNotification/start] 2025-11-12T08:22:08.900Z {"data": {"chatId": "FBob72V36ZvNoDMFAFOv", "hintType": undefined, "requestId": "3Z9kjqfOzKQNalrxffKl", "userId": "user-1762182785600"}, "type": "chat"}
 LOG  ⚡ JIT: 1 neue Notification(s) empfangen! [{"id": "8W3qsZe0J62Yf3nOZzyL", "title": "Neuer Chat erstellt", "type": "chat"}]
 LOG  [Notification][firestore/subscribeNotifications/new] 2025-11-12T08:22:08.904Z {"data": {"count": 1, "notifications": [[Object]], "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  📡 2 ungelesene Notifications (von 10 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-12T08:22:08.905Z {"data": {"count": 2, "total": 10, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-12T08:22:08.905Z {"data": {"count": 2, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-12T08:22:08.905Z {"data": {"storedCount": 2}, "type": "notifications"}
 LOG  ✅ PHASE3: 2 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: mein-weinregal
 LOG  🔄 App.js: route?.params: {"tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "viewUserId": "user-1762182855175"}
 LOG  🔍 MeinWeinregalScreen: Admin-Status: Standard-User
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 2}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:08.925Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 2}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:08.925Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: mein-weinregal
 LOG  🔄 App.js: route?.params: {"tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "viewUserId": "user-1762182855175"}
 LOG  ⚡ JIT: Notification created in Firestore: 8W3qsZe0J62Yf3nOZzyL type: chat
 LOG  [Notification][firestore/createNotification/success] 2025-11-12T08:22:08.988Z {"data": {"notificationId": "8W3qsZe0J62Yf3nOZzyL", "userId": "user-1762182785600"}, "type": "chat"}
 LOG  ✅ PHASE3: Chat-Notifications erstellt in Firestore für beide User
 LOG  [Notification][trade/accept/notifications] 2025-11-12T08:22:08.989Z {"data": {"chatId": "FBob72V36ZvNoDMFAFOv", "requestId": "3Z9kjqfOzKQNalrxffKl", "users": ["user-1762182855175", "user-1762182785600"]}, "type": "chat"}
 LOG  🔄 App.js: handleNavigate aufgerufen - screen: "chat-room", params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Aktueller Screen: "mein-weinregal", wird geändert zu: "chat-room"
 LOG  🔄 App.js: setCurrentScreen aufgerufen: chat-room
 LOG  🔄 App.js: setRoute aufgerufen mit params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Chat in params: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  ✅ App.js: State aktualisiert - currentScreen wird: chat-room
 LOG  ✅ PHASE3: Trade-Request akzeptiert - Chat erstellt: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? false
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 ChatRoomScreen: Lade Nachrichten für Chat FBob72V36ZvNoDMFAFOv...
 LOG  🔄 Marking chat as read for user: user-1762182785600
 LOG  ✅ Chat automatisch als gelesen markiert: FBob72V36ZvNoDMFAFOv
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📡 2 ungelesene Notifications (von 10 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-12T08:22:09.033Z {"data": {"count": 2, "total": 10, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-12T08:22:09.033Z {"data": {"count": 2, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-12T08:22:09.033Z {"data": {"storedCount": 2}, "type": "notifications"}
 LOG  ✅ PHASE3: 2 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? false
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 2}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:09.043Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 2}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:09.043Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? false
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  🔄 Getting messages for chat: FBob72V36ZvNoDMFAFOv
 LOG  🔄 Getting messages for chat: FBob72V36ZvNoDMFAFOv
 LOG  🔄 Getting messages for chat: FBob72V36ZvNoDMFAFOv
 LOG  🔄 Getting messages for chat: FBob72V36ZvNoDMFAFOv
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 2
 LOG  ✅ PHASE3: 2 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? false
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 2}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:09.077Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 2}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:09.077Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? false
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ Chat marked as read: FBob72V36ZvNoDMFAFOv
 LOG  ✅ PHASE3: Chat als gelesen markiert in Firestore: FBob72V36ZvNoDMFAFOv
 LOG  🔧 Lokaler State aktualisiert: 2 -> 0 Notifications (chatId: FBob72V36ZvNoDMFAFOv)
 LOG  🔄 Deleting notifications for chat: FBob72V36ZvNoDMFAFOv tradeRequestId: 3Z9kjqfOzKQNalrxffKl
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? false
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:09.167Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:09.168Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? false
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ Found messages: 0
 LOG  ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat FBob72V36ZvNoDMFAFOv
 LOG  📡 PHASE3: Richte Nachrichten-Subscription für Chat FBob72V36ZvNoDMFAFOv ein
 LOG  🔄 Subscribing to messages for chat: FBob72V36ZvNoDMFAFOv
 LOG  ✅ Found messages: 0
 LOG  ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat FBob72V36ZvNoDMFAFOv
 LOG  ✅ Found messages: 0
 LOG  ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat FBob72V36ZvNoDMFAFOv
 LOG  ✅ Found messages: 0
 LOG  ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat FBob72V36ZvNoDMFAFOv
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 2
 LOG  ✅ PHASE3: 2 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 Getting messages for chat: FBob72V36ZvNoDMFAFOv
 LOG  🔄 Getting messages for chat: FBob72V36ZvNoDMFAFOv
 LOG  🔄 Getting messages for chat: FBob72V36ZvNoDMFAFOv
 LOG  🔄 Getting messages for chat: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:09.180Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:09.180Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  📡 PHASE3: Nachrichten-Update für Chat FBob72V36ZvNoDMFAFOv: 0
 LOG  ✅ Found messages: 0
 LOG  ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat FBob72V36ZvNoDMFAFOv
 LOG  ✅ Found messages: 0
 LOG  ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat FBob72V36ZvNoDMFAFOv
 LOG  ✅ Found messages: 0
 LOG  ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat FBob72V36ZvNoDMFAFOv
 LOG  ✅ Found messages: 0
 LOG  ℹ️ PHASE3: Keine Nachrichten in Firestore für Chat FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📡 1 ungelesene Notifications (von 9 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-12T08:22:09.352Z {"data": {"count": 1, "total": 9, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-12T08:22:09.353Z {"data": {"count": 1, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notification-ignored] 2025-11-12T08:22:09.353Z {"data": {"notificationId": "jKUGMBJCvfAR78SLmPL1", "reason": "pending-deletion"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-12T08:22:09.353Z {"data": {"storedCount": 0}, "type": "notifications"}
 LOG  ✅ PHASE3: 1 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  📡 0 ungelesene Notifications (von 8 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-12T08:22:09.355Z {"data": {"count": 0, "total": 8, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-12T08:22:09.355Z {"data": {"count": 0, "userId": "user-1762182785600"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-12T08:22:09.355Z {"data": {"storedCount": 0}, "type": "notifications"}
 LOG  ✅ PHASE3: 0 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:09.369Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:09.369Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 0
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ Deleted 2 notifications for chat (chatId: FBob72V36ZvNoDMFAFOv)
 LOG  ✅ 2 Notifications für Chat gelöscht
 LOG  ✅ PHASE3: 2 Notifications gelöscht für Chat FBob72V36ZvNoDMFAFOv
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📤 Nachricht gesendet: {"id": "msg1762935779149", "reactions": {}, "senderId": "user-1762182785600", "senderName": "Mucki Maus", "status": "sent", "text": "moin", "timestamp": "09:22"}
 LOG  📤 Chat-Teilnehmer: ["user-1762182785600", "user-1762182855175"]
 LOG  📤 Aktueller User: user-1762182785600
 LOG  📤 Chat-ID: FBob72V36ZvNoDMFAFOv
 LOG  [Notification][chat/addMessage/start] 2025-11-12T08:22:59.156Z {"data": {"chatId": "FBob72V36ZvNoDMFAFOv", "messageId": "msg1762935779149"}, "type": "message"}
 LOG  🔄 PHASE3: Füge Nachricht hinzu... {"chatId": "FBob72V36ZvNoDMFAFOv", "messageId": "msg1762935779149"}
 LOG  🔄 Adding message to chat: FBob72V36ZvNoDMFAFOv
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ⚡ JIT: 1 neue Nachricht(en) empfangen in Chat FBob72V36ZvNoDMFAFOv!
 LOG  📡 PHASE3: Nachrichten-Update für Chat FBob72V36ZvNoDMFAFOv: 1
 LOG  ⚠️ PHASE3: Chat nicht gefunden, keine Notifications erstellt: FBob72V36ZvNoDMFAFOv
 LOG  [Notification][chat/subscription/notification-skipped] 2025-11-12T08:22:59.182Z {"data": {"chatId": "FBob72V36ZvNoDMFAFOv", "newMessagesCount": 1, "reason": "chat-not-found"}, "type": "message"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 1
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 Updating chat: FBob72V36ZvNoDMFAFOv
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 2
 LOG  ✅ PHASE3: 2 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 1
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:59.272Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:59.273Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 1
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  📡 PHASE3: Nachrichten-Update für Chat FBob72V36ZvNoDMFAFOv: 1
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 1
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Chat updated: FBob72V36ZvNoDMFAFOv
 LOG  ✅ Message added to chat: geeVET8fEz6iQPl0sXTV
 LOG  ✅ PHASE3: Nachricht in Firestore gespeichert
 LOG  [Notification][chat/addMessage/saved] 2025-11-12T08:22:59.316Z {"data": {"chatId": "FBob72V36ZvNoDMFAFOv", "messageId": "msg1762935779149"}, "type": "message"}
 LOG  🔍 PHASE3: Suche Chat für Notification: {"chatGefunden": true, "chatId": "FBob72V36ZvNoDMFAFOv", "currentUserId": "user-1762182785600", "participants": ["user-1762182785600", "user-1762182855175"], "senderId": "user-1762182785600"}
 LOG  🔍 PHASE3: Empfänger gefunden: {"participants": ["user-1762182785600", "user-1762182855175"], "senderId": "user-1762182785600", "toUserId": "user-1762182855175"}
 LOG  🔄 PHASE3: Erstelle Notification für neue Nachricht: {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationData": {"chatId": "FBob72V36ZvNoDMFAFOv", "fromUserId": "user-1762182785600", "message": "moin", "priority": "medium", "senderId": "user-1762182785600", "senderName": "Mucki Maus", "title": "Neue Nachricht von Mucki Maus", "toUserId": "user-1762182855175", "type": "message"}, "toUserId": "user-1762182855175", "type": "message"}
 LOG  🔄 JIT: Creating notification in Firestore for user: user-1762182855175 type: message
 LOG  [Notification][firestore/createNotification/start] 2025-11-12T08:22:59.316Z {"data": {"chatId": "FBob72V36ZvNoDMFAFOv", "hintType": undefined, "requestId": undefined, "userId": "user-1762182855175"}, "type": "message"}
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 2
 LOG  ✅ PHASE3: 2 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 1
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:22:59.346Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:22:59.347Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 0}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-room
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ App.js: Bedingung currentScreen === "chat-room" erfüllt!
 LOG  🔄 App.js: Rendering ChatRoomScreen - chatId: FBob72V36ZvNoDMFAFOv
 LOG  🔄 App.js: Chat vorhanden? true
 LOG  🔄 App.js: Chat-Details: {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "type": "trade"}
 LOG  🔄 App.js: Messages vorhanden? true
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Anzahl Messages: 1
 LOG  ✅ App.js: Rendere ChatRoomScreen jetzt...
 LOG  ⚡ JIT: Notification created in Firestore: 44DD5QwmEOtQzT2P6Ihf type: message
 LOG  [Notification][firestore/createNotification/success] 2025-11-12T08:22:59.389Z {"data": {"notificationId": "44DD5QwmEOtQzT2P6Ihf", "userId": "user-1762182855175"}, "type": "message"}
 LOG  ⚡ JIT: Notification für neue Nachricht erstellt: {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationId": "44DD5QwmEOtQzT2P6Ihf", "toUserId": "user-1762182855175", "type": "message"}
 LOG  [Notification][chat/addMessage/notification-created] 2025-11-12T08:22:59.389Z {"data": {"chatId": "FBob72V36ZvNoDMFAFOv", "messageId": "msg1762935779149", "notificationId": "44DD5QwmEOtQzT2P6Ihf", "toUserId": "user-1762182855175"}, "type": "message"}
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ User logged out - Admin-Status und User-Info zurückgesetzt
 LOG  🔄 App.js: Render-Zyklus - currentScreen: welcome
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔌 PHASE3: Trade-Request-Subscriptions unsubscribed
 LOG  🔌 PHASE3: Unsubscribing from Firestore
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": false, "notificationCount": 0}
 LOG  [Notification][badge-reset] 2025-11-12T08:23:06.331Z {"data": {"reason": "no-user-or-logged-out"}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: welcome
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: login
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ Login successful: diggi@posteo.de
 LOG  ℹ️ Standard-User erkannt: diggi@posteo.de ( diggi )
 LOG  ✅ Test login successful - using existing test user
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 PHASE3: Setting up Trade-Request-Subscriptions for user: user-1762182855175
 LOG  🔄 Getting notifications for user: user-1762182855175
 LOG  [Notification][firestore/getNotifications/start] 2025-11-12T08:23:14.377Z {"data": {"userId": "user-1762182855175"}, "type": "notifications"}
 LOG  🔄 Getting chats for user: user-1762182855175
 LOG  🔄 PHASE3: Setting up Firestore subscriptions for user: user-1762182855175
 LOG  🔄 Subscribing to chats/hints for user: user-1762182855175
 LOG  🔄 Getting chats for user: user-1762182855175
 LOG  🔄 Subscribing to notifications for user: user-1762182855175
 LOG  [Notification][firestore/subscribeNotifications/start] 2025-11-12T08:23:14.378Z {"data": {"userId": "user-1762182855175"}, "type": "notifications"}
 LOG  🔄 Getting notifications for user: user-1762182855175
 LOG  [Notification][firestore/getNotifications/start] 2025-11-12T08:23:14.378Z {"data": {"userId": "user-1762182855175"}, "type": "notifications"}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 0}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:23:14.379Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 0}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 0}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:23:14.379Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 0}, "type": "badges"}
 LOG  [Notification][badge-update] 2025-11-12T08:23:14.386Z {"data": {"badge": "info", "from": 0, "notificationsConsidered": 0, "to": 1}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📊 getUserWineCounts für user-1762182855175: 3 im Regal, 3 veröffentlicht
 LOG  ✅ Found 4 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/getNotifications/success] 2025-11-12T08:23:14.527Z {"data": {"count": 4, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  ✅ PHASE3: Notifications aus Firestore geladen: 4
 LOG  ⚡ JIT: 4 neue Notification(s) empfangen! [{"id": "44DD5QwmEOtQzT2P6Ihf", "title": "Neue Nachricht von Mucki Maus", "type": "message"}, {"id": "LQWYSYtBHilm68ZcSsLX", "title": "Neuer Chat erstellt", "type": "chat"}, {"id": "LXIHoQlQWBI06aySFSa2", "title": "Tauschanfrage angenommen", "type": "trade-info"}, {"id": "xwedJ3UHLWRWKXXYyhbO", "title": "Tausch involviert", "type": "trade-info"}]
 LOG  [Notification][firestore/subscribeNotifications/new] 2025-11-12T08:23:14.527Z {"data": {"count": 4, "notifications": [[Object], [Object], [Object], [Object]], "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  📡 4 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-12T08:23:14.528Z {"data": {"count": 4, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-12T08:23:14.528Z {"data": {"count": 4, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-12T08:23:14.528Z {"data": {"storedCount": 4}, "type": "notifications"}
 LOG  ✅ PHASE3: 4 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  ✅ Found 4 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/getNotifications/success] 2025-11-12T08:23:14.529Z {"data": {"count": 4, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-initial-load] 2025-11-12T08:23:14.529Z {"data": {"count": 4, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  ✅ PHASE3: Initial 4 notifications loaded and synced to AsyncStorage
 LOG  ✅ Found chats/hints: 2 (aus 5 gesamten Einträgen)
 LOG  ⚡ JIT: 5 neue Chat(s)/Hinweis(e) empfangen! [{"entryType": "chat", "hintType": undefined, "id": "8bn8qa8Pyy6yYmmRhsyC"}, {"entryType": "chat", "hintType": undefined, "id": "FBob72V36ZvNoDMFAFOv"}, {"entryType": "chat", "hintType": undefined, "id": "ZD4MmMBSROLsv4CXm7G4"}, {"entryType": "hint", "hintType": "trade-involved", "id": "hdK0QiMEiArtPXh0HoiK"}, {"entryType": "hint", "hintType": "trade-decision", "id": "pU2oHwhKVMOfBCoyV5T5"}]
 LOG  📡 PHASE3: Chat/Hint update received from Firestore: 4
 LOG  ✅ PHASE3: 4 Chats in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  ✅ Found chats/hints: 2 (aus 5 gesamten Einträgen)
 LOG  ✅ PHASE3: Initial 2 chats loaded and synced to AsyncStorage
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 4}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:23:14.537Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 4}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 4}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:23:14.538Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 4}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ✅ PHASE3: 2 Chats aus Firestore geladen und mit AsyncStorage synchronisiert
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 4}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:23:16.562Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 4}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 4}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:23:16.563Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 4}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: home
 LOG  🔄 App.js: route?.params: {"chat": {"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "lastMessage": "Tauschvorschlag: Riesling", "lastMessageTime": "09:22", "participantNames": ["mucki", "diggi"], "participants": ["user-1762182785600", "user-1762182855175"], "tradeRequestId": "3Z9kjqfOzKQNalrxffKl", "tradeStatus": "accepted", "type": "trade", "unreadCount": 0}}
 LOG  ℹ️ Bild-Migration bereits durchgeführt für User: user-1762182855175
 LOG  [BottomNavigation] InfoBox measure on press {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  🔄 App.js: handleNavigate aufgerufen - screen: "notifications", params: null
 LOG  🔄 App.js: Aktueller Screen: "home", wird geändert zu: "notifications"
 LOG  🔄 App.js: "notifications" erkannt, navigiere zu "chat-list"
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "participants": 2, "type": "trade"}]
 LOG  [NewsPopup] anchorLayout null
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.25, "baseBottomOffset": 37.5, "horizontalOffset": 146.25, "targetTranslateY": -49.5}
 LOG  🔄 Getting trade request: 3Z9kjqfOzKQNalrxffKl
 LOG  🔄 Markiere 2 Chat-Notifications als gelesen...
 LOG  🔄 Marking notification as read: 44DD5QwmEOtQzT2P6Ihf
 LOG  🔄 Marking notification as read: LQWYSYtBHilm68ZcSsLX
 LOG  [BottomNavigation] InfoBox layout measured {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  📡 3 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-12T08:23:21.642Z {"data": {"count": 3, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-12T08:23:21.642Z {"data": {"count": 3, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-12T08:23:21.642Z {"data": {"storedCount": 3}, "type": "notifications"}
 LOG  ✅ PHASE3: 3 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  📡 2 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-12T08:23:21.644Z {"data": {"count": 2, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-12T08:23:21.644Z {"data": {"count": 2, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-12T08:23:21.644Z {"data": {"storedCount": 2}, "type": "notifications"}
 LOG  ✅ PHASE3: 2 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "participants": 2, "type": "trade"}]
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Chat-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 2}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:23:21.656Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 2}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:23:21.656Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "participants": 2, "type": "trade"}]
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Notification marked as read: 44DD5QwmEOtQzT2P6Ihf
 LOG  📡 2 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-12T08:23:21.724Z {"data": {"count": 2, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-12T08:23:21.725Z {"data": {"count": 2, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-12T08:23:21.725Z {"data": {"storedCount": 2}, "type": "notifications"}
 LOG  ✅ PHASE3: 2 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "participants": 2, "type": "trade"}]
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Chat-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 2}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:23:21.732Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 2}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:23:21.733Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ Notification marked as read: LQWYSYtBHilm68ZcSsLX
 LOG  ✅ 2 Chat-Notifications als gelesen markiert
 LOG  📡 2 ungelesene Notifications (von 12 insgesamt)
 LOG  [Notification][firestore/subscribeNotifications/snapshot] 2025-11-12T08:23:21.758Z {"data": {"count": 2, "total": 12, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-update] 2025-11-12T08:23:21.758Z {"data": {"count": 2, "userId": "user-1762182855175"}, "type": "notifications"}
 LOG  [Notification][subscription/notifications-applied] 2025-11-12T08:23:21.758Z {"data": {"storedCount": 2}, "type": "notifications"}
 LOG  ✅ PHASE3: 2 Notifications in AsyncStorage gespeichert (Firestore ist Quelle der Wahrheit)
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "participants": 2, "type": "trade"}]
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Chat-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 2}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:23:21.767Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 2}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:23:21.767Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "participants": 2, "type": "trade"}]
 LOG  🔄 Rendering Chat 1/1: FBob72V36ZvNoDMFAFOv trade
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "participants": 2, "type": "trade"}]
 LOG  🔄 Rendering Chat 1/1: FBob72V36ZvNoDMFAFOv trade
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function
 LOG  ✅ ChatListScreen V2.0 geladen - Modern Grid Design
 LOG  📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise): 1
 LOG  📊 ChatListScreen V2.0 - Final allChats: 1
 LOG  📊 ChatListScreen V2.0 - Chat Details: [{"entryType": "chat", "id": "FBob72V36ZvNoDMFAFOv", "participants": 2, "type": "trade"}]
 LOG  🔄 Rendering Chat 1/1: FBob72V36ZvNoDMFAFOv trade
 LOG  [NewsPopup] anchorLayout {"height": 58.66668701171875, "width": 97.33334350585938, "x": 292.6666564941406, "y": 769}
 LOG  [NewsPopup] offsets {"anchorCenterX": 341.3333282470703, "baseBottomOffset": 45.666656494140625, "horizontalOffset": 146.3333282470703, "targetTranslateY": -41.333343505859375}
 LOG  ✅ Keine ungelesenen Chat-Notifications gefunden
 LOG  🔄 useEffect -> refreshNotificationBadges {"chatCount": 2, "isLoggedIn": true, "notificationCount": 2}
 LOG  [Notification][badge-pre-calculation] 2025-11-12T08:23:23.688Z {"data": {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "filteredChats": 1, "filteredHints": 1, "hintUnreadFromHints": 1, "totalNotifications": 2}, "type": "badges"}
 LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "chatNotificationEntries": 0, "chatUnreadFromChats": 0, "hintBadgeCount": 1, "notificationCount": 2}
 LOG  [Notification][badge-refresh/done] 2025-11-12T08:23:23.688Z {"data": {"chatBadgeCount": 0, "chatCount": 2, "hintBadgeCount": 1, "notificationCount": 2}, "type": "badges"}
 LOG  🔄 App.js: Render-Zyklus - currentScreen: chat-list
 LOG  🔄 App.js: route?.params: null
 LOG  🔄 App.js: Rendering ChatListScreen - currentScreen: chat-list
 LOG  🔄 App.js: Gesamt Einträge (Chats + Hinweise): 2 (Chats: 1, Hinweise: 1)
 LOG  🔄 App.js: markAllChatsAsRead verfügbar? function

**Beobachtung:** Chat wird erstellt, aber die Notification wird nicht geliefert.

**Problem identifiziert (Zeile 1421-1422):**
```
LOG  ⚠️ PHASE3: Chat nicht gefunden, keine Notifications erstellt: FBob72V36ZvNoDMFAFOv
LOG  [Notification][chat/subscription/notification-skipped] {"reason": "chat-not-found"}
```

**Root Cause:**
- Race Condition: Die Subscription für Chat-Nachrichten wird getriggert, bevor der `chats`-State aktualisiert wurde
- `createNotificationsForNewMessages` sucht in `chats.find(c => c.id === chatId)`, aber der Chat ist noch nicht im State
- Der Chat existiert in Firestore (Zeile 1177: `Chat vorhanden? true`), wird aber nicht gefunden

**Fix implementiert (11.11.25, 17:30 Uhr):**
- `getChat` importiert (`App.js` Zeile 68)
- `createNotificationsForNewMessages` erweitert: Wenn Chat nicht im State gefunden wird, wird er direkt aus Firestore geladen
- Fallback-Logik: State → Firestore → Fehlerbehandlung
- Logging erweitert: Unterscheidung zwischen "nicht im State" und "nicht in Firestore"

**Erwartetes Verhalten nach Fix:**
- Chat wird aus Firestore geladen, wenn er nicht im State ist
- Notification wird korrekt erstellt
- Log zeigt: `✅ PHASE3: Chat aus Firestore geladen: FBob72V36ZvNoDMFAFOv`

---

## Phase 2.2 – Test: Chat-Notification-Fix (11.11.25, 17:35 Uhr)

### Test-Szenario 1: Race Condition Fix
**Ziel:** Verifizieren, dass Notifications erstellt werden, auch wenn Chat noch nicht im State ist.

**Schritte:**
1. User A: Trade-Request akzeptieren → Chat wird erstellt
2. User A: Chat öffnen → Notifications werden gelöscht
3. User A: Nachricht senden ("moin")
4. **WICHTIG:** User A verlässt Chat sofort (zurück zu Home/Chat-List)
5. User B: Login (anderer User)
6. User B: Nachricht senden im gleichen Chat
7. **Prüfen:** User A sollte Notification in Glocke sehen

**Erwartete Logs:**
- `⚠️ PHASE3: Chat nicht im State gefunden, lade aus Firestore: [chatId]`
- `✅ PHASE3: Chat aus Firestore geladen: [chatId]`
- `🔄 PHASE3: Erstelle Notification für neue Nachricht (Subscription):`
- `⚡ JIT: Notification für neue Nachricht erstellt (Subscription):`
- `[Notification][chat/subscription/notification-created]`

**NICHT mehr erwartet:**
- `⚠️ PHASE3: Chat nicht gefunden, keine Notifications erstellt` (mit `reason: "chat-not-found"`)

### Test-Szenario 2: Chat geöffnet
**Ziel:** Verifizieren, dass keine Notifications erstellt werden, wenn Chat geöffnet ist.

**Schritte:**
1. User A: Chat öffnen
2. User B: Nachricht senden
3. **Prüfen:** User A sieht Nachricht direkt, **keine** Notification

**Erwartete Logs:**
- `ℹ️ PHASE3: Chat [chatId] ist aktuell geöffnet, keine Notifications erstellt`
- `[Notification][chat/subscription/notification-skipped]` mit `reason: "chat-is-open"`

### Test-Szenario 3: Chat geschlossen
**Ziel:** Verifizieren, dass Notifications erstellt werden, wenn Chat geschlossen ist.

**Schritte:**
1. User A: Chat öffnen → wieder verlassen
2. User B: Nachricht senden
3. **Prüfen:** User A sollte Notification in Glocke sehen

**Erwartete Logs:**
- `[Notification][chat/subscription/notification-created]`
- Badge wird aktualisiert

### Test-Checkliste
- [ ] Szenario 1: Race Condition Fix funktioniert
- [ ] Szenario 2: Keine Notification wenn Chat geöffnet
- [ ] Szenario 3: Notification wenn Chat geschlossen
- [ ] Badge wird korrekt aktualisiert
- [ ] Logs zeigen korrekte Events

### Test-Ergebnisse

#### Test 1: Chat geöffnet - Notification sollte NICHT erstellt werden (12.11.25, 08:33 Uhr)

**Szenario:** User A öffnet Chat `FBob72V36ZvNoDMFAFOv`, User B sendet Nachricht

**Relevante Logs:**
```
LOG  ✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions
LOG  📡 PHASE3: Richte Nachrichten-Subscription für Chat FBob72V36ZvNoDMFAFOv ein
LOG  ⚡ JIT: 2 neue Nachricht(en) empfangen in Chat FBob72V36ZvNoDMFAFOv!
LOG  📡 PHASE3: Nachrichten-Update für Chat FBob72V36ZvNoDMFAFOv: 2
LOG  🔄 PHASE3: Erstelle Notification für neue Nachricht (Subscription): {"chatId": "FBob72V36ZvNoDMFAFOv", "messageId": "FnHbhe0uSbWviPzxLSXj", "toUserId": "user-1762182855175"}
LOG  [Notification][firestore/createNotification/start]
LOG  ⚡ JIT: Notification für neue Nachricht erstellt (Subscription): {"notificationId": "V7i2IgkJfzZW4ZTwBnLI", ...}
LOG  [Notification][chat/subscription/notification-created]
```

**Beobachtung:** ❌ **PROBLEM: Notification wird erstellt, obwohl Chat geöffnet ist!**

**Erwartetes Verhalten:**
- `ℹ️ PHASE3: Chat FBob72V36ZvNoDMFAFOv ist aktuell geöffnet, keine Notifications erstellt`
- `[Notification][chat/subscription/notification-skipped]` mit `reason: "chat-is-open"`

**Tatsächliches Verhalten:**
- Keine Skip-Log-Meldung
- Notification wird erstellt (`V7i2IgkJfzZW4ZTwBnLI`)
- Badge wird aktualisiert (falsch, sollte 0 bleiben)

**Root Cause:** Die Prüfung `currentScreen === 'chat-room' && route?.params?.chat?.id === chatId` in `createNotificationsForNewMessages` (Zeile 1372) schlägt fehl. Mögliche Ursachen:
1. `route?.params?.chat?.id` stimmt nicht mit `chatId` überein
2. Timing-Problem: Subscription-Callback wird getriggert, bevor `currentScreen` aktualisiert ist
3. `route` ist nicht korrekt gesetzt zum Zeitpunkt der Prüfung

**Nächster Schritt:** Debug-Logging hinzufügen, um `currentScreen`, `route?.params?.chat?.id` und `chatId` zum Zeitpunkt der Prüfung zu loggen.

**Fix-Implementierung (12.11.25, 08:40 Uhr):**
- ✅ Debug-Logging hinzugefügt in `createNotificationsForNewMessages` (Zeile 1376-1382)
- Loggt `currentScreen`, `routeChatId`, `chatId`, `isChatOpen` und `routeParams` zum Zeitpunkt der Prüfung
- Ermöglicht Diagnose, warum die Prüfung fehlschlägt

**Nächster Test:** Szenario erneut durchspielen und Debug-Logs prüfen.

---

#### Test 2: Nachricht senden - Notification sollte erstellt werden (12.11.25, 08:39 Uhr)

**Szenario:** User A (mucki) sendet Nachricht in altem Chat, User B (diggi) sollte Notification bekommen

**Relevante Logs:**
```
LOG  ✅ Login successful: mucki@postei.de
LOG  ✅ Found 1 ungelesene Notifications (von 9 insgesamt)
LOG  ⚡ JIT: 1 neue Notification(s) empfangen! [{"id": "1rAOy2wQZXhBQsVmzKrM", "title": "Neue Nachricht von Diggi Dickmann", "type": "message"}]
```

**Beobachtung:** ❌ **PROBLEM: Keine Notification erstellt, wenn User A Nachricht sendet!**

**Erwartetes Verhalten:**
- User A sendet Nachricht → `addMessage` wird aufgerufen
- `[Notification][chat/addMessage/start]` Log erscheint
- Notification wird für User B erstellt
- `[Notification][chat/addMessage/notification-created]` Log erscheint

**Tatsächliches Verhalten:**
- ❌ Keine `addMessage` Logs sichtbar
- ❌ Keine `[Notification][chat/addMessage/start]` Log
- ❌ Keine Notification wird erstellt für User B
- ✅ User A sieht nur alte Notification von User B (1rAOy2wQZXhBQsVmzKrM)

**Mögliche Ursachen:**
1. `addMessage` wird nicht aufgerufen (ChatRoomScreen sendet Nachricht nicht)
2. `addMessage` wird aufgerufen, aber Notification-Erstellung schlägt fehl (keine Logs)
3. Notification wird erstellt, aber User B ist nicht eingeloggt/Subscription nicht aktiv
4. Timing-Problem: Notification wird erstellt, aber sofort wieder gelöscht

**Nächster Schritt:** 
- Prüfen, ob `addMessage` überhaupt aufgerufen wird (Logs hinzufügen)
- Prüfen, ob ChatRoomScreen `onAddMessage` korrekt aufruft
- Prüfen, ob User B eingeloggt ist und Subscription aktiv ist

**Fix-Implementierung (12.11.25, 08:45 Uhr):**
- ✅ Debug-Logging hinzugefügt in `addMessage` (Zeile 1520-1527)
  - Loggt: `chatId`, `messageId`, `messageText`, `senderId`, `senderName`, `timestamp`
  - Wird sofort beim Aufruf der Funktion geloggt
- ✅ Debug-Logging hinzugefügt in `ChatRoomScreen.handleSendMessage` (Zeile 95-127)
  - Loggt: `hasNewMessage`, `chatId`, `onAddMessageAvailable`, `timestamp`
  - Loggt Abbruch-Grund, falls Funktion früh zurückkehrt
  - Loggt, ob `onAddMessage` verfügbar ist und aufgerufen wird

**Nächster Test:** Szenario erneut durchspielen und Debug-Logs prüfen:
- `🔍 DEBUG: handleSendMessage aufgerufen` → zeigt, ob Button-Klick funktioniert
- `🔍 DEBUG: addMessage aufgerufen` → zeigt, ob Funktion aufgerufen wird
- `[Notification][chat/addMessage/start]` → zeigt, ob Notification-Erstellung startet

---

#### Test 2 - Ergebnis: Notification wird erstellt (12.11.25, 08:43 Uhr)

**Szenario:** User A (mucki, user-1762182785600) sendet Nachricht "nun aber" in Chat `FBob72V36ZvNoDMFAFOv`, User B (diggi, user-1762182855175) sollte Notification bekommen

**Relevante Logs (User A - Sender):**
```
LOG  🔍 DEBUG: handleSendMessage aufgerufen {"chatId": "FBob72V36ZvNoDMFAFOv", "hasNewMessage": true, "onAddMessageAvailable": true}
LOG  ✅ DEBUG: Rufe onAddMessage auf mit: {"chatId": "FBob72V36ZvNoDMFAFOv", "messageId": "msg1762937012173"}
LOG  🔍 DEBUG: addMessage aufgerufen {"chatId": "FBob72V36ZvNoDMFAFOv", "messageText": "nun aber", "senderId": "user-1762182785600"}
LOG  [Notification][chat/addMessage/start]
LOG  ✅ PHASE3: Nachricht in Firestore gespeichert
LOG  🔍 PHASE3: Empfänger gefunden: {"toUserId": "user-1762182855175", "senderId": "user-1762182785600"}
LOG  ⚡ JIT: Notification für neue Nachricht erstellt: {"notificationId": "GIlnkx8quixRUDE5WQTM", "toUserId": "user-1762182855175"}
LOG  [Notification][chat/addMessage/notification-created]
```

**Relevante Logs (User A - Subscription-Callback):**
```
LOG  ⚡ JIT: 1 neue Nachricht(en) empfangen in Chat FBob72V36ZvNoDMFAFOv!
LOG  📡 PHASE3: Nachrichten-Update für Chat FBob72V36ZvNoDMFAFOv: 4
LOG  🔍 PHASE3: Chat-Open-Prüfung: {"currentScreen": "chat-list", "isChatOpen": false, "routeChatId": undefined, "routeParams": "missing"}
LOG  ℹ️ PHASE3: Nachricht ist nicht für aktuellen User, überspringe: {"currentUserId": "user-1762182785600", "toUserId": "user-1762182855175"}
```

**Relevante Logs (User B - Empfänger):**
```
LOG  ✅ Login successful: diggi@posteo.de
LOG  ✅ Found 2 ungelesene Notifications (von 10 insgesamt)
LOG  ⚡ JIT: 2 neue Notification(s) empfangen! [{"id": "GIlnkx8quixRUDE5WQTM", "title": "Neue Nachricht von Mucki Maus", "type": "message"}, ...]
```

**Beobachtung:** ✅ **Notification wird korrekt erstellt!**

**Erwartetes Verhalten:**
- ✅ `addMessage` wird aufgerufen
- ✅ Notification wird für User B erstellt (`GIlnkx8quixRUDE5WQTM`)
- ✅ User B sieht Notification beim Login

**Tatsächliches Verhalten:**
- ✅ `addMessage` wird aufgerufen (Zeile 810)
- ✅ Notification wird erstellt für User B (Zeile 903-906)
- ✅ User B sieht 2 Notifications beim Login (Zeile 957), inkl. `GIlnkx8quixRUDE5WQTM`
- ✅ Subscription-Callback für User A überspringt korrekt (Zeile 820: "Nachricht ist nicht für aktuellen User")
- ❌ **PROBLEM: Chat-Notifications erscheinen nicht an der Glocke, sondern nur an der Glühbirne (Hinweis)!**

**Kritische Beobachtung:**
```
LOG  [Notification][badge-pre-calculation] {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "extraHintNotifications": 0, "hintUnreadFromHints": 1, "totalNotifications": 2}
LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "hintBadgeCount": 1, "notificationCount": 2}
```

**Problem:** 
- `totalNotifications: 2` (2 Chat-Notifications vorhanden)
- `extraChatNotifications: 0` ❌ (sollte 2 sein!)
- `chatBadgeCount: 0` ❌ (sollte 2 sein!)
- `hintBadgeCount: 1` (kommt von Hints, nicht von Chat-Notifications)

**Root Cause:** Chat-Notifications werden nicht korrekt als `extraChatNotifications` gezählt. 

**Vermutung:** Die Logik in Zeile 2420-2423 ist problematisch:
```javascript
const extraChatNotifications = unreadChatNotifications.filter(n => {
  if (!n.chatId) return true;
  return !existingChatIds.has(n.chatId);  // ❌ Problem: Wenn Chat existiert, wird Notification NICHT gezählt!
}).length;
```

**Problem:** Wenn eine Notification ein `chatId` hat UND der Chat bereits in `existingChatIds` existiert, wird die Notification NICHT als `extraChatNotifications` gezählt. Das ist falsch, weil:
- Der Chat existiert (`FBob72V36ZvNoDMFAFOv` ist in `filteredChats`)
- Aber `chatUnreadFromChats` ist 0 (Chat ist als gelesen markiert)
- Die Notification sollte trotzdem gezählt werden!

**Mögliche Ursachen:**
1. Notifications haben `chatId`, aber Chat ist bereits in `existingChatIds` → wird nicht gezählt
2. `chatUnreadFromChats` ist 0, aber `extraChatNotifications` sollte die Notifications zählen
3. Die Logik ist falsch: `extraChatNotifications` sollte ALLE Chat-Notifications zählen, die nicht durch `chatUnreadFromChats` abgedeckt sind

**Fix-Implementierung (12.11.25, 08:50 Uhr):**
- ✅ Debug-Logging hinzugefügt in `refreshNotificationBadges` (Zeile 2419-2435)
- Loggt: `unreadChatNotifications`, `existingChatIds`, `filteredChats`, Filter-Ergebnis für jede Notification
- Ermöglicht Diagnose, warum Notifications nicht gezählt werden

**Wichtige Erkenntnisse:**
1. ✅ `addMessage` funktioniert korrekt - Notification wird erstellt
2. ✅ Subscription-Callback für Sender überspringt korrekt (keine Duplikat-Notification)
3. ⚠️ **Problem identifiziert:** In Zeile 819: `routeChatId: undefined, routeParams: "missing"` - `route` ist nicht gesetzt, wenn Subscription-Callback ausgelöst wird
4. ⚠️ **Aber:** `currentScreen: "chat-list"` ist korrekt - User A ist nicht im Chat-Room, also wird keine Notification übersprungen (korrekt)

**Root Cause für Test 1 (Chat geöffnet - Notification sollte NICHT erstellt werden):**
- Die Prüfung `currentScreen === 'chat-room' && route?.params?.chat?.id === chatId` schlägt fehl, weil `route` nicht gesetzt ist
- `routeChatId` ist `undefined`, obwohl `currentScreen` möglicherweise `"chat-room"` ist
- **Fix nötig:** `route` muss korrekt gesetzt werden, bevor Subscription-Callback ausgelöst wird, ODER Prüfung muss angepasst werden, um auch ohne `route` zu funktionieren

**Nächster Schritt:** Fix für Chat-Open-Prüfung implementieren - `route`-Problem beheben oder Prüfung anpassen.

---

#### Test 2 - Root Cause identifiziert (12.11.25, 08:52 Uhr)

**Szenario:** User A (mucki) sendet Nachricht "ich hoffe es" in Chat `FBob72V36ZvNoDMFAFOv`, User B (diggi) sollte Notification an der Glocke sehen

**Relevante Logs (User B - diggi):**
```
LOG  ✅ Found 1 ungelesene Notifications (von 11 insgesamt)
LOG  ⚡ JIT: 1 neue Notification(s) empfangen! [{"id": "spuBCqijTNuhtHHqV8gM", "title": "Neue Nachricht von Mucki Maus", "type": "message"}]
LOG  🔍 DEBUG: Badge-Berechnung Chat-Notifications: {"unreadChatNotifications": [{"chatId": "FBob72V36ZvNoDMFAFOv", "id": "spuBCqijTNuhtHHqV8gM", "isRead": false, "type": "message"}], "unreadChatNotificationsCount": 1, "existingChatIds": ["FBob72V36ZvNoDMFAFOv"]}
LOG  🔍 DEBUG: Notification für existierenden Chat wird NICHT gezählt: {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationId": "spuBCqijTNuhtHHqV8gM"}
LOG  🔍 DEBUG: extraChatNotifications Ergebnis: 0
LOG  [Notification][badge-pre-calculation] {"chatUnreadFromChats": 0, "extraChatNotifications": 0, "totalNotifications": 1}
LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 0, "hintBadgeCount": 1}
```

**Root Cause identifiziert:** ✅

**Problem:** Die Logik in Zeile 2434-2446 ist falsch:
```javascript
const extraChatNotifications = unreadChatNotifications.filter(n => {
  if (!n.chatId) return true;
  return !existingChatIds.has(n.chatId);  // ❌ FALSCH: Wenn Chat existiert, wird NICHT gezählt!
}).length;
```

**Was passiert:**
1. ✅ Notification existiert: `spuBCqijTNuhtHHqV8gM` mit `type: "message"` und `chatId: "FBob72V36ZvNoDMFAFOv"`
2. ✅ Wird als `unreadChatNotifications` erkannt (Count: 1)
3. ❌ Wird NICHT als `extraChatNotifications` gezählt, weil Chat in `existingChatIds` existiert
4. ❌ Chat hat `unreadCount: 0` (Chat ist als gelesen markiert)
5. ❌ Ergebnis: `chatUnreadFromChats = 0` + `extraChatNotifications = 0` = `chatBadgeCount = 0`

**Korrekte Logik:**
- `extraChatNotifications` sollte Notifications zählen, die **nicht durch `chatUnreadFromChats` abgedeckt sind**
- Wenn Chat `unreadCount > 0` hat → Notifications werden bereits durch `chatUnreadFromChats` gezählt
- Wenn Chat `unreadCount = 0` hat → Notifications müssen als `extraChatNotifications` gezählt werden

**Fix:** Prüfe `chat.unreadCount` statt nur `existingChatIds.has(n.chatId)`

**Fix-Implementierung (12.11.25, 08:55 Uhr):**
- ✅ Logik korrigiert in `refreshNotificationBadges` (Zeile 2440-2463)
- ✅ `chatUnreadCountMap` erstellt für schnelle Lookups (Zeile 2422-2424)
- ✅ Neue Logik:
  - Chat existiert nicht → Notification wird gezählt
  - Chat existiert, `unreadCount = 0` → Notification wird gezählt (wird nicht durch `chatUnreadFromChats` abgedeckt)
  - Chat existiert, `unreadCount > 0` → Notification wird NICHT gezählt (wird bereits durch `chatUnreadFromChats` abgedeckt)
- ✅ Debug-Logging erweitert: zeigt `chatUnreadCountMap` und Entscheidungsgrund für jede Notification

**Erwartetes Verhalten nach Fix:**
- Chat `FBob72V36ZvNoDMFAFOv` hat `unreadCount: 0`
- Notification `spuBCqijTNuhtHHqV8gM` wird als `extraChatNotifications` gezählt
- `chatBadgeCount = 0 + 1 = 1` ✅
- Badge erscheint an der Glocke ✅

**Nächster Test:** Szenario erneut durchspielen und prüfen, ob Badge an der Glocke erscheint.

---

#### Test 2 - Erfolgreich: Notification erscheint an der Glocke (12.11.25, 08:52 Uhr)

**Szenario:** User A (mucki) sendet Nachricht "ich hoffe es" in Chat `FBob72V36ZvNoDMFAFOv`, User B (diggi) sollte Notification an der Glocke sehen

**Relevante Logs (User A - mucki, Sender):**
```
LOG  🔍 DEBUG: handleSendMessage aufgerufen {"chatId": "FBob72V36ZvNoDMFAFOv", "hasNewMessage": true, "onAddMessageAvailable": true}
LOG  ✅ DEBUG: Rufe onAddMessage auf mit: {"chatId": "FBob72V36ZvNoDMFAFOv", "messageId": "msg1762937501822"}
LOG  🔍 DEBUG: addMessage aufgerufen {"chatId": "FBob72V36ZvNoDMFAFOv", "messageText": "ich hoffe es", "senderId": "user-1762182785600"}
LOG  [Notification][chat/addMessage/start]
LOG  ✅ PHASE3: Nachricht in Firestore gespeichert
LOG  ⚡ JIT: Notification für neue Nachricht erstellt: {"notificationId": "spuBCqijTNuhtHHqV8gM", "toUserId": "user-1762182855175"}
LOG  [Notification][chat/addMessage/notification-created]
```

**Relevante Logs (User B - diggi, Empfänger):**
```
LOG  ✅ Login successful: diggi@posteo.de
LOG  ✅ Found 1 ungelesene Notifications (von 11 insgesamt)
LOG  ⚡ JIT: 1 neue Notification(s) empfangen! [{"id": "spuBCqijTNuhtHHqV8gM", "title": "Neue Nachricht von Mucki Maus", "type": "message"}]
LOG  🔍 DEBUG: Badge-Berechnung Chat-Notifications: {"unreadChatNotifications": [{"chatId": "FBob72V36ZvNoDMFAFOv", "id": "spuBCqijTNuhtHHqV8gM", "isRead": false, "type": "message"}], "unreadChatNotificationsCount": 1, "existingChatIds": ["FBob72V36ZvNoDMFAFOv"], "chatUnreadCountMap": {"FBob72V36ZvNoDMFAFOv": 0}}
LOG  🔍 DEBUG: Notification für Chat mit unreadCount = 0 wird gezählt: {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationId": "spuBCqijTNuhtHHqV8gM", "unreadCount": 0}
LOG  🔍 DEBUG: extraChatNotifications Ergebnis: 1
LOG  [Notification][badge-pre-calculation] {"chatUnreadFromChats": 0, "extraChatNotifications": 1, "totalNotifications": 1}
LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 1, "hintBadgeCount": 1}
LOG  [Notification][badge-refresh/done] {"chatBadgeCount": 1, "hintBadgeCount": 1}
```

**Beobachtung:** ✅ **ERFOLG: Notification erscheint korrekt an der Glocke!**

**Erwartetes Verhalten:**
- ✅ Notification wird erstellt (`spuBCqijTNuhtHHqV8gM`)
- ✅ Notification wird als `extraChatNotifications` gezählt (Fix funktioniert!)
- ✅ `chatBadgeCount = 1` (Badge erscheint an der Glocke)
- ✅ Notification verschwindet, wenn Nachricht gelesen wird

**Tatsächliches Verhalten:**
- ✅ Notification wird erstellt für User B (Zeile 1020-1057)
- ✅ `extraChatNotifications = 1` (Fix funktioniert - Zeile 1040)
- ✅ `chatBadgeCount = 1` (Badge erscheint an der Glocke - Zeile 1043)
- ✅ Notification wird gelöscht, wenn Chat geöffnet wird (erwartetes Verhalten)

**Wichtige Erkenntnisse:**
1. ✅ Fix funktioniert: `extraChatNotifications` wird korrekt berechnet
2. ✅ Badge erscheint an der Glocke (nicht mehr an der Glühbirne)
3. ✅ Notification wird automatisch gelöscht, wenn Chat geöffnet wird
4. ✅ `chatUnreadCountMap` zeigt korrekt `unreadCount: 0` für den Chat
5. ✅ Logik prüft `unreadCount` statt nur `existingChatIds.has()`

**Status:** ✅ **FIX ERFOLGREICH - Notification-System funktioniert korrekt!**

---

#### Problem: Badge springt beim Öffnen des Chats (12.11.25, 10:05 Uhr)

**Symptom:**
- Wenn User die Glocke antippt und den Chat öffnet, springen die Notifications um 4 nach oben
- Wenn User den Chat schließt und den Vorgang wiederholt, geht es auf 1 zurück, nur um beim Öffnen wieder um 4 nach oben zu zählen

**Relevante Logs:**
```
LOG  🔍 DEBUG: Badge-Berechnung Chat-Notifications: {"unreadChatNotifications": [{"chatId": "FBob72V36ZvNoDMFAFOv", "id": "tDpVUDXc6mZlia4LlyTd", "isRead": false, "type": "message"}, {"chatId": "FBob72V36ZvNoDMFAFOv", "id": "1gPxcXAhVQZkYZq6sA2z", "isRead": false, "type": "message"}, {"chatId": "FBob72V36ZvNoDMFAFOv", "id": "7p97ua1SO4wATFjMMzRA", "isRead": false, "type": "message"}, {"chatId": "FBob72V36ZvNoDMFAFOv", "id": "n2Kftr9SkKLn5PX0MUAU", "isRead": false, "type": "message"}], "unreadChatNotificationsCount": 4, "existingChatIds": ["FBob72V36ZvNoDMFAFOv", "8bn8qa8Pyy6yYmmRhsyC", "ZD4MmMBSROLsv4CXm7G4"], "chatUnreadCountMap": {"FBob72V36ZvNoDMFAFOv": 0}}
LOG  🔍 DEBUG: Notification für Chat mit unreadCount = 0 wird gezählt: {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationId": "tDpVUDXc6mZlia4LlyTd", "unreadCount": 0}
LOG  🔍 DEBUG: Notification für Chat mit unreadCount = 0 wird gezählt: {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationId": "1gPxcXAhVQZkYZq6sA2z", "unreadCount": 0}
LOG  🔍 DEBUG: Notification für Chat mit unreadCount = 0 wird gezählt: {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationId": "7p97ua1SO4wATFjMMzRA", "unreadCount": 0}
LOG  🔍 DEBUG: Notification für Chat mit unreadCount = 0 wird gezählt: {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationId": "n2Kftr9SkKLn5PX0MUAU", "unreadCount": 0}
LOG  🔍 DEBUG: extraChatNotifications Ergebnis: 4
LOG  [Notification][badge-pre-calculation] {"chatUnreadFromChats": 0, "extraChatNotifications": 4, "totalNotifications": 4}
LOG  🔔 refreshNotificationBadges {"chatBadgeCount": 4, "hintBadgeCount": 1}
```

**Root Cause Analyse:**

**Problem 1: Notifications werden nicht sofort gelöscht**
- `markChatAsRead` wird aufgerufen, wenn Chat geöffnet wird (Zeile 87-93 in `ChatRoomScreen.js`)
- `markChatAsRead` markiert Notifications als "pending deletion" und entfernt sie aus dem lokalen State
- ABER: Die Firestore-Subscription könnte die Notifications wieder hinzufügen, bevor sie aus Firestore gelöscht sind
- Die `pendingNotificationDeletionsRef` wird nach 2 Sekunden geleert (Zeile 2062-2068)
- Wenn die Notifications nach 2 Sekunden noch in Firestore sind, werden sie wieder hinzugefügt

**Problem 2: Badge-Berechnung läuft mehrfach**
- `refreshNotificationBadges` wird bei jedem Render aufgerufen (useEffect mit `notifications` als Dependency)
- Wenn der Chat geöffnet wird, gibt es mehrere Render-Zyklen
- Die Badge-Berechnung läuft, bevor die Notifications gelöscht sind
- Die Notifications werden mehrfach gezählt

**Mögliche Ursachen:**
1. `markChatAsRead` wird aufgerufen, aber die Notifications werden nicht sofort aus Firestore gelöscht
2. Die Firestore-Subscription fügt die Notifications wieder hinzu, bevor sie gelöscht sind
3. Die Badge-Berechnung läuft mehrfach und zählt die gleichen Notifications mehrfach
4. Die `pendingNotificationDeletionsRef` wird zu früh geleert (nach 2 Sekunden)

**Nächster Schritt:** 
- Prüfen, ob `markChatAsRead` tatsächlich aufgerufen wird, wenn Chat über Glocke geöffnet wird
- Prüfen, ob die Notifications korrekt aus Firestore gelöscht werden
- Prüfen, ob die Subscription die Notifications korrekt filtert
- Prüfen, ob die Badge-Berechnung mehrfach läuft

**Fix-Implementierung (12.11.25, 10:10 Uhr):**
- ✅ Badge-Berechnung erweitert: Notifications für geöffnete Chats werden nicht gezählt
- ✅ Prüfung hinzugefügt: `isChatCurrentlyOpen` prüft, ob Chat aktuell geöffnet ist (`currentScreen === 'chat-room' && routeChatId === chatId`)
- ✅ Filter-Logik erweitert: Wenn Chat geöffnet ist, werden Notifications für diesen Chat nicht als `extraChatNotifications` gezählt
- ✅ Debug-Logging erweitert: zeigt `currentScreen`, `routeChatId` und `isChatCurrentlyOpen`

**Erwartetes Verhalten nach Fix:**
- Chat wird geöffnet → Notifications werden nicht mehr in Badge gezählt
- Badge bleibt bei 0, auch wenn Notifications noch in Firestore sind
- Chat wird geschlossen → Notifications werden wieder gezählt (wenn noch vorhanden)
- `markChatAsRead` löscht Notifications weiterhin aus Firestore (asynchron)

**Nächster Test:** Szenario erneut durchspielen und prüfen, ob Badge nicht mehr springt.

---

#### Test-Ergebnis: Fix erfolgreich (12.11.25, 10:15 Uhr)

**Szenario:** User tippt auf Glocke, öffnet Chat, schließt Chat, wiederholt Vorgang

**Beobachtung:** ✅ **FIX ERFOLGREICH - Badge springt nicht mehr!**

**Erwartetes Verhalten:**
- ✅ Chat wird geöffnet → Badge bleibt bei 0 (Notifications werden nicht gezählt)
- ✅ Chat wird geschlossen → Notifications werden wieder gezählt (wenn noch vorhanden)
- ✅ Badge springt nicht mehr beim Öffnen des Chats

**Tatsächliches Verhalten:**
- ✅ Badge bleibt stabil, auch wenn Chat geöffnet wird
- ✅ Notifications werden korrekt ausgeblendet, wenn Chat geöffnet ist
- ✅ Keine Sprünge mehr in der Badge-Anzeige

**Status:** ✅ **FIX ERFOLGREICH - Badge-Spring-Problem behoben!**

---

#### Problem: Notifications werden für bereits gelesene Chats gezählt (12.11.25, 10:20 Uhr)

**Symptom:**
- Chat hat `unreadCount: 0` (bereits als gelesen markiert)
- Aber es werden trotzdem Notifications gezählt (z.B. 5 Notifications)
- Badge zeigt falsche Anzahl an

**Root Cause:**
- Die Logik in `refreshNotificationBadges` zählte Notifications für Chats mit `unreadCount = 0`
- Begründung war: "Notifications werden nicht durch chatUnreadFromChats abgedeckt"
- **ABER:** Wenn ein Chat `unreadCount = 0` hat, bedeutet das, dass der Chat bereits als gelesen markiert wurde
- Die Notifications sollten dann NICHT gezählt werden, auch wenn sie noch in Firestore existieren

**Relevante Logs:**
```
LOG  🔍 DEBUG: Badge-Berechnung Chat-Notifications: {"chatUnreadCountMap": {"FBob72V36ZvNoDMFAFOv": 0}, "unreadChatNotifications": [5 Notifications]}
LOG  🔍 DEBUG: Notification für Chat mit unreadCount = 0 wird gezählt: {"chatId": "FBob72V36ZvNoDMFAFOv", "unreadCount": 0}
LOG  🔍 DEBUG: extraChatNotifications Ergebnis: 5
```

**Fix-Implementierung (12.11.25, 10:22 Uhr):**
- ✅ Logik korrigiert in `refreshNotificationBadges` (Zeile 2475-2479)
- ✅ Notifications für Chats mit `unreadCount = 0` werden NICHT mehr gezählt
- ✅ Begründung: Chat wurde bereits als gelesen markiert, Notifications sollten nicht gezählt werden
- ✅ Auch wenn Notifications noch in Firestore existieren (z.B. wegen Race Conditions), werden sie nicht gezählt

**Erwartetes Verhalten nach Fix:**
- Chat mit `unreadCount: 0` → `extraChatNotifications = 0` (auch wenn Notifications in Firestore existieren)
- Badge zeigt korrekte Anzahl an
- Keine Hochzählung mehr für bereits gelesene Chats

**Status:** ✅ **FIX IMPLEMENTIERT - Testing erforderlich**

---

#### Problem: Keine Notification wenn diggi an mucki schreibt (12.11.25, 10:30 Uhr)

**Symptom:**
- diggi sendet Nachricht an mucki
- Keine Notification wird erstellt/angezeigt
- Badge zeigt keine neue Notification an

**Mögliche Ursachen:**
1. `addMessage` wird nicht aufgerufen
2. `addMessage` wird aufgerufen, aber Notification wird nicht erstellt
3. Notification wird erstellt, aber nicht korrekt angezeigt
4. Chat wird als geöffnet erkannt, obwohl er geschlossen ist

**Fix-Implementierung (12.11.25, 10:32 Uhr):**
- ✅ Prüfung "Chat ist geöffnet" aus `addMessage` entfernt
- ✅ Begründung: `addMessage` läuft im Kontext des Senders, nicht des Empfängers
- ✅ Die Prüfung "Chat ist geöffnet" bleibt nur in `createNotificationsForNewMessages` (Subscription)
- ✅ Notification wird immer erstellt; wenn Empfänger Chat geöffnet hat, wird sie durch `markChatAsRead` gelöscht

**Debug-Logging:**
- ✅ `addMessage` loggt bereits alle relevanten Informationen
- ✅ `createNotificationsForNewMessages` loggt bereits alle relevanten Informationen

**Nächster Schritt:**
- Test durchführen: diggi sendet Nachricht an mucki
- Logs prüfen: Wird `addMessage` aufgerufen? Wird Notification erstellt?
- Falls nicht: Weitere Debug-Logs hinzufügen

**Status:** ✅ **FIX IMPLEMENTIERT - Testing erforderlich**

---

#### Problem: Keine Notification bei diggi, wenn mucki sendet (12.11.25, 10:35 Uhr)

**Symptom:**
- mucki sendet Nachricht "mal sehen" an diggi
- Notification wird erstellt (`ney5LNdfxbwqjBCk8D2a`)
- ABER: Badge zeigt 0 an, obwohl 4 Chat-Notifications vorhanden sind
- Alle 4 Notifications werden NICHT gezählt, weil `unreadCount = 0`

**Root Cause:**
- `unreadCount` ist global (Chat-Level), nicht pro User!
- Wenn mucki den Chat öffnet, wird `unreadCount` auf 0 gesetzt (für alle User)
- Die Logik prüft nur `unreadCount = 0`, nicht ob der aktuelle User (diggi) den Chat gelesen hat
- `readBy` Array zeigt, welche User den Chat gelesen haben, wird aber nicht verwendet

**Relevante Logs:**
```
LOG  🔍 DEBUG: Badge-Berechnung Chat-Notifications: {"chatUnreadCountMap": {"FBob72V36ZvNoDMFAFOv": 0}, "unreadChatNotifications": [4 Notifications]}
LOG  🔍 DEBUG: Notification für Chat mit unreadCount = 0 wird NICHT gezählt (Chat bereits gelesen): {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationId": "ney5LNdfxbwqjBCk8D2a", "unreadCount": 0}
LOG  🔍 DEBUG: extraChatNotifications Ergebnis: 0
```

**Fix-Implementierung (12.11.25, 10:40 Uhr):**
- ✅ `chatReadByMap` erstellt für schnelle Lookups (Zeile 2429-2432)
- ✅ Logik korrigiert: Prüfe `readBy` statt nur `unreadCount` (Zeile 2487-2504)
- ✅ Neue Logik:
  - Wenn `unreadCount > 0` → NICHT zählen (wird durch `chatUnreadFromChats` abgedeckt)
  - Wenn `unreadCount = 0` UND aktueller User in `readBy` → NICHT zählen (User hat Chat bereits gelesen)
  - Wenn `unreadCount = 0` UND aktueller User NICHT in `readBy` → **ZÄHLEN** (User hat Chat noch nicht gelesen, auch wenn `unreadCount = 0`)
- ✅ Debug-Logging erweitert: zeigt `chatReadByMap` und `currentUserId`

**Erwartetes Verhalten nach Fix:**
- mucki sendet Nachricht → Notification wird erstellt für diggi
- diggi loggt sich ein → Badge zeigt korrekte Anzahl an (auch wenn `unreadCount = 0`, weil diggi nicht in `readBy` ist)
- diggi öffnet Chat → `readBy` wird aktualisiert → Notifications werden nicht mehr gezählt

**Status:** ✅ **FIX IMPLEMENTIERT - Testing erforderlich**

---

#### Problem: Keine Notification bei diggi, wenn mucki in existierendem Chat sendet (12.11.25, 12:45 Uhr)

**Symptom:**
- mucki sendet Nachricht "lets go" in existierendem Chat
- Notification wird erstellt (`ScxaimBkgIivcCqzNoCm`)
- ABER: Badge zeigt 0 an, obwohl 7 Chat-Notifications vorhanden sind
- Alle 7 Notifications werden NICHT gezählt, weil:
  1. Chat ist geöffnet (`isChatCurrentlyOpen: "FBob72V36ZvNoDMFAFOv"`)
  2. diggi ist in `readBy` (`"readBy": ["user-1762182785600", "user-1762182855175"]`)

**Root Cause:**
- Wenn mucki eine neue Nachricht sendet, wird `readBy` NICHT aktualisiert
- diggi bleibt in `readBy`, auch nachdem mucki eine neue Nachricht gesendet hat
- `unreadCount` bleibt 0, auch nachdem mucki eine neue Nachricht gesendet hat
- Daher wird die Notification nicht gezählt, weil:
  - `unreadCount = 0` UND diggi ist in `readBy` → Notification wird NICHT gezählt

**Relevante Logs:**
```
LOG  🔍 DEBUG: Badge-Berechnung Chat-Notifications: {"chatReadByMap": {"FBob72V36ZvNoDMFAFOv": ["user-1762182785600", "user-1762182855175"]}, "currentUserId": "user-1762182855175", "isChatCurrentlyOpen": "FBob72V36ZvNoDMFAFOv"}
LOG  🔍 DEBUG: Notification für geöffneten Chat wird NICHT gezählt: {"chatId": "FBob72V36ZvNoDMFAFOv", "notificationId": "ScxaimBkgIivcCqzNoCm"}
LOG  🔍 DEBUG: extraChatNotifications Ergebnis: 0
```

**Fix-Implementierung (12.11.25, 12:50 Uhr):**
- ✅ `addChatMessage` erweitert (`database-web.js` Zeile 1764-1804):
  - Lädt Chat, um `readBy` und `participants` zu erhalten
  - Findet Empfänger (nicht Sender)
  - Entfernt Empfänger aus `readBy` (wenn vorhanden)
  - Setzt `unreadCount` auf 1 (wenn es 0 war)
  - Aktualisiert Chat mit `readBy` und `unreadCount`

**Erwartetes Verhalten nach Fix:**
- mucki sendet Nachricht → diggi wird aus `readBy` entfernt, `unreadCount` wird auf 1 gesetzt
- diggi loggt sich ein → Badge zeigt korrekte Anzahl an (weil `unreadCount > 0` oder diggi nicht in `readBy` ist)
- diggi öffnet Chat → `readBy` wird aktualisiert, `unreadCount` wird auf 0 gesetzt → Notifications werden nicht mehr gezählt

**Status:** ✅ **FIX IMPLEMENTIERT - Testing erforderlich**

---

#### Problem: Sender erhält Notification von seiner eigenen Nachricht (12.11.25, 13:08 Uhr)

**Symptom:**
- mucki sendet Nachricht → mucki erhält selbst eine unread Notification
- diggi sendet Nachricht → diggi erhält selbst eine unread Notification
- Empfänger erhält korrekt eine Notification

**Root Cause:**
- In `createNotificationsForNewMessages` wurde nur geprüft, ob `toUserId !== currentUserId`
- Es wurde NICHT geprüft, ob `message.senderId === currentUserId`
- Wenn der Sender die Nachricht sendet, wird die Subscription ausgelöst und erstellt eine Notification für den Sender selbst

**Relevante Logs:**
```
LOG  🔍 DEBUG: addMessage aufgerufen {"senderId": "user-1762182855175", ...}
LOG  🔍 PHASE3: Empfänger gefunden: {"toUserId": "user-1762182785600", "senderId": "user-1762182855175"}
LOG  ⚡ JIT: Notification für neue Nachricht erstellt: {"toUserId": "user-1762182785600", ...}
```

**Fix-Implementierung (12.11.25, 13:10 Uhr):**
- ✅ `createNotificationsForNewMessages` erweitert (Zeile 1469-1474):
  - Prüft, ob `message.senderId === currentUserId`
  - Wenn ja → überspringe (Sender sollte keine Notification von seiner eigenen Nachricht erhalten)
- ✅ `addMessage` erweitert (Zeile 1629-1639):
  - Prüft, ob `message.senderId === currentUserId`
  - Wenn ja → keine Notification erstellen (zusätzliche Sicherheit)

**Erwartetes Verhalten nach Fix:**
- mucki sendet Nachricht → mucki erhält KEINE Notification, diggi erhält Notification
- diggi sendet Nachricht → diggi erhält KEINE Notification, mucki erhält Notification

**Status:** ✅ **FIX IMPLEMENTIERT - Testing erforderlich**

**Update (12.11.25, 13:15 Uhr):**
- ✅ Zusätzliche Filterung beim Laden der Notifications hinzugefügt (Zeile 2422-2427):
  - Filtert Notifications, bei denen `senderId === currentId` oder `fromUserId === currentId`
  - Verhindert, dass bereits existierende Notifications von eigenen Nachrichten angezeigt werden
  - Debug-Logging hinzugefügt für gefilterte Notifications

**Status:** ✅ **FIX ERWEITERT - Testing erforderlich**

---

#### Problem: Unread Notification von eigener Nachricht wird weiterhin erstellt (12.11.25, 13:20 Uhr)

**Symptom:**
- mucki sendet Nachricht "klar doch" → erhält selbst eine unread Notification
- `addMessage` überspringt korrekt (Zeile 974-975: `reason: "sender-is-current-user"`)
- ABER: Notification wird trotzdem erstellt und angezeigt

**Relevante Logs:**
```
LOG  🔍 PHASE3: Suche Chat für Notification: {"chatGefunden": true, "chatId": "FBob72V36ZvNoDMFAFOv", "currentScreen": "chat-room", "currentUserId": "user-1762182785600", "participants": ["user-1762182785600", "user-1762182855175"], "senderId": "user-1762182785600"}
LOG  ⚠️ PHASE3: Aktueller User ist Sender, keine Notification erstellt (Sender sollte keine Notification von seiner eigenen Nachricht erhalten)
LOG  [Notification][chat/addMessage/notification-skipped] 2025-11-12T13:12:04.824Z {"data": {"chatId": "FBob72V36ZvNoDMFAFOv", "messageId": "msg1762953124510", "reason": "sender-is-current-user"}, "type": "message"}
```

**Beobachtung:**
- `addMessage` funktioniert korrekt (überspringt Notification-Erstellung)
- ABER: Keine Logs von `createNotificationsForNewMessages` nach dem Senden sichtbar
- Das bedeutet: Entweder wird die Subscription nicht ausgelöst, ODER die Notification wird auf eine andere Weise erstellt

**Mögliche Ursachen:**
1. **Subscription wird ausgelöst, aber Logs fehlen:** Die Subscription könnte die Notification erstellen, bevor die Prüfung greift
2. **Notification wird für falschen User erstellt:** Die Notification könnte für den Sender erstellt werden, obwohl sie für den Empfänger erstellt werden sollte
3. **Race Condition:** Die Notification könnte durch eine andere Route erstellt werden

**Nächster Schritt:**
- ✅ Debug-Logging in `createNotificationsForNewMessages` erweitert (Zeile 1359, 1369):
  - Loggt, wenn Funktion aufgerufen wird
  - Loggt `currentUserId` und `newMessages` Details
- Test durchführen: mucki sendet Nachricht → Logs prüfen, ob `createNotificationsForNewMessages` aufgerufen wird
- Falls ja: Prüfen, ob die Prüfung `message.senderId === currentUserId` greift
- Falls nein: Prüfen, ob die Notification auf eine andere Weise erstellt wird

**Status:** 🔍 **DEBUGGING IN PROGRESS**

**Update (12.11.25, 13:30 Uhr):**
- ✅ Filterung beim Laden aus Firestore hinzugefügt (`database-web.js` Zeile 2014-2022, 2087-2095):
  - `getNotificationsForUser`: Filtert Notifications, bei denen `senderId === userId` oder `fromUserId === userId`
  - `subscribeNotificationsForUser`: Gleiche Filterung für alle Notifications und neue Notifications
  - Verhindert, dass bereits existierende Notifications von eigenen Nachrichten aus Firestore geladen werden
  - Debug-Logging hinzugefügt, um gefilterte Notifications zu sehen

**Erwartetes Verhalten nach Fix:**
- Beim Laden aus Firestore werden Notifications von eigenen Nachrichten bereits gefiltert
- Neue Notifications von eigenen Nachrichten werden in der Subscription gefiltert
- Keine Notifications von eigenen Nachrichten werden mehr angezeigt

**Status:** ✅ **FIX IMPLEMENTIERT - Testing erforderlich**

**Update (12.11.25, 13:40 Uhr):**
- ✅ Zentrale Prüfung in `createNotification` hinzugefügt (`database-web.js` Zeile 1930-1954):
  - Prüft, ob `notificationData.senderId === userId` oder `notificationData.fromUserId === userId`
  - Wenn ja → gibt `null` zurück (keine Notification erstellen)
  - Verhindert, dass Notifications von eigenen Nachrichten in Firestore erstellt werden
- ✅ Prüfung auf `null` Rückgabewert hinzugefügt (`App.js` Zeile 1510-1513, 1721-1724):
  - Beide Stellen, wo `fsCreateNotification` aufgerufen wird, prüfen jetzt auf `null`
  - Wenn `null` → Logging und frühes Return
- ✅ Erweiterte Logging in `createNotificationsForNewMessages` und `addMessage`

**Erwartetes Verhalten nach Fix:**
- Wenn mucki eine Nachricht sendet → `createNotification` prüft `senderId === userId` → gibt `null` zurück → keine Notification erstellt
- Wenn diggi eine Nachricht sendet → `createNotification` prüft `senderId !== userId` → Notification wird erstellt ✅

**Status:** ✅ **FIX ERWEITERT - Testing erforderlich**