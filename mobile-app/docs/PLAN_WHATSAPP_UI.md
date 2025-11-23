# Plan: WhatsApp-ähnliche UI für ChatListScreen und HinweisScreen

**Datum:** 12.11.25  
**Status:** Planung

## Ziel

Umgestaltung von `ChatListScreen` und `HinweisScreen` zu einer WhatsApp-ähnlichen Listenansicht mit:
- Liste statt Grid-Layout
- Weinbild des anderen Users (nicht der eigene Wein) als Profilbild links
- Name des Chatpartners
- Letzte Nachricht
- Zeitstempel
- Sichtbare Badges für ungelesene Nachrichten/Hinweise

---

## Aktueller Zustand

### ChatListScreen
- **Layout:** Grid-Design mit großen Bildern (aspectRatio: 2)
- **Anzeige:** Zwei Weinbilder nebeneinander mit Tausch-Icon in der Mitte
- **Info:** Overlay am unteren Rand mit Titel, letzter Nachricht und Zeit
- **Badge:** Ungelesene Nachrichten als Overlay oben rechts

### HinweisScreen
- **Layout:** Grid-Design ähnlich wie ChatListScreen
- **Anzeige:** Zwei Weinbilder nebeneinander (ohne Tausch-Icon)
- **Info:** Overlay am unteren Rand
- **Badge:** Ungelesene Hinweise als Overlay oben rechts

---

## Gewünschter Zustand (WhatsApp-ähnlich)

### Layout-Struktur
```
┌─────────────────────────────────────────┐
│ [Weinbild] Name des Partners        Zeit │
│           Letzte Nachricht...      [Badge]│
└─────────────────────────────────────────┘
```

### Komponenten pro Zeile:
1. **Weinbild (links, rund, ~60px):**
   - Zeigt das Weinbild des **anderen Users** (nicht der eigene)
   - Für Tausch-Chats: Wein, den der andere User anbietet (wineFrom aus Sicht des anderen)
   - Für Hinweise: Wein, den der andere User anbietet
   - Fallback: Avatar oder Icon wenn kein Weinbild vorhanden

2. **Name (oben links):**
   - Name des Chatpartners (bereits implementiert via `getOtherParticipantName`)
   - Fett formatiert
   - Für Hinweise: "Tauschanfrage von [Name]" oder ähnlich

3. **Letzte Nachricht (unten links):**
   - Vorschau der letzten Nachricht (max. 1-2 Zeilen)
   - Abgeschnitten mit "..."
   - Grauer Text

4. **Zeitstempel (oben rechts):**
   - Format: "HH:MM" oder "Gestern", "Heute"
   - Kleine Schrift

5. **Badge (unten rechts):**
   - Runder Badge mit Anzahl ungelesener Nachrichten
   - Nur sichtbar wenn `unreadCount > 0`
   - Roter Hintergrund

---

## Implementierungsplan

### Phase 1: Layout-Umstellung (ChatListScreen)

#### 1.1 Styles anpassen
- **Entfernen:**
  - `chatRow` mit `aspectRatio: 2`
  - `rowImageOnlyContainer`
  - `wineImagesContainer` (zwei Bilder nebeneinander)
  - `rowImageOverlay` (Overlay am unteren Rand)

- **Hinzufügen:**
  - `chatListItem`: Horizontales Layout (flexDirection: 'row')
  - `chatListImage`: Rundes Weinbild links (~60px)
  - `chatListContent`: Flex-Container für Text rechts
  - `chatListHeader`: Name und Zeitstempel (flexDirection: 'row', justifyContent: 'space-between')
  - `chatListMessage`: Letzte Nachricht
  - `chatListBadge`: Badge für ungelesene Nachrichten

#### 1.2 Weinbild-Logik
- **Funktion erstellen:** `getOtherUserWineImage(chat)`
  - Bestimmt, welches Weinbild gezeigt werden soll
  - Für Tausch-Chats:
    - Wenn aktueller User = fromUser → zeige `wineTo` (Wein, den der andere haben möchte)
    - Wenn aktueller User = toUser → zeige `wineFrom` (Wein, den der andere anbietet)
  - Fallback: Avatar oder Icon

#### 1.3 Sortierung
- **Sortierung nach:** `lastMessageTime` oder `updatedAt` (neueste zuerst)
- **Implementierung:** `useMemo` für sortierte Liste

#### 1.4 Zeitstempel-Formatierung
- **Funktion erstellen:** `formatMessageTime(timestamp)`
  - Heute: "HH:MM"
  - Gestern: "Gestern"
  - Älter: "DD.MM.YYYY" oder "DD.MM"

### Phase 2: Layout-Umstellung (HinweisScreen)

#### 2.1 Gleiche Anpassungen wie ChatListScreen
- Styles anpassen
- Weinbild-Logik implementieren
- Sortierung hinzufügen
- Zeitstempel-Formatierung

#### 2.2 Spezielle Behandlung für Hinweise
- **Titel:** "Tauschanfrage von [Name]" statt nur Name
- **Icon/Badge:** Optionales Icon für Hinweis-Typ (trade-decision, trade-involved)

### Phase 3: Optimierungen

#### 3.1 Performance
- `FlatList` statt `ScrollView` + `map` für bessere Performance bei vielen Chats
- `useMemo` für sortierte Listen
- Bild-Caching optimieren

#### 3.2 UX-Verbesserungen
- **Pull-to-Refresh:** Liste aktualisieren
- **Swipe-Actions:** Optional: Chat nach links wischen zum Löschen
- **Haptic Feedback:** Vibration beim Antippen

---

## Technische Details

### Weinbild-Logik (ChatListScreen)

```javascript
const getOtherUserWineImage = (chat) => {
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.uid;
  const chatWineImages = wineImages[chat.id] || {};
  
  if (!chat.tradeRequestId) {
    // Kein Tausch-Chat → Avatar oder Icon
    return chat.participantAvatar || null;
  }
  
  // Lade Trade-Request, um fromUserId/toUserId zu bestimmen
  // Wenn currentUserId === fromUserId → zeige wineTo (Wein, den der andere haben möchte)
  // Wenn currentUserId === toUserId → zeige wineFrom (Wein, den der andere anbietet)
  
  // Vereinfacht: Zeige immer wineFrom (Wein, den der andere anbietet)
  // Oder: Zeige wineTo (Wein, den der andere haben möchte)
  // TODO: Trade-Request laden, um Perspektive zu bestimmen
  return chatWineImages.wineFromImage || chatWineImages.wineToImage || null;
};
```

### Zeitstempel-Formatierung

```javascript
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffTime = now - messageDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Heute: "HH:MM"
    return messageDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Gestern';
  } else if (diffDays < 7) {
    // Diese Woche: "Mo", "Di", etc.
    return messageDate.toLocaleDateString('de-DE', { weekday: 'short' });
  } else {
    // Älter: "DD.MM.YYYY"
    return messageDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
};
```

### Neue Styles (Beispiel)

```javascript
chatListItem: {
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: '#FFFFFF',
  borderBottomWidth: 1,
  borderBottomColor: '#E0E0E0',
},
chatListImage: {
  width: 60,
  height: 60,
  borderRadius: 30,
  marginRight: 12,
  backgroundColor: '#F5F5F5',
},
chatListContent: {
  flex: 1,
  justifyContent: 'center',
},
chatListHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
},
chatListName: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#000000',
},
chatListTime: {
  fontSize: 12,
  color: '#666666',
},
chatListMessage: {
  fontSize: 14,
  color: '#666666',
  numberOfLines: 2,
},
chatListBadge: {
  position: 'absolute',
  right: 16,
  top: '50%',
  transform: [{ translateY: -10 }],
  backgroundColor: '#F44336',
  borderRadius: 12,
  minWidth: 24,
  height: 24,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 6,
},
```

---

## Offene Fragen / Entscheidungen

1. **Weinbild-Perspektive:**
   - Soll das Weinbild des anderen Users immer `wineFrom` sein (Wein, den der andere anbietet)?
   - Oder soll es kontextabhängig sein (z.B. `wineTo` wenn der aktuelle User der Empfänger ist)?

2. **Sortierung:**
   - Nach `lastMessageTime` oder `updatedAt`?
   - Sollen ungelesene Chats/Hinweise oben stehen?

3. **Hinweise:**
   - Sollen Hinweise und Chats unterschiedlich aussehen?
   - Oder einheitliches Design?

4. **Performance:**
   - `FlatList` sofort implementieren oder erst später optimieren?

---

## Nächste Schritte

1. ✅ Plan dokumentiert
2. ⏳ Layout-Umstellung ChatListScreen (Phase 1)
3. ⏳ Layout-Umstellung HinweisScreen (Phase 2)
4. ⏳ Optimierungen (Phase 3)
5. ⏳ Testing & Feedback

---

## Referenzen

- WhatsApp UI/UX Design Guidelines
- React Native `FlatList` Dokumentation
- Aktuelle Implementierung: `ChatListScreen.js`, `HinweisScreen.js`

