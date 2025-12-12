#!/bin/bash

# Skript zum Builden des Admin-Webs
# Verwendung: ./build.sh

# Wechsle ins admin-web Verzeichnis
cd /home/bottleadmin/bottle-trade-mobile/admin-web

# Setze nvm-PATH (falls nvm nicht geladen ist)
export PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH"

# Prüfe ob Node.js verfügbar ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nicht gefunden. Bitte nvm laden:"
    echo "   source ~/.bashrc"
    echo "   oder"
    echo "   export PATH=\"\$HOME/.nvm/versions/node/v20.19.6/bin:\$PATH\""
    exit 1
fi

echo "✅ Node.js Version: $(node --version)"
echo "✅ npm Version: $(npm --version)"
echo ""
echo "🚀 Starte Build..."
echo ""

# Führe Build aus
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build erfolgreich abgeschlossen!"
    echo "📦 Build-Output: dist/"
else
    echo ""
    echo "❌ Build fehlgeschlagen!"
    exit 1
fi










