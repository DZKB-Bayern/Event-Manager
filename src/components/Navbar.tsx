import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Shield, Settings as SettingsIcon } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <img 
                src="https://dzkb.bayern/wp-content/uploads/2026/02/App-Icon-DZKB.png" 
                alt="DZKB Logo" 
                className="h-12 w-auto transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="ml-3 flex flex-col justify-center">
                <span className="text-xl font-bold text-primary leading-none group-hover:text-primary-hover transition-colors">DZKB</span>
                <span className="text-xs font-medium text-gray-500 tracking-wider uppercase">Event Manager</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                    title="Admin Bereich"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                
                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                <div className="flex items-center space-x-2 text-gray-600 text-sm bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">{user.username || user.email?.split('@')[0]}</span>
                </div>
                
                <Link
                  to="/settings"
                  className="text-gray-500 hover:text-primary hover:bg-gray-50 p-2 rounded-full transition-all duration-200"
                  title="Einstellungen"
                >
                  <SettingsIcon className="h-5 w-5" />
                </Link>

                <button
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all duration-200"
                  title="Abmelden"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Anmelden
                </Link>
                <Link
                  to="/register"
                  className="btn-primary shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
