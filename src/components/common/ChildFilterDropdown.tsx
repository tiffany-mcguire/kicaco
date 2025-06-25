import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filter as FilterIcon } from 'lucide-react';

// Reusable Child Filter Dropdown Component
interface ChildFilterDropdownProps {
  children: { name: string }[];
  selectedChildren: string[];
  onToggleChild: (name: string) => void;
  onClear: () => void;
  isActive: boolean;
}

export const ChildFilterDropdown: React.FC<ChildFilterDropdownProps> = ({
  children,
  selectedChildren,
  onToggleChild,
  onClear,
  isActive,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + window.scrollY + 8, // 8px margin
        left: buttonRect.left + window.scrollX
      });
    }
  }, [isOpen]);

  const baseClasses = "p-1 rounded-full transition-all duration-150 active:scale-95";
  const inactiveClasses = "bg-[#c0e2e7]/20 text-[#217e8f] hover:bg-[#c0e2e7]/40";
  const activeClasses = "bg-[#217e8f] text-white hover:bg-[#1a6e7e]";

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)} 
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        aria-label="Filter by child"
        title="Filter"
      >
        <FilterIcon className="w-4 h-4" />
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-48 bg-white rounded-md shadow-lg border border-gray-100"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999
          }}
        >
          <ul className="py-1">
            {children.map(child => (
              <li key={child.name}>
                <label className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChildren.includes(child.name)}
                    onChange={() => onToggleChild(child.name)}
                    className="h-4 w-4 rounded border-gray-300 text-[#217e8f] focus:ring-[#217e8f]/50"
                  />
                  <span className="ml-3">{child.name}</span>
                </label>
              </li>
            ))}
            {selectedChildren.length > 0 && (
              <>
                <li className="border-t border-gray-100 my-1" />
                <li>
                  <button 
                    onClick={() => {
                      onClear();
                      setIsOpen(false);
                    }} 
                    className="w-full text-left block px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Clear Filter
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}; 