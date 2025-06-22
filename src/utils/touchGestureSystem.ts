/**
 * Advanced Touch Gesture Recognition System
 * 
 * This module provides a sophisticated touch interaction system designed specifically
 * for stacked card interfaces. It implements smart gesture recognition, adaptive
 * scroll locking, enhanced visual feedback, and responsive thresholds.
 * 
 * Key Features:
 * - Smart velocity-based gesture detection
 * - Context-aware scroll locking (tab vs content area)
 * - Screen size adaptive thresholds
 * - Enhanced haptic feedback patterns
 * - Progressive visual feedback system
 * - Conservative fallbacks for unknown gestures
 */

// ===============================
// TYPE DEFINITIONS
// ===============================

export interface TouchTrackingState {
  startX: number;
  startY: number;
  startTime: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  velocityX: number;
  velocityY: number;
  isTracking: boolean;
  scrollLocked: boolean;
  gestureIntent: GestureIntent;
  holdTimer: number | null;
  hasMovedSignificantly: boolean;
  isDragging: boolean;
  touchStartOnTab: boolean;
  velocityHistory: Array<{ x: number; y: number; time: number }>;
  lastSignificantMovement: number;
  scrollPermissionTime: number;
}

export interface VisualFeedbackState {
  isHolding: boolean;
  isDragging: boolean;
  transformScale: number;
  brightness: number;
  dragOffsetY: number;
  dragOffsetX: number;
  showHoldIndicator: boolean;
  gestureDirection: GestureDirection;
  feedbackIntensity: number;
  showGestureHint: boolean;
  gestureProgress: number;
}

export interface ScrollManagerState {
  isLocked: boolean;
  lockReason: string;
  permissiveUntil: number;
}

export interface AdaptiveThresholds {
  horizontalSwipeThreshold: number;
  verticalGestureThreshold: number;
  flickVelocityThreshold: number;
  holdDetectionTime: number;
  holdMovementTolerance: number;
}

// ===============================
// GESTURE TYPES
// ===============================

export type GestureIntent = 
  | 'unknown' 
  | 'vertical-card' 
  | 'horizontal-swipe' 
  | 'scroll' 
  | 'hold' 
  | 'tap' 
  | 'flick-dismiss' 
  | 'carousel-navigate';

export type GestureDirection = 
  | 'none' 
  | 'up' 
  | 'down' 
  | 'left' 
  | 'right';

export type HapticPattern = 
  | 'confirm' 
  | 'interactionStart' 
  | 'progress' 
  | 'success' 
  | 'warning';

// ===============================
// VELOCITY CALCULATION
// ===============================

/**
 * Calculates smooth velocity using weighted average of recent touch points
 * Uses the last 3 points with decreasing weights for older points
 * 
 * @param history Array of recent touch positions with timestamps
 * @returns Velocity object with x, y components and magnitude
 */
export const calculateVelocity = (
  history: Array<{ x: number; y: number; time: number }>
): { x: number; y: number; magnitude: number } => {
  if (history.length < 2) return { x: 0, y: 0, magnitude: 0 };
  
  const recent = history.slice(-3); // Use last 3 points for smooth velocity
  const weights = [0.2, 0.3, 0.5]; // Weight recent movements more heavily
  
  let weightedVx = 0, weightedVy = 0, totalWeight = 0;
  
  for (let i = 1; i < recent.length; i++) {
    const dt = recent[i].time - recent[i - 1].time;
    if (dt > 0) {
      const vx = (recent[i].x - recent[i - 1].x) / dt;
      const vy = (recent[i].y - recent[i - 1].y) / dt;
      const weight = weights[i - 1] || 0.1;
      
      weightedVx += vx * weight;
      weightedVy += vy * weight;
      totalWeight += weight;
    }
  }
  
  const finalVx = totalWeight > 0 ? weightedVx / totalWeight : 0;
  const finalVy = totalWeight > 0 ? weightedVy / totalWeight : 0;
  const magnitude = Math.sqrt(finalVx * finalVx + finalVy * finalVy);
  
  return { x: finalVx, y: finalVy, magnitude };
};

