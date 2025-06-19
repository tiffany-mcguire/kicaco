import { useState, useCallback, useMemo } from 'react';
import { useKicacoStore } from '../store/kicacoStore';

type SearchResult = {
  type: 'event' | 'keeper' | 'message';
  id: string;
  title: string;
  date?: string;
  childName?: string;
  content?: string;
  matchContext?: string;
  source: any; // Original object
};

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const { events, keepers, messages } = useKicacoStore();
  
  // Helper function to extract context around a match
  const extractContext = (text: string | undefined, query: string, contextLength: number = 30): string => {
    if (!text || !query) return '';
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);
    
    let context = text.substring(start, end);
    
    // Add ellipsis if we're not showing the full text
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  };
  
  // Search function
  const search = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];
    
    // Search through events
    events.forEach((event, index) => {
      const eventName = event.eventName?.toLowerCase() || '';
      const location = event.location?.toLowerCase() || '';
      const notes = event.notes?.toLowerCase() || '';
      const childName = event.childName?.toLowerCase() || '';
      
      if (
        eventName.includes(normalizedQuery) ||
        location.includes(normalizedQuery) ||
        notes.includes(normalizedQuery) ||
        childName.includes(normalizedQuery)
      ) {
        let matchContext = '';
        
        // Determine which field matched and extract context
        if (eventName.includes(normalizedQuery)) {
          matchContext = `Event: ${event.eventName}`;
        } else if (location.includes(normalizedQuery)) {
          matchContext = `Location: ${event.location}`;
        } else if (notes.includes(normalizedQuery)) {
          matchContext = `Notes: ${extractContext(event.notes, normalizedQuery)}`;
        } else if (childName.includes(normalizedQuery)) {
          matchContext = `Child: ${event.childName}`;
        }
        
        results.push({
          type: 'event',
          id: `event-${index}`,
          title: event.eventName,
          date: event.date,
          childName: event.childName,
          matchContext,
          source: event
        });
      }
    });
    
    // Search through keepers
    keepers.forEach((keeper, index) => {
      const keeperName = keeper.keeperName?.toLowerCase() || '';
      const description = keeper.description?.toLowerCase() || '';
      const childName = keeper.childName?.toLowerCase() || '';
      
      if (
        keeperName.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        childName.includes(normalizedQuery)
      ) {
        let matchContext = '';
        
        // Determine which field matched and extract context
        if (keeperName.includes(normalizedQuery)) {
          matchContext = `Keeper: ${keeper.keeperName}`;
        } else if (description.includes(normalizedQuery)) {
          matchContext = `Description: ${extractContext(keeper.description, normalizedQuery)}`;
        } else if (childName.includes(normalizedQuery)) {
          matchContext = `Child: ${keeper.childName}`;
        }
        
        results.push({
          type: 'keeper',
          id: `keeper-${index}`,
          title: keeper.keeperName,
          date: keeper.date,
          childName: keeper.childName,
          matchContext,
          source: keeper
        });
      }
    });
    
    // Search through chat messages
    messages.forEach((message, index) => {
      if (message.content?.toLowerCase().includes(normalizedQuery)) {
        const context = extractContext(message.content, normalizedQuery, 50);
        
        results.push({
          type: 'message',
          id: message.id || `message-${index}`,
          title: message.sender === 'user' ? 'You' : 'Kicaco',
          content: message.content,
          matchContext: context,
          source: message
        });
      }
    });
    
    return results;
  }, [events, keepers, messages]);
  
  // Memoized search results
  const searchResults = useMemo(() => {
    return search(searchQuery);
  }, [searchQuery, search]);
  
  // Toggle search visibility
  const toggleSearch = useCallback(() => {
    setIsSearching(prev => !prev);
    if (isSearching) {
      setSearchQuery('');
    }
  }, [isSearching]);
  
  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    setIsSearching,
    toggleSearch,
    searchResults
  };
}; 