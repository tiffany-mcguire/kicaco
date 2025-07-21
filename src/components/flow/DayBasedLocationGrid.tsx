import React, { useState, useRef, useEffect } from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getUniqueDaysOfWeek, getLocationButtons } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';
import { searchLocations, LocationResult, formatLocationString, formatLocationForDisplay } from '../../utils/mapsSearch';

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
  const [expandedDates, setExpandedDates] = useState<{[key: number]: boolean}>({});
  const [showLocationSearchFor, setShowLocationSearchFor] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [originalSearchQuery, setOriginalSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState<{dayIndex: number, locationId: string} | null>(null);
  const [searchSelectedLocations, setSearchSelectedLocations] = useState<{[dayIndex: number]: LocationResult}>({});

  const generateLocationOptions = () => {
    return getLocationButtons().map(loc => loc.label);
  };

  const formatManualLocationInput = (input: string): string => {
    // Common directional abbreviations that should stay uppercase
    const directions = ['NE', 'NW', 'SE', 'SW', 'N', 'S', 'E', 'W'];
    // Common street suffixes that should be properly capitalized
    const streetSuffixes = ['St', 'Ave', 'Rd', 'Dr', 'Blvd', 'Ln', 'Ct', 'Pl', 'Way', 'Pkwy'];
    
    return input
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Keep directions uppercase
        if (directions.includes(word.toUpperCase())) {
          return word.toUpperCase();
        }
        // Proper case for street suffixes
        if (streetSuffixes.includes(word.charAt(0).toUpperCase() + word.slice(1))) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        // Regular title case for other words
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
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
    
    // If clicking the same location again, deselect it
    if (selectedLocation === locationString) {
      setSelectedLocation('');
      setSearchInput(originalSearchQuery);
    } else {
      setSelectedLocation(locationString);
      setSearchInput(locationString);
    }
    // Keep search results visible so user can change selection
  };

  const handlePredefinedLocationSelect = (dayIndex: number, locationId: string) => {
    const location = getLocationButtons().find(loc => loc.id === locationId);
    if (location) {
      // Toggle selection - if same location is selected, deselect it
      if (selectedPredefinedLocation?.dayIndex === dayIndex && selectedPredefinedLocation?.locationId === locationId) {
        setSelectedPredefinedLocation(null);
      } else {
        setSelectedPredefinedLocation({dayIndex, locationId});
      }
    }
  };

  const handleConfirmPredefinedLocation = () => {
    if (selectedPredefinedLocation) {
      const location = getLocationButtons().find(loc => loc.id === selectedPredefinedLocation.locationId);
      if (location) {
        handleSetLocationForDay(selectedPredefinedLocation.dayIndex, location.label);
        setSelectedPredefinedLocation(null);
        setEditingLocationForDay(null);
        // Remove from search selected locations if it was there
        setSearchSelectedLocations(prev => {
          const newState = { ...prev };
          delete newState[selectedPredefinedLocation.dayIndex];
          return newState;
        });
      }
    }
  };

  const handleCustomLocationSubmit = (dayIndex: number) => {
    if (searchInput.trim()) {
      // Check if a location was selected from search results
      const selectedLocationResult = searchResults.find(result => 
        formatLocationString(result) === selectedLocation
      );
      
      if (selectedLocationResult) {
        // Store the search result for display formatting
        setSearchSelectedLocations(prev => ({
          ...prev,
          [dayIndex]: selectedLocationResult
        }));
        // Use the formatted display version
        handleSetLocationForDay(dayIndex, formatLocationForDisplay(selectedLocationResult));
      } else {
        // Manual input - convert to proper address capitalization
        const locationToUse = formatManualLocationInput(searchInput.trim());
        
        handleSetLocationForDay(dayIndex, locationToUse);
        // Remove from search selected locations if it was there
        setSearchSelectedLocations(prev => {
          const newState = { ...prev };
          delete newState[dayIndex];
          return newState;
        });
      }
      
      setShowLocationSearchFor(null);
      setSearchInput('');
      setSearchResults([]);
      setSelectedLocation('');
      setShowFullPickerFor(null);
      setEditingLocationForDay(null);
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
      
      <div className="day-based-location-grid__days space-y-3">
        {/* All Days - Full Width */}
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const bgColor = roygbivColors[dayIndex];
                const location = flowContext.eventPreview.dayBasedLocations?.[dayIndex];
                const isEditing = editingLocationForDay === dayIndex;
                const datesForThisDay = getDatesForDay(dayIndex);
                const locationOptions = generateLocationOptions();
            const hasSelectedDates = dayHasSelectedDates(dayIndex);

                return (
                  <div 
                    key={dayIndex} 
                className={`day-based-location-grid__day-card flex flex-col rounded-lg border-2 overflow-hidden ${!hasSelectedDates ? 'opacity-50' : ''}`}
                    style={{ 
                      backgroundColor: bgColor,
                  borderColor: `color-mix(in srgb, ${bgColor} 90%, black)`
                }}
              >
                {!hasSelectedDates ? (
                  <>
                    {/* Faux Location Button/Display - Inactive */}
                    <div className="day-based-location-grid__location-display px-1 pt-3 pb-1">
                      <div className="px-1">
                        <button
                          disabled
                          className="day-based-location-grid__set-location-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                        >
                          <span className="font-semibold text-gray-800">{dayNames[dayIndex]}</span>
                          <span>|</span>
                          <span>No Dates</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Faux Dates Section - Inactive */}
                    <div className="day-based-location-grid__dates-section bg-white/10 px-4 py-2 opacity-50">
                      <button
                        disabled
                        className="w-full text-center text-[11px] md:text-xs text-gray-500 mb-2 flex items-center justify-center gap-1 whitespace-nowrap cursor-not-allowed"
                      >
                        <span>Selected dates (0 total)</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Day Header - Only when location selection is expanded */}
                    {isEditing && (
                      <div className="day-based-location-grid__day-header text-center px-4 pt-4 pb-2">
                        <h3 className="font-semibold text-gray-800 text-[13px]">
                          {dayNames[dayIndex]}
                        </h3>
                      </div>
                    )}

                    {/* Location Button/Display with Day Name - Always Visible */}
                    <div className={`day-based-location-grid__location-display px-1 ${isEditing ? 'pb-2' : 'pt-3 pb-1'}`}>
                      {location && !isEditing ? (
                        <div className="px-1">
                          <button
                            onClick={() => {
                              setEditingLocationForDay(dayIndex);
                              setShowFullPickerFor(null);
                            }}
                            className="day-based-location-grid__selected-location w-full text-[13px] font-semibold text-[#217e8f] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                            style={{ 
                              backgroundColor: `color-mix(in srgb, ${bgColor} 30%, white)`,
                              borderColor: `color-mix(in srgb, ${bgColor} 70%, black)`,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                              boxShadow: `0 2px 4px color-mix(in srgb, ${bgColor} 50%, black)`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${bgColor} 40%, white)`;
                              e.currentTarget.style.borderColor = `color-mix(in srgb, ${bgColor} 80%, black)`;
                              e.currentTarget.style.boxShadow = `0 4px 8px color-mix(in srgb, ${bgColor} 60%, black)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${bgColor} 30%, white)`;
                              e.currentTarget.style.borderColor = `color-mix(in srgb, ${bgColor} 70%, black)`;
                              e.currentTarget.style.boxShadow = `0 2px 4px color-mix(in srgb, ${bgColor} 50%, black)`;
                            }}
                          >
                            <span className="font-semibold text-gray-800">{dayNames[dayIndex]}</span>
                            <span>|</span>
                            <span>{location}</span>
                          </button>
                        </div>
                      ) : isEditing ? (
                        <div className="day-based-location-grid__location-picker w-full">
                          {showLocationSearchFor === dayIndex ? (
                            <div className="day-based-location-grid__search-container">
                              <div className="day-based-location-grid__search-header flex items-center justify-between mb-1 px-1.5">
                                <button 
                                  onClick={() => {
                                    setSearchInput('');
                                    setSelectedLocation('');
                                    setSearchResults([]);
                                  }}
                                  className="text-[13px] text-[#217e8f]"
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
                                  className="text-base text-[#217e8f] hover:opacity-70"
                                >
                                  ←
                                </button>
                              </div>
                              
                              <div className="day-based-location-grid__search-input-section">
                                <input
                                  type="text"
                                  value={searchInput}
                                  onChange={(e) => {
                                    setSearchInput(e.target.value);
                                    setOriginalSearchQuery(e.target.value);
                                    if (e.target.value !== selectedLocation) {
                                      setSelectedLocation('');
                                    }
                                    handleSearch(e.target.value);
                                  }}
                                  placeholder="Search location or address..."
                                  className={`day-based-location-grid__search-input w-full text-sm px-3 py-2 rounded-md text-gray-800 placeholder-gray-500 border outline-none focus:ring-1 focus:ring-[#217e8f]/50 ${
                                    selectedLocation ? 'bg-white border-[#217e8f]' : 'bg-white/60 border-[#217e8f]/30'
                                  } focus:bg-white`}
                                  autoFocus
                                />
                                
                                {/* Fixed height container for location results */}
                                <div className="day-based-location-grid__location-content h-[228px] flex flex-col">
                                  {/* Scrollable location results */}
                                  <div className="day-based-location-grid__search-results-container space-y-[8.5px] flex-1 overflow-y-auto hide-scrollbar pt-[8.5px]">
                                  {isSearching ? (
                                      <div className="day-based-location-grid__search-loading text-sm text-gray-500 text-center py-2">
                                      Searching...
                                    </div>
                                  ) : searchResults.length > 0 ? (
                                      searchResults.map(result => {
                                        const locationString = formatLocationString(result);
                                        const isSelected = selectedLocation !== '' && selectedLocation === locationString;
                                        return (
                                          <button
                                            key={result.id}
                                            onClick={() => handleLocationSelect(dayIndex, result)}
                                            className={`day-based-location-grid__search-result w-full text-left px-3 py-2 rounded-md transition-all duration-200 ${
                                              isSelected 
                                                ? 'bg-white text-[#217e8f] border-2 border-emerald-500 font-semibold shadow-lg shadow-emerald-500/30 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-2 ring-emerald-500/25' 
                                                : 'bg-white/40 hover:bg-white/60 border border-gray-200'
                                            }`}
                                          >
                                            <div className="text-sm font-medium text-[#217e8f] truncate">{result.name}</div>
                                            <div className="text-xs text-gray-600 truncate">{result.address}</div>
                                          </button>
                                        );
                                      })
                                                                      ) : searchInput.trim() ? (
                                      <div className="day-based-location-grid__no-results text-sm text-gray-500 text-center py-2">
                                        No locations found
                                      </div>
                                    ) : null}
                                  </div>
                                  
                                  {/* Fixed position confirm button - always at bottom */}
                                  <div className="day-based-location-grid__confirm-container h-8 flex items-center flex-shrink-0">
                                    <button
                                      onClick={() => handleCustomLocationSubmit(dayIndex)}
                                      disabled={!searchInput.trim() || isSearching}
                                      className={`day-based-location-grid__confirm w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors border-2 ${
                                        searchInput.trim() && !isSearching
                                          ? 'bg-[#2f8fa4] text-white hover:bg-[#217e8f] active:scale-95 border-[#217e8f]' 
                                          : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                                      }`}
                                    >
                                      {selectedLocation ? 'Confirm Location' : searchInput.trim() ? 'Confirm Location' : 'Select Location'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="day-based-location-grid__scroll-picker">
                                                            <div className="px-1">
                                <button 
                                  onClick={() => {
                                    // Clear all search state for fresh start
                                    setSearchInput('');
                                    setOriginalSearchQuery('');
                                    setSelectedLocation('');
                                    setSearchResults([]);
                                    setShowLocationSearchFor(dayIndex);
                                    setSelectedPredefinedLocation(null);
                                  }} 
                                  className="day-based-location-grid__custom-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 sticky top-0 z-10 flex justify-center"
                                >
                                  Custom
                                </button>
                              </div>
                              
                              {/* Fixed height container for location options */}
                              <div className="day-based-location-grid__location-content h-[240px] flex flex-col px-1">
                                {/* Scrollable location options */}
                                <div className="day-based-location-grid__scrollable-options space-y-[8.5px] flex-1 overflow-y-auto hide-scrollbar pt-[8.5px]">
                                  {getLocationButtons().map(loc => {
                                    const isSelected = selectedPredefinedLocation?.dayIndex === dayIndex && selectedPredefinedLocation?.locationId === loc.id;
                                    return (
                                      <button 
                                        key={loc.id}
                                        onClick={() => handlePredefinedLocationSelect(dayIndex, loc.id)} 
                                        className={`day-based-location-grid__location-option w-full text-[13px] px-1 py-1.5 rounded-lg transition-all duration-200 truncate ${
                                          isSelected 
                                            ? 'bg-white text-[#217e8f] border-2 border-emerald-500 font-semibold shadow-lg shadow-emerald-500/30 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-2 ring-emerald-500/25' 
                                            : 'text-[#217e8f] hover:bg-white'
                                        } flex justify-center`}
                                        style={!isSelected ? { backgroundColor: 'rgba(255, 255, 255, 0.6)' } : {}}
                                      >
                                        {loc.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                
                                {/* Fixed position confirm button - always at bottom */}
                                <div className="day-based-location-grid__confirm-container h-8 flex items-center flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      if (selectedPredefinedLocation?.dayIndex === dayIndex) {
                                        handleConfirmPredefinedLocation();
                                      }
                                    }}
                                    disabled={!selectedPredefinedLocation || selectedPredefinedLocation.dayIndex !== dayIndex}
                                    className={`day-based-location-grid__confirm w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors border-2 ${
                                      selectedPredefinedLocation?.dayIndex === dayIndex 
                                        ? 'bg-[#2f8fa4] text-white hover:bg-[#217e8f] active:scale-95 border-[#217e8f]' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                                    }`}
                                  >
                                    {selectedPredefinedLocation?.dayIndex === dayIndex ? 'Confirm Location' : 'Select Location'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="px-1">
                        <button
                          onClick={() => {
                            setEditingLocationForDay(dayIndex);
                            setShowFullPickerFor(null);
                          }}
                            className="day-based-location-grid__set-location-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="font-semibold text-gray-800">{dayNames[dayIndex]}</span>
                            <span>|</span>
                            <span>Set Location</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dates Section - Collapsible */}
                    <div className="day-based-location-grid__dates-section bg-white/10 px-4 py-2">
                      <button
                        onClick={() => setExpandedDates(prev => ({...prev, [dayIndex]: !prev[dayIndex]}))}
                        className="w-full text-center text-[11px] md:text-xs text-gray-500 mb-2 hover:text-gray-700 transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <span>{expandedDates[dayIndex] ? '−' : '+'}</span>
                        <span>Selected dates ({datesForThisDay.length} total)</span>
                      </button>
                      {expandedDates[dayIndex] && (
                        <div className="day-based-location-grid__date-list grid grid-cols-2 gap-2 justify-items-center">
                          {datesForThisDay.map((dateStr) => {
                            const [year, month, day] = dateStr.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                            const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
                            
                            return (
                              <div 
                                key={dateStr} 
                                className="day-based-location-grid__date-item text-xs py-1 rounded bg-white/40 text-gray-700 font-medium whitespace-nowrap text-center w-[50px]"
                              >
                                {monthName} {dayNum}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
                              })}
        </div>
        
        {/* Continue Button */}
      <div className="day-based-location-grid__actions mt-4 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!isAllLocationsSet()}
          className={`day-based-location-grid__continue-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
            isAllLocationsSet() 
              ? 'bg-[#2f8fa4] text-white hover:bg-[#217e8f] border-[#217e8f]' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
          }`}
        >
          {isAllLocationsSet() ? 'Locations Set' : 'Set Locations'}
        </button>
      </div>
    </div>
  );
}; 