# Backend schnell starten

## Option 1: systemd Service einrichten (empfohlen - startet automatisch)

```bash
cd /home/bottleadmin/bottle-trade-mobile/backend-api
sudo ./setup-systemd-service.sh
```

Danach startet das Backend automatisch beim Server-Boot.

## Option 2: Manuell starten

```bash
cd /home/bottleadmin/bottle-trade-mobile/backend-api
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Hinweis:** Dies startet das Backend nur für die aktuelle Session. Nach einem Neustart muss es erneut gestartet werden.

## Status prüfen

```bash
# Prüfe ob Backend läuft
curl http://localhost:8000/health

# Prüfe systemd Service (falls eingerichtet)
sudo systemctl status bottle-trade-backend
```

## Backend im Hintergrund starten (ohne systemd)

```bash
cd /home/bottleadmin/bottle-trade-mobile/backend-api
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

## Empfehlung

**Verwende Option 1 (systemd Service)** - dann startet das Backend automatisch und du musst dich nicht darum kümmern!
