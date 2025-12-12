# SSH-Key Setup Anleitung - Option 1

**Stand:** 08. Dezember 2025  
**Ziel:** SSH-Key für Admin-Web Deployment einrichten

---

## 📋 Übersicht

Diese Anleitung zeigt dir, wie du einen SSH-Key für mich einrichtest, damit ich Zugriff auf deinen Server bekomme, um das Admin-Web-Backend zu installieren.

**Wichtig:** Der SSH-Key ermöglicht mir sicheren Zugriff ohne Passwort. Du kannst den Zugriff jederzeit widerrufen, indem du den Key entfernst.

---

## 🔑 Schritt 1: SSH-Key generieren (auf deinem lokalen System)

Ich generiere einen SSH-Key-Paar für dich. Du fügst dann den Public Key auf dem Server hinzu.

### Option A: Ich erstelle den Key für dich

**Wenn du mir Zugriff geben möchtest, führe diese Schritte aus:**

1. **Verbinde dich mit deinem Server:**
   ```bash
   ssh root@DEINE_SERVER_IP
   # oder
   ssh bottleadmin@DEINE_SERVER_IP
   ```

2. **Generiere einen temporären SSH-Key auf dem Server:**
   ```bash
   ssh-keygen -t ed25519 -C "admin-web-deployment" -f ~/.ssh/admin_web_key
   ```
   
   **Wichtig:** Drücke Enter, wenn nach Passphrase gefragt wird (leer lassen für einfacheren Zugriff)

3. **Zeige mir den Public Key:**
   ```bash
   cat ~/.ssh/admin_web_key.pub
   ```
   
   **Kopiere die gesamte Ausgabe** (beginnt mit `ssh-ed25519 ...`) und teile sie mir mit.

4. **Füge den Key zu authorized_keys hinzu:**
   ```bash
   cat ~/.ssh/admin_web_key.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```

5. **Gib mir die Zugangsdaten:**
   - Server-IP: `_________________`
   - Benutzername: `root` / `bottleadmin` / Anderer?
   - Port: `22` (Standard) oder anderer?
   - Private Key Inhalt (aus `~/.ssh/admin_web_key`)

### Option B: Du generierst den Key lokal (Sicherer)

**Wenn du den Key auf deinem lokalen Computer generieren möchtest:**

1. **Generiere SSH-Key auf deinem Computer:**
   ```bash
   ssh-keygen -t ed25519 -C "admin-web-deployment" -f ~/.ssh/admin_web_key
   ```
   
   **Wichtig:** Drücke Enter, wenn nach Passphrase gefragt wird (leer lassen)

2. **Zeige den Public Key:**
   ```bash
   cat ~/.ssh/admin_web_key.pub
   ```
   
   **Kopiere die gesamte Ausgabe** (beginnt mit `ssh-ed25519 ...`)

3. **Verbinde dich mit deinem Server:**
   ```bash
   ssh root@DEINE_SERVER_IP
   ```

4. **Füge den Public Key zu authorized_keys hinzu:**
   ```bash
   # Erstelle .ssh Verzeichnis falls nicht vorhanden
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   
   # Füge Public Key hinzu
   echo "HIER_DEN_PUBLIC_KEY_EINFÜGEN" >> ~/.ssh/authorized_keys
   
   # Setze korrekte Berechtigungen
   chmod 600 ~/.ssh/authorized_keys
   ```

5. **Gib mir die Zugangsdaten:**
   - Server-IP: `_________________`
   - Benutzername: `root` / `bottleadmin` / Anderer?
   - Port: `22` (Standard) oder anderer?
   - Private Key Inhalt (aus `~/.ssh/admin_web_key` auf deinem Computer)

---

## 🔐 Schritt 2: Private Key sicher übertragen

**Wichtig:** Der Private Key muss sicher übertragen werden!

### Option 1: Via sichere Nachricht (Empfohlen)
- Kopiere den Inhalt von `~/.ssh/admin_web_key` (Private Key)
- Sende ihn mir über eine sichere Methode (verschlüsselte Nachricht)

### Option 2: Via temporäre Datei
```bash
# Auf deinem Computer
cat ~/.ssh/admin_web_key | base64
```
- Kopiere die Base64-kodierte Ausgabe
- Sende sie mir
- Ich dekodiere sie

### Option 3: Ich verbinde mich direkt (wenn möglich)
- Du gibst mir temporären Passwort-Zugriff
- Ich generiere den Key auf dem Server
- Du änderst das Passwort danach

---

## ✅ Schritt 3: Test der Verbindung

**Nachdem der Key eingerichtet ist, teste ich die Verbindung:**

```bash
# Ich führe aus (mit deinem Private Key):
ssh -i ~/.ssh/admin_web_key root@DEINE_SERVER_IP
# oder
ssh -i ~/.ssh/admin_web_key bottleadmin@DEINE_SERVER_IP
```

