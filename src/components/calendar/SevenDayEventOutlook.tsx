import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parse, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EventCard from './EventCard';
import { useKicacoStore } from '../../store/kicacoStore';
import { getKicacoEventPhoto } from '../../utils/getKicacoEventPhoto';
import { ConfirmDialog } from '../common';

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
      dayOfWeek: date.getDay(),
      isToday: i === 0,
    });
  }
  return days;
};

// Day colors
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', // Sunday - pink
  1: '#ffd8b5', // Monday - orange
  2: '#fde68a', // Tuesday - yellow
  3: '#bbf7d0', // Wednesday - green
  4: '#c0e2e7', // Thursday - blue
  5: '#d1d5fa', // Friday - indigo
  6: '#e9d5ff', // Saturday - purple
};

const dayColorsDark: { [key: number]: string } = {
  0: '#e7a5b4',
  1: '#e6c2a2',
  2: '#e3d27c',
  3: '#a8e1bb',
  4: '#aed1d6',
  5: '#b9bde3',
  6: '#d4c0e6',
};

const SevenDayEventOutlook: React.FC = () => {
  const navigate = useNavigate();
  const events = useKicacoStore(state => state.events);
  const removeEvent = useKicacoStore(state => state.removeEvent);
  const next7Days = useMemo(() => generateNext7Days(), []);
  const [selectedDate, setSelectedDate] = useState(next7Days[0].date);
  const [displayedEventIndex, setDisplayedEventIndex] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; eventIndex: number | null }>({
    isOpen: false,
    eventIndex: null
  });

  // Touch handling for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const carouselTouchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasCarouselRef = useRef<boolean>(false);
  const carouselRegionRef = useRef<HTMLDivElement>(null);
  const touchIntentionRef = useRef<'unknown' | 'vertical' | 'horizontal' | 'swipe'>('unknown');
  
  // Helper function to completely reset touch state
  const resetTouchState = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
    touchIntentionRef.current = 'unknown';
  }, []);

  // Find the index of the selected date
  const selectedDayIndex = next7Days.findIndex(day => isSameDay(day.date, selectedDate));

  // Handle swipe navigation
  const handleSwipe = (direction: number) => {
    let newIndex = selectedDayIndex + direction;
    
    // Wrap around logic
    if (newIndex < 0) {
      newIndex = next7Days.length - 1; // Go to last day
    } else if (newIndex >= next7Days.length) {
      newIndex = 0; // Go to first day
    }
    
    setSelectedDate(next7Days[newIndex].date);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Always reset state first to ensure clean start
    resetTouchState();
    
    // Check if touch started within carousel controls - if so, don't interfere
    const carouselElement = carouselRegionRef.current;
    if (carouselElement) {
      const rect = carouselElement.getBoundingClientRect();
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      
      // Add padding around carousel controls for easier tapping (8px padding on all sides)
      const padding = 8;
      // If touch is within carousel controls area (including padding), don't handle it - let buttons work normally
      if (touchX >= (rect.left - padding) && touchX <= (rect.right + padding) && 
          touchY >= (rect.top - padding) && touchY <= (rect.bottom + padding)) {
        resetTouchState();
        return; // Don't stop propagation or prevent default - let button clicks work
      }
    }
    
    // Record starting position but don't prevent default yet
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchIntentionRef.current = 'unknown';
    
    // Check if touch started near the bottom of the component
    const containerElement = containerRef.current;
    if (containerElement) {
      const rect = containerElement.getBoundingClientRect();
      const touchY = e.touches[0].clientY;
      const relativeY = touchY - rect.top;
      const componentHeight = rect.height;
      
      // If touch starts in bottom 30% of component, be extra conservative
      if (relativeY > componentHeight * 0.7) {
        // For bottom touches, don't stop propagation initially - let page handle it
        resetTouchState(); // Reset since we're not handling this
        return;
      }
    }
    
    // Stop propagation to prevent parent handlers, but allow default behavior initially
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) {
      // Safety: if we have corrupted state, reset and exit
      resetTouchState();
      return;
    }

    // Check if touch is within carousel controls - if so, don't interfere
    const carouselElement = carouselRegionRef.current;
    if (carouselElement) {
      const rect = carouselElement.getBoundingClientRect();
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      
      // Add padding around carousel controls for easier tapping (8px padding on all sides)
      const padding = 8;
      // If touch is within carousel controls area (including padding), don't handle it
      if (touchX >= (rect.left - padding) && touchX <= (rect.right + padding) && 
          touchY >= (rect.top - padding) && touchY <= (rect.bottom + padding)) {
        return; // Don't interfere with carousel controls
      }
    }
    
    // Check if this touch started near the bottom - if so, be extra conservative
    const containerElement = containerRef.current;
    let isBottomTouch = false;
    if (containerElement) {
      const rect = containerElement.getBoundingClientRect();
      const relativeStartY = touchStartY.current - rect.top;
      const componentHeight = rect.height;
      isBottomTouch = relativeStartY > componentHeight * 0.7;
    }
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(touchStartX.current - currentX);
    const diffY = Math.abs(touchStartY.current - currentY);
    
    // Determine user intention based on movement pattern
    if (touchIntentionRef.current === 'unknown') {
      const minMovement = 20; // Higher minimum movement to be more conservative
      
      if (diffX > minMovement || diffY > minMovement) {
        // Calculate actual directional displacement (not just magnitude)
        const horizontalDisplacement = Math.abs(touchStartX.current - currentX);
        const verticalDisplacement = Math.abs(touchStartY.current - currentY);
        
        // Much stricter vertical scrolling detection, especially for bottom touches
        const maxHorizontalDriftForScroll = isBottomTouch ? 8 : 15; // Even tighter for bottom touches
        const minVerticalForScroll = isBottomTouch ? 40 : 30; // Higher minimum for bottom touches
        const requiredVerticalRatio = isBottomTouch ? 6 : 4; // Much stricter ratio for bottom touches
        const strongVerticalRatio = verticalDisplacement > horizontalDisplacement * requiredVerticalRatio;
        
        // Check if user is clearly moving to a different horizontal position
        const swipeThreshold = isBottomTouch ? 35 : 25; // Higher threshold for bottom touches
        const significantHorizontalTravel = horizontalDisplacement > swipeThreshold;
        const horizontalDominance = horizontalDisplacement > verticalDisplacement * 1.5;
        
        if (strongVerticalRatio && verticalDisplacement > minVerticalForScroll && horizontalDisplacement < maxHorizontalDriftForScroll) {
          // Very strict vertical movement - must be nearly straight down with minimal drift
          touchIntentionRef.current = 'vertical';
        } else if (significantHorizontalTravel && horizontalDominance) {
          // Clear horizontal travel to a different position - this is a swipe
          touchIntentionRef.current = 'horizontal';
        } else if (horizontalDisplacement > (isBottomTouch ? 45 : 35)) {
          // Significant horizontal displacement - higher threshold for bottom touches
          touchIntentionRef.current = 'swipe';
        } else if (isBottomTouch) {
          // For bottom touches, if we're not clearly vertical or horizontal, don't interfere
          // Just stop propagation but don't prevent default to allow page scrolling
          e.stopPropagation();
          return;
        }
        // If none of the above, stay 'unknown' to allow more movement
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
      // Don't prevent default - this allows the page to scroll
    } else {
      // Still determining intention - stop propagation but allow default
      e.stopPropagation();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Check if touch is within carousel controls - if so, don't interfere
    const carouselElement = carouselRegionRef.current;
    if (carouselElement) {
      const rect = carouselElement.getBoundingClientRect();
      const touchX = e.changedTouches[0].clientX;
      const touchY = e.changedTouches[0].clientY;
      
      // Add padding around carousel controls for easier tapping (8px padding on all sides)
      const padding = 8;
      // If touch is within carousel controls area (including padding), don't handle it
      if (touchX >= (rect.left - padding) && touchX <= (rect.right + padding) && 
          touchY >= (rect.top - padding) && touchY <= (rect.bottom + padding)) {
        resetTouchState();
        return; // Don't interfere with carousel controls
      }
    }
    
    // Always stop propagation but only prevent default for swipe gestures
    e.stopPropagation();
    
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    // Only process swipes if intention was horizontal movement
    if (touchIntentionRef.current === 'horizontal' || touchIntentionRef.current === 'swipe') {
      e.preventDefault(); // Prevent default for swipe gestures
      
      const horizontalDisplacement = Math.abs(diffX);
      
      // Focus on actual horizontal travel distance rather than just ratios
      const minSwipeDistance = 60; // Minimum horizontal distance to register as swipe
      const actuallyMovedHorizontally = horizontalDisplacement > minSwipeDistance;
      
      if (actuallyMovedHorizontally) {
        if (diffX > 0) {
          // Swiped left - next day
          handleSwipe(1);
        } else {
          // Swiped right - previous day
          handleSwipe(-1);
        }
      }
    }
    
    // Reset touch state
    resetTouchState();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    // Check if touch is within carousel controls - if so, don't interfere
    const carouselElement = carouselRegionRef.current;
    if (carouselElement) {
      const rect = carouselElement.getBoundingClientRect();
      const touchX = e.changedTouches[0].clientX;
      const touchY = e.changedTouches[0].clientY;
      
      // Add padding around carousel controls for easier tapping (8px padding on all sides)
      const padding = 8;
      // If touch is within carousel controls area (including padding), don't handle it
      if (touchX >= (rect.left - padding) && touchX <= (rect.right + padding) && 
          touchY >= (rect.top - padding) && touchY <= (rect.bottom + padding)) {
        return; // Don't interfere with carousel controls
      }
    }
    
    // Always reset state when touch is cancelled
    e.stopPropagation();
    resetTouchState();
  };

  // Filter and sort events for the selected day
  const eventsForSelectedDay = useMemo(() => {
    const parseTime = (timeStr?: string): number => {
      if (!timeStr) return 2400; // Events without time go last

      let normalized = timeStr.trim().toLowerCase();
      normalized = normalized.replace(/(\d)(am|pm)/, '$1 $2');
      if (/^\d{1,2}\s?(am|pm)$/.test(normalized)) {
        normalized = normalized.replace(/^(\d{1,2})\s?(am|pm)$/, '$1:00 $2');
      }

      const patterns = ['h:mm a', 'h a', 'h:mma', 'ha', 'H:mm'];
      for (const pattern of patterns) {
        try {
          const dateObj = parse(normalized, pattern, new Date());
          if (!isNaN(dateObj.getTime())) {
            return dateObj.getHours() * 100 + dateObj.getMinutes();
          }
        } catch {}
      }
      
      const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.getHours() * 100 + dateObj.getMinutes();
      }

      return 2400;
    };

    return events
      .filter(event => {
        if (!event.date) return false;
        try {
          const eventDate = parse(event.date, 'yyyy-MM-dd', new Date());
          return isSameDay(eventDate, selectedDate);
        } catch (e) {
          console.error("Error parsing event date for comparison:", event.date, e);
          return false;
        }
      })
      .sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }, [events, selectedDate]);
  
  // Reset index when selected day changes or events change
  useEffect(() => {
    setDisplayedEventIndex(0);
    // Also reset touch state to prevent stale data
    resetTouchState();
  }, [selectedDate, eventsForSelectedDay.length, resetTouchState]);

  // Update carousel ref when events change
  useEffect(() => {
    hasCarouselRef.current = eventsForSelectedDay.length > 1;
  }, [eventsForSelectedDay]);

  // Ensure displayedEventIndex is within bounds
  const safeDisplayedEventIndex = eventsForSelectedDay.length > 0 
    ? Math.min(displayedEventIndex, eventsForSelectedDay.length - 1)
    : 0;
  const currentEvent = eventsForSelectedDay[safeDisplayedEventIndex];

  return (
    <section className="pt-6 mb-10">
      <h2 className="text-sm font-medium text-gray-600 mb-4 ml-1 max-w-md mx-auto">
        7-Day Event Outlook
      </h2>
      <div className="relative w-full max-w-md mx-auto">
        {/* Event Content with Touch Handlers */}
        <div 
          ref={containerRef}
          className="relative rounded-xl shadow-lg overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {eventsForSelectedDay.length > 0 && currentEvent ? (
            <>
              <EventCard
                image={getKicacoEventPhoto(currentEvent.eventName)}
                name={currentEvent.eventName}
                childName={currentEvent.childName}
                date={currentEvent.date}
                time={currentEvent.time}
                location={currentEvent.location}
                notes={currentEvent.notes || "Remember to bring sunscreen and a water bottle!"}
                contactName={currentEvent.contactName}
                phoneNumber={currentEvent.phoneNumber}
                email={currentEvent.email}
                websiteUrl={currentEvent.websiteUrl}
                noHeaderSpace={true}
                showEventInfo={true}
                onEdit={() => {
                  const globalEventIndex = events.findIndex(e => 
                    e.eventName === currentEvent.eventName && 
                    e.date === currentEvent.date && 
                    e.childName === currentEvent.childName &&
                    e.time === currentEvent.time
                  );
                  navigate('/add-event', { 
                    state: { 
                      event: currentEvent,
                      eventIndex: globalEventIndex,
                      isEdit: true 
                    } 
                  });
                }}
                onDelete={() => {
                  const globalEventIndex = events.findIndex(e => 
                    e.eventName === currentEvent.eventName && 
                    e.date === currentEvent.date && 
                    e.childName === currentEvent.childName &&
                    e.time === currentEvent.time
                  );
                  if (globalEventIndex !== -1) {
                    setDeleteConfirmation({ isOpen: true, eventIndex: globalEventIndex });
                  }
                }}
                carouselSwipeHandler={eventsForSelectedDay.length > 1 ? {
                  onTouchStart: (e: React.TouchEvent) => {
                    // Check if touch started on carousel controls - if so, don't interfere
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('[role="button"]')) {
                      return; // Don't handle touches on buttons
                    }
                    
                    // Only prevent default and stop propagation for non-button touches
                    e.preventDefault();
                    e.stopPropagation();
                    carouselTouchStartX.current = e.touches[0].clientX;
                  },
                  onTouchEnd: (e: React.TouchEvent) => {
                    // Check if touch ended on carousel controls - if so, don't interfere
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('[role="button"]')) {
                      carouselTouchStartX.current = null; // Reset state but don't process swipe
                      return; // Don't handle touches on buttons
                    }
                    
                    // Only prevent default and stop propagation for non-button touches
                    e.preventDefault();
                    e.stopPropagation();
                    if (carouselTouchStartX.current === null) return;
                    
                    const touchEndX = e.changedTouches[0].clientX;
                    const diff = carouselTouchStartX.current - touchEndX;
                    const threshold = 30;

                    if (Math.abs(diff) > threshold) {
                      if (diff > 0) {
                        // Swiped left - next event
                        setDisplayedEventIndex(prev => {
                          const newIndex = (prev + 1) % eventsForSelectedDay.length;
                          return Math.min(newIndex, eventsForSelectedDay.length - 1);
                        });
                      } else {
                        // Swiped right - previous event
                        setDisplayedEventIndex(prev => {
                          const newIndex = (prev - 1 + eventsForSelectedDay.length) % eventsForSelectedDay.length;
                          return Math.min(newIndex, eventsForSelectedDay.length - 1);
                        });
                      }
                    }
                    
                    carouselTouchStartX.current = null;
                  }
                } : undefined}
                carouselControls={
                  eventsForSelectedDay.length > 1 ? (
                    <div 
                      ref={carouselRegionRef}
                      className="relative -m-1 p-1"
                    >
                      <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0">
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setDisplayedEventIndex(prev => {
                            const newIndex = (prev - 1 + eventsForSelectedDay.length) % eventsForSelectedDay.length;
                            return Math.min(newIndex, eventsForSelectedDay.length - 1);
                          });
                        }} className="text-gray-800 hover:text-gray-900 p-0.5">
                          <ChevronLeft size={12} />
                        </button>
                        <span className="text-gray-800 text-[10px] font-medium px-0.5">
                          {safeDisplayedEventIndex + 1}/{eventsForSelectedDay.length}
                        </span>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setDisplayedEventIndex(prev => {
                            const newIndex = (prev + 1) % eventsForSelectedDay.length;
                            return Math.min(newIndex, eventsForSelectedDay.length - 1);
                          });
                        }} className="text-gray-800 hover:text-gray-900 p-0.5">
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  ) : undefined
                }
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
        <div 
          className="absolute top-0 left-0 right-0 z-10"
        >
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
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, eventIndex: null })}
        onConfirm={() => {
          if (deleteConfirmation.eventIndex !== null) {
            removeEvent(deleteConfirmation.eventIndex);
            // After deletion, adjust the displayed index if needed
            if (displayedEventIndex >= eventsForSelectedDay.length - 1 && displayedEventIndex > 0) {
              setDisplayedEventIndex(displayedEventIndex - 1);
            }
          }
        }}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        secondaryMessage="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </section>
  );
};

export default SevenDayEventOutlook; 