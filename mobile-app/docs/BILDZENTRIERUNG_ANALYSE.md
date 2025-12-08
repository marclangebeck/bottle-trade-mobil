# Analyse: Bildzentrierung in der Galerieansicht

## Problem
Die Bilder in der Galerieansicht sind nicht zentriert innerhalb ihrer Container.

## Aktuelle Struktur

### Komponenten-Hierarchie
```
ScrollView (horizontal, pagingEnabled)
  └─ View (modalImageWrapper/imageGalleryItem) - Container für jedes Bild
      └─ OptimizedImage
          └─ View (Container mit containerStyle) - Wrapper-View
              └─ Image (mit imageStyle) - Das eigentliche Bild
```

### Aktuelle Styles

#### WeinboerseScreen / MeinWeinregalScreen
```javascript
modalImageWrapper: {
  height: 250,
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'transparent',
}

modalImage: {
  width: '100%',      // ❌ Problem: Füllt gesamten Container
  height: 250,        // ❌ Problem: Füllt gesamten Container
  justifyContent: 'center',
  alignItems: 'center',
}
```

#### OptimizedImage Komponente
```javascript
// Container-Style (View-Wrapper)
containerStyle = {
  ...styleObj,                    // Enthält width: '100%', height: 250
  justifyContent: 'center',
  alignItems: 'center',
}

// Image-Style
imageStyle = {
  ...imageStyleProps,             // Enthält width: '100%', height: 250
  opacity: isLoading ? 0 : 1,
}
```

## Problem-Analyse

### Warum funktioniert es nicht?

1. **Image hat feste Dimensionen:**
   - `width: '100%'` und `height: 250` werden direkt auf das `<Image>` Element angewendet
   - Das Image füllt den gesamten Container aus (100% Breite, 250px Höhe)
   - `resizeMode="contain"` skaliert das Bild innerhalb dieser Dimensionen, aber das Image-Element selbst hat immer noch die volle Größe

2. **Container vs. Image:**
   - Der View-Container hat `justifyContent: 'center'` und `alignItems: 'center'`
   - ABER: Das Image-Element hat `width: '100%'` und `height: '100%'`, also füllt es den Container vollständig aus
   - Die Zentrierung des Containers hat keine Wirkung, weil das Image den Container vollständig ausfüllt

3. **resizeMode="contain" Verhalten:**
   - `resizeMode="contain"` skaliert den **Inhalt** des Bildes (die Bilddaten)
   - Es ändert NICHT die Größe des Image-Elements selbst
   - Das Image-Element behält seine festen Dimensionen (`width: '100%'`, `height: 250`)

## Lösungsansätze

### Lösung 1: Image ohne feste Dimensionen (Empfohlen)

**Konzept:** Das Image-Element sollte keine festen Dimensionen haben, sondern nur maximale Dimensionen. Der Container behält die festen Dimensionen und zentriert das Image.

```javascript
// OptimizedImage.js
const containerStyle = {
  width: width || '100%',        // Container hat feste Dimensionen
  height: height || 250,
  justifyContent: 'center',
  alignItems: 'center',
}

const imageStyle = resizeMode === 'contain' ? {
  // Keine festen Dimensionen für das Image
  // Nur maximale Dimensionen, damit es nicht größer wird als der Container
  maxWidth: '100%',
  maxHeight: '100%',
  // Aspect Ratio beibehalten
  aspectRatio: undefined,  // Wird vom Bild selbst bestimmt
  opacity: isLoading ? 0 : 1,
} : {
  width: width || '100%',
  height: height || 250,
  opacity: isLoading ? 0 : 1,
}
```

**Problem:** `maxWidth` und `maxHeight` funktionieren in React Native nicht immer zuverlässig.

### Lösung 2: Image mit aspectRatio (Besser)

**Konzept:** Das Image behält sein natürliches Seitenverhältnis und wird innerhalb des Containers zentriert.

```javascript
// OptimizedImage.js - Image-Style für contain
const imageStyle = resizeMode === 'contain' ? {
  width: '100%',           // Kann 100% sein, wird durch aspectRatio begrenzt
  height: undefined,       // Wird durch aspectRatio berechnet
  aspectRatio: undefined,  // Wird vom Bild selbst bestimmt
  opacity: isLoading ? 0 : 1,
} : {
  width: width || '100%',
  height: height || 250,
  opacity: isLoading ? 0 : 1,
}
```

**Problem:** `aspectRatio: undefined` funktioniert nicht - wir müssen das Seitenverhältnis kennen.

### Lösung 3: Zwei-Container-Ansatz (Am Besten)

