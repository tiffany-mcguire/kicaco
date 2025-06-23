import { StackedChildBadges } from '../components/common';
import { ChatBubble } from '../components/chat';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalChatDrawer } from '../components/chat';
import { GlobalHeader } from '../components/navigation';
import { GlobalFooter } from '../components/navigation';
import { GlobalSubheader } from '../components/navigation';
import { useKicacoStore } from '../store/kicacoStore';
import { EventCard } from '../components/calendar';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { parse, format, startOfDay, isAfter, isSameDay } from 'date-fns';

import { generateUUID } from '../utils/uuid';
// Day Colors for Tabs (copied from Home.tsx)
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};



// Reusable formatTime function
const formatTime = (time?: string) => {
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
      if (!isNaN(dateObj.getTime())) return format(dateObj, 'hh:mm a');
    } catch {}
  }
  return time.toUpperCase();
};

// AddEventButton definition (matches AddKeeperButton logic)
const AddEventButton = (props: { label?: string }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const getButtonStyle = () => {
    let s = {
      width: '140px',
      height: '30px',
      padding: '0px 8px',
      border: 'none',
      boxSizing: 'border-box' as const,
      borderRadius: '6px',
      fontWeight: 500,
      fontSize: '14px',
      lineHeight: '20px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      background: '#217e8f',
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.2s ease',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        background: '#1a6e7e',
        boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)' };
    }
    s.outline = 'none';
    return s;
  };

  const handleClick = () => {
    setTimeout(() => navigate('/add-event'), 150);
  };

  return (
    <button
      style={getButtonStyle()}
      tabIndex={0}
      type="button"
      onClick={handleClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseOver={() => setHovered(true)}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setPressed(false); }}
      className="transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(true); }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(false); }}
    >
      {props.label ?? 'Add Event'}
    </button>
  );
};

// Simplified Touch System - TAB AREA ONLY (matching KeeperCard pattern)
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

