import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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
      // First attempt to retrieve the current user from our own backend. If
      // there is a valid JWT cookie set by the server this will return
      // `{ user: {...} }`. If not, the request will likely return a 401 and
      // we'll fall back to Supabase authentication.
      try {
        const resp = await fetch('/api/auth/me');
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.user) {
            // The backend returns numeric ids; convert to string to satisfy our
            // User interface. The backend user object already contains
            // username, email and role.
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
      } catch (err) {
        // Ignore errors here; we'll fall back to Supabase below
      }

      // Fall back to Supabase authentication for legacy login flows. If a user
      // is logged in via Supabase this will populate session.user. If not,
      // session will be null.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: profile.username,
            role: profile.role
          });
        } else {
          // Fallback if profile doesn't exist yet
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: session.user.email?.split('@')[0] || 'User',
            role: 'user'
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // We need to fetch the profile again to get the role
        fetchUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Attempt to sign out via our backend to clear the JWT cookie. Ignore
      // any errors here because the user may not be logged in via the
      // backend.
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        // ignore
      }
      // Always sign out from Supabase in case the user logged in via
      // Supabase. This call will reset the client-side session and
      // subscriptions.
      await supabase.auth.signOut();
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
