# mailbox.org SMTP-Konfiguration

## Problem: Authentifizierungsfehler (535)

Wenn du den Fehler `535 5.7.8 Error: authentication failed` erhältst, liegt das meist an:

### 1. 2-Faktor-Authentifizierung aktiviert

**Lösung:** Erstelle ein App-Passwort:

1. Gehe zu: https://mailbox.org/
2. Login mit deinem Account
3. Gehe zu: **"Alle Einstellungen"** → **"Sicherheit"** → **"Anwendungspasswörter"**
4. Klicke auf **"Neues Anwendungspasswort erstellen"**
5. Name: `Bottle-Trade Backend`
6. **Kopiere das generierte Passwort**
7. Verwende dieses App-Passwort in der `.env` Datei (nicht dein normales Passwort!)

### 2. Passwort mit Sonderzeichen

Wenn dein Passwort Sonderzeichen enthält (z.B. `#`, `$`, `!`), setze es in **Anführungszeichen**:

```env
SMTP_PASSWORD="dein#passwort#mit#rauten"
```

### 3. Benutzername prüfen

Der Benutzername muss die **vollständige E-Mail-Adresse** sein:
```env
SMTP_USER=bootletrade@mailbox.org
```

## Testen

Nach dem Anpassen der `.env` Datei:

```bash
cd backend-api
source venv/bin/activate
python3 test_email.py
```

## Alternative: Port 465 (SSL)

Falls Port 587 nicht funktioniert, versuche Port 465:

```env
SMTP_PORT=465
```

Der Code unterstützt bereits beide Ports automatisch.

