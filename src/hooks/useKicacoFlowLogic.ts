import { FlowContext, SmartButton } from './useKicacoFlow';
import { getFlowStepTitle } from '../constants/flowSteps';
import { performFlowTransition } from '../constants/flowTransitions';

// This file contains the pure logic for the Kicaco Flow, extracted from the page.
// It is kept separate from the main hook to improve maintainability.

// Rainbow colors for children (same as StackedChildBadges)
const childColors = [
  '#f8b6c2', // Pink
  '#fbd3a2', // Orange
  '#fde68a', // Yellow
  '#bbf7d0', // Green
  '#c0e2e7', // Blue
  '#d1d5fa', // Indigo
  '#e9d5ff', // Purple
];

export const getChildColor = (childName: string, children: any[]): string => {
  const childProfile = children.find(c => c.name === childName);
  const childIndex = children.findIndex(c => c.name === childName);
  return childProfile?.color || (childIndex >= 0 ? childColors[childIndex % childColors.length] : '#217e8f');
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

export const getChildButtons = (children: any[]): SmartButton[] => {
  // Use actual children from the store
  return children.map(child => ({
    id: child.name, // Use the actual child name as ID
    label: child.name,
    description: child.role || ''
  }));
};

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

export const handleButtonSelect = (args: HandleButtonSelectArgs) => {
    performFlowTransition(args);
};

export const getCurrentButtons = (flowContext: FlowContext, children: any[]) => {
    const { selectedDates = [] } = flowContext.eventPreview;

    const buttonMap: { [key: string]: () => SmartButton[] } = {
      initial: getInitialButtons,
      eventCategory: getEventCategoryButtons,
      eventType: getSportsEventTypeButtons,
      whichChild: () => getChildButtons(children),



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
    return getFlowStepTitle(flowContext.step as any, { eventPreview: flowContext.eventPreview });
  };