import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import ChatDrawerContainer from '../components/ChatDrawerContainer';

// Notebook/Binder Icon (Lucide style, simple)
const AddKeeperIcon = () => {
  const styles = {
    Icon: {
      color: 'rgba(185,17,66,0.75)',
      fill: 'rgba(185,17,66,0.75)',
      fontSize: '16px',
      width: '16px',
      height: '16px',
    },
  };
  return (
    <svg style={styles.Icon} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <line x1="7" y1="4" x2="7" y2="20" stroke="currentColor" strokeWidth="2"/>
      <circle cx="7" cy="8" r="0.7" fill="currentColor" />
      <circle cx="7" cy="12" r="0.7" fill="currentColor" />
      <circle cx="7" cy="16" r="0.7" fill="currentColor" />
    </svg>
  );
};

export default function AddKeeper() {
  const [input, setInput] = useState("");
  const location = useLocation();
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between bg-[#217e8f] bg-opacity-85 h-16 px-4 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        {/* Left Buttons */}
        <div className="flex gap-2">
          <HamburgerMenu currentPath={location.pathname} />
          <CalendarMenu currentPath={location.pathname} />
        </div>
        {/* Middle Space */}
        <div className="flex-1"></div>
        {/* Right Buttons */}
        <div className="flex gap-2">
          <IconButton IconComponent={() => (
            <svg width="24" height="24" fill="#c0e2e7" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          )} aria-label="Search" />
          <ThreeDotMenu currentPath={location.pathname} />
        </div>
      </header>

      {/* Add Keeper Subheader */}
      <div className="w-full bg-white z-10">
        <section className="mb-2 px-4 pt-4">
          <div style={{width:'180px'}}>
            <div className="h-0.5 rounded w-full mb-0" style={{backgroundColor:'#f8b6c2', opacity: 0.75}}></div>
            <div className="flex items-center space-x-2 pl-1">
              <AddKeeperIcon />
              <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Add Keeper</h2>
            </div>
            <div className="h-0.5 rounded w-full mt-0" style={{backgroundColor:'#f8b6c2', opacity: 0.75}}></div>
          </div>
        </section>
      </div>
      <ChatDrawerContainer>
        <div className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4">
          {/* No default chat bubbles on this page */}
        </div>
      </ChatDrawerContainer>

      {/* Footer input bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-2px_8px_rgba(0,0,0,0.15)] z-30">
        <div className="w-full h-16 px-4 flex items-center justify-between">
          {/* Left icon group */}
          <div className="flex gap-2">
            <IconButton IconComponent={props => <ClipboardIcon2 {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} aria-label="Paste" />
            <IconButton IconComponent={props => <UploadIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} aria-label="Upload" />
          </div>

          {/* Center input */}
          <div className="flex-1 mx-4">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full rounded-full border border-[#c0e2e7] px-4 py-2 focus:outline-none text-base bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus:shadow-[0_0_8px_2px_#c0e2e7,0_2px_8px_rgba(0,0,0,0.08)]"
              placeholder="Type a message…"
            />
          </div>

          {/* Right icon group */}
          <div className="flex gap-2">
            <IconButton IconComponent={props => <CameraIconMD {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} aria-label="Camera" />
            <IconButton IconComponent={props => <MicIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} aria-label="Mic" />
          </div>
        </div>
      </footer>
    </div>
  );
} 