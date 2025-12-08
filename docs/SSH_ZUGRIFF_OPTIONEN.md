# SSH-Zugriff Optionen für Admin-Web Deployment

**Stand:** 08. Dezember 2025  
**Ziel:** Klärung, wie ich Zugriff auf den Server bekomme

---

## 🔐 Optionen für Server-Zugriff

### Option 1: SSH-Key (Empfohlen - Sicherste Methode)

**Was ich benötige:**
- [ ] **SSH Public Key** von mir (ich generiere einen)
- [ ] **Server-IP** oder **Hostname**
- [ ] **Benutzername** (z.B. `root` oder `bottleadmin`)
- [ ] **Port** (Standard: 22)

**Ablauf:**
1. Ich generiere ein SSH-Key-Paar (öffentlich + privat)
2. Du fügst meinen **Public Key** zu `~/.ssh/authorized_keys` hinzu
3. Ich kann mich dann ohne Passwort anmelden (sicherer!)

**Vorteile:**
- ✅ Kein Passwort nötig (sicherer)
- ✅ Automatische Authentifizierung
- ✅ Kann jederzeit widerrufen werden (Key löschen)

---

### Option 2: SSH-Passwort (Einfacher, aber weniger sicher)

**Was ich benötige:**
- [ ] **Server-IP** oder **Hostname**
- [ ] **Benutzername** (z.B. `root`)
- [ ] **Passwort**
- [ ] **Port** (Standard: 22)

**Ablauf:**
1. Du gibst mir die Zugangsdaten
2. Ich verbinde mich per SSH
3. Ich führe die Installation durch

**Nachteile:**
- ⚠️ Passwort wird übertragen (weniger sicher)
- ⚠️ Passwort könnte in Logs erscheinen

**Empfehlung:** Nur wenn SSH-Key nicht möglich ist

---

### Option 3: Anleitung statt direkter Zugriff

**Was ich erstelle:**
- [ ] **Detaillierte Anleitung** mit allen Befehlen
- [ ] **Scripts** die du ausführen kannst
- [ ] **Konfigurationsdateien** die du kopieren kannst

**Ablauf:**
1. Ich erstelle alle Dateien und Anleitungen
2. Du führst die Befehle auf dem Server aus
3. Ich unterstütze bei Problemen

**Vorteile:**
- ✅ Du behältst vollen Zugriff
- ✅ Keine Zugangsdaten nötig
- ✅ Du lernst dabei

**Nachteile:**
- ⚠️ Mehr manuelle Schritte
- ⚠️ Längerer Prozess

---

## 📋 Was ich konkret benötige

### Minimum (für Option 3 - Anleitung):
- [ ] **Server-IP** oder **Hostname**: `_________________`
- [ ] **Web-Server-Typ**: Nginx / Apache / Anderer?
- [ ] **Domain**: `bottle-trade.de` (bestätigt)
- [ ] **Admin-Pfad**: `/admin` oder Subdomain?

### Für Option 1 (SSH-Key - Empfohlen):
- [ ] **Server-IP**: `_________________`
- [ ] **Benutzername**: `root` / `bottleadmin` / Anderer?
- [ ] **Port**: `22` (Standard) oder anderer?
- [ ] **Bereit, SSH Public Key hinzuzufügen**: Ja / Nein

### Für Option 2 (SSH-Passwort):
- [ ] **Server-IP**: `_________________`
- [ ] **Benutzername**: `root` / `bottleadmin` / Anderer?
- [ ] **Passwort**: `_________________` (sicher übertragen!)
- [ ] **Port**: `22` (Standard) oder anderer?

---

## 🔒 Sicherheits-Empfehlungen

### Wenn du mir SSH-Zugriff gibst:

1. **SSH-Key verwenden** (nicht Passwort)
   - Ich generiere Key-Paar
   - Du fügst nur den Public Key hinzu
   - Privater Key bleibt bei mir

2. **Benutzer mit eingeschränkten Rechten** (falls möglich)
   - Nicht `root`, sondern eigener Benutzer
   - Nur für Web-Deployment berechtigt

3. **Nach Deployment: Zugriff widerrufen**
   - SSH-Key aus `authorized_keys` entfernen
   - Oder: Passwort ändern

4. **Firewall-Regeln prüfen**
   - Nur notwendige Ports öffnen (22, 80, 443)
   - Fail2ban für SSH-Schutz

---

## 🚀 Meine Empfehlung

### Für den Start: **Option 3 (Anleitung)**

**Warum:**
- ✅ Du behältst Kontrolle
- ✅ Keine Zugangsdaten nötig
- ✅ Ich erstelle alle Dateien und Scripts
- ✅ Du führst aus (ich helfe bei Problemen)

**Später (wenn nötig):**
- Option 1 (SSH-Key) für direkten Zugriff
- Nur wenn Anleitung nicht ausreicht

---

## 📝 Nächste Schritte

### Wenn du Option 3 wählst (Anleitung):
1. ✅ Du gibst mir: Server-IP, Web-Server-Typ, Domain-Info
2. ✅ Ich erstelle: Installations-Script, Konfigurationsdateien, Anleitung
3. ✅ Du führst aus: Befehle auf dem Server
4. ✅ Ich unterstütze: Bei Fragen/Problemen

### Wenn du Option 1 wählst (SSH-Key):
1. ✅ Ich generiere SSH-Key-Paar
2. ✅ Ich gebe dir den Public Key
3. ✅ Du fügst ihn zu `~/.ssh/authorized_keys` hinzu
4. ✅ Ich verbinde mich und installiere

### Wenn du Option 2 wählst (Passwort):
1. ✅ Du gibst mir Zugangsdaten (sicher!)
2. ✅ Ich verbinde mich und installiere
3. ✅ Nach Deployment: Passwort ändern (empfohlen)

---

## ❓ Was bevorzugst du?

**Bitte teile mir mit:**
- [ ] Option 1 (SSH-Key) - Ich generiere Key, du fügst hinzu
- [ ] Option 2 (SSH-Passwort) - Du gibst Zugangsdaten
- [ ] Option 3 (Anleitung) - Ich erstelle Scripts, du führst aus

**Zusätzlich benötigt:**
- Server-IP oder Hostname: `_________________`
- Benutzername: `root` / `bottleadmin` / Anderer?
- Web-Server: Nginx / Apache / Anderer?

---

**Erstellt am:** 08. Dezember 2025  
**Status:** Warte auf deine Präferenz