// ===============================
// ADAPTIVE THRESHOLDS
// ===============================

/**
 * Calculates responsive thresholds based on screen dimensions
 * Ensures consistent gesture recognition across different device sizes
 * 
 * Minimum thresholds:
 * - Horizontal swipes: 60px or 15% of screen width
 * - Vertical gestures: 40px or 10% of screen height
 * - Velocity-based detection adapted to screen size
 * 
 * @returns AdaptiveThresholds object with calculated values
 */
export const getScreenAdaptiveThresholds = (): AdaptiveThresholds => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  return {
    // Minimum 60px or 15% of screen width for horizontal swipes
    horizontalSwipeThreshold: Math.max(60, screenWidth * 0.15),
    // Minimum 40px or 10% of screen height for vertical gestures
    verticalGestureThreshold: Math.max(40, screenHeight * 0.10),
    // Velocity thresholds adapted to screen size
    flickVelocityThreshold: Math.max(0.8, Math.min(screenWidth, screenHeight) * 0.002),
    // Hold detection timing
    holdDetectionTime: 250,
    // Movement tolerance for stationary detection
    holdMovementTolerance: Math.max(8, screenWidth * 0.02),
  };
};

// ===============================
// GESTURE ANALYSIS
// ===============================

/**
 * Analyzes touch input to determine gesture intent using sophisticated algorithms
 * 
 * Priority order:
 * 1. Tap - quick, minimal movement
 * 2. Hold - stationary touch beyond threshold time
 * 3. Flick - high velocity vertical movement
 * 4. Horizontal swipe - clear horizontal movement with velocity
 * 5. Vertical card gesture - vertical movement, prioritized on tabs
 * 6. Scroll - gentle vertical movement not on tabs
 * 7. Unknown - fallback for ambiguous gestures
 * 
 * @param deltaX Horizontal displacement from start
 * @param deltaY Vertical displacement from start
 * @param velocity Calculated velocity with magnitude
 * @param timeElapsed Time since touch start
 * @param touchStartOnTab Whether touch started on card tab
 * @param hasMovedSignificantly Whether movement exceeds threshold
 * @returns Determined gesture intent
 */
export const analyzeAdvancedGestureIntent = (
  deltaX: number,
  deltaY: number,
  velocity: { x: number; y: number; magnitude: number },
  timeElapsed: number,
  touchStartOnTab: boolean,
  hasMovedSignificantly: boolean
): GestureIntent => {
  const thresholds = getScreenAdaptiveThresholds();
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);
  
  // Conservative approach: start with unknown intent
  if (!hasMovedSignificantly && timeElapsed < 200) {
    return 'tap';
  }
  
  // Hold detection - enhanced with movement tolerance
  if (absDeltaX < thresholds.holdMovementTolerance && 
      absDeltaY < thresholds.holdMovementTolerance && 
      timeElapsed > thresholds.holdDetectionTime) {
    return 'hold';
  }
  
  // High velocity flick detection for dismiss actions - ONLY upward swipes
  if (velocity.magnitude > thresholds.flickVelocityThreshold && 
      absDeltaY > thresholds.verticalGestureThreshold && 
      absDeltaY > absDeltaX * 1.2 &&
      deltaY < 0) { // Only upward swipes (negative Y)
    return 'flick-dismiss';
  }
  
  // Clear horizontal movement - carousel navigation
  if (absDeltaX > thresholds.horizontalSwipeThreshold && 
      absDeltaX > absDeltaY * 1.4 && 
      velocity.magnitude > 0.3) {
    return 'horizontal-swipe';
  }
  
  // Vertical gestures on card tabs - prioritize when touch starts on tab
  if (touchStartOnTab && 
      absDeltaY > thresholds.verticalGestureThreshold && 
      absDeltaY > absDeltaX * 1.1) {
    return 'vertical-card';
  }
  
  // General vertical movement - expand/collapse/dismiss
  if (absDeltaY > thresholds.verticalGestureThreshold && 
      absDeltaY > absDeltaX * 1.5) {
    return 'vertical-card';
  }
  
  // Gentle movement likely intended for scrolling
  if (velocity.magnitude < 0.4 && 
      absDeltaX < thresholds.horizontalSwipeThreshold * 0.7 && 
      absDeltaY > 20 && 
      !touchStartOnTab) {
    return 'scroll';
  }
  
  // Diagonal or ambiguous movement
  if (absDeltaX > 15 && absDeltaY > 15 && 
      Math.abs(absDeltaX - absDeltaY) < Math.max(absDeltaX, absDeltaY) * 0.5) {
    return velocity.magnitude > 0.6 ? 'unknown' : 'scroll';
  }
  
  return 'unknown';
};

