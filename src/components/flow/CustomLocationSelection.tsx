import React, { useState } from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getLocationButtons } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';
import { searchLocations, LocationResult, formatLocationString } from '../../utils/mapsSearch';

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
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState<{dateStr: string, locationId: string} | null>(null);

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
    setSelectedLocation(locationString);
    setCustomLocationInput(locationString);
    // Keep search results visible so user can change selection
  };

  const handlePredefinedLocationSelect = (dateStr: string, locationId: string) => {
    const location = getLocationButtons().find(loc => loc.id === locationId);
    if (location) {
      setSelectedPredefinedLocation({dateStr, locationId});
    }
  };

  const handleConfirmPredefinedLocation = () => {
    if (selectedPredefinedLocation) {
      const location = getLocationButtons().find(loc => loc.id === selectedPredefinedLocation.locationId);
      if (location) {
        handleSetLocationForDate(selectedPredefinedLocation.dateStr, location.label);
        setSelectedPredefinedLocation(null);
        setEditingLocationForDate(null);
      }
    }
  };

  const handleCustomLocationSubmit = (dateStr: string) => {
    if (customLocationInput.trim()) {
      // Convert to title case if it's manual input, otherwise use as-is
      const locationToUse = selectedLocation || customLocationInput.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      handleSetLocationForDate(dateStr, locationToUse);
      setShowLocationSearchFor(null);
      setCustomLocationInput('');
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

  return (
    <div className="custom-location-selection bg-white rounded-lg shadow-sm p-3 mb-8">
      <div className="custom-location-selection__grid grid grid-cols-3 gap-2">
        {(() => {
          const dates = [...(flowContext.eventPreview.selectedDates || [])].sort();
          const numColumns = 3; // Use 3 columns for mobile-first design
          
          // Better distribution algorithm
          const quarters: string[][] = Array.from({ length: numColumns }, () => []);
          const itemsPerColumn = Math.floor(dates.length / numColumns);
          const extraItems = dates.length % numColumns;
          
          let dateIndex = 0;
          for (let col = 0; col < numColumns; col++) {
            const itemsInThisColumn = itemsPerColumn + (col < extraItems ? 1 : 0);
            quarters[col] = dates.slice(dateIndex, dateIndex + itemsInThisColumn);
            dateIndex += itemsInThisColumn;
          }
          
          return quarters.map((quarter, qIndex) => (
            <div key={qIndex} className="custom-location-selection__column space-y-2">
              {quarter.map((dateStr) => {
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                
                const dayOfWeekName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
                const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
                const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                
                const jsDay = date.getDay();
                const dayOfWeekIndex = jsDay === 0 ? 6 : jsDay - 1;
                const bgColor = roygbivColors[dayOfWeekIndex];

                const location = flowContext.eventPreview.dateBasedLocations?.[dateStr];
                const isEditing = editingLocationForDate === dateStr;

                return (
                  <div key={dateStr} className="custom-location-selection__date-card flex flex-col items-center justify-between p-1.5 rounded-lg text-center" style={{ backgroundColor: bgColor }}>
                    <div className="custom-location-selection__date-header font-semibold text-gray-800 text-xs mb-1">{`${dayOfWeekName}, ${monthName} ${dayNum}`}</div>
                    <div className="custom-location-selection__location-picker mt-1 w-full flex-grow flex items-center justify-center">
                      {isEditing ? (
                        <div className="custom-location-selection__location-editor w-full">
                          {showLocationSearchFor === dateStr ? (
                            <div className="custom-location-selection__search-container" style={{ marginTop: '-6px' }}>
                              <div className="custom-location-selection__search-header flex items-center justify-between mb-0.5">
                                <button 
                                  onClick={() => {
                                    setCustomLocationInput('');
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
                                    setCustomLocationInput('');
                                    setSearchResults([]);
                                  }}
                                  className="text-[12px] text-[#217e8f] hover:opacity-70 max-[375px]:text-[11px] relative -left-1"
                                  style={{ top: '0px' }}
                                >
                                  ←
                                </button>
                              </div>
                              
                              <div className="custom-location-selection__search-input-section space-y-1">
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
                                  className={`custom-location-selection__search-input w-full text-[10px] px-1 py-0.5 rounded-md text-gray-800 placeholder-gray-500 border outline-none focus:ring-1 focus:ring-[#217e8f]/50 mb-1 max-[375px]:text-[9px] ${
                                    selectedLocation ? 'bg-white border-[#217e8f]' : 'bg-white/60 border-[#217e8f]/30'
                                  } focus:bg-white`}
                                  style={{ paddingTop: '1px', paddingBottom: '1px' }}
                                  autoFocus
                                />
                                
                                {isSearching && (
                                  <div className="custom-location-selection__search-loading text-[10px] text-gray-500 text-center py-1">
                                    Searching...
                                  </div>
                                )}
                                
                                {searchResults.length > 0 && (
                                  <div className="custom-location-selection__search-results space-y-1 max-h-24 overflow-y-auto">
                                    {searchResults.map(result => {
                                      const isSelected = selectedLocation === formatLocationString(result);
                                      return (
                                        <button
                                          key={result.id}
                                          onClick={() => handleLocationSelect(dateStr, result)}
                                          className={`custom-location-selection__search-result w-full text-left px-1 py-1 rounded-md ${
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
                                )}
                                
                                {customLocationInput.trim() && !isSearching && (
                                  <button
                                    onClick={() => handleCustomLocationSubmit(dateStr)}
                                    className="custom-location-selection__manual-submit w-full text-[10px] px-1 py-0.5 bg-[#217e8f] text-white rounded-md hover:bg-[#1a6e7e] max-[375px]:text-[9px]"
                                  >
                                    {selectedLocation ? 'Confirm Location' : `Use "${customLocationInput}" as location`}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => setShowLocationSearchFor(dateStr)} 
                                className="custom-location-selection__custom-btn w-full text-xs bg-[#217e8f]/20 text-[#1a6e7e] px-1 py-0.5 rounded-md hover:bg-[#217e8f]/30 sticky top-0 z-10 mb-1"
                              >
                                New Location
                              </button>
                              <div className="custom-location-selection__scrollable-options space-y-1 max-h-28 overflow-y-auto">
                                {getLocationButtons().map(loc => {
                                  const isSelected = selectedPredefinedLocation?.dateStr === dateStr && selectedPredefinedLocation?.locationId === loc.id;
                                  return (
                                    <div key={loc.id} className="custom-location-selection__option-container relative">
                                      <button
                                        onClick={() => handlePredefinedLocationSelect(dateStr, loc.id)}
                                        className={`custom-location-selection__location-option w-full text-xs px-1 py-0.5 rounded-md max-[375px]:text-[11px] truncate ${
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
                                          className="custom-location-selection__confirm-btn absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 bg-[#217e8f] text-white text-[8px] px-1 py-0.5 rounded-md hover:bg-[#1a6e7e] transition-colors shadow-sm max-[375px]:text-[7px] max-[375px]:px-0.5 z-10"
                                        >
                                          Confirm
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      ) : location ? (
                        <button
                          onClick={() => {
                            setEditingLocationForDate(dateStr);
                            setCustomLocationInput('');
                          }}
                          className="custom-location-selection__selected-location text-sm font-semibold text-[#217e8f] px-2 py-1 rounded-md hover:bg-black/5 w-full truncate"
                        >
                          {location}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingLocationForDate(dateStr);
                            setCustomLocationInput('');
                          }}
                          className="custom-location-selection__set-location-btn text-xs bg-black/5 text-[#217e8f] px-2 py-1 rounded-md hover:bg-black/10 w-full"
                        >
                          Set Location
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
      <div className="custom-location-selection__actions mt-4 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!areAllLocationsSet}
          className="custom-location-selection__continue-btn bg-[#217e8f] text-white px-4 py-1 rounded-lg text-xs font-medium transition-colors enabled:hover:bg-[#1a6670] disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {areAllLocationsSet ? 'Locations Set' : 'Set Locations'}
        </button>
      </div>
    </div>
  );
}; 