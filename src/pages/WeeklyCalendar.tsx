import { StackedChildBadges } from '../components/common';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalHeader } from '../components/navigation';
import { GlobalFooter } from '../components/navigation';
import { GlobalSubheader } from '../components/navigation';
import { GlobalChatDrawer } from '../components/chat';
import { ChatMessageList } from '../components/chat';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { Calendar, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, isToday, parse } from 'date-fns';
import { parse as parseDate, format as formatDateFns } from 'date-fns';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { generateUUID } from '../utils/uuid';

// Simple button component without state management overhead
const AddByDayButton = React.memo(({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="w-[140px] h-[30px] px-2 border-none rounded-md bg-[#217e8f] text-white text-sm font-normal hover:bg-[#1a6e7e] active:scale-95 transition-colors duration-150"
  >
    Add Event
  </button>
));

// Day accent colors
const dayAccentColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

export default function WeeklyCalendar() {
  const navigate = useNavigate();
  
  // Essential refs
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const weekNavRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const stackedDaysContainerRef = useRef<HTMLDivElement>(null);

  // Essential state only
  const [input, setInput] = useState("");
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [weekNavBottom, setWeekNavBottom] = useState(160);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);

  // Chat-related state (simplified)
  const [scrollRefReady, setScrollRefReady] = useState(false);
  const internalChatContentScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesContentRef = useRef<HTMLDivElement | null>(null);
  const autoscrollFlagRef = useRef(false);
  const previousMessagesLengthRef = useRef(0);

  // Store access
  const {
    messages,
    threadId,
    addMessage,
    removeMessageById,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    setChatScrollPosition,
    events,
    children,
    keepers,
    removeEvent,
    removeKeeper,
  } = useKicacoStore();

  const currentDrawerHeight = storedDrawerHeight ?? 32;

  // Memoized calculations
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
        isToday: isToday(date),
      };
    }), [weekStart]
  );

  // Memoized helper functions
  const parseTimeForSorting = useCallback((timeStr?: string): number => {
    if (!timeStr) return 2400;
    let normalized = timeStr.trim().toLowerCase();
    normalized = normalized.replace(/(\d)(am|pm)/, '$1 $2');
    if (/^\d{1,2}\s?(am|pm)$/.test(normalized)) {
      normalized = normalized.replace(/^(\d{1,2})\s?(am|pm)$/, '$1:00 $2');
    }
    const patterns = ['h:mm a', 'h a', 'h:mma', 'ha', 'H:mm'];
    for (const pattern of patterns) {
      try {
        const dateObj = parseDate(normalized, pattern, new Date());
        if (!isNaN(dateObj.getTime())) {
          return parseInt(formatDateFns(dateObj, 'HHmm'), 10);
        }
      } catch {}
    }
    const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
    if (!isNaN(dateObj.getTime())) {
      return parseInt(formatDateFns(dateObj, 'HHmm'), 10);
    }
    return 2400;
  }, []);

  const getEventsForDay = useCallback((dateString: string) => {
    return events
      .filter(event => {
        if (!event.date) return false;
        try {
          const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
          const dayDate = parse(dateString, 'yyyy-MM-dd', new Date());
          return isSameDay(eventDate, dayDate);
        } catch {
          return false;
        }
      })
      .sort((a, b) => parseTimeForSorting(a.time) - parseTimeForSorting(b.time));
  }, [events, parseTimeForSorting]);

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

  const formatTime12 = useCallback((time?: string) => {
    if (!time) return '';
    let normalized = time.trim().toLowerCase();
    normalized = normalized.replace(/(\d)(am|pm)/, '$1 $2');
    if (/^\d{1,2}\s?(am|pm)$/.test(normalized)) {
      normalized = normalized.replace(/^(\d{1,2})\s?(am|pm)$/, '$1:00 $2');
    }
    const patterns = ['h:mm a', 'h a', 'h:mma', 'ha', 'H:mm'];
    for (const pattern of patterns) {
      try {
        const dateObj = parseDate(normalized, pattern, new Date());
        if (!isNaN(dateObj.getTime())) {
          return formatDateFns(dateObj, 'hh:mm a').toUpperCase();
        }
      } catch {}
    }
    const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
    if (!isNaN(dateObj.getTime())) {
      return formatDateFns(dateObj, 'hh:mm a').toUpperCase();
    }
    return time;
  }, []);

  // Week navigation
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  }, []);

  // Drawer height management
  const handleGlobalDrawerHeightChange = useCallback((height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
  }, [maxDrawerHeight, setStoredDrawerHeight]);

  // Single layout effect for positioning
  useLayoutEffect(() => {
    const updatePositions = () => {
      if (weekNavRef.current) {
        setWeekNavBottom(weekNavRef.current.getBoundingClientRect().bottom);
      }
    };

    const calculateMaxDrawerHeight = () => {
      const subheaderElement = subheaderRef.current;
      const footerElement = footerRef.current;
      if (subheaderElement && footerElement) {
        const subheaderRect = subheaderElement.getBoundingClientRect();
        const footerHeight = footerElement.getBoundingClientRect().height;
        const availableHeight = window.innerHeight - subheaderRect.bottom - footerHeight - 4;
        setMaxDrawerHeight(Math.max(44, availableHeight));
      }
    };

    updatePositions();
    calculateMaxDrawerHeight();

    const handleResize = () => {
      updatePositions();
      calculateMaxDrawerHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simplified chat management
  const executeScrollToBottom = useCallback(() => {
    const sc = internalChatContentScrollRef.current;
    if (!sc || !scrollRefReady) return;
    
    requestAnimationFrame(() => {
      if (internalChatContentScrollRef.current) {
        const currentSc = internalChatContentScrollRef.current;
        const targetScrollTop = Math.max(0, currentSc.scrollHeight - currentSc.clientHeight);
        currentSc.scrollTop = targetScrollTop;
        if (autoscrollFlagRef.current) setChatScrollPosition(targetScrollTop);
      }
    });
  }, [scrollRefReady, setChatScrollPosition]);

  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
  }, []);

  useEffect(() => {
    if (!scrollRefReady || messages.length <= previousMessagesLengthRef.current) return;
    autoscrollFlagRef.current = true;
    executeScrollToBottom();
    previousMessagesLengthRef.current = messages.length;
  }, [messages.length, scrollRefReady, executeScrollToBottom]);

  // Message handling
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !threadId) return;

    const userMessageId = generateUUID();
    addMessage({ id: userMessageId, sender: 'user', content: input });
    const messageToSend = input;
    setInput("");

    autoscrollFlagRef.current = true;
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

  const handleAddEventClick = useCallback((date: string | null) => {
    navigate('/add-event', { state: { date } });
  }, [navigate]);

  // Fixed container height to prevent layout shifts
  const containerHeight = 1000; // Height that accommodates expanded cards while limiting excessive scroll

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
      <div 
        ref={weekNavRef} 
        className="sticky z-[95] flex items-center justify-center py-2 bg-gray-50 max-w-2xl mx-auto w-full"
        style={{ top: 'calc(4rem + 58px)' }}
      >
        <button onClick={goToPreviousWeek} className="p-1 rounded hover:bg-gray-100 active:scale-95">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h2 className="text-base font-normal text-gray-700 mx-3">
          {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d')} ({format(addDays(weekStart, 6), 'yyyy')})
        </h2>
        <button onClick={goToNextWeek} className="p-1 rounded hover:bg-gray-100 active:scale-95">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Main Content */}
      <div
        ref={pageScrollRef}
        className="weekly-calendar-content-scroll bg-gray-50 flex-1 overflow-y-auto"
        style={{
          paddingBottom: `${currentDrawerHeight + 20}px`,
          height: `calc(100vh - ${weekNavBottom}px)`,
        }}
      >
        <div className="px-4 pt-2 pb-[20px]">
          <div
            ref={stackedDaysContainerRef}
            className="relative max-w-2xl mx-auto"
            style={{
              height: `${containerHeight}px`,
              minHeight: '700px',
            }}
          >
            {weekDays.map((day, idx) => {
              const stackPosition = weekDays.length - 1 - idx;
              const totalInStack = weekDays.length;
              const accentColor = dayAccentColors[day.date.getDay()];
              const accentColorSoft = `${accentColor}55`;
              const isActive = activeDayIndex === stackPosition;
              const isEmphasized = day.dayName === 'Saturday' || day.dayName === 'Friday';
              const finalAccentSoft = isEmphasized ? `${accentColor}80` : accentColorSoft;
              const finalBoxShadow = isEmphasized ? `0 0 6px 2px ${finalAccentSoft}` : `0 0 5px 1px ${accentColorSoft}`;
              
              const visibleTabHeight = 56;
              const popOffset = 316;
              const stackGap = 280; // Balanced gap - close but not overlapping
              let cardOffset = (totalInStack - 1 - stackPosition) * visibleTabHeight;
              if (activeDayIndex !== null && activeDayIndex > stackPosition) {
                cardOffset += stackGap; // Use smaller gap instead of full popOffset
              }
              if (isActive) {
                cardOffset += popOffset; // Expanded card still moves up by full amount
              }

              const dayEvents = getEventsForDay(day.fullDate);
              const dayKeepers = getKeepersForDay(day.fullDate);

              return (
                <DayCard
                  key={day.fullDate}
                  day={day}
                  dayEvents={dayEvents}
                  dayKeepers={dayKeepers}
                  isActive={isActive}
                  accentColor={accentColor}
                  accentColorSoft={accentColorSoft}
                  finalAccentSoft={finalAccentSoft}
                  finalBoxShadow={finalBoxShadow}
                  cardOffset={cardOffset}
                  stackPosition={stackPosition}
                  totalInStack={totalInStack}
                  onToggle={() => setActiveDayIndex(isActive ? null : stackPosition)}
                  formatTime12={formatTime12}
                  navigate={navigate}
                  removeEvent={removeEvent}
                  removeKeeper={removeKeeper}
                  events={events}
                  keepers={keepers}
                />
              );
            })}
          </div>
        </div>
      </div>

      <GlobalChatDrawer 
        onHeightChange={handleGlobalDrawerHeightChange}
        drawerHeight={currentDrawerHeight}
        maxDrawerHeight={maxDrawerHeight}
        scrollContainerRefCallback={chatContentScrollRef}
      >
        <div ref={messagesContentRef}>
          <ChatMessageList
            messages={messages}
            onCreateAccount={() => console.log('Account creation requested')}
            onRemindLater={() => console.log('Remind later requested')}
            latestChildName={children[0]?.name || 'your child'}
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

