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
import '../styles/KicacoFlow.css';
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
    editingLocationForDay,
    setEditingLocationForDay,
    showFullPickerFor,
    setShowFullPickerFor,
    customTime,
    setCustomTime,
    scrollableTimeRef,
    singleTimeScrollRef,
    handleSetTimeForDate,
    handleSetTimeForDay,
    handleSetLocationForDay,
    handleSetLocationForDate,
    areAllTimesSet,
    areAllLocationsSet,
  } = useFlowPickers(flowContext, setFlowContext);

  return (
    <div className="kicaco-flow kicaco-flow--full-height">
      <GlobalHeader />
      
      <GlobalSubheader 
        icon={<Waves />}
        title="Kicaco Flow"
      />

      <main className={`kicaco-flow__main ${(flowContext.step === 'dayBasedTimeGrid' || flowContext.step === 'whenTimePeriod' || flowContext.step === 'customTimeSelection' || flowContext.step === 'monthPart') ? 'kicaco-flow__main--hide-scrollbar' : ''}`}>
        <div className="kicaco-flow__content-container">
          
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
              setFlowContext={setFlowContext}
              showFullPickerFor={showFullPickerFor}
              setShowFullPickerFor={setShowFullPickerFor}
              customTime={customTime}
              setCustomTime={setCustomTime}
              singleTimeScrollRef={singleTimeScrollRef}
              handleButtonSelect={handleButtonSelect}
            />
          ) : flowContext.step === 'monthPart' ? (
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
              editingLocationForDay={editingLocationForDay}
              setEditingLocationForDay={setEditingLocationForDay}
              showFullPickerFor={showFullPickerFor}
              setShowFullPickerFor={setShowFullPickerFor}
              handleSetLocationForDay={handleSetLocationForDay}
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
            <div className="kicaco-flow__step-container">
              <div className="kicaco-flow__button-list space-y-3">
                                  {currentButtons.map((button: SmartButton) => 
                    <div key={button.id} className="flex items-end justify-between min-h-[30px]">
                      {button.description && (
                        <div className="text-[12.5px] text-gray-500 flex-1 pr-3 max-h-[30px] overflow-hidden leading-tight">{button.description}</div>
                      )}
                    <div className="flex-shrink-0">
                      <SmartActionButton 
                        button={{ id: button.id, label: button.label }} 
                        onClick={() => handleButtonSelect(button.id)} 
                        isChildButton={false} 
                        getChildColor={getChildColor} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : flowContext.step === 'whichChild' ? (
            <div className="kicaco-flow__step-container">
              <div className="kicaco-flow__child-selection-hint" style={{ marginTop: '-8px' }}>
                <div className="kicaco-flow__child-selection-hint-text">Select one child or more for this event</div>
              </div>
              <div className="kicaco-flow__child-selection-list space-y-3">
                {currentButtons.map((button: SmartButton) => 
                  <div key={button.id} className="flex items-end min-h-[30px]">
                    <div className="flex-shrink-0">
                      <ChildSelectionButton 
                        button={{ id: button.id, label: button.label }}
                        isSelected={flowContext.eventPreview.selectedChildren?.includes(button.id) || false} 
                        onClick={() => handleButtonSelect(button.id)} 
                        getChildColor={getChildColor} 
                        fadeUnselected 
                      />
                    </div>
                    {button.description && (
                      <div className="text-[12.5px] text-gray-500 ml-3 max-h-[30px] overflow-hidden leading-tight">{button.description}</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Select Children Button - Own Row */}
              <div className="kicaco-flow__child-selection-button-row flex items-end justify-between mt-6">
                {/* Count Text - Left Aligned */}
                <div className="text-[12.5px] text-gray-500 leading-tight">
                  {(() => {
                    const count = flowContext.eventPreview.selectedChildren?.length || 0;
                    if (count === 0) return '';
                    if (count === 1) return '1 child selected';
                    return `${count} children selected`;
                  })()}
                </div>
                
                {/* Action Button - Right Aligned */}
                <button 
                  onClick={() => { 
                    if ((flowContext.eventPreview.selectedChildren || []).length > 0) {
                      // Go directly to current month selection
                      const today = new Date();
                      const currentMonthId = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase().replace(' ', '-');
                      setFlowContext({ 
                        ...flowContext, 
                        step: 'monthPart',
                        eventPreview: {
                          ...flowContext.eventPreview,
                          selectedMonth: currentMonthId
                        }
                      }); 
                    }
                  }} 
                  disabled={!flowContext.eventPreview.selectedChildren?.length} 
                  className={`kicaco-flow__child-selection-continue ${flowContext.eventPreview.selectedChildren?.length ? 'kicaco-flow__child-selection-continue--active' : 'kicaco-flow__child-selection-continue--disabled'}`}
                  style={{
                    width: (flowContext.eventPreview.selectedChildren?.length || 0) > 1 ? '120px' : '115px'
                  }}
                >
                  {(() => {
                    const count = flowContext.eventPreview.selectedChildren?.length || 0;
                    if (count === 0) return 'Select Children';
                    if (count === 1) return 'Confirm Child';
                    return 'Confirm Children';
                  })()}
                </button>
              </div>
            </div>
          ) : (
            <div className="kicaco-flow__step-container">
              {(flowContext.step === 'initial' || flowContext.step === 'eventCategory' || flowContext.step === 'eventType' || flowContext.step === 'repeatingSameTime') ? (
                // Special layout for various screens with right-aligned or center-aligned buttons
                <div className="kicaco-flow__button-list space-y-3">
                  {currentButtons.map((button: SmartButton) =>  (
                      // Right-aligned layout for other screens
                                              <div key={button.id} className="flex items-end justify-between min-h-[30px]">
                          {button.description && (
                            <div className="text-[12.5px] text-gray-500 flex-1 pr-3 max-h-[30px] overflow-hidden leading-tight">{button.description}</div>
                          )}
                        <div className="flex-shrink-0">
                          <SmartActionButton 
                            button={{ id: button.id, label: button.label }} 
                            onClick={() => handleButtonSelect(button.id)} 
                            isChildButton={flowContext.step === 'whichChild'} 
                            getChildColor={getChildColor} 
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                // Default layout for all other screens
                <div className="kicaco-flow__button-list">
                  {currentButtons.map((button: SmartButton) => 
                    <SmartActionButton 
                      key={button.id} 
                      button={button} 
                      onClick={() => handleButtonSelect(button.id)} 
                      isChildButton={flowContext.step === 'whichChild'} 
                      getChildColor={getChildColor} 
                    />
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <GlobalFooter 
        value="" 
        onChange={() => {}} 
        placeholder="Or describe what you want to add..." 
      />
      
      <GlobalChatDrawer 
        drawerHeight={storedDrawerHeight || 100} 
        onHeightChange={setStoredDrawerHeight} 
        scrollContainerRefCallback={(node) => { 
          if (node && chatContentScrollRef && 'current' in chatContentScrollRef) 
            chatContentScrollRef.current = node; 
        }}
      >
        <div className="kicaco-flow__chat-placeholder">
          <div className="kicaco-flow__chat-placeholder-text">Chat integration coming soon...</div>
        </div>
      </GlobalChatDrawer>

      {showConfirmation && (
        <div className="kicaco-flow__confirmation-overlay">
          <div className="kicaco-flow__confirmation-modal">
            <div className="kicaco-flow__confirmation-header">
              <div className="kicaco-flow__confirmation-header-content">
                <span className="kicaco-flow__confirmation-title">
                  {createdEvents.length === 1 
                    ? "Your event has been created" 
                    : "Your events have been created"}
                </span>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="kicaco-flow__confirmation-close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="kicaco-flow__confirmation-content">
              <div className="kicaco-flow__confirmation-content-bg"></div>
              <div className="kicaco-flow__confirmation-event-container">
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
                <div className="kicaco-flow__confirmation-event-overlay">
                  <div className="kicaco-flow__confirmation-event-header">
                    <div className="kicaco-flow__confirmation-event-info">
                      <StackedChildBadges 
                        childName={createdEvents[currentEventIndex]?.childName} 
                        size="md" 
                        maxVisible={3}
                        className="kicaco-flow__confirmation-child-badges"
                      />
                      <div className="kicaco-flow__confirmation-event-details">
                        <div className="kicaco-flow__confirmation-event-name-container">
                          <span className="kicaco-flow__confirmation-event-name">
                            {createdEvents[currentEventIndex]?.eventName?.split(' ').map((word: string) => 
                              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            ).join(' ') || 'Event'}
                          </span>
                          {createdEvents[currentEventIndex]?.location && (
                            <span className="kicaco-flow__confirmation-event-location">
                              {createdEvents[currentEventIndex].location.split('-').map((word: string) => 
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              ).join(' ')}
                            </span>
                          )}
                        </div>
                        {createdEvents.length > 1 && (
                          <div className="kicaco-flow__confirmation-navigation">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCurrentEventIndex(prev => (prev - 1 + createdEvents.length) % createdEvents.length); 
                              }} 
                              className="kicaco-flow__confirmation-nav-btn kicaco-flow__confirmation-nav-btn--prev"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <span className="kicaco-flow__confirmation-nav-counter">
                              {currentEventIndex + 1}/{createdEvents.length}
                            </span>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCurrentEventIndex(prev => (prev + 1) % createdEvents.length); 
                              }} 
                              className="kicaco-flow__confirmation-nav-btn kicaco-flow__confirmation-nav-btn--next"
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="kicaco-flow__confirmation-event-meta">
                      <span className="kicaco-flow__confirmation-event-date">
                        {createdEvents[currentEventIndex]?.date && 
                          format(parse(createdEvents[currentEventIndex].date, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d')}
                      </span>
                      {createdEvents[currentEventIndex]?.time && (
                        <span className="kicaco-flow__confirmation-event-time">
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
                  <div 
                    className="kicaco-flow__confirmation-event-divider"
                    style={{ 
                      background: `linear-gradient(90deg, transparent, ${createdEvents[currentEventIndex]?.date ? 
                        (['#f8b6c2', '#ffd8b5', '#fde68a', '#bbf7d0', '#c0e2e7', '#d1d5fa', '#e9d5ff'][parse(createdEvents[currentEventIndex].date, 'yyyy-MM-dd', new Date()).getDay()]) : 
                        '#c0e2e7'}, transparent)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 