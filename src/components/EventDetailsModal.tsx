import React, { useRef } from 'react';
import { X, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  creator_name: string;
  image_url?: string;
  color?: string;
  button_text?: string;
  button_link?: string;
}

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export default function EventDetailsModal({ isOpen, onClose, event }: EventDetailsModalProps) {
  const isMouseDownOnBackdrop = useRef(false);

  if (!event) return null;

  const date = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  
  // Format dates
  const formattedDate = format(date, 'EEEE, d. MMMM yyyy', { locale: de });
  const startTime = format(date, 'HH:mm');
  const endTime = format(endDate, 'HH:mm');

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
            className="relative w-full max-w-2xl my-8"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* 1. Top White Container with Headline */}
              <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 z-10">
                <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 leading-tight pr-8">
                  {event.title}
                </h2>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  onClick={onClose}
                >
                  <X className="w-6 h-6" />
                  <span className="sr-only">Schließen</span>
                </button>
              </div>

              <div className="overflow-y-auto">
                {/* 2. Image */}
                <div className="w-full flex justify-center bg-gray-50">
                  <img 
                    src={event.image_url || `https://picsum.photos/seed/${event.id}/800/600`} 
                    alt={event.title} 
                    className="max-w-full max-h-[300px] w-auto h-auto object-contain" 
                  />
                </div>

                {/* 3. Description */}
                <div className="p-6 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Beschreibung</h3>
                  <div className="prose prose-blue text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </div>
                </div>

                {/* 4. Time and Meeting Point */}
                <div className="p-6 pt-2 space-y-4">
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-primary mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Uhrzeit</p>
                      <p className="text-sm text-gray-600">
                        {formattedDate} <br/>
                        {startTime} - {endTime} Uhr
                      </p>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-primary mt-0.5 mr-3 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Treffpunkt</p>
                        <p className="text-sm text-gray-600">{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Bottom Container with Button */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 sticky bottom-0 z-10">
                {event.button_link ? (
                  <a 
                    href={event.button_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full btn-cta text-center py-3 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: event.color || '#0D89F9' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {event.button_text || 'JETZT ANMELDEN'}
                  </a>
                ) : (
                  <button 
                    className="block w-full btn-cta text-center py-3 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: event.color || '#0D89F9' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle internal navigation or logic if needed
                    }}
                  >
                    {event.button_text || 'JETZT ANMELDEN'}
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
