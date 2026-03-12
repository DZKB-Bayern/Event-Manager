import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function unsubscribe() {
      if (!token) {
        setStatus('error');
        setErrorMessage('Kein Token im Link gefunden.');
        return;
      }

      try {
        // 1. Try secure RPC function first
        const { data: success, error: rpcError } = await supabase.rpc('unsubscribe_notifications', {
          p_token: token
        });

        if (!rpcError && success) {
          setStatus('success');
          return;
        }

        console.log('RPC failed or returned false, trying direct fallback...', rpcError);

        // 2. Fallback: Try direct DB update (works if user is logged in on this browser)
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id, notification_status')
          .eq('notification_token', token)
          .single();

        if (fetchError || !profile) {
          throw new Error('Profil mit diesem Token nicht gefunden.');
        }

        if (profile.notification_status === 'unsubscribed') {
          // Already unsubscribed
          setStatus('success');
          return;
        }

        // Try to update directly
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            notification_status: 'unsubscribed',
            wants_notifications: false,
            email: null
          })
          .eq('id', profile.id);

        if (updateError) {
          throw new Error('Fehlende Berechtigung. Bitte führen Sie das SQL-Skript in Supabase aus oder loggen Sie sich ein.');
        }

        setStatus('success');
      } catch (err: any) {
        console.error('Error unsubscribing:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
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
              Der Abmeldelink konnte nicht verarbeitet werden.
            </p>
            {errorMessage && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100 text-left">
                <strong>Details:</strong> {errorMessage}
              </p>
            )}
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
