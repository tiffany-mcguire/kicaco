import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalHeader, GlobalSubheader, GlobalFooter } from '../components/navigation';
import { CalendarPlus, Share2, Calendar as CalendarIcon } from 'lucide-react';
import Card from '../components/primitives/Card';
import { EventCard } from '../components/calendar';
import { StackedChildBadges } from '../components/common';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { format, parse } from 'date-fns';
import { formatLocationToTitleCase } from '../utils/formatLocation';
import { formatLocationForDisplay } from '../utils/mapsSearch';
import '../styles/KicacoFlow.css';

export default function EventConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const event = (location.state as any)?.event;

  const formattedDate = event?.date ? (() => {
    try {
      return format(parse(event.date, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d');
    } catch {
      return event.date;
    }
  })() : '';

  const formatTimeDisplay = (time?: string) => {
    if (!time) return '';
    try {
      let normalized = time.trim().toLowerCase();
      normalized = normalized.replace(/(\d)(am|pm)/, '$1 $2');
      if (/^\d{1,2}\s?(am|pm)$/.test(normalized)) {
        normalized = normalized.replace(/^(\d{1,2})\s?(am|pm)$/, '$1:00 $2');
      }
      const patterns = ['H:mm', 'HH:mm', 'h:mm a', 'h a', 'h:mma', 'ha'];
      for (const pattern of patterns) {
        const dateObj = parse(normalized, pattern, new Date());
        if (!isNaN(dateObj.getTime())) {
          return format(dateObj, 'hh:mm a');
        }
      }
      const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
      if (!isNaN(dateObj.getTime())) {
        return format(dateObj, 'hh:mm a');
      }
      return time;
    } catch {
      return time || '';
    }
  };

  const formattedTime = formatTimeDisplay(event?.time);

  const toSmartTitleCase = (value?: string) => {
    if (!value) return '';
    const minorWords = new Set([
      'a','an','and','as','at','but','by','for','in','nor','of','on','or','per','the','to','via','with','from','into','onto','over','under','off','up'
    ]);
    const words = value.trim().split(/\s+/);
    const lastIndex = words.length - 1;
    return words.map((word, index) => {
      const w = word.toLowerCase();
      if (index !== 0 && index !== lastIndex && minorWords.has(w)) {
        return w;
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader />
      <GlobalSubheader title="Event Saved" icon={<CalendarPlus />} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Section header message to match Kicaco Flow */}
          <div className="text-sm text-gray-700 mb-2">Your event has been created!</div>

          {/* Match Kicaco Flow confirmation layout and sizing */}
          <div className="kicaco-flow__step-container">
            <div className="kicaco-flow__confirmation-modal">
              <div className="kicaco-flow__confirmation-header">
                <div className="kicaco-flow__confirmation-header-content">
                  <span className="kicaco-flow__confirmation-title">Added: 1 event</span>
                </div>
              </div>

              <div className="kicaco-flow__confirmation-content">
                <div className="kicaco-flow__confirmation-content-bg"></div>
                <div className="kicaco-flow__confirmation-event-container">
                  <EventCard
                    image={getKicacoEventPhoto(event?.eventName || 'default')}
                    name={event?.eventName || 'Event'}
                    childName={event?.childName}
                    date={event?.date}
                    time={event?.time}
                    location={event?.location}
                    notes={event?.notes}
                    contactName={event?.contactName}
                    phoneNumber={event?.phoneNumber}
                    email={event?.email}
                    websiteUrl={event?.websiteUrl}
                    showEventInfo={false}
                  />
                  <div className="kicaco-flow__confirmation-event-overlay">
                    <div className="kicaco-flow__confirmation-event-header">
                      <div className="kicaco-flow__confirmation-event-info">
                        <StackedChildBadges 
                          childName={event?.childName} 
                          size="md" 
                          maxVisible={3}
                          className="kicaco-flow__confirmation-child-badges"
                        />
                        <div className="kicaco-flow__confirmation-event-details">
                          <div className="kicaco-flow__confirmation-event-name-container">
                            <span className="kicaco-flow__confirmation-event-name">
                              {toSmartTitleCase(event?.eventName || 'Event')}
                            </span>
                            {event?.location && (
                              <span className="kicaco-flow__confirmation-event-location whitespace-nowrap">
                                {formatLocationToTitleCase(formatLocationForDisplay({ id: 'sel', name: (event.location.split(' - ')[0] || '').trim(), address: (event.location.includes(' - ') ? event.location.split(' - ')[1] : event.location) }))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="kicaco-flow__confirmation-event-meta">
                        {event?.date && (
                          <span className="kicaco-flow__confirmation-event-date">
                            {format(parse(event.date, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d')}
                          </span>
                        )}
                        {event?.time && (
                          <span className="kicaco-flow__confirmation-event-time">
                            {formattedTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <div 
                      className="kicaco-flow__confirmation-event-divider"
                      style={{ 
                        background: `linear-gradient(90deg, transparent, ${event?.date ? 
                          (['#e9d5ff', '#f8b6c2', '#ffd8b5', '#fde68a', '#bbf7d0', '#c0e2e7', '#d1d5fa'][parse(event.date, 'yyyy-MM-dd', new Date()).getDay()]) : 
                          '#c0e2e7'}, transparent)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit + Actions card mirroring Flow */}
          <Card className="mt-4 max-w-md mx-auto">
            {/* Edit row */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium ml-px">Edit:</span>
              <button 
                className="text-[#c4828d] hover:text-white transition-colors font-medium"
                onClick={() => navigate('/add-event', { state: { isEdit: true, scrollTo: 'eventName', event } })}
              >
                Event
              </button>
              <span className="text-gray-400">|</span>
              <button 
                className="text-[#c4828d] hover:text-white transition-colors font-medium"
                onClick={() => navigate('/add-event', { state: { isEdit: true, scrollTo: 'who', event } })}
              >
                Child
              </button>
              <span className="text-gray-400">|</span>
              <button 
                className="text-[#c4828d] hover:text-white transition-colors font-medium"
                onClick={() => navigate('/add-event', { state: { isEdit: true, scrollTo: 'date', event } })}
              >
                Date
              </button>
              <span className="text-gray-400">|</span>
              <button 
                className="text-[#c4828d] hover:text-white transition-colors font-medium"
                onClick={() => navigate('/add-event', { state: { isEdit: true, scrollTo: 'time', event } })}
              >
                Time
              </button>
              <span className="text-gray-400">|</span>
              <button 
                className="text-[#c4828d] hover:text-white transition-colors font-medium"
                onClick={() => navigate('/add-event', { state: { isEdit: true, scrollTo: 'location', event } })}
              >
                Location
              </button>
              <span className="text-gray-400">|</span>
              <button 
                className="text-[#c4828d] hover:text-white transition-colors font-medium mr-px"
                onClick={() => navigate('/add-event', { state: { isEdit: true, scrollTo: 'notes', event } })}
              >
                Notes
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-3 mt-4">
              {/* Match SmartActionButton default style exactly */}
              <button
                type="button"
                className="transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
                style={{ width: '115px', height: '30px', padding: '0px 0px', border: '2px solid #217e8f', boxSizing: 'border-box', borderRadius: '6px', fontWeight: 500, fontSize: '13px', lineHeight: '20px', background: '#2f8fa4', color: '#ffffff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.08)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}
                onClick={() => {/* TODO: share event */}}
              >
                <span className="flex items-center gap-1"><Share2 size={14} /> Share Event</span>
              </button>
              <button
                type="button"
                className="transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
                style={{ width: '115px', height: '30px', padding: '0px 0px', border: '2px solid #217e8f', boxSizing: 'border-box', borderRadius: '6px', fontWeight: 500, fontSize: '13px', lineHeight: '20px', background: '#2f8fa4', color: '#ffffff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.08)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}
                onClick={() => {/* TODO: export event */}}
              >
                <span className="flex items-center gap-1"><CalendarIcon size={14} /> Export Event</span>
              </button>
              <button
                type="button"
                className="transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
                style={{ width: '115px', height: '30px', padding: '0px 0px', border: '2px solid #217e8f', boxSizing: 'border-box', borderRadius: '6px', fontWeight: 500, fontSize: '13px', lineHeight: '20px', background: '#2f8fa4', color: '#ffffff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.08)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}
                onClick={() => navigate('/add-event')}
              >
                <span className="flex items-center gap-1"><CalendarPlus size={14} /> Create New</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
      <GlobalFooter 
        value="" 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {}}
        onSend={() => {}} 
      />
    </div>
  );
}


