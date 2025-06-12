import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import AddKeeperButton from '../components/AddKeeperButton';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import GlobalSubheader from '../components/GlobalSubheader';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Bell } from "lucide-react";

const KeepersIcon = () => (
  <svg width="16" height="16" fill="rgba(185,17,66,0.75)" viewBox="0 0 512 512"><path d="M16 96C16 69.49 37.49 48 64 48C90.51 48 112 69.49 112 96C112 122.5 90.51 144 64 144C37.49 144 16 122.5 16 96zM480 64C497.7 64 512 78.33 512 96C512 113.7 497.7 128 480 128H192C174.3 128 160 113.7 160 96C160 78.33 174.3 64 192 64H480zM480 224C497.7 224 512 238.3 512 256C512 273.7 497.7 288 480 288H192C174.3 288 160 273.7 160 256C160 238.3 174.3 224 192 224H480zM480 384C497.7 384 512 398.3 512 416C512 433.7 497.7 448 480 448H192C174.3 448 160 433.7 160 416C160 398.3 174.3 384 192 384H480zM16 416C16 389.5 37.49 368 64 368C90.51 368 112 389.5 112 416C112 442.5 90.51 464 64 464C37.49 464 16 442.5 16 416zM112 256C112 282.5 90.51 304 64 304C37.49 304 16 282.5 16 256C16 229.5 37.49 208 64 208C90.51 208 112 229.5 112 256z"/></svg>
);

