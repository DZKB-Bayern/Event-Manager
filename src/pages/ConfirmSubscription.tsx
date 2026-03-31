import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ConfirmSubscription() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function confirmSubscription() {
      if (!token) {
        setStatus('error');
        setErrorMessage('Kein Token im Link gefunden.');
        return;
      }

      try {
        // 1. Try RPC first (works even if user is not logged in, IF the SQL script was run)
        const { data: success, error: rpcError } = await supabase.rpc('confirm_subscription', {
          p_token: token
        });

        if (!rpcError && success) {
          setStatus('success');
          return;
        }

        // Check if the RPC failed because the user is ALREADY subscribed
        // (The RPC returns false if the user is not found OR if they are not 'pending')
        if (!rpcError && !success) {
           const { data: checkProfile } = await supabase
            .from('profiles')
            .select('notification_status')
            .eq('notification_token', token)
            .single();
            
           if (checkProfile && checkProfile.notification_status === 'subscribed') {
             setStatus('success');
             return;
           }
        }

        console.log('RPC failed or returned false, trying direct fallback...', rpcError);
        
        // 2. Fallback: Try direct DB update (works if user is logged in on this browser)
        // Check if we can find the profile
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id, notification_status')
          .eq('notification_token', token)
          .single();

        if (fetchError || !profile) {
          throw new Error('Profil mit diesem Token nicht gefunden.');
        }

        if (profile.notification_status === 'subscribed') {
          // Already subscribed! (e.g. user clicked the link twice)
          setStatus('success');
          return;
        }

        // Try to update directly
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ notification_status: 'subscribed' })
          .eq('id', profile.id);

        if (updateError) {
          throw new Error('Fehlende Berechtigung. Bitte führen Sie das SQL-Skript in Supabase aus oder loggen Sie sich ein.');
        }

        setStatus('success');
      } catch (err: any) {
        console.error('Error confirming subscription:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
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
              Der Bestätigungslink konnte nicht verarbeitet werden.
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
