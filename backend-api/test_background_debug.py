#!/usr/bin/env python3
"""
Debug-Script um zu testen ob BackgroundTasks funktionieren
"""
import requests
import time
import json

print("=" * 60)
print("BackgroundTasks Debug-Test")
print("=" * 60)
print()

# Test 1: Request senden und sofort prüfen
print("Test 1: Request senden...")
try:
    response = requests.post(
        'http://localhost:8000/auth/send-registration-email',
        json={
            'userEmail': 'debug-test@example.com',
            'username': 'DebugTest',
            'firstName': 'Debug',
            'lastName': 'Test',
            'confirmationToken': 'debug-token-123',
            'confirmationUrl': 'bottletrade://confirm?token=debug-token-123'
        },
        timeout=2
    )
    print(f"✅ Request erfolgreich: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"❌ Request fehlgeschlagen: {e}")

print()
print("Warte 5 Sekunden, damit BackgroundTask Zeit hat...")
time.sleep(5)

print()
print("=" * 60)
print("Prüfe Backend-Logs (manuell):")
print("  sudo journalctl -u bottle-trade-backend -f")
print("=" * 60)

