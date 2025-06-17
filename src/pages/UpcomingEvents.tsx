import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AddKeeperButton from '../components/AddKeeperButton';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalSubheader from '../components/GlobalSubheader';
import { useKicacoStore } from '../store/kicacoStore';
import EventCard from '../components/EventCard';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { parse, format } from 'date-fns';

// Day Colors for Tabs (copied from Home.tsx)
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

const dayColorsDark: { [key: number]: string } = {
  0: '#e7a5b4', 1: '#e6c2a2', 2: '#e3d27c', 3: '#a8e1bb',
  4: '#aed1d6', 5: '#b9bde3', 6: '#d4c0e6',
};

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
}> = ({ date, events, isActive }) => {
  const [displayedEventIndex, setDisplayedEventIndex] = useState(0);
  const eventDate = parse(date, 'yyyy-MM-dd', new Date());
  const dayOfWeek = eventDate.getDay();
  const currentEvent = events[displayedEventIndex];

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
      />
      {/* The Tab is an overlay on top of the EventCard */}
      <div className="absolute top-0 left-0 right-0 z-10 h-[56px]">
        <div className="flex h-full items-center justify-between px-4 backdrop-blur-sm">
          <div className="flex-1 flex items-center justify-center text-sm text-white relative h-full">
            <div 
              className="absolute inset-0"
              style={{ 
                background: `linear-gradient(180deg, ${dayColorsDark[dayOfWeek]}30 0%, ${dayColorsDark[dayOfWeek]}25 50%, ${dayColorsDark[dayOfWeek]}20 100%)`,
                filter: 'blur(4px)',
              }}
            />
            <span className="relative z-10 font-medium">{format(eventDate, 'EEEE, MMMM d')}</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
      </div>
      {/* Badge for multiple events */}
      {events.length > 1 && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-xs font-semibold text-white/90 bg-black/30 rounded-full px-2 py-1">
            {events.length}
          </span>
        </div>
      )}
      {/* Carousel controls are only visible when the card is active */}
      {isActive && events.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setDisplayedEventIndex(prev => (prev - 1 + events.length) % events.length); }} className="bg-black/30 text-white p-1 rounded-full hover:bg-black/50"><ChevronLeft size={16} /></button>
          <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full bg-black/40">{displayedEventIndex + 1} / {events.length}</span>
          <button onClick={(e) => { e.stopPropagation(); setDisplayedEventIndex(prev => (prev + 1) % events.length); }} className="bg-black/30 text-white p-1 rounded-full hover:bg-black/50"><ChevronRight size={16} /></button>
        </div>
      )}
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
    addEvent
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
    const grouped = events.reduce((acc, event) => {
      const date = event.date;
      if (!date) return acc;
      acc[date] = acc[date] ? [...acc[date], event] : [event];
      return acc;
    }, {} as Record<string, any[]>);
    // Sort events within each day by time
    Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => {
            const timeA = a.time ? parse(a.time, 'h:mm a', new Date()).getTime() : 0;
            const timeB = b.time ? parse(b.time, 'h:mm a', new Date()).getTime() : 0;
            return timeA - timeB;
        });
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
    const userMessage = { id: crypto.randomUUID(), sender: 'user' as const, content: input };
    addMessage(userMessage);
    const thinkingId = 'thinking-upcoming';
    addMessage({ id: thinkingId, sender: 'assistant', content: 'Kicaco is thinking' });
    try {
      const response = await sendMessageToAssistant(threadId, input);
      removeMessageById(thinkingId);
      addMessage({ id: crypto.randomUUID(), sender: 'assistant', content: response });
    } catch (error) {
      removeMessageById(thinkingId);
      addMessage({ id: crypto.randomUUID(), sender: 'assistant', content: 'An error occurred.' });
    }
    setInput('');
  };

  const visibleTabHeight = 56;
  const expandedCardHeight = 240;
  const popOffset = expandedCardHeight - visibleTabHeight;

  const isFirstLoad = useRef(true);
  useEffect(() => {
      if (isFirstLoad.current && sortedDates.length > 0) {
          setActiveDayDate(sortedDates[0]); // Set first (earliest) day active by default
          isFirstLoad.current = false;
      }
  }, [sortedDates]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.offsetHeight ?? 0) + 8}px`,
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
                          transition: 'margin-bottom 300ms ease-in-out',
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
                                      transition: 'all 300ms ease-in-out',
                                  }}
                                  onClick={() => setActiveDayDate(isActive ? null : date)}
                              >
                                  <div 
                                    className="relative w-full h-full"
                                    style={{
                                      transform: isActive ? 'translateY(-176px) scale(1.02)' : 'translateY(0)',
                                      transition: 'all 300ms ease-in-out',
                                    }}
                                  >
                                    <EventDayStackCard
                                        date={date}
                                        events={eventsByDate[date]}
                                        isActive={isActive}
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