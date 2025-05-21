import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import ChatDrawerContainer from '../components/ChatDrawerContainer';

const WeeklyIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 448 512">
    <path d="M160 32V64H288V32C288 14.33 302.3 0 320 0C337.7 0 352 14.33 352 32V64H400C426.5 64 448 85.49 448 112V160H0V112C0 85.49 21.49 64 48 64H96V32C96 14.33 110.3 0 128 0C145.7 0 160 14.33 160 32zM0 192H448V464C448 490.5 426.5 512 400 512H48C21.49 512 0 490.5 0 464V192zM80 256C71.16 256 64 263.2 64 272V336C64 344.8 71.16 352 80 352H368C376.8 352 384 344.8 384 336V272C384 263.2 376.8 256 368 256H80z" />
  </svg>
);

const AddByDayButton = (props: { label?: string }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const getButtonStyle = () => {
    let s = {
      width: '140px',
      height: '30px',
      padding: '0px 8px',
      border: '1px solid #c0e2e7',
      boxSizing: 'border-box' as const,
      borderRadius: '6px',
      fontFamily: 'Nunito',
      fontWeight: 600,
      fontSize: '14px',
      lineHeight: '20px',
      boxShadow: '-2px 2px 0px rgba(0,0,0,0.25)',
      background: '#fff',
      color: '#217e8f',
      outline: 'none',
      borderColor: '#c0e2e7',
      transition: 'transform 0.08s cubic-bezier(.4,1,.3,1), box-shadow 0.18s cubic-bezier(.4,1,.3,1), border-color 0.18s cubic-bezier(.4,1,.3,1)',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        boxShadow: '0 0 16px 4px #c0e2e7aa, -2px 2px 0px rgba(0,0,0,0.25)',
        borderColor: '#c0e2e7',
        outline: 'none',
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)', boxShadow: '0 0 16px 4px #c0e2e7aa, -2px 2px 0px rgba(0,0,0,0.25)', borderColor: '#c0e2e7' };
    }
    s.outline = 'none';
    return s;
  };

  return (
    <button
      style={getButtonStyle()}
      tabIndex={0}
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseOver={() => setHovered(true)}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setPressed(false); }}
      className="transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95 active:shadow-[0_0_16px_4px_#c0e2e7aa,-2px_2px_0px_rgba(0,0,0,0.15)]"
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(true); }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(false); }}
    >
      {props.label ?? 'Add by Day'}
    </button>
  );
};

export default function WeeklyCalendar() {
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

      {/* Weekly Calendar Subheader */}
      <div className="w-full bg-white z-10">
        <section className="mb-2 px-4 pt-4">
          <div className="flex items-start justify-between w-full">
            {/* Subheader left side */}
            <div style={{width:'180px'}}>
              <div className="h-0.5 rounded w-full mb-0" style={{backgroundColor:'#E9D5FF', opacity: 0.75}}></div>
              <div className="flex items-center space-x-2 pl-1">
                <WeeklyIcon />
                <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Weekly Calendar</h2>
              </div>
              <div className="h-0.5 rounded w-full mt-0" style={{backgroundColor:'#E9D5FF', opacity: 0.75}}></div>
            </div>
            {/* Add by Day Button right side */}
            <div className="flex items-center" style={{height: '30px', marginTop: '0px'}}>
              {/* Add by Day Button */}
              <AddByDayButton />
            </div>
          </div>
        </section>
      </div>
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Weekly Calendar Body: Rainbow Day Cards */}
        <div className="overflow-y-auto px-4 pb-2 pt-4">
          <div className="flex flex-col gap-3">
            {/* Sunday - Red */}
            <div className="rounded-xl bg-white px-4 py-2 shadow-md" style={{border: '1.5px solid #f8b6c2', boxShadow: '0 0 16px 8px #f8b6c233, 0 2px 8px rgba(0,0,0,0.08)', borderColor: '#f8b6c2', opacity: 1}}>
              <div className="font-medium text-[16px] text-[#b91142]">Sunday May 11, 2025</div>
              <div className="text-gray-400 text-[15px]">No activities or events</div>
            </div>
            {/* Monday - Orange */}
            <div className="rounded-xl bg-white px-4 py-2 shadow-md" style={{border: '1.5px solid #ffd8b5', boxShadow: '0 0 16px 8px #ffd8b533, 0 2px 8px rgba(0,0,0,0.08)', borderColor: '#ffd8b5', opacity: 1}}>
              <div className="font-medium text-[16px] text-[#e67c1a]">Monday May 12, 2025</div>
              <div className="text-gray-400 text-[15px]">No activities or events</div>
            </div>
            {/* Tuesday - Yellow */}
            <div className="rounded-xl bg-white px-4 py-2 shadow-md" style={{border: '1.5px solid #fef9c3', boxShadow: '0 0 16px 8px #fef9c333, 0 2px 8px rgba(0,0,0,0.08)', borderColor: '#fef9c3', opacity: 1}}>
              <div className="font-medium text-[16px] text-[#eab308]">Tuesday May 13, 2025</div>
              <div className="text-gray-400 text-[15px]">No activities or events</div>
            </div>
            {/* Wednesday - Green */}
            <div className="rounded-xl bg-white px-4 py-2 shadow-md" style={{border: '1.5px solid #bbf7d0', boxShadow: '0 0 16px 8px #bbf7d033, 0 2px 8px rgba(0,0,0,0.08)', borderColor: '#bbf7d0', opacity: 1}}>
              <div className="font-medium text-[16px] text-[#16a34a]">Wednesday May 14, 2025</div>
              <div className="text-gray-400 text-[15px]">No activities or events</div>
            </div>
            {/* Thursday - Blue */}
            <div className="rounded-xl bg-white px-4 py-2 shadow-md" style={{border: '1.5px solid #c0e2e7', boxShadow: '0 0 16px 8px #c0e2e733, 0 2px 8px rgba(0,0,0,0.08)', borderColor: '#c0e2e7', opacity: 1}}>
              <div className="font-medium text-[16px] text-[#217e8f]">Thursday May 15, 2025</div>
              <div className="text-gray-400 text-[15px]">No activities or events</div>
            </div>
            {/* Friday - Indigo */}
            <div className="rounded-xl bg-white px-4 py-2 shadow-md" style={{border: '1.5px solid #d1d5fa', boxShadow: '0 0 16px 8px #d1d5fa33, 0 2px 8px rgba(0,0,0,0.08)', borderColor: '#d1d5fa', opacity: 1}}>
              <div className="font-medium text-[16px] text-[#6366f1]">Friday May 16, 2025</div>
              <div className="text-gray-400 text-[15px]">No activities or events</div>
            </div>
            {/* Saturday - Violet */}
            <div className="rounded-xl bg-white px-4 py-2 shadow-md" style={{border: '1.5px solid #e9d5ff', boxShadow: '0 0 16px 8px #e9d5ff33, 0 2px 8px rgba(0,0,0,0.08)', borderColor: '#e9d5ff', opacity: 1}}>
              <div className="font-medium text-[16px] text-[#a21caf]">Saturday May 17, 2025</div>
              <div className="text-gray-400 text-[15px]">No activities or events</div>
            </div>
          </div>
        </div>
        <ChatDrawerContainer className="absolute left-0 right-0 top-0 z-30" />
      </div>

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