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
  ProgressIndicator,
  SportsTypeSelection,
  TimeSelection,
  DateSelection,
  LocationSelection,
  EventNotes,
  DayBasedLocationGrid,
  DayBasedTimeGrid,
  CustomTimeSelection,
  CustomLocationSelection,
  ConfirmationScreen
} from '../components/flow';
import { getLocationButtons, handleButtonSelect as logicHandleButtonSelect } from '../hooks/useKicacoFlowLogic';
import { roygbivColors } from '../constants/flowColors';

export default function KicacoFlow() {
  const [contactFields, setContactFields] = useState({
    contactName: '',
    phoneNumber: '',
    email: '',
    websiteUrl: ''
  });

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

  const handleButtonSelect = (buttonId: string) => {
    logicHandleButtonSelect({
      buttonId,
      flowContext,
      eventNotes,
      contactFields,
      setFlowContext,
      setShowOtherMonths: () => {}, // This function is not used in the flow logic anymore
      setCreatedEvents,
      setCurrentEventIndex,
      setShowConfirmation: () => {}, // This function is not used in the flow logic anymore
    });
  };

  const resetFlow = () => {
    // Reset flow context to initial state
    setFlowContext({
      step: 'initial',
      selections: {},
      eventPreview: {}
    });
    
    // Reset contact fields
    setContactFields({
      contactName: '',
      phoneNumber: '',
      email: '',
      websiteUrl: ''
    });
    
    // Reset notes
    setEventNotes('');
    
    // Reset time picker state
    setTimePickerState({
      hour: '',
      minute: '',
      ampm: '',
      activeDropdown: ''
    });
    
    // Reset location editing state
    setEditingLocationForDate(null);
    setCustomLocationInput('');
    
    // Reset event creation state
    setCreatedEvents([]);
    setCurrentEventIndex(0);
  };

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
            <>
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
              
              {/* Progress Indicator Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                {flowContext.isEditMode ? (
                  <div className="flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <ProgressIndicator flowStep={flowContext.step} />
                    </div>
                    <div>
                  <button
                    onClick={() => {
                      // Recreate events using the same logic as the Create Event button
                      const { subtype, eventType } = flowContext.eventPreview;
                      const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
                      const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
                      const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

                      const baseEvent = {
                        eventName: fullEventName || 'Event',
                        childName: flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 ? flowContext.eventPreview.selectedChildren.join(', ') : '',
                        date: flowContext.eventPreview.date || '',
                        time: flowContext.eventPreview.time || '',
                        location: flowContext.eventPreview.location || '',
                        notes: eventNotes || '',
                        contactName: contactFields?.contactName || '',
                        phoneNumber: contactFields?.phoneNumber || '',
                        email: contactFields?.email || '',
                        websiteUrl: contactFields?.websiteUrl || '',
                        eventType: flowContext.eventPreview.eventType || '',
                        category: flowContext.eventPreview.category || ''
                      };

                      const events = (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 0)
                        ? flowContext.eventPreview.selectedDates.map(date => {
                          const [year, month, day] = date.split('-').map(Number);
                          const eventDate = new Date(year, month - 1, day);
                          const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                          
                          let eventTime = flowContext.eventPreview.dayBasedTimes?.[date] || flowContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
                          let eventLocation = flowContext.eventPreview.dateBasedLocations?.[date] || flowContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

                          return { ...baseEvent, date, time: eventTime, location: eventLocation };
                        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
                        : [baseEvent];

                      setCreatedEvents(events);
                      setCurrentEventIndex(0);
                      setFlowContext({ 
                        ...flowContext, 
                        step: 'confirmation',
                        isEditMode: false
                      });
                    }}
                    className="text-[#c4828d] hover:text-white transition-colors font-medium text-sm"
                  >
                    Resave Event
                  </button>
                    </div>
                  </div>
                ) : (
                  <ProgressIndicator flowStep={flowContext.step} />
                )}
              </div>
            </>
          ) : flowContext.step === 'monthPart' ? (
            <>
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
              
              {/* Progress Indicator Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                {flowContext.isEditMode ? (
                  <div className="flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <ProgressIndicator flowStep={flowContext.step} />
                    </div>
                    <div>
                  <button
                    onClick={() => {
                      // Recreate events using the same logic as the Create Event button
                      const { subtype, eventType } = flowContext.eventPreview;
                      const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
                      const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
                      const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

                      const baseEvent = {
                        eventName: fullEventName || 'Event',
                        childName: flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 ? flowContext.eventPreview.selectedChildren.join(', ') : '',
                        date: flowContext.eventPreview.date || '',
                        time: flowContext.eventPreview.time || '',
                        location: flowContext.eventPreview.location || '',
                        notes: eventNotes || '',
                        contactName: contactFields?.contactName || '',
                        phoneNumber: contactFields?.phoneNumber || '',
                        email: contactFields?.email || '',
                        websiteUrl: contactFields?.websiteUrl || '',
                        eventType: flowContext.eventPreview.eventType || '',
                        category: flowContext.eventPreview.category || ''
                      };

                      const events = (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 0)
                        ? flowContext.eventPreview.selectedDates.map(date => {
                          const [year, month, day] = date.split('-').map(Number);
                          const eventDate = new Date(year, month - 1, day);
                          const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                          
                          let eventTime = flowContext.eventPreview.dayBasedTimes?.[date] || flowContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
                          let eventLocation = flowContext.eventPreview.dateBasedLocations?.[date] || flowContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

                          return { ...baseEvent, date, time: eventTime, location: eventLocation };
                        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
                        : [baseEvent];

                      setCreatedEvents(events);
                      setCurrentEventIndex(0);
                      setFlowContext({ 
                        ...flowContext, 
                        step: 'confirmation',
                        isEditMode: false
                      });
                    }}
                    className="text-[#c4828d] hover:text-white transition-colors font-medium text-sm"
                  >
                    Resave Event
                  </button>
                    </div>
                  </div>
                ) : (
                  <ProgressIndicator flowStep={flowContext.step} />
                )}
              </div>
            </>
          ) : flowContext.step === 'whereLocation' ? (
            <>
              <LocationSelection
                flowContext={flowContext}
                setFlowContext={setFlowContext}
                customLocationInput={customLocationInput}
                setCustomLocationInput={setCustomLocationInput}
                handleButtonSelect={handleButtonSelect}
              />
              
              {/* Progress Indicator Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                {flowContext.isEditMode ? (
                  <div className="flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <ProgressIndicator flowStep={flowContext.step} />
                    </div>
                    <div>
                  <button
                    onClick={() => {
                      // Recreate events using the same logic as the Create Event button
                      const { subtype, eventType } = flowContext.eventPreview;
                      const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
                      const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
                      const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

                      const baseEvent = {
                        eventName: fullEventName || 'Event',
                        childName: flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 ? flowContext.eventPreview.selectedChildren.join(', ') : '',
                        date: flowContext.eventPreview.date || '',
                        time: flowContext.eventPreview.time || '',
                        location: flowContext.eventPreview.location || '',
                        notes: eventNotes || '',
                        contactName: contactFields?.contactName || '',
                        phoneNumber: contactFields?.phoneNumber || '',
                        email: contactFields?.email || '',
                        websiteUrl: contactFields?.websiteUrl || '',
                        eventType: flowContext.eventPreview.eventType || '',
                        category: flowContext.eventPreview.category || ''
                      };

                      const events = (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 0)
                        ? flowContext.eventPreview.selectedDates.map(date => {
                          const [year, month, day] = date.split('-').map(Number);
                          const eventDate = new Date(year, month - 1, day);
                          const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                          
                          let eventTime = flowContext.eventPreview.dayBasedTimes?.[date] || flowContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
                          let eventLocation = flowContext.eventPreview.dateBasedLocations?.[date] || flowContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

                          return { ...baseEvent, date, time: eventTime, location: eventLocation };
                        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
                        : [baseEvent];

                      setCreatedEvents(events);
                      setCurrentEventIndex(0);
                      setFlowContext({ 
                        ...flowContext, 
                        step: 'confirmation',
                        isEditMode: false
                      });
                    }}
                    className="text-[#c4828d] hover:text-white transition-colors font-medium text-sm"
                  >
                    Resave Event
                  </button>
                    </div>
                  </div>
                ) : (
                  <ProgressIndicator flowStep={flowContext.step} />
                )}
              </div>
            </>
          ) : flowContext.step === 'eventNotes' ? (
            <EventNotes
              eventNotes={eventNotes}
              setEventNotes={setEventNotes}
              currentButtons={currentButtons}
              handleButtonSelect={handleButtonSelect}
              contactFields={contactFields}
              setContactFields={setContactFields}
              flowContext={flowContext}
              setFlowContext={setFlowContext}
              createdEvents={createdEvents}
              setCreatedEvents={setCreatedEvents}
              setCurrentEventIndex={setCurrentEventIndex}
            />
          ) : flowContext.step === 'confirmation' ? (
            <ConfirmationScreen
              createdEvents={createdEvents}
              currentEventIndex={currentEventIndex}
              setCurrentEventIndex={setCurrentEventIndex}
              currentButtons={currentButtons}
              handleButtonSelect={handleButtonSelect}
              getChildColor={getChildColor}
              flowContext={flowContext}
              setFlowContext={setFlowContext}
              resetFlow={resetFlow}
            />
          ) : flowContext.step === 'dayBasedLocationSelection' ? (
            <>
              <DayBasedLocationGrid
                flowContext={flowContext}
                setFlowContext={setFlowContext}
                editingLocationForDay={editingLocationForDay}
                setEditingLocationForDay={setEditingLocationForDay}
                showFullPickerFor={showFullPickerFor}
                setShowFullPickerFor={setShowFullPickerFor}
                handleSetLocationForDay={handleSetLocationForDay}
              />
              
              {/* Progress Indicator Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                {flowContext.isEditMode ? (
                  <div className="flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <ProgressIndicator flowStep={flowContext.step} />
                    </div>
                    <div>
                  <button
                    onClick={() => {
                      // Recreate events using the same logic as the Create Event button
                      const { subtype, eventType } = flowContext.eventPreview;
                      const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
                      const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
                      const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

                      const baseEvent = {
                        eventName: fullEventName || 'Event',
                        childName: flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 ? flowContext.eventPreview.selectedChildren.join(', ') : '',
                        date: flowContext.eventPreview.date || '',
                        time: flowContext.eventPreview.time || '',
                        location: flowContext.eventPreview.location || '',
                        notes: eventNotes || '',
                        contactName: contactFields?.contactName || '',
                        phoneNumber: contactFields?.phoneNumber || '',
                        email: contactFields?.email || '',
                        websiteUrl: contactFields?.websiteUrl || '',
                        eventType: flowContext.eventPreview.eventType || '',
                        category: flowContext.eventPreview.category || ''
                      };

                      const events = (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 0)
                        ? flowContext.eventPreview.selectedDates.map(date => {
                          const [year, month, day] = date.split('-').map(Number);
                          const eventDate = new Date(year, month - 1, day);
                          const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                          
                          let eventTime = flowContext.eventPreview.dayBasedTimes?.[date] || flowContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
                          let eventLocation = flowContext.eventPreview.dateBasedLocations?.[date] || flowContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

                          return { ...baseEvent, date, time: eventTime, location: eventLocation };
                        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
                        : [baseEvent];

                      setCreatedEvents(events);
                      setCurrentEventIndex(0);
                      setFlowContext({ 
                        ...flowContext, 
                        step: 'confirmation',
                        isEditMode: false
                      });
                    }}
                    className="text-[#c4828d] hover:text-white transition-colors font-medium text-sm"
                  >
                    Resave Event
                  </button>
                    </div>
                  </div>
                ) : (
                  <ProgressIndicator flowStep={flowContext.step} />
                )}
              </div>
            </>
          ) : flowContext.step === 'dayBasedTimeGrid' ? (
            <>
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
              
              {/* Progress Indicator Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                {flowContext.isEditMode ? (
                  <div className="flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <ProgressIndicator flowStep={flowContext.step} />
                    </div>
                    <div>
                  <button
                    onClick={() => {
                      // Recreate events using the same logic as the Create Event button
                      const { subtype, eventType } = flowContext.eventPreview;
                      const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
                      const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
                      const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

                      const baseEvent = {
                        eventName: fullEventName || 'Event',
                        childName: flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 ? flowContext.eventPreview.selectedChildren.join(', ') : '',
                        date: flowContext.eventPreview.date || '',
                        time: flowContext.eventPreview.time || '',
                        location: flowContext.eventPreview.location || '',
                        notes: eventNotes || '',
                        contactName: contactFields?.contactName || '',
                        phoneNumber: contactFields?.phoneNumber || '',
                        email: contactFields?.email || '',
                        websiteUrl: contactFields?.websiteUrl || '',
                        eventType: flowContext.eventPreview.eventType || '',
                        category: flowContext.eventPreview.category || ''
                      };

                      const events = (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 0)
                        ? flowContext.eventPreview.selectedDates.map(date => {
                          const [year, month, day] = date.split('-').map(Number);
                          const eventDate = new Date(year, month - 1, day);
                          const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                          
                          let eventTime = flowContext.eventPreview.dayBasedTimes?.[date] || flowContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
                          let eventLocation = flowContext.eventPreview.dateBasedLocations?.[date] || flowContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

                          return { ...baseEvent, date, time: eventTime, location: eventLocation };
                        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
                        : [baseEvent];

                      setCreatedEvents(events);
                      setCurrentEventIndex(0);
                      setFlowContext({ 
                        ...flowContext, 
                        step: 'confirmation',
                        isEditMode: false
                      });
                    }}
                    className="text-[#c4828d] hover:text-white transition-colors font-medium text-sm"
                  >
                    Resave Event
                  </button>
                    </div>
                  </div>
                ) : (
                  <ProgressIndicator flowStep={flowContext.step} />
                )}
              </div>
            </>
          ) : flowContext.step === 'customTimeSelection' ? (
            <>
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
              
              {/* Progress Indicator Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                {flowContext.isEditMode ? (
                  <div className="flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <ProgressIndicator flowStep={flowContext.step} />
                    </div>
                                         <div>
                      <button
                    onClick={() => {
                      // Recreate events using the same logic as the Create Event button
                      const { subtype, eventType } = flowContext.eventPreview;
                      const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
                      const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
                      const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

                      const baseEvent = {
                        eventName: fullEventName || 'Event',
                        childName: flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 ? flowContext.eventPreview.selectedChildren.join(', ') : '',
                        date: flowContext.eventPreview.date || '',
                        time: flowContext.eventPreview.time || '',
                        location: flowContext.eventPreview.location || '',
                        notes: eventNotes || '',
                        contactName: contactFields?.contactName || '',
                        phoneNumber: contactFields?.phoneNumber || '',
                        email: contactFields?.email || '',
                        websiteUrl: contactFields?.websiteUrl || '',
                        eventType: flowContext.eventPreview.eventType || '',
                        category: flowContext.eventPreview.category || ''
                      };

                      const events = (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 0)
                        ? flowContext.eventPreview.selectedDates.map(date => {
                          const [year, month, day] = date.split('-').map(Number);
                          const eventDate = new Date(year, month - 1, day);
                          const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                          
                          let eventTime = flowContext.eventPreview.dayBasedTimes?.[date] || flowContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
                          let eventLocation = flowContext.eventPreview.dateBasedLocations?.[date] || flowContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

                          return { ...baseEvent, date, time: eventTime, location: eventLocation };
                        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
                        : [baseEvent];

                      setCreatedEvents(events);
                      setCurrentEventIndex(0);
                      setFlowContext({ 
                        ...flowContext, 
                        step: 'confirmation',
                        isEditMode: false
                      });
                    }}
                    className="text-[#c4828d] hover:text-white transition-colors font-medium text-sm"
                  >
                    Resave Event
                  </button>
                    </div>
                  </div>
                ) : (
                  <ProgressIndicator flowStep={flowContext.step} />
                )}
              </div>
            </>
          ) : flowContext.step === 'customLocationSelection' ? (
            <>
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
              
              {/* Progress Indicator Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                {flowContext.isEditMode ? (
                  <div className="flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <ProgressIndicator flowStep={flowContext.step} />
                    </div>
                    <div>
                  <button
                    onClick={() => {
                      // Recreate events using the same logic as the Create Event button
                      const { subtype, eventType } = flowContext.eventPreview;
                      const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
                      const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
                      const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

                      const baseEvent = {
                        eventName: fullEventName || 'Event',
                        childName: flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 ? flowContext.eventPreview.selectedChildren.join(', ') : '',
                        date: flowContext.eventPreview.date || '',
                        time: flowContext.eventPreview.time || '',
                        location: flowContext.eventPreview.location || '',
                        notes: eventNotes || '',
                        contactName: contactFields?.contactName || '',
                        phoneNumber: contactFields?.phoneNumber || '',
                        email: contactFields?.email || '',
                        websiteUrl: contactFields?.websiteUrl || '',
                        eventType: flowContext.eventPreview.eventType || '',
                        category: flowContext.eventPreview.category || ''
                      };

                      const events = (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 0)
                        ? flowContext.eventPreview.selectedDates.map(date => {
                          const [year, month, day] = date.split('-').map(Number);
                          const eventDate = new Date(year, month - 1, day);
                          const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                          
                          let eventTime = flowContext.eventPreview.dayBasedTimes?.[date] || flowContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
                          let eventLocation = flowContext.eventPreview.dateBasedLocations?.[date] || flowContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

                          return { ...baseEvent, date, time: eventTime, location: eventLocation };
                        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
                        : [baseEvent];

                      setCreatedEvents(events);
                      setCurrentEventIndex(0);
                      setFlowContext({ 
                        ...flowContext, 
                        step: 'confirmation',
                        isEditMode: false
                      });
                    }}
                    className="text-[#c4828d] hover:text-white transition-colors font-medium text-sm"
                  >
                    Resave Event
                  </button>
                    </div>
                  </div>
                ) : (
                  <ProgressIndicator flowStep={flowContext.step} />
                )}
              </div>
            </>
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
            <>
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

              {/* Progress Indicator Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
                                  {flowContext.isEditMode ? (
                    <div className="flex justify-between items-center">
                      <div className="flex-1 pr-4">
                        <ProgressIndicator flowStep={flowContext.step} />
                      </div>
                      <div>
                  <button
                    onClick={() => {
                      // Recreate events using the same logic as the Create Event button
                      const { subtype, eventType } = flowContext.eventPreview;
                      const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
                      const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
                      const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

                      const baseEvent = {
                        eventName: fullEventName || 'Event',
                        childName: flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 ? flowContext.eventPreview.selectedChildren.join(', ') : '',
                        date: flowContext.eventPreview.date || '',
                        time: flowContext.eventPreview.time || '',
                        location: flowContext.eventPreview.location || '',
                        notes: eventNotes || '',
                        contactName: contactFields?.contactName || '',
                        phoneNumber: contactFields?.phoneNumber || '',
                        email: contactFields?.email || '',
                        websiteUrl: contactFields?.websiteUrl || '',
                        eventType: flowContext.eventPreview.eventType || '',
                        category: flowContext.eventPreview.category || ''
                      };

                      const events = (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 0)
                        ? flowContext.eventPreview.selectedDates.map(date => {
                          const [year, month, day] = date.split('-').map(Number);
                          const eventDate = new Date(year, month - 1, day);
                          const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                          
                          let eventTime = flowContext.eventPreview.dayBasedTimes?.[date] || flowContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
                          let eventLocation = flowContext.eventPreview.dateBasedLocations?.[date] || flowContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

                          return { ...baseEvent, date, time: eventTime, location: eventLocation };
                        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
                        : [baseEvent];

                      setCreatedEvents(events);
                      setCurrentEventIndex(0);
                      setFlowContext({ 
                        ...flowContext, 
                        step: 'confirmation',
                        isEditMode: false
                      });
                    }}
                    className="text-[#c4828d] hover:text-white transition-colors font-medium text-sm"
                  >
                    Resave Event
                  </button>
                    </div>
                  </div>
                ) : (
                  <ProgressIndicator flowStep={flowContext.step} />
                )}
              </div>
            </>
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

          {/* Progress Indicator Card - appears on flow screens that don't have their own */}
          {flowContext.step !== 'confirmation' && flowContext.step !== 'whichChild' && flowContext.step !== 'monthPart' && flowContext.step !== 'whenTimePeriod' && flowContext.step !== 'daySpecificTime' && flowContext.step !== 'whereLocation' && flowContext.step !== 'dayBasedTimeGrid' && flowContext.step !== 'customTimeSelection' && flowContext.step !== 'dayBasedLocationSelection' && flowContext.step !== 'customLocationSelection' && flowContext.step !== 'eventNotes' && (
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4 max-w-md mx-auto">
              <ProgressIndicator flowStep={flowContext.step} />
            </div>
          )}

        </div>
      </main>

      <GlobalFooter 
        value="" 
        onChange={() => {}} 
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

      
    </div>
  );
} 