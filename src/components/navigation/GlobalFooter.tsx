import React, { forwardRef, ReactNode, useState, useEffect, useRef } from 'react';
import { IconButton, ClipboardIcon2, UploadIcon, SendIcon, MicIcon } from '../common';

interface GlobalFooterProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend?: () => void;
  onUploadClick?: () => void;
  onPasteClick?: () => void;
  placeholder?: string;
  leftButtons?: ReactNode;
  rightButtons?: ReactNode;
  className?: string;
  disabled?: boolean;
  clearActiveButton?: boolean; // New prop to clear active state
}

const GlobalFooter = forwardRef<HTMLDivElement, GlobalFooterProps>(
  ({ value, onChange, onSend, onUploadClick, onPasteClick, placeholder = 'Type a message…', leftButtons, rightButtons, className = '', disabled = false, clearActiveButton = false }, ref) => {
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = (buttonName: string) => {
      setActiveButton(prev => (prev === buttonName ? null : buttonName));
    };

    // Function to blur input and minimize keyboard
    const blurInput = () => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    };

    // Enhanced send handler with keyboard management
    const handleSend = () => {
      if (onSend && !disabled && value.trim()) {
        onSend();
        // Clear the send button active state immediately after sending
        setActiveButton(null);
        // Blur input to minimize keyboard after sending
        setTimeout(() => blurInput(), 100);
      }
    };

    // Clear active button when clearActiveButton prop changes to true
    useEffect(() => {
      if (clearActiveButton) {
        setActiveButton(null);
      }
    }, [clearActiveButton]);

    // Also clear active button when clicking elsewhere (existing behavior for other similar components)
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const footer = document.querySelector('.global-footer');
        if (footer && !footer.contains(event.target as Node)) {
          setActiveButton(null);
          // Also blur input when clicking outside footer to minimize keyboard
          blurInput();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    return (
      <footer
        ref={ref}
        className={`global-footer fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.08)] z-50 h-16 ${className}`}
      >
        {/* Subtle gradient accent line */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, rgba(248,182,194,0.5) 0%, rgba(255,216,181,0.5) 16%, rgba(253,230,138,0.5) 33%, rgba(187,247,208,0.5) 50%, rgba(192,226,231,0.5) 66%, rgba(209,213,250,0.5) 83%, rgba(233,213,255,0.5) 100%)'
          }}
        />
        
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex gap-1">
            {leftButtons ?? <>
              <IconButton 
                variant="frameless" 
                IconComponent={props => <ClipboardIcon2 {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} 
                aria-label="Paste" 
                isActive={activeButton === 'paste'}
                disabled={disabled}
                onClick={() => {
                  console.log('🔥 Paste button clicked in GlobalFooter!', { disabled, onPasteClick: !!onPasteClick });
                  handleButtonClick('paste');
                  onPasteClick?.();
                }}
              />
              <IconButton 
                variant="frameless" 
                IconComponent={props => <UploadIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} 
                aria-label="Upload" 
                isActive={activeButton === 'upload'}
                onClick={() => {
                  handleButtonClick('upload');
                  onUploadClick?.();
                }}
              />
            </>}
          </div>
          <div className="flex-1 mx-3">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={onChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && onSend && !disabled) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="footer-chat w-full rounded-xl border border-gray-200 px-4 py-2 focus:outline-none bg-gray-50 text-gray-700 transition-all duration-200 focus:border-[#c0e2e7] focus:bg-white focus:shadow-[0_0_0_3px_rgba(192,226,231,0.1)]"
              placeholder={placeholder}
              disabled={disabled}
            />
          </div>
          <div className="flex gap-1">
            {rightButtons ?? <>
              <IconButton 
                variant="frameless" 
                IconComponent={props => <SendIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} 
                aria-label="Send" 
                disabled={disabled || !value.trim()}
                isActive={activeButton === 'send'}
                onClick={() => {
                  handleButtonClick('send');
                  handleSend();
                }}
              />
              <IconButton 
                variant="frameless" 
                IconComponent={props => <MicIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} 
                aria-label="Mic" 
                disabled={disabled} 
                isActive={activeButton === 'mic'}
                onClick={() => handleButtonClick('mic')}
              />
            </>}
          </div>
        </div>
      </footer>
    );
  }
);

export default GlobalFooter; 