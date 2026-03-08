/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Check for embed parameter in search query or hash
  // We accept 'true', '1', or just 'embed' (empty string)
  // Also check if 'embed' is present in the hash (e.g. #/?embed=true)
  const embedParam = searchParams.get('embed');
  const isEmbed = 
    embedParam === 'true' || 
    embedParam === '1' || 
    embedParam === '' ||
    location.hash.includes('embed=true') ||
    location.hash.includes('embed=1');

  return (
    <div className="min-h-screen bg-white">
      {!isEmbed && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

