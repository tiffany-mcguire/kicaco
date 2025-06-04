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

const EditChildIcon = () => {
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
    <svg style={styles.Icon} viewBox="0 0 384 512">
      <path d="M352 448H32c-17.69 0-32 14.31-32 32s14.31 31.1 32 31.1h320c17.69 0 32-14.31 32-31.1S369.7 448 352 448zM48 208H160v111.1c0 17.69 14.31 31.1 32 31.1s32-14.31 32-31.1V208h112c17.69 0 32-14.32 32-32.01s-14.31-31.99-32-31.99H224v-112c0-17.69-14.31-32.01-32-32.01S160 14.33 160 32.01v112H48c-17.69 0-32 14.31-32 31.99S30.31 208 48 208z"></path>
    </svg>
  );
};

const UpdateChildButton = (props: { label?: string }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const getButtonStyle = () => {
    let s = {
      width: '140px', // Match all other custom buttons
      height: '30px',
      padding: '0px 8px',
      border: '1px solid #c0e2e7',
      boxSizing: 'border-box' as const,
      borderRadius: '6px',
      fontFamily: 'Nunito',
      fontWeight: 600,
      fontSize: '14px',
      lineHeight: '20px',
      boxShadow: '-2px 2px 0px rgba(0,0,0,0.25)',
      background: '#fff',
      color: '#217e8f',
      outline: 'none',
      borderColor: '#c0e2e7',
      transition: 'transform 0.08s cubic-bezier(.4,1,.3,1), box-shadow 0.18s cubic-bezier(.4,1,.3,1), border-color 0.18s cubic-bezier(.4,1,.3,1)',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        boxShadow: '0 0 16px 4px #c0e2e7aa, -2px 2px 0px rgba(0,0,0,0.25)',
        borderColor: '#c0e2e7',
        outline: 'none',
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)', boxShadow: '0 0 16px 4px #c0e2e7aa, -2px 2px 0px rgba(0,0,0,0.25)', borderColor: '#c0e2e7' };
    }
    s.outline = 'none';
    return s;
  };

  // No action yet
  const handleClick = () => {};

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
      className="transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95 active:shadow-[0_0_16px_4px_#c0e2e7aa,-2px_2px_0px_rgba(0,0,0,0.15)]"
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(true); }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(false); }}
    >
      {props.label ?? 'Update Child'}
    </button>
  );
};

