// import React from 'react';
import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/ChatBubble';
import IconButton from '../components/IconButton';
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import { extractJsonFromMessage } from '../utils/parseAssistantResponse';
import { useKicacoStore } from '../store/kicacoStore';
import EventConfirmationCard from '../components/EventConfirmationCard';
import { runAssistantFunction } from '../utils/runAssistantFunction';
import { sendMessageToAssistant, createOpenAIThread } from '../utils/talkToKicaco';
import { extractKnownFields, getNextFieldToPrompt, isFirstMessage } from '../utils/kicacoFlow';
import { ParsedFields } from '../utils/kicacoFlow';

const intro = [
  "Hi, I'm Kicaco! You can chat with me about events and I'll remember everything for you.",
  "Type it, say it, snap a photo, upload a flyer, or paste in a note - whatever makes your day easier, I'll turn it into a real event. No forms, no fuss.",
  "Want to give it a try? Tell me about your next event! If you miss any vital details, I'll be sure to ask for them.",
];

// Test case for immediate mode transition
const TEST_CASE = {
  userMessage: "I have a soccer game on Friday",
  expectedResponse: "What time is the game?"
};

export default function Home() {
  const [input, setInput] = useState("");
  const [hasIntroPlayed, setHasIntroPlayed] = useState(false);
  const introStartedRef = useRef(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [collectedFields, setCollectedFields] = useState<ParsedFields>({});
  const { 
    messages, 
    addMessage, 
    removeMessageById, 
    setLatestEvent,
    eventInProgress,
    setEventInProgress,
    addEvent
  } = useKicacoStore();
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [drawerHeight, setDrawerHeight] = useState(44); // initial: minimized height + gap
  const [drawerTop, setDrawerTop] = useState(window.innerHeight); // initial: bottom of viewport
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [scrollOverflow, setScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatDrawerRef = useRef<any>(null);

  // Animated message reveal state
  const [visibleCount, setVisibleCount] = useState(0);

  // Staggered intro messages
  useEffect(() => {
    if (hasIntroPlayed || introStartedRef.current) return;
    introStartedRef.current = true;

    const introMessages = [
      "Hi, I'm Kicaco! You can chat with me about events and I'll remember everything for you.",
      "Type it, say it, snap a photo, upload a flyer, or paste in a note – whatever makes your day easier, I'll turn it into a real event. No forms, no fuss.",
      "Want to give it a try? Tell me about your next event! If you miss any vital details, I'll be sure to ask for them."
    ];

    introMessages.forEach((text, i) => {
      setTimeout(() => {
        addMessage({
          id: crypto.randomUUID(),
          sender: 'assistant',
          content: text
        });
      }, i * 800); // Stagger every 800ms
    });

    setHasIntroPlayed(true);
  }, [hasIntroPlayed, addMessage]);

  // Test case handler
  const runTestCase = async () => {
    if (!threadId) return;
    
    console.log('🧪 Running test case:', TEST_CASE.userMessage);
    
    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      sender: 'user' as const,
      content: TEST_CASE.userMessage
    };
    addMessage(userMessage);

    // Add thinking message
    const thinkingMessage = {
      id: 'thinking',
      sender: 'assistant' as const,
      content: 'Kicaco is thinking',
    };
    addMessage(thinkingMessage);

    try {
      const assistantResponse = await sendMessageToAssistant(threadId, TEST_CASE.userMessage);
      
      // Remove thinking message
      removeMessageById('thinking');

      // Add assistant response
      const assistantMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant' as const,
        content: assistantResponse
      };
      addMessage(assistantMessage);

      // Verify response matches expected
      console.log('🧪 Test case result:', {
        expected: TEST_CASE.expectedResponse,
        actual: assistantResponse,
        matches: assistantResponse.includes(TEST_CASE.expectedResponse)
      });
    } catch (error) {
      console.error('🧪 Test case failed:', error);
      removeMessageById('thinking');
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant' as const,
        content: 'Test case failed. Please try again.'
      });
    }
  };

  // Initialize thread and run test case
  useEffect(() => {
    const initThread = async () => {
      const id = await createOpenAIThread();
      setThreadId(id);
      
      // Run test case after a short delay to ensure thread is ready
      setTimeout(runTestCase, 1000);
    };
    initThread();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !threadId) {
      console.log('No input or threadId:', { input, threadId });
      return;
    }

    const userText = input.trim();
    setInput('');

    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      sender: 'user' as const,
      content: userText
    };
    console.log('Adding user message:', userMessage);
    addMessage(userMessage);

    // Add thinking message
    const thinkingMessage = {
      id: 'thinking',
      sender: 'assistant' as const,
      content: 'Kicaco is thinking',
    };
    addMessage(thinkingMessage);

    // Process message with kicacoFlow
    console.time("Total Message Lifecycle");
    console.time("API Response Time");
    
    try {
      const assistantResponse = await sendMessageToAssistant(threadId, userText);
      
      // Check if response is an event signup
      if (assistantResponse.startsWith('__EVENT_SIGNUP__')) {
        const eventJson = assistantResponse.replace('__EVENT_SIGNUP__', '');
        const eventObj = JSON.parse(decodeURIComponent(eventJson));
        setLatestEvent(eventObj);
        addEvent(eventObj);
        setEventInProgress(null);
      }

      // Remove thinking message before adding the real response
      removeMessageById('thinking');

      const assistantMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant' as const,
        content: assistantResponse
      };
      console.log('Adding assistant message:', assistantMessage);
      addMessage(assistantMessage);
    } catch (error) {
      console.error('Error in message handling:', error);
      removeMessageById('thinking');
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.'
      });
    }

    console.timeEnd("API Response Time");
    console.timeEnd("Total Message Lifecycle");
  };

  // Log messages and visibleCount changes
  useEffect(() => {
    console.log('Messages updated:', messages);
    console.log('Visible count:', visibleCount);
  }, [messages, visibleCount]);

  // Update visibleCount when messages change
  useEffect(() => {
    if (messages.length > visibleCount) {
      console.log('Updating visibleCount from', visibleCount, 'to', messages.length);
      setVisibleCount(messages.length);
    }
  }, [messages.length, visibleCount]);

  // Update drawerTop when drawer height changes
  const handleDrawerHeightChange = (height: number) => {
    setDrawerHeight(height);
    setDrawerTop(window.innerHeight - height);
  };

  // Update subheaderBottom on mount and resize
  useLayoutEffect(() => {
    function updateSubheaderBottom() {
      if (subheaderRef.current) {
        setSubheaderBottom(subheaderRef.current.getBoundingClientRect().bottom);
      }
    }
    updateSubheaderBottom();
    window.addEventListener('resize', updateSubheaderBottom);
    return () => window.removeEventListener('resize', updateSubheaderBottom);
  }, []);

  // Lock/unlock scroll based on drawer position
  useEffect(() => {
    // If drawer is fully open (docked at top), lock scroll
    if (drawerHeight > 44 + 8) {
      setScrollOverflow('auto');
    } else {
      setScrollOverflow('hidden');
    }
  }, [drawerHeight]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <GlobalHeader ref={headerRef} />
      {/* Subheader (for double header effect) */}
      <div ref={subheaderRef} className="w-full bg-white z-10 profiles-roles-subheader">
        <section className="mb-2 px-4 pt-4">
          <div style={{width:'180px'}}>
            <div className="h-0.5 bg-[#c0e2e7] rounded w-full mb-0" style={{ opacity: 0.75 }}></div>
            <div className="flex items-center space-x-2 pl-1">
              <svg width="16" height="16" fill="rgba(185,17,66,0.75)" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>
              <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Upcoming Events</h2>
            </div>
            <div className="h-0.5 bg-[#c0e2e7] rounded w-full mt-0" style={{ opacity: 0.75 }}></div>
          </div>
          <p className="mt-2 text-gray-700 text-[15px] leading-snug font-medium w-full text-left section-blurb" style={{marginBottom: 0, paddingBottom: 0}}>
            Kicaco gives you a clear and up-to-date view of what's next, so you never miss a practice, recital, or class party.
          </p>
        </section>
        {/* Keepers */}
        <section className="mb-2 px-4">
          <div className="mt-2" style={{width:'180px'}}>
            <div className="h-0.5 bg-[#f8b6c2] rounded w-full mb-0" style={{ opacity: 0.75 }}></div>
            <div className="flex items-center space-x-2 pl-1">
              <svg width="16" height="16" fill="rgba(185,17,66,0.75)" viewBox="0 0 512 512"><path d="M16 96C16 69.49 37.49 48 64 48C90.51 48 112 69.49 112 96C112 122.5 90.51 144 64 144C37.49 144 16 122.5 16 96zM480 64C497.7 64 512 78.33 512 96C512 113.7 497.7 128 480 128H192C174.3 128 160 113.7 160 96C160 78.33 174.3 64 192 64H480zM480 224C497.7 224 512 238.3 512 256C512 273.7 497.7 288 480 288H192C174.3 288 160 273.7 160 256C160 238.3 174.3 224 192 224H480zM480 384C497.7 384 512 398.3 512 416C512 433.7 497.7 448 480 448H192C174.3 448 160 433.7 160 416C160 398.3 174.3 384 192 384H480zM16 416C16 389.5 37.49 368 64 368C90.51 368 112 389.5 112 416C112 442.5 90.51 464 64 464C37.49 464 16 442.5 16 416zM112 256C112 282.5 90.51 304 64 304C37.49 304 16 282.5 16 256C16 229.5 37.49 208 64 208C90.51 208 112 229.5 112 256z"/></svg>
              <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Keepers</h2>
            </div>
            <div className="h-0.5 bg-[#f8b6c2] rounded w-full mt-0" style={{ opacity: 0.75 }}></div>
          </div>
          <p className="mt-2 text-gray-700 text-[15px] leading-snug font-medium w-full text-left section-blurb" style={{marginBottom: 0, paddingBottom: 0}}>
            Kicaco keeps all of your child's due dates, deadlines, and time-sensitive tasks visible, so nothing slips through the cracks.
          </p>
        </section>
      </div>
      <GlobalChatDrawer ref={chatDrawerRef} onHeightChange={handleDrawerHeightChange} initialPosition="top">
        <div ref={scrollRef} className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4 overflow-y-auto max-h-full">
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
      {eventInProgress && (
        <EventConfirmationCard
          onConfirm={async () => {
            if (!eventInProgress || !threadId) return;

            const response = await runAssistantFunction({
              assistantId: import.meta.env.VITE_ASSISTANT_ID,
              threadId,
              functionName: 'addEventToCalendar',
              parameters: eventInProgress
            });

            if (response) {
              const event = eventInProgress as any;
              addEvent(event);
              setLatestEvent(event);
              setEventInProgress(null);

              addMessage({
                id: crypto.randomUUID(),
                sender: 'assistant',
                content: `Got it! "${event.eventName}" is now on your calendar.`
              });
            } else {
              console.error('Function call failed');
            }
          }}
          onCancel={() => {
            setEventInProgress(null);
          }}
        />
      )}
      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSend}
      />
    </div>
  );
} 