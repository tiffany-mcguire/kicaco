import { ChatMessageList } from '../components/chat';
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { GlobalHeader } from '../components/navigation';
import { GlobalFooter } from '../components/navigation';
import { GlobalChatDrawer } from '../components/chat';
import { useChatScrollManagement } from '../hooks/useChatScrollManagement';
import { useEventCreation } from '../hooks/useEventCreation';
import { useKicacoStore } from '../store/kicacoStore';
import { EventConfirmationCard } from '../components/calendar';
import { getApiClientInstance } from '../utils/apiClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { SevenDayEventOutlook, ThirtyDayKeeperOutlook } from '../components/calendar';

import { PasswordModal, ImageUpload } from '../components/common';
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



export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get location state to check if we need to scroll to a specific message
  const locationState = location.state as { targetMessageId?: string } | null;
  


  useEffect(() => {
    setIsMounted(true);
    // Log the entire store state once the component has mounted
    console.log("Kicaco Store State on Mount:", useKicacoStore.getState());
  }, []);

  const [input, setInput] = useState("");
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
    addEvent,
    addKeeper,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
    hasIntroPlayed,
    setHasIntroPlayed,
    disableIntro,
    setDisableIntro,
    blurbGone,
    setBlurbGone
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
  
  const { handleEventMessage } = useEventCreation();

  const events = useKicacoStore(state => state.events);
  const keepers = useKicacoStore(state => state.keepers);

  // Make intro control functions available globally for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).disableIntro = () => {
        setDisableIntro(true);
        setHasIntroPlayed(true);
        console.log('Intro messages disabled');
      };
      (window as any).enableIntro = () => {
        setDisableIntro(false);
        setHasIntroPlayed(false);
        console.log('Intro messages enabled - refresh page to see intro');
      };
    }
  }, [setDisableIntro, setHasIntroPlayed]);

  useEffect(() => {
    console.log('Events:', events);
    console.log('Keepers:', keepers);
    if ((events.length > 0 || keepers.length > 0) && !blurbGone) {
      setBlurbGone(true);
    }
  }, [events, keepers, blurbGone, setBlurbGone]);

  // Staggered intro messages
  useEffect(() => {
    const playIntroWithThinking = async () => {
      if (hasIntroPlayed || introStartedRef.current || disableIntro) return;
      
      // Skip intro if there's already data (events or keepers)
      if (events.length > 0 || keepers.length > 0) {
        console.log('Skipping intro - existing data found');
        setHasIntroPlayed(true);
        return;
      }
      
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
    };

    playIntroWithThinking();
  }, [hasIntroPlayed, disableIntro, addMessage, removeMessageById, setHasIntroPlayed, events.length, keepers.length]);

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
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [clearFooterActiveButton, setClearFooterActiveButton] = useState(false);

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

  // Effect to handle scrolling to a specific message from search results
  useEffect(() => {
    if (locationState?.targetMessageId) {
      // First, open the chat drawer to ensure the message is visible
      // Calculate a good height - at least 60% of max height to show the message clearly
      const targetDrawerHeight = Math.max(maxDrawerHeight * 0.6, 300);
      setStoredDrawerHeight(targetDrawerHeight);
      
      // Short delay to ensure the chat is rendered and drawer is opened
      setTimeout(() => {
        // Find the message element by its ID
        const messageElement = document.getElementById(`message-${locationState.targetMessageId}`);
        
        if (messageElement) {
          // Add CSS for highlighting the message
          const styleEl = document.createElement('style');
          styleEl.textContent = `
            .message-highlight {
              position: relative;
            }
            
            .message-highlight::after {
              content: '';
              position: absolute;
              inset: -4px;
              border-radius: 16px;
              border: 2px solid rgba(33, 126, 143, 0.7);
              animation: pulse-highlight 2s ease-in-out;
              pointer-events: none;
              box-shadow: 0 0 10px 2px rgba(33, 126, 143, 0.2);
            }
            
            @keyframes pulse-highlight {
              0%, 100% {
                box-shadow: 0 0 8px 2px rgba(33, 126, 143, 0.2);
                opacity: 0.6;
              }
              50% {
                box-shadow: 0 0 12px 4px rgba(33, 126, 143, 0.3);
                opacity: 0.8;
              }
            }
          `;
          document.head.appendChild(styleEl);
          
          // Scroll to the message
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight class
          messageElement.classList.add('message-highlight');
          
          // Remove highlight after animation and clean up style element
          setTimeout(() => {
            messageElement.classList.remove('message-highlight');
            document.head.removeChild(styleEl);
          }, 2000);
        }
      }, 500);
      
      // Clear the location state to prevent this effect from running again
      navigate('.', { replace: true, state: {} });
    }
  }, [locationState, maxDrawerHeight, setStoredDrawerHeight, navigate]);









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

    // Blur any active input to minimize keyboard on mobile
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.tagName === 'INPUT') {
      activeElement.blur();
    }

    // Use the event creation hook
    await handleEventMessage(userText);
  };

  // Handle image upload
  const handleImageUpload = () => {
    setShowImageUpload(true);
  };

  const handleImageUploadComplete = (response: string, createdEvents?: any[], createdKeepers?: any[]) => {
    // Remove thinking message
    removeMessageById('image-upload-thinking');
    
    // Add created events to the store
    if (createdEvents && createdEvents.length > 0) {
      createdEvents.forEach(event => {
        addEvent(event);
      });
    }
    
    // Add created keepers to the store
    if (createdKeepers && createdKeepers.length > 0) {
      createdKeepers.forEach(keeper => {
        addKeeper(keeper);
      });
    }
    
    // Add the AI response as a message
    addMessage({
      id: generateUUID(),
      sender: 'assistant',
      content: response
    });
    
    // Close the upload interface
    setShowImageUpload(false);
    
    // Clear the active button state in the footer
    setClearFooterActiveButton(true);
    // Reset the clear flag after a short delay
    setTimeout(() => setClearFooterActiveButton(false), 100);
    
    // Blur any active input to minimize keyboard after upload
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.tagName === 'INPUT') {
      activeElement.blur();
    }
  };

  const handleImageUploadStart = () => {
    // Add a thinking message while processing
    const thinkingId = 'image-upload-thinking';
    addMessage({
      id: thinkingId,
      sender: 'assistant',
      content: 'Kicaco is analyzing your image'
    });
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
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.offsetHeight || 0) + 200}px`, // Added extra padding for expanded keeper cards
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
                onRemindLater={() => {}}
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
        onUploadClick={handleImageUpload}
        disabled={isInitializing || !threadId}
        clearActiveButton={clearFooterActiveButton}
      />
      
      {/* Image Upload Modal */}
      {showImageUpload && threadId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ImageUpload
              threadId={threadId}
              onUploadComplete={handleImageUploadComplete}
              onUploadStart={handleImageUploadStart}
              onClose={() => setShowImageUpload(false)}
              prompt="Please analyze this image and extract ALL event information. Create events/keepers immediately with any information you find. After creating them, you MUST ask follow-up questions for any missing required information (location, child name, time, etc.) one at a time. Treat this as the START of a conversation, not the end."
            />
          </div>
        </div>
      )}

    </div>
  );
} 