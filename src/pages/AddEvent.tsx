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

const AddEventIcon = () => {
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
      <path d="M0 0h24v24H0z" fill="none"></path>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
    </svg>
  );
};

export default function AddEvent() {
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
        icon={<AddEventIcon />}
        title="Add Event"
        frameColor="#c0e2e7"
        frameOpacity={0.75}
      />
      <div
        ref={scrollRef}
        className="add-event-content-scroll bg-white"
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
        {/* Content intentionally left empty for now */}
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