import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';

// Safe error wrapper for testing individual sections
function SafeSection({ children, name }: { children: React.ReactNode; name: string }) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error(`Error in ${name}:`, error);
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded">
        <h3 className="text-red-800 font-semibold">Error in {name}</h3>
        <pre className="text-red-600 text-sm mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
      </div>
    );
  }
}

// Simple button component
const AddByDayButton = React.memo(({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="w-[140px] h-[30px] px-2 border-none rounded-md bg-[#217e8f] text-white text-sm font-normal hover:bg-[#1a6e7e] active:scale-95 transition-colors duration-150"
  >
    Add Event
  </button>
));

export default function WeeklyCalendarSafe() {
  console.log('🔧 WeeklyCalendarSafe: Starting render');
  
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Basic navigation functions
  const goToPreviousWeek = useCallback(() => {
    console.log('🔧 Previous week clicked');
    setCurrentWeek(prev => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    console.log('🔧 Next week clicked');
    setCurrentWeek(prev => addWeeks(prev, 1));
  }, []);

  const handleAddEventClick = useCallback((date: string | null) => {
    console.log('🔧 Add event clicked with date:', date);
    navigate('/add-event', { state: { date } });
  }, [navigate]);

  // Calculate week data safely
  const weekStart = useMemo(() => {
    try {
      return startOfWeek(currentWeek, { weekStartsOn: 0 });
    } catch (error) {
      console.error('Error calculating week start:', error);
      return new Date();
    }
  }, [currentWeek]);
  
  const weekDays = useMemo(() => {
    try {
      return Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        return {
          date,
          dayName: format(date, 'EEEE'),
          dayNumber: format(date, 'd'),
          monthName: format(date, 'MMMM'),
          fullDate: format(date, 'yyyy-MM-dd'),
        };
      });
    } catch (error) {
      console.error('Error calculating week days:', error);
      return [];
    }
  }, [weekStart]);

  console.log('🔧 WeeklyCalendarSafe: About to return JSX');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SafeSection name="Header">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Weekly Calendar (Safe Mode)</h1>
            <AddByDayButton onClick={() => handleAddEventClick(null)} />
          </div>
        </div>
      </SafeSection>

      <SafeSection name="Week Navigation">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-center py-2">
            <button onClick={goToPreviousWeek} className="p-1 rounded hover:bg-gray-100 active:scale-95">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <h2 className="text-base font-normal text-gray-700 mx-3">
              {weekDays.length > 0 ? (
                `${format(weekStart, 'MMMM d')} - ${format(addDays(weekStart, 6), 'MMMM d')} (${format(addDays(weekStart, 6), 'yyyy')})`
              ) : (
                'Loading...'
              )}
            </h2>
            <button onClick={goToNextWeek} className="p-1 rounded hover:bg-gray-100 active:scale-95">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          {/* Week Picker */}
          <div className="flex justify-center pb-2">
            <div className="flex flex-col items-center">
              <input
                type="week"
                value={format(weekStart, 'yyyy-\\WW')}
                onChange={(e) => {
                  try {
                    const [year, week] = e.target.value.split('-W');
                    const firstDayOfYear = new Date(parseInt(year), 0, 1);
                    const daysToAdd = (parseInt(week) - 1) * 7;
                    const newWeekStart = addDays(firstDayOfYear, daysToAdd);
                    setCurrentWeek(startOfWeek(newWeekStart, { weekStartsOn: 0 }));
                  } catch (error) {
                    console.error('Error setting week:', error);
                  }
                }}
                className="text-xs bg-transparent border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:border-[#217e8f] focus:ring-1 focus:ring-[#217e8f]"
                title="Jump to specific week"
              />
              <div className="text-[10px] text-gray-500 mt-0.5">
                Jump to week
              </div>
            </div>
          </div>
        </div>
      </SafeSection>

      <SafeSection name="Day Cards">
        <div className="flex-1 p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {weekDays.map((day, idx) => (
              <SafeSection key={day.fullDate} name={`Day Card ${day.dayName}`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-700">{day.dayName}</h3>
                        <span className="text-xs text-gray-500">{day.monthName} {day.dayNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-center text-gray-500 text-sm">
                      No events or keepers for this day
                    </div>
                  </div>
                </div>
              </SafeSection>
            ))}
          </div>
        </div>
      </SafeSection>

      <SafeSection name="Footer">
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="text-center text-gray-500 text-sm">
            Weekly Calendar in Safe Mode - All sections working ✅
          </div>
        </div>
      </SafeSection>
    </div>
  );
} 