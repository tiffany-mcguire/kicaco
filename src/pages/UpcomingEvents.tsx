import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
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
import { Calendar } from "lucide-react";

// Add CalendarIcon definition
const CalendarIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 448 512">
    <path d="M160 32V64H288V32C288 14.33 302.3 0 320 0C337.7 0 352 14.33 352 32V64H400C426.5 64 448 85.49 448 112V160H0V112C0 85.49 21.49 64 48 64H96V32C96 14.33 110.3 0 128 0C145.7 0 160 14.33 160 32zM0 192H448V464C448 490.5 426.5 512 400 512H48C21.49 512 0 490.5 0 464V192zM64 304C64 312.8 71.16 320 80 320H112C120.8 320 128 312.8 128 304V272C128 263.2 120.8 256 112 256H80C71.16 256 64 263.2 64 272V304zM192 304C192 312.8 199.2 320 208 320H240C248.8 320 256 312.8 256 304V272C256 263.2 248.8 256 240 256H208C199.2 256 192 263.2 192 272V304zM336 256C327.2 256 320 263.2 320 272V304C320 312.8 327.2 320 336 320H368C376.8 320 384 312.8 384 304V272C384 263.2 376.8 256 368 256H336zM64 432C64 440.8 71.16 448 80 448H112C120.8 448 128 440.8 128 432V400C128 391.2 120.8 384 112 384H80C71.16 384 64 391.2 64 400V432zM208 384C199.2 384 192 391.2 192 400V432C192 440.8 199.2 448 208 448H240C248.8 448 256 440.8 256 432V400C256 391.2 248.8 384 240 384H208zM320 432C320 440.8 327.2 448 336 448H368C376.8 448 384 440.8 384 432V400C384 391.2 376.8 384 368 384H336C327.2 384 320 391.2 320 400V432z" />
  </svg>
);

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

  const executeScrollToBottom = useCallback(() => {
    const sc = internalChatContentScrollRef.current;
    if (!sc || !scrollRefReady) {
      console.log("  [executeScrollToBottom] Aborted: Scroll container not ready.");
      return;
    }

    requestAnimationFrame(() => {
      if (internalChatContentScrollRef.current) { // Re-check ref
        const currentSc = internalChatContentScrollRef.current;
        const targetScrollTop = Math.max(0, currentSc.scrollHeight - currentSc.clientHeight);
        currentSc.scrollTop = targetScrollTop;
        // Update position after scroll attempt
        setChatScrollPosition(targetScrollTop);
        console.log(`  [executeScrollToBottom] First scroll attempt to: ${targetScrollTop}, scrollHeight: ${currentSc.scrollHeight}, clientHeight: ${currentSc.clientHeight}`);
        
        // Second scroll attempt in the next frame to handle pending rendering changes
        requestAnimationFrame(() => {
          if (internalChatContentScrollRef.current) {
            const currentScAfterSecondRaf = internalChatContentScrollRef.current;
            const targetScrollTopAfterSecondRaf = Math.max(0, currentScAfterSecondRaf.scrollHeight - currentScAfterSecondRaf.clientHeight);
            if (Math.abs(currentScAfterSecondRaf.scrollTop - targetScrollTopAfterSecondRaf) > 1) { // Only scroll if not already at/near bottom
                 currentScAfterSecondRaf.scrollTop = targetScrollTopAfterSecondRaf;
                 setChatScrollPosition(targetScrollTopAfterSecondRaf);
                 console.log(`  [executeScrollToBottom] Second scroll attempt to: ${targetScrollTopAfterSecondRaf}, scrollHeight: ${currentScAfterSecondRaf.scrollHeight}, clientHeight: ${currentScAfterSecondRaf.clientHeight}`);
            } else {
              console.log(`  [executeScrollToBottom] Second scroll attempt: Already at bottom or close. Current: ${currentScAfterSecondRaf.scrollTop}, Target: ${targetScrollTopAfterSecondRaf}`);
            }
          } else {
            console.log("  [executeScrollToBottom] Aborted second scroll in rAF: Scroll container ref lost.");
          }
        });
      } else {
        console.log("  [executeScrollToBottom] Aborted first scroll in rAF: Scroll container ref lost.");
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
    const pageName = window.location.pathname.includes('upcoming-events') ? "UpcomingEvents" : "Home";
    console.log(`%c[${pageName}] EFFECT 1 TRIGGERED (Scroll/Restore/Autoscroll Intent)`, "color: blue; font-weight: bold;");
    console.log(`  [${pageName}]   Deps: messages.length: ${messages.length}, chatScrollPosition: ${chatScrollPosition}, scrollRefReady: ${scrollRefReady}`);
    console.log(`  [${pageName}]   Prev. messages.length (ref before logic): ${previousMessagesLengthRef.current}`);

    const scrollContainer = internalChatContentScrollRef.current;

    if (!scrollRefReady || !scrollContainer) {
      console.warn(`  [${pageName}]   EFFECT 1: Scroll container ref NOT READY or NULL. scrollRefReady: ${scrollRefReady}.`);
      console.log(`%c[${pageName}] EFFECT 1 END (No scrollContainer or not ready)`, "color: blue;");
      return;
    }
    console.log(`  [${pageName}]   EFFECT 1: Actual scrollContainer.scrollTop BEFORE logic: ${scrollContainer.scrollTop}`);

    const newMessagesAdded = messages.length > previousMessagesLengthRef.current;
    console.log(`  [${pageName}]   EFFECT 1: newMessagesAdded: ${newMessagesAdded}`);

    if (newMessagesAdded) {
      console.log(`  [${pageName}]   EFFECT 1: newMessagesAdded TRUE. Setting autoscrollFlag TRUE.`);
      autoscrollFlagRef.current = true;
      executeScrollToBottom(); // Use the new helper
    } else {
      if (chatScrollPosition !== null && scrollContainer) {
        console.log(`  [${pageName}]   EFFECT 1 (no new messages): Potentially restoring scroll. Stored chatScrollPosition: ${chatScrollPosition}, Current scrollTop: ${scrollContainer.scrollTop}`);
        if (Math.abs(scrollContainer.scrollTop - chatScrollPosition) > 1.5) {
          console.log(`    [${pageName}]   EFFECT 1: Restoring scrollTop to ${chatScrollPosition}.`);
          requestAnimationFrame(() => {
            if (internalChatContentScrollRef.current) {
              internalChatContentScrollRef.current.scrollTop = chatScrollPosition;
            }
          });
        } else {
          console.log(`    [${pageName}]   EFFECT 1: ScrollTop already matches stored position or is close. No restoration needed.`);
        }
      } else {
        console.log(`  [${pageName}]   EFFECT 1 (no new messages): chatScrollPosition is null or scrollContainer lost. No scroll restoration action.`);
      }
      console.log(`  [${pageName}]   EFFECT 1 (no new messages): Finished. autoscrollFlagRef.current is: ${autoscrollFlagRef.current}`);
    }

    previousMessagesLengthRef.current = messages.length;
    console.log(`  [${pageName}]   EFFECT 1: Updated previousMessagesLengthRef.current to: ${previousMessagesLengthRef.current}`);
    console.log(`%c[${pageName}] EFFECT 1 END (Processed logic)`, "color: blue;");
  }, [messages, chatScrollPosition, setChatScrollPosition, scrollRefReady, executeScrollToBottom]);

  useEffect(() => {
    const pageName = window.location.pathname.includes('upcoming-events') ? "UpcomingEvents" : "Home";
    console.log(`%c[${pageName}] RESIZE OBSERVER EFFECT TRIGGERED. scrollRefReady: ${scrollRefReady}`, "color: purple; font-weight: bold;");

    const scrollContainer = internalChatContentScrollRef.current;

    if (scrollRefReady && scrollContainer) {
      console.log(`  [${pageName}] Resize Observer: Scroll container is READY. Setting up observer.`);
      const observer = new ResizeObserver((entries) => {
        const pageNameObs = window.location.pathname.includes('upcoming-events') ? "UpcomingEvents" : "Home"; // Use a different var name to avoid shadow
        
        if (autoscrollFlagRef.current && entries.length > 0 && internalChatContentScrollRef.current) {
          console.log(`    [${pageNameObs}] Resize Observer: Autoscroll flag is TRUE and content resized.`);
          executeScrollToBottom(); // Use the new helper
        } else if (entries.length > 0) {
          console.log(`    [${pageNameObs}] Resize Observer CALLED (autoscrollFlag: ${autoscrollFlagRef.current}). Content may have resized.`);
        }
      });
      observer.observe(scrollContainer);
      resizeObserverRef.current = observer;
      console.log(`  [${pageName}] Resize Observer: ATTACHED to scrollContainer.`);
      return () => {
        if (observer) {
          observer.disconnect();
          resizeObserverRef.current = null;
          console.log(`  [${pageName}] Resize Observer: DISCONNECTED.`);
        }
      };
    } else {
      console.warn(`  [${pageName}] Resize Observer: Scroll container not ready (scrollRefReady: ${scrollRefReady}) or ref is null. Observer not set up.`);
    }
    console.log(`%c[${pageName}] RESIZE OBSERVER EFFECT END`, "color: purple;");
  }, [scrollRefReady, setChatScrollPosition, executeScrollToBottom]);

  useEffect(() => {
    const pageName = window.location.pathname.includes('upcoming-events') ? "UpcomingEvents" : "Home";
    const scrollContainer = internalChatContentScrollRef.current;

    if (!scrollRefReady || !scrollContainer) {
      console.warn(`  [${pageName}] Manual Scroll EFFECT: Scroll container NOT READY. scrollRefReady: ${scrollRefReady}. Listener not attached.`);
      return;
    }

    console.log(`%c[${pageName}] EFFECT 2 ATTEMPTING ATTACH (Manual Scroll Listener Setup)`, "color: green; font-weight: bold;");
      let scrollTimeout: number;

      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
        if (internalChatContentScrollRef.current) {
          const sc = internalChatContentScrollRef.current;
          const currentScrollTop = sc.scrollTop;
          console.log(`  [${pageName}] Manual Scroll DEBOUNCED: Updating store chatScrollPosition to: ${currentScrollTop}`);
          setChatScrollPosition(currentScrollTop);

          // Update autoscrollFlag based on scroll position
          const isAtBottom = sc.scrollHeight - currentScrollTop - sc.clientHeight < 5; // 5px tolerance
          if (autoscrollFlagRef.current !== isAtBottom) {
            console.log(`    [${pageName}] Manual Scroll: autoscrollFlagRef changed from ${autoscrollFlagRef.current} to ${isAtBottom}`);
            autoscrollFlagRef.current = isAtBottom;
          }
          } else {
            console.warn(`  [${pageName}] Manual Scroll DEBOUNCED: Scroll container ref lost inside timeout.`);
          }
        }, 150);
      };

      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      console.log(`  [${pageName}] Manual Scroll: Listener ATTACHED.`);
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      console.log(`  [${pageName}] Manual Scroll: Listener REMOVED.`);
    };
  }, [setChatScrollPosition, scrollRefReady]);

  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
    if (node) {
      console.log("[UpcomingEvents] chatContentScrollRef CALLBACK FIRED with node.");
    }
  }, []); // Empty dependency array for stable ref callback

  // Callback ref for the messages content div to attach MutationObserver
  const messagesContentRef = useCallback((node: HTMLDivElement | null) => {
    const pageName = window.location.pathname.includes('upcoming-events') ? "UpcomingEvents" : "Home";

    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
      console.log(`  [${pageName}] Mutation Observer: DISCONNECTED (due to ref callback re-run or node removal).`);
    }

    if (node && scrollRefReady) {
      console.log(`  [${pageName}] messagesContentRef CALLBACK FIRED with node. Setting up Mutation Observer.`);
      const observer = new MutationObserver((mutationsList) => {
        if (autoscrollFlagRef.current && mutationsList.length > 0) {
          console.log(`    [${pageName}] Mutation Observer: Autoscroll flag TRUE, content mutated (${mutationsList.length} mutations). Scrolling.`);
          executeScrollToBottom();
        } else if (mutationsList.length > 0) {
          console.log(`    [${pageName}] Mutation Observer: Autoscroll flag FALSE or no mutations, content mutated (${mutationsList.length} mutations). No scroll by MutationObserver.`);
        }
      });

      observer.observe(node, { childList: true, subtree: true, characterData: true });
      mutationObserverRef.current = observer;
      console.log(`  [${pageName}] Mutation Observer: ATTACHED to new messagesContentRef node.`);
    } else if (node) {
      console.log(`  [${pageName}] messagesContentRef CALLBACK FIRED with node, but scrollRefReady is FALSE (${scrollRefReady}). Observer not attached yet.`);
    } else {
      console.log(`  [${pageName}] messagesContentRef CALLBACK FIRED with NULL node. Observer not attached.`);
    }
  }, [scrollRefReady, executeScrollToBottom]);

  // Assistant-enabled handleSend
  const handleSend = async () => {
    if (!input.trim()) return;
    if (!threadId) {
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant' as const,
        content: 'Please wait while I initialize our conversation...'
      });
      return;
    }
    const userText = input.trim();
    setInput("");
    const userMessage = {
      id: crypto.randomUUID(),
      sender: 'user' as const,
      content: userText
    };
    addMessage(userMessage);
    const thinkingMessage = {
      id: 'thinking',
      sender: 'assistant' as const,
      content: 'Kicaco is thinking',
    };
    addMessage(thinkingMessage);
    try {
      const assistantResponse = await sendMessageToAssistant(threadId, userText);
      removeMessageById('thinking');
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant' as const,
        content: assistantResponse
      });
    } catch (error) {
      removeMessageById('thinking');
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.'
      });
    }
  };

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
        {(() => {
          console.log("[UpcomingEvents Rendering Debug] ChatDrawer content rendering:", {
            messagesLength: messages.length,
            threadId,
            scrollRefReady
          });
          return (
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
                      {/* Simplified: No signup button here as in Home.tsx unless specifically needed */}
                    </div>
                  </ChatBubble>
                </motion.div>
              );
            }
            // If 'post_signup_options' or other types were genuinely used in UpcomingEvents, add them here.
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
          );
        })()}
      </GlobalChatDrawer>
      <div
        className="upcoming-events-content-scroll bg-gray-50"
        style={{
          position: 'absolute',
          top: subheaderRef.current ? subheaderRef.current.getBoundingClientRect().bottom + 8 : 0,
          bottom: currentDrawerHeight + (footerRef.current ? footerRef.current.getBoundingClientRect().height : 0) + 8,
          left: 0,
          right: 0,
          overflowY: 'auto',
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        {events.length > 0 && (
          <div className="flex flex-col w-full pt-2 pb-2 px-4">
            {events.map((event, idx) => (
              <EventCard
                key={event.eventName + event.date + idx}
                image={getKicacoEventPhoto(event.eventName)}
                name={event.eventName}
                date={event.date}
                time={event.time}
                location={event.location}
              />
            ))}
          </div>
        )}
      </div>
      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSend}
      />
    </div>
  );
} 