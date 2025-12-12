# Nginx-Konfiguration aktualisieren

**Stand:** 08. Dezember 2025  
**Ziel:** Neue Admin-Web-App unter `/admin` einrichten

---

## ⚠️ Wichtig: Backup erstellen!

Bevor du die Konfiguration änderst, erstelle ein Backup:

```bash
sudo cp /etc/nginx/sites-available/bottle-trade.de /etc/nginx/sites-available/bottle-trade.de.backup
```

---

## 📋 Schritt-für-Schritt Anleitung

### Schritt 1: Backup erstellen

```bash
sudo cp /etc/nginx/sites-available/bottle-trade.de /etc/nginx/sites-available/bottle-trade.de.backup
```

### Schritt 2: Neue Konfiguration kopieren

```bash
sudo cp ~/bottle-trade-mobile/admin-web/nginx-bottle-trade-updated.conf /etc/nginx/sites-available/bottle-trade.de
```

### Schritt 3: Konfiguration testen

```bash
sudo nginx -t
```

**Erwartete Ausgabe:**
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Falls Fehler:** Prüfe die Fehlermeldung und korrigiere sie.

### Schritt 4: Nginx neu laden

```bash
sudo systemctl reload nginx
```

**Oder:**
```bash
sudo service nginx reload
```

### Schritt 5: Testen

Öffne im Browser: `https://bottle-trade.de/admin`

**Erwartetes Ergebnis:**
- ✅ Login-Seite der neuen Admin-Web-App wird angezeigt
- ✅ Alte Admin-Seite ist nicht mehr erreichbar

---

## 🔄 Falls etwas schief geht: Zurücksetzen

```bash
# Alte Konfiguration wiederherstellen
sudo cp /etc/nginx/sites-available/bottle-trade.de.backup /etc/nginx/sites-available/bottle-trade.de

# Nginx neu laden
sudo systemctl reload nginx
```

---

## ✅ Was wurde geändert?

Die neue Konfiguration fügt diese Location hinzu:

```nginx
location /admin {
    alias /home/bottleadmin/bottle-trade-mobile/admin-web/dist;
    try_files $uri $uri/ /admin/index.html;
}
```

**Wichtig:** Diese Location steht VOR `location /`, damit `/admin` Requests nicht an die Flask-App weitergeleitet werden.

---

## 🐛 Troubleshooting

### Problem: 404 Not Found unter /admin

**Lösung:**
```bash
# Prüfe ob dist-Ordner existiert
ls -la /home/bottleadmin/bottle-trade-mobile/admin-web/dist/

# Prüfe Berechtigungen
sudo chown -R bottleadmin:bottleadmin /home/bottleadmin/bottle-trade-mobile/admin-web/dist
sudo chmod -R 755 /home/bottleadmin/bottle-trade-mobile/admin-web/dist
```

### Problem: 403 Forbidden

**Lösung:**
```bash
# Setze korrekte Berechtigungen
sudo chmod -R 755 /home/bottleadmin/bottle-trade-mobile/admin-web/dist
```

### Problem: Nginx startet nicht

**Lösung:**
```bash
# Prüfe Fehler
sudo nginx -t

# Prüfe Logs
sudo tail -f /var/log/nginx/error.log
```

---

**Fertig!** 🎉

Nach erfolgreicher Konfiguration ist die neue Admin-Web-App unter `https://bottle-trade.de/admin` erreichbar.











