import React from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getLocationButtons } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';

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
  const handleCustomLocationSubmit = (dateStr: string) => {
    if (customLocationInput.trim()) {
      // Convert to title case
      const titleCaseLocation = customLocationInput.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      handleSetLocationForDate(dateStr, titleCaseLocation);
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
                        <div className="custom-location-selection__location-editor w-full space-y-1">
                          {getLocationButtons().map(loc => (
                            <button
                              key={loc.id}
                              onClick={() => handleSetLocationForDate(dateStr, loc.label)}
                              className="custom-location-selection__location-option w-full text-xs bg-white/60 text-gray-800 px-1 py-0.5 rounded-md hover:bg-white truncate"
                            >
                              {loc.label}
                            </button>
                          ))}
                          <div className="custom-location-selection__custom-input-section w-full">
                            <input
                              type="text"
                              value={customLocationInput}
                              onChange={(e) => setCustomLocationInput(e.target.value)}
                              placeholder="Other Location..."
                              className="custom-location-selection__custom-input w-full text-[10px] px-1 py-0.5 rounded-md bg-white/60 text-gray-800 placeholder-gray-500 border-0 outline-none focus:ring-1 focus:ring-[#217e8f]/50 focus:bg-white min-w-0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCustomLocationSubmit(dateStr);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleCustomLocationSubmit(dateStr)}
                              disabled={!customLocationInput.trim()}
                              className="custom-location-selection__custom-submit text-[10px] px-1 py-0.5 bg-[#217e8f] text-white rounded-md disabled:bg-gray-300 mt-1 w-full"
                            >
                              {location ? 'Location Set' : 'Set Location'}
                            </button>
                          </div>
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
                          className="custom-location-selection__set-location-btn text-xs bg-black/5 text-gray-700 px-2 py-1 rounded-md hover:bg-black/10 w-full"
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