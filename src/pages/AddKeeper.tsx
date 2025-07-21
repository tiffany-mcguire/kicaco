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
import { BellPlus } from "lucide-react";

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

export default function AddKeeper() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const location = useLocation();
  
  // Check if we're in edit mode
  const isEdit = location.state?.isEdit || false;
  const keeperToEdit = location.state?.keeper;
  const keeperIndex = location.state?.keeperIndex;
  const dateFromCalendar = location.state?.date;

  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);

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

  // Form state - initialize with keeper data if in edit mode, or date from calendar
  const [keeperName, setKeeperName] = useState(isEdit && keeperToEdit ? keeperToEdit.keeperName : "");
  const [dueDate, setDueDate] = useState(
    isEdit && keeperToEdit 
      ? keeperToEdit.date || "" 
      : dateFromCalendar || ""
  );
  const [reminderType, setReminderType] = useState<'deadline' | 'recurring'>('deadline');
  const [recurringSchedule, setRecurringSchedule] = useState("");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [addTime, setAddTime] = useState(isEdit && keeperToEdit && keeperToEdit.time ? true : false);
  const [dueTime, setDueTime] = useState(isEdit && keeperToEdit ? keeperToEdit.time || "" : "");
  const [addLocation, setAddLocation] = useState(isEdit && keeperToEdit && keeperToEdit.location ? true : false);
  const [keeperLocation, setKeeperLocation] = useState(isEdit && keeperToEdit ? keeperToEdit.location || "" : "");
  const [specifyChild, setSpecifyChild] = useState(isEdit && keeperToEdit && keeperToEdit.childName ? true : false);
  const [selectedChildren, setSelectedChildren] = useState<string[]>(
    isEdit && keeperToEdit && keeperToEdit.childName 
      ? keeperToEdit.childName.split(', ').filter((name: string) => name.trim())
      : []
  );
  const [description, setDescription] = useState(isEdit && keeperToEdit ? keeperToEdit.description || "" : "");

  // Focus states
  const [keeperNameFocused, setKeeperNameFocused] = useState(false);
  const [dueDateFocused, setDueDateFocused] = useState(false);
  const [recurringScheduleFocused, setRecurringScheduleFocused] = useState(false);
  const [dueTimeFocused, setDueTimeFocused] = useState(false);
  const [keeperLocationFocused, setKeeperLocationFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);

  const {
    messages,
    threadId,
    addMessage,
    removeMessageById,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
    addKeeper,
    updateKeeper,
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
  }, [mainContentDrawerOffset, addTime, addLocation, specifyChild, reminderType]);

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
      console.error("AddKeeper: Cannot send message, threadId is null.");
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

    const thinkingMessageId = 'thinking-addkeeper';
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
      console.error("Error sending message from AddKeeper:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: generateUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  // Input field styling
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

  // Add date picker styling
  const dateInputStyle: React.CSSProperties = {
    ...inputElementStyle,
    color: dueDate ? '#111827' : '#6b7280',
    WebkitTextFillColor: dueDate ? '#111827' : '#6b7280',
    opacity: 1,
    colorScheme: 'light',
  };

  const textareaElementStyle: React.CSSProperties = {
    ...inputElementStyle,
    minHeight: '80px',
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
    if (!keeperName.trim()) {
      alert("Please enter a keeper name");
      return;
    }
    if (!dueDate && reminderType === 'deadline') {
      alert("Please select a due date");
      return;
    }

    const keeperData = {
      keeperName: keeperName.trim(),
      date: dueDate,
      time: addTime && dueTime ? dueTime : undefined,
      location: addLocation && keeperLocation ? keeperLocation.trim() : undefined,
      childName: specifyChild && selectedChildren.length > 0 ? selectedChildren.join(', ') : undefined,
      description: description.trim() || undefined,
    };

    if (isEdit && updateKeeper && keeperIndex !== undefined) {
      console.log('Updating keeper:', keeperData);
      updateKeeper(keeperIndex, keeperData);
      console.log('Keeper updated, navigating to /keepers');
    } else if (addKeeper) {
      console.log('Adding keeper:', keeperData);
      addKeeper(keeperData);
      console.log('Keeper added, navigating to /keepers');
    } else {
      console.error("addKeeper/updateKeeper function is not defined");
    }
    navigate('/keepers');
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
        icon={<BellPlus />}
        title={isEdit ? "Edit Keeper" : "Add Keeper"}
        action={<SaveButton label={isEdit ? "Update Keeper" : "Save Keeper"} onClick={handleSave} />}
      />
      <div
        ref={pageScrollRef}
                  className="add-keeper-content-scroll bg-gray-50 flex-1 overflow-y-auto"
        style={{
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8}px`,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Keeper Name */}
          <div className="mb-6">
            <label htmlFor="keeperName" className="text-sm font-medium text-gray-600 mb-2 block">What needs keeping track of?</label>
            <div style={{...inputWrapperBaseStyle, ...getFocusStyle(keeperNameFocused, true)}}>
              <input 
                type="text" 
                name="keeperName" 
                id="keeperName" 
                style={inputElementStyle}
                placeholder="e.g. Schedule dentist visit, Vaccine due, Return library books" 
                value={keeperName} 
                className="placeholder-gray-400"
                onChange={(e) => setKeeperName(e.target.value)}
                onFocus={() => setKeeperNameFocused(true)}
                onBlur={() => setKeeperNameFocused(false)}
              />
            </div>
          </div>

          {/* Reminder Type -> Changed to Keeper type */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Keeper type</label>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reminderType"
                    value="deadline"
                    checked={reminderType === 'deadline'}
                                                onChange={() => setReminderType('deadline')}
                    className="mr-2 text-[#217e8f] focus:ring-[#217e8f] focus:ring-offset-0"
                    style={{ accentColor: '#217e8f' }}
                  />
                  <span className="text-sm text-gray-700">One-time deadline</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reminderType"
                    value="recurring"
                    checked={reminderType === 'recurring'}
                                                onChange={() => setReminderType('recurring')}
                    className="mr-2 text-[#217e8f] focus:ring-[#217e8f] focus:ring-offset-0"
                    style={{ accentColor: '#217e8f' }}
                  />
                  <span className="text-sm text-gray-700">Recurring schedule</span>
                </label>
              </div>
            </div>
          </div>

          {/* Due Date or Recurring Schedule */}
          {reminderType === 'deadline' ? (
            <div className="mb-6">
              <label htmlFor="dueDate" className="text-sm font-medium text-gray-600 mb-2 block">Due date</label>
              <div style={{...inputWrapperBaseStyle, ...getFocusStyle(dueDateFocused, true)}}>
                <input 
                  type="date" 
                  name="dueDate" 
                  id="dueDate" 
                  style={dateInputStyle}
                  placeholder="mm/dd/yyyy"
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  onFocus={() => setDueDateFocused(true)}
                  onBlur={() => setDueDateFocused(false)}
                />
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label htmlFor="recurringSchedule" className="text-sm font-medium text-gray-600 mb-2 block">Recurring schedule</label>
              <div style={{...inputWrapperBaseStyle, ...getFocusStyle(recurringScheduleFocused, false)}}>
                <input 
                  type="text" 
                  name="recurringSchedule" 
                  id="recurringSchedule" 
                  style={inputElementStyle}
                  placeholder="e.g. Every 6 months, Every 3 weeks, Monthly" 
                  value={recurringSchedule} 
                  className="placeholder-gray-400"
                  onChange={(e) => setRecurringSchedule(e.target.value)}
                  onFocus={() => setRecurringScheduleFocused(true)}
                  onBlur={() => setRecurringScheduleFocused(false)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">We'll remind you based on this schedule</p>
            </div>
          )}

          {/* Priority Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Priority</label>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('high')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    priority === 'high'
                      ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  High
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('medium')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('low')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    priority === 'low'
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Low
                </button>
              </div>
            </div>
          </div>

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
                    aria-label="Add specific time"
                    onClick={() => setAddTime(!addTime)}
                    style={toggleStyle(addTime)}
                  >
                    <span style={toggleKnobStyle(addTime)} />
                  </button>
                  <span className="text-sm text-gray-700 cursor-pointer ml-3" onClick={() => setAddTime(!addTime)}>
                    Add specific time?
                  </span>
                </div>
                
                {addTime && (
                  <div className="mt-3 ml-[56px]">
                    <div style={{...inputWrapperBaseStyle, ...getFocusStyle(dueTimeFocused, false)}}>
                      <input 
                        type="time" 
                        name="dueTime" 
                        id="dueTime" 
                        style={{
                          ...inputElementStyle,
                          color: dueTime ? '#111827' : '#6b7280',
                          WebkitTextFillColor: dueTime ? '#111827' : '#6b7280',
                          opacity: 1,
                        }}
                        placeholder="12:00 PM"
                        value={dueTime} 
                        onChange={(e) => setDueTime(e.target.value)}
                        onFocus={() => setDueTimeFocused(true)}
                        onBlur={() => setDueTimeFocused(false)}
                      />
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
                    <div style={{...inputWrapperBaseStyle, ...getFocusStyle(keeperLocationFocused, false)}}>
                      <input 
                        type="text" 
                        name="keeperLocation" 
                        id="keeperLocation" 
                        style={inputElementStyle}
                        placeholder="e.g. Dr. Smith's office, Library, Pharmacy" 
                        value={keeperLocation} 
                        className="placeholder-gray-400"
                        onChange={(e) => setKeeperLocation(e.target.value)}
                        onFocus={() => setKeeperLocationFocused(true)}
                        onBlur={() => setKeeperLocationFocused(false)}
                      />
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

          {/* Description/Notes */}
          <div className="mb-6">
            <label htmlFor="description" className="text-sm font-medium text-gray-600 mb-2 block">Additional details (optional)</label>
            <div style={{...inputWrapperBaseStyle, ...getFocusStyle(descriptionFocused, false)}}>
              <textarea 
                name="description" 
                id="description" 
                style={textareaElementStyle}
                placeholder="Any specific instructions, phone numbers, or notes..." 
                value={description} 
                className="placeholder-gray-400"
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setDescriptionFocused(true)}
                onBlur={() => setDescriptionFocused(false)}
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