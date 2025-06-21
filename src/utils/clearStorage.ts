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

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearKicacoStorage = clearKicacoStorage;
} 