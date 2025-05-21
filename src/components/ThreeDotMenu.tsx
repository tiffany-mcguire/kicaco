import React from 'react';
import DropdownMenu from './DropdownMenu';
import IconButton from './IconButton';

interface ThreeDotMenuProps {
  currentPath: string;
}

export default function ThreeDotMenu({ currentPath }: ThreeDotMenuProps) {
  return (
    <DropdownMenu
      align="right"
      showCaret={true}
      caretPosition="threedot"
      trigger={
        <IconButton
          IconComponent={() => (
            <svg width="24" height="24" fill="#c0e2e7" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          )}
          aria-label="Toggle menu"
        />
      }
    >
      <div className="py-1 flex flex-col pr-4" role="menu" aria-orientation="vertical" style={{ color: '#c0e2e7' }}>
        <button
          className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
          role="menuitem"
        >
          Report a Bug
        </button>
        <button
          className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
          role="menuitem"
        >
          Give Feedback
        </button>
        <button
          className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
          role="menuitem"
        >
          Contact Support
        </button>
        <button
          className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
          role="menuitem"
        >
          Rate This App
        </button>
        <button
          className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
          role="menuitem"
        >
          Check for Updates
        </button>
        <button
          className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
          role="menuitem"
        >
          Log Out
        </button>
      </div>
    </DropdownMenu>
  );
} 