import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [wantsNotifications, setWantsNotifications] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, wants_notifications, notification_status, notification_token')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setUsername(data.username || '');
          setWantsNotifications(data.wants_notifications || false);
          setNotificationStatus(data.notification_status || 'unsubscribed');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // First, get the current profile to check if we need to send a DOI email
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('wants_notifications, notification_status, notification_token')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      let newStatus = notificationStatus;
      let shouldSendEmail = false;
      let token = currentProfile.notification_token;

      // Generate a token if it doesn't exist yet (for older accounts)
      if (!token) {
        token = crypto.randomUUID();
      }

      // If user is turning ON notifications and wasn't subscribed before
      if (wantsNotifications && !currentProfile.wants_notifications) {
        newStatus = 'pending';
        shouldSendEmail = true;
      } 
      // If user is turning OFF notifications
      else if (!wantsNotifications) {
        newStatus = 'unsubscribed';
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          email: user.email, // Ensure email is synced to profiles table
          wants_notifications: wantsNotifications,
          notification_status: newStatus,
          notification_token: token,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setNotificationStatus(newStatus);
      await refreshUser(); // Update context with new username

      if (shouldSendEmail && token && user.email) {
        try {
          // Force session refresh to ensure we have a valid JWT before calling the Edge Function
          await supabase.auth.refreshSession();
          
          const { data, error: fnError } = await supabase.functions.invoke('send-doi-email', {
            body: { email: user.email, token: token },
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          });
          
          if (fnError) {
            console.error('Edge Function Error Object:', fnError);
            
            // Handle 404 specifically (function not deployed)
            if (fnError.context && fnError.context.status === 404) {
              throw new Error('Die Edge Function "send-doi-email" wurde noch nicht in Supabase bereitgestellt (Deployed).');
            }
            
            // Try to extract more details if available
            let errorDetails = null;
            let rawText = '';
            try {
              if (fnError.context) {
                // Clone the response so we can read it without consuming the original
                const clonedResponse = fnError.context.clone();
                rawText = await clonedResponse.text();
                try {
                  errorDetails = JSON.parse(rawText);
                } catch (e) {
                  errorDetails = { error: rawText };
                }
              }
            } catch (e: any) {
              console.error('Could not parse error context', e);
              rawText = `[Fehler beim Lesen der Antwort: ${e.message}]`;
            }
            
            console.error('Edge Function Error Details:', errorDetails, 'Raw Text:', rawText);
            
            const status = fnError.context?.status || 'Unknown';
            const errorMessage = errorDetails?.error || rawText || fnError.message;
            throw new Error(`Fehler beim Senden der E-Mail (Status ${status}): ${errorMessage}`);
          }
          
          setMessage({ 
            type: 'success', 
            text: 'Profil aktualisiert. Wir haben Ihnen eine E-Mail zur Bestätigung der Benachrichtigungen gesendet. Bitte klicken Sie auf den Link in der E-Mail.' 
          });
        } catch (fnError: any) {
          console.error('Error sending DOI email:', fnError);
          setMessage({ 
            type: 'error', 
            text: `Profil aktualisiert, aber die Bestätigungs-E-Mail konnte nicht gesendet werden. Grund: ${fnError.message}` 
          });
        }
      } else {
        setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert.' });
      }

    } catch (err: any) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: err.message || 'Fehler beim Speichern des Profils.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profil & Einstellungen</h1>
        <p className="mt-1 text-sm text-gray-500">
          Verwalten Sie Ihre Kontoinformationen und E-Mail-Benachrichtigungen.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
          <div className="px-4 py-5 sm:p-6 space-y-6">
            
            {/* Account Info */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Account</h3>
              
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-Mail-Adresse
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      id="email"
                      disabled
                      value={user?.email || ''}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Ihre E-Mail-Adresse kann derzeit nicht geändert werden.</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Firmenname / Name der Hundeschule
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Dieser Name wird öffentlich bei Ihren Veranstaltungen als "Veranstalter" angezeigt.</p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="pt-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Benachrichtigungen</h3>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="notifications"
                    name="notifications"
                    type="checkbox"
                    checked={wantsNotifications}
                    onChange={(e) => setWantsNotifications(e.target.checked)}
                    className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="notifications" className="font-medium text-gray-700">
                    E-Mail-Benachrichtigungen bei neuen Events
                  </label>
                  <p className="text-gray-500 mt-1">
                    Ich möchte per E-Mail informiert werden, wenn neue Veranstaltungen in den Kalender eingetragen werden.
                  </p>
                  
                  {wantsNotifications && (
                    <div className="mt-2">
                      {notificationStatus === 'subscribed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktiviert
                        </span>
                      )}
                      {notificationStatus === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Bestätigung ausstehend (Bitte E-Mail prüfen)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
