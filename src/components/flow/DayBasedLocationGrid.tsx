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
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-stretch">
        {getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []).map((dayInfo) => {
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

          return (
            <div key={dayIndex} className="flex flex-col items-center p-1.5 rounded-lg text-center h-full" style={{ backgroundColor: bgColor }}>
              <div className="font-semibold text-gray-800 text-xs mb-1">
                {dayNames[dayIndex]}
              </div>
              <div className="w-full mb-2">
                {isEditing ? (
                  <div className="w-full space-y-1">
                    {getLocationButtons().map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => handleSetLocationForDay(dayIndex, loc.label)}
                        className="w-full text-xs bg-white/60 text-gray-800 px-1 py-0.5 rounded-md hover:bg-white truncate"
                      >
                        {loc.label}
                      </button>
                    ))}
                    <div className="w-full">
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
                        {location ? 'Location Set' : 'Set Location'}
                      </button>
                    </div>
                  </div>
                ) : location ? (
                  <button
                    onClick={() => {
                      setEditingLocationForDate(`day-${dayIndex}`);
                      setCustomLocationInput('');
                    }}
                    className="text-sm font-semibold text-[#217e8f] px-2 py-1 rounded-md hover:bg-black/5 w-full"
                  >
                    {location}
                  </button>
                ) : (
                  <button 
                    onClick={() => { 
                      setEditingLocationForDate(`day-${dayIndex}`); 
                      setCustomLocationInput(''); 
                    }} 
                    className="text-xs bg-black/5 text-gray-700 px-2 py-1 rounded-md hover:bg-black/10 w-full"
                  >
                    Set Location
                  </button>
                )}
              </div>
              <div className="w-full space-y-1 flex-1">
                {datesForThisDay.map(dateStr => {
                  const [year, month, day] = dateStr.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  const dayOfWeekName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
                  const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
                  const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                  
                  return (
                    <div 
                      key={dateStr} 
                      className="text-[10px] px-2 py-1 rounded text-center text-gray-700 font-medium bg-white/30"
                    >
                      {dayOfWeekName} {monthName} {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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