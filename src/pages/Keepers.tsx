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

// Haptic feedback utility
const haptic = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 10, 15]);
    }
  }
};

// Day colors for accent line (same as EventCard and UpcomingEvents)
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

// Touch state interfaces
interface TabTouchState {
  isTracking: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  dragOffset: number;
  isDragging: boolean;
  hasMovedSignificantly: boolean;
}

interface Keeper {
  keeperName: string;
  date: string;
  childName: string;
  description?: string;
  time?: string;
}

interface DateGroup {
  date: string;
  keepers: Keeper[];
  month?: string;
}

interface TabVisualState {
  isDragging: boolean;
  dragOffset: number;
  dragOffsetX: number;
  scale: number;
  brightness: number;
}

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
    } catch {
      // Pattern failed to parse, continue to next pattern
    }
  }
  const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
  return isNaN(dateObj.getTime()) ? time : format(dateObj, 'hh:mm a');
};

// Carousel Keeper Card Component
interface CarouselKeeperCardProps {
  dayKeepers: Keeper[];
  date: string;
  stackPosition: number;
  totalInStack: number;
  isActive: boolean;
  activeIndex: number | null;
  onTabClick: () => void;
  navigate: (path: string, options?: { state?: { keeper?: Keeper; keeperIndex?: number; isEdit?: boolean } }) => void;
  removeKeeper: (index: number) => void;
  keepers: Keeper[];
  onFlickDown?: (stackPosition: number) => void;
  onFlickUp?: (stackPosition: number) => void;
  globalStackPosition?: number;
}

