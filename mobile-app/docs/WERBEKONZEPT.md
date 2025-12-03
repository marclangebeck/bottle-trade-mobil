# 🎯 Werbekonzept für Bottle-Trade App

**Erstellt:** 30. November 2025  
**Ziel:** Monetarisierung der App durch Werbung ohne Beeinträchtigung der User Experience

---

## 📊 Executive Summary

Die Bottle-Trade App soll durch ein **hybrides Werbemodell** monetarisiert werden, das verschiedene Werbeformate intelligent platziert und die User Experience respektiert. Das Konzept basiert auf **Native Advertising**, **Banner-Werbung** und **Rewarded Ads** mit Fokus auf relevante Zielgruppen (Weinliebhaber, Weingüter, Gastronomie).

---

## 🎨 Werbeformate & Platzierungen

### 1. **Native Banner-Werbung (Non-Intrusive)**

#### Platzierungen:
- **Weinbörse (WeinboerseScreen)**
  - Position: Zwischen Wein-Listings (jedes 5. Listing)
  - Format: 320x250px Banner
  - Design: Integriert ins Design-System (dunkler Hintergrund, goldene Akzente)
  - Label: "Werbung" oder "Anzeige" (dezent, klein)

- **CommunityScreen**
  - Position: Unter den Community-Kacheln
  - Format: 320x100px Banner
  - Rotation: Alle 30 Sekunden

- **DashboardScreen**
  - Position: Unter den Quick-Stats
  - Format: 320x250px Banner
  - Frequenz: Max. 1x pro Session

#### Vorteile:
✅ Nicht störend  
✅ Integriert ins Design  
✅ Hohe Sichtbarkeit  
✅ Gute CTR (Click-Through-Rate)

---

### 2. **Interstitial Ads (Full-Screen)**

#### Platzierungen:
- **Beim Screen-Wechsel** (nicht bei jedem Wechsel!)
  - Nach 3-4 Screen-Wechseln
  - Nur bei wichtigen Übergängen:
    - Weinbörse → Wein-Detail
    - Community → User-Profil
    - Dashboard → Weinregal
  - **NICHT bei:**
    - Bottom-Navigation-Wechsel
    - Zurück-Navigation
    - Login/Logout

- **Nach erfolgreichen Aktionen:**
  - Nach Wein-Tausch abgeschlossen
  - Nach Wein hinzugefügt
  - Nach Profil aktualisiert

#### Timing:
- Max. 1x alle 5 Minuten
- Max. 3x pro Session
- Skip-Button nach 5 Sekunden

#### Vorteile:
✅ Hohe Einnahmen  
✅ Vollständige Aufmerksamkeit  
⚠️ Kann störend sein → daher limitiert

---

### 3. **Rewarded Video Ads (Belohnungssystem)**

#### Integration mit BTP (Bottle Trade Points):
- **Option 1: BTP verdienen durch Werbung**
  - Button im BTPScreen: "BTP durch Werbung verdienen"
  - 1 Video = 10-50 BTP (je nach Video-Länge)
  - Max. 3 Videos pro Tag
  - Cooldown: 1 Stunde zwischen Videos

- **Option 2: Premium-Features freischalten**
  - Werbung schauen → 1 Stunde Premium-Features
  - Premium-Features:
    - Erweiterte Suchfilter
    - Mehr Wein-Listings sichtbar
    - Priorität bei Trade-Requests
    - Keine Banner-Werbung

#### Vorteile:
✅ Freiwillig (User entscheidet)  
✅ Win-Win (User bekommt BTP, App bekommt Einnahmen)  
✅ Hohe Completion-Rate  
✅ Bessere User-Akzeptanz

---

### 4. **Native Sponsored Content**

#### Integration:
- **Weinbörse:**
  - Sponsored Wein-Listings (markiert als "Empfohlen" oder "Partner")
  - Weingüter können ihre Weine promoten
  - Design: Subtiler Gold-Rahmen oder Badge

- **CommunityScreen:**
  - Sponsored Weingüter-Kachel
  - Highlight für Partner-Weingüter
  - Direkter Link zum Weingut-Profil

- **Schwarzes Brett:**
  - Sponsored Ankündigungen
  - Markiert als "Partner-Anzeige"

#### Vorteile:
✅ Sehr gut integriert  
✅ Hohe Relevanz (Wein-bezogen)  
✅ Gute Akzeptanz  
✅ Direkte Monetarisierung mit Weingütern

---

### 5. **Banner am Screen-Bottom (Persistent)**

#### Platzierung:
- **Alle Haupt-Screens** (außer Admin)
- Position: Über der BottomNavigation (nicht darüber!)
- Format: 320x50px Banner
- Design: Dunkler Hintergrund, dezente Animation
- Close-Button: Optional (nach 10 Sekunden)

