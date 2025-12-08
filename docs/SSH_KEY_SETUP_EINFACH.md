# SSH-Key Setup - Einfache Anleitung

**Stand:** 08. Dezember 2025  
**Ziel:** SSH-Key für Admin-Web Deployment einrichten

---

## 🎯 Schnell-Anleitung (5 Minuten)

### Schritt 1: SSH-Key generieren

**Auf deinem lokalen Computer oder direkt auf dem Server:**

```bash
# Generiere einen neuen SSH-Key
ssh-keygen -t ed25519 -C "admin-web-deployment" -f ~/.ssh/admin_web_key
```

**Wichtig:** 
- Wenn nach Passphrase gefragt wird: **Einfach Enter drücken** (leer lassen)
- Der Key wird erstellt: `~/.ssh/admin_web_key` (private) und `~/.ssh/admin_web_key.pub` (public)

---

### Schritt 2: Public Key auf Server hinzufügen

**Verbinde dich mit deinem Server:**

```bash
ssh root@DEINE_SERVER_IP
# oder
ssh bottleadmin@DEINE_SERVER_IP
```

**Füge den Public Key hinzu:**

```bash
# Zeige den Public Key (von deinem Computer kopieren):
cat ~/.ssh/admin_web_key.pub

# Auf dem Server: Füge den Key hinzu
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "HIER_DEN_PUBLIC_KEY_EINFÜGEN" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Oder einfacher - direkt vom Computer:**

```bash
# Von deinem Computer aus:
ssh-copy-id -i ~/.ssh/admin_web_key.pub root@DEINE_SERVER_IP
# oder
ssh-copy-id -i ~/.ssh/admin_web_key.pub bottleadmin@DEINE_SERVER_IP
```

---

### Schritt 3: Private Key an mich senden

**Zeige den Private Key:**

```bash
# Auf deinem Computer:
cat ~/.ssh/admin_web_key
```

**Kopiere die gesamte Ausgabe** (beginnt mit `-----BEGIN OPENSSH PRIVATE KEY-----` und endet mit `-----END OPENSSH PRIVATE KEY-----`)

**Sende mir:**
- Den kompletten Private Key (aus `cat ~/.ssh/admin_web_key`)
- Server-IP: `_________________`
- Benutzername: `root` / `bottleadmin` / Anderer?
- Port: `22` (Standard) oder anderer?

---

### Schritt 4: Ich teste die Verbindung

**Nachdem ich den Private Key erhalten habe, teste ich:**

```bash
ssh -i ~/.ssh/admin_web_key root@DEINE_SERVER_IP
```

**Wenn es funktioniert, kann ich mit der Installation starten!**

---

## 📋 Zusammenfassung - Was ich benötige

**Bitte sende mir:**

1. ✅ **Private Key** (komplette Ausgabe von `cat ~/.ssh/admin_web_key`)
2. ✅ **Server-IP** oder Hostname
3. ✅ **Benutzername** (`root` oder `bottleadmin`)
4. ✅ **Port** (Standard: 22)

**Optional, aber hilfreich:**
- Betriebssystem (Ubuntu/Debian/CentOS)
- Web-Server (Nginx/Apache)
- Node.js Version (falls installiert)

---

## 🔒 Sicherheits-Hinweis

**Nach dem Deployment kannst du den Zugriff widerrufen:**

```bash
# Auf dem Server: Entferne den Key
nano ~/.ssh/authorized_keys
# Lösche die Zeile mit admin_web_key
# Speichere (Ctrl+X, Y, Enter)
```

**Oder lösche den Key komplett:**

```bash
# Auf deinem Computer:
rm ~/.ssh/admin_web_key
rm ~/.ssh/admin_web_key.pub
```

---

## ⚡ Noch einfacher: ssh-copy-id

**Wenn du `ssh-copy-id` hast (meist auf Linux/Mac):**

```bash
# Ein Befehl genügt:
ssh-copy-id -i ~/.ssh/admin_web_key.pub root@DEINE_SERVER_IP
```

**Dann sende mir nur:**
- Private Key (`cat ~/.ssh/admin_web_key`)
- Server-IP
- Benutzername

---

**Fertig!** Sobald ich die Informationen habe, kann ich mit der Installation starten. 🚀
