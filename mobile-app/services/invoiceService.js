/**
 * Service für Rechnungsgenerierung
 * Ruft Backend-API auf, um PDF-Rechnung zu generieren und per E-Mail zu versenden
 */

import { BACKEND_API_URL } from '../config/api';

/**
 * Generiert Rechnung für eine Bestellung und versendet sie per E-Mail
 * @param {string} orderId - Bestell-ID
 * @returns {Promise<Object>} Ergebnis der Rechnungsgenerierung
 */
export const generateInvoice = async (orderId) => {
  try {
    // Prüfe ob Backend-URL konfiguriert ist
    if (!BACKEND_API_URL || BACKEND_API_URL.includes('localhost') && !__DEV__) {
      console.warn('⚠️ Backend-API-URL nicht konfiguriert oder localhost in Production. Rechnung wird nicht generiert.');
      return {
        success: false,
        message: 'Backend-API nicht konfiguriert',
        order_id: orderId
      };
    }

    const url = `${BACKEND_API_URL}/orders/${orderId}/generate-invoice`;
    console.log('📧 Versuche Rechnung zu generieren:', url);

    // Timeout-Handler (falls AbortSignal.timeout nicht verfügbar)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rechnungsgenerierung fehlgeschlagen: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Rechnung generiert und versendet:', result);
    return result;
  } catch (error) {
    // Network-Fehler sind nicht kritisch - Bestellung ist bereits als "paid" markiert
    if (error.name === 'AbortError' || error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      console.warn('⚠️ Backend-API nicht erreichbar. Rechnung wird später generiert (nicht kritisch).');
      return {
        success: false,
        message: 'Backend-API nicht erreichbar',
        order_id: orderId,
        error: error.message
      };
    }
    
    console.error('❌ Fehler beim Generieren der Rechnung:', error);
    throw error;
  }
};

