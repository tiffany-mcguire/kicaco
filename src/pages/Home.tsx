// import React from 'react';
import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/ChatBubble';
import IconButton from '../components/IconButton';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
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
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { parse, format } from 'date-fns';
import PasswordModal from '../components/PasswordModal';
import PostSignupOptions from '../components/PostSignupOptions';

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

export default function Home() {
  console.log("[Home Function Body] window.innerHeight:", window.innerHeight);

  const [input, setInput] = useState("");
  const [hasIntroPlayed, setHasIntroPlayed] = useState(() => {
    return localStorage.getItem('kicaco_intro_played') === 'true';
  });
  const [currentWindowHeight, setCurrentWindowHeight] = useState(window.innerHeight);
  const introStartedRef = useRef(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [scrollRefReady, setScrollRefReady] = useState(false);
  const internalChatContentScrollRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const autoscrollFlagRef = useRef(false); // For managing autoscroll after new message
  const mutationObserverRef = useRef<MutationObserver | null>(null); // Ref for the new MutationObserver
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
  const upcomingEventsTitleRef = useRef<HTMLElement>(null); // New ref for the fixed title section
  const footerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef(messages.length);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);
  const [initialHomePageDrawerHeightCalculated, setInitialHomePageDrawerHeightCalculated] = useState(false);
  const [contentAreaTop, setContentAreaTop] = useState(0);
  const keepersBlurbRef = useRef<HTMLDivElement>(null); // Ref for Keepers blurb
  const [pageContentLoadedAndMeasured, setPageContentLoadedAndMeasured] = useState(false); // New state
  // const [upcomingEventsSectionHeight, setUpcomingEventsSectionHeight] = useState(0); // Not strictly needed if used directly

  // Animated message reveal state
  const [visibleCount, setVisibleCount] = useState(0);

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
          id: crypto.randomUUID(),
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
        const response = await createOpenAIThread();
        console.log('Thread creation response:', response);
        if (!response) {
          throw new Error('No response from thread creation');
        }
        setThreadId(response);
        setTimeout(() => {
          console.log('Zustand threadId after set:', useKicacoStore.getState().threadId);
        }, 0);
        console.log('Thread initialized with ID:', response);
      } catch (error) {
        console.error('Failed to initialize thread:', error);
        addMessage({
          id: crypto.randomUUID(),
          sender: 'assistant',
          content: 'I\'m having trouble starting our conversation. Please refresh the page and try again.'
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
  const [eventCreationMessage, setEventCreationMessage] = useState<string>("");
  const [currentEventFields, setCurrentEventFields] = useState<any>({});
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

  // Callback ref for the messages content div to attach MutationObserver
  const messagesContentRef = useCallback((node: HTMLDivElement | null) => {
    const pageName = window.location.pathname.includes('upcoming-events') ? "UpcomingEvents" : "Home";
    
    // Disconnect previous observer if any
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
      console.log(`  [${pageName}] Mutation Observer: DISCONNECTED (due to ref callback re-run or node removal).`);
    }

    if (node && scrollRefReady) { // Only observe if node exists and scroll container is ready
      console.log(`  [${pageName}] messagesContentRef CALLBACK FIRED with node. Setting up Mutation Observer.`);
      const observer = new MutationObserver((mutationsList) => {
        // Check if autoscroll is intended and if there were actual mutations
        if (autoscrollFlagRef.current && mutationsList.length > 0) {
          console.log(`    [${pageName}] Mutation Observer: Autoscroll flag TRUE, content mutated (${mutationsList.length} mutations). Scrolling.`);
          executeScrollToBottom();
        } else if (mutationsList.length > 0) {
           console.log(`    [${pageName}] Mutation Observer: Autoscroll flag FALSE or no mutations, content mutated (${mutationsList.length} mutations). No scroll by MutationObserver.`);
        }
      });
      
      observer.observe(node, { childList: true, subtree: true, characterData: true });
      mutationObserverRef.current = observer; // Store the new observer
      console.log(`  [${pageName}] Mutation Observer: ATTACHED to new messagesContentRef node.`);
    } else if (node) {
        console.log(`  [${pageName}] messagesContentRef CALLBACK FIRED with node, but scrollRefReady is FALSE (${scrollRefReady}). Observer not attached yet.`);
    } else {
        console.log(`  [${pageName}] messagesContentRef CALLBACK FIRED with NULL node. Observer not attached.`);
    }
  }, [scrollRefReady, executeScrollToBottom]);

  // Replace the first scroll management useEffect (EFFECT 1)
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
      // This branch runs if not newMessagesAdded (e.g., scroll restoration or re-runs due to chatScrollPosition/scrollRefReady changes).
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

  // Add ResizeObserver useEffect
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

  // Add EFFECT 2 (Manual Scroll Listener)
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

  // Update chatContentScrollRef to use useCallback
  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
    if (node) {
      console.log("[Home] chatContentScrollRef CALLBACK FIRED with node.");
    }
  }, []); // Empty dependency array for stable ref callback

  const handleSend = async () => {
    console.log('Current threadId:', threadId, 'isInitializing:', isInitializing);
    if (!input.trim()) return;
    if (isInitializing || !threadId) {
      addMessage({
        id: crypto.randomUUID(),
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
          id: crypto.randomUUID(),
          sender: 'user',
          content: input.trim()
        });
        setInput('');
        setSignupStep(1);
        setTimeout(() => {
          addMessage({
            id: crypto.randomUUID(),
            sender: 'assistant',
            content: 'Great! What email would you like to use?'
          });
        }, 400);
        return;
      }
      if (signupStep === 1) {
        setSignupData(prev => ({ ...prev, email: input.trim() }));
        addMessage({
          id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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

    // Track the original event-creation message (the one that started the event flow)
    const eventKeywords = [
      'have', 'attend', 'go to', 'set', 'schedule', 'add', 'plan', 'join', 'host',
      'tomorrow', 'tonight', 'next week', 'next friday', 'this friday',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'
    ];
    let isNewEvent = false;
    if (
      eventKeywords.some(kw => userText.toLowerCase().includes(kw)) &&
      (!eventCreationMessage || eventCreationMessage.length === 0)
    ) {
      setEventCreationMessage(userText);
      isNewEvent = true;
    }

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

    // Update current event fields
    let updatedFields = { ...currentEventFields };
    const extractedFields = extractKnownFields(userText, currentEventFields);
    console.log('Extracted fields:', extractedFields);
    // Merge all extracted fields into updatedFields
    Object.assign(updatedFields, extractedFields);
    setCurrentEventFields(updatedFields);

    // Process message with kicacoFlow
    console.time("Total Message Lifecycle");
    console.time("API Response Time");
    
    try {
      const assistantResponse = await sendMessageToAssistant(threadId, userText);
      
      // Robust event extraction from code block or plain JSON
      let eventObj = null;
      try {
        // Try to extract JSON from code block
        const codeBlockMatch = assistantResponse.match(/```json\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
          const parsed = JSON.parse(codeBlockMatch[1]);
          if (parsed.event) eventObj = parsed.event;
        } else {
          // Try plain JSON
          try {
            const parsed = JSON.parse(assistantResponse);
            if (parsed.event) eventObj = parsed.event;
          } catch {
            // Try to extract JSON from anywhere in the message
            const firstBrace = assistantResponse.indexOf('{');
            if (firstBrace !== -1) {
              const jsonSubstring = assistantResponse.slice(firstBrace);
              try {
                const parsed = JSON.parse(jsonSubstring);
                if (parsed.event) eventObj = parsed.event;
              } catch {}
            }
          }
        }
      } catch {
        // Not JSON — just chat
      }
      if (eventObj) {
        // Overwrite eventObj fields with locally tracked currentEventFields
        eventObj = { ...eventObj, ...updatedFields };
        addEvent(eventObj);        // Add event to store immediately
        console.log('Event added to store:', eventObj);
        // setTimeout(() => { // This setTimeout for logging can be kept or removed, not critical for the fix
        //   console.log('Current events array:', useKicacoStore.getState().events);
        // }, 100);
        // setPendingEvent(eventObj); // MODAL TRIGGER REMOVED

        setLatestEvent(eventObj); // Moved from modal's onConfirm logic
        
        // Remove thinking message before adding the real response
        removeMessageById('thinking');

        // Generate the confirmation message from the locally resolved event object
        const formattedDate = eventObj.date ? format(parse(eventObj.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy') : '';
        const formattedTime = formatTime(eventObj.time);
        const confirmationMsg = `Okay! I\'ve saved ${eventObj.childName}\'s ${eventObj.eventName} for ${formattedDate} at ${formattedTime} in ${eventObj.location}.`;
        const assistantMessage = {
          id: crypto.randomUUID(),
          sender: 'assistant' as const,
          type: 'event_confirmation',
          content: confirmationMsg,
          event: eventObj
        };
        addMessage(assistantMessage);

      } else {
        // Remove thinking message before adding the real response
        removeMessageById('thinking');

        const assistantMessage = {
          id: crypto.randomUUID(),
          sender: 'assistant' as const,
          content: assistantResponse
        };
        addMessage(assistantMessage);
      }
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

  return (
    <div className="flex flex-col h-screen bg-white">
      <GlobalHeader ref={headerRef} />

      {/* Fixed "Upcoming Events" Title Section */}
      <section
        ref={upcomingEventsTitleRef}
        className="px-4 pt-4 w-full bg-white z-20" // z-index to stay above scrollable content
        style={{
          position: 'absolute',
          top: `${headerRef.current?.offsetHeight ?? 0}px`,
          left: '0px',
          right: '0px',
          // backgroundColor: 'white', // Ensure it has a background
        }}
      >
        <div style={{width:'180px'}}>
          <div className="h-0.5 bg-[#E9D5FF] rounded w-full mb-0" style={{ opacity: 0.75 }}></div>
          <div className="flex items-center space-x-2 pl-1">
            <svg width="16" height="16" fill="rgba(185,17,66,0.75)" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>
            <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Home</h2>
          </div>
          <div className="h-0.5 bg-[#E9D5FF] rounded w-full mt-0" style={{ opacity: 0.75 }}></div>
        </div>
      </section>
      
      {/* Scrollable Page Content Area */}
      {(() => {
        // Original console log for subheader rendering condition can be kept or removed
        // console.log("[Home Rendering Debug] Subheader rendering condition:", { /* ... */ });
        return (
          <div 
            ref={pageContentRef} // This was 'subheaderRef' from your restored version
            className="w-full bg-white" // Removed z-10 and profiles-roles-subheader
            style={{
              position: 'absolute',
              top: `${contentAreaTop}px`, // Dynamically set below fixed title section
              bottom: `${(currentDrawerHeight || 32) + (footerRef.current?.offsetHeight || 0) + 8}px`, // 8px buffer
              left: '0px',
              right: '0px',
              overflowY: 'auto',
              paddingLeft: '1rem', // px-4
              paddingRight: '1rem', // px-4
            }}
          >
            {/* Upcoming Events Cards */}
            {events.length > 0 && (
              <div className="flex flex-col w-full pt-2 pb-2"> {/* Removed px-4 as parent has it */}
                {events.map((event, idx) => (
                  <div key={event.eventName + event.date + idx}>
                    <EventCard
                      image={getKicacoEventPhoto(event.eventName)}
                      name={event.eventName}
                      childName={event.childName}
                      date={event.date}
                      time={event.time}
                      location={event.location}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
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
            <div
              ref={messagesContentRef}
              className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4"
            >
              {messages.map((msg, idx) => {
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
                            childName={msg.event.childName}
                            date={msg.event.date}
                            time={msg.event.time}
                            location={msg.event.location}
                          />
                          <div className="mt-2 text-left w-full text-sm text-gray-900">{
                            msg.content.replace(/Want to change anything\??/, '').trim()
                          }</div>
                          <div className="mt-3 text-xs text-gray-500 font-inter">
                            Want to save this and keep building your child's schedule? Create an account to save and manage all your events in one place. No forms, just your name and email to get started!
                          </div>
                          <button
                            className="mt-3 h-[30px] px-2 border border-[#c0e2e7] rounded-md font-nunito font-semibold text-xs sm:text-sm text-[#217e8f] bg-white shadow-[-2px_2px_0px_rgba(0,0,0,0.25)] hover:shadow-[0_0_16px_4px_#c0e2e7aa,-2px_2px_0px_rgba(0,0,0,0.25)] transition-all duration-200 focus:outline-none w-[140px] active:scale-95 active:shadow-[0_0_16px_4px_#c0e2e7aa,-2px_2px_0px_rgba(0,0,0,0.15)]"
                            onClick={() => {
                              setShowSignup(true);
                              setSignupStep(0);
                              setSignupData({});
                              addMessage({
                                id: crypto.randomUUID(),
                                sender: 'assistant',
                                content: "Let's get you set up! What's your name?"
                              });
                            }}
                          >
                            Create an account
                          </button>
                        </div>
                      </ChatBubble>
                    </motion.div>
                  );
                }
                if (msg.type === 'post_signup_options') {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full"
                    >
                      <ChatBubble side="left" className="w-full max-w-[95vw] sm:max-w-3xl">
                        <PostSignupOptions onRemindLater={() => setShowPostSignupOptions(false)} />
                      </ChatBubble>
                    </motion.div>
                  );
                }
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
      {pendingEvent && (
        <EventConfirmationCard
          {...pendingEvent}
          onConfirm={() => {
            addEvent(pendingEvent);
            setLatestEvent(pendingEvent);
            setPendingEvent(null);
            addMessage({
              id: crypto.randomUUID(),
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
              id: crypto.randomUUID(),
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