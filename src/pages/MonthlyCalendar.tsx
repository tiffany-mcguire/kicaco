import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2, StackedChildBadges } from '../components/common';
import { IconButton } from '../components/common';
import { ChatBubble } from '../components/chat';
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
import { Calendar, ChevronLeft, ChevronRight, Filter as FilterIcon } from 'lucide-react';
import { format as dateFormat, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, parse, getDaysInMonth, isPast, startOfDay } from 'date-fns';

import { generateUUID } from '../utils/uuid';

// Filter Dropdown Component
const ChildFilterDropdown: React.FC<{
  children: { name: string }[];
  selectedChildren: string[];
  onToggleChild: (name: string) => void;
  onClear: () => void;
}> = ({ children, selectedChildren, onToggleChild, onClear }) => {
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
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors bg-[#c0e2e7]/40 text-[#217e8f] hover:bg-[#c0e2e7]/60"
        aria-label="Filter by child"
      >
        <FilterIcon size={12} />
        <span>Filter</span>
      </button>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-100">
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

const CalendarIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 448 512">
    <path d="M160 32V64H288V32C288 14.33 302.3 0 320 0C337.7 0 352 14.33 352 32V64H400C426.5 64 448 85.49 448 112V160H0V112C0 85.49 21.49 64 48 64H96V32C96 14.33 110.3 0 128 0C145.7 0 160 14.33 160 32zM0 192H448V464C448 490.5 426.5 512 400 512H48C21.49 512 0 490.5 0 464V192zM64 304C64 312.8 71.16 320 80 320H112C120.8 320 128 312.8 128 304V272C128 263.2 120.8 256 112 256H80C71.16 256 64 263.2 64 272V304zM192 304C192 312.8 199.2 320 208 320H240C248.8 320 256 312.8 256 304V272C256 263.2 248.8 256 240 256H208C199.2 256 192 263.2 192 272V304zM336 256C327.2 256 320 263.2 320 272V304C320 312.8 327.2 320 336 320H368C376.8 320 384 312.8 384 304V272C384 263.2 376.8 256 368 256H336zM64 432C64 440.8 71.16 448 80 448H112C120.8 448 128 440.8 128 432V400C128 391.2 120.8 384 112 384H80C71.16 384 64 391.2 64 400V432zM208 384C199.2 384 192 391.2 192 400V432C192 440.8 199.2 448 208 448H240C248.8 448 256 440.8 256 432V400C256 391.2 248.8 384 240 384H208zM320 432C320 440.8 327.2 448 336 448H368C376.8 448 384 440.8 384 432V400C384 391.2 376.8 384 368 384H336C327.2 384 320 391.2 320 400V432z" />
  </svg>
);

const AddByDateButton = (props: { label?: string; selectedDate?: Date | null }) => {
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
    const navigationState = props.selectedDate 
      ? { date: dateFormat(props.selectedDate, 'yyyy-MM-dd') }
      : undefined;
    setTimeout(() => navigate('/add-event', { state: navigationState }), 150);
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
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [subheaderBottom, setSubheaderBottom] = useState(108); // More accurate initial estimate (64px header + ~44px subheader)
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
  const [fadeOutDate, setFadeOutDate] = useState<Date | null>(null);
  const [filteredChildren, setFilteredChildren] = useState<string[]>([]);
  const { messages, threadId, addMessage, removeMessageById, events, keepers, children, drawerHeight: storedDrawerHeight, setDrawerHeight: setStoredDrawerHeight } = useKicacoStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const handleToggleChildFilter = (childName: string) => {
    setFilteredChildren(prev =>
      prev.includes(childName)
        ? prev.filter(name => name !== childName)
        : [...prev, childName]
    );
  };

  const handleClearFilter = () => setFilteredChildren([]);

  const getChildProfile = (childName?: string) => children.find(c => c.name === childName);

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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get all days in the current month for the list view
  const daysInMonth = getDaysInMonth(currentMonth);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
    const dayEvents = filteredEvents.filter(event => {
      if (!event.date) return false;
      try {
        const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
        return isSameDay(eventDate, day);
      } catch (e) {
        console.error("Error parsing date for list view:", event.date, e);
        return false;
      }
    });
    const dayKeepers = filteredKeepers.filter(keeper => {
      if (!keeper.date) return false;
      try {
        const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
        return isSameDay(keeperDate, day);
      } catch (e) {
        console.error("Error parsing keeper date for list view:", keeper.date, e);
        return false;
      }
    });
    return { day, events: dayEvents, keepers: dayKeepers };
  });

  // Split days into two columns
  const midPoint = Math.ceil(monthDays.length / 2);
  const firstColumn = monthDays.slice(0, midPoint);
  const secondColumn = monthDays.slice(midPoint);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper function to make event names more compact
  const compactEventName = (eventName: string, childName?: string) => {
    let compactName = eventName;
    
    // First, check if the event name has a name in parentheses (like "Birthday Party (Sarah)")
    const nameInParensMatch = compactName.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (nameInParensMatch) {
      const [, eventPart, personName] = nameInParensMatch;
      // Check if this person is one of the user's children
      const isUsersChild = children.some(child => child.name === personName);
      if (!isUsersChild) {
        // It's someone else's event, restructure it
        if (eventPart.toLowerCase().includes('birthday')) {
          compactName = `${personName}'s Birthday Party`;
        } else {
          compactName = `${personName}'s ${eventPart}`;
        }
      }
    }
    
    // Common word replacements
    const replacements: { [key: string]: string } = {
      'Appointment': 'Appt',
      'appointment': 'appt',
      'Meeting': 'Mtg',
      'meeting': 'mtg',
      'Conference': 'Conf',
      'conference': 'conf',
      'Birthday Party': 'Birthday',
      'birthday party': 'birthday',
      'Birthday party': 'Birthday',
      'Development': 'Dev',
      'development': 'dev',
      'Examination': 'Exam',
      'examination': 'exam',
      'Registration': 'Reg',
      'registration': 'reg',
      'Preparation': 'Prep',
      'preparation': 'prep',
      'Competition': 'Comp',
      'competition': 'comp',
      'Performance': 'Perf',
      'performance': 'perf',
      'Rehearsal': 'Reh',
      'rehearsal': 'reh',
      'Tournament': 'Tourn',
      'tournament': 'tourn',
      'Championship': 'Champ',
      'championship': 'champ',
      'Celebration': 'Celeb',
      'celebration': 'celeb',
    };
    
    // Apply replacements
    for (const [full, short] of Object.entries(replacements)) {
      compactName = compactName.replace(new RegExp(`\\b${full}\\b`, 'g'), short);
    }
    
    return { name: compactName, showChildInParens: true };
  };

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
    const userMessage = { id: generateUUID(), sender: 'user' as const, content: input };
    addMessage(userMessage);
    const messageToSend = input;
    setInput('');
    
    const thinkingId = 'thinking-monthly';
    addMessage({ id: thinkingId, sender: 'assistant', content: 'Kicaco is thinking' });

    try {
      const assistantResponse = await sendMessageToAssistant(threadId, messageToSend);
      removeMessageById(thinkingId);
      addMessage({ id: generateUUID(), sender: 'assistant', content: assistantResponse });
    } catch (error) {
      console.error("Error sending message from MonthlyCalendar:", error);
      removeMessageById(thinkingId);
      addMessage({ id: generateUUID(), sender: 'assistant', content: "I had an issue. Please try again." });
    }
  };

  useLayoutEffect(() => {
    const updateSubheaderBottom = () => {
      if (subheaderRef.current) {
        const rect = subheaderRef.current.getBoundingClientRect();
        setSubheaderBottom(rect.bottom);
      }
    };

    const calculateMaxDrawerHeight = () => {
      const subheaderElement = subheaderRef.current;
      const footerElement = footerRef.current;
      
      if (subheaderElement && footerElement) {
        const subheaderRect = subheaderElement.getBoundingClientRect();
        const footerHeight = footerElement.getBoundingClientRect().height;
        const availableHeight = window.innerHeight - subheaderRect.bottom - footerHeight - 4;
        setMaxDrawerHeight(Math.max(32, availableHeight));
      }
    };
    
    const updateLayout = () => {
      updateSubheaderBottom();
      calculateMaxDrawerHeight();
      setIsLayoutReady(true);
    };
    
    if (isMounted) {
      // Use requestAnimationFrame to ensure DOM is ready
      const rafId = requestAnimationFrame(() => {
        updateLayout();
      });
      
      window.addEventListener('resize', updateSubheaderBottom);
      window.addEventListener('resize', calculateMaxDrawerHeight);
      
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', updateSubheaderBottom);
        window.removeEventListener('resize', calculateMaxDrawerHeight);
      };
    }
  }, [isMounted]); // Changed dependency to isMounted instead of refs

  if (!isMounted || !isLayoutReady) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <GlobalHeader />
        <GlobalSubheader
          ref={subheaderRef}
          icon={<Calendar />}
          title="Monthly Calendar"
          action={<AddByDateButton selectedDate={selectedDate} />}
        />
        <GlobalFooter ref={footerRef} value="" onChange={() => {}} onSend={() => {}} disabled />
      </div>
    ); // Show basic layout while measuring
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <GlobalHeader />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Monthly Calendar"
        action={<AddByDateButton selectedDate={selectedDate} />}
      />
      <div 
        className="monthly-calendar-content-scroll bg-gray-50 flex-1 overflow-y-auto"
        style={{
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8}px`,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="max-w-md mx-auto p-4">
          {/* Calendar Grid */}
          <div 
            className="bg-white rounded-xl"
            style={{
              boxShadow: '0 4px 10px -2px #c0e2e7, 0 2px 6px -2px #c0e2e7',
            }}
          >
            {/* Month Navigation */}
            <div 
              className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center p-3 rounded-t-lg"
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

              <div className="flex justify-center">
                <ChildFilterDropdown 
                  children={children}
                  selectedChildren={filteredChildren}
                  onToggleChild={handleToggleChildFilter}
                  onClear={handleClearFilter}
                />
              </div>

              <h2 className="text-lg font-medium text-gray-700">{dateFormat(currentMonth, "MMMM yyyy")}</h2>

              <div />

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
                const dayEvents = filteredEvents.filter(event => {
                  if (!event.date) return false;
                  try {
                    const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
                    return isSameDay(eventDate, day);
                  } catch (e) {
                    console.error("Error parsing date for monthly calendar:", event.date, e);
                    return false;
                  }
                });
                const dayKeepers = filteredKeepers.filter(keeper => {
                  if (!keeper.date) return false;
                  try {
                    const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
                    return isSameDay(keeperDate, day);
                  } catch (e) {
                    console.error("Error parsing keeper date for monthly calendar:", keeper.date, e);
                    return false;
                  }
                });
                const totalItems = dayEvents.length + dayKeepers.length;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <div 
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-1.5 h-20 flex flex-col items-center justify-start border-r border-b cursor-pointer hover:bg-opacity-70 transition-colors
                      ${(index + 1) % 7 === 0 ? 'border-r-0' : 'border-gray-200'}
                      ${index > 34 ? 'border-b-0' : 'border-gray-200'}
                      ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-[#217e8f] ring-inset' : ''}
                    `}
                    style={{ backgroundColor: dayColorTints[day.getDay()] }}
                  >
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full 
                      ${isCurrentDay 
                        ? 'bg-[#217e8f] text-white' 
                        : selectedDate && isSameDay(day, selectedDate)
                        ? 'bg-[#217e8f]/20 text-[#217e8f] font-bold'
                        : (isCurrentMonth ? 'text-gray-800' : 'text-gray-400')
                      }`
                    }>
                      {dateFormat(day, "d")}
                    </span>
                    {totalItems > 0 && (
                      <div className="flex flex-wrap items-center justify-center mt-1 gap-0.5 max-w-full">
                        {/* Show event children first */}
                        {dayEvents.map((event, i) => (
                          <StackedChildBadges 
                            key={`event-${i}`}
                            childName={event.childName} 
                            size="sm" 
                            maxVisible={10} 
                          />
                        ))}
                        {/* Show all keeper children */}
                        {dayKeepers.map((keeper, i) => (
                          <StackedChildBadges 
                            key={`keeper-${i}`}
                            childName={keeper.childName} 
                            size="sm" 
                            maxVisible={10} 
                          />
                        ))}
                      </div>
                    )}
                    {/* Jump button - appears when date is selected */}
                    {selectedDate && isSameDay(day, selectedDate) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent date selection when clicking jump button
                          
                          // Check if the selected date is in a different month
                          if (!isSameMonth(day, currentMonth)) {
                            // Navigate to the correct month first
                            setCurrentMonth(day);
                            // Clear any existing highlights
                            setHighlightedDate(null);
                            setFadeOutDate(null);
                            // Set the new highlight after a brief delay to allow month change
                            setTimeout(() => {
                              setHighlightedDate(day);
                              
                              // Then scroll to the date in the new month's list view
                              setTimeout(() => {
                                const listViewElement = document.getElementById(`list-day-${day.getDate()}`);
                                const scrollContainer = document.querySelector('.monthly-calendar-content-scroll');
                                
                                if (listViewElement && scrollContainer) {
                                  const containerRect = scrollContainer.getBoundingClientRect();
                                  const elementRect = listViewElement.getBoundingClientRect();
                                  const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
                                  
                                  scrollContainer.scrollTo({
                                    top: relativeTop - 20, // 20px padding from top
                                    behavior: 'smooth'
                                  });
                                  
                                  // Start fade out after 2.5 seconds
                                  setTimeout(() => {
                                    setFadeOutDate(day);
                                    // Don't clean up the highlight state - let it stay faded
                                  }, 2500); // 2.5 second highlight duration
                                }
                              }, 100); // Small delay to ensure DOM is updated
                            }, 50); // Small delay to ensure month change is processed
                          } else {
                            // Same month logic - always reset highlights first for fresh animation
                            setHighlightedDate(null);
                            setFadeOutDate(null);
                            
                            // Apply highlight after brief reset
                            setTimeout(() => {
                              setHighlightedDate(day);
                              
                              const listViewElement = document.getElementById(`list-day-${day.getDate()}`);
                              const scrollContainer = document.querySelector('.monthly-calendar-content-scroll');
                              
                              if (listViewElement && scrollContainer) {
                                const containerRect = scrollContainer.getBoundingClientRect();
                                const elementRect = listViewElement.getBoundingClientRect();
                                const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
                                
                                scrollContainer.scrollTo({
                                  top: relativeTop - 20, // 20px padding from top
                                  behavior: 'smooth'
                                });
                                
                                // Start fade out after 2.5 seconds
                                setTimeout(() => {
                                  setFadeOutDate(day);
                                  // Don't clean up the highlight state - let it stay faded
                                }, 2500); // 2.5 second highlight duration
                              }
                            }, 10); // Very brief delay to ensure reset is processed
                          }
                        }}
                        className="absolute bottom-0 left-0 right-0 bg-[#217e8f]/80 hover:bg-[#217e8f] text-white text-[9px] font-medium py-0.5 transition-colors flex items-center justify-center gap-0.5"
                        style={{ borderBottomLeftRadius: '2px', borderBottomRightRadius: '2px' }}
                      >
                        <span>View</span>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* List View Section */}
          <section className="mt-8 mb-20">
            <h2 className="text-sm font-medium text-gray-600 mb-3 ml-1">
              {dateFormat(currentMonth, "MMMM yyyy")} List View
            </h2>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="grid grid-cols-2 gap-x-4">
                {/* First Column */}
                <div className="space-y-1">
                  {firstColumn.map(({ day, events, keepers }) => {
                    const isPastDay = isPast(startOfDay(day)) && !isToday(day);
                    return (
                      <div 
                        key={day.getDate()} 
                        id={`list-day-${day.getDate()}`} 
                        className={`flex items-start gap-1.5 text-xs ${
                          highlightedDate && isSameDay(day, highlightedDate) 
                            ? fadeOutDate && isSameDay(day, fadeOutDate)
                              ? '-mx-2 px-2 py-1 animate-fade-out'
                              : '-mx-2 px-2 py-1 rounded-lg shadow-md bg-[#217e8f]/20'
                            : ''
                        }`}
                      >
                        <span className="font-medium text-gray-600 min-w-[16px] text-right">
                          {day.getDate()}
                        </span>
                        <div className="flex-1">
                          {(events.length > 0 || keepers.length > 0) ? (
                            <div className={`space-y-0.5 ${isPastDay ? 'px-1.5 py-0.5 -mx-1.5 rounded' : ''}`} style={isPastDay ? { backgroundColor: 'rgba(255, 182, 193, 0.3)' } : {}}>
                              {events.map((event, index) => {
                                const { name: displayName } = compactEventName(event.eventName, event.childName);
                                return (
                                  <Link
                                    key={`event-${index}`}
                                    to="/daily-view"
                                    state={{ date: dateFormat(day, 'yyyy-MM-dd') }}
                                    onClick={() => {
                                      navigate('/daily-view', { state: { date: dateFormat(day, 'yyyy-MM-dd') } });
                                    }}
                                    className={`flex items-start gap-1 text-[#217e8f] hover:text-[#1a6e7e] hover:underline transition-colors leading-tight ${isPastDay ? 'opacity-70' : ''}`}
                                  >
                                    {event.childName && (
                                      <StackedChildBadges 
                                        childName={event.childName} 
                                        size="sm" 
                                        maxVisible={10} 
                                        className="mt-0.5"
                                      />
                                    )}
                                    <span>{displayName}</span>
                                  </Link>
                                );
                              })}
                              {keepers.map((keeper, index) => {
                                return (
                                  <Link
                                    key={`keeper-${index}`}
                                    to="/daily-view"
                                    state={{ date: dateFormat(day, 'yyyy-MM-dd') }}
                                    onClick={() => {
                                      navigate('/daily-view', { state: { date: dateFormat(day, 'yyyy-MM-dd') } });
                                    }}
                                    className={`flex items-start gap-1 text-[#b91142] hover:text-[#8a0d33] hover:underline transition-colors leading-tight ${isPastDay ? 'opacity-70' : ''}`}
                                  >
                                    {keeper.childName && (
                                      <StackedChildBadges 
                                        childName={keeper.childName} 
                                        size="sm" 
                                        maxVisible={10} 
                                        className="mt-0.5"
                                      />
                                    )}
                                    <span>{keeper.keeperName}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-[11px]">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Second Column */}
                <div className="space-y-1">
                  {secondColumn.map(({ day, events, keepers }) => {
                    const isPastDay = isPast(startOfDay(day)) && !isToday(day);
                    return (
                      <div 
                        key={day.getDate()} 
                        id={`list-day-${day.getDate()}`} 
                        className={`flex items-start gap-1.5 text-xs ${
                          highlightedDate && isSameDay(day, highlightedDate) 
                            ? fadeOutDate && isSameDay(day, fadeOutDate)
                              ? '-mx-2 px-2 py-1 animate-fade-out'
                              : '-mx-2 px-2 py-1 rounded-lg shadow-md bg-[#217e8f]/20'
                            : ''
                        }`}
                      >
                        <span className="font-medium text-gray-600 min-w-[16px] text-right">
                          {day.getDate()}
                        </span>
                        <div className="flex-1">
                          {(events.length > 0 || keepers.length > 0) ? (
                            <div className={`space-y-0.5 ${isPastDay ? 'px-1.5 py-0.5 -mx-1.5 rounded' : ''}`} style={isPastDay ? { backgroundColor: 'rgba(255, 182, 193, 0.3)' } : {}}>
                              {events.map((event, index) => {
                                const { name: displayName } = compactEventName(event.eventName, event.childName);
                                return (
                                  <Link
                                    key={`event-${index}`}
                                    to="/daily-view"
                                    state={{ date: dateFormat(day, 'yyyy-MM-dd') }}
                                    onClick={() => {
                                      navigate('/daily-view', { state: { date: dateFormat(day, 'yyyy-MM-dd') } });
                                    }}
                                    className={`flex items-start gap-1 text-[#217e8f] hover:text-[#1a6e7e] hover:underline transition-colors leading-tight ${isPastDay ? 'opacity-70' : ''}`}
                                  >
                                    {event.childName && (
                                      <StackedChildBadges 
                                        childName={event.childName} 
                                        size="sm" 
                                        maxVisible={10} 
                                        className="mt-0.5"
                                      />
                                    )}
                                    <span>{displayName}</span>
                                  </Link>
                                );
                              })}
                              {keepers.map((keeper, index) => {
                                return (
                                  <Link
                                    key={`keeper-${index}`}
                                    to="/daily-view"
                                    state={{ date: dateFormat(day, 'yyyy-MM-dd') }}
                                    onClick={() => {
                                      navigate('/daily-view', { state: { date: dateFormat(day, 'yyyy-MM-dd') } });
                                    }}
                                    className={`flex items-start gap-1 text-[#b91142] hover:text-[#8a0d33] hover:underline transition-colors leading-tight ${isPastDay ? 'opacity-70' : ''}`}
                                  >
                                    {keeper.childName && (
                                      <StackedChildBadges 
                                        childName={keeper.childName} 
                                        size="sm" 
                                        maxVisible={10} 
                                        className="mt-0.5"
                                      />
                                    )}
                                    <span>{keeper.keeperName}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-[11px]">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
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
        ref={footerRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSend={handleSendMessage}
        disabled={!threadId}
      />
    </div>
  );
} 