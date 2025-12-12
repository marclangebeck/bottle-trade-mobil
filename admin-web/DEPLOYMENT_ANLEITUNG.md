# Deployment-Anleitung für Admin-Web

**Stand:** 08. Dezember 2025

## ✅ Bereits erledigt

- ✅ Projekt gebaut (`dist/` Ordner)
- ✅ Dateien auf Server übertragen (`~/bottle-trade-mobile/admin-web/dist/`)

## 📋 Nächste Schritte (benötigt sudo)

### Schritt 1: Nginx-Konfiguration hinzufügen

**Option A: Bestehende Konfiguration erweitern**

```bash
# Backup der bestehenden Konfiguration
sudo cp /etc/nginx/sites-available/bottle-trade.de /etc/nginx/sites-available/bottle-trade.de.backup

# Öffne die Konfiguration
sudo nano /etc/nginx/sites-available/bottle-trade.de
```

**Füge diese Zeilen VOR dem `location /` Block hinzu:**

```nginx
# Admin-Web unter /admin
location /admin {
    alias /home/bottleadmin/bottle-trade-mobile/admin-web/dist;
    try_files $uri $uri/ /admin/index.html;
    
    # Cache-Control für statische Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Option B: Separate Konfigurationsdatei**

```bash
# Kopiere die Konfiguration
sudo cp ~/bottle-trade-mobile/admin-web/nginx-admin.conf /etc/nginx/sites-available/admin-web

# Verlinke die Konfiguration
sudo ln -s /etc/nginx/sites-available/admin-web /etc/nginx/sites-enabled/admin-web
```

### Schritt 2: Nginx-Konfiguration testen

```bash
sudo nginx -t
```

**Erwartete Ausgabe:** `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### Schritt 3: Nginx neu laden

```bash
sudo systemctl reload nginx
# oder
sudo service nginx reload
```

### Schritt 4: Testen

Öffne im Browser: `https://bottle-trade.de/admin`

**Erwartetes Ergebnis:**
- Login-Seite wird angezeigt
- Nach Login: Dashboard mit Statistiken

## 🔐 Wichtig: Firebase Auth einrichten

**Das Admin-Web nutzt Firebase Authentication.** Du musst einen Admin-User in Firebase Auth erstellen:

### Option 1: Firebase Console

1. Gehe zu https://console.firebase.google.com/
2. Wähle Projekt: `bottle-trade-app`
3. Authentication → Users → Add User
4. E-Mail: `admin@bottle-trade.de` (oder deine Admin-E-Mail)
5. Passwort: [sicheres Passwort]
6. User erstellen

### Option 2: Firebase CLI

```bash
# Installiere Firebase CLI (falls nicht vorhanden)
npm install -g firebase-tools

# Login
firebase login

# Erstelle User
firebase auth:import users.json
```

**Wichtig:** Der User muss auch in Firestore `users` Collection existieren mit `isAdmin: true`!

## 🐛 Troubleshooting

### Problem: 404 Not Found

**Lösung:**
- Prüfe ob `/admin` Location korrekt konfiguriert ist
- Prüfe ob `dist/` Ordner existiert: `ls -la ~/bottle-trade-mobile/admin-web/dist/`
- Prüfe Nginx-Error-Log: `sudo tail -f /var/log/nginx/error.log`

### Problem: 403 Forbidden

**Lösung:**
```bash
# Setze korrekte Berechtigungen
sudo chown -R bottleadmin:bottleadmin /home/bottleadmin/bottle-trade-mobile/admin-web/dist
sudo chmod -R 755 /home/bottleadmin/bottle-trade-mobile/admin-web/dist
```

### Problem: Login funktioniert nicht

**Lösung:**
- Prüfe ob Firebase Auth aktiviert ist in Firebase Console
- Prüfe ob User in Firestore `isAdmin: true` hat
- Prüfe Browser-Konsole für Fehler (F12)

## 📝 Nach dem Deployment

1. ✅ Teste Login: `https://bottle-trade.de/admin/login`
2. ✅ Teste Dashboard: Statistiken sollten angezeigt werden
3. ✅ Teste User-Verwaltung: User-Liste sollte geladen werden

## 🔄 Updates deployen

Wenn du Änderungen am Code machst:

```bash
# Lokal: Build erstellen
cd ~/bottle-trade-mobile/admin-web
npm run build

# Auf Server übertragen
scp -i ~/.ssh/admin_web_key -r dist/* bottleadmin@v2202505266333339459.bestsrv.de:~/bottle-trade-mobile/admin-web/dist/
```

**Fertig!** 🎉











