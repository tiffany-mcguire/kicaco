import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalSubheader from '../components/GlobalSubheader';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format as dateFormat, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, parse } from 'date-fns';

const CalendarIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 448 512">
    <path d="M160 32V64H288V32C288 14.33 302.3 0 320 0C337.7 0 352 14.33 352 32V64H400C426.5 64 448 85.49 448 112V160H0V112C0 85.49 21.49 64 48 64H96V32C96 14.33 110.3 0 128 0C145.7 0 160 14.33 160 32zM0 192H448V464C448 490.5 426.5 512 400 512H48C21.49 512 0 490.5 0 464V192zM64 304C64 312.8 71.16 320 80 320H112C120.8 320 128 312.8 128 304V272C128 263.2 120.8 256 112 256H80C71.16 256 64 263.2 64 272V304zM192 304C192 312.8 199.2 320 208 320H240C248.8 320 256 312.8 256 304V272C256 263.2 248.8 256 240 256H208C199.2 256 192 263.2 192 272V304zM336 256C327.2 256 320 263.2 320 272V304C320 312.8 327.2 320 336 320H368C376.8 320 384 312.8 384 304V272C384 263.2 376.8 256 368 256H336zM64 432C64 440.8 71.16 448 80 448H112C120.8 448 128 440.8 128 432V400C128 391.2 120.8 384 112 384H80C71.16 384 64 391.2 64 400V432zM208 384C199.2 384 192 391.2 192 400V432C192 440.8 199.2 448 208 448H240C248.8 448 256 440.8 256 432V400C256 391.2 248.8 384 240 384H208zM320 432C320 440.8 327.2 448 336 448H368C376.8 448 384 440.8 384 432V400C384 391.2 376.8 384 368 384H336C327.2 384 320 391.2 320 400V432z" />
  </svg>
);

const AddByDateButton = (props: { label?: string }) => {
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
      {props.label ?? 'Add by Date'}
    </button>
  );
};

