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
        <div className="time-selection__date-grid mt-4">
          <div className="time-selection__date-grid-hint text-[10px] text-gray-500 text-center mb-2">Selected dates ({flowContext.eventPreview.selectedDates.length} total)</div>
          <div className="time-selection__date-grid-container grid grid-cols-4 gap-2">
            {(() => {
              const dates = [...(flowContext.eventPreview.selectedDates || [])].sort();
              const quartersSize = Math.ceil(dates.length / 4);
              const quarters = [];
              for (let i = 0; i < 4; i++) {
                quarters.push(dates.slice(i * quartersSize, (i + 1) * quartersSize));
              }
              
              return quarters.map((quarter, qIndex) => (
                <div key={qIndex} className="time-selection__date-quarter space-y-1">
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
                        className="time-selection__date-item text-[10px] px-2 py-1 rounded text-center text-gray-700 font-medium"
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
    <div className="time-selection bg-white rounded-lg shadow-sm p-3 mb-8">
      <div className="time-selection__picker-container flex justify-center">
        <div 
          className={`time-selection__picker flex custom-timer-width flex-col items-center justify-between p-1.5 rounded-lg text-center ${flowContext.step === 'whenTimePeriod' ? 'min-w-[240px]' : 'min-w-[200px]'}`} 
          style={{ backgroundColor: getBackgroundColor() }}
        >
          <div className="time-selection__header font-semibold text-gray-800 text-xs mb-1">
            {getHeaderText()}
          </div>
          <div className="time-selection__content w-full">
            {showFullPickerFor === 'single' ? (
              <div className="time-selection__custom-picker space-y-2 w-full">
                <div className="time-selection__custom-picker-controls flex gap-3 w-full px-2 sm:px-4 md:px-6 lg:px-8">
                  <div className="time-selection__hour-section flex-1 bg-white/50 rounded-lg p-3 custom-timer-parent">
                    <div className="time-selection__hour-grid grid grid-cols-6 gap-0.5 sm:gap-1">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <button 
                          key={h} 
                          onClick={() => setCustomTime({ ...customTime, hour: h.toString() })} 
                          className={`time-selection__hour-btn text-xs p-1 rounded-md font-semibold custom-timer-button-adjust ${customTime.hour === h.toString() ? 'bg-[#217e8f] text-white' : 'bg-white/80 text-[#217e8f] hover:bg-white hover:text-[#217e8f]'}`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="time-selection__minute-section bg-white/50 rounded-lg p-3 custom-timer-parent">
                    <div className="time-selection__minute-grid grid grid-cols-2 gap-1">
                      {['00', '15', '30', '45'].map(m => (
                        <button 
                          key={m} 
                          onClick={() => setCustomTime({ ...customTime, minute: m })} 
                          className={`time-selection__minute-btn text-xs p-1 rounded-md font-semibold custom-timer-button-adjust ${customTime.minute === m ? 'bg-[#217e8f] text-white' : 'bg-white/70 text-[#217e8f] hover:bg-white'}`}
                          disabled={!customTime.hour}
                        >
                          {`:${m}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="time-selection__ampm-section bg-white/50 rounded-lg p-3 custom-timer-parent">
                    <div className="time-selection__ampm-grid grid grid-cols-1 gap-1">
                      <button 
                        onClick={() => setCustomTime({ ...customTime, ampm: 'AM' })} 
                        className={`time-selection__ampm-btn time-selection__ampm-btn--am text-xs px-2 py-1 rounded-md font-semibold custom-timer-button-adjust ${customTime.ampm === 'AM' ? 'bg-[#217e8f] text-white' : 'bg-white/70 text-[#217e8f] hover:bg-white'}`}
                        disabled={!customTime.hour}
                      >
                        AM
                      </button>
                      <button 
                        onClick={() => setCustomTime({ ...customTime, ampm: 'PM' })} 
                        className={`time-selection__ampm-btn time-selection__ampm-btn--pm text-xs px-2 py-1 rounded-md font-semibold custom-timer-button-adjust ${customTime.ampm === 'PM' ? 'bg-[#217e8f] text-white' : 'bg-white/70 text-[#217e8f] hover:bg-white'}`}
                        disabled={!customTime.hour}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleButtonSelect(`${customTime.hour}:${customTime.minute} ${customTime.ampm}`)} 
                  disabled={!customTime.minute || !customTime.hour || !customTime.ampm} 
                  className="time-selection__set-time-btn mx-2 text-xs px-3 py-1 bg-[#217e8f] text-white rounded-md font-semibold hover:bg-[#1a6b7a] disabled:bg-gray-300 disabled:text-gray-500"
                >
                  Set Time
                </button>
                <button 
                  onClick={() => setShowFullPickerFor(null)} 
                  className="time-selection__back-to-scroll-btn w-full text-xs text-[#217e8f] hover:underline"
                >
                  ← Scrollable Time Options
                </button>
              </div>
            ) : (
              <div className="time-selection__scroll-picker">
                <button 
                  onClick={() => { 
                    setShowFullPickerFor('single'); 
                    setCustomTime({ hour: '', minute: '', ampm: '' }); 
                  }} 
                  className="time-selection__custom-time-btn w-full text-xs bg-[#217e8f]/20 text-[#1a6e7e] px-1 py-0.5 rounded-md hover:bg-[#217e8f]/30 sticky top-0 z-10 mb-1"
                >
                  Custom
                </button>
                <div ref={singleTimeScrollRef} className="time-selection__scrollable-options space-y-1 max-h-28 overflow-y-auto">
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
                        className="time-selection__time-option w-full text-xs bg-white/60 text-[#217e8f] px-1 py-0.5 rounded-md hover:bg-white"
                      >
                        {opt}
                      </button>
                    ));
                  })()}
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