// ===============================
// HAPTIC FEEDBACK SYSTEM
// ===============================

/**
 * Enhanced haptic feedback system with multiple vibration patterns
 * Provides tactile confirmation for different types of interactions
 * 
 * Gracefully handles browsers without vibration support
 */
export const hapticFeedback = {
  /**
   * Subtle confirmation vibration for successful actions
   * Used for: tap confirmations, gesture completions
   */
  confirm: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },
  
  /**
   * Gentle interaction start feedback
   * Used for: hold gesture start, drag initiation
   */
  interactionStart: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },
  
  /**
   * Light progress feedback during continuous gestures
   * Used for: drag progress, gesture thresholds
   */
  progress: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  },
  
  /**
   * Success pattern for completed actions
   * Used for: successful flick dismiss, carousel navigation
   */
  success: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  },
  
  /**
   * Warning pattern for boundary conditions
   * Used for: attempting impossible actions, hitting limits
   */
  warning: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  }
};

// ===============================
// VISUAL FEEDBACK HELPERS
// ===============================

/**
 * Calculates gesture direction based on movement deltas
 * 
 * @param deltaX Horizontal displacement
 * @param deltaY Vertical displacement
 * @returns Gesture direction or 'none' if unclear
 */
export const calculateGestureDirection = (
  deltaX: number, 
  deltaY: number
): GestureDirection => {
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);
  
  if (absDeltaY > absDeltaX * 1.2) {
    return deltaY < 0 ? 'up' : 'down';
  } else if (absDeltaX > absDeltaY * 1.2) {
    return deltaX < 0 ? 'left' : 'right';
  }
  
  return 'none';
};

/**
 * Calculates gesture progress as a normalized value (0-1)
 * Based on the maximum displacement in any direction
 * 
 * @param deltaX Horizontal displacement
 * @param deltaY Vertical displacement
 * @param maxDistance Maximum distance for full progress (default: 100px)
 * @returns Progress value between 0 and 1
 */
export const calculateGestureProgress = (
  deltaX: number, 
  deltaY: number, 
  maxDistance: number = 100
): number => {
  const maxDisplacement = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  return Math.min(1, maxDisplacement / maxDistance);
};

/**
 * Generates dynamic CSS properties for visual feedback
 * 
 * @param visualState Current visual feedback state
 * @returns CSS properties object for styling
 */
export const generateVisualFeedbackStyles = (visualState: VisualFeedbackState) => {
  return {
    transform: `translateY(${visualState.dragOffsetY}px) translateX(${visualState.dragOffsetX}px) scale(${visualState.transformScale})`,
    filter: `brightness(${visualState.brightness}) saturate(${1 + visualState.feedbackIntensity * 0.2})`,
    borderColor: visualState.gestureDirection !== 'none' 
      ? `rgba(59, 130, 246, ${0.4 + visualState.feedbackIntensity * 0.3})`
      : undefined,
    boxShadow: `0 4px 12px rgba(0, 0, 0, ${0.15 + visualState.feedbackIntensity * 0.1})`,
  };
};

// ===============================
// SCROLL MANAGEMENT
// ===============================

/**
 * Creates a scroll manager for intelligent scroll locking
 * Provides methods to lock/unlock body scroll with reason tracking
 * 
 * @returns Scroll manager object with lock/unlock methods
 */
