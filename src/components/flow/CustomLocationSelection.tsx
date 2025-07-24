import React, { useState, useRef, useEffect } from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getLocationButtons } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';
import { searchLocations, LocationResult, formatLocationString, formatLocationForDisplay } from '../../utils/mapsSearch';
import { formatLocationToTitleCase } from '../../utils/formatLocation';

interface Props {
  flowContext: FlowContext;
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
  editingLocationForDate: string | null;
  setEditingLocationForDate: (value: string | null) => void;
  customLocationInput: string;
  setCustomLocationInput: (value: string) => void;
  handleSetLocationForDate: (dateStr: string, location: string) => void;
  areAllLocationsSet: boolean;
}

export const CustomLocationSelection: React.FC<Props> = ({
  flowContext,
  setFlowContext,
  editingLocationForDate,
  setEditingLocationForDate,
  customLocationInput,
  setCustomLocationInput,
  handleSetLocationForDate,
  areAllLocationsSet
}) => {
  const [showLocationSearchFor, setShowLocationSearchFor] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [originalSearchQuery, setOriginalSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState<{dateStr: string, locationId: string} | null>(null);
  const [searchSelectedLocations, setSearchSelectedLocations] = useState<{[dateStr: string]: LocationResult}>({});
  // Sticky confirm state and scroll refs
  const [stickyConfirmVisible, setStickyConfirmVisible] = useState<{[key: string]: boolean}>({});
  const scrollContainerRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  // Pre-populate locations when in edit mode
  React.useEffect(() => {
    if (flowContext.isEditMode && flowContext.eventPreview.dateBasedLocations) {
      // The locations are already stored in flowContext.eventPreview.dateBasedLocations
      // No need to do anything special, they will be displayed by the component
    }
  }, [flowContext.isEditMode, flowContext.eventPreview.dateBasedLocations]);



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

  const handleLocationSelect = (dateStr: string, location: LocationResult) => {
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

  const handlePredefinedLocationSelect = (dateStr: string, locationId: string) => {
    const location = getLocationButtons().find(loc => loc.id === locationId);
    if (location) {
      // Toggle selection - if same location is selected, deselect it
      if (selectedPredefinedLocation?.dateStr === dateStr && selectedPredefinedLocation?.locationId === locationId) {
        setSelectedPredefinedLocation(null);
      } else {
        setSelectedPredefinedLocation({dateStr, locationId});
      }
    }
  };

  const handleConfirmPredefinedLocation = () => {
    if (selectedPredefinedLocation) {
      const location = getLocationButtons().find(loc => loc.id === selectedPredefinedLocation.locationId);
      if (location) {
        handleSetLocationForDate(selectedPredefinedLocation.dateStr, formatLocationToTitleCase(location.label));
        setSelectedPredefinedLocation(null);
        setEditingLocationForDate(null);
        // Remove from search selected locations if it was there
        setSearchSelectedLocations(prev => {
          const newState = { ...prev };
          delete newState[selectedPredefinedLocation.dateStr];
          return newState;
        });
      }
    }
  };

  const handleCustomLocationSubmit = (dateStr: string) => {
    if (searchInput.trim()) {
      // Check if a location was selected from search results
      const selectedLocationResult = searchResults.find(result => 
        formatLocationString(result) === selectedLocation
      );
      
      if (selectedLocationResult) {
        // Store the search result for display formatting
        setSearchSelectedLocations(prev => ({
          ...prev,
          [dateStr]: selectedLocationResult
        }));
        // Use the formatted display version
        handleSetLocationForDate(dateStr, formatLocationForDisplay(selectedLocationResult));
      } else {
        // Manual input - convert to proper address capitalization
        const locationToUse = formatLocationToTitleCase(searchInput.trim());
        
        handleSetLocationForDate(dateStr, locationToUse);
        // Remove from search selected locations if it was there
        setSearchSelectedLocations(prev => {
          const newState = { ...prev };
          delete newState[dateStr];
          return newState;
        });
      }
      
      setShowLocationSearchFor(null);
      setSearchInput('');
      setSearchResults([]);
      setSelectedLocation('');
      setEditingLocationForDate(null);
    }
  };

  const handleContinue = () => {
    if (areAllLocationsSet) {
      setFlowContext({...flowContext, step: 'eventNotes'});
    }
  };

  const getFormattedDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeekName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    return { dayOfWeekName, dayNum, monthName };
  };

  const getDayOfWeekIndex = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const jsDay = date.getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  };

  const renderDateCard = (dateStr: string) => {
    const { dayOfWeekName, dayNum, monthName } = getFormattedDate(dateStr);
    const dayOfWeekIndex = getDayOfWeekIndex(dateStr);
    const bgColor = roygbivColors[dayOfWeekIndex];
    const location = flowContext.eventPreview.dateBasedLocations?.[dateStr];
    const isEditing = editingLocationForDate === dateStr;

    return (
      <div 
        key={dateStr} 
        className="custom-location-selection__date-card flex flex-col rounded-lg border-2 overflow-hidden" 
        style={{ 
          backgroundColor: bgColor,
          borderColor: `color-mix(in srgb, ${bgColor} 90%, black)`
        }}
      >
        {/* Day Header - Only when location selection is expanded */}
        {isEditing && (
          <div className="custom-location-selection__date-header text-center px-4 pt-4 pb-2">
            <h3 className="font-semibold text-gray-800 text-[13px]">
              {dayOfWeekName}, {monthName} {dayNum}
            </h3>
          </div>
        )}

        {/* Location Button/Display with Date - Always Visible */}
        <div className="custom-location-selection__location-display px-1 py-2">
          {location && !isEditing ? (
            <div className="px-1">
              <button
                onClick={() => {
                  setEditingLocationForDate(dateStr);
                }}
                className="custom-location-selection__selected-location w-full text-[13px] font-semibold text-[#217e8f] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
                <span className="font-semibold text-gray-800">{dayOfWeekName}, {monthName} {dayNum}</span>
                <span>|</span>
                <span>{formatLocationToTitleCase(location)}</span>
              </button>
            </div>
          ) : isEditing ? (
            <div className="custom-location-selection__location-picker w-full">
              {showLocationSearchFor === dateStr ? (
                <div className="custom-location-selection__search-container">
                  <div className="custom-location-selection__search-header flex items-center justify-between mb-1 px-1.5">
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
                  
                  <div className="custom-location-selection__search-input-section">
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
                      className={`custom-location-selection__search-input w-full text-sm px-3 py-2 rounded-md text-gray-800 placeholder-gray-500 border outline-none focus:ring-1 focus:ring-[#217e8f]/50 ${
                        selectedLocation ? 'bg-white border-[#217e8f]' : 'bg-white/60 border-[#217e8f]/30'
                      } focus:bg-white`}
                      autoFocus
                    />
                    
                    {/* Fixed height container for location results */}
                    <div className="custom-location-selection__location-content h-[240px] flex flex-col">
                      {/* Scrollable location results */}
                      <div className="custom-location-selection__search-results-container space-y-[8.5px] flex-1 overflow-y-auto hide-scrollbar pt-[8.5px]">
                        {isSearching ? (
                          <div className="custom-location-selection__search-loading text-sm text-gray-500 text-center py-2">
                            Searching...
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map(result => {
                            const locationString = formatLocationString(result);
                            const isSelected = selectedLocation !== '' && selectedLocation === locationString;
                            return (
                              <button
                                key={result.id}
                                onClick={() => handleLocationSelect(dateStr, result)}
                                className={`custom-location-selection__search-result w-full text-left px-3 py-2 rounded-md transition-all duration-200 ${
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
                          <div className="custom-location-selection__no-results text-sm text-gray-500 text-center py-2">
                            No locations found
                          </div>
                        ) : null}
                      </div>
                      
                      {/* Fixed position confirm button - always at bottom */}
                      <div className="custom-location-selection__confirm-container h-8 flex items-center flex-shrink-0">
                        <button
                          onClick={() => handleCustomLocationSubmit(dateStr)}
                          disabled={!searchInput.trim() || isSearching}
                          className={`custom-location-selection__confirm w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors border-2 ${
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
                <div className="custom-location-selection__scroll-picker">
                  <div className="px-1">
                    <button 
                      onClick={() => {
                        // Clear all search state for fresh start
                        setSearchInput('');
                        setOriginalSearchQuery('');
                        setSelectedLocation('');
                        setSearchResults([]);
                        setShowLocationSearchFor(dateStr);
                        setSelectedPredefinedLocation(null);
                      }} 
                      className="custom-location-selection__custom-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 sticky top-0 z-10 flex justify-center"
                    >
                      Custom
                    </button>
                  </div>
                  
                  {/* Fixed height container for location options */}
                  <div className="custom-location-selection__location-content h-[240px] flex flex-col px-1">
                    {/* Scrollable location options */}
                    <div className="custom-location-selection__scrollable-options space-y-[8.5px] flex-1 overflow-y-auto hide-scrollbar pt-[8.5px]">
                      {getLocationButtons().map(loc => {
                        const isSelected = selectedPredefinedLocation?.dateStr === dateStr && selectedPredefinedLocation?.locationId === loc.id;
                        return (
                          <button 
                            key={loc.id}
                            onClick={() => handlePredefinedLocationSelect(dateStr, loc.id)} 
                            className={`custom-location-selection__location-option w-full text-[13px] px-1 py-1.5 rounded-lg transition-all duration-200 truncate ${
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
                    <div className="custom-location-selection__confirm-container h-8 flex items-center flex-shrink-0">
                                              <button
                          onClick={() => {
                            if (selectedPredefinedLocation?.dateStr === dateStr) {
                              handleConfirmPredefinedLocation();
                            }
                          }}
                          disabled={!selectedPredefinedLocation || selectedPredefinedLocation.dateStr !== dateStr}
                          className={`custom-location-selection__confirm w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors border-2 ${
                            selectedPredefinedLocation?.dateStr === dateStr 
                              ? 'bg-[#2f8fa4] text-white hover:bg-[#217e8f] active:scale-95 border-[#217e8f]' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                          }`}
                        >
                        {selectedPredefinedLocation?.dateStr === dateStr ? 'Confirm Location' : 'Select Location'}
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
                  setEditingLocationForDate(dateStr); 
                }} 
                className="custom-location-selection__set-location-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 transition-colors flex items-center justify-center gap-2"
              >
                <span className="font-semibold text-gray-800">{dayOfWeekName}, {monthName} {dayNum}</span>
                <span>|</span>
                <span>Set Location</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="custom-location-selection bg-white rounded-lg shadow-sm p-3 mb-8">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <div className="custom-location-selection__dates space-y-3">
        {flowContext.eventPreview.selectedDates?.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(dateStr => renderDateCard(dateStr))}
      </div>
      
      {/* Continue Button */}
      <div className="custom-location-selection__actions mt-4 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!areAllLocationsSet}
          className={`custom-location-selection__continue-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
            areAllLocationsSet 
              ? 'bg-[#2f8fa4] text-white hover:bg-[#217e8f] border-[#217e8f]' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
          }`}
        >
          {areAllLocationsSet ? 'Locations Set' : 'Set Locations'}
        </button>
      </div>
    </div>
  );
}; 