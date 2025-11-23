#!/bin/bash

echo "🧹 Cache-Clear Script für React Native / Expo"
echo "=========================================="
echo ""

# Stoppe Metro Bundler falls läuft
echo "1️⃣  Stoppe Metro Bundler..."
pkill -f "expo start" || true
pkill -f "metro" || true
sleep 2

# Lösche Metro Cache
echo "2️⃣  Lösche Metro Cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true

# Lösche Watchman Cache
echo "3️⃣  Lösche Watchman Cache..."
watchman watch-del-all 2>/dev/null || echo "   ⚠️  Watchman nicht installiert oder nicht verfügbar"

# Lösche Expo Cache
echo "4️⃣  Lösche Expo Cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Lösche node_modules/.cache
echo "5️⃣  Lösche node_modules Cache..."
cd mobile-app
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true

# Lösche iOS Build Cache (falls vorhanden)
echo "6️⃣  Lösche iOS Build Cache..."
rm -rf ios/build 2>/dev/null || true
rm -rf ios/Pods 2>/dev/null || true

# Lösche Android Build Cache (falls vorhanden)
echo "7️⃣  Lösche Android Build Cache..."
rm -rf android/build 2>/dev/null || true
rm -rf android/app/build 2>/dev/null || true
rm -rf android/.gradle 2>/dev/null || true

cd ..

echo ""
echo "✅ Cache-Clear abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "   1. cd mobile-app"
echo "   2. npx expo start --clear"
echo ""