// Enhanced EventCard with sophisticated touch system (for single events)
const EnhancedEventCard: React.FC<{
  event: any;
  date: string;
  stackPosition: number;
  totalInStack: number;
  isActive: boolean;
  activeIndex: number | null;
  onTabClick: () => void;
  onFlickDown?: (stackPosition: number) => void;
  onFlickUp?: (stackPosition: number, totalCards: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ 
  event, date, stackPosition, totalInStack, isActive, activeIndex, onTabClick, 
  onFlickDown, onFlickUp, onEdit, onDelete 
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
    console.log('[EventCard Tab Touch] Started');
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
      console.log('[EventCard Tab Touch] Drag started');
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
    
    console.log(`[EventCard Tab Touch] End - deltaY: ${deltaY.toFixed(1)}, time: ${timeElapsed}ms, isDragging: ${tabTouchRef.current.isDragging}`);
    
    let actionTaken = false;

    // Handle FLICK gestures - more forgiving criteria when card is open
    const flickTimeThreshold = isActive ? 800 : 600; // More time allowed when card is open
    const flickDistanceThreshold = isActive ? 30 : 40; // Less distance needed when card is open
    
    if (timeElapsed < flickTimeThreshold && absDeltaY > flickDistanceThreshold) {
      if (deltaY > 0) {
        // FLICK DOWN = expose card above it (newer date, higher stack position)
        console.log('[EventCard Tab Touch] Flick DOWN - exposing card above', { stackPosition, hasHandler: !!onFlickDown, isActive });
        if (onFlickDown) {
          // Add small delay to prevent rapid-fire flicking
          setTimeout(() => onFlickDown(stackPosition), 50);
          haptic.success();
          actionTaken = true;
        }
      } else if (deltaY < 0) {
        // FLICK UP = expose card below it (older date, lower stack position)
        console.log('[EventCard Tab Touch] Flick UP - exposing card below', { stackPosition, totalInStack, hasHandler: !!onFlickUp, isActive });
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
        console.log('[EventCard Tab Touch] Drag from closed - opening card');
        onTabClick?.();
        haptic.medium();
        actionTaken = true;
      } else {
        // DRAG from open = if significant movement but not a flick, just allow repositioning
        console.log('[EventCard Tab Touch] Drag from open - repositioning only');
      }
    }
    
    // Handle tap if no vertical gesture detected
    if (!actionTaken && !tabTouchRef.current.hasMovedSignificantly && timeElapsed < 300) {
      console.log('[EventCard Tab Touch] Tap action');
      onTabClick?.();
      haptic.medium();
      actionTaken = true;
    }

    clearTabTouchState();
  }, [isActive, onTabClick, onFlickDown, onFlickUp, stackPosition, totalInStack, clearTabTouchState]);

  const handleTabTouchCancel = useCallback(() => {
    console.log('[EventCard Tab Touch] Cancelled');
    clearTabTouchState();
  }, [clearTabTouchState]);

  // Get day of week for color coding
  const eventDate = parse(date, 'yyyy-MM-dd', new Date());
  const dayOfWeek = eventDate.getDay();

  // Transform birthday party names to possessive form (same logic as EventCard)
  const displayName = (() => {
    const name = event.eventName;
    if (name.toLowerCase().includes('birthday')) {
      const parenthesesMatch = name.match(/\(([^)]+)\)/);
      if (parenthesesMatch) {
        const birthdayChild = parenthesesMatch[1];
        const possessiveName = birthdayChild.endsWith('s') ? `${birthdayChild}'` : `${birthdayChild}'s`;
        const baseEventName = name.replace(/\s*\([^)]+\)/, '').trim();
        if (baseEventName.toLowerCase() === 'birthday party' || baseEventName.toLowerCase() === 'birthday') {
          return `${possessiveName} Birthday Party`;
        }
        return `${possessiveName} ${baseEventName}`;
      }
      if (event.childName && (name.toLowerCase() === 'birthday party' || name.toLowerCase() === 'birthday')) {
        const possessiveName = event.childName.endsWith('s') ? `${event.childName}'` : `${event.childName}'s`;
        return `${possessiveName} Birthday Party`;
      }
    }
    return name;
  })();

  return (
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
      <div className="relative w-full h-full"
      >
        <EventCard
          image={getKicacoEventPhoto(event.eventName)}
          name={event.eventName}
          childName={event.childName}
          date={event.date}
          time={event.time}
          location={event.location}
          notes={event.notes}
          showEventInfo={false}
          onEdit={isActive ? onEdit : undefined}
          onDelete={isActive ? onDelete : undefined}
        />
        
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
                <StackedChildBadges childName={event.childName} size="md" maxVisible={3} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{displayName}</span>
                  {event.location && (
                    <span className="text-xs text-gray-200 mt-0.5">{event.location}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-end">
              <span className="text-sm font-medium text-white">{format(eventDate, 'EEEE, MMMM d')}</span>
              {event.time && (
                <span className="text-xs text-gray-200 mt-0.5">{formatTime(event.time)}</span>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
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
};

// Enhanced CarouselEventCard with sophisticated touch system (for multiple events)
const CarouselEventCard: React.FC<{
  dayEvents: any[];
  date: string;
  stackPosition: number;
  totalInStack: number;
  isActive: boolean;
  activeIndex: number | null;
  onTabClick: () => void;
  navigate: any;
  allEvents: any[];
  removeEvent: (index: number) => void;
  onFlickDown?: (stackPosition: number) => void;
  onFlickUp?: (stackPosition: number, totalCards: number) => void;
}> = React.memo(({ 
  dayEvents, date, stackPosition, totalInStack, isActive, activeIndex, onTabClick, 
  navigate, allEvents, removeEvent, onFlickDown, onFlickUp 
}) => {
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
    console.log('[Carousel Tab Touch] Started');
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
      console.log('[Carousel Tab Touch] Drag started');
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
    
    console.log(`[Carousel Tab Touch] End - deltaY: ${deltaY.toFixed(1)}, time: ${timeElapsed}ms, isDragging: ${tabTouchRef.current.isDragging}`);
    
    let actionTaken = false;

    // Handle FLICK gestures - more forgiving criteria when card is open
    const flickTimeThreshold = isActive ? 800 : 600; // More time allowed when card is open
    const flickDistanceThreshold = isActive ? 30 : 40; // Less distance needed when card is open
    
    if (timeElapsed < flickTimeThreshold && absDeltaY > flickDistanceThreshold) {
      if (deltaY > 0) {
        // FLICK DOWN = expose card above it (newer date, higher stack position)
        console.log('[Carousel Tab Touch] Flick DOWN - exposing card above', { stackPosition, hasHandler: !!onFlickDown, isActive });
        if (onFlickDown) {
          // Add small delay to prevent rapid-fire flicking
          setTimeout(() => onFlickDown(stackPosition), 50);
          haptic.success();
          actionTaken = true;
        }
      } else if (deltaY < 0) {
        // FLICK UP = expose card below it (older date, lower stack position)
        console.log('[Carousel Tab Touch] Flick UP - exposing card below', { stackPosition, totalInStack, hasHandler: !!onFlickUp, isActive });
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
        console.log('[Carousel Tab Touch] Drag from closed - opening card');
        onTabClick?.();
        haptic.medium();
        actionTaken = true;
      } else {
        // DRAG from open = if significant movement but not a flick, just allow repositioning
        console.log('[Carousel Tab Touch] Drag from open - repositioning only');
      }
    }
    
    // Handle tap if no vertical gesture detected
    if (!actionTaken && !tabTouchRef.current.hasMovedSignificantly && timeElapsed < 300) {
      console.log('[Carousel Tab Touch] Tap action');
      onTabClick?.();
      haptic.medium();
      actionTaken = true;
    }

    // Horizontal swipe for carousel (only if supported and not dragging vertically)
    if (!actionTaken && dayEvents.length > 1 && absDeltaX > 40 && absDeltaX > absDeltaY * 1.5) {
      if (deltaX > 0 && currentIdx > 0) {
        setCurrentIdx(prev => prev - 1);
        haptic.medium();
        actionTaken = true;
        console.log('[Carousel Tab Touch] Swipe to previous');
      } else if (deltaX < 0 && currentIdx < dayEvents.length - 1) {
        setCurrentIdx(prev => prev + 1);
        haptic.medium();
        actionTaken = true;
        console.log('[Carousel Tab Touch] Swipe to next');
      }
    }

    clearTabTouchState();
  }, [isActive, onTabClick, onFlickDown, onFlickUp, stackPosition, totalInStack, currentIdx, dayEvents.length, clearTabTouchState]);

  const handleTabTouchCancel = useCallback(() => {
    console.log('[Carousel Tab Touch] Cancelled');
    clearTabTouchState();
  }, [clearTabTouchState]);

  const currentEvent = dayEvents[currentIdx];
  const eventDate = parse(date, 'yyyy-MM-dd', new Date());
  const dayOfWeek = eventDate.getDay();

  // Transform birthday party names to possessive form (same logic as EventCard)
  const displayName = (() => {
    const name = currentEvent.eventName;
    if (name.toLowerCase().includes('birthday')) {
      const parenthesesMatch = name.match(/\(([^)]+)\)/);
      if (parenthesesMatch) {
        const birthdayChild = parenthesesMatch[1];
        const possessiveName = birthdayChild.endsWith('s') ? `${birthdayChild}'` : `${birthdayChild}'s`;
        const baseEventName = name.replace(/\s*\([^)]+\)/, '').trim();
        if (baseEventName.toLowerCase() === 'birthday party' || baseEventName.toLowerCase() === 'birthday') {
          return `${possessiveName} Birthday Party`;
        }
        return `${possessiveName} ${baseEventName}`;
      }
      if (currentEvent.childName && (name.toLowerCase() === 'birthday party' || name.toLowerCase() === 'birthday')) {
        const possessiveName = currentEvent.childName.endsWith('s') ? `${currentEvent.childName}'` : `${currentEvent.childName}'s`;
        return `${possessiveName} Birthday Party`;
      }
    }
    return name;
  })();

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden bg-white"
      data-event-card-position={stackPosition}
      style={{
        transform: `translateY(${(isActive ? -176 : 0) + tabVisual.dragOffset}px) translateX(${tabVisual.dragOffsetX || 0}px) scale(${isActive ? 1.02 * tabVisual.scale : tabVisual.scale})`,
        transition: tabVisual.isDragging ? 'none' : 'all 380ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isActive 
          ? `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)` 
          : `0 4px 12px rgba(0, 0, 0, 0.15)`,
        filter: `brightness(${tabVisual.brightness})`,
      }}
    >
      <EventCard
        image={getKicacoEventPhoto(currentEvent.eventName)}
        name={currentEvent.eventName}
        childName={currentEvent.childName}
        date={currentEvent.date}
        time={currentEvent.time}
        location={currentEvent.location}
        notes={currentEvent.notes}
        showEventInfo={false}
        onEdit={isActive ? () => {
            const globalEventIndex = allEvents.findIndex(e => 
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
        } : undefined}
          onDelete={isActive ? () => {
            const globalEventIndex = allEvents.findIndex(e => 
              e.eventName === currentEvent.eventName && 
              e.date === currentEvent.date && 
              e.childName === currentEvent.childName &&
              e.time === currentEvent.time
            );
            if (globalEventIndex !== -1) {
              removeEvent(globalEventIndex);
            }
          } : undefined}
        />
        
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
              <StackedChildBadges childName={currentEvent.childName} size="md" maxVisible={3} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{displayName}</span>
                {currentEvent.location && (
                  <span className="text-xs text-gray-200 mt-0.5">{currentEvent.location}</span>
                )}
              </div>
              {/* Carousel controls next to event name */}
                {dayEvents.length > 1 && (
                <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 ml-[5px]">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCurrentIdx((prev) => (prev - 1 + dayEvents.length) % dayEvents.length);
                      }} 
                      className="text-gray-800 hover:text-gray-900 p-0 transition-colors duration-150"
                    >
                    <ChevronLeft size={12} />
                  </button>
                    <span className="text-gray-800 text-[10px] font-medium">{currentIdx + 1}/{dayEvents.length}</span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCurrentIdx((prev) => (prev + 1) % dayEvents.length);
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
            <span className="text-sm font-medium text-white">{format(eventDate, 'EEEE, MMMM d')}</span>
            {currentEvent.time && (
              <span className="text-xs text-gray-200 mt-0.5">{formatTime(currentEvent.time)}</span>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
      </div>

        {/* Drag indicator - positioned below tab to avoid bleeding through blur */}
        {tabVisual.isDragging && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none border border-white/20 z-20">
            Flick up/down to navigate stack
          </div>
        )}
    </div>
  );
});



export default function UpcomingEvents() {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [scrollRefReady, setScrollRefReady] = useState(false);
  const internalChatContentScrollRef = useRef<HTMLDivElement | null>(null);
  const autoscrollFlagRef = useRef(false); // For managing autoscroll after new message
  const mutationObserverRef = useRef<MutationObserver | null>(null); // Ref for the new MutationObserver
  const {
    events,
    messages,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
    threadId,
    addMessage,
    removeMessageById,
    removeEvent,
  } = useKicacoStore();
  const previousMessagesLengthRef = useRef(messages.length);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);
  const [activeDayDate, setActiveDayDate] = useState<string | null>(null);

  // Debouncing to prevent rapid-fire stack navigation
  const lastFlickTimeRef = useRef<number>(0);

  const executeScrollToBottom = useCallback(() => {
    const sc = internalChatContentScrollRef.current;
    if (!sc || !scrollRefReady) {
      return;
    }

    requestAnimationFrame(() => {
      if (internalChatContentScrollRef.current) { // Re-check ref
        const currentSc = internalChatContentScrollRef.current;
        const targetScrollTop = Math.max(0, currentSc.scrollHeight - currentSc.clientHeight);
        currentSc.scrollTop = targetScrollTop;
        setChatScrollPosition(targetScrollTop);
      }
    });
  }, [setChatScrollPosition, scrollRefReady]);

  // Helper function to parse time for sorting (same as WeeklyCalendar)
  const parseTimeForSorting = (timeStr?: string): number => {
    if (!timeStr) return 2400; // Events without a time go last

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
          return parseInt(format(dateObj, 'HHmm'), 10);
        }
      } catch {}
    }
    
    const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
    if (!isNaN(dateObj.getTime())) {
      return parseInt(format(dateObj, 'HHmm'), 10);
    }

    return 2400;
  };

  useLayoutEffect(() => {
    function updatePageSpecificMaxHeight() {
      if (subheaderRef.current) {
        const bottom = subheaderRef.current.getBoundingClientRect().bottom;
        const footer = document.querySelector('.global-footer') as HTMLElement | null;
        const footerHeightVal = footer ? footer.getBoundingClientRect().height : 0;
        const availableHeight = window.innerHeight - bottom - footerHeightVal - 4;
        setMaxDrawerHeight(Math.max(availableHeight, 44));
      }
    }
    updatePageSpecificMaxHeight();
    window.addEventListener('resize', updatePageSpecificMaxHeight);
    return () => window.removeEventListener('resize', updatePageSpecificMaxHeight);
  }, [subheaderRef]);

  const handleDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
  };

  useEffect(() => {
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer) return;

    const newMessagesAdded = messages.length > previousMessagesLengthRef.current;
    if (newMessagesAdded) {
      autoscrollFlagRef.current = true;
      executeScrollToBottom();
    } else {
      if (chatScrollPosition !== null && scrollContainer) {
        if (Math.abs(scrollContainer.scrollTop - chatScrollPosition) > 1.5) {
          requestAnimationFrame(() => {
            if (internalChatContentScrollRef.current) {
              internalChatContentScrollRef.current.scrollTop = chatScrollPosition;
            }
          });
        }
      }
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages, chatScrollPosition, setChatScrollPosition, scrollRefReady, executeScrollToBottom]);


  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
  }, []); // Empty dependency array for stable ref callback

  // Callback ref for the messages content div to attach MutationObserver
  const messagesContentRef = useCallback((node: HTMLDivElement | null) => {
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
    }

    if (node && scrollRefReady) {
      const observer = new MutationObserver(() => {
        if (autoscrollFlagRef.current) {
          executeScrollToBottom();
        }
      });

      observer.observe(node, { childList: true, subtree: true, characterData: true });
      mutationObserverRef.current = observer;
    }
  }, [scrollRefReady, executeScrollToBottom]);

  const eventsByDate = useMemo(() => {
    const today = startOfDay(new Date());
    const grouped = events.reduce((acc, event) => {
      const date = event.date;
      if (!date) return acc;
      
      // Filter out past events
      try {
        const eventDate = parse(date, 'yyyy-MM-dd', new Date());
        if (!isAfter(eventDate, today) && !isSameDay(eventDate, today)) {
          return acc; // Skip past events
        }
      } catch (e) {
        return acc; // Skip invalid dates
      }
      
      acc[date] = acc[date] ? [...acc[date], event] : [event];
      return acc;
    }, {} as Record<string, any[]>);
    // Sort events within each day by time
    Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => parseTimeForSorting(a.time) - parseTimeForSorting(b.time));
    });
    return grouped;
  }, [events]);

  const sortedDates = useMemo(() => 
    Object.keys(eventsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()), 
    [eventsByDate]
  );

  const eventsByMonth = useMemo(() => {
    const months: Record<string, string[]> = {};
    for (const date of sortedDates) {
        const month = format(parse(date, 'yyyy-MM-dd', new Date()), 'yyyy-MM');
        if (!months[month]) {
            months[month] = [];
        }
        months[month].push(date);
    }
    return months;
  }, [sortedDates]);

  const sortedMonths = useMemo(() => Object.keys(eventsByMonth).sort(), [eventsByMonth]);

  // Handle flick down - dismiss current card to reveal the one "above" it in stack (newer date, higher stack position)
  const handleFlickDown = useCallback((currentStackPosition: number) => {
    const now = Date.now();
    // Debounce: ignore if less than 200ms since last flick
    if (now - lastFlickTimeRef.current < 200) {
      console.log('[UpcomingEvents] handleFlickDown debounced');
      return;
    }
    lastFlickTimeRef.current = now;
    
    console.log('[UpcomingEvents] handleFlickDown called', { currentStackPosition });
    
    // Find the current card to get its date and month context
    const currentCard = document.querySelector(`[data-event-card-position="${currentStackPosition}"]`);
    const currentDate = currentCard?.getAttribute('data-event-card-date');
    
    if (!currentDate) {
      console.log('[UpcomingEvents] Could not find current card date');
      return;
    }
    
    // Find which month this card belongs to and get the local stack
    const currentMonth = format(parse(currentDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM');
    const monthDates = eventsByMonth[currentMonth];
    if (!monthDates) {
      console.log('[UpcomingEvents] Could not find month for current date');
      return;
    }
    
    const reversedMonthDates = [...monthDates].reverse();
    const currentLocalIndex = reversedMonthDates.indexOf(currentDate);
    
    // Move to next card in local stack (higher index = older date, lower in visual stack)
    const nextLocalIndex = currentLocalIndex + 1;
    
    if (nextLocalIndex < reversedMonthDates.length) {
      const nextDate = reversedMonthDates[nextLocalIndex];
      console.log('[UpcomingEvents] Flick down to next card:', { currentDate, nextDate, currentLocalIndex, nextLocalIndex });
      setActiveDayDate(nextDate);
    } else {
      console.log('[UpcomingEvents] Flick down - no more cards in stack');
      setActiveDayDate(null);
    }
  }, [eventsByMonth]);

  // Handle flick up - bring back the card "below" it in stack (older date, lower stack position)
  const handleFlickUp = useCallback((currentStackPosition: number) => {
    const now = Date.now();
    // Debounce: ignore if less than 200ms since last flick
    if (now - lastFlickTimeRef.current < 200) {
      console.log('[UpcomingEvents] handleFlickUp debounced');
      return;
    }
    lastFlickTimeRef.current = now;
    
    console.log('[UpcomingEvents] handleFlickUp called', { currentStackPosition });
    
    // Find the current card to get its date and month context
    const currentCard = document.querySelector(`[data-event-card-position="${currentStackPosition}"]`);
    const currentDate = currentCard?.getAttribute('data-event-card-date');
    
    if (!currentDate) {
      console.log('[UpcomingEvents] Could not find current card date');
      return;
    }
    
    // Find which month this card belongs to and get the local stack
    const currentMonth = format(parse(currentDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM');
    const monthDates = eventsByMonth[currentMonth];
    if (!monthDates) {
      console.log('[UpcomingEvents] Could not find month for current date');
      return;
    }
    
    const reversedMonthDates = [...monthDates].reverse();
    const currentLocalIndex = reversedMonthDates.indexOf(currentDate);
    
    // Move to previous card in local stack (lower index = newer date, higher in visual stack)
    const nextLocalIndex = currentLocalIndex - 1;
    
    if (nextLocalIndex >= 0) {
      const nextDate = reversedMonthDates[nextLocalIndex];
      console.log('[UpcomingEvents] Flick up to previous card:', { currentDate, nextDate, currentLocalIndex, nextLocalIndex });
      setActiveDayDate(nextDate);
    } else {
      console.log('[UpcomingEvents] Flick up - no more cards in stack');
      setActiveDayDate(null);
    }
  }, [eventsByMonth]);

  // Assistant-enabled handleSend
  const handleSend = async () => {
    if (!input.trim() || !threadId) return;
    const userMessage = { id: generateUUID(), sender: 'user' as const, content: input };
    addMessage(userMessage);
    const thinkingId = 'thinking-upcoming';
    addMessage({ id: thinkingId, sender: 'assistant', content: 'Kicaco is thinking' });
    try {
      const response = await sendMessageToAssistant(threadId, input);
      removeMessageById(thinkingId);
      addMessage({ id: generateUUID(), sender: 'assistant', content: response });
    } catch (error) {
      removeMessageById(thinkingId);
      addMessage({ id: generateUUID(), sender: 'assistant', content: 'An error occurred.' });
    }
    setInput('');
  };

  const visibleTabHeight = 56;
  const expandedCardHeight = 240;
  const popOffset = expandedCardHeight - visibleTabHeight;

  // No auto-opening of cards on initial load

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Calendar />}
        title="Upcoming Events"
        action={<AddEventButton />}
      />
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
          {messages.map((msg) => {
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
                        date={msg.event.date}
                        time={msg.event.time}
                        location={msg.event.location}
                      />
                      <div className="mt-2 text-left w-full text-sm text-gray-900">{
                        msg.content.replace(/Want to change anything\??/, '').trim()
                      }</div>
                    </div>
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
      </GlobalChatDrawer>
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{
          paddingBottom: `${currentDrawerHeight + (footerRef.current?.offsetHeight ?? 0) + 200}px`, // Added extra padding for expanded event cards
        }}
      >
        <div className="max-w-md mx-auto">
          {sortedDates.length > 0 ? (
            <div className="space-y-8">
              {sortedMonths.map((month, monthIndex) => {
                const monthDates = eventsByMonth[month];
                // Reverse the dates so earliest is last (will be at bottom of stack)
                const reversedMonthDates = [...monthDates].reverse();
                const activeDateIndex = activeDayDate ? reversedMonthDates.indexOf(activeDayDate) : -1;
                
                // Calculate global position offset for this month to ensure unique data-event-card-position values
                const globalPositionOffset = sortedMonths.slice(0, monthIndex).reduce((offset, prevMonth) => {
                  return offset + eventsByMonth[prevMonth].length;
                }, 0);
                
                // Check if there's an active card from ANY previous month that could overlap this header
                const hasOverlappingActiveCard = activeDayDate && sortedMonths.slice(0, monthIndex).some(prevMonth => 
                  eventsByMonth[prevMonth] && eventsByMonth[prevMonth].includes(activeDayDate)
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
                          height: `${expandedCardHeight + ((reversedMonthDates.length - 1) * visibleTabHeight)}px`,
                          marginBottom: activeDateIndex !== -1 ? '32px' : '20px',
                          transition: 'margin-bottom 380ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {reversedMonthDates.map((date, idx) => {
                          // Use local idx for all visual positioning (keeps existing logic intact)
                          const localStackPosition = idx;
                          // Use global position for data attribute to ensure uniqueness across months
                          const globalStackPosition = idx + globalPositionOffset;
                          const isActive = activeDayDate === date;
                          
                          // Calculate the card's vertical offset (using local position for visual consistency)
                          // Cards stack from bottom to top
                          let cardOffset = (reversedMonthDates.length - 1 - localStackPosition) * visibleTabHeight;
                          
                          // If there's an active card below this one, push this card up
                          if (activeDateIndex !== -1 && activeDateIndex > localStackPosition) {
                              cardOffset += popOffset;
                          }
                          
                          // If this card is active, compensate for its transform
                          if (isActive) {
                              cardOffset += popOffset;
                          }

                          return (
                              <div
                                  key={date}
                                  className="absolute left-0 right-0 h-[240px]"
                                  data-event-card-date={date}
                                  data-event-card-position={globalStackPosition}
                                  style={{
                                      top: `${cardOffset}px`,
                                      zIndex: reversedMonthDates.length - localStackPosition,
                                      transition: 'top 380ms cubic-bezier(0.4, 0, 0.2, 1)',
                                  }}
                              >
                                    {eventsByDate[date].length === 1 ? (
                                      <EnhancedEventCard
                                        event={eventsByDate[date][0]}
                                        date={date}
                                        stackPosition={globalStackPosition}
                                        totalInStack={reversedMonthDates.length}
                                        isActive={isActive}
                                        activeIndex={activeDateIndex}
                                        onTabClick={() => setActiveDayDate(isActive ? null : date)}
                                        onFlickDown={handleFlickDown}
                                        onFlickUp={handleFlickUp}
                                        onEdit={() => {
                                          const event = eventsByDate[date][0];
                                          const globalEventIndex = events.findIndex(e => 
                                            e.eventName === event.eventName && 
                                            e.date === event.date && 
                                            e.childName === event.childName &&
                                            e.time === event.time
                                          );
                                          navigate('/add-event', { 
                                            state: { 
                                              event: event,
                                              eventIndex: globalEventIndex,
                                              isEdit: true 
                                            } 
                                          });
                                        }}
                                        onDelete={() => {
                                          const event = eventsByDate[date][0];
                                          const globalEventIndex = events.findIndex(e => 
                                            e.eventName === event.eventName && 
                                            e.date === event.date && 
                                            e.childName === event.childName &&
                                            e.time === event.time
                                          );
                                          if (globalEventIndex !== -1) {
                                            removeEvent(globalEventIndex);
                                          }
                                        }}
                                      />
                                    ) : (
                                      <CarouselEventCard
                                        dayEvents={eventsByDate[date]}
                                        date={date}
                                        stackPosition={globalStackPosition}
                                        totalInStack={reversedMonthDates.length}
                                        isActive={isActive}
                                        activeIndex={activeDateIndex}
                                        onTabClick={() => setActiveDayDate(isActive ? null : date)}
                                        navigate={navigate}
                                        allEvents={events}
                                        removeEvent={removeEvent}
                                        onFlickDown={handleFlickDown}
                                        onFlickUp={handleFlickUp}
                                    />
                                    )}
                              </div>
                          );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No upcoming events.
            </div>
          )}
        </div>
      </div>
      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSend}
        disabled={!threadId}
      />
    </div>
  );
} 