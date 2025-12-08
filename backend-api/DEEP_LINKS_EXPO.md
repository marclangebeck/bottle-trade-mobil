# Deep Links und Expo Go

## Wichtiger Hinweis

**Deep Links (`bottletrade://...`) funktionieren NICHT in Expo Go!**

Sie funktionieren nur in einer **gebauten App** (Development Build oder Production Build).

## Warum funktionieren Deep Links nicht in Expo Go?

Expo Go ist eine generische App, die viele verschiedene Expo-Projekte ausführen kann. Custom URL Schemes (wie `bottletrade://`) müssen in der nativen App-Konfiguration registriert werden, was in Expo Go nicht möglich ist.

## Lösungen

### 1. Development Build erstellen (Empfohlen für Tests)

```bash
cd mobile-app
npx expo prebuild
npx expo run:ios    # oder
npx expo run:android
```

### 2. Production Build erstellen

```bash
cd mobile-app
eas build --platform ios     # oder
eas build --platform android
```

### 3. Manueller Token-Eingabe (Funktioniert in Expo Go)

Die E-Mails enthalten auch den Token als Text, der manuell in der App eingegeben werden kann:
- Öffnen Sie die App
- Klicken Sie auf "📧 E-Mail-Adresse bestätigen" auf dem Login-Screen
- Geben Sie den Token ein

## Deep Links die implementiert sind

- `bottletrade://confirm-email?token=XXX` - E-Mail-Bestätigung
- `bottletrade://login` - Öffnet Login-Screen
- `bottletrade://welcome` - Öffnet Welcome-Screen

## Universal Links (Alternative)

Universal Links (`https://bottle-trade.de/...`) funktionieren auch in Expo Go, erfordern aber:
- Eine Website mit korrekter Konfiguration
- Apple App Site Association (AASA) Datei
- Android App Links Konfiguration

Diese sind noch nicht implementiert, könnten aber als Alternative dienen.

