import React from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getLocationButtons } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';

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

  const handleLocationSubmit = () => {
    if (customLocationInput.trim()) {
      // Convert to title case
      const titleCaseLocation = customLocationInput.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      handleButtonSelect(titleCaseLocation);
    }
  };

  const renderDateGrid = () => {
    if (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 1) {
      return (
        <div className="mt-4">
          <div className="text-[10px] text-gray-500 text-center mb-2">Selected dates ({flowContext.eventPreview.selectedDates.length} total)</div>
          <div className="grid grid-cols-4 gap-2">
            {(() => {
              const dates = [...(flowContext.eventPreview.selectedDates || [])].sort();
              const quartersSize = Math.ceil(dates.length / 4);
              const quarters = [];
              for (let i = 0; i < 4; i++) {
                quarters.push(dates.slice(i * quartersSize, (i + 1) * quartersSize));
              }
              
              return quarters.map((quarter, qIndex) => (
                <div key={qIndex} className="space-y-1">
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
                        className="text-[10px] px-2 py-1 rounded text-center text-gray-700 font-medium"
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
    <div className="bg-white rounded-lg shadow-sm p-3 mb-8">
      <div className="flex justify-center">
        <div 
          className="flex flex-col items-center justify-between p-1.5 rounded-lg text-center min-w-[160px]" 
          style={{ backgroundColor: getBackgroundColor() }}
        >
          <div className="font-semibold text-gray-800 text-xs mb-1">
            {getHeaderText()}
          </div>
          <div className="w-full">
            <div className="space-y-1">
              {getLocationButtons().map(loc => (
                <button 
                  key={loc.id} 
                  onClick={() => handleButtonSelect(loc.id)} 
                  className="w-full text-xs bg-white/60 text-gray-800 px-1 py-0.5 rounded-md hover:bg-white"
                >
                  {loc.label}
                </button>
              ))}
              <div className="flex gap-1 mt-2">
                <input
                  type="text"
                  value={customLocationInput}
                  onChange={(e) => setCustomLocationInput(e.target.value)}
                  placeholder="Other Location..."
                  className="flex-1 text-xs px-1 py-0.5 rounded-md bg-white/60 text-gray-800 placeholder-gray-500 border-0 outline-none focus:ring-2 focus:ring-[#217e8f]/50 focus:bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLocationSubmit();
                    }
                  }}
                />
                <button
                  onClick={handleLocationSubmit}
                  disabled={!customLocationInput.trim()}
                  className="text-xs px-2 py-0.5 bg-[#217e8f] text-white rounded-md disabled:bg-gray-300"
                >
                  Set Location
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {renderDateGrid()}
    </div>
  );
}; 