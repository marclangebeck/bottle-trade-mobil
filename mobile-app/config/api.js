/**
 * API-Konfiguration
 * 
 * WICHTIG: Für Production muss die Backend-API-URL angepasst werden!
 * 
 * Optionen:
 * - Emulator/Simulator: 'http://localhost:8000'
 * - Echtes Gerät (gleiches WLAN): 'http://192.168.x.x:8000' (lokale IP-Adresse)
 * - Production: 'https://api.bottle-trade.de'
 * 
 * Lokale IP-Adresse herausfinden:
 * - Linux/Mac: `ip addr show` oder `ifconfig`
 * - Windows: `ipconfig`
 * - Suche nach IPv4-Adresse (z.B. 192.168.1.100)
 */

// Backend API URL
// TODO: Für echtes Gerät: Lokale IP-Adresse eintragen (z.B. 'http://192.168.1.100:8000')
// TODO: Für Production: Production-URL eintragen
export const BACKEND_API_URL = __DEV__ 
  ? 'http://185.162.250.235:8000'  // Development (Server IP - für echtes Gerät)
  // ? 'http://localhost:8000'  // Development (Emulator/Simulator)
  // ? 'http://192.168.1.100:8000'  // Development (lokales Netzwerk - IP anpassen!)
  : 'https://api.bottle-trade.de';  // Production (TODO: Anpassen!)

// Alternative: Umgebungsvariable setzen (falls verfügbar)
// export const BACKEND_API_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

