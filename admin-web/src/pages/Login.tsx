import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getUserByEmailOrUsername = async (emailOrUsername: string): Promise<any> => {
    try {
      // Zuerst nach Email suchen
      const emailQuery = query(collection(db, 'users'), where('email', '==', emailOrUsername));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        const userDoc = emailSnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      // Dann nach Username suchen
      const usernameQuery = query(collection(db, 'users'), where('username', '==', emailOrUsername));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        const userDoc = usernameSnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      throw error;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Versuche Login mit:', email);
      
      // Suche User in Firestore (wie in der App)
      const user = await getUserByEmailOrUsername(email);
      
      console.log('👤 User gefunden:', user ? 'Ja' : 'Nein');
      
      if (!user) {
        setError('Ungültige Anmeldedaten. Bitte prüfen Sie E-Mail/Username und Passwort.');
        setLoading(false);
        return;
      }
      
      console.log('🔑 Prüfe Passwort...');
      console.log('User password:', user.password);
      console.log('Eingegebenes Passwort:', password);
      
      // Prüfe Passwort (direkt im User-Dokument, wie in der App)
      if (!user.password || user.password !== password) {
        console.error('❌ Passwort falsch');
        setError('Ungültige Anmeldedaten. Bitte prüfen Sie E-Mail/Username und Passwort.');
        setLoading(false);
        return;
      }
      
      console.log('✅ Passwort korrekt');
      
      // Prüfe ob User Admin ist
      if (!user.isAdmin) {
        console.error('❌ Kein Admin');
        setError('Kein Admin-Zugriff. Nur Administratoren können sich hier anmelden.');
        setLoading(false);
        return;
      }
      
      console.log('✅ Admin-Status bestätigt');
      
      // Session speichern (wie in der App)
      const userData = {
        uid: user.uid || user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        ...user
      };
      
      console.log('💾 Speichere Session:', userData);
      sessionStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Prüfe ob Session gespeichert wurde
      const savedSession = sessionStorage.getItem('currentUser');
      console.log('✅ Session gespeichert:', savedSession ? 'Ja' : 'Nein');
      
      // Navigiere zum Dashboard (mit force reload)
      console.log('🚀 Navigiere zum Dashboard...');
      window.location.href = '/';
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gold-light">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Bottle Trade</h1>
            <p className="text-gray-400">Admin-Bereich</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-Mail oder Username
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold"
                placeholder="admin@bottle-trade.de"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold/90 text-dark-bg font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Admin-Zugriff erforderlich</p>
            <p className="mt-2 text-xs">E-Mail: admin@bottle-trade.de</p>
          </div>
        </div>
      </div>
    </div>
  );
}

