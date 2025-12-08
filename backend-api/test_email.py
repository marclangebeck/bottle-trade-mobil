"""
Test-Script für E-Mail-Versand
"""
from email_service import send_email, send_registration_confirmation_email
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 50)
print("E-Mail-Service Test")
print("=" * 50)
print()

# Lade Konfiguration
SMTP_HOST = os.getenv('SMTP_HOST', '')
SMTP_PORT = os.getenv('SMTP_PORT', '')
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', '')
FROM_EMAIL = os.getenv('FROM_EMAIL', '')

print("SMTP-Konfiguration:")
print(f"  SMTP_HOST: {SMTP_HOST}")
print(f"  SMTP_PORT: {SMTP_PORT}")
print(f"  SMTP_USER: {SMTP_USER}")
print(f"  SMTP_PASSWORD: {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else 'NICHT GESETZT'}")
print(f"  FROM_EMAIL: {FROM_EMAIL}")
print(f"  ADMIN_EMAIL: {ADMIN_EMAIL}")
print()

if not SMTP_USER or not SMTP_PASSWORD:
    print("❌ FEHLER: SMTP_USER oder SMTP_PASSWORD nicht gesetzt!")
    print("   Bitte prüfe die .env Datei.")
    exit(1)

# Test 1: Einfache E-Mail
print("Test 1: Einfache Test-E-Mail senden...")
test_email = ADMIN_EMAIL or SMTP_USER
if test_email:
    result = send_email(
        test_email,
        "Test-E-Mail von Bottle-Trade",
        "<h1>Test</h1><p>Dies ist eine Test-E-Mail.</p>",
        "Dies ist eine Test-E-Mail."
    )
    if result:
        print(f"✅ Test-E-Mail erfolgreich gesendet an: {test_email}")
    else:
        print(f"❌ Test-E-Mail konnte nicht gesendet werden")
else:
    print("⚠️ Keine Test-E-Mail-Adresse gefunden")

print()

# Test 2: Registrierungs-E-Mail
print("Test 2: Registrierungs-Bestätigungs-E-Mail senden...")
if test_email:
    result = send_registration_confirmation_email(
        test_email,
        "TestUser",
        "test-token-12345",
        "bottletrade://confirm-email?token=test-token-12345"
    )
    if result:
        print(f"✅ Registrierungs-E-Mail erfolgreich gesendet an: {test_email}")
    else:
        print(f"❌ Registrierungs-E-Mail konnte nicht gesendet werden")
else:
    print("⚠️ Keine Test-E-Mail-Adresse gefunden")

print()
print("=" * 50)
print("Test abgeschlossen")
print("=" * 50)

