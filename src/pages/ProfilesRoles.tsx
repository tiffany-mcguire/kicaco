import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalSubheader from '../components/GlobalSubheader';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { motion } from 'framer-motion';
import { Users } from "lucide-react";

// Styles and function copied from EditChild.tsx for consistent input styling

// Base style for the input WRAPPER
const inputWrapperBaseStyle: React.CSSProperties = {
  borderWidth: '1px',
  borderColor: '#c0e2e799', // Changed from #d1d5db to card border color
  borderRadius: '0.5rem', // Tailwind rounded-lg
  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)', // Lift shadow
  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
};
// Style for the inner INPUT element
const inputElementStyle: React.CSSProperties = {
  width: '100%',
  paddingTop: '0.375rem', // py-1.5
  paddingBottom: '0.375rem', // py-1.5
  paddingLeft: '0.75rem', // px-3
  paddingRight: '0.75rem', // px-3
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  fontSize: '0.75rem', // text-xs (was '0.875rem' i.e. text-sm)
  color: '#111827', // Changed from #9ca3af (text-gray-400) to text-gray-900 for typed text
};

const getFocusStyle = (isFocused: boolean, isRequired: boolean): React.CSSProperties => {
  const nonFocusedBorderColor = '#c0e2e799'; // Card border color C0E2E7 at 60% opacity
  const nonFocusedBlurColor = 'rgba(192, 226, 231, 0.6)'; // #c0e2e7 at 60% opacity for shadow blur
  
  const baseBorderWidth = '1px';
  const baseBorderStyle = 'solid'; 

  const nonFocusedBoxShadow = `0 0 2px 0 ${nonFocusedBlurColor}, 0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)`;
  
  if (isFocused) {
    const bottomBorderColorOnFocus = isRequired ? '#fbb6ce' : '#c0e2e7'; // Will be #c0e2e7 for invite field
    const bottomGlowColor = isRequired ? 'rgba(251, 182, 206, 0.5)' : 'rgba(192, 226, 231, 0.5)'; // Blue glow
    
    return {
      borderTopColor: nonFocusedBorderColor,       // Keep non-focused color
      borderRightColor: nonFocusedBorderColor,     // Keep non-focused color
      borderLeftColor: nonFocusedBorderColor,      // Keep non-focused color
      borderBottomColor: bottomBorderColorOnFocus, 
      borderTopWidth: baseBorderWidth,
      borderRightWidth: baseBorderWidth,
      borderLeftWidth: baseBorderWidth,
      borderBottomWidth: '2px',
      borderStyle: baseBorderStyle,
      boxShadow: `${nonFocusedBoxShadow}, 0 2px 5px -1px ${bottomGlowColor}`,
      borderRadius: '0.5rem', 
    };
  }
  
  // When not focused:
  return {
    borderTopColor: nonFocusedBorderColor,    
    borderRightColor: nonFocusedBorderColor,   
    borderBottomColor: nonFocusedBorderColor,  
    borderLeftColor: nonFocusedBorderColor,    
    borderTopWidth: baseBorderWidth,
    borderRightWidth: baseBorderWidth,
    borderBottomWidth: baseBorderWidth, 
    borderLeftWidth: baseBorderWidth,
    borderStyle: baseBorderStyle,
    boxShadow: nonFocusedBoxShadow, 
    borderRadius: '0.5rem', 
  };
};

type ChildProfile = {
  id: string;
  name: string;
  dob: string;
  school: string;
};

type SharedUser = {
  id: string;
  name: string;
  role: string;
  email: string;
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canManage: boolean;
  };
};

const ProfilesRolesIcon = () => (
  <svg style={{ color: 'rgba(185,17,66,0.75)', fill: 'rgba(185,17,66,0.75)', fontSize: '16px', width: '16px', height: '16px' }} viewBox="0 0 24 24">
    <path fill="none" d="M0 0h24v24H0z"></path>
    <path d="M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM9 4a4 4 0 1 0 0 8 4 4 0 1 0 0-8zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.47 0-.91.1-1.33.24a5.98 5.98 0 0 1 0 7.52c.42.14.86.24 1.33.24zm-6 1c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z" fillRule="evenodd"></path>
  </svg>
);

