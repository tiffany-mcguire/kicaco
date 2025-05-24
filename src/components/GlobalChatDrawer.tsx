import React, { useRef, useLayoutEffect, useState, useEffect, PropsWithChildren } from 'react';
import { motion, useMotionValue, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import Portal from './Portal';

const MINIMIZED_HEIGHT = 32; // px, handle only
const STORAGE_KEY = 'globalChatDrawerY';

interface GlobalChatDrawerProps extends PropsWithChildren {
  initialClosed?: boolean;
  className?: string;
  onHeightChange?: (height: number) => void;
}

export default function GlobalChatDrawer({ children, initialClosed = true, className, onHeightChange }: GlobalChatDrawerProps) {
  const [maxHeight, setMaxHeight] = useState(400); // fallback default
  const [footerHeight, setFooterHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullyClosed, setIsFullyClosed] = useState(true);
  const [isFullyOpen, setIsFullyOpen] = useState(false);

  // Robustly wait for footer and subheader to exist before measuring
  useLayoutEffect(() => {
    let animationFrame: number;
    let retryCount = 0;
    let retryTimeout: number;
    function updateHeights() {
      const footer = document.querySelector('.global-footer');
      const subheader = document.querySelector('.profiles-roles-subheader');
      const container = containerRef.current;
      if (footer && subheader && container) {
        const footerRect = (footer as HTMLElement).getBoundingClientRect();
        const subheaderRect = (subheader as HTMLElement).getBoundingClientRect();
        setFooterHeight(footerRect.height);
        // Add 8px gap below subheader
        const topConstraint = subheaderRect.bottom + 8;
        setHeaderHeight(topConstraint);
        // Available height is from subheader bottom + 8px to footer top
        const available = Math.floor(footerRect.top - topConstraint);
        setMaxHeight(available > 0 ? available : 400);
      } else if (retryCount < 20) { // retry for up to 1 second
        retryCount++;
        retryTimeout = window.setTimeout(updateHeights, 50);
      } else {
        setFooterHeight(0);
        setHeaderHeight(0);
        setMaxHeight(400); // fallback default
      }
    }
    updateHeights();
    window.addEventListener('resize', updateHeights);
    // Use ResizeObserver for robust detection
    let ro: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(updateHeights);
      });
      const footer = document.querySelector('.global-footer');
      const subheader = document.querySelector('.profiles-roles-subheader');
      if (footer) ro.observe(footer);
      if (subheader) ro.observe(subheader);
      if (containerRef.current) ro.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateHeights);
      if (ro) ro.disconnect();
      cancelAnimationFrame(animationFrame);
      clearTimeout(retryTimeout);
    };
  }, []);

  // Clamp drag between fully open (just under header) and minimized (just above footer)
  const dragConstraints = { top: 0, bottom: Math.max(0, maxHeight - MINIMIZED_HEIGHT) };

  // Set initial position to minimized (bottom) on mount, ignoring localStorage
  useLayoutEffect(() => {
    let initialY = dragConstraints.bottom;
    y.set(initialY);
    // eslint-disable-next-line
  }, [dragConstraints.bottom]);

  // Track if drawer is fully closed
  useMotionValueEvent(y, 'change', (latest) => {
    setIsFullyClosed(Math.abs(latest - dragConstraints.bottom) < 2);
    // Persist drawer position
    localStorage.setItem(STORAGE_KEY, String(latest));
  });

  // Report drawer height to parent
  useEffect(() => {
    if (!onHeightChange) return;
    const update = () => {
      // Drawer visible height = maxHeight - y
      onHeightChange(maxHeight - y.get());
    };
    update();
    const unsub = y.on('change', update);
    return () => unsub();
  }, [maxHeight, y, onHeightChange]);

  // Dynamic handle text and aria-label
  const handleText = isFullyClosed ? 'Slide up to chat with Kicaco' : 'Slide down to see more';

  // Lock body scroll when drawer is fully open
  useEffect(() => {
    if (isFullyClosed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullyClosed]);

  return (
    <Portal>
      <motion.div
        ref={containerRef}
        className={`chat-drawer-container w-full flex flex-col items-center${className ? ` ${className}` : ''}`}
        style={{
          y,
          height: maxHeight,
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: footerHeight,
          zIndex: 40,
          background: 'white',
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
          touchAction: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
        drag="y"
        dragConstraints={dragConstraints}
        dragElastic={0.06}
        dragTransition={{ 
          bounceStiffness: 500, 
          bounceDamping: 40,
          power: 0.8,
          timeConstant: 200
        }}
        initial={false}
        transition={{ 
          type: 'spring', 
          stiffness: 250, 
          damping: 30,
          mass: 1,
          velocity: 0.3,
          restDelta: 0.001,
          restSpeed: 0.001
        }}
      >
        {/* Handle Bar with subtle top border and dynamic text */}
        <div
          className="chat-drawer-handle w-full flex flex-col items-center cursor-grab select-none bg-white border-t border-b border-gray-200"
          style={{ height: MINIMIZED_HEIGHT, borderRadius: '16px 16px 0 0' }}
          role="button"
          aria-label={handleText}
          tabIndex={0}
        >
          <div className="chat-drawer-handle-bar mt-1 mb-1 w-8 h-1.5 rounded-full bg-gray-300 opacity-60" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={handleText}
              className="chat-drawer-handle-text text-sm text-gray-400 font-medium text-center"
              style={{ lineHeight: 1, minHeight: 18 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              aria-live="polite"
            >
              {handleText}
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Chat content */}
        <div className="chat-drawer-content flex-1 w-full px-4 pt-2 pb-4 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </Portal>
  );
} 