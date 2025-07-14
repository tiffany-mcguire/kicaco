import React, { useEffect, useState } from 'react';
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
  const [expandedDates, setExpandedDates] = useState<{[key: number]: boolean}>({});
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
      
      <div className="day-based-time-grid__days flex gap-3">
        {/* Left Column - Monday, Tuesday, Wednesday, Thursday */}
        <div className="flex-1 space-y-3 min-w-0">
          {[0, 1, 2, 3].filter(dayIndex => dayHasSelectedDates(dayIndex)).map((dayIndex) => {
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const bgColor = roygbivColors[dayIndex];
            const time = flowContext.eventPreview.dayBasedTimes?.[dayIndex];
            const isEditing = editingTimeForDay === dayIndex;
            const datesForThisDay = getDatesForDay(dayIndex);
            const quickTimeOptions = generateTimeOptions();

            return (
              <div 
                key={dayIndex} 
                className="day-based-time-grid__day-card flex flex-col rounded-lg border-2 overflow-hidden" 
                style={{ 
                  backgroundColor: bgColor,
                  borderColor: `color-mix(in srgb, ${bgColor} 90%, black)`
                }}
              >
                {/* Day Header - Only when time selection is expanded */}
                {isEditing && (
                  <div className="day-based-time-grid__day-header text-center px-4 pt-4 pb-2">
                    <h3 className="font-semibold text-gray-800 text-xs md:text-sm">
                      {dayNames[dayIndex]}
                    </h3>
                  </div>
                )}

                {/* Time Button/Display with Day Name - Always Visible */}
                <div className={`day-based-time-grid__time-display px-1 ${isEditing ? 'pb-2' : 'pt-3 pb-1'}`}>
                  {time && !isEditing ? (
                    <div className="px-1">
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
                        className="day-based-time-grid__selected-time w-full text-[13px] font-semibold text-[#217e8f] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
                        <span className="font-semibold text-gray-800">{dayNames[dayIndex]}</span>
                        <span>{time}</span>
                      </button>
                    </div>
                  ) : isEditing ? (
                    <div className="day-based-time-grid__time-picker w-full">
                      {showFullPickerFor === `day-${dayIndex}` ? (
                        <div className="day-based-time-grid__custom-picker space-y-3 w-full px-1 sm:px-2">
                          {/* Hour Keypad - Top Row */}
                          <div className="day-based-time-grid__hour-section bg-white/50 rounded-lg p-1">
                            <div className="text-center text-xs font-semibold text-gray-600 mb-2">Select Hour</div>
                            <div className="day-based-time-grid__hour-grid grid grid-cols-6 gap-0.5 sm:gap-1">
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

                          <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-2">
                            {/* Minutes */}
                            <div className="bg-white/50 rounded-lg p-1 sm:p-2 col-span-3">
                              <div className="text-center text-xs font-semibold text-gray-600 mb-2">Minutes</div>
                              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                                {['00', '15', '30', '45'].map(m => (
                                  <button 
                                    key={m}
                                    onClick={() => setCustomTime({ ...customTime, minute: m })}
                                    className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold ${
                                      customTime.minute === m
                                        ? 'bg-[#217e8f] text-white'
                                        : 'bg-white/70 text-[#217e8f] hover:bg-white'
                                    }`}
                                    disabled={!customTime.hour}
                                  >
                                    :{m}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* AM/PM */}
                            <div className="bg-white/50 rounded-lg p-1 sm:p-2 col-span-2">
                              <div className="text-center text-xs font-semibold text-gray-600 mb-2">AM/PM</div>
                              <div className="grid grid-cols-1 gap-1 sm:gap-2">
                                {['AM', 'PM'].map(period => (
                                  <button
                                    key={period}
                                    onClick={() => setCustomTime({ ...customTime, ampm: period })}
                                    className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold ${
                                      customTime.ampm === period
                                        ? 'bg-[#217e8f] text-white'
                                        : 'bg-white/70 text-[#217e8f] hover:bg-white'
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
                              onClick={() => handleSetTimeForDay(dayIndex, `${customTime.hour}:${customTime.minute} ${customTime.ampm}`)} 
                              disabled={!customTime.minute || !customTime.hour || !customTime.ampm} 
                              className="day-based-time-grid__set-time-btn mx-auto bg-[#217e8f] text-white rounded-md font-semibold hover:bg-[#1a6b7a] disabled:bg-gray-300 disabled:text-gray-500"
                              style={{
                                width: '115px',
                                height: '30px',
                                fontSize: '13px',
                                lineHeight: '20px',
                                padding: '0px 8px',
                                borderRadius: '6px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                              }}
                            >
                              Set Time
                            </button>
                          </div>
                          <button 
                            onClick={() => setShowFullPickerFor(null)} 
                            className="day-based-time-grid__back-btn w-full text-xs md:text-[13px] text-[#217e8f] whitespace-nowrap"
                          >
                            ← Scrollable Time
                          </button>
                        </div>
                      ) : (
                        <div className="day-based-time-grid__scroll-picker">
                          <div className="px-1">
                            <button 
                              onClick={() => { 
                                setShowFullPickerFor(`day-${dayIndex}`); 
                                setCustomTime({ hour: '', minute: '', ampm: '' }); 
                              }} 
                              className="day-based-time-grid__custom-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 sticky top-0 z-10 flex justify-center"
                            >
                              Custom
                            </button>
                          </div>
                          
                          {/* Fixed height container for time options */}
                          <div className="day-based-time-grid__time-content h-[240px] flex flex-col px-1">
                            {/* Scrollable time options */}
                            <div ref={scrollableTimeRef} className="day-based-time-grid__scrollable-options space-y-[8.5px] flex-1 overflow-y-auto hide-scrollbar">
                              {quickTimeOptions.map((opt) => {
                                const isSelected = flowContext.eventPreview.dayBasedTimes?.[dayIndex] === opt;
                                return (
                                  <button
                                    key={opt}
                                    data-time={opt}
                                    onClick={() => {
                                      setFlowContext(prev => ({
                                        ...prev,
                                        eventPreview: {
                                          ...prev.eventPreview,
                                          dayBasedTimes: {
                                            ...prev.eventPreview.dayBasedTimes,
                                            [dayIndex]: isSelected ? undefined : opt
                                          }
                                        }
                                      }));
                                    }}
                                    className={`day-based-time-grid__time-option w-full text-[13px] px-1 py-1.5 rounded-lg transition-all duration-200 ${
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
                            
                            {/* Fixed position confirm button - always at bottom */}
                            <div className="day-based-time-grid__confirm-container h-8 flex items-center flex-shrink-0">
                              <button
                                onClick={() => {
                                  const selectedTime = flowContext.eventPreview.dayBasedTimes?.[dayIndex];
                                  if (selectedTime) {
                                    handleSetTimeForDay(dayIndex, selectedTime);
                                    setEditingTimeForDay(null);
                                  }
                                }}
                                disabled={!flowContext.eventPreview.dayBasedTimes?.[dayIndex]}
                                className={`day-based-time-grid__confirm w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors ${
                                  flowContext.eventPreview.dayBasedTimes?.[dayIndex] 
                                    ? 'bg-[#217e8f] text-white hover:bg-[#1a6b7a] active:scale-95' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {flowContext.eventPreview.dayBasedTimes?.[dayIndex] ? 'Confirm Time' : 'Select Time'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-1">
                      <button 
                        onClick={() => { 
                          setEditingTimeForDay(dayIndex); 
                          setShowFullPickerFor(null); 
                        }} 
                        className="day-based-time-grid__set-time-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="font-semibold text-gray-800">{dayNames[dayIndex]}</span>
                        <span>Set Time</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Dates Section - Collapsible */}
                <div className="day-based-time-grid__dates-section bg-white/10 px-4 py-2">
                  <button
                    onClick={() => setExpandedDates(prev => ({...prev, [dayIndex]: !prev[dayIndex]}))}
                    className="w-full text-center text-[11px] md:text-xs text-gray-500 mb-2 hover:text-gray-700 transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    <span>{expandedDates[dayIndex] ? '−' : '+'}</span>
                    <span>Selected dates ({datesForThisDay.length} total)</span>
                  </button>
                  {expandedDates[dayIndex] && (
                    <div className="day-based-time-grid__date-list grid grid-cols-2 gap-2 justify-items-center">
                      {datesForThisDay.map((dateStr) => {
                        const [year, month, day] = dateStr.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                        const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
                        
                        return (
                          <div 
                            key={dateStr} 
                            className="day-based-time-grid__date-item text-xs py-1 rounded bg-white/40 text-gray-700 font-medium whitespace-nowrap text-center w-[50px]"
                          >
                            {monthName} {dayNum}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Right Column - Friday, Saturday, Sunday */}
        <div className="flex-1 space-y-3 min-w-0">
          {[4, 5, 6].filter(dayIndex => dayHasSelectedDates(dayIndex)).map((dayIndex) => {
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const bgColor = roygbivColors[dayIndex];
            const time = flowContext.eventPreview.dayBasedTimes?.[dayIndex];
            const isEditing = editingTimeForDay === dayIndex;
            const datesForThisDay = getDatesForDay(dayIndex);
            const quickTimeOptions = generateTimeOptions();

            return (
              <div 
                key={dayIndex} 
                className="day-based-time-grid__day-card flex flex-col rounded-lg border-2 overflow-hidden" 
                style={{ 
                  backgroundColor: bgColor,
                  borderColor: `color-mix(in srgb, ${bgColor} 90%, black)`
                }}
              >
                {/* Day Header - Only when time selection is expanded */}
                {isEditing && (
                  <div className="day-based-time-grid__day-header text-center px-4 pt-4 pb-2">
                    <h3 className="font-semibold text-gray-800 text-xs md:text-sm">
                      {dayNames[dayIndex]}
                    </h3>
                  </div>
                )}

                {/* Time Button/Display with Day Name - Always Visible */}
                <div className={`day-based-time-grid__time-display px-1 ${isEditing ? 'pb-2' : 'pt-3 pb-1'}`}>
                  {time && !isEditing ? (
                    <div className="px-1">
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
                        className="day-based-time-grid__selected-time w-full text-[13px] font-semibold text-[#217e8f] py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
                        <span className="font-semibold text-gray-800">{dayNames[dayIndex]}</span>
                        <span>{time}</span>
                      </button>
                    </div>
                  ) : isEditing ? (
                    <div className="day-based-time-grid__time-picker w-full">
                      {showFullPickerFor === `day-${dayIndex}` ? (
                        <div className="day-based-time-grid__custom-picker space-y-3 w-full px-1 sm:px-2">
                          {/* Hour Keypad - Top Row */}
                          <div className="day-based-time-grid__hour-section bg-white/50 rounded-lg p-1">
                            <div className="text-center text-xs font-semibold text-gray-600 mb-2">Select Hour</div>
                            <div className="day-based-time-grid__hour-grid grid grid-cols-6 gap-0.5 sm:gap-1">
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

                          <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-2">
                            {/* Minutes */}
                            <div className="bg-white/50 rounded-lg p-1 sm:p-2 col-span-3">
                              <div className="text-center text-xs font-semibold text-gray-600 mb-2">Minutes</div>
                              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                                {['00', '15', '30', '45'].map(m => (
                                  <button 
                                    key={m}
                                    onClick={() => setCustomTime({ ...customTime, minute: m })}
                                    className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold ${
                                      customTime.minute === m
                                        ? 'bg-[#217e8f] text-white'
                                        : 'bg-white/70 text-[#217e8f] hover:bg-white'
                                    }`}
                                    disabled={!customTime.hour}
                                  >
                                    :{m}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* AM/PM */}
                            <div className="bg-white/50 rounded-lg p-1 sm:p-2 col-span-2">
                              <div className="text-center text-xs font-semibold text-gray-600 mb-2">AM/PM</div>
                              <div className="grid grid-cols-1 gap-1 sm:gap-2">
                                {['AM', 'PM'].map(period => (
                                  <button
                                    key={period}
                                    onClick={() => setCustomTime({ ...customTime, ampm: period })}
                                    className={`w-full h-6 sm:h-8 flex items-center justify-center text-xs md:text-[13px] rounded-md font-semibold ${
                                      customTime.ampm === period
                                        ? 'bg-[#217e8f] text-white'
                                        : 'bg-white/70 text-[#217e8f] hover:bg-white'
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
                              onClick={() => handleSetTimeForDay(dayIndex, `${customTime.hour}:${customTime.minute} ${customTime.ampm}`)} 
                              disabled={!customTime.minute || !customTime.hour || !customTime.ampm} 
                              className="day-based-time-grid__set-time-btn mx-auto bg-[#217e8f] text-white rounded-md font-semibold hover:bg-[#1a6b7a] disabled:bg-gray-300 disabled:text-gray-500"
                              style={{
                                width: '115px',
                                height: '30px',
                                fontSize: '13px',
                                lineHeight: '20px',
                                padding: '0px 8px',
                                borderRadius: '6px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                              }}
                            >
                              Set Time
                            </button>
                          </div>
                          <button 
                            onClick={() => setShowFullPickerFor(null)} 
                            className="day-based-time-grid__back-btn w-full text-xs md:text-[13px] text-[#217e8f] whitespace-nowrap"
                          >
                            ← Scrollable Time
                          </button>
                        </div>
                      ) : (
                        <div className="day-based-time-grid__scroll-picker">
                          <div className="px-1">
                            <button 
                              onClick={() => { 
                                setShowFullPickerFor(`day-${dayIndex}`); 
                                setCustomTime({ hour: '', minute: '', ampm: '' }); 
                              }} 
                              className="day-based-time-grid__custom-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 sticky top-0 z-10 flex justify-center"
                            >
                              Custom
                            </button>
                          </div>
                          
                          {/* Fixed height container for time options */}
                          <div className="day-based-time-grid__time-content h-[240px] flex flex-col px-1">
                            {/* Scrollable time options */}
                            <div ref={scrollableTimeRef} className="day-based-time-grid__scrollable-options space-y-[8.5px] flex-1 overflow-y-auto hide-scrollbar">
                              {quickTimeOptions.map((opt) => {
                                const isSelected = flowContext.eventPreview.dayBasedTimes?.[dayIndex] === opt;
                                return (
                                  <button
                                    key={opt}
                                    data-time={opt}
                                    onClick={() => {
                                      setFlowContext(prev => ({
                                        ...prev,
                                        eventPreview: {
                                          ...prev.eventPreview,
                                          dayBasedTimes: {
                                            ...prev.eventPreview.dayBasedTimes,
                                            [dayIndex]: isSelected ? undefined : opt
                                          }
                                        }
                                      }));
                                    }}
                                    className={`day-based-time-grid__time-option w-full text-[13px] px-1 py-1.5 rounded-lg transition-all duration-200 ${
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
                            
                            {/* Fixed position confirm button - always at bottom */}
                            <div className="day-based-time-grid__confirm-container h-8 flex items-center flex-shrink-0">
                              <button
                                onClick={() => {
                                  const selectedTime = flowContext.eventPreview.dayBasedTimes?.[dayIndex];
                                  if (selectedTime) {
                                    handleSetTimeForDay(dayIndex, selectedTime);
                                    setEditingTimeForDay(null);
                                  }
                                }}
                                disabled={!flowContext.eventPreview.dayBasedTimes?.[dayIndex]}
                                className={`day-based-time-grid__confirm w-full h-[30px] rounded-md text-[13px] font-medium flex items-center justify-center shadow-sm focus:outline-none transition-colors ${
                                  flowContext.eventPreview.dayBasedTimes?.[dayIndex] 
                                    ? 'bg-[#217e8f] text-white hover:bg-[#1a6b7a] active:scale-95' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {flowContext.eventPreview.dayBasedTimes?.[dayIndex] ? 'Confirm Time' : 'Select Time'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-1">
                      <button 
                        onClick={() => { 
                          setEditingTimeForDay(dayIndex); 
                          setShowFullPickerFor(null); 
                        }} 
                        className="day-based-time-grid__set-time-btn w-full text-[13px] bg-[#217e8f]/20 text-[#1a6e7e] py-1.5 rounded-lg hover:bg-[#217e8f]/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="font-semibold text-gray-800">{dayNames[dayIndex]}</span>
                        <span>Set Time</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Dates Section - Collapsible */}
                <div className="day-based-time-grid__dates-section bg-white/10 px-4 py-2">
                  <button
                    onClick={() => setExpandedDates(prev => ({...prev, [dayIndex]: !prev[dayIndex]}))}
                    className="w-full text-center text-[11px] md:text-xs text-gray-500 mb-2 hover:text-gray-700 transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    <span>{expandedDates[dayIndex] ? '−' : '+'}</span>
                    <span>Selected dates ({datesForThisDay.length} total)</span>
                  </button>
                  {expandedDates[dayIndex] && (
                    <div className="day-based-time-grid__date-list grid grid-cols-2 gap-2 justify-items-center">
                      {datesForThisDay.map((dateStr) => {
                        const [year, month, day] = dateStr.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                        const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
                        
                        return (
                          <div 
                            key={dateStr} 
                            className="day-based-time-grid__date-item text-xs py-1 rounded bg-white/40 text-gray-700 font-medium whitespace-nowrap text-center w-[50px]"
                          >
                            {monthName} {dayNum}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="day-based-time-grid__actions mt-4 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!isAllTimesSet()}
          className="day-based-time-grid__continue-btn bg-[#217e8f] text-white rounded-md font-medium transition-colors enabled:hover:bg-[#1a6e7e] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
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
          {isAllTimesSet() ? 'Times Set' : 'Set Times'}
        </button>
      </div>
    </div>
  );
}; 