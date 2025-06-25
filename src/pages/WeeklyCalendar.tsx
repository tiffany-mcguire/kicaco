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
import { Calendar, ChevronLeft, ChevronRight, Trash2, Filter as FilterIcon } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, isToday, parse, isThisWeek, getYear, getMonth, isBefore, startOfDay } from 'date-fns';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { generateUUID } from '../utils/uuid';
// import { ChildFilterDropdown } from '../components/common';

// Filter Dropdown Component
const ChildFilterDropdown: React.FC<{
  children: { name: string }[];
  selectedChildren: string[];
  onToggleChild: (name: string) => void;
  onClear: () => void;
  isActive: boolean;
}> = ({ children, selectedChildren, onToggleChild, onClear, isActive }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`p-1 rounded-full transition-colors bg-[#c0e2e7]/20 text-[#217e8f] hover:bg-[#c0e2e7]/30 active:scale-95 ${isActive ? 'border border-gray-100' : ''}`}
        aria-label="Filter by child"
        title="Filter"
      >
        <FilterIcon className="w-4 h-4" strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-100">
          <ul className="py-1">
            {children.map(child => (
              <li key={child.name}>
                <label className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChildren.includes(child.name)}
                    onChange={() => onToggleChild(child.name)}
                    className="h-4 w-4 rounded border-gray-300 text-[#217e8f] focus:ring-[#217e8f]/50"
                  />
                  <span className="ml-3">{child.name}</span>
                </label>
              </li>
            ))}
            {selectedChildren.length > 0 && (
              <>
                <li className="border-t border-gray-100 my-1" />
                <li>
                  <button 
                    onClick={onClear} 
                    className="w-full text-left block px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Clear Filter
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

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
  const [filteredChildren, setFilteredChildren] = useState<string[]>([]);

  // Debouncing to prevent rapid-fire stack navigation
  const lastFlickTimeRef = useRef<number>(0);

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

  // Filter functions
  const handleToggleChildFilter = useCallback((childName: string) => {
    setFilteredChildren(prev =>
      prev.includes(childName)
        ? prev.filter(name => name !== childName)
        : [...prev, childName]
    );
  }, []);

  const handleClearFilter = useCallback(() => setFilteredChildren([]), []);

  // Filtered events and keepers
  const filteredEvents = useMemo(() => {
    if (filteredChildren.length === 0) return events;
    return events.filter(event => {
      if (!event.childName) return false;
      const eventChildren = event.childName.split(',').map(name => name.trim());
      return filteredChildren.some(selectedChild => eventChildren.includes(selectedChild));
    });
  }, [events, filteredChildren]);

  const filteredKeepers = useMemo(() => {
    if (filteredChildren.length === 0) return keepers;
    return keepers.filter(keeper => {
      if (!keeper.childName) return false;
      const keeperChildren = keeper.childName.split(',').map(name => name.trim());
      return filteredChildren.some(selectedChild => keeperChildren.includes(selectedChild));
    });
  }, [keepers, filteredChildren]);

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

  const weekEnd = addDays(weekStart, 6);
  let displayRange;
  const isWeekInPast = isBefore(startOfDay(weekEnd), startOfDay(new Date()));

  if (getYear(weekStart) !== getYear(weekEnd)) {
    // Spans years: "Dec 29, 24 - Jan 03, 25"
    displayRange = `${format(weekStart, 'MMM d, yy')} - ${format(weekEnd, 'MMM d, yy')}`;
  } else if (getMonth(weekStart) !== getMonth(weekEnd)) {
    // Spans months: "Aug 31 - Sep 6, 2025"
    displayRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  } else {
    // Same month: "August 3 - 9, 2025"
    displayRange = `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`;
  }

  // Auto-scroll to ensure expanded card and next tab are visible
  useEffect(() => {
    if (activeDayIndex === null || !stackedDaysContainerRef.current || !pageScrollRef.current) return;

    const scrollContainer = pageScrollRef.current;
    const stackContainer = stackedDaysContainerRef.current;
    
    // Calculate the scroll position needed using the EXACT same logic as card positioning
    const calculateScrollPosition = () => {
      const visibleTabHeight = 56;
      const popOffset = 316;
      const stackGap = 280;
      const totalInStack = weekDays.length;
      
      // EXACT same calculation as in card rendering for the active card
      let cardOffset = (totalInStack - 1 - activeDayIndex) * visibleTabHeight;
      
      // Check if there are cards above this one that need gaps (this matches the card logic exactly)
      // For the active card: activeDayIndex > stackPosition becomes activeDayIndex > activeDayIndex which is false
      // So no stackGap is added to the active card itself (correct!)
      
      // Since this IS the active card, add popOffset
      cardOffset += popOffset;
      
      // Calculate final position after the -316px transform
      const finalCardTop = cardOffset - 316; // The transform translateY(-316px)
      
      // Calculate container position relative to scroll container
      const containerRect = stackContainer.getBoundingClientRect();
      const scrollRect = scrollContainer.getBoundingClientRect();
      const containerOffsetInScroll = containerRect.top - scrollRect.top + scrollContainer.scrollTop;
      
      // Target position: show expanded card with margin above for next tab
      const desiredMarginAbove = 120; // More space to ensure next tab is visible
      const targetScrollTop = containerOffsetInScroll + finalCardTop - desiredMarginAbove;
      
      // Ensure we don't scroll past the bounds
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScroll));
      
      console.log('[WeeklyCalendar] Auto-scroll calculation EXACT MATCH:', {
        activeDayIndex,
        totalInStack,
        baseCardOffset: (totalInStack - 1 - activeDayIndex) * visibleTabHeight,
        cardOffsetWithPopOffset: cardOffset,
        finalCardTopAfterTransform: finalCardTop,
        containerOffsetInScroll,
        desiredMarginAbove,
        targetScrollTop,
        finalScrollTop
      });
      
      return finalScrollTop;
    };

    // Use a small delay to allow the animation to start, then scroll
    const scrollTimeout = setTimeout(() => {
      const targetScroll = calculateScrollPosition();
      
      scrollContainer.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
      
      console.log('[WeeklyCalendar] Auto-scrolling to position:', targetScroll, 'for active day index:', activeDayIndex);
    }, 200); // Slightly longer delay to ensure card animation starts

    return () => clearTimeout(scrollTimeout);
  }, [activeDayIndex, weekDays.length]);

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
        const dateObj = parse(normalized, pattern, new Date());
        if (!isNaN(dateObj.getTime())) {
          return parseInt(format(dateObj, 'HHmm'), 10);
        }
      } catch {}
    }
    const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
    if (!isNaN(dateObj.getTime())) {
      return parseInt(format(dateObj, 'HHmm'), 10);
    }
    return 2400;
  }, []);

  const getEventsForDay = useCallback((dateString: string) => {
    return filteredEvents
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
  }, [filteredEvents, parseTimeForSorting]);

  const getKeepersForDay = useCallback((dateString: string) => {
    return filteredKeepers.filter(keeper => {
      if (!keeper.date) return false;
      try {
        const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
        const dayDate = parse(dateString, 'yyyy-MM-dd', new Date());
        return isSameDay(keeperDate, dayDate);
      } catch {
        return false;
      }
    });
  }, [filteredKeepers]);

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
        const dateObj = parse(normalized, pattern, new Date());
        if (!isNaN(dateObj.getTime())) {
          return format(dateObj, 'hh:mm a').toUpperCase();
        }
      } catch {}
    }
    const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
    if (!isNaN(dateObj.getTime())) {
      return format(dateObj, 'hh:mm a').toUpperCase();
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

  // Handle flick down - dismiss current card to reveal the one "above" it in stack (newer day, higher stack position)
  const handleFlickDown = useCallback((currentStackPosition: number) => {
    const now = Date.now();
    // Debounce: ignore if less than 200ms since last flick
    if (now - lastFlickTimeRef.current < 200) {
      console.log('[WeeklyCalendar] handleFlickDown debounced');
      return;
    }
    lastFlickTimeRef.current = now;
    
    console.log('[WeeklyCalendar] handleFlickDown called', { currentStackPosition });
    // Move to next day in stack (higher stack position)
    const nextStackPosition = currentStackPosition < weekDays.length - 1 ? currentStackPosition + 1 : null;
    console.log('[WeeklyCalendar] Setting active to', { nextStackPosition });
    setActiveDayIndex(nextStackPosition);
  }, [weekDays.length]);

  // Handle flick up - bring back the card "below" it in stack (earlier day, lower stack position)
  const handleFlickUp = useCallback((currentStackPosition: number) => {
    const now = Date.now();
    // Debounce: ignore if less than 200ms since last flick
    if (now - lastFlickTimeRef.current < 200) {
      console.log('[WeeklyCalendar] handleFlickUp debounced');
      return;
    }
    lastFlickTimeRef.current = now;
    
    console.log('[WeeklyCalendar] handleFlickUp called', { currentStackPosition });
    // Move to previous day in stack (lower stack position)
    const nextStackPosition = currentStackPosition > 0 ? currentStackPosition - 1 : null;
    console.log('[WeeklyCalendar] Setting active to', { nextStackPosition });
    setActiveDayIndex(nextStackPosition);
  }, []);

  // Fixed container height to prevent layout shifts
  const containerHeight = 1000; // Height that accommodates expanded cards while limiting excessive scroll

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Weekly Calendar"
      />
      
      {/* Week Navigation */}
      <div 
        ref={weekNavRef} 
        className="sticky z-[95] bg-gray-50 -mt-px"
        style={{ top: 'calc(4rem + 52px)' }}
      >
        <div className="px-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-center justify-center py-2">
              {/* Left - Filter Icon (positioned absolutely) */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2">
                <ChildFilterDropdown 
                  children={children}
                  selectedChildren={filteredChildren}
                  onToggleChild={handleToggleChildFilter}
                  onClear={handleClearFilter}
                  isActive={filteredChildren.length > 0}
                />
              </div>

              {/* Center - Navigation (with padding to avoid icons) */}
              <div className="flex items-center justify-center min-w-0 px-10">
                <button onClick={goToPreviousWeek} className="p-1 rounded hover:bg-gray-100 active:scale-95">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                
                {/* "Current" button for future weeks */}
                {!isThisWeek(weekStart) && !isWeekInPast && (
                  <button
                    onClick={() => setCurrentWeek(new Date())}
                    className="mx-1 text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 hover:bg-[#c0e2e7]/30 px-2 py-0.5 rounded-full transition-colors active:scale-95 whitespace-nowrap"
                  >
                    ← Current
                  </button>
                )}
                
                <h2 className={`text-[15px] font-normal text-gray-700 ${isThisWeek(weekStart) ? 'mx-3' : 'mx-1'} whitespace-nowrap overflow-visible`}>
                  {displayRange}
                  {isThisWeek(weekStart) && (
                    <span className="ml-2 text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </h2>
                
                {/* "Current" button for past weeks */}
                {!isThisWeek(weekStart) && isWeekInPast && (
                  <button
                    onClick={() => setCurrentWeek(new Date())}
                    className="mx-1 text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 hover:bg-[#c0e2e7]/30 px-2 py-0.5 rounded-full transition-colors active:scale-95 whitespace-nowrap"
                  >
                    Current →
                  </button>
                )}

                {/* Spacer to balance layout */}
                {(isThisWeek(weekStart) || !isWeekInPast) && (
                  <div className="w-[20px] flex-shrink-0"></div>
                )}
                
                <button onClick={goToNextWeek} className="p-1 rounded hover:bg-gray-100 active:scale-95">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* Right - Calendar Icon (positioned absolutely) */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button 
                  onClick={() => {
                    // Create a temporary date input element
                    const tempInput = document.createElement('input');
                    tempInput.type = 'date';
                    tempInput.value = format(weekStart, 'yyyy-MM-dd');
                    tempInput.style.position = 'absolute';
                    tempInput.style.left = '-9999px';
                    tempInput.style.opacity = '0';
                    
                    document.body.appendChild(tempInput);
                    
                    tempInput.addEventListener('change', () => {
                      if (tempInput.value) {
                        const selectedDate = new Date(tempInput.value);
                        setCurrentWeek(startOfWeek(selectedDate, { weekStartsOn: 0 }));
                      }
                      document.body.removeChild(tempInput);
                    });
                    
                    // Trigger the date picker
                    if (tempInput.showPicker) {
                      tempInput.showPicker();
                    } else {
                      tempInput.focus();
                      tempInput.click();
                    }
                  }}
                  className="p-1 rounded-full bg-[#c0e2e7]/20 hover:bg-[#c0e2e7]/30 active:scale-95 transition-all duration-150"
                  title="Jump to specific week"
                >
                  <Calendar className="w-4 h-4 text-[#217e8f]" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
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
        <div className="px-4 pt-4 pb-[20px]">
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
                  onFlickDown={handleFlickDown}
                  onFlickUp={handleFlickUp}
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
  onToggle, formatTime12, navigate, removeEvent, removeKeeper, events, keepers,
  onFlickDown, onFlickUp
}: any) => {
  // Tab touch state - only for tab area
  const tabTouchRef = useRef<{
    isTracking: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startTime: number;
    dragOffset: number;
    isDragging: boolean;
    hasMovedSignificantly: boolean;
  }>({
    isTracking: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    dragOffset: 0,
    isDragging: false,
    hasMovedSignificantly: false,
  });

  // Tab visual feedback
  const [tabVisual, setTabVisual] = useState<{
    isDragging: boolean;
    dragOffset: number;
    dragOffsetX: number;
    scale: number;
    brightness: number;
  }>({
    isDragging: false,
    dragOffset: 0,
    dragOffsetX: 0,
    scale: 1,
    brightness: 1,
  });

  // Simplified haptic feedback
  const haptic = {
    light: () => navigator.vibrate?.(25),
    medium: () => navigator.vibrate?.(50),
    success: () => navigator.vibrate?.([40, 20, 40]),
  };

  // Clear touch state
  const clearTabTouchState = useCallback(() => {
    tabTouchRef.current.isTracking = false;
    tabTouchRef.current.isDragging = false;
    tabTouchRef.current.hasMovedSignificantly = false;
    setTabVisual({
      isDragging: false,
      dragOffset: 0,
      dragOffsetX: 0,
      scale: 1,
      brightness: 1,
    });
  }, []);

  // TAB TOUCH HANDLERS - ONLY ON TAB AREA
  const handleTabTouchStart = useCallback((e: React.TouchEvent) => {
    // Only handle touches that start on the tab area
    const target = e.target as HTMLElement;
    if (!target.closest('[data-tab-touch-area="true"]')) {
      return;
    }

    e.preventDefault(); // Prevent scroll only on tab area
    
    const touch = e.touches[0];
    const now = Date.now();
    
    tabTouchRef.current = {
      isTracking: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: now,
      dragOffset: 0,
      isDragging: false,
      hasMovedSignificantly: false,
    };

    haptic.light();
    console.log('[Day Card Tab Touch] Started');
  }, [haptic]);

  const handleTabTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tabTouchRef.current.isTracking) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - tabTouchRef.current.startX;
    const deltaY = touch.clientY - tabTouchRef.current.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    tabTouchRef.current.currentX = touch.clientX;
    tabTouchRef.current.currentY = touch.clientY;

    // Mark significant movement
    if (absDeltaX > 8 || absDeltaY > 8) {
      tabTouchRef.current.hasMovedSignificantly = true;
    }

    // Start dragging if significant movement in any direction
    if ((absDeltaX > 10 || absDeltaY > 10) && !tabTouchRef.current.isDragging) {
      tabTouchRef.current.isDragging = true;
      setTabVisual(prev => ({
        ...prev,
        isDragging: true,
        scale: 1.02,
        brightness: 1.1,
      }));
      haptic.medium();
      console.log('[Day Card Tab Touch] Drag started');
    }

    // Update visual feedback during drag - allow movement in all directions
    if (tabTouchRef.current.isDragging) {
      e.preventDefault(); // Only prevent default during active drag
      
      // Allow free movement around the screen with some dampening
      const dragOffsetX = Math.max(-100, Math.min(100, deltaX * 0.4));
      const dragOffsetY = Math.max(-100, Math.min(100, deltaY * 0.4));
      
      tabTouchRef.current.dragOffset = dragOffsetY; // Keep for gesture detection
      
      setTabVisual(prev => ({
        ...prev,
        dragOffset: dragOffsetY,
        dragOffsetX: dragOffsetX, // Add X offset for free movement
      }));
    }
  }, [haptic]);

  const handleTabTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!tabTouchRef.current.isTracking) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - tabTouchRef.current.startX;
    const deltaY = touch.clientY - tabTouchRef.current.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const timeElapsed = Date.now() - tabTouchRef.current.startTime;
    
    console.log(`[Day Card Tab Touch] End - deltaY: ${deltaY.toFixed(1)}, time: ${timeElapsed}ms, isDragging: ${tabTouchRef.current.isDragging}`);
    
    let actionTaken = false;

    // Handle FLICK gestures - more forgiving criteria when card is open
    const flickTimeThreshold = isActive ? 800 : 600; // More time allowed when card is open
    const flickDistanceThreshold = isActive ? 30 : 40; // Less distance needed when card is open
    
    if (timeElapsed < flickTimeThreshold && absDeltaY > flickDistanceThreshold) {
      if (deltaY > 0) {
        // FLICK DOWN = expose card above it (lower stack position)
        console.log('[Day Card Tab Touch] Flick DOWN - exposing card above', { stackPosition, hasHandler: !!onFlickDown, isActive });
        onFlickDown?.(stackPosition);
        haptic.success();
        actionTaken = true;
      } else if (deltaY < 0) {
        // FLICK UP = expose card below it (higher stack position)
        console.log('[Day Card Tab Touch] Flick UP - exposing card below', { stackPosition, totalInStack, hasHandler: !!onFlickUp, isActive });
        onFlickUp?.(stackPosition, totalInStack);
        haptic.success();
        actionTaken = true;
      }
    }
    
    // Handle tap if no vertical gesture detected
    if (!actionTaken && !tabTouchRef.current.hasMovedSignificantly && timeElapsed < 300) {
      console.log('[Day Card Tab Touch] Tap action');
      onToggle?.();
      haptic.medium();
      actionTaken = true;
    }

    // Prevent click event if we performed a gesture
    if (actionTaken) {
      e.preventDefault();
      e.stopPropagation();
    }

    clearTabTouchState();
  }, [isActive, onToggle, onFlickDown, onFlickUp, stackPosition, totalInStack, haptic, clearTabTouchState]);

  const handleTabTouchCancel = useCallback(() => {
    console.log('[Day Card Tab Touch] Cancelled');
    clearTabTouchState();
  }, [clearTabTouchState]);
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
          transform: `${isActive ? 'translateY(-316px) scale(1.02)' : 'translateY(0)'} translateY(${tabVisual.dragOffset}px) translateX(${tabVisual.dragOffsetX || 0}px) scale(${isActive ? 1.02 * tabVisual.scale : tabVisual.scale})`,
          transition: tabVisual.isDragging ? 'none' : 'transform 0.3s ease-out',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: finalAccentSoft,
          boxShadow: finalBoxShadow,
          filter: `brightness(${tabVisual.brightness})`,
        }}
      >
        {/* Day Header - TAB AREA WITH TOUCH ENABLED */}
        <div
          className="relative px-4 py-2 cursor-pointer border-b"
          data-tab-touch-area="true"
          onTouchStart={handleTabTouchStart}
          onTouchMove={handleTabTouchMove}
          onTouchEnd={handleTabTouchEnd}
          onTouchCancel={handleTabTouchCancel}
          onClick={onToggle}
          style={{
            backgroundColor: accentColor,
            borderBottomColor: finalAccentSoft,
            boxShadow: `inset 0 8px 15px -3px #0000001A, inset 0 -8px 15px -3px #0000001A`,
            touchAction: 'none',
            background: tabVisual.isDragging ? `linear-gradient(135deg, ${accentColor}, rgba(59, 130, 246, 0.1))` : accentColor,
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

        {/* Drag indicator - positioned below tab to avoid bleeding through blur */}
        {tabVisual.isDragging && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2 py-1 rounded-full pointer-events-none border border-white/20 z-20 whitespace-nowrap">
            Swipe tab up/down to navigate
          </div>
        )}
      </div>
    </div>
  );
});

