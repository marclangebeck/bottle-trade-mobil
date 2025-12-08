#!/bin/bash
# Script zum Prüfen ob Requests ankommen

echo "Warte auf Requests auf Port 8000..."
echo "Drücke Ctrl+C zum Beenden"
echo ""

tail -f /tmp/backend-full.log 2>/dev/null | grep --line-buffered -E "REQUEST|QUEUE|WORKER|RESPONSE|INFO.*POST" || echo "Logs nicht verfügbar - prüfe ob Backend läuft"

