import React from 'react';
import { FlowContext } from '../../hooks/useKicacoFlow';

interface Props {
  flowContext: FlowContext;
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
  currentQuestion: string;
}

export const FlowNavigationHeader: React.FC<Props> = ({ flowContext, setFlowContext, currentQuestion }) => {
  const getBackButton = () => {
    switch (flowContext.step) {
      case 'eventType':
        return (
          <button
            onClick={() => setFlowContext({ 
              ...flowContext, 
              step: 'sportsType', 
              selections: { ...flowContext.selections, type: 'event', category: 'sports' }, 
              eventPreview: { ...flowContext.eventPreview, type: 'event', category: 'sports' } 
            })}
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Select Other Sport
          </button>
        );

      case 'whichChild':
        return (
          <button
            onClick={() => {
              const selectedSport = flowContext.eventPreview.subtype || 'soccer';
              setFlowContext({ 
                ...flowContext,
                step: 'eventType', 
                selections: { ...flowContext.selections, subtype: selectedSport }, 
                eventPreview: { ...flowContext.eventPreview, subtype: selectedSport } 
              });
            }}
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← {flowContext.eventPreview.subtype ? 
              `${flowContext.eventPreview.subtype.charAt(0).toUpperCase() + flowContext.eventPreview.subtype.slice(1)} Event Type` : 
              'Soccer Event Type'}
          </button>
        );

      case 'whenDate':
        return (
          <button 
            onClick={() => setFlowContext({ ...flowContext, step: 'whichChild' })} 
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Select Other Child
          </button>
        );

      case 'customDatePicker':
        return (
          <button
            onClick={() => {
              const step = (flowContext.eventPreview.selectedDates || []).length > 0 ? 'repeatAnotherMonth' : 'whenDate';
              setFlowContext({ ...flowContext, step });
            }}
            className="text-[#217e8f] text-xs hover:underline"
          >
            {(flowContext.eventPreview.selectedDates || []).length > 0 ? '← No More Dates to Add' : '← Quick Dates'}
          </button>
        );

      case 'monthPart':
        return (
          <button 
            onClick={() => {
              setFlowContext({ 
                ...flowContext, 
                step: 'customDatePicker'
              });
            }} 
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Month & Year
          </button>
        );

      case 'whenTimePeriod':
        return (
          <button 
            onClick={() => {
              const hasMultipleDates = (flowContext.eventPreview.selectedDates || []).length > 1;
              if (hasMultipleDates) {
                setFlowContext({ ...flowContext, step: 'repeatingSameTime' });
              } else {
                setFlowContext({ ...flowContext, step: 'customDatePicker' });
              }
            }}
            className="text-[#217e8f] text-xs hover:underline"
          >
            {(flowContext.eventPreview.selectedDates || []).length > 1 
              ? '← Multi-Event Time Pattern' 
              : '← Select More Dates'
            }
          </button>
        );

      case 'whereLocation':
        return (
          <button
            onClick={() => {
              const hasMultipleDates = (flowContext.eventPreview.selectedDates || []).length > 1;
              if (hasMultipleDates) {
                setFlowContext({ ...flowContext, step: 'repeatingSameLocation' });
              } else {
                setFlowContext({ ...flowContext, step: 'whenTimePeriod' });
              }
            }}
            className="text-[#217e8f] text-xs hover:underline"
          >
            {(flowContext.eventPreview.selectedDates || []).length > 1 
              ? '← Multi-Event Location Pattern' 
              : '← Change Time'
            }
          </button>
        );

      case 'eventNotes':
        return (
          <button 
            onClick={() => {
              const currentLocationPattern = flowContext.eventPreview.currentLocationPattern;
              const isMultiEvent = (flowContext.eventPreview.selectedDates || []).length > 1;
              
              if (isMultiEvent) {
                if (currentLocationPattern === 'same') {
                  setFlowContext({ ...flowContext, step: 'whereLocation' });
                } else if (currentLocationPattern === 'dayBased') {
                  setFlowContext({ ...flowContext, step: 'dayBasedLocationSelection' });
                } else {
                  setFlowContext({ ...flowContext, step: 'customLocationSelection' });
                }
              } else {
                setFlowContext({ ...flowContext, step: 'whereLocation' });
              }
            }} 
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Change Location
          </button>
        );

      case 'repeatAnotherMonth':
        return (
          <button 
            onClick={() => setFlowContext({ ...flowContext, step: 'monthPart' })} 
            className="text-[#217e8f] text-xs hover:underline"
          >
            {(() => {
              const selectedMonth = flowContext.eventPreview.selectedMonth;
              if (selectedMonth) {
                const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const [monthStr] = selectedMonth.split('-');
                const monthIndex = monthNames.indexOf(monthStr);
                const monthName = fullMonthNames[monthIndex] || 'Month';
                return `← ${monthName} Date Selection`;
              }
              return '← Date Selection';
            })()}
          </button>
        );

      case 'repeatingSameTime':
        return (
          <button
            onClick={() => setFlowContext({ ...flowContext, step: 'customDatePicker' })}
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Select More Dates
          </button>
        );

      case 'customTimeSelection':
        return (
          <button
            onClick={() => setFlowContext({ ...flowContext, step: 'repeatingSameTime' })}
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Multi-Event Time Pattern
          </button>
        );

      case 'dayBasedTimeGrid':
        return (
          <button
            onClick={() => setFlowContext({ ...flowContext, step: 'repeatingSameTime' })}
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Multi-Event Time Pattern
          </button>
        );

      case 'repeatingSameLocation':
        return (
          <button
            onClick={() => {
              const currentTimePattern = flowContext.eventPreview.currentTimePattern;
              
              if (currentTimePattern === 'same') {
                setFlowContext({ ...flowContext, step: 'whenTimePeriod' });
              } else if (currentTimePattern === 'dayBased') {
                setFlowContext({ ...flowContext, step: 'dayBasedTimeGrid' });
              } else {
                setFlowContext({ ...flowContext, step: 'customTimeSelection' });
              }
            }}
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Set Times
          </button>
        );

      case 'dayBasedLocationSelection':
        return (
          <button
            onClick={() => setFlowContext({ ...flowContext, step: 'repeatingSameLocation' })}
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Multi-Event Location Pattern
          </button>
        );

      case 'customLocationSelection':
        return (
          <button
            onClick={() => setFlowContext({ ...flowContext, step: 'repeatingSameLocation' })}
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Multi-Event Location Pattern
          </button>
        );

      case 'eventCategory':
        return (
          <button
            onClick={() => setFlowContext({ ...flowContext, step: 'initial' })}
            className="text-[#217e8f] text-xs hover:underline"
          >
            ← Create Keeper
          </button>
        );

      default:
        return null;
    }
  };

  const getDateSelectionButton = () => {
    if (flowContext.step === 'monthPart') {
      return (
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
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            flowContext.eventPreview.selectedDates?.length ? 'bg-[#217e8f] text-white hover:bg-[#1a6e7e]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {(() => {
            const count = flowContext.eventPreview.selectedDates?.length || 0;
            if (count === 0) return 'Select Dates';
            if (count === 1) return '1 Date Selected';
            return `${count} Dates Selected`;
          })()}
        </button>
      );
    }
    return null;
  };

  return (
    <div className="flex items-end justify-between mb-2">
      <div className="ml-1">
        <h2 className="text-sm font-medium text-gray-600">
          {currentQuestion}
        </h2>
      </div>
      {getBackButton()}
      {getDateSelectionButton()}
    </div>
  );
}; 