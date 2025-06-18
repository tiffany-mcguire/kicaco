import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parse, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EventCard from './EventCard';
import { useKicacoStore } from '../../store/kicacoStore';
import { getKicacoEventPhoto } from '../../utils/getKicacoEventPhoto';

// Helper → get next 7 days
const generateNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      date,
      label: format(date, 'EEE'),
      number: format(date, 'd'),
      dayOfWeek: date.getDay(),
      isToday: i === 0,
    });
  }
  return days;
};

// Day colors
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', // Sunday - pink
  1: '#ffd8b5', // Monday - orange
  2: '#fde68a', // Tuesday - yellow
  3: '#bbf7d0', // Wednesday - green
  4: '#c0e2e7', // Thursday - blue
  5: '#d1d5fa', // Friday - indigo
  6: '#e9d5ff', // Saturday - purple
};

const dayColorsDark: { [key: number]: string } = {
  0: '#e7a5b4',
  1: '#e6c2a2',
  2: '#e3d27c',
  3: '#a8e1bb',
  4: '#aed1d6',
  5: '#b9bde3',
  6: '#d4c0e6',
};

const SevenDayEventOutlook: React.FC = () => {
  const navigate = useNavigate();
  const events = useKicacoStore(state => state.events);
  const next7Days = useMemo(() => generateNext7Days(), []);
  const [selectedDate, setSelectedDate] = useState(next7Days[0].date);
  const [displayedEventIndex, setDisplayedEventIndex] = useState(0);

  // Filter and sort events for the selected day
  const eventsForSelectedDay = useMemo(() => {
    const parseTime = (timeStr?: string): number => {
      if (!timeStr) return 2400; // Events without time go last
      const date = parse(timeStr, 'h:mm a', new Date());
      return date.getHours() * 100 + date.getMinutes();
    };

    return events
      .filter(event => {
        if (!event.date) return false;
        try {
          const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
          return isSameDay(eventDate, selectedDate);
        } catch (e) {
          console.error("Error parsing event date for comparison:", event.date, e);
          return false;
        }
      })
      .sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }, [events, selectedDate]);
  
  // Reset index when selected day changes or events change
  useEffect(() => {
    setDisplayedEventIndex(0);
  }, [selectedDate, eventsForSelectedDay.length]);

  // Ensure displayedEventIndex is within bounds
  const safeDisplayedEventIndex = eventsForSelectedDay.length > 0 
    ? Math.min(displayedEventIndex, eventsForSelectedDay.length - 1)
    : 0;
  const currentEvent = eventsForSelectedDay[safeDisplayedEventIndex];

  return (
    <section className="pt-6 mb-10">
      <h2 className="text-sm font-medium text-gray-600 mb-4 ml-1 max-w-md mx-auto">
        7-Day Event Outlook
      </h2>
      <div className="relative w-full max-w-md mx-auto">
        {/* Event Content */}
        <div className="relative rounded-xl shadow-lg overflow-hidden">
          {eventsForSelectedDay.length > 0 && currentEvent ? (
            <>
              <EventCard
                image={getKicacoEventPhoto(currentEvent.eventName)}
                name={currentEvent.eventName}
                childName={currentEvent.childName}
                date={currentEvent.date}
                time={currentEvent.time}
                location={currentEvent.location}
                notes={currentEvent.notes || "Remember to bring sunscreen and a water bottle!"}
                noHeaderSpace={true}
                showEventInfo={true}
                onEdit={() => {
                  const globalEventIndex = events.findIndex(e => 
                    e.eventName === currentEvent.eventName && 
                    e.date === currentEvent.date && 
                    e.childName === currentEvent.childName &&
                    e.time === currentEvent.time
                  );
                  navigate('/add-event', { 
                    state: { 
                      event: currentEvent,
                      eventIndex: globalEventIndex,
                      isEdit: true 
                    } 
                  });
                }}
                carouselControls={
                  eventsForSelectedDay.length > 1 ? (
                    <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-[5px]">
                      <button onClick={(e) => { 
                        e.stopPropagation(); 
                        setDisplayedEventIndex(prev => {
                          const newIndex = (prev - 1 + eventsForSelectedDay.length) % eventsForSelectedDay.length;
                          return Math.min(newIndex, eventsForSelectedDay.length - 1);
                        });
                      }} className="text-gray-800 hover:text-gray-900 p-0">
                        <ChevronLeft size={12} />
                      </button>
                      <span className="text-gray-800 text-[10px] font-medium">
                        {safeDisplayedEventIndex + 1}/{eventsForSelectedDay.length}
                      </span>
                      <button onClick={(e) => { 
                        e.stopPropagation(); 
                        setDisplayedEventIndex(prev => {
                          const newIndex = (prev + 1) % eventsForSelectedDay.length;
                          return Math.min(newIndex, eventsForSelectedDay.length - 1);
                        });
                      }} className="text-gray-800 hover:text-gray-900 p-0">
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  ) : undefined
                }
              />
            </>
          ) : (
            <div className="relative w-full h-[240px] rounded-xl overflow-hidden">
              <img
                src={getKicacoEventPhoto('default')}
                alt="No events"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/[.65]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white font-normal">No events scheduled.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Tabs overlay bar */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="flex divide-x divide-white/20 backdrop-blur-sm rounded-t-xl overflow-hidden">
            {next7Days.map(day => (
              <button
                key={day.label + day.number}
                onClick={() => setSelectedDate(day.date)}
                className={`flex-1 flex flex-col items-center py-2 text-xs sm:text-sm font-medium transition-all relative overflow-hidden ${
                  isSameDay(day.date, selectedDate)
                    ? 'text-white font-bold'
                    : 'text-white/70'
                }`}
              >
                {/* Rainbow background for selected tab */}
                {isSameDay(day.date, selectedDate) && (
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: `linear-gradient(180deg, ${dayColorsDark[day.dayOfWeek]}30 0%, ${dayColorsDark[day.dayOfWeek]}25 50%, ${dayColorsDark[day.dayOfWeek]}20 100%)`,
                      filter: 'blur(4px)'
                    }}
                  />
                )}
                <span className="relative z-10">{day.label}</span>
                <span className="relative z-10 text-[10px]">{day.number}</span>
                {/* Rainbow accent at bottom */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-[2px] transition-all z-10"
                  style={{ 
                    backgroundColor: dayColors[day.dayOfWeek],
                    opacity: day.isToday ? 0.9 : (isSameDay(day.date, selectedDate) ? 0.9 : 0.4)
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SevenDayEventOutlook; 