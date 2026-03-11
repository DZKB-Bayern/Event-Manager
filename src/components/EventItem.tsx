import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Calendar, MapPin, Clock, Edit2, Trash2, Save, X, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Event } from '../types';

interface EventItemProps {
  event: Event;
  onUpdate: (event: Event, formData: FormData) => Promise<void>;
  onDelete: (id: number) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    location: event.location,
    color: event.color || '#0D89F9',
    button_text: event.button_text || 'JETZT ANMELDEN',
    button_link: event.button_link || '',
  });

  // Date/Time state
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  
  const [startDate, setStartDate] = useState(start.toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(start.toTimeString().slice(0, 5));
  const [endDate, setEndDate] = useState(end.toISOString().slice(0, 10));
  const [endTime, setEndTime] = useState(end.toTimeString().slice(0, 5));

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(event.image_url || null);

  useEffect(() => {
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      color: event.color || '#0D89F9',
      button_text: event.button_text || 'JETZT ANMELDEN',
      button_link: event.button_link || '',
    });
    
    const s = new Date(event.start_time);
    const e = new Date(event.end_time);
    setStartDate(s.toISOString().slice(0, 10));
    setStartTime(s.toTimeString().slice(0, 5));
    setEndDate(e.toISOString().slice(0, 10));
    setEndTime(e.toTimeString().slice(0, 5));
    
    setPreviewUrl(event.image_url || null);
    setImageFile(null);
  }, [event]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('location', formData.location);
      data.append('start_time', startDateTime.toISOString());
      data.append('end_time', endDateTime.toISOString());
      data.append('color', formData.color);
      data.append('button_text', formData.button_text);
      data.append('button_link', formData.button_link);
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      await onUpdate(event, data);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset state
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      color: event.color || '#0D89F9',
      button_text: event.button_text || 'JETZT ANMELDEN',
      button_link: event.button_link || '',
    });
    const s = new Date(event.start_time);
    const e = new Date(event.end_time);
    setStartDate(s.toISOString().slice(0, 10));
    setStartTime(s.toTimeString().slice(0, 5));
    setEndDate(e.toISOString().slice(0, 10));
    setEndTime(e.toTimeString().slice(0, 5));
    setPreviewUrl(event.image_url || null);
    setImageFile(null);
  };

  if (isEditing) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white shadow sm:rounded-md p-4 border-2 border-primary/20"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Titel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ort</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                  required
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ende</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                  required
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Button Text</label>
              <input
                type="text"
                value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                placeholder="z.B. JETZT ANMELDEN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Button Link</label>
              <input
                type="url"
                value={formData.button_link}
                onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                placeholder="https://"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bild</label>
            <div className="mt-1 flex items-center gap-4">
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
              )}
              <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Ändern</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.li 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white shadow sm:rounded-md overflow-hidden"
    >
      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-primary truncate">{event.title}</h3>
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <p>
                {format(new Date(event.start_time), 'PPP', { locale: de })}
              </p>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <p>
                {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-primary hover:text-primary-hover p-2 rounded-full hover:bg-gray-100"
              title="Bearbeiten"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(event.id);
              }}
              className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-gray-100"
              title="Löschen"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <div className="text-gray-400">
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 border-t pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Beschreibung</h4>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{event.description || 'Keine Beschreibung'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Ort</h4>
                  <p className="flex items-center mt-1 text-sm text-gray-900">
                    <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    {event.location || 'Kein Ort angegeben'}
                  </p>
                </div>
              </div>
              {event.image_url && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Bild</h4>
                  <img src={event.image_url} alt={event.title} className="h-32 object-cover rounded-lg" />
                </div>
              )}
              <div className="mt-4 flex gap-4">
                {event.button_text && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Button Text</h4>
                    <p className="mt-1 text-sm text-gray-900">{event.button_text}</p>
                  </div>
                )}
                {event.button_link && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Button Link</h4>
                    <a href={event.button_link} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-primary hover:underline truncate block max-w-xs">
                      {event.button_link}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
};

export default EventItem;