**Konzept:** Zwei verschachtelte Container:
- Äußerer Container: Feste Dimensionen, zentriert
- Innerer Container: Passt sich dem Bild an, zentriert innerhalb des äußeren
- Image: Natürliche Größe oder maximale Größe

```javascript
// OptimizedImage.js
return (
  <View style={containerStyle}>  // Äußerer Container: width: '100%', height: 250, zentriert
    <View style={{                // Innerer Container: Zentriert, passt sich Bild an
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    }}>
      <Image
        source={source}
        style={resizeMode === 'contain' ? {
          maxWidth: '100%',
          maxHeight: '100%',
          width: undefined,
          height: undefined,
        } : imageStyle}
        resizeMode={resizeMode}
        ...
      />
    </View>
  </View>
)
```

**Problem:** `maxWidth`/`maxHeight` mit `width: undefined` funktioniert in React Native nicht.

### Lösung 4: Image mit flex (Optimal)

**Konzept:** Container hat feste Dimensionen, Image verwendet flex für flexible Größe.

```javascript
// OptimizedImage.js
const containerStyle = {
  width: width || '100%',
  height: height || 250,
  justifyContent: 'center',
  alignItems: 'center',
}

const imageStyle = resizeMode === 'contain' ? {
  flex: 0,                    // Kein flex, damit es sich nicht ausdehnt
  alignSelf: 'center',        // Zentriert sich selbst
  // Keine width/height, damit es natürliche Größe behält
  opacity: isLoading ? 0 : 1,
} : {
  width: width || '100%',
  height: height || 250,
  opacity: isLoading ? 0 : 1,
}
```

**Problem:** Ohne width/height wird das Image möglicherweise zu groß oder zu klein.

### Lösung 5: Image mit aspectRatio-Berechnung (Komplex)

**Konzept:** Bild-URL laden, Dimensionen ermitteln, aspectRatio berechnen.

**Problem:** Zu komplex, erfordert zusätzliche Bibliotheken oder API-Calls.

## Empfohlene Lösung: Kombination aus Lösung 3 und 4

### Implementierung

```javascript
// OptimizedImage.js
const styleObj = Array.isArray(style) ? Object.assign({}, ...style.filter(s => s)) : (style || {});
const { justifyContent, alignItems, width, height, ...imageStyleProps } = styleObj;

// Container-Style: Feste Dimensionen, zentriert
const containerStyle = {
  width: width || '100%',
  height: height || 250,
  justifyContent: 'center',
  alignItems: 'center',
};

// Image-Style: Bei "contain" keine festen Dimensionen
const imageStyle = resizeMode === 'contain' ? {
  // Keine width/height, damit das Image seine natürliche Größe behält
  // Wird durch resizeMode="contain" innerhalb des Containers skaliert
  opacity: isLoading ? 0 : 1,
} : {
  ...imageStyleProps,
  width: width || '100%',
  height: height || 250,
  opacity: isLoading ? 0 : 1,
};

return (
  <View style={containerStyle}>
    <Image
      source={source}
      style={imageStyle}
      resizeMode={resizeMode}
      ...
    />
  </View>
)
```

**ABER:** Ohne width/height wird das Image möglicherweise nicht richtig skaliert.

### Besser: Image mit Container-Dimensionen, aber flexibler Skalierung

```javascript
// OptimizedImage.js
const imageStyle = resizeMode === 'contain' ? {
  width: '100%',
  height: '100%',
  // resizeMode="contain" sorgt dafür, dass das Bild innerhalb dieser Dimensionen
  // skaliert wird, aber das Image-Element selbst füllt den Container
  // Das ist das Problem!
  opacity: isLoading ? 0 : 1,
} : { ... };
```

## Die eigentliche Lösung: Image-Element-Größe anpassen

Das Problem ist, dass `resizeMode="contain"` den **Inhalt** skaliert, nicht das **Element**. Wir müssen das Image-Element selbst kleiner machen als den Container.

### Finale Lösung: Image mit berechneten Dimensionen

```javascript
// OptimizedImage.js
const imageStyle = resizeMode === 'contain' ? {
  // Image sollte die Container-Dimensionen haben
  // resizeMode="contain" skaliert den Inhalt innerhalb dieser Dimensionen
  // ABER: Das Image-Element selbst füllt den Container
  // Lösung: Image-Element sollte flexibel sein
  width: '100%',
  height: '100%',
  // Problem: Das füllt den Container vollständig aus
  
  // Alternative: Image mit aspectRatio
  // width: '100%',
  // aspectRatio: 1,  // Aber wir kennen das Seitenverhältnis nicht
  
  opacity: isLoading ? 0 : 1,
} : { ... };
```

