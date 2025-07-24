import { FlowContext, SmartButton } from './useKicacoFlow';

// This file contains the pure logic for the Kicaco Flow, extracted from the page.
// It is kept separate from the main hook to improve maintainability.

export const getChildColor = (childId: string): string => {
  const colors: { [key: string]: string } = {
    'emma': '#ffd8b5', // Orange
    'alex': '#c0e2e7',  // Blue
    'leo': '#bbf7d0'    // Green
  };
  return colors[childId] || '#217e8f'; // Default to teal
};

export const dayColors: { [key: number]: string } = {
  0: '#ffd8b580', 1: '#fde68a80', 2: '#bbf7d080', 3: '#c0e2e780',
  4: '#d1d5fa80', 5: '#e9d5ff80', 6: '#f8b6c280',
};

export const getHourOptions = () => Array.from({ length: 12 }, (_, i) => (i + 1).toString());
export const getMinuteOptions = () => ['00', '15', '30', '45'];
export const getAmPmOptions = () => ['AM', 'PM'];

export const getInitialButtons = (): SmartButton[] => [
  { id: 'event', label: 'Event', description: 'Something to attend' },
  { id: 'keeper', label: 'Keeper', description: 'A task, deadline, or due date' }
];

export const getEventCategoryButtons = (): SmartButton[] => [
  { id: 'sports', label: 'Sports', description: 'Games, practices, lessons' },
  { id: 'medical', label: 'Medical', description: 'Appointments, checkups, procedures' },
  { id: 'school', label: 'School', description: 'Classes, meetings, field trips, events' },
  { id: 'social', label: 'Social', description: 'Parties, playdates, gatherings' },
  { id: 'activities', label: 'Activities', description: 'Lessons, clubs, performances' },
  { id: 'family', label: 'Family', description: 'Outings, vacations, family time' }
];

export const getPersonalizedSports = (): SmartButton[] => [
  { id: 'soccer', label: 'Soccer', description: 'Football, futsal, indoor/outdoor' },
  { id: 'basketball', label: 'Basketball', description: 'Games, practices, tournaments' },
  { id: 'tennis', label: 'Tennis', description: 'Lessons, matches, tournaments' }
];

export const getAllSportsAlphabetical = (): SmartButton[] => [
  { id: 'american-football', label: 'Amer Football', description: 'American football, flag, tackle' },
  { id: 'baseball', label: 'Baseball', description: 'Baseball, softball, tee-ball' },
  { id: 'cheerleading', label: 'Cheerleading', description: 'Cheer practice, competitions' },
  { id: 'cross-country', label: 'Cross Country', description: 'Running, meets, training' },
  { id: 'dance', label: 'Dance', description: 'Ballet, jazz, hip-hop, recitals' },
  { id: 'golf', label: 'Golf', description: 'Lessons, tournaments, practice' },
  { id: 'gymnastics', label: 'Gymnastics', description: 'Classes, meets, competitions' },
  { id: 'hockey', label: 'Hockey', description: 'Ice hockey, field hockey' },
  { id: 'karate', label: 'Karate', description: 'Martial arts, belt tests' },
  { id: 'lacrosse', label: 'Lacrosse', description: 'Games, practices, tournaments' },
  { id: 'swimming', label: 'Swimming', description: 'Lessons, meets, lap swimming' },
  { id: 'track-field', label: 'Track & Field', description: 'Running, jumping, throwing events' },
  { id: 'volleyball', label: 'Volleyball', description: 'Indoor, outdoor, beach volleyball' },
  { id: 'wrestling', label: 'Wrestling', description: 'Matches, tournaments, practice' },
  { id: 'other-sport', label: 'Other Sport', description: 'Any other sport or activity' }
];

export const getSportsEventTypeButtons = (): SmartButton[] => [
  { id: 'game', label: 'Game', description: 'Match, scrimmage, tournament' },
  { id: 'practice', label: 'Practice', description: 'Team practice, training session' },
  { id: 'lesson', label: 'Lesson', description: 'Private lesson, coaching session' },
  { id: 'tournament', label: 'Tournament', description: 'Multi-game tournament or event' }
];

