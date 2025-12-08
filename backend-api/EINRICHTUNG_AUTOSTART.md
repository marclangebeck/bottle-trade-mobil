# Backend-API automatisch starten - Anleitung

## Schritt-für-Schritt Anleitung

### 1. Setup-Script ausführen

Führe folgendes Kommando aus (benötigt sudo-Rechte):

```bash
cd /home/bottleadmin/bottle-trade-mobile/backend-api
sudo ./setup-systemd-service.sh
```

### 2. Was passiert?

Das Script:
- ✅ Kopiert die Service-Datei nach `/etc/systemd/system/`
- ✅ Aktiviert den automatischen Start (beim Boot)
- ✅ Startet den Service sofort
- ✅ Zeigt den Status

### 3. Prüfen ob es funktioniert

```bash
# Service-Status prüfen
sudo systemctl status bottle-trade-backend

# Prüfen ob Backend erreichbar ist
curl http://localhost:8000/health
```

### 4. Service-Befehle

Nach der Einrichtung:

```bash
# Service starten
sudo systemctl start bottle-trade-backend

# Service stoppen
sudo systemctl stop bottle-trade-backend

# Service neu starten
sudo systemctl restart bottle-trade-backend

# Status prüfen
sudo systemctl status bottle-trade-backend

# Logs anzeigen (live)
sudo journalctl -u bottle-trade-backend -f
```

### 5. Test: Server neu starten

Nach der Einrichtung kannst du den Server neu starten:

```bash
sudo reboot
```

Nach dem Neustart sollte das Backend automatisch laufen. Prüfe mit:

```bash
curl http://localhost:8000/health
```

## Troubleshooting

### Service startet nicht

```bash
# Prüfe Logs
sudo journalctl -u bottle-trade-backend -n 50

# Prüfe ob Port belegt ist
sudo netstat -tlnp | grep 8000

# Prüfe Service-Datei
cat /etc/systemd/system/bottle-trade-backend.service
```

### Service-Datei bearbeiten

```bash
sudo nano /etc/systemd/system/bottle-trade-backend.service
sudo systemctl daemon-reload
sudo systemctl restart bottle-trade-backend
```

## Wichtig

Nach der Einrichtung startet das Backend **automatisch**:
- ✅ Beim Server-Boot
- ✅ Nach einem Neustart
- ✅ Automatisch neu, falls es abstürzt

Du musst das Backend **nicht mehr manuell starten**!

