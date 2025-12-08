# Timeout-Debugging: Detaillierte Analyse

## Problem
- App zeigt Timeout-Warnungen
- Keine E-Mails kommen an
- Backend antwortet schnell (0.003s), aber App bekommt Timeouts

## Mögliche Ursachen

### 1. Requests kommen nicht beim Backend an
- Firewall blockiert Port 8000
- Netzwerk-Problem zwischen App und Server
- Backend läuft nicht auf 0.0.0.0

### 2. Requests kommen an, aber Response kommt nicht zurück
- Firewall blockiert ausgehende Verbindungen
- Netzwerk-Latenz zu hoch
- Proxy/Reverse-Proxy Problem

### 3. App verwendet falsche URL
- BACKEND_API_URL nicht korrekt
- App-Cache verwendet alte URL

## Debugging-Schritte

### 1. Backend-Logs prüfen
```bash
# Wenn als Service läuft
sudo journalctl -u bottle-trade-backend -f

# Wenn manuell gestartet
tail -f /tmp/backend.log
```

Sollte zeigen:
- `📧 [REQUEST ERHALTEN]` → Request kommt an
- `📬 [QUEUE]` → Task in Queue
- `✅ [RESPONSE]` → Response gesendet
- `🔄 [WORKER]` → Worker verarbeitet
- `✅ [WORKER]` → E-Mail versendet

### 2. App-Logs prüfen
In der App-Konsole sollte erscheinen:
- `📤 [APP] Sende Registrierungs-E-Mail-Request`
- `✅ [APP] Request erfolgreich` ODER `❌ [APP] Request fehlgeschlagen`

### 3. Netzwerk-Test
```bash
# Von Server aus
curl -v http://185.162.250.235:8000/health

# Von außen (anderer Rechner)
curl -v http://185.162.250.235:8000/health
```

### 4. Firewall prüfen
```bash
# Prüfe ob Port 8000 offen ist
sudo ufw status
sudo iptables -L -n | grep 8000

# Falls blockiert, öffne Port
sudo ufw allow 8000/tcp
```

## Nächste Schritte

1. **Test-Registrierung durchführen**
2. **Backend-Logs prüfen:** Kommen Requests an?
3. **App-Logs prüfen:** Was zeigt die App?
4. **Netzwerk prüfen:** Ist Port 8000 erreichbar?

## Erwartete Logs

### Backend (bei erfolgreichem Request):
```
📧 [REQUEST ERHALTEN] Plane Registrierungs-E-Mail-Versand an: user@example.com
📬 [QUEUE] E-Mail-Task zur Queue hinzugefügt für: user@example.com (Queue-Größe: 1)
✅ [RESPONSE] Sende Response für: user@example.com
🔄 [WORKER] Verarbeite E-Mail-Task aus Queue
📧 E-Mail-Versand: Von: ... An: ...
✅ E-Mail erfolgreich gesendet an: user@example.com
✅ [WORKER] E-Mail-Task erfolgreich verarbeitet
```

### App (bei erfolgreichem Request):
```
📤 [APP] Sende Registrierungs-E-Mail-Request an: http://185.162.250.235:8000/auth/send-registration-email
✅ [APP] Registrierungs-E-Mail-Request erfolgreich (Dauer: 50ms): {"message":"..."}
```

### App (bei Timeout):
```
📤 [APP] Sende Registrierungs-E-Mail-Request an: http://185.162.250.235:8000/auth/send-registration-email
❌ [APP] Registrierungs-E-Mail-Request fehlgeschlagen (Dauer: 10000ms): timeout of 10000ms exceeded
```

