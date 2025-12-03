# Konzept: KI-basierte Wein-Etikett-Erkennung

**Erstellt:** 02. Dezember 2025  
**Status:** Konzeptphase  
**Ziel:** Automatische Extraktion von Wein-Daten aus Etikett-Bildern

---

## 📋 Überblick

Das Ziel ist es, ein KI-System zu entwickeln, das Wein-Etiketten aus Bildern analysiert und automatisch alle relevanten Formularfelder ausfüllt:

- **Name des Weines** (z.B. "Riesling Spätlese")
- **Weingut** (z.B. "Weingut Müller")
- **Website** (falls vorhanden)
- **Jahrgang** (z.B. "2020")
- **Anbauregion** (z.B. "Mosel")
- **Rebsorte** (z.B. "Riesling")
- **Geschmacksrichtung** (z.B. "trocken", "halbtrocken", "süß")
- **Preis** (falls vorhanden)
- **Beschreibung** (optional, aus Etikett-Text generiert)

---

## 🎯 Anforderungen

### Funktionale Anforderungen
1. **Bild-Upload**: Benutzer kann ein oder mehrere Etikett-Bilder hochladen
2. **Automatische Analyse**: KI analysiert das erste Bild automatisch (oder auf Knopfdruck)
3. **Daten-Extraktion**: Alle relevanten Felder werden automatisch ausgefüllt
4. **Manuelle Korrektur**: Benutzer kann alle Felder nachträglich bearbeiten
5. **Feedback**: Fortschrittsanzeige während der Analyse

### Nicht-funktionale Anforderungen
- **Geschwindigkeit**: Analyse sollte < 5 Sekunden dauern
- **Genauigkeit**: Mindestens 80% Genauigkeit bei Standard-Etiketten
- **Offline-Fähigkeit**: Optional - kann auch Cloud-basiert sein
- **Kosten**: Möglichst kostengünstig (kostenlose Optionen bevorzugt)

---

## 🔧 Technische Ansätze

### Option 1: OCR + NLP (Optical Character Recognition + Natural Language Processing)

**Beschreibung:**
- OCR erkennt Text aus dem Bild
- NLP analysiert den Text und extrahiert strukturierte Daten

**Technologien:**
- **OCR**: Tesseract.js (kostenlos, offline), Google Cloud Vision API, AWS Textract
- **NLP**: spaCy, NLTK, oder einfache Regex-Patterns

**Vorteile:**
- ✅ Relativ einfach zu implementieren
- ✅ Tesseract.js ist kostenlos und offline nutzbar
- ✅ Gute Ergebnisse bei klaren, lesbaren Texten

**Nachteile:**
- ❌ Abhängig von Bildqualität und Text-Lesbarkeit
- ❌ Strukturierte Extraktion erfordert komplexe NLP-Logik
- ❌ Wein-spezifische Begriffe müssen manuell erkannt werden

**Implementierung:**
```javascript
// Pseudocode
1. Bild hochladen
2. OCR durchführen (Tesseract.js oder Cloud API)
3. Text analysieren mit NLP/Regex
4. Strukturierte Daten extrahieren
5. Formularfelder ausfüllen
```

**Kosten:** 
- Tesseract.js: Kostenlos
- Google Cloud Vision: ~$1.50 pro 1.000 Bilder
- AWS Textract: ~$1.50 pro 1.000 Bilder

---

### Option 2: Cloud Vision API (Google Cloud / AWS)

**Beschreibung:**
- Nutzung von Cloud-basierten Vision-APIs
- Kombination aus OCR und strukturierter Datenerkennung

**Technologien:**
- **Google Cloud Vision API**: OCR + Label Detection
- **AWS Rekognition**: Text Detection + Custom Labels
- **Azure Computer Vision**: OCR + Custom Models

**Vorteile:**
- ✅ Sehr hohe Genauigkeit
- ✅ Unterstützt verschiedene Sprachen
- ✅ Automatische Layout-Erkennung
- ✅ Kann auch Logos/Weingut-Erkennung unterstützen

**Nachteile:**
- ❌ Kostenpflichtig (ca. $1-2 pro 1.000 Bilder)
- ❌ Erfordert Internet-Verbindung
- ❌ Datenschutz-Bedenken (Bilder werden an Cloud gesendet)

**Implementierung:**
```javascript
// Pseudocode
1. Bild zu Cloud API senden
2. OCR + Label Detection durchführen
3. Strukturierte Daten zurückerhalten
4. Formularfelder ausfüllen
```

