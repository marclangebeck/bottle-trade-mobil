# Phase 2: Code-Bereinigung - Vollständige Checkliste

**Ziel:** Alte Codezeilen müssen **KOMPLETT** entfernt/ersetzt werden, damit sie keine Auswirkung mehr haben!

---

## ✅ Checkliste: Notification-Typen ersetzen

### App.js
- [ ] Zeile 1034: Filter `'trade'` oder `'trade-info'` → `'hint-decision'` oder `'hint-small'`
- [ ] Zeile 1393, 1409, 1419, 1431, 1442, 1453, 1497, 1517, 1529, 1556, 1573, 1584, 1605, 1621, 1631, 1641, 1653, 1664, 1675, 1689, 1699, 1706, 1717, 1725, 1728, 1741, 1750: `type: 'message'` → `type: 'chat'`
- [ ] Zeile 2071, 2092: Filter `'trade'` oder `'trade-info'` → neue Typen
- [ ] Zeile 2140, 2154: Filter `'trade'` oder `'trade-info'` → neue Typen
- [ ] Zeile 2247: `type: 'trade-info'` → `type: 'hint-small'`
- [ ] Zeile 2436: Filter `'trade'` oder `'trade-info'` → neue Typen
- [ ] Zeile 2443: Filter `'message'` oder `'chat'` → nur `'chat'`
- [ ] Zeile 2477: Filter `'trade-info'` → `'hint-small'`
- [ ] Zeile 2763: Filter `'trade'` oder `'trade-info'` → neue Typen
- [ ] Zeile 2805, 2808: Filter `'message'` oder `'chat'` → nur `'chat'`
- [ ] Zeile 2851, 2852, 2860, 2861: Filter `'trade'` oder `'trade-info'` → neue Typen
- [ ] Zeile 3091, 3104, 3118, 3133, 3149, 3161: `type: 'trade'` → `type: 'hint-decision'` oder `'hint-small'`
- [ ] Zeile 3263, 3343: `type: 'trade'` oder `'trade-info'` → neue Typen
- [ ] Zeile 3674, 3752: `type: 'trade-info'` → `type: 'hint-small'`
- [ ] Zeile 4252, 4261: `type: 'trade-info'` → `type: 'hint-small'`

### database-web.js
- [ ] Zeile 1932: Filter für `'message'` oder `'chat'` → nur `'chat'`
- [ ] Zeile 2014-2022: Filter für alte Typen → neue Typen
- [ ] Zeile 2087-2095, 2120-2128: Filter für alte Typen → neue Typen

---

## ✅ Checkliste: State vereinfachen

### App.js
- [ ] Zeile 103-104: `unreadNotifications` und `unreadHints` → `unreadCount`
- [ ] Zeile 2405-2406: `setUnreadNotifications` und `setUnreadHints` → `setUnreadCount`
- [ ] Zeile 2400-2700: `refreshNotificationBadges` komplett neu schreiben
  - [ ] Alte komplexe Berechnung entfernen
  - [ ] Neue einfache Berechnung: `notifications.filter(n => !n.isRead && !n.isArchived).length`
  - [ ] Nur noch `setUnreadCount` verwenden

### Alle Komponenten und Screens (Props anpassen)
- [ ] `components/BottomNavigation.js`:
  - [ ] Zeile 5: Props `unreadNotifications, unreadHints` → `unreadCount`
  - [ ] Zeile 102, 105: Badge-Berechnung anpassen
  - [ ] Zeile 118, 119: Props an `NewsPopup` anpassen
  
- [ ] `components/NewsPopup.js`:
  - [ ] Props `unreadNotifications, unreadHints` → `unreadCount`
  - [ ] Oder komplett entfernen/umbauen (wird zu InfoBoxScreen)

- [ ] `DynamicHamburgerMenu.js`:
  - [ ] Zeile 5: Props `unreadNotifications` → `unreadCount`
  - [ ] Zeile 84, 87: Badge-Berechnung anpassen

- [ ] Alle Screens (Props anpassen):
  - [ ] `screens/ProfilScreen.js` (Zeile 11)
  - [ ] `screens/StartScreen.js` (Zeile 6)
  - [ ] `screens/WeineScreen.js` (Zeile 7)
  - [ ] `screens/BtpScreen.js` (Zeile 9)
  - [ ] `screens/ChatListScreen.js`
  - [ ] `screens/HinweisScreen.js`
  - [ ] `screens/NotificationsScreen.js`
  - [ ] `WeinboerseScreen.js`
  - [ ] `MeinWeinregalScreen.js`
  - [ ] `DashboardScreen.js`
  - [ ] Alle anderen Screens, die `unreadNotifications` oder `unreadHints` verwenden

---

## ✅ Checkliste: Filter komplett ersetzen

