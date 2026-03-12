import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function unsubscribe() {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        // Call secure RPC function to update status without needing to be logged in
        const { data: success, error: rpcError } = await supabase.rpc('unsubscribe_notifications', {
          p_token: token
        });

        if (rpcError || !success) {
          throw new Error('Ungültiger Link.');
        }

        setStatus('success');
      } catch (err) {
        console.error('Error unsubscribing:', err);
        setStatus('error');
      }
    }

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center bg-white p-8 rounded-xl shadow-sm">
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Abmeldung läuft...</h2>
            <p className="mt-2 text-gray-600">Bitte warten Sie einen Moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Erfolgreich abgemeldet</h2>
            <p className="mt-2 text-gray-600">
              Sie wurden aus dem E-Mail-Verteiler ausgetragen und erhalten keine weiteren Benachrichtigungen über neue Veranstaltungen.
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
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Fehler bei der Abmeldung</h2>
            <p className="mt-2 text-gray-600">
              Der Abmeldelink ist ungültig. Möglicherweise haben Sie sich bereits abgemeldet.
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
