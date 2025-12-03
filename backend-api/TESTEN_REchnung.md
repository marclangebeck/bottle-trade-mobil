# Rechnungsstellung testen - Anleitung

## ✅ Ja, es ist testbar!

Die Rechnungsstellung kann auch in der Sandbox getestet werden. Hier die Schritte:

## 1. Backend starten

```bash
cd backend-api
pip install -r requirements.txt  # Falls noch nicht geschehen
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**WICHTIG:** `--host 0.0.0.0` erlaubt Verbindungen von anderen Geräten im Netzwerk.

## 2. Lokale IP-Adresse herausfinden

**Linux/Mac:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
# oder
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
# Suche nach "IPv4-Adresse" (z.B. 192.168.1.100)
```

## 3. App-Konfiguration anpassen

### Option A: Emulator/Simulator (einfachste Methode)
- `mobile-app/config/api.js` bleibt bei `http://localhost:8000`
- Funktioniert automatisch ✅

### Option B: Echtes Gerät
1. Öffne `mobile-app/config/api.js`
2. Ändere die URL zu deiner lokalen IP:
```javascript
export const BACKEND_API_URL = __DEV__ 
  ? 'http://192.168.1.100:8000'  // Deine lokale IP-Adresse
  : 'https://api.bottle-trade.de';
```
3. **WICHTIG:** App und Backend müssen im **gleichen WLAN** sein!

## 4. Firebase Credentials

1. Firebase Console öffnen
2. Service Account Key herunterladen
3. Als `firebase-credentials.json` im `backend-api/` Verzeichnis speichern

## 5. E-Mail-Konfiguration (optional für Tests)

Für Tests kann man auch ohne E-Mail-Versand testen:
- Backend generiert trotzdem das PDF
- E-Mail-Fehler wird geloggt, aber blockiert nicht

Oder für echte E-Mails:
```bash
export SMTP_SERVER=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASSWORD=your-app-password
export FROM_EMAIL=noreply@bottle-trade.de
```

## 6. Testen

1. Backend starten (siehe Schritt 1)
2. App starten
3. PayPal-Zahlung in Sandbox durchführen
4. Nach erfolgreicher Zahlung wird automatisch Rechnung generiert
5. Prüfe Backend-Logs für Erfolg/Fehler

## Troubleshooting

**"Network request failed":**
- Backend läuft nicht → Starte Backend
- Falsche IP-Adresse → Prüfe IP und URL
- Nicht im gleichen WLAN → Verbinde beide Geräte mit gleichem WLAN
- Firewall blockiert → Port 8000 freigeben

**"Firebase-Fehler":**
- `firebase-credentials.json` fehlt → Herunterladen und speichern

**"E-Mail-Fehler":**
- Nicht kritisch für Tests
- PDF wird trotzdem generiert
- Prüfe SMTP-Credentials für echte E-Mails

## Schnelltest ohne E-Mail

Das Backend funktioniert auch ohne E-Mail-Konfiguration:
- PDF wird generiert
- E-Mail-Fehler wird geloggt, aber blockiert nicht
- Bestellung bleibt als "paid" markiert


