#!/bin/bash
# Monitoring-Script für Backend-Requests

echo "=========================================="
echo "Backend Request Monitor"
echo "=========================================="
echo ""
echo "Warte auf Requests..."
echo "Drücke Ctrl+C zum Beenden"
echo ""
echo "Zeigt nur wichtige Meldungen:"
echo "  - 📧 [REQUEST ERHALTEN] = Request kam an"
echo "  - 📬 [QUEUE] = Task in Queue"
echo "  - ✅ [RESPONSE] = Response gesendet"
echo "  - 🔄 [WORKER] = Worker verarbeitet"
echo "  - POST Requests"
echo ""
echo "=========================================="
echo ""

tail -f /tmp/backend-full.log 2>/dev/null | grep --line-buffered -E "REQUEST|QUEUE|WORKER|RESPONSE|POST.*send-registration|POST.*notify-admin" || {
    echo "❌ Log-Datei nicht gefunden oder Backend läuft nicht"
    echo "Starte Backend mit:"
    echo "  cd /home/bottleadmin/bottle-trade-mobile/backend-api"
    echo "  source venv/bin/activate"
    echo "  uvicorn main:app --host 0.0.0.0 --port 8000 2>&1 | tee /tmp/backend-full.log"
}

