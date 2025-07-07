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
  if (flowContext.step === 'customDatePicker') {
    return (
      <div className="date-selection date-selection--custom-picker bg-white rounded-lg shadow-sm p-4 mb-8 relative">
        <div className="date-selection__year-header text-sm font-medium text-gray-600 mb-4">
          {new Date().getFullYear()} <span className="date-selection__year-note text-xs font-normal text-gray-400">(Current year)</span>
        </div>
        <div className={`date-selection__months-grid ${showOtherMonths ? 'grid grid-cols-2 gap-6' : ''}`}>
          <div className="date-selection__primary-months space-y-3 flex flex-col items-center">
            {currentButtons.map((button: SmartButton) => 
              <SmartActionButton 
                key={button.id} 
                button={button} 
                onClick={() => handleButtonSelect(button.id)} 
              />
            )}
          </div>
          {showOtherMonths && (
            <div className="date-selection__additional-months space-y-3 flex flex-col items-center">
              {getRemainingMonthsInYear().map((button: SmartButton) => 
                <SmartActionButton 
                  key={button.id} 
                  button={button} 
                  onClick={() => handleButtonSelect(button.id)} 
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (flowContext.step === 'monthPart') {
    return (
      <div className="date-selection date-selection--month-part bg-white rounded-lg shadow-sm p-4 mb-8 relative">
        {flowContext.eventPreview.hasPatternPreselection ? (
          <div className="date-selection__hint date-selection__hint--pattern absolute top-3 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 leading-none whitespace-nowrap">
            Matching days preselected - tap to deselect
          </div>
        ) : (
          <div className="date-selection__hint date-selection__hint--default absolute top-3 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 leading-none whitespace-nowrap">
            Select one date or many for this event
          </div>
        )}
        
        <div style={{ marginTop: '8px' }}>
        {getMonthDates(flowContext.eventPreview.selectedMonth || '').map((week: (SmartButton | null)[], weekIndex: number) => (
          <div key={weekIndex} className={`date-selection__week ${weekIndex > 0 ? "mt-3" : ""}`}>
            <h4 className="date-selection__week-title text-sm font-medium text-gray-700 mb-2">Week {weekIndex + 1}</h4>
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
                  <div key={dayIndex} className="date-selection__empty-day h-8"></div>
                )
              ))}
            </div>
          </div>
        ))}
        </div>
        
        {/* Select Dates Button - Own Row */}
        <div className="date-selection__button-row flex justify-end mt-6">
          <button
            onClick={() => {
              const { selectedDates = [] } = flowContext.eventPreview;
              if (selectedDates.length > 0) {
                setFlowContext({
                  ...flowContext,
                  step: selectedDates.length > 1 ? 'repeatAnotherMonth' : 'whenTimePeriod',
                  eventPreview: { ...flowContext.eventPreview, date: selectedDates.join(', '), isRepeating: selectedDates.length > 1 }
                });
              }
            }}
            disabled={!flowContext.eventPreview.selectedDates?.length}
            className={`date-selection__continue-btn px-3 py-1.5 rounded-lg text-xs transition-colors ${
              flowContext.eventPreview.selectedDates?.length 
                ? 'date-selection__continue-btn--active bg-[#217e8f] text-white hover:bg-[#1a6e7e]' 
                : 'date-selection__continue-btn--disabled bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {(() => {
              const count = flowContext.eventPreview.selectedDates?.length || 0;
              if (count === 0) return 'Select Dates';
              if (count === 1) return '1 Date Selected';
              return `${count} Dates Selected`;
            })()}
          </button>
        </div>
      </div>
    );
  }

  return null;
}; 