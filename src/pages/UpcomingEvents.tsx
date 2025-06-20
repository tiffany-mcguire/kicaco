import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2, StackedChildBadges } from '../components/common';
import { IconButton } from '../components/common';
import { ChatBubble } from '../components/chat';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { HamburgerMenu } from '../components/navigation';
import { CalendarMenu } from '../components/calendar';
import { ThreeDotMenu } from '../components/navigation';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AddKeeperButton } from '../components/common';
import { GlobalChatDrawer } from '../components/chat';
import { GlobalHeader } from '../components/navigation';
import { GlobalFooter } from '../components/navigation';
import { GlobalSubheader } from '../components/navigation';
import { useKicacoStore } from '../store/kicacoStore';
import { EventCard } from '../components/calendar';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { parse, format, startOfDay, isAfter, isSameDay } from 'date-fns';

import { generateUUID } from '../utils/uuid';
// Day Colors for Tabs (copied from Home.tsx)
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

const dayColorsDark: { [key: number]: string } = {
  0: '#e7a5b4', 1: '#e6c2a2', 2: '#e3d27c', 3: '#a8e1bb',
  4: '#aed1d6', 5: '#b9bde3', 6: '#d4c0e6',
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

// Reusable formatTime function
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

// AddEventButton definition (matches AddKeeperButton logic)
const AddEventButton = (props: { label?: string }) => {
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
    setTimeout(() => navigate('/add-event'), 150);
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

const EventDayStackCard: React.FC<{
  date: string;
  events: any[];
  isActive: boolean;
  navigate: any;
  allEvents: any[];
  removeEvent: (index: number) => void;
}> = ({ date, events, isActive, navigate, allEvents, removeEvent }) => {
  const [displayedEventIndex, setDisplayedEventIndex] = useState(0);
  const eventDate = parse(date, 'yyyy-MM-dd', new Date());
  const dayOfWeek = eventDate.getDay();
  const currentEvent = events[displayedEventIndex];
  
  // Get child info for the event
  const children = useKicacoStore(state => state.children);
  
  // Parse multiple children from comma-separated string (kept for birthday name logic)
  const childNames = currentEvent.childName ? currentEvent.childName.split(',').map((name: string) => name.trim()).filter((name: string) => name) : [];
  
  // Find the global index of this event
  const globalEventIndex = allEvents.findIndex(e => 
    e.eventName === currentEvent.eventName && 
    e.date === currentEvent.date && 
    e.childName === currentEvent.childName &&
    e.time === currentEvent.time
  );

  const handleDelete = () => {
    if (globalEventIndex !== -1) {
      removeEvent(globalEventIndex);
    }
  };

  // Transform birthday party names to possessive form (same logic as EventCard)
  const displayName = (() => {
    const name = currentEvent.eventName;
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
      if (currentEvent.childName && (name.toLowerCase() === 'birthday party' || name.toLowerCase() === 'birthday')) {
        const possessiveName = currentEvent.childName.endsWith('s') ? `${currentEvent.childName}'` : `${currentEvent.childName}'s`;
        return `${possessiveName} Birthday Party`;
      }
    }
    return name;
  })();

  return (
    <div 
      className="relative h-[240px] w-full rounded-xl overflow-hidden bg-white"
      style={{
        boxShadow: isActive 
          ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
          : '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* The EventCard provides the main visuals and expanded content */}
      <EventCard
        image={getKicacoEventPhoto(currentEvent.eventName)}
        name={currentEvent.eventName}
        childName={currentEvent.childName}
        date={currentEvent.date}
        time={currentEvent.time}
        location={currentEvent.location}
        notes={currentEvent.notes}
        showEventInfo={false}
        onEdit={isActive ? () => {
          navigate('/add-event', { 
            state: { 
              event: currentEvent,
              eventIndex: globalEventIndex,
              isEdit: true 
            } 
          });
        } : undefined}
        onDelete={isActive ? handleDelete : undefined}
      />
      {/* The Tab is an overlay on top of the EventCard */}
      <div className="absolute top-0 left-0 right-0 z-10 h-[56px] backdrop-blur-sm">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <StackedChildBadges childName={currentEvent.childName} size="md" maxVisible={3} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{displayName}</span>
                {currentEvent.location && (
                  <span className="text-xs text-gray-200 mt-0.5">{currentEvent.location}</span>
                )}
              </div>
              {/* Carousel controls next to event name */}
              {events.length > 1 && (
                <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-[5px]">
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
          <div className="flex flex-col justify-center items-end">
            <span className="text-sm font-medium text-white">{format(eventDate, 'EEEE, MMMM d')}</span>
            {currentEvent.time && (
              <span className="text-xs text-gray-200 mt-0.5">{formatTime(currentEvent.time)}</span>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
      </div>

      
    </div>
  );
};

export default function UpcomingEvents() {
  const [input, setInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [scrollRefReady, setScrollRefReady] = useState(false);
  const internalChatContentScrollRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const autoscrollFlagRef = useRef(false); // For managing autoscroll after new message
  const mutationObserverRef = useRef<MutationObserver | null>(null); // Ref for the new MutationObserver
  const {
    events,
    messages,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
    threadId,
    addMessage,
    removeMessageById,
    addEvent,
    removeEvent,
  } = useKicacoStore();
  const previousMessagesLengthRef = useRef(messages.length);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);
  const [activeDayDate, setActiveDayDate] = useState<string | null>(null);

  const executeScrollToBottom = useCallback(() => {
    const sc = internalChatContentScrollRef.current;
    if (!sc || !scrollRefReady) {
      return;
    }

    requestAnimationFrame(() => {
      if (internalChatContentScrollRef.current) { // Re-check ref
        const currentSc = internalChatContentScrollRef.current;
        const targetScrollTop = Math.max(0, currentSc.scrollHeight - currentSc.clientHeight);
        currentSc.scrollTop = targetScrollTop;
        setChatScrollPosition(targetScrollTop);
      }
    });
  }, [setChatScrollPosition, scrollRefReady]);

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

  useLayoutEffect(() => {
    function updatePageSpecificMaxHeight() {
      if (subheaderRef.current) {
        const bottom = subheaderRef.current.getBoundingClientRect().bottom;
        const footer = document.querySelector('.global-footer') as HTMLElement | null;
        const footerHeightVal = footer ? footer.getBoundingClientRect().height : 0;
        const availableHeight = window.innerHeight - bottom - footerHeightVal - 4;
        setMaxDrawerHeight(Math.max(availableHeight, 44));
      }
    }
    updatePageSpecificMaxHeight();
    window.addEventListener('resize', updatePageSpecificMaxHeight);
    return () => window.removeEventListener('resize', updatePageSpecificMaxHeight);
  }, [subheaderRef]);

  const handleDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
  };

  useEffect(() => {
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer) return;

    const newMessagesAdded = messages.length > previousMessagesLengthRef.current;
    if (newMessagesAdded) {
      autoscrollFlagRef.current = true;
      executeScrollToBottom();
    } else {
      if (chatScrollPosition !== null && scrollContainer) {
        if (Math.abs(scrollContainer.scrollTop - chatScrollPosition) > 1.5) {
          requestAnimationFrame(() => {
            if (internalChatContentScrollRef.current) {
              internalChatContentScrollRef.current.scrollTop = chatScrollPosition;
            }
          });
        }
      }
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages, chatScrollPosition, setChatScrollPosition, scrollRefReady, executeScrollToBottom]);


  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
  }, []); // Empty dependency array for stable ref callback

  // Callback ref for the messages content div to attach MutationObserver
  const messagesContentRef = useCallback((node: HTMLDivElement | null) => {
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
    }

    if (node && scrollRefReady) {
      const observer = new MutationObserver(() => {
        if (autoscrollFlagRef.current) {
          executeScrollToBottom();
        }
      });

      observer.observe(node, { childList: true, subtree: true, characterData: true });
      mutationObserverRef.current = observer;
    }
  }, [scrollRefReady, executeScrollToBottom]);

  const eventsByDate = useMemo(() => {
    const today = startOfDay(new Date());
    const grouped = events.reduce((acc, event) => {
      const date = event.date;
      if (!date) return acc;
      
      // Filter out past events
      try {
        const eventDate = parse(date, 'yyyy-MM-dd', new Date());
        if (!isAfter(eventDate, today) && !isSameDay(eventDate, today)) {
          return acc; // Skip past events
        }
      } catch (e) {
        return acc; // Skip invalid dates
      }
      
      acc[date] = acc[date] ? [...acc[date], event] : [event];
      return acc;
    }, {} as Record<string, any[]>);
    // Sort events within each day by time
    Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => parseTimeForSorting(a.time) - parseTimeForSorting(b.time));
    });
    return grouped;
  }, [events]);

  const sortedDates = useMemo(() => 
    Object.keys(eventsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()), 
    [eventsByDate]
  );

  const eventsByMonth = useMemo(() => {
    const months: Record<string, string[]> = {};
    for (const date of sortedDates) {
        const month = format(parse(date, 'yyyy-MM-dd', new Date()), 'yyyy-MM');
        if (!months[month]) {
            months[month] = [];
        }
        months[month].push(date);
    }
    return months;
  }, [sortedDates]);

  const sortedMonths = useMemo(() => Object.keys(eventsByMonth).sort(), [eventsByMonth]);

  // Assistant-enabled handleSend
  const handleSend = async () => {
    if (!input.trim() || !threadId) return;
    const userMessage = { id: generateUUID(), sender: 'user' as const, content: input };
    addMessage(userMessage);
    const thinkingId = 'thinking-upcoming';
    addMessage({ id: thinkingId, sender: 'assistant', content: 'Kicaco is thinking' });
    try {
      const response = await sendMessageToAssistant(threadId, input);
      removeMessageById(thinkingId);
      addMessage({ id: generateUUID(), sender: 'assistant', content: response });
    } catch (error) {
      removeMessageById(thinkingId);
      addMessage({ id: generateUUID(), sender: 'assistant', content: 'An error occurred.' });
    }
    setInput('');
  };

  const visibleTabHeight = 56;
  const expandedCardHeight = 240;
  const popOffset = expandedCardHeight - visibleTabHeight;

  const isFirstLoad = useRef(true);
  useEffect(() => {
      if (isFirstLoad.current && sortedDates.length > 0) {
          // Find the first date in the current month or later
          const currentMonth = format(new Date(), 'yyyy-MM');
          const currentMonthDates = sortedDates.filter(date => {
              const dateMonth = format(parse(date, 'yyyy-MM-dd', new Date()), 'yyyy-MM');
              return dateMonth >= currentMonth;
          });
          
          // Set the first date of current month or later as active, or fall back to first date
          setActiveDayDate(currentMonthDates.length > 0 ? currentMonthDates[0] : sortedDates[0]);
          isFirstLoad.current = false;
      }
  }, [sortedDates]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Upcoming Events"
        action={<AddEventButton />}
      />
      <GlobalChatDrawer 
        drawerHeight={currentDrawerHeight}
        maxDrawerHeight={maxDrawerHeight}
        onHeightChange={handleDrawerHeightChange}
        scrollContainerRefCallback={chatContentScrollRef}
      >
        <div
          ref={messagesContentRef}
          className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4"
        >
          {messages.map((msg) => {
            if (msg.type === 'event_confirmation' && msg.event) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                >
                  <ChatBubble side="left" className="w-full max-w-[95vw] sm:max-w-3xl">
                    <div>
                      <EventCard
                        image={getKicacoEventPhoto(msg.event.eventName)}
                        name={msg.event.eventName}
                        date={msg.event.date}
                        time={msg.event.time}
                        location={msg.event.location}
                      />
                      <div className="mt-2 text-left w-full text-sm text-gray-900">{
                        msg.content.replace(/Want to change anything\??/, '').trim()
                      }</div>
                    </div>
                  </ChatBubble>
                </motion.div>
              );
            }
            return (
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
            );
          })}
        </div>
      </GlobalChatDrawer>
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.offsetHeight ?? 0) + 200}px`, // Added extra padding for expanded event cards
        }}
      >
        <div className="max-w-md mx-auto">
          {sortedDates.length > 0 ? (
            <div className="space-y-8">
              {sortedMonths.map(month => {
                const monthDates = eventsByMonth[month];
                // Reverse the dates so earliest is last (will be at bottom of stack)
                const reversedMonthDates = [...monthDates].reverse();
                const activeDateIndex = activeDayDate ? reversedMonthDates.indexOf(activeDayDate) : -1;

                return (
                  <div key={month}>
                    <h2 className="text-sm font-medium text-gray-600 mb-4 ml-1">
                      {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                    </h2>
                    <div
                      className="relative"
                      style={{
                          height: `${expandedCardHeight + ((reversedMonthDates.length - 1) * visibleTabHeight)}px`,
                          marginBottom: activeDayDate === reversedMonthDates[reversedMonthDates.length - 1] ? '196px' : '20px',
                          transition: 'margin-bottom 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {reversedMonthDates.map((date, idx) => {
                          const stackPosition = idx;
                          const isActive = activeDayDate === date;
                          
                          // Calculate the card's vertical offset
                          // Cards stack from bottom to top
                          let cardOffset = (reversedMonthDates.length - 1 - stackPosition) * visibleTabHeight;
                          
                          // If there's an active card below this one, push this card up
                          if (activeDateIndex !== -1 && activeDateIndex > stackPosition) {
                              cardOffset += popOffset;
                          }
                          
                          // If this card is active, compensate for its transform
                          if (isActive) {
                              cardOffset += popOffset;
                          }

                          return (
                              <div
                                  key={date}
                                  className="absolute left-0 right-0"
                                  style={{
                                      top: `${cardOffset}px`,
                                      zIndex: reversedMonthDates.length - stackPosition,
                                      transition: 'top 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                                  }}
                                  onClick={() => setActiveDayDate(isActive ? null : date)}
                              >
                                  <div 
                                    className="relative w-full h-full"
                                    style={{
                                      transform: isActive ? 'translateY(-176px) scale(1.02)' : 'translateY(0) scale(1)',
                                      transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                  >
                                    <EventDayStackCard
                                        date={date}
                                        events={eventsByDate[date]}
                                        isActive={isActive}
                                        navigate={navigate}
                                        allEvents={events}
                                        removeEvent={removeEvent}
                                    />
                                  </div>
                              </div>
                          );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No upcoming events.
            </div>
          )}
        </div>
      </div>
      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSend}
        disabled={!threadId}
      />
    </div>
  );
} 