export const createScrollManager = () => {
  const state: ScrollManagerState = {
    isLocked: false,
    lockReason: '',
    permissiveUntil: 0
  };

  return {
    /**
     * Locks body scroll with optional reason
     * Prevents page scrolling during gesture interactions
     */
    lock: (reason: string = 'gesture'): void => {
      if (!state.isLocked) {
        document.documentElement.style.overscrollBehaviorY = 'contain';
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        state.isLocked = true;
        state.lockReason = reason;
        console.log(`[ScrollLock] Locked due to: ${reason}`);
      }
    },

    /**
     * Unlocks body scroll and restores normal behavior
     */
    unlock: (): void => {
      if (state.isLocked) {
        document.documentElement.style.overscrollBehaviorY = '';
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        state.isLocked = false;
        state.lockReason = '';
        console.log('[ScrollLock] Unlocked');
      }
    },

    /**
     * Sets permissive period for natural scrolling
     * Allows brief period where scrolling is permitted
     */
    setPermissive: (duration: number = 150): void => {
      state.permissiveUntil = Date.now() + duration;
    },

    /**
     * Checks if currently in permissive period
     */
    isPermissive: (): boolean => {
      return Date.now() <= state.permissiveUntil;
    },

    /**
     * Gets current lock state
     */
    getState: (): ScrollManagerState => ({ ...state })
  };
};

// ===============================
// GESTURE EVENT HANDLERS
// ===============================

/**
 * Creates standardized touch event handlers for gesture recognition
 * Provides a consistent interface for implementing touch gestures
 * 
 * @param config Configuration object for gesture handling
 * @returns Object with touch event handlers
 */
export const createGestureHandlers = () => {
  const scrollManager = createScrollManager();

  return {
    handleTouchStart: () => {
      // Implementation would go here
      // This is a template for creating reusable gesture handlers
    },
    
    handleTouchMove: () => {
      // Implementation would go here
    },
    
    handleTouchEnd: () => {
      // Implementation would go here
    },
    
    handleTouchCancel: () => {
      // Implementation would go here
    },
    
    cleanup: () => {
      scrollManager.unlock();
      // Clear any timers, etc.
    }
  };
};

// ===============================
// CONSTANTS & CONFIGURATION
// ===============================

/**
 * Default configuration values for the touch gesture system
 */
export const GESTURE_CONFIG = {
  // Timing thresholds (ms)
  TAP_MAX_DURATION: 300,
  HOLD_DETECTION_TIME: 250,
  PERMISSIVE_SCROLL_WINDOW: 150,
  
  // Movement thresholds (px)
  SIGNIFICANT_MOVEMENT: 8,
  MIN_SWIPE_DISTANCE: 40,
  
  // Velocity thresholds (px/ms)
  MIN_FLICK_VELOCITY: 0.8,
  MIN_SWIPE_VELOCITY: 0.3,
  MAX_SCROLL_VELOCITY: 0.4,
  
  // Visual feedback
  MAX_DRAG_OFFSET_FACTOR: 0.3,
  MAX_HORIZONTAL_OFFSET_FACTOR: 0.1,
  FEEDBACK_INTENSITY_MULTIPLIER: 2,
  
  // Haptic feedback settings
  HAPTIC_ENABLED: true,
  HAPTIC_DURATIONS: {
    CONFIRM: 50,
    INTERACTION_START: 30,
    PROGRESS: 15,
    SUCCESS: [50, 30, 50],
    WARNING: [30, 50, 30]
  }
} as const;

/**
 * Debug logging utility for gesture system
 * Can be enabled/disabled for production vs development
 */
export const gestureLogger = {
  enabled: import.meta.env?.DEV || window.location.hostname === 'localhost',
  
  log: (message: string, data?: any) => {
    if (gestureLogger.enabled) {
      console.log(`[Gesture] ${message}`, data);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (gestureLogger.enabled) {
      console.warn(`[Gesture] ${message}`, data);
    }
  },
  
  error: (message: string, data?: any) => {
    console.error(`[Gesture] ${message}`, data);
  }
}; 