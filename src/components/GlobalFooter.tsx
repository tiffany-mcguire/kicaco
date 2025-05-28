import React, { forwardRef, ReactNode } from 'react';
import IconButton from './IconButton';
import { ClipboardIcon2, UploadIcon, CameraIconMD, MicIcon } from './icons';

interface GlobalFooterProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend?: () => void;
  placeholder?: string;
  leftButtons?: ReactNode;
  rightButtons?: ReactNode;
  className?: string;
}

const GlobalFooter = forwardRef<HTMLDivElement, GlobalFooterProps>(
  ({ value, onChange, onSend, placeholder = 'Type a message…', leftButtons, rightButtons, className = '' }, ref) => (
    <footer
      ref={ref}
      className={`global-footer fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-2px_8px_rgba(0,0,0,0.15)] z-50 h-16 flex items-center justify-between px-4 ${className}`}
    >
      <div className="flex gap-2">
        {leftButtons ?? <>
          <IconButton IconComponent={props => <ClipboardIcon2 {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} aria-label="Paste" />
          <IconButton IconComponent={props => <UploadIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} aria-label="Upload" />
        </>}
      </div>
      <div className="flex-1 mx-4">
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && onSend) {
              e.preventDefault();
              onSend();
            }
          }}
          className="footer-chat w-full rounded-full border border-[#c0e2e7] px-4 py-2 focus:outline-none text-sm bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus:shadow-[0_0_8px_2px_#c0e2e7,0_2px_8px_rgba(0,0,0,0.08)]"
          placeholder={placeholder}
        />
      </div>
      <div className="flex gap-2">
        {rightButtons ?? <>
          <IconButton IconComponent={props => <CameraIconMD {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} aria-label="Camera" />
          <IconButton IconComponent={props => <MicIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} aria-label="Mic" />
        </>}
      </div>
    </footer>
  )
);

export default GlobalFooter; 