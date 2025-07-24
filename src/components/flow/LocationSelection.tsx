import React, { useState } from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getLocationButtons } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';
import { searchLocations, LocationResult, formatLocationString } from '../../utils/mapsSearch';
import { formatLocationToTitleCase } from '../../utils/formatLocation';

interface Props {
  flowContext: FlowContext;
  setFlowContext?: React.Dispatch<React.SetStateAction<FlowContext>>;
  customLocationInput: string;
  setCustomLocationInput: (value: string) => void;
  handleButtonSelect: (buttonId: string) => void;
}

export const LocationSelection: React.FC<Props> = ({
  flowContext,
  setFlowContext,
  customLocationInput,
  setCustomLocationInput,
  handleButtonSelect
}) => {
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState<string>('');
  const [originalSearchQuery, setOriginalSearchQuery] = useState('');

  // When in edit mode, pre-select the location
  React.useEffect(() => {
    if (flowContext.isEditMode && flowContext.eventPreview.location) {
      // Check if it's a predefined location
      const predefinedLoc = getLocationButtons().find(loc => 
        loc.label === flowContext.eventPreview.location
      );
      if (predefinedLoc) {
        setSelectedPredefinedLocation(predefinedLoc.id);
      } else {
        // It's a custom location
        setCustomLocationInput(flowContext.eventPreview.location);
      }
    }
  }, [flowContext.isEditMode, flowContext.eventPreview.location]);

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

  const handleLocationSelect = (location: LocationResult) => {
    const locationString = formatLocationString(location);
    
    // If clicking the same location again, deselect it
    if (selectedLocation === locationString) {
      setSelectedLocation('');
      setCustomLocationInput(originalSearchQuery);
      // If in edit mode and deselecting, clear the location
      if (flowContext.isEditMode && setFlowContext) {
        setFlowContext({
          ...flowContext,
          eventPreview: {
            ...flowContext.eventPreview,
            location: ''
          }
        });
      }
    } else {
      setSelectedLocation(locationString);
      setCustomLocationInput(locationString);
      // If in edit mode, update location immediately on selection
      if (flowContext.isEditMode && setFlowContext) {
        setFlowContext({
          ...flowContext,
          eventPreview: {
            ...flowContext.eventPreview,
            location: formatLocationToTitleCase(locationString)
          }
        });
      }
    }
    // Keep search results visible so user can change selection
    // Don't trigger new search since we want to keep current results
  };

  const handlePredefinedLocationSelect = (locationId: string) => {
    const location = getLocationButtons().find(loc => loc.id === locationId);
    if (location) {
      // Toggle selection - if already selected, deselect it
      if (selectedPredefinedLocation === locationId) {
        setSelectedPredefinedLocation('');
        // If in edit mode and deselecting, clear the location
        if (flowContext.isEditMode && setFlowContext) {
          setFlowContext({
            ...flowContext,
            eventPreview: {
              ...flowContext.eventPreview,
              location: ''
            }
          });
        }
      } else {
        setSelectedPredefinedLocation(locationId);
        // If in edit mode, update location immediately on selection
        if (flowContext.isEditMode && setFlowContext) {
          setFlowContext({
            ...flowContext,
            eventPreview: {
              ...flowContext.eventPreview,
              location: formatLocationToTitleCase(location.label)
            }
          });
        }
      }
      // Don't auto-fill input or trigger search mode
    }
  };

  const handleConfirmPredefinedLocation = () => {
    const location = getLocationButtons().find(loc => loc.id === selectedPredefinedLocation);
    if (location) {
      // If in edit mode and setFlowContext is available, update immediately
      if (flowContext.isEditMode && setFlowContext) {
        setFlowContext({
          ...flowContext,
          eventPreview: {
            ...flowContext.eventPreview,
            location: location.label
          }
        });
      }
      handleButtonSelect(formatLocationToTitleCase(location.label));
      setSelectedPredefinedLocation('');
    }
  };

  const handleManualLocationSubmit = () => {
    if (customLocationInput.trim()) {
      // Format to title case
      const locationToUse = formatLocationToTitleCase(selectedLocation || customLocationInput.trim());
      
      // If in edit mode and setFlowContext is available, update immediately
      if (flowContext.isEditMode && setFlowContext) {
        setFlowContext({
          ...flowContext,
          eventPreview: {
            ...flowContext.eventPreview,
            location: locationToUse
          }
        });
      }
      handleButtonSelect(locationToUse);
      setShowLocationSearch(false);
      setCustomLocationInput('');
      setSearchResults([]);
      setSelectedLocation('');
    }
  };

  const getBackgroundColor = () => {
    // For single events, use the day-of-week color
    const selectedDates = flowContext.eventPreview.selectedDates || [];
    if (selectedDates.length === 1) {
      const [year, month, day] = selectedDates[0].split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const jsDay = date.getDay();
      const dayOfWeekIndex = jsDay === 0 ? 6 : jsDay - 1;
      return roygbivColors[dayOfWeekIndex];
    }
    // For multiple events, use the default blue
    return '#c0e2e7';
  };

  const getHeaderText = () => {
    const selectedDates = flowContext.eventPreview.selectedDates || [];
    if (selectedDates.length === 1) {
      // Show the specific date for single events
      const [year, month, day] = selectedDates[0].split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayOfWeekName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
      const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
      const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
      return `${dayOfWeekName}, ${monthName} ${dayNum}`;
    }
    // For multiple events, show the generic text
    return 'Location for All Dates';
  };

  const renderDateGrid = () => {
    if (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 1) {
      return (
        <div className="location-selection__date-grid mt-4">
          <div className="location-selection__date-grid-hint text-[11px] text-gray-500 text-center mb-2">Selected dates ({flowContext.eventPreview.selectedDates.length} total)</div>
          <div className="location-selection__date-grid-container grid grid-cols-4 gap-2">
            {(() => {
              const dates = [...(flowContext.eventPreview.selectedDates || [])].sort();
              const columns: string[][] = [[], [], [], []];
              dates.forEach((dateStr, idx) => columns[idx % 4].push(dateStr));
              return columns.map((column, colIndex) => (
                <div key={colIndex} className="location-selection__date-quarter space-y-1">
                  {column.map(dateStr => {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    const dayOfWeekName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
                    const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
                    const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                    
                    const jsDay = date.getDay();
                    const dayOfWeekIndex = jsDay === 0 ? 6 : jsDay - 1;
                    const bgColor = roygbivColors[dayOfWeekIndex];
                    
                    return (
                      <div 
                        key={dateStr} 
                        className="location-selection__date-item text-[12px] px-3 py-2 rounded text-gray-700 font-medium whitespace-nowrap flex items-center justify-center"
                        style={{ backgroundColor: bgColor }}
                      >
                        {dayOfWeekName} {monthName} {dayNum}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="location-selection bg-white rounded-lg shadow-sm p-3 mb-8">
      <div className="location-selection__picker-container flex justify-center">
        <div 
          className="location-selection__picker flex flex-col items-center justify-between p-1.5 rounded-lg text-center w-[400px]" 
          style={{ backgroundColor: getBackgroundColor() }}
        >
          <div className="location-selection__header font-semibold text-gray-700 text-[13px] mb-2 px-2 py-1">
            {getHeaderText()}
          </div>
          <div className="location-selection__content w-full">
            {showLocationSearch ? (
              <div className="location-selection__search-container">
                <div className="location-selection__search-header flex items-center justify-between mb-2">
                  <button 
                    onClick={() => {
                      setCustomLocationInput('');
                      setSelectedLocation('');
                      setSearchResults([]);
                      setOriginalSearchQuery('');
                    }}
                    className="text-[13px] text-[#217e8f] px-1"
                  >
                    Clear Location
                  </button>
                  <button 
                    onClick={() => {
                      setShowLocationSearch(false);
                      setCustomLocationInput('');
                      setSearchResults([]);
                      setSelectedLocation('');
                      setOriginalSearchQuery('');
                    }}
                    className="text-[13px] text-[#217e8f] px-1"
                  >
                    ← Back
                  </button>
                </div>
                
                <div className="location-selection__search-input-section">
                  <input
                    type="text"
                    value={customLocationInput}
                    onChange={(e) => {
                      setCustomLocationInput(e.target.value);
                      setOriginalSearchQuery(e.target.value);
                      if (e.target.value !== selectedLocation) {
                        setSelectedLocation(''); // Clear selection if user types something different
                      }
                      handleSearch(e.target.value);
                      
                      // In edit mode, update location as user types (with debouncing)
                      if (flowContext.isEditMode && setFlowContext && e.target.value.trim()) {
                        // Clear any existing timeout
                        if ((window as any).locationUpdateTimeout) {
                          clearTimeout((window as any).locationUpdateTimeout);
                        }
                        
                        // Set new timeout to update after 500ms of no typing
                        (window as any).locationUpdateTimeout = setTimeout(() => {
                          setFlowContext({
                            ...flowContext,
                            eventPreview: {
                              ...flowContext.eventPreview,
                              location: formatLocationToTitleCase(e.target.value.trim())
                            }
                          });
                        }, 500);
                      }
                    }}
                    placeholder="Search for location or enter address..."
                    className={`location-selection__search-input w-full text-xs px-2 py-1 rounded-md text-gray-800 placeholder-gray-500 border outline-none focus:ring-2 focus:ring-[#217e8f]/50 ${
                      selectedLocation ? 'bg-white border-[#217e8f]' : 'bg-white/60 border-[#217e8f]/30'
                    } focus:bg-white`}
                    autoFocus
                  />
                  
                  {/* Fixed height container for dynamic content */}
                  <div className="location-selection__dynamic-content h-[170px] flex flex-col">
                    {/* Scrollable content area that takes up available space */}
                    <div className="location-selection__scrollable-content flex-1 overflow-y-auto scrollbar-hide">
                      {isSearching ? (
                        <div className="location-selection__search-loading text-xs text-gray-500 text-center py-2">
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="location-selection__search-results space-y-2 pt-2">
                          {searchResults.map(result => {
                            const isSelected = selectedLocation === formatLocationString(result);
                            return (
                              <button
                                key={result.id}
                                onClick={() => handleLocationSelect(result)}
                                className={`location-selection__search-result w-full text-left px-2 py-2 rounded-md transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/30 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-2 ring-emerald-500/25' 
                                    : 'bg-white/60 hover:bg-white border border-gray-200'
                                }`}
                              >
                                <div className="text-[13px] font-medium text-[#217e8f]">{result.name}</div>
                                <div className="text-[13px] text-gray-600">{result.address}</div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="location-selection__no-results text-xs text-gray-500 text-center py-2">
                          {customLocationInput.trim() ? 'No locations found' : 'Start typing to search...'}
                        </div>
                      )}
                    </div>
                    
                    {/* Fixed position manual submit button - always at bottom */}
                    <div className="location-selection__manual-submit-container h-8 flex items-center flex-shrink-0">
                      {flowContext.isEditMode ? (
                        // In edit mode, show a message that location is auto-saved
                        <div className="w-full h-[30px] flex items-center justify-center text-[13px] text-[#217e8f]">
                          {selectedLocation ? 'Location Updated' : (customLocationInput.trim() ? 'Type or Select Location' : 'Start typing to search...')}
                        </div>
                      ) : (
                        // Normal flow - show confirm button
                        <button
                          onClick={handleManualLocationSubmit}
                          disabled={!customLocationInput.trim() || isSearching}
                          className="location-selection__manual-submit w-full h-[30px] rounded-md bg-[#2f8fa4] text-white text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none hover:bg-[#217e8f] active:scale-95 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 border-2 border-[#217e8f] disabled:border-gray-300"
                        >
                          {selectedLocation ? 'Confirm Location' : 'Use As Location'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="location-selection__options">
                {/* Fixed height container for predefined options */}
                <div className="location-selection__predefined-content h-[229px] flex flex-col">
                  {/* Sticky New Location button that looks like a scrollable option */}
                  <button 
                    onClick={() => {
                      setShowLocationSearch(true);
                      setOriginalSearchQuery('');
                    }} 
                    className="location-selection__custom-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] px-1 py-1.5 rounded-lg hover:bg-[#217e8f]/30 sticky top-0 z-10 flex justify-center"
                  >
                    New Location
                  </button>
                  
                  {/* Scrollable predefined options */}
                  <div className="location-selection__scrollable-options space-y-2 flex-1 overflow-y-auto scrollbar-hide pt-2">
                    {getLocationButtons().map(loc => {
                      const isSelected = selectedPredefinedLocation === loc.id;
                      return (
                        <button 
                          key={loc.id}
                          onClick={() => handlePredefinedLocationSelect(loc.id)} 
                          className={`location-selection__option w-full text-[13px] px-1 py-1.5 rounded-lg transition-all duration-200 ${
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
                  <div className="location-selection__predefined-confirm-container h-8 flex items-center flex-shrink-0">
                    {flowContext.isEditMode ? (
                      // In edit mode, show a message that location is auto-saved
                      <div className="w-full h-[30px] flex items-center justify-center text-[13px] text-[#217e8f]">
                        {selectedPredefinedLocation ? 'Location Updated' : 'Select Location'}
                      </div>
                    ) : (
                      // Normal flow - show confirm button
                      <button
                        onClick={handleConfirmPredefinedLocation}
                        disabled={!selectedPredefinedLocation}
                        className={`location-selection__predefined-confirm w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors border-2 ${
                          selectedPredefinedLocation 
                            ? 'bg-[#2f8fa4] text-white hover:bg-[#217e8f] active:scale-95 border-[#217e8f]' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                        }`}
                      >
                        {selectedPredefinedLocation ? 'Confirm Location' : 'Select Location'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {renderDateGrid()}
    </div>
  );
}; 