**Kosten:**
- Google Cloud Vision: ~$1.50 pro 1.000 Bilder (erste 1.000/Monat kostenlos)
- AWS Textract: ~$1.50 pro 1.000 Bilder
- Azure Computer Vision: ~$1.00 pro 1.000 Bilder

---

### Option 3: Custom ML Model (TensorFlow.js / PyTorch)

**Beschreibung:**
- Eigenes Machine-Learning-Modell trainieren
- Speziell für Wein-Etiketten optimiert

**Technologien:**
- **TensorFlow.js**: Client-seitiges ML (im Browser/App)
- **PyTorch**: Server-seitiges ML (Backend)
- **Custom Dataset**: Sammlung von Wein-Etiketten-Bildern

**Vorteile:**
- ✅ Höchste Genauigkeit bei Wein-spezifischen Daten
- ✅ Kann auch visuelle Elemente erkennen (Logos, Farben)
- ✅ TensorFlow.js kann offline laufen

**Nachteile:**
- ❌ Erfordert große Menge an Trainingsdaten (1000+ Etiketten)
- ❌ Komplexe Implementierung
- ❌ Regelmäßiges Re-Training nötig
- ❌ Hoher Entwicklungsaufwand

**Implementierung:**
```javascript
// Pseudocode
1. Dataset sammeln (Wein-Etiketten + Labels)
2. Modell trainieren (TensorFlow/PyTorch)
3. Modell in App integrieren (TensorFlow.js)
4. Bild analysieren
5. Strukturierte Daten extrahieren
```

**Kosten:**
- Entwicklung: Hoch (Zeitaufwand)
- Betrieb: Niedrig (kostenlos, wenn offline)

---

### Option 4: Hybrid-Ansatz (Empfohlen)

**Beschreibung:**
- Kombination aus mehreren Ansätzen
- Fallback-Mechanismen für bessere Genauigkeit

**Technologien:**
- **Primär**: Google Cloud Vision API (hohe Genauigkeit)
- **Fallback**: Tesseract.js (kostenlos, offline)
- **NLP**: Regex-Patterns + Wein-Datenbank-Lookup

**Vorteile:**
- ✅ Beste Genauigkeit durch Kombination
- ✅ Fallback bei API-Ausfällen
- ✅ Kostenoptimiert (kostenlose Optionen zuerst)
- ✅ Flexibel erweiterbar

**Nachteile:**
- ❌ Komplexere Implementierung
- ❌ Mehrere Dependencies

**Implementierung:**
```javascript
// Pseudocode
1. Bild hochladen
2. Versuche Google Cloud Vision API (wenn verfügbar)
3. Falls Fehler: Fallback zu Tesseract.js
4. Text mit Regex/NLP analysieren
5. Wein-Datenbank-Lookup für Validierung
6. Formularfelder ausfüllen
```

**Kosten:**
- Google Cloud Vision: ~$1.50 pro 1.000 Bilder (erste 1.000/Monat kostenlos)
- Tesseract.js: Kostenlos
- **Gesamt**: Sehr günstig für kleine bis mittlere Nutzung

---

## 📊 Vergleich der Ansätze

| Kriterium | OCR + NLP | Cloud Vision | Custom ML | Hybrid |
|-----------|-----------|--------------|-----------|--------|
| **Genauigkeit** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Geschwindigkeit** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Kosten** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Offline** | ✅ | ❌ | ✅ | ⚠️ (teilweise) |
| **Implementierung** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Wartbarkeit** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

---

## 🚀 Empfohlene Implementierung (Phase 1)

### Phase 1: MVP mit Google Cloud Vision API

**Ziel:** Schnelle Implementierung mit hoher Genauigkeit

**Schritte:**
1. Google Cloud Vision API einrichten
2. Service-Funktion erstellen: `services/wineLabelAnalyzer.js`
3. Integration in `MeinWeinregalBefuellenKIScreen.js`
4. Error-Handling und Fallback implementieren

**Code-Struktur:**
```javascript
// services/wineLabelAnalyzer.js
export const analyzeWineLabel = async (imageUri) => {
  // 1. Bild zu Base64 konvertieren
  // 2. Google Cloud Vision API aufrufen
  // 3. Text extrahieren
  // 4. Strukturierte Daten parsen
  // 5. Ergebnis zurückgeben
};
```

