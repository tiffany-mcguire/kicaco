import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalSubheader from '../components/GlobalSubheader';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, isToday, parse } from 'date-fns';
import { parse as parseDate, format as formatDateFns } from 'date-fns';
import EventCard from '../components/EventCard';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';

const WeeklyIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 448 512">
    <path d="M160 32V64H288V32C288 14.33 302.3 0 320 0C337.7 0 352 14.33 352 32V64H400C426.5 64 448 85.49 448 112V160H0V112C0 85.49 21.49 64 48 64H96V32C96 14.33 110.3 0 128 0C145.7 0 160 14.33 160 32zM0 192H448V464C448 490.5 426.5 512 400 512H48C21.49 512 0 490.5 0 464V192zM80 256C71.16 256 64 263.2 64 272V336C64 344.8 71.16 352 80 352H368C376.8 352 384 344.8 384 336V272C384 263.2 376.8 256 368 256H80z" />
  </svg>
);

const AddByDayButton = (props: { label?: string; onClick?: () => void; }) => {
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
      fontWeight: 400,
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

  return (
    <button
      style={getButtonStyle()}
      tabIndex={0}
      type="button"
      onClick={props.onClick}
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



// Day accent colors - rainbow palette for side borders only
const dayAccentColors: { [key: number]: string } = {
  0: '#f8b6c2', // Sunday - pink
  1: '#ffd8b5', // Monday - orange
  2: '#fde68a', // Tuesday - yellow
  3: '#bbf7d0', // Wednesday - green
  4: '#c0e2e7', // Thursday - blue
  5: '#d1d5fa', // Friday - indigo
  6: '#e9d5ff', // Saturday - purple
};

// Rainbow colors for children (same as EventCard)
const childColors = [
  '#f8b6c2', // Pink
  '#fbd3a2', // Orange
  '#fde68a', // Yellow
  '#bbf7d0', // Green
  '#c0e2e7', // Blue
  '#d1d5fa', // Indigo
  '#e9d5ff', // Purple
];

// Day colors for accent line (same as EventCard and UpcomingEvents)
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

export default function WeeklyCalendar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [input, setInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const weekNavRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);

  const [mainContentDrawerOffset, setMainContentDrawerOffset] = useState(44);
  const [mainContentTopClearance, setMainContentTopClearance] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(120); // Better initial estimate
  const [weekNavBottom, setWeekNavBottom] = useState(160); // Better initial estimate
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
    children,
    keepers,
  } = useKicacoStore();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  // NEW: Track which day tab is active (popped out)
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Start on Sunday

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  // Generate the 7 days of the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dayName: format(date, 'EEEE'),
      dayNumber: format(date, 'd'),
      monthName: format(date, 'MMMM'),
      fullDate: format(date, 'yyyy-MM-dd'),
      isToday: isToday(date),
    };
  });

  const [eventCarouselIdx, setEventCarouselIdx] = useState<{ [date: string]: number }>({});

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
  };

  // Get events for a specific day, now with sorting and robust parsing
  const getEventsForDay = (dateString: string) => {
    return events
      .filter(event => {
        if (!event.date) return false;
        try {
          const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
          const dayDate = parse(dateString, 'yyyy-MM-dd', new Date());
          return isSameDay(eventDate, dayDate);
        } catch (e) {
          console.error("Error parsing date for weekly calendar:", event.date, e);
          return false;
        }
      })
      .sort((a, b) => parseTimeForSorting(a.time) - parseTimeForSorting(b.time));
  };

  // Get keepers for a specific day
  const getKeepersForDay = (dateString: string) => {
    return keepers
      .filter(keeper => {
        if (!keeper.date) return false;
        try {
          const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
          const dayDate = parse(dateString, 'yyyy-MM-dd', new Date());
          return isSameDay(keeperDate, dayDate);
        } catch (e) {
          console.error("Error parsing date for weekly calendar keeper:", keeper.date, e);
          return false;
        }
      });
  };

  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const handleGlobalDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
    
    setMainContentDrawerOffset(height);
    setMainContentTopClearance(window.innerHeight - height);
  };

  // Initialize scroll overflow based on initial drawer height
  useEffect(() => {
    // Set initial drawer offset and scroll overflow
    setMainContentDrawerOffset(currentDrawerHeight);
    setMainContentTopClearance(window.innerHeight - currentDrawerHeight);
    // Always enable scrolling
    setMainContentScrollOverflow('auto');
  }, []); // Run only on mount

  useLayoutEffect(() => {
    function updatePositions() {
      if (subheaderRef.current) {
        setSubheaderBottom(subheaderRef.current.getBoundingClientRect().bottom);
      }
      if (weekNavRef.current) {
        const navBottom = weekNavRef.current.getBoundingClientRect().bottom;
        setWeekNavBottom(navBottom);
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
    
    // Mark as positioned after initial calculation
    requestAnimationFrame(() => {
      setIsPositioned(true);
    });

    window.addEventListener('resize', updatePositions);
    window.addEventListener('resize', calculateMaxDrawerHeight);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('resize', calculateMaxDrawerHeight);
    };
  }, [subheaderRef.current, footerRef.current, weekNavRef.current]);

  useEffect(() => {
    // Always enable scrolling - let the browser handle whether it's needed
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
      console.error("WeeklyCalendar: Cannot send message, threadId is null.");
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: "Sorry, I'm not ready to chat right now. Please try again in a moment."
      });
      return;
    }

    const userMessageId = crypto.randomUUID();
    addMessage({
      id: userMessageId,
      sender: 'user',
      content: input, 
    });
    const messageToSend = input;
    setInput(""); // Clear input

    autoscrollFlagRef.current = true;

    const thinkingMessageId = 'thinking-weeklycalendar';
    addMessage({
      id: thinkingMessageId,
      sender: 'assistant',
      content: 'Kicaco is thinking'
    });

    try {
      const assistantResponseText = await sendMessageToAssistant(threadId, messageToSend);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: assistantResponseText,
      });
    } catch (error) {
      console.error("Error sending message from WeeklyCalendar:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  // Helper to get child profile by name
  const getChildProfile = (childName?: string) => children.find(c => c.name === childName);

  // Helper to format time as HH:MM AM/PM similar to homepage
  const formatTime12 = (time?: string) => {
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
  };

  // Mini carousel for a day's events (fixed h-32)
  const MiniEventCarousel: React.FC<{ dayEvents: typeof events; accentColor: string; fullDate: string }> = ({ dayEvents, accentColor: accentColorSoft, fullDate }) => {
    const [currentIdx, setCurrentIdx] = useState(0);

    if (dayEvents.length === 0) {
      return (
        <div className="relative h-32 rounded-lg overflow-hidden shadow-sm">
          <img
            src={getKicacoEventPhoto('default')}
            alt="No events"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-sm">No events scheduled</p>
          </div>
          
          {/* Add Event button in bottom right */}
          <div className="absolute bottom-2 right-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/add-event', { state: { date: fullDate } });
              }}
              className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium transition-all hover:bg-white/60"
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
    
    // Get child info for the event
    const childProfile = evt.childName ? children.find(c => c.name === evt.childName) : null;
    const childIndex = evt.childName ? children.findIndex(c => c.name === evt.childName) : -1;
    const childColor = childProfile?.color || (childIndex >= 0 ? childColors[childIndex % childColors.length] : null);
    
    // Find the global index of this event in the events array
    const globalEventIndex = events.findIndex(e => 
      e.eventName === evt.eventName && 
      e.date === evt.date && 
      e.childName === evt.childName &&
      e.time === evt.time
    );

    // Transform birthday party names to possessive form (same logic as EventCard)
    const displayName = (() => {
      const name = evt.eventName;
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
        if (evt.childName && (name.toLowerCase() === 'birthday party' || name.toLowerCase() === 'birthday')) {
          const possessiveName = evt.childName.endsWith('s') ? `${evt.childName}'` : `${evt.childName}'s`;
          return `${possessiveName} Birthday Party`;
        }
      }
      return name;
    })();

    return (
      <div className="relative h-32 rounded-lg overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
        <img
          src={getKicacoEventPhoto(evt.eventName)}
          alt={evt.eventName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Single dark overlay */}
        <div className="absolute inset-0 bg-black/65" />
        
        {/* Tab overlay at top (matching EventDayStackCard style but smaller) */}
        <div className="absolute top-2 left-0 right-0 z-10 h-[40px]">
          <div className="flex h-full items-center justify-between px-3">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1">
                {evt.childName && childColor && (
                  <div
                    className="w-3 h-3 rounded-full flex items-center justify-center text-gray-700 text-[8px] font-semibold ring-1 ring-gray-400 flex-shrink-0"
                    style={{ backgroundColor: childColor }}
                  >
                    {evt.childName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-white leading-tight">{displayName}</span>
                {/* Carousel controls next to event name */}
                {dayEvents.length > 1 && (
                  <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-[5px]">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentIdx((currentIdx - 1 + dayEvents.length) % dayEvents.length); }} className="text-gray-800 hover:text-gray-900 p-0">
                      <ChevronLeft size={12} />
                    </button>
                    <span className="text-gray-800 text-[10px] font-medium">
                      {currentIdx + 1}/{dayEvents.length}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentIdx((currentIdx + 1) % dayEvents.length); }} className="text-gray-800 hover:text-gray-900 p-0">
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
              {evt.location && (
                <span className="text-[10px] text-gray-200 mb-1" style={{ marginLeft: evt.childName && childColor ? '16px' : '0' }}>{evt.location}</span>
              )}
            </div>
            <div className="flex flex-col justify-center items-end">
              {evt.time && (
                <span className="text-[10px] text-gray-200">{formatTime12(evt.time)}</span>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
        </div>
        
        {/* Notes section below tab */}
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

        {/* Edit button in bottom left */}
        <div className="absolute bottom-2 left-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/add-event', { 
                state: { 
                  event: evt,
                  eventIndex: globalEventIndex,
                  isEdit: true 
                } 
              });
            }}
            className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-300 hover:text-white font-medium transition-all hover:bg-black/40"
          >
            Edit
          </button>
        </div>

        {/* Add Event button in bottom right */}
        <div className="absolute bottom-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/add-event', { state: { date: evt.date } });
            }}
            className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium transition-all hover:bg-white/60"
          >
            + Add Event
          </button>
        </div>
      </div>
    );
  };

  // Mini keeper card for a day (fixed h-32, always shows)
  const MiniKeeperCard: React.FC<{ dayKeepers: typeof keepers; dayOfWeek: number; fullDate: string }> = ({ dayKeepers, dayOfWeek, fullDate }) => {
    const [currentIdx, setCurrentIdx] = useState(0);

    if (dayKeepers.length === 0) {
      return (
        <div className="relative h-32 rounded-lg overflow-hidden shadow-sm">
          <img
            src={getKicacoEventPhoto('keeper')}
            alt="No keepers"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-sm">No keepers due</p>
          </div>
          
          {/* Add Keeper button in bottom right */}
          <div className="absolute bottom-2 right-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/add-keeper', { state: { date: fullDate } });
              }}
              className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium transition-all hover:bg-white/60"
            >
              + Add Keeper
            </button>
          </div>
        </div>
      );
    }

    const keeper = dayKeepers[currentIdx];
    
    // Get child info for the keeper
    const childProfile = keeper.childName ? children.find(c => c.name === keeper.childName) : null;
    const childIndex = keeper.childName ? children.findIndex(c => c.name === keeper.childName) : -1;
    const childColor = childProfile?.color || (childIndex >= 0 ? childColors[childIndex % childColors.length] : null);
    
    // Find the global index of this keeper in the keepers array
    const globalKeeperIndex = keepers.findIndex(k => 
      k.keeperName === keeper.keeperName && 
      k.date === keeper.date && 
      k.childName === keeper.childName
    );

    return (
      <div className="relative h-32 rounded-lg overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
        <img
          src={getKicacoEventPhoto(keeper.keeperName || 'keeper')}
          alt={keeper.keeperName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Single dark overlay */}
        <div className="absolute inset-0 bg-black/65" />
        
        {/* Tab overlay at top */}
        <div className="absolute top-2 left-0 right-0 z-10 h-[40px]">
          <div className="flex h-full items-center justify-between px-3">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1">
                {keeper.childName && childColor && (
                  <div
                    className="w-3 h-3 rounded-full flex items-center justify-center text-gray-700 text-[8px] font-semibold ring-1 ring-gray-400 flex-shrink-0"
                    style={{ backgroundColor: childColor }}
                  >
                    {keeper.childName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-white leading-tight">{keeper.keeperName}</span>
                {/* Carousel controls next to keeper name */}
                {dayKeepers.length > 1 && (
                  <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-[5px]">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentIdx((currentIdx - 1 + dayKeepers.length) % dayKeepers.length); }} className="text-gray-800 hover:text-gray-900 p-0">
                      <ChevronLeft size={12} />
                    </button>
                    <span className="text-gray-800 text-[10px] font-medium">
                      {currentIdx + 1}/{dayKeepers.length}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentIdx((currentIdx + 1) % dayKeepers.length); }} className="text-gray-800 hover:text-gray-900 p-0">
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center items-end">
              {keeper.time && (
                <span className="text-[10px] text-gray-200">{formatTime12(keeper.time)}</span>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
        </div>
        
        {/* Notes section below tab */}
        <div className="absolute inset-x-0 top-[56px] px-3 text-white">
          <div className="flex justify-between items-center mb-0.5">
            <h4 className="text-[10px] font-bold text-gray-300">Notes</h4>
          </div>
          {keeper.description ? (
            <p className="text-[10px] text-gray-200 line-clamp-2 leading-tight">
              {keeper.description}
            </p>
          ) : (
            <p className="text-[10px] italic text-gray-400">—</p>
          )}
        </div>

        {/* Edit button in bottom left */}
        <div className="absolute bottom-2 left-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/add-keeper', { 
                state: { 
                  keeper: keeper,
                  keeperIndex: globalKeeperIndex,
                  isEdit: true 
                } 
              });
            }}
            className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-300 hover:text-white font-medium transition-all hover:bg-black/40"
          >
            Edit
          </button>
        </div>

        {/* Add Keeper button in bottom right */}
        <div className="absolute bottom-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/add-keeper', { state: { date: keeper.date } });
            }}
            className="bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-gray-800 hover:text-gray-900 font-medium transition-all hover:bg-white/60"
          >
            + Add Keeper
          </button>
        </div>
      </div>
    );
  };

  const handleAddEventClick = (date: string | null) => {
    setTimeout(() => {
      navigate('/add-event', { state: { date } });
    }, 150);
  };

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Weekly Calendar"
        action={<AddByDayButton onClick={() => handleAddEventClick(null)} />}
      />
      {/* Week Navigation - moved out to be static */}
      <div ref={weekNavRef} className="flex items-center justify-center py-2 bg-gray-50 max-w-2xl mx-auto w-full">
        <button
          onClick={goToPreviousWeek}
          className="p-1 rounded hover:bg-gray-100 transition-colors active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h2 className="text-base font-normal text-gray-700 mx-3">
          {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d')} ({format(addDays(weekStart, 6), 'yyyy')})
        </h2>
        <button
          onClick={goToNextWeek}
          className="p-1 rounded hover:bg-gray-100 transition-colors active:scale-95"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div
        ref={pageScrollRef}
        className="weekly-calendar-content-scroll bg-gray-50 overflow-y-auto"
        style={{
          position: 'absolute',
          top: weekNavBottom,
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8,
          left: 0,
          right: 0,
          WebkitOverflowScrolling: 'touch',
          overflowY: 'auto',
          transition: isPositioned ? 'top 0.2s, bottom 0.2s' : 'none',
          opacity: isPositioned ? 1 : 0,
        }}
      >
        <div className="px-4 pt-2" style={{ paddingBottom: '100px' }}>
          {/* Apple-Pay style stacked days */}
          <div
            className="relative max-w-2xl mx-auto"
            style={{
              height: `${380 + ((weekDays.length - 1) * 56)}px`,
              marginBottom: activeDayIndex === weekDays.length - 1 ? '336px' : '40px',
              transition: 'margin-bottom 300ms ease-in-out',
            }}
          >
              {weekDays.map((day, idx) => {
                // Stack position starts from 0 at the top of the visual pile
                const stackPosition = weekDays.length - 1 - idx;
                const totalInStack = weekDays.length;
                const accentColor = dayAccentColors[day.date.getDay()];
                const accentColorSoft = `${accentColor}55`; // ~33% opacity
                const accentColorTint = `${accentColor}40`; // ~25% opacity
                const isActive = activeDayIndex === stackPosition;
                const isEmphasized = day.dayName === 'Saturday' || day.dayName === 'Friday';
                const finalAccentSoft = isEmphasized ? `${accentColor}80` : accentColorSoft;
                const finalBoxShadow = isEmphasized ? `0 0 6px 2px ${finalAccentSoft}` : `0 0 5px 1px ${accentColorSoft}`;
                const visibleTabHeight = 56;
                const popOffset = 316; // 380 - 64
                let cardOffset = (totalInStack - 1 - stackPosition) * visibleTabHeight;
                if (activeDayIndex !== null && activeDayIndex > stackPosition) {
                  cardOffset += popOffset;
                }
                if (isActive) {
                  cardOffset += popOffset;
                }

                const dayEvents = getEventsForDay(day.fullDate);
                const dayKeepers = getKeepersForDay(day.fullDate);

                return (
                  <div
                    key={day.fullDate}
                    className="absolute left-0 right-0"
                    style={{
                      top: `${cardOffset}px`,
                      zIndex: totalInStack - stackPosition,
                      transition: 'all 300ms ease-in-out',
                    }}
                  >
                    <div
                      className="bg-white rounded-xl shadow-sm overflow-hidden transition-all relative"
                      style={{
                        transform: isActive ? 'translateY(-316px) scale(1.02)' : 'translateY(0)',
                        transition: 'all 300ms ease-in-out',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: finalAccentSoft,
                        boxShadow: finalBoxShadow,
                      }}
                    >
                      {/* Day Header */}
                      <div
                        onClick={() => setActiveDayIndex(isActive ? null : stackPosition)}
                        className="relative px-4 py-2 cursor-pointer border-b"
                        style={{
                          backgroundColor: accentColor,
                          borderBottomColor: finalAccentSoft,
                          boxShadow: `inset 0 8px 15px -3px #0000001A, inset 0 -8px 15px -3px #0000001A`
                        }}
                      >
                        <div className="relative flex items-baseline justify-between" style={{ zIndex: 1 }}>
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-sm font-medium text-gray-700">
                              {day.dayName}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {day.monthName} {day.dayNumber}
                            </span>
                            {day.isToday && (
                              <span className="text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 px-2 py-0.5 rounded-full">
                                Today
                              </span>
                            )}
                          </div>
                          
                          {/* Event and Keeper indicators - right aligned */}
                          <div className="flex items-center gap-2">
                            {/* Keeper indicators */}
                            {dayKeepers.length > 0 && (() => {
                              const keeperChildren = dayKeepers
                                .filter(k => k.childName)
                                .map(k => k.childName);
                              const uniqueKeeperChildren = [...new Set(keeperChildren)];
                              
                              if (uniqueKeeperChildren.length > 0) {
                                return (
                                  <div className="flex items-center px-1.5 py-0.5 rounded-full bg-white/50 backdrop-blur-sm">
                                    <span className="text-[10px] font-medium text-gray-700 mr-1">Keepers:</span>
                                    <div className="flex items-center space-x-1">
                                      {uniqueKeeperChildren.slice(0, 3).map((childName, idx) => {
                                        const child = getChildProfile(childName);
                                        const bg = child?.color || '#6b7280';
                                        const initial = (childName || '?')[0].toUpperCase();
                                        return (
                                          <span
                                            key={idx}
                                            className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold text-gray-700 ring-1 ring-gray-400"
                                            style={{ backgroundColor: bg }}
                                          >
                                            {initial}
                                          </span>
                                        );
                                      })}
                                      {uniqueKeeperChildren.length > 3 && (
                                        <span className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center text-[10px] text-white ring-1 ring-gray-400">
                                          +{uniqueKeeperChildren.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            
                            {/* Event indicators */}
                            {dayEvents.length > 0 && (
                              <div className="flex items-center px-1.5 py-0.5 rounded-full bg-white/50 backdrop-blur-sm">
                                <span className="text-[10px] font-medium text-gray-700 mr-1">Events:</span>
                                <div className="flex items-center space-x-1">
                                  {(() => {
                                    const circles: JSX.Element[] = [];
                                    const MAX_SHOW = 3;
                                    dayEvents.slice(0, MAX_SHOW).forEach((ev, i) => {
                                      const child = getChildProfile(ev.childName);
                                      const bg = child?.color || '#6b7280';
                                      const initial = (ev.childName || '?')[0].toUpperCase();
                                      circles.push(
                                        <span
                                          key={`${ev.eventName}-${i}`}
                                          className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold text-gray-700 ring-1 ring-gray-400"
                                          style={{ backgroundColor: bg }}
                                        >
                                          {initial}
                                        </span>
                                      );
                                    });
                                    if (dayEvents.length > MAX_SHOW) {
                                      circles.push(
                                        <span key="more" className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center text-[10px] text-white ring-1 ring-gray-400">+{dayEvents.length - MAX_SHOW}</span>
                                      );
                                    }
                                    return circles;
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Day Events and Keepers */}
                      <div className="p-3 space-y-3">
                        <MiniEventCarousel dayEvents={dayEvents} accentColor={accentColorSoft} fullDate={day.fullDate} />
                        <MiniKeeperCard dayKeepers={dayKeepers} dayOfWeek={day.date.getDay()} fullDate={day.fullDate} />
                      </div>
                    </div>
                  </div>
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
        <div 
          ref={messagesContentRef}
          className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4"
        >
          {/* Render Messages */}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <ChatBubble
                side={msg.sender === 'user' ? 'right' : 'left'}
              >
                {msg.content}
              </ChatBubble>
            </motion.div>
          ))}
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