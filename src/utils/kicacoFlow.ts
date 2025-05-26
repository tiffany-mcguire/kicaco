import { format, addDays, addWeeks, parse, isDate } from 'date-fns';

export interface ParsedFields {
  childName?: string;
  eventName?: string;
  date?: string;
  time?: string;
  location?: string;
  isKeeper?: boolean;
}

interface Conversation {
  messages: Array<{
    sender: 'user' | 'assistant';
    content: string;
  }>;
}

// Generic event name patterns to detect
const GENERIC_EVENT_NAMES = [
  'thing',
  'event',
  'something',
  'stuff',
  'activity',
  'meeting',
  'appointment',
  'get together',
  'gathering'
];

// Minimum length for a meaningful event name
const MIN_EVENT_NAME_LENGTH = 3;

// Relative date patterns
const RELATIVE_DATE_PATTERNS = {
  'tomorrow': () => addDays(new Date(), 1),
  'tonight': () => new Date(),
  'tomorrow night': () => addDays(new Date(), 1),
  'next week': () => addWeeks(new Date(), 1),
  'next friday': () => {
    const today = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7;
    return addDays(today, daysUntilFriday);
  },
  'this friday': () => {
    const today = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7;
    return addDays(today, daysUntilFriday);
  }
};

// Time patterns
const TIME_PATTERNS = {
  'morning': '9:00 AM',
  'afternoon': '2:00 PM',
  'evening': '6:00 PM',
  'night': '8:00 PM',
  'noon': '12:00 PM',
  'midnight': '12:00 AM'
};

export function extractKnownFields(
  message: string,
  collectedFields: Partial<ParsedFields> = {}
): Partial<ParsedFields> {
  const fields: Partial<ParsedFields> = {};

  // 1) If the entire message is a single capitalized word, treat as childName
  const bareName = message.trim();
  if (/^[A-Z][a-z]+$/.test(bareName)) {
    return { childName: bareName };
  }

  // 2) Look for "for <Name>" or "with <Name>"
  const childMatch = message.match(/\b(?:for|with)\s+([A-Z][a-z]+)\b/);
  if (childMatch) {
    fields.childName = childMatch[1];
  }

  // Extract date patterns
  // First check for relative dates
  const lowerMessage = message.toLowerCase();
  for (const [pattern, getDate] of Object.entries(RELATIVE_DATE_PATTERNS)) {
    if (lowerMessage.includes(pattern)) {
      const date = getDate();
      fields.date = format(date, 'MMMM d, yyyy');
      break;
    }
  }

  // Then check for explicit dates
  if (!fields.date) {
    const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b/i;
    const dateMatch = message.match(datePattern);
    if (dateMatch) fields.date = dateMatch[0];
  }

  // Extract time patterns
  // First check for relative times
  for (const [pattern, time] of Object.entries(TIME_PATTERNS)) {
    if (lowerMessage.includes(pattern)) {
      fields.time = time;
      break;
    }
  }

  // Then check for explicit times
  if (!fields.time) {
    const timePattern = /\b\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\b/i;
    const timeMatch = message.match(timePattern);
    if (timeMatch) fields.time = timeMatch[0];
  }

  // Extract location patterns
  const locationPattern = /\b(?:at|in|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i;
  const locationMatch = message.match(locationPattern);
  if (locationMatch) fields.location = locationMatch[1];

  // 4) Only set eventName if none collected yet
  const firstSentence = message.split(/[.!?]/)[0].trim();
  const isGeneric = GENERIC_EVENT_NAMES.some(generic => 
    firstSentence.toLowerCase().includes(generic)
  );
  if (!collectedFields.eventName && !isGeneric && firstSentence.length >= MIN_EVENT_NAME_LENGTH) {
    fields.eventName = firstSentence;
  }

  console.log('📝 Extracted fields:', fields);
  return fields;
}

export function getNextFieldToPrompt(parsed: ParsedFields, knownChildren: string[] = []): string | null {
  console.log('🔍 Determining next field to prompt for:', { parsed, knownChildren });

  // Step 1: Always check for child name first
  if (!parsed.childName) {
    if (knownChildren.length === 1) {
      console.log('👶 Single child known, will confirm:', knownChildren[0]);
      return 'confirmChild';
    } else if (knownChildren.length > 1) {
      console.log('👶 Multiple children known, will ask for child name');
      return 'childName';
    } else {
      console.log('👶 No children known, will ask for child name');
      return 'childName';
    }
  }

  // Step 2: Check for date
  if (!parsed.date) {
    console.log('📅 Date missing, will prompt for date');
    return 'date';
  }

  // Step 3: Check for time (before location)
  if (!parsed.time) {
    console.log('⏰ Time missing, will prompt for time');
    return 'time';
  }

  // Step 4: Check for location (after time)
  if (!parsed.location) {
    console.log('📍 Location missing, will prompt for location');
    return 'location';
  }

  console.log('✅ All required fields collected');
  return null;
}

export function shouldCreateKeeper(message: string): boolean {
  // Logic to determine if this should be a keeper (task/deadline) vs event
  const keeperKeywords = ['due', 'deadline', 'submit', 'turn in', 'hand in', 'complete'];
  return keeperKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

export function isFirstMessage(conversation: { messages: any[] }): boolean {
  return conversation.messages.length === 0;
} 