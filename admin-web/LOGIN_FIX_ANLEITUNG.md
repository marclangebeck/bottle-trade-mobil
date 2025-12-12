# Login-Fix: Test-Auth-System nutzen

**Stand:** 08. Dezember 2025  
**Problem:** Login funktioniert nicht, weil Web-App Firebase Auth nutzt, aber App Test-Auth-System

## ✅ Lösung

Die Login-Seite wurde angepasst, um das gleiche Test-Auth-System wie die App zu nutzen.

## 📋 Admin-Zugangsdaten

**E-Mail:** `admin@bottle-trade.de`  
**Passwort:** `emma`

(Dies sind die gleichen Daten wie in der App)

## 🔄 Update auf Server

Führe diese Befehle auf dem Server aus:

```bash
# 1. Neue Dateien übertragen (von lokalem Computer)
# Oder: Lade die aktualisierten Dateien manuell hoch

# 2. Falls du die Dateien lokal hast:
cd ~/bottle-trade-mobile/admin-web
npm run build

# 3. Oder: Kopiere die dist-Dateien direkt
# Die neuen Dateien sind bereits gebaut und müssen nur übertragen werden
```

## 🚀 Schnelle Lösung

**Option 1: Lokal builden und übertragen**

```bash
# Auf deinem lokalen Computer (wo das Projekt ist):
cd ~/bottle-trade-mobile/admin-web
npm run build
scp -i ~/.ssh/admin_web_key -r dist/* bottleadmin@v2202505266333339459.bestsrv.de:~/bottle-trade-mobile/admin-web/dist/
```

**Option 2: Ich übertrage die Dateien**

Falls du möchtest, kann ich die Dateien auch direkt übertragen. Sag einfach Bescheid!

## ✅ Nach dem Update

1. Öffne: `https://admin.bottle-trade.de`
2. Login mit:
   - E-Mail: `admin@bottle-trade.de`
   - Passwort: `emma`
3. Dashboard sollte angezeigt werden

## 🐛 Falls es nicht funktioniert

**Prüfe:**
- Browser-Cache leeren (Strg+Shift+R)
- Prüfe Browser-Konsole (F12) für Fehler
- Prüfe ob User in Firestore existiert mit `isAdmin: true`

**User in Firestore prüfen:**
- Gehe zu Firebase Console
- Firestore → users Collection
- Suche nach `admin@bottle-trade.de`
- Prüfe: `isAdmin: true` und `password: "emma"`

---

**Erstellt am:** 08. Dezember 2025











