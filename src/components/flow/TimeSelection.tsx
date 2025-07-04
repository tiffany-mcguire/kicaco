import React from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { roygbivColors } from '../../constants/flowColors';

interface Props {
  flowContext: FlowContext;
  showFullPickerFor: string | null;
  setShowFullPickerFor: (value: string | null) => void;
  customTime: { hour: string; minute: string; ampm: string };
  setCustomTime: (time: { hour: string; minute: string; ampm: string }) => void;
  singleTimeScrollRef: React.RefObject<HTMLDivElement>;
  handleButtonSelect: (buttonId: string) => void;
}

export const TimeSelection: React.FC<Props> = ({
  flowContext,
  showFullPickerFor,
  setShowFullPickerFor,
  customTime,
  setCustomTime,
  singleTimeScrollRef,
  handleButtonSelect
}) => {
  const getBackgroundColor = () => {
    if (flowContext.step === 'daySpecificTime') {
      return '#c0e2e7';
    } else if (flowContext.step === 'whenTimePeriod') {
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
    }
    return '#c0e2e7';
  };

  const getHeaderText = () => {
    if (flowContext.step === 'daySpecificTime') {
      return `${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][flowContext.eventPreview.currentDayForTime!]}`;
    } else if (flowContext.step === 'whenTimePeriod') {
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
      return 'Time for All Dates';
    }
    return 'Select time';
  };

  const renderDateGrid = () => {
    if (flowContext.step === 'whenTimePeriod' && flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 1) {
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
          className={`flex flex-col items-center justify-between p-1.5 rounded-lg text-center ${flowContext.step === 'whenTimePeriod' ? 'min-w-[160px]' : 'min-w-[200px]'}`} 
          style={{ backgroundColor: getBackgroundColor() }}
        >
          <div className="font-semibold text-gray-800 text-xs mb-1">
            {getHeaderText()}
          </div>
          <div className="w-full">
            {showFullPickerFor === 'single' ? (
              customTime.hour === '' ? (
                <div className="grid grid-cols-4 gap-1 p-1 bg-white/50 rounded-lg">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <button 
                      key={h} 
                      onClick={() => setCustomTime({ ...customTime, hour: h.toString() })} 
                      className="text-xs font-semibold p-1 rounded-md bg-white/80 text-gray-700 hover:bg-white hover:text-gray-900"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className="flex flex-col gap-1">
                    {['00', '15', '30', '45'].map(m => (
                      <button 
                        key={m} 
                        onClick={() => setCustomTime({ ...customTime, minute: m })} 
                        className={`text-xs p-1 w-10 rounded-md font-semibold ${customTime.minute === m ? 'bg-[#217e8f] text-white' : 'bg-white/70 text-gray-700 hover:bg-white'}`}
                      >
                        {`:${m}`}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleButtonSelect(`${customTime.hour}:${customTime.minute} AM`)} 
                      disabled={!customTime.minute} 
                      className="text-xs px-2 py-1 rounded-md bg-white/70 text-gray-700 font-semibold hover:bg-white disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      AM
                    </button>
                    <button 
                      onClick={() => handleButtonSelect(`${customTime.hour}:${customTime.minute} PM`)} 
                      disabled={!customTime.minute} 
                      className="text-xs px-2 py-1 rounded-md bg-white/70 text-gray-700 font-semibold hover:bg-white disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      PM
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div ref={singleTimeScrollRef} className="space-y-1 max-h-32 overflow-y-auto">
                {(() => {
                  const options = [];
                  for (let h = 7; h <= 21; h++) {
                    options.push(`${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
                    options.push(`${h % 12 === 0 ? 12 : h % 12}:30 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
                  }
                  return options.map(opt => (
                    <button 
                      key={opt} 
                      data-time={opt} 
                      onClick={() => handleButtonSelect(opt)} 
                      className="w-full text-xs bg-white/60 text-gray-800 px-1 py-0.5 rounded-md hover:bg-white"
                    >
                      {opt}
                    </button>
                  ));
                })()}
                <button 
                  onClick={() => { 
                    setShowFullPickerFor('single'); 
                    setCustomTime({ hour: '', minute: '', ampm: '' }); 
                  }} 
                  className="w-full text-xs text-blue-600 pt-1 hover:underline"
                >
                  Custom time
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {renderDateGrid()}
    </div>
  );
}; 