export const getChildButtons = (): SmartButton[] => [
  { id: 'emma', label: 'Emma', description: 'Age 8, loves soccer and art' },
  { id: 'alex', label: 'Alex', description: 'Age 6, plays basketball' },
  { id: 'leo', label: 'Leo', description: 'Age 10, tennis player' }
];

export const getDateButtons = (): SmartButton[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const thisWeekend = new Date(today);
  thisWeekend.setDate(today.getDate() + (6 - today.getDay()));
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + (8 - today.getDay()));

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return [
    { id: 'custom-date', label: 'Custom', description: 'Select any date or dates' },
    { id: 'today', label: 'Today', description: formatDate(today) },
    { id: 'tomorrow', label: 'Tomorrow', description: formatDate(tomorrow) },
    { id: 'this-saturday', label: 'This Saturday', description: formatDate(thisWeekend) },
    { id: 'next-monday', label: 'Next Monday', description: formatDate(nextMonday) }
  ];
};

export const getTimePeriodButtons = (): SmartButton[] => [
  { id: 'morning', label: 'Morning', description: '8-11 AM' },
  { id: 'afternoon', label: 'Afternoon', description: '12-3 PM' },
  { id: 'after-school', label: 'After School', description: '3-6 PM' },
  { id: 'evening', label: 'Evening', description: '6-8 PM' }
];

export const getLocationButtons = (): SmartButton[] => [
  { id: 'westfield-park', label: 'Westfield Park', description: 'Main soccer field, 123 Park Ave' },
  { id: 'school-field', label: 'School Field', description: 'Lincoln Elementary field' },
  { id: 'sports-complex', label: 'Sports Complex', description: 'City Sports Complex, Field 2' },
  { id: 'community-center', label: 'Community Center', description: 'Downtown Community Center' },
  { id: 'riverside-park', label: 'Riverside Park', description: 'Riverside Park Fields' },
  { id: 'north-field', label: 'North Athletic Field', description: 'North Side Athletic Complex' },
  { id: 'memorial-stadium', label: 'Memorial Stadium', description: 'City Memorial Stadium' }
];

export const getMonthButtons = (flowContext: FlowContext): SmartButton[] => {
    const today = new Date();
    const months = [];
    const monthToExclude = flowContext.eventPreview.isComingFromOtherMonth ? flowContext.eventPreview.monthToExclude : null;
    let startingIndex = 0;
    if (flowContext.eventPreview.isComingFromOtherMonth && monthToExclude) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const [excludedMonthStr, excludedYearStr] = monthToExclude.split('-');
      const excludedMonthIndex = monthNames.indexOf(excludedMonthStr);
      const excludedYear = parseInt(excludedYearStr);
      const excludedDate = new Date(excludedYear, excludedMonthIndex, 1);
      const currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthsDiff = (excludedDate.getFullYear() - currentDate.getFullYear()) * 12 + (excludedDate.getMonth() - currentDate.getMonth());
      startingIndex = monthsDiff + 1;
    }
    for (let i = startingIndex; i < startingIndex + 6; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const monthId = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase().replace(' ', '-');
      if (monthId === monthToExclude) continue;
      months.push({ id: monthId, label: monthName.split(' ')[0] });
      if (months.length >= 3) break;
    }
    months.push({ id: 'other-month', label: 'Other Month' });
    months.push({ id: 'other-year', label: 'Other Year' });
    return months;
  };

export const getRemainingMonthsInYear = (flowContext: FlowContext): SmartButton[] => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const remainingMonths = [];
    const justCompletedMonth = flowContext.eventPreview.selectedMonth;
    const lastShownMonthIndex = today.getMonth() + 2;
    for (let monthIndex = lastShownMonthIndex + 1; monthIndex < 12; monthIndex++) {
      const month = new Date(currentYear, monthIndex, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const monthId = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase().replace(' ', '-');
      if (monthId === justCompletedMonth) continue;
      remainingMonths.push({ id: monthId, label: monthName.split(' ')[0] });
    }
    return remainingMonths;
  };

