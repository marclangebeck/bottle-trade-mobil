#!/bin/bash
echo "🧹 Lösche alle React Native/Expo Caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/haste-*
echo "✅ Cache gelöscht"
echo ""
echo "Bitte führen Sie jetzt aus:"
echo "1. npx expo start --clear"
echo "oder"
echo "2. npm start -- --reset-cache"
