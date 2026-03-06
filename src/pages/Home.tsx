import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { MapPin, Clock, LayoutGrid, List } from 'lucide-react';
import { motion } from 'motion/react';
import EventDetailsModal from '../components/EventDetailsModal';

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
  profiles?: { username: string }; // Joined profile data
}

const CARD_STYLES = [
  { bg: 'bg-[#5D5333]', hex: '#5D5333', text: 'text-white', muted: 'text-white/80' }, // Olive
  { bg: 'bg-[#98D8A8]', hex: '#98D8A8', text: 'text-gray-900', muted: 'text-gray-700' }, // Light Green
  { bg: 'bg-[#3b82f6]', hex: '#3b82f6', text: 'text-white', muted: 'text-white/80' }, // Blue
  { bg: 'bg-[#1e3a8a]', hex: '#1e3a8a', text: 'text-white', muted: 'text-white/80' }, // Dark Blue
  { bg: 'bg-[#7f1d1d]', hex: '#7f1d1d', text: 'text-white', muted: 'text-white/80' }, // Red
  { bg: 'bg-[#064e3b]', hex: '#064e3b', text: 'text-white', muted: 'text-white/80' }, // Dark Green
];

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, profiles(username)')
          .order('start_time', { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div className="text-center md:text-left w-full md:w-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Unsere Events
          </h1>
          <p className="mt-5 max-w-xl text-xl text-gray-500 mx-auto md:mx-0">
            Zukünftige Veranstaltungen unserer Mitglieder.
          </p>
        </div>

        <div className="bg-gray-100 p-1 rounded-lg flex items-center shrink-0 self-center md:self-end">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            title="Kartenansicht"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            title="Listenansicht"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? "grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-6"}>
        {events.map((event, index) => {
          // Determine style based on event.color or fallback to index
          let style = CARD_STYLES[index % CARD_STYLES.length];
          let customStyle = {};
          
          if (event.color) {
            // Check if it matches one of our presets to get the text color
            const matchedStyle = CARD_STYLES.find(s => s.hex.toLowerCase() === event.color?.toLowerCase());
            
            if (matchedStyle) {
              style = matchedStyle;
            } else {
              // Fallback logic for custom colors (simple brightness check)
              // Convert hex to RGB to calculate brightness
              const hex = event.color.replace('#', '');
              const r = parseInt(hex.substr(0, 2), 16);
              const g = parseInt(hex.substr(2, 2), 16);
              const b = parseInt(hex.substr(4, 2), 16);
              const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
              
              const isLight = brightness > 155; // Threshold for text color
              
              style = {
                bg: '', 
                hex: event.color,
                text: isLight ? 'text-gray-900' : 'text-white',
                muted: isLight ? 'text-gray-700' : 'text-white/80'
              };
            }
            customStyle = { backgroundColor: event.color };
          }

          const date = new Date(event.start_time);
          const month = format(date, 'MMM', { locale: de }).toUpperCase().replace('.', '');
          const day = format(date, 'd');
          const weekday = format(date, 'EE', { locale: de }).toUpperCase().replace('.', '');
          
          // Format time range
          const startTime = format(date, 'HH:mm');
          const endTime = format(new Date(event.end_time), 'HH:mm');

          // Map profile username to creator_name for display
          const displayEvent = {
            ...event,
            creator_name: event.profiles?.username || 'Unbekannt'
          };

          if (viewMode === 'list') {
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow duration-300 cursor-pointer group"
                onClick={() => setSelectedEvent(displayEvent as any)}
              >
                {/* Date Column */}
                <div 
                  className={`p-4 md:w-32 flex flex-col justify-center items-center text-center shrink-0 ${style.bg} ${style.text}`}
                  style={customStyle}
                >
                  <div className="text-sm font-bold uppercase tracking-wider mb-1 opacity-90">{month}</div>
                  <div className="text-4xl font-bold leading-none mb-1">{day}</div>
                  <div className="text-sm font-bold uppercase tracking-wider opacity-90">{weekday}</div>
                </div>

                {/* Image */}
                <div className="md:w-64 h-48 md:h-auto shrink-0 relative overflow-hidden">
                  <img 
                    src={event.image_url || `https://picsum.photos/seed/${event.id}/800/600`} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1 justify-center min-w-0">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 truncate">
                    {event.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      <span>{startTime} - {endTime} Uhr</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 line-clamp-2 mb-4 flex-1">
                    {event.description}
                  </p>

                  {event.button_link ? (
                    <a 
                      href={event.button_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-cta self-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.button_text || 'JETZT ANMELDEN'}
                    </a>
                  ) : (
                    <button 
                      className="btn-cta self-end"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(displayEvent as any);
                      }}
                    >
                      {event.button_text || 'JETZT ANMELDEN'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-xl shadow-lg overflow-hidden flex flex-col h-full ${style.bg} ${style.text} cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              style={customStyle}
              onClick={() => setSelectedEvent(displayEvent as any)}
            >
              <div className="relative h-56 shrink-0">
                <img 
                  src={event.image_url || `https://picsum.photos/seed/${event.id}/800/600`} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
                <div 
                  className={`absolute top-0 left-6 p-3 text-center min-w-[80px] rounded-b-lg shadow-md backdrop-blur-sm bg-white/90 text-gray-900`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 text-primary">{month}</div>
                  <div className="text-3xl font-extrabold leading-none mb-1">{day}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{weekday}</div>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className={`text-xl font-bold mb-4 line-clamp-2 min-h-[3.5rem] ${style.text}`}>
                  {event.title}
                </h3>
                
                  <div className={`space-y-3 mb-6 text-sm font-medium ${style.muted}`}>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-3 shrink-0 opacity-80" />
                      <span>{startTime} - {endTime}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-3 shrink-0 opacity-80" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                <p className={`text-sm leading-relaxed line-clamp-4 mb-6 ${style.muted}`}>
                  {event.description}
                </p>

                <div className="mt-auto pt-4">
                  {event.button_link ? (
                    <a 
                      href={event.button_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full btn-cta text-center uppercase tracking-wide text-xs py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.button_text || 'JETZT ANMELDEN'}
                    </a>
                  ) : (
                    <button 
                      className="w-full btn-cta text-center uppercase tracking-wide text-xs py-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(displayEvent as any);
                      }}
                    >
                      {event.button_text || 'JETZT ANMELDEN'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Keine kommenden Veranstaltungen gefunden.</p>
        </div>
      )}

      <EventDetailsModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        event={selectedEvent} 
      />
    </div>
  );
}
