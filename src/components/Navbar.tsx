import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img 
                src="https://dzkb.bayern/wp-content/uploads/2026/02/App-Icon-DZKB.png" 
                alt="DZKB Logo" 
                className="h-10 w-auto"
                referrerPolicy="no-referrer"
              />
              <span className="ml-3 text-xl font-bold text-gray-900">DZKB Event Manager</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-red-600 p-2 rounded-full"
                  title="Abmelden"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Anmelden
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Registrieren
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
