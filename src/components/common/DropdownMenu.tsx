import React, { useState, useRef, useEffect, cloneElement } from 'react';

interface DropdownMenuProps {
  trigger: React.ReactElement;
  align: 'left' | 'right';
  width?: string;
  children: React.ReactNode | ((helpers: { close: () => void }) => React.ReactNode);
  showCaret?: boolean;
  caretPosition?: 'hamburger' | 'calendar' | 'threedot';
  onClose?: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, align, width = '212px', children, showCaret, caretPosition, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (isOpen) handleClose();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) handleClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setClosing(false);
      if (onClose) onClose();
    }, 200);
  };

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const clonedTrigger = cloneElement(trigger, {
    isActive: isOpen,
  });

  // Alignment and rounded corners
  const positionClass = align === 'left' ? 'fixed left-0 top-16 rounded-r-md' : 'fixed right-0 top-16 rounded-l-md';
  // Caret triangle position based on which menu it is
  const getCaretPosition = () => {
    if (align === 'left') {
      switch (caretPosition) {
        case 'hamburger':
          return 'left-[24px]';
        case 'calendar':
          return 'left-[64px]';
        default:
          return 'left-[16px]';
      }
    } else {
      switch (caretPosition) {
        case 'threedot':
          return 'right-[25px]';
        default:
          return 'right-[16px]';
      }
    }
  };
  const positionClassCaret = getCaretPosition();
  // Show caret if showCaret prop is true
  const shouldShowCaret = showCaret;

  return (
    <div className="relative" ref={menuRef}>
      <span onClick={handleTriggerClick}>
        {clonedTrigger}
      </span>
      {(isOpen || closing) && (
        <div
          style={{ width }}
          className={
            `${positionClass} shadow-[0_4px_8px_rgba(0,0,0,0.1)] bg-[#2f8fa4] border-2 border-[#217e8f] focus:outline-none z-[150] transition-opacity transition-transform duration-200 ` +
            (closing ? 'opacity-0 scale-95 ease-in' : 'opacity-100 scale-100 ease-out')
          }
        >

          {typeof children === 'function' ? children({ close: handleClose }) : children}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu; 