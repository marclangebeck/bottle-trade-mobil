/**
 * PayPal Konfiguration
 * 
 * WICHTIG: Für Production müssen die echten PayPal API-Credentials eingetragen werden!
 * 
 * So erhältst du die Credentials:
 * 1. Gehe zu https://developer.paypal.com/
 * 2. Logge dich mit deinem PayPal Business Account ein
 * 3. Klicke auf "Apps & Credentials" im Dashboard
 * 4. Erstelle eine neue App:
 *    - Name: z.B. "Bottle-Trade Mobile App"
 *    - Sandbox: Erstelle eine Sandbox-App für Tests
 *    - Production: Erstelle eine Production-App für Live-Betrieb
 * 5. Kopiere Client ID und Secret
 * 6. Trage sie hier ein
 * 
 * ALTERNATIVE (für Fallback ohne API):
 * - Trage deine PayPal Business E-Mail ein (businessEmail)
 * - Funktioniert mit vereinfachter PayPal-Zahlungsseite
 */

// PayPal-Modus: 'sandbox' für Tests, 'production' für Live
// ⚠️ WICHTIG: Production-Modus bedeutet ECHTE Zahlungen!
// ✅ Sandbox-Modus aktiviert - sicher zum Testen!
export const PAYPAL_MODE = 'sandbox'; // Sandbox-Modus aktiviert (Test-Zahlungen, kein echtes Geld!)

// PayPal API Credentials
// ✅ Production Credentials eingetragen am 02. Dezember 2025
export const PAYPAL_CONFIG = {
  sandbox: {
    // ✅ Sandbox Credentials eingetragen am 02. Dezember 2025
    clientId: 'AU4x75VWcm6EFwCb1CHyJGXzy4myhgd828xCPnUPWYxlF7a8Jh4Oroi0taLn5PFXOqZcaxUguH6YMWMz',
    secret: 'EGG4kmaUw9c3J5MhIS7yjFX61yKDDQBI9EULyMagRRa5yUvK0Sp1uckcQOKr8FIW7XJDjqCtC6DKHFBd',
    baseUrl: 'https://api.sandbox.paypal.com',
    webUrl: 'https://www.sandbox.paypal.com',
    businessEmail: 'payment@bottle-trade.de',
  },
  production: {
    clientId: 'Aa46aGb2B4JQW1tdsHVzItI1bSnMbHJFyiNmPAbbYlSIqsWVDpJ4FHuYudDzm0xOXCeVOhpyotrpyidM',
    secret: 'EA3kSonOmav9wHyELK1mT1CL0LfGjixZ6M2Fnfm6wNZRSnmevRfBysl5P2eY2DMB_n6cx8zq3HuIG6Ik',
    baseUrl: 'https://api.paypal.com',
    webUrl: 'https://www.paypal.com',
    businessEmail: 'payment@bottle-trade.de',
  },
};

// Aktuelle Konfiguration basierend auf Modus
export const getPayPalConfig = () => {
  return PAYPAL_CONFIG[PAYPAL_MODE];
};

// Return URLs für PayPal REST API
// ⚠️ WICHTIG: PayPal REST API benötigt HTTPS URLs, keine Deep Links!
// Die URLs müssen auf einem Server liegen, der dann zum Deep Link weiterleitet
// Für Tests: Verwende eine Redirect-Seite oder eine Test-URL

// Option 1: HTTPS URLs (benötigt Server mit Redirect)
// export const PAYPAL_RETURN_URL = 'https://bottletrade.de/payment-success';
// export const PAYPAL_CANCEL_URL = 'https://bottletrade.de/payment-cancel';

// Option 2: Deep Links (funktionieren nur im Fallback, nicht mit REST API)
export const PAYPAL_RETURN_URL = 'bottletrade://payment-success';
export const PAYPAL_CANCEL_URL = 'bottletrade://payment-cancel';

// Option 3: PayPal Sandbox Test-URLs (für Tests)
// Diese URLs funktionieren in Sandbox und leiten dann zum Deep Link weiter
// Für Production: Muss durch echte HTTPS URLs ersetzt werden
export const PAYPAL_RETURN_URL_HTTPS = 'https://www.sandbox.paypal.com/webapps/hermes/return';
export const PAYPAL_CANCEL_URL_HTTPS = 'https://www.sandbox.paypal.com/webapps/hermes/cancel';

