import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import ChatDrawerContainer from '../components/ChatDrawerContainer';

const ChatDefaultsIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" fill="none"></path>
    <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"></path>
  </svg>
);

const UpdateDefaultsButton = (props: { label?: string }) => {
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

  // No action yet
  const handleClick = () => {};

  return (
    <button
      style={getButtonStyle()}
      tabIndex={0}
      type="button"
      onClick={handleClick}
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
      {props.label ?? 'Update Defaults'}
    </button>
  );
};

export default function ChatDefaults() {
  const [input, setInput] = useState("");
  const [timeToggle, setTimeToggle] = useState(true);
  const [locationToggle, setLocationToggle] = useState(true);
  const [reminderToggle, setReminderToggle] = useState(true);
  const location = useLocation();

  const toggleStyle = (isOn: boolean) => ({
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: isOn ? '#c0e2e7' : '#e0e0e0',
    boxShadow: isOn 
      ? 'inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)'
      : 'inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)',
  });

  const toggleKnobStyle = (isOn: boolean) => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'white',
    transform: isOn ? 'translateX(20px)' : 'translateX(0)',
    transition: 'transform 0.2s ease-in-out',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  });

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
            <svg width="24" height="24" fill="#DCFCE7" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          )} aria-label="Search" />
          <ThreeDotMenu currentPath={location.pathname} />
        </div>
      </header>

      {/* Chat Defaults Subheader */}
      <div className="w-full bg-white z-10">
        <section className="mb-2 px-4 pt-4">
          <div className="flex items-start justify-between w-full">
            {/* Subheader left side */}
            <div style={{width:'180px'}}>
              <div className="h-0.5 rounded w-full mb-0" style={{ backgroundColor: '#2e8b57', opacity: 0.25 }}></div>
              <div className="flex items-center space-x-2 pl-1">
                <ChatDefaultsIcon />
                <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Chat Defaults</h2>
              </div>
              <div className="h-0.5 rounded w-full mt-0" style={{ backgroundColor: '#2e8b57', opacity: 0.25 }}></div>
            </div>
            {/* Update Defaults Button right side */}
            <div className="flex items-center" style={{height: '30px', marginTop: '0px'}}>
              {/* Update Defaults Button */}
              <UpdateDefaultsButton />
            </div>
          </div>
        </section>
      </div>
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Scrollable content */}
        <div className="overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-[16px] font-semibold text-[#00647a]">Follow-up prompts</h3>
            <p className="text-[14px] text-[#030303] leading-snug mt-1 mb-3">
              Set how Kicaco follows up when details are missing in your messages. These settings let you streamline your chats and reduce back-and-forth.
            </p>
            <div className="h-[1px] w-full bg-[#e0e0e0] rounded" />
          </div>
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] text-[#030303]">Always ask for time if not provided</span>
              <button
                type="button"
                role="switch"
                aria-checked={timeToggle}
                aria-label="Always ask for time if not provided"
                onClick={() => setTimeToggle(!timeToggle)}
                style={toggleStyle(timeToggle)}
              >
                <span style={toggleKnobStyle(timeToggle)} />
              </button>
            </div>
            <p className="text-[12px] text-[#858585] font-light leading-snug">
              Be advised: When toggled off, Kicaco will not prompt you for an event time, even if it is not shared in the chat.
            </p>
          </div>
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] text-[#030303]">Always ask for location if not provided</span>
              <button
                type="button"
                role="switch"
                aria-checked={locationToggle}
                aria-label="Always ask for location if not provided"
                onClick={() => setLocationToggle(!locationToggle)}
                style={toggleStyle(locationToggle)}
              >
                <span style={toggleKnobStyle(locationToggle)} />
              </button>
            </div>
            <p className="text-[12px] text-[#858585] font-light leading-snug">
              Be advised: When toggled off, Kicaco will not prompt you for an event location, even if no location is shared or detected from context.
            </p>
          </div>
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] text-[#030303]">Always ask for reminder settings</span>
              <button
                type="button"
                role="switch"
                aria-checked={reminderToggle}
                aria-label="Always ask for reminder settings"
                onClick={() => setReminderToggle(!reminderToggle)}
                style={toggleStyle(reminderToggle)}
              >
                <span style={toggleKnobStyle(reminderToggle)} />
              </button>
            </div>
            <p className="text-[12px] text-[#858585] font-light leading-snug">
              Be advised: When toggled off, Kicaco will not follow up by asking if you want a reminder for an event.
            </p>
          </div>
          <div className="px-4 pt-4 pb-6">
  <p className="text-[14px] leading-snug">
    <span className="text-[#b91142] font-medium">Child Profile Distinction</span>
    <span className="text-[#030303] font-normal"> – In multi-child households, Kicaco will always ask which child an event or task is for if the name isn't included in your message.</span>
  </p>
</div>
        </div>
        <ChatDrawerContainer className="absolute left-0 right-0 top-0 z-30">
          <div className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4">
            {/* No default chat bubbles on this page */}
          </div>
        </ChatDrawerContainer>
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