import React from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getLocationButtons, getUniqueDaysOfWeek } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';

interface Props {
  flowContext: FlowContext;
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
  editingLocationForDate: string | null;
  setEditingLocationForDate: (value: string | null) => void;
  customLocationInput: string;
  setCustomLocationInput: (value: string) => void;
}

export const DayBasedLocationGrid: React.FC<Props> = ({
  flowContext,
  setFlowContext,
  editingLocationForDate,
  setEditingLocationForDate,
  customLocationInput,
  setCustomLocationInput
}) => {
  const handleSetLocationForDay = (dayIndex: number, location: string) => {
    setFlowContext({
      ...flowContext,
      eventPreview: {
        ...flowContext.eventPreview,
        dayBasedLocations: {
          ...flowContext.eventPreview.dayBasedLocations,
          [dayIndex]: location,
        }
      }
    });
    setEditingLocationForDate(null);
    setCustomLocationInput('');
  };

  const handleCustomLocationSubmit = (dayIndex: number) => {
    if (customLocationInput.trim()) {
      // Convert to title case
      const titleCaseLocation = customLocationInput.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      handleSetLocationForDay(dayIndex, titleCaseLocation);
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
      setFlowContext({...flowContext, step: 'eventNotes'});
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-8">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="grid grid-cols-3 gap-2">
        {(() => {
          const uniqueDays = getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []);
          
          // Sort days by day of week (Monday = 0, Sunday = 6)
          const sortedDays = uniqueDays.sort((a, b) => {
            const dayA = parseInt(a.id.split('-')[1]);
            const dayB = parseInt(b.id.split('-')[1]);
            return dayA - dayB;
          });
          
          // Create 3 columns with custom ordering: Mon-Wed in columns 0-2, Thu-Sat in columns 0-2, Sun in column 0
          const columns: Array<Array<{ id: string; label: string; description?: string }>> = Array.from({ length: 3 }, () => []);
          
          // First, place Monday-Wednesday in columns 0-2
          sortedDays.forEach(day => {
            const dayIndex = parseInt(day.id.split('-')[1]);
            if (dayIndex >= 0 && dayIndex <= 2) {
              columns[dayIndex].push(day);
            }
          });
          
          // Then, place Thursday-Saturday in columns 0-2 (below Mon-Wed)
          sortedDays.forEach(day => {
            const dayIndex = parseInt(day.id.split('-')[1]);
            if (dayIndex >= 3 && dayIndex <= 5) {
              columns[dayIndex - 3].push(day);
            }
          });
          
          // Finally, place Sunday in column 0 (below Mon and Thu)
          sortedDays.forEach(day => {
            const dayIndex = parseInt(day.id.split('-')[1]);
            if (dayIndex === 6) {
              columns[0].push(day);
            }
          });
          
          return columns.map((column, colIndex) => (
            <div key={`col${colIndex}`} className="space-y-2">
              {column.map((dayInfo) => {
                const dayIndex = parseInt(dayInfo.id.split('-')[1]);
                const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const bgColor = roygbivColors[dayIndex];
                const location = flowContext.eventPreview.dayBasedLocations?.[dayIndex];
                const isEditing = editingLocationForDate === `day-${dayIndex}`;
                
                // Get all dates for this day
                const datesForThisDay = (flowContext.eventPreview.selectedDates || []).filter(dateStr => {
                  const [year, month, day] = dateStr.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  const jsDay = date.getDay();
                  return (jsDay === 0 ? 6 : jsDay - 1) === dayIndex;
                }).sort();

                const hasMoreThanFourDates = datesForThisDay.length > 4;

                return (
                  <div 
                    key={dayIndex} 
                    className="flex flex-col p-1.5 rounded-lg" 
                    style={{ 
                      backgroundColor: bgColor,
                      minHeight: '200px'
                    }}
                  >
                    {/* Day name header */}
                    <div className="font-semibold text-gray-800 text-xs mb-2 text-center">
                      {dayNames[dayIndex]}
                    </div>
                    
                    {/* Location picker area - natural height */}
                    <div className="w-full mb-2">
                      {isEditing ? (
                        <div className="w-full">
                          <div 
                            className="space-y-1 overflow-y-auto hide-scrollbar max-h-24"
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            } as React.CSSProperties}
                          >
                            {getLocationButtons().map(loc => (
                              <button
                                key={loc.id}
                                onClick={() => handleSetLocationForDay(dayIndex, loc.label)}
                                className="w-full text-xs bg-white/60 text-[#217e8f] px-1 py-0.5 rounded-md hover:bg-white truncate"
                              >
                                {loc.label}
                              </button>
                            ))}
                          </div>
                          <div className="w-full mt-1">
                            <input
                              type="text"
                              value={customLocationInput}
                              onChange={(e) => setCustomLocationInput(e.target.value)}
                              placeholder="Other Location..."
                              className="w-full text-[10px] px-1 py-0.5 rounded-md bg-white/60 text-gray-800 placeholder-gray-500 border-0 outline-none focus:ring-1 focus:ring-[#217e8f]/50 focus:bg-white min-w-0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCustomLocationSubmit(dayIndex);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleCustomLocationSubmit(dayIndex)}
                              disabled={!customLocationInput.trim()}
                              className="text-[10px] px-1 py-0.5 bg-[#217e8f] text-white rounded-md disabled:bg-gray-300 mt-1 w-full"
                            >
                              Set Custom
                            </button>
                          </div>
                        </div>
                      ) : location ? (
                        <button
                          onClick={() => {
                            setEditingLocationForDate(`day-${dayIndex}`);
                            setCustomLocationInput('');
                          }}
                          className="text-xs font-semibold text-[#217e8f] bg-white/60 px-2 py-1 rounded-md hover:bg-white w-full"
                        >
                          {location}
                        </button>
                      ) : (
                        <button 
                          onClick={() => { 
                            setEditingLocationForDate(`day-${dayIndex}`); 
                            setCustomLocationInput(''); 
                          }} 
                          className="text-xs bg-black/5 text-[#217e8f] px-2 py-1 rounded-md hover:bg-black/10 w-full"
                        >
                          Set Location
                        </button>
                      )}
                    </div>
                  
                    {/* Date slots area - positioned immediately below location picker */}
                    <div className="w-full">
                      <div 
                        className="space-y-1 hide-scrollbar"
                        style={{
                          maxHeight: hasMoreThanFourDates ? '112px' : 'auto', // 4 slots × 28px each
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
                              className="text-[10px] px-2 py-1 rounded text-center text-gray-700 font-medium bg-white/30"
                              style={{ height: '24px', minHeight: '24px' }}
                            >
                              {dayOfWeekName} {monthName} {dayNum}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Helper text for overflow */}
                      {hasMoreThanFourDates && (
                        <div className="text-[9px] text-gray-500 text-center italic mt-1">
                          Scroll for more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!isAllLocationsSet()}
          className="bg-[#217e8f] text-white px-4 py-1 rounded-lg text-xs font-medium transition-colors enabled:hover:bg-[#1a6670] disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isAllLocationsSet() ? 'Locations Set' : 'Set Locations'}
        </button>
      </div>
    </div>
  );
}; 