// Separate DayCard component to reduce complexity
const DayCard = React.memo(({ 
  day, dayEvents, dayKeepers, isActive, accentColor, accentColorSoft, 
  finalAccentSoft, finalBoxShadow, cardOffset, stackPosition, totalInStack,
  onToggle, formatTime12, navigate, removeEvent, removeKeeper, events, keepers 
}: any) => {
  return (
    <div
      className="absolute left-0 right-0"
      style={{
        top: `${cardOffset}px`,
        zIndex: totalInStack - stackPosition,
      }}
    >
      <div
        className="bg-white rounded-xl shadow-sm overflow-hidden relative"
        style={{
          transform: isActive ? 'translateY(-316px) scale(1.02)' : 'translateY(0)',
          transition: 'transform 0.3s ease-out', // Only transform, nothing else
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: finalAccentSoft,
          boxShadow: finalBoxShadow,
        }}
      >
        {/* Day Header */}
        <div
          onClick={onToggle}
          className="relative px-4 py-2 cursor-pointer border-b"
          style={{
            backgroundColor: accentColor,
            borderBottomColor: finalAccentSoft,
            boxShadow: `inset 0 8px 15px -3px #0000001A, inset 0 -8px 15px -3px #0000001A`
          }}
        >
          <div className="relative flex items-baseline justify-between" style={{ zIndex: 1 }}>
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-medium text-gray-700">{day.dayName}</h3>
              <span className="text-xs text-gray-500">{day.monthName} {day.dayNumber}</span>
              {day.isToday && (
                <span className="text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>
            
            {/* Event and Keeper indicators */}
            <div className="flex items-center gap-2">
              {dayKeepers.length > 0 && (
                <div className="flex items-center px-1.5 py-0.5 rounded-full bg-white/50 backdrop-blur-sm">
                  <span className="text-[10px] font-medium text-gray-700 mr-1">Keepers:</span>
                  <div className="flex items-center space-x-1">
                    {dayKeepers.slice(0, 3).map((keeper: any, idx: number) => (
                      <StackedChildBadges
                        key={`keeper-${idx}`}
                        childName={keeper.childName}
                        size="sm"
                        maxVisible={10}
                      />
                    ))}
                    {dayKeepers.length > 3 && (
                      <span className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center text-[10px] text-white ring-1 ring-gray-400">
                        +{dayKeepers.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {dayEvents.length > 0 && (
                <div className="flex items-center px-1.5 py-0.5 rounded-full bg-white/50 backdrop-blur-sm">
                  <span className="text-[10px] font-medium text-gray-700 mr-1">Events:</span>
                  <div className="flex items-center space-x-1">
                    {dayEvents.slice(0, 3).map((event: any, idx: number) => (
                      <StackedChildBadges
                        key={`event-${idx}`}
                        childName={event.childName}
                        size="sm"
                        maxVisible={10}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center text-[10px] text-white ring-1 ring-gray-400">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Day Events and Keepers */}
        <div className="p-3 space-y-3">
          <MiniEventCarousel 
            dayEvents={dayEvents} 
            accentColor={accentColorSoft} 
            fullDate={day.fullDate}
            formatTime12={formatTime12}
            navigate={navigate}
            removeEvent={removeEvent}
            events={events}
          />
          <MiniKeeperCard 
            dayKeepers={dayKeepers} 
            dayOfWeek={day.date.getDay()} 
            fullDate={day.fullDate}
            formatTime12={formatTime12}
            navigate={navigate}
            removeKeeper={removeKeeper}
            keepers={keepers}
          />
        </div>
      </div>
    </div>
  );
});

// Simplified MiniEventCarousel
const MiniEventCarousel = React.memo(({ dayEvents, accentColor, fullDate, formatTime12, navigate, removeEvent, events }: any) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (dayEvents.length === 0) {
    return (
      <div className="relative h-32 rounded-lg overflow-hidden shadow-sm">
        <img src={getKicacoEventPhoto('default')} alt="No events" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-sm">No events scheduled</p>
        </div>
        <div className="absolute bottom-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/add-event', { state: { date: fullDate } });
            }}
            className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium hover:bg-white/60 transition-colors duration-150"
          >
            + Add Event
          </button>
        </div>
      </div>
    );
  }

  const evt = dayEvents[currentIdx];
  const eventDate = evt.date ? parseDate(evt.date, 'yyyy-MM-dd', new Date()) : new Date();
  const dayOfWeek = eventDate.getDay();
  
  const globalEventIndex = events.findIndex((e: any) => 
    e.eventName === evt.eventName && 
    e.date === evt.date && 
    e.childName === evt.childName &&
    e.time === evt.time
  );

  const displayName = evt.eventName;

  return (
    <div className="relative h-32 rounded-lg overflow-hidden shadow-sm">
      <img src={getKicacoEventPhoto(evt.eventName)} alt={evt.eventName} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/65" />
      
      <div className="absolute top-2 left-0 right-0 z-10 h-[40px]">
        <div className="flex h-full items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <StackedChildBadges childName={evt.childName} size="sm" maxVisible={3} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white leading-tight">{displayName}</span>
              {evt.location && <span className="text-[10px] text-gray-200 mt-0.5">{evt.location}</span>}
            </div>
            {dayEvents.length > 1 && (
              <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-2">
                <button onClick={(e) => { e.stopPropagation(); setCurrentIdx((currentIdx - 1 + dayEvents.length) % dayEvents.length); }} className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150">
                  <ChevronLeft size={12} />
                </button>
                <span className="text-gray-800 text-[10px] font-medium">{currentIdx + 1}/{dayEvents.length}</span>
                <button onClick={(e) => { e.stopPropagation(); setCurrentIdx((currentIdx + 1) % dayEvents.length); }} className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150">
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center items-end">
            {evt.time && <span className="text-[10px] text-gray-200">{formatTime12(evt.time)}</span>}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
      </div>
      
      <div className="absolute inset-x-0 top-[56px] px-3 text-white">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className="text-[10px] font-bold text-gray-300">Notes</h4>
        </div>
        {((evt as any).notes ?? (evt as any).description) ? (
          <p className="text-[10px] text-gray-200 line-clamp-2 leading-tight">
            {((evt as any).notes ?? (evt as any).description)}
          </p>
        ) : (
          <p className="text-[10px] italic text-gray-400">—</p>
        )}
      </div>

      <div className="absolute bottom-2 left-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/add-event', { state: { event: evt, eventIndex: globalEventIndex, isEdit: true } });
          }}
          className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-300 hover:text-white font-medium hover:bg-black/40 transition-colors duration-150"
        >
          Edit
        </button>
      </div>

      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (globalEventIndex !== -1) removeEvent(globalEventIndex);
          }}
          className="flex items-center gap-1 bg-black/30 text-gray-300 hover:text-[#e7a5b4] text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-150"
        >
          <Trash2 size={10} />
          <span className="text-[10px]">Delete</span>
        </button>
      </div>

      <div className="absolute bottom-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/add-event', { state: { date: evt.date } });
          }}
          className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium hover:bg-white/60 transition-colors duration-150"
        >
          + Add Event
        </button>
      </div>
    </div>
  );
});

// Simplified MiniKeeperCard
const MiniKeeperCard = React.memo(({ dayKeepers, dayOfWeek, fullDate, formatTime12, navigate, removeKeeper, keepers }: any) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (dayKeepers.length === 0) {
    return (
      <div className="relative h-32 rounded-lg overflow-hidden shadow-sm">
        <img src={getKicacoEventPhoto('keeper')} alt="No keepers" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-sm">No keepers due</p>
        </div>
        <div className="absolute bottom-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/add-keeper', { state: { date: fullDate } });
            }}
            className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium hover:bg-white/60 transition-colors duration-150"
          >
            + Add Keeper
          </button>
        </div>
      </div>
    );
  }

  const keeper = dayKeepers[currentIdx];
  const globalKeeperIndex = keepers.findIndex((k: any) => 
    k.keeperName === keeper.keeperName && 
    k.date === keeper.date && 
    k.childName === keeper.childName
  );

  return (
    <div className="relative h-32 rounded-lg overflow-hidden shadow-sm">
      <img src={getKicacoEventPhoto(keeper.keeperName || 'keeper')} alt={keeper.keeperName} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/65" />
      
      <div className="absolute top-2 left-0 right-0 z-10 h-[40px]">
        <div className="flex h-full items-center justify-between px-3">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <StackedChildBadges childName={keeper.childName} size="sm" maxVisible={3} />
              <span className="text-xs font-semibold text-white leading-tight">{keeper.keeperName}</span>
              {dayKeepers.length > 1 && (
                <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-[5px]">
                  <button onClick={(e) => { e.stopPropagation(); setCurrentIdx((currentIdx - 1 + dayKeepers.length) % dayKeepers.length); }} className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150">
                    <ChevronLeft size={12} />
                  </button>
                  <span className="text-gray-800 text-[10px] font-medium">{currentIdx + 1}/{dayKeepers.length}</span>
                  <button onClick={(e) => { e.stopPropagation(); setCurrentIdx((currentIdx + 1) % dayKeepers.length); }} className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150">
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center items-end">
            {keeper.time && <span className="text-[10px] text-gray-200">{formatTime12(keeper.time)}</span>}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
      </div>
      
      <div className="absolute inset-x-0 top-[56px] px-3 text-white">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className="text-[10px] font-bold text-gray-300">Notes</h4>
        </div>
        {keeper.description ? (
          <p className="text-[10px] text-gray-200 line-clamp-2 leading-tight">{keeper.description}</p>
        ) : (
          <p className="text-[10px] italic text-gray-400">—</p>
        )}
      </div>

      <div className="absolute bottom-2 left-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/add-keeper', { state: { keeper: keeper, keeperIndex: globalKeeperIndex, isEdit: true } });
          }}
          className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-300 hover:text-white font-medium hover:bg-black/40 transition-colors duration-150"
        >
          Edit
        </button>
      </div>

      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (globalKeeperIndex !== -1) removeKeeper(globalKeeperIndex);
          }}
          className="flex items-center gap-1 bg-black/30 text-gray-300 hover:text-[#e7a5b4] text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-150"
        >
          <Trash2 size={10} />
          <span className="text-[10px]">Delete</span>
        </button>
      </div>

      <div className="absolute bottom-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/add-keeper', { state: { date: keeper.date } });
          }}
          className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium hover:bg-white/60 transition-colors duration-150"
        >
          + Add Keeper
        </button>
      </div>
    </div>
  );
});