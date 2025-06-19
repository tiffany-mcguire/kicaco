import React from 'react';
import { DropdownMenu, IconButton } from '../common';
import { Link } from 'react-router-dom';

interface HamburgerMenuProps {
  currentPath: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ currentPath }) => {
  const menuItemClass =
    "px-4 py-2 rounded transition-colors duration-150 cursor-pointer hover:bg-[#c0e2e7] hover:text-[#217e8f] focus-visible:bg-[#c0e2e7] focus-visible:text-[#217e8f] outline-none text-[#c0e2e7]";

  return (
    <DropdownMenu
      align="left"
      showCaret={true}
      caretPosition="hamburger"
      trigger={
        <IconButton
          variant="frameless"
          IconComponent={() => (
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <rect x="4" y="6" width="16" height="2" rx="1" />
              <rect x="4" y="11" width="16" height="2" rx="1" />
              <rect x="4" y="16" width="16" height="2" rx="1" />
            </svg>
          )}
          aria-label="Toggle menu"
          style={{ color: '#ffffff' }}
        />
      }
    >
      <div className="py-1 flex flex-col pl-4" role="menu" aria-orientation="vertical">
        {currentPath !== '/' && (
          <Link
            to="/"
            className={menuItemClass}
            role="menuitem"
          >
            Home
          </Link>
        )}
        {currentPath !== '/upcoming-events' && (
          <Link
            to="/upcoming-events"
            className={menuItemClass}
            role="menuitem"
          >
            Upcoming Events
          </Link>
        )}
        {currentPath !== '/keepers' && (
          <Link
            to="/keepers"
            className={menuItemClass}
            role="menuitem"
          >
            Keepers
          </Link>
        )}
        {currentPath !== '/chat-defaults' && (
          <Link
            to="/chat-defaults"
            className={menuItemClass}
            role="menuitem"
          >
            Chat Defaults
          </Link>
        )}
        {currentPath !== '/profiles-roles' && (
          <Link
            to="/profiles-roles"
            className={menuItemClass}
            role="menuitem"
          >
            Profiles & Roles
          </Link>
        )}
      </div>
    </DropdownMenu>
  );
};

export default HamburgerMenu; 