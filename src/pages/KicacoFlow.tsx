import React, { useState, useRef, useEffect } from 'react';
import { GlobalHeader, GlobalSubheader, GlobalFooter } from '../components/navigation';
import { GlobalChatDrawer } from '../components/chat';
import { useKicacoStore } from '../store/kicacoStore';
import { useChatScrollManagement } from '../hooks/useChatScrollManagement';
import { ChevronLeft, ChevronRight, X, Waves, Check } from 'lucide-react';
import { EventCard } from '../components/calendar';
import { StackedChildBadges } from '../components/common';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { useKicacoFlow, SmartButton } from '../hooks/useKicacoFlow';
import { format, parse } from 'date-fns';
import {
  SmartActionButton,
  TimePickerButton,
  LocationButton,
  SmallDateButton,
  ChildSelectionButton
} from '../components/flow';

export default function KicacoFlow() {
  const {
    flowContext,
    setFlowContext,
    showOtherMonths,
    eventNotes,
    setEventNotes,
    showConfirmation,
    setShowConfirmation,
    createdEvents,
    setCreatedEvents,
    currentEventIndex,
    setCurrentEventIndex,
    timePickerState,
    setTimePickerState,
    currentButtons,
    currentQuestion,
    handleButtonSelect,
    getChildColor,
    dayColors,
    getHourOptions,
    getMinuteOptions,
    getAmPmOptions,
    getPersonalizedSports,
    getAllSportsAlphabetical,
    getMonthDates,
    getRemainingMonthsInYear,
    getUniqueDaysOfWeek,
  } = useKicacoFlow();

  const {
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
    messages
  } = useKicacoStore();

  const { chatContentScrollRef } = useChatScrollManagement({
    messages,
    chatScrollPosition,
    setChatScrollPosition,
    pageName: 'KicacoFlow'
  });

  const [editingTimeForDate, setEditingTimeForDate] = useState<string | null>(null);
  const [showFullPickerFor, setShowFullPickerFor] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState({ hour: '', minute: '', ampm: '' });
  const scrollableTimeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingTimeForDate && !showFullPickerFor && scrollableTimeRef.current) {
      // Scroll to noon-ish time
      const noonElement = scrollableTimeRef.current.querySelector('[data-time="12:00 PM"]');
      if (noonElement) {
        noonElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [editingTimeForDate, showFullPickerFor]);

  const handleSetTimeForDate = (date: string, time: string) => {
    setFlowContext({
      ...flowContext,
      eventPreview: {
        ...flowContext.eventPreview,
        dayBasedTimes: {
          ...flowContext.eventPreview.dayBasedTimes,
          [date]: time,
        }
      }
    });
    setEditingTimeForDate(null); // Close the picker
    setTimePickerState({ hour: '', minute: '', ampm: '', activeDropdown: '' }); // Reset picker
  };

  const areAllTimesSet = (flowContext.eventPreview.selectedDates || []).every(
    date => !!flowContext.eventPreview.dayBasedTimes?.[date]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <GlobalHeader />
      
      <GlobalSubheader 
        icon={<Waves />}
        title="Kicaco Flow"
      />

      <main 
        className="flex-1 overflow-y-auto px-4 py-6 pb-24 bg-gray-50"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          height: '0'
        }}
      >
        <div className="max-w-md mx-auto">
          
          <div className="flex items-end justify-between mb-2">
            <div className="ml-1">
              <h2 className="text-sm font-medium text-gray-600">
                {currentQuestion}
              </h2>
            </div>
            
            {flowContext.step === 'eventType' && (
              <button
                onClick={() => setFlowContext({ ...flowContext, step: 'sportsType', selections: { ...flowContext.selections, type: 'event', category: 'sports' }, eventPreview: { ...flowContext.eventPreview, type: 'event', category: 'sports' } })}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Select other sport
              </button>
            )}
            
            {flowContext.step === 'whichChild' && (
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
                  `${flowContext.eventPreview.subtype.charAt(0).toUpperCase() + flowContext.eventPreview.subtype.slice(1)} event type` : 
                  'Soccer event type'}
              </button>
            )}
            
            {flowContext.step === 'whenDate' && (
              <button onClick={() => setFlowContext({ ...flowContext, step: 'whichChild' })} className="text-[#217e8f] text-xs hover:underline">
                ← Select other child
              </button>
            )}
            
            {flowContext.step === 'customDatePicker' && (
              <button
                onClick={() => {
                  const step = (flowContext.eventPreview.selectedDates || []).length > 0 ? 'repeatAnotherMonth' : 'whenDate';
                  setFlowContext({ ...flowContext, step });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                {(() => {
                  if ((flowContext.eventPreview.selectedDates || []).length > 0) return '← No more dates to add';
                  const { subtype = 'soccer', eventType = 'game' } = flowContext.eventPreview;
                  return `← ${subtype.charAt(0).toUpperCase() + subtype.slice(1)} ${eventType} quick dates`;
                })()}
              </button>
            )}
            
            {flowContext.step === 'monthPart' && (
              <button onClick={() => setFlowContext({ ...flowContext, step: 'customDatePicker' })} className="text-[#217e8f] text-xs hover:underline">
                ← Select different month
              </button>
            )}
            
            {flowContext.step === 'whenTimePeriod' && (
              <button onClick={() => setFlowContext({ ...flowContext, step: 'whenDate' })} className="text-[#217e8f] text-xs hover:underline">
                ← Select other dates
              </button>
            )}
            
            {flowContext.step === 'whereLocation' && (
              <button
                onClick={() => {
                  const cameFromCustomTimes = Object.keys(flowContext.eventPreview.dayBasedTimes || {}).length > 0;
                  setFlowContext({
                    ...flowContext,
                    step: cameFromCustomTimes ? 'customTimeSelection' : 'whenTimePeriod',
                  });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Change time
              </button>
            )}
            
            {flowContext.step === 'eventNotes' && (
              <button onClick={() => setFlowContext({ ...flowContext, step: 'whereLocation' })} className="text-[#217e8f] text-xs hover:underline">
                ← Change location
              </button>
            )}
            
            {flowContext.step === 'repeatAnotherMonth' && (
              <button onClick={() => setFlowContext({ ...flowContext, step: 'monthPart' })} className="text-[#217e8f] text-xs hover:underline">
                {`← Go back to date selection`}
              </button>
            )}

            {flowContext.step === 'repeatingSameTime' && (
              <button
                onClick={() => {
                  setFlowContext({ ...flowContext, step: flowContext.eventPreview.selectedMonth ? 'monthPart' : 'whenDate' });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Add more dates
              </button>
            )}

            {flowContext.step === 'monthPart' && (
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
                  if (count === 0) return 'Select dates';
                  if (count === 1) return '1 date selected';
                  return `${count} dates selected`;
                })()}
              </button>
            )}

            {/* Back button for the new Custom Time Selection grid */}
            {flowContext.step === 'customTimeSelection' && (
              <button
                onClick={() => setFlowContext({ ...flowContext, step: 'repeatingSameTime' })}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Multi-event time pattern
              </button>
            )}

            {flowContext.step === 'repeatingSameLocation' && (
                <button
                    onClick={() => setFlowContext({ ...flowContext, step: 'customTimeSelection' })}
                    className="text-[#217e8f] text-xs hover:underline"
                >
                    ← Set times
                </button>
            )}
          </div>

          {flowContext.step === 'sportsType' ? (
            <>
              <div className="flex items-end justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 ml-1">Your family's sports</h3>
                <button onClick={() => setFlowContext({ ...flowContext, step: 'eventCategory' })} className="text-[#217e8f] text-xs hover:underline">
                  ← Event category
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6"><div className="space-y-3">
                  {getPersonalizedSports().map((button: SmartButton) => <SmartActionButton key={button.id} button={button} onClick={() => handleButtonSelect(button.id)} />)}
              </div></div>
              
              <div className="mb-2"><h3 className="text-sm font-medium text-gray-600 ml-1">All sports</h3></div>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-8"><div className="space-y-3">
                  {getAllSportsAlphabetical().map((button: SmartButton) => <SmartActionButton key={button.id} button={button} onClick={() => handleButtonSelect(button.id)} />)}
              </div></div>
            </>
          ) : flowContext.step === 'whenTimePeriod' || flowContext.step === 'daySpecificTime' ? (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8"><div className="flex justify-center gap-4">
                <TimePickerButton label="Hour" value={timePickerState.hour} options={getHourOptions()} isActive={timePickerState.activeDropdown === 'hour'} onToggle={() => setTimePickerState(p => ({ ...p, activeDropdown: p.activeDropdown === 'hour' ? '' : 'hour' }))} onSelect={(h) => { setTimePickerState(p => ({ ...p, hour: h, activeDropdown: '' })); if (timePickerState.minute && timePickerState.ampm) handleButtonSelect(`${h}:${timePickerState.minute}${timePickerState.ampm}`); }} />
                <TimePickerButton label="Minute" value={timePickerState.minute} options={getMinuteOptions()} isActive={timePickerState.activeDropdown === 'minute'} onToggle={() => setTimePickerState(p => ({ ...p, activeDropdown: p.activeDropdown === 'minute' ? '' : 'minute' }))} onSelect={(m) => { setTimePickerState(p => ({ ...p, minute: m, activeDropdown: '' })); if (timePickerState.hour && timePickerState.ampm) handleButtonSelect(`${timePickerState.hour}:${m}${timePickerState.ampm}`); }} />
                <TimePickerButton label="AM/PM" value={timePickerState.ampm} options={getAmPmOptions()} isActive={timePickerState.activeDropdown === 'ampm'} onToggle={() => setTimePickerState(p => ({ ...p, activeDropdown: p.activeDropdown === 'ampm' ? '' : 'ampm' }))} onSelect={(a) => { setTimePickerState(p => ({ ...p, ampm: a, activeDropdown: '' })); if (timePickerState.hour && timePickerState.minute) handleButtonSelect(`${timePickerState.hour}:${timePickerState.minute}${a}`); }} />
            </div></div>
          ) : flowContext.step === 'customDatePicker' ? (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8 relative">
              <div className="text-sm font-medium text-gray-600 mb-4">{new Date().getFullYear()} <span className="text-xs font-normal text-gray-400">(Current year)</span></div>
              <div className={`${showOtherMonths ? 'grid grid-cols-2 gap-6' : ''}`}>
                <div className="space-y-3 flex flex-col items-center">
                  {currentButtons.map((button: SmartButton) => <SmartActionButton key={button.id} button={button} onClick={() => handleButtonSelect(button.id)} />)}
                </div>
                {showOtherMonths && <div className="space-y-3 flex flex-col items-center">
                  {getRemainingMonthsInYear().map((button: SmartButton) => <SmartActionButton key={button.id} button={button} onClick={() => handleButtonSelect(button.id)} />)}
                </div>}
              </div>
            </div>
          ) : flowContext.step === 'monthPart' ? (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8 relative">
              {flowContext.eventPreview.hasPatternPreselection ? <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 leading-none whitespace-nowrap">Matching days preselected - tap to deselect</div> : <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 leading-none whitespace-nowrap">Select one date or many for this event</div>}
              {getMonthDates(flowContext.eventPreview.selectedMonth || '').map((week: (SmartButton | null)[], weekIndex: number) => (
                <div key={weekIndex} className={weekIndex > 0 ? "mt-3" : ""}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Week {weekIndex + 1}</h4>
                  <div className="grid grid-cols-7 gap-1">{week.map((button, dayIndex) => (
                      button ? <SmallDateButton key={button.id} button={button} isSelected={flowContext.eventPreview.selectedDates?.includes(button.id)} onClick={() => {
                          const currentSelected = flowContext.eventPreview.selectedDates || [];
                          const newSelected = currentSelected.includes(button.id) ? currentSelected.filter(id => id !== button.id) : [...currentSelected, button.id];
                          setFlowContext({ ...flowContext, eventPreview: { ...flowContext.eventPreview, selectedDates: newSelected, hasPatternPreselection: newSelected.length > currentSelected.length ? flowContext.eventPreview.hasPatternPreselection : false } });
                        }} dayColors={dayColors} /> : <div key={dayIndex} className="h-8"></div>
                  ))}</div>
                </div>
              ))}
            </div>
          ) : flowContext.step === 'whereLocation' ? (
            <div className="bg-white rounded-lg shadow-sm px-4 py-2 mb-8">{currentButtons.map((button: SmartButton) => <LocationButton key={button.id} button={button} onClick={() => handleButtonSelect(button.id)} />)}</div>
          ) : flowContext.step === 'eventNotes' ? (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <textarea value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} placeholder="Add any notes..." className="w-full p-3 border border-gray-200 rounded-md" rows={3} />
              <div className="mt-4">{currentButtons.map((button: SmartButton) => <div key={button.id} className="flex items-center gap-3">
                    <button onClick={() => handleButtonSelect(button.id)} className="bg-[#217e8f] text-white text-xs px-2 py-1 rounded-md">{button.label}</button>
                    {button.description && <span className="text-sm text-gray-500">{button.description}</span>}
              </div>)}</div>
            </div>
          ) : flowContext.step === 'dayBasedTimeSelection' ? (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8"><div className="space-y-3">{getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []).map((dayButton) => {
                const dayIndex = parseInt(dayButton.id.split('-')[1]);
                const isCompleted = !!flowContext.eventPreview.dayBasedTimes?.[dayIndex];
                return <div key={dayButton.id} className="flex items-center gap-3">
                  <button onClick={() => !isCompleted && handleButtonSelect(dayButton.id)} disabled={isCompleted} className={`${isCompleted ? 'bg-[#c0e2e7] text-gray-600' : 'bg-[#217e8f] text-white'} text-xs px-2 py-1 rounded-md w-[90px]`}>{isCompleted ? `${dayButton.label.replace('Set ', '')} set` : dayButton.label}</button>
                  <span className="text-sm text-gray-500">{dayButton.description}</span>
                  {isCompleted && <button onClick={() => handleButtonSelect(dayButton.id)} className="text-[#217e8f] text-xs">Edit</button>}
                </div>;
            })}</div></div>
          ) : flowContext.step === 'dayBasedLocationSelection' ? (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8"><div className="space-y-3">{getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []).map((dayButton) => {
                const dayIndex = parseInt(dayButton.id.split('-')[1]);
                const isCompleted = !!flowContext.eventPreview.dayBasedLocations?.[dayIndex];
                return <div key={dayButton.id} className="flex items-center gap-3">
                  <button onClick={() => !isCompleted && handleButtonSelect(dayButton.id)} disabled={isCompleted} className={`${isCompleted ? 'bg-[#c0e2e7] text-gray-600' : 'bg-[#217e8f] text-white'} text-xs px-2 py-1 rounded-md w-[90px]`}>{isCompleted ? `${dayButton.label.replace('Set ', '')} set` : dayButton.label}</button>
                  <span className="text-sm text-gray-500">{dayButton.description}</span>
                  {isCompleted && <button onClick={() => handleButtonSelect(dayButton.id)} className="text-[#217e8f] text-xs">Edit</button>}
                </div>;
            })}</div></div>
          ) : flowContext.step === 'customTimeSelection' ? (
            <div className="bg-white rounded-lg shadow-sm p-3 mb-8">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(flowContext.eventPreview.selectedDates || []).map((dateStr) => {
                  // Timezone-safe date parsing
                  const [year, month, day] = dateStr.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  
                  const dayOfWeekName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
                  const dayNum = new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date);
                  const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
                  
                  const jsDay = date.getDay();
                  const dayOfWeekIndex = jsDay === 0 ? 6 : jsDay - 1;
                  const bgColor = dayColors[dayOfWeekIndex];

                  const time = flowContext.eventPreview.dayBasedTimes?.[dateStr];
                  const isEditing = editingTimeForDate === dateStr;

                  const generateTimeOptions = () => {
                    const options = [];
                    for (let h = 7; h <= 21; h++) { // 7am to 9pm
                      options.push(`${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
                      options.push(`${h % 12 === 0 ? 12 : h % 12}:30 ${h < 12 || h === 24 ? 'AM' : 'PM'}`);
                    }
                    return options;
                  };
                  const quickTimeOptions = generateTimeOptions();

                  return (
                    <div key={dateStr} className={`flex flex-col items-center justify-between p-1.5 rounded-lg text-center`} style={{ backgroundColor: bgColor }}>
                      <div className="font-semibold text-gray-800 text-xs mb-1">{`${dayOfWeekName}, ${monthName} ${dayNum}`}</div>
                      <div className="mt-1 w-full flex-grow flex items-center justify-center">
                        {isEditing ? (
                          <div className="w-full">
                            {showFullPickerFor === dateStr ? (
                              customTime.hour === '' ? (
                                <div className="grid grid-cols-4 gap-1 p-1 bg-white/50 rounded-lg">
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                    <button key={h} onClick={() => setCustomTime({ ...customTime, hour: h.toString() })} className="text-xs font-semibold p-1 rounded-md bg-white/80 text-gray-700 hover:bg-white hover:text-gray-900">{h}</button>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="flex flex-col gap-1">
                                    {['00', '15', '30', '45'].map(m => (
                                      <button key={m} onClick={() => setCustomTime({ ...customTime, minute: m })} className={`text-xs p-1 w-10 rounded-md font-semibold ${customTime.minute === m ? 'bg-[#217e8f] text-white' : 'bg-white/70 text-gray-700 hover:bg-white'}`}>{`:${m}`}</button>
                                    ))}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <button onClick={() => handleSetTimeForDate(dateStr, `${customTime.hour}:${customTime.minute} AM`)} disabled={!customTime.minute} className="text-xs px-2 py-1 rounded-md bg-white/70 text-gray-700 font-semibold hover:bg-white disabled:bg-gray-200 disabled:text-gray-400">AM</button>
                                    <button onClick={() => handleSetTimeForDate(dateStr, `${customTime.hour}:${customTime.minute} PM`)} disabled={!customTime.minute} className="text-xs px-2 py-1 rounded-md bg-white/70 text-gray-700 font-semibold hover:bg-white disabled:bg-gray-200 disabled:text-gray-400">PM</button>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div ref={scrollableTimeRef} className="space-y-1 max-h-32 overflow-y-auto">
                                {quickTimeOptions.map(opt => (
                                  <button key={opt} data-time={opt} onClick={() => handleSetTimeForDate(dateStr, opt)} className="w-full text-xs bg-white/60 text-gray-800 px-1 py-0.5 rounded-md hover:bg-white">
                                    {opt}
                                  </button>
                                ))}
                                <button onClick={() => { setShowFullPickerFor(dateStr); setCustomTime({ hour: '', minute: '', ampm: '' }); }} className="w-full text-xs text-blue-600 pt-1 hover:underline">
                                  Custom
                                </button>
                              </div>
                            )}
                          </div>
                        ) : time ? (
                          <button
                            onClick={() => {
                              setEditingTimeForDate(dateStr);
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
                          <button onClick={() => { setEditingTimeForDate(dateStr); setShowFullPickerFor(null); }} className="text-xs bg-black/5 text-gray-700 px-2 py-1 rounded-md hover:bg-black/10 w-full">
                            Set Time
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFlowContext({...flowContext, step: 'repeatingSameLocation'})}
                  disabled={!areAllTimesSet}
                  className="bg-[#217e8f] text-white px-4 py-1 rounded-lg text-xs font-medium transition-colors enabled:hover:bg-[#1a6670] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Times set
                </button>
              </div>
            </div>
          ) : flowContext.step === 'whichChild' ? (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <div className="text-center mb-4"><div className="text-[10px] text-gray-400">Select one child or more for this event</div></div>
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-3 flex-1">{currentButtons.map((button: SmartButton) => <ChildSelectionButton key={button.id} button={button} isSelected={flowContext.eventPreview.selectedChildren?.includes(button.id) || false} onClick={() => handleButtonSelect(button.id)} getChildColor={getChildColor} fadeUnselected />)}</div>
                <button onClick={() => { if ((flowContext.eventPreview.selectedChildren || []).length > 0) setFlowContext({ ...flowContext, step: 'whenDate' }); }} disabled={!flowContext.eventPreview.selectedChildren?.length} className={`px-3 py-1.5 rounded-lg text-xs ml-4 ${flowContext.eventPreview.selectedChildren?.length ? 'bg-[#217e8f] text-white' : 'bg-gray-300 text-gray-500'}`}>
                  {(() => {
                    const count = flowContext.eventPreview.selectedChildren?.length || 0;
                    if (count === 0) return 'Select children';
                    if (count === 1) return '1 child selected';
                    return `${count} children selected`;
                  })()}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8"><div className="space-y-3">
              {currentButtons.map((button: SmartButton) => <SmartActionButton key={button.id} button={button} onClick={() => handleButtonSelect(button.id)} isChildButton={flowContext.step === 'whichChild'} getChildColor={getChildColor} />)}
            </div></div>
          )}

        </div>
      </main>

      <GlobalFooter value="" onChange={() => {}} placeholder="Or describe what you want to add..." />
      
      <GlobalChatDrawer drawerHeight={storedDrawerHeight || 100} onHeightChange={setStoredDrawerHeight} scrollContainerRefCallback={(node) => { if (node && chatContentScrollRef && 'current' in chatContentScrollRef) chatContentScrollRef.current = node; }}>
        <div className="h-full bg-white"><div className="p-4 text-center text-gray-500 text-sm">Chat integration coming soon...</div></div>
      </GlobalChatDrawer>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md ring-2 ring-[#217e8f] rounded-xl">
            <div 
              className="bg-[#217e8f] text-white px-4 py-2 rounded-t-xl relative border-b"
              style={{
                borderBottomColor: '#c0e2e7',
                boxShadow: 'inset 0 8px 15px -3px #0000001A, inset 0 -8px 15px -3px #0000001A'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {createdEvents.length === 1 
                    ? "Your event has been created" 
                    : "Your events have been created"}
                </span>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="text-white hover:text-gray-200 transition-colors flex items-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="relative h-[240px] w-full">
              <div className="absolute inset-0 bg-white" style={{ borderRadius: '0 0 12px 12px' }}></div>
              <div className="absolute top-3 left-2 right-2 bottom-2 rounded-xl overflow-hidden">
                <EventCard
                  image={getKicacoEventPhoto(createdEvents[currentEventIndex]?.eventName || 'default')}
                  name={createdEvents[currentEventIndex]?.eventName || 'Event'}
                  childName={createdEvents[currentEventIndex]?.childName}
                  date={createdEvents[currentEventIndex]?.date}
                  time={createdEvents[currentEventIndex]?.time}
                  location={createdEvents[currentEventIndex]?.location}
                  notes={createdEvents[currentEventIndex]?.notes}
                  showEventInfo={false}
                />
                <div className="absolute top-0 left-0 right-0 z-10 h-[56px] backdrop-blur-sm">
                  <div className="flex h-full items-center justify-between px-4">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <StackedChildBadges 
                        childName={createdEvents[currentEventIndex]?.childName} 
                        size="md" 
                        maxVisible={3}
                        className="flex-shrink-0"
                      />
                      <div className="flex items-center gap-1 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-white">
                            {createdEvents[currentEventIndex]?.eventName?.split(' ').map((word: string) => 
                              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            ).join(' ') || 'Event'}
                          </span>
                          {createdEvents[currentEventIndex]?.location && (
                            <span className="text-xs text-gray-200 mt-0.5">
                              {createdEvents[currentEventIndex].location.split('-').map((word: string) => 
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              ).join(' ')}
                            </span>
                          )}
                        </div>
                        {createdEvents.length > 1 && (
                          <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 flex-shrink-0">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCurrentEventIndex(prev => (prev - 1 + createdEvents.length) % createdEvents.length); 
                              }} 
                              className="text-gray-800 hover:text-gray-900 p-0"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <span className="text-gray-800 text-[10px] font-medium">
                              {currentEventIndex + 1}/{createdEvents.length}
                            </span>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCurrentEventIndex(prev => (prev + 1) % createdEvents.length); 
                              }} 
                              className="text-gray-800 hover:text-gray-900 p-0"
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col justify-center items-end flex-shrink-0 ml-2">
                      <span className="text-sm font-medium text-white whitespace-nowrap">
                        {createdEvents[currentEventIndex]?.date && 
                          format(parse(createdEvents[currentEventIndex].date, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d')}
                      </span>
                      {createdEvents[currentEventIndex]?.time && (
                        <span className="text-xs text-gray-200 mt-0.5 whitespace-nowrap">
                          {(() => {
                            const time = createdEvents[currentEventIndex].time;
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
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ 
                    background: `linear-gradient(90deg, transparent, ${createdEvents[currentEventIndex]?.date ? 
                      (['#f8b6c2', '#ffd8b5', '#fde68a', '#bbf7d0', '#c0e2e7', '#d1d5fa', '#e9d5ff'][parse(createdEvents[currentEventIndex].date, 'yyyy-MM-dd', new Date()).getDay()]) : 
                      '#c0e2e7'}, transparent)`
                  }}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 