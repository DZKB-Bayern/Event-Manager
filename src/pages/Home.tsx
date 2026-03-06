import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  { bg: 'bg-[#f97316]', hex: '#f97316', text: 'text-white', muted: 'text-white/80' }, // Orange
  { bg: 'bg-[#7c3aed]', hex: '#7c3aed', text: 'text-white', muted: 'text-white/80' }, // Purple
  { bg: 'bg-[#7f1d1d]', hex: '#7f1d1d', text: 'text-white', muted: 'text-white/80' }, // Red
  { bg: 'bg-[#064e3b]', hex: '#064e3b', text: 'text-white', muted: 'text-white/80' }, // Dark Green
];

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Check for embed parameter to adjust layout
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const embedParam = searchParams.get('embed');
  const isEmbed = 
    embedParam === 'true' || 
    embedParam === '1' || 
    embedParam === '' ||
    location.hash.includes('embed=true') ||
    location.hash.includes('embed=1');

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

  // Fixed color for all events
  const EVENT_COLOR = '#0D89F9';
  const EVENT_STYLE = {
    bg: 'bg-[#0D89F9]',
    hex: '#0D89F9',
    text: 'text-white',
    muted: 'text-white/80'
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isEmbed ? 'py-4' : 'py-12'}`}>
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div className="text-center md:text-left w-full md:w-auto">
          <h1 className="text-4xl font-light sm:text-5xl sm:tracking-tight lg:text-6xl" style={{ color: '#0C71C3' }}>
            Unsere Events
          </h1>
          <p className="mt-5 max-w-xl text-xl mx-auto md:mx-0" style={{ color: '#0C71C3' }}>
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
          // Use fixed style for all events
          const style = EVENT_STYLE;
          const customStyle = { backgroundColor: EVENT_COLOR };
          
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
            creator_name: event.profiles?.username || 'Unbekannt',
            color: EVENT_COLOR // Override color for modal
          };

          if (viewMode === 'list') {
            const badgeClass = 'bg-gray-100 text-gray-700';
            const borderColor = EVENT_COLOR;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl shadow-sm overflow-hidden flex flex-row hover:shadow-md transition-all duration-300 cursor-pointer group bg-white border-2`}
                style={{ borderColor: borderColor }}
                onClick={() => setSelectedEvent(displayEvent as any)}
              >
                {/* Date Column - Colored background */}
                <div 
                  className={`w-20 sm:w-24 shrink-0 flex flex-col justify-center items-center text-center p-2 text-white`}
                  style={customStyle}
                >
                  <div className="text-xs font-bold uppercase tracking-wider mb-0.5 opacity-80">{month}</div>
                  <div className="text-2xl sm:text-3xl font-bold leading-none mb-0.5">{day}</div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-80">{weekday}</div>
                </div>

                {/* Main Content Area - White background */}
                <div className="flex-1 flex items-center p-3 sm:p-4 gap-4 min-w-0 bg-white">
                  {/* Image Thumbnail */}
                  <div className="hidden sm:block w-20 h-20 shrink-0 rounded-lg overflow-hidden shadow-sm">
                    <img 
                      src={event.image_url || `https://picsum.photos/seed/${event.id}/200/200`} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                    <h3 className="text-lg sm:text-xl font-medium leading-tight truncate pr-2 text-gray-900">
                      {event.title}
                    </h3>
                    
                    {/* Badges Row */}
                    <div className="flex flex-wrap gap-2 text-xs font-medium opacity-90">
                      <div className={`px-2.5 py-1 rounded-md flex items-center ${badgeClass}`}>
                        <Clock className="h-3.5 w-3.5 mr-1.5 opacity-60" />
                        <span>{startTime} - {endTime}</span>
                      </div>
                      {event.location && (
                        <div className={`px-2.5 py-1 rounded-md flex items-center truncate max-w-[150px] ${badgeClass}`}>
                          <MapPin className="h-3.5 w-3.5 mr-1.5 opacity-60" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>

                    <p className={`text-sm line-clamp-1 text-gray-600 hidden sm:block`}>
                      {event.description}
                    </p>
                  </div>

                  {/* Button - Right aligned */}
                  <div className="shrink-0 ml-2">
                    {event.button_link ? (
                      <a 
                        href={event.button_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-cta text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap shadow-md hover:opacity-90"
                        style={{ backgroundColor: EVENT_COLOR }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.button_text || 'ANMELDEN'}
                      </a>
                    ) : (
                      <button 
                        className="btn-cta text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 whitespace-nowrap shadow-md hover:opacity-90"
                        style={{ backgroundColor: EVENT_COLOR }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(displayEvent as any);
                        }}
                      >
                        {event.button_text || 'ANMELDEN'}
                      </button>
                    )}
                  </div>
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
              className={`rounded-xl shadow-lg overflow-hidden flex flex-col h-full bg-white border-2 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              style={{ borderColor: EVENT_COLOR }}
              onClick={() => setSelectedEvent(displayEvent as any)}
            >
              <div className="relative h-56 shrink-0">
                <img 
                  src={event.image_url || `https://picsum.photos/seed/${event.id}/800/600`} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
                <div 
                  className={`absolute top-0 left-6 p-3 text-center min-w-[80px] rounded-b-lg shadow-md backdrop-blur-sm text-white`}
                  style={customStyle}
                >
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">{month}</div>
                  <div className="text-3xl font-bold leading-none mb-1">{day}</div>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90">{weekday}</div>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 bg-white">
                <h3 className="text-xl font-medium mb-4 line-clamp-2 min-h-[3.5rem] text-gray-900">
                  {event.title}
                </h3>
                
                  <div className="space-y-3 mb-6 text-sm font-medium text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-3 shrink-0 text-primary" />
                      <span>{startTime} - {endTime}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-3 shrink-0 text-primary" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                <p className="text-sm leading-relaxed line-clamp-4 mb-6 text-gray-600">
                  {event.description}
                </p>

                <div className="mt-auto pt-4">
                  {event.button_link ? (
                    <a 
                      href={event.button_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full btn-cta text-center uppercase tracking-wide text-xs py-3 hover:opacity-90"
                      style={{ backgroundColor: EVENT_COLOR }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.button_text || 'JETZT ANMELDEN'}
                    </a>
                  ) : (
                    <button 
                      className="w-full btn-cta text-center uppercase tracking-wide text-xs py-3 hover:opacity-90"
                      style={{ backgroundColor: EVENT_COLOR }}
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
