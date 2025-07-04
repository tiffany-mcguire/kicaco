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
import { useFlowPickers } from '../hooks/useFlowPickers';
import { format, parse } from 'date-fns';
import {
  SmartActionButton,
  TimePickerButton,
  LocationButton,
  SmallDateButton,
  ChildSelectionButton,
  FlowNavigationHeader,
  SportsTypeSelection,
  TimeSelection,
  DateSelection,
  LocationSelection,
  EventNotes,
  DayBasedLocationGrid,
  DayBasedTimeGrid,
  CustomTimeSelection,
  CustomLocationSelection
} from '../components/flow';
import { getLocationButtons } from '../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../constants/flowColors';

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
    editingLocationForDate,
    setEditingLocationForDate,
    customLocationInput,
    setCustomLocationInput,
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

  const {
    editingTimeForDate,
    setEditingTimeForDate,
    editingTimeForDay,
    setEditingTimeForDay,
    showFullPickerFor,
    setShowFullPickerFor,
    customTime,
    setCustomTime,
    scrollableTimeRef,
    singleTimeScrollRef,
    handleSetTimeForDate,
    handleSetTimeForDay,
    handleSetLocationForDate,
    areAllTimesSet,
    areAllLocationsSet,
  } = useFlowPickers(flowContext, setFlowContext);

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
          
          <FlowNavigationHeader 
            flowContext={flowContext}
            setFlowContext={setFlowContext}
            currentQuestion={currentQuestion}
          />

          {flowContext.step === 'sportsType' ? (
            <SportsTypeSelection
              flowContext={flowContext}
              setFlowContext={setFlowContext}
              getPersonalizedSports={getPersonalizedSports}
              getAllSportsAlphabetical={getAllSportsAlphabetical}
              handleButtonSelect={handleButtonSelect}
            />
          ) : flowContext.step === 'whenTimePeriod' || flowContext.step === 'daySpecificTime' ? (
            <TimeSelection
              flowContext={flowContext}
              showFullPickerFor={showFullPickerFor}
              setShowFullPickerFor={setShowFullPickerFor}
              customTime={customTime}
              setCustomTime={setCustomTime}
              singleTimeScrollRef={singleTimeScrollRef}
              handleButtonSelect={handleButtonSelect}
            />
          ) : flowContext.step === 'customDatePicker' || flowContext.step === 'monthPart' ? (
            <DateSelection
              flowContext={flowContext}
              setFlowContext={setFlowContext}
              showOtherMonths={showOtherMonths}
              currentButtons={currentButtons}
              getRemainingMonthsInYear={getRemainingMonthsInYear}
              getMonthDates={getMonthDates}
              dayColors={dayColors}
              handleButtonSelect={handleButtonSelect}
            />
          ) : flowContext.step === 'whereLocation' ? (
            <LocationSelection
              flowContext={flowContext}
              customLocationInput={customLocationInput}
              setCustomLocationInput={setCustomLocationInput}
              handleButtonSelect={handleButtonSelect}
            />
          ) : flowContext.step === 'eventNotes' ? (
            <EventNotes
              eventNotes={eventNotes}
              setEventNotes={setEventNotes}
              currentButtons={currentButtons}
              handleButtonSelect={handleButtonSelect}
            />
          ) : flowContext.step === 'dayBasedLocationSelection' ? (
            <DayBasedLocationGrid
              flowContext={flowContext}
              setFlowContext={setFlowContext}
              editingLocationForDate={editingLocationForDate}
              setEditingLocationForDate={setEditingLocationForDate}
              customLocationInput={customLocationInput}
              setCustomLocationInput={setCustomLocationInput}
            />
          ) : flowContext.step === 'dayBasedTimeGrid' ? (
            <DayBasedTimeGrid
              flowContext={flowContext}
              setFlowContext={setFlowContext}
              editingTimeForDay={editingTimeForDay}
              setEditingTimeForDay={setEditingTimeForDay}
              showFullPickerFor={showFullPickerFor}
              setShowFullPickerFor={setShowFullPickerFor}
              customTime={customTime}
              setCustomTime={setCustomTime}
              scrollableTimeRef={scrollableTimeRef}
              handleSetTimeForDay={handleSetTimeForDay}
            />
          ) : flowContext.step === 'customTimeSelection' ? (
            <CustomTimeSelection
              flowContext={flowContext}
              setFlowContext={setFlowContext}
              editingTimeForDate={editingTimeForDate}
              setEditingTimeForDate={setEditingTimeForDate}
              showFullPickerFor={showFullPickerFor}
              setShowFullPickerFor={setShowFullPickerFor}
              customTime={customTime}
              setCustomTime={setCustomTime}
              scrollableTimeRef={scrollableTimeRef}
              handleSetTimeForDate={handleSetTimeForDate}
              areAllTimesSet={areAllTimesSet}
            />
          ) : flowContext.step === 'customLocationSelection' ? (
            <CustomLocationSelection
              flowContext={flowContext}
              setFlowContext={setFlowContext}
              editingLocationForDate={editingLocationForDate}
              setEditingLocationForDate={setEditingLocationForDate}
              customLocationInput={customLocationInput}
              setCustomLocationInput={setCustomLocationInput}
              handleSetLocationForDate={handleSetLocationForDate}
              areAllLocationsSet={areAllLocationsSet}
            />
          ) : flowContext.step === 'repeatingSameLocation' ? (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <div className="space-y-3">
                {currentButtons.map((button: SmartButton) => (
                  <SmartActionButton 
                    key={button.id} 
                    button={button} 
                    onClick={() => handleButtonSelect(button.id)} 
                    isChildButton={false} 
                    getChildColor={getChildColor} 
                  />
                ))}
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
                    if (count === 0) return 'Select Children';
                    if (count === 1) return '1 Child Selected';
                    return `${count} Children Selected`;
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