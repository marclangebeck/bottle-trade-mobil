#!/bin/bash

# Admin-Web Deploy-Skript
# Führt Build aus und zeigt Status an

set -e  # Stoppe bei Fehlern

# Setze nvm-PATH (falls nvm nicht geladen ist)
export PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH"

echo "🚀 Admin-Web Deployment gestartet..."
echo ""

# Prüfe ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo "❌ Fehler: package.json nicht gefunden!"
    echo "   Bitte führe dieses Skript aus dem admin-web Verzeichnis aus."
    exit 1
fi

# Prüfe ob Node.js verfügbar ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nicht gefunden. Bitte nvm laden:"
    echo "   source ~/.bashrc"
    exit 1
fi

# Prüfe ob node_modules existiert
if [ ! -d "node_modules" ]; then
    echo "📦 Installiere Dependencies..."
    npm install
fi

# Baue die Anwendung
echo "🔨 Baue Admin-Web..."
npm run build

# Prüfe ob Build erfolgreich war
if [ ! -d "dist" ]; then
    echo "❌ Fehler: dist/ Ordner wurde nicht erstellt!"
    exit 1
fi

# Zeige Build-Info
echo ""
echo "✅ Build abgeschlossen!"
echo ""
echo "📊 Build-Informationen:"
echo "   - Dist-Ordner: $(du -sh dist | cut -f1)"
echo "   - Dateien: $(find dist -type f | wc -l)"
echo ""
echo "🌐 Neue Version ist jetzt live unter:"
echo "   https://bottle-trade.de/admin"
echo ""
echo "💡 Tipp: Falls alte Version angezeigt wird,"
echo "   mache einen Hard Refresh im Browser:"
echo "   - Windows/Linux: Ctrl+Shift+R"
echo "   - Mac: Cmd+Shift+R"
echo ""

