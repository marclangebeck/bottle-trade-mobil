import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Wines from './pages/Wines';
import Wineries from './pages/Wineries';
import DataManagement from './pages/DataManagement';
import Surveys from './pages/Surveys';
import Newsletter from './pages/Newsletter';
import SystemMessages from './pages/SystemMessages';
import Shop from './pages/Shop';
import Orders from './pages/Orders';
import Trades from './pages/Trades';
import Layout from './components/Layout';

const queryClient = new QueryClient();

// Session-Management (wie in der App)
const getCurrentUser = () => {
  try {
    const userStr = sessionStorage.getItem('currentUser');
    if (!userStr) {
      console.log('❌ Keine Session gefunden');
      return null;
    }
    const user = JSON.parse(userStr);
    console.log('✅ Session gefunden:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Fehler beim Lesen der Session:', error);
    return null;
  }
};

const logout = () => {
  sessionStorage.removeItem('currentUser');
  console.log('🚪 Session gelöscht');
};

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Prüfe Session beim App-Start und bei Route-Änderungen
    const currentUser = getCurrentUser();
    console.log('🔄 Prüfe Session, User:', currentUser ? currentUser.email : 'Kein User');
    setUser(currentUser);
    setLoading(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-xl">Lade...</div>
      </div>
    );
  }

  // Wenn auf Login-Seite und User eingeloggt, weiterleiten
  if (location.pathname === '/login' && user) {
    return <Navigate to="/" replace />;
  }

  // Wenn nicht auf Login-Seite und kein User, zum Login weiterleiten
  if (location.pathname !== '/login' && !user) {
    return <Navigate to="/login" replace />;
  }

  // Login-Seite
  if (location.pathname === '/login') {
    return <Login />;
  }

  // Geschützte Seiten
  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/wines" element={<Wines />} />
        <Route path="/wineries" element={<Wineries />} />
        <Route path="/data-management" element={<DataManagement />} />
        <Route path="/surveys" element={<Surveys />} />
        <Route path="/newsletter" element={<Newsletter />} />
        <Route path="/system-messages" element={<SystemMessages />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/trades" element={<Trades />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
