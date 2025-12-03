# Rechnungsgenerierung - Setup

## Installation

1. Dependencies installieren:
```bash
cd backend-api
pip install -r requirements.txt
```

## Konfiguration

### Firebase Credentials
1. Firebase Service Account Key herunterladen
2. Als `firebase-credentials.json` im `backend-api/` Verzeichnis speichern
3. Oder Umgebungsvariable setzen: `FIREBASE_CREDENTIALS_PATH=/path/to/credentials.json`

### E-Mail-Konfiguration (Umgebungsvariablen)

```bash
export SMTP_SERVER=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASSWORD=your-app-password
export FROM_EMAIL=noreply@bottle-trade.de
```

**Für Gmail:**
- App-Passwort erstellen (nicht normales Passwort!)
- 2-Faktor-Authentifizierung muss aktiviert sein

**Alternative E-Mail-Provider:**
- SendGrid, AWS SES, Mailgun, etc.

## API-Endpoint

**POST** `/orders/{order_id}/generate-invoice`

Generiert PDF-Rechnung und versendet sie per E-Mail.

**Response:**
```json
{
  "success": true,
  "order_id": "abc123",
  "email_sent": true,
  "message": "Rechnung wurde generiert und per E-Mail versendet"
}
```

## Verwendung

Der Endpoint wird automatisch von der App aufgerufen, wenn eine Bestellung auf "paid" gesetzt wird.

## Troubleshooting

- **Firebase-Fehler**: Prüfe ob `firebase-credentials.json` korrekt ist
- **E-Mail-Fehler**: Prüfe SMTP-Credentials und Port
- **PDF-Fehler**: Prüfe ob `reportlab` installiert ist


