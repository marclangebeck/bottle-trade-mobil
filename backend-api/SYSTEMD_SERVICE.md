# Backend als systemd Service

Das Backend läuft jetzt als systemd Service und startet automatisch mit dem Server.

## Service-Befehle

### Status prüfen
```bash
sudo systemctl status bottle-trade-backend
```

### Service starten
```bash
sudo systemctl start bottle-trade-backend
```

### Service stoppen
```bash
sudo systemctl stop bottle-trade-backend
```

### Service neu starten
```bash
sudo systemctl restart bottle-trade-backend
```

### Logs anzeigen
```bash
sudo journalctl -u bottle-trade-backend -f
```

### Service deaktivieren (startet nicht mehr automatisch)
```bash
sudo systemctl disable bottle-trade-backend
```

### Service aktivieren (startet automatisch)
```bash
sudo systemctl enable bottle-trade-backend
```

## Service-Datei

Die Service-Datei liegt unter:
- `/etc/systemd/system/bottle-trade-backend.service`
- Template: `/home/bottleadmin/bottle-trade-mobile/backend-api/bottle-trade-backend.service`

## Automatischer Start

Der Service ist aktiviert und startet automatisch:
- Beim Server-Boot
- Nach einem Neustart
- Automatisch neu, falls er abstürzt (Restart=always)

## Logs

Die Logs werden in systemd journal gespeichert:
```bash
# Alle Logs
sudo journalctl -u bottle-trade-backend

# Live-Logs (follow)
sudo journalctl -u bottle-trade-backend -f

# Letzte 100 Zeilen
sudo journalctl -u bottle-trade-backend -n 100
```

## Troubleshooting

### Service startet nicht
```bash
# Prüfe Status
sudo systemctl status bottle-trade-backend

# Prüfe Logs
sudo journalctl -u bottle-trade-backend -n 50

# Prüfe ob Port belegt ist
sudo netstat -tlnp | grep 8000
```

### Service-Datei bearbeiten
```bash
sudo nano /etc/systemd/system/bottle-trade-backend.service
sudo systemctl daemon-reload
sudo systemctl restart bottle-trade-backend
```

### Manuell testen
```bash
cd /home/bottleadmin/bottle-trade-mobile/backend-api
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

