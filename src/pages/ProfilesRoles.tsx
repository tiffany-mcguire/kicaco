import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import IconButton from '../components/IconButton';
import ChatBubble from '../components/ChatBubble';
import HamburgerMenu from '../components/HamburgerMenu';
import CalendarMenu from '../components/CalendarMenu';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalSubheader from '../components/GlobalSubheader';

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
      width: '140px', // Match all other custom buttons
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
      marginTop: '12px',
      padding: '10px 0',
      boxSizing: 'border-box' as const,
      fontFamily: 'Nunito',
      fontWeight: 600,
      fontSize: '16px',
      lineHeight: '22px',
      background: '#fff',
      color: '#217e8f',
      outline: 'none',
      transition: 'transform 0.08s cubic-bezier(.4,1,.3,1), box-shadow 0.18s cubic-bezier(.4,1,.3,1), border-color 0.18s cubic-bezier(.4,1,.3,1)',
      display: 'block',
      width: '100%',
      borderRadius: '8px',
      border: '1px solid #c0e2e7',
      boxShadow: '-2px 2px 0px rgba(0,0,0,0.15)',
      borderColor: '#c0e2e7',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        boxShadow: '0 0 16px 4px #c0e2e7aa, -2px 2px 0px rgba(0,0,0,0.15)',
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
  const baseShadow = '-2px 2px 0px rgba(0,0,0,0.10)';
  const liftShadow = isRemove ? '-2px 2px 8px 0px rgba(185,17,66,0.06)' : '-2px 2px 8px 0px rgba(33,126,143,0.06)';

  const getButtonStyle = () => {
    let s = {
      minWidth: '80px',
      height: '28px',
      padding: '0px 12px',
      border: `1.2px solid ${borderColor}`,
      boxSizing: 'border-box' as const,
      borderRadius: '6px',
      fontFamily: 'Nunito',
      fontWeight: 600,
      fontSize: '13px',
      lineHeight: '18px',
      boxShadow: `${baseShadow}, ${liftShadow}`,
      background: '#fff',
      color: props.color ?? '#217e8f',
      outline: 'none',
      borderColor: borderColor,
      transition: 'transform 0.08s cubic-bezier(.4,1,.3,1), box-shadow 0.18s cubic-bezier(.4,1,.3,1), border-color 0.18s cubic-bezier(.4,1,.3,1)',
      cursor: 'pointer',
    } as React.CSSProperties;
    if (hovered || focused) {
      s = {
        ...s,
        boxShadow: `0 0 12px 3px ${glowColor}, ${baseShadow}, ${liftShadow}`,
        borderColor: borderColor,
        outline: 'none',
      };
    }
    if (pressed) {
      s = {
        ...s,
        transform: 'scale(0.95)',
        boxShadow: `0 0 12px 3px ${glowColor}, ${baseShadow}, ${liftShadow}`,
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
  const [input, setInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerHeight, setDrawerHeight] = useState(44); // initial: minimized height + gap
  const prevDrawerHeight = useRef(drawerHeight);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [minScrollHeight, setMinScrollHeight] = useState('0px');
  const [scrollOverflow, setScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const [scrollPadding, setScrollPadding] = useState<number>(drawerHeight);
  const [drawerTop, setDrawerTop] = useState(window.innerHeight); // initial: bottom of viewport
  const [subheaderBottom, setSubheaderBottom] = useState(0);

  const [children, setChildren] = useState<ChildProfile[]>([
    {
      id: '1',
      name: 'Jordan Reyes',
      dob: '08/25/2013',
      school: 'Pine Hill Elementary'
    }
  ]);

  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([
    {
      id: '1',
      name: 'Casey Morgan',
      role: 'Co-parent',
      email: 'casey.morgan@example.com',
      permissions: {
        canView: true,
        canAdd: true,
        canEdit: true,
        canManage: true
      }
    }
  ]);

  const handleAddChild = () => {
    setTimeout(() => navigate('/edit-child'), 150);
  };

  // Update drawerTop when drawer height changes
  const handleDrawerHeightChange = (drawerHeight: number) => {
    setDrawerTop(window.innerHeight - drawerHeight);
  };

  // Update subheaderBottom on mount and resize
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

  // Dynamically set min-height for scroll area
  useLayoutEffect(() => {
    function updateMinHeight() {
      const headerH = headerRef.current?.offsetHeight || 0;
      const subheaderH = subheaderRef.current?.offsetHeight || 0;
      const footerH = footerRef.current?.offsetHeight || 0;
      setMinScrollHeight(`calc(100vh - ${headerH + subheaderH + footerH + drawerHeight}px)`);
    }
    updateMinHeight();
    window.addEventListener('resize', updateMinHeight);
    return () => window.removeEventListener('resize', updateMinHeight);
  }, [drawerHeight]);

  // Use ResizeObserver to set overflow-y and padding-bottom based on content size
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || typeof ResizeObserver === 'undefined') return;
    const checkOverflow = () => {
      // visible area above the drawer
      const visibleArea = scrollEl.clientHeight - drawerHeight;
      // Detect if drawer is docked (minimized)
      const isDrawerDocked = drawerHeight <= 44; // 32px handle + gap, adjust if needed
      // If drawer is docked and content fits, lock scroll and scroll to top
      if (isDrawerDocked && scrollEl.scrollHeight <= scrollEl.clientHeight + 2) {
        setScrollOverflow('hidden');
        setScrollPadding(0);
        scrollEl.scrollTop = 0;
      } else if (scrollEl.scrollHeight > visibleArea + 2) {
        setScrollOverflow('auto');
        setScrollPadding(drawerHeight);
      } else {
        setScrollOverflow('hidden');
        setScrollPadding(0);
      }
    };
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [drawerHeight, minScrollHeight]);

  return (
    <div className="profiles-roles-page flex flex-col min-h-screen bg-white">
      <GlobalHeader ref={headerRef} />
      <GlobalSubheader
        ref={subheaderRef}
        icon={<ProfilesRolesIcon />}
        title="Profiles & Roles"
        action={<UpdateProfilesButton />}
        frameColor="#2e8b57"
      />
      <div
        className="profiles-roles-content-scroll bg-white"
        style={{
          position: 'absolute',
          top: subheaderBottom + 8,
          bottom: window.innerHeight - drawerTop,
          left: 0,
          right: 0,
          overflowY: 'auto',
          transition: 'top 0.2s, bottom 0.2s',
        }}
      >
        <div className="profiles-roles-content-inner px-4 pt-2 pb-24 max-w-md mx-auto space-y-8">

          {/* Section 1: Manage Your Household */}
          <div className="profiles-roles-section-manage-household">
            <h2 className="text-xl font-semibold text-[#1a6e7e]">Manage Your Household</h2>
            <p className="text-sm text-gray-700 mt-1">
              Set up your household by adding child profiles and inviting others to share access and responsibilities.
            </p>
          </div>

          <div className="profiles-roles-divider border-t border-gray-200 my-6"></div>

          {/* Section 2: Your Children */}
          <div className="profiles-roles-section-children">
            <h3 className="text-lg font-semibold text-[#1a6e7e]">Your Children</h3>
            <div className="profiles-roles-children-list">
              {children.length === 0 ? (
                <>
                  <p className="text-sm text-gray-700 mt-1">
                    You haven't added any child profiles yet. Start by creating a profile for your child to begin organizing events and reminders.
                  </p>
                  <BigActionButton onClick={handleAddChild}>
                    + Add Child Profile
                  </BigActionButton>
                </>
              ) : (
                <>
                  {children.map(child => (
                    <div key={child.id} className="profiles-roles-child bg-white border border-[#c0e2e799] rounded-lg p-4 mt-2 shadow-[0_2px_8px_rgba(33,126,143,0.10)] flex items-center justify-between">
                      <div className="profiles-roles-child-info">
                        <p className="text-[#1a6e7e] font-semibold text-base">{child.name}</p>
                        <p className="text-xs text-gray-500 mt-1">DOB: {child.dob}</p>
                        <p className="text-xs text-gray-500">School: {child.school}</p>
                      </div>
                      <div className="profiles-roles-child-actions flex flex-col gap-2 ml-4">
                        <MiniActionButton label="Edit" onClick={() => console.log('Edit', child.id)} />
                        <MiniActionButton label="Remove" color="#b91142" borderColor="#e7c0c0" onClick={() => console.log('Remove', child.id)} />
                      </div>
                    </div>
                  ))}
                  <BigActionButton onClick={handleAddChild}>+ Add Another Child</BigActionButton>
                </>
              )}
            </div>
          </div>

          {/* Section 3: Shared Access & Permissions */}
          <div className="profiles-roles-section-shared-users">
            <h3 className="text-lg font-semibold text-[#1a6e7e]">Shared Access & Permissions</h3>
            <div className="profiles-roles-shared-users-list">
              {sharedUsers.length === 0 ? (
                <>
                  <p className="text-sm text-gray-700 mt-1">
                    No shared users have been added. Invite a co-parent, grandparent, or sitter to collaborate on your child's schedule.
                  </p>
                </>
              ) : (
                sharedUsers.map(user => (
                  <div key={user.id} className="profiles-roles-shared-user bg-white border border-[#c0e2e799] rounded-lg p-4 mt-2 shadow-[0_2px_8px_rgba(33,126,143,0.10)] flex items-start justify-between">
                    <div className="profiles-roles-shared-user-info min-w-0">
                      <p className="text-[#1a6e7e] font-semibold text-base">{user.name} <span className="text-sm text-gray-500 font-normal">({user.role})</span></p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="text-sm text-gray-700 mt-3">
                        <span className="text-[#1a6e7e] font-semibold">Permissions:</span>
                        <div className="profiles-roles-shared-user-permissions md:flex md:flex-row md:gap-x-4 grid grid-cols-2 gap-x-4 gap-y-1 mt-1 ml-2">
                          <span className="flex items-center gap-1">
                            <span className={user.permissions.canView ? 'text-[#1a6e7e]' : 'text-gray-400'}>{user.permissions.canView ? '✓' : '✗'}</span>
                            <span className={user.permissions.canView ? 'text-[#1a6e7e]' : 'text-gray-400'}>View</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={user.permissions.canAdd ? 'text-[#1a6e7e]' : 'text-gray-400'}>{user.permissions.canAdd ? '✓' : '✗'}</span>
                            <span className={user.permissions.canAdd ? 'text-[#1a6e7e]' : 'text-gray-400'}>Add</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={user.permissions.canEdit ? 'text-[#1a6e7e]' : 'text-gray-400'}>{user.permissions.canEdit ? '✓' : '✗'}</span>
                            <span className={user.permissions.canEdit ? 'text-[#1a6e7e]' : 'text-gray-400'}>Edit</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={user.permissions.canManage ? 'text-[#1a6e7e]' : 'text-gray-400'}>{user.permissions.canManage ? '✓' : '✗'}</span>
                            <span className={user.permissions.canManage ? 'text-[#1a6e7e]' : 'text-gray-400'}>Manage</span>
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

            {/* Always show invite field */}
            <div className="profiles-roles-invite mt-6">
              <p className="text-sm text-[#1a6e7e] font-semibold mb-1">Invite by email</p>
              <input
                type="email"
                placeholder="e.g. someone@example.com"
                className="profiles-roles-invite-input w-full px-4 py-2 border border-[#c0e2e7] rounded-lg shadow-sm text-sm focus:outline-none focus:ring-0 focus:shadow-[0_0_8px_2px_#c0e2e7]"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <BigActionButton onClick={() => console.log('Send invite to', input)}>Send Invite</BigActionButton>
            </div>
          </div>

        </div>
      </div>
      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
      />
      <GlobalChatDrawer onHeightChange={handleDrawerHeightChange}>
        <div className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4">
          {/* No default chat bubbles on this page */}
        </div>
      </GlobalChatDrawer>
    </div>
  );
} 