**Kosten:** 
- Erste 1.000 Bilder/Monat kostenlos
- Danach: ~$1.50 pro 1.000 Bilder

---

### Phase 2: Erweiterung mit Tesseract.js Fallback

**Ziel:** Offline-Fähigkeit und Kostenreduzierung

**Schritte:**
1. Tesseract.js in App integrieren
2. Fallback-Logik implementieren
3. Performance-Optimierung

**Code-Struktur:**
```javascript
// services/wineLabelAnalyzer.js
export const analyzeWineLabel = async (imageUri, useCloud = true) => {
  if (useCloud && hasInternetConnection()) {
    try {
      return await analyzeWithCloudVision(imageUri);
    } catch (error) {
      console.warn('Cloud Vision fehlgeschlagen, Fallback zu Tesseract');
    }
  }
  return await analyzeWithTesseract(imageUri);
};
```

---

### Phase 3: NLP-Verbesserung

**Ziel:** Bessere Datenextraktion aus unstrukturiertem Text

**Schritte:**
1. Regex-Patterns für Wein-Daten erstellen
2. Wein-Datenbank-Lookup für Validierung
3. Machine-Learning für bessere Erkennung

---

## 📝 Implementierungs-Details

### Datenstruktur

```javascript
// Erwartetes Ergebnis der KI-Analyse
const analysisResult = {
  wineName: 'Riesling Spätlese',
  winery: 'Weingut Müller',
  website: 'www.weingut-mueller.de',
  vintage: '2020',
  region: 'Mosel',
  grapeVariety: 'Riesling',
  tasteProfile: 'trocken',
  price: '15.99',
  description: 'Frischer Riesling mit mineralischen Noten',
  confidence: 0.85, // Konfidenz-Score (0-1)
  rawText: '...', // Vollständiger OCR-Text
};
```

### Error-Handling

```javascript
// Fehlerbehandlung
try {
  const result = await analyzeWineLabel(imageUri);
  if (result.confidence < 0.5) {
    Alert.alert('Niedrige Genauigkeit', 'Bitte überprüfen Sie die erkannten Daten.');
  }
  // Formularfelder ausfüllen
} catch (error) {
  Alert.alert('Fehler', 'Die Analyse konnte nicht durchgeführt werden. Bitte füllen Sie die Felder manuell aus.');
}
```

---

## 🔐 Datenschutz & Sicherheit

### Datenschutz-Bedenken
- **Cloud-APIs**: Bilder werden an externe Server gesendet
- **Lösung**: 
  - Nutzer informieren (Datenschutzerklärung)
  - Optional: Nur lokale Verarbeitung (Tesseract.js)
  - Bilder nach Analyse löschen

### Sicherheit
- **API-Keys**: Nicht im Client-Code speichern
- **Lösung**: 
  - Backend-Proxy für API-Aufrufe
  - API-Keys nur auf Server

---

## 📈 Metriken & Monitoring

### Zu trackende Metriken
- **Genauigkeit**: Wie viele Felder korrekt erkannt wurden
- **Geschwindigkeit**: Durchschnittliche Analyse-Zeit
- **Fehlerrate**: Anzahl fehlgeschlagener Analysen
- **Nutzer-Feedback**: Manuelle Korrekturen als Trainingsdaten

### Monitoring
- Logging aller Analysen
- Fehler-Tracking
- Performance-Monitoring

---

## 🎯 Nächste Schritte

1. **Entscheidung treffen**: Welcher Ansatz soll implementiert werden?
2. **API-Setup**: Google Cloud Vision API einrichten (falls gewählt)
3. **Service erstellen**: `services/wineLabelAnalyzer.js` implementieren
4. **Integration**: In `MeinWeinregalBefuellenKIScreen.js` integrieren
5. **Testing**: Mit echten Wein-Etiketten testen
6. **Optimierung**: Basierend auf Feedback verbessern

---

## 📚 Ressourcen

### Dokumentation
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [AWS Textract](https://aws.amazon.com/textract/)
- [TensorFlow.js](https://www.tensorflow.org/js)

### Beispiel-Implementierungen
- [React Native OCR](https://github.com/ashrithks/react-native-text-recognition)
- [Tesseract.js React Native](https://github.com/jonathanpalma/react-native-tesseract-ocr)

---

**Status:** Konzept abgeschlossen, bereit für Implementierung  
**Nächster Schritt:** Entscheidung über Ansatz und API-Setup

