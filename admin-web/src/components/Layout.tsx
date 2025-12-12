import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gold-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-white">
                Bottle Trade <span className="text-gold">Admin</span>
              </Link>
              <nav className="flex space-x-4 flex-wrap">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/users"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/users')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  User
                </Link>
                <Link
                  to="/wines"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/wines')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Weine
                </Link>
                <Link
                  to="/wineries"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/wineries')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Weingüter
                </Link>
                <Link
                  to="/winehandel"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/winehandel')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Weinhandel
                </Link>
                <Link
                  to="/surveys"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/surveys')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Umfragen
                </Link>
                <Link
                  to="/newsletter"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/newsletter')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Newsletter
                </Link>
                <Link
                  to="/system-messages"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/system-messages')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  System
                </Link>
                <Link
                  to="/shop"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/shop')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Shop
                </Link>
                <Link
                  to="/orders"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/orders')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Bestellungen
                </Link>
                <Link
                  to="/trades"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/trades')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Trades
                </Link>
                <Link
                  to="/blackboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/blackboard')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Schwarzes Brett
                </Link>
                <Link
                  to="/data-management"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/data-management')
                      ? 'bg-gold text-dark-bg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Daten
                </Link>
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
