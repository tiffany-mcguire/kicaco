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
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef(messages.length);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);
  const [initialHomePageDrawerHeightCalculated, setInitialHomePageDrawerHeightCalculated] = useState(false);

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
    localStorage.setItem('kicaco_intro_played', 'true');
  }, [hasIntroPlayed, addMessage]);

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

  // --- Page-specific Max Drawer Height & Initial Homepage Drawer Height (Restoring Prior Logic Pattern) ---
  useLayoutEffect(() => {
    console.log(`[Home Reverted Logic - Drawer Sizing] START. storedDrawerHeight: ${storedDrawerHeight}, initialCalculated: ${initialHomePageDrawerHeightCalculated}, blurbGone: ${blurbGone}`);
    try {
      const footer = document.querySelector('.global-footer') as HTMLElement | null;
      const footerHeightVal = footer ? footer.getBoundingClientRect().height : 0;

      // Determine Home's max height: can be lower if blurbs are present, otherwise up to subheader.
      let homeCalculatedMaxHeight = 44;
      if (!blurbGone) {
        // Blurbs are visible: max height is likely based on first blurb position to avoid overlap initially.
        const blurbsForMax = Array.from(document.querySelectorAll('p.section-blurb'));
        if (blurbsForMax.length >= 1) {
          const firstBlurb = blurbsForMax[0];
          homeCalculatedMaxHeight = currentWindowHeight - footerHeightVal - firstBlurb.getBoundingClientRect().top - 4; // 4px padding above footer
          console.log(`[Home Reverted Logic - Drawer Sizing] Max height (blurbs visible) calculated: ${homeCalculatedMaxHeight}`);
        } else if (subheaderRef.current) { // Fallback if blurbs were expected but not found
            homeCalculatedMaxHeight = currentWindowHeight - footerHeightVal - subheaderRef.current.getBoundingClientRect().bottom - 4;
            console.log(`[Home Reverted Logic - Drawer Sizing] Max height (blurbs visible, no blurbs found, using subheader) calculated: ${homeCalculatedMaxHeight}`);
        } else {
            homeCalculatedMaxHeight = currentWindowHeight * 0.7; // Generic fallback
        }
      } else {
        // Blurbs are gone: max height is up to the subheader.
        if (subheaderRef.current) {
          const subheaderBottomVal = subheaderRef.current.getBoundingClientRect().bottom;
          homeCalculatedMaxHeight = currentWindowHeight - footerHeightVal - subheaderBottomVal - 4;
          console.log(`[Home Reverted Logic - Drawer Sizing] Max height (blurbs gone, using subheader) calculated: ${homeCalculatedMaxHeight}`);
        } else {
            homeCalculatedMaxHeight = currentWindowHeight * 0.85; // Fallback if no subheader
        }
      }
      homeCalculatedMaxHeight = Math.max(homeCalculatedMaxHeight, 44);
      setMaxDrawerHeight(homeCalculatedMaxHeight); // This is Home's current operational max height.

      // Manage storedDrawerHeight
      if (!initialHomePageDrawerHeightCalculated) {
        let heightToSetInStore;
        if (storedDrawerHeight !== null && storedDrawerHeight !== undefined) {
          // Store has a value (e.g. from another page). Use it, but cap by Home's *current* operational max.
          heightToSetInStore = Math.min(storedDrawerHeight, homeCalculatedMaxHeight);
          console.log(`[Home Reverted Logic - Drawer Sizing] Initial: Using pre-existing store value ${storedDrawerHeight}, capped to ${heightToSetInStore}`);
        } else {
          // Store is empty. Set it to a fraction of Home's *current* operational max, or a blurb-based height.
          // This logic should ensure the initial opening is sensible for the current state (blurbs vs no blurbs).
          if (!blurbGone) {
            const blurbsForInitialOpen = Array.from(document.querySelectorAll('p.section-blurb'));
            if (blurbsForInitialOpen.length >= 2) {
                 heightToSetInStore = currentWindowHeight - footerHeightVal - blurbsForInitialOpen[1].getBoundingClientRect().bottom - 4;
            } else {
                 heightToSetInStore = homeCalculatedMaxHeight * 0.6; // Default open to 60% of current max if blurbs visible but not 2 found
            }
          } else {
            heightToSetInStore = homeCalculatedMaxHeight * 0.75; // Default open to 75% of current max if blurbs gone
          }
          heightToSetInStore = Math.max(heightToSetInStore, 44);
          heightToSetInStore = Math.min(heightToSetInStore, homeCalculatedMaxHeight); // Cap by current max
          console.log(`[Home Reverted Logic - Drawer Sizing] Initial: Store empty. Setting to calculated open height: ${heightToSetInStore}`);
        }
        setStoredDrawerHeight(heightToSetInStore);
        setInitialHomePageDrawerHeightCalculated(true);
      } else {
        // Initial Home setup is done. Only cap storedDrawerHeight if it exceeds Home's current operational max.
        if (storedDrawerHeight !== null && storedDrawerHeight !== undefined && storedDrawerHeight > homeCalculatedMaxHeight) {
          console.log(`[Home Reverted Logic - Drawer Sizing] Post-Initial: Stored value ${storedDrawerHeight} exceeds current max ${homeCalculatedMaxHeight}. Capping.`);
          setStoredDrawerHeight(homeCalculatedMaxHeight);
        }
      }
    } catch (error) {
      console.error("[Home Reverted Logic - Drawer Sizing] Error:", error);
      // Simplified fallback
      setMaxDrawerHeight(Math.max(currentWindowHeight - 160, 44));
      if (!initialHomePageDrawerHeightCalculated && (storedDrawerHeight === null || storedDrawerHeight === undefined)) {
        setStoredDrawerHeight(44);
        setInitialHomePageDrawerHeightCalculated(true);
      }
    }
  }, [currentWindowHeight, storedDrawerHeight, setStoredDrawerHeight, subheaderRef, blurbGone, setMaxDrawerHeight, initialHomePageDrawerHeightCalculated, setInitialHomePageDrawerHeightCalculated]);

  // The currentDrawerHeight to pass to GlobalChatDrawer should always be from the store
  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 44;

  // handleDrawerHeightChange should clamp against the trueSubheaderMax (which is in maxDrawerHeight state)
  const handleDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 44); // maxDrawerHeight here is trueSubheaderMax
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
        setTimeout(() => {
          console.log('Current events array:', useKicacoStore.getState().events);
        }, 100);
        setPendingEvent(eventObj); // Show confirmation modal
      }
      // Remove thinking message before adding the real response
      removeMessageById('thinking');

      // Generate the confirmation message from the locally resolved event object
      if (eventObj) {
        const formattedDate = eventObj.date ? format(parse(eventObj.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy') : '';
        const formattedTime = formatTime(eventObj.time);
        const confirmationMsg = `Okay! I've saved ${eventObj.childName}'s ${eventObj.eventName} for ${formattedDate} at ${formattedTime} in ${eventObj.location}.`;
        const assistantMessage = {
          id: crypto.randomUUID(),
          sender: 'assistant' as const,
          type: 'event_confirmation',
          content: confirmationMsg,
          event: eventObj
        };
        addMessage(assistantMessage);
      } else {
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
    blurbGone,
    currentDrawerHeight,
    storedDrawerHeight
  });

  return (
    <div className="flex flex-col h-screen bg-white">
      <GlobalHeader ref={headerRef} />
      {/* Subheader (for double header effect) */}
      {(() => {
        console.log("[Home Rendering Debug] Subheader rendering condition:", {
          hasIntroPlayed,
          isInitializing,
          threadId,
          messagesLength: messages.length
        });
        return (
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
              {!blurbGone && (
                <p className="mt-2 text-gray-700 text-[15px] leading-snug font-medium w-full text-left section-blurb" style={{marginBottom: 0, paddingBottom: 0}}>
                  Kicaco gives you a clear and up-to-date view of what's next, so you never miss a practice, recital, or class party.
                </p>
              )}
            </section>
            {/* Upcoming Events Cards */}
            {events.length > 0 && (
              <div className="flex flex-col w-full pt-2 pb-2 px-4">
                {events.map((event, idx) => (
                  <div key={event.eventName + event.date + idx}>
                    <EventCard
                      image={getKicacoEventPhoto(event.eventName)}
                      name={event.eventName}
                      date={event.date}
                      time={event.time}
                      location={event.location}
                    />
                  </div>
                ))}
              </div>
            )}
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
            {/* Keepers Cards */}
            {keepers.length > 0 && (
              <div className="flex flex-col items-center w-full pt-2 pb-2">
                {keepers.map((keeper, idx) => (
                  <div key={keeper.keeperName + keeper.date + idx} className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-pink-200 flex items-center p-3 mb-4 transition hover:shadow-2xl">
                    <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border border-pink-200 mr-4 bg-pink-100 flex items-center justify-center">
                      <span role="img" aria-label="keeper" style={{fontSize: 32}}>📒</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h3 className="text-base font-bold text-pink-900 truncate mb-0.5">{keeper.keeperName}</h3>
                      {keeper.date && <div className="text-sm text-pink-600 mb-0.5 truncate">Date: {keeper.date}</div>}
                      {keeper.time && <div className="text-sm text-pink-600 mb-0.5 truncate">Time: {keeper.time}</div>}
                      {keeper.location && <div className="text-sm text-pink-600 truncate">Location: {keeper.location}</div>}
                    </div>
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
                    <ChatBubble key={msg.id} side="left" className="w-full max-w-[95vw] sm:max-w-3xl">
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
                  );
                }
                if (msg.type === 'post_signup_options') {
                  return (
                    <ChatBubble key={msg.id} side="left" className="w-full max-w-[95vw] sm:max-w-3xl">
                      <PostSignupOptions onRemindLater={() => setShowPostSignupOptions(false)} />
                    </ChatBubble>
                  );
                }
                return (
                  <ChatBubble
                    key={msg.id}
                    side={msg.sender === 'user' ? 'right' : 'left'}
                  >
                    {msg.content}
                  </ChatBubble>
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