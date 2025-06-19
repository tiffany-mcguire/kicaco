import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ArrowLeft } from 'lucide-react';

interface SearchBarProps {
  isVisible: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  isVisible,
  searchQuery,
  setSearchQuery,
  onClose,
  placeholder = 'Search events, keepers, and chats...'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the search bar becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  // Handle escape key to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  // Determine the keyboard shortcut hint based on platform
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutHint = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center bg-[#217e8f] z-20 px-4"
        >
          <div className="relative w-full max-w-md flex items-center">
            <div className="absolute left-3 text-[#217e8f]">
              <Search size={18} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full h-10 pl-10 pr-10 rounded-full bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-10 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                aria-label="Clear search text"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="absolute right-3 text-[#217e8f] hover:text-[#186a79] flex items-center justify-center"
              aria-label="Close search"
            >
              <ArrowLeft size={18} />
            </button>
          </div>
        </motion.div>
      )}
      {!isVisible && (
        <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center justify-center text-white/70 text-sm pointer-events-none">
          <span className="mr-1">Press</span>
          <span className="bg-white/20 rounded px-1.5 py-0.5 font-mono">{shortcutHint}</span>
          <span className="ml-1">to search</span>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SearchBar; 