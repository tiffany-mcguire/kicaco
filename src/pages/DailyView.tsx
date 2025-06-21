import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/common';
import { IconButton } from '../components/common';
import { ChatBubble, ChatMessageList } from '../components/chat';
import { HamburgerMenu } from '../components/navigation';
import { CalendarMenu } from '../components/calendar';
import { ThreeDotMenu } from '../components/navigation';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { GlobalHeader } from '../components/navigation';
import { GlobalFooter } from '../components/navigation';
import { GlobalSubheader } from '../components/navigation';
import { GlobalChatDrawer } from '../components/chat';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isSameDay, parse, isToday } from 'date-fns';
import { EventCard } from '../components/calendar';
import { KeeperCard } from '../components/calendar';
import { StackedChildBadges } from '../components/common';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';

import { generateUUID } from '../utils/uuid';
import { ImageUpload } from '../components/common';
// Rainbow colors for children (matching other pages)
const childColors = [
  '#f8b6c2', // Pink
  '#fbd3a2', // Orange
  '#fde68a', // Yellow
  '#bbf7d0', // Green
  '#c0e2e7', // Blue
  '#d1d5fa', // Indigo
  '#e9d5ff', // Purple
];

const DailyViewIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '18px', width: '18px', height: '18px', strokeWidth: '1.5' }} viewBox="0 0 90 90">
    <path d="M 71.46 29.223 H 2.001 c -1.104 0 -2 -0.895 -2 -2 v -9.194 c 0 -3.051 2.482 -5.533 5.533 -5.533 h 62.395 c 3.051 0 5.532 2.482 5.532 5.533 v 9.194 C 73.46 28.327 72.565 29.223 71.46 29.223 z M 4.001 25.223 h 65.46 v -7.194 c 0 -0.845 -0.687 -1.533 -1.532 -1.533 H 5.534 c -0.845 0 -1.533 0.687 -1.533 1.533 V 25.223 z"/>
    <path d="M 67.43 82.118 h -61.4 c -3.325 0 -6.03 -2.705 -6.03 -6.03 V 27.223 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 48.865 c 0 1.119 0.911 2.03 2.03 2.03 h 61.4 c 1.119 0 2.03 -0.911 2.03 -2.03 v -6.184 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 6.184 C 73.46 79.413 70.755 82.118 67.43 82.118 z"/>
    <path d="M 57.596 21.113 c -1.104 0 -2 -0.895 -2 -2 V 9.882 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 9.231 C 59.596 20.217 58.701 21.113 57.596 21.113 z"/>
    <path d="M 15.865 21.113 c -1.104 0 -2 -0.895 -2 -2 V 9.882 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 9.231 C 17.865 20.217 16.969 21.113 15.865 21.113 z"/>
    <path d="M 36.731 21.113 c -1.104 0 -2 -0.895 -2 -2 V 9.882 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 9.231 C 38.731 20.217 37.835 21.113 36.731 21.113 z"/>
    <path d="M 86.1 71.904 H 27.191 c -3.871 0 -7.65 -1.361 -10.641 -3.833 C 5.259 58.743 0.001 45.763 0.001 27.223 c 0 -1.104 0.895 -2 2 -2 h 69.46 c 1.104 0 2 0.895 2 2 c 0 17.266 4.804 29.272 15.118 37.782 c 1.284 1.059 1.75 2.755 1.187 4.32 C 89.203 70.892 87.765 71.904 86.1 71.904 z M 4.023 29.223 C 4.385 45.41 9.201 56.81 19.097 64.987 c 2.276 1.881 5.151 2.917 8.094 2.917 h 58.616 c -10.744 -8.978 -15.959 -21.313 -16.326 -38.681 H 4.023 z"/>
  </svg>
);