**Wenn die Verbindung funktioniert, sehe ich:**
- ✅ Erfolgreiche Anmeldung ohne Passwort
- ✅ Zugriff auf das Server-Dateisystem

---

## 🛡️ Sicherheits-Checks

### 1. Prüfe SSH-Konfiguration

**Auf dem Server, prüfe `/etc/ssh/sshd_config`:**

```bash
# Wichtige Einstellungen:
PermitRootLogin yes          # oder 'prohibit-password' (nur Key)
PubkeyAuthentication yes
PasswordAuthentication yes   # Kann auf 'no' gesetzt werden nach Key-Setup
```

**Nach Änderungen:**
```bash
sudo systemctl restart sshd
# oder
sudo service ssh restart
```

### 2. Firewall prüfen

```bash
# Prüfe ob Port 22 offen ist:
sudo ufw status
# oder
sudo iptables -L
```

### 3. Fail2ban (Optional, aber empfohlen)

```bash
# Installiere Fail2ban für SSH-Schutz:
sudo apt update
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📝 Schritt 4: Informationen die ich benötige

**Bitte teile mir mit:**

1. **Server-Zugriff:**
   - [ ] Server-IP oder Hostname: `_________________`
   - [ ] Benutzername: `root` / `bottleadmin` / Anderer?
   - [ ] Port: `22` (Standard) oder anderer?
   - [ ] Private Key (siehe Schritt 2)

2. **Server-Informationen:**
   - [ ] Betriebssystem: `Ubuntu` / `Debian` / `CentOS` / Anderer?
   - [ ] Web-Server: `Nginx` / `Apache` / Anderer?
   - [ ] Node.js installiert? Ja / Nein / Version: `_________________`

3. **Domain-Konfiguration:**
   - [ ] Domain: `bottle-trade.de` (bestätigt)
   - [ ] Admin-Pfad: `/admin` oder Subdomain `admin.bottle-trade.de`?
   - [ ] SSL-Zertifikat vorhanden? Ja / Nein

---

## 🚀 Schritt 5: Nach dem Deployment

**Nach erfolgreicher Installation, kannst du den Zugriff widerrufen:**

### Option A: Key aus authorized_keys entfernen

```bash
# Auf dem Server:
nano ~/.ssh/authorized_keys
# Entferne die Zeile mit dem admin_web_key
# Speichere und schließe (Ctrl+X, Y, Enter)
```

### Option B: Key-Datei löschen

```bash
# Auf dem Server:
rm ~/.ssh/admin_web_key.pub
```

### Option C: Passwort ändern (falls verwendet)

```bash
# Auf dem Server:
passwd
# Neues Passwort eingeben
```

---

## ⚠️ Troubleshooting

### Problem: "Permission denied (publickey)"

**Lösung:**
```bash
# Prüfe Berechtigungen:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/admin_web_key  # Private Key
```

### Problem: "Connection refused"

**Lösung:**
- Prüfe ob SSH-Service läuft: `sudo systemctl status sshd`
- Prüfe Firewall: `sudo ufw allow 22`
- Prüfe ob Port 22 offen ist: `sudo netstat -tlnp | grep :22`

### Problem: "Host key verification failed"

**Lösung:**
```bash
# Auf deinem Computer:
ssh-keygen -R DEINE_SERVER_IP
```

---

## 📋 Checkliste

**Vorbereitung:**
- [ ] SSH-Key generiert (Option A oder B)
- [ ] Public Key zu `authorized_keys` hinzugefügt
- [ ] Berechtigungen korrekt gesetzt (700 für .ssh, 600 für authorized_keys)
- [ ] Private Key sicher an mich übertragen

**Informationen für mich:**
- [ ] Server-IP: `_________________`
- [ ] Benutzername: `_________________`
- [ ] Port: `_________________`
- [ ] Private Key: `_________________` (sicher übertragen)

**Server-Info:**
- [ ] Betriebssystem: `_________________`
- [ ] Web-Server: `_________________`
- [ ] Node.js: `_________________`
- [ ] Domain: `bottle-trade.de`
- [ ] Admin-Pfad: `/admin` oder Subdomain?

---

## 🎯 Nächste Schritte

1. **Du führst die Schritte 1-2 aus** (Key generieren und hinzufügen)
2. **Du gibst mir die Informationen** (Server-IP, Benutzername, Private Key)
3. **Ich teste die Verbindung** (SSH-Login)
4. **Ich installiere das Admin-Web** (Deployment)
5. **Du widerrufst den Zugriff** (optional, nach Deployment)

---

**Erstellt am:** 08. Dezember 2025  
**Status:** Bereit für SSH-Key Setup











