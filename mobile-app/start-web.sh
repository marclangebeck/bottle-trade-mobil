#!/bin/bash

# Skript zum Starten der Expo Web-Version
# Verwendung: ./start-web.sh

PORT=8081

echo "🔍 Prüfe Port $PORT..."

# Finde ALLE Prozesse auf Port 8081
PIDS=$(lsof -ti:$PORT 2>/dev/null)

if [ ! -z "$PIDS" ]; then
    echo "⚠️  Port $PORT ist belegt von Prozess(en): $PIDS"
    echo "🛑 Beende Prozess(e)..."
    
    # Beende alle Prozesse auf dem Port
    echo "$PIDS" | xargs -r kill -9 2>/dev/null
    sleep 2
    
    # Prüfe nochmal ob Port jetzt frei ist
    REMAINING_PIDS=$(lsof -ti:$PORT 2>/dev/null)
    if [ ! -z "$REMAINING_PIDS" ]; then
        echo "❌ Konnte Prozess(e) nicht beenden. Versuche mit sudo..."
        echo "$REMAINING_PIDS" | xargs -r sudo kill -9 2>/dev/null
        sleep 2
    fi
    
    # Finale Prüfung
    FINAL_CHECK=$(lsof -ti:$PORT 2>/dev/null)
    if [ -z "$FINAL_CHECK" ]; then
        echo "✅ Port $PORT wurde erfolgreich freigegeben"
    else
        echo "⚠️  Warnung: Port $PORT könnte noch belegt sein von: $FINAL_CHECK"
    fi
else
    echo "✅ Port $PORT ist frei"
fi

# Wechsle ins mobile-app Verzeichnis
cd /home/bottleadmin/bottle-trade-mobile/mobile-app

# Starte Expo Web (WICHTIG: --web Flag muss gesetzt sein!)
echo "🚀 Starte Expo Web Server..."
echo "📱 Öffne manuell im Browser: http://localhost:8081"
echo ""
echo "💡 Tipp: Öffne zwei Browser-Fenster/Tabs für zwei verschiedene Accounts"
echo "   Verwende verschiedene Browser (Chrome + Firefox) oder Incognito-Modus"
echo ""
echo "⚠️  WICHTIG: Verwende --web Flag für Web-Version (kein --tunnel!)"
echo "🚫 Browser wird NICHT automatisch geöffnet (--no-open)"
npx expo start --web --port $PORT --clear --no-open

