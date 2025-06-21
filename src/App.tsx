// import React from 'react';
import { Outlet } from 'react-router-dom';
import { useEffect, createContext, useState } from 'react';
import './utils/clearStorage'; // Import to make clearKicacoStorage available globally

// Create a context for global search functionality
export const SearchContext = createContext({
  openSearch: () => {}
});

export default function App() {
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Function to trigger search from anywhere in the app
  const openSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  // Add keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); // Prevent browser's default behavior
        openSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Outlet context={{ searchTrigger }} />
      </div>
    </SearchContext.Provider>
  );
} 