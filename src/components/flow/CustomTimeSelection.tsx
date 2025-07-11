import React from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { roygbivColors } from '../../constants/flowColors';

interface Props {
  flowContext: FlowContext;
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
  editingTimeForDate: string | null;
  setEditingTimeForDate: (value: string | null) => void;
  showFullPickerFor: string | null;
  setShowFullPickerFor: (value: string | null) => void;
  customTime: { hour: string; minute: string; ampm: string };
  setCustomTime: (time: { hour: string; minute: string; ampm: string }) => void;
  scrollableTimeRef: React.RefObject<HTMLDivElement>;
  handleSetTimeForDate: (dateStr: string, time: string) => void;
  areAllTimesSet: boolean;
}

export const CustomTimeSelection: React.FC<Props> = ({
  flowContext,
  setFlowContext,
  editingTimeForDate,
  setEditingTimeForDate,
  showFullPickerFor,
  setShowFullPickerFor,
  customTime,
  setCustomTime,
  scrollableTimeRef,
  handleSetTimeForDate,
  areAllTimesSet
}) => {
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 7; h <= 21; h++) { // 7am to 9pm
      options.push(`${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
      options.push(`${h % 12 === 0 ? 12 : h % 12}:30 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
    }
    return options;
  };

  const handleContinue = () => {
    if (areAllTimesSet) {
      setFlowContext({...flowContext, step: 'repeatingSameLocation'});
    }
  };

  return (
    <div className="custom-time-selection bg-white rounded-lg shadow-sm p-3 mb-8">
      <div className="custom-time-selection__grid grid grid-cols-3 gap-2">
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
            <div key={qIndex} className="custom-time-selection__column space-y-2">
              {quarter.map((dateStr) => {
                // Timezone-safe date parsing
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                
                const dayOfWeekName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
                const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
                const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                
                const jsDay = date.getDay();
                const dayOfWeekIndex = jsDay === 0 ? 6 : jsDay - 1;
                const bgColor = roygbivColors[dayOfWeekIndex];

                const time = flowContext.eventPreview.dayBasedTimes?.[dateStr];
                const isEditing = editingTimeForDate === dateStr;
                const quickTimeOptions = generateTimeOptions();

                return (
                  <div key={dateStr} className="custom-time-selection__date-card flex flex-col items-center justify-between p-1.5 rounded-lg text-center border-2" style={{ backgroundColor: bgColor, borderColor: `color-mix(in srgb, ${bgColor} 90%, black)` }}>
                    <div className="custom-time-selection__date-header font-semibold text-gray-800 text-xs mb-1">{`${dayOfWeekName}, ${monthName} ${dayNum}`}</div>
                    <div className="custom-time-selection__time-picker time-all-dates mt-1 w-full flex-grow flex items-center justify-center">
                      {isEditing ? (
                        <div className="custom-time-selection__time-editor w-full time-all-dates">
                          {showFullPickerFor === dateStr ? (
                            customTime.hour === '' ? (
                              <div className="custom-time-selection__hour-grid grid grid-cols-4 gap-1 p-1 bg-white/50 rounded-lg">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                  <button 
                                    key={h} 
                                    onClick={() => setCustomTime({ ...customTime, hour: h.toString() })} 
                                    className="custom-time-selection__hour-btn text-xs font-semibold p-1 rounded-md bg-white/80 text-[#217e8f] hover:bg-white hover:text-[#1a6e7e]"
                                  >
                                    {h}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="custom-time-selection__minute-ampm-picker flex items-center justify-center gap-2">
                                <div className="custom-time-selection__minute-section flex flex-col gap-1">
                                  {['00', '15', '30', '45'].map(m => (
                                    <button 
                                      key={m} 
                                      onClick={() => setCustomTime({ ...customTime, minute: m })} 
                                      className={`custom-time-selection__minute-btn text-xs p-1 w-10 rounded-md font-semibold ${customTime.minute === m ? 'bg-[#217e8f] text-white' : 'bg-white/70 text-[#217e8f] hover:bg-white hover:text-[#1a6e7e]'}`}
                                    >
                                      {`:${m}`}
                                    </button>
                                  ))}
                                </div>
                                <div className="custom-time-selection__ampm-section flex flex-col gap-1">
                                  <button 
                                    onClick={() => handleSetTimeForDate(dateStr, `${customTime.hour}:${customTime.minute} AM`)} 
                                    disabled={!customTime.minute} 
                                    className="custom-time-selection__ampm-btn custom-time-selection__ampm-btn--am text-xs px-2 py-1 rounded-md bg-white/70 text-[#217e8f] font-semibold hover:bg-white hover:text-[#1a6e7e] disabled:bg-gray-200 disabled:text-gray-400"
                                  >
                                    AM
                                  </button>
                                  <button 
                                    onClick={() => handleSetTimeForDate(dateStr, `${customTime.hour}:${customTime.minute} PM`)} 
                                    disabled={!customTime.minute} 
                                    className="custom-time-selection__ampm-btn custom-time-selection__ampm-btn--pm text-xs px-2 py-1 rounded-md bg-white/70 text-[#217e8f] font-semibold hover:bg-white hover:text-[#1a6e7e] disabled:bg-gray-200 disabled:text-gray-400"
                                  >
                                    PM
                                  </button>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="custom-time-selection__time-options">
                              <button 
                                onClick={() => { 
                                  setShowFullPickerFor(dateStr); 
                                  setCustomTime({ hour: '', minute: '', ampm: '' }); 
                                }} 
                                className="custom-time-selection__custom-btn w-full text-xs bg-[#217e8f]/20 text-[#1a6e7e] px-1 py-0.5 rounded-md hover:bg-[#217e8f]/30 sticky top-0 z-10 mb-1"
                              >
                                Custom
                              </button>
                              <div ref={scrollableTimeRef} className="custom-time-selection__scrollable-options space-y-1 max-h-28 overflow-y-auto">
                                {quickTimeOptions.map(opt => (
                                  <button 
                                    key={opt} 
                                    data-time={opt} 
                                    onClick={() => handleSetTimeForDate(dateStr, opt)} 
                                    className="custom-time-selection__time-option w-full text-xs bg-white/60 text-[#217e8f] px-1 py-0.5 rounded-md hover:bg-white"
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : time ? (
                        <button
                          onClick={() => {
                            setEditingTimeForDate(dateStr);
                            setShowFullPickerFor(null);
                            // Pre-fill the custom picker with the existing time
                            const match = time.match(/(\d{1,4}):?(\d{2})?\s*(am|pm)/i);
                            if (match) {
                              let [, timeDigits, explicitMinutes, period] = match;
                              let hours, minutes;
                              
                              if (explicitMinutes) {
                                hours = timeDigits;
                                minutes = explicitMinutes;
                              } else if (timeDigits.length <= 2) {
                                hours = timeDigits;
                                minutes = '00';
                              } else {
                                hours = timeDigits.slice(0, -2);
                                minutes = timeDigits.slice(-2);
                              }
                              
                              const formattedHours = hours.padStart(2, '0');
                              const formattedMinutes = minutes.padStart(2, '0');
                              return `${formattedHours}:${formattedMinutes} ${period.toUpperCase()}`;
                            }
                            return time;
                          }}
                          className="custom-time-selection__selected-time text-sm font-semibold text-[#217e8f] px-2 py-1 rounded-md w-full"
                          style={{ 
                            backgroundColor: `color-mix(in srgb, ${bgColor} 40%, white)`,
                            borderColor: `color-mix(in srgb, ${bgColor} 85%, black)`,
                            borderWidth: '0.5px',
                            borderStyle: 'solid',
                            boxShadow: `0 0 2px color-mix(in srgb, ${bgColor} 85%, black)`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${bgColor} 50%, white)`;
                            e.currentTarget.style.borderColor = `color-mix(in srgb, ${bgColor} 90%, black)`;
                            e.currentTarget.style.boxShadow = `0 0 2px color-mix(in srgb, ${bgColor} 90%, black)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${bgColor} 40%, white)`;
                            e.currentTarget.style.borderColor = `color-mix(in srgb, ${bgColor} 85%, black)`;
                            e.currentTarget.style.boxShadow = `0 0 2px color-mix(in srgb, ${bgColor} 85%, black)`;
                          }}
                        >
                          {time}
                        </button>
                      ) : (
                        <button 
                          onClick={() => { 
                            setEditingTimeForDate(dateStr); 
                            setShowFullPickerFor(null); 
                          }} 
                          className="custom-time-selection__set-time-btn text-xs bg-black/5 text-[#217e8f] px-2 py-1 rounded-md hover:bg-black/10 w-full"
                        >
                          Set Time
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
      <div className="custom-time-selection__actions mt-4 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!areAllTimesSet}
          className="custom-time-selection__continue-btn bg-[#217e8f] text-white px-4 py-1 rounded-lg text-xs font-medium transition-colors enabled:hover:bg-[#1a6670] disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {areAllTimesSet ? 'Times Set' : 'Set Times'}
        </button>
      </div>
    </div>
  );
}; 