export const detectDayOfWeekPattern = (selectedDates: string[]): number[] | null => {
    if (selectedDates.length < 2) return null;
    const daysOfWeek = selectedDates.map(dateStr => {
      const date = new Date(dateStr);
      const jsDay = date.getDay(); // 0=Sunday
      return jsDay === 0 ? 6 : jsDay - 1; // Monday-first
    });
    const uniqueDays = [...new Set(daysOfWeek)];
    if (uniqueDays.length === 1) return uniqueDays;
    if (uniqueDays.length <= 3 && selectedDates.length >= uniqueDays.length * 2) {
      uniqueDays.sort((a, b) => a - b);
      return uniqueDays;
    }
    return null;
  };



export const getRepeatingSameLocationButtons = (): SmartButton[] => [
    { id: 'same-location-yes', label: 'Same', description: 'All occurrences at same location' },
    { id: 'same-location-by-day', label: 'Day-Based', description: 'Set locations by day of week' },
    { id: 'same-location-no', label: 'Custom', description: 'Set individual locations' }
  ];

export const getRepeatingSameTimeButtons = (): SmartButton[] => [
    { id: 'same-time-yes', label: 'Same', description: 'All occurrences at same time' },
    { id: 'same-time-by-day', label: 'Day-Based', description: 'Set times by day of week' },
    { id: 'same-time-no', label: 'Custom', description: 'Set individual times' }
  ];

export const getUniqueDaysOfWeek = (selectedDates: string[]): SmartButton[] => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const uniqueDays = new Set<number>();
    selectedDates.forEach(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const jsDay = date.getDay();
      uniqueDays.add(jsDay === 0 ? 6 : jsDay - 1);
    });
    return Array.from(uniqueDays).sort((a, b) => a - b).map(dayIndex => {
      const datesForThisDay = selectedDates.filter(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return (date.getDay() === 0 ? 6 : date.getDay() - 1) === dayIndex;
      });
      return { id: `day-${dayIndex}`, label: `Set ${dayNames[dayIndex]}s`, description: `${datesForThisDay.length} occurrence${datesForThisDay.length > 1 ? 's' : ''}` };
    });
  };

export const getMonthDates = (monthId: string) => {
    const [monthStr, yearStr] = monthId.split('-');
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = monthNames.indexOf(monthStr);
    const year = parseInt(yearStr);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const weeks: (SmartButton | null)[][] = [];
    let currentWeek: (SmartButton | null)[] = new Array(7).fill(null);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, monthIndex, day);
      const jsDay = date.getDay();
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayNum = day.toString().padStart(2, '0');
      const button: SmartButton = { id: `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${dayNum}`, label: `${dayNames[dayOfWeek]} ${dayNum}` };
      if (dayOfWeek === 0 && currentWeek[0] !== null) {
        weeks.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
      currentWeek[dayOfWeek] = button;
      if (dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
    }
    if (currentWeek.some(day => day !== null)) {
      weeks.push(currentWeek);
    }
    return weeks;
  };

type HandleButtonSelectArgs = {
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

export const handleButtonSelect = ({
  buttonId,
  flowContext,
  eventNotes,
  contactFields,
  setFlowContext,
  setShowOtherMonths,
  setCreatedEvents,
  setCurrentEventIndex,
  setShowConfirmation,
}: HandleButtonSelectArgs) => {
    const newContext: FlowContext = JSON.parse(JSON.stringify(flowContext)); // Deep copy
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
        const newSelected = currentSelected.includes(buttonId) ? currentSelected.filter(id => id !== buttonId) : [...currentSelected, buttonId];
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
      dayBasedTimeGrid: () => {
        // This step is handled in the UI directly, no button logic needed
      },
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
          childName: newContext.eventPreview.child ? newContext.eventPreview.child.charAt(0).toUpperCase() + newContext.eventPreview.child.slice(1) : '',
          date: newContext.eventPreview.date || '',
          time: newContext.eventPreview.time || '',
          location: newContext.eventPreview.location || '',
          notes: eventNotes || '',
          contactName: contactFields?.contactName || '',
          phoneNumber: contactFields?.phoneNumber || '',
          email: contactFields?.email || '',
          websiteUrl: contactFields?.websiteUrl || '',
          eventType: newContext.eventPreview.eventType || '',
          category: newContext.eventPreview.category || ''
        };
        const events = (newContext.eventPreview.selectedDates && newContext.eventPreview.selectedDates.length > 0)
          ? newContext.eventPreview.selectedDates.map(date => {
            const [year, month, day] = date.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day);
            const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
            
            let eventTime = newContext.eventPreview.dayBasedTimes?.[date] || newContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
            let eventLocation = newContext.eventPreview.dateBasedLocations?.[date] || newContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

            return { ...baseEvent, date, time: eventTime, location: eventLocation };
          }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [baseEvent];
        setCreatedEvents(events);
        setCurrentEventIndex(0);
      },
      confirmation: () => {
        if (buttonId === 'done') {
          newContext.step = 'complete';
        } else if (buttonId === 'back') {
          newContext.step = 'eventNotes';
        }
      }
    };

    steps[flowContext.step]?.();
    setFlowContext(newContext);
};

