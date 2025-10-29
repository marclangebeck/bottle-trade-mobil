// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  vorname?: string;
  nachname?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  profilbild?: string;
  aktiv: boolean;
  created_at: string;
  latitude?: number;
  longitude?: number;
  is_winery: boolean;
  is_admin: boolean;
  btp: number;
  is_subscriber: boolean;
  is_ad_free: boolean;
  wishlist_unlocked: boolean;
  abo_typ?: string;
  newsletter_optin: boolean;
  newsletter_btp_granted: boolean;
  bio?: string;
  is_profile_public: boolean;
  show_email: boolean;
  show_address: boolean;
  show_full_name: boolean;
}

// Wein Types
export interface Wein {
  id: number;
  name: string;
  jahrgang?: number;
  weingut?: string;
  beschreibung?: string;
  preis?: string;
  verfuegbar: boolean;
  user_id: number;
  created_at: string;
  user?: User;
}

// BTP Transaction Types
export interface BtpTransaction {
  id: number;
  user_id: number;
  amount: number;
  reason: string;
  admin_id?: number;
  paypal_transaction_id?: string;
  timestamp: string;
  user?: User;
  admin?: User;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  vorname?: string;
  nachname?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  WeinDetail: { weinId: number };
  Profile: undefined;
  BtpHistory: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Weine: undefined;
  Btp: undefined;
  Profil: undefined;
};
