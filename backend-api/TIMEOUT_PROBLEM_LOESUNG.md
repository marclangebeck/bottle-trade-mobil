# Timeout-Problem: Detaillierte Analyse und Lösung

## Aktueller Status

✅ **Backend läuft:** Port 8000, erreichbar von localhost
✅ **Queue funktioniert:** Tasks werden hinzugefügt
✅ **Worker-Thread funktioniert:** Verarbeitet Queue
✅ **E-Mail-Versand funktioniert:** SMTP-Verbindung OK

❌ **Problem:** App bekommt Timeouts, Requests kommen möglicherweise nicht an

## Mögliche Ursachen

### 1. Firewall blockiert Port 8000 von außen

**Prüfen:**
```bash
sudo ufw status
sudo iptables -L -n | grep 8000
```

**Lösung:**
```bash
sudo ufw allow 8000/tcp
sudo ufw reload
```

### 2. Backend läuft nicht auf 0.0.0.0

**Prüfen:**
```bash
netstat -tlnp | grep 8000
# Sollte zeigen: 0.0.0.0:8000 (nicht 127.0.0.1:8000)
```

**Lösung:**
Backend muss mit `--host 0.0.0.0` gestartet werden

### 3. Netzwerk-Problem zwischen App und Server

**Prüfen:**
```bash
# Von Server aus
curl -v http://185.162.250.235:8000/health

# Von App-Gerät aus (falls möglich)
curl -v http://185.162.250.235:8000/health
```

### 4. Requests kommen an, aber Response kommt nicht zurück

**Prüfen:**
Backend-Logs sollten zeigen:
- `📧 [REQUEST ERHALTEN]` → Request kommt an
- `✅ [RESPONSE]` → Response gesendet

Wenn `REQUEST ERHALTEN` fehlt → Request kommt nicht an
Wenn `REQUEST ERHALTEN` da ist, aber App Timeout → Response kommt nicht zurück

## Debugging

### 1. Backend-Logs in Echtzeit prüfen

```bash
# Terminal 1: Backend starten mit Logging
cd /home/bottleadmin/bottle-trade-mobile/backend-api
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 2>&1 | tee /tmp/backend-full.log

# Terminal 2: Logs filtern
tail -f /tmp/backend-full.log | grep -E "REQUEST|QUEUE|WORKER|RESPONSE|POST"
```

### 2. App-Logs prüfen

In der App-Konsole sollte erscheinen:
- `📤 [APP] Sende Registrierungs-E-Mail-Request`
- `✅ [APP] Request erfolgreich` ODER `❌ [APP] Request fehlgeschlagen`

### 3. Netzwerk-Test

```bash
# Test von außen (anderer Rechner oder mit curl)
curl -v --max-time 5 http://185.162.250.235:8000/health

# Sollte zeigen:
# * Connected to 185.162.250.235 port 8000
# < HTTP/1.1 200 OK
```

## Erwartete Logs bei erfolgreichem Request

### Backend:
```
📧 [REQUEST ERHALTEN] Plane Registrierungs-E-Mail-Versand an: user@example.com
📬 [QUEUE] E-Mail-Task zur Queue hinzugefügt für: user@example.com (Queue-Größe: 1)
✅ [RESPONSE] Sende Response für: user@example.com
INFO: ... "POST /auth/send-registration-email HTTP/1.1" 200 OK
🔄 [WORKER] Verarbeite E-Mail-Task aus Queue
📧 E-Mail-Versand: Von: ... An: ...
✅ E-Mail erfolgreich gesendet an: user@example.com
✅ [WORKER] E-Mail-Task erfolgreich verarbeitet
```

### App:
```
📤 [APP] Sende Registrierungs-E-Mail-Request an: http://185.162.250.235:8000/auth/send-registration-email
✅ [APP] Registrierungs-E-Mail-Request erfolgreich (Dauer: 50ms): {"message":"..."}
```

## Nächste Schritte

1. **Firewall prüfen und öffnen** (falls blockiert)
2. **Test-Registrierung durchführen**
3. **Backend-Logs prüfen:** Kommt `📧 [REQUEST ERHALTEN]`?
4. **App-Logs prüfen:** Was zeigt die App?
5. **Netzwerk-Test:** Ist Port 8000 von außen erreichbar?

## Schnelltest

```bash
# Terminal 1: Backend mit Logging
cd /home/bottleadmin/bottle-trade-mobile/backend-api
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 2>&1 | tee /tmp/backend-full.log

# Terminal 2: Monitoring
tail -f /tmp/backend-full.log | grep -E "REQUEST|QUEUE|WORKER|RESPONSE"

# Dann: Test-Registrierung in der App durchführen
# Sollte in Terminal 2 erscheinen: 📧 [REQUEST ERHALTEN]
```

Wenn `📧 [REQUEST ERHALTEN]` **nicht** erscheint → Request kommt nicht an (Firewall/Netzwerk-Problem)
Wenn `📧 [REQUEST ERHALTEN]` **erscheint** → Request kommt an, aber Response kommt nicht zurück

