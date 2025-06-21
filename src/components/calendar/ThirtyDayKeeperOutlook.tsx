import React, { useState, useMemo, useRef, useCallback } from 'react';
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

// Carousel Keeper Card Component
const CarouselKeeperCard = React.memo(({ 
  dayKeepers, date, stackPosition, totalInStack, isActive, activeIndex, onTabClick, 
  navigate, removeKeeper, keepers, setDeleteConfirmation 
}: any) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Touch handling for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchIntentionRef = useRef<'unknown' | 'vertical' | 'horizontal' | 'swipe'>('unknown');
  
  // Helper function to reset touch state
  const resetTouchState = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
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
    // Reset state first
    resetTouchState();
    
    // Only handle if there are multiple keepers
    if (dayKeepers.length <= 1) return;
    
    // Check if touch started on a button - if so, don't interfere
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return; // Don't handle touches on buttons
    }
    
    // Record starting position
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchIntentionRef.current = 'unknown';
    
    // Stop propagation to prevent parent handlers
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || dayKeepers.length <= 1) {
      resetTouchState();
      return;
    }

    // Check if touch is on a button - if so, don't interfere
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(touchStartX.current - currentX);
    const diffY = Math.abs(touchStartY.current - currentY);
    
    // Determine user intention based on movement pattern
    if (touchIntentionRef.current === 'unknown') {
      const minMovement = 15; // Minimum movement to determine intention
      
      if (diffX > minMovement || diffY > minMovement) {
        const horizontalDisplacement = Math.abs(touchStartX.current - currentX);
        const verticalDisplacement = Math.abs(touchStartY.current - currentY);
        
        // Check for clear vertical movement (scrolling)
        const minVerticalForScroll = 25;
        const maxHorizontalDriftForScroll = 10;
        const strongVerticalRatio = verticalDisplacement > horizontalDisplacement * 3;
        
        if (strongVerticalRatio && verticalDisplacement > minVerticalForScroll && horizontalDisplacement < maxHorizontalDriftForScroll) {
          // Clear vertical movement - allow page scrolling
          touchIntentionRef.current = 'vertical';
        } else if (horizontalDisplacement > verticalDisplacement * 1.5 && horizontalDisplacement > 20) {
          // Clear horizontal movement - this is a swipe
          touchIntentionRef.current = 'horizontal';
        } else if (horizontalDisplacement > 30) {
          // Significant horizontal displacement
          touchIntentionRef.current = 'swipe';
        }
      }
    }
    
    // Handle based on determined intention
    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      // Prevent default for horizontal movement to stop page scrolling
      e.preventDefault();
      e.stopPropagation();
    } else if (touchIntentionRef.current === 'vertical') {
      // Allow vertical scrolling by only stopping propagation
      e.stopPropagation();
    } else {
      // Still determining intention - stop propagation but allow default
      e.stopPropagation();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || dayKeepers.length <= 1) {
      resetTouchState();
      return;
    }

    // Check if touch ended on a button - if so, don't interfere
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      resetTouchState();
      return;
    }
    
    e.stopPropagation();
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = Math.abs(touchStartY.current - touchEndY);
    const threshold = 50; // Minimum distance for swipe

    // Only process swipes if intention was horizontal movement
    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      e.preventDefault(); // Prevent default for swipe gestures
      
      const horizontalDisplacement = Math.abs(diffX);
      
      // Check if we actually moved horizontally enough
      if (horizontalDisplacement > threshold) {
        if (diffX > 0) {
          // Swiped left - next keeper
          handleSwipe(1);
        } else {
          // Swiped right - previous keeper
          handleSwipe(-1);
        }
      }
    }
    
    // Reset touch state
    resetTouchState();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.stopPropagation();
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
        
        {/* A single overlay for the entire card */}
        <div className="absolute inset-0 bg-black/[.65]" />
        
        {/* Tab overlay on top with touch handlers */}
        <div 
          className="absolute top-0 left-0 right-0 z-10 h-[56px] backdrop-blur-sm"
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
        
        {/* Info Panel with Notes - always visible like EventCard */}
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
        
        {/* Delete button at bottom center */}
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
              // Multiple keepers for this day - use carousel
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
                  removeKeeper={removeKeeper}
                  keepers={keepers}
                  setDeleteConfirmation={setDeleteConfirmation}
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