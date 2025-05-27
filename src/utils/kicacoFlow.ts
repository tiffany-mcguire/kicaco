import { format, addDays, addWeeks, parse, isDate } from 'date-fns';
import { ConversationModeController } from './conversationMode';

export interface ParsedFields {
  childName?: string;
  eventName?: string;
  date?: string;
  time?: string | undefined;
  location?: string;
  isKeeper?: boolean;
  timeVague?: boolean;
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

// Vague time patterns that need clarification
const VAGUE_TIME_PATTERNS = ['morning', 'afternoon', 'evening', 'night'];

export function extractKnownFields(
  message: string,
  collectedFields: Partial<ParsedFields> = {},
  lastRequestedField?: keyof ParsedFields
): Partial<ParsedFields> {
  const fields: Partial<ParsedFields> = {};

  const bare = message.trim();

  // If the last prompt was for a specific field and this looks like a short answer, use it
  if (
    lastRequestedField &&
    bare.length > 0 &&
    bare.length < 40 &&
    bare.split(/\s+/).length <= 5
  ) {
    console.log(`📝 Using short answer "${bare}" as ${lastRequestedField}`);
    const fieldUpdate: Partial<ParsedFields> = {};
    fieldUpdate[lastRequestedField] = bare as any;
    return fieldUpdate;
  }

  // 1) If the entire message is a single capitalized word, treat as childName
  if (/^[A-Z][a-z]+$/.test(bare)) {
    return { childName: bare };
  }

  // 2) Look for "for <Name>" or "with <Name>"
  const childMatch = message.match(/\b(?:for|with)\s+([A-Z][a-z]+)\b/);
  if (childMatch) {
    fields.childName = childMatch[1];
  }

  // Extract date patterns
  // First check for relative dates
  const lowerMessage = message.toLowerCase();
  let foundRelativeDate = false;
  for (const [pattern, getDate] of Object.entries(RELATIVE_DATE_PATTERNS)) {
    if (lowerMessage.includes(pattern)) {
      const date = getDate();
      console.log('Resolved relative date:', date, 'ISO:', format(date, 'yyyy-MM-dd'));
      fields.date = format(date, 'yyyy-MM-dd'); // Store as ISO
      foundRelativeDate = true;
      break;
    }
  }

  // Then check for explicit dates (only if not already set by relative date)
  if (!fields.date) {
    const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b/i;
    const dateMatch = message.match(datePattern);
    if (dateMatch) fields.date = dateMatch[0];
  }

  // Extract time patterns
  // First check for relative times
  for (const [pattern, defaultTime] of Object.entries(TIME_PATTERNS)) {
    if (lowerMessage.includes(pattern)) {
      if (VAGUE_TIME_PATTERNS.includes(pattern)) {
        // For vague times, only set the flag
        fields.timeVague = true;
        // Do not set fields.time for vague patterns
      } else {
        // For non-vague times, set both the time and clear the flag
        fields.time = defaultTime;
        fields.timeVague = false;
      }
      break;
    }
  }

  // Then check for explicit times
  if (typeof fields.time === 'undefined' || !fields.time) {
    const timePattern = /\b\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\b/i;
    const timeMatch = message.match(timePattern);
    if (timeMatch) {
      fields.time = timeMatch[0];
      fields.timeVague = false; // Explicit time provided
    }
  }

  // Extract location patterns
  // Only set location if time is present and not vague
  if (fields.time && !fields.timeVague) {
    const locationPattern = /\b(?:at|in|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i;
    const locationMatch = message.match(locationPattern);
    if (locationMatch) fields.location = locationMatch[1];
  }

  // 4) Only set eventName if none collected yet
  const firstSentence = message.split(/[.!?]/)[0].trim();
  const isGeneric = GENERIC_EVENT_NAMES.some(generic => 
    firstSentence.toLowerCase().includes(generic)
  );

  // Improved event name extraction
  // Try to match key event verbs followed by a noun phrase
  const eventPattern = /\b(?:have|attend|go to|set|schedule|add|plan|join|host|to attend|to go to|to join|to host)\s+(?:a|an|the)?\s*([a-z0-9 .'-]+?)(?:\s+(?:to|on|at|for|tomorrow|tonight|this|next|in|with|by|from|about|and|,|\.|!|\?|$))/i;
  const eventMatch = message.toLowerCase().match(eventPattern);

  let candidateEventName = null;
  if (eventMatch && eventMatch[1]) {
    candidateEventName = eventMatch[1].trim();
    // Title-case each word
    candidateEventName = candidateEventName.replace(/\b\w/g, c => c.toUpperCase());
  }

  // Fallback: If no match, try to extract a noun phrase after 'a' or 'an' or 'the'
  if (!candidateEventName) {
    const fallbackPattern = /\b(?:a|an|the)\s+([a-z0-9 .'-]+?)(?=\s+(?:to|on|at|for|tomorrow|tonight|this|next|in|with|by|from|about|and|,|\.|!|\?|$))/i;
    const fallbackMatch = message.toLowerCase().match(fallbackPattern);
    if (fallbackMatch && fallbackMatch[1]) {
      candidateEventName = fallbackMatch[1].trim();
      candidateEventName = candidateEventName.replace(/\b\w/g, c => c.toUpperCase());
    }
  }
  // Last resort: grab the longest noun phrase after 'a'/'an'/'the' if still not found
  if (!candidateEventName) {
    const lastResortPattern = /\b(?:a|an|the)\s+([a-z0-9 .'-]+)/i;
    const lastResortMatch = message.toLowerCase().match(lastResortPattern);
    if (lastResortMatch && lastResortMatch[1]) {
      candidateEventName = lastResortMatch[1].trim();
      candidateEventName = candidateEventName.replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  if (!collectedFields.eventName && !isGeneric && candidateEventName && candidateEventName.length >= MIN_EVENT_NAME_LENGTH) {
    fields.eventName = candidateEventName;
  } else if (!collectedFields.eventName && !isGeneric && firstSentence.length >= MIN_EVENT_NAME_LENGTH) {
    fields.eventName = firstSentence;
  }

  console.log('📝 Extracted fields:', fields);
  return fields;
}

export function getNextFieldToPrompt(parsed: ParsedFields, knownChildren: string[] = [], conversationController?: ConversationModeController): string | null {
  console.log('🔍 Determining next field to prompt for:', { parsed, knownChildren });

  let nextField: string | null = null;

  // Step 1: Always check for child name first
  if (!parsed.childName) {
    if (knownChildren.length === 1) {
      console.log('👶 Single child known, will confirm:', knownChildren[0]);
      nextField = 'confirmChild';
    } else if (knownChildren.length > 1) {
      console.log('👶 Multiple children known, will ask for child name');
      nextField = 'childName';
    } else {
      console.log('👶 No children known, will ask for child name');
      nextField = 'childName';
    }
  }

  // Step 2: Check for event name
  if (!nextField && !parsed.eventName) {
    console.log('📝 Event name missing, will prompt for event name');
    nextField = 'eventName';
  }

  // Step 3: Check for date
  if (!nextField && !parsed.date) {
    console.log('📅 Date missing, will prompt for date');
    nextField = 'date';
  }

  // Step 4: Check for time (before location)
  if (!nextField && (!parsed.time || parsed.timeVague)) {
    console.log('⏰ Time check:', { 
      hasTime: !!parsed.time, 
      timeValue: parsed.time,
      isVague: parsed.timeVague,
      willPrompt: true 
    });
    nextField = 'time';
  } else {
    console.log('⏰ Time check:', { 
      hasTime: !!parsed.time, 
      timeValue: parsed.time,
      isVague: parsed.timeVague,
      willPrompt: false 
    });
  }

  // Step 5: Check for location (after time)
  if (!nextField && !parsed.location) {
    console.log('📍 Location missing, will prompt for location');
    nextField = 'location';
  }

  // Update the last requested field if we have a controller
  if (conversationController && nextField) {
    conversationController.setLastRequestedField(nextField as keyof ParsedFields);
  }

  console.log('✅ All required fields collected');
  return nextField;
}

export function shouldCreateKeeper(message: string): boolean {
  // Logic to determine if this should be a keeper (task/deadline) vs event
  const keeperKeywords = ['due', 'deadline', 'submit', 'turn in', 'hand in', 'complete'];
  return keeperKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

export function isFirstMessage(conversation: { messages: any[] }): boolean {
  return conversation.messages.length === 0;
} 