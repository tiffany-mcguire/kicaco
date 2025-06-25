// Debug utilities for development
export const clearKicacoStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kicaco-store');
    console.log('Kicaco localStorage cleared');
    
    // Also clear any other potential storage keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('kicaco')) {
        localStorage.removeItem(key);
        console.log(`Cleared localStorage key: ${key}`);
      }
    });
    
    alert('localStorage cleared! Refresh the page to reload fresh mock data.');
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

// Make these available globally for easy debugging
if (typeof window !== 'undefined') {
  (window as any).clearKicacoStorage = clearKicacoStorage;
  (window as any).debugEventData = debugEventData;
} 