#### Vorteile:
✅ Immer sichtbar  
✅ Nicht störend (unten)  
✅ Gute Einnahmen  
⚠️ Kann nerven → daher Close-Button

---

## 🎯 Targeting & Relevanz

### Zielgruppen für Werbung:
1. **Weinliebhaber:**
   - Wein-Accessoires
   - Weingläser
   - Weinkühlschränke
   - Wein-Events

2. **Weingüter:**
   - Marketing-Tools
   - Wein-Verkaufsplattformen
   - Weingut-Ausrüstung

3. **Gastronomie:**
   - Restaurant-Ausrüstung
   - Gastronomie-Software
   - Wein-Seminare

4. **Lifestyle:**
   - Premium-Produkte
   - Events & Veranstaltungen
   - Genuss-Magazine

### Targeting-Parameter:
- **Geografisch:** Basierend auf User-PLZ
- **Demografisch:** Alter, Geschlecht (wenn verfügbar)
- **Interessen:** Basierend auf Wein-Präferenzen
- **Verhalten:** Aktive Trader vs. Passive User

---

## 💰 Monetarisierungs-Strategie

### Einnahmequellen:
1. **Ad Networks (Programmatic):**
   - Google AdMob (Empfohlen für React Native)
   - Facebook Audience Network
   - Unity Ads
   - AppLovin MAX (Mediation)

2. **Direct Sales (Native Sponsored Content):**
   - Direkte Deals mit Weingütern
   - Sponsoring-Pakete
   - Premium-Listings

3. **Hybrid-Modell:**
   - 70% Programmatic Ads
   - 30% Direct Sales

### Einnahmen-Schätzung (bei 10.000 DAU):
- **Banner-Werbung:** €0.50-2.00 CPM
- **Interstitial:** €2.00-5.00 CPM
- **Rewarded Video:** €5.00-15.00 CPM
- **Native Sponsored:** €50-200 pro Monat (pro Partner)

**Geschätzte monatliche Einnahmen:** €500-2.000 (je nach Ad-Fill-Rate)

---

## 🛡️ User Experience & Akzeptanz

### Prinzipien:
1. **Werbung darf nicht stören**
   - Keine Werbung bei kritischen Aktionen
   - Keine Werbung bei Login/Logout
   - Keine Werbung bei Fehlern

2. **Transparenz**
   - Klare Kennzeichnung ("Werbung", "Anzeige")
   - Datenschutz-Hinweise
   - Opt-Out-Möglichkeit (Premium)

3. **Relevanz**
   - Nur relevante Werbung (Wein-bezogen)
   - Keine unpassenden Inhalte
   - Qualitätskontrolle

4. **Kontrolle für User**
   - Close-Buttons wo möglich
   - Skip-Optionen bei Videos
   - Premium-Option (Werbung entfernen)

---

## 🎁 Premium-Modell (Optional)

### Premium-Features:
- **Keine Werbung** (außer Rewarded Ads)
- Erweiterte Suchfilter
- Mehr Wein-Listings
- Priorität bei Trade-Requests
- Erweiterte Statistiken
- Premium-Badge im Profil

### Preis:
- **Monatlich:** €4.99
- **Jährlich:** €39.99 (33% Rabatt)
- **Lifetime:** €99.99 (einmalig)

### Alternative:
- **BTP-basiert:** 500 BTP = 1 Monat Premium
- **Rewarded Ads:** 10 Videos = 1 Monat Premium

---

## 📱 Technische Umsetzung

### Ad Networks Integration:
1. **Google AdMob** (Empfohlen)
   - Banner Ads
   - Interstitial Ads
   - Rewarded Video Ads
   - Native Ads

2. **React Native Libraries:**
   - `react-native-google-mobile-ads` (AdMob)
   - `react-native-admob` (Legacy, nicht empfohlen)

3. **Mediation:**
   - AppLovin MAX (für mehrere Networks)
   - Optimiert Einnahmen durch A/B-Testing

### Implementierung:
```javascript
// Beispiel-Struktur
services/
  ├── adService.js          # Zentrale Ad-Verwaltung
  ├── adPlacements.js       # Ad-Platzierungen definieren
  └── adAnalytics.js        # Ad-Performance-Tracking

components/
  ├── AdBanner.js           # Banner-Komponente
  ├── AdInterstitial.js     # Interstitial-Komponente
  └── RewardedAdButton.js   # Rewarded Ad Button
```

### Features:
- **Ad-Loading:** Pre-loading für bessere Performance
- **Frequency Capping:** Max. X Ads pro User/Tag
- **A/B Testing:** Verschiedene Ad-Formate testen
- **Analytics:** Tracking von Impressions, Clicks, Revenue

---

## 📊 Analytics & Tracking

### Metriken:
1. **Ad-Performance:**
   - Impressions
   - Click-Through-Rate (CTR)
   - Revenue per User (RPU)
   - Fill Rate

