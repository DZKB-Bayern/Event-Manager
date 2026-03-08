import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginWithWebling } from '../lib/api';

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

  useEffect(() => {
    const memberId = params.get('member');
    if (!memberId) {
      // If no member is provided redirect to the normal login page
      navigate('/login');
      return;
    }

    // Attempt to authenticate using the Webling member ID. On success
    // navigate to the dashboard, otherwise back to the login page.
    loginWithWebling(memberId)
      .then(() => {
        navigate('/dashboard');
      })
      .catch(() => {
        navigate('/login');
      });
  }, [params, navigate]);

  return <div className="p-8 text-center">Login über Webling...</div>;
}