const UpdateProfilesButton = (props: { label?: string }) => {
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
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      background: '#fff',
      color: '#217e8f',
      outline: 'none',
      borderColor: '#c0e2e7',
      transition: 'transform 0.08s cubic-bezier(.4,1,.3,1), box-shadow 0.18s cubic-bezier(.4,1,.3,1), border-color 0.18s cubic-bezier(.4,1,.3,1)',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        boxShadow: '0 0 12px 2px rgba(192,226,231,0.4), 0 4px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        borderColor: '#c0e2e7',
        outline: 'none',
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)', boxShadow: '0 0 8px 1px rgba(192,226,231,0.3), 0 1px 2px rgba(0,0,0,0.12)', borderColor: '#c0e2e7' };
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
      {props.label ?? 'Update Profiles'}
    </button>
  );
};

const BigActionButton = (props: { children: React.ReactNode; onClick?: () => void }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const getButtonStyle = () => {
    let s = {
      height: '30px',
      width: '140px',
      margin: '12px auto 0 auto',
      padding: '0px 8px',
      boxSizing: 'border-box' as const,
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '20px',
      background: '#fff',
      color: '#217e8f',
      outline: 'none',
      transition: 'transform 0.08s cubic-bezier(.4,1,.3,1), box-shadow 0.18s cubic-bezier(.4,1,.3,1), border-color 0.18s cubic-bezier(.4,1,.3,1)',
      display: 'block',
      borderRadius: '6px',
      border: '1px solid #c0e2e7',
      boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      borderColor: '#c0e2e7',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        boxShadow: '0 0 12px 2px rgba(192,226,231,0.4), 0 4px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        borderColor: '#c0e2e7',
        outline: 'none',
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)', boxShadow: '0 0 8px 1px rgba(192,226,231,0.3), 0 1px 2px rgba(0,0,0,0.12)', borderColor: '#c0e2e7' };
    }
    s.outline = 'none';
    return s;
  };

  return (
    <button
      style={getButtonStyle()}
      tabIndex={0}
      type="button"
      onClick={props.onClick}
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
      {props.children}
    </button>
  );
};

const MiniActionButton = (props: { label: string; color?: string; borderColor?: string; onClick?: () => void; extraClassName?: string }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  // Determine if this is a 'Remove' button by color or borderColor
  const isRemove = (props.color === '#b91142' || props.borderColor === '#e7c0c0');
  // Softer pink for glow and border, lower opacity for shadow
  const glowColor = isRemove ? 'rgba(251,182,206,0.45)' : '#c0e2e7aa';
  const borderColor = isRemove ? 'rgba(251,182,206,0.55)' : (props.borderColor ?? '#c0e2e7');
  const baseShadow = '0 1px 2px rgba(0,0,0,0.08)';
  const liftShadow = isRemove ? '0 2px 4px rgba(185,17,66,0.06)' : '0 2px 4px rgba(33,126,143,0.06)';

  const getButtonStyle = () => {
    let s = {
      width: '140px',
      height: '30px',
      padding: '0px 8px',
      border: `1px solid ${borderColor}`,
      boxSizing: 'border-box' as const,
      borderRadius: '6px',
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: 'normal',
      boxShadow: `${baseShadow}, ${liftShadow}`,
      background: '#fff',
      color: props.color ?? '#217e8f',
      outline: 'none',
      borderColor: borderColor,
      transition: 'transform 0.08s cubic-bezier(.4,1,.3,1), box-shadow 0.18s cubic-bezier(.4,1,.3,1), border-color 0.18s cubic-bezier(.4,1,.3,1)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        boxShadow: `0 0 8px 2px ${glowColor}, 0 2px 4px rgba(0,0,0,0.12), ${liftShadow}`,
        borderColor: borderColor,
        outline: 'none',
      };
    }
    if (pressed) {
      s = {
        ...s,
        transform: 'scale(0.95)',
        boxShadow: `0 0 6px 1px ${glowColor}, 0 1px 2px rgba(0,0,0,0.08)`,
        borderColor: borderColor,
      };
    }
    s.outline = 'none';
    return s;
  };

  return (
    <button
      style={getButtonStyle()}
      tabIndex={0}
      type="button"
      onClick={props.onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseOver={() => setHovered(true)}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setPressed(false); }}
      className={`transition focus:outline-none focus:ring-2 focus:ring-[#fbb6ce] focus:ring-offset-1 active:scale-95 ${props.extraClassName ?? ''}`}
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(true); }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') setPressed(false); }}
    >
      {props.label}
    </button>
  );
};

