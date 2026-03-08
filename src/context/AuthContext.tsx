import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  /**
   * Indicates whether the authentication state is still being resolved.
   * Consumers should not assume the user is logged in or out until loading
   * becomes false.
   */
  loading: boolean;
  /**
   * Alias for loading. Some components reference `isLoading` instead of
   * `loading`. Both fields refer to the same underlying value.
   */
  isLoading: boolean;
  /** Indicates whether the current user is an administrator. */
  isAdmin: boolean;
  /** Sign the current user out. */
  signOut: () => Promise<void>;
  /** Refresh the current user from the authentication service. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // Always fetch the current user from our own backend. If a valid JWT
      // cookie is present this will return `{ user: {...} }`. Otherwise the
      // request will respond with a 401 and user will remain null.
      const resp = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.user) {
          const backendUser = data.user;
          setUser({
            id: String(backendUser.id),
            username: backendUser.username || backendUser.email || 'User',
            email: backendUser.email,
            role: backendUser.role || 'member',
          });
          setLoading(false);
          return;
        }
      }
      setUser(null);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // There is no Supabase auth listener when using Webling; we rely solely on
    // our own authentication cookie.
    return () => {
      // no-op cleanup
    };
  }, []);

  const signOut = async () => {
    try {
      // Request our backend to clear the authentication cookie.
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isLoading: loading, isAdmin, signOut, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