// Add Event Button
const AddEventButton = (props: { label?: string; date?: string }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const getButtonStyle = () => {
    let s = {
      width: '140px',
      height: '30px',
      padding: '0px 8px',
      border: 'none',
      boxSizing: 'border-box' as const,
      borderRadius: '6px',
      fontWeight: 500,
      fontSize: '14px',
      lineHeight: '20px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      background: '#217e8f',
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.2s ease',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        background: '#1a6e7e',
        boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)' };
    }
    s.outline = 'none';
    return s;
  };

  const handleClick = () => {
    setTimeout(() => navigate('/add-event', { state: { date: props.date } }), 150);
  };

  return (
    <button
      style={getButtonStyle()}
      tabIndex={0}
      type="button"
      onClick={handleClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseOver={() => setHovered(true)}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setPressed(false); }}
      className="transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(true); }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(false); }}
    >
      {props.label ?? 'Add Event'}
    </button>
  );
};

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
}> = ({ event, currentDate, navigate, allEvents, events, displayedEventIndex, setDisplayedEventIndex, removeEvent }) => {
  const children = useKicacoStore(state => state.children);
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
      removeEvent(globalEventIndex);
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
          <div className="flex items-center gap-1.5">
            <StackedChildBadges 
              childName={event.childName} 
              size="md" 
              maxVisible={3}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">{displayName}</span>
              {event.location && (
                <span className="text-xs text-gray-200 mt-0.5">{event.location}</span>
              )}
            </div>
            {/* Carousel controls - hugging the event content */}
            {events.length > 1 && (
              <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-2">
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
          <div className="flex flex-col justify-center items-end">
            <span className="text-sm font-medium text-white">{format(eventDate, 'EEEE, MMMM d')}</span>
            {event.time && (
              <span className="text-xs text-gray-200 mt-0.5">{formatTime(event.time)}</span>
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
  const [mainContentTopClearance, setMainContentTopClearance] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(120);
  const [dayNavBottom, setDayNavBottom] = useState(160);
  const [mainContentScrollOverflow, setMainContentScrollOverflow] = useState<'auto' | 'hidden'>('auto');
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
  const initialDate = navigationDate ? navigationDate : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [displayedEventIndex, setDisplayedEventIndex] = useState(0);
  const [displayedKeeperIndex, setDisplayedKeeperIndex] = useState(0);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [clearFooterActiveButton, setClearFooterActiveButton] = useState(false);
  
  // Get location state to check if we need to focus on a specific item
  const locationState = location.state as { 
    date?: Date, 
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

    // 2. If the view is not on the correct date yet, set it and wait for re-render.
    // This ensures we are working with the right day's events.
    if (!isSameDay(currentDate, targetDate)) {
      setCurrentDate(targetDate);
      return;
    }

    // 3. The view is on the correct date, so we can now find the item.
    let itemHandled = false;

    if (locationState.targetEvent) {
      itemHandled = true;
      setHighlightedEvent(locationState.targetEvent);

      // Use the same eventsForDay that the component uses for rendering
      const currentEventsForDay = events.filter(event => {
        if (!event.date) return false;
        try {
          const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
          return isSameDay(eventDate, targetDate);
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
      const currentKeepersForDay = keepers.filter(keeper => {
        if (!keeper.date) return false;
        try {
          const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
          return isSameDay(keeperDate, targetDate);
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
  }, [locationState, currentDate, events, keepers, navigate]);
  
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
    const dateString = format(currentDate, 'yyyy-MM-dd');
    return events.filter(event => {
      if (!event.date) return false;
      try {
        const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
        return isSameDay(eventDate, currentDate);
      } catch (e) {
        console.error("Error parsing event date:", event.date, e);
        return false;
      }
    }).sort((a, b) => parseTimeForSorting(a.time) - parseTimeForSorting(b.time));
  }, [events, currentDate]);

  // Get keepers for the current day
  const keepersForDay = useMemo(() => {
    const dateString = format(currentDate, 'yyyy-MM-dd');
    return keepers.filter(keeper => {
      if (!keeper.date) return false;
      try {
        const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
        return isSameDay(keeperDate, currentDate);
      } catch (e) {
        console.error("Error parsing keeper date:", keeper.date, e);
        return false;
      }
    });
  }, [keepers, currentDate]);

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

  const handlePageTouchCancel = (e: React.TouchEvent) => {
    resetPageTouchState();
  };



  const handleGlobalDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
    
    setMainContentDrawerOffset(height);
    setMainContentTopClearance(window.innerHeight - height);
  };

  useLayoutEffect(() => {
    function updatePositions() {
      if (subheaderRef.current) {
        setSubheaderBottom(subheaderRef.current.getBoundingClientRect().bottom);
      }
      if (dayNavRef.current) {
        const navBottom = dayNavRef.current.getBoundingClientRect().bottom;
        setDayNavBottom(navBottom);
      }
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
    // Always enable scrolling
    setMainContentScrollOverflow('auto');
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
      const assistantResponseText = await sendMessageToAssistant(threadId, messageToSend);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: generateUUID(),
        sender: 'assistant',
        content: assistantResponseText,
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Daily View"
      />
      {/* Day Navigation - made sticky below subheader */}
      <div ref={dayNavRef} className="sticky z-[95] flex items-center justify-center py-2 bg-gray-50 max-w-2xl mx-auto w-full"
        style={{ 
          top: 'calc(4rem + 58px)' // 64px header + ~58px subheader
        }}
        data-card-alley
      >
        <button
          onClick={goToPreviousDay}
          className="p-1 rounded hover:bg-gray-100 transition-colors active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        {!isToday(currentDate) && (
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setDisplayedEventIndex(0);
              setDisplayedKeeperIndex(0);
            }}
            className="ml-1 text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 hover:bg-[#c0e2e7]/30 px-2 py-0.5 rounded-full transition-colors active:scale-95"
          >
            ← Today
          </button>
        )}
        <h2 className={`text-base font-normal text-gray-700 ${isToday(currentDate) ? 'mx-3' : 'mx-2'}`}>
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
          {isToday(currentDate) && (
            <span className="ml-2 text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </h2>
        {!isToday(currentDate) && (
          <div className="w-[20px]"></div>
        )}
        <button
          onClick={goToNextDay}
          className="p-1 rounded hover:bg-gray-100 transition-colors active:scale-95"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
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
                        removeKeeper(originalKeeperIndex);
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
            latestChildName={children[0]?.name || 'your child'}
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
    </div>
  );
} 