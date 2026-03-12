import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ConfirmSubscription() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function confirmSubscription() {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        // Call secure RPC function to update status without needing to be logged in
        const { data: success, error: rpcError } = await supabase.rpc('confirm_subscription', {
          p_token: token
        });

        if (rpcError || !success) {
          throw new Error('Ungültiger oder abgelaufener Bestätigungslink.');
        }

        setStatus('success');
      } catch (err) {
        console.error('Error confirming subscription:', err);
        setStatus('error');
      }
    }

    confirmSubscription();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center bg-white p-8 rounded-xl shadow-sm">
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Bestätigung läuft...</h2>
            <p className="mt-2 text-gray-600">Bitte warten Sie einen Moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Erfolgreich angemeldet!</h2>
            <p className="mt-2 text-gray-600">
              Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie erhalten ab sofort eine Benachrichtigung, wenn neue Veranstaltungen eingetragen werden.
            </p>
            <div className="mt-6">
              <Link to="/" className="text-primary hover:text-primary-hover font-medium">
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Fehler bei der Bestätigung</h2>
            <p className="mt-2 text-gray-600">
              Der Bestätigungslink ist ungültig oder abgelaufen. Bitte überprüfen Sie den Link in Ihrer E-Mail.
            </p>
            <div className="mt-6">
              <Link to="/" className="text-primary hover:text-primary-hover font-medium">
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
