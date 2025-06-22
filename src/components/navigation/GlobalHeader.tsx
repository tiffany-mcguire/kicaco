import { forwardRef, ReactNode, useState, useEffect } from 'react';
import HamburgerMenu from './HamburgerMenu';
import ThreeDotMenu from './ThreeDotMenu';
import { CalendarMenu } from '../calendar';
import { IconButton, SearchBar, SearchResults } from '../common';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import { parse } from 'date-fns';

interface GlobalHeaderProps {
  children?: ReactNode;
  className?: string;
}

const GlobalHeader = forwardRef<HTMLDivElement, GlobalHeaderProps>(
  ({ children, className = '' }, ref) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { searchTrigger } = useOutletContext<{ searchTrigger: number }>();
    const [, forceUpdate] = useState(0);
    
    const {
      searchQuery,
      setSearchQuery,
      isSearching,
      setIsSearching,
      toggleSearch,
      searchResults
    } = useSearch();
    
    // Custom toggle that ensures proper state update
    const handleToggleSearch = () => {
      toggleSearch();
      // Force a re-render to ensure color updates
      setTimeout(() => forceUpdate(prev => prev + 1), 0);
    };
    
    // Listen for search trigger from keyboard shortcut
    useEffect(() => {
      if (searchTrigger > 0) {
        setIsSearching(true);
      }
    }, [searchTrigger, setIsSearching]);
    
    // Blur any focused element when search closes
    useEffect(() => {
      if (!isSearching) {
        // Blur the currently focused element to remove any active button states
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
        // Force update to ensure color changes
        forceUpdate(prev => prev + 1);
      }
    }, [isSearching]);
    
    const handleResultClick = (result: any) => {
      if (result.type === 'event') {
        // Navigate to the daily view for the specific event
        if (result.date && result.source) {
          const date = parse(result.date, 'yyyy-MM-dd', new Date());
          
          navigate('/daily-view', { 
            state: { 
              date,
              targetEvent: result.source
            } 
          });
        }
      } else if (result.type === 'keeper') {
        // Navigate to the daily view for the specific keeper
        if (result.date && result.source) {
          const date = parse(result.date, 'yyyy-MM-dd', new Date());
          
          navigate('/daily-view', { 
            state: { 
              date,
              targetKeeper: result.source
            } 
          });
        }
      } else if (result.type === 'message') {
        // For messages, navigate to home with message ID
        navigate('/', { 
          state: { 
            targetMessageId: result.id 
          }
        });
      }
      
      // Close search after navigating
      setIsSearching(false);
      setSearchQuery(''); // Clear the search query
    };
    
    return (
      <header
        ref={ref}
        className={`sticky top-0 z-[110] flex items-center justify-between bg-[#217e8f] h-16 px-4 shadow-[0_2px_4px_rgba(0,0,0,0.12),0_4px_6px_rgba(0,0,0,0.08)] ${className} relative`}
        onClick={(e) => {
          // Close search if clicking anywhere in the header except the search area itself
          const target = e.target as HTMLElement;
          const isSearchBar = target.closest('.search-container');
          const isSearchButton = target.closest('[aria-label="Search"]');
          
          if (isSearching && !isSearchBar && !isSearchButton) {
            setIsSearching(false);
            setSearchQuery('');
          }
        }}
      >
        <div className="flex gap-2">
          <HamburgerMenu currentPath={location.pathname} />
          <CalendarMenu currentPath={location.pathname} />
        </div>
        <div className="flex-1 flex items-center justify-center min-w-0">
          {!isSearching && children}
          <SearchBar
            isVisible={isSearching}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onClose={toggleSearch}
          />
        </div>
        <div className="flex gap-2">
          <IconButton 
            key={`search-btn-${isSearching}`}
            variant="frameless" 
            IconComponent={() => {
              const iconColor = isSearching ? '#c0e2e7' : '#ffffff';
              return (
                <svg 
                  width="24" 
                  height="24" 
                  fill={iconColor}
                  viewBox="0 0 24 24"
                  style={{
                    color: iconColor,
                    fill: iconColor
                  }}
                >
                  <path d="M0 0h24v24H0z" fill="none"/>
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill={iconColor}/>
                </svg>
              );
            }} 
            aria-label="Search" 
            style={{ 
              color: '#ffffff' // Keep base color white for header buttons
            }}
            onClick={handleToggleSearch}
          />
          <ThreeDotMenu currentPath={location.pathname} />
        </div>
        
        <SearchResults
          results={searchResults}
          isVisible={isSearching && searchQuery.trim().length > 0}
          onResultClick={handleResultClick}
          onClose={toggleSearch}
        />
      </header>
    );
  }
);

export default GlobalHeader; 