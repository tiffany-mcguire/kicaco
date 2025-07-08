import React, { useEffect } from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';
import { getUniqueDaysOfWeek } from '../../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../../constants/flowColors';

interface Props {
  flowContext: FlowContext;
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
  editingTimeForDay: number | null;
  setEditingTimeForDay: (value: number | null) => void;
  showFullPickerFor: string | null;
  setShowFullPickerFor: (value: string | null) => void;
  customTime: { hour: string; minute: string; ampm: string };
  setCustomTime: (time: { hour: string; minute: string; ampm: string }) => void;
  scrollableTimeRef: React.RefObject<HTMLDivElement>;
  handleSetTimeForDay: (dayIndex: number, time: string) => void;
}

export const DayBasedTimeGrid: React.FC<Props> = ({
  flowContext,
  setFlowContext,
  editingTimeForDay,
  setEditingTimeForDay,
  showFullPickerFor,
  setShowFullPickerFor,
  customTime,
  setCustomTime,
  scrollableTimeRef,
  handleSetTimeForDay
}) => {
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 7; h <= 21; h++) {
      options.push(`${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
      options.push(`${h % 12 === 0 ? 12 : h % 12}:30 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
    }
    return options;
  };

  // Scroll to noon when editing time for a day
  useEffect(() => {
    if (editingTimeForDay !== null && !showFullPickerFor && scrollableTimeRef.current) {
      // Scroll to noon-ish time
      const noonElement = scrollableTimeRef.current.querySelector('[data-time="12:00 PM"]');
      if (noonElement) {
        noonElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [editingTimeForDay, showFullPickerFor]);

  const isAllTimesSet = () => {
    const uniqueDays = getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []);
    return uniqueDays.every(day => {
      const dayIndex = parseInt(day.id.split('-')[1]);
      return !!flowContext.eventPreview.dayBasedTimes?.[dayIndex];
    });
  };

  const handleContinue = () => {
    if (isAllTimesSet()) {
      setFlowContext({
        ...flowContext, 
        step: (flowContext.eventPreview.selectedDates || []).length > 1 ? 'repeatingSameLocation' : 'whereLocation'
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
    <div className="day-based-time-grid bg-white rounded-lg shadow-sm p-3 mb-8">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="day-based-time-grid__grid grid grid-cols-4 gap-2">
        {(() => {
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          
          // Create 4 columns: Mon-Thu in first positions, Fri-Sun in next positions
          const columns: Array<Array<number>> = Array.from({ length: 4 }, () => []);
          
          // Place Monday-Thursday in columns 0-3
          for (let dayIndex = 0; dayIndex <= 3; dayIndex++) {
            columns[dayIndex].push(dayIndex);
          }
          
          // Place Friday-Sunday in columns 0-2 (below Mon-Thu)
          for (let dayIndex = 4; dayIndex <= 6; dayIndex++) {
            columns[dayIndex - 4].push(dayIndex);
          }
          
          return columns.map((column, colIndex) => (
            <div key={`col${colIndex}`} className="day-based-time-grid__column space-y-2">
              {column.map((dayIndex) => {
                const bgColor = roygbivColors[dayIndex];
                const time = flowContext.eventPreview.dayBasedTimes?.[dayIndex];
                const isEditing = editingTimeForDay === dayIndex;
                const hasSelectedDates = dayHasSelectedDates(dayIndex);
                const datesForThisDay = getDatesForDay(dayIndex);
                const quickTimeOptions = generateTimeOptions();
                const hasMoreThanFourDates = datesForThisDay.length > 4;

                return (
                  <div 
                    key={dayIndex} 
                    className={`day-based-time-grid__day-card flex flex-col p-1.5 rounded-lg ${
                      hasSelectedDates ? 'border-2' : 'opacity-40'
                    } max-[375px]:mx-[-2px]`}
                    style={{ 
                      backgroundColor: bgColor,
                      borderColor: hasSelectedDates ? `color-mix(in srgb, ${bgColor} 90%, black)` : 'transparent',
                      minHeight: '200px'
                    }}
                  >
                    {/* Day name header */}
                    <div className="day-based-time-grid__day-header font-semibold text-gray-800 text-xs mb-2 text-center max-[375px]:text-[11px]">
                      {dayNames[dayIndex]}
                    </div>
                    
                    {/* Time picker area - natural height */}
                    <div className="day-based-time-grid__time-picker w-full mb-2">
                      {!hasSelectedDates ? (
                        <div className="day-based-time-grid__no-dates text-xs text-gray-600 text-center py-2 bg-white/30 rounded-md">
                          No dates selected
                        </div>
                      ) : isEditing ? (
                        <div className="day-based-time-grid__time-editor w-full">
                          {showFullPickerFor === `day-${dayIndex}` ? (
                            customTime.hour === '' ? (
                              <div className="day-based-time-grid__hour-grid grid grid-cols-3 gap-1 p-1 bg-white/50 rounded-lg">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                  <button 
                                    key={h} 
                                    onClick={() => setCustomTime({ ...customTime, hour: h.toString() })} 
                                    className="day-based-time-grid__hour-btn text-xs font-semibold p-1 rounded-md bg-white/80 text-[#217e8f] hover:bg-white hover:text-[#1a6e7e]"
                                  >
                                    {h}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="day-based-time-grid__minute-ampm-picker flex items-center justify-center gap-1">
                                <div className="day-based-time-grid__minute-section flex flex-col gap-1">
                                  {['00', '15', '30', '45'].map(m => (
                                    <button 
                                      key={m} 
                                      onClick={() => setCustomTime({ ...customTime, minute: m })} 
                                      className={`day-based-time-grid__minute-btn text-xs p-1 w-8 rounded-md font-semibold ${customTime.minute === m ? 'bg-[#217e8f] text-white' : 'bg-white/70 text-[#217e8f] hover:bg-white hover:text-[#1a6e7e]'}`}
                                    >
                                      {`:${m}`}
                                    </button>
                                  ))}
                                </div>
                                <div className="day-based-time-grid__ampm-section flex flex-col gap-1">
                                  <button 
                                    onClick={() => handleSetTimeForDay(dayIndex, `${customTime.hour}:${customTime.minute} AM`)} 
                                    disabled={!customTime.minute} 
                                    className="day-based-time-grid__ampm-btn day-based-time-grid__ampm-btn--am text-xs px-1 py-1 rounded-md bg-white/70 text-[#217e8f] font-semibold hover:bg-white hover:text-[#1a6e7e] disabled:bg-gray-200 disabled:text-gray-400"
                                  >
                                    AM
                                  </button>
                                  <button 
                                    onClick={() => handleSetTimeForDay(dayIndex, `${customTime.hour}:${customTime.minute} PM`)} 
                                    disabled={!customTime.minute} 
                                    className="day-based-time-grid__ampm-btn day-based-time-grid__ampm-btn--pm text-xs px-1 py-1 rounded-md bg-white/70 text-[#217e8f] font-semibold hover:bg-white hover:text-[#1a6e7e] disabled:bg-gray-200 disabled:text-gray-400"
                                  >
                                    PM
                                  </button>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="day-based-time-grid__time-options">
                              <button 
                                onClick={() => { 
                                  setShowFullPickerFor(`day-${dayIndex}`); 
                                  setCustomTime({ hour: '', minute: '', ampm: '' }); 
                                }} 
                                className="day-based-time-grid__custom-btn w-full text-xs bg-[#217e8f]/20 text-[#1a6e7e] px-1 py-0.5 rounded-md hover:bg-[#217e8f]/30 max-[375px]:text-[11px] max-[375px]:px-0.5 sticky top-0 z-10 mb-1"
                              >
                                Custom
                              </button>
                              <div 
                                ref={scrollableTimeRef}
                                className="day-based-time-grid__scrollable-options space-y-1 overflow-y-auto hide-scrollbar max-h-20"
                                style={{
                                  scrollbarWidth: 'none',
                                  msOverflowStyle: 'none'
                                } as React.CSSProperties}
                              >
                                {quickTimeOptions.map(opt => (
                                  <button 
                                    key={opt} 
                                    data-time={opt} 
                                    onClick={() => handleSetTimeForDay(dayIndex, opt)} 
                                    className="day-based-time-grid__time-option w-full text-xs bg-white/60 text-[#217e8f] px-1 py-0.5 rounded-md hover:bg-white max-[375px]:text-[11px] max-[375px]:px-0.5"
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
                            setEditingTimeForDay(dayIndex);
                            setShowFullPickerFor(null);
                            // Pre-fill the custom picker with the existing time
                            const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                            if (match) {
                              setCustomTime({ hour: match[1], minute: match[2], ampm: match[3] });
                            }
                          }}
                          className="day-based-time-grid__selected-time text-xs font-semibold text-[#217e8f] bg-white/60 px-2 py-1 rounded-md hover:bg-white w-full max-[375px]:text-[11px] max-[375px]:px-1"
                        >
                          {time}
                        </button>
                      ) : (
                        <button 
                          onClick={() => { 
                            setEditingTimeForDay(dayIndex); 
                            setShowFullPickerFor(null); 
                          }} 
                          className="day-based-time-grid__set-time-btn text-xs bg-black/5 text-[#217e8f] px-2 py-1 rounded-md hover:bg-black/10 w-full"
                        >
                          Set Time
                        </button>
                      )}
                    </div>
                  
                    {/* Date slots area - positioned immediately below time picker */}
                    <div className="day-based-time-grid__date-slots w-full">
                      {hasSelectedDates ? (
                        <>
                          <div 
                            className="day-based-time-grid__date-list space-y-1 hide-scrollbar"
                            style={{
                              height: '112px', // Fixed height for all containers (4 slots × 28px each)
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
                                  className="day-based-time-grid__date-item text-[10px] px-1 py-1 rounded text-center text-gray-700 font-medium bg-white/30 max-[375px]:text-[9px] max-[375px]:px-0.5 whitespace-nowrap flex items-center justify-center"
                                  style={{ height: '24px', minHeight: '24px' }}
                                >
                                  {dayOfWeekName} {monthName} {dayNum}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Helper text for overflow - always reserve space */}
                          <div className="day-based-time-grid__scroll-hint text-[9px] text-gray-500 text-center italic mt-1" style={{ height: '14px' }}>
                            {hasMoreThanFourDates ? 'Scroll for more' : ''}
                          </div>
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
      <div className="day-based-time-grid__actions mt-4 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!isAllTimesSet()}
          className="day-based-time-grid__continue-btn bg-[#217e8f] text-white px-4 py-1 rounded-lg text-xs font-medium transition-colors enabled:hover:bg-[#1a6670] disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isAllTimesSet() ? 'Times Set' : 'Set Times'}
        </button>
      </div>
    </div>
  );
}; 