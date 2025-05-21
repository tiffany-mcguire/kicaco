import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import ChatDrawerContainer from '../components/ChatDrawerContainer';

const DailyViewIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '18px', width: '18px', height: '18px', strokeWidth: '1.5' }} viewBox="0 0 90 90">
    <path d="M 71.46 29.223 H 2.001 c -1.104 0 -2 -0.895 -2 -2 v -9.194 c 0 -3.051 2.482 -5.533 5.533 -5.533 h 62.395 c 3.051 0 5.532 2.482 5.532 5.533 v 9.194 C 73.46 28.327 72.565 29.223 71.46 29.223 z M 4.001 25.223 h 65.46 v -7.194 c 0 -0.845 -0.687 -1.533 -1.532 -1.533 H 5.534 c -0.845 0 -1.533 0.687 -1.533 1.533 V 25.223 z"/>
    <path d="M 67.43 82.118 h -61.4 c -3.325 0 -6.03 -2.705 -6.03 -6.03 V 27.223 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 48.865 c 0 1.119 0.911 2.03 2.03 2.03 h 61.4 c 1.119 0 2.03 -0.911 2.03 -2.03 v -6.184 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 6.184 C 73.46 79.413 70.755 82.118 67.43 82.118 z"/>
    <path d="M 57.596 21.113 c -1.104 0 -2 -0.895 -2 -2 V 9.882 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 9.231 C 59.596 20.217 58.701 21.113 57.596 21.113 z"/>
    <path d="M 15.865 21.113 c -1.104 0 -2 -0.895 -2 -2 V 9.882 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 9.231 C 17.865 20.217 16.969 21.113 15.865 21.113 z"/>
    <path d="M 36.731 21.113 c -1.104 0 -2 -0.895 -2 -2 V 9.882 c 0 -1.104 0.895 -2 2 -2 s 2 0.895 2 2 v 9.231 C 38.731 20.217 37.835 21.113 36.731 21.113 z"/>
    <path d="M 86.1 71.904 H 27.191 c -3.871 0 -7.65 -1.361 -10.641 -3.833 C 5.259 58.743 0.001 45.763 0.001 27.223 c 0 -1.104 0.895 -2 2 -2 h 69.46 c 1.104 0 2 0.895 2 2 c 0 17.266 4.804 29.272 15.118 37.782 c 1.284 1.059 1.75 2.755 1.187 4.32 C 89.203 70.892 87.765 71.904 86.1 71.904 z M 4.023 29.223 C 4.385 45.41 9.201 56.81 19.097 64.987 c 2.276 1.881 5.151 2.917 8.094 2.917 h 58.616 c -10.744 -8.978 -15.959 -21.313 -16.326 -38.681 H 4.023 z"/>
  </svg>
);

export default function DailyView() {
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

      {/* Daily View Subheader */}
      <div className="w-full bg-white z-10">
        <section className="mb-2 px-4 pt-4">
          <div style={{width:'180px'}}>
            <div className="h-0.5 rounded w-full mb-0" style={{backgroundColor:'#E9D5FF', opacity: 0.75}}></div>
            <div className="flex items-center space-x-2 pl-1">
              <DailyViewIcon />
              <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Daily View</h2>
            </div>
            <div className="h-0.5 rounded w-full mt-0" style={{backgroundColor:'#E9D5FF', opacity: 0.75}}></div>
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