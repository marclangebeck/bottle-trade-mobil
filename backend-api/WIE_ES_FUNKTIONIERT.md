# Wie funktioniert der automatische Start?

## Einmalige Einrichtung

Das Setup-Script (`setup-systemd-service.sh`) wird **nur EINMAL** ausgeführt:

```bash
sudo ./setup-systemd-service.sh
```

## Was passiert beim Setup?

1. ✅ Service-Datei wird nach `/etc/systemd/system/` kopiert
2. ✅ Service wird aktiviert (`systemctl enable`)
3. ✅ Service wird gestartet (`systemctl start`)

**Das war's!** Das Setup-Script wird danach **nicht mehr** benötigt.

## Was passiert bei jedem Server-Neustart?

Nach dem Setup startet systemd den Service **automatisch** beim Boot:

1. Server startet
2. systemd lädt alle Services
3. `bottle-trade-backend.service` wird automatisch gestartet
4. Backend läuft ✅

**Kein Setup-Script wird ausgeführt!** systemd startet den Service direkt.

## Service-Status prüfen

```bash
# Prüfen ob Service aktiviert ist (startet automatisch)
sudo systemctl is-enabled bottle-trade-backend

# Sollte "enabled" ausgeben, wenn eingerichtet
```

## Zusammenfassung

- **Setup-Script:** Wird nur EINMAL ausgeführt (zur Einrichtung)
- **Service:** Startet automatisch bei jedem Boot (nach dem Setup)
- **Kein Setup bei Neustart:** systemd startet den Service direkt

## Service-Datei

Die Service-Datei (`bottle-trade-backend.service`) enthält:
- `Restart=always` → Startet automatisch neu, falls es abstürzt
- `WantedBy=multi-user.target` → Startet beim Boot
- `After=network.target` → Startet nach dem Netzwerk

Diese Konfiguration bleibt dauerhaft - kein Setup nötig!

