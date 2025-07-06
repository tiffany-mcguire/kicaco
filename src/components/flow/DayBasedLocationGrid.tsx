import React from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getUniqueDaysOfWeek } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';

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
  const generateLocationOptions = () => {
    return [
      'Home',
      'School',
      'Park',
      'Community Center',
      'Sports Complex',
      'Library',
      'Friend\'s House',
      'Grandparent\'s House'
    ];
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
                          <div 
                            className="day-based-location-grid__location-options space-y-1 overflow-y-auto hide-scrollbar max-h-24"
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            } as React.CSSProperties}
                          >
                            {locationOptions.map(opt => (
                              <button 
                                key={opt} 
                                onClick={() => handleSetLocationForDay(dayIndex, opt)} 
                                className="day-based-location-grid__location-option w-full text-xs bg-white/60 text-[#217e8f] px-1 py-0.5 rounded-md hover:bg-white max-[375px]:text-[11px] truncate"
                              >
                                {opt}
                              </button>
                            ))}
                            <button 
                              onClick={() => setShowFullPickerFor(`day-${dayIndex}`)} 
                              className="day-based-location-grid__custom-btn w-full text-xs text-[#217e8f] pt-1 hover:underline max-[375px]:text-[11px]"
                            >
                              Custom Location
                            </button>
                          </div>
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