export const getCurrentButtons = (flowContext: FlowContext) => {
    const { selectedDates = [] } = flowContext.eventPreview;

    const buttonMap: { [key: string]: () => SmartButton[] } = {
      initial: getInitialButtons,
      eventCategory: getEventCategoryButtons,
      eventType: getSportsEventTypeButtons,
      whichChild: getChildButtons,



      repeatingSameTime: () => {
        const uniqueDays = getUniqueDaysOfWeek(selectedDates);
        const allButtons = getRepeatingSameTimeButtons();
        if (uniqueDays.length <= 1) {
          return allButtons.filter(button => button.id !== 'same-time-by-day');
        }
        return allButtons;
      },
      dayBasedTimeGrid: () => [], // No buttons needed, handled by grid
      daySpecificLocation: getLocationButtons,
      whereLocation: getLocationButtons,
      eventNotes: () => [{ id: 'create-event', label: 'Create Event', description: 'Save this event to your calendar' }],
      confirmation: () => [
        { id: 'back', label: 'Back', description: 'Go back to edit notes' },
        { id: 'done', label: 'Done', description: 'Finish and save event' }
      ],
      repeatingSameLocation: getRepeatingSameLocationButtons,
      customLocationSelection: () => [] // No buttons needed, handled by custom UI
    };
    return buttonMap[flowContext.step]?.() || [];
};

export const getCurrentQuestion = (flowContext: FlowContext) => {
    const questionMap: { [key: string]: string | (() => string) } = {
      initial: "Add Event or Keeper",
      eventCategory: "Event Category",
      sportsType: "",
      eventType: () => `${(flowContext.eventPreview.subtype || 'Soccer').charAt(0).toUpperCase() + (flowContext.eventPreview.subtype || 'soccer').slice(1)} Event Type`,
      whichChild: "Child Selection",


      monthPart: () => {
        const { selectedMonth = '' } = flowContext.eventPreview;
        const [monthStr, yearStr] = selectedMonth.split('-');
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = monthNames.indexOf(monthStr);
        return `${monthIndex >= 0 ? fullMonthNames[monthIndex] : 'the month'} ${yearStr || new Date().getFullYear()}`;
      },

      repeatingSameTime: "Multi-Event Times",
      customTimeSelection: "Custom Times",
      dayBasedTimeGrid: "Day-Based Times",
      daySpecificTime: () => `What time for ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][flowContext.eventPreview.currentDayForTime!]}?`,
      whenTimePeriod: () => {
        return 'Event Time';
      },
      repeatingSameLocation: "Multi-Event Locations",
      customLocationSelection: "Custom Locations",
      dayBasedLocationSelection: "Day-Based Locations",
      daySpecificLocation: () => `What location for ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][flowContext.eventPreview.currentDayForLocation!]}?`,
      whereLocation: "Event Location",
      eventNotes: "Notes (Optional)",
      confirmation: () => {
        return flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 1 
          ? "Your events have been created!" 
          : "Your event has been created!";
      },
      complete: "Ready to create your event!"
    };
    const question = questionMap[flowContext.step] ?? "Next step...";
    return typeof question === 'function' ? question() : question;
  }; 