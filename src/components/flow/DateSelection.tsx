import React from 'react';
import { FlowContext, SmartButton } from '../../hooks/useKicacoFlow';
import { SmartActionButton, SmallDateButton } from './';

interface Props {
  flowContext: FlowContext;
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
  showOtherMonths: boolean;
  currentButtons: SmartButton[];
  getRemainingMonthsInYear: () => SmartButton[];
  getMonthDates: (monthId: string) => (SmartButton | null)[][];
  dayColors: { [key: number]: string };
  handleButtonSelect: (buttonId: string) => void;
}

export const DateSelection: React.FC<Props> = ({
  flowContext,
  setFlowContext,
  showOtherMonths,
  currentButtons,
  getRemainingMonthsInYear,
  getMonthDates,
  dayColors,
  handleButtonSelect
}) => {
  const [currentYearIndex, setCurrentYearIndex] = React.useState(0);
  const [visitedMonths, setVisitedMonths] = React.useState<Set<string>>(new Set());

  if (flowContext.step === 'monthPart') {
    return (
      <>
        <div className="date-selection date-selection--month-part bg-white rounded-lg shadow-sm px-2 py-3 mb-4 relative">
        {flowContext.eventPreview.hasPatternPreselection ? (
          <div className="date-selection__hint date-selection__hint--pattern absolute top-3 left-1/2 transform -translate-x-1/2 text-[11px] text-gray-400 leading-none whitespace-nowrap">
            Matching days preselected - tap to deselect
          </div>
        ) : (
          <div className="date-selection__hint date-selection__hint--default absolute top-3 left-1/2 transform -translate-x-1/2 text-[11px] text-gray-400 leading-none whitespace-nowrap">
            Select one date or many for this event
          </div>
        )}
        
        <div style={{ marginTop: '24px' }}>
        {getMonthDates(flowContext.eventPreview.selectedMonth || '').map((week: (SmartButton | null)[], weekIndex: number) => (
          <div key={weekIndex} className={`date-selection__week ${weekIndex > 0 ? "mt-2" : ""}`}>
            <h4 className="date-selection__week-title text-sm font-medium text-gray-700 mb-1">Week {weekIndex + 1}</h4>
            <div className="date-selection__week-grid grid grid-cols-7 gap-1">
              {week.map((button, dayIndex) => (
                button ? (
                  <SmallDateButton 
                    key={button.id} 
                    button={button} 
                    isSelected={flowContext.eventPreview.selectedDates?.includes(button.id)} 
                    onClick={() => {
                      const currentSelected = flowContext.eventPreview.selectedDates || [];
                      const newSelected = currentSelected.includes(button.id) 
                        ? currentSelected.filter(id => id !== button.id) 
                        : [...currentSelected, button.id];
                      setFlowContext({ 
                        ...flowContext, 
                        eventPreview: { 
                          ...flowContext.eventPreview, 
                          selectedDates: newSelected, 
                          hasPatternPreselection: newSelected.length > currentSelected.length 
                            ? flowContext.eventPreview.hasPatternPreselection 
                            : false 
                        } 
                      });
                    }} 
                    dayColors={dayColors} 
                  />
                ) : (
                  <div key={dayIndex} className="date-selection__empty-day h-9"></div>
                )
              ))}
            </div>
          </div>
        ))}
        </div>
        
        {/* Select Dates Button - Own Row */}
        <div className="date-selection__button-row flex justify-between items-end mt-6">
          <button
            onClick={() => {
              const currentMonth = flowContext.eventPreview.selectedMonth || '';
              const currentSelectedDates = flowContext.eventPreview.selectedDates || [];
              
              // Filter out dates that belong to the current month
              const remainingDates = currentSelectedDates.filter(dateId => {
                const [year, month] = dateId.split('-');
                const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const monthIndex = parseInt(month) - 1;
                const shortMonth = shortMonthNames[monthIndex];
                const dateMonthId = `${shortMonth}-${year}`;
                return dateMonthId !== currentMonth;
              });
              
              setFlowContext({
                ...flowContext,
                eventPreview: {
                  ...flowContext.eventPreview,
                  selectedDates: remainingDates,
                  hasPatternPreselection: false
                }
              });
            }}
            disabled={(() => {
              const currentMonth = flowContext.eventPreview.selectedMonth || '';
              const currentSelectedDates = flowContext.eventPreview.selectedDates || [];
              
              // Check if there are any dates selected for the current month
              const currentMonthDates = currentSelectedDates.filter(dateId => {
                const [year, month] = dateId.split('-');
                const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const monthIndex = parseInt(month) - 1;
                const shortMonth = shortMonthNames[monthIndex];
                const dateMonthId = `${shortMonth}-${year}`;
                return dateMonthId === currentMonth;
              });
              
              return currentMonthDates.length === 0;
            })()}
            className={`text-xs transition-colors ${
              (() => {
                const currentMonth = flowContext.eventPreview.selectedMonth || '';
                const currentSelectedDates = flowContext.eventPreview.selectedDates || [];
                
                // Check if there are any dates selected for the current month
                const currentMonthDates = currentSelectedDates.filter(dateId => {
                  const [year, month] = dateId.split('-');
                  const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                  const shortMonth = shortMonthNames[parseInt(month) - 1];
                  const dateMonthId = `${shortMonth}-${year}`;
                  return dateMonthId === currentMonth;
                });
                
                return currentMonthDates.length > 0;
              })()
                ? 'text-[#217e8f] hover:text-[#1a6e7e] cursor-pointer' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Clear All {(() => {
              const monthId = flowContext.eventPreview.selectedMonth || '';
              const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
              const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const [monthStr, yearStr] = monthId.split('-');
              const monthIndex = shortMonthNames.indexOf(monthStr);
              const monthName = fullMonthNames[monthIndex] || 'Month';
              const year = yearStr || '';
              
              // Get count of dates selected for current month
              const currentSelectedDates = flowContext.eventPreview.selectedDates || [];
              const currentMonthDates = currentSelectedDates.filter(dateId => {
                const [year, month] = dateId.split('-');
                const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const monthIndex = parseInt(month) - 1;
                const shortMonth = shortMonthNames[monthIndex];
                const dateMonthId = `${shortMonth}-${year}`;
                return dateMonthId === monthId;
              });
              
              const count = currentMonthDates.length;
              return count > 0 ? `${monthName} ${year} Dates (${count})` : `${monthName} ${year} Dates`;
            })()}
          </button>

        </div>
        </div>
        
        {/* Separate Additional Months Window */}
        <div className="date-selection date-selection--additional-months bg-white rounded-lg shadow-sm p-4 mb-8">
          {/* Header row with message and Confirm Dates button */}
          <div className="flex justify-between items-end mb-6">
            <div className="text-xs text-gray-500">Add other months or confirm</div>
            <div className="flex items-center gap-2">
              {flowContext.eventPreview.selectedDates?.length ? (
                <div className="bg-white text-[#217e8f] border-2 border-[#217e8f] text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] h-[24px] flex items-center justify-center">
                  {flowContext.eventPreview.selectedDates.length}
                </div>
              ) : null}
                            <button
                onClick={() => {
                  const { selectedDates = [] } = flowContext.eventPreview;
                  if (selectedDates.length > 0) {
                    setFlowContext({
                      ...flowContext,
                        step: selectedDates.length > 1 ? 'repeatingSameTime' : 'whenTimePeriod',
                      eventPreview: { ...flowContext.eventPreview, date: selectedDates.join(', '), isRepeating: selectedDates.length > 1 }
                    });
                  }
                }}
                disabled={!flowContext.eventPreview.selectedDates?.length}
                className={`date-selection__continue-btn transition-colors ${
                  flowContext.eventPreview.selectedDates?.length 
                    ? 'date-selection__continue-btn--active bg-[#2f8fa4] text-white hover:bg-[#217e8f] border-2 border-[#217e8f]' 
                    : 'date-selection__continue-btn--disabled bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={{
                    width: '115px',
                  height: '30px',
                  padding: '0px 0px',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: '13px',
                  lineHeight: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                  {flowContext.eventPreview.selectedDates?.length ? 'Confirm Dates' : 'Select Dates'}
              </button>
            </div>
          </div>
          
          {/* Two-column layout for month buttons */}
          <div className="flex justify-between items-start">
            {/* Left column - Months with selected dates */}
            <div className="flex flex-col" style={{ gap: '8px' }}>
              {(() => {
                const today = new Date();
                const realCurrentMonth = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase().replace(' ', '-');
                const currentMonth = flowContext.eventPreview.selectedMonth || '';
                const [currentMonthStr, currentYearStr] = currentMonth.split('-');
                const [realCurrentMonthStr, realCurrentYearStr] = realCurrentMonth.split('-');
                const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                
                const currentMonthIndex = monthNames.indexOf(currentMonthStr);
                const currentYear = parseInt(currentYearStr);
                const realCurrentMonthIndex = monthNames.indexOf(realCurrentMonthStr);
                const realCurrentYear = parseInt(realCurrentYearStr);
                
                // Track the current month as visited
                React.useEffect(() => {
                  if (currentMonth && currentMonth !== '') {
                    const [monthStr, yearStr] = currentMonth.split('-');
                    const year = parseInt(yearStr);
                    const realYear = parseInt(realCurrentYearStr);
                    
                    // Only track current year and next year months as visited
                    if (year <= realYear + 1) {
                      setVisitedMonths(prev => new Set([...prev, currentMonth]));
                    }
                  }
                }, [currentMonth]);
                
                // Helper function to count dates in a specific month
                const getDateCountForMonth = (monthId: string) => {
                  const selectedDates = flowContext.eventPreview.selectedDates || [];
                  return selectedDates.filter(dateStr => {
                    const [year, month] = dateStr.split('-');
                    const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                    const monthIndex = parseInt(month) - 1;
                    const shortMonth = shortMonthNames[monthIndex];
                    const dateMonthId = `${shortMonth}-${year}`;
                    return dateMonthId === monthId;
                  }).length;
                };
                
                // Get all months that have selected dates
                const selectedDates = flowContext.eventPreview.selectedDates || [];
                const monthsWithSelectedDates = new Map<string, { id: string; label: string; year: number; dateCount: number }>();
                
                selectedDates.forEach(dateStr => {
                  const [year, month] = dateStr.split('-');
                  const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                  const monthIndex = parseInt(month) - 1;
                  const shortMonth = shortMonthNames[monthIndex];
                  const monthId = `${shortMonth}-${year}`;
                  
                  if (!monthsWithSelectedDates.has(monthId)) {
                    monthsWithSelectedDates.set(monthId, {
                      id: monthId,
                      label: fullMonthNames[monthIndex],
                      year: parseInt(year),
                      dateCount: 0
                    });
                  }
                  
                  const monthData = monthsWithSelectedDates.get(monthId)!;
                  monthData.dateCount++;
                });
                
                // Group months by year and sort chronologically
                const monthsByYear = new Map<number, Array<{ id: string; label: string; dateCount: number }>>();
                
                monthsWithSelectedDates.forEach((monthData, monthId) => {
                  const year = monthData.year;
                  if (!monthsByYear.has(year)) {
                    monthsByYear.set(year, []);
                  }
                  monthsByYear.get(year)!.push({
                    id: monthId,
                    label: monthData.label,
                    dateCount: monthData.dateCount
                  });
                });
                
                // Sort years and months within each year
                const sortedYears = Array.from(monthsByYear.keys()).sort((a, b) => a - b);
                sortedYears.forEach(year => {
                  const months = monthsByYear.get(year)!;
                  months.sort((a, b) => {
                    const aIndex = monthNames.indexOf(a.id.split('-')[0]);
                    const bIndex = monthNames.indexOf(b.id.split('-')[0]);
                    return aIndex - bIndex;
                  });
                });
                
                // Create a structured array for left column
                const leftItems: Array<{
                  type: 'year-label' | 'month';
                  year?: number;
                  button?: { id: string; label: string; dateCount?: number };
                  id: string;
                }> = [];
                
                // Add months with selected dates, grouped by year
                sortedYears.forEach(year => {
                  const months = monthsByYear.get(year)!;
                  
                  // Add year label with "Selected" suffix
                  leftItems.push({
                    type: 'year-label',
                    year: year,
                    id: `left-year-${year}-selected`
                  });
                  
                  // Add months for this year
                  months.forEach(month => {
                    leftItems.push({
                      type: 'month',
                      button: { id: month.id, label: month.label, dateCount: month.dateCount },
                      id: month.id
                    });
                  });
                });
                
                return (
                  <>
                    {leftItems.map((item, index) => {
                      if (item.type === 'year-label') {
                        return (
                          <div 
                            key={item.id}
                            className="text-sm font-medium text-gray-700 text-center"
                            style={{
                              width: '115px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'center'
                            }}
                          >
                            {item.year} Selected
                          </div>
                        );
                      }
                      
                      if (item.type === 'month' && item.button) {
                        const dateCount = getDateCountForMonth(item.button.id);
                        
                        // Determine if this is a selected future year month
                        const today = new Date();
                        const currentRealYear = today.getFullYear();
                        const [monthStr, yearStr] = item.button.id.split('-');
                        const monthYear = parseInt(yearStr);
                        const isFutureYear = monthYear > currentRealYear + 1;
                        const isSelected = flowContext.eventPreview.selectedMonth === item.button.id;
                        const isSelectedFutureYearMonth = isFutureYear && isSelected;
                        
                        // Determine if this month is selected but has no dates (should show inverted colors)
                        const isSelectedButNoDates = isSelected && dateCount === 0;
                        
                        // Determine if this is the currently active month (should always show inverted colors)
                        const isCurrentlyActiveMonth = isSelected;
                        
                        return (
                          <div key={item.id} className="flex items-center gap-2">
                            <SmartActionButton 
                              button={item.button} 
                              customStyle="month-navigation"
                              onClick={() => {
                                if (item.button) {
                                  setFlowContext({
                                    ...flowContext,
                                    step: 'monthPart',
                                    eventPreview: {
                                      ...flowContext.eventPreview,
                                      selectedMonth: item.button.id
                                    }
                                  });
                                }
                              }} 
                            />
                            {dateCount > 0 && (
                              <div className="bg-white text-[#10b981] border-2 border-[#059669] text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] h-[24px] flex items-center justify-center">
                                {dateCount}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      return null;
                    })}
                  </>
                );
              })()}
            </div>
            
            {/* Right column - Year carousel + Month carousel */}
            <div className="flex flex-col items-end" style={{ gap: '8px' }}>
              {(() => {
                const today = new Date();
                const currentRealYear = today.getFullYear();
                const currentRealMonth = today.getMonth(); // 0-indexed
                
                const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                
                // Create a state for carousel index - initialize to currently selected month
                const [carouselIndex, setCarouselIndex] = React.useState(() => {
                  // If we have a selected month, use that, otherwise use next month
                  if (flowContext.eventPreview.selectedMonth) {
                    const [monthStr, yearStr] = flowContext.eventPreview.selectedMonth.split('-');
                    const monthIndex = monthNames.indexOf(monthStr);
                    return { month: monthIndex, year: parseInt(yearStr) };
                  }
                  // Default to next month
                  const nextMonth = (currentRealMonth + 1) % 12;
                  const nextYear = nextMonth === 0 ? currentRealYear + 1 : currentRealYear;
                  return { month: nextMonth, year: nextYear };
                });
                
                // Update carousel when selected month changes
                React.useEffect(() => {
                  if (flowContext.eventPreview.selectedMonth) {
                    const [monthStr, yearStr] = flowContext.eventPreview.selectedMonth.split('-');
                    const monthIndex = monthNames.indexOf(monthStr);
                    setCarouselIndex({ month: monthIndex, year: parseInt(yearStr) });
                  }
                }, [flowContext.eventPreview.selectedMonth]);
                
                // Create array of years to show (current year + future years)
                const yearsToShow = [currentRealYear];
                for (let year = currentRealYear + 1; year <= currentRealYear + 5; year++) {
                  yearsToShow.push(year);
                }
                
                // Get all months that have selected dates
                const selectedDates = flowContext.eventPreview.selectedDates || [];
                const monthsWithSelectedDates = new Set<string>();
                
                selectedDates.forEach(dateStr => {
                  const [year, month] = dateStr.split('-');
                  const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                  const monthIndex = parseInt(month) - 1;
                  const shortMonth = shortMonthNames[monthIndex];
                  const monthId = `${shortMonth}-${year}`;
                  monthsWithSelectedDates.add(monthId);
                });
                
                const handlePrevMonth = () => {
                  const prev = carouselIndex;
                  let newMonth = prev.month - 1;
                  let newYear = prev.year;
                  
                  if (newMonth < 0) {
                    newMonth = 11;
                    newYear = prev.year - 1;
                  }
                  
                  // Don't go before current month of current year
                  if (newYear < currentRealYear || (newYear === currentRealYear && newMonth < currentRealMonth)) {
                    return;
                  }
                  
                  // Update carousel state
                  setCarouselIndex({ month: newMonth, year: newYear });
                  
                  // Update the view to show this month
                  const monthId = `${monthNames[newMonth]}-${newYear}`;
                  setFlowContext({
                    ...flowContext,
                    step: 'monthPart',
                    eventPreview: {
                      ...flowContext.eventPreview,
                      selectedMonth: monthId
                    }
                  });
                };
                
                const handleNextMonth = () => {
                  const prev = carouselIndex;
                  let newMonth = (prev.month + 1) % 12;
                  let newYear = prev.year;
                  
                  if (newMonth === 0) {
                    newYear = prev.year + 1;
                  }
                  
                  // Don't go beyond 5 years in the future
                  if (newYear > currentRealYear + 5) {
                    return;
                  }
                  
                  // Update carousel state
                  setCarouselIndex({ month: newMonth, year: newYear });
                  
                  // Update the view to show this month
                  const monthId = `${monthNames[newMonth]}-${newYear}`;
                  setFlowContext({
                    ...flowContext,
                    step: 'monthPart',
                    eventPreview: {
                      ...flowContext.eventPreview,
                      selectedMonth: monthId
                    }
                  });
                };
                
                const currentMonthId = `${monthNames[carouselIndex.month]}-${carouselIndex.year}`;
                const currentMonthLabel = fullMonthNames[carouselIndex.month];
                
                // Check if we can go prev/next
                const canGoPrev = !(carouselIndex.year === currentRealYear && carouselIndex.month <= currentRealMonth);
                const canGoNext = carouselIndex.year < currentRealYear + 5;
                
                return (
                  <>
                    {/* Year carousel */}
                    <div className="flex items-center justify-center" style={{ width: '100%' }}>
                      <button
                        onClick={() => {
                          const currentYearIndex = yearsToShow.indexOf(carouselIndex.year);
                          if (currentYearIndex > 0) {
                            const newYear = yearsToShow[currentYearIndex - 1];
                            // Set to the first available month of the new year
                            let monthToSelect = newYear === currentRealYear ? currentRealMonth : 0;
                            
                            // Navigate to first valid month of the new year
                            const monthId = `${monthNames[monthToSelect]}-${newYear}`;
                            setCarouselIndex({ month: monthToSelect, year: newYear });
                            setFlowContext({
                              ...flowContext,
                              step: 'monthPart',
                              eventPreview: {
                                ...flowContext.eventPreview,
                                selectedMonth: monthId
                              }
                            });
                          }
                        }}
                        disabled={yearsToShow.indexOf(carouselIndex.year) === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:text-gray-300"
                        style={{ fontSize: '20px', marginRight: '0px', display: 'flex', alignItems: 'flex-end', height: '30px', transform: 'translateY(4px)' }}
                      >
                        ‹
                      </button>
                      <div 
                        className="text-sm font-medium text-gray-700 text-center"
                        style={{
                          width: '60px',
                          height: '30px',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center'
                        }}
                      >
                        {carouselIndex.year}
                      </div>
                      <button
                        onClick={() => {
                          const currentYearIndex = yearsToShow.indexOf(carouselIndex.year);
                          if (currentYearIndex < yearsToShow.length - 1) {
                            const newYear = yearsToShow[currentYearIndex + 1];
                            // Set to the first available month of the new year
                            let monthToSelect = 0;
                            
                            // Navigate to first valid month of the new year
                            const monthId = `${monthNames[monthToSelect]}-${newYear}`;
                            setCarouselIndex({ month: monthToSelect, year: newYear });
                            setFlowContext({
                              ...flowContext,
                              step: 'monthPart',
                              eventPreview: {
                                ...flowContext.eventPreview,
                                selectedMonth: monthId
                              }
                            });
                          }
                        }}
                        disabled={yearsToShow.indexOf(carouselIndex.year) === yearsToShow.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:text-gray-300"
                        style={{ fontSize: '20px', marginLeft: '0px', display: 'flex', alignItems: 'flex-end', height: '30px', transform: 'translateY(4px)' }}
                      >
                        ›
                      </button>
                    </div>
                    
                    {/* Month carousel button - same size as SmartActionButton */}
                    <div 
                      className="flex items-center"
                      style={{
                        width: '115px',
                        height: '30px',
                        padding: '0px 0px',
                        border: '2px solid #059669',
                        boxSizing: 'border-box',
                        borderRadius: '6px',
                        background: '#10b981',
                        color: '#ffffff',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        overflow: 'hidden'
                      }}
                    >
                      <button
                        onClick={handlePrevMonth}
                        disabled={!canGoPrev}
                        className="h-full px-1.5 flex items-center justify-center hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontSize: '16px' }}
                      >
                        ‹
                      </button>
                      <div 
                        className="flex-1 h-full flex items-center justify-center"
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          lineHeight: '20px'
                        }}
                      >
                        {currentMonthLabel}
                      </div>
                      <button
                        onClick={handleNextMonth}
                        disabled={!canGoNext}
                        className="h-full px-1.5 flex items-center justify-center hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontSize: '16px' }}
                      >
                        ›
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}; 