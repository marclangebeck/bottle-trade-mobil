/**
 * PayPal Service für Bottle-Trade Shop
 * 
 * Dieser Service generiert PayPal Payment URLs für Bestellungen.
 * Die Zahlung erfolgt über PayPal REST API Express Checkout (Weiterleitung zu PayPal-Website).
 * 
 * WICHTIG: Für vollständige Funktionalität müssen PayPal API-Credentials in config/paypal.js eingetragen werden!
 * 
 * Benötigte Credentials:
 * - Client ID (Sandbox & Production)
 * - Secret (Sandbox & Production)
 * 
 * So erhältst du die Credentials:
 * 1. Gehe zu https://developer.paypal.com/
 * 2. Logge dich mit deinem PayPal Business Account ein
 * 3. Erstelle eine neue App (Sandbox & Production)
 * 4. Kopiere Client ID und Secret
 * 5. Trage sie in config/paypal.js ein
 */

import { getPayPalConfig, PAYPAL_RETURN_URL, PAYPAL_CANCEL_URL, PAYPAL_MODE } from '../config/paypal';

/**
 * Generiert eine PayPal Payment URL für eine Bestellung
 * 
 * Verwendet PayPal REST API für vollständige Integration.
 * Falls API-Credentials nicht vorhanden sind, wird Fallback verwendet.
 * 
 * @param {Object} orderData - Bestelldaten (muss total, items, subtotal, tax, shippingCost enthalten)
 * @param {string} orderId - Bestell-ID
 * @param {string} returnUrl - URL für Rückkehr nach Zahlung (optional)
 * @param {string} cancelUrl - URL für Abbruch (optional)
 * @returns {Promise<string>} PayPal Payment URL (Approval URL)
 */
export const generatePayPalPaymentUrl = async (orderData, orderId, returnUrl = null, cancelUrl = null) => {
  try {
    const config = getPayPalConfig();
    
    // Prüfe ob API-Credentials konfiguriert sind
    const hasCredentials = 
      config.clientId && 
      config.clientId !== 'YOUR_SANDBOX_CLIENT_ID' && 
      config.clientId !== 'YOUR_PRODUCTION_CLIENT_ID' &&
      config.secret &&
      config.secret !== 'YOUR_SANDBOX_SECRET' &&
      config.secret !== 'YOUR_PRODUCTION_SECRET';
    
    if (hasCredentials) {
      // VOLLSTÄNDIGE INTEGRATION: PayPal REST API
      try {
        const payment = await createPayPalPayment(orderData, orderId, returnUrl, cancelUrl);
        console.log('✅ PayPal REST API Payment erstellt, Approval URL:', payment.approvalUrl);
        return payment.approvalUrl;
      } catch (apiError) {
        console.error('❌ PayPal REST API Fehler, verwende Fallback:', apiError);
        // Fallback zu vereinfachter Lösung
      }
    }
    
    // FALLBACK: Vereinfachte Lösung (funktioniert ohne API, aber weniger Features)
    console.warn('⚠️ PayPal API-Credentials nicht konfiguriert, verwende Fallback-Lösung');
    console.warn('⚠️ Für vollständige Integration trage Client ID und Secret in config/paypal.js ein!');
    
    // PayPal Standard Payment URL (funktioniert ohne API)
    const params = new URLSearchParams({
      cmd: '_xclick',
      business: config.businessEmail || 'YOUR_PAYPAL_EMAIL@example.com', // TODO: PayPal Business E-Mail eintragen
      item_name: `Bottle-Trade Bestellung #${orderId.substring(0, 8)}`,
      item_number: orderId,
      amount: orderData.total.toFixed(2),
      currency_code: 'EUR',
      return: returnUrl || `${PAYPAL_RETURN_URL}?orderId=${orderId}`,
      cancel_return: cancelUrl || `${PAYPAL_CANCEL_URL}?orderId=${orderId}`,
      custom: JSON.stringify({
        orderId: orderId,
        userId: orderData.userId
      })
    });
    
    const standardPaymentUrl = `${config.webUrl}/cgi-bin/webscr?${params.toString()}`;
    console.log('🔗 PayPal Fallback URL generiert:', standardPaymentUrl);
    
    return standardPaymentUrl;
  } catch (error) {
    console.error('❌ Fehler beim Generieren der PayPal-URL:', error);
    throw error;
  }
};

/**
 * Base64 Encoding Helper (funktioniert in React Native und Web)
 * @param {string} str - String zum Encodieren
 * @returns {string} Base64-encoded String
 */
const base64Encode = (str) => {
  try {
    // Versuche btoa (funktioniert in Web und modernen React Native Versionen)
    if (typeof btoa !== 'undefined') {
      return btoa(str);
    }
    // Fallback für ältere React Native Versionen
    // Verwende Buffer (verfügbar in React Native mit polyfill)
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf8').toString('base64');
    }
    // Letzter Fallback: Manuelle Base64-Encoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      const bitmap = (a << 16) | (b << 8) | c;
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
    }
    return result;
  } catch (error) {
    console.error('❌ Base64 Encoding Fehler:', error);
    throw new Error('Base64 Encoding fehlgeschlagen');
  }
};

