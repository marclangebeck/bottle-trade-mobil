"""
Debug-Script für SMTP-Authentifizierung
"""
import smtplib
import ssl
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.mailbox.org')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')

print("=" * 60)
print("SMTP Debug-Informationen")
print("=" * 60)
print()
print(f"SMTP_HOST: {SMTP_HOST}")
print(f"SMTP_PORT: {SMTP_PORT}")
print(f"SMTP_USER: {SMTP_USER}")
print(f"SMTP_PASSWORD Länge: {len(SMTP_PASSWORD)} Zeichen")
print(f"SMTP_PASSWORD beginnt mit: {SMTP_PASSWORD[:3]}...")
print(f"SMTP_PASSWORD endet mit: ...{SMTP_PASSWORD[-3:]}")
print()

# Test ohne Login (nur Verbindung)
print("Test 1: Verbindung zum Server (ohne Login)...")
try:
    if SMTP_PORT == 465:
        context = ssl.create_default_context()
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=10)
    else:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
    
    print(f"✅ Verbindung erfolgreich zu {SMTP_HOST}:{SMTP_PORT}")
    server.quit()
except Exception as e:
    print(f"❌ Verbindungsfehler: {e}")
    exit(1)

print()

# Test mit Login
print("Test 2: Authentifizierung...")
try:
    if SMTP_PORT == 465:
        context = ssl.create_default_context()
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=10)
    else:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
    
    # Debug: Zeige was wir senden (ohne Passwort)
    print(f"Versuche Login mit Benutzer: {SMTP_USER}")
    
    # Setze Debug-Level für detaillierte Ausgabe
    server.set_debuglevel(1)
    
    server.login(SMTP_USER, SMTP_PASSWORD)
    print("✅ Authentifizierung erfolgreich!")
    server.quit()
except smtplib.SMTPAuthenticationError as e:
    print(f"❌ Authentifizierungsfehler: {e}")
    print()
    print("Mögliche Ursachen:")
    print("  1. Falsches Passwort")
    print("  2. 2FA aktiviert → App-Passwort erforderlich")
    print("  3. Benutzername muss vollständige E-Mail-Adresse sein")
    print("  4. Account gesperrt oder deaktiviert")
    print()
    print("Lösung für mailbox.org:")
    print("  - Prüfe ob 2FA aktiviert ist")
    print("  - Falls ja: Erstelle App-Passwort unter:")
    print("    https://mailbox.org → Alle Einstellungen → Sicherheit → Anwendungspasswörter")
except Exception as e:
    print(f"❌ Fehler: {e}")

