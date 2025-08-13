import { ChatBubble } from '../components/chat';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { GlobalHeader } from '../components/navigation';
import { GlobalFooter } from '../components/navigation';
import { GlobalSubheader } from '../components/navigation';
import { GlobalChatDrawer } from '../components/chat';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { CalendarPlus } from "lucide-react";
import Card from '../components/primitives/Card';
import { searchLocations, formatLocationString, LocationResult } from '../utils/mapsSearch';


import { generateUUID } from '../utils/uuid';

const SaveButton = (props: { label?: string; onClick?: () => void }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const getButtonStyle = () => {
    let s = {
      width: '115px',
      height: '30px',
      padding: '0px 8px',
      border: '2px solid #217e8f',
      boxSizing: 'border-box' as const,
      borderRadius: '6px',
      fontWeight: 400,
      fontSize: '13px',
      lineHeight: '20px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      background: '#2f8fa4',
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.2s ease',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        background: '#217e8f',
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
      {props.label ?? 'Save'}
    </button>
  );
};

export default function AddEvent() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const eventNameInputRef = useRef<HTMLInputElement | null>(null);
  const eventLocationInputRef = useRef<HTMLInputElement | null>(null);
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

  // Form state
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState<'oneTime' | 'recurring'>('oneTime');
  const [recurringSchedule, setRecurringSchedule] = useState("");
  const [addTime, setAddTime] = useState(false);
  const [startTime, setStartTime] = useState("");
  // End time removed per design; events track a single start time only
  const [addReminder, setAddReminder] = useState(false);
  const [reminderType, setReminderType] = useState<'dueDate' | 'alertBefore'>('dueDate');
  const [reminderDate, setReminderDate] = useState("");
  const [alertBefore, setAlertBefore] = useState("1 day before");
  const [addLocation, setAddLocation] = useState(false);
  const [eventLocation, setEventLocation] = useState("");
  const [isLocSearching, setIsLocSearching] = useState(false);
  const [locResults, setLocResults] = useState<LocationResult[]>([]);
  const [selectedLocString, setSelectedLocString] = useState('');
  const [originalLocQuery, setOriginalLocQuery] = useState('');
  // specifyChild removed: child selection is required
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  // New UI state for streamlined layout
  // showEndTime removed
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'none'|'daily'|'weekly'|'monthly'>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEnds, setRecurrenceEnds] = useState<'never'|'on'|'after'>('never');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceCount, setRecurrenceCount] = useState('10');
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Time keypad state
  const [keypadHour, setKeypadHour] = useState<string>('');
  const [keypadMinute, setKeypadMinute] = useState<string>('');
  const [keypadAmPm, setKeypadAmPm] = useState<'AM'|'PM'|''>('');
  // Date tokens/keypads state
  const now = new Date();
  const [dateMonth, setDateMonth] = useState<number>(now.getMonth()); // 0-11
  const [dateDay, setDateDay] = useState<string>(String(now.getDate()).padStart(2, '0'));
  const [dateYear, setDateYear] = useState<number>(now.getFullYear());
  const [activeDateToken, setActiveDateToken] = useState<'month'|'day'|'year'|''>('');
  const [yearBase, setYearBase] = useState<number>(now.getFullYear());
  const [swipe, setSwipe] = useState<{ group: ''|'month'|'day'|'year'; startX: number; step: number; active: boolean }>({ group: '', startX: 0, step: 0, active: false });

  // Keep ISO date synced whenever month/day/year change; default day starts as today
  useEffect(() => {
    const lastDay = new Date(dateYear, dateMonth + 1, 0).getDate();
    const dNum = parseInt(dateDay, 10);
    if (!isNaN(dNum) && dNum <= lastDay) {
      setEventDate(`${String(dateYear)}-${String(dateMonth + 1).padStart(2, '0')}-${dateDay.padStart(2, '0')}`);
    } else {
      setEventDate('');
    }
  }, [dateMonth, dateDay, dateYear]);

  // Focus states
  const [eventNameFocused, setEventNameFocused] = useState(false);
  const [eventDateFocused, setEventDateFocused] = useState(false);
  const [startTimeFocused, setStartTimeFocused] = useState(false);
  // endTimeFocused removed
  const [reminderDateFocused, setReminderDateFocused] = useState(false);
  const [eventLocationFocused, setEventLocationFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  const {
    messages,
    threadId,
    addMessage,
    removeMessageById,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
    addEvent,
    updateEvent,
    children,
  } = useKicacoStore();

  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const handleGlobalDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
    
    setMainContentDrawerOffset(height);
  };

  // Initialize scroll overflow based on initial drawer height
  useEffect(() => {
    // Set initial drawer offset and scroll overflow
    setMainContentDrawerOffset(currentDrawerHeight);
    // Always enable scrolling when drawer is minimized
  }, []); // Run only on mount

  useLayoutEffect(() => {
    function updateSubheaderBottom() {
      // Function kept for potential future use
    }
    updateSubheaderBottom();
    window.addEventListener('resize', updateSubheaderBottom);

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
      window.removeEventListener('resize', updateSubheaderBottom);
      window.removeEventListener('resize', calculateMaxDrawerHeight);
    };
  }, []);

  useEffect(() => {
    // Always enable scrolling - let the browser handle whether it's needed
  }, [mainContentDrawerOffset]);

  // Watch for content height changes and update scroll overflow
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

    // Observe the inner content div that contains all the form fields
    const innerContent = contentElement.querySelector('.max-w-xl');
    if (innerContent) {
      resizeObserver.observe(innerContent);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [mainContentDrawerOffset, addTime, addReminder, addLocation]);

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

  // Pre-fill data from location state (for edit mode or date pre-fill)
  useEffect(() => {
    if (location.state?.event && location.state?.isEdit) {
      const event = location.state.event;
      // Pre-populate all fields with event data
      setEventName(event.eventName || '');
      if (event.date) {
        setEventType('oneTime');
        setEventDate(event.date);
        try {
          const [y, m, d] = String(event.date).split('-').map(Number);
          if (y && m && d) {
            setDateYear(y);
            setDateMonth(m - 1);
            setDateDay(String(d).padStart(2, '0'));
            setYearBase(y);
          }
        } catch {}
      } else if (event.recurring) {
        setEventType('recurring');
        setRecurringSchedule(event.recurring);
      }
      if (event.time) {
        setAddTime(true);
        setStartTime(event.time);
        // Populate keypad selections from saved time
        try {
          const raw = String(event.time).trim();
          let hour12 = '';
          let minute = '';
          let period: 'AM' | 'PM' | '' = '';
          const ampmMatch = raw.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)$/i);
          if (ampmMatch) {
            const h = parseInt(ampmMatch[1], 10);
            const m = ampmMatch[2] ? ampmMatch[2] : '00';
            const p = ampmMatch[3].toUpperCase() as 'AM' | 'PM';
            hour12 = String(((h - 1) % 12) + 1); // normalize 12-hour
            minute = m;
            period = p;
          } else {
            const hmMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
            const compactMatch = raw.match(/^(\d{1,2})(\d{2})$/);
            let h24: number | null = null;
            if (hmMatch) {
              h24 = parseInt(hmMatch[1], 10);
              minute = hmMatch[2];
            } else if (compactMatch) {
              h24 = parseInt(compactMatch[1], 10);
              minute = compactMatch[2];
            }
            if (h24 !== null) {
              period = h24 >= 12 ? 'PM' : 'AM';
              const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
              hour12 = String(h12);
            }
          }
          if (hour12) setKeypadHour(hour12);
          if (minute) setKeypadMinute(['00','15','30','45'].includes(minute) ? minute : '');
          if (period) setKeypadAmPm(period);
        } catch {}
      }
      if (event.location) {
        setAddLocation(true);
        setEventLocation(event.location);
      }
      if (event.childName) {
        setSelectedChildren(event.childName.split(', '));
      }
      setNotes(event.notes || '');
      setContactName(event.contactName || '');
      setPhoneNumber(event.phoneNumber || '');
      setEmail(event.email || '');
      setWebsiteUrl(event.websiteUrl || '');
    } else if (location.state?.date) {
      setEventDate(location.state.date);
      try {
        const [y, m, d] = String(location.state.date).split('-').map(Number);
        if (y && m && d) {
          setDateYear(y);
          setDateMonth(m - 1);
          setDateDay(String(d).padStart(2, '0'));
          setYearBase(y);
        }
      } catch {}
    }
    // Scroll-to helpers for confirmation edit links
    if (location.state?.isEdit && location.state?.scrollTo) {
      const target = location.state.scrollTo as string;
      setTimeout(() => {
        const anchors: Record<string, string> = {
          eventName: 'eventName-section',
          who: 'who-section',
          date: 'date-section',
          time: 'time-section',
          location: 'location-section',
          notes: 'notes-section',
        };
        const id = anchors[target];
        if (id) {
          const el = document.getElementById(id);
          const container = pageScrollRef.current;
          if (target === 'eventName' && container) {
            // Snap to very top, then focus the input
            container.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => eventNameInputRef.current?.focus(), 120);
          } else if (el) {
            // Scroll the container so the target is aligned near the top
            if (container) {
              const elRect = el.getBoundingClientRect();
              const cRect = container.getBoundingClientRect();
              const delta = elRect.top - cRect.top - 8; // small padding
              container.scrollTo({ top: container.scrollTop + delta, behavior: 'smooth' });
            } else {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      }, 50);
    }
  }, [location.state]);

  // Full implementation for handleSendMessage
  const handleSendMessage = async () => {
    if (!input.trim()) return; // Use the existing input state for chat

    if (!threadId) {
      console.error("AddEvent: Cannot send message, threadId is null.");
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

    autoscrollFlagRef.current = true;

    const thinkingMessageId = 'thinking-addevent';
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
      console.error("Error sending message from AddEvent:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: generateUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  // Format a 24-hour time string like "16:30" to "04:30 PM" for display under Selected:
  const formatSelectedTime = (t: string): string => {
    if (!t) return '';
    const parts = t.split(':');
    if (parts.length !== 2) return t;
    const hhNum = parseInt(parts[0], 10);
    const mm = parts[1];
    if (isNaN(hhNum)) return t;
    const period = hhNum >= 12 ? 'PM' : 'AM';
    let hh12 = hhNum % 12;
    if (hh12 === 0) hh12 = 12;
    const hh = String(hh12).padStart(2, '0');
    return `${hh}:${mm} ${period}`;
  };

  // Input field styling from EditChild
  const inputWrapperBaseStyle: React.CSSProperties = {
    borderWidth: '1px',
    borderColor: '#c0e2e799',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    backgroundColor: 'white',
  };

  const inputElementStyle: React.CSSProperties = {
    width: '100%',
    paddingTop: '0.375rem',
    paddingBottom: '0.375rem',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.75rem',
    color: '#111827',
  };

  const textareaElementStyle: React.CSSProperties = {
    ...inputElementStyle,
    minHeight: '60px',
    resize: 'vertical' as const,
  };

  const getFocusStyle = (isFocused: boolean, isRequired: boolean): React.CSSProperties => {
    const nonFocusedBorderColor = '#c0e2e799';
    const nonFocusedBlurColor = 'rgba(192, 226, 231, 0.6)';
    const baseBorderWidth = '1px';
    const baseBorderStyle = 'solid';
    const nonFocusedBoxShadow = `0 0 2px 0 ${nonFocusedBlurColor}, 0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)`;

    if (isFocused) {
      const bottomBorderColorOnFocus = isRequired ? '#fbb6ce' : '#c0e2e7';
      const bottomGlowColor = isRequired ? 'rgba(251, 182, 206, 0.5)' : 'rgba(192, 226, 231, 0.5)';
      
      return {
        borderTopColor: nonFocusedBorderColor,
        borderRightColor: nonFocusedBorderColor,
        borderLeftColor: nonFocusedBorderColor,
        borderBottomColor: bottomBorderColorOnFocus,
        borderTopWidth: baseBorderWidth,
        borderRightWidth: baseBorderWidth,
        borderLeftWidth: baseBorderWidth,
        borderBottomWidth: '2px',
        borderStyle: baseBorderStyle,
        boxShadow: `${nonFocusedBoxShadow}, 0 2px 5px -1px ${bottomGlowColor}`,
      };
    }
    
    return {
      borderTopColor: nonFocusedBorderColor,
      borderRightColor: nonFocusedBorderColor,
      borderBottomColor: nonFocusedBorderColor,
      borderLeftColor: nonFocusedBorderColor,
      borderTopWidth: baseBorderWidth,
      borderRightWidth: baseBorderWidth,
      borderBottomWidth: baseBorderWidth,
      borderLeftWidth: baseBorderWidth,
      borderStyle: baseBorderStyle,
      boxShadow: nonFocusedBoxShadow,
    };
  };

  const toggleStyle = (isOn: boolean) => ({
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: isOn ? '#217e8f' : '#4b5563',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
  });

  const toggleKnobStyle = (isOn: boolean) => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'white',
    transform: isOn ? 'translateX(20px)' : 'translateX(0)',
    transition: 'transform 0.2s ease-in-out',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  });

  const handleSave = () => {
    if (!eventName.trim()) {
      alert("Please enter an event name");
      return;
    }
    if (!eventDate) {
      alert("Please select a date");
      return;
    }
    if (selectedChildren.length === 0) {
      alert("Please select at least one child");
      return;
    }
    const isRecurringNow = recurrenceFreq !== 'none';
    if (isRecurringNow) {
      if (!recurringSchedule.trim()) {
        alert("Please configure the recurrence rule");
      return;
      }
    }

    const eventData = {
      eventName: eventName.trim(),
      date: eventDate,
      recurring: isRecurringNow ? recurringSchedule.trim() : undefined,
      time: startTime ? startTime : undefined,
      location: addLocation && eventLocation ? eventLocation.trim() : undefined,
      childName: selectedChildren.length > 0 ? selectedChildren.join(', ') : undefined,
      notes: notes,
      contactName,
      phoneNumber,
      email,
      websiteUrl,
    };

    if (location.state?.isEdit && location.state?.eventIndex !== undefined) {
      updateEvent(location.state.eventIndex, eventData);
    } else {
      addEvent(eventData);
    }
    navigate('/add-event/confirmation', { state: { event: eventData } });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventDate(e.target.value);
  };

  const toggleChildSelection = (childName: string) => {
    setSelectedChildren(prev => 
      prev.includes(childName) 
        ? prev.filter(name => name !== childName)
        : [...prev, childName]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<CalendarPlus />}
        title={location.state?.isEdit ? "Edit Event" : "Add Event"}
        action={<SaveButton label={location.state?.isEdit ? "Update Event" : "Save Event"} onClick={handleSave} />}
      />
      <div
        ref={pageScrollRef}
        className="add-event-content-scroll bg-gray-50 flex-1 overflow-y-auto"
        style={{
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8}px`,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Essentials */}
          <Card>
          {/* Event Name */}
            <label id="eventName-section" htmlFor="eventName" className="text-sm font-medium text-gray-600 mb-2 block">Event Name</label>
            <div style={{...inputWrapperBaseStyle, ...getFocusStyle(eventNameFocused, true)}}>
              <input 
                type="text" 
                id="eventName" 
                ref={eventNameInputRef}
                style={inputElementStyle}
                placeholder="e.g. Soccer game, Dentist visit" 
                value={eventName} 
                className="placeholder-gray-400"
                onChange={(e) => setEventName(e.target.value)}
                onFocus={() => setEventNameFocused(true)}
                onBlur={() => setEventNameFocused(false)}
              />
          </div>

            {/* When */}
            <div id="date-section" className="mt-4">
              <span className="text-sm font-medium text-gray-600 mb-2 block">Date</span>
              {/* Date - large navigable tokens with chevrons (no popouts) */}
              <div className="mb-3">
                {(() => {
                  const setIsoIfComplete = (m: number, d: string, y: number) => {
                    const lastDay = new Date(y, m + 1, 0).getDate();
                    if (d && parseInt(d, 10) > lastDay) {
                      setDateDay('');
                    }
                    if (d) {
                      setEventDate(`${String(y)}-${String(m+1).padStart(2,'0')}-${d.padStart(2,'0')}`);
                    } else {
                      setEventDate('');
                    }
                  };
                  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  const decMonth = () => {
                    setDateMonth(m => {
                      const nm = (m + 11) % 12;
                      if (m === 0) setDateYear(y => y - 1);
                      setIsoIfComplete((m+11)%12, dateDay, m===0 ? dateYear-1 : dateYear);
                      return nm;
                    });
                  };
                  const incMonth = () => {
                    setDateMonth(m => {
                      const nm = (m + 1) % 12;
                      if (m === 11) setDateYear(y => y + 1);
                      setIsoIfComplete((m+1)%12, dateDay, m===11 ? dateYear+1 : dateYear);
                      return nm;
                    });
                  };
                  const lastDay = new Date(dateYear, dateMonth + 1, 0).getDate();
                  const ensureDaySet = () => {
                    if (!dateDay) setDateDay('01');
                  };
                  const decDay = () => {
                    ensureDaySet();
                    setDateDay(d => {
                      const cur = d ? parseInt(d,10) : 1;
                      const nd = cur <= 1 ? lastDay : cur - 1;
                      const s = String(nd).padStart(2,'0');
                      setIsoIfComplete(dateMonth, s, dateYear);
                      return s;
                    });
                  };
                  const incDay = () => {
                    ensureDaySet();
                    setDateDay(d => {
                      const cur = d ? parseInt(d,10) : 1;
                      const nd = cur >= lastDay ? 1 : cur + 1;
                      const s = String(nd).padStart(2,'0');
                      setIsoIfComplete(dateMonth, s, dateYear);
                      return s;
                    });
                  };
                  const decYear = () => { const ny = dateYear - 1; setDateYear(ny); setIsoIfComplete(dateMonth, dateDay, ny); };
                  const incYear = () => { const ny = dateYear + 1; setDateYear(ny); setIsoIfComplete(dateMonth, dateDay, ny); };

                  const groupStyle: React.CSSProperties = {
                    width: '115px',
                    height: '30px',
                    borderRadius: '6px',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    border: '2px solid #059669'
                  };
                  const chevronBtn = {
                    height: '100%',
                    paddingLeft: '6px',
                    paddingRight: '6px',
                    background: 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  } as React.CSSProperties;
                  const labelStyle = { flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#ffffff' } as React.CSSProperties;

                  const SWIPE_THRESHOLD = 24;
                  const handleSwipeStart = (group: 'month'|'day'|'year') => (e: any) => {
                    const x = e.touches ? e.touches[0].clientX : e.clientX;
                    setSwipe({ group, startX: x, step: 0, active: true });
                  };
                  const handleSwipeMove = (e: any) => {
                    if (!swipe.active) return;
                    const x = e.touches ? e.touches[0].clientX : e.clientX;
                    const dx = x - swipe.startX;
                    const count = Math.trunc(dx / SWIPE_THRESHOLD);
                    if (count === swipe.step) return;
                    const diff = count - swipe.step;
                    const apply = (fnInc: () => void, fnDec: () => void, n: number) => {
                      if (n > 0) { for (let i = 0; i < n; i++) fnInc(); }
                      else if (n < 0) { for (let i = 0; i < -n; i++) fnDec(); }
                    };
                    if (swipe.group === 'month') apply(incMonth, decMonth, diff);
                    else if (swipe.group === 'day') apply(incDay, decDay, diff);
                    else if (swipe.group === 'year') apply(incYear, decYear, diff);
                    setSwipe(prev => ({ ...prev, step: count }));
                  };
                  const handleSwipeEnd = () => setSwipe({ group: '', startX: 0, step: 0, active: false });

                  return (
                    <div className="flex justify-between gap-y-2 flex-wrap">
                      {/* Month group */}
                      <div style={groupStyle}
                        onMouseDown={handleSwipeStart('month')}
                        onMouseMove={handleSwipeMove}
                        onMouseUp={handleSwipeEnd}
                        onMouseLeave={handleSwipeEnd}
                        onTouchStart={handleSwipeStart('month')}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={handleSwipeEnd}
                      >
                        <button type="button" onClick={decMonth} style={chevronBtn}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >‹</button>
                        <div style={labelStyle}>{monthNames[dateMonth]}</div>
                        <button type="button" onClick={incMonth} style={chevronBtn}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >›</button>
              </div>
                      {/* Day group */}
                      <div style={groupStyle}
                        onMouseDown={handleSwipeStart('day')}
                        onMouseMove={handleSwipeMove}
                        onMouseUp={handleSwipeEnd}
                        onMouseLeave={handleSwipeEnd}
                        onTouchStart={handleSwipeStart('day')}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={handleSwipeEnd}
                      >
                        <button type="button" onClick={decDay} style={chevronBtn}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >‹</button>
                        <div style={labelStyle}>{dateDay ? dateDay.padStart(2,'0') : 'DD'}</div>
                        <button type="button" onClick={incDay} style={chevronBtn}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >›</button>
            </div>
                      {/* Year group */}
                      <div style={groupStyle}
                        onMouseDown={handleSwipeStart('year')}
                        onMouseMove={handleSwipeMove}
                        onMouseUp={handleSwipeEnd}
                        onMouseLeave={handleSwipeEnd}
                        onTouchStart={handleSwipeStart('year')}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={handleSwipeEnd}
                      >
                        <button type="button" onClick={decYear} style={chevronBtn}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >‹</button>
                        <div style={labelStyle}>{dateYear}</div>
                        <button type="button" onClick={incYear} style={chevronBtn}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >›</button>
          </div>
              </div>
                  );
                })()}
            </div>
              {/* Time keypad (compact, inline) */}
              <div id="time-section">
                <label className="text-sm font-medium text-gray-600">Time</label>
                <div className="mt-1">
                  <div className="flex gap-2">
                    {/* Hour */}
                    <div className="flex-1 min-w-[150px]">
                      <div className="grid grid-cols-6 gap-1 bg-[#c0e2e7] rounded-lg p-1 border border-[#217e8f]/20">
                        {Array.from({ length: 12 }, (_, i) => String(i+1)).map(h => (
                          <button
                            key={h}
                            onClick={() => {
                              const newHour = keypadHour===h ? '' : h;
                              setKeypadHour(newHour);
                              const hour = newHour;
                              const minute = keypadMinute;
                              const ampm = keypadAmPm;
                              if (hour && minute && ampm) {
                                const hh12 = hour.padStart(2,'0');
                                let hh = parseInt(hh12,10);
                                if (ampm==='PM' && hh<12) hh+=12;
                                if (ampm==='AM' && hh===12) hh=0;
                                setStartTime(`${String(hh).padStart(2,'0')}:${minute}`);
                              } else {
                                setStartTime('');
                              }
                            }}
                            className={`w-full h-8 flex items-center justify-center text-[13px] rounded-md font-semibold border-2 ${
                              keypadHour===h ? 'bg-[#2f8fa4] text-white border-[#217e8f]' : 'bg-white/80 text-[#217e8f] border-[#217e8f]/30'
                            }`}
                          >{h}</button>
                        ))}
              </div>
            </div>
                    {/* Minute */}
              <div>
                      <div className="grid grid-cols-2 gap-1 bg-[#c0e2e7] rounded-lg p-1 border border-[#217e8f]/20">
                        {['00','15','30','45'].map(m => (
                  <button
                            key={m}
                            onClick={() => {
                              const newMin = keypadMinute===m ? '' : m;
                              setKeypadMinute(newMin);
                              const hour = keypadHour;
                              const minute = newMin;
                              const ampm = keypadAmPm;
                              if (hour && minute && ampm) {
                                const hh12 = hour.padStart(2,'0');
                                let hh = parseInt(hh12,10);
                                if (ampm==='PM' && hh<12) hh+=12;
                                if (ampm==='AM' && hh===12) hh=0;
                                setStartTime(`${String(hh).padStart(2,'0')}:${minute}`);
                              } else {
                                setStartTime('');
                              }
                            }}
                            className={`h-8 flex items-center justify-center text-[13px] rounded-md font-semibold border-2 ${
                              keypadMinute===m ? 'bg-[#2f8fa4] text-white border-[#217e8f]' : 'bg-white/80 text-[#217e8f] border-[#217e8f]/30'
                            }`}
                            style={{ width: '40px' }}
                          >{m}</button>
                        ))}
                      </div>
                    </div>
                    {/* AM/PM */}
                    <div>
                      <div className="grid grid-cols-1 gap-1 bg-[#c0e2e7] rounded-lg p-1 border border-[#217e8f]/20">
                        {(['AM','PM'] as const).map(period => (
                          <button
                            key={period}
                            onClick={() => {
                              const newPeriod = keypadAmPm===period ? '' : period;
                              setKeypadAmPm(newPeriod);
                              const hour = keypadHour;
                              const minute = keypadMinute;
                              const ampm = newPeriod;
                              if (hour && minute && ampm) {
                                const hh12 = hour.padStart(2,'0');
                                let hh = parseInt(hh12,10);
                                if (ampm==='PM' && hh<12) hh+=12;
                                if (ampm==='AM' && hh===12) hh=0;
                                setStartTime(`${String(hh).padStart(2,'0')}:${minute}`);
                              } else {
                                setStartTime('');
                              }
                            }}
                            className={`h-8 flex items-center justify-center text-[13px] rounded-md font-semibold border-2 ${
                              keypadAmPm===period ? 'bg-[#2f8fa4] text-white border-[#217e8f]' : 'bg-white/80 text-[#217e8f] border-[#217e8f]/30'
                            }`}
                            style={{ width: '40px' }}
                          >{period}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {startTime && (
                    <div className="mt-2 text-xs text-gray-600">Selected: {formatSelectedTime(startTime)}</div>
                )}
                </div>
              </div>
              </div>

            {/* Who */}
            <div id="who-section" className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Child</span>
                {selectedChildren.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {selectedChildren.length === 1 
                      ? '1 child selected' 
                      : `${selectedChildren.length} children selected`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap justify-between gap-y-2">
                {children.map(child => {
                  const selected = selectedChildren.includes(child.name);
                  const baseColor = child.color || '#217e8f';
                  const faded = `color-mix(in srgb, ${baseColor} 60%, white)`;
                  const vibrantMap: Record<string,string> = {
                    '#f8b6c2': '#e91e63',
                    '#fbd3a2': '#ff6f00',
                    '#ffd8b5': '#ff6f00',
                    '#fde68a': '#ffc107',
                    '#bbf7d0': '#00c853',
                    '#c0e2e7': '#00bcd4',
                    '#d1d5fa': '#3f51b5',
                    '#e9d5ff': '#9c27b0',
                    '#217e8f': '#006064',
                  };
                  const vibrant = vibrantMap[baseColor] || `color-mix(in srgb, ${baseColor} 85%, black)`;
                  return (
                  <button
                      key={child.id}
                    type="button"
                      onClick={() => toggleChildSelection(child.name)}
                      className="text-[12px] font-semibold"
                      style={{
                        border: selected ? `2px solid ${vibrant}` : `0.5px solid color-mix(in srgb, ${baseColor} 75%, black)`,
                        borderRadius: '6px',
                        width: '115px',
                        height: '30px',
                        padding: '0px 0px',
                        lineHeight: '20px',
                        color: '#374151',
                        background: selected ? baseColor : faded,
                        boxShadow: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >{child.name}</button>
                  );
                })}
                {children.length === 0 && (
                  <p className="text-xs text-gray-500">No children profiles found. Add children in Profiles & Roles.</p>
                )}
              </div>
                </div>
                
            {/* Where */}
            <div id="location-section" className="mt-6">
              <label htmlFor="eventLocation" className="text-sm font-medium text-gray-600 mb-2 block">Location</label>
                    <div style={{...inputWrapperBaseStyle, ...getFocusStyle(eventLocationFocused, false)}}>
                      <input 
                        ref={eventLocationInputRef}
                        type="text" 
                        id="eventLocation" 
                        style={inputElementStyle}
                  placeholder="Search for location or enter address..." 
                        value={eventLocation} 
                        className="placeholder-gray-400"
                  onChange={async (e) => {
                    const q = e.target.value;
                    setEventLocation(q);
                    setOriginalLocQuery(q);
                    setAddLocation(!!q);
                    if (!q.trim()) { setLocResults([]); setSelectedLocString(''); return; }
                    setIsLocSearching(true);
                    try {
                      const results = await searchLocations(q);
                      setLocResults(results);
                    } finally {
                      setIsLocSearching(false);
                    }
                  }}
                        onFocus={async () => {
                          setEventLocationFocused(true);
                          const q = originalLocQuery.trim() ? originalLocQuery : eventLocation.trim();
                          if (q) {
                            if (originalLocQuery.trim()) {
                              setEventLocation(originalLocQuery);
                            }
                            setIsLocSearching(true);
                            try {
                              const results = await searchLocations(q);
                              setLocResults(results);
                            } finally {
                              setIsLocSearching(false);
                            }
                          }
                        }}
                        onBlur={() => {
                          setEventLocationFocused(false);
                          setIsLocSearching(false);
                          setLocResults([]);
                        }}
                      />
                    </div>
              {/* Search results list styled like Flow's New Location search */}
              {(isLocSearching || locResults.length > 0) && (
                <div className="mt-2 max-h-44 overflow-y-auto space-y-2">
                  {isLocSearching ? (
                    <div className="text-xs text-gray-500 text-center py-2">Searching...</div>
                  ) : (
                    locResults.map(result => {
                      const locString = formatLocationString(result);
                      const isSelected = selectedLocString === locString;
                      return (
                  <button
                          key={result.id}
                    type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onTouchStart={(e) => e.preventDefault()}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLocString('');
                              setEventLocation('');
                              setLocResults([]);
                            } else {
                              setEventLocation(locString);
                              setSelectedLocString(locString);
                              setLocResults([]);
                              setIsLocSearching(false);
                              if (eventLocationInputRef.current) {
                                eventLocationInputRef.current.blur();
                              }
                            }
                          }}
                          className={`w-full text-left px-2 py-2 rounded-md transition-all duration-200 ${
                            isSelected 
                              ? 'bg-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/25' 
                              : 'bg-white/60 hover:bg-white border border-gray-200'
                          }`}
                        >
                          <div className="text-[13px] font-medium text-[#217e8f]">{result.name}</div>
                          <div className="text-[13px] text-gray-600">{result.address}</div>
                  </button>
                      );
                    })
                  )}
                </div>
              )}
                </div>
                
            {/* Notes (embedded in this card) */}
            <div id="notes-section" className="mt-6">
              <label htmlFor="notes" className="text-sm font-medium text-gray-600 mb-2 block">Notes</label>
              <div className="border border-gray-200 rounded-md p-4 space-y-3 focus-within:ring-2 focus-within:ring-[#c0e2e7] focus-within:border-[#c0e2e7] transition-all">
                <textarea 
                  id="notes" 
                  placeholder="Add any notes about this event..." 
                  value={notes} 
                  className="w-full border-none outline-none resize-none text-gray-900 placeholder-gray-400"
                  rows={3}
                  onChange={(e) => setNotes(e.target.value)}
                  onFocus={() => setNotesFocused(true)}
                  onBlur={() => setNotesFocused(false)}
                />
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0">Contact:</span>
                        <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Contact name..."
                      className="flex-1 border-none outline-none text-sm text-gray-600 placeholder-gray-300 bg-transparent"
                    />
                    </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0">Phone:</span>
                            <input 
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone number..."
                      className="flex-1 border-none outline-none text-sm text-gray-600 placeholder-gray-300 bg-transparent"
                            />
                          </div>
                <div className="flex items-center">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0">Email:</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="flex-1 border-none outline-none text-sm text-gray-600 placeholder-gray-300 bg-transparent"
                    />
                </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm w-20 flex-shrink-0">Website:</span>
                        <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 border-none outline-none text-sm text-gray-600 placeholder-gray-300 bg-transparent"
                    />
                  </div>
              </div>
            </div>
          </div>
          </Card>


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
        onSend={handleSendMessage} // Connect send handler
      />
    </div>
  );
} 