// Simplified MiniEventCarousel
const MiniEventCarousel = React.memo(({ dayEvents, accentColor, fullDate, formatTime12, navigate, removeEvent, events }: any) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Touch handling for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchIntentionRef = useRef<'unknown' | 'vertical' | 'horizontal' | 'swipe'>('unknown');
  
  // Helper function to reset touch state
  const resetTouchState = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
    touchIntentionRef.current = 'unknown';
  }, []);

  // Handle swipe navigation
  const handleSwipe = (direction: number) => {
    if (dayEvents.length <= 1) return;
    
    if (direction > 0) {
      // Swipe left - next event
      setCurrentIdx((currentIdx + 1) % dayEvents.length);
    } else {
      // Swipe right - previous event
      setCurrentIdx((currentIdx - 1 + dayEvents.length) % dayEvents.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Reset state first
    resetTouchState();
    
    // Only handle if there are multiple events
    if (dayEvents.length <= 1) return;
    
    // Check if touch started on a button - if so, don't interfere
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return; // Don't handle touches on buttons
    }
    
    // Record starting position
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchIntentionRef.current = 'unknown';
    
    // Stop propagation to prevent parent handlers
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || dayEvents.length <= 1) {
      resetTouchState();
      return;
    }

    // Check if touch is on a button - if so, don't interfere
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(touchStartX.current - currentX);
    const diffY = Math.abs(touchStartY.current - currentY);
    
    // Determine user intention based on movement pattern
    if (touchIntentionRef.current === 'unknown') {
      const minMovement = 15; // Minimum movement to determine intention
      
      if (diffX > minMovement || diffY > minMovement) {
        const horizontalDisplacement = Math.abs(touchStartX.current - currentX);
        const verticalDisplacement = Math.abs(touchStartY.current - currentY);
        
        // Check for clear vertical movement (scrolling)
        const minVerticalForScroll = 25;
        const maxHorizontalDriftForScroll = 10;
        const strongVerticalRatio = verticalDisplacement > horizontalDisplacement * 3;
        
        if (strongVerticalRatio && verticalDisplacement > minVerticalForScroll && horizontalDisplacement < maxHorizontalDriftForScroll) {
          // Clear vertical movement - allow page scrolling
          touchIntentionRef.current = 'vertical';
        } else if (horizontalDisplacement > verticalDisplacement * 1.5 && horizontalDisplacement > 20) {
          // Clear horizontal movement - this is a swipe
          touchIntentionRef.current = 'horizontal';
        } else if (horizontalDisplacement > 30) {
          // Significant horizontal displacement
          touchIntentionRef.current = 'swipe';
        }
      }
    }
    
    // Handle based on determined intention
    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      // Prevent default for horizontal movement to stop page scrolling
      e.preventDefault();
      e.stopPropagation();
    } else if (touchIntentionRef.current === 'vertical') {
      // Allow vertical scrolling by only stopping propagation
      e.stopPropagation();
    } else {
      // Still determining intention - stop propagation but allow default
      e.stopPropagation();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || dayEvents.length <= 1) {
      resetTouchState();
      return;
    }

    // Check if touch ended on a button - if so, don't interfere
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      resetTouchState();
      return;
    }
    
    e.stopPropagation();
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = Math.abs(touchStartY.current - touchEndY);
    const threshold = 50; // Minimum distance for swipe

    // Only process swipes if intention was horizontal movement
    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      e.preventDefault(); // Prevent default for swipe gestures
      
      const horizontalDisplacement = Math.abs(diffX);
      
      // Check if we actually moved horizontally enough
      if (horizontalDisplacement > threshold) {
        if (diffX > 0) {
          // Swiped left - next event
          handleSwipe(1);
        } else {
          // Swiped right - previous event
          handleSwipe(-1);
        }
      }
    }
    
    // Reset touch state
    resetTouchState();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.stopPropagation();
    resetTouchState();
  };

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
  const eventDate = evt.date ? parse(evt.date, 'yyyy-MM-dd', new Date()) : new Date();
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
      
      <div 
        className="absolute top-2 left-0 right-0 z-10 h-[40px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
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
  
  // Touch handling for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchIntentionRef = useRef<'unknown' | 'vertical' | 'horizontal' | 'swipe'>('unknown');
  
  // Helper function to reset touch state
  const resetTouchState = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
    touchIntentionRef.current = 'unknown';
  }, []);

  // Handle swipe navigation
  const handleSwipe = (direction: number) => {
    if (dayKeepers.length <= 1) return;
    
    if (direction > 0) {
      // Swipe left - next keeper
      setCurrentIdx((currentIdx + 1) % dayKeepers.length);
    } else {
      // Swipe right - previous keeper
      setCurrentIdx((currentIdx - 1 + dayKeepers.length) % dayKeepers.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Reset state first
    resetTouchState();
    
    // Only handle if there are multiple keepers
    if (dayKeepers.length <= 1) return;
    
    // Check if touch started on a button - if so, don't interfere
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return; // Don't handle touches on buttons
    }
    
    // Record starting position
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchIntentionRef.current = 'unknown';
    
    // Stop propagation to prevent parent handlers
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || dayKeepers.length <= 1) {
      resetTouchState();
      return;
    }

    // Check if touch is on a button - if so, don't interfere
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(touchStartX.current - currentX);
    const diffY = Math.abs(touchStartY.current - currentY);
    
    // Determine user intention based on movement pattern
    if (touchIntentionRef.current === 'unknown') {
      const minMovement = 15; // Minimum movement to determine intention
      
      if (diffX > minMovement || diffY > minMovement) {
        const horizontalDisplacement = Math.abs(touchStartX.current - currentX);
        const verticalDisplacement = Math.abs(touchStartY.current - currentY);
        
        // Check for clear vertical movement (scrolling)
        const minVerticalForScroll = 25;
        const maxHorizontalDriftForScroll = 10;
        const strongVerticalRatio = verticalDisplacement > horizontalDisplacement * 3;
        
        if (strongVerticalRatio && verticalDisplacement > minVerticalForScroll && horizontalDisplacement < maxHorizontalDriftForScroll) {
          // Clear vertical movement - allow page scrolling
          touchIntentionRef.current = 'vertical';
        } else if (horizontalDisplacement > verticalDisplacement * 1.5 && horizontalDisplacement > 20) {
          // Clear horizontal movement - this is a swipe
          touchIntentionRef.current = 'horizontal';
        } else if (horizontalDisplacement > 30) {
          // Significant horizontal displacement
          touchIntentionRef.current = 'swipe';
        }
      }
    }
    
    // Handle based on determined intention
    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      // Prevent default for horizontal movement to stop page scrolling
      e.preventDefault();
      e.stopPropagation();
    } else if (touchIntentionRef.current === 'vertical') {
      // Allow vertical scrolling by only stopping propagation
      e.stopPropagation();
    } else {
      // Still determining intention - stop propagation but allow default
      e.stopPropagation();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || dayKeepers.length <= 1) {
      resetTouchState();
      return;
    }

    // Check if touch ended on a button - if so, don't interfere
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      resetTouchState();
      return;
    }
    
    e.stopPropagation();
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = Math.abs(touchStartY.current - touchEndY);
    const threshold = 50; // Minimum distance for swipe

    // Only process swipes if intention was horizontal movement
    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      e.preventDefault(); // Prevent default for swipe gestures
      
      const horizontalDisplacement = Math.abs(diffX);
      
      // Check if we actually moved horizontally enough
      if (horizontalDisplacement > threshold) {
        if (diffX > 0) {
          // Swiped left - next keeper
          handleSwipe(1);
        } else {
          // Swiped right - previous keeper
          handleSwipe(-1);
        }
      }
    }
    
    // Reset touch state
    resetTouchState();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.stopPropagation();
    resetTouchState();
  };

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
      
      <div 
        className="absolute top-2 left-0 right-0 z-10 h-[40px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
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