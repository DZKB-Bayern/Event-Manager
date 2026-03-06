import { X, MapPin, Clock, Calendar } from 'lucide-react';
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
  if (!event) return null;

  const date = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  
  // Format dates
  const formattedDate = format(date, 'EEEE, d. MMMM yyyy', { locale: de });
  const startTime = format(date, 'HH:mm');
  const endTime = format(endDate, 'HH:mm');

  // Determine styles based on event color
  const isLightGreen = event.color?.toLowerCase() === '#98d8a8';
  const textColor = isLightGreen ? 'text-gray-900' : 'text-white';
  const mutedColor = isLightGreen ? 'text-gray-700' : 'text-white/80';
  const bgColor = event.color || '#5D5333'; // Default fallback

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 md:inset-0 md:h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl h-full md:h-auto my-8"
          >
            <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header Image Area */}
              <div className="relative h-64 sm:h-80 shrink-0">
                <img 
                  src={event.image_url || `https://picsum.photos/seed/${event.id}/800/600`} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                <button
                  type="button"
                  className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm transition-colors"
                  onClick={onClose}
                >
                  <X className="w-6 h-6" />
                  <span className="sr-only">Schließen</span>
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                  <div className="flex items-center space-x-2 mb-2 text-sm font-medium opacity-90">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                      {event.creator_name}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-shadow-sm">
                    {event.title}
                  </h2>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white">
                <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
                  
                  {/* Main Info */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Beschreibung</h3>
                      <div className="prose prose-indigo text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {event.description}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl space-y-4 border border-gray-100">
                      <div className="flex items-start">
                        <Calendar className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Datum</p>
                          <p className="text-sm text-gray-600">{formattedDate}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Clock className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Zeit</p>
                          <p className="text-sm text-gray-600">{startTime} - {endTime} Uhr</p>
                        </div>
                      </div>

                      {event.location && (
                        <div className="flex items-start">
                          <MapPin className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Ort</p>
                            <p className="text-sm text-gray-600">{event.location}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {event.button_link ? (
                      <a 
                        href={event.button_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-white font-bold py-3 px-4 rounded-lg transition-all text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:brightness-90"
                        style={{ backgroundColor: bgColor }}
                      >
                        {event.button_text || 'JETZT ANMELDEN'}
                      </a>
                    ) : (
                      <button 
                        className="block w-full text-white font-bold py-3 px-4 rounded-lg transition-all text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:brightness-90"
                        style={{ backgroundColor: bgColor }}
                      >
                        {event.button_text || 'JETZT ANMELDEN'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
