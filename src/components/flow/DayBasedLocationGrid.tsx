import React, { useState, useRef, useEffect } from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getUniqueDaysOfWeek, getLocationButtons } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';
import { searchLocations, LocationResult, formatLocationString } from '../../utils/mapsSearch';

interface Props {
  flowContext: FlowContext;
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
  editingLocationForDay: number | null;
  setEditingLocationForDay: (value: number | null) => void;
  showFullPickerFor: string | null;
  setShowFullPickerFor: (value: string | null) => void;
  handleSetLocationForDay: (dayIndex: number, location: string) => void;
}

export const DayBasedLocationGrid: React.FC<Props> = ({
  flowContext,
  setFlowContext,
  editingLocationForDay,
  setEditingLocationForDay,
  showFullPickerFor,
  setShowFullPickerFor,
  handleSetLocationForDay
}) => {
  const [showLocationSearchFor, setShowLocationSearchFor] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState<{dayIndex: number, locationId: string} | null>(null);
  const [stickyConfirmVisible, setStickyConfirmVisible] = useState<{[key: number]: boolean}>({});
  const scrollContainerRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

  const generateLocationOptions = () => {
    return getLocationButtons().map(loc => loc.label);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchLocations(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (dayIndex: number, location: LocationResult) => {
    const locationString = formatLocationString(location);
    setSelectedLocation(locationString);
    setSearchInput(locationString);
    // Keep search results visible so user can change selection
  };

  const handlePredefinedLocationSelect = (dayIndex: number, locationId: string) => {
    const location = getLocationButtons().find(loc => loc.id === locationId);
    if (location) {
      setSelectedPredefinedLocation({dayIndex, locationId});
      // Don't auto-fill input or trigger search mode
    }
  };

  const handleConfirmPredefinedLocation = () => {
    if (selectedPredefinedLocation) {
      const location = getLocationButtons().find(loc => loc.id === selectedPredefinedLocation.locationId);
      if (location) {
        handleSetLocationForDay(selectedPredefinedLocation.dayIndex, location.label);
        setSelectedPredefinedLocation(null);
        setStickyConfirmVisible(prev => ({ ...prev, [selectedPredefinedLocation.dayIndex]: false }));
      }
    }
  };

  // Check if the selected location button is partially obscured by scroll
  const checkStickyConfirmVisibility = (dayIndex: number) => {
    const container = scrollContainerRefs.current[dayIndex];
    if (!container || !selectedPredefinedLocation || selectedPredefinedLocation.dayIndex !== dayIndex) {
      return;
    }

    const selectedButton = container.querySelector('.day-based-location-grid__location-option[class*="border-2"]') as HTMLElement;
    if (!selectedButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = selectedButton.getBoundingClientRect();
    
    // Check if button is partially below the visible area
    const isPartiallyHidden = buttonRect.bottom > containerRect.bottom;
    // Check if button is completely out of view
    const isCompletelyHidden = buttonRect.top > containerRect.bottom;
    
    setStickyConfirmVisible(prev => ({
      ...prev,
      [dayIndex]: isPartiallyHidden && !isCompletelyHidden
    }));
  };

  // Effect to check sticky visibility when selection changes
  useEffect(() => {
    if (selectedPredefinedLocation) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        checkStickyConfirmVisibility(selectedPredefinedLocation.dayIndex);
      }, 10);
    }
  }, [selectedPredefinedLocation]);

  const handleCustomLocationSubmit = (dayIndex: number) => {
    if (searchInput.trim()) {
      // Convert to title case if it's manual input, otherwise use as-is
      const locationToUse = selectedLocation || searchInput.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      handleSetLocationForDay(dayIndex, locationToUse);
      setShowLocationSearchFor(null);
      setSearchInput('');
      setSearchResults([]);
      setSelectedLocation('');
      setShowFullPickerFor(null);
    }
  };

  const isAllLocationsSet = () => {
    const uniqueDays = getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []);
    return uniqueDays.every(day => {
      const dayIndex = parseInt(day.id.split('-')[1]);
      return !!flowContext.eventPreview.dayBasedLocations?.[dayIndex];
    });
  };

  const handleContinue = () => {
    if (isAllLocationsSet()) {
      setFlowContext({
        ...flowContext,
        step: 'eventNotes'
      });
    }
  };

  // Helper function to get dates for a specific day of the week
  const getDatesForDay = (dayIndex: number) => {
    return (flowContext.eventPreview.selectedDates || []).filter(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const jsDay = date.getDay();
      return (jsDay === 0 ? 6 : jsDay - 1) === dayIndex;
    }).sort();
  };

  // Helper function to check if a day has selected dates
  const dayHasSelectedDates = (dayIndex: number) => {
    return getDatesForDay(dayIndex).length > 0;
  };

  return (
    <div className="day-based-location-grid bg-white rounded-lg shadow-sm p-3 mb-8">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="day-based-location-grid__grid grid grid-cols-3 gap-3">
        {(() => {
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          
          // Create 3 columns: Mon-Wed in columns 0-2, Thu-Sat in columns 0-2, Sun in column 0
          const columns: Array<Array<number>> = Array.from({ length: 3 }, () => []);
          
          // Place Monday-Wednesday in columns 0-2
          for (let dayIndex = 0; dayIndex <= 2; dayIndex++) {
            columns[dayIndex].push(dayIndex);
          }
          
          // Place Thursday-Saturday in columns 0-2 (below Mon-Wed)
          for (let dayIndex = 3; dayIndex <= 5; dayIndex++) {
            columns[dayIndex - 3].push(dayIndex);
          }
          
          // Place Sunday in column 0 (below Mon and Thu)
          columns[0].push(6);
          
          return columns.map((column, colIndex) => (
            <div key={`col${colIndex}`} className="day-based-location-grid__column space-y-2">
              {column.map((dayIndex) => {
                const bgColor = roygbivColors[dayIndex];
                const location = flowContext.eventPreview.dayBasedLocations?.[dayIndex];
                const isEditing = editingLocationForDay === dayIndex;
                const hasSelectedDates = dayHasSelectedDates(dayIndex);
                const datesForThisDay = getDatesForDay(dayIndex);
                const locationOptions = generateLocationOptions();
                const hasMoreThanFourDates = datesForThisDay.length > 4;

                return (
                  <div 
                    key={dayIndex} 
                    className={`day-based-location-grid__day-card flex flex-col p-1.5 rounded-lg ${
                      hasSelectedDates ? 'border-2' : 'opacity-40'
                    }`}
                    style={{ 
                      backgroundColor: bgColor,
                      borderColor: hasSelectedDates ? `color-mix(in srgb, ${bgColor} 90%, black)` : 'transparent',
                      minHeight: '200px'
                    }}
                  >
                    {/* Day name header */}
                    <div className="day-based-location-grid__day-header font-semibold text-gray-800 text-xs mb-2 text-center max-[375px]:text-[11px]">
                      {dayNames[dayIndex]}
                    </div>
                    
                    {/* Location picker area */}
                    <div className="day-based-location-grid__location-picker w-full mb-2">
                      {!hasSelectedDates ? (
                        <div className="day-based-location-grid__no-dates text-xs text-gray-600 text-center py-2 bg-white/30 rounded-md max-[375px]:text-[11px]">
                          No dates selected
                        </div>
                      ) : isEditing ? (
                        <div className="day-based-location-grid__location-editor w-full">
                          {showLocationSearchFor === dayIndex ? (
                            <div className="day-based-location-grid__search-container" style={{ marginTop: '-6px' }}>
                              <div className="day-based-location-grid__search-header flex items-center justify-between mb-0.5">
                                <button 
                                  onClick={() => {
                                    setSearchInput('');
                                    setSelectedLocation('');
                                    setSearchResults([]);
                                  }}
                                  className="text-[11px] text-[#217e8f] hover:underline max-[375px]:text-[10px] relative"
                                  style={{ left: '2px', top: '0px' }}
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={() => {
                                    setShowLocationSearchFor(null);
                                    setSearchInput('');
                                    setSearchResults([]);
                                    setSelectedLocation('');
                                  }}
                                  className="text-[12px] text-[#217e8f] hover:opacity-70 max-[375px]:text-[11px] relative -left-1"
                                  style={{ top: '0px' }}
                                >
                                  ←
                                </button>
                              </div>
                              
                              <div className="day-based-location-grid__search-input-section space-y-1">
                                <input
                                  type="text"
                                  value={searchInput}
                                  onChange={(e) => {
                                    setSearchInput(e.target.value);
                                    if (e.target.value !== selectedLocation) {
                                      setSelectedLocation(''); // Clear selection if user types something different
                                    }
                                    handleSearch(e.target.value);
                                  }}
                                  placeholder="Search location or address..."
                                  className={`day-based-location-grid__search-input w-full text-[10px] px-1 py-0.5 rounded-md text-gray-800 placeholder-gray-500 border outline-none focus:ring-1 focus:ring-[#217e8f]/50 mb-1 max-[375px]:text-[9px] ${
                                    selectedLocation ? 'bg-white border-[#217e8f]' : 'bg-white/60 border-[#217e8f]/30'
                                  } focus:bg-white`}
                                  style={{ paddingTop: '1px', paddingBottom: '1px' }}
                                  autoFocus
                                />
                                
                                {/* Fixed height container for dynamic content */}
                                <div className="day-based-location-grid__dynamic-content h-20 flex flex-col max-[375px]:h-16">
                                  {isSearching ? (
                                    <div className="day-based-location-grid__search-loading text-[10px] text-gray-500 text-center py-1 max-[375px]:text-[9px]">
                                      Searching...
                                    </div>
                                  ) : searchResults.length > 0 ? (
                                    <div className="day-based-location-grid__search-results space-y-1 overflow-y-auto flex-1 hide-scrollbar">
                                      {searchResults.map(result => {
                                        const isSelected = selectedLocation === formatLocationString(result);
                                        return (
                                          <button
                                            key={result.id}
                                            onClick={() => handleLocationSelect(dayIndex, result)}
                                            className={`day-based-location-grid__search-result w-full text-left px-1 py-1 rounded-md ${
                                              isSelected 
                                                ? 'bg-white border-2 border-[#1a6e7e]' 
                                                : 'bg-white/60 hover:bg-white border border-gray-200'
                                            }`}
                                          >
                                            <div className="text-[10px] font-medium text-[#217e8f] truncate max-[375px]:text-[9px]">{result.name}</div>
                                            <div className="text-[8px] text-gray-600 truncate max-[375px]:text-[7px]">{result.address}</div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="day-based-location-grid__no-results text-[10px] text-gray-500 text-center py-1 max-[375px]:text-[9px]">
                                      {searchInput.trim() ? 'No locations found' : 'Start typing to search...'}
                                    </div>
                                  )}
                                  
                                  {/* Fixed position manual submit button */}
                                  <div className="day-based-location-grid__manual-submit-container mt-1 h-6 flex items-center max-[375px]:h-5">
                                    <button
                                      onClick={() => handleCustomLocationSubmit(dayIndex)}
                                      disabled={!searchInput.trim() || isSearching}
                                      className={`day-based-location-grid__manual-submit w-full text-[10px] px-1 py-0.5 rounded-md transition-opacity max-[375px]:text-[9px] ${
                                        searchInput.trim() 
                                          ? 'bg-[#217e8f] text-white hover:bg-[#1a6e7e] opacity-100' 
                                          : 'bg-gray-300 text-gray-500 opacity-0 pointer-events-none'
                                      }`}
                                    >
                                      {selectedLocation ? 'Confirm Location' : 'Use as location'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => setShowLocationSearchFor(dayIndex)} 
                                className="day-based-location-grid__custom-btn w-full text-xs bg-[#217e8f]/20 text-[#1a6e7e] px-1 py-0.5 rounded-md hover:bg-[#217e8f]/30 max-[375px]:text-[11px] sticky top-0 z-10 mb-1"
                              >
                                New Location
                              </button>
                              <div className="day-based-location-grid__location-options-container relative">
                                <div 
                                  ref={(el) => { scrollContainerRefs.current[dayIndex] = el; }}
                                  className="day-based-location-grid__location-options space-y-1 overflow-y-auto hide-scrollbar max-h-20"
                                  style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  } as React.CSSProperties}
                                  onScroll={() => checkStickyConfirmVisibility(dayIndex)}
                                >
                                  {getLocationButtons().map(loc => {
                                    const isSelected = selectedPredefinedLocation?.dayIndex === dayIndex && selectedPredefinedLocation?.locationId === loc.id;
                                    return (
                                      <div key={loc.id} className="day-based-location-grid__option-container relative">
                                        <button 
                                          onClick={() => handlePredefinedLocationSelect(dayIndex, loc.id)} 
                                          className={`day-based-location-grid__location-option w-full text-xs px-1 py-0.5 rounded-md max-[375px]:text-[11px] truncate ${
                                            isSelected 
                                              ? 'bg-white text-[#217e8f] border-2 border-[#217e8f]/30 font-semibold' 
                                              : 'bg-white/60 text-[#217e8f] hover:bg-white'
                                          }`}
                                        >
                                          {loc.label}
                                        </button>
                                        {isSelected && !stickyConfirmVisible[dayIndex] && (
                                          <button
                                            onClick={handleConfirmPredefinedLocation}
                                            className="day-based-location-grid__confirm-btn absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 bg-[#217e8f] text-white text-[8px] px-1 py-0.5 rounded-md hover:bg-[#1a6e7e] transition-colors shadow-sm max-[375px]:text-[7px] max-[375px]:px-0.5 z-10"
                                          >
                                            Confirm
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* Sticky confirm button that appears when selected item is partially obscured */}
                                {selectedPredefinedLocation?.dayIndex === dayIndex && stickyConfirmVisible[dayIndex] && (
                                  <button
                                    onClick={handleConfirmPredefinedLocation}
                                    className="day-based-location-grid__sticky-confirm-btn absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 bg-[#217e8f] text-white text-[8px] px-1 py-0.5 rounded-md hover:bg-[#1a6e7e] transition-colors shadow-lg max-[375px]:text-[7px] max-[375px]:px-0.5 z-20"
                                    style={{
                                      background: 'linear-gradient(to bottom, rgba(33, 126, 143, 0.95), rgba(33, 126, 143, 1))',
                                      backdropFilter: 'blur(2px)'
                                    }}
                                  >
                                    Confirm
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : location ? (
                        <button
                          onClick={() => {
                            setEditingLocationForDay(dayIndex);
                            setShowFullPickerFor(null);
                          }}
                          className="day-based-location-grid__selected-location text-xs font-semibold text-[#217e8f] bg-white/60 px-2 py-1 rounded-md hover:bg-white w-full max-[375px]:text-[11px] truncate"
                        >
                          {location}
                        </button>
                      ) : (
                        <button 
                          onClick={() => { 
                            setEditingLocationForDay(dayIndex); 
                            setShowFullPickerFor(null); 
                          }} 
                          className="day-based-location-grid__set-location-btn text-xs bg-black/5 text-[#217e8f] px-2 py-1 rounded-md hover:bg-black/10 w-full max-[375px]:text-[11px]"
                        >
                          Set Location
                        </button>
                      )}
                    </div>
                  
                    {/* Date slots area */}
                    <div className="day-based-location-grid__date-slots w-full">
                      {hasSelectedDates ? (
                        <>
                          <div 
                            className="day-based-location-grid__date-list space-y-1 hide-scrollbar"
                            style={{
                              maxHeight: hasMoreThanFourDates ? '112px' : 'auto',
                              overflowY: hasMoreThanFourDates ? 'auto' : 'visible',
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            } as React.CSSProperties}
                          >
                            {datesForThisDay.map((dateStr) => {
                              const [year, month, day] = dateStr.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              const dayOfWeekName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
                              const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
                              const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                              
                              return (
                                <div 
                                  key={dateStr} 
                                  className="day-based-location-grid__date-item text-[10px] px-1 py-1 rounded text-center text-gray-700 font-medium bg-white/30 max-[375px]:text-[9px] max-[375px]:px-0.5 whitespace-nowrap flex items-center justify-center"
                                  style={{ height: '24px', minHeight: '24px' }}
                                >
                                  {dayOfWeekName} {monthName} {dayNum}
                                </div>
                              );
                            })}
                          </div>
                          
                          {hasMoreThanFourDates && (
                            <div className="day-based-location-grid__scroll-hint text-[9px] text-gray-500 text-center italic mt-1">
                              Scroll for more
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
      <div className="day-based-location-grid__actions mt-4 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!isAllLocationsSet()}
          className="day-based-location-grid__continue-btn bg-[#217e8f] text-white px-4 py-1 rounded-lg text-xs font-medium transition-colors enabled:hover:bg-[#1a6670] disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isAllLocationsSet() ? 'Locations Set' : 'Set Locations'}
        </button>
      </div>
    </div>
  );
}; 