// import React from 'react';
import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Outlet />
    </div>
  );
} 