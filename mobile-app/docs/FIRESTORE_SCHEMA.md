# Firestore Schema: Notifications

**Datum:** 12. November 2025  
**Version:** 2.0 (Phase 3)

---

## 📋 Notification-Dokument

**Pfad:** `users/{userId}/notifications/{notificationId}`

### Felder

| Feld | Typ | Beschreibung | Erforderlich | Standard |
|------|-----|--------------|--------------|----------|
| `id` | string | Dokument-ID (automatisch) | ✅ | - |
| `type` | string | Notification-Typ | ✅ | - |
| `title` | string | Titel der Notification | ✅ | - |
| `message` | string | Nachrichtentext | ✅ | - |
| `isRead` | boolean | Gelesen-Status | ✅ | `false` |
| `isArchived` | boolean | Archiviert-Status (nach Swipe-to-Delete) | ✅ | `false` |
| `isCompleted` | boolean | Abgeschlossen-Status (grau ausgrauen) | ✅ | `false` |
| `priority` | string | Priorität (`low`, `medium`, `high`) | ❌ | `medium` |
| `createdAt` | timestamp | Erstellungszeitpunkt | ✅ | `serverTimestamp()` |
| `readAt` | timestamp | Gelesen-Zeitpunkt | ❌ | - |
| `archivedAt` | timestamp | Archiviert-Zeitpunkt | ❌ | - |

### Typ-spezifische Felder

#### `type: 'hint-decision'` (EntscheidungsHinweis - Rot)
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `requestId` | string | Trade-Request-ID |
| `hintId` | string | Hinweis-ID (optional) |
| `fromUserId` | string | Absender-ID |
| `fromUserName` | string | Absender-Name |
| `toUserId` | string | Empfänger-ID |
| `toUserName` | string | Empfänger-Name |
| `wineId` | string | Wein-ID |
| `wineTitle` | string | Wein-Titel |

#### `type: 'hint-small'` (Kleiner Hinweis - Gelb)
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `requestId` | string | Trade-Request-ID |
| `hintId` | string | Hinweis-ID (optional) |
| `fromUserId` | string | Absender-ID |
| `fromUserName` | string | Absender-Name |
| `toUserId` | string | Empfänger-ID |
| `toUserName` | string | Empfänger-Name |
| `wineId` | string | Wein-ID (optional) |
| `wineTitle` | string | Wein-Titel (optional) |
| `chatId` | string | Chat-ID (optional, z.B. bei Chat-verlassen) |

#### `type: 'chat'` (Chat-Message - Grün)
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `chatId` | string | Chat-ID |
| `messageId` | string | Message-ID (optional) |
| `senderId` | string | Absender-ID |
| `senderName` | string | Absender-Name |
| `toUserId` | string | Empfänger-ID |
| `fromUserId` | string | Absender-ID (für Konsistenz) |
| `messageText` | string | Nachrichtentext (optional) |

#### `type: 'system'` (System-Nachricht - Blau)
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `systemType` | string | System-Typ (z.B. `admin-message`, `update`) |
| `actionUrl` | string | URL/Action (optional) |

---

## 🔄 Migration von altem Schema

### Alte Typen → Neue Typen

| Alt | Neu | Beschreibung |
|-----|-----|--------------|
| `'trade'` | `'hint-decision'` | EntscheidungsHinweis für B |
| `'trade-info'` | `'hint-small'` | Kleiner Hinweis für A |
| `'message'` | `'chat'` | Chat-Message |

### Neue Felder (Standardwerte)

- `isArchived: false` (für alle bestehenden Notifications)
- `isCompleted: false` (für alle bestehenden Notifications)

---

## 📊 Indizes

**WICHTIG:** Firestore-Indizes müssen erstellt werden für:

1. **Query: Ungelesene Notifications**
   ```
   Collection: users/{userId}/notifications
   Fields: isRead (ASC), createdAt (DESC)
   ```

