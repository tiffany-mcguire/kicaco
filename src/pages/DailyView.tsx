import { ChatMessageList } from '../components/chat';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { GlobalHeader } from '../components/navigation';
import { GlobalFooter } from '../components/navigation';
import { GlobalSubheader } from '../components/navigation';
import { GlobalChatDrawer } from '../components/chat';
import { useKicacoStore } from '../store/kicacoStore';
import { getApiClientInstance } from '../utils/apiClient';

import { Calendar, ChevronLeft, ChevronRight, Filter as FilterIcon } from 'lucide-react';
import { format, addDays, subDays, isSameDay, parse, isToday, isBefore, startOfDay } from 'date-fns';
import { EventCard } from '../components/calendar';
import { KeeperCard } from '../components/calendar';
import { StackedChildBadges, ChildFilterDropdown, ConfirmDialog } from '../components/common';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';

import { generateUUID } from '../utils/uuid';
import { ImageUpload } from '../components/common';
import { createDatePickerHandler } from '../utils/datePickerUtils';

// Day Colors for accent line
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

const formatTime = (time?: string) => {
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
      if (!isNaN(dateObj.getTime())) return format(dateObj, 'hh:mm a');
    } catch {}
  }
  return time.toUpperCase();
};

// Custom EventCard wrapper for Daily View
const DailyEventCard: React.FC<{
  event: any;
  currentDate: Date;
  navigate: any;
  allEvents: any[];
  events: any[];
  displayedEventIndex: number;
  setDisplayedEventIndex: (fn: (prev: number) => number) => void;
  removeEvent: (index: number) => void;
  setDeleteConfirmation: (confirmation: { isOpen: boolean; type: 'event' | 'keeper' | null; index: number | null; name: string }) => void;
}> = ({ event, currentDate, navigate, allEvents, events, displayedEventIndex, setDisplayedEventIndex, removeEvent, setDeleteConfirmation }) => {
  
  const eventDate = event.date ? parse(event.date, 'yyyy-MM-dd', new Date()) : currentDate;
  const dayOfWeek = currentDate.getDay();
  
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
    if (events.length <= 1) return;
    
    if (direction > 0) {
      // Swipe left - next event
      setDisplayedEventIndex(prev => (prev + 1) % events.length);
    } else {
      // Swipe right - previous event
      setDisplayedEventIndex(prev => (prev - 1 + events.length) % events.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    resetTouchState();
    if (events.length <= 1) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchIntentionRef.current = 'unknown';
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || events.length <= 1) {
      resetTouchState();
      return;
    }

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(touchStartX.current - currentX);
    const diffY = Math.abs(touchStartY.current - currentY);
    
    if (touchIntentionRef.current === 'unknown') {
      const minMovement = 15;
      
      if (diffX > minMovement || diffY > minMovement) {
        const horizontalDisplacement = Math.abs(touchStartX.current - currentX);
        const verticalDisplacement = Math.abs(touchStartY.current - currentY);
        
        const minVerticalForScroll = 25;
        const maxHorizontalDriftForScroll = 10;
        const strongVerticalRatio = verticalDisplacement > horizontalDisplacement * 3;
        
        if (strongVerticalRatio && verticalDisplacement > minVerticalForScroll && horizontalDisplacement < maxHorizontalDriftForScroll) {
          touchIntentionRef.current = 'vertical';
        } else if (horizontalDisplacement > verticalDisplacement * 1.5 && horizontalDisplacement > 20) {
          touchIntentionRef.current = 'horizontal';
        } else if (horizontalDisplacement > 30) {
          touchIntentionRef.current = 'swipe';
        }
      }
    }
    
    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      e.preventDefault();
      e.stopPropagation();
    } else if (touchIntentionRef.current === 'vertical') {
      e.stopPropagation();
    } else {
      e.stopPropagation();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || events.length <= 1) {
      resetTouchState();
      return;
    }

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      resetTouchState();
      return;
    }
    
    e.stopPropagation();
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;
    const threshold = 50;

    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      e.preventDefault();
      
      const horizontalDisplacement = Math.abs(diffX);
      
      if (horizontalDisplacement > threshold) {
        if (diffX > 0) {
          handleSwipe(1);
        } else {
          handleSwipe(-1);
        }
      }
    }
    
    resetTouchState();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.stopPropagation();
    resetTouchState();
  };
  
  // Find the global index of this event
  const globalEventIndex = allEvents.findIndex(e => 
    e.eventName === event.eventName && 
    e.date === event.date && 
    e.childName === event.childName &&
    e.time === event.time
  );

  const handleDelete = () => {
    if (globalEventIndex !== -1) {
      setDeleteConfirmation({
        isOpen: true,
        type: 'event',
        index: globalEventIndex,
        name: event.eventName
      });
    }
  };

  // Transform birthday party names to possessive form (same logic as EventCard)
  const displayName = (() => {
    const name = event.eventName;
    if (name.toLowerCase().includes('birthday')) {
      const parenthesesMatch = name.match(/\(([^)]+)\)/);
      if (parenthesesMatch) {
        const birthdayChild = parenthesesMatch[1];
        const possessiveName = birthdayChild.endsWith('s') ? `${birthdayChild}'` : `${birthdayChild}'s`;
        const baseEventName = name.replace(/\s*\([^)]+\)/, '').trim();
        if (baseEventName.toLowerCase() === 'birthday party' || baseEventName.toLowerCase() === 'birthday') {
          return `${possessiveName} Birthday Party`;
        }
        return `${possessiveName} ${baseEventName}`;
      }
      if (event.childName && (name.toLowerCase() === 'birthday party' || name.toLowerCase() === 'birthday')) {
        const possessiveName = event.childName.endsWith('s') ? `${event.childName}'` : `${event.childName}'s`;
        return `${possessiveName} Birthday Party`;
      }
    }
    return name;
  })();

  const eventImage = getKicacoEventPhoto(event.eventName);
  console.log('DailyEventCard:', { eventName: event.eventName, selectedImage: eventImage });

  return (
    <div className="relative h-[240px] w-full rounded-xl overflow-hidden">
      <EventCard
        image={eventImage}
        name={event.eventName}
        childName={event.childName}
        date={event.date}
        time={event.time}
        location={event.location}
        notes={event.notes}
        contactName={event.contactName}
        phoneNumber={event.phoneNumber}
        email={event.email}
        websiteUrl={event.websiteUrl}
        noHeaderSpace={false}
        onEdit={() => {
          navigate('/add-event', { 
            state: { 
              event: event,
              eventIndex: globalEventIndex,
              isEdit: true 
            } 
          });
        }}
        onDelete={handleDelete}
      />
      {/* Tab header overlay similar to UpcomingEvents */}
      <div 
        className="absolute top-0 left-0 right-0 z-10 h-[56px] backdrop-blur-sm"
        data-card-alley
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <StackedChildBadges 
              childName={event.childName} 
              size="md" 
              maxVisible={3}
              className="flex-shrink-0"
            />
            <div className="flex items-center gap-1 min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white">{displayName}</span>
                {event.location && (
                  <span className="text-xs text-gray-200 mt-0.5">{event.location}</span>
                )}
              </div>
              {/* Carousel controls - hugging the event content */}
              {events.length > 1 && (
                <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setDisplayedEventIndex(prev => (prev - 1 + events.length) % events.length); }} className="text-gray-800 hover:text-gray-900 p-0">
                    <ChevronLeft size={12} />
                  </button>
                  <span className="text-gray-800 text-[10px] font-medium">
                    {displayedEventIndex + 1}/{events.length}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setDisplayedEventIndex(prev => (prev + 1) % events.length); }} className="text-gray-800 hover:text-gray-900 p-0">
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center items-end flex-shrink-0 ml-2">
            <span className="text-sm font-medium text-white whitespace-nowrap">{format(eventDate, 'EEEE, MMMM d')}</span>
            {event.time && (
              <span className="text-xs text-gray-200 mt-0.5 whitespace-nowrap">{formatTime(event.time)}</span>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
      </div>
      
      {/* Add Event button at bottom right */}
      <div className="absolute bottom-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/add-event', { state: { date: format(currentDate, 'yyyy-MM-dd') } });
          }}
          className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium hover:bg-white/60 transition-colors duration-150"
        >
          + Add Event
        </button>
      </div>
    </div>
  );
};

