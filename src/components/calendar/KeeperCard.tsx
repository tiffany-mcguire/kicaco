import React, { useRef, useCallback, useState } from 'react';
import { format, parse, isToday } from 'date-fns';
import { getKicacoEventPhoto } from '../../utils/getKicacoEventPhoto';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { StackedChildBadges } from '../common';

interface KeeperCardProps {
  keeperName: string;
  childName?: string;
  date: string;
  time?: string;
  description?: string;
  image?: string;
  stackPosition?: number;
  totalInStack?: number;
  isActive?: boolean;
  onTabClick?: () => void;
  priority?: 'high' | 'medium' | 'low';
  index?: number;
  activeIndex?: number | null;
  onEdit?: () => void;
  onDelete?: () => void;
  // Carousel props for Daily View
  showCarouselControls?: boolean;
  currentCarouselIndex?: number;
  totalCarouselItems?: number;
  onCarouselPrevious?: () => void;
  onCarouselNext?: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onTouchCancel?: (e: React.TouchEvent) => void;
  // Add Keeper button props
  showAddKeeperButton?: boolean;
  onAddKeeper?: () => void;
  // Stack navigation props
  onFlickDown?: (stackPosition: number) => void;
  onFlickUp?: (stackPosition: number, totalCards: number) => void;
  // Data attribute for scroll targeting
  dataPosition?: number;
}

// Day colors for accent line (same as EventCard and UpcomingEvents)
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

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

// Simplified Touch System - TAB AREA ONLY (matching ThirtyDayKeeperOutlook)
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