### App.js - refreshNotificationBadges
- [ ] Zeile 2434-2439: `unreadHintNotifications` Filter komplett entfernen
- [ ] Zeile 2441-2481: `unreadChatNotifications` Filter komplett neu
  - [ ] Alte Filter für `'message'`, `'trade'`, `'trade-info'` entfernen
  - [ ] Neue Filter für `'hint-decision'`, `'hint-small'`, `'chat'`, `'system'`
- [ ] Zeile 2489-2492: `chatUnreadFromChats` entfernen (nicht mehr benötigt)
- [ ] Zeile 2494-2700: Komplexe Berechnung entfernen
- [ ] Neue einfache Berechnung implementieren:
  ```javascript
  const unreadCount = notifications.filter(n => 
    !n.isRead && 
    !n.isArchived && 
    (n.type === 'hint-decision' || n.type === 'hint-small' || n.type === 'chat' || n.type === 'system')
  ).length;
  setUnreadCount(unreadCount);
  ```

### database-web.js
- [ ] `getNotificationsForUser`: Filter für alte Typen entfernen
- [ ] `subscribeNotificationsForUser`: Filter für alte Typen entfernen
- [ ] Neue Filter für `'hint-decision'`, `'hint-small'`, `'chat'`, `'system'`

---

## ✅ Checkliste: Funktionen anpassen

### App.js
- [ ] `ensureTradeNotification` (Zeile 3088):
  - [ ] `type: 'trade'` → `type: 'hint-decision'` (für B)
  - [ ] `type: 'trade-info'` → `type: 'hint-small'` (für A)
  
- [ ] `createTradeDecisionHints` (Zeile 3407):
  - [ ] `type: 'trade-info'` → `type: 'hint-small'`
  
- [ ] `acceptTradeRequest` (Zeile 4079):
  - [ ] `type: 'trade-info'` → `type: 'hint-small'`
  - [ ] Reihenfolge optimieren (gleichzeitige Erstellung)

- [ ] `createNotificationsForNewMessages` (Zeile 1358):
  - [ ] `type: 'message'` → `type: 'chat'`

- [ ] `addMessage` (Zeile 1520):
  - [ ] `type: 'message'` → `type: 'chat'`

---

## ✅ Checkliste: Komponenten umbauen

### NewsPopup.js
- [ ] Option 1: Komplett entfernen (wird durch InfoBoxScreen ersetzt)
- [ ] Option 2: Komplett umbauen zu InfoBoxScreen
- [ ] Props anpassen: `unreadNotifications, unreadHints` → `unreadCount`

### BottomNavigation.js
- [ ] Zeile 3: `NewsPopup` Import entfernen (wenn NewsPopup entfernt wird)
- [ ] Zeile 5: Props anpassen
- [ ] Zeile 80-97: Direkter Screen-Aufruf statt Popup
  ```javascript
  onPress={() => {
    if (!isLoggedIn) {
      handleNavigate('login');
      return;
    }
    handleNavigate('infobox'); // Direkter Screen-Aufruf
  }}
  ```
- [ ] Zeile 102-108: Badge-Berechnung anpassen
- [ ] Zeile 114-121: NewsPopup entfernen (wenn entfernt)

---

## ✅ Checkliste: Verifikation

Nach allen Änderungen:

- [ ] **Keine alten Notification-Typen mehr:**
  - [ ] `grep -r "type.*trade"` → keine Treffer (außer Kommentare)
  - [ ] `grep -r "type.*trade-info"` → keine Treffer (außer Kommentare)
  - [ ] `grep -r "type.*message"` → keine Treffer (außer Kommentare)

- [ ] **Keine alten State-Variablen mehr:**
  - [ ] `grep -r "unreadNotifications"` → keine Treffer (außer Kommentare)
  - [ ] `grep -r "unreadHints"` → keine Treffer (außer Kommentare)
  - [ ] `grep -r "setUnreadNotifications"` → keine Treffer (außer Kommentare)
  - [ ] `grep -r "setUnreadHints"` → keine Treffer (außer Kommentare)

- [ ] **Nur neue Typen verwendet:**
  - [ ] `grep -r "type.*hint-decision"` → Treffer vorhanden
  - [ ] `grep -r "type.*hint-small"` → Treffer vorhanden
  - [ ] `grep -r "type.*chat"` → Treffer vorhanden
  - [ ] `grep -r "type.*system"` → Treffer vorhanden (falls verwendet)

- [ ] **Nur neuer State verwendet:**
  - [ ] `grep -r "unreadCount"` → Treffer vorhanden
  - [ ] `grep -r "setUnreadCount"` → Treffer vorhanden

- [ ] **App startet ohne Fehler:**
  - [ ] Keine Linter-Fehler
  - [ ] Keine Runtime-Fehler
  - [ ] Badge wird korrekt angezeigt

---

## 📝 Notizen

- **WICHTIG:** Schrittweise vorgehen, nach jedem Schritt testen!
- **WICHTIG:** Backup vor Phase 2 erstellen!
- **WICHTIG:** Alte Codezeilen komplett entfernen, nicht nur auskommentieren!

---

**Status:** ⏳ Bereit für Phase 2

