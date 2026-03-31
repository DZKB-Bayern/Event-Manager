import React, { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Event } from '../types';

interface EventFormData {
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  image_url?: string;
  color?: string;
  button_text?: string;
  button_link?: string;
  category: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: Event | null;
  isDuplicate?: boolean;
}

export default function EventModal({ isOpen, onClose, onSubmit, initialData, isDuplicate }: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    image_url: '',
    color: '#0D89F9',
    button_text: 'JETZT ANMELDEN',
    button_link: '',
    category: 'events',
  });
  
  // Separate state for date and time inputs
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isMouseDownOnBackdrop = useRef(false);

  useEffect(() => {
    if (initialData) {
      // Parse start_time
      const start = new Date(initialData.start_time);
      const end = new Date(initialData.end_time);

      setStartDate(start.toISOString().slice(0, 10));
      setStartTime(start.toTimeString().slice(0, 5));
      
      setEndDate(end.toISOString().slice(0, 10));
      setEndTime(end.toTimeString().slice(0, 5));

      setFormData({
        title: initialData.title,
        description: initialData.description,
        location: initialData.location,
        start_time: initialData.start_time,
        end_time: initialData.end_time,
        image_url: initialData.image_url,
        color: initialData.color || '#0D89F9',
        button_text: initialData.button_text || 'JETZT ANMELDEN',
        button_link: initialData.button_link || '',
        category: initialData.category || 'events',
      });
      setPreviewUrl(initialData.image_url || null);
    } else {
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        image_url: '',
        color: '#0D89F9',
        button_text: 'JETZT ANMELDEN',
        button_link: '',
        category: 'events',
      });
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setPreviewUrl(null);
    }
    setImageFile(null);
  }, [initialData, isOpen]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Combine date and time
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('location', formData.location);
    data.append('start_time', startDateTime.toISOString());
    data.append('end_time', endDateTime.toISOString());
    data.append('color', formData.color || '#0D89F9');
    data.append('button_text', formData.button_text || 'JETZT ANMELDEN');
    data.append('button_link', formData.button_link || '');
    data.append('category', formData.category || 'events');
    
    if (imageFile) {
      data.append('image', imageFile);
    } else if (initialData?.image_url) {
      data.append('existing_image_url', initialData.image_url);
    }
    onSubmit(data);
  };

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      isMouseDownOnBackdrop.current = true;
    } else {
      isMouseDownOnBackdrop.current = false;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (isMouseDownOnBackdrop.current && e.target === e.currentTarget) {
      onClose();
    }
    isMouseDownOnBackdrop.current = false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 md:inset-0 md:h-full"
          onMouseDown={handleBackdropMouseDown}
          onMouseUp={handleBackdropMouseUp}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md h-full md:h-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-white rounded-lg shadow-xl">
              <button
                type="button"
                className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
                <span className="sr-only">Modal schließen</span>
              </button>
              <div className="px-6 py-6 lg:px-8 max-h-[80vh] overflow-y-auto">
                <h3 className="mb-4 text-xl font-medium text-gray-900">
                  {isDuplicate ? 'Veranstaltung duplizieren' : initialData ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung erstellen'}
                </h3>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900">
                      Titel
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                      placeholder="Veranstaltungstitel"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Kategorie
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value="events"
                          checked={formData.category === 'events'}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-gray-900">Events</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value="akademie"
                          checked={formData.category === 'akademie'}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-gray-900">Akademie</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900">
                      Beschreibung
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                      placeholder="Veranstaltungsbeschreibung"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-900">
                      Ort
                    </label>
                    <input
                      type="text"
                      name="location"
                      id="location"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                      placeholder="Veranstaltungsort"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900">
                      Bild
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klicken zum Hochladen</span></p>
                          </div>
                        )}
                        <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start_date" className="block mb-2 text-sm font-medium text-gray-900">
                        Startdatum
                      </label>
                      <input
                        type="date"
                        id="start_date"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="start_time" className="block mb-2 text-sm font-medium text-gray-900">
                        Startzeit
                      </label>
                      <input
                        type="time"
                        id="start_time"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="end_date" className="block mb-2 text-sm font-medium text-gray-900">
                        Enddatum
                      </label>
                      <input
                        type="date"
                        id="end_date"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="end_time" className="block mb-2 text-sm font-medium text-gray-900">
                        Endzeit
                      </label>
                      <input
                        type="time"
                        id="end_time"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="button_text" className="block mb-2 text-sm font-medium text-gray-900">
                        Button Text
                      </label>
                      <input
                        type="text"
                        name="button_text"
                        id="button_text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        placeholder="z.B. JETZT ANMELDEN"
                        value={formData.button_text}
                        onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="button_link" className="block mb-2 text-sm font-medium text-gray-900">
                        Button Link
                      </label>
                      <input
                        type="url"
                        name="button_link"
                        id="button_link"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        placeholder="https://..."
                        value={formData.button_link}
                        onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    {isDuplicate ? 'Veranstaltung duplizieren' : initialData ? 'Veranstaltung aktualisieren' : 'Veranstaltung erstellen'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
