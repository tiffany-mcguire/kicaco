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
import { motion, AnimatePresence } from 'framer-motion';
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
  return (
    <button
      type="button"
      onClick={() => console.log('Update profiles')}
      className="px-4 py-1.5 bg-[#217e8f] text-white text-sm font-medium rounded-md hover:bg-[#1a6e7e] active:scale-95 transition-all"
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
      padding: '6px 16px',
      border: `1px solid ${borderColor}`,
      boxSizing: 'border-box' as const,
      borderRadius: '4px',
      fontWeight: 400,
      fontSize: '13px',
      lineHeight: 'normal',
      background: '#ffffff',
      color: props.color ?? '#217e8f',
      outline: 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        background: isRemove ? 'rgba(251,182,206,0.10)' : 'rgba(192,226,231,0.15)',
        borderColor: isRemove ? 'rgba(185,17,66,0.3)' : 'rgba(33,126,143,0.3)',
      };
    }
    if (pressed) {
      s = {
        ...s,
        transform: 'scale(0.98)',
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
  const [inviteInputFocused, setInviteInputFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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
    },
    {
      id: 'mockUser2',
      name: 'Sarah Johnson',
      role: 'Nanny',
      email: 'sarah.j@childcare.com',
      permissions: {
        canView: true,
        canAdd: true,
        canEdit: true,
        canManage: false,
      }
    },
    {
      id: 'mockUser3',
      name: 'Michael Chen',
      role: 'Grandparent',
      email: 'mchen@email.com',
      permissions: {
        canView: true,
        canAdd: false,
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

  // Input field styling from EditChild
  const inputWrapperBaseStyle: React.CSSProperties = {
    borderWidth: '1px',
    borderColor: '#c0e2e799',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    backgroundColor: 'white',
  };

  const inputElementStyle: React.CSSProperties = {
    width: '100%',
    paddingTop: '0.375rem',
    paddingBottom: '0.375rem',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.75rem',
    color: '#111827',
  };

  const getInputFocusStyle = (isFocused: boolean): React.CSSProperties => {
    const nonFocusedBorderColor = '#c0e2e799';
    const nonFocusedBlurColor = 'rgba(192, 226, 231, 0.6)';
    const baseBorderWidth = '1px';
    const baseBorderStyle = 'solid';
    const nonFocusedBoxShadow = `0 0 2px 0 ${nonFocusedBlurColor}, 0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)`;

    if (isFocused) {
      const bottomBorderColorOnFocus = '#c0e2e7';
      const bottomGlowColor = 'rgba(192, 226, 231, 0.5)';
      
      return {
        borderTopColor: nonFocusedBorderColor,
        borderRightColor: nonFocusedBorderColor,
        borderLeftColor: nonFocusedBorderColor,
        borderBottomColor: bottomBorderColorOnFocus,
        borderTopWidth: baseBorderWidth,
        borderRightWidth: baseBorderWidth,
        borderLeftWidth: baseBorderWidth,
        borderBottomWidth: '2px',
        borderStyle: baseBorderStyle,
        boxShadow: `${nonFocusedBoxShadow}, 0 2px 5px -1px ${bottomGlowColor}`,
      };
    }
    
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
    };
  };

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
        className="profiles-roles-content-scroll bg-gray-50"
        style={{
          position: 'absolute',
          top: subheaderBottom,
          bottom: currentDrawerHeight + (footerRef.current?.getBoundingClientRect().height || 0),
          left: 0,
          right: 0,
          overflowY: oldScrollOverflow,
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        <div className="profiles-roles-content-inner px-6 pt-6 pb-24 max-w-2xl mx-auto">
          
          {/* Children Section */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-600">Children</h2>
              <button 
                onClick={handleAddChild}
                className="text-sm text-[#217e8f] hover:text-[#1a6e7e] font-medium transition-all flex items-center gap-1 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
                <span>Add</span>
              </button>
            </div>
            
            {children.length === 0 ? (
              <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-3">No children added yet</p>
                <button 
                  onClick={handleAddChild}
                  className="text-sm text-[#217e8f] hover:text-[#1a6e7e] font-medium transition-colors"
                >
                  Add your first child
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {children.map(child => (
                  <div 
                    key={child.id} 
                    className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setExpandedChild(expandedChild === child.id ? null : child.id)}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-[#217e8f] rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{child.name}</h3>
                            <p className="text-xs text-gray-500">{child.dob} • {child.school}</p>
                          </div>
                        </div>
                        <svg 
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedChild === child.id ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      
                      <AnimatePresence>
                        {expandedChild === child.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/edit-child', { state: { child } });
                              }}
                              className="text-xs text-[#217e8f] hover:text-[#1a6e7e] font-medium transition-colors active:scale-95"
                            >
                              Edit Profile
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to remove ${child.name}?`)) {
                                  // TODO: Implement remove child functionality
                                  console.log('Remove child:', child.id);
                                }
                              }}
                              className="text-xs text-[#b91142] hover:text-[#a01038] font-medium transition-colors active:scale-95"
                            >
                              Remove Profile
                            </button>
                          </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Shared Access Section */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-600">Shared Access</h2>
            </div>
            
            {sharedUsers.length > 0 && (
              <div className="space-y-2 mb-3">
                {sharedUsers.map((user: SharedUser) => (
                  <div 
                    key={user.id} 
                    className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                              <span className="text-xs text-gray-500">{user.role}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            {Object.entries(user.permissions).map(([key, value]) => (
                              <span 
                                key={key} 
                                className={`w-2 h-2 rounded-full ${value ? 'bg-[#217e8f]' : 'bg-gray-300'}`}
                                title={key.replace('can', '')}
                              />
                            ))}
                          </div>
                          <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform ${expandedUser === user.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedUser === user.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-medium text-gray-700">Permissions</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(user.permissions).map(([key, value]) => (
                                <label key={key} className="flex items-center gap-2 text-xs">
                                  <input 
                                    type="checkbox" 
                                    checked={value} 
                                    readOnly
                                    className="w-3 h-3 text-[#217e8f] rounded border-gray-300"
                                  />
                                  <span className="text-gray-600 capitalize">{key.replace('can', '')}</span>
                                </label>
                              ))}
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement edit permissions functionality
                                  console.log('Edit permissions for:', user.id);
                                }}
                                className="text-xs text-[#217e8f] hover:text-[#1a6e7e] font-medium transition-colors active:scale-95"
                              >
                                Edit Access
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to remove access for ${user.name}?`)) {
                                    setSharedUsers(sharedUsers.filter(u => u.id !== user.id));
                                  }
                                }}
                                className="text-xs text-[#b91142] hover:text-[#a01038] font-medium transition-colors active:scale-95"
                              >
                                Remove Access
                              </button>
                            </div>
                          </div>
                        </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inviteInput.trim()) {
                    console.log('Send invite to', inviteInput);
                    setInviteInput('');
                  }
                }}
                noValidate
              >
                <div style={{...inputWrapperBaseStyle, ...getInputFocusStyle(inviteInputFocused)}}>
                  <input
                    type="email"
                    placeholder="Enter email to invite"
                    style={inputElementStyle}
                    className="placeholder-gray-400"
                    value={inviteInput}
                    onChange={e => setInviteInput(e.target.value)}
                    onFocus={() => setInviteInputFocused(true)}
                    onBlur={() => setInviteInputFocused(false)}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (inviteInput.trim()) {
                        console.log('Send invite to', inviteInput);
                        setInviteInput('');
                      }
                    }}
                    className="text-sm text-[#217e8f] hover:text-[#1a6e7e] font-medium transition-all flex items-center gap-1 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                    </svg>
                    <span>Send Invite</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

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