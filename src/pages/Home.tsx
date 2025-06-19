import { ChatMessageList } from '../components/chat';
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { GlobalHeader } from '../components/navigation';
import { GlobalFooter } from '../components/navigation';
import { GlobalChatDrawer } from '../components/chat';
import { useChatScrollManagement } from '../hooks/useChatScrollManagement';
import { useEventCreation } from '../hooks/useEventCreation';
import { useKicacoStore } from '../store/kicacoStore';
import { EventConfirmationCard } from '../components/calendar';
import { createOpenAIThread } from '../utils/talkToKicaco';
import { getApiClientInstance } from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';
import { SevenDayEventOutlook, ThirtyDayKeeperOutlook } from '../components/calendar';
import { parse, format } from 'date-fns';
import { PasswordModal } from '../components/common';
import { PostSignupOptions } from '../components/common';
import { Home as HomeIcon } from "lucide-react";
import { GlobalSubheader } from '../components/navigation';
import { generateUUID } from '../utils/uuid';

// Add NodeJS type definition
declare global {
  namespace NodeJS {
    interface Timeout {}
  }
}

const intro = [
  "Hi, I'm Kicaco! You can chat with me about events and I'll remember everything for you.",
  "Type it, say it, snap a photo, upload a flyer, or paste in a note - whatever makes your day easier, I'll turn it into a real event. No forms, no fuss.",
  "Want to give it a try? Tell me about your next event! If you miss any vital details, I'll be sure to ask for them.",
];

