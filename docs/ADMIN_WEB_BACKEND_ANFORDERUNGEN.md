# Checkliste: Benötigte Informationen für Admin-Web-Backend

**Stand:** 08. Dezember 2025  
**Ziel:** Alle Informationen sammeln, die für die Implementierung und den Launch des Admin-Web-Backends benötigt werden

---

## 🔐 1. Server & Hosting

### Server-Zugriff
- [ ] **SSH-Zugriff:** Benötige ich SSH-Zugriff zum Server?
  - Host: `_________________`
  - Port: `_________________` (Standard: 22)
  - Benutzer: `_________________`
  - Authentifizierung: SSH-Key oder Passwort?

### Domain & DNS
- [ ] **Domain:** bottle-trade.de
  - Soll das Admin-Panel unter `bottle-trade.de/admin` oder `admin.bottle-trade.de` laufen?
  - Präferenz: `_________________`

- [ ] **Subdomain:** Falls Subdomain gewünscht:
  - DNS-Eintrag bereits konfiguriert? Ja / Nein
  - Falls nein: Kann ich den DNS-Eintrag erstellen oder benötige ich Zugriff?

### Web-Server
- [ ] **Web-Server-Typ:** Welcher Web-Server läuft auf dem Server?
  - [ ] Nginx
  - [ ] Apache
  - [ ] Anderer: `_________________`

- [ ] **Konfigurations-Zugriff:** Kann ich die Web-Server-Konfiguration anpassen?
  - [ ] Ja, ich habe Root/Sudo-Zugriff
  - [ ] Nein, benötige Anleitung für dich

### SSL-Zertifikat
- [ ] **SSL:** Ist bereits ein SSL-Zertifikat installiert?
  - [ ] Ja, Let's Encrypt
  - [ ] Ja, kommerzielles Zertifikat
  - [ ] Nein, muss installiert werden

- [ ] **HTTPS:** Funktioniert HTTPS bereits auf bottle-trade.de?
  - [ ] Ja
  - [ ] Nein

---

## 🔥 2. Firebase-Konfiguration

### Firebase-Projekt
- [ ] **Projekt-ID:** `bottle-trade-app` (aus `firebase-web.js` bekannt)
- [ ] **Firebase Console Zugriff:** Hast du Zugriff auf die Firebase Console?
  - [ ] Ja
  - [ ] Nein, benötige ich Zugriff?

### Firestore Security Rules
- [ ] **Aktuelle Rules:** Kann ich die Firestore Security Rules anpassen?
  - Benötige Admin-spezifische Rules für Web-Zugriff

### Firebase Admin SDK
- [ ] **Service Account:** Benötige ich ein Service Account JSON für Server-seitige Operationen?
  - [ ] Ja, für erweiterte Admin-Funktionen
  - [ ] Nein, Web SDK reicht

### Firebase Storage
- [ ] **Storage Rules:** Kann ich die Storage Security Rules anpassen?
  - Für Admin-Upload von Produktbildern, etc.

---

## 🔌 3. FastAPI Backend

### Backend-URL
- [ ] **API-URL:** Wo läuft das FastAPI Backend?
  - URL: `_________________` (z.B. `https://api.bottle-trade.de` oder `http://localhost:8000`)
  - Port: `_________________`

### CORS-Konfiguration
- [ ] **CORS:** Muss das Backend für die Web-Domain konfiguriert werden?
  - Domain: `bottle-trade.de` oder `admin.bottle-trade.de`
  - Kann ich die CORS-Konfiguration im Backend anpassen?

### API-Authentifizierung
- [ ] **API-Keys:** Gibt es API-Keys oder Tokens für Backend-Zugriff?
  - [ ] Ja, Key: `_________________`
  - [ ] Nein, muss erstellt werden

### E-Mail-Service
- [ ] **SMTP-Konfiguration:** Ist der E-Mail-Service bereits konfiguriert?
  - [ ] Ja, läuft über FastAPI Backend
  - [ ] Nein, muss konfiguriert werden

---

## 👤 4. Admin-Authentifizierung

### Admin-Account
- [ ] **Admin-User:** Gibt es bereits einen Admin-User in Firestore?
  - E-Mail: `_________________`
  - UID: `_________________` (falls bekannt)

### Authentifizierungs-Methode
- [ ] **Präferenz:** Welche Authentifizierungs-Methode soll verwendet werden?
  - [ ] Firebase Authentication (Empfohlen)
  - [ ] Eigenes Auth-System (wie in App)
  - [ ] Andere: `_________________`

### Passwort
- [ ] **Passwort:** Falls Firebase Auth:
  - Soll ein neues Passwort gesetzt werden?
  - Oder existiert bereits ein Passwort?

---

## 🎨 5. Design & Assets

### Logo
- [ ] **Logo-Dateien:** Wo finde ich die Logo-Dateien?
  - Pfad: `_________________` (z.B. `mobile-app/assets/images/Logo_white.png`)
  - Format: PNG / SVG

### Farben
- [ ] **Farb-Palette:** Sollen die Farben aus der App übernommen werden?
  - Hintergrund: `#2c2c2c`
  - Akzent: `#DAA520` (Gold)
  - [ ] Ja, übernehmen
  - [ ] Nein, abweichende Farben: `_________________`

### Icons
- [ ] **Icon-Set:** Welches Icon-Set soll verwendet werden?
  - [ ] React Icons (Empfohlen)
  - [ ] Material Icons
  - [ ] Font Awesome
  - [ ] Andere: `_________________`

