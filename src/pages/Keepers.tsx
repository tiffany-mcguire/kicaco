
import { ChatBubble } from '../components/chat';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { AddKeeperButton } from '../components/common';
import { GlobalHeader } from '../components/navigation';
import { GlobalFooter } from '../components/navigation';
import { GlobalChatDrawer } from '../components/chat';
import { GlobalSubheader } from '../components/navigation';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Bell, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { KeeperCard } from '../components/calendar';
import { parse, format, startOfDay, isAfter, isSameDay, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { StackedChildBadges } from '../components/common';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';

import { generateUUID } from '../utils/uuid';

// Day colors for accent line (same as EventCard and UpcomingEvents)
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

// Helper functions
const formatDate = (date?: string) => {
  if (!date) return '';
  try {
    const d = parse(date, 'yyyy-MM-dd', new Date());
    return isNaN(d.getTime()) ? date : format(d, 'EEEE, MMMM d');
  } catch { return date; }
};

const formatTime = (time?: string) => {
  if (!time) return '';
  let normalized = time.trim().toLowerCase().replace(/(\d)(am|pm)/, '$1 $2');
  if (/^\d{1,2}\s?(am|pm)$/.test(normalized)) {
    normalized = normalized.replace(/^(\d{1,2})\s?(am|pm)$/, '$1:00 $2');
  }
  const patterns = ['h:mm a', 'h a', 'h:mma', 'ha', 'H:mm'];
  for (const pattern of patterns) {
    try {
      const dateObj = parse(normalized, pattern, new Date());
      if (!isNaN(dateObj.getTime())) return format(dateObj, 'hh:mm a');
    } catch {}
  }
  const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
  return isNaN(dateObj.getTime()) ? time : format(dateObj, 'hh:mm a');
};

// Carousel Keeper Card Component
const CarouselKeeperCard = React.memo(({ 
  dayKeepers, date, stackPosition, totalInStack, isActive, activeIndex, onTabClick, 
  navigate, removeKeeper, keepers, onFlickDismiss
}: any) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Touch handling for swipe gestures and flick-to-dismiss
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  const touchIntentionRef = useRef<'unknown' | 'horizontal' | 'swipe' | 'flick' | 'expand'>('unknown');
  
  // Helper function to reset touch state
  const resetTouchState = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
    touchStartTime.current = null;
    touchIntentionRef.current = 'unknown';
  }, []);

  // Handle swipe navigation
  const handleSwipe = (direction: number) => {
    if (dayKeepers.length <= 1) return;
    
    if (direction > 0) {
      // Swipe left - next keeper
      setCurrentIdx((currentIdx + 1) % dayKeepers.length);
    } else {
      // Swipe right - previous keeper
      setCurrentIdx((currentIdx - 1 + dayKeepers.length) % dayKeepers.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    resetTouchState();
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    // Always prevent default on touch start to prevent scroll momentum
    e.preventDefault();
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    touchIntentionRef.current = 'unknown';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || touchStartTime.current === null) {
      resetTouchState();
      return;
    }

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(touchStartX.current - currentX);
    const diffY = Math.abs(touchStartY.current - currentY);
    
    if (touchIntentionRef.current === 'unknown') {
      const minMovement = 15;
      
      if (diffX > minMovement || diffY > minMovement) {
        const horizontalDisplacement = Math.abs(touchStartX.current - currentX);
        const verticalDisplacement = Math.abs(touchStartY.current - currentY);
        const verticalDiff = touchStartY.current - currentY; // Positive = upward movement
        const timeDiff = Date.now() - touchStartTime.current;
        const verticalVelocity = timeDiff > 0 ? Math.abs(verticalDiff) / timeDiff : 0;
        
        // Check for flick gesture (fast upward movement on active card) - more sensitive thresholds
        if (isActive && onFlickDismiss && verticalDiff > 15 && verticalVelocity > 0.3 && horizontalDisplacement < 50) {
          touchIntentionRef.current = 'flick';
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        // Check for expand gesture (upward movement on inactive card)
        if (!isActive && verticalDiff > 10 && verticalVelocity > 0.2 && horizontalDisplacement < 40) {
          touchIntentionRef.current = 'expand';
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        // Check for horizontal gestures
        if (dayKeepers.length > 1 && horizontalDisplacement > verticalDisplacement * 1.2 && horizontalDisplacement > 15) {
          touchIntentionRef.current = 'horizontal';
          e.preventDefault();
          e.stopPropagation();
        } else if (dayKeepers.length > 1 && horizontalDisplacement > 25) {
          touchIntentionRef.current = 'swipe';
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
    
          if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
        e.preventDefault();
        e.stopPropagation();
      } else if (touchIntentionRef.current === 'flick') {
        e.preventDefault();
        e.stopPropagation();
      }
      // Don't stop propagation if we haven't determined a specific gesture - let scrolling work
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || touchStartTime.current === null) {
      resetTouchState();
      return;
    }

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      resetTouchState();
      return;
    }
    
    // Always prevent default to stop any scroll momentum
    e.preventDefault();
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    
    // Handle flick gesture first
    if (touchIntentionRef.current === 'flick' && isActive && onFlickDismiss) {
      const verticalDiff = touchStartY.current - touchEndY;
      const timeDiff = Date.now() - touchStartTime.current;
      const finalVelocity = timeDiff > 0 ? Math.abs(verticalDiff) / timeDiff : 0;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Final validation: ensure it's a strong upward flick - more lenient thresholds
      if (verticalDiff > 25 && finalVelocity > 0.25) {
        onFlickDismiss(stackPosition);
        resetTouchState();
        return;
      }
    }

    // Handle expand gesture
    if (touchIntentionRef.current === 'expand' && !isActive && onTabClick) {
      const verticalDiff = touchStartY.current - touchEndY;
      const timeDiff = Date.now() - touchStartTime.current;
      const finalVelocity = timeDiff > 0 ? Math.abs(verticalDiff) / timeDiff : 0;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Final validation: ensure it's an upward gesture
      if (verticalDiff > 15 && finalVelocity > 0.2) {
        onTabClick();
        resetTouchState();
        return;
      }
    }

    // Handle carousel swipe
    if (dayKeepers.length > 1 && (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe')) {
      e.preventDefault();
      e.stopPropagation();
      
      const horizontalDisplacement = Math.abs(diffX);
      const threshold = 50;
      
      if (horizontalDisplacement > threshold) {
        if (diffX > 0) {
          handleSwipe(1);
        } else {
          handleSwipe(-1);
        }
      }
    }
    
    resetTouchState();
  };

  const handleTouchCancel = () => {
    resetTouchState();
  };

  const keeper = dayKeepers[currentIdx];
  const dayOfWeek = date ? parse(date, 'yyyy-MM-dd', new Date()).getDay() : 0;
  const isTodayKeeper = date ? isToday(parse(date, 'yyyy-MM-dd', new Date())) : false;
  const imageUrl = getKicacoEventPhoto(keeper.keeperName || 'keeper');

  // Calculate card positioning (same as KeeperCard)
  const visibleTabHeight = 56;
  let cardOffset = (totalInStack - 1 - stackPosition) * visibleTabHeight;
  
  if (activeIndex !== null && activeIndex !== undefined && activeIndex > stackPosition) {
    cardOffset += 176;
  }
  
  if (isActive) {
    cardOffset += 176;
  }

  return (
    <div
      className="absolute left-0 right-0 h-[240px]"
      data-keeper-card-position={stackPosition}
      style={{
        top: `${cardOffset}px`,
        zIndex: totalInStack - stackPosition,
        transition: 'all 300ms ease-in-out',
      }}
    >
      <div
        className="relative w-full h-full rounded-xl overflow-hidden bg-white"
        style={{
          transform: isActive ? 'translateY(-176px) scale(1.02)' : 'translateY(0)',
          transition: 'all 300ms ease-in-out',
          boxShadow: isActive 
            ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
            : '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        
        <div className="absolute inset-0 bg-black/[.65]" />
        
        <div 
          className="absolute top-0 left-0 right-0 z-10 h-[56px] backdrop-blur-sm"
          data-card-tab="true"
          style={{ touchAction: 'manipulation' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div className="flex h-full items-center justify-between px-4" onClick={onTabClick}>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                {keeper.childName && (
                  <StackedChildBadges 
                    childName={keeper.childName} 
                    size="sm" 
                    maxVisible={3}
                  />
                )}
                <span className="text-sm font-semibold text-white">{keeper.keeperName}</span>
                {dayKeepers.length > 1 && (
                  <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-2">
                    <button onClick={(e) => { 
                      e.stopPropagation(); 
                      setCurrentIdx((currentIdx - 1 + dayKeepers.length) % dayKeepers.length);
                    }} className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150">
                      <ChevronLeft size={12} />
                    </button>
                    <span className="text-gray-800 text-[10px] font-medium">{currentIdx + 1}/{dayKeepers.length}</span>
                    <button onClick={(e) => { 
                      e.stopPropagation(); 
                      setCurrentIdx((currentIdx + 1) % dayKeepers.length);
                    }} className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150">
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center items-end">
              <span className="text-sm font-medium text-white">{formatDate(date)}</span>
              {keeper.time && (
                <span className="text-xs text-gray-200 mt-0.5">{formatTime(keeper.time)}</span>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
        </div>
        
        <div className="absolute inset-x-0 top-14 p-4 text-white">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-bold text-gray-300">Notes</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const globalKeeperIndex = keepers.findIndex((k: any) => 
                  k.keeperName === keeper.keeperName && 
                  k.date === keeper.date && 
                  k.childName === keeper.childName &&
                  k.time === keeper.time
                );
                navigate('/add-keeper', { 
                  state: { 
                    keeper: keeper,
                    keeperIndex: globalKeeperIndex,
                    isEdit: true 
                  } 
                });
              }}
              className="text-xs text-gray-300 hover:text-white transition-colors bg-black/30 rounded-full px-1.5 py-0.5"
            >
              Edit
            </button>
          </div>
          {keeper.description ? (
            <p className="text-xs text-gray-200">{keeper.description}</p>
          ) : (
            <p className="text-xs italic text-gray-400">—</p>
          )}
        </div>
        
        {isTodayKeeper && (
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              boxShadow: `inset 0 0 20px rgba(248, 182, 194, 0.6)`,
              border: '1px solid rgba(248, 182, 194, 0.4)',
            }}
          />
        )}
        
        {isActive && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const globalKeeperIndex = keepers.findIndex((k: any) => 
                  k.keeperName === keeper.keeperName && 
                  k.date === keeper.date && 
                  k.childName === keeper.childName &&
                  k.time === keeper.time
                );
                if (globalKeeperIndex !== -1) {
                  removeKeeper(globalKeeperIndex);
                }
              }}
              className="flex items-center gap-1 bg-black/30 text-gray-300 hover:text-[#e7a5b4] text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});



export default function Keepers() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
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
    keepers,
    removeKeeper,
  } = useKicacoStore();

  // State for keeper card interactions
  const [activeKeeperIndices, setActiveKeeperIndices] = useState<Record<string, number | null>>({});

  // Track if this is from flick dismissal to prevent auto-scroll on manual opens
  const wasFlickDismissalRef = useRef(false);

  // Track first load for auto-opening first cards
  const isFirstLoad = useRef(true);

  // Handle flick-to-dismiss for keeper stacks
  const handleFlickDismiss = useCallback((month: string, currentStackPosition: number) => {
    // Find the next card to activate (one position lower in the stack)
    const nextStackPosition = currentStackPosition > 0 ? currentStackPosition - 1 : null;
    
    // Mark that this is from flick dismissal
    wasFlickDismissalRef.current = true;
    
    // Close current card and optionally activate next
    setActiveKeeperIndices(prev => ({
      ...prev,
      [month]: nextStackPosition
    }));
  }, []);

  // Auto-scroll to newly activated card after flick dismissal (only if not fully visible)
  useEffect(() => {
    // Find any month with an active card and scroll to it
    const activeMonth = Object.keys(activeKeeperIndices).find(month => activeKeeperIndices[month] !== null);
    if (activeMonth && activeKeeperIndices[activeMonth] !== null && wasFlickDismissalRef.current) {
      // Use requestAnimationFrame to ensure the card activation animation has started
      requestAnimationFrame(() => {
        const cardElement = document.querySelector(`[data-keeper-card-position="${activeKeeperIndices[activeMonth]}"]`);
        if (cardElement) {
          const rect = cardElement.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          // Only scroll if card is actually getting cut off (very conservative)
          const significantCutoffThreshold = 50; // Only scroll if 50px+ is cut off
          const isSignificantlyCutOff = 
            rect.top < -significantCutoffThreshold || 
            rect.bottom > viewportHeight + significantCutoffThreshold;
          
          // Only scroll if the card is being significantly cut off
          if (isSignificantlyCutOff) {
            cardElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
        }
        
        // Reset the flag after handling
        wasFlickDismissalRef.current = false;
      });
    }
  }, [activeKeeperIndices]);

  // Group keepers by month and then by date (filtering out past keepers)
  const keepersByMonth = useMemo(() => {
    const today = startOfDay(new Date());
    
    // First filter and group by month
    const monthGroups = keepers.reduce((acc, keeper) => {
      if (!keeper.date) return acc;
      try {
        const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
        
        // Filter out past keepers
        if (!isAfter(keeperDate, today) && !isSameDay(keeperDate, today)) {
          return acc; // Skip past keepers
        }
        
        const monthKey = format(keeperDate, 'yyyy-MM');
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(keeper);
      } catch (e) {
        console.error('Error parsing keeper date:', keeper.date, e);
      }
      return acc;
    }, {} as Record<string, typeof keepers>);

    // Then group by date within each month
    const result: Record<string, { date: string; keepers: any[] }[]> = {};
    
    Object.keys(monthGroups).forEach(month => {
      const monthKeepers = monthGroups[month];
      
      // Group by date within this month
      const dateGroups: { [date: string]: any[] } = {};
      monthKeepers.forEach(keeper => {
        if (!dateGroups[keeper.date]) {
          dateGroups[keeper.date] = [];
        }
        dateGroups[keeper.date].push(keeper);
      });

      // Sort dates and keepers within each date
      const sortedDates = Object.keys(dateGroups).sort((a, b) => {
        const dateA = parse(a, 'yyyy-MM-dd', new Date());
        const dateB = parse(b, 'yyyy-MM-dd', new Date());
        return dateA.getTime() - dateB.getTime();
      });

      result[month] = sortedDates.map(date => ({
        date,
        keepers: dateGroups[date].sort((a, b) => {
          // Sort by time if available, otherwise by keeper name
          const timeA = a.time || '23:59';
          const timeB = b.time || '23:59';
          return timeA.localeCompare(timeB);
        })
      }));
    });

    return result;
  }, [keepers]);

  const sortedMonths = useMemo(() => 
    Object.keys(keepersByMonth).sort(), 
    [keepersByMonth]
  );

  // Auto-open the first card in the first month on initial load
  useEffect(() => {
    if (isFirstLoad.current && sortedMonths.length > 0) {
      const firstMonth = sortedMonths[0];
      const firstMonthKeepers = keepersByMonth[firstMonth];
      
      if (firstMonthKeepers && firstMonthKeepers.length > 0 && !activeKeeperIndices[firstMonth]) {
        // Open the first card (most recent/top of stack - which is at the end of the reversed array)
        const firstCardPosition = firstMonthKeepers.length - 1;
        setActiveKeeperIndices(prev => ({
          ...prev,
          [firstMonth]: firstCardPosition
        }));
        isFirstLoad.current = false;
      }
    }
  }, [sortedMonths, keepersByMonth, activeKeeperIndices]);

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
      // Function kept for resize listener compatibility
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
    // Scroll overflow management simplified
  }, [currentDrawerHeight]);

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

    const userMessageId = generateUUID();
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
          id: generateUUID(),
          sender: 'assistant',
          content: "Sorry, I can't send your message right now. Please try again in a moment.",
        });
        return;
      }
      const assistantResponseText = await sendMessageToAssistant(threadId, messageToSend);
      removeMessageById(thinkingMessageId); // Remove thinking message after getting response
      addMessage({
        id: generateUUID(),
        sender: 'assistant',
        content: assistantResponseText,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      removeMessageById(thinkingMessageId); // Remove thinking message on error
      addMessage({
        id: generateUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Bell />}
        title="Keepers"
        action={<AddKeeperButton />}
      />
      <div
        ref={scrollRef}
        className="keepers-content-scroll bg-gray-50 flex-1 overflow-y-auto"
        style={{
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 200}px`, // Added extra padding for expanded keeper cards
        }}
      >
        {keepers && keepers.length > 0 ? (
          <div className="max-w-md mx-auto px-4 pb-4">
            {sortedMonths.map((month, monthIndex) => {
              const monthDateGroups = keepersByMonth[month];
              // Reverse the date groups so earliest is last (will be at bottom of stack)
              const reversedDateGroups = [...monthDateGroups].reverse();
              const activeIndex = activeKeeperIndices[month];

              return (
                <div key={month} className="mb-6">
                  <h2 className="text-sm font-medium text-gray-600 mb-3 ml-1">
                    {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                  </h2>
                  <div
                    className="relative"
                    style={{
                      height: `${240 + ((reversedDateGroups.length - 1) * 56)}px`,
                      marginBottom: activeIndex === reversedDateGroups.length - 1 ? '196px' : (monthIndex < sortedMonths.length - 1 ? '40px' : '20px'),
                      transition: 'margin-bottom 300ms ease-in-out',
                    }}
                  >
                    {reversedDateGroups.map((dayGroup, idx) => {
                      const stackPosition = idx;
                      const isActive = activeIndex === stackPosition;
                      
                      // If only one keeper for this day, use the original KeeperCard
                      if (dayGroup.keepers.length === 1) {
                        const keeper = dayGroup.keepers[0];
                        const originalKeeperIndex = keepers.findIndex(k => 
                          k.keeperName === keeper.keeperName && 
                          k.date === keeper.date &&
                          k.childName === keeper.childName
                        );
                        
                        const handleDelete = () => {
                          if (originalKeeperIndex !== -1) {
                            removeKeeper(originalKeeperIndex);
                          }
                        };
                        
                        return (
                          <KeeperCard
                            key={`${keeper.keeperName}-${keeper.date}-${stackPosition}`}
                            keeperName={keeper.keeperName}
                            date={keeper.date}
                            childName={keeper.childName}
                            description={keeper.description}
                            time={keeper.time}
                            index={stackPosition}
                            stackPosition={stackPosition}
                            totalInStack={reversedDateGroups.length}
                            isActive={isActive}
                            activeIndex={activeIndex ?? null}
                            onTabClick={() => {
                              setActiveKeeperIndices(prev => ({
                                ...prev,
                                [month]: prev[month] === stackPosition ? null : stackPosition
                              }));
                            }}
                            onFlickDismiss={(stackPos: number) => handleFlickDismiss(month, stackPos)}
                            onEdit={() => {
                              navigate('/add-keeper', {
                                state: {
                                  isEdit: true,
                                  keeper: keeper,
                                  keeperIndex: originalKeeperIndex
                                }
                              });
                            }}
                            onDelete={isActive ? handleDelete : undefined}
                          />
                        );
                      } else {
                        // Multiple keepers for this day - use carousel
                        return (
                          <CarouselKeeperCard
                            key={`${dayGroup.date}-${stackPosition}`}
                            dayKeepers={dayGroup.keepers}
                            date={dayGroup.date}
                            stackPosition={stackPosition}
                            totalInStack={reversedDateGroups.length}
                            isActive={isActive}
                            activeIndex={activeIndex ?? null}
                            onTabClick={() => {
                              setActiveKeeperIndices(prev => ({
                                ...prev,
                                [month]: prev[month] === stackPosition ? null : stackPosition
                              }));
                            }}
                            onFlickDismiss={(stackPos: number) => handleFlickDismiss(month, stackPos)}
                            navigate={navigate}
                            removeKeeper={removeKeeper}
                            keepers={keepers}
                          />
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">You don't have any keepers yet.</p>
            <p className="text-gray-400 text-sm mt-1">Click the button above to add one.</p>
          </div>
        )}
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