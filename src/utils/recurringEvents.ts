import { addDays, addWeeks, addMonths, format, parse, isBefore, isAfter } from 'date-fns';
import { generateUUID } from './uuid';

type RecurringEvent = {
  childName: string;
  eventName: string;
  date: string;
  time?: string;
  location?: string;
  isAllDay?: boolean;
  noTimeYet?: boolean;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | null;
  recurringEndDate?: string | null;
  recurringDays?: string[] | null;
  recurringParentId?: string;
};

type RecurringKeeper = {
  childName: string;
  keeperName: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  isAllDay?: boolean;
  noTimeYet?: boolean;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | null;
  recurringEndDate?: string | null;
  recurringDays?: string[] | null;
  recurringParentId?: string;
};

const WEEKDAY_MAP: { [key: string]: number } = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

export function generateRecurringEvents(baseEvent: RecurringEvent): RecurringEvent[] {
  if (!baseEvent.isRecurring || !baseEvent.recurringPattern || !baseEvent.recurringEndDate) {
    return [baseEvent];
  }

  const events: RecurringEvent[] = [];
  const startDate = parse(baseEvent.date, 'yyyy-MM-dd', new Date());
  const endDate = parse(baseEvent.recurringEndDate, 'yyyy-MM-dd', new Date());
  const parentId = baseEvent.recurringParentId || generateUUID();

  // Add the original event with parent ID
  events.push({
    ...baseEvent,
    recurringParentId: parentId
  });

  let currentDate = startDate;

  if (baseEvent.recurringPattern === 'daily') {
    // Generate daily events
    while (isBefore(currentDate, endDate)) {
      currentDate = addDays(currentDate, 1);
      if (!isAfter(currentDate, endDate)) {
        events.push({
          ...baseEvent,
          date: format(currentDate, 'yyyy-MM-dd'),
          recurringParentId: parentId,
          isRecurring: false // Individual instances are not recurring
        });
      }
    }
  } else if (baseEvent.recurringPattern === 'weekly') {
    if (baseEvent.recurringDays && baseEvent.recurringDays.length > 0) {
      // Generate events for specific days of the week
      let weekStart = startDate;
      
      while (isBefore(weekStart, endDate)) {
        for (const dayName of baseEvent.recurringDays) {
          const dayIndex = WEEKDAY_MAP[dayName.toLowerCase()];
          if (dayIndex !== undefined) {
            // Calculate the date for this day of the current week
            const daysToAdd = (dayIndex - weekStart.getDay() + 7) % 7;
            const eventDate = addDays(weekStart, daysToAdd);
            
            // Only add if it's after the start date and before/on end date
            if (!isBefore(eventDate, startDate) && !isAfter(eventDate, endDate)) {
              events.push({
                ...baseEvent,
                date: format(eventDate, 'yyyy-MM-dd'),
                recurringParentId: parentId,
                isRecurring: false
              });
            }
          }
        }
        weekStart = addWeeks(weekStart, 1);
      }
    } else {
      // Generate weekly events on the same day of week as start date
      while (isBefore(currentDate, endDate)) {
        currentDate = addWeeks(currentDate, 1);
        if (!isAfter(currentDate, endDate)) {
          events.push({
            ...baseEvent,
            date: format(currentDate, 'yyyy-MM-dd'),
            recurringParentId: parentId,
            isRecurring: false
          });
        }
      }
    }
  } else if (baseEvent.recurringPattern === 'monthly') {
    // Generate monthly events
    while (isBefore(currentDate, endDate)) {
      currentDate = addMonths(currentDate, 1);
      if (!isAfter(currentDate, endDate)) {
        events.push({
          ...baseEvent,
          date: format(currentDate, 'yyyy-MM-dd'),
          recurringParentId: parentId,
          isRecurring: false
        });
      }
    }
  }

  return events;
}