// Date/time formatting helpers
function formatDateMMDDYYYY(date: Date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

function formatTimeAMPM(date: Date) {
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

function toTitleCase(str: string) {
  return str.replace(/\b\w+/g, txt => txt[0].toUpperCase() + txt.slice(1).toLowerCase());
}



// Add formatTime helper from EventCard
function formatTime(time?: string) {
  if (!time) return '';
  let normalized = time.trim().toLowerCase();
  normalized = normalized.replace(/(\d)(am|pm)/, '$1 $2');
  if (/^\d{1,2}\s?(am|pm)$/.test(normalized)) {
    normalized = normalized.replace(/^(\d{1,2})\s?(am|pm)$/, '$1:00 $2');
  }
  const patterns = ['h:mm a', 'h a', 'h:mma', 'ha', 'H:mm'];
  for (const pattern of patterns) {
    try {
      const dateObj = parse(normalized, pattern, new Date());
      if (!isNaN(dateObj.getTime())) {
        return format(dateObj, 'hh:mm a').toUpperCase();
      }
    } catch {}
  }
  const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
  if (!isNaN(dateObj.getTime())) {
    return format(dateObj, 'hh:mm a').toUpperCase();
  }
  return time;
}

// Helper to parse time strings for sorting
function parseTo24H(time?: string): number {
  if (!time) return 2400; // Put events without a time at the end
  let normalized = time.trim().toLowerCase();
  // ... (rest of the function is implemented inside the component for now)
  const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
  if (!isNaN(dateObj.getTime())) {
    return parseInt(format(dateObj, 'HHmm'), 10);
  }
  return 2400; // Fallback for invalid time formats
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    // Log the entire store state once the component has mounted
    console.log("Kicaco Store State on Mount:", useKicacoStore.getState());
  }, []);

  const [input, setInput] = useState("");
  const [hasIntroPlayed, setHasIntroPlayed] = useState(() => {
    return localStorage.getItem('kicaco_intro_played') === 'true';
  });
  const [currentWindowHeight, setCurrentWindowHeight] = useState(window.innerHeight);
  const introStartedRef = useRef(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { 
    threadId,
    setThreadId,
    messages, 
    addMessage, 
    removeMessageById, 
    setLatestEvent,
    eventInProgress,
    setEventInProgress,
    addEvent,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition
  } = useKicacoStore();
  const headerRef = useRef<HTMLDivElement>(null);
  const pageContentRef = useRef<HTMLDivElement>(null); // Renamed from subheaderRef
  const upcomingEventsTitleRef = useRef<HTMLDivElement>(null); // New ref for the fixed title section
  const footerRef = useRef<HTMLDivElement>(null);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);
  const [initialHomePageDrawerHeightCalculated, setInitialHomePageDrawerHeightCalculated] = useState(false);
  const [contentAreaTop, setContentAreaTop] = useState(108); // Better initial estimate
  const keepersBlurbRef = useRef<HTMLDivElement>(null); // Ref for Keepers blurb
  const [pageContentLoadedAndMeasured, setPageContentLoadedAndMeasured] = useState(false); // New state
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Animated message reveal state
  const [visibleCount, setVisibleCount] = useState(0);

  // Use custom hooks
  const { chatContentScrollRef, messagesContentRef, scrollRefReady } = useChatScrollManagement({
    messages,
    chatScrollPosition,
    setChatScrollPosition,
    pageName: 'Home'
  });
  
  const { handleEventMessage, eventCreationMessage, currentEventFields } = useEventCreation();

  // --- NEW: Track if blurb has been shown/should be hidden forever ---
  const [blurbGone, setBlurbGone] = useState(() => {
    return localStorage.getItem('kicaco_blurb_gone') === 'true';
  });
  const events = useKicacoStore(state => state.events);
  const keepers = useKicacoStore(state => state.keepers);

  useEffect(() => {
    console.log('Events:', events);
    console.log('Keepers:', keepers);
    if ((events.length > 0 || keepers.length > 0) && !blurbGone) {
      setBlurbGone(true);
      localStorage.setItem('kicaco_blurb_gone', 'true');
    }
  }, [events, keepers, blurbGone]);

  // Staggered intro messages
  useEffect(() => {
    const playIntroWithThinking = async () => {
      if (hasIntroPlayed || introStartedRef.current) return;
      introStartedRef.current = true;

      for (let i = 0; i < intro.length; i++) {
        const thinkingId = `intro-thinking-${i}`;
        addMessage({
          id: thinkingId,
          sender: 'assistant',
          content: 'Kicaco is thinking' // Content for ThinkingWave
        });

        // Wait for the thinking duration
        await new Promise(resolve => setTimeout(resolve, 2000));

        removeMessageById(thinkingId);
        addMessage({
          id: generateUUID(),
          sender: 'assistant',
          content: intro[i]
        });

        // Add a short pause after the message is displayed, before thinking for the next one
        if (i < intro.length - 1) { // Only pause if there's a next message
          await new Promise(resolve => setTimeout(resolve, 1500)); // Changed to 1000ms pause
        }
      }

      setHasIntroPlayed(true);
      localStorage.setItem('kicaco_intro_played', 'true');
    };

    playIntroWithThinking();
  }, [hasIntroPlayed, addMessage, removeMessageById]);

  // Initialize thread
  useEffect(() => {
    const initThread = async () => {
      try {
        setIsInitializing(true);
        console.log('Initializing thread...');
        const apiClient = getApiClientInstance();
        const response = await apiClient.createThread(intro.join('\n'));
        console.log('Thread creation response:', response);
        if (!response) {
          throw new Error('No response from thread creation');
        }
        setThreadId(response);
        setTimeout(() => {
          console.log('Zustand threadId after set:', useKicacoStore.getState().threadId);
        }, 0);
        console.log('Thread initialized with ID:', response);
      } catch (error: any) {
        console.error('Failed to initialize thread:', error);
        
        // Show more specific error message based on the error
        let errorMessage = 'I\'m having trouble starting our conversation. ';
        if (error.message?.includes('API key')) {
          errorMessage += 'The API key is not configured properly.';
        } else if (error.message?.includes('Network') || error.message?.includes('network')) {
          errorMessage += 'Please check your internet connection and try again.';
        } else if (error.message?.includes('CORS')) {
          errorMessage += 'This browser is blocking the connection. Try using a different browser or the desktop version.';
        } else {
          errorMessage += 'Please refresh the page and try again.';
        }
        
        addMessage({
          id: generateUUID(),
          sender: 'assistant',
          content: errorMessage
        });
      } finally {
        setIsInitializing(false);
      }
    };
    if (!threadId) {
      initThread();
    } else {
      // If threadId already exists from the store, we are not initializing a new one,
      // so make sure the input field is enabled.
      setIsInitializing(false);
    }
  }, [threadId, setThreadId, addMessage]);

  const [pendingEvent, setPendingEvent] = useState<any>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [signupStep, setSignupStep] = useState<number | null>(null);
  const [signupData, setSignupData] = useState<{ name?: string; email?: string; password?: string }>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPostSignupOptions, setShowPostSignupOptions] = useState(false);

  // Track the most recent event's childName for use in signup flow
  const latestChildName = useKicacoStore(state => (state.events[0]?.childName || 'your child'));

  // Add resize listener useEffect
  useEffect(() => {
    const handleResize = () => {
      console.log("[Home Resize Listener] window.innerHeight updated to:", window.innerHeight);
      setCurrentWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    // Initial set just in case
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Runs once on mount to attach listener

  // Effect to determine if critical page content is loaded and measured
  useLayoutEffect(() => {
    const globalHeaderH = headerRef.current?.offsetHeight ?? 0;
    const upcomingTitleH = upcomingEventsTitleRef.current?.offsetHeight ?? 0;
    const keepersBlurbRect = keepersBlurbRef.current?.getBoundingClientRect();
    const footerH = footerRef.current?.offsetHeight ?? 0;

    if (globalHeaderH > 0 && upcomingTitleH > 0 && keepersBlurbRef.current && keepersBlurbRect && keepersBlurbRect.bottom > (globalHeaderH + upcomingTitleH) && footerH > 0) {
      console.log(`[Home ContentMeasureEffect] All critical elements measured. KB Bottom: ${keepersBlurbRect.bottom.toFixed(2)}, HeaderH: ${globalHeaderH}, UpcomingTitleH: ${upcomingTitleH}, FooterH: ${footerH}`);
      setPageContentLoadedAndMeasured(true);
    } else {
      // console.log(`[Home ContentMeasureEffect] Waiting for elements. GH: ${globalHeaderH}, UTH: ${upcomingTitleH}, KB Ref: ${!!keepersBlurbRef.current}, KB Rect: ${!!keepersBlurbRect}, KB Bottom: ${keepersBlurbRect?.bottom}, FooterH: ${footerH}`);
      // Set to false if not all conditions met, to allow re-evaluation if something changes
      // This might be too aggressive if elements appear/disappear, but for initial load it is fine.
      // setPageContentLoadedAndMeasured(false); 
    }
  }, [
    headerRef.current?.offsetHeight, 
    upcomingEventsTitleRef.current?.offsetHeight, 
    keepersBlurbRef.current?.offsetHeight, // Trigger re-check if blurb height changes
    footerRef.current?.offsetHeight
  ]);

  // --- Page-specific Max Drawer Height & Initial Homepage Drawer Height ---
  useLayoutEffect(() => {
    const globalHeaderH = headerRef.current?.offsetHeight ?? 0;
    const upcomingTitleH = upcomingEventsTitleRef.current?.offsetHeight ?? 0;

    if (globalHeaderH === 0 || upcomingTitleH === 0) {
      return;
    }

    const newContentAreaTop = globalHeaderH + upcomingTitleH;
    if (contentAreaTop !== newContentAreaTop) {
        setContentAreaTop(newContentAreaTop);
    }

    const globalFooterH = footerRef.current?.offsetHeight ?? 0;
    
    let calculatedMaxDrawerHeight = currentWindowHeight - newContentAreaTop - globalFooterH - 12; // 12px buffer
    calculatedMaxDrawerHeight = Math.max(calculatedMaxDrawerHeight, 32); 
    setMaxDrawerHeight(calculatedMaxDrawerHeight);

    if (!initialHomePageDrawerHeightCalculated && globalFooterH > 0) {
      // If there's no height stored from another session, default to max height on homepage.
      if (storedDrawerHeight === null || storedDrawerHeight === undefined) {
        setStoredDrawerHeight(calculatedMaxDrawerHeight);
      }
      setInitialHomePageDrawerHeightCalculated(true);
    } else if (storedDrawerHeight && storedDrawerHeight > calculatedMaxDrawerHeight) {
      // On subsequent resizes, clamp the height if it exceeds the new max.
      setStoredDrawerHeight(calculatedMaxDrawerHeight);
    }

    // Mark layout as ready once we have valid measurements
    if (globalHeaderH > 0 && upcomingTitleH > 0 && globalFooterH > 0) {
      setIsLayoutReady(true);
    }
  }, [
    currentWindowHeight,
    storedDrawerHeight,
    initialHomePageDrawerHeightCalculated,
    pageContentLoadedAndMeasured,
    contentAreaTop, 
    headerRef.current?.offsetHeight, 
    upcomingEventsTitleRef.current?.offsetHeight,
    footerRef.current?.offsetHeight,
    setStoredDrawerHeight, 
    setMaxDrawerHeight, 
    setContentAreaTop
  ]);

  // Adjust default fallback for currentDrawerHeight
  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  // handleDrawerHeightChange should clamp against the trueSubheaderMax (which is in maxDrawerHeight state)
  const handleDrawerHeightChange = (height: number) => {
    // Adjust minimum clamp in handleDrawerHeightChange
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32); // Changed from 44 to 32
    setStoredDrawerHeight(newHeight);
  };









  const handleSend = async () => {
    console.log('Current threadId:', threadId, 'isInitializing:', isInitializing);
    if (!input.trim()) return;
    if (isInitializing || !threadId) {
      addMessage({
        id: generateUUID(),
        sender: 'assistant',
        content: isInitializing
          ? 'Please wait while I initialize our conversation...'
          : 'I\'m having trouble with our conversation. Please refresh the page and try again.'
      });
      return;
    }

    // Signup flow logic
    if (showSignup && signupStep !== null) {
      if (signupStep === 0) {
        setSignupData(prev => ({ ...prev, name: input.trim() }));
        addMessage({
          id: generateUUID(),
          sender: 'user',
          content: input.trim()
        });
        setInput('');
        setSignupStep(1);
        setTimeout(() => {
          addMessage({
            id: generateUUID(),
            sender: 'assistant',
            content: 'Great! What email would you like to use?'
          });
        }, 400);
        return;
      }
      if (signupStep === 1) {
        setSignupData(prev => ({ ...prev, email: input.trim() }));
        addMessage({
          id: generateUUID(),
          sender: 'user',
          content: input.trim()
        });
        setInput('');
        setShowPasswordModal(true);
        return;
      }
      if (signupStep === 2) {
        setSignupStep(3);
        setTimeout(() => {
          addMessage({
            id: generateUUID(),
            sender: 'assistant',
            content: `Is this calendar just for ${latestChildName}'s schedule or would you like to add another child profile?`
          });
        }, 400);
        return;
      }
      return;
    }

    const userText = input.trim();
    setInput('');

    // Use the event creation hook
    await handleEventMessage(userText);
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

  // Add debug logs before rendering
  console.log("[Home Rendering Debug] State values:", {
    hasIntroPlayed,
    messagesLength: messages.length,
    isInitializing,
    threadId,
    eventsLength: events.length,
    keepersLength: keepers.length,
    currentDrawerHeight,
    storedDrawerHeight
  });

  if (!isMounted || !isLayoutReady) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <GlobalHeader ref={headerRef} />
        <GlobalSubheader
          ref={upcomingEventsTitleRef}
          icon={<HomeIcon size={16} className="text-gray-500" />}
          title="Home"
        />
        <GlobalFooter
          ref={footerRef}
          value=""
          onChange={() => {}}
          onSend={() => {}}
          disabled
        />
      </div>
    ); // Show basic layout while measuring
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />

      <GlobalSubheader
        ref={upcomingEventsTitleRef}
        icon={<HomeIcon size={16} className="text-gray-500" />}
        title="Home"
      />
      
      {/* Scrollable Page Content Area */}
      <div 
        ref={pageContentRef}
        className="flex-1 w-full bg-gray-50 overflow-y-auto px-4"
        style={{
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.offsetHeight || 0) + 8}px`,
          zIndex: 1, // Ensure it's below the chat drawer
        }}
      >
        {/* 7-Day Event Outlook Section */}
        <SevenDayEventOutlook />

        {/* Keepers Section */}
        <ThirtyDayKeeperOutlook />
      </div>
      <GlobalChatDrawer
        drawerHeight={currentDrawerHeight}
        maxDrawerHeight={maxDrawerHeight}
        onHeightChange={handleDrawerHeightChange}
        scrollContainerRefCallback={chatContentScrollRef}
      >
        {(() => {
          console.log("[Home Rendering Debug] ChatDrawer content rendering:", {
            messagesLength: messages.length,
            isInitializing,
            threadId,
            scrollRefReady
          });
          return (
            <div ref={messagesContentRef}>
              <ChatMessageList
                messages={messages}
                onCreateAccount={() => {
                              setShowSignup(true);
                              setSignupStep(0);
                              setSignupData({});
                              addMessage({
                    id: generateUUID(),
                                sender: 'assistant',
                                content: "Let's get you set up! What's your name?"
                              });
                            }}
                onRemindLater={() => setShowPostSignupOptions(false)}
                latestChildName={latestChildName}
              />
            </div>
          );
        })()}
      </GlobalChatDrawer>
      {pendingEvent && (
        <EventConfirmationCard
          {...pendingEvent}
          onConfirm={() => {
            addEvent(pendingEvent);
            setLatestEvent(pendingEvent);
            setPendingEvent(null);
            addMessage({
              id: generateUUID(),
              sender: 'assistant',
              content: `Got it! "${pendingEvent.eventName || pendingEvent.name}" is now on your calendar.`
            });
          }}
          onCancel={() => setPendingEvent(null)}
        />
      )}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={(password) => {
          setSignupData(prev => ({ ...prev, password }));
          setShowPasswordModal(false);
          setSignupStep(2);
          // Add post-signup options message
          setTimeout(() => {
            addMessage({
              id: generateUUID(),
              sender: 'assistant',
              type: 'post_signup_options',
              content: ''
            });
          }, 400);
        }}
      />
      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSend}
        disabled={isInitializing || !threadId}
      />

    </div>
  );
} 