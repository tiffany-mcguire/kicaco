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
import AddKeeper from './pages/AddKeeper';
import DailyView from './pages/DailyView';
import ShareProcessor from './pages/ShareProcessor';
import './index.css';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

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
          <Route path="add-keeper" element={<AddKeeper />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
); 