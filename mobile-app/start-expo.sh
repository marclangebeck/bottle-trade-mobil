#!/bin/bash

# Skript zum Starten von Expo mit Port-Freigabe
# Verwendung: ./start-expo.sh

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

# Starte Expo
echo "🚀 Starte Expo Server..."
# CI-Variable deaktivieren, damit QR-Code angezeigt wird
unset CI
export PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH"
npx expo start --tunnel --clear --port $PORT



