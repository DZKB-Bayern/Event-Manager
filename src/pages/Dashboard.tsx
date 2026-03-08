import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import EventModal from '../components/EventModal';
import EventItem from '../components/EventItem';
import { Event } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });
        
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load events', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadEvents();
  }, [user]);

  const handleCreate = async (formData: FormData) => {
    if (!user) return;
    try {
      let image_url = '';
      const imageFile = formData.get('image') as File;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Bild-Upload fehlgeschlagen: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(filePath);
          
        image_url = publicUrl;
      }

      const newEvent = {
        user_id: user.id,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        location: formData.get('location') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        color: formData.get('color') as string,
        button_text: formData.get('button_text') as string,
        button_link: formData.get('button_link') as string,
        image_url: image_url || undefined,
      };

      const { error: dbError } = await supabase.from('events').insert([newEvent]);
      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Datenbank-Fehler: ${dbError.message}`);
      }

      setIsModalOpen(false);
      loadEvents();
    } catch (error: any) {
      console.error('Failed to create event', error);
      alert(error.message || 'Fehler beim Erstellen der Veranstaltung.');
    }
  };

  const handleUpdate = async (event: Event, formData: FormData) => {
    if (!user) return;
    try {
      let image_url = event.image_url;
      const imageFile = formData.get('image') as File;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
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
        .eq('id', event.id);
        
      if (error) throw error;

      loadEvents();
    } catch (error) {
      console.error('Failed to update event', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Veranstaltung löschen möchten?')) return;
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  const openCreateModal = () => {
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center">Laden...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meine Veranstaltungen</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Veranstaltung erstellen
        </button>
      </div>

      <div className="space-y-4">
        <ul className="space-y-4">
          {events.map((event) => (
            <EventItem 
              key={event.id} 
              event={event} 
              onUpdate={handleUpdate} 
              onDelete={handleDelete} 
            />
          ))}
          {events.length === 0 && (
            <li className="bg-white shadow sm:rounded-md px-4 py-8 text-center text-gray-500">
              Sie haben noch keine Veranstaltungen erstellt.
            </li>
          )}
        </ul>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        initialData={null}
      />
    </div>
  );
}
