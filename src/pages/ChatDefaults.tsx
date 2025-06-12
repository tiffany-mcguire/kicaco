import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton.tsx';
import ChatBubble from '../components/ChatBubble.tsx';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import AddKeeperButton from '../components/AddKeeperButton';
import GlobalHeader from '../components/GlobalHeader.tsx';
import GlobalFooter from '../components/GlobalFooter.tsx';
import GlobalChatDrawer from '../components/GlobalChatDrawer.tsx';
import GlobalSubheader from '../components/GlobalSubheader.tsx';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Settings } from "lucide-react";

const ChatDefaultsIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" fill="none"></path>
    <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"></path>
  </svg>
);

const UpdateDefaultsButton = (props: { label?: string }) => {
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
      className="transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(true); }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(false); }}
    >
      {props.label ?? 'Update Defaults'}
    </button>
  );
};

export default function ChatDefaults() {
  const [input, setInput] = useState("");
  const [timeToggle, setTimeToggle] = useState(true);
  const [locationToggle, setLocationToggle] = useState(true);
  const [reminderToggle, setReminderToggle] = useState(true);
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [drawerHeight, setDrawerHeight] = useState(44);
  const [drawerTop, setDrawerTop] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [scrollOverflow, setScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const pageScrollRef = useRef<HTMLDivElement>(null);

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
  } = useKicacoStore();

  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const handleGlobalDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);

    setDrawerHeight(height);
    setDrawerTop(window.innerHeight - height);
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
    if (drawerHeight > 44 + 8) {
      setScrollOverflow('auto');
    } else {
      setScrollOverflow('hidden');
    }
  }, [drawerHeight]);

  const toggleStyle = (isOn: boolean) => ({
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: isOn ? '#217e8f' : '#4b5563',  // Darker teal for on, dark gray for off
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

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Ensure threadId exists, otherwise, how to handle? For now, basic check.
    if (!threadId) {
      console.error("ChatDefaults: Cannot send message, threadId is null.");
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
    setInput("");

    autoscrollFlagRef.current = true; // Intend to autoscroll for new user message + assistant reply

    const thinkingMessageId = 'thinking-chatdefaults';
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
      console.error("Error sending message from ChatDefaults:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  // 7. Chat Scroll Management Logic

  // executeScrollToBottom function
  const executeScrollToBottom = useCallback(() => {
    const sc = internalChatContentScrollRef.current;
    if (!sc || !scrollRefReady) {
      console.log("[ChatDefaults] executeScrollToBottom: Aborted - Scroll container not ready.");
      return;
    }
    requestAnimationFrame(() => {
      if (internalChatContentScrollRef.current) {
        const currentSc = internalChatContentScrollRef.current;
        const targetScrollTop = Math.max(0, currentSc.scrollHeight - currentSc.clientHeight);
        currentSc.scrollTop = targetScrollTop;
        if (autoscrollFlagRef.current) {
          setChatScrollPosition(targetScrollTop);
        }
        requestAnimationFrame(() => {
          if (internalChatContentScrollRef.current) {
            const currentScAfterSecondRaf = internalChatContentScrollRef.current;
            const targetScrollTopAfterSecondRaf = Math.max(0, currentScAfterSecondRaf.scrollHeight - currentScAfterSecondRaf.clientHeight);
            if (Math.abs(currentScAfterSecondRaf.scrollTop - targetScrollTopAfterSecondRaf) > 1) {
              currentScAfterSecondRaf.scrollTop = targetScrollTopAfterSecondRaf;
              if (autoscrollFlagRef.current) {
                setChatScrollPosition(targetScrollTopAfterSecondRaf);
              }
            }
          }
        });
      }
    });
  }, [scrollRefReady, setChatScrollPosition, autoscrollFlagRef]);

  // chatContentScrollRef callback
  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
  }, []);

  // Main Scroll/Restore/Autoscroll Effect
  useEffect(() => {
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer) {
      console.log("[ChatDefaults MainScrollEffect] Aborted: No scroll container or not ready.");
      return;
    }
    let isConsideredNewMessages = false;
    if (firstEffectRunAfterLoadRef.current) {
      console.log(`[ChatDefaults MainScrollEffect] First run. StoredScroll: ${chatScrollPosition}`);
      if (chatScrollPosition !== null) {
        if (Math.abs(scrollContainer.scrollTop - chatScrollPosition) > 1.5) {
          scrollContainer.scrollTop = chatScrollPosition;
        }
      }
      firstEffectRunAfterLoadRef.current = false;
    } else {
      if (messages.length > previousMessagesLengthRef.current) {
        isConsideredNewMessages = true;
      }
    }
    if (isConsideredNewMessages) {
      autoscrollFlagRef.current = true;
      executeScrollToBottom();
    }
    previousMessagesLengthRef.current = messages.length;
    return () => {
      firstEffectRunAfterLoadRef.current = true; // Reset on unmount/deps change
    };
  }, [messages, chatScrollPosition, scrollRefReady, executeScrollToBottom]);

  // ResizeObserver Effect
  useEffect(() => {
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer || !window.ResizeObserver) return;
    const observer = new ResizeObserver(() => {
      if (autoscrollFlagRef.current && internalChatContentScrollRef.current) {
        executeScrollToBottom();
        // autoscrollFlagRef.current = false; // Typically reset after scroll, but executeScrollToBottom might rely on it
      }
    });
    observer.observe(scrollContainer);
    resizeObserverRef.current = observer;
    return () => {
      if (observer) observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, [scrollRefReady, executeScrollToBottom]);

  // MutationObserver Effect
  useEffect(() => {
    const contentElement = messagesContentRef.current;
    if (!scrollRefReady || !contentElement || !window.MutationObserver) return;
    const observer = new MutationObserver((mutationsList) => {
      if (autoscrollFlagRef.current && internalChatContentScrollRef.current && mutationsList.length > 0) {
        executeScrollToBottom();
        // autoscrollFlagRef.current = false;
      }
    });
    observer.observe(contentElement, { childList: true, subtree: true, characterData: true });
    mutationObserverRef.current = observer;
    return () => {
      if (observer) observer.disconnect();
      mutationObserverRef.current = null;
    };
  }, [scrollRefReady, executeScrollToBottom]); // Add messagesContentRef.current readiness? No, effect runs when it becomes available.

  // Manual Scroll useEffect
  useEffect(() => {
    const scrollElement = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollElement) return;
    let scrollTimeout: number;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        if (internalChatContentScrollRef.current) {
          const sc = internalChatContentScrollRef.current;
          const currentScrollTop = sc.scrollTop;
          setChatScrollPosition(currentScrollTop);
          const isAtBottom = sc.scrollHeight - currentScrollTop - sc.clientHeight < 5;
          if (autoscrollFlagRef.current !== isAtBottom) {
            autoscrollFlagRef.current = isAtBottom;
          }
        }
      }, 150);
    };
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollRefReady, setChatScrollPosition]);

  useEffect(() => {
    const scrollEl = pageScrollRef.current;
    if (!scrollEl) return;

    const checkOverflow = () => {
      // console.log(`[ChatDefaults checkOverflow] scrollH: ${scrollEl.scrollHeight}, clientH: ${scrollEl.clientHeight}`);
      if (scrollEl.scrollHeight > scrollEl.clientHeight) {
        setScrollOverflow('auto');
      } else {
        setScrollOverflow('hidden');
      }
    };

    checkOverflow(); // Initial check
    
    const observerInstance = new ResizeObserver(checkOverflow);
    observerInstance.observe(scrollEl);
    // Array.from(scrollEl.children).forEach(child => observerInstance.observe(child)); // Commented out child observation

    return () => {
      observerInstance.disconnect();
    };
  }, [pageScrollRef.current, currentDrawerHeight]); // MODIFIED DEPENDENCY ARRAY

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Settings />}
        title="Chat Defaults"
        action={<UpdateDefaultsButton />}
      />
      <div
        ref={pageScrollRef}
        className="chat-defaults-content-scroll bg-gray-50"
        style={{
          position: 'absolute',
          top: subheaderBottom > 0 ? subheaderBottom : 'auto',
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8,
          left: 0,
          right: 0,
          overflowY: scrollOverflow,
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            
            {/* Follow-up Prompts Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-4">Follow-up prompts</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">Always ask for time if not provided</p>
                      <p className="text-sm text-gray-500">
                        When toggled off, Kicaco will not prompt you for an event time, even if not shared in the chat.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={timeToggle}
                      aria-label="Always ask for time if not provided"
                      onClick={() => setTimeToggle(!timeToggle)}
                      style={toggleStyle(timeToggle)}
                    >
                      <span style={toggleKnobStyle(timeToggle)} />
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">Always ask for location if not provided</p>
                      <p className="text-sm text-gray-500">
                        When toggled off, Kicaco will not prompt you for an event location, even if no location is shared or parsed from context.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={locationToggle}
                      aria-label="Always ask for location if not provided"
                      onClick={() => setLocationToggle(!locationToggle)}
                      style={toggleStyle(locationToggle)}
                    >
                      <span style={toggleKnobStyle(locationToggle)} />
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">Always ask for reminder settings</p>
                      <p className="text-sm text-gray-500">
                        When toggled off, Kicaco will not follow up by asking whether you want a reminder for an event.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={reminderToggle}
                      aria-label="Always ask for reminder settings"
                      onClick={() => setReminderToggle(!reminderToggle)}
                      style={toggleStyle(reminderToggle)}
                    >
                      <span style={toggleKnobStyle(reminderToggle)} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Child Profile Distinction Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-700">Child Profile Distinction</p>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                In multi-child households, Kicaco will always ask which child an event or task is for if the name isn't included in or parsed from your message.
              </p>
            </div>

          </div>
        </div>
      </div>
      <GlobalChatDrawer
        drawerHeight={currentDrawerHeight}
        maxDrawerHeight={maxDrawerHeight}
        onHeightChange={handleGlobalDrawerHeightChange}
        scrollContainerRefCallback={chatContentScrollRef}
      >
        <div 
          ref={messagesContentRef}
          className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4"
        >
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