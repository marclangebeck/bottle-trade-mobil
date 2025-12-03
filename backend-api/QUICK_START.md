# Quick Start - Rechnungsstellung testen

## ⚠️ Was noch fehlt:

### 1. Dependencies installieren
```bash
cd /home/bottleadmin/bottle-trade-mobile/backend-api
pip install -r requirements.txt
```

### 2. Firebase Credentials
- Firebase Console öffnen
- Service Account Key herunterladen
- Als `firebase-credentials.json` im `backend-api/` Verzeichnis speichern

### 3. E-Mail-Konfiguration (optional für Tests)
```bash
export SMTP_SERVER=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASSWORD=your-app-password
export FROM_EMAIL=noreply@bottle-trade.de
```

## ✅ Was passiert, wenn du jetzt testest:

**Ohne Konfiguration:**
- ❌ Backend-Fehler: "Network request failed" (Dependencies fehlen)
- ⚠️ Bestellung wird trotzdem als "paid" markiert
- ⚠️ Rechnung wird NICHT generiert

**Mit Dependencies, aber ohne Firebase Credentials:**
- ❌ Backend-Fehler: "Firebase nicht initialisiert"
- ⚠️ Bestellung wird trotzdem als "paid" markiert
- ⚠️ Rechnung wird NICHT generiert

**Mit Dependencies + Firebase, aber ohne E-Mail:**
- ✅ PDF wird generiert
- ⚠️ E-Mail wird NICHT versendet (wird geloggt, blockiert aber nicht)
- ✅ Bestellung bleibt als "paid" markiert

**Mit allem:**
- ✅ PDF wird generiert
- ✅ E-Mail wird versendet
- ✅ Bestellung bleibt als "paid" markiert

## 🚀 Schnellstart (minimal für Tests):

```bash
# 1. Dependencies installieren
cd /home/bottleadmin/bottle-trade-mobile/backend-api
pip install -r requirements.txt

# 2. Firebase Credentials hinzufügen
# (Service Account Key als firebase-credentials.json speichern)

# 3. Backend starten
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. App starten und testen
```

## 📧 E-Mail ist optional!

Auch ohne E-Mail-Konfiguration:
- PDF wird generiert (kann später manuell versendet werden)
- Bestellung funktioniert normal
- Nur E-Mail-Versand schlägt fehl (wird geloggt)


