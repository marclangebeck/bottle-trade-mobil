# Production Setup - Rechnungsstellung

## ✅ Code ist fertig!

Der Code ist production-ready. Für Production müssen nur noch folgende Schritte durchgeführt werden:

## 1. Backend auf Server deployen

### Option A: Eigenes Backend
- Backend auf Server deployen (z.B. mit systemd, Docker, oder PM2)
- URL: `https://api.bottle-trade.de` (oder ähnlich)

### Option B: Cloud-Service
- Heroku, Railway, Render, etc.
- URL wird vom Service bereitgestellt

## 2. App-Konfiguration anpassen

In `mobile-app/config/api.js`:
```javascript
export const BACKEND_API_URL = __DEV__ 
  ? 'http://localhost:8000'  // Development
  : 'https://api.bottle-trade.de';  // ✅ Production-URL hier eintragen!
```

## 3. Backend-Konfiguration

### Firebase Credentials
- Service Account Key auf Server hochladen
- Als `firebase-credentials.json` im Backend-Verzeichnis speichern
- Oder Umgebungsvariable: `FIREBASE_CREDENTIALS_PATH=/path/to/credentials.json`

### E-Mail-Konfiguration (Umgebungsvariablen)
```bash
export SMTP_SERVER=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASSWORD=your-app-password
export FROM_EMAIL=noreply@bottle-trade.de
```

**Oder in Production-Service (Heroku, etc.):**
- Als Environment Variables setzen

## 4. Dependencies installieren

```bash
cd backend-api
pip install -r requirements.txt
```

## 5. Backend starten

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Oder mit systemd (für dauerhaften Betrieb):**
```ini
[Unit]
Description=Bottle Trade API
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/backend-api
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## 6. CORS konfigurieren (falls nötig)

Falls CORS-Probleme auftreten, in `main.py` hinzufügen:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Oder spezifische Domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## ✅ Was funktioniert automatisch:

- App ruft Backend nach erfolgreicher Zahlung auf
- PDF wird generiert
- E-Mail wird versendet
- Bestellung bleibt als "paid" markiert (auch wenn Backend-Fehler)

## ⚠️ Wichtig für Production:

1. **HTTPS verwenden**: Backend-URL muss HTTPS sein
2. **Firewall**: Port 8000 (oder gewählter Port) muss erreichbar sein
3. **Monitoring**: Backend-Logs prüfen für Fehler
4. **Backup**: Firebase Credentials sicher aufbewahren

## 🧪 Testen vor Production:

1. Backend lokal starten
2. App mit Production-URL testen (temporär)
3. Test-Bestellung durchführen
4. Prüfen ob E-Mail ankommt
5. URL wieder auf Production setzen


