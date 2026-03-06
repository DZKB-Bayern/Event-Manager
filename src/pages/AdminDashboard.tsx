import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Trash2, User, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Profile {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  start_time: string;
  user_id: string;
  profiles?: { username: string };
}

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      setUsers(profiles || []);

      // Fetch events
      const { data: allEvents, error: eventsError } = await supabase
        .from('events')
        .select('*, profiles(username)')
        .order('start_time', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(allEvents || []);
      
    } catch (error) {
      console.error('Failed to load admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sind Sie sicher? Alle Veranstaltungen dieses Benutzers werden ebenfalls gelöscht.')) return;
    try {
      // Delete from auth.users via Supabase Admin API is not possible from client
      // We can only delete from public.profiles if RLS allows, but usually we need a server function
      // However, for this demo, let's assume we just delete from profiles and let cascade handle it?
      // Actually, deleting from public.profiles won't delete the auth user.
      // Client-side admin cannot delete auth users without a server-side function.
      
      alert('Das Löschen von Benutzern ist nur über das Supabase Dashboard möglich.');
    } catch (error) {
      console.error('Failed to delete user', error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Veranstaltung wirklich löschen?')) return;
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
        
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  const handleSeedData = async () => {
    alert('Die Demo-Daten-Funktion ist in der Supabase-Version deaktiviert. Bitte erstellen Sie Daten manuell.');
  };

  const filteredEvents = selectedUser
    ? events.filter(e => e.user_id === selectedUser)
    : events;

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) return <div className="p-8 text-center">Laden...</div>;
  if (!isAdmin) return <div className="p-8 text-center text-red-600">Zugriff verweigert. Nur für Administratoren.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={handleSeedData}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 opacity-50 cursor-not-allowed"
          title="In Supabase Version nicht verfügbar"
        >
          Demo-Daten erstellen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users List */}
        <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Benutzer ({users.length})</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Benutzer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <ul className="divide-y divide-gray-200">
              <li 
                className={`px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedUser === null ? 'bg-indigo-50' : ''}`}
                onClick={() => setSelectedUser(null)}
              >
                <div className="flex items-center space-x-3">
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Alle Benutzer</p>
                    <p className="text-sm text-gray-500">Zeige alle Veranstaltungen</p>
                  </div>
                </div>
              </li>
              {filteredUsers.map((user) => (
                <li 
                  key={user.id} 
                  className={`px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedUser === user.id ? 'bg-indigo-50' : ''}`}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 font-medium uppercase">
                            {user.username?.[0] || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role} • {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Events List */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Veranstaltungen {selectedUser ? `von ${users.find(u => u.id === selectedUser)?.username}` : 'aller Benutzer'}
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {filteredEvents.length} Events
            </span>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Calendar className="h-12 w-12 mb-2 opacity-20" />
                <p>Keine Veranstaltungen gefunden</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <li key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{event.title}</h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="truncate mr-4">
                            Erstellt von: <span className="font-medium text-gray-700">{event.profiles?.username || 'Unbekannt'}</span>
                          </span>
                          <span>
                            {format(new Date(event.start_time), 'PPP', { locale: de })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
