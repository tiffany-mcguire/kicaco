import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalSubheader from '../components/GlobalSubheader';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, isToday, parse } from 'date-fns';
import EventCard from '../components/EventCard';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';

const WeeklyIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 448 512">
    <path d="M160 32V64H288V32C288 14.33 302.3 0 320 0C337.7 0 352 14.33 352 32V64H400C426.5 64 448 85.49 448 112V160H0V112C0 85.49 21.49 64 48 64H96V32C96 14.33 110.3 0 128 0C145.7 0 160 14.33 160 32zM0 192H448V464C448 490.5 426.5 512 400 512H48C21.49 512 0 490.5 0 464V192zM80 256C71.16 256 64 263.2 64 272V336C64 344.8 71.16 352 80 352H368C376.8 352 384 344.8 384 336V272C384 263.2 376.8 256 368 256H80z" />
  </svg>
);

const AddByDayButton = (props: { label?: string }) => {
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

export default function WeeklyCalendar() {
  const [input, setInput] = useState("");
  const location = useLocation();

  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const weekNavRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);

  const [mainContentDrawerOffset, setMainContentDrawerOffset] = useState(44);
  const [mainContentTopClearance, setMainContentTopClearance] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [weekNavBottom, setWeekNavBottom] = useState(0);
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
  } = useKicacoStore();

  const [currentWeek, setCurrentWeek] = useState(new Date());
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

  // Get events for a specific day
  const getEventsForDay = (dateString: string) => {
    return events.filter(event => event.date === dateString);
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
        setWeekNavBottom(weekNavRef.current.getBoundingClientRect().bottom);
      }
    }
    updatePositions();
    window.addEventListener('resize', updatePositions);

    const calculateMaxDrawerHeight = () => {
      const subheaderElement = subheaderRef.current;
      const footerElement = document.querySelector('.global-footer') as HTMLElement | null;
      if (subheaderElement) {
        const subheaderRect = subheaderElement.getBoundingClientRect();
        const footerHeight = footerElement ? footerElement.getBoundingClientRect().height : 0;
        const availableHeight = window.innerHeight - subheaderRect.bottom - footerHeight - 4;
        setMaxDrawerHeight(Math.max(44, availableHeight));
      } else {
        setMaxDrawerHeight(window.innerHeight * 0.6);
      }
    };
    calculateMaxDrawerHeight();
    window.addEventListener('resize', calculateMaxDrawerHeight);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('resize', calculateMaxDrawerHeight);
    };
  }, []);

  useEffect(() => {
    // Always enable scrolling - let the browser handle whether it's needed
    setMainContentScrollOverflow('auto');
  }, [mainContentDrawerOffset]);

  // Watch for content height changes
  useEffect(() => {
    const contentElement = pageScrollRef.current;
    if (!contentElement) return;

    const checkScrollNeeded = () => {
      // Force a reflow to ensure scroll calculations are correct
      if (contentElement) {
        contentElement.style.overflow = 'hidden';
        void contentElement.offsetHeight; // Force reflow
        contentElement.style.overflow = 'auto';
      }
    };

    // Check immediately after a small delay to ensure DOM is ready
    setTimeout(checkScrollNeeded, 100);

    // Set up ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(() => {
      checkScrollNeeded();
    });

    // Observe the inner content div
    const innerContent = contentElement.querySelector('.overflow-y-auto');
    if (innerContent) {
      resizeObserver.observe(innerContent);
    }

    return () => {
      resizeObserver.disconnect();
    };
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Weekly Calendar"
        action={<AddByDayButton />}
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
          top: weekNavBottom, // Start scrolling below the week navigation
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8,
          left: 0,
          right: 0,
          WebkitOverflowScrolling: 'touch',
          overflowY: 'auto',
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-4 pb-2 pt-2" style={{ paddingBottom: 32 }}>
            {/* Week Grid */}
            <div className="space-y-3 max-w-2xl mx-auto">
              {weekDays.map((day, index) => {
                const dayEvents = getEventsForDay(day.fullDate);
                const accentColor = dayAccentColors[index];
                
                return (
                  <div
                    key={day.fullDate}
                    className="bg-white rounded-xl shadow-sm overflow-hidden transition-all"
                  >
                    {/* Day Header */}
                    <div 
                      className="px-4 py-2 border-b border-gray-100"
                      style={{ borderLeftWidth: '4px', borderLeftColor: accentColor }}
                    >
                      <div className="flex items-baseline justify-between">
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
                        <button className="text-xs text-[#217e8f] hover:text-[#1a6e7e] font-medium transition-all active:scale-95">
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Day Events */}
                    <div className="p-3">
                      {dayEvents.length > 0 ? (
                        <div className="space-y-2">
                          {dayEvents.map((event, eventIndex) => (
                            <div key={`${day.fullDate}-${eventIndex}`} className="group">
                              {/* Compact event card inspired by EventCard glassmorphism */}
                              <div className="relative h-32 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                                <img
                                  src={getKicacoEventPhoto(event.eventName)}
                                  alt={event.eventName}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                
                                {/* Glass panel with event info */}
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/25 backdrop-blur-sm px-3 py-2 text-white">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-medium leading-tight">
                                        {event.eventName}
                                        {event.childName && (
                                          <span className="text-xs font-normal text-gray-300 ml-1">
                                            ({event.childName})
                                          </span>
                                        )}
                                      </h4>
                                      {event.location && (
                                        <p className="text-xs text-gray-200 mt-0.5">{event.location}</p>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-100 text-right ml-2">
                                      {event.time}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-2">No events scheduled</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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