2. **User-Verhalten:**
   - Ad-Skip-Rate
   - Rewarded Ad Completion
   - Premium-Conversion-Rate
   - User-Retention (mit/ohne Ads)

3. **Business-Metriken:**
   - Tägliche/Monatliche Einnahmen
   - Einnahmen pro User
   - Ad-Network-Performance

### Tools:
- Firebase Analytics (bereits integriert)
- AdMob Dashboard
- Custom Analytics Dashboard (optional)

---

## 🚀 Rollout-Strategie

### Phase 1: Soft Launch (Woche 1-2)
- ✅ Banner-Werbung in Weinbörse
- ✅ Native Sponsored Content
- ✅ Analytics aktivieren
- ⚠️ **KEINE** Interstitial Ads

### Phase 2: Erweiterung (Woche 3-4)
- ✅ Banner-Werbung in CommunityScreen
- ✅ Rewarded Video Ads (BTP-System)
- ✅ Bottom-Banner (optional)
- ⚠️ **KEINE** Interstitial Ads

### Phase 3: Optimierung (Monat 2)
- ✅ Interstitial Ads (limitierte Frequenz)
- ✅ A/B Testing verschiedener Formate
- ✅ Premium-Modell einführen
- ✅ Performance-Optimierung

### Phase 4: Skalierung (Monat 3+)
- ✅ Alle Ad-Formate aktiv
- ✅ Direct Sales starten
- ✅ Erweiterte Targeting-Optionen
- ✅ Internationale Expansion

---

## ⚖️ Rechtliche Aspekte

### DSGVO-Compliance:
- ✅ Datenschutzerklärung aktualisieren
- ✅ Cookie-Banner (falls Web-View)
- ✅ Opt-Out-Möglichkeit
- ✅ Transparenz über Datenverwendung

### Werberichtlinien:
- ✅ Keine irreführende Werbung
- ✅ Altersgerechte Inhalte
- ✅ Alkohol-Werbung: Gesetzliche Vorgaben beachten
- ✅ Keine Werbung für konkurrierende Apps

---

## 🎯 Erfolgs-KPIs

### Kurzfristig (1-3 Monate):
- Ad-Fill-Rate > 80%
- CTR > 1%
- RPU > €0.10
- User-Retention stabil (kein Drop durch Ads)

### Mittelfristig (3-6 Monate):
- Monatliche Einnahmen > €1.000
- Premium-Conversion-Rate > 2%
- Rewarded Ad Completion > 70%
- User-Zufriedenheit > 4.0/5.0

### Langfristig (6-12 Monate):
- Monatliche Einnahmen > €5.000
- Break-Even erreicht
- Premium-Subscriber > 100
- Direkte Partner-Deals > 10

---

## 💡 Zusätzliche Ideen

### 1. **Wein-Events als Werbung:**
- Sponsored Wein-Tastings
- Weingut-Besichtigungen
- Wein-Seminare

### 2. **Affiliate-Marketing:**
- Wein-Shops (Amazon, etc.)
- Wein-Accessoires
- Weingut-Online-Shops

### 3. **Gamification:**
- Werbung schauen = BTP-Boost
- Tägliche Challenges mit Werbung
- Leaderboard für Ad-Viewers

### 4. **Community-Sponsoring:**
- Community-Events sponsern
- User-Gewinnspiele
- Partner-Weingüter vorstellen

---

## ✅ Nächste Schritte

1. **Entscheidung treffen:**
   - Welche Ad-Formate?
   - Welche Ad-Networks?
   - Premium-Modell ja/nein?

2. **Technische Vorbereitung:**
   - AdMob-Account erstellen
   - App-ID registrieren
   - Ad-Units erstellen

3. **Design-Integration:**
   - Ad-Komponenten designen
   - Platzierungen definieren
   - UI/UX testen

4. **Implementierung:**
   - Ad-Service entwickeln
   - Komponenten integrieren
   - Analytics einrichten

5. **Testing:**
   - Test-Ads einbinden
   - User-Testing durchführen
   - Performance messen

6. **Rollout:**
   - Soft Launch
   - Monitoring
   - Optimierung

---

## 📝 Fazit

Das vorgeschlagene Werbekonzept bietet:
- ✅ **Vielfältige Einnahmequellen** (Banner, Interstitial, Rewarded, Native)
- ✅ **User-freundlich** (nicht störend, transparent, kontrollierbar)
- ✅ **Skalierbar** (von Soft Launch bis Vollausbau)
- ✅ **Flexibel** (Premium-Option, verschiedene Formate)
- ✅ **Relevant** (Wein-bezogene Werbung)

**Empfehlung:** Start mit **Banner-Werbung** und **Rewarded Video Ads** (BTP-System), dann schrittweise erweitern.

---

**Fragen? Feedback? Lass uns gemeinsam die beste Strategie für deine App entwickeln! 🍷**