// Copied from ChatDefaults.tsx for the toggle button styling
const toggleStyle = (isOn: boolean) => ({
  width: '44px',
  height: '24px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  padding: '2px',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  backgroundColor: isOn ? '#c0e2e7' : '#e0e0e0', // Kicaco blue for ON state
  boxShadow: isOn 
    ? 'inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)'
    : 'inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)',
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

export default function EditChild() {
  const [input, setInput] = useState("");
  const location = useLocation();
  const headerRef = React.useRef<HTMLDivElement>(null);
  const subheaderRef = React.useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLDivElement>(null);
  const pageScrollRef = React.useRef<HTMLDivElement>(null);
  const [mainContentDrawerOffset, setMainContentDrawerOffset] = useState(44);
  const [mainContentTopClearance, setMainContentTopClearance] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [mainContentScrollOverflow, setMainContentScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);
  const [scrollRefReady, setScrollRefReady] = useState(false);
  const internalChatContentScrollRef = React.useRef<HTMLDivElement | null>(null);
  const messagesContentRef = React.useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const mutationObserverRef = React.useRef<MutationObserver | null>(null);
  const autoscrollFlagRef = React.useRef(false);
  const previousMessagesLengthRef = React.useRef(0);
  const firstEffectRunAfterLoadRef = React.useRef(true);

  const {
    messages,
    threadId,
    addMessage,
    removeMessageById,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
  } = useKicacoStore();

  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  // New state for EditChild form fields
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [nickname, setNickname] = useState("");
  const [school, setSchool] = useState("");
  const [splitTimeSchedulingEnabled, setSplitTimeSchedulingEnabled] = useState(false);
  const [generalSchedule, setGeneralSchedule] = useState("");
  const [firstDayOfCycle, setFirstDayOfCycle] = useState("");

  // Focus states for input fields
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const [nicknameFocused, setNicknameFocused] = useState(false);
  const [schoolFocused, setSchoolFocused] = useState(false);
  const [generalScheduleFocused, setGeneralScheduleFocused] = useState(false);
  const [firstDayOfCycleFocused, setFirstDayOfCycleFocused] = useState(false);

  const handleGlobalDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
    
    setMainContentDrawerOffset(height);
    setMainContentTopClearance(window.innerHeight - height);
  };

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
        setMaxDrawerHeight(Math.max(32, availableHeight));
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
    if (mainContentDrawerOffset > 32 + 8) {
      setMainContentScrollOverflow('auto');
    } else {
      setMainContentScrollOverflow('hidden');
    }
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
      console.error("EditChild: Cannot send message, threadId is null.");
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

    const thinkingMessageId = 'thinking-editchild';
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
      console.error("Error sending message from EditChild:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  // Base style for the input WRAPPER
  const inputWrapperBaseStyle: React.CSSProperties = {
    borderWidth: '1px',
    borderColor: '#c0e2e799', // Changed from #d1d5db to card/profilesRoles input border color
    borderRadius: '0.5rem', // Tailwind rounded-lg
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)', // Lift shadow
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  };
  // Style for the inner INPUT element
  const inputElementStyle: React.CSSProperties = {
    width: '100%',
    paddingTop: '0.375rem', // py-1.5
    paddingBottom: '0.375rem', // py-1.5
    paddingLeft: '0.75rem', // px-3
    paddingRight: '0.75rem', // px-3
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.75rem', // Changed from '0.875rem' (text-sm) to text-xs
    color: '#111827', // Changed from #9ca3af (text-gray-400) to text-gray-900 for typed text
  };

  const getFocusStyle = (isFocused: boolean, isRequired: boolean): React.CSSProperties => {
    const nonFocusedBorderColor = '#c0e2e799';                     // Card border color C0E2E7 at 60% opacity
    const nonFocusedBlurColor = 'rgba(192, 226, 231, 0.6)';       // #c0e2e7 at 60% opacity for shadow blur

    const baseBorderWidth = '1px';
    const baseBorderStyle = 'solid';

    const nonFocusedBoxShadow = `0 0 2px 0 ${nonFocusedBlurColor}, 0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)`;

    if (isFocused) {
      const bottomBorderColorOnFocus = isRequired ? '#fbb6ce' : '#c0e2e7'; // Pink for required, Blue for optional (this is for the 2px bottom border)
      const bottomGlowColor = isRequired ? 'rgba(251, 182, 206, 0.5)' : 'rgba(192, 226, 231, 0.5)'; // Pink or Blue glow
      
      return {
        borderTopColor: nonFocusedBorderColor,    // Keep non-focused color
        borderRightColor: nonFocusedBorderColor,   // Keep non-focused color
        borderLeftColor: nonFocusedBorderColor,    // Keep non-focused color
        borderBottomColor: bottomBorderColorOnFocus,     
        borderTopWidth: baseBorderWidth,
        borderRightWidth: baseBorderWidth,
        borderLeftWidth: baseBorderWidth,
        borderBottomWidth: '2px',
        borderStyle: baseBorderStyle,
        boxShadow: `${nonFocusedBoxShadow}, 0 2px 5px -1px ${bottomGlowColor}`,
      };
    }
    
    // When not focused:
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
  
  const labelClass = "block text-sm font-medium text-teal-700";
  const helperTextClass = "mt-1 text-xs text-gray-500";
  const sectionTitleClass = "text-lg font-medium text-teal-700";

  return (
    <div className="flex flex-col h-screen bg-white">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<EditChildIcon />}
        title="Edit Child"
        frameColor="#2e8b57"
        frameOpacity={0.25}
        action={<UpdateChildButton />}
      />
      <div
        ref={pageScrollRef}
        className="edit-child-content-scroll bg-white"
        style={{
          position: 'absolute',
          top: subheaderBottom + 8,
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8,
          left: 0,
          right: 0,
          overflowY: mainContentScrollOverflow,
          transition: 'top 0.2s, bottom 0.2s',
          paddingTop: '0.5rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingBottom: '1.5rem',
        }}
      >
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <h2 className={sectionTitleClass}>Child Profile</h2>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="fullName" className={labelClass}>Full name</label>
              <div style={{...inputWrapperBaseStyle, ...getFocusStyle(fullNameFocused, true)}} className="mt-1">
                <input 
                  type="text" name="fullName" id="fullName" 
                  style={inputElementStyle}
                  placeholder="e.g. Olivia Martin" value={fullName} 
                  className="placeholder-gray-400"
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setFullNameFocused(true)}
                  onBlur={() => setFullNameFocused(false)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="dob" className={labelClass}>Date of birth</label>
              <div style={{...inputWrapperBaseStyle, ...getFocusStyle(dobFocused, true)}} className="mt-1">
                <input 
                  type="text" name="dob" id="dob" 
                  style={inputElementStyle}
                  placeholder="MM/DD/YYYY" value={dob} 
                  className="placeholder-gray-400"
                  onChange={(e) => setDob(e.target.value)}
                  onFocus={() => setDobFocused(true)}
                  onBlur={() => setDobFocused(false)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="nickname" className={labelClass}>Nickname (optional)</label>
              <div style={{...inputWrapperBaseStyle, ...getFocusStyle(nicknameFocused, false)}} className="mt-1">
                <input 
                  type="text" name="nickname" id="nickname" 
                  style={inputElementStyle}
                  placeholder="e.g. Liv, Ollie" value={nickname} 
                  className="placeholder-gray-400"
                  onChange={(e) => setNickname(e.target.value)}
                  onFocus={() => setNicknameFocused(true)}
                  onBlur={() => setNicknameFocused(false)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Used in chat to understand references to your child.</p>
            </div>

            <div>
              <label htmlFor="school" className={labelClass}>School (optional)</label>
              <div style={{...inputWrapperBaseStyle, ...getFocusStyle(schoolFocused, false)}} className="mt-1">
                <input 
                  type="text" name="school" id="school" 
                  style={inputElementStyle}
                  placeholder="e.g. Sunrise Elementary" value={school} 
                  className="placeholder-gray-400"
                  onChange={(e) => setSchool(e.target.value)}
                  onFocus={() => setSchoolFocused(true)}
                  onBlur={() => setSchoolFocused(false)}
                />
              </div>
            </div>
          </div>

          <hr className="my-10 border-gray-200" />

          <div>
            <h2 className={`${sectionTitleClass} mb-2`}>Split-Time Household</h2>
            <div className="mt-3 flex flex-col">
              <div className="flex items-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={splitTimeSchedulingEnabled}
                  aria-label="Enable split-time scheduling"
                  onClick={() => setSplitTimeSchedulingEnabled(!splitTimeSchedulingEnabled)}
                  style={toggleStyle(splitTimeSchedulingEnabled)}
                  className="mr-3"
                >
                  <span style={toggleKnobStyle(splitTimeSchedulingEnabled)} />
                </button>
                <span className={`${labelClass} cursor-pointer`} onClick={() => setSplitTimeSchedulingEnabled(!splitTimeSchedulingEnabled)}>Enable split-time scheduling</span>
              </div>
              <p className="mt-0 text-xs text-gray-400 ml-[56px]">Toggle on if your child spends time across multiple homes on a repeating schedule.</p>
            </div>

            {splitTimeSchedulingEnabled && (
              <div className="mt-8 space-y-4">
                <div>
                  <label htmlFor="generalSchedule" className={labelClass}>General schedule</label>
                  <div style={{...inputWrapperBaseStyle, ...getFocusStyle(generalScheduleFocused, false)}} className="mt-1">
                    <input 
                      type="text" name="generalSchedule" id="generalSchedule" 
                      style={inputElementStyle}
                      placeholder="One week on / one week off" value={generalSchedule} 
                      className="placeholder-gray-400"
                      onChange={(e) => setGeneralSchedule(e.target.value)}
                      onFocus={() => setGeneralScheduleFocused(true)}
                      onBlur={() => setGeneralScheduleFocused(false)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="firstDayOfCycle" className={labelClass}>First day of current schedule cycle</label>
                  <div style={{...inputWrapperBaseStyle, ...getFocusStyle(firstDayOfCycleFocused, false)}} className="mt-1">
                    <input 
                      type="text" name="firstDayOfCycle" id="firstDayOfCycle" 
                      style={inputElementStyle}
                      placeholder="e.g. 01/08/2025" value={firstDayOfCycle} 
                      className="placeholder-gray-400"
                      onChange={(e) => setFirstDayOfCycle(e.target.value)}
                      onFocus={() => setFirstDayOfCycleFocused(true)}
                      onBlur={() => setFirstDayOfCycleFocused(false)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Kicaco will use this schedule to determine which parent or home an event belongs to. You can override or adjust at any time.</p>
                </div>
              </div>
            )}
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
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              side={msg.sender === 'user' ? 'right' : 'left'}
            >
              {msg.content}
            </ChatBubble>
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