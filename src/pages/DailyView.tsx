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
  const headerRef = React.useRef<HTMLDivElement>(null);
  const subheaderRef = React.useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLDivElement>(null);
  const [drawerHeight, setDrawerHeight] = useState(44);
  const [drawerTop, setDrawerTop] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [scrollOverflow, setScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const scrollRef = React.useRef<HTMLDivElement>(null);

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

  const handleDrawerHeightChange = (height: number) => {
    setDrawerHeight(height);
    setDrawerTop(window.innerHeight - height);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<DailyViewIcon />}
        title="Daily View"
        frameColor="#E9D5FF"
        frameOpacity={0.75}
      />
      <div
        ref={scrollRef}
        className="daily-view-content-scroll bg-white"
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
        {/* Daily View Body: Add your content here */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-4 pt-4">
            {/* Content intentionally left empty for now */}
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