export default function Keepers() {
  const [input, setInput] = useState("");
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [drawerHeight, setDrawerHeight] = useState(44);
  const [drawerTop, setDrawerTop] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [scrollOverflow, setScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const scrollRef = useRef<HTMLDivElement>(null);

  // State and refs for GlobalChatDrawer synchronisation
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);
  const [scrollRefReady, setScrollRefReady] = useState(false);
  const internalChatContentScrollRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const autoscrollFlagRef = useRef(false);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const previousMessagesLengthRef = useRef(0);
  const messagesContentRef = useRef<HTMLDivElement | null>(null);

  // This ref helps distinguish the first run of the effect after mount/navigation
  // from subsequent runs where messages might genuinely be new.
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

  const executeScrollToBottom = useCallback(() => {
    const sc = internalChatContentScrollRef.current;
    if (!sc || !scrollRefReady) {
      console.log("[Keepers] executeScrollToBottom: Aborted - Scroll container not ready.");
      return;
    }
    requestAnimationFrame(() => {
      if (internalChatContentScrollRef.current) {
        const currentSc = internalChatContentScrollRef.current;
        const targetScrollTop = Math.max(0, currentSc.scrollHeight - currentSc.clientHeight);
        currentSc.scrollTop = targetScrollTop;
        
        // Only update global scroll position if autoscroll was intended (i.e., user was at bottom for new message)
        if (autoscrollFlagRef.current) {
            setChatScrollPosition(targetScrollTop); 
        }

        requestAnimationFrame(() => { // Second scroll for pending rendering
          if (internalChatContentScrollRef.current) {
            const currentScAfterSecondRaf = internalChatContentScrollRef.current;
            const targetScrollTopAfterSecondRaf = Math.max(0, currentScAfterSecondRaf.scrollHeight - currentScAfterSecondRaf.clientHeight);
            if (Math.abs(currentScAfterSecondRaf.scrollTop - targetScrollTopAfterSecondRaf) > 1) {
              currentScAfterSecondRaf.scrollTop = targetScrollTopAfterSecondRaf;
              if (autoscrollFlagRef.current) { // Again, only if autoscroll was on
                  setChatScrollPosition(targetScrollTopAfterSecondRaf);
              }
            }
          }
        });
      }
    });
  }, [scrollRefReady, setChatScrollPosition, autoscrollFlagRef]); // Added autoscrollFlagRef to dependencies

  const handleDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
  };

  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
  }, []);

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
  }, [subheaderRef]);

  useEffect(() => {
    if (drawerHeight > 44 + 8) {
      setScrollOverflow('auto');
    } else {
      setScrollOverflow('hidden');
    }
  }, [drawerHeight]);

  // Main Scroll/Restore/Autoscroll Effect
  useEffect(() => {
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer) {
      console.log("[Keepers MainScrollEffect] Aborted: No scroll container or not ready.");
      return;
    }

    let isConsideredNewMessages = false;

    if (firstEffectRunAfterLoadRef.current) {
      // On the very first run of this effect after the page becomes active and messages are populated,
      // we prioritize restoring the existing scroll position from the store rather than assuming messages are "new".
      console.log(`[Keepers MainScrollEffect] First run after load. Current messages.length: ${messages.length}. StoredScroll: ${chatScrollPosition}`);
      if (chatScrollPosition !== null) {
        if (Math.abs(scrollContainer.scrollTop - chatScrollPosition) > 1.5) {
          console.log(`[Keepers MainScrollEffect] First run: Restoring scrollTop to ${chatScrollPosition}. Current: ${scrollContainer.scrollTop}`);
          scrollContainer.scrollTop = chatScrollPosition;
        }
      } else {
        // No stored scroll position on first load, maybe scroll to bottom if messages exist?
        // For now, let's be conservative and not auto-scroll to bottom on first load unless messages are truly new later.
        console.log("[Keepers MainScrollEffect] First run: No stored scroll position. Doing nothing with scroll yet.");
      }
      firstEffectRunAfterLoadRef.current = false; // Mark first run as completed
    } else {
      // Not the first run, so now we can reliably check for new messages.
      if (messages.length > previousMessagesLengthRef.current) {
        isConsideredNewMessages = true;
      }
    }
    
    console.log(`[Keepers MainScrollEffect] messages.length: ${messages.length}, prevLenRef: ${previousMessagesLengthRef.current}, isConsideredNew: ${isConsideredNewMessages}, storedScrollPos: ${chatScrollPosition}`);

    if (isConsideredNewMessages) {
      console.log("[Keepers MainScrollEffect] New messages detected. Setting autoscrollFlag=true, calling executeScrollToBottom.");
      autoscrollFlagRef.current = true; // Indicate intention to autoscroll
      executeScrollToBottom();
    } else if (!firstEffectRunAfterLoadRef.current && chatScrollPosition !== null && Math.abs(scrollContainer.scrollTop - chatScrollPosition) > 1.5) {
      // This condition handles cases where it's not the first run, not new messages, but scroll isn't matching store (e.g. store updated by another page)
      // However, the firstEffectRunAfterLoadRef.current block above should handle initial restoration.
      // This additional check might be redundant or could fight if chatScrollPosition changes from an external source while on Keepers.
      // For now, let the initial restoration be the primary mechanism when firstEffectRunAfterLoadRef.current is true.
      // The manual scroll handler will update the store if the user scrolls on Keepers.
       console.log("[Keepers MainScrollEffect] Subsequent run, no new messages. Current scroll matches or no action needed based on initial restore.");
    }

    // Always update the previous messages length for the *next* run of this effect.
    previousMessagesLengthRef.current = messages.length;

    // Cleanup: Reset firstEffectRunAfterLoadRef if the component unmounts or messages array identity changes drastically (signifying a full reload/context switch)
    // This is tricky. A simple unmount cleanup is best.
    return () => {
        // When the component unmounts or dependencies change causing cleanup,
        // reset the flag so the next time it runs, it's considered a "first run after load".
        firstEffectRunAfterLoadRef.current = true;
        console.log("[Keepers MainScrollEffect] Cleanup: firstEffectRunAfterLoadRef reset to true.");
    };

  }, [messages, chatScrollPosition, scrollRefReady, executeScrollToBottom]); // executeScrollToBottom is stable if its deps are stable

  useEffect(() => {
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (autoscrollFlagRef.current && internalChatContentScrollRef.current) {
        executeScrollToBottom();
        autoscrollFlagRef.current = false;
      }
    });
    observer.observe(scrollContainer);
    resizeObserverRef.current = observer;

    return () => {
      if (observer) {
        observer.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [scrollRefReady, executeScrollToBottom]);

  useEffect(() => {
    const contentElement = messagesContentRef.current;
    if (!scrollRefReady || !contentElement) {
      return;
    }

    const observer = new MutationObserver((mutationsList) => {
      if (autoscrollFlagRef.current && internalChatContentScrollRef.current && mutationsList.length > 0) {
         executeScrollToBottom();
         autoscrollFlagRef.current = false;
      }
    });
    observer.observe(contentElement, { childList: true, subtree: true, characterData: true });
    mutationObserverRef.current = observer;
    
    return () => {
      if (observer) {
        observer.disconnect();
        mutationObserverRef.current = null;
      }
    };
  }, [scrollRefReady, executeScrollToBottom]);

  // Save scroll position on manual scroll (Corrected Implementation)
  useEffect(() => {
    const scrollElement = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollElement) {
      return;
    }
    let scrollTimeout: number;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        if (internalChatContentScrollRef.current) {
          const sc = internalChatContentScrollRef.current;
          const currentScrollTop = sc.scrollTop;
          setChatScrollPosition(currentScrollTop); // Update store with manually scrolled position

          const isAtBottom = sc.scrollHeight - currentScrollTop - sc.clientHeight < 5;
          if (autoscrollFlagRef.current !== isAtBottom) {
            console.log(`[Keepers ManualScroll] autoscrollFlagRef changed from ${autoscrollFlagRef.current} to ${isAtBottom}`);
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

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessageId = crypto.randomUUID();
    addMessage({
      id: userMessageId,
      sender: 'user',
      content: input,
    });
    const messageToSend = input;
    setInput("");

    autoscrollFlagRef.current = true;

    // Add the "thinking" message
    const thinkingMessageId = 'thinking-keepers'; // Use a unique ID if necessary, or just 'thinking' if globally unique
    addMessage({
      id: thinkingMessageId,
      sender: 'assistant',
      content: 'Kicaco is thinking'
    });

    try {
      if (!threadId) {
        console.error("Cannot send message: threadId is null");
        removeMessageById(thinkingMessageId); // Remove thinking message on error
        addMessage({
          id: crypto.randomUUID(),
          sender: 'assistant',
          content: "Sorry, I can't send your message right now. Please try again in a moment.",
        });
        return;
      }
      const assistantResponseText = await sendMessageToAssistant(threadId, messageToSend);
      removeMessageById(thinkingMessageId); // Remove thinking message after getting response
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: assistantResponseText,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      removeMessageById(thinkingMessageId); // Remove thinking message on error
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
        icon={<Bell />}
        title="Keepers"
        action={<AddKeeperButton />}
      />
      <div
        ref={scrollRef}
        className="keepers-content-scroll bg-gray-50"
        style={{
          position: 'absolute',
          top: subheaderBottom + 8,
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8,
          left: 0,
          right: 0,
          overflowY: scrollOverflow,
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        {/* Main content goes here */}
      </div>
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