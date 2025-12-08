# SMTP-Konfiguration für E-Mail-Versand

## Schritt 1: .env Datei erstellen

Kopiere die Beispiel-Datei:
```bash
cd backend-api
cp .env.example .env
```

## Schritt 2: .env Datei bearbeiten

Öffne die `.env` Datei und trage deine SMTP-Daten ein:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine-email@gmail.com
SMTP_PASSWORD=dein-app-passwort
FROM_EMAIL=deine-email@gmail.com
ADMIN_EMAIL=admin@bottle-trade.de
```

**WICHTIG bei Sonderzeichen im Passwort:**
- Wenn dein Passwort Sonderzeichen enthält (z.B. `#`, `$`, `&`, Leerzeichen), setze es in **Anführungszeichen**:
  ```env
  SMTP_PASSWORD="mein#passwort#mit#rauten"
  ```
- Oder verwende einfache Anführungszeichen:
  ```env
  SMTP_PASSWORD='mein#passwort#mit#rauten'
  ```

## Schritt 3: Gmail App-Passwort erstellen (für Gmail)

**WICHTIG:** Gmail erfordert ein App-Passwort, nicht dein normales Passwort!

### Anleitung für Gmail:

1. **Google Account öffnen:**
   - Gehe zu: https://myaccount.google.com/
   - Klicke auf "Sicherheit" (links im Menü)

2. **2-Faktor-Authentifizierung aktivieren:**
   - Falls noch nicht aktiviert: Aktiviere "Bestätigung in zwei Schritten"
   - Folge den Anweisungen

3. **App-Passwort erstellen:**
   - Gehe zu: https://myaccount.google.com/apppasswords
   - Oder: Sicherheit → 2-Faktor-Authentifizierung → App-Passwörter
   - Wähle "App" → "Mail"
   - Wähle "Gerät" → "Andere (benutzerdefiniert)" → "Bottle-Trade Backend"
   - Klicke "Generieren"
   - **Kopiere das 16-stellige Passwort** (z.B. `abcd efgh ijkl mnop`)

4. **In .env eintragen:**
   ```env
   SMTP_PASSWORD=abcdefghijklmnop
   ```
   (Ohne Leerzeichen!)

## Alternative: Andere E-Mail-Anbieter

### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### mailbox.org:
```env
SMTP_HOST=smtp.mailbox.org
SMTP_PORT=587
# oder 465 für SSL/TLS
# Benutzername: deine vollständige E-Mail-Adresse (z.B. deinname@mailbox.org)
# Passwort: dein normales Passwort (oder App-Passwort bei 2FA)
```

**WICHTIG für mailbox.org:**
- Bei aktivierter 2FA: App-Passwort erstellen unter "Alle Einstellungen" > "Sicherheit" > "Anwendungspasswörter"
- Benutzername muss die vollständige E-Mail-Adresse sein

### Eigener SMTP-Server:
```env
SMTP_HOST=mail.deine-domain.de
SMTP_PORT=587
# oder 465 für SSL
```

## Schritt 4: Backend neu starten

Nach dem Erstellen der `.env` Datei muss das Backend neu gestartet werden:

```bash
# Stoppe das Backend (falls läuft)
pkill -f "uvicorn main:app"

# Starte neu
cd backend-api
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

## Testen

Nach dem Start kannst du testen, ob E-Mails gesendet werden:

1. **Registriere einen neuen User in der App**
2. **Prüfe die Logs:**
   - Im Backend-Terminal sollte stehen: `✅ E-Mail erfolgreich gesendet an: ...`
   - Oder: `❌ Fehler beim Senden der E-Mail: ...`

3. **Prüfe E-Mail-Postfach:**
   - User sollte Bestätigungs-E-Mail erhalten
   - Admin sollte Benachrichtigung erhalten

## Troubleshooting

### "535 Authentication failed"
- **Problem:** Falsches Passwort oder kein App-Passwort verwendet
- **Lösung:** Stelle sicher, dass du ein Gmail App-Passwort verwendest, nicht dein normales Passwort

### "Connection refused" oder "Network Error"
- **Problem:** SMTP-Server nicht erreichbar oder falscher Port
- **Lösung:** Prüfe SMTP_HOST und SMTP_PORT

### "535-5.7.8 Username and Password not accepted"
- **Problem:** 2-Faktor-Authentifizierung nicht aktiviert
- **Lösung:** Aktiviere 2FA in deinem Google Account

### E-Mails kommen nicht an
- **Problem:** E-Mails landen im Spam
- **Lösung:** Prüfe Spam-Ordner, füge Absender-Adresse zu Kontakten hinzu

## Sicherheit

⚠️ **WICHTIG:**
- Die `.env` Datei enthält sensible Daten
- Füge `.env` zu `.gitignore` hinzu (falls noch nicht geschehen)
- Teile die `.env` Datei niemals öffentlich

## Beispiel .env Datei

```env
# SMTP-Konfiguration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=meine-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
FROM_EMAIL=meine-email@gmail.com
ADMIN_EMAIL=admin@bottle-trade.de

# Firebase (optional)
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
```