const KeeperCard: React.FC<KeeperCardProps> = ({
  keeperName, childName, date, time, description, image,
  stackPosition = 0, totalInStack = 1, isActive = false, onTabClick, activeIndex, onEdit, onDelete,
  showCarouselControls = false, currentCarouselIndex = 0, totalCarouselItems = 1,
  onCarouselPrevious, onCarouselNext, onTouchStart, onTouchMove,
  showAddKeeperButton = false, onAddKeeper, onFlickDown, onFlickUp, dataPosition
}) => {

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
    console.log('[KeeperCard Tab Touch] Started');
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
      console.log('[KeeperCard Tab Touch] Drag started');
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
    
    console.log(`[KeeperCard Tab Touch] End - deltaY: ${deltaY.toFixed(1)}, time: ${timeElapsed}ms, isDragging: ${tabTouchRef.current.isDragging}`);
    
    let actionTaken = false;

    // Handle FLICK gestures - more forgiving criteria when card is open
    const flickTimeThreshold = isActive ? 800 : 600; // More time allowed when card is open
    const flickDistanceThreshold = isActive ? 30 : 40; // Less distance needed when card is open
    
    if (timeElapsed < flickTimeThreshold && absDeltaY > flickDistanceThreshold) {
      if (deltaY > 0) {
        // FLICK DOWN = expose card above it (lower stack position)
        console.log('[KeeperCard Tab Touch] Flick DOWN - exposing card above', { stackPosition, hasHandler: !!onFlickDown, isActive });
        if (onFlickDown) {
          // Add small delay to prevent rapid-fire flicking
          setTimeout(() => onFlickDown(stackPosition), 50);
          haptic.success();
          actionTaken = true;
        }
      } else if (deltaY < 0) {
        // FLICK UP = expose card below it (higher stack position)
        console.log('[KeeperCard Tab Touch] Flick UP - exposing card below', { stackPosition, totalInStack, hasHandler: !!onFlickUp, isActive });
        if (onFlickUp) {
          // Add small delay to prevent rapid-fire flicking
          setTimeout(() => onFlickUp(stackPosition, totalInStack), 50);
          haptic.success();
          actionTaken = true;
        }
      }
    }
    
    // Handle slow DRAG/TAP - only for open/close, not stack navigation
    if (!actionTaken && absDeltaY > 15) {
      if (!isActive) {
        // DRAG from closed = act like tap (just open)
        console.log('[KeeperCard Tab Touch] Drag from closed - opening card');
        onTabClick?.();
        haptic.medium();
        actionTaken = true;
      } else {
        // DRAG from open = if significant movement but not a flick, just allow repositioning
        console.log('[KeeperCard Tab Touch] Drag from open - repositioning only');
      }
    }
    
    // Handle tap if no vertical gesture detected
    if (!actionTaken && !tabTouchRef.current.hasMovedSignificantly && timeElapsed < 300) {
      console.log('[KeeperCard Tab Touch] Tap action');
      onTabClick?.();
      haptic.medium();
      actionTaken = true;
    }

    // Horizontal swipe for carousel (only if supported and not dragging vertically)
    if (!actionTaken && showCarouselControls && totalCarouselItems > 1 && absDeltaX > 40 && absDeltaX > absDeltaY * 1.5) {
      if (deltaX > 0 && onCarouselPrevious) {
        onCarouselPrevious();
        haptic.medium();
        actionTaken = true;
        console.log('[KeeperCard Tab Touch] Swipe to previous');
      } else if (deltaX < 0 && onCarouselNext) {
        onCarouselNext();
        haptic.medium();
        actionTaken = true;
        console.log('[KeeperCard Tab Touch] Swipe to next');
      }
    }

    clearTabTouchState();
  }, [isActive, onTabClick, showCarouselControls, totalCarouselItems, onCarouselPrevious, onCarouselNext, clearTabTouchState]);

  const handleTabTouchCancel = useCallback(() => {
    console.log('[KeeperCard Tab Touch] Cancelled');
    clearTabTouchState();
  }, [clearTabTouchState]);

  // Get day of week for color coding
  const dayOfWeek = date ? parse(date, 'yyyy-MM-dd', new Date()).getDay() : 0;
  const isTodayKeeper = date ? isToday(parse(date, 'yyyy-MM-dd', new Date())) : false;
  const imageUrl = image || getKicacoEventPhoto(keeperName || 'keeper');

  // Stacking view is now the only view
  const visibleTabHeight = 56;
  
  // Calculate the card's vertical offset
  let cardOffset = (totalInStack - 1 - stackPosition) * visibleTabHeight;
  
  // If there's an active card above this one, add extra space
  if (activeIndex !== null && activeIndex !== undefined && activeIndex > stackPosition) {
    cardOffset += 176; // Height of expanded card content
  }
  
  // If this card is active, add extra space for its content
  if (isActive) {
    cardOffset += 176;
  }

  return (
    <div
      className="absolute left-0 right-0 h-[240px]"
      data-keeper-card-position={dataPosition !== undefined ? dataPosition : stackPosition}
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
                {childName && (
                  <StackedChildBadges 
                    childName={childName} 
                    size="sm" 
                    maxVisible={3}
                  />
                )}
                <span className="text-sm font-semibold text-white">{keeperName}</span>
                
                {/* Carousel controls within tab if enabled */}
                {showCarouselControls && totalCarouselItems > 1 && (
                  <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-2">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onCarouselPrevious?.();
                      }} 
                      className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150"
                      disabled={currentCarouselIndex === 0}
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <span className="text-gray-800 text-[10px] font-medium">
                      {currentCarouselIndex + 1}/{totalCarouselItems}
                    </span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onCarouselNext?.();
                      }} 
                      className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150"
                      disabled={currentCarouselIndex === totalCarouselItems - 1}
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center items-end">
              <span className="text-sm font-medium text-white">{formatDate(date)}</span>
              {time && (
                <span className="text-xs text-gray-200 mt-0.5">{formatTime(time)}</span>
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
                onEdit?.();
              }}
              className="text-xs text-gray-300 hover:text-white transition-colors bg-black/30 rounded-full px-1.5 py-0.5"
            >
              Edit
            </button>
          </div>
          {description ? (
            <p className="text-xs text-gray-200">{description}</p>
          ) : (
            <p className="text-xs italic text-gray-400">—</p>
          )}
        </div>
        
        {/* Today highlight */}
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
              onDelete?.();
            }}
            className="flex items-center gap-1 bg-black/30 text-gray-300 hover:text-[#e7a5b4] text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>

        {/* Add Keeper button (if enabled) */}
        {showAddKeeperButton && (
          <div className="absolute bottom-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddKeeper?.();
              }}
              className="bg-blue-500/80 hover:bg-blue-600/80 text-white text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
            >
              + Add Keeper
            </button>
          </div>
        )}

        {/* Drag indicator - positioned below tab to avoid bleeding through blur */}
        {tabVisual.isDragging && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2 py-1 rounded-full pointer-events-none border border-white/20 z-20 whitespace-nowrap">
            {onFlickDown || onFlickUp 
              ? 'Swipe tab up/down to navigate'
              : (isActive ? 'Drag to close' : 'Drag up to expand')
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default KeeperCard;