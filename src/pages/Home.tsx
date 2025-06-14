// import React from 'react';
import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/ChatBubble';
import IconButton from '../components/IconButton';
import React, { useState, useMemo, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
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
import KeeperCard from '../components/KeeperCard';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { parse, format, addDays, startOfDay, isSameDay, parseISO, isWithinInterval, endOfDay, differenceInDays } from 'date-fns';
import PasswordModal from '../components/PasswordModal';
import PostSignupOptions from '../components/PostSignupOptions';
import { Home as HomeIcon, ChevronLeft, ChevronRight } from "lucide-react";
import GlobalSubheader from '../components/GlobalSubheader';

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

// Helper → get next 7 days
const generateNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      date,
      label: format(date, 'EEE'),
      number: format(date, 'd'),
      dayOfWeek: date.getDay(), // Add day of week for color mapping
      isToday: i === 0, // Track if this is today
    });
  }
  return days;
};

// Rainbow colors for days of the week
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', // Sunday - pink
  1: '#ffd8b5', // Monday - orange
  2: '#fde68a', // Tuesday - yellow
  3: '#bbf7d0', // Wednesday - green
  4: '#c0e2e7', // Thursday - blue
  5: '#d1d5fa', // Friday - indigo
  6: '#e9d5ff', // Saturday - purple
};

