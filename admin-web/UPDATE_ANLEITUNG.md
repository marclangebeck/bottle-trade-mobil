# Admin-Web Updates deployen

**Stand:** 08. Dezember 2025  
**Frage:** Wie aktualisiere ich das Webportal und wann weiß es, dass neue Programmierung da ist?

---

## 🚀 Schnell-Update (Lokal auf dem Server)

Wenn du **direkt auf dem Server** arbeitest:

```bash
# 1. Gehe ins Admin-Web Verzeichnis
cd ~/bottle-trade-mobile/admin-web

# 2. Baue die neue Version
npm run build

# 3. Fertig! Nginx serviert automatisch die neuen Dateien aus dist/
```

**Das Webportal weiß sofort Bescheid**, weil:
- Nginx liest die Dateien direkt aus `dist/`
- Nach dem Build sind die neuen Dateien sofort verfügbar
- Browser laden beim nächsten Seitenaufruf die neuen Dateien

---

## 🔄 Update von lokalem Rechner (Remote)

Wenn du **auf deinem lokalen Rechner** arbeitest:

### Schritt 1: Lokal bauen

```bash
# Auf deinem lokalen Rechner
cd /pfad/zum/admin-web
npm run build
```

### Schritt 2: Auf Server übertragen

```bash
# Übertrage die neuen Dateien
scp -i ~/.ssh/admin_web_key -r dist/* bottleadmin@v2202505266333339459.bestsrv.de:~/bottle-trade-mobile/admin-web/dist/
```

**Oder mit rsync (empfohlen - nur geänderte Dateien):**

```bash
rsync -avz --delete -e "ssh -i ~/.ssh/admin_web_key" dist/ bottleadmin@v2202505266333339459.bestsrv.de:~/bottle-trade-mobile/admin-web/dist/
```

### Schritt 3: Fertig!

**Das Webportal weiß sofort Bescheid**, weil:
- Nginx serviert die Dateien direkt aus `dist/`
- Neue Dateien ersetzen die alten sofort
- Browser laden beim nächsten Seitenaufruf die neuen Dateien

---

## ⚡ Automatisches Deploy-Skript

Erstelle ein Skript für einfacheres Deployen:

### Option 1: Deploy-Skript auf dem Server

Erstelle `~/bottle-trade-mobile/admin-web/deploy.sh`:

```bash
#!/bin/bash
cd ~/bottle-trade-mobile/admin-web
echo "🔨 Baue Admin-Web..."
npm run build
echo "✅ Build abgeschlossen!"
echo "🌐 Neue Version ist jetzt live unter https://bottle-trade.de/admin"
```

**Verwendung:**
```bash
chmod +x ~/bottle-trade-mobile/admin-web/deploy.sh
~/bottle-trade-mobile/admin-web/deploy.sh
```

### Option 2: Remote-Deploy-Skript (lokal)

Erstelle auf deinem lokalen Rechner `deploy-remote.sh`:

```bash
#!/bin/bash
echo "🔨 Baue Admin-Web lokal..."
npm run build

echo "📤 Übertrage auf Server..."
rsync -avz --delete -e "ssh -i ~/.ssh/admin_web_key" dist/ bottleadmin@v2202505266333339459.bestsrv.de:~/bottle-trade-mobile/admin-web/dist/

echo "✅ Deployment abgeschlossen!"
echo "🌐 Neue Version ist jetzt live unter https://bottle-trade.de/admin"
```

**Verwendung:**
```bash
chmod +x deploy-remote.sh
./deploy-remote.sh
```

---

## 🕐 Wann ist die neue Version sichtbar?

### Sofort sichtbar:
- ✅ **Statische Dateien** (HTML, CSS, JS) werden sofort aktualisiert
- ✅ **Nach dem Build/Upload** sind neue Dateien verfügbar
- ✅ **Beim nächsten Seitenaufruf** lädt der Browser die neuen Dateien

### Browser-Cache:
- ⚠️ **Browser können alte Dateien cachen**
- **Lösung:** Hard Refresh im Browser:
  - **Chrome/Firefox:** `Ctrl+Shift+R` (Windows/Linux) oder `Cmd+Shift+R` (Mac)
  - **Oder:** Browser-Cache leeren

### Cache-Control Header:
Die Nginx-Konfiguration setzt bereits Cache-Header:
- **Statische Assets** (JS, CSS, Bilder): 1 Jahr Cache
- **HTML-Dateien**: Kein Cache (immer neu laden)

**Das bedeutet:**
- HTML wird immer neu geladen → Neue Version sofort sichtbar
- JS/CSS werden gecacht → Nach Update: Hard Refresh nötig

---

## 🔍 Prüfen ob Update erfolgreich war

### 1. Browser-Entwicklertools (F12)

```javascript
// In der Browser-Konsole prüfen:
console.log('Version:', document.querySelector('script[src*="index"]')?.src);
```

### 2. Server prüfen

```bash
# Prüfe wann dist/ zuletzt geändert wurde
ls -la ~/bottle-trade-mobile/admin-web/dist/

# Prüfe ob neue Dateien da sind
ls -lh ~/bottle-trade-mobile/admin-web/dist/assets/
```

### 3. Nginx-Logs prüfen

```bash
# Prüfe ob Requests ankommen
sudo tail -f /var/log/nginx/access.log | grep /admin
```

---

## 🐛 Troubleshooting

### Problem: Alte Version wird noch angezeigt

**Lösung 1: Browser-Cache leeren**
- Hard Refresh: `Ctrl+Shift+R` oder `Cmd+Shift+R`
- Oder: Browser-Cache komplett leeren

**Lösung 2: Prüfe ob neue Dateien auf Server sind**
```bash
ls -la ~/bottle-trade-mobile/admin-web/dist/
# Prüfe Datum/Zeit der Dateien
```

**Lösung 3: Prüfe Nginx-Konfiguration**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Problem: Build schlägt fehl

**Lösung:**
```bash
# Prüfe Fehler
cd ~/bottle-trade-mobile/admin-web
npm run build

# Falls TypeScript-Fehler:
npm run lint

# Falls Dependencies fehlen:
npm install
```

### Problem: Dateien werden nicht übertragen

**Lösung:**
```bash
# Prüfe SSH-Verbindung
ssh -i ~/.ssh/admin_web_key bottleadmin@v2202505266333339459.bestsrv.de

# Prüfe Berechtigungen
ls -la ~/bottle-trade-mobile/admin-web/dist/
```

---

## 📋 Checkliste für Updates

- [ ] Code-Änderungen gemacht
- [ ] `npm run build` erfolgreich
- [ ] Dateien auf Server übertragen (falls remote)
- [ ] Browser-Cache geleert (Hard Refresh)
- [ ] Neue Version im Browser getestet

---

## 🎯 Zusammenfassung

**Wie aktualisiere ich das Webportal?**
1. Code ändern
2. `npm run build` ausführen
3. Dateien auf Server übertragen (falls remote)
4. Fertig!

**Wann weiß das Webportal, dass neue Programmierung da ist?**
- ✅ **Sofort nach dem Build/Upload**
- ✅ **Nginx serviert die neuen Dateien direkt**
- ✅ **Beim nächsten Seitenaufruf** lädt der Browser die neuen Dateien
- ⚠️ **Browser-Cache kann alte Version zeigen** → Hard Refresh nötig

**Kein Server-Neustart nötig!** Nginx serviert statische Dateien direkt aus dem `dist/` Ordner.

---

**Fertig!** 🎉











