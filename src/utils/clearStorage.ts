// Utility to clear localStorage and reset to mock data
// This can be called from the browser console on mobile

export const clearKicacoStorage = () => {
  try {
    // Clear all Kicaco-related localStorage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('kicaco')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed: ${key}`);
    });
    
    console.log('Kicaco localStorage cleared successfully!');
    console.log('Refresh the page to see the reset state with mock data.');
    
    return {
      success: true,
      message: 'Storage cleared. Refresh the page to reset to mock data.',
      removedKeys: keysToRemove
    };
  } catch (error) {
    console.error('Error clearing storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const debugEventData = () => {
  if (typeof window !== 'undefined') {
    const storedData = localStorage.getItem('kicaco-store');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log('Stored data:', parsed);
        
        if (parsed.state && parsed.state.events) {
          console.log(`Found ${parsed.state.events.length} events in localStorage`);
          
          // Group by month for debugging
          const eventsByMonth = parsed.state.events.reduce((acc: any, event: any) => {
            if (event.date) {
              const date = new Date(event.date);
              const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
              if (!acc[monthKey]) acc[monthKey] = [];
              acc[monthKey].push(event);
            }
            return acc;
          }, {});
          
          console.log('Events by month:', eventsByMonth);
          return eventsByMonth;
        }
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    } else {
      console.log('No localStorage data found');
    }
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearKicacoStorage = clearKicacoStorage;
  (window as any).debugEventData = debugEventData;
} 