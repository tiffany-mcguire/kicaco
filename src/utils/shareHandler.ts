// import { generateUUID } from './uuid';

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

// Check if browser supports native clipboard API with iOS Safari compatibility
export const isClipboardAPISupported = (): boolean => {
  // Basic clipboard API check
  if (!('clipboard' in navigator)) {
    console.log('📋 Navigator.clipboard not available');
    return false;
  }
  
  // Check for readText method (most important for our use case)
  if (!('readText' in navigator.clipboard)) {
    console.log('📋 navigator.clipboard.readText not available');
    return false;
  }
  
  // Additional iOS Safari compatibility check
  try {
    // iOS Safari requires secure context (HTTPS)
    if (!window.isSecureContext) {
      console.log('📋 Not in secure context (HTTPS required for clipboard)');
      return false;
    }
    
    console.log('✅ Clipboard API appears to be supported');
    return true;
  } catch (error) {
    console.log('📋 Error checking clipboard support:', error);
    return false;
  }
};

// Enhanced paste function that detects content type with iOS Safari support  
export const smartPaste = async (): Promise<ShareableContent | null> => {
  console.log('🔍 Smart paste initiated...');
  
  try {
    // Check for clipboard API support with detailed logging
    const clipboardSupported = isClipboardAPISupported();
    console.log('📋 Clipboard API support check:', clipboardSupported);
    
    if (!clipboardSupported) {
      console.log('❌ Clipboard API not supported - trying fallback approach');
      // Instead of failing immediately, try a direct attempt
      try {
        console.log('🔄 Attempting direct clipboard read despite detection failure...');
        const directText = await navigator.clipboard.readText();
        if (directText && directText.trim()) {
          console.log('✅ Direct clipboard read succeeded!');
          return analyzeTextContent(directText);
        }
      } catch (directError) {
        console.log('❌ Direct clipboard read also failed:', directError);
      }
      throw new Error('CLIPBOARD_NOT_SUPPORTED');
    }

    // Multiple attempts for iOS Safari reliability
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📋 Clipboard read attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Try simple text read first (most reliable on iOS)
        const text = await navigator.clipboard.readText();
        console.log('✅ Successfully read clipboard text:', text ? `${text.length} chars` : 'empty');
        
        if (text && text.trim()) {
          console.log('🎯 Found valid clipboard text, analyzing...');
          return analyzeTextContent(text);
        } else if (text === '') {
          console.log('📝 Clipboard is empty, continuing to rich content check...');
        }
      } catch (textError) {
        console.log(`⚠️ Text clipboard read failed (attempt ${attempts}):`, textError);
      }

      // Small delay between attempts
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Try rich content read (may not work on iOS Safari)
    try {
      const clipboardItems = await navigator.clipboard.read();
      console.log('Clipboard items found:', clipboardItems.length);
      
      for (const item of clipboardItems) {
        console.log('Processing clipboard item types:', item.types);
        
        // Handle files (images, etc.)
        const files: File[] = [];
        for (const type of item.types) {
          if (type.startsWith('image/') || type.startsWith('application/')) {
            try {
              const blob = await item.getType(type);
              const file = new File([blob], `clipboard-${Date.now()}`, { type });
              files.push(file);
            } catch (fileError) {
              console.log('Failed to read file type:', type, fileError);
            }
          }
        }
        
        if (files.length > 0) {
          console.log('Found clipboard files:', files.length);
          return {
            type: 'file',
            files
          };
        }

        // Handle HTML content
        if (item.types.includes('text/html')) {
          try {
            const blob = await item.getType('text/html');
            const html = await blob.text();
            const plainText = await navigator.clipboard.readText();
            
            return {
              type: 'rich',
              html,
              text: plainText
            };
          } catch (htmlError) {
            console.log('Failed to read HTML content:', htmlError);
          }
        }

        // Handle plain text from clipboard items
        if (item.types.includes('text/plain')) {
          try {
            const blob = await item.getType('text/plain');
            const text = await blob.text();
            if (text && text.trim()) {
              return analyzeTextContent(text);
            }
          } catch (plainError) {
            console.log('Failed to read plain text from item:', plainError);
          }
        }
      }
    } catch (richError) {
      console.log('Rich clipboard read failed:', richError);
    }

    return null;
      } catch (error) {
      console.error('Error reading clipboard:', error);
      
      // Provide specific error types for better user feedback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : '';
      
      if (errorMessage === 'CLIPBOARD_NOT_SUPPORTED') {
        throw new Error('Clipboard access is not supported in this browser.');
      } else if (errorMessage === 'CLIPBOARD_PERMISSION_DENIED') {
        throw new Error('Clipboard access was denied. Please allow clipboard access in your browser settings.');
      } else if (errorName === 'NotAllowedError') {
        throw new Error('Clipboard access requires user interaction. Please try again after copying content.');
      } else {
        throw new Error('Unable to access clipboard. Please try copying the content again.');
      }
    }
};

// Analyze text content for event-related information
const analyzeTextContent = (text: string): ShareableContent => {
  // const lowerText = text.toLowerCase();
  
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