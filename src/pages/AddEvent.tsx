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
import { CalendarPlus } from "lucide-react";
import { format } from 'date-fns';

const AddEventIcon = () => {
  const styles = {
    Icon: {
      color: 'rgba(185,17,66,0.75)',
      fill: 'rgba(185,17,66,0.75)',
      fontSize: '16px',
      width: '16px',
      height: '16px',
    },
  };
  return (
    <svg style={styles.Icon} viewBox="0 0 24 24">
      <path d="M0 0h24v24H0z" fill="none"></path>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
    </svg>
  );
};

const SaveButton = (props: { label?: string; onClick?: () => void }) => {
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
  const [mainContentDrawerOffset, setMainContentDrawerOffset] = useState(44);
  const [mainContentTopClearance, setMainContentTopClearance] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(0);
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

  // Form state
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState<'oneTime' | 'recurring'>('oneTime');
  const [recurringSchedule, setRecurringSchedule] = useState("");
  const [addTime, setAddTime] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [addReminder, setAddReminder] = useState(false);
  const [reminderType, setReminderType] = useState<'dueDate' | 'alertBefore'>('dueDate');
  const [reminderDate, setReminderDate] = useState("");
  const [alertBefore, setAlertBefore] = useState("1 day before");
  const [addLocation, setAddLocation] = useState(false);
  const [eventLocation, setEventLocation] = useState("");
  const [specifyChild, setSpecifyChild] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Focus states
  const [eventNameFocused, setEventNameFocused] = useState(false);
  const [eventDateFocused, setEventDateFocused] = useState(false);
  const [startTimeFocused, setStartTimeFocused] = useState(false);
  const [endTimeFocused, setEndTimeFocused] = useState(false);
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
    children,
  } = useKicacoStore();

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
    // Always enable scrolling when drawer is minimized
    setMainContentScrollOverflow('auto');
  }, []); // Run only on mount

  useLayoutEffect(() => {
    function updateSubheaderBottom() {
      if (subheaderRef.current) {
        setSubheaderBottom(subheaderRef.current.getBoundingClientRect().bottom);
      }
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
      setMainContentScrollOverflow('auto');
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
  }, [mainContentDrawerOffset, addTime, addReminder, addLocation, specifyChild]);

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

  // Pre-fill date from location state
  useEffect(() => {
    if (location.state?.date) {
      setEventDate(location.state.date);
    }
  }, [location.state]);

  // Full implementation for handleSendMessage
  const handleSendMessage = async () => {
    if (!input.trim()) return; // Use the existing input state for chat

    if (!threadId) {
      console.error("AddEvent: Cannot send message, threadId is null.");
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
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: assistantResponseText,
      });
    } catch (error) {
      console.error("Error sending message from AddEvent:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
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
    if (eventType === 'oneTime' && !eventDate) {
      alert("Please select a date");
      return;
    }
    if (eventType === 'recurring' && !recurringSchedule.trim()) {
      alert("Please enter a recurring schedule");
      return;
    }

    const newEvent = {
      eventName: eventName.trim(),
      date: eventType === 'oneTime' ? eventDate : undefined,
      recurring: eventType === 'recurring' ? recurringSchedule.trim() : undefined,
      time: addTime && startTime ? startTime : undefined,
      location: addLocation && eventLocation ? eventLocation.trim() : undefined,
      childName: specifyChild && selectedChildren.length > 0 ? selectedChildren.join(', ') : undefined,
      notes: notes,
    };

    addEvent(newEvent);
    navigate(-1); // Go back to previous page
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
    <div className="flex flex-col h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<CalendarPlus />}
        title="Add Event"
        action={<SaveButton label="Save Event" onClick={handleSave} />}
      />
      <div
        ref={pageScrollRef}
        className="add-event-content-scroll bg-gray-50 overflow-y-auto"
        style={{
          position: 'absolute',
          top: subheaderBottom + 8,
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8,
          left: 0,
          right: 0,
          WebkitOverflowScrolling: 'touch',
          overflowY: 'auto',
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Event Name */}
          <div className="mb-6">
            <label htmlFor="eventName" className="text-sm font-medium text-gray-600 mb-2 block">Event Name</label>
            <div style={{...inputWrapperBaseStyle, ...getFocusStyle(eventNameFocused, true)}}>
              <input 
                type="text" 
                name="eventName" 
                id="eventName" 
                style={inputElementStyle}
                placeholder="e.g. soccer game, dentist visit" 
                value={eventName} 
                className="placeholder-gray-400"
                onChange={(e) => setEventName(e.target.value)}
                onFocus={() => setEventNameFocused(true)}
                onBlur={() => setEventNameFocused(false)}
              />
            </div>
          </div>

          {/* Event Type */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Event type</label>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="eventType"
                    value="oneTime"
                    checked={eventType === 'oneTime'}
                    onChange={() => setEventType('oneTime')}
                    className="mr-2 text-[#217e8f] focus:ring-[#217e8f] focus:ring-offset-0"
                    style={{ accentColor: '#217e8f' }}
                  />
                  <span className="text-sm text-gray-700">One-time event</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="eventType"
                    value="recurring"
                    checked={eventType === 'recurring'}
                    onChange={() => setEventType('recurring')}
                    className="mr-2 text-[#217e8f] focus:ring-[#217e8f] focus:ring-offset-0"
                    style={{ accentColor: '#217e8f' }}
                  />
                  <span className="text-sm text-gray-700">Recurring schedule</span>
                </label>
              </div>
            </div>
          </div>

          {/* Conditional Date or Recurring Schedule */}
          {eventType === 'recurring' && (
            <div className="mb-6">
              <label htmlFor="recurringSchedule" className="text-sm font-medium text-gray-600 mb-2 block">Recurring schedule</label>
              <div style={{...inputWrapperBaseStyle, ...getFocusStyle(false, false)}}>
                <input 
                  type="text" 
                  name="recurringSchedule" 
                  id="recurringSchedule" 
                  style={inputElementStyle}
                  placeholder="e.g. Every Friday, Last day of the month" 
                  value={recurringSchedule}
                  onChange={(e) => setRecurringSchedule(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Date */}
          {eventType === 'oneTime' && (
            <div className="mb-6">
              <label htmlFor="eventDate" className="text-sm font-medium text-gray-600 mb-2 block">Date</label>
              <div style={{...inputWrapperBaseStyle, ...getFocusStyle(eventDateFocused, true)}}>
                <input 
                  type="date" 
                  name="eventDate" 
                  id="eventDate" 
                  style={{
                    ...inputElementStyle,
                    color: eventDate ? '#111827' : '#6b7280',
                    WebkitTextFillColor: eventDate ? '#111827' : '#6b7280',
                    opacity: 1,
                  }}
                  placeholder="mm/dd/yyyy"
                  value={eventDate} 
                  onChange={handleDateChange}
                  onFocus={() => setEventDateFocused(true)}
                  onBlur={() => setEventDateFocused(false)}
                />
              </div>
            </div>
          )}

          {/* Optional Settings */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Optional settings</label>
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              {/* Add Time Toggle */}
              <div>
                <div className="flex items-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={addTime}
                    aria-label="Add event time"
                    onClick={() => setAddTime(!addTime)}
                    style={toggleStyle(addTime)}
                  >
                    <span style={toggleKnobStyle(addTime)} />
                  </button>
                  <span className="text-sm text-gray-700 cursor-pointer ml-3" onClick={() => setAddTime(!addTime)}>
                    Add event time?
                  </span>
                </div>
                
                {addTime && (
                  <div className="mt-3 ml-[56px] flex gap-3">
                    <div className="flex-1">
                      <label htmlFor="startTime" className="text-xs font-medium text-gray-600">Start Time</label>
                      <div style={{...inputWrapperBaseStyle, ...getFocusStyle(startTimeFocused, false)}} className="mt-1">
                        <input 
                          type="time" 
                          name="startTime" 
                          id="startTime" 
                          style={{
                            ...inputElementStyle,
                            color: startTime ? '#111827' : '#6b7280',
                            WebkitTextFillColor: startTime ? '#111827' : '#6b7280',
                            opacity: 1,
                          }}
                          placeholder="9:00 AM"
                          value={startTime} 
                          onChange={(e) => setStartTime(e.target.value)}
                          onFocus={() => setStartTimeFocused(true)}
                          onBlur={() => setStartTimeFocused(false)}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="endTime" className="text-xs font-medium text-gray-600">End Time</label>
                      <div style={{...inputWrapperBaseStyle, ...getFocusStyle(endTimeFocused, false)}} className="mt-1">
                        <input 
                          type="time" 
                          name="endTime" 
                          id="endTime" 
                          style={{
                            ...inputElementStyle,
                            color: endTime ? '#111827' : '#6b7280',
                            WebkitTextFillColor: endTime ? '#111827' : '#6b7280',
                            opacity: 1,
                          }}
                          placeholder="10:00 AM"
                          value={endTime} 
                          onChange={(e) => setEndTime(e.target.value)}
                          onFocus={() => setEndTimeFocused(true)}
                          onBlur={() => setEndTimeFocused(false)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Location Toggle */}
              <div>
                <div className="flex items-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={addLocation}
                    aria-label="Add a location"
                    onClick={() => setAddLocation(!addLocation)}
                    style={toggleStyle(addLocation)}
                  >
                    <span style={toggleKnobStyle(addLocation)} />
                  </button>
                  <span className="text-sm text-gray-700 cursor-pointer ml-3" onClick={() => setAddLocation(!addLocation)}>
                    Add a location?
                  </span>
                </div>
                
                {addLocation && (
                  <div className="mt-3 ml-[56px]">
                    <div style={{...inputWrapperBaseStyle, ...getFocusStyle(eventLocationFocused, false)}}>
                      <input 
                        type="text" 
                        name="eventLocation" 
                        id="eventLocation" 
                        style={inputElementStyle}
                        placeholder="e.g. Heatherwood field, Dentist office" 
                        value={eventLocation} 
                        className="placeholder-gray-400"
                        onChange={(e) => setEventLocation(e.target.value)}
                        onFocus={() => setEventLocationFocused(true)}
                        onBlur={() => setEventLocationFocused(false)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Add Reminder Toggle */}
              <div>
                <div className="flex items-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={addReminder}
                    aria-label="Add a reminder"
                    onClick={() => setAddReminder(!addReminder)}
                    style={toggleStyle(addReminder)}
                  >
                    <span style={toggleKnobStyle(addReminder)} />
                  </button>
                  <span className="text-sm text-gray-700 cursor-pointer ml-3" onClick={() => setAddReminder(!addReminder)}>
                    Add a reminder?
                  </span>
                </div>
                
                {addReminder && (
                  <div className="mt-3 ml-[56px]">
                    <div className="flex gap-3 mb-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="reminderType"
                          value="dueDate"
                          checked={reminderType === 'dueDate'}
                          onChange={(e) => setReminderType('dueDate')}
                          className="mr-2 text-[#217e8f] focus:ring-[#217e8f] focus:ring-offset-0"
                          style={{ accentColor: '#217e8f' }}
                        />
                        <span className="text-sm text-gray-700">Due date</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="reminderType"
                          value="alertBefore"
                          checked={reminderType === 'alertBefore'}
                          onChange={(e) => setReminderType('alertBefore')}
                          className="mr-2 text-[#217e8f] focus:ring-[#217e8f] focus:ring-offset-0"
                          style={{ accentColor: '#217e8f' }}
                        />
                        <span className="text-sm text-gray-700">Alert before</span>
                      </label>
                    </div>
                    
                    <div>
                      {reminderType === 'dueDate' ? (
                        <div>
                          <div style={{...inputWrapperBaseStyle, ...getFocusStyle(reminderDateFocused, false)}}>
                            <input 
                              type="date" 
                              name="reminderDate" 
                              id="reminderDate" 
                              style={{
                                ...inputElementStyle,
                                color: reminderDate ? '#111827' : '#6b7280',
                                WebkitTextFillColor: reminderDate ? '#111827' : '#6b7280',
                                opacity: 1,
                              }}
                              value={reminderDate} 
                              onChange={(e) => setReminderDate(e.target.value)}
                              onFocus={() => setReminderDateFocused(true)}
                              onBlur={() => setReminderDateFocused(false)}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">e.g. Return form by 10/25</p>
                        </div>
                      ) : (
                        <select 
                          value={alertBefore} 
                          onChange={(e) => setAlertBefore(e.target.value)}
                          style={{...inputElementStyle, ...inputWrapperBaseStyle}}
                          className="text-gray-700"
                        >
                          <option value="15 minutes before">15 minutes before</option>
                          <option value="30 minutes before">30 minutes before</option>
                          <option value="1 hour before">1 hour before</option>
                          <option value="1 day before">1 day before</option>
                          <option value="2 days before">2 days before</option>
                          <option value="1 week before">1 week before</option>
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Specify Child Toggle */}
              <div>
                <div className="flex items-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={specifyChild}
                    aria-label="Specify which child"
                    onClick={() => setSpecifyChild(!specifyChild)}
                    style={toggleStyle(specifyChild)}
                  >
                    <span style={toggleKnobStyle(specifyChild)} />
                  </button>
                  <span className="text-sm text-gray-700 cursor-pointer ml-3" onClick={() => setSpecifyChild(!specifyChild)}>
                    Specify which child?
                  </span>
                </div>
                <p className="text-xs text-gray-500 ml-[56px] mt-1">*Unnecessary for single child homes</p>
                
                {specifyChild && (
                  <div className="mt-3 ml-[56px] space-y-2">
                    {children.map(child => (
                      <label key={child.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedChildren.includes(child.name)}
                          onChange={() => toggleChildSelection(child.name)}
                          className="mr-2 text-[#217e8f] focus:ring-[#217e8f] focus:ring-offset-0 rounded"
                          style={{ accentColor: '#217e8f' }}
                        />
                        <span className="text-sm text-gray-700">{child.name}</span>
                      </label>
                    ))}
                    {children.length === 0 && (
                      <p className="text-xs text-gray-500">No children profiles found. Add children in Profiles & Roles.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="text-sm font-medium text-gray-600 mb-2 block">Add to notes (optional)</label>
            <div style={{...inputWrapperBaseStyle, ...getFocusStyle(notesFocused, false)}}>
              <textarea 
                name="notes" 
                id="notes" 
                style={textareaElementStyle}
                placeholder="Anything else? Invite info, what to bring, etc." 
                value={notes} 
                className="placeholder-gray-400"
                onChange={(e) => setNotes(e.target.value)}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
              />
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
        onSend={handleSendMessage} // Connect send handler
      />
    </div>
  );
} 