export default function MonthlyCalendar() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { 
    events, 
    children,
    messages,
    threadId,
    addMessage,
    removeMessageById,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
  } = useKicacoStore();
  
  const [input, setInput] = useState("");
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getChildProfile = (childName?: string) => children.find(c => c.name === childName);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Use the darker pastel shades for the static day headers
  const dayColors: { [key: number]: string } = {
    0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
    4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
  };

  const dayColorsDark: { [key: number]: string } = {
    0: '#e7a5b4', 1: '#e6c2a2', 2: '#e3d27c', 3: '#a8e1bb',
    4: '#aed1d6', 5: '#b9bde3', 6: '#d4c0e6',
  };

  const dayColorTints: { [key: number]: string } = {
    0: '#f8b6c233', 1: '#ffd8b533', 2: '#fde68a33', 3: '#bbf7d033',
    4: '#c0e2e74D', 5: '#d1d5fa4D', 6: '#e9d5ff4D',
  };
  
  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const handleDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() || !threadId) return;
    const userMessage = { id: crypto.randomUUID(), sender: 'user' as const, content: input };
    addMessage(userMessage);
    const messageToSend = input;
    setInput('');
    
    const thinkingId = 'thinking-monthly';
    addMessage({ id: thinkingId, sender: 'assistant', content: 'Kicaco is thinking' });

    try {
      const assistantResponse = await sendMessageToAssistant(threadId, messageToSend);
      removeMessageById(thinkingId);
      addMessage({ id: crypto.randomUUID(), sender: 'assistant', content: assistantResponse });
    } catch (error) {
      console.error("Error sending message from MonthlyCalendar:", error);
      removeMessageById(thinkingId);
      addMessage({ id: crypto.randomUUID(), sender: 'assistant', content: "I had an issue. Please try again." });
    }
  };

  useLayoutEffect(() => {
    const calculateMaxDrawerHeight = () => {
      const subheaderElement = document.querySelector('.global-subheader') as HTMLElement | null;
      const footerElement = document.querySelector('.global-footer') as HTMLElement | null;
      
      if (subheaderElement && footerElement) {
        const subheaderRect = subheaderElement.getBoundingClientRect();
        const footerHeight = footerElement.getBoundingClientRect().height;
        const availableHeight = window.innerHeight - subheaderRect.bottom - footerHeight - 4;
        setMaxDrawerHeight(Math.max(32, availableHeight));
      }
    };
    
    calculateMaxDrawerHeight();
    window.addEventListener('resize', calculateMaxDrawerHeight);
    
    return () => {
      window.removeEventListener('resize', calculateMaxDrawerHeight);
    };
  }, []);

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <GlobalHeader />
      <GlobalSubheader
        icon={<Calendar />}
        title="Monthly Calendar"
        action={<AddByDateButton />}
      />
      <div className="flex-1 overflow-y-auto p-4">
        <div 
          className="max-w-md mx-auto bg-white rounded-xl"
          style={{
            boxShadow: '0 4px 10px -2px #c0e2e7, 0 2px 6px -2px #c0e2e7',
          }}
        >
          {/* Month Navigation */}
          <div 
            className="flex items-center justify-between p-3 rounded-t-lg"
            style={{
              borderTop: '1px solid #c0e2e780',
              borderLeft: '1px solid #c0e2e780',
              borderRight: '1px solid #c0e2e780',
              boxShadow: '0 -2px 5px -1px #c0e2e780, inset 0 -3px 6px -2px #c0e2e780',
            }}
          >
            <button onClick={goToPreviousMonth} className="p-1 rounded-full hover:bg-gray-100">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-medium text-gray-700">{dateFormat(currentMonth, "MMMM yyyy")}</h2>
            <button onClick={goToNextMonth} className="p-1 rounded-full hover:bg-gray-100">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Static Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-t border-gray-200">
            {weekDays.map((day, index) => (
              <div 
                key={day} 
                className="text-center text-xs font-semibold py-2 text-gray-700"
                style={{
                  backgroundColor: dayColors[index],
                  boxShadow: `inset 0 1px 2px 0 ${dayColorsDark[index]}, inset 0 -2px 2px 0 ${dayColorsDark[index]}`,
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 rounded-b-lg overflow-hidden">
            {days.map((day, index) => {
              const dayEvents = events.filter(event => {
                if (!event.date) return false;
                try {
                  const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
                  return isSameDay(eventDate, day);
                } catch (e) {
                  console.error("Error parsing date for monthly calendar:", event.date, e);
                  return false;
                }
              });
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              return (
                <div 
                  key={day.toString()}
                  className={`relative p-1.5 h-20 flex flex-col items-center justify-start border-r border-b
                    ${(index + 1) % 7 === 0 ? 'border-r-0' : 'border-gray-100'}
                    ${index > 34 ? 'border-b-0' : 'border-gray-100'}
                  `}
                  style={{ backgroundColor: dayColorTints[day.getDay()] }}
                >
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full 
                    ${isCurrentDay 
                      ? 'bg-[#217e8f] text-white' 
                      : (isCurrentMonth ? 'text-gray-800' : 'text-gray-400')
                    }`
                  }>
                    {dateFormat(day, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center mt-1 gap-0.5">
                      {dayEvents.slice(0, 2).map((event, i) => {
                        const child = getChildProfile(event.childName);
                        return (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                            style={{ backgroundColor: child?.color || '#6b7280' }}
                          >
                            {(event.childName || '?')[0].toUpperCase()}
                          </span>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] font-bold text-gray-400">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <GlobalChatDrawer
        drawerHeight={currentDrawerHeight}
        maxDrawerHeight={maxDrawerHeight}
        onHeightChange={handleDrawerHeightChange}
      >
        <div className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <ChatBubble side={msg.sender === 'user' ? 'right' : 'left'}>
                {msg.content}
              </ChatBubble>
            </motion.div>
          ))}
        </div>
      </GlobalChatDrawer>
      <GlobalFooter
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSend={handleSendMessage}
        disabled={!threadId}
      />
    </div>
  );
} 