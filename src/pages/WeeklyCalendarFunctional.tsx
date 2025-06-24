import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalHeader, GlobalFooter, GlobalSubheader } from '../components/navigation';
import { GlobalChatDrawer, ChatMessageList } from '../components/chat';
import { StackedChildBadges } from '../components/common';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { Calendar, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, parse, getWeek, getYear } from 'date-fns';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { generateUUID } from '../utils/uuid';

// Simple button component
const AddByDayButton = React.memo(({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="w-[140px] h-[30px] px-2 border-none rounded-md bg-[#217e8f] text-white text-sm font-normal hover:bg-[#1a6e7e] active:scale-95 transition-colors duration-150"
  >
    Add Event
  </button>
));

// Day accent colors
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

export default function WeeklyCalendarFunctional() {
  console.log('🔧 WeeklyCalendarFunctional: Starting render');
  
  const navigate = useNavigate();
  
  // Essential refs
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Essential state
  const [input, setInput] = useState("");
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Store access
  const {
    messages,
    threadId,
    addMessage,
    removeMessageById,
    events,
    children,
    keepers,
    removeEvent,
    removeKeeper,
  } = useKicacoStore();

  // Week calculations
  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek]);
  
  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dayName: format(date, 'EEEE'),
        dayNumber: format(date, 'd'),
        monthName: format(date, 'MMMM'),
        fullDate: format(date, 'yyyy-MM-dd'),
        isToday: isSameDay(date, new Date()),
      };
    }), [weekStart]
  );

  // Helper functions
  const getEventsForDay = useCallback((dateString: string) => {
    return events.filter(event => {
      if (!event.date) return false;
      try {
        const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
        const dayDate = parse(dateString, 'yyyy-MM-dd', new Date());
        return isSameDay(eventDate, dayDate);
      } catch {
        return false;
      }
    });
  }, [events]);

  const getKeepersForDay = useCallback((dateString: string) => {
    return keepers.filter(keeper => {
      if (!keeper.date) return false;
      try {
        const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
        const dayDate = parse(dateString, 'yyyy-MM-dd', new Date());
        return isSameDay(keeperDate, dayDate);
      } catch {
        return false;
      }
    });
  }, [keepers]);

  // Navigation functions
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  }, []);

  const handleAddEventClick = useCallback((date: string | null) => {
    navigate('/add-event', { state: { date } });
  }, [navigate]);

  // Message handling
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !threadId) return;

    const userMessageId = generateUUID();
    addMessage({ id: userMessageId, sender: 'user', content: input });
    const messageToSend = input;
    setInput("");

    const thinkingMessageId = 'thinking-weeklycalendar';
    addMessage({ id: thinkingMessageId, sender: 'assistant', content: 'Kicaco is thinking' });

    try {
      const assistantResponseText = await sendMessageToAssistant(threadId, messageToSend);
      removeMessageById(thinkingMessageId);
      addMessage({ id: generateUUID(), sender: 'assistant', content: assistantResponseText });
    } catch (error) {
      removeMessageById(thinkingMessageId);
      addMessage({ id: generateUUID(), sender: 'assistant', content: "Sorry, I encountered an error. Please try again." });
    }
  }, [input, threadId, addMessage, removeMessageById]);

  console.log('🔧 WeeklyCalendarFunctional: About to return JSX');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Weekly Calendar"
        action={<AddByDayButton onClick={() => handleAddEventClick(null)} />}
      />
      
      {/* Week Navigation */}
      <div className="sticky z-[95] bg-gray-50 max-w-2xl mx-auto w-full border-b border-gray-200">
        <div className="flex items-center justify-center py-3">
          <button onClick={goToPreviousWeek} className="p-2 rounded hover:bg-gray-100 active:scale-95">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-medium text-gray-800 mx-4">
            {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d')} ({format(addDays(weekStart, 6), 'yyyy')})
          </h2>
          <button onClick={goToNextWeek} className="p-2 rounded hover:bg-gray-100 active:scale-95">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Week Picker */}
        <div className="flex justify-center pb-3">
          <div className="flex flex-col items-center">
            <input
              type="week"
              value={`${getYear(weekStart)}-W${getWeek(weekStart).toString().padStart(2, '0')}`}
              onChange={(e) => {
                try {
                  const [year, week] = e.target.value.split('-W');
                  const firstDayOfYear = new Date(parseInt(year), 0, 1);
                  const daysToAdd = (parseInt(week) - 1) * 7;
                  const newWeekStart = addDays(firstDayOfYear, daysToAdd);
                  setCurrentWeek(startOfWeek(newWeekStart, { weekStartsOn: 0 }));
                } catch (error) {
                  console.error('Error setting week:', error);
                }
              }}
              className="text-xs bg-white border border-gray-300 rounded px-3 py-1 text-center focus:outline-none focus:border-[#217e8f] focus:ring-1 focus:ring-[#217e8f]"
              title="Jump to specific week"
            />
            <div className="text-[10px] text-gray-500 mt-1">
              Jump to week
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-20">
        <div className="max-w-2xl mx-auto space-y-3">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day.fullDate);
            const dayKeepers = getKeepersForDay(day.fullDate);
            const accentColor = dayColors[day.date.getDay()];
            
            return (
              <div
                key={day.fullDate}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                style={{
                  borderLeftColor: accentColor,
                  borderLeftWidth: '4px',
                }}
              >
                {/* Day Header */}
                <div 
                  className="px-4 py-3 border-b border-gray-100"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-gray-800">{day.dayName}</h3>
                      <span className="text-sm text-gray-600">{day.monthName} {day.dayNumber}</span>
                      {day.isToday && (
                        <span className="text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/30 px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {dayEvents.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {dayKeepers.length > 0 && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          {dayKeepers.length} keeper{dayKeepers.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-4 space-y-3">
                  {/* Events */}
                  {dayEvents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Events</h4>
                      <div className="space-y-2">
                        {dayEvents.map((event, idx) => (
                          <div
                            key={idx}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <StackedChildBadges childName={event.childName} size="sm" maxVisible={3} />
                                  <span className="font-medium text-gray-800">{event.eventName}</span>
                                  {event.time && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                      {event.time}
                                    </span>
                                  )}
                                </div>
                                {event.location && (
                                  <p className="text-sm text-gray-600 mt-1">📍 {event.location}</p>
                                )}
                                {event.notes && (
                                  <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  const globalEventIndex = events.findIndex(e => 
                                    e.eventName === event.eventName && 
                                    e.date === event.date && 
                                    e.childName === event.childName
                                  );
                                  if (globalEventIndex !== -1) removeEvent(globalEventIndex);
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keepers */}
                  {dayKeepers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Keepers</h4>
                      <div className="space-y-2">
                        {dayKeepers.map((keeper, idx) => (
                          <div
                            key={idx}
                            className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <StackedChildBadges childName={keeper.childName} size="sm" maxVisible={3} />
                                  <span className="font-medium text-gray-800">{keeper.keeperName}</span>
                                  {keeper.time && (
                                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                      {keeper.time}
                                    </span>
                                  )}
                                </div>
                                {keeper.description && (
                                  <p className="text-sm text-gray-600 mt-1">{keeper.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  const globalKeeperIndex = keepers.findIndex(k => 
                                    k.keeperName === keeper.keeperName && 
                                    k.date === keeper.date && 
                                    k.childName === keeper.childName
                                  );
                                  if (globalKeeperIndex !== -1) removeKeeper(globalKeeperIndex);
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {dayEvents.length === 0 && dayKeepers.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-sm mb-3">No events or keepers for this day</p>
                      <button
                        onClick={() => handleAddEventClick(day.fullDate)}
                        className="text-[#217e8f] hover:text-[#1a6e7e] text-sm font-medium"
                      >
                        + Add Event
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <GlobalChatDrawer 
        onHeightChange={() => {}}
        drawerHeight={32}
        maxDrawerHeight={300}
        scrollContainerRefCallback={() => {}}
      >
        <div>
          <ChatMessageList
            messages={messages}
            onCreateAccount={() => console.log('Account creation requested')}
            onRemindLater={() => console.log('Remind later requested')}
          />
        </div>
      </GlobalChatDrawer>

      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSendMessage}
      />
    </div>
  );
} 