const CarouselKeeperCard = React.memo(({ 
  dayKeepers, date, stackPosition, totalInStack, isActive, activeIndex, onTabClick, 
  navigate, removeKeeper, keepers, onFlickDown, onFlickUp, globalStackPosition
}: CarouselKeeperCardProps) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Constants for positioning - matching other components
  const visibleTabHeight = 56;
  
  // Tab touch state - only for tab area
  const tabTouchRef = useRef<TabTouchState>({
    isTracking: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    dragOffset: 0,
    isDragging: false,
    hasMovedSignificantly: false,
  });

  // Tab visual feedback
  const [tabVisual, setTabVisual] = useState<TabVisualState>({
    isDragging: false,
    dragOffset: 0,
    dragOffsetX: 0,
    scale: 1,
    brightness: 1,
  });

  // Clear touch state
  const clearTabTouchState = useCallback(() => {
    tabTouchRef.current.isTracking = false;
    tabTouchRef.current.isDragging = false;
    tabTouchRef.current.hasMovedSignificantly = false;
    setTabVisual({
      isDragging: false,
      dragOffset: 0,
      dragOffsetX: 0,
      scale: 1,
      brightness: 1,
    });
  }, []);



  // TAB TOUCH HANDLERS - ONLY ON TAB AREA (same as KeeperCard)
  const handleTabTouchStart = useCallback((e: React.TouchEvent) => {
    // Only handle touches that start on the tab area
    const target = e.target as HTMLElement;
    if (!target.closest('[data-tab-touch-area="true"]')) {
      return;
    }

    e.preventDefault(); // Prevent scroll only on tab area
    
    const touch = e.touches[0];
    const now = Date.now();
    
    tabTouchRef.current = {
      isTracking: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: now,
      dragOffset: 0,
      isDragging: false,
      hasMovedSignificantly: false,
    };

    haptic.light();
    console.log('[CarouselKeeper Tab Touch] Started');
  }, []);

  const handleTabTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tabTouchRef.current.isTracking) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - tabTouchRef.current.startX;
    const deltaY = touch.clientY - tabTouchRef.current.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    tabTouchRef.current.currentX = touch.clientX;
    tabTouchRef.current.currentY = touch.clientY;

    // Mark significant movement
    if (absDeltaX > 8 || absDeltaY > 8) {
      tabTouchRef.current.hasMovedSignificantly = true;
    }

    // Start dragging if significant movement in any direction
    if ((absDeltaX > 10 || absDeltaY > 10) && !tabTouchRef.current.isDragging) {
      tabTouchRef.current.isDragging = true;
      setTabVisual(prev => ({
        ...prev,
        isDragging: true,
        scale: 1.02,
        brightness: 1.1,
      }));
      haptic.medium();
      console.log('[CarouselKeeper Tab Touch] Drag started');
    }

    // Update visual feedback during drag - allow movement in all directions
    if (tabTouchRef.current.isDragging) {
      e.preventDefault(); // Only prevent default during active drag
      
      // Allow free movement around the screen with some dampening
      const dragOffsetX = Math.max(-100, Math.min(100, deltaX * 0.4));
      const dragOffsetY = Math.max(-100, Math.min(100, deltaY * 0.4));
      
      tabTouchRef.current.dragOffset = dragOffsetY; // Keep for gesture detection
      
      setTabVisual(prev => ({
        ...prev,
        dragOffset: dragOffsetY,
        dragOffsetX: dragOffsetX, // Add X offset for free movement
      }));
    }
  }, []);

  const handleTabTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!tabTouchRef.current.isTracking) return;
    
    // Always stop propagation to prevent multiple cards from responding
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - tabTouchRef.current.startX;
    const deltaY = touch.clientY - tabTouchRef.current.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const timeElapsed = Date.now() - tabTouchRef.current.startTime;
    
    console.log(`[CarouselKeeper Tab Touch] End - deltaY: ${deltaY.toFixed(1)}, time: ${timeElapsed}ms, isDragging: ${tabTouchRef.current.isDragging}`);
    
    let actionTaken = false;

    // Handle FLICK gestures - more forgiving criteria when card is open
    const flickTimeThreshold = isActive ? 800 : 600; // More time allowed when card is open
    const flickDistanceThreshold = isActive ? 30 : 40; // Less distance needed when card is open
    
    if (timeElapsed < flickTimeThreshold && absDeltaY > flickDistanceThreshold) {
      if (deltaY > 0) {
        // FLICK DOWN = expose card above it (lower stack position)
        console.log('[CarouselKeeper Tab Touch] Flick DOWN - exposing card above', { globalStackPosition, hasHandler: !!onFlickDown, isActive });
        onFlickDown?.(globalStackPosition || stackPosition);
        haptic.success();
        actionTaken = true;
      } else if (deltaY < 0) {
        // FLICK UP = expose card below it (higher stack position)
        console.log('[CarouselKeeper Tab Touch] Flick UP - exposing card below', { globalStackPosition, totalInStack, hasHandler: !!onFlickUp, isActive });
        onFlickUp?.(globalStackPosition || stackPosition);
        haptic.success();
        actionTaken = true;
      }
    }
    
    // Handle tap if no vertical gesture detected
    if (!actionTaken && !tabTouchRef.current.hasMovedSignificantly && timeElapsed < 300) {
      console.log('[CarouselKeeper Tab Touch] Tap action');
      onTabClick?.();
      haptic.medium();
      actionTaken = true;
    }

    // Horizontal swipe for carousel (only if not dragging vertically)
    if (!actionTaken && absDeltaX > 40 && absDeltaX > absDeltaY * 1.5) {
      if (deltaX > 0 && currentIdx > 0) {
        setCurrentIdx(prev => prev - 1);
        haptic.medium();
        actionTaken = true;
        console.log('[CarouselKeeper Tab Touch] Swipe to previous');
      } else if (deltaX < 0 && currentIdx < dayKeepers.length - 1) {
        setCurrentIdx(prev => prev + 1);
        haptic.medium();
        actionTaken = true;
        console.log('[CarouselKeeper Tab Touch] Swipe to next');
      }
    }

    // Prevent click event if we performed a gesture
    if (actionTaken) {
      e.preventDefault();
      e.stopPropagation();
    }

    clearTabTouchState();
  }, [isActive, onTabClick, onFlickDown, onFlickUp, globalStackPosition, stackPosition, totalInStack, currentIdx, dayKeepers.length, setCurrentIdx, clearTabTouchState]);

  const handleTabTouchCancel = useCallback(() => {
    console.log('[CarouselKeeper Tab Touch] Cancelled');
    clearTabTouchState();
  }, [clearTabTouchState]);

  const keeper = dayKeepers[currentIdx];
  const dayOfWeek = date ? parse(date, 'yyyy-MM-dd', new Date()).getDay() : 0;
  const isTodayKeeper = date ? isToday(parse(date, 'yyyy-MM-dd', new Date())) : false;
  const imageUrl = getKicacoEventPhoto(keeper.keeperName || 'keeper');

  // Calculate card positioning - using standard approach
  // Calculate the card's vertical offset using local position within this month
  let cardOffset = (totalInStack - 1 - stackPosition) * visibleTabHeight;
  
  // If there's an active card below this one in the local stack, push this card up
  if (activeIndex !== null && activeIndex !== undefined && activeIndex > stackPosition) {
    cardOffset += 176;
  }
  
  // If this card is active, compensate for its transform
  if (isActive) {
    cardOffset += 176;
  }

  return (
    <div
      className="absolute left-0 right-0 h-[240px]"
      data-keeper-card-position={globalStackPosition || stackPosition}
      data-keeper-card-date={date}
      style={{
        top: `${cardOffset}px`,
        zIndex: totalInStack - stackPosition,
        transition: tabVisual.isDragging ? 'none' : 'all 380ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="relative w-full h-full rounded-xl overflow-hidden bg-white"
        style={{
          transform: `translateY(${(isActive ? -176 : 0) + tabVisual.dragOffset}px) translateX(${tabVisual.dragOffsetX || 0}px) scale(${isActive ? 1.02 * tabVisual.scale : tabVisual.scale})`,
          transition: tabVisual.isDragging ? 'none' : 'all 380ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isActive 
            ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
            : '0 4px 12px rgba(0, 0, 0, 0.15)',
          filter: `brightness(${tabVisual.brightness})`,
        }}
      >
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        
        <div className="absolute inset-0 bg-black/[.65]" />
        
        <div 
          className="absolute top-0 left-0 right-0 z-10 h-[56px] backdrop-blur-sm cursor-pointer"
          data-tab-touch-area="true"
          onTouchStart={handleTabTouchStart}
          onTouchMove={handleTabTouchMove}
          onTouchEnd={handleTabTouchEnd}
          onTouchCancel={handleTabTouchCancel}
          style={{ 
            touchAction: 'none',
            background: tabVisual.isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            borderRadius: tabVisual.isDragging ? '12px 12px 0 0' : '0'
          }}
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
                const globalKeeperIndex = keepers.findIndex((k: Keeper) => 
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
                const globalKeeperIndex = keepers.findIndex((k: Keeper) => 
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

        {/* Drag indicator - positioned below tab to avoid bleeding through blur */}
        {tabVisual.isDragging && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2 py-1 rounded-full pointer-events-none border border-white/20 z-20 whitespace-nowrap">
            {onFlickDown || onFlickUp 
              ? 'Swipe tab up/down to navigate • Swipe left/right for carousel'
              : (dayKeepers.length > 1 
                ? 'Swipe left/right for carousel' 
                : (isActive ? 'Drag to close' : 'Drag up to expand')
              )
            }
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

  // State for keeper card interactions - using same pattern as UpcomingEvents
  const [activeDayDate, setActiveDayDate] = useState<string | null>(null);

  // Track if this is from flick dismissal to prevent auto-scroll on manual opens
  const wasFlickDismissalRef = useRef(false);

  // Debouncing to prevent rapid-fire stack navigation
  const lastFlickTimeRef = useRef<number>(0);

  // Auto-scroll to newly activated card after flick dismissal (only if not fully visible)
  useEffect(() => {
    if (activeDayDate !== null && wasFlickDismissalRef.current) {
      // Use requestAnimationFrame to ensure the card activation animation has started
      requestAnimationFrame(() => {
        const cardElement = document.querySelector(`[data-keeper-card-date="${activeDayDate}"]`);
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
  }, [activeDayDate]);

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
    const result: Record<string, DateGroup[]> = {};
    
    Object.keys(monthGroups).forEach(month => {
      const monthKeepers = monthGroups[month];
      
      // Group by date within this month
      const dateGroups: { [date: string]: Keeper[] } = {};
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

  // Create a flat list of all date groups for global stack positioning (exactly like ThirtyDayKeeperOutlook)
  const allDateGroups = useMemo(() => {
    const allGroups: Array<DateGroup & { month: string }> = [];
    
    sortedMonths.forEach(month => {
      const monthGroups = keepersByMonth[month];
      monthGroups.forEach(group => {
        allGroups.push({
          ...group,
          month
        });
      });
    });
    
    // Sort all groups by date
    return allGroups.sort((a, b) => {
      const dateA = parse(a.date, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.date, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
  }, [sortedMonths, keepersByMonth]);

  // Handle flick down - dismiss current card to reveal the one "above" it in stack (exact copy from UpcomingEvents)
  const handleFlickDown = useCallback((currentStackPosition: number) => {
    const now = Date.now();
    // Debounce: ignore if less than 200ms since last flick
    if (now - lastFlickTimeRef.current < 200) {
      console.log('[Keepers] handleFlickDown debounced');
      return;
    }
    lastFlickTimeRef.current = now;
    
    console.log('[Keepers] handleFlickDown called', { currentStackPosition });
    
    // Find the current card to get its date and month context
    const currentCard = document.querySelector(`[data-keeper-card-position="${currentStackPosition}"]`);
    const currentDate = currentCard?.getAttribute('data-keeper-card-date');
    
    if (!currentDate) {
      console.log('[Keepers] Could not find current card date');
      return;
    }
    
    // Find which month this card belongs to and get the local stack
    const currentMonth = format(parse(currentDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM');
    const monthDateGroups = keepersByMonth[currentMonth];
    if (!monthDateGroups) {
      console.log('[Keepers] Could not find month for current date');
      return;
    }
    
    const reversedDateGroups = [...monthDateGroups].reverse();
    const currentLocalIndex = reversedDateGroups.findIndex(g => g.date === currentDate);
    
    // Move to next card in local stack (higher index = older date, lower in visual stack)
    const nextLocalIndex = currentLocalIndex + 1;
    
    if (nextLocalIndex < reversedDateGroups.length) {
      const nextDate = reversedDateGroups[nextLocalIndex].date;
      console.log('[Keepers] Flick down to next card:', { currentDate, nextDate, currentLocalIndex, nextLocalIndex });
      setActiveDayDate(nextDate);
    } else {
      console.log('[Keepers] Flick down - no more cards in stack');
      setActiveDayDate(null);
    }
  }, [keepersByMonth]);

  // Handle flick up - bring back the card "below" it in stack (exact copy from UpcomingEvents)
  const handleFlickUp = useCallback((currentStackPosition: number) => {
    const now = Date.now();
    // Debounce: ignore if less than 200ms since last flick
    if (now - lastFlickTimeRef.current < 200) {
      console.log('[Keepers] handleFlickUp debounced');
      return;
    }
    lastFlickTimeRef.current = now;
    
    console.log('[Keepers] handleFlickUp called', { currentStackPosition });
    
    // Find the current card to get its date and month context
    const currentCard = document.querySelector(`[data-keeper-card-position="${currentStackPosition}"]`);
    const currentDate = currentCard?.getAttribute('data-keeper-card-date');
    
    if (!currentDate) {
      console.log('[Keepers] Could not find current card date');
      return;
    }
    
    // Find which month this card belongs to and get the local stack
    const currentMonth = format(parse(currentDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM');
    const monthDateGroups = keepersByMonth[currentMonth];
    if (!monthDateGroups) {
      console.log('[Keepers] Could not find month for current date');
      return;
    }
    
    const reversedDateGroups = [...monthDateGroups].reverse();
    const currentLocalIndex = reversedDateGroups.findIndex(g => g.date === currentDate);
    
    // Move to previous card in local stack (lower index = newer date, higher in visual stack)
    const nextLocalIndex = currentLocalIndex - 1;
    
    if (nextLocalIndex >= 0) {
      const nextDate = reversedDateGroups[nextLocalIndex].date;
      console.log('[Keepers] Flick up to previous card:', { currentDate, nextDate, currentLocalIndex, nextLocalIndex });
      setActiveDayDate(nextDate);
    } else {
      console.log('[Keepers] Flick up - no more cards in stack');
      setActiveDayDate(null);
    }
  }, [keepersByMonth]);

  // No auto-opening of cards on initial load (consistent with other pages)

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
    console.log('Drawer height changed:', currentDrawerHeight);
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
        className="flex-1 overflow-y-auto p-4"
        style={{
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 200}px`, // Added extra padding for expanded keeper cards
        }}
      >
        {keepers && keepers.length > 0 ? (
          <div className="max-w-md mx-auto">
            <div className="space-y-8">
              {sortedMonths.map((month, monthIndex) => {
              const monthDateGroups = keepersByMonth[month];
              // Reverse the date groups so earliest is last (will be at bottom of stack)
              const reversedDateGroups = [...monthDateGroups].reverse();

              // Find if any card in this month is active - exact copy from UpcomingEvents structure
              const activeDateIndex = activeDayDate ? reversedDateGroups.findIndex(g => g.date === activeDayDate) : -1;
              
                              // Check if there's an active card from ANY previous month that could overlap this header
                const hasOverlappingActiveCard = activeDayDate && sortedMonths.slice(0, monthIndex).some(prevMonth => 
                  keepersByMonth[prevMonth] && keepersByMonth[prevMonth].some(g => g.date === activeDayDate)
                );

              return (
                <div key={month}>
                  <h2 className={`text-sm font-medium text-gray-600 mb-4 ml-1 transition-all duration-380 ${
                    hasOverlappingActiveCard ? 'pt-48' : ''
                  }`}>
                    {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                  </h2>
                  <div
                    className="relative"
                    style={{
                      height: `${240 + ((reversedDateGroups.length - 1) * 56)}px`,
                      marginBottom: activeDateIndex !== -1 ? '32px' : '20px',
                      transition: 'margin-bottom 380ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {reversedDateGroups.map((dayGroup, idx) => {
                      // Use local idx for all visual positioning (keeps existing logic intact)
                      const localStackPosition = idx;
                      // Use global position for data attribute to ensure uniqueness across months
                      const globalStackPosition = allDateGroups.length - 1 - allDateGroups.findIndex(g => g.date === dayGroup.date && g.month === month);
                      const isActive = activeDayDate === dayGroup.date;
                      
                      // If only one keeper for this day, use the original KeeperCard
                      if (dayGroup.keepers.length === 1) {
                        const keeper = dayGroup.keepers[0];
                        const originalKeeperIndex = keepers.findIndex((k: Keeper) => 
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
                              key={`${keeper.keeperName}-${keeper.date}-${globalStackPosition}`}
                              keeperName={keeper.keeperName}
                              date={keeper.date}
                              childName={keeper.childName}
                              description={keeper.description}
                              time={keeper.time}
                              index={localStackPosition}
                              stackPosition={localStackPosition}
                              totalInStack={reversedDateGroups.length}
                              isActive={isActive}
                              activeIndex={activeDateIndex}
                              onTabClick={() => {
                                setActiveDayDate(activeDayDate === dayGroup.date ? null : dayGroup.date);
                              }}
                              onFlickDown={() => handleFlickDown(globalStackPosition)}
                              onFlickUp={() => handleFlickUp(globalStackPosition)}
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
                              dataPosition={globalStackPosition}
                            />
                          );
                      } else {
                        // Multiple keepers for this day - use carousel
                        return (
                          <CarouselKeeperCard
                            key={`${dayGroup.date}-${globalStackPosition}`}
                            dayKeepers={dayGroup.keepers}
                            date={dayGroup.date}
                            stackPosition={localStackPosition}
                            totalInStack={reversedDateGroups.length}
                            isActive={isActive}
                            activeIndex={activeDateIndex}
                            onTabClick={() => {
                              setActiveDayDate(activeDayDate === dayGroup.date ? null : dayGroup.date);
                            }}
                            onFlickDown={handleFlickDown}
                            onFlickUp={handleFlickUp}
                            navigate={navigate}
                            removeKeeper={removeKeeper}
                            keepers={keepers}
                            globalStackPosition={globalStackPosition}
                          />
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
            </div>
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