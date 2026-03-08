import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginWithWebling } from '../lib/api';
import { useAuth } from '../context/AuthContext';

/**
 * This page handles logins coming from Webling. It reads the `member` query
 * parameter from the URL, calls our backend to authenticate the member via
 * the Webling API and then redirects the user accordingly. If the member
 * parameter is missing or the login fails, the user is redirected to the
 * regular login page. While the login is in progress a simple message is
 * rendered.  All of the heavy lifting is done in the server and API layer.
 */
export default function WeblingLogin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const memberId = params.get('member');
    if (!memberId) {
      navigate('/');
      return;
    }

    let cancelled = false;

    const runLogin = async () => {
      try {
        await loginWithWebling(memberId);
        await refreshUser();
        if (!cancelled) {
          navigate('/dashboard', { replace: true });
        }
      } catch {
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      }
    };

    runLogin();

    return () => {
      cancelled = true;
    };
  }, [params, navigate, refreshUser]);

  return <div className="p-8 text-center">Login über Webling...</div>;
}