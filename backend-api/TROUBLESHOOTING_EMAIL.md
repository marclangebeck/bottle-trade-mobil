# E-Mail-Versand Troubleshooting

## Problem: Authentifizierungsfehler (535)

Wenn die Authentifizierung mit mailbox.org fehlschlägt:

### 1. App-Passwort prüfen

- Gehe zu: https://mailbox.org → Alle Einstellungen → Sicherheit → Anwendungspasswörter
- Prüfe ob das App-Passwort für "Bottle-Trade Backend" existiert und aktiv ist
- **Warte 1-2 Minuten**, falls du das App-Passwort gerade erstellt hast (manchmal dauert die Aktivierung)

### 2. Passwort nochmal kopieren

- Lösche das alte App-Passwort
- Erstelle ein neues App-Passwort
- **Kopiere es komplett** (ohne Leerzeichen am Anfang/Ende)
- Trage es in die `.env` Datei ein (in Anführungszeichen wegen Sonderzeichen)

### 3. .env Datei prüfen

Die `.env` Datei sollte so aussehen:

```env
SMTP_HOST=smtp.mailbox.org
SMTP_PORT=587
SMTP_USER=bootletrade@mailbox.org
SMTP_PASSWORD="Yu#HU72Cd)ivOjdX3PJDhuP9gRhaIMHDSGW%XfIz"
FROM_EMAIL=bootletrade@mailbox.org
ADMIN_EMAIL=admin@bottle-trade.de
```

**Wichtig:**
- Passwort muss in **Anführungszeichen** stehen (wegen `#` und `%`)
- `SMTP_USER` und `FROM_EMAIL` müssen deine vollständige mailbox.org Adresse sein

### 4. Testen

```bash
cd backend-api
source venv/bin/activate
python3 test_email.py
```

### 5. Backend neu starten

Nach Änderungen an der `.env` Datei:

```bash
pkill -f "uvicorn main:app"
cd backend-api
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 6. Alternative: Port 465 testen

Falls Port 587 nicht funktioniert, versuche Port 465:

```env
SMTP_PORT=465
```

Der Code unterstützt beide Ports automatisch.

## Wenn es immer noch nicht funktioniert

1. **Prüfe mailbox.org Web-Interface:**
   - Kannst du dich normal einloggen?
   - Ist der Account aktiv?

2. **Kontaktiere mailbox.org Support:**
   - Frage nach SMTP-Einstellungen für App-Passwörter
   - Manche Provider haben spezielle Anforderungen

3. **Teste mit einem anderen E-Mail-Client:**
   - Versuche das App-Passwort in Thunderbird oder Outlook zu verwenden
   - Wenn es dort funktioniert, ist es ein Code-Problem
   - Wenn es dort auch nicht funktioniert, ist es ein mailbox.org Problem