## Beste Lösung: Image-Element-Größe = Container-Größe, aber Inhalt zentriert

Das Image-Element sollte die Container-Größe haben, aber der **Inhalt** (das eigentliche Bild) wird durch `resizeMode="contain"` zentriert. Das Problem ist, dass das Image-Element selbst den Container vollständig ausfüllt.

**Die Lösung:** Das Image-Element sollte NICHT die volle Container-Größe haben, sondern nur so groß sein wie nötig, und dann innerhalb des Containers zentriert werden.

Aber: React Native's Image-Komponente funktioniert nicht so. `resizeMode="contain"` skaliert den Inhalt, aber das Element behält seine Größe.

## Finale Erkenntnis

Das Problem ist ein **fundamentales Verhalten von React Native's Image-Komponente**:
- `resizeMode="contain"` skaliert den **Bildinhalt**, nicht das **Image-Element**
- Das Image-Element behält immer seine festen Dimensionen
- Die Zentrierung muss durch den Container erfolgen, aber das Image füllt den Container aus

**Die einzige Lösung:** Das Image-Element muss kleiner sein als der Container, oder wir müssen einen anderen Ansatz verwenden.

## Empfohlene Implementierung

Verwende einen **inneren Container** mit flexibler Größe:

```javascript
// OptimizedImage.js
return (
  <View style={containerStyle}>  // width: '100%', height: 250, zentriert
    <View style={{
      justifyContent: 'center',
      alignItems: 'center',
      // Keine festen Dimensionen, passt sich dem Bild an
    }}>
      <Image
        source={source}
        style={{
          // Image mit natürlicher Größe oder maximaler Größe
          maxWidth: width || '100%',
          maxHeight: height || 250,
          // width und height werden vom Bild selbst bestimmt
        }}
        resizeMode={resizeMode}
        ...
      />
    </View>
  </View>
)
```

**Aber:** `maxWidth`/`maxHeight` ohne `width`/`height` funktioniert in React Native nicht zuverlässig.

## Die tatsächliche Lösung

Wir müssen das Image-Element so konfigurieren, dass es:
1. Die Container-Dimensionen hat (für `pagingEnabled` in ScrollView)
2. Aber der Inhalt zentriert ist

Das ist bereits der Fall mit `resizeMode="contain"` - der Inhalt IST zentriert. Das Problem muss woanders liegen.

**Mögliche Ursachen:**
1. Der Container selbst ist nicht zentriert
2. Das Image-Element hat zusätzliche Styles, die die Zentrierung überschreiben
3. Die ScrollView-Items sind nicht richtig konfiguriert

## Nächste Schritte

1. Überprüfe, ob der Container wirklich zentriert ist
2. Überprüfe, ob das Image-Element zusätzliche Styles hat
3. Teste mit einem einfachen Beispiel ohne OptimizedImage
4. Verwende `onLayout` um die tatsächlichen Dimensionen zu überprüfen

## Finale Lösung: Image-Element mit Container-Dimensionen

Das Problem ist, dass `resizeMode="contain"` den **Bildinhalt** zentriert, aber das **Image-Element** selbst die volle Container-Größe hat. Das ist das erwartete Verhalten von React Native.

**Die Lösung:** Das Image-Element SOLL die Container-Dimensionen haben. `resizeMode="contain"` sorgt dafür, dass der Bildinhalt innerhalb dieser Dimensionen zentriert ist.

**Wenn die Bilder trotzdem nicht zentriert erscheinen, liegt das Problem woanders:**

1. **Container ist nicht zentriert:** Der `modalImageWrapper` muss `justifyContent: 'center'` und `alignItems: 'center'` haben
2. **ScrollView-Items sind nicht richtig konfiguriert:** Die Items müssen die volle Bildschirmbreite haben für `pagingEnabled`
3. **Image-Style überschreibt Zentrierung:** Der Image-Style sollte keine `justifyContent` oder `alignItems` haben (diese gehören zum Container)

## Implementierte Lösung

Die OptimizedImage-Komponente wurde so angepasst, dass:
- Der Container immer `justifyContent: 'center'` und `alignItems: 'center'` hat
- Das Image-Element die Container-Dimensionen hat
- `resizeMode="contain"` sorgt für die Zentrierung des Bildinhalts

**Wenn es immer noch nicht funktioniert, überprüfe:**
1. Ob die `modalImageWrapper` Styles richtig angewendet werden
2. Ob die ScrollView-Items die richtige Breite haben
3. Ob es zusätzliche Styles gibt, die die Zentrierung überschreiben

