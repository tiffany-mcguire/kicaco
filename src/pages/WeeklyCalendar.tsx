import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalSubheader from '../components/GlobalSubheader';
import GlobalChatDrawer from '../components/GlobalChatDrawer';

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
  const headerRef = React.useRef<HTMLDivElement>(null);
  const subheaderRef = React.useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLDivElement>(null);
  const [drawerHeight, setDrawerHeight] = useState(44);
  const [drawerTop, setDrawerTop] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [scrollOverflow, setScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [contentPadding, setContentPadding] = useState(44);

  const handleDrawerHeightChange = (height: number) => {
    setDrawerHeight(height);
    setDrawerTop(window.innerHeight - height);
    setContentPadding(height);
  };

  React.useLayoutEffect(() => {
    function updateSubheaderBottom() {
      if (subheaderRef.current) {
        setSubheaderBottom(subheaderRef.current.getBoundingClientRect().bottom);
      }
    }
    updateSubheaderBottom();
    window.addEventListener('resize', updateSubheaderBottom);
    return () => window.removeEventListener('resize', updateSubheaderBottom);
  }, []);

  React.useEffect(() => {
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
        icon={<WeeklyIcon />}
        title="Weekly Calendar"
        action={<AddByDayButton />}
        frameColor="#E9D5FF"
        frameOpacity={0.75}
      />
      <div
        ref={scrollRef}
        className="weekly-calendar-content-scroll bg-white"
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
        {/* Weekly Calendar Body: Rainbow Day Cards */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-4 pb-2 pt-4" style={{ paddingBottom: 32 }}>
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
        </div>
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