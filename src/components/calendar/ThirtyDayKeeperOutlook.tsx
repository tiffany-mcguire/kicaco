import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, startOfDay, endOfDay, addDays, isWithinInterval, format, isToday } from 'date-fns';
import KeeperCard from './KeeperCard';
import { useKicacoStore } from '../../store/kicacoStore';
import { getKicacoEventPhoto } from '../../utils/getKicacoEventPhoto';
import { ConfirmDialog, StackedChildBadges } from '../common';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

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

// Simplified Touch System - TAB AREA ONLY
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

interface TabVisualState {
  isDragging: boolean;
  dragOffset: number;
  dragOffsetX: number;
  scale: number;
  brightness: number;
}

// Simplified haptic feedback
const haptic = {
  light: () => navigator.vibrate?.(25),
  medium: () => navigator.vibrate?.(50),
  success: () => navigator.vibrate?.([40, 20, 40]),
};

// Enhanced Carousel Keeper Card with Tab-Only Touch Controls
const CarouselKeeperCard = React.memo(({ 
  dayKeepers, date, stackPosition, totalInStack, isActive, activeIndex, 
  onTabClick, navigate, keepers, setDeleteConfirmation, onFlickDown, onFlickUp
}: any) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  
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

  // TAB TOUCH HANDLERS - ONLY ON TAB AREA
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
    console.log('[Tab Touch] Started');
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
      console.log('[Tab Touch] Drag started');
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
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - tabTouchRef.current.startX;
    const deltaY = touch.clientY - tabTouchRef.current.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const timeElapsed = Date.now() - tabTouchRef.current.startTime;
    
    console.log(`[Tab Touch] End - deltaY: ${deltaY.toFixed(1)}, time: ${timeElapsed}ms, isDragging: ${tabTouchRef.current.isDragging}`);
    
    let actionTaken = false;

    // Handle FLICK gestures - more forgiving criteria when card is open
    const flickTimeThreshold = isActive ? 800 : 600; // More time allowed when card is open
    const flickDistanceThreshold = isActive ? 30 : 40; // Less distance needed when card is open
    
    if (timeElapsed < flickTimeThreshold && absDeltaY > flickDistanceThreshold) {
      if (deltaY > 0) {
        // FLICK DOWN = expose card above it (lower stack position)
        console.log('[Tab Touch] Flick DOWN - exposing card above', { stackPosition, hasHandler: !!onFlickDown, isActive });
        onFlickDown?.(stackPosition);
        haptic.success();
        actionTaken = true;
      } else if (deltaY < 0) {
        // FLICK UP = expose card below it (higher stack position)
        console.log('[Tab Touch] Flick UP - exposing card below', { stackPosition, totalInStack, hasHandler: !!onFlickUp, isActive });
        onFlickUp?.(stackPosition, totalInStack);
        haptic.success();
        actionTaken = true;
      }
    }
    
    // Handle tap if no vertical gesture detected
    if (!actionTaken && !tabTouchRef.current.hasMovedSignificantly && timeElapsed < 300) {
      console.log('[Tab Touch] Tap action');
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
        console.log('[Tab Touch] Swipe to previous');
      } else if (deltaX < 0 && currentIdx < dayKeepers.length - 1) {
        setCurrentIdx(prev => prev + 1);
        haptic.medium();
        actionTaken = true;
        console.log('[Tab Touch] Swipe to next');
      }
    }

    // Prevent click event if we performed a gesture
    if (actionTaken) {
      e.preventDefault();
      e.stopPropagation();
    }

    clearTabTouchState();
  }, [isActive, onTabClick, onFlickDown, onFlickUp, stackPosition, currentIdx, dayKeepers.length, setCurrentIdx, clearTabTouchState]);

  const handleTabTouchCancel = useCallback(() => {
    console.log('[Tab Touch] Cancelled');
    clearTabTouchState();
  }, [clearTabTouchState]);

  const keeper = dayKeepers[currentIdx];
  const dayOfWeek = date ? parse(date, 'yyyy-MM-dd', new Date()).getDay() : 0;
  const isTodayKeeper = date ? isToday(parse(date, 'yyyy-MM-dd', new Date())) : false;
  const imageUrl = getKicacoEventPhoto(keeper.keeperName || 'keeper');

  // Calculate card positioning
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
        transition: tabVisual.isDragging ? 'none' : 'all 380ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="relative w-full h-full rounded-xl overflow-hidden bg-white"
        style={{
          transform: `translateY(${(isActive ? -176 : 0) + tabVisual.dragOffset}px) translateX(${tabVisual.dragOffsetX || 0}px) scale(${isActive ? 1.02 * tabVisual.scale : tabVisual.scale})`,
          transition: tabVisual.isDragging ? 'none' : 'all 380ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isActive 
            ? `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)` 
            : `0 4px 12px rgba(0, 0, 0, 0.15)`,
          filter: `brightness(${tabVisual.brightness})`,
        }}
      >
        <img 
          src={imageUrl} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-black/[.65]" />
        
        {/* TAB AREA - TOUCH ENABLED */}
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
          <div className="flex h-full items-center justify-between px-4">
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
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCurrentIdx((prev) => (prev - 1 + dayKeepers.length) % dayKeepers.length);
                      }} 
                      className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <span className="text-gray-800 text-[10px] font-medium">{currentIdx + 1}/{dayKeepers.length}</span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCurrentIdx((prev) => (prev + 1) % dayKeepers.length);
                      }} 
                      className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150"
                    >
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
        
        {/* CONTENT AREA - NO TOUCH HANDLERS (allows normal scrolling) */}
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
        
        {/* Delete button */}
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
                setDeleteConfirmation({ 
                  isOpen: true, 
                  keeperIndex: globalKeeperIndex,
                  keeperName: keeper.keeperName
                });
              }
            }}
            className="flex items-center gap-1 bg-black/30 text-gray-300 hover:text-[#e7a5b4] text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>

        {/* Drag indicator - positioned below tab to avoid bleeding through blur */}
        {tabVisual.isDragging && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none border border-white/20 z-20">
            Flick up/down to navigate stack
          </div>
        )}
      </div>
    </div>
  );
});