export function generateRecurringKeepers(baseKeeper: RecurringKeeper): RecurringKeeper[] {
  if (!baseKeeper.isRecurring || !baseKeeper.recurringPattern || !baseKeeper.recurringEndDate) {
    return [baseKeeper];
  }

  const keepers: RecurringKeeper[] = [];
  const startDate = parse(baseKeeper.date, 'yyyy-MM-dd', new Date());
  const endDate = parse(baseKeeper.recurringEndDate, 'yyyy-MM-dd', new Date());
  const parentId = baseKeeper.recurringParentId || generateUUID();

  // Add the original keeper with parent ID
  keepers.push({
    ...baseKeeper,
    recurringParentId: parentId
  });

  let currentDate = startDate;

  if (baseKeeper.recurringPattern === 'daily') {
    while (isBefore(currentDate, endDate)) {
      currentDate = addDays(currentDate, 1);
      if (!isAfter(currentDate, endDate)) {
        keepers.push({
          ...baseKeeper,
          date: format(currentDate, 'yyyy-MM-dd'),
          recurringParentId: parentId,
          isRecurring: false
        });
      }
    }
  } else if (baseKeeper.recurringPattern === 'weekly') {
    if (baseKeeper.recurringDays && baseKeeper.recurringDays.length > 0) {
      let weekStart = startDate;
      
      while (isBefore(weekStart, endDate)) {
        for (const dayName of baseKeeper.recurringDays) {
          const dayIndex = WEEKDAY_MAP[dayName.toLowerCase()];
          if (dayIndex !== undefined) {
            const daysToAdd = (dayIndex - weekStart.getDay() + 7) % 7;
            const keeperDate = addDays(weekStart, daysToAdd);
            
            if (!isBefore(keeperDate, startDate) && !isAfter(keeperDate, endDate)) {
              keepers.push({
                ...baseKeeper,
                date: format(keeperDate, 'yyyy-MM-dd'),
                recurringParentId: parentId,
                isRecurring: false
              });
            }
          }
        }
        weekStart = addWeeks(weekStart, 1);
      }
    } else {
      while (isBefore(currentDate, endDate)) {
        currentDate = addWeeks(currentDate, 1);
        if (!isAfter(currentDate, endDate)) {
          keepers.push({
            ...baseKeeper,
            date: format(currentDate, 'yyyy-MM-dd'),
            recurringParentId: parentId,
            isRecurring: false
          });
        }
      }
    }
  } else if (baseKeeper.recurringPattern === 'monthly') {
    while (isBefore(currentDate, endDate)) {
      currentDate = addMonths(currentDate, 1);
      if (!isAfter(currentDate, endDate)) {
        keepers.push({
          ...baseKeeper,
          date: format(currentDate, 'yyyy-MM-dd'),
          recurringParentId: parentId,
          isRecurring: false
        });
      }
    }
  }

  return keepers;
}

// Utility to parse natural language duration into end date
export function parseRecurringDuration(startDate: string, durationText: string): string | null {
  const start = parse(startDate, 'yyyy-MM-dd', new Date());
  const lowerText = durationText.toLowerCase();

  // Match patterns like "8 weeks", "3 months", "2 years"
  const weekMatch = lowerText.match(/(\d+)\s*weeks?/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1]);
    return format(addWeeks(start, weeks), 'yyyy-MM-dd');
  }

  const monthMatch = lowerText.match(/(\d+)\s*months?/);
  if (monthMatch) {
    const months = parseInt(monthMatch[1]);
    return format(addMonths(start, months), 'yyyy-MM-dd');
  }

  const yearMatch = lowerText.match(/(\d+)\s*years?/);
  if (yearMatch) {
    const years = parseInt(yearMatch[1]);
    return format(addMonths(start, years * 12), 'yyyy-MM-dd');
  }

  return null;
}

// Utility to parse days of week from natural language
export function parseRecurringDays(text: string): string[] | null {
  const lowerText = text.toLowerCase();
  const days: string[] = [];
  
  const dayPatterns = [
    { pattern: /monday|mon/g, day: 'monday' },
    { pattern: /tuesday|tue/g, day: 'tuesday' },
    { pattern: /wednesday|wed/g, day: 'wednesday' },
    { pattern: /thursday|thu/g, day: 'thursday' },
    { pattern: /friday|fri/g, day: 'friday' },
    { pattern: /saturday|sat/g, day: 'saturday' },
    { pattern: /sunday|sun/g, day: 'sunday' }
  ];

  for (const { pattern, day } of dayPatterns) {
    if (pattern.test(lowerText)) {
      days.push(day);
    }
  }

  return days.length > 0 ? days : null;
} 