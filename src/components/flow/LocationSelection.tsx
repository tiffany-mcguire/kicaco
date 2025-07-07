import React, { useState } from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getLocationButtons } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';
import { searchLocations, LocationResult, formatLocationString } from '../../utils/mapsSearch';

interface Props {
  flowContext: FlowContext;
  customLocationInput: string;
  setCustomLocationInput: (value: string) => void;
  handleButtonSelect: (buttonId: string) => void;
}

export const LocationSelection: React.FC<Props> = ({
  flowContext,
  customLocationInput,
  setCustomLocationInput,
  handleButtonSelect
}) => {
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState<string>('');

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
    setSelectedLocation(locationString);
    setCustomLocationInput(locationString);
    // Keep search results visible so user can change selection
    // Don't trigger new search since we want to keep current results
  };

  const handlePredefinedLocationSelect = (locationId: string) => {
    const location = getLocationButtons().find(loc => loc.id === locationId);
    if (location) {
      setSelectedPredefinedLocation(locationId);
      // Don't auto-fill input or trigger search mode
    }
  };

  const handleConfirmPredefinedLocation = () => {
    const location = getLocationButtons().find(loc => loc.id === selectedPredefinedLocation);
    if (location) {
      handleButtonSelect(location.label);
      setSelectedPredefinedLocation('');
    }
  };

  const handleManualLocationSubmit = () => {
    if (customLocationInput.trim()) {
      // Convert to title case if it's manual input, otherwise use as-is
      const locationToUse = selectedLocation || customLocationInput.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
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
          <div className="location-selection__date-grid-hint text-[10px] text-gray-500 text-center mb-2">Selected dates ({flowContext.eventPreview.selectedDates.length} total)</div>
          <div className="location-selection__date-grid-container grid grid-cols-4 gap-2">
            {(() => {
              const dates = [...(flowContext.eventPreview.selectedDates || [])].sort();
              const quartersSize = Math.ceil(dates.length / 4);
              const quarters = [];
              for (let i = 0; i < 4; i++) {
                quarters.push(dates.slice(i * quartersSize, (i + 1) * quartersSize));
              }
              
              return quarters.map((quarter, qIndex) => (
                <div key={qIndex} className="location-selection__date-quarter space-y-1">
                  {quarter.map(dateStr => {
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
                        className="location-selection__date-item text-[10px] px-2 py-1 rounded text-center text-gray-700 font-medium"
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
          <div className="location-selection__header font-semibold text-gray-800 text-xs mb-1">
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
                    }}
                    className="text-xs text-[#217e8f] hover:underline"
                  >
                    Clear Location
                  </button>
                  <button 
                    onClick={() => {
                      setShowLocationSearch(false);
                      setCustomLocationInput('');
                      setSearchResults([]);
                      setSelectedLocation('');
                    }}
                    className="text-xs text-[#217e8f] hover:underline"
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
                      if (e.target.value !== selectedLocation) {
                        setSelectedLocation(''); // Clear selection if user types something different
                      }
                      handleSearch(e.target.value);
                    }}
                    placeholder="Search for location or enter address..."
                    className={`location-selection__search-input w-full text-xs px-2 py-1 rounded-md text-gray-800 placeholder-gray-500 border outline-none focus:ring-2 focus:ring-[#217e8f]/50 mb-2 ${
                      selectedLocation ? 'bg-white border-[#217e8f]' : 'bg-white/60 border-[#217e8f]/30'
                    } focus:bg-white`}
                    autoFocus
                  />
                  
                  {/* Fixed height container for dynamic content */}
                  <div className="location-selection__dynamic-content h-40 flex flex-col">
                    {isSearching ? (
                      <div className="location-selection__search-loading text-xs text-gray-500 text-center py-2">
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="location-selection__search-results space-y-1 overflow-y-auto flex-1">
                        {searchResults.map(result => {
                          const isSelected = selectedLocation === formatLocationString(result);
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleLocationSelect(result)}
                              className={`location-selection__search-result w-full text-left px-2 py-2 rounded-md ${
                                isSelected 
                                  ? 'bg-white/60 border-2 border-[#1a6e7e]' 
                                  : 'bg-white/60 hover:bg-white border border-gray-200'
                              }`}
                            >
                              <div className="text-xs font-medium text-[#217e8f]">{result.name}</div>
                              <div className="text-[10px] text-gray-600">{result.address}</div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="location-selection__no-results text-xs text-gray-500 text-center py-2">
                        {customLocationInput.trim() ? 'No locations found' : 'Start typing to search...'}
                      </div>
                    )}
                    
                    {/* Fixed position manual submit button */}
                    <div className="location-selection__manual-submit-container mt-2 h-8 flex items-center">
                      <button
                        onClick={handleManualLocationSubmit}
                        disabled={!customLocationInput.trim() || isSearching}
                        className={`location-selection__manual-submit w-full text-xs px-2 py-1 rounded-md transition-opacity ${
                          customLocationInput.trim() 
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
              <div className="location-selection__options">
                <button 
                  onClick={() => setShowLocationSearch(true)} 
                  className="location-selection__custom-btn w-full text-xs bg-[#217e8f]/20 text-[#1a6e7e] px-1 py-0.5 rounded-md hover:bg-[#217e8f]/30 sticky top-0 z-10 mb-1"
                >
                  New Location
                </button>
                <div className="location-selection__scrollable-options space-y-1 max-h-28 overflow-y-auto">
                  {getLocationButtons().map(loc => {
                    const isSelected = selectedPredefinedLocation === loc.id;
                    return (
                      <div key={loc.id} className="location-selection__option-container relative">
                        <button 
                          onClick={() => handlePredefinedLocationSelect(loc.id)} 
                          className={`location-selection__option w-full text-xs px-1 py-0.5 rounded-md ${
                            isSelected 
                              ? 'bg-white text-[#217e8f] border-2 border-[#217e8f]/30 font-semibold' 
                              : 'bg-white/60 text-[#217e8f] hover:bg-white'
                          }`}
                        >
                          {loc.label}
                        </button>
                        {isSelected && (
                          <button
                            onClick={handleConfirmPredefinedLocation}
                            className="location-selection__confirm-btn absolute right-[18%] top-1/2 transform -translate-y-1/2 translate-x-1/2 bg-[#217e8f] text-white text-[10px] px-2 py-0.5 rounded-md hover:bg-[#1a6e7e] transition-colors shadow-sm"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    );
                  })}
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