const ThirtyDayKeeperOutlook: React.FC = () => {
  const navigate = useNavigate();
  const keepers = useKicacoStore(state => state.keepers);
  const removeKeeper = useKicacoStore(state => state.removeKeeper);
  const [activeKeeperIndex, setActiveKeeperIndex] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; keeperIndex: number | null; keeperName: string }>({
    isOpen: false,
    keeperIndex: null,
    keeperName: ''
  });
  
  // Debouncing to prevent rapid-fire stack navigation
  const lastFlickTimeRef = useRef<number>(0);

  // Handle flick down - dismiss current card to reveal the one "above" it in stack (newer date, higher stack position)
  const handleFlickDown = useCallback((currentStackPosition: number) => {
    const now = Date.now();
    // Debounce: ignore if less than 200ms since last flick
    if (now - lastFlickTimeRef.current < 200) {
      console.log('[ThirtyDayKeeperOutlook] handleFlickDown debounced');
      return;
    }
    lastFlickTimeRef.current = now;
    
    console.log('[ThirtyDayKeeperOutlook] handleFlickDown called', { currentStackPosition });
    // Get total cards by counting grouped dates
    const totalCards = document.querySelectorAll('[data-keeper-card-position]').length;
    const nextStackPosition = currentStackPosition < totalCards - 1 ? currentStackPosition + 1 : null;
    console.log('[ThirtyDayKeeperOutlook] Setting active to', { nextStackPosition });
    setActiveKeeperIndex(nextStackPosition);
  }, []);

  // Handle flick up - bring back the card "below" it in stack (older date, lower stack position)
  const handleFlickUp = useCallback((currentStackPosition: number) => {
    const now = Date.now();
    // Debounce: ignore if less than 200ms since last flick
    if (now - lastFlickTimeRef.current < 200) {
      console.log('[ThirtyDayKeeperOutlook] handleFlickUp debounced');
      return;
    }
    lastFlickTimeRef.current = now;
    
    console.log('[ThirtyDayKeeperOutlook] handleFlickUp called', { currentStackPosition });
    const nextStackPosition = currentStackPosition > 0 ? currentStackPosition - 1 : null;
    console.log('[ThirtyDayKeeperOutlook] Setting active to', { nextStackPosition });
    setActiveKeeperIndex(nextStackPosition);
  }, []);

  // Group keepers by date for next 30 days
  const keepersByDate = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysFromNow = endOfDay(addDays(today, 30));
    
    // Filter keepers for next 30 days
    const filteredKeepers = keepers.filter(keeper => {
      if (!keeper.date) return false;
      try {
        const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
        return isWithinInterval(keeperDate, { start: today, end: thirtyDaysFromNow });
      } catch (e) {
        console.error('Error parsing date for keeper:', keeper, e);
        return false;
      }
    });

    // Group by date
    const grouped: { [date: string]: any[] } = {};
    filteredKeepers.forEach(keeper => {
      if (!grouped[keeper.date]) {
        grouped[keeper.date] = [];
      }
      grouped[keeper.date].push(keeper);
    });

    // Sort dates and keepers within each date
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const dateA = parse(a, 'yyyy-MM-dd', new Date());
      const dateB = parse(b, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });

    return sortedDates.map(date => ({
      date,
      keepers: grouped[date].sort((a, b) => {
        // Sort by time if available, otherwise by keeper name
        const timeA = a.time || '23:59';
        const timeB = b.time || '23:59';
        return timeA.localeCompare(timeB);
      })
    }));
  }, [keepers]);

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-sm font-medium text-gray-600 mb-4 ml-1 max-w-md mx-auto">
        30-Day Keeper Outlook
      </h2>
      {keepersByDate.length > 0 ? (
        <div 
          className="relative w-full max-w-md mx-auto"
          style={{
            height: `${240 + ((keepersByDate.length - 1) * 56)}px`,
            marginBottom: '20px',
          }}
        >
          {keepersByDate.map((dayGroup, index) => {
            const stackPosition = keepersByDate.length - 1 - index;
            
            // If only one keeper for this day, use the original KeeperCard
            if (dayGroup.keepers.length === 1) {
              const keeper = dayGroup.keepers[0];
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
                  totalInStack={keepersByDate.length}
                  isActive={activeKeeperIndex === stackPosition}
                  activeIndex={activeKeeperIndex}
                  onTabClick={() => setActiveKeeperIndex(activeKeeperIndex === stackPosition ? null : stackPosition)}
                  onFlickDown={handleFlickDown}
                  onFlickUp={handleFlickUp}
                  dataPosition={stackPosition}
                  onEdit={() => {
                    const globalKeeperIndex = keepers.findIndex(k => 
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
                  onDelete={() => {
                    const globalKeeperIndex = keepers.findIndex(k => 
                      k.keeperName === keeper.keeperName && 
                      k.date === keeper.date && 
                      k.childName === keeper.childName &&
                      k.time === keeper.time
                    );
                    if (globalKeeperIndex !== -1) {
                      setDeleteConfirmation({ 
                        isOpen: true, 
                        keeperIndex: globalKeeperIndex,
                        keeperName: keeper.keeperName
                      });
                    }
                  }}
                />
              );
            } else {
              // Multiple keepers for this day - use carousel with enhanced touch
              return (
                <CarouselKeeperCard
                  key={`${dayGroup.date}-${stackPosition}`}
                  dayKeepers={dayGroup.keepers}
                  date={dayGroup.date}
                  stackPosition={stackPosition}
                  totalInStack={keepersByDate.length}
                  isActive={activeKeeperIndex === stackPosition}
                  activeIndex={activeKeeperIndex}
                  onTabClick={() => setActiveKeeperIndex(activeKeeperIndex === stackPosition ? null : stackPosition)}
                  navigate={navigate}
                  keepers={keepers}
                  setDeleteConfirmation={setDeleteConfirmation}
                  onFlickDown={handleFlickDown}
                  onFlickUp={handleFlickUp}
                />
              );
            }
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
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, keeperIndex: null, keeperName: '' })}
        onConfirm={() => {
          if (deleteConfirmation.keeperIndex !== null) {
            removeKeeper(deleteConfirmation.keeperIndex);
            // Reset active keeper if needed
            if (activeKeeperIndex !== null && activeKeeperIndex >= keepersByDate.length - 1) {
              setActiveKeeperIndex(null);
            }
          }
        }}
        title="Delete Keeper"
        message="Are you sure you want to delete this keeper?"
        secondaryMessage="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ThirtyDayKeeperOutlook; 