import { generateUUID } from './uuid';

export interface ShareableContent {
  type: 'text' | 'url' | 'rich' | 'file';
  title?: string;
  text?: string;
  url?: string;
  html?: string;
  files?: File[];
}

export interface ProcessedShareContent {
  hasEvents: boolean;
  hasScheduleKeywords: boolean;
  extractedInfo: {
    eventNames: string[];
    dates: string[];
    times: string[];
    locations: string[];
  };
  confidence: 'high' | 'medium' | 'low';
}

// Keywords that indicate schedule/event content
const EVENT_KEYWORDS = [
  'practice', 'game', 'tournament', 'meet', 'match', 'competition',
  'appointment', 'meeting', 'conference', 'visit', 'checkup',
  'class', 'lesson', 'recital', 'concert', 'performance', 'show',
  'party', 'birthday', 'celebration', 'gathering', 'playdate',
  'school', 'pickup', 'dropoff', 'carpool', 'bus',
  'deadline', 'due', 'permission slip', 'form', 'rsvp',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'today', 'tomorrow', 'next week', 'this week',
  'am', 'pm', 'noon', 'morning', 'afternoon', 'evening'
];

// Check if browser supports Web Share API
export const isWebShareSupported = (): boolean => {
  return 'share' in navigator;
};

// Check if browser supports native clipboard API
export const isClipboardAPISupported = (): boolean => {
  return 'clipboard' in navigator && 'readText' in navigator.clipboard;
};

// Enhanced paste function that detects content type
export const smartPaste = async (): Promise<ShareableContent | null> => {
  try {
    // Try to read from clipboard
    if (isClipboardAPISupported()) {
      // Try to read rich content first (if available)
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          // Handle files (images, etc.)
          const files: File[] = [];
          for (const type of item.types) {
            if (type.startsWith('image/') || type.startsWith('application/')) {
              const blob = await item.getType(type);
              const file = new File([blob], `clipboard-${Date.now()}`, { type });
              files.push(file);
            }
          }
          
          if (files.length > 0) {
            return {
              type: 'file',
              files
            };
          }

          // Handle HTML content
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            const html = await blob.text();
            const plainText = await navigator.clipboard.readText();
            
            return {
              type: 'rich',
              html,
              text: plainText
            };
          }
        }
      } catch (error) {
        console.log('Rich clipboard reading failed, falling back to text');
      }

      // Fallback to plain text
      const text = await navigator.clipboard.readText();
      if (text) {
        return analyzeTextContent(text);
      }
    }

    return null;
  } catch (error) {
    console.error('Error reading clipboard:', error);
    return null;
  }
};

// Analyze text content for event-related information
const analyzeTextContent = (text: string): ShareableContent => {
  const lowerText = text.toLowerCase();
  
  // Check if it's a URL
  try {
    new URL(text.trim());
    return {
      type: 'url',
      url: text.trim(),
      text: text
    };
  } catch {
    // Not a valid URL, continue with text analysis
  }

  return {
    type: 'text',
    text: text
  };
};

// Process content to determine if it likely contains events
export const analyzeContentForEvents = (content: ShareableContent): ProcessedShareContent => {
  const text = content.text || content.html || '';
  const lowerText = text.toLowerCase();
  
  // Count matches for different types of event indicators
  const eventKeywordMatches = EVENT_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword)
  );
  
  // Look for date patterns
  const datePatterns = [
    /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\btomorrow\b/gi,
    /\btoday\b/gi,
    /\bnext \w+\b/gi
  ];
  
  const dates = datePatterns.flatMap(pattern => 
    text.match(pattern) || []
  );
  
  // Look for time patterns
  const timePattern = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\b/g;
  const times = text.match(timePattern) || [];
  
  // Look for location indicators
  const locationPattern = /\b(?:at|@|in|on)\s+([A-Z][a-zA-Z\s]{2,20})/g;
  const locations = [];
  let locationMatch;
  while ((locationMatch = locationPattern.exec(text)) !== null) {
    locations.push(locationMatch[1].trim());
  }
  
  // Determine confidence based on matches
  let confidence: 'high' | 'medium' | 'low' = 'low';
  const hasMultipleIndicators = [
    eventKeywordMatches.length > 0,
    dates.length > 0,
    times.length > 0,
    locations.length > 0
  ].filter(Boolean).length;
  
  if (hasMultipleIndicators >= 3) {
    confidence = 'high';
  } else if (hasMultipleIndicators >= 2 || eventKeywordMatches.length >= 2) {
    confidence = 'medium';
  }
  
  return {
    hasEvents: eventKeywordMatches.length > 0 || dates.length > 0,
    hasScheduleKeywords: eventKeywordMatches.length > 0,
    extractedInfo: {
      eventNames: eventKeywordMatches,
      dates,
      times,
      locations
    },
    confidence
  };
};

// Programmatic share function for future use
export const shareToKicaco = (content: ShareableContent): void => {
  // Store the content in session storage for the share processor to pick up
  sessionStorage.setItem('kicaco_share_data', JSON.stringify(content));
  
  // Navigate to the share processor
  window.location.href = '/share';
};

// Show native share sheet if available
export const showNativeShare = async (content: { title?: string; text?: string; url?: string }) => {
  if (isWebShareSupported()) {
    try {
      await navigator.share(content);
      return true;
    } catch (error) {
      console.log('Native share cancelled or failed:', error);
      return false;
    }
  }
  return false;
}; 