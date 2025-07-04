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
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8 relative">
        <div className="text-sm font-medium text-gray-600 mb-4">
          {new Date().getFullYear()} <span className="text-xs font-normal text-gray-400">(Current year)</span>
        </div>
        <div className={`${showOtherMonths ? 'grid grid-cols-2 gap-6' : ''}`}>
          <div className="space-y-3 flex flex-col items-center">
            {currentButtons.map((button: SmartButton) => 
              <SmartActionButton 
                key={button.id} 
                button={button} 
                onClick={() => handleButtonSelect(button.id)} 
              />
            )}
          </div>
          {showOtherMonths && (
            <div className="space-y-3 flex flex-col items-center">
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
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8 relative">
        {flowContext.eventPreview.hasPatternPreselection ? (
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 leading-none whitespace-nowrap">
            Matching days preselected - tap to deselect
          </div>
        ) : (
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 leading-none whitespace-nowrap">
            Select one date or many for this event
          </div>
        )}
        
        {getMonthDates(flowContext.eventPreview.selectedMonth || '').map((week: (SmartButton | null)[], weekIndex: number) => (
          <div key={weekIndex} className={weekIndex > 0 ? "mt-3" : ""}>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Week {weekIndex + 1}</h4>
            <div className="grid grid-cols-7 gap-1">
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
                  <div key={dayIndex} className="h-8"></div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}; 