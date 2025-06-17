import React, { forwardRef, ReactNode } from 'react';
import HamburgerMenu from './HamburgerMenu';
import CalendarMenu from './CalendarMenu';
import IconButton from './IconButton';
import ThreeDotMenu from './ThreeDotMenu';
import { useLocation } from 'react-router-dom';

interface GlobalHeaderProps {
  children?: ReactNode;
  className?: string;
}

const GlobalHeader = forwardRef<HTMLDivElement, GlobalHeaderProps>(
  ({ children, className = '' }, ref) => {
    const location = useLocation();
    return (
      <header
        ref={ref}
        className={`sticky top-0 z-[110] flex items-center justify-between bg-[#217e8f] h-16 px-4 shadow-[0_2px_4px_rgba(0,0,0,0.12),0_4px_6px_rgba(0,0,0,0.08)] ${className}`}
      >
        <div className="flex gap-2">
          <HamburgerMenu currentPath={location.pathname} />
          <CalendarMenu currentPath={location.pathname} />
        </div>
        <div className="flex-1 flex items-center justify-center min-w-0">
          {children}
        </div>
        <div className="flex gap-2">
          <IconButton IconComponent={() => (
            <svg width="24" height="24" fill="#c0e2e7" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          )} aria-label="Search" />
          <ThreeDotMenu currentPath={location.pathname} />
        </div>
      </header>
    );
  }
);

export default GlobalHeader; 