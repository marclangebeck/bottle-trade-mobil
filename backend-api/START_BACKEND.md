# Backend-API starten

## Voraussetzungen

1. Python 3.8+ installiert
2. Dependencies installiert:
   ```bash
   cd backend-api
   pip install -r requirements.txt
   ```

## Backend starten

### Development (lokal)
```bash
cd backend-api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**WICHTIG:** `--host 0.0.0.0` ist notwendig, damit das Backend von anderen Geräten im Netzwerk erreichbar ist!

### Production
```bash
cd backend-api
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Umgebungsvariablen

Erstelle eine `.env` Datei im `backend-api/` Ordner:

```env
# SMTP-Konfiguration (für E-Mail-Versand)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine-email@gmail.com
SMTP_PASSWORD=dein-app-passwort
ADMIN_EMAIL=admin@bottle-trade.de
FROM_EMAIL=deine-email@gmail.com

# Firebase
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
```

## WICHTIG: Für E-Mail-Versand

1. **Gmail App-Passwort erstellen:**
   - Google Account → Sicherheit → 2-Faktor-Authentifizierung aktivieren
   - App-Passwörter → Neue App → "Mail" → Passwort kopieren
   - Dieses Passwort in `.env` als `SMTP_PASSWORD` eintragen

2. **Firebase Credentials:**
   - `firebase-credentials.json` muss im `backend-api/` Ordner liegen
   - Datei von Firebase Console herunterladen (Service Account Key)

## API-Endpunkte

Nach dem Start ist die API verfügbar unter:
- **Local:** `http://localhost:8000`
- **Docs:** `http://localhost:8000/docs` (Swagger UI)

## Troubleshooting

### Network Error in der App
- Prüfe ob Backend läuft: `curl http://localhost:8000/health`
- Prüfe `BACKEND_API_URL` in `mobile-app/config/api.js`
- Für echtes Gerät: Lokale IP-Adresse verwenden (z.B. `http://192.168.1.100:8000`)

### E-Mails werden nicht gesendet
- Prüfe `.env` Datei
- Prüfe SMTP-Credentials
- Prüfe Firewall/Port 587

