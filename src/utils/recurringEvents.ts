import { addDays, addWeeks, addMonths, format, parse, isBefore, isAfter, startOfDay, isToday, isFuture } from 'date-fns';
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

// Helper function to find the next occurrence of a specific weekday
function getNextWeekday(from: Date, targetWeekday: number): Date {
  const fromWeekday = from.getDay();
  let daysToAdd = targetWeekday - fromWeekday;
  
  // If the target day is today, and we want future events, add 7 days
  if (daysToAdd === 0) {
    daysToAdd = 7;
  }
  // If the target day has already passed this week, go to next week
  else if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  
  return addDays(from, daysToAdd);
}

export function generateRecurringEvents(baseEvent: RecurringEvent): RecurringEvent[] {
  if (!baseEvent.isRecurring || !baseEvent.recurringPattern || !baseEvent.recurringEndDate) {
    return [baseEvent];
  }

  const events: RecurringEvent[] = [];
  const startDate = parse(baseEvent.date, 'yyyy-MM-dd', new Date());
  const endDate = parse(baseEvent.recurringEndDate, 'yyyy-MM-dd', new Date());
  const parentId = baseEvent.recurringParentId || generateUUID();
  const today = startOfDay(new Date());

  // For "next X weeks" type requests, we want to start from the next occurrence
  // Don't add the original event if it's in the past
  const shouldIncludeOriginal = !isBefore(startDate, today);
  
  if (shouldIncludeOriginal) {
    events.push({
      ...baseEvent,
      recurringParentId: parentId
    });
  }

  let currentDate = startDate;

  if (baseEvent.recurringPattern === 'daily') {
    // For daily events, start from tomorrow if start date is today or in the past
    if (!isFuture(startDate)) {
      currentDate = addDays(today, 1);
    }
    
    while (isBefore(currentDate, endDate)) {
      if (!isAfter(currentDate, endDate)) {
        events.push({
          ...baseEvent,
          date: format(currentDate, 'yyyy-MM-dd'),
          recurringParentId: parentId,
          isRecurring: false
        });
      }
      currentDate = addDays(currentDate, 1);
    }
  } else if (baseEvent.recurringPattern === 'weekly') {
    if (baseEvent.recurringDays && baseEvent.recurringDays.length > 0) {
      // Generate events for specific days of the week
      for (const dayName of baseEvent.recurringDays) {
        const dayIndex = WEEKDAY_MAP[dayName.toLowerCase()];
        if (dayIndex !== undefined) {
          // Find the next occurrence of this weekday
          let eventDate = getNextWeekday(today, dayIndex);
          
          // Generate weekly occurrences
          while (!isAfter(eventDate, endDate)) {
            // Only add if it's different from the original event (avoid duplicates)
            if (!shouldIncludeOriginal || format(eventDate, 'yyyy-MM-dd') !== baseEvent.date) {
              events.push({
                ...baseEvent,
                date: format(eventDate, 'yyyy-MM-dd'),
                recurringParentId: parentId,
                isRecurring: false
              });
            }
            eventDate = addWeeks(eventDate, 1);
          }
        }
      }
    } else {
      // Generate weekly events on the same day of week as start date
      const targetWeekday = startDate.getDay();
      let eventDate = getNextWeekday(today, targetWeekday);
      
      while (!isAfter(eventDate, endDate)) {
        // Only add if it's different from the original event (avoid duplicates)
        if (!shouldIncludeOriginal || format(eventDate, 'yyyy-MM-dd') !== baseEvent.date) {
          events.push({
            ...baseEvent,
            date: format(eventDate, 'yyyy-MM-dd'),
            recurringParentId: parentId,
            isRecurring: false
          });
        }
        eventDate = addWeeks(eventDate, 1);
      }
    }
  } else if (baseEvent.recurringPattern === 'monthly') {
    // For monthly events, start from next month if start date is today or in the past
    if (!isFuture(startDate)) {
      currentDate = addMonths(today, 1);
    }
    
    while (isBefore(currentDate, endDate)) {
      if (!isAfter(currentDate, endDate)) {
        events.push({
          ...baseEvent,
          date: format(currentDate, 'yyyy-MM-dd'),
          recurringParentId: parentId,
          isRecurring: false
        });
      }
      currentDate = addMonths(currentDate, 1);
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
  const today = startOfDay(new Date());

  // For "next X weeks" type requests, we want to start from the next occurrence
  // Don't add the original keeper if it's in the past
  const shouldIncludeOriginal = !isBefore(startDate, today);
  
  if (shouldIncludeOriginal) {
    keepers.push({
      ...baseKeeper,
      recurringParentId: parentId
    });
  }

  let currentDate = startDate;

  if (baseKeeper.recurringPattern === 'daily') {
    if (!isFuture(startDate)) {
      currentDate = addDays(today, 1);
    }
    
    while (isBefore(currentDate, endDate)) {
      if (!isAfter(currentDate, endDate)) {
        keepers.push({
          ...baseKeeper,
          date: format(currentDate, 'yyyy-MM-dd'),
          recurringParentId: parentId,
          isRecurring: false
        });
      }
      currentDate = addDays(currentDate, 1);
    }
  } else if (baseKeeper.recurringPattern === 'weekly') {
    if (baseKeeper.recurringDays && baseKeeper.recurringDays.length > 0) {
      for (const dayName of baseKeeper.recurringDays) {
        const dayIndex = WEEKDAY_MAP[dayName.toLowerCase()];
        if (dayIndex !== undefined) {
          let keeperDate = getNextWeekday(today, dayIndex);
          
          while (!isAfter(keeperDate, endDate)) {
            if (!shouldIncludeOriginal || format(keeperDate, 'yyyy-MM-dd') !== baseKeeper.date) {
              keepers.push({
                ...baseKeeper,
                date: format(keeperDate, 'yyyy-MM-dd'),
                recurringParentId: parentId,
                isRecurring: false
              });
            }
            keeperDate = addWeeks(keeperDate, 1);
          }
        }
      }
    } else {
      const targetWeekday = startDate.getDay();
      let keeperDate = getNextWeekday(today, targetWeekday);
      
      while (!isAfter(keeperDate, endDate)) {
        if (!shouldIncludeOriginal || format(keeperDate, 'yyyy-MM-dd') !== baseKeeper.date) {
          keepers.push({
            ...baseKeeper,
            date: format(keeperDate, 'yyyy-MM-dd'),
            recurringParentId: parentId,
            isRecurring: false
          });
        }
        keeperDate = addWeeks(keeperDate, 1);
      }
    }
  } else if (baseKeeper.recurringPattern === 'monthly') {
    if (!isFuture(startDate)) {
      currentDate = addMonths(today, 1);
    }
    
    while (isBefore(currentDate, endDate)) {
      if (!isAfter(currentDate, endDate)) {
        keepers.push({
          ...baseKeeper,
          date: format(currentDate, 'yyyy-MM-dd'),
          recurringParentId: parentId,
          isRecurring: false
        });
      }
      currentDate = addMonths(currentDate, 1);
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