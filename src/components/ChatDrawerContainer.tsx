import React, { useRef, useLayoutEffect, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useSpring, AnimatePresence } from 'framer-motion';
import type { PropsWithChildren } from 'react';

const MINIMIZED_HEIGHT = 32; // px, handle only

interface ChatDrawerContainerProps extends PropsWithChildren {
  initialClosed?: boolean;
  className?: string;
}

export default function ChatDrawerContainer({ children, initialClosed = false, className }: ChatDrawerContainerProps) {
  const [maxHeight, setMaxHeight] = useState(400); // fallback default
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullyClosed, setIsFullyClosed] = useState(false);

  // Dynamically calculate available height between handle and footer using ResizeObserver
  useLayoutEffect(() => {
    let animationFrame: number;
    function updateHeight() {
      const footer = document.querySelector('footer');
      const container = containerRef.current;
      if (footer && container) {
        const footerRect = (footer as HTMLElement).getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        // Use Math.floor to avoid subpixel rounding issues
        const available = Math.floor(footerRect.top - containerRect.top);
        setMaxHeight(available);
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    // Use ResizeObserver for robust detection
    let ro: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(updateHeight);
      });
      const footer = document.querySelector('footer');
      if (footer) ro.observe(footer);
      if (containerRef.current) ro.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateHeight);
      if (ro) ro.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Clamp drag between fully open and minimized
  const dragConstraints = { top: 0, bottom: Math.max(0, maxHeight - MINIMIZED_HEIGHT) };

  // Set initial position based on initialClosed
  useLayoutEffect(() => {
    if (initialClosed && dragConstraints.bottom > 0) {
      y.set(dragConstraints.bottom);
    } else {
      y.set(0);
    }
    // eslint-disable-next-line
  }, [initialClosed, dragConstraints.bottom]);

  // Track if drawer is fully closed
  useMotionValueEvent(y, 'change', (latest) => {
    setIsFullyClosed(Math.abs(latest - dragConstraints.bottom) < 2);
  });

  // Dynamic handle text and aria-label
  const handleText = isFullyClosed ? 'Slide up to chat with Kicaco' : 'Slide down to see more';

  return (
    <motion.div
      ref={containerRef}
      className={`chat-drawer-container w-full flex flex-col items-center${className ? ` ${className}` : ''}`}
      style={{
        y,
        height: maxHeight,
        zIndex: 30,
        background: 'white',
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
        borderRadius: '0 0 16px 16px',
        overflow: 'hidden',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
      drag="y"
      dragConstraints={dragConstraints}
      dragElastic={0.12}
      initial={false}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
    >
      {/* Handle Bar with subtle top border and dynamic text */}
      <div
        className="chat-drawer-handle w-full flex flex-col items-center cursor-grab select-none bg-white border-t border-b border-gray-200"
        style={{ height: MINIMIZED_HEIGHT, borderRadius: '0 0 12px 12px' }}
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
  );
} 