---

## 🛠️ 6. Technologie-Stack (Entscheidung)

### Framework
- [ ] **Präferenz:** Welches Framework soll verwendet werden?
  - [ ] React + Vite (Empfohlen - schnell, modern)
  - [ ] Next.js (SSR, SEO)
  - [ ] Vue.js
  - [ ] Andere: `_________________`

### Styling
- [ ] **CSS-Framework:** Welches Styling-System?
  - [ ] Tailwind CSS (Empfohlen)
  - [ ] Material-UI
  - [ ] Styled Components
  - [ ] Andere: `_________________`

### TypeScript
- [ ] **TypeScript:** Soll TypeScript verwendet werden?
  - [ ] Ja (Empfohlen)
  - [ ] Nein, JavaScript

---

## 📁 7. Projekt-Struktur

### Verzeichnis
- [ ] **Projekt-Pfad:** Wo soll das Admin-Web-Projekt erstellt werden?
  - [ ] Im Haupt-Projekt: `/home/bottleadmin/bottle-trade-mobile/admin-web/`
  - [ ] Separates Verzeichnis: `_________________`

### Git
- [ ] **Git-Repository:** Soll das Admin-Web in einem separaten Git-Repo sein?
  - [ ] Ja, neues Repository
  - [ ] Nein, im bestehenden Repository

---

## 🚀 8. Deployment

### Build-Prozess
- [ ] **Build-Artifakte:** Wo sollen die gebauten Dateien gespeichert werden?
  - Pfad: `_________________` (z.B. `/var/www/bottle-trade.de/admin/`)

### Deployment-Methode
- [ ] **Präferenz:** Wie soll das Deployment erfolgen?
  - [ ] Manuell (Build lokal, Upload per FTP/SCP)
  - [ ] Automatisch (Git Hook, CI/CD)
  - [ ] Andere: `_________________`

### Auto-Deployment
- [ ] **CI/CD:** Soll automatisches Deployment eingerichtet werden?
  - [ ] Ja, Git Hook auf Server
  - [ ] Nein, manuell

---

## 🔒 9. Sicherheit

### Firewall
- [ ] **Firewall-Regeln:** Gibt es spezielle Firewall-Regeln?
  - [ ] Nein, Standard-Ports (80, 443)
  - [ ] Ja, spezielle Konfiguration: `_________________`

### Rate Limiting
- [ ] **Rate Limiting:** Soll Rate Limiting für Login-Versuche implementiert werden?
  - [ ] Ja
  - [ ] Nein

### IP-Whitelist
- [ ] **IP-Whitelist:** Soll das Admin-Panel nur von bestimmten IPs erreichbar sein?
  - [ ] Ja, IPs: `_________________`
  - [ ] Nein, öffentlich (mit Login)

---

## 📊 10. Features & Prioritäten

### MVP (Minimum Viable Product)
- [ ] **Phase 1 - Must-Have:**
  - [ ] Dashboard mit Statistiken
  - [ ] User-Verwaltung
  - [ ] Wein-Verwaltung
  - [ ] Login/Authentifizierung

### Phase 2
- [ ] **Phase 2 - Wichtig:**
  - [ ] Weingüter-Verwaltung
  - [ ] Umfragen-Verwaltung
  - [ ] Newsletter-Verwaltung
  - [ ] System-Nachrichten

### Phase 3
- [ ] **Phase 3 - Nice-to-Have:**
  - [ ] Shop-Verwaltung
  - [ ] Bestellungen-Verwaltung
  - [ ] Chat-Verwaltung
  - [ ] Trade-Verwaltung
  - [ ] Daten-Verwaltung

### Priorisierung
- [ ] **Welche Features sind am wichtigsten?**
  - Top 3: `_________________`

---

## ✅ Zusammenfassung: Was ich von dir benötige

### Sofort benötigt (für Start):
1. ✅ **Server-Zugriff:** SSH-Zugangsdaten oder Bestätigung, dass ich Zugriff bekomme
2. ✅ **Domain-Konfiguration:** Bestätigung, ob `bottle-trade.de/admin` oder Subdomain
3. ✅ **Web-Server-Typ:** Nginx oder Apache?
4. ✅ **Firebase-Zugriff:** Bestätigung, dass ich Firebase Console-Zugriff habe oder bekomme
5. ✅ **Admin-Account:** E-Mail-Adresse des Admin-Users
6. ✅ **Framework-Entscheidung:** React, Next.js oder Vue?

### Später benötigt (während Entwicklung):
7. ⏳ **FastAPI Backend-URL:** Wo läuft das Backend?
8. ⏳ **CORS-Konfiguration:** Backend für Web-Domain öffnen
9. ⏳ **SSL-Zertifikat:** Bestätigung oder Installation
10. ⏳ **Design-Assets:** Logo-Pfade bestätigen

---

## 📝 Nächste Schritte

1. **Fülle diese Checkliste aus** (oder teile mir die Informationen mit)
2. **Ich erstelle das Projekt-Setup** basierend auf deinen Präferenzen
3. **Wir starten mit Phase 1** (MVP: Dashboard, User, Wein-Verwaltung)
4. **Iterative Entwicklung** mit deinem Feedback

---

**Erstellt am:** 08. Dezember 2025  
**Status:** Checkliste - Bereit zum Ausfüllen