/**
 * Ruft OAuth 2.0 Access Token von PayPal ab
 * 
 * @returns {Promise<string>} Access Token
 */
const getPayPalAccessToken = async () => {
  try {
    const config = getPayPalConfig();
    
    // Prüfe ob Credentials vorhanden sind
    if (config.clientId === 'YOUR_SANDBOX_CLIENT_ID' || config.clientId === 'YOUR_PRODUCTION_CLIENT_ID') {
      throw new Error('PayPal API-Credentials nicht konfiguriert. Bitte trage Client ID und Secret in config/paypal.js ein.');
    }
    
    if (config.secret === 'YOUR_SANDBOX_SECRET' || config.secret === 'YOUR_PRODUCTION_SECRET') {
      throw new Error('PayPal API-Credentials nicht konfiguriert. Bitte trage Client ID und Secret in config/paypal.js ein.');
    }
    
    // Base64 encode Client ID:Secret für Basic Auth
    const credentials = base64Encode(`${config.clientId}:${config.secret}`);
    
    // OAuth 2.0 Token Request
    const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PayPal OAuth Fehler:', errorText);
      throw new Error(`PayPal OAuth fehlgeschlagen: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('Kein Access Token von PayPal erhalten');
    }
    
    console.log('✅ PayPal Access Token erfolgreich abgerufen');
    return data.access_token;
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des PayPal Access Tokens:', error);
    throw error;
  }
};

/**
 * Erstellt ein PayPal Payment über die REST API
 * 
 * WICHTIG: Erfordert PayPal API-Credentials in config/paypal.js
 * 
 * @param {Object} orderData - Bestelldaten
 * @param {string} orderId - Bestell-ID
 * @param {string} returnUrl - URL für Rückkehr nach Zahlung (optional)
 * @param {string} cancelUrl - URL für Abbruch (optional)
 * @returns {Promise<Object>} PayPal Payment Response mit Approval URL
 */
export const createPayPalPayment = async (orderData, orderId, returnUrl = null, cancelUrl = null) => {
  try {
    const config = getPayPalConfig();
    
    // 1. OAuth 2.0 Token abrufen
    const accessToken = await getPayPalAccessToken();
    
    // 2. Return URLs vorbereiten
    // ⚠️ WICHTIG: PayPal REST API benötigt HTTPS URLs, keine Deep Links!
    // Die URLs müssen auf bottletrade.de existieren und zum Deep Link weiterleiten
    //
    // LÖSUNG: Verwende HTTPS URLs die auf Redirect-Seiten zeigen
        // Diese Seiten müssen auf bottle-trade.de erstellt werden:
        // - https://bottle-trade.de/shop/payment-success.html?orderId=XXX
        // - https://bottle-trade.de/shop/payment-cancel.html?orderId=XXX
    // Diese Seiten leiten dann zum Deep Link weiter: bottletrade://payment-success?orderId=XXX
    
    let finalReturnUrl;
    let finalCancelUrl;
    
    // Prüfe ob custom HTTPS URLs übergeben wurden
    if (returnUrl && returnUrl.startsWith('https://')) {
      finalReturnUrl = returnUrl;
    } else {
        // Verwende HTTPS URLs (müssen auf Server existieren!)
        // Dateien liegen in: bottle-trade.de/shop/
        finalReturnUrl = `https://bottle-trade.de/shop/payment-success.html?orderId=${orderId}`;
    }
    
    if (cancelUrl && cancelUrl.startsWith('https://')) {
      finalCancelUrl = cancelUrl;
    } else {
      // Verwende HTTPS URLs (müssen auf Server existieren!)
      // Dateien liegen in: bottle-trade.de/shop/
      finalCancelUrl = `https://bottle-trade.de/shop/payment-cancel.html?orderId=${orderId}`;
    }
    
        console.log('🔗 PayPal Return URLs (HTTPS):', { finalReturnUrl, finalCancelUrl });
        console.warn('⚠️ WICHTIG: Diese URLs müssen auf bottle-trade.de existieren und zum Deep Link weiterleiten!');
    
    // 3. Payment Request Body erstellen
    const paymentData = {
      intent: 'CAPTURE', // Sofortige Zahlung
      purchase_units: [
        {
          reference_id: orderId,
          description: `Bottle-Trade Bestellung #${orderId.substring(0, 8)}`,
          amount: {
            currency_code: 'EUR',
            value: orderData.total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: orderData.subtotal?.toFixed(2) || (orderData.total / 1.19).toFixed(2),
              },
              tax_total: {
                currency_code: 'EUR',
                value: orderData.tax?.toFixed(2) || (orderData.total * 0.19 / 1.19).toFixed(2),
              },
              shipping: {
                currency_code: 'EUR',
                value: orderData.shippingCost?.toFixed(2) || '0.00',
              },
            },
          },
          items: orderData.items?.map((item, index) => ({
            name: item.name || `Artikel ${index + 1}`,
            description: item.variantName || '',
            quantity: item.quantity?.toString() || '1',
            unit_amount: {
              currency_code: 'EUR',
              value: item.price?.toFixed(2) || '0.00',
            },
            tax: {
              currency_code: 'EUR',
              value: ((item.price || 0) * 0.19).toFixed(2),
            },
          })) || [],
        },
      ],
      application_context: {
        brand_name: 'Bottle-Trade',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: finalReturnUrl,
        cancel_url: finalCancelUrl,
        locale: 'de-DE',
      },
    };
    
    // 4. Payment mit PayPal REST API erstellen
    const response = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': orderId, // Eindeutige Request-ID
      },
      body: JSON.stringify(paymentData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PayPal Payment Creation Fehler:', errorText);
      throw new Error(`PayPal Payment Creation fehlgeschlagen: ${response.status} ${response.statusText}`);
    }
    
    const paymentResponse = await response.json();
    
    // 5. Approval URL extrahieren
    const approvalUrl = paymentResponse.links?.find(link => link.rel === 'approve')?.href;
    
    if (!approvalUrl) {
      throw new Error('Keine Approval URL von PayPal erhalten');
    }
    
    console.log('✅ PayPal Payment erfolgreich erstellt:', paymentResponse.id);
    console.log('🔗 Approval URL:', approvalUrl);
    
    return {
      paymentId: paymentResponse.id,
      approvalUrl: approvalUrl,
      status: paymentResponse.status,
      links: paymentResponse.links,
    };
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des PayPal Payments:', error);
    throw error;
  }
};