2. **Query: Nicht-archivierte Notifications**
   ```
   Collection: users/{userId}/notifications
   Fields: isArchived (ASC), createdAt (DESC)
   ```

3. **Query: Nach Typ filtern**
   ```
   Collection: users/{userId}/notifications
   Fields: type (ASC), isRead (ASC), createdAt (DESC)
   ```

---

## 🔍 Filter-Logik

### Standard-Filter (für Badge-Berechnung)
```javascript
notifications.filter(n => 
  !n.isRead &&           // Nicht gelesen
  !n.isArchived &&       // Nicht archiviert
  supportedTypes.includes(n.type)  // Unterstützte Typen
)
```

### Typ-spezifische Filter
- **hint-decision**: `type === 'hint-decision' && !isArchived && !isCompleted`
- **hint-small**: `type === 'hint-small' && !isArchived && !isCompleted`
- **chat**: `type === 'chat' && !isArchived && senderId !== currentUserId`
- **system**: `type === 'system' && !isArchived`

---

## ✅ Validierung

### Erforderliche Felder
- `type` muss einer der unterstützten Typen sein: `'hint-decision'`, `'hint-small'`, `'chat'`, `'system'`
- `title` und `message` müssen vorhanden sein
- `isRead`, `isArchived`, `isCompleted` müssen boolean sein

### Typ-spezifische Validierung
- **hint-decision**: `requestId`, `fromUserId`, `toUserId` erforderlich
- **hint-small**: `requestId` erforderlich (oder `chatId` für Chat-verlassen)
- **chat**: `chatId`, `senderId`, `toUserId` erforderlich
- **system**: `systemType` erforderlich

---

## 📝 Beispiel-Dokumente

### Beispiel 1: hint-decision
```json
{
  "id": "notif_123",
  "type": "hint-decision",
  "title": "Tauschanfrage von Max Mustermann",
  "message": "Max Mustermann möchte deinen Wein \"Chardonnay 2020\" tauschen. Entscheide dich!",
  "isRead": false,
  "isArchived": false,
  "isCompleted": false,
  "priority": "high",
  "requestId": "trade_456",
  "fromUserId": "user_789",
  "fromUserName": "Max Mustermann",
  "toUserId": "user_012",
  "toUserName": "Anna Schmidt",
  "wineId": "wine_345",
  "wineTitle": "Chardonnay 2020",
  "createdAt": "2025-11-12T10:30:00Z"
}
```

### Beispiel 2: hint-small
```json
{
  "id": "notif_124",
  "type": "hint-small",
  "title": "Tausch involviert",
  "message": "Du bist in einen Tausch involviert: Du möchtest mit Anna Schmidt den Wein \"Riesling 2021\" tauschen",
  "isRead": false,
  "isArchived": false,
  "isCompleted": false,
  "priority": "high",
  "requestId": "trade_456",
  "fromUserId": "user_789",
  "fromUserName": "Max Mustermann",
  "toUserId": "user_012",
  "toUserName": "Anna Schmidt",
  "wineId": "wine_345",
  "wineTitle": "Riesling 2021",
  "createdAt": "2025-11-12T10:30:00Z"
}
```

### Beispiel 3: chat
```json
{
  "id": "notif_125",
  "type": "chat",
  "title": "Neue Nachricht von Anna Schmidt",
  "message": "Hallo, wann können wir uns treffen?",
  "isRead": false,
  "isArchived": false,
  "isCompleted": false,
  "priority": "medium",
  "chatId": "chat_678",
  "messageId": "msg_901",
  "senderId": "user_012",
  "senderName": "Anna Schmidt",
  "toUserId": "user_789",
  "fromUserId": "user_012",
  "messageText": "Hallo, wann können wir uns treffen?",
  "createdAt": "2025-11-12T10:35:00Z"
}
```

---

**Status:** ✅ Schema definiert, bereit für Implementierung

