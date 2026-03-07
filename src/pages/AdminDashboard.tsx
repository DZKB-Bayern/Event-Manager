import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Trash2, User, Calendar, Search, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import UserModal from '../components/UserModal';
import EventModal from '../components/EventModal';
import DeleteUserModal from '../components/DeleteUserModal';

interface Profile {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  user_id: string;
  image_url?: string;
  color?: string;
  button_text?: string;
  button_link?: string;
  profiles?: { username: string };
}

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit states
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Delete states
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  const handleDeleteUserClick = (user: Profile) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Call the Edge Function to delete the user from auth.users
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userToDelete.id }
      });

      if (error) throw error;

      // Refresh the list
      loadData();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      // Try to extract a meaningful error message
      let errorMessage = 'Fehler beim Löschen des Benutzers';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.error_description) {
        errorMessage = error.error_description;
      }
      
      alert(errorMessage);
    }
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleUpdateUser = async (userData: { username: string; role: string }) => {
    if (!editingUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: userData.username, role: userData.role })
        .eq('id', editingUser.id);

      if (error) throw error;

      setIsUserModalOpen(false);
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to update user', error);
      alert(error.message);
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

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const handleUpdateEvent = async (formData: FormData) => {
    if (!editingEvent) return;
    try {
      let image_url = editingEvent.image_url;
      const imageFile = formData.get('image') as File;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${editingEvent.user_id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(filePath);
          
        image_url = publicUrl;
      }

      const updates = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        location: formData.get('location') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        color: formData.get('color') as string,
        button_text: formData.get('button_text') as string,
        button_link: formData.get('button_link') as string,
        image_url: image_url,
      };

      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', editingEvent.id);

      if (error) throw error;

      setIsEventModalOpen(false);
      setEditingEvent(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to update event', error);
      alert(error.message);
    }
  };

  const handleSeedData = async () => {
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        loadData();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Seed error', error);
    }
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
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Benutzer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <ul className="divide-y divide-gray-200">
              <li 
                className={`px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedUser === null ? 'bg-primary/10' : ''}`}
                onClick={() => setSelectedUser(null)}
              >
                <div className="flex items-center space-x-3">
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
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
                  className={`px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedUser === user.id ? 'bg-primary/10' : ''}`}
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
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(user);
                        }}
                        className="ml-2 text-gray-400 hover:text-primary p-1"
                        title="Bearbeiten"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUserClick(user);
                        }}
                        className="ml-1 text-gray-400 hover:text-red-600 p-1"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
            <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
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
                          onClick={() => handleEditEvent(event)}
                          className="text-primary hover:text-primary-hover p-2 hover:bg-primary/10 rounded-full transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
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

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUpdateUser}
        initialData={editingUser}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={handleUpdateEvent}
        initialData={editingEvent}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteUser}
        username={userToDelete?.username || ''}
      />
    </div>
  );
}
