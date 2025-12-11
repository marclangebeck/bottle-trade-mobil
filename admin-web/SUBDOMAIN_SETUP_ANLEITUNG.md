# Setup für admin.bottle-trade.de Subdomain

**Stand:** 08. Dezember 2025  
**Ziel:** Admin-Web-App unter `admin.bottle-trade.de` einrichten

---

## 📋 Schritt-für-Schritt Anleitung

### Schritt 1: DNS-Eintrag prüfen/erstellen

**Prüfe ob DNS-Eintrag existiert:**

```bash
# Prüfe DNS-Eintrag
dig admin.bottle-trade.de
# oder
nslookup admin.bottle-trade.de
```

**Falls nicht vorhanden:** Erstelle einen A-Record:
- **Name:** `admin`
- **Typ:** `A`
- **Wert:** [Deine Server-IP] (gleiche IP wie bottle-trade.de)
- **TTL:** 3600 (oder Standard)

**Warte 5-10 Minuten** bis DNS propagiert ist.

---

### Schritt 2: Nginx-Konfiguration erstellen

```bash
# Kopiere die Konfiguration
sudo cp ~/bottle-trade-mobile/admin-web/nginx-admin-subdomain.conf /etc/nginx/sites-available/admin.bottle-trade.de

# Verlinke die Konfiguration
sudo ln -s /etc/nginx/sites-available/admin.bottle-trade.de /etc/nginx/sites-enabled/admin.bottle-trade.de
```

---

### Schritt 3: Nginx-Konfiguration testen (ohne SSL)

```bash
# Teste Konfiguration
sudo nginx -t
```

**Erwartete Ausgabe:**
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Falls Fehler:** Korrigiere die Fehlermeldung

---

### Schritt 4: Nginx neu laden

```bash
sudo systemctl reload nginx
```

---

### Schritt 5: SSL-Zertifikat mit Certbot erstellen

```bash
# Installiere Certbot (falls nicht vorhanden)
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Erstelle SSL-Zertifikat für Subdomain
sudo certbot --nginx -d admin.bottle-trade.de
```

**Certbot wird automatisch:**
- SSL-Zertifikat erstellen
- Nginx-Konfiguration aktualisieren
- Auto-Renewal einrichten

**Folge den Anweisungen:**
- E-Mail eingeben (für Benachrichtigungen)
- Terms of Service akzeptieren
- Optional: E-Mail für Newsletter

---

### Schritt 6: Nginx nach Certbot neu laden

```bash
sudo systemctl reload nginx
```

---

### Schritt 7: Testen

Öffne im Browser: `https://admin.bottle-trade.de`

**Erwartetes Ergebnis:**
- ✅ Login-Seite der Admin-Web-App wird angezeigt
- ✅ SSL-Zertifikat ist gültig (grünes Schloss)

---

## 🔒 Berechtigungen prüfen

Falls 403 Forbidden:

```bash
# Setze korrekte Berechtigungen
sudo chown -R bottleadmin:bottleadmin /home/bottleadmin/bottle-trade-mobile/admin-web/dist
sudo chmod -R 755 /home/bottleadmin/bottle-trade-mobile/admin-web/dist
```

---

## 🐛 Troubleshooting

### Problem: DNS löst nicht auf

**Lösung:**
- Prüfe DNS-Eintrag in deinem DNS-Provider
- Warte länger (DNS-Propagation kann bis zu 48h dauern, meist 5-30 Minuten)
- Prüfe mit: `dig admin.bottle-trade.de`

### Problem: Certbot kann kein SSL-Zertifikat erstellen

**Fehler:** "Failed to obtain certificate"

**Lösung:**
- Prüfe ob DNS-Eintrag korrekt ist
- Prüfe ob Port 80 und 443 offen sind
- Prüfe Firewall: `sudo ufw status`
- Öffne Ports falls nötig: `sudo ufw allow 80 && sudo ufw allow 443`

### Problem: 502 Bad Gateway

**Lösung:**
- Prüfe ob Nginx läuft: `sudo systemctl status nginx`
- Prüfe Error-Log: `sudo tail -f /var/log/nginx/error.log`
- Prüfe ob dist-Ordner existiert: `ls -la /home/bottleadmin/bottle-trade-mobile/admin-web/dist/`

### Problem: 404 Not Found

**Lösung:**
- Prüfe ob `index.html` existiert: `ls -la /home/bottleadmin/bottle-trade-mobile/admin-web/dist/index.html`
- Prüfe Nginx-Konfiguration: `sudo nginx -t`
- Prüfe ob root-Pfad korrekt ist in Konfiguration

---

## ✅ Checkliste

- [ ] DNS-A-Record für `admin.bottle-trade.de` erstellt
- [ ] DNS-Propagation abgewartet (5-30 Minuten)
- [ ] Nginx-Konfiguration kopiert und verlinkt
- [ ] Nginx-Konfiguration getestet (`sudo nginx -t`)
- [ ] Nginx neu geladen (`sudo systemctl reload nginx`)
- [ ] SSL-Zertifikat mit Certbot erstellt
- [ ] Berechtigungen korrekt gesetzt
- [ ] Seite funktioniert: `https://admin.bottle-trade.de`

---

## 🔄 Updates deployen

Wenn du Änderungen am Code machst:

```bash
# Lokal: Build erstellen
cd ~/bottle-trade-mobile/admin-web
npm run build

# Auf Server übertragen
scp -i ~/.ssh/admin_web_key -r dist/* bottleadmin@v2202505266333339459.bestsrv.de:~/bottle-trade-mobile/admin-web/dist/
```

**Kein Nginx-Reload nötig!** (Statische Dateien)

---

## 📝 Vorteile der Subdomain-Lösung

✅ **Keine Konflikte** mit bestehender Flask-App  
✅ **Saubere Trennung** von Haupt-Domain und Admin  
✅ **Einfachere Wartung** (separate Konfiguration)  
✅ **Bessere Sicherheit** (kann später IP-Whitelist haben)  

---

**Fertig!** 🎉

Nach erfolgreicher Einrichtung ist die Admin-Web-App unter `https://admin.bottle-trade.de` erreichbar.








