import React, { useRef, useLayoutEffect, useState, useEffect, PropsWithChildren, forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import Portal from './Portal';

const MIN_HEIGHT = 32; // px, now matches the handle bar's height
const CHAT_FOOTER_PADDING = 4; // px, minimal padding above footer

interface GlobalChatDrawerProps extends PropsWithChildren {
  className?: string;
  onHeightChange?: (height: number) => void;
  drawerHeight: number; // Required prop
  maxDrawerHeight?: number;
  scrollContainerRefCallback?: (node: HTMLDivElement | null) => void;
}

export interface GlobalChatDrawerHandle {
  setToTop: () => void;
}

const GlobalChatDrawer = forwardRef<GlobalChatDrawerHandle, GlobalChatDrawerProps>(
  ({ children, className, onHeightChange, drawerHeight, maxDrawerHeight, scrollContainerRefCallback }, ref) => {
    const [footerHeight, setFooterHeight] = useState(0);
    const [maxHeight, setMaxHeight] = useState(400); // fallback default
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isFullyClosed, setIsFullyClosed] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const dragState = useRef({
      startY: 0,
      startHeight: 0
    });

    // Dynamically measure footer height
    useLayoutEffect(() => {
      const updateFooterHeight = () => {
        const footer = document.querySelector('.global-footer');
        if (footer) {
          setFooterHeight(footer.getBoundingClientRect().height);
        } else {
          setFooterHeight(0);
        }
      };
      updateFooterHeight();
      window.addEventListener('resize', updateFooterHeight);
      let ro: ResizeObserver | null = null;
      const footer = document.querySelector('.global-footer');
      if (footer && window.ResizeObserver) {
        ro = new ResizeObserver(updateFooterHeight);
        ro.observe(footer);
      }
      return () => {
        window.removeEventListener('resize', updateFooterHeight);
        if (ro) ro.disconnect();
      };
    }, []);

    // Calculate max available height for the drawer
    useLayoutEffect(() => {
      let retryCount = 0;
      let timeoutId: number | undefined;
      function measureAndSetBoundary() {
        let topBoundary = 0;
        // Find the blurb <p> by its text content
        const blurb = Array.from(document.querySelectorAll('p')).find(
          p => p.textContent && p.textContent.includes('Kicaco gives you a clear and up-to-date view')
        );
        let blurbRect = null;
        if (blurb) {
          blurbRect = blurb.getBoundingClientRect();
          topBoundary = blurbRect.top;
        }
        // Fallback if blurb not found or topBoundary is too close to footer
        const subheader = document.querySelector('.profiles-roles-subheader');
        if (
          !blurb ||
          !blurbRect ||
          (footerHeight > 0 && Math.abs(window.innerHeight - footerHeight - topBoundary) < 50)
        ) {
          if (subheader) {
            const firstSection = subheader.querySelector('section');
            if (firstSection) {
              const sectionRect = firstSection.getBoundingClientRect();
              topBoundary = sectionRect.bottom;
            } else {
              const subheaderRect = subheader.getBoundingClientRect();
              topBoundary = subheaderRect.bottom;
            }
          }
        }
        const windowHeight = window.innerHeight;
        const available = windowHeight - footerHeight - topBoundary - CHAT_FOOTER_PADDING;
        const minHeight = MIN_HEIGHT;
        const finalHeight = Math.max(available, minHeight);
        setMaxHeight(finalHeight);
        // If the boundary is still bad, retry up to 5 times
        if (
          retryCount < 5 &&
          (topBoundary === 0 || (footerHeight > 0 && Math.abs(window.innerHeight - footerHeight - topBoundary) < 50))
        ) {
          retryCount++;
          timeoutId = window.setTimeout(measureAndSetBoundary, 100);
        }
      }
      measureAndSetBoundary();
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [footerHeight, drawerHeight]);

    // Drag handlers
    const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      dragState.current = {
        startY: clientY,
        startHeight: drawerHeight
      };
      document.body.style.userSelect = 'none';
    };
    const onDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const delta = clientY - dragState.current.startY;
      let newHeight = dragState.current.startHeight - delta;
      const maxH = maxDrawerHeight ?? maxHeight;
      newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, maxH));
      if (onHeightChange) onHeightChange(newHeight);
    };
    const onDragEnd = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
    };
    useEffect(() => {
      if (!isDragging) return;
      const move = (e: MouseEvent | TouchEvent) => onDragMove(e);
      const up = () => onDragEnd();
      window.addEventListener('mousemove', move);
      window.addEventListener('touchmove', move);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchend', up);
      return () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('touchmove', move);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('touchend', up);
      };
    }, [isDragging]);

    // Update isFullyClosed based on drawerHeight and MIN_HEIGHT
    useEffect(() => {
      setIsFullyClosed(drawerHeight <= MIN_HEIGHT);
    }, [drawerHeight]);

    // Base style for the handle
    const handleBaseStyle: React.CSSProperties = {
      height: 32,
      borderRadius: '16px 16px 0 0',
      touchAction: 'none',
      transition: 'box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
      borderWidth: '1.5px',
      borderStyle: 'solid',
      borderColor: '#c0e2e7',
    };

    // Dynamic style for the handle when dragging
    const handleInteractionStyle: React.CSSProperties = isDragging
      ? { boxShadow: 'inset 0 0 6px 3px rgba(192, 226, 231, 0.85)' }
      : { boxShadow: 'none' };

    return (
      <Portal>
        <div
          ref={containerRef}
          className={`chat-drawer-container w-full flex flex-col items-center${className ? ` ${className}` : ''}`}
          style={{
            height: drawerHeight,
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
            transition: isDragging ? 'none' : 'height 0.2s',
          }}
        >
          {/* Handle Bar */}
          <div
            className="chat-drawer-handle w-full flex flex-col items-center cursor-ns-resize select-none bg-white hover:shadow-[inset_0_0_5px_2px_rgba(192,226,231,0.75)]"
            style={{ ...handleBaseStyle, ...handleInteractionStyle }}
            role="button"
            aria-label={isFullyClosed ? 'Open chat drawer' : 'Close chat drawer'}
            tabIndex={0}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
          >
            <div 
              className="chat-drawer-handle-bar mt-1 mb-1 w-8 h-1.5 rounded-full relative overflow-hidden"
            >
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #f8b6c2 0%, #ffd8b5 14%, #fde68a 28%, #bbf7d0 42%, #c0e2e7 57%, #d1d5fa 71%, #e9d5ff 85%, #f8b6c2 100%)',
                  filter: 'blur(2px)',
                  opacity: 0.7
                }}
              />
              <div 
                className="absolute inset-0 rounded-full bg-gray-300"
                style={{ opacity: 0.3 }}
              />
            </div>
            <div className="chat-drawer-handle-text text-sm text-gray-400 font-medium text-center" style={{ lineHeight: 1, minHeight: 18 }}>
              {drawerHeight <= MIN_HEIGHT ? 'Slide up to chat with Kicaco' : 'Slide down to see more'}
            </div>
          </div>
          {/* Chat content */}
          <div
            ref={scrollContainerRefCallback}
            className="chat-drawer-content flex-1 w-full px-4 pt-2 overflow-y-auto"
            style={{ 
              maxHeight: Math.max(0, drawerHeight - 32),
              transition: isDragging ? 'none' : 'max-height 0.2s'
            }}
          >
            {children}
          </div>
        </div>
      </Portal>
    );
  }
);

export default GlobalChatDrawer; 