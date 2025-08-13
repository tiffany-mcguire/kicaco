import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import UpcomingEvents from './pages/UpcomingEvents';
import Keepers from './pages/Keepers';
import MonthlyCalendar from './pages/MonthlyCalendar';
import WeeklyCalendar from './pages/WeeklyCalendar';
import ChatDefaults from './pages/ChatDefaults';
import ProfilesRoles from './pages/ProfilesRoles';
import EditChild from './pages/EditChild';
import AddEvent from './pages/AddEvent';
import EventConfirmation from './pages/EventConfirmation';
import AddKeeper from './pages/AddKeeper';
import DailyView from './pages/DailyView';
import ShareProcessor from './pages/ShareProcessor';
import KicacoFlow from './pages/KicacoFlow';
import './index.css';

// Import Vite PWA service worker registration
import { registerSW } from 'virtual:pwa-register';

// Mobile debugging - log errors to help identify mobile-specific issues
if (typeof window !== 'undefined') {
  // Catch all JavaScript errors
  window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
    console.error('Error details:', {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
  });

  // Log when React starts mounting
  console.log('React app starting...', {
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString()
  });
}

// Register service worker for PWA functionality using Vite PWA
const updateSW = registerSW({
  onNeedRefresh() {
    // You can prompt user to refresh here
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});

console.log('Creating React root...');
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Share target route - standalone, outside main app layout */}
        <Route path="/share" element={<ShareProcessor />} />
        
        {/* Main app routes */}
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="upcoming-events" element={<UpcomingEvents />} />
          <Route path="keepers" element={<Keepers />} />
          <Route path="monthly-calendar" element={<MonthlyCalendar />} />
          <Route path="weekly-calendar" element={<WeeklyCalendar />} />
          <Route path="daily-view" element={<DailyView />} />
          <Route path="chat-defaults" element={<ChatDefaults />} />
          <Route path="profiles-roles" element={<ProfilesRoles />} />
          <Route path="edit-child" element={<EditChild />} />
          <Route path="add-event" element={<AddEvent />} />
          <Route path="add-event/confirmation" element={<EventConfirmation />} />
          <Route path="add-keeper" element={<AddKeeper />} />
          <Route path="kicaco-flow" element={<KicacoFlow />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

console.log('React app render completed'); 