export default function ProfilesRoles() {
  const [inviteInput, setInviteInput] = useState("");
  const [isInviteInputFocused, setIsInviteInputFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");

  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);

  const [oldDrawerHeight, setOldDrawerHeight] = useState(44);
  const [minScrollHeight, setMinScrollHeight] = useState('0px');
  const [oldScrollOverflow, setOldScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const [oldDrawerTop, setOldDrawerTop] = useState(window.innerHeight);
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState(window.innerHeight);

  // Declarations for chat scroll management logic - ENSURE THESE ARE PRESENT AND CORRECTLY SCOPED
  const [scrollRefReady, setScrollRefReady] = useState(false);
  const internalChatContentScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesContentRef = useRef<HTMLDivElement | null>(null); // Added this ref as it's used by MutationObserver
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const autoscrollFlagRef = useRef(false);
  const previousMessagesLengthRef = useRef(0);
  const firstEffectRunAfterLoadRef = useRef(true);
  // End of declarations for chat scroll management

  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([
    {
      id: 'mockUser1',
      name: 'Jamie Smith',
      role: 'Co-Parent',
      email: 'jamie@example.com',
      permissions: {
        canView: true,
        canAdd: true,
        canEdit: false,
        canManage: false,
      }
    }
  ]);

  const {
    messages,
    threadId,
    addMessage,
    removeMessageById,
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
    children,
  } = useKicacoStore();

  const currentDrawerHeight = storedDrawerHeight !== null && storedDrawerHeight !== undefined ? storedDrawerHeight : 32;

  const handleGlobalDrawerHeightChange = (height: number) => {
    const newHeight = Math.max(Math.min(height, maxDrawerHeight), 32);
    setStoredDrawerHeight(newHeight);
    setOldDrawerHeight(height);
    setOldDrawerTop(window.innerHeight - height);
  };

  useLayoutEffect(() => {
    function updateSubheaderBottom() {
      if (subheaderRef.current) {
        setSubheaderBottom(subheaderRef.current.getBoundingClientRect().bottom);
      }
    }
    updateSubheaderBottom();
    window.addEventListener('resize', updateSubheaderBottom);

    const calculateMaxDrawerHeight = () => {
      const subheaderElement = subheaderRef.current;
      const footerElement = document.querySelector('.global-footer') as HTMLElement | null;
      if (subheaderElement) {
        const subheaderRect = subheaderElement.getBoundingClientRect();
        const footerHeight = footerElement ? footerElement.getBoundingClientRect().height : 0;
        const availableHeight = window.innerHeight - subheaderRect.bottom - footerHeight - 4;
        setMaxDrawerHeight(Math.max(44, availableHeight));
      } else {
        setMaxDrawerHeight(window.innerHeight * 0.6);
      }
    };
    calculateMaxDrawerHeight();
    window.addEventListener('resize', calculateMaxDrawerHeight);

    return () => {
      window.removeEventListener('resize', updateSubheaderBottom);
      window.removeEventListener('resize', calculateMaxDrawerHeight);
    };
  }, []);

  useLayoutEffect(() => {
    function updateMinHeight() {
      const headerH = headerRef.current?.offsetHeight || 0;
      const subheaderH = subheaderRef.current?.offsetHeight || 0;
      const footerH = footerRef.current?.offsetHeight || 0;
      setMinScrollHeight(`calc(100vh - ${headerH + subheaderH + footerH + oldDrawerHeight}px)`);
    }
    updateMinHeight();
    window.addEventListener('resize', updateMinHeight);
    return () => window.removeEventListener('resize', updateMinHeight);
  }, [oldDrawerHeight]);

  useEffect(() => {
    const scrollEl = pageScrollRef.current;
    if (!scrollEl || typeof ResizeObserver === 'undefined') return;
    const checkOverflow = () => {
      const visibleArea = scrollEl.clientHeight - oldDrawerHeight;
      const isDrawerDocked = oldDrawerHeight <= 44;
      if (isDrawerDocked && scrollEl.scrollHeight <= scrollEl.clientHeight + 2) {
        setOldScrollOverflow('hidden');
      } else if (scrollEl.scrollHeight > visibleArea + 2) {
        setOldScrollOverflow('auto');
      } else {
        setOldScrollOverflow('hidden');
      }
    };
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [oldDrawerHeight, minScrollHeight]);

  const handleAddChild = () => {
    setTimeout(() => navigate('/edit-child'), 150);
  };

  // Full implementation for handleChatSendMessage
  const handleChatSendMessage = async () => {
    if (!chatInput.trim()) return;

    if (!threadId) {
      console.error("ProfilesRoles: Cannot send message, threadId is null.");
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: "Sorry, I'm not ready to chat right now. Please try again in a moment."
      });
      return;
    }

    const userMessageId = crypto.randomUUID();
    addMessage({
      id: userMessageId,
      sender: 'user',
      content: chatInput, // Use chatInput state
    });
    const messageToSend = chatInput;
    setChatInput(""); // Clear chatInput

    autoscrollFlagRef.current = true;

    const thinkingMessageId = 'thinking-profilesroles';
    addMessage({
      id: thinkingMessageId,
      sender: 'assistant',
      content: 'Kicaco is thinking'
    });

    try {
      const assistantResponseText = await sendMessageToAssistant(threadId, messageToSend);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: assistantResponseText,
      });
    } catch (error) {
      console.error("Error sending message from ProfilesRoles:", error);
      removeMessageById(thinkingMessageId);
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    }
  };

  // Chat Scroll Management Logic (from previous step, now should have its variables in scope)
  const executeScrollToBottom = useCallback(() => {
    const sc = internalChatContentScrollRef.current;
    if (!sc || !scrollRefReady) return;
    requestAnimationFrame(() => {
      if (internalChatContentScrollRef.current) {
        const currentSc = internalChatContentScrollRef.current;
        const targetScrollTop = Math.max(0, currentSc.scrollHeight - currentSc.clientHeight);
        currentSc.scrollTop = targetScrollTop;
        if (autoscrollFlagRef.current) setChatScrollPosition(targetScrollTop);
        requestAnimationFrame(() => { 
          if (internalChatContentScrollRef.current) {
            const currentSc2 = internalChatContentScrollRef.current;
            const targetScrollTop2 = Math.max(0, currentSc2.scrollHeight - currentSc2.clientHeight);
            if (Math.abs(currentSc2.scrollTop - targetScrollTop2) > 1) {
              currentSc2.scrollTop = targetScrollTop2;
              if (autoscrollFlagRef.current) setChatScrollPosition(targetScrollTop2);
            }
          }
        });
      }
    });
  }, [scrollRefReady, setChatScrollPosition, autoscrollFlagRef]);

  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
  }, []);

  useEffect(() => { 
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer) return;
    let isConsideredNewMessages = false;
    if (firstEffectRunAfterLoadRef.current) {
      if (chatScrollPosition !== null && Math.abs(scrollContainer.scrollTop - chatScrollPosition) > 1.5) {
        scrollContainer.scrollTop = chatScrollPosition;
      }
      firstEffectRunAfterLoadRef.current = false;
    } else {
      if (messages.length > previousMessagesLengthRef.current) isConsideredNewMessages = true;
    }
    if (isConsideredNewMessages) {
      autoscrollFlagRef.current = true;
      executeScrollToBottom();
    }
    previousMessagesLengthRef.current = messages.length;
    return () => { firstEffectRunAfterLoadRef.current = true; };
  }, [messages, chatScrollPosition, scrollRefReady, executeScrollToBottom]);

  useEffect(() => { 
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer || !window.ResizeObserver) return;
    const observer = new ResizeObserver(() => {
      if (autoscrollFlagRef.current && internalChatContentScrollRef.current) executeScrollToBottom();
    });
    observer.observe(scrollContainer);
    resizeObserverRef.current = observer;
    return () => { if (observer) observer.disconnect(); resizeObserverRef.current = null; };
  }, [scrollRefReady, executeScrollToBottom]);

  useEffect(() => { 
    const contentElement = messagesContentRef.current;
    if (!scrollRefReady || !contentElement || !window.MutationObserver) return;
    const observer = new MutationObserver((mutationsList) => {
      if (autoscrollFlagRef.current && internalChatContentScrollRef.current && mutationsList.length > 0) executeScrollToBottom();
    });
    observer.observe(contentElement, { childList: true, subtree: true, characterData: true });
    mutationObserverRef.current = observer;
    return () => { if (observer) observer.disconnect(); mutationObserverRef.current = null; };
  }, [scrollRefReady, executeScrollToBottom]);

  useEffect(() => { 
    const scrollElement = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollElement) return;
    let scrollTimeout: number;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        if (internalChatContentScrollRef.current) {
          const sc = internalChatContentScrollRef.current;
          setChatScrollPosition(sc.scrollTop);
          autoscrollFlagRef.current = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 5;
        }
      }, 150);
    };
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => { clearTimeout(scrollTimeout); scrollElement.removeEventListener('scroll', handleScroll); };
  }, [scrollRefReady, setChatScrollPosition]);

  return (
    <div className="profiles-roles-page flex flex-col min-h-screen bg-white">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<Users />}
        title="Profiles & Roles"
        action={<UpdateProfilesButton />}
      />
      <div
        ref={pageScrollRef}
        className="profiles-roles-content-scroll bg-white"
        style={{
          position: 'absolute',
          top: subheaderBottom + 8,
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0) + 8,
          left: 0,
          right: 0,
          overflowY: oldScrollOverflow,
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        <div className="profiles-roles-content-inner px-4 pt-2 pb-24 max-w-md mx-auto space-y-8">

          <div className="profiles-roles-section-children">
            <h3 className="text-base font-normal text-[#1a6e7e]">Your Children</h3>
            <div className="profiles-roles-children-list">
              {children.length === 0 ? (
                <>
                  <div className="bg-white border border-[#c0e2e799] rounded-lg p-4 mt-2 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_8px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)]">
                    <p className="text-xs text-gray-400 font-light leading-snug">
                      You haven't added any child profiles yet. Start by creating a profile for your child to begin organizing events and reminders.
                    </p>
                  </div>
                  <div className="flex justify-start">
                    <MiniActionButton label="+ Add Child" onClick={handleAddChild} extraClassName="mt-3" />
                  </div>
                </>
              ) : (
                <>
                  {children.map(child => (
                    <div key={child.id} className="profiles-roles-child bg-white border border-[#c0e2e799] rounded-lg p-4 mt-2 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_8px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)] flex items-center justify-between">
                      <div className="profiles-roles-child-info">
                        <p className="text-[#1a6e7e] font-medium text-sm">{child.name}</p>
                        <p className="text-xs text-gray-400 mt-1">DOB: {child.dob}</p>
                        <p className="text-xs text-gray-400">School: {child.school}</p>
                      </div>
                      <div className="profiles-roles-child-actions flex flex-col gap-2 ml-4">
                        <MiniActionButton label="Edit" onClick={() => navigate('/edit-child', { state: { child } })} />
                        <MiniActionButton label="Remove" color="#b91142" borderColor="#e7c0c0" onClick={() => console.log('Remove', child.id)} />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-start">
                    <MiniActionButton label="+ Add Child" onClick={handleAddChild} extraClassName="mt-3" />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="profiles-roles-section-shared-users">
            <h3 className="text-base font-normal text-[#1a6e7e]">Shared Access & Permissions</h3>
            <div className="profiles-roles-shared-users-list">
              {sharedUsers.length === 0 ? (
                <>
                  {/* This section should be empty when no shared users, as per previous request */}
                </>
              ) : (
                sharedUsers.map((user: SharedUser) => (
                  <div key={user.id} className="profiles-roles-shared-user bg-white border border-[#c0e2e799] rounded-lg p-4 mt-2 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_8px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)] flex items-start justify-between">
                    <div className="profiles-roles-shared-user-info min-w-0">
                      <p className="text-[#1a6e7e] font-medium text-sm">{user.name} <span className="text-xs text-gray-400 font-normal">{user.role}</span></p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <div className="text-sm text-gray-700 mt-3">
                        <span className="text-[#1a6e7e] font-medium">Permissions:</span>
                        <div className="profiles-roles-shared-user-permissions md:flex md:flex-row md:gap-x-4 grid grid-cols-2 gap-x-4 gap-y-1 mt-1 ml-2">
                          <span className="flex items-center gap-1">
                            <span className={user.permissions.canView ? 'text-[#1a6e7e]' : 'text-gray-400'}>{user.permissions.canView ? '✓' : '✗'}</span>
                            <span className="text-xs text-gray-400">View</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={user.permissions.canAdd ? 'text-[#1a6e7e]' : 'text-gray-400'}>{user.permissions.canAdd ? '✓' : '✗'}</span>
                            <span className="text-xs text-gray-400">Add</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={user.permissions.canEdit ? 'text-[#1a6e7e]' : 'text-gray-400'}>{user.permissions.canEdit ? '✓' : '✗'}</span>
                            <span className="text-xs text-gray-400">Edit</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={user.permissions.canManage ? 'text-[#1a6e7e]' : 'text-gray-400'}>{user.permissions.canManage ? '✓' : '✗'}</span>
                            <span className="text-xs text-gray-400">Manage</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="profiles-roles-shared-user-actions flex flex-col gap-2 ml-4 self-start">
                      <MiniActionButton label="Edit Permissions" onClick={() => console.log('Edit permissions', user.id)} extraClassName="whitespace-nowrap" />
                      <MiniActionButton label="Remove Access" color="#b91142" borderColor="#e7c0c0" onClick={() => console.log('Remove access', user.id)} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="profiles-roles-invite mt-2">
              <div 
                style={{...inputWrapperBaseStyle, ...getFocusStyle(isInviteInputFocused, false)}} 
                className="mt-1"
              >
                <input
                  type="email"
                  placeholder="Invite by email (e.g. someone@example.com)"
                  style={inputElementStyle}
                  className="w-full placeholder-gray-400"
                  value={inviteInput}
                  onChange={e => setInviteInput(e.target.value)}
                  onFocus={() => setIsInviteInputFocused(true)}
                  onBlur={() => setIsInviteInputFocused(false)}
                />
              </div>
              <div className="flex justify-start">
                <MiniActionButton label="+ Send Invite" onClick={() => console.log('Send invite to', inviteInput)} extraClassName="mt-3" />
              </div>
            </div>
          </div>

        </div>
      </div>
      <GlobalFooter
        ref={footerRef}
        value={chatInput}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
        onSend={handleChatSendMessage}
      />
      <GlobalChatDrawer
        drawerHeight={currentDrawerHeight}
        maxDrawerHeight={maxDrawerHeight}
        onHeightChange={handleGlobalDrawerHeightChange}
        scrollContainerRefCallback={chatContentScrollRef}
      >
        <div 
          ref={messagesContentRef}
          className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4"
        >
          {/* Render Messages */}
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <ChatBubble
                side={msg.sender === 'user' ? 'right' : 'left'}
              >
                {msg.content}
              </ChatBubble>
            </motion.div>
          ))}
        </div>
      </GlobalChatDrawer>
    </div>
  );
} 