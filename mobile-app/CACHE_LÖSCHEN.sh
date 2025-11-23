#!/bin/bash
echo "🧹 Lösche alle Caches für ChatListScreen..."
echo ""

# Metro Bundler Cache
echo "1. Lösche Metro Bundler Cache..."
rm -rf node_modules/.cache 2>/dev/null
rm -rf .expo 2>/dev/null
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/react-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null

# Watchman Cache (falls vorhanden)
echo "2. Lösche Watchman Cache..."
watchman watch-del-all 2>/dev/null || echo "   Watchman nicht installiert, überspringe..."

# Node Cache
echo "3. Lösche Node Module Cache..."
rm -rf node_modules/.cache 2>/dev/null

echo ""
echo "✅ Cache gelöscht!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. App vollständig beenden (nicht nur im Hintergrund)"
echo "2. Metro Bundler mit Cache-Löschung starten:"
echo "   npx expo start --clear"
echo "   ODER:"
echo "   npm start -- --reset-cache"
echo "3. App neu starten"
echo ""
echo "🔍 Prüfung: Schauen Sie in die Console - Sie sollten sehen:"
echo "   '✅ ChatListScreen V2.0 geladen - Modern Grid Design'"