/**
 * Validiert PayPal Payment Response
 * @param {Object} response - PayPal Response-Daten
 * @returns {boolean} True wenn Zahlung erfolgreich
 */
export const validatePayPalPayment = (response) => {
  try {
    // TODO: Implementiere PayPal IPN (Instant Payment Notification) Validierung
    // Für jetzt: Prüfe auf grundlegende Felder
    return response && response.paymentId && response.status === 'completed';
  } catch (error) {
    console.error('❌ Fehler bei PayPal-Validierung:', error);
    return false;
  }
};

/**
 * Konvertiert PayPal Response zu Bestell-Update
 * @param {Object} paypalResponse - PayPal Response-Daten
 * @returns {Object} Update-Objekt für Bestellung
 */
export const convertPayPalResponseToOrderUpdate = (paypalResponse) => {
  try {
    return {
      paymentId: paypalResponse.paymentId || paypalResponse.transactionId,
      status: 'paid', // Nach erfolgreicher Zahlung
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('❌ Fehler bei PayPal-Response-Konvertierung:', error);
    throw error;
  }
};

/**
 * Prüft den Status eines PayPal Payments
 * 
 * @param {string} paymentId - PayPal Payment ID (Order ID)
 * @returns {Promise<Object>} Payment Status
 */
export const getPayPalPaymentStatus = async (paymentId) => {
  try {
    const config = getPayPalConfig();
    
    // Prüfe ob Credentials vorhanden sind
    if (config.clientId === 'YOUR_SANDBOX_CLIENT_ID' || config.clientId === 'YOUR_PRODUCTION_CLIENT_ID') {
      console.warn('⚠️ PayPal API-Credentials nicht konfiguriert, kann Payment-Status nicht prüfen');
      return { status: 'unknown', error: 'API-Credentials nicht konfiguriert' };
    }
    
    // OAuth 2.0 Token abrufen
    const accessToken = await getPayPalAccessToken();
    
    // Payment Status abrufen
    const response = await fetch(`${config.baseUrl}/v2/checkout/orders/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PayPal Payment Status Fehler:', errorText);
      throw new Error(`PayPal Payment Status fehlgeschlagen: ${response.status} ${response.statusText}`);
    }
    
    const paymentData = await response.json();
    
    console.log('✅ PayPal Payment Status abgerufen:', paymentData.status);
    
    return {
      status: paymentData.status, // CREATED, SAVED, APPROVED, VOIDED, COMPLETED
      paymentId: paymentData.id,
      payer: paymentData.payer,
      purchaseUnits: paymentData.purchase_units,
    };
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des PayPal Payment Status:', error);
    throw error;
  }
};

/**
 * Prüft ob PayPal verfügbar ist
 * @returns {boolean} True wenn PayPal verfügbar
 */
export const isPayPalAvailable = () => {
  try {
    const config = getPayPalConfig();
    const hasCredentials = 
      config.clientId && 
      config.clientId !== 'YOUR_SANDBOX_CLIENT_ID' && 
      config.clientId !== 'YOUR_PRODUCTION_CLIENT_ID' &&
      config.secret &&
      config.secret !== 'YOUR_SANDBOX_SECRET' &&
      config.secret !== 'YOUR_PRODUCTION_SECRET';
    
    return hasCredentials;
  } catch (error) {
    return false;
  }
};