// Darker rainbow colors for selected state
const dayColorsDark: { [key: number]: string } = {
  0: '#ec4899', // Sunday - pink
  1: '#f97316', // Monday - orange
  2: '#eab308', // Tuesday - yellow
  3: '#22c55e', // Wednesday - green
  4: '#06b6d4', // Thursday - blue
  5: '#6366f1', // Friday - indigo
  6: '#a855f7', // Saturday - purple
};

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
  const upcomingEventsTitleRef = useRef<HTMLDivElement>(null); // New ref for the fixed title section
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

  const next7Days = useMemo(() => generateNext7Days(), []);
  const [selectedDate, setSelectedDate] = useState(next7Days[0].date);

  // Filter and sort events for the selected day
  const eventsForSelectedDay = useMemo(() => {
    const parseTime = (timeStr?: string): number => {
      if (!timeStr) return 2400; // Events without time go last
      // Simple parse logic, can be improved
      const date = parse(timeStr, 'h:mm a', new Date());
      return date.getHours() * 100 + date.getMinutes();
    };

    return events
      .filter(event => event.date && isSameDay(parseISO(event.date), selectedDate))
      .sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }, [events, selectedDate]);
  
  // Reset index when selected day changes
  useEffect(() => {
    setDisplayedEventIndex(0);
  }, [selectedDate]);

  // Filter keepers for next 30 days
  const keepersNext30Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const thirtyDaysFromNow = addDays(today, 30);
    
    console.log('Filtering keepers. Today:', today, 'Thirty days from now:', thirtyDaysFromNow);
    console.log('All keepers:', keepers);
    
    const filtered = keepers.filter(keeper => {
      if (!keeper.date) return false;
      try {
        const keeperDate = parseISO(keeper.date);
        keeperDate.setHours(0, 0, 0, 0); // Normalize to start of day
        const isInRange = keeperDate >= today && keeperDate <= thirtyDaysFromNow;
        console.log('Keeper:', keeper.keeperName, 'Date:', keeper.date, 'Parsed:', keeperDate, 'In range:', isInRange);
        return isInRange;
      } catch (e) {
        console.error('Error parsing date for keeper:', keeper, e);
        return false;
      }
    }).sort((a, b) => {
      // Sort by date
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    console.log('Filtered keepers:', filtered);
    return filtered;
  }, [keepers]);

  // State for keeper card interactions
  const [activeKeeperIndex, setActiveKeeperIndex] = useState<number | null>(null);

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
    const isNewEvent = eventKeywords.some(kw => userText.toLowerCase().includes(kw)) && !eventCreationMessage;

    if (isNewEvent) {
      setEventCreationMessage(userText);
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

    // Determine the base fields for the current operation.
    // If it's a new event, start with a blank slate. Otherwise, use the existing fields.
    const baseFields = isNewEvent ? {} : currentEventFields;
    const extractedFields = extractKnownFields(userText, baseFields);
    const updatedFields = { ...baseFields, ...extractedFields };

    // Update state for the NEXT turn.
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
        const finalEvent = { ...eventObj, ...updatedFields };
        addEvent(finalEvent);
        console.log('Event added to store:', finalEvent);

        // Reset for the next conversation
        setCurrentEventFields({});
        setEventCreationMessage("");
        setLatestEvent(finalEvent);
        
        // Remove thinking message before adding the real response
        removeMessageById('thinking');

        // Generate the confirmation message from the locally resolved event object
        const assistantMessage = {
          id: crypto.randomUUID(),
          sender: 'assistant' as const,
          type: 'event_confirmation',
          content: '',
          event: finalEvent
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

  const [displayedEventIndex, setDisplayedEventIndex] = useState(0);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />

      <GlobalSubheader
        ref={upcomingEventsTitleRef}
        icon={<HomeIcon size={16} className="text-gray-500" />}
        title="Home"
      />
      
      {/* Scrollable Page Content Area */}
      {(() => {
        // Original console log for subheader rendering condition can be kept or removed
        // console.log("[Home Rendering Debug] Subheader rendering condition:", { /* ... */ });
        return (
          <div 
            ref={pageContentRef} // This was 'subheaderRef' from your restored version
            className="w-full bg-gray-50" // Removed z-10 and profiles-roles-subheader
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
            <div className="relative w-full max-w-md mx-auto">
              {/* Event Carousel Controls now in the bottom right */}
              {eventsForSelectedDay.length > 1 && (
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                  <button 
                    onClick={() => setDisplayedEventIndex(prev => (prev - 1 + eventsForSelectedDay.length) % eventsForSelectedDay.length)}
                    className="bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors"
                    aria-label="Previous event"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full bg-black/40">
                    {displayedEventIndex + 1} / {eventsForSelectedDay.length}
                  </span>
                  <button 
                    onClick={() => setDisplayedEventIndex(prev => (prev + 1) % eventsForSelectedDay.length)}
                    className="bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors"
                    aria-label="Next event"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Event Content */}
              <div className="relative rounded-xl shadow-lg overflow-hidden">
                {eventsForSelectedDay.length > 0 ? (
                  <>
                    <EventCard
                      image={getKicacoEventPhoto(eventsForSelectedDay[displayedEventIndex].eventName)}
                      name={eventsForSelectedDay[displayedEventIndex].eventName}
                      childName={eventsForSelectedDay[displayedEventIndex].childName}
                      date={eventsForSelectedDay[displayedEventIndex].date}
                      time={eventsForSelectedDay[displayedEventIndex].time}
                      location={eventsForSelectedDay[displayedEventIndex].location}
                      notes="Remember to bring sunscreen and a water bottle!"
                    />
                  </>
                ) : (
                  <div className="relative w-full h-[240px] rounded-xl overflow-hidden">
                    <img
                      src={getKicacoEventPhoto('default')}
                      alt="No events"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/[.65]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white font-normal">No events scheduled.</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Tabs overlay bar */}
              <div className="absolute top-0 left-0 right-0 z-10">
                <div className="flex divide-x divide-white/20 backdrop-blur-sm rounded-t-xl overflow-hidden">
                  {next7Days.map(day => (
                    <button
                      key={day.label + day.number}
                      onClick={() => setSelectedDate(day.date)}
                      className={`flex-1 flex flex-col items-center py-2 text-xs sm:text-sm font-medium transition-all relative overflow-hidden ${
                        isSameDay(day.date, selectedDate)
                          ? 'text-white font-bold'
                          : 'text-white/70'
                      }`}
                    >
                      {/* Rainbow background for selected tab */}
                      {isSameDay(day.date, selectedDate) && (
                        <div 
                          className="absolute inset-0"
                          style={{ 
                            background: `linear-gradient(180deg, ${dayColorsDark[day.dayOfWeek]}30 0%, ${dayColorsDark[day.dayOfWeek]}25 50%, ${dayColorsDark[day.dayOfWeek]}20 100%)`,
                            filter: 'blur(4px)'
                          }}
                        />
                      )}
                      <span className="relative z-10">{day.label}</span>
                      <span className="relative z-10 text-[10px]">{day.number}</span>
                      {/* Rainbow accent at bottom */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-[2px] transition-all z-10"
                        style={{ 
                          backgroundColor: dayColors[day.dayOfWeek],
                          opacity: day.isToday ? 0.9 : (isSameDay(day.date, selectedDate) ? 0.9 : 0.4)
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Keepers Section - No header, cards speak for themselves */}
            <div className="mt-8 mb-4">
              {keepersNext30Days.length > 0 ? (
                <div 
                  className="relative w-full max-w-md mx-auto"
                  style={{
                    height: `${240 + ((keepersNext30Days.length - 1) * 56)}px`,
                    marginBottom: '20px',
                  }}
                >
                  {keepersNext30Days.slice().reverse().map((keeper, index) => {
                    const stackPosition = keepersNext30Days.length - 1 - index;
                    return (
                      <KeeperCard
                        key={`${keeper.keeperName}-${keeper.date}-${stackPosition}`}
                        image={getKicacoEventPhoto(keeper.keeperName)}
                        keeperName={keeper.keeperName}
                        childName={keeper.childName}
                        date={keeper.date}
                        time={keeper.time}
                        description={keeper.description}
                        index={stackPosition}
                        stackPosition={stackPosition}
                        totalInStack={keepersNext30Days.length}
                        isActive={activeKeeperIndex === stackPosition}
                        activeIndex={activeKeeperIndex}
                        onTabClick={() => setActiveKeeperIndex(activeKeeperIndex === stackPosition ? null : stackPosition)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="relative w-full max-w-md mx-auto h-[240px] rounded-xl overflow-hidden shadow-lg">
                  {/* Background image */}
                  <img
                    src={getKicacoEventPhoto('keeper')}
                    alt="No keepers"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Full-card overlay */}
                  <div className="absolute inset-0 bg-black/[.65]" />
                  
                  {/* Text centered */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white text-base font-normal">No keepers in the next 30 days.</p>
                  </div>
                </div>
              )}
            </div>
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
                          <div className="mt-2 text-left w-full text-sm text-gray-900">
                            Want to save this and keep building your child's schedule? Create an account to save and manage all your events in one place. No forms, just your name and email to get started!
                          </div>
                          <button
                            className="mt-3 h-[30px] px-2 border border-[#c0e2e7] rounded-md font-semibold text-xs sm:text-sm text-[#217e8f] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_0_12px_2px_rgba(192,226,231,0.4),0_4px_6px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.12)] active:scale-95 active:shadow-[0_0_8px_1px_rgba(192,226,231,0.3),0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-200 focus:outline-none w-[140px]"
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