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
import { format, addDays, subDays } from 'date-fns';

const DailyViewIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '18px', width: '18px', height: '18px', strokeWidth: '1.5' }} viewBox="0 0 90 90">
    <path d="M 71.46 29.223 H 2.001 c -1.104 0 -2 -0.895 -2 -2 v -9.194 c 0 -3.051 2.482 -5.533 5.533 -5.533 h 62.395 c 3.051 0 5.532 2.482 5.532 5.533 v 9.194 C 73.46 28.327 72.565 29.223 71.46 29.223 z M 4.001 25.223 h 65.46 v -7.194 c 0 -0.845 -0.687 -1.533 -1.532 -1.533 H 5.534 c -0.845 0 -1.533 0.687 -1.533 1.533 V 25.223 z"/>
    <path d="M 67.43 82.118 h -61.4 c -3.325 0 -6.03 -2.705 -6.03 -6.03 V 27.223 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 48.865 c 0 1.119 0.911 2.03 2.03 2.03 h 61.4 c 1.119 0 2.03 -0.911 2.03 -2.03 v -6.184 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 6.184 C 73.46 79.413 70.755 82.118 67.43 82.118 z"/>
    <path d="M 57.596 21.113 c -1.104 0 -2 -0.895 -2 -2 V 9.882 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 9.231 C 59.596 20.217 58.701 21.113 57.596 21.113 z"/>
    <path d="M 15.865 21.113 c -1.104 0 -2 -0.895 -2 -2 V 9.882 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 9.231 C 17.865 20.217 16.969 21.113 15.865 21.113 z"/>
    <path d="M 36.731 21.113 c -1.104 0 -2 -0.895 -2 -2 V 9.882 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 9.231 C 38.731 20.217 37.835 21.113 36.731 21.113 z"/>
    <path d="M 86.1 71.904 H 27.191 c -3.871 0 -7.65 -1.361 -10.641 -3.833 C 5.259 58.743 0.001 45.763 0.001 27.223 c 0 -1.104 0.895 -2 2 -2 h 69.46 c 1.104 0 2 0.895 2 2 c 0 17.266 4.804 29.272 15.118 37.782 c 1.284 1.059 1.75 2.755 1.187 4.32 C 89.203 70.892 87.765 71.904 86.1 71.904 z M 4.023 29.223 C 4.385 45.41 9.201 56.81 19.097 64.987 c 2.276 1.881 5.151 2.917 8.094 2.917 h 58.616 c -10.744 -8.978 -15.959 -21.313 -16.326 -38.681 H 4.023 z"/>
  </svg>
);

export default function DailyView() {
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const goToPreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

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
    if (mainContentDrawerOffset > 44 + 8) {
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
      console.error("DailyView: Cannot send message, threadId is null.");
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

    const thinkingMessageId = 'thinking-dailyview';
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
      console.error("Error sending message from DailyView:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Daily View"
      />
      <div
        ref={pageScrollRef}
        className="daily-view-content-scroll bg-white"
        style={{
          position: 'absolute',
          top: subheaderBottom + 8,
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8,
          left: 0,
          right: 0,
          overflowY: mainContentScrollOverflow,
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-4 pt-4">
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