export default function DailyView() {
  const [input, setInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const dayNavRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const [mainContentDrawerOffset, setMainContentDrawerOffset] = useState(44);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);
  const [scrollRefReady, setScrollRefReady] = useState(false);
  const internalChatContentScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesContentRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const autoscrollFlagRef = useRef(false);
  const previousMessagesLengthRef = useRef(0);
  const firstEffectRunAfterLoadRef = useRef(true);
  const {
    messages,
    threadId,
    addMessage,
    removeMessageById,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
    events,
    keepers,
    children,
    addEvent,
    addKeeper,
    removeEvent,
    removeKeeper,
  } = useKicacoStore();
  
  // Initialize currentDate from navigation state if available
  const navigationDate = location.state?.date;
  const initialDate = navigationDate 
    ? (typeof navigationDate === 'string' 
        ? parse(navigationDate, 'yyyy-MM-dd', new Date()) 
        : navigationDate)
    : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [displayedEventIndex, setDisplayedEventIndex] = useState(0);
  const [displayedKeeperIndex, setDisplayedKeeperIndex] = useState(0);
  const [filteredChildren, setFilteredChildren] = useState<string[]>([]);
  const [isDatePickerActive, setIsDatePickerActive] = useState(false);

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [clearFooterActiveButton, setClearFooterActiveButton] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ 
    isOpen: boolean; 
    type: 'event' | 'keeper' | null;
    index: number | null; 
    name: string;
  }>({
    isOpen: false,
    type: null,
    index: null,
    name: ''
  });

  // Filter functions
  const handleToggleChildFilter = useCallback((childName: string) => {
    setFilteredChildren(prev =>
      prev.includes(childName)
        ? prev.filter(name => name !== childName)
        : [...prev, childName]
    );
  }, []);

  const handleClearFilter = useCallback(() => {
    setFilteredChildren([]);
    setIsDatePickerActive(false);
  }, []);

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
  
  // Get location state to check if we need to focus on a specific item
  const locationState = location.state as { 
    date?: Date | string, 
    targetEvent?: any,
    targetKeeper?: any
  } | null;
  
  // State to track which items to highlight
  const [highlightedEvent, setHighlightedEvent] = useState<any | null>(null);
  const [highlightedKeeper, setHighlightedKeeper] = useState<any | null>(null);
  
  // Effect to handle focusing on specific items from search results
  useEffect(() => {
    const targetDate = locationState?.date;

    // 1. Exit if there's no navigation state to process
    if (!targetDate || (!locationState.targetEvent && !locationState.targetKeeper)) {
      return;
    }

    // Parse the target date if it's a string
    const parsedTargetDate = typeof targetDate === 'string' 
      ? parse(targetDate, 'yyyy-MM-dd', new Date()) 
      : targetDate;

    // 2. If the view is not on the correct date yet, set it and wait for re-render.
    // This ensures we are working with the right day's events.
    if (!isSameDay(currentDate, parsedTargetDate)) {
      setCurrentDate(parsedTargetDate);
      return;
    }

    // 3. The view is on the correct date, so we can now find the item.
    let itemHandled = false;

    if (locationState.targetEvent) {
      itemHandled = true;
      setHighlightedEvent(locationState.targetEvent);

      // Use the same eventsForDay that the component uses for rendering
      const currentEventsForDay = filteredEvents.filter(event => {
        if (!event.date) return false;
        try {
          const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
          return isSameDay(eventDate, parsedTargetDate);
        } catch (e) {
          console.error("Error parsing event date:", event.date, e);
          return false;
        }
      }).sort((a, b) => parseTimeForSorting(a.time) - parseTimeForSorting(b.time));
      
      const targetIndex = currentEventsForDay.findIndex(e => 
        e.eventName === locationState.targetEvent.eventName && 
        e.date === locationState.targetEvent.date && 
        e.childName === locationState.targetEvent.childName &&
        e.time === locationState.targetEvent.time &&
        e.location === locationState.targetEvent.location
      );
      
      if (targetIndex !== -1) {
        setDisplayedEventIndex(targetIndex);
      }
      
      setTimeout(() => setHighlightedEvent(null), 2000);
    }
    
    if (locationState.targetKeeper) {
      itemHandled = true;
      setHighlightedKeeper(locationState.targetKeeper);
      
      // Use the same keepersForDay that the component uses for rendering
      const currentKeepersForDay = filteredKeepers.filter(keeper => {
        if (!keeper.date) return false;
        try {
          const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
          return isSameDay(keeperDate, parsedTargetDate);
        } catch (e) {
          console.error("Error parsing keeper date:", keeper.date, e);
          return false;
        }
      });
      
      const targetIndex = currentKeepersForDay.findIndex(k => 
        k.keeperName === locationState.targetKeeper.keeperName && 
        k.date === locationState.targetKeeper.date && 
        k.childName === locationState.targetKeeper.childName
      );
      
      if (targetIndex !== -1) {
        setDisplayedKeeperIndex(targetIndex);
      }
      
      setTimeout(() => {
        const keeperSection = document.getElementById('keepers-section');
        if (keeperSection) {
          const headerHeight = 64, subheaderHeight = 58, dayNavHeight = 40, buffer = 20;
          const keeperRect = keeperSection.getBoundingClientRect();
          const scrollTop = window.scrollY + keeperRect.top - headerHeight - subheaderHeight - dayNavHeight - buffer;
          window.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      }, 500);
      
      setTimeout(() => setHighlightedKeeper(null), 2000);
    }

    // 4. Once handled, clear the location state to prevent this logic from re-running.
    if (itemHandled) {
      navigate('.', { replace: true, state: {} });
    }
  }, [locationState, currentDate, filteredEvents, filteredKeepers, navigate]);
  
  // Add CSS for search highlights
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .search-highlight {
        animation: search-highlight-pulse 2s ease-in-out;
        position: relative;
      }
      
      .search-highlight::after {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 16px;
        border: 2px solid rgba(33, 126, 143, 0.7);
        animation: search-highlight-pulse 2s ease-in-out;
        pointer-events: none;
        z-index: 10;
      }
      
      @keyframes search-highlight-pulse {
        0%, 100% {
          box-shadow: 0 0 8px 2px rgba(33, 126, 143, 0.2);
          opacity: 0.6;
        }
        50% {
          box-shadow: 0 0 12px 4px rgba(33, 126, 143, 0.3);
          opacity: 0.8;
        }
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const goToPreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
    setDisplayedEventIndex(0);
    setDisplayedKeeperIndex(0);
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
    setDisplayedEventIndex(0);
    setDisplayedKeeperIndex(0);
  };

  // Helper function to parse time for sorting (same as WeeklyCalendar)
  const parseTimeForSorting = (timeStr?: string): number => {
    if (!timeStr) return 2400; // Events without a time go last

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
  };

  // Get events for the current day
  const eventsForDay = useMemo(() => {
    return filteredEvents.filter(event => {
      if (!event.date) return false;
      try {
        const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
        return isSameDay(eventDate, currentDate);
      } catch (e) {
        console.error("Error parsing event date:", event.date, e);
        return false;
      }
    }).sort((a, b) => parseTimeForSorting(a.time) - parseTimeForSorting(b.time));
  }, [filteredEvents, currentDate]);

  // Get keepers for the current day
  const keepersForDay = useMemo(() => {
    return filteredKeepers.filter(keeper => {
      if (!keeper.date) return false;
      try {
        const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
        return isSameDay(keeperDate, currentDate);
      } catch (e) {
        console.error("Error parsing keeper date:", keeper.date, e);
        return false;
      }
    });
  }, [filteredKeepers, currentDate]);

  // Touch handling for keeper carousel
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchIntentionRef = useRef<'unknown' | 'vertical' | 'horizontal' | 'swipe'>('unknown');
  
  // Helper function to reset touch state
  const resetKeeperTouchState = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
    touchIntentionRef.current = 'unknown';
  }, []);

  // Handle keeper swipe navigation
  const handleKeeperSwipe = (direction: number) => {
    if (keepersForDay.length <= 1) return;
    
    if (direction > 0) {
      // Swipe left - next keeper
      setDisplayedKeeperIndex(prev => (prev + 1) % keepersForDay.length);
    } else {
      // Swipe right - previous keeper
      setDisplayedKeeperIndex(prev => (prev - 1 + keepersForDay.length) % keepersForDay.length);
    }
  };

  const handleKeeperTouchStart = (e: React.TouchEvent) => {
    resetKeeperTouchState();
    if (keepersForDay.length <= 1) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchIntentionRef.current = 'unknown';
    e.stopPropagation();
  };

  const handleKeeperTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || keepersForDay.length <= 1) {
      resetKeeperTouchState();
      return;
    }

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(touchStartX.current - currentX);
    const diffY = Math.abs(touchStartY.current - currentY);
    
    if (touchIntentionRef.current === 'unknown') {
      const minMovement = 15;
      
      if (diffX > minMovement || diffY > minMovement) {
        const horizontalDisplacement = Math.abs(touchStartX.current - currentX);
        const verticalDisplacement = Math.abs(touchStartY.current - currentY);
        
        const minVerticalForScroll = 25;
        const maxHorizontalDriftForScroll = 10;
        const strongVerticalRatio = verticalDisplacement > horizontalDisplacement * 3;
        
        if (strongVerticalRatio && verticalDisplacement > minVerticalForScroll && horizontalDisplacement < maxHorizontalDriftForScroll) {
          touchIntentionRef.current = 'vertical';
        } else if (horizontalDisplacement > verticalDisplacement * 1.5 && horizontalDisplacement > 20) {
          touchIntentionRef.current = 'horizontal';
        } else if (horizontalDisplacement > 30) {
          touchIntentionRef.current = 'swipe';
        }
      }
    }
    
    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      e.preventDefault();
      e.stopPropagation();
    } else if (touchIntentionRef.current === 'vertical') {
      e.stopPropagation();
    } else {
      e.stopPropagation();
    }
  };

  const handleKeeperTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || keepersForDay.length <= 1) {
      resetKeeperTouchState();
      return;
    }

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      resetKeeperTouchState();
      return;
    }
    
    e.stopPropagation();
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;
    const threshold = 50;

    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      e.preventDefault();
      
      const horizontalDisplacement = Math.abs(diffX);
      
      if (horizontalDisplacement > threshold) {
        if (diffX > 0) {
          handleKeeperSwipe(1);
        } else {
          handleKeeperSwipe(-1);
        }
      }
    }
    
    resetKeeperTouchState();
  };

  const handleKeeperTouchCancel = (e: React.TouchEvent) => {
    e.stopPropagation();
    resetKeeperTouchState();
  };

  // Touch handling for day navigation (page-level swipes)
  const pageTouchStartX = useRef<number | null>(null);
  const pageTouchStartY = useRef<number | null>(null);
  const pageTouchIntentionRef = useRef<'unknown' | 'vertical' | 'horizontal' | 'swipe'>('unknown');
  
  // Helper function to reset page touch state
  const resetPageTouchState = useCallback(() => {
    pageTouchStartX.current = null;
    pageTouchStartY.current = null;
    pageTouchIntentionRef.current = 'unknown';
  }, []);

  // Handle page-level swipe navigation for days
  const handlePageSwipe = (direction: number) => {
    if (direction > 0) {
      // Swipe left - next day
      goToNextDay();
    } else {
      // Swipe right - previous day
      goToPreviousDay();
    }
  };

  const handlePageTouchStart = (e: React.TouchEvent) => {
    resetPageTouchState();
    
    // Check if touch is inside a card alley area - if so, don't handle
    const target = e.target as HTMLElement;
    const cardAlley = target.closest('[data-card-alley]');
    if (cardAlley) {
      return; // Let the card handle this touch
    }
    
    // Check if touch is on any interactive element
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('a')) {
      return;
    }
    
    pageTouchStartX.current = e.touches[0].clientX;
    pageTouchStartY.current = e.touches[0].clientY;
    pageTouchIntentionRef.current = 'unknown';
  };

  const handlePageTouchMove = (e: React.TouchEvent) => {
    if (pageTouchStartX.current === null || pageTouchStartY.current === null) {
      resetPageTouchState();
      return;
    }

    // Check if touch is inside a card alley area - if so, don't handle
    const target = e.target as HTMLElement;
    const cardAlley = target.closest('[data-card-alley]');
    if (cardAlley) {
      resetPageTouchState();
      return;
    }
    
    // Check if touch is on any interactive element
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('a')) {
      resetPageTouchState();
      return;
    }
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(pageTouchStartX.current - currentX);
    const diffY = Math.abs(pageTouchStartY.current - currentY);
    
    if (pageTouchIntentionRef.current === 'unknown') {
      const minMovement = 20; // Slightly higher threshold for page-level swipes
      
      if (diffX > minMovement || diffY > minMovement) {
        const horizontalDisplacement = Math.abs(pageTouchStartX.current - currentX);
        const verticalDisplacement = Math.abs(pageTouchStartY.current - currentY);
        
        const minVerticalForScroll = 30; // Higher threshold for vertical scrolling
        const maxHorizontalDriftForScroll = 15;
        const strongVerticalRatio = verticalDisplacement > horizontalDisplacement * 2.5;
        
        if (strongVerticalRatio && verticalDisplacement > minVerticalForScroll && horizontalDisplacement < maxHorizontalDriftForScroll) {
          pageTouchIntentionRef.current = 'vertical';
        } else if (horizontalDisplacement > verticalDisplacement * 1.5 && horizontalDisplacement > 25) {
          pageTouchIntentionRef.current = 'horizontal';
        } else if (horizontalDisplacement > 40) {
          pageTouchIntentionRef.current = 'swipe';
        }
      }
    }
    
    // Only prevent default for clear horizontal swipes, allow vertical scrolling
    if (pageTouchIntentionRef.current === 'horizontal' || pageTouchIntentionRef.current === 'swipe') {
      e.preventDefault();
    }
  };

  const handlePageTouchEnd = (e: React.TouchEvent) => {
    if (pageTouchStartX.current === null || pageTouchStartY.current === null) {
      resetPageTouchState();
      return;
    }

    // Check if touch ended inside a card alley area - if so, don't handle
    const target = e.target as HTMLElement;
    const cardAlley = target.closest('[data-card-alley]');
    if (cardAlley) {
      resetPageTouchState();
      return;
    }
    
    // Check if touch ended on any interactive element
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('a')) {
      resetPageTouchState();
      return;
    }
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = pageTouchStartX.current - touchEndX;
    const threshold = 60; // Higher threshold for day navigation

    if (pageTouchIntentionRef.current === 'horizontal' || pageTouchIntentionRef.current === 'swipe') {
      e.preventDefault();
      
      const horizontalDisplacement = Math.abs(diffX);
      
      if (horizontalDisplacement > threshold) {
        if (diffX > 0) {
          handlePageSwipe(1);
        } else {
          handlePageSwipe(-1);
        }
      }
    }
    
    resetPageTouchState();
  };

  const handlePageTouchCancel = () => {
    resetPageTouchState();
  };

  const handleGlobalDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
    
    setMainContentDrawerOffset(height);
  };

  useLayoutEffect(() => {
    function updatePositions() {
      // Position tracking simplified
    }

    const calculateMaxDrawerHeight = () => {
      const subheaderElement = subheaderRef.current;
      const footerElement = footerRef.current;
      if (subheaderElement && footerElement) {
        const subheaderRect = subheaderElement.getBoundingClientRect();
        const footerHeight = footerElement.getBoundingClientRect().height;
        const availableHeight = window.innerHeight - subheaderRect.bottom - footerHeight - 4;
        setMaxDrawerHeight(Math.max(44, availableHeight));
      } else {
        setMaxDrawerHeight(window.innerHeight * 0.6);
      }
    };

    updatePositions();
    calculateMaxDrawerHeight();

    window.addEventListener('resize', updatePositions);
    window.addEventListener('resize', calculateMaxDrawerHeight);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('resize', calculateMaxDrawerHeight);
    };
  }, [subheaderRef.current, footerRef.current, dayNavRef.current]);

  useEffect(() => {
    // Always enable scrolling - simplified
  }, [mainContentDrawerOffset]);

  // Chat Scroll Management Logic
  const executeScrollToBottom = useCallback(() => {
    const sc = internalChatContentScrollRef.current;
    if (!sc || !scrollRefReady) return;
    requestAnimationFrame(() => {
      if (internalChatContentScrollRef.current) {
        const currentSc = internalChatContentScrollRef.current;
        const targetScrollTop = Math.max(0, currentSc.scrollHeight - currentSc.clientHeight);
        currentSc.scrollTop = targetScrollTop;
        if (autoscrollFlagRef.current) setChatScrollPosition(targetScrollTop);
        requestAnimationFrame(() => { // Second scroll for pending rendering
          if (internalChatContentScrollRef.current) {
            const currentSc2 = internalChatContentScrollRef.current;
            const targetScrollTop2 = Math.max(0, currentSc2.scrollHeight - currentSc2.clientHeight);
            if (Math.abs(currentSc2.scrollTop - targetScrollTop2) > 1) {
              currentSc2.scrollTop = targetScrollTop2;
              if (autoscrollFlagRef.current) setChatScrollPosition(targetScrollTop2);
            }
          }
        });
      }
    });
  }, [scrollRefReady, setChatScrollPosition, autoscrollFlagRef]);

  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
  }, []);

  useEffect(() => { // Main Scroll/Restore/Autoscroll Effect
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer) return;
    let isConsideredNewMessages = false;
    if (firstEffectRunAfterLoadRef.current) {
      if (chatScrollPosition !== null && Math.abs(scrollContainer.scrollTop - chatScrollPosition) > 1.5) {
        scrollContainer.scrollTop = chatScrollPosition;
      }
      firstEffectRunAfterLoadRef.current = false;
    } else {
      if (messages.length > previousMessagesLengthRef.current) isConsideredNewMessages = true;
    }
    if (isConsideredNewMessages) {
      autoscrollFlagRef.current = true;
      executeScrollToBottom();
    }
    previousMessagesLengthRef.current = messages.length;
    return () => { firstEffectRunAfterLoadRef.current = true; };
  }, [messages, chatScrollPosition, scrollRefReady, executeScrollToBottom]);

  useEffect(() => { // ResizeObserver Effect
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer || !window.ResizeObserver) return;
    const observer = new ResizeObserver(() => {
      if (autoscrollFlagRef.current && internalChatContentScrollRef.current) executeScrollToBottom();
    });
    observer.observe(scrollContainer);
    resizeObserverRef.current = observer;
    return () => { if (observer) observer.disconnect(); resizeObserverRef.current = null; };
  }, [scrollRefReady, executeScrollToBottom]);

  useEffect(() => { // MutationObserver Effect
    const contentElement = messagesContentRef.current;
    if (!scrollRefReady || !contentElement || !window.MutationObserver) return;
    const observer = new MutationObserver((mutationsList) => {
      if (autoscrollFlagRef.current && internalChatContentScrollRef.current && mutationsList.length > 0) executeScrollToBottom();
    });
    observer.observe(contentElement, { childList: true, subtree: true, characterData: true });
    mutationObserverRef.current = observer;
    return () => { if (observer) observer.disconnect(); mutationObserverRef.current = null; };
  }, [scrollRefReady, executeScrollToBottom]);

  useEffect(() => { // Manual Scroll useEffect
    const scrollElement = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollElement) return;
    let scrollTimeout: number;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        if (internalChatContentScrollRef.current) {
          const sc = internalChatContentScrollRef.current;
          setChatScrollPosition(sc.scrollTop);
          autoscrollFlagRef.current = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 5;
        }
      }, 150);
    };
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => { clearTimeout(scrollTimeout); scrollElement.removeEventListener('scroll', handleScroll); };
  }, [scrollRefReady, setChatScrollPosition]);

  // Full implementation for handleSendMessage
  const handleSendMessage = async () => {
    if (!input.trim()) return; // Use the existing input state for chat

    if (!threadId) {
      console.error("DailyView: Cannot send message, threadId is null.");
      addMessage({
        id: generateUUID(),
        sender: 'assistant',
        content: "Sorry, I'm not ready to chat right now. Please try again in a moment."
      });
      return;
    }

    const userMessageId = generateUUID();
    addMessage({
      id: userMessageId,
      sender: 'user',
      content: input, 
    });
    const messageToSend = input;
    setInput(""); // Clear input

    // Blur any active input to minimize keyboard on mobile
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.tagName === 'INPUT') {
      activeElement.blur();
    }

    autoscrollFlagRef.current = true;

    const thinkingMessageId = 'thinking-dailyview';
    addMessage({
      id: thinkingMessageId,
      sender: 'assistant',
      content: 'Kicaco is thinking'
    });

    try {
      const apiClient = getApiClientInstance();
      const messageResponse = await apiClient.sendMessage(threadId, messageToSend);
      
      // Handle any events/keepers that were created during message processing
      if (messageResponse.createdEvents && messageResponse.createdEvents.length > 0) {
        console.log('DailyView: Events created/updated during message:', messageResponse.createdEvents);
        messageResponse.createdEvents.forEach(event => {
          addEvent(event);
        });
      }
      
      if (messageResponse.createdKeepers && messageResponse.createdKeepers.length > 0) {
        console.log('DailyView: Keepers created/updated during message:', messageResponse.createdKeepers);
        messageResponse.createdKeepers.forEach(keeper => {
          addKeeper(keeper);
        });
      }
      
      removeMessageById(thinkingMessageId);
      addMessage({
        id: generateUUID(),
        sender: 'assistant',
        content: messageResponse.response,
      });
    } catch (error) {
      console.error("Error sending message from DailyView:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: generateUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  // Handle image upload
  const handleImageUpload = () => {
    setShowImageUpload(true);
  };

  const handleImageUploadComplete = (response: string, createdEvents?: any[], createdKeepers?: any[]) => {
    // Remove thinking message
    removeMessageById('image-upload-thinking');
    
    // Add created events to the store
    if (createdEvents && createdEvents.length > 0) {
      console.log('DailyView: Adding events from image upload:', createdEvents);
      createdEvents.forEach(event => {
        console.log('DailyView: Adding individual event:', event);
        addEvent(event);
      });
    }
    
    // Add created keepers to the store
    if (createdKeepers && createdKeepers.length > 0) {
      createdKeepers.forEach(keeper => {
        addKeeper(keeper);
      });
    }
    
    // Add the AI response as a message
    addMessage({
      id: generateUUID(),
      sender: 'assistant',
      content: response
    });
    
    // Close the upload interface
    setShowImageUpload(false);
    
    // Clear the active button state in the footer
    setClearFooterActiveButton(true);
    // Reset the clear flag after a short delay
    setTimeout(() => setClearFooterActiveButton(false), 100);
    
    // Blur any active input to minimize keyboard after upload
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.tagName === 'INPUT') {
      activeElement.blur();
    }
  };

  const handleImageUploadStart = () => {
    // Add a thinking message while processing
    const thinkingId = 'image-upload-thinking';
    addMessage({
      id: thinkingId,
      sender: 'assistant',
      content: 'Kicaco is analyzing your image'
    });
  };

  const isDateInPast = isBefore(startOfDay(currentDate), startOfDay(new Date()));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Daily View"
      />
      
      {/* Day Navigation - made sticky below subheader */}
      <div 
        ref={dayNavRef} 
        className="sticky z-[95] bg-gray-50 -mt-px"
        style={{ 
          top: 'calc(4rem + 52px)', // 64px header + 52px subheader (16+12+24)
        }}
        data-card-alley
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
                <button
                  onClick={goToPreviousDay}
                  className="p-1 rounded hover:bg-gray-100 transition-colors active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                
                {/* "Today" button - shows for future dates */}
                {!isToday(currentDate) && !isDateInPast && (
                  <button
                    onClick={() => {
                      setCurrentDate(new Date());
                      setDisplayedEventIndex(0);
                      setDisplayedKeeperIndex(0);
                    }}
                    className="mx-1 text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 hover:bg-[#c0e2e7]/30 px-2 py-0.5 rounded-full transition-colors active:scale-95 whitespace-nowrap"
                  >
                    ← Today
                  </button>
                )}

                <h2 className={`text-[15px] font-normal text-gray-700 ${isToday(currentDate) ? 'mx-3' : 'mx-1'} whitespace-nowrap overflow-visible`}>
                  {format(currentDate, 'EEEE, MMMM d, yyyy')}
                  {isToday(currentDate) && (
                    <span className="ml-2 text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </h2>

                {/* "Today" button - shows for past dates */}
                {!isToday(currentDate) && isDateInPast && (
                  <button
                    onClick={() => {
                      setCurrentDate(new Date());
                      setDisplayedEventIndex(0);
                      setDisplayedKeeperIndex(0);
                    }}
                    className="mx-1 text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 hover:bg-[#c0e2e7]/30 px-2 py-0.5 rounded-full transition-colors active:scale-95 whitespace-nowrap"
                  >
                    Today →
                  </button>
                )}
                
                {/* Spacer to balance the layout when Today button is on the left or not shown */}
                {(isToday(currentDate) || !isDateInPast) && (
                  <div className="w-[20px] flex-shrink-0"></div>
                )}

                <button
                  onClick={goToNextDay}
                  className="p-1 rounded hover:bg-gray-100 transition-colors active:scale-95"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* Right - Calendar Icon (positioned absolutely) */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button 
                  onClick={createDatePickerHandler(
                    'date',
                    () => format(currentDate, 'yyyy-MM-dd'),
                    (value) => {
                      const newDate = new Date(value + 'T12:00:00'); // Set to noon to avoid timezone issues
                      setCurrentDate(newDate);
                      setDisplayedEventIndex(0);
                      setDisplayedKeeperIndex(0);
                    },
                    isDatePickerActive,
                    setIsDatePickerActive
                  )}
                  className={`p-1 rounded-full active:scale-95 transition-all duration-150 ${isDatePickerActive ? 'bg-[#217e8f] text-white hover:bg-[#1a6e7e]' : 'bg-[#c0e2e7]/20 hover:bg-[#c0e2e7]/40'}`}
                  title="Pick date"
                  data-calendar-button
                >
                  <Calendar className={`w-4 h-4 ${isDatePickerActive ? 'text-white' : 'text-[#217e8f]'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        ref={pageScrollRef}
        className="daily-view-content-scroll bg-gray-50 flex-1 overflow-y-auto"
        style={{
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8}px`,
          WebkitOverflowScrolling: 'touch',
        }}
        onTouchStart={handlePageTouchStart}
        onTouchMove={handlePageTouchMove}
        onTouchEnd={handlePageTouchEnd}
        onTouchCancel={handlePageTouchCancel}
      >
        <div className="px-4 pt-4 pb-8 max-w-2xl mx-auto">
          {/* Events of the Day Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-gray-600 ml-1">
                Events of the Day
              </h2>
              {eventsForDay.length > 0 && (
                <div className="flex items-center gap-1">
                  {eventsForDay.map((event, index) => (
                    event.childName ? (
                      <StackedChildBadges 
                        key={`event-${index}`}
                        childName={event.childName} 
                        size="md" 
                        maxVisible={3}
                      />
                    ) : null
                  )).filter(Boolean)}
                </div>
              )}
            </div>
            {eventsForDay.length > 0 ? (
              <div className={`relative rounded-xl shadow-lg overflow-hidden ${
                highlightedEvent && eventsForDay[displayedEventIndex] && 
                highlightedEvent.eventName === eventsForDay[displayedEventIndex].eventName &&
                highlightedEvent.date === eventsForDay[displayedEventIndex].date &&
                highlightedEvent.childName === eventsForDay[displayedEventIndex].childName &&
                highlightedEvent.time === eventsForDay[displayedEventIndex].time &&
                highlightedEvent.location === eventsForDay[displayedEventIndex].location
                  ? 'search-highlight' 
                  : ''
              }`}>

                <DailyEventCard 
                  event={eventsForDay[displayedEventIndex]} 
                  currentDate={currentDate} 
                  navigate={navigate} 
                  allEvents={events}
                  events={eventsForDay}
                  displayedEventIndex={displayedEventIndex}
                  setDisplayedEventIndex={setDisplayedEventIndex}
                  removeEvent={removeEvent}
                  setDeleteConfirmation={setDeleteConfirmation}
                />
              </div>
            ) : (
              <div className="relative w-full h-[240px] rounded-xl overflow-hidden shadow-lg">
                <img
                  src={getKicacoEventPhoto('default')}
                  alt="No events"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/[.65]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white font-normal">No events scheduled for this day.</p>
                </div>
                {/* Add Event button at bottom right */}
                <div className="absolute bottom-2 right-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/add-event', { state: { date: format(currentDate, 'yyyy-MM-dd') } });
                    }}
                    className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium hover:bg-white/60 transition-colors duration-150"
                  >
                    + Add Event
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Keepers Due Section */}
          <section id="keepers-section">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-gray-600 ml-1">
                Keepers Due
              </h2>
              {keepersForDay.length > 0 && (
                <div className="flex items-center gap-1">
                  {keepersForDay.map((keeper, index) => (
                    keeper.childName ? (
                      <StackedChildBadges 
                        key={`keeper-${index}`}
                        childName={keeper.childName} 
                        size="md" 
                        maxVisible={3}
                      />
                    ) : null
                  )).filter(Boolean)}
                </div>
              )}
            </div>
            {keepersForDay.length > 0 ? (
              <div className={`relative rounded-xl shadow-lg overflow-hidden ${
                highlightedKeeper && keepersForDay[displayedKeeperIndex] && 
                highlightedKeeper.keeperName === keepersForDay[displayedKeeperIndex].keeperName &&
                highlightedKeeper.date === keepersForDay[displayedKeeperIndex].date &&
                highlightedKeeper.childName === keepersForDay[displayedKeeperIndex].childName
                  ? 'search-highlight' 
                  : ''
              }`}>
                                <div className="relative h-[240px]">
                  <KeeperCard
                    keeperName={keepersForDay[displayedKeeperIndex].keeperName}
                    date={keepersForDay[displayedKeeperIndex].date}
                    childName={keepersForDay[displayedKeeperIndex].childName}
                    description={keepersForDay[displayedKeeperIndex].description}
                    time={keepersForDay[displayedKeeperIndex].time}
                    index={0}
                    stackPosition={0}
                    totalInStack={1}
                    isActive={true}
                    showCarouselControls={keepersForDay.length > 1}
                    currentCarouselIndex={displayedKeeperIndex}
                    totalCarouselItems={keepersForDay.length}
                    onCarouselPrevious={() => setDisplayedKeeperIndex(prev => (prev - 1 + keepersForDay.length) % keepersForDay.length)}
                    onCarouselNext={() => setDisplayedKeeperIndex(prev => (prev + 1) % keepersForDay.length)}
                    onTouchStart={handleKeeperTouchStart}
                    onTouchMove={handleKeeperTouchMove}
                    onTouchEnd={handleKeeperTouchEnd}
                    onTouchCancel={handleKeeperTouchCancel}
                    showAddKeeperButton={true}
                    onAddKeeper={() => navigate('/add-keeper', { state: { date: format(currentDate, 'yyyy-MM-dd') } })}
                    onEdit={() => {
                      // Find the original index in the full keepers array
                      const keeper = keepersForDay[displayedKeeperIndex];
                      const originalKeeperIndex = keepers.findIndex(k => 
                        k.keeperName === keeper.keeperName && 
                        k.date === keeper.date &&
                        k.childName === keeper.childName
                      );
                      navigate('/add-keeper', {
                        state: {
                          isEdit: true,
                          keeper: keeper,
                          keeperIndex: originalKeeperIndex
                        }
                      });
                    }}
                    onDelete={() => {
                      const keeper = keepersForDay[displayedKeeperIndex];
                      const originalKeeperIndex = keepers.findIndex(k => 
                        k.keeperName === keeper.keeperName && 
                        k.date === keeper.date &&
                        k.childName === keeper.childName
                      );
                      if (originalKeeperIndex !== -1) {
                        setDeleteConfirmation({
                          isOpen: true,
                          type: 'keeper',
                          index: originalKeeperIndex,
                          name: keeper.keeperName
                        });
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="relative w-full h-[240px] rounded-xl overflow-hidden shadow-lg">
                <img
                  src={getKicacoEventPhoto('keeper')}
                  alt="No keepers"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/[.65]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white font-normal">No keepers due on this day.</p>
                </div>
                {/* Add Keeper button at bottom right */}
                <div className="absolute bottom-2 right-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/add-keeper', { state: { date: format(currentDate, 'yyyy-MM-dd') } });
                    }}
                    className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium hover:bg-white/60 transition-colors duration-150"
                  >
                    + Add Keeper
                  </button>
                </div>
              </div>
            )}
          </section>
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
            onCreateAccount={() => {
              // Handle account creation if needed
              console.log('Account creation requested from DailyView');
            }}
            onRemindLater={() => {
              // Handle remind later if needed
              console.log('Remind later requested from DailyView');
            }}
          />
        </div>
      </GlobalChatDrawer>
      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSendMessage}
        onUploadClick={handleImageUpload}
        clearActiveButton={clearFooterActiveButton}
      />
      
      {/* Image Upload Modal */}
      {showImageUpload && threadId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ImageUpload
              threadId={threadId}
              onUploadComplete={handleImageUploadComplete}
              onUploadStart={handleImageUploadStart}
              onClose={() => setShowImageUpload(false)}
              prompt="Please analyze this image and extract ALL event information. Create events/keepers immediately with any information you find. After creating them, you MUST ask follow-up questions for any missing required information (location, child name, time, etc.) one at a time. Treat this as the START of a conversation, not the end."
            />
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: null, index: null, name: '' })}
        onConfirm={() => {
          if (deleteConfirmation.index !== null) {
            if (deleteConfirmation.type === 'event') {
              removeEvent(deleteConfirmation.index);
            } else if (deleteConfirmation.type === 'keeper') {
              removeKeeper(deleteConfirmation.index);
            }
            setDeleteConfirmation({ isOpen: false, type: null, index: null, name: '' });
          }
        }}
        title={`Delete ${deleteConfirmation.type === 'event' ? 'Event' : 'Keeper'}`}
        message={`Are you sure you want to delete "${deleteConfirmation.name}"? This action cannot be undone.`}
      />
    </div>
  );
} 