interface ParsedFields {
  eventName?: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  [key: string]: string | undefined;
}

interface Conversation {
  messages: Array<{
    sender: 'user' | 'assistant';
    content: string;
  }>;
}

export function extractKnownFields(message: string): ParsedFields {
  // Basic field extraction logic - can be enhanced with NLP
  const fields: ParsedFields = {};
  
  // Extract date patterns
  const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b/i;
  const dateMatch = message.match(datePattern);
  if (dateMatch) fields.date = dateMatch[0];

  // Extract time patterns
  const timePattern = /\b\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\b/i;
  const timeMatch = message.match(timePattern);
  if (timeMatch) fields.time = timeMatch[0];

  // Extract location patterns (basic)
  const locationPattern = /\b(?:at|in|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i;
  const locationMatch = message.match(locationPattern);
  if (locationMatch) fields.location = locationMatch[1];

  return fields;
}

export function getNextFieldToPrompt(parsed: ParsedFields): string | null {
  const requiredFields = ['eventName', 'date', 'time', 'location'];
  
  for (const field of requiredFields) {
    if (!parsed[field]) {
      return field;
    }
  }
  
  return null;
}

export function shouldCreateKeeper(message: string): boolean {
  // Logic to determine if this should be a keeper (task/deadline) vs event
  const keeperKeywords = ['due', 'deadline', 'submit', 'turn in', 'hand in', 'complete'];
  return keeperKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

export function isFirstMessage(conversation: Conversation): boolean {
  return conversation.messages.length === 0;
} 