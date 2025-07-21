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
    for (let h = 7; h <= 21; h++) {
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

  const getFormattedDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeekName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    return { dayOfWeekName, dayNum, monthName };
  };

  const getDayOfWeekIndex = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const jsDay = date.getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  };

  const renderDateCard = (dateStr: string) => {
    const { dayOfWeekName, dayNum, monthName } = getFormattedDate(dateStr);
    const dayOfWeekIndex = getDayOfWeekIndex(dateStr);
    const bgColor = roygbivColors[dayOfWeekIndex];
    const time = flowContext.eventPreview.dayBasedTimes?.[dateStr];
    const isEditing = editingTimeForDate === dateStr;
    const quickTimeOptions = generateTimeOptions();

    return (
      <div 
        key={dateStr} 
        className="custom-time-selection__date-card flex flex-col rounded-lg border-2 overflow-hidden" 
        style={{ 
          backgroundColor: bgColor,
          borderColor: `color-mix(in srgb, ${bgColor} 90%, black)`
        }}
      >
        {isEditing && (
          <div className="custom-time-selection__date-header text-center px-4 pt-4 pb-2">
            <h3 className="font-semibold text-gray-800 text-[13px]">
              {dayOfWeekName}, {monthName} {dayNum}
            </h3>
          </div>
        )}

        <div className="custom-time-selection__time-display px-1 py-2">
          {time && !isEditing && (
            <div className="px-1">
              <button
                onClick={() => {
                  setEditingTimeForDate(dateStr);
                  setShowFullPickerFor(null);
                  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                  if (match) {
                    setCustomTime({ hour: match[1], minute: match[2], ampm: match[3] });
                  }
                }}
                className="custom-time-selection__selected-time w-full text-[13px] font-semibold text-[#217e8f] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: `color-mix(in srgb, ${bgColor} 30%, white)`,
                  borderColor: `color-mix(in srgb, ${bgColor} 70%, black)`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  boxShadow: `0 2px 4px color-mix(in srgb, ${bgColor} 50%, black)`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${bgColor} 40%, white)`;
                  e.currentTarget.style.borderColor = `color-mix(in srgb, ${bgColor} 80%, black)`;
                  e.currentTarget.style.boxShadow = `0 4px 8px color-mix(in srgb, ${bgColor} 60%, black)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${bgColor} 30%, white)`;
                  e.currentTarget.style.borderColor = `color-mix(in srgb, ${bgColor} 70%, black)`;
                  e.currentTarget.style.boxShadow = `0 2px 4px color-mix(in srgb, ${bgColor} 50%, black)`;
                }}
              >
                <span className="font-semibold text-gray-800">{monthName} {dayNum}</span>
                <span>|</span>
                <span>{time}</span>
              </button>
            </div>
          )}

          {isEditing && showFullPickerFor === dateStr && (
            <div className="custom-time-selection__custom-picker space-y-3 w-full px-1 sm:px-2">
              <div className="custom-time-selection__hour-section bg-white/50 rounded-lg p-1">
                <div className="text-center text-xs font-semibold text-gray-600 mb-2">Select Hour</div>
                <div className="custom-time-selection__hour-grid grid grid-cols-6 gap-0.5 sm:gap-1">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <button 
                      key={h}
                      onClick={() => setCustomTime({ ...customTime, hour: h.toString() })}
                      className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold border-2 ${
                        customTime.hour === h.toString()
                          ? 'bg-[#2f8fa4] text-white border-[#217e8f]'
                          : 'bg-white/80 text-[#217e8f] hover:bg-white hover:text-[#217e8f] border-[#217e8f]/30'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="custom-time-selection__minute-section bg-white/50 rounded-lg p-1">
                <div className="text-center text-xs font-semibold text-gray-600 mb-2">Minute</div>
                <div className="custom-time-selection__minute-grid grid grid-cols-4 gap-0.5 sm:gap-1">
                  {['00', '15', '30', '45'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setCustomTime({ ...customTime, minute: m })}
                      className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold border-2 ${
                        customTime.minute === m
                          ? 'bg-[#2f8fa4] text-white border-[#217e8f]'
                          : 'bg-white/80 text-[#217e8f] hover:bg-white hover:text-[#217e8f] border-[#217e8f]/30'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="custom-time-selection__ampm-section bg-white/50 rounded-lg p-1">
                <div className="text-center text-xs font-semibold text-gray-600 mb-2">AM/PM</div>
                <div className="custom-time-selection__ampm-grid grid grid-cols-2 gap-0.5 sm:gap-1">
                  {['AM', 'PM'].map(period => (
                    <button 
                      key={period}
                      onClick={() => setCustomTime({ ...customTime, ampm: period })}
                      className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold border-2 ${
                        customTime.ampm === period
                          ? 'bg-[#2f8fa4] text-white border-[#217e8f]'
                          : 'bg-white/80 text-[#217e8f] hover:bg-white hover:text-[#217e8f] border-[#217e8f]/30'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="py-6">
                <button 
                  onClick={() => handleSetTimeForDate(dateStr, `${customTime.hour}:${customTime.minute} ${customTime.ampm}`)} 
                  disabled={!customTime.minute || !customTime.hour || !customTime.ampm} 
                  className={`custom-time-selection__set-time-btn w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors border-2 ${
                    (customTime.minute && customTime.hour && customTime.ampm) 
                      ? 'bg-[#2f8fa4] text-white hover:bg-[#217e8f] active:scale-95 border-[#217e8f]' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                  }`}
                >
                  {(customTime.minute && customTime.hour && customTime.ampm) ? 'Confirm Time' : 'Select Time'}
                </button>
              </div>
              <button 
                onClick={() => setShowFullPickerFor(null)} 
                className="custom-time-selection__back-btn w-full text-xs md:text-[13px] text-[#217e8f] whitespace-nowrap"
              >
                ← Scrollable Time
              </button>
            </div>
          )}

          {isEditing && showFullPickerFor !== dateStr && (
            <div className="custom-time-selection__scroll-picker">
              <div className="px-1">
                <button 
                  onClick={() => { 
                    setShowFullPickerFor(dateStr); 
                    setCustomTime({ hour: '', minute: '', ampm: '' }); 
                  }} 
                  className="custom-time-selection__custom-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 sticky top-0 z-10 flex justify-center"
                >
                  Custom
                </button>
              </div>
              
              <div className="custom-time-selection__time-content h-[240px] flex flex-col px-1">
                <div ref={scrollableTimeRef} className="custom-time-selection__scrollable-options space-y-[8.5px] flex-1 overflow-y-auto hide-scrollbar pt-[8.5px]">
                  {quickTimeOptions.map((opt) => {
                    const isSelected = flowContext.eventPreview.dayBasedTimes?.[dateStr] === opt;
                    return (
                      <button
                        key={opt}
                        data-time={opt}
                        onClick={() => {
                          const newTimes = { ...flowContext.eventPreview.dayBasedTimes };
                          if (isSelected) {
                            delete newTimes[dateStr];
                          } else {
                            newTimes[dateStr] = opt;
                          }
                          setFlowContext(prev => ({
                            ...prev,
                            eventPreview: {
                              ...prev.eventPreview,
                              dayBasedTimes: newTimes
                            }
                          }));
                        }}
                        className={`custom-time-selection__time-option w-full text-[13px] px-1 py-1.5 rounded-lg transition-all duration-200 ${
                          isSelected 
                            ? 'bg-white text-[#217e8f] border-2 border-emerald-500 font-semibold shadow-lg shadow-emerald-500/30 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-2 ring-emerald-500/25' 
                            : 'text-[#217e8f] hover:bg-white'
                        } flex justify-center`}
                        style={!isSelected ? { backgroundColor: 'rgba(255, 255, 255, 0.6)' } : {}}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                
                <div className="custom-time-selection__confirm-container h-8 flex items-center flex-shrink-0">
                  <button
                    onClick={() => {
                      const selectedTime = flowContext.eventPreview.dayBasedTimes?.[dateStr];
                      if (selectedTime) {
                        handleSetTimeForDate(dateStr, selectedTime);
                        setEditingTimeForDate(null);
                      }
                    }}
                    disabled={!flowContext.eventPreview.dayBasedTimes?.[dateStr]}
                    className={`custom-time-selection__confirm w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors border-2 ${
                      flowContext.eventPreview.dayBasedTimes?.[dateStr] 
                        ? 'bg-[#2f8fa4] text-white hover:bg-[#217e8f] active:scale-95 border-[#217e8f]' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                    }`}
                  >
                    {flowContext.eventPreview.dayBasedTimes?.[dateStr] ? 'Confirm Time' : 'Select Time'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!time && !isEditing && (
            <div className="px-1">
              <button 
                onClick={() => { 
                  setEditingTimeForDate(dateStr); 
                  setShowFullPickerFor(null); 
                }} 
                className="custom-time-selection__set-time-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 transition-colors flex items-center justify-center gap-2"
              >
                <span className="font-semibold text-gray-800">{monthName} {dayNum}</span>
                <span>|</span>
                <span>Set Time</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const dates = [...(flowContext.eventPreview.selectedDates || [])].sort();
  const leftColumnDates = dates.filter((_, index) => index % 2 === 0);
  const rightColumnDates = dates.filter((_, index) => index % 2 === 1);

  return (
    <div className="custom-time-selection bg-white rounded-lg shadow-sm p-3 mb-8">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <div className="custom-time-selection__dates flex gap-3">
        <div className="flex-1 space-y-3 min-w-0">
          {leftColumnDates.map(renderDateCard)}
        </div>
        
        <div className="flex-1 space-y-3 min-w-0">
          {rightColumnDates.map(renderDateCard)}
        </div>
      </div>
      
      
      <div className="custom-time-selection__actions mt-4 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!areAllTimesSet}
          className="custom-time-selection__continue-btn bg-[#2f8fa4] text-white rounded-md font-medium transition-colors enabled:hover:bg-[#217e8f] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center border-2 border-[#217e8f] disabled:border-gray-300"
          style={{
            width: '115px',
            height: '30px',
            fontSize: '13px',
            lineHeight: '20px',
            fontWeight: 500,
            borderRadius: '6px',
            padding: '0px 8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          {areAllTimesSet ? 'Times Set' : 'Set Times'}
        </button>
      </div>
    </div>
  );
}; 