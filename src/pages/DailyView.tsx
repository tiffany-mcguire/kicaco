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
import { format, addDays, subDays, isSameDay, parse, isToday } from 'date-fns';
import EventCard from '../components/EventCard';
import KeeperCard from '../components/KeeperCard';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';

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
}> = ({ event, currentDate, navigate, allEvents }) => {
  const children = useKicacoStore(state => state.children);
  const childProfile = event.childName ? children.find(c => c.name === event.childName) : null;
  const childIndex = event.childName ? children.findIndex(c => c.name === event.childName) : -1;
  const childColor = childProfile?.color || (childIndex >= 0 ? childColors[childIndex % childColors.length] : null);
  const dayOfWeek = currentDate.getDay();
  
  // Find the global index of this event
  const globalEventIndex = allEvents.findIndex(e => 
    e.eventName === event.eventName && 
    e.date === event.date && 
    e.childName === event.childName &&
    e.time === event.time
  );

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

  return (
    <div className="relative h-[240px] w-full rounded-xl overflow-hidden">
      <EventCard
        image={getKicacoEventPhoto(event.eventName)}
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
      />
      {/* Tab header overlay similar to UpcomingEvents */}
      <div className="absolute top-0 left-0 right-0 z-10 h-[56px]">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              {event.childName && childColor && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-gray-700 text-[10px] font-semibold ring-1 ring-gray-400 flex-shrink-0"
                  style={{ backgroundColor: childColor }}
                >
                  {event.childName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-white">{displayName}</span>
            </div>
            {event.location && (
              <span className="text-xs text-gray-200 mt-0.5" style={{ marginLeft: event.childName && childColor ? '22px' : '0' }}>{event.location}</span>
            )}
          </div>
          {event.time && (
            <div className="flex flex-col justify-center items-end">
              <span className="text-xs text-gray-200">{formatTime(event.time)}</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
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
  } = useKicacoStore();
  
  // Initialize currentDate from navigation state if available
  const navigationDate = location.state?.date;
  const initialDate = navigationDate ? parse(navigationDate, 'yyyy-MM-dd', new Date()) : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [displayedEventIndex, setDisplayedEventIndex] = useState(0);
  const [displayedKeeperIndex, setDisplayedKeeperIndex] = useState(0);
  
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
    }).sort((a, b) => {
      const timeA = a.time ? parse(a.time, 'h:mm a', new Date()).getTime() : 0;
      const timeB = b.time ? parse(b.time, 'h:mm a', new Date()).getTime() : 0;
      return timeA - timeB;
    });
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

  // Get unique children for events of the day
  const childrenForEvents = useMemo(() => {
    const childNames = new Set(eventsForDay.map(event => event.childName).filter(Boolean));
    return Array.from(childNames).map(name => {
      const child = children.find(c => c.name === name);
      const index = children.findIndex(c => c.name === name);
      return {
        name,
        color: child?.color || childColors[index % childColors.length],
        initial: name.charAt(0).toUpperCase()
      };
    });
  }, [eventsForDay, children]);

  // Get unique children for keepers of the day
  const childrenForKeepers = useMemo(() => {
    const childNames = new Set(keepersForDay.map(keeper => keeper.childName).filter(Boolean));
    return Array.from(childNames).map(name => {
      const child = children.find(c => c.name === name);
      const index = children.findIndex(c => c.name === name);
      return {
        name,
        color: child?.color || childColors[index % childColors.length],
        initial: name.charAt(0).toUpperCase()
      };
    });
  }, [keepersForDay, children]);

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
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: assistantResponseText,
      });
    } catch (error) {
      console.error("Error sending message from DailyView:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Daily View"
        action={<AddEventButton date={format(currentDate, 'yyyy-MM-dd')} />}
      />
      {/* Day Navigation - similar to weekly calendar */}
      <div ref={dayNavRef} className="flex items-center justify-center py-2 bg-gray-50 max-w-2xl mx-auto w-full">
        <button
          onClick={goToPreviousDay}
          className="p-1 rounded hover:bg-gray-100 transition-colors active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h2 className="text-base font-normal text-gray-700 mx-3">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
          {isToday(currentDate) && (
            <span className="ml-2 text-xs font-medium text-[#217e8f] bg-[#c0e2e7]/20 px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </h2>
        <button
          onClick={goToNextDay}
          className="p-1 rounded hover:bg-gray-100 transition-colors active:scale-95"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div
        ref={pageScrollRef}
        className="daily-view-content-scroll bg-gray-50 overflow-y-auto"
        style={{
          position: 'absolute',
          top: dayNavBottom,
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8,
          left: 0,
          right: 0,
          WebkitOverflowScrolling: 'touch',
          overflowY: 'auto',
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        <div className="px-4 pt-4 pb-8 max-w-2xl mx-auto">
          {/* Events of the Day Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-gray-600 ml-1">
                Events of the Day
              </h2>
              {childrenForEvents.length > 0 && (
                <div className="flex items-center gap-1">
                  {childrenForEvents.map((child, index) => (
                    <div
                      key={`event-child-${index}`}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-gray-700 text-[10px] font-semibold ring-1 ring-gray-400"
                      style={{ backgroundColor: child.color }}
                      title={child.name}
                    >
                      {child.initial}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {eventsForDay.length > 0 ? (
              <div className="relative rounded-xl shadow-lg overflow-hidden">
                {/* Event Carousel Controls */}
                {eventsForDay.length > 1 && (
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                    <button 
                      onClick={() => setDisplayedEventIndex(prev => (prev - 1 + eventsForDay.length) % eventsForDay.length)}
                      className="bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors"
                      aria-label="Previous event"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full bg-black/40">
                      {displayedEventIndex + 1} / {eventsForDay.length}
                    </span>
                    <button 
                      onClick={() => setDisplayedEventIndex(prev => (prev + 1) % eventsForDay.length)}
                      className="bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors"
                      aria-label="Next event"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
                <DailyEventCard event={eventsForDay[displayedEventIndex]} currentDate={currentDate} navigate={navigate} allEvents={events} />
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
              </div>
            )}
          </section>

          {/* Keepers Due Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-gray-600 ml-1">
                Keepers Due
              </h2>
              {childrenForKeepers.length > 0 && (
                <div className="flex items-center gap-1">
                  {childrenForKeepers.map((child, index) => (
                    <div
                      key={`keeper-child-${index}`}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-gray-700 text-[10px] font-semibold ring-1 ring-gray-400"
                      style={{ backgroundColor: child.color }}
                      title={child.name}
                    >
                      {child.initial}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {keepersForDay.length > 0 ? (
              <div className="relative rounded-xl shadow-lg overflow-hidden">
                {/* Keeper Carousel Controls */}
                {keepersForDay.length > 1 && (
                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                    <button 
                      onClick={() => setDisplayedKeeperIndex(prev => (prev - 1 + keepersForDay.length) % keepersForDay.length)}
                      className="bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors"
                      aria-label="Previous keeper"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full bg-black/40">
                      {displayedKeeperIndex + 1} / {keepersForDay.length}
                    </span>
                    <button 
                      onClick={() => setDisplayedKeeperIndex(prev => (prev + 1) % keepersForDay.length)}
                      className="bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors"
                      aria-label="Next keeper"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
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