#!/bin/bash

# Setup-Script für Bottle-Trade Backend als systemd Service
# Führe dieses Script mit sudo aus: sudo ./setup-systemd-service.sh

set -e

echo "=========================================="
echo "Bottle-Trade Backend systemd Service Setup"
echo "=========================================="
echo ""

# Prüfe ob als root/sudo ausgeführt
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Bitte führe dieses Script mit sudo aus:"
    echo "   sudo ./setup-systemd-service.sh"
    exit 1
fi

SERVICE_NAME="bottle-trade-backend"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SOURCE_FILE="/home/bottleadmin/bottle-trade-mobile/backend-api/${SERVICE_NAME}.service"

# Prüfe ob Service-Datei existiert
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Service-Datei nicht gefunden: $SOURCE_FILE"
    exit 1
fi

# Kopiere Service-Datei
echo "📋 Kopiere Service-Datei..."
cp "$SOURCE_FILE" "$SERVICE_FILE"
chmod 644 "$SERVICE_FILE"
echo "✅ Service-Datei kopiert: $SERVICE_FILE"

# Lade systemd neu
echo "🔄 Lade systemd neu..."
systemctl daemon-reload
echo "✅ systemd neu geladen"

# Stoppe alte Backend-Prozesse (falls vorhanden)
echo "🛑 Stoppe alte Backend-Prozesse..."
pkill -f "uvicorn main:app" 2>/dev/null || true
sleep 2
echo "✅ Alte Prozesse gestoppt"

# Aktiviere Service (startet automatisch beim Boot)
echo "🔧 Aktiviere Service..."
systemctl enable "$SERVICE_NAME"
echo "✅ Service aktiviert (startet automatisch beim Boot)"

# Starte Service
echo "🚀 Starte Service..."
systemctl start "$SERVICE_NAME"
sleep 3

# Prüfe Status
echo ""
echo "📊 Service-Status:"
systemctl status "$SERVICE_NAME" --no-pager | head -15

echo ""
echo "=========================================="
echo "✅ Setup abgeschlossen!"
echo "=========================================="
echo ""
echo "Service-Befehle:"
echo "  Status:    sudo systemctl status $SERVICE_NAME"
echo "  Start:     sudo systemctl start $SERVICE_NAME"
echo "  Stop:      sudo systemctl stop $SERVICE_NAME"
echo "  Restart:   sudo systemctl restart $SERVICE_NAME"
echo "  Logs:      sudo journalctl -u $SERVICE_NAME -f"
echo ""

