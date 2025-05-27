import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AddKeeperButton from '../components/AddKeeperButton';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalSubheader from '../components/GlobalSubheader';
import { useKicacoStore } from '../store/kicacoStore';
import EventCard from '../components/EventCard';
import { getImageForCategory } from '../utils/getImageForCategory';

// Add CalendarIcon definition
const CalendarIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 448 512">
    <path d="M160 32V64H288V32C288 14.33 302.3 0 320 0C337.7 0 352 14.33 352 32V64H400C426.5 64 448 85.49 448 112V160H0V112C0 85.49 21.49 64 48 64H96V32C96 14.33 110.3 0 128 0C145.7 0 160 14.33 160 32zM0 192H448V464C448 490.5 426.5 512 400 512H48C21.49 512 0 490.5 0 464V192zM64 304C64 312.8 71.16 320 80 320H112C120.8 320 128 312.8 128 304V272C128 263.2 120.8 256 112 256H80C71.16 256 64 263.2 64 272V304zM192 304C192 312.8 199.2 320 208 320H240C248.8 320 256 312.8 256 304V272C256 263.2 248.8 256 240 256H208C199.2 256 192 263.2 192 272V304zM336 256C327.2 256 320 263.2 320 272V304C320 312.8 327.2 320 336 320H368C376.8 320 384 312.8 384 304V272C384 263.2 376.8 256 368 256H336zM64 432C64 440.8 71.16 448 80 448H112C120.8 448 128 440.8 128 432V400C128 391.2 120.8 384 112 384H80C71.16 384 64 391.2 64 400V432zM208 384C199.2 384 192 391.2 192 400V432C192 440.8 199.2 448 208 448H240C248.8 448 256 440.8 256 432V400C256 391.2 248.8 384 240 384H208zM320 432C320 440.8 327.2 448 336 448H368C376.8 448 384 440.8 384 432V400C384 391.2 376.8 384 368 384H336C327.2 384 320 391.2 320 400V432z" />
  </svg>
);

// AddEventButton definition (matches AddKeeperButton logic)
const AddEventButton = (props: { label?: string }) => {
  const navigate = useNavigate();
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

  const handleClick = () => {
    setTimeout(() => navigate('/add-event'), 150);
  };

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
      {props.label ?? 'Add Event'}
    </button>
  );
};

export default function UpcomingEvents() {
  const [input, setInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [drawerHeight, setDrawerHeight] = useState(44);
  const [drawerTop, setDrawerTop] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [scrollOverflow, setScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- NEW: Track if blurb has been shown/should be hidden forever ---
  const [blurbGone, setBlurbGone] = useState(() => {
    // Persist blurb state in localStorage
    return localStorage.getItem('kicaco_blurb_gone') === 'true';
  });
  const { events } = useKicacoStore();

  useEffect(() => {
    if (events.length > 0 && !blurbGone) {
      setBlurbGone(true);
      localStorage.setItem('kicaco_blurb_gone', 'true');
    }
  }, [events, blurbGone]);

  const handleDrawerHeightChange = (height: number) => {
    setDrawerHeight(height);
    setDrawerTop(window.innerHeight - height);
  };

  useLayoutEffect(() => {
    function updateSubheaderBottom() {
      if (subheaderRef.current) {
        setSubheaderBottom(subheaderRef.current.getBoundingClientRect().bottom);
      }
    }
    updateSubheaderBottom();
    window.addEventListener('resize', updateSubheaderBottom);
    return () => window.removeEventListener('resize', updateSubheaderBottom);
  }, []);

  useEffect(() => {
    if (drawerHeight > 44 + 8) {
      setScrollOverflow('auto');
    } else {
      setScrollOverflow('hidden');
    }
  }, [drawerHeight]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={
          <svg width="16" height="16" fill="rgba(185,17,66,0.75)" viewBox="0 0 24 24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
          </svg>
        }
        title="Upcoming Events"
        action={<AddEventButton />}
        frameColor="#c0e2e7"
        frameOpacity={0.75}
      />
      <div
        ref={scrollRef}
        className="upcoming-events-content-scroll bg-white"
        style={{
          position: 'absolute',
          top: subheaderBottom + 8,
          bottom: window.innerHeight - drawerTop,
          left: 0,
          right: 0,
          overflowY: scrollOverflow,
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        {/* Main content goes here */}
        {!blurbGone && events.length === 0 && (
          <section className="mb-2 px-4 pt-4">
            <div style={{width:'180px'}}>
              <div className="h-0.5 bg-[#c0e2e7] rounded w-full mb-0" style={{ opacity: 0.75 }}></div>
              <div className="flex items-center space-x-2 pl-1">
                <svg width="16" height="16" fill="rgba(185,17,66,0.75)" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>
                <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Upcoming Events</h2>
              </div>
              <div className="h-0.5 bg-[#c0e2e7] rounded w-full mt-0" style={{ opacity: 0.75 }}></div>
            </div>
            <p className="mt-2 text-gray-700 text-[15px] leading-snug font-medium w-full text-left section-blurb" style={{marginBottom: 0, paddingBottom: 0}}>
              Kicaco gives you a clear and up-to-date view of what's next, so you never miss a practice, recital, or class party.
            </p>
          </section>
        )}
        {events.length > 0 && (
          <div className="flex flex-col items-center w-full pt-6">
            {events.map((event, idx) => (
              <EventCard
                key={event.eventName + event.date + idx}
                image={getImageForCategory(event.eventName)}
                name={event.eventName}
                date={event.date}
                time={event.time}
                location={event.location}
              />
            ))}
          </div>
        )}
      </div>
      <GlobalChatDrawer onHeightChange={handleDrawerHeightChange}>
        <div className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4">
          {/* No default chat bubbles on this page */}
        </div>
      </GlobalChatDrawer>
      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
      />
    </div>
  );
} 