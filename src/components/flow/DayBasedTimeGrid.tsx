import React from 'react';
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-8">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-stretch">
        {getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []).map((dayInfo) => {
          const dayIndex = parseInt(dayInfo.id.split('-')[1]);
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const bgColor = roygbivColors[dayIndex];
          const time = flowContext.eventPreview.dayBasedTimes?.[dayIndex];
          const isEditing = editingTimeForDay === dayIndex;
          
          // Get all dates for this day
          const datesForThisDay = (flowContext.eventPreview.selectedDates || []).filter(dateStr => {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const jsDay = date.getDay();
            return (jsDay === 0 ? 6 : jsDay - 1) === dayIndex;
          }).sort();

          const quickTimeOptions = generateTimeOptions();

          return (
            <div key={dayIndex} className="flex flex-col items-center p-1.5 rounded-lg text-center h-full" style={{ backgroundColor: bgColor }}>
              <div className="font-semibold text-gray-800 text-xs mb-1">
                {dayNames[dayIndex]}
              </div>
              <div className="w-full mb-2">
                {isEditing ? (
                  <div className="w-full">
                    {showFullPickerFor === `day-${dayIndex}` ? (
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
                              onClick={() => handleSetTimeForDay(dayIndex, `${customTime.hour}:${customTime.minute} AM`)} 
                              disabled={!customTime.minute} 
                              className="text-xs px-2 py-1 rounded-md bg-white/70 text-gray-700 font-semibold hover:bg-white disabled:bg-gray-200 disabled:text-gray-400"
                            >
                              AM
                            </button>
                            <button 
                              onClick={() => handleSetTimeForDay(dayIndex, `${customTime.hour}:${customTime.minute} PM`)} 
                              disabled={!customTime.minute} 
                              className="text-xs px-2 py-1 rounded-md bg-white/70 text-gray-700 font-semibold hover:bg-white disabled:bg-gray-200 disabled:text-gray-400"
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div ref={scrollableTimeRef} className="space-y-1 max-h-32 overflow-y-auto">
                        {quickTimeOptions.map(opt => (
                          <button 
                            key={opt} 
                            data-time={opt} 
                            onClick={() => handleSetTimeForDay(dayIndex, opt)} 
                            className="w-full text-xs bg-white/60 text-gray-800 px-1 py-0.5 rounded-md hover:bg-white"
                          >
                            {opt}
                          </button>
                        ))}
                        <button 
                          onClick={() => { 
                            setShowFullPickerFor(`day-${dayIndex}`); 
                            setCustomTime({ hour: '', minute: '', ampm: '' }); 
                          }} 
                          className="w-full text-xs text-blue-600 pt-1 hover:underline"
                        >
                          Custom
                        </button>
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
                    className="text-sm font-semibold text-[#217e8f] px-2 py-1 rounded-md hover:bg-black/5 w-full"
                  >
                    {time}
                  </button>
                ) : (
                  <button 
                    onClick={() => { 
                      setEditingTimeForDay(dayIndex); 
                      setShowFullPickerFor(null); 
                    }} 
                    className="text-xs bg-black/5 text-gray-700 px-2 py-1 rounded-md hover:bg-black/10 w-full"
                  >
                    Set Time
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
          disabled={!isAllTimesSet()}
          className="bg-[#217e8f] text-white px-4 py-1 rounded-lg text-xs font-medium transition-colors enabled:hover:bg-[#1a6670] disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isAllTimesSet() ? 'Times Set' : 'Set Times'}
        </button>
      </div>
    </div>
  );
}; 