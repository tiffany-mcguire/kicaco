
import { DropdownMenu, IconButton } from '../common';
import { Link } from 'react-router-dom';

interface CalendarMenuProps {
  currentPath: string;
}

export default function CalendarMenu({ currentPath }: CalendarMenuProps) {
  const menuItemClass =
    "px-4 py-2 rounded transition-colors duration-150 cursor-pointer hover:bg-[#217e8f] hover:text-white focus-visible:bg-[#217e8f] focus-visible:text-white outline-none text-white";

  return (
    <DropdownMenu
      align="left"
      showCaret={true}
      caretPosition="calendar"
      trigger={
        <IconButton
          variant="frameless"
          IconComponent={() => (
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M12 22H5a2 2 0 0 1-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2v6h-2v-2H5v10h7v2zm10.13-5.01.71-.71a.996.996 0 0 0 0-1.41l-.71-.71a.996.996 0 0 0-1.41 0l-.71.71 2.12 2.12zm-.71.71-5.3 5.3H14v-2.12l5.3-5.3 2.12 2.12z"/>
            </svg>
          )}
          aria-label="Toggle calendar menu"
          style={{ color: '#ffffff' }}
        />
      }
    >
      <div className="py-1 flex flex-col pl-4" role="menu" aria-orientation="vertical">
        {currentPath !== '/monthly-calendar' && (
          <Link
            to="/monthly-calendar"
            className={menuItemClass}
            role="menuitem"
          >
            Monthly Calendar
          </Link>
        )}
        {currentPath !== '/weekly-calendar' && (
          <Link
            to="/weekly-calendar"
            className={menuItemClass}
            role="menuitem"
          >
            Weekly Calendar
          </Link>
        )}
        {currentPath !== '/daily-view' && (
          <Link
            to="/daily-view"
            className={menuItemClass}
            role="menuitem"
          >
            Daily View
          </Link>
        )}
        <Link
          to="/add-event"
          className={menuItemClass}
          role="menuitem"
        >
          Add Event
        </Link>
        <Link
          to="/add-keeper"
          className={menuItemClass}
          role="menuitem"
        >
          Add Keeper
        </Link>
        <Link
          to="/kicaco-flow"
          className={menuItemClass}
          role="menuitem"
        >
          Kicaco Flow
        </Link>
      </div>
    </DropdownMenu>
  );
} 