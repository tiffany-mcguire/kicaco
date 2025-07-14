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

interface TimeSelectionProps extends Props {
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
}

export const TimeSelection: React.FC<TimeSelectionProps> = ({
  flowContext,
  showFullPickerFor,
  setShowFullPickerFor,
  customTime,
  setCustomTime,
  singleTimeScrollRef,
  handleButtonSelect,
  setFlowContext
}) => {
  const handleTimeSelect = (time: string) => {
    // Toggle selection - if already selected, deselect it
    if (flowContext.eventPreview.time === time) {
      setFlowContext({
        ...flowContext,
        eventPreview: {
          ...flowContext.eventPreview,
          time: undefined
        }
      });
    } else {
      setFlowContext({
        ...flowContext,
        eventPreview: {
          ...flowContext.eventPreview,
          time: time
        }
      });
    }
  };

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
          <div className="time-selection__date-grid-hint text-[11px] text-gray-500 text-center mb-2">Selected dates ({flowContext.eventPreview.selectedDates.length} total)</div>
          <div className="time-selection__date-grid-container grid grid-cols-4 gap-2">
            {(() => {
              const dates = [...(flowContext.eventPreview.selectedDates || [])].sort();
              const columns: string[][] = [[], [], [], []];
              dates.forEach((dateStr, idx) => {
                columns[idx % 4].push(dateStr);
              });
              return columns.map((column, colIndex) => (
                <div key={colIndex} className="time-selection__date-quarter space-y-1">
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
                        className="time-selection__date-item text-[12px] px-3 py-2 rounded text-gray-700 font-medium whitespace-nowrap flex items-center justify-center"
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
          <div className="time-selection__header font-semibold text-gray-700 text-[13px] mb-2 px-2 py-1">
            {getHeaderText()}
          </div>
          <div className="time-selection__content w-full">
            {showFullPickerFor === 'single' ? (
              <div className="time-selection__custom-picker space-y-2 w-full">
                <div className="time-selection__custom-picker-controls flex w-full">
                  <div className="time-selection__hour-section flex-[4] bg-white/50 rounded-lg p-1">
                    <div className="text-center text-xs font-semibold text-gray-600 mb-2">Select Hour</div>
                    <div className="time-selection__hour-grid grid grid-cols-6 gap-0.5 sm:gap-1">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <button 
                          key={h} 
                          onClick={() => setCustomTime({ ...customTime, hour: h.toString() })} 
                          className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold ${
                            customTime.hour === h.toString()
                              ? 'bg-[#217e8f] text-white'
                              : 'bg-white/80 text-[#217e8f] hover:bg-white hover:text-[#217e8f]'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="w-2"></div>
                  <div className="time-selection__minute-section flex-[1.5] bg-white/50 rounded-lg p-1">
                    <div className="text-center text-xs font-semibold text-gray-600 mb-2">Minute</div>
                    <div className="time-selection__minute-grid grid grid-cols-2 gap-0.5 sm:gap-1">
                      {['00', '15', '30', '45'].map(m => (
                        <button 
                          key={m} 
                          onClick={() => setCustomTime({ ...customTime, minute: m })} 
                          className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold ${
                            customTime.minute === m
                              ? 'bg-[#217e8f] text-white'
                              : 'bg-white/80 text-[#217e8f] hover:bg-white hover:text-[#217e8f]'
                          }`}
                          disabled={!customTime.hour}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="w-2"></div>
                  <div className="time-selection__ampm-section flex-1 bg-white/50 rounded-lg p-1">
                    <div className="text-center text-xs font-semibold text-gray-600 mb-2">AM/PM</div>
                    <div className="time-selection__ampm-grid grid grid-cols-1 gap-0.5 sm:gap-1">
                      {['AM', 'PM'].map(period => (
                        <button 
                          key={period}
                          onClick={() => setCustomTime({ ...customTime, ampm: period })} 
                          className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold ${
                            customTime.ampm === period
                              ? 'bg-[#217e8f] text-white'
                              : 'bg-white/80 text-[#217e8f] hover:bg-white hover:text-[#217e8f]'
                          }`}
                          disabled={!customTime.hour}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="py-6">
                  <button 
                    onClick={() => handleButtonSelect(`${customTime.hour}:${customTime.minute} ${customTime.ampm}`)} 
                    disabled={!customTime.minute || !customTime.hour || !customTime.ampm} 
                    className={`time-selection__set-time-btn w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors ${
                      (customTime.minute && customTime.hour && customTime.ampm) 
                        ? 'bg-[#217e8f] text-white hover:bg-[#1a6b7a] active:scale-95' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {(customTime.minute && customTime.hour && customTime.ampm) ? 'Confirm Time' : 'Select Time'}
                  </button>
                </div>
                <button 
                  onClick={() => setShowFullPickerFor(null)} 
                  className="time-selection__back-to-scroll-btn w-full text-[13px] text-[#217e8f]"
                >
                  ← Scrollable Time
                </button>
              </div>
            ) : (
              <div className="time-selection__scroll-picker">
                <button 
                  onClick={() => { 
                    setShowFullPickerFor('single'); 
                    setCustomTime({ hour: '', minute: '', ampm: '' }); 
                  }} 
                  className="time-selection__custom-time-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] px-1 py-1.5 rounded-lg hover:bg-[#217e8f]/30 sticky top-0 z-10 flex justify-center"
                >
                  Custom
                </button>
                {/* Fixed height container for time options */}
                <div className="time-selection__time-content h-[240px] flex flex-col">
                  {/* Scrollable time options */}
                  <div ref={singleTimeScrollRef} className="time-selection__scrollable-options space-y-[8.5px] flex-1 overflow-y-auto scrollbar-hide pt-[8.5px]">
                    {(() => {
                      const options = [];
                      for (let h = 7; h <= 21; h++) {
                        options.push(`${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
                        options.push(`${h % 12 === 0 ? 12 : h % 12}:30 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
                      }
                      return options.map(opt => {
                        const isSelected = flowContext.eventPreview.time === opt;
                        return (
                                                  <button 
                          key={opt} 
                          data-time={opt} 
                          onClick={() => handleTimeSelect(opt)} 
                          className={`time-selection__time-option w-full text-[13px] px-1 py-1.5 rounded-lg transition-all duration-200 ${
                            isSelected 
                              ? 'bg-white text-[#217e8f] border-2 border-emerald-500 font-semibold shadow-lg shadow-emerald-500/30 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-2 ring-emerald-500/25' 
                              : 'text-[#217e8f] hover:bg-white'
                          } flex justify-center`}
                          style={!isSelected ? { backgroundColor: 'rgba(255, 255, 255, 0.6)' } : {}}
                        >
                          {opt}
                        </button>
                        );
                      });
                    })()}
                  </div>
                  
                  {/* Fixed position confirm button - always at bottom */}
                  <div className="time-selection__confirm-container h-8 flex items-center flex-shrink-0">
                    <button
                      onClick={() => {
                        if (flowContext.eventPreview.time) {
                          handleButtonSelect(flowContext.eventPreview.time);
                        }
                      }}
                      disabled={!flowContext.eventPreview.time}
                      className={`time-selection__confirm w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors ${
                        flowContext.eventPreview.time 
                          ? 'bg-[#217e8f] text-white hover:bg-[#1a6b7a] active:scale-95' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {flowContext.eventPreview.time ? 'Confirm Time' : 'Select Time'}
                    </button>
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