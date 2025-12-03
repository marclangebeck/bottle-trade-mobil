# Firestore Index erstellen

## Problem
Die App zeigt eine Warnung, dass ein Firestore Composite Index fehlt:
```
⚠️ Firestore Index fehlt, verwende Fallback (Sortierung im Code)
💡 Erstelle den Index hier: [URL]
```

## Lösung

### Automatisch (Empfohlen)
1. Öffne die Firebase Console: https://console.firebase.google.com/
2. Wähle das Projekt: `bottle-trade-app`
3. Gehe zu **Firestore Database** → **Indexes**
4. Klicke auf den Link aus der Warnung in den Logs
5. Der Index wird automatisch erstellt

### Manuell
1. Öffne die Firebase Console: https://console.firebase.google.com/
2. Wähle das Projekt: `bottle-trade-app`
3. Gehe zu **Firestore Database** → **Indexes**
4. Klicke auf **Create Index**
5. Konfiguriere den Index:
   - **Collection ID**: `orders`
   - **Fields to index**:
     - `userId` (Ascending)
     - `createdAt` (Descending)
   - **Query scope**: Collection
6. Klicke auf **Create**

## Index-Details
- **Collection**: `orders`
- **Fields**:
  - `userId` (Ascending)
  - `createdAt` (Descending)

## Warum wird dieser Index benötigt?
Die App fragt Bestellungen ab mit:
```javascript
where('userId', '==', userId).orderBy('createdAt', 'desc')
```

Firestore benötigt einen Composite Index für Queries mit `where` + `orderBy` auf verschiedenen Feldern.

## Nach dem Erstellen
- Der Index wird in wenigen Minuten erstellt
- Die Warnung verschwindet automatisch
- Die App verwendet dann den Index statt der Fallback-Sortierung im Code


