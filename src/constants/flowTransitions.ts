import { FlowContext } from '../hooks/useKicacoFlow';
import { getUniqueDaysOfWeek } from '../hooks/useKicacoFlowLogic';

type PerformFlowTransitionArgs = {
  buttonId: string;
  flowContext: FlowContext;
  eventNotes: string;
  contactFields?: {
    contactName: string;
    phoneNumber: string;
    email: string;
    websiteUrl: string;
  };
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
  setShowOtherMonths: React.Dispatch<React.SetStateAction<boolean>>;
  setCreatedEvents: React.Dispatch<React.SetStateAction<any[]>>;
  setCurrentEventIndex: React.Dispatch<React.SetStateAction<number>>;
  setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
};

export const performFlowTransition = ({
  buttonId,
  flowContext,
  eventNotes,
  contactFields,
  setFlowContext,
  setShowOtherMonths,
  setCreatedEvents,
  setCurrentEventIndex,
  setShowConfirmation,
}: PerformFlowTransitionArgs) => {
  const newContext: FlowContext = JSON.parse(JSON.stringify(flowContext));
  newContext.selections[flowContext.step] = buttonId;

  const steps: { [key: string]: () => void } = {
    initial: () => {
      newContext.eventPreview.type = buttonId;
      newContext.step = buttonId === 'event' ? 'eventCategory' : 'keeperCategory';
    },
    eventCategory: () => {
      newContext.eventPreview.category = buttonId;
      newContext.step = buttonId === 'sports' ? 'sportsType' : 'eventSubtype';
    },
    sportsType: () => {
      newContext.eventPreview.subtype = buttonId;
      newContext.step = 'eventType';
    },
    eventType: () => {
      newContext.eventPreview.eventType = buttonId;
      newContext.step = 'whichChild';
    },
    whichChild: () => {
      const currentSelected = newContext.eventPreview.selectedChildren || [];
      const newSelected = currentSelected.includes(buttonId)
        ? currentSelected.filter(id => id !== buttonId)
        : [...currentSelected, buttonId];
      newContext.eventPreview.selectedChildren = newSelected;
      newContext.eventPreview.child = newSelected.length > 0 ? newSelected[0] : undefined;
    },

    repeatingSameTime: () => {
      newContext.eventPreview.repeatingSameTime = buttonId === 'same-time-yes';
      if (buttonId === 'same-time-by-day') {
        newContext.step = 'dayBasedTimeGrid';
        newContext.eventPreview.dayBasedTimes = {};
        newContext.eventPreview.currentTimePattern = 'dayBased';
      } else if (buttonId === 'same-time-no') {
        newContext.step = 'customTimeSelection';
        newContext.eventPreview.currentTimePattern = 'custom';
      } else {
        newContext.step = 'whenTimePeriod';
        newContext.eventPreview.currentTimePattern = 'same';
      }
    },
    dayBasedTimeGrid: () => {},
    daySpecificTime: () => {
      const currentDay = flowContext.eventPreview.currentDayForTime!;
      newContext.eventPreview.dayBasedTimes = { ...newContext.eventPreview.dayBasedTimes, [currentDay]: buttonId };
      const uniqueDays = getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []);
      const remainingDays = uniqueDays.filter(day => !newContext.eventPreview.dayBasedTimes![parseInt(day.id.split('-')[1])]);
      if (remainingDays.length > 0) {
        newContext.step = 'dayBasedTimeSelection';
      } else {
        newContext.step = (flowContext.eventPreview.selectedDates || []).length > 1 ? 'repeatingSameLocation' : 'whereLocation';
      }
    },
    whenTimePeriod: () => {
      newContext.eventPreview.time = buttonId;
      newContext.step = (flowContext.eventPreview.selectedDates || []).length > 1 ? 'repeatingSameLocation' : 'whereLocation';
    },
    repeatingSameLocation: () => {
      newContext.eventPreview.repeatingSameLocation = buttonId === 'same-location-yes';
      if (buttonId === 'same-location-by-day') {
        newContext.step = 'dayBasedLocationSelection';
        newContext.eventPreview.dayBasedLocations = {};
        newContext.eventPreview.currentLocationPattern = 'dayBased';
        const uniqueDays = getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []);
        if (uniqueDays.length > 0) {
          newContext.eventPreview.currentDayForLocation = parseInt(uniqueDays[0].id.split('-')[1]);
        }
      } else if (buttonId === 'same-location-no') {
        newContext.step = 'customLocationSelection';
        newContext.eventPreview.dateBasedLocations = {};
        newContext.eventPreview.currentLocationPattern = 'custom';
      } else {
        newContext.step = 'whereLocation';
        newContext.eventPreview.currentLocationPattern = 'same';
      }
    },
    dayBasedLocationSelection: () => {
      newContext.eventPreview.currentDayForLocation = parseInt(buttonId.split('-')[1]);
      newContext.step = 'daySpecificLocation';
    },
    daySpecificLocation: () => {
      const currentDay = flowContext.eventPreview.currentDayForLocation!;
      newContext.eventPreview.dayBasedLocations = { ...newContext.eventPreview.dayBasedLocations, [currentDay]: buttonId };
      const uniqueDays = getUniqueDaysOfWeek(flowContext.eventPreview.selectedDates || []);
      const remainingDays = uniqueDays.filter(day => !newContext.eventPreview.dayBasedLocations![parseInt(day.id.split('-')[1])]);
      newContext.step = remainingDays.length > 0 ? 'dayBasedLocationSelection' : 'eventNotes';
    },
    whereLocation: () => {
      newContext.eventPreview.location = buttonId;
      newContext.step = 'eventNotes';
    },
    eventNotes: () => {
      if (buttonId !== 'create-event') return;
      newContext.step = 'confirmation';
      newContext.eventPreview.notes = eventNotes;
      newContext.eventPreview.contactName = contactFields?.contactName || '';
      newContext.eventPreview.phoneNumber = contactFields?.phoneNumber || '';
      newContext.eventPreview.email = contactFields?.email || '';
      newContext.eventPreview.websiteUrl = contactFields?.websiteUrl || '';

      const { subtype, eventType } = newContext.eventPreview;
      const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
      const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
      const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

      const baseEvent = {
        eventName: fullEventName || 'Event',
        childName: newContext.eventPreview.selectedChildren && newContext.eventPreview.selectedChildren.length > 0 ? newContext.eventPreview.selectedChildren.join(', ') : '',
        date: newContext.eventPreview.date || '',
        time: newContext.eventPreview.time || '',
        location: newContext.eventPreview.location || '',
        notes: eventNotes || '',
        contactName: contactFields?.contactName || '',
        phoneNumber: contactFields?.phoneNumber || '',
        email: contactFields?.email || '',
        websiteUrl: contactFields?.websiteUrl || '',
        eventType: newContext.eventPreview.eventType || '',
        category: newContext.eventPreview.category || '',
      };

      const events = (newContext.eventPreview.selectedDates && newContext.eventPreview.selectedDates.length > 0)
        ? newContext.eventPreview.selectedDates
            .map(date => {
              const [year, month, day] = date.split('-').map(Number);
              const eventDate = new Date(year, month - 1, day);
              const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;

              const eventTime = newContext.eventPreview.dayBasedTimes?.[date] || newContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
              const eventLocation = newContext.eventPreview.dateBasedLocations?.[date] || newContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

              return { ...baseEvent, date, time: eventTime, location: eventLocation };
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : [baseEvent];
      setCreatedEvents(events);
      setCurrentEventIndex(0);
    },
    confirmation: () => {
      if (buttonId === 'done') {
        newContext.step = 'complete';
      } else if (buttonId === 'back') {
        newContext.step = 'eventNotes';
      }
    },
  };

  steps[flowContext.step]?.();
  setFlowContext(newContext);
};


