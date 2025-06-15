import React from 'react';
import { format, parse, isToday } from 'date-fns';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { useKicacoStore } from '../store/kicacoStore';

interface KeeperCardProps {
  keeperName: string;
  childName?: string;
  date: string;
  time?: string;
  description?: string;
  image?: string;
  stackPosition?: number;
  totalInStack?: number;
  isActive?: boolean;
  onTabClick?: () => void;
  priority?: 'high' | 'medium' | 'low';
  index?: number;
  activeIndex?: number | null;
}

const darkRainbowColors = [
  '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7',
];

// Use the correct pastel colors from WeeklyCalendar.tsx
const keeperCardAccentColors = [
  '#f8b6c2', // Sunday - pink
  '#ffd8b5', // Monday - orange
  '#fde68a', // Tuesday - yellow
  '#bbf7d0', // Wednesday - green
  '#c0e2e7', // Thursday - blue
  '#d1d5fa', // Indigo
  '#e9d5ff', // Saturday - purple
];

const formatDate = (date?: string) => {
  if (!date) return '';
  try {
    const d = parse(date, 'yyyy-MM-dd', new Date());
    return isNaN(d.getTime()) ? date : format(d, 'MM/dd/yyyy');
  } catch { return date; }
};

const formatTime = (time?: string) => {
  if (!time) return '';
  let normalized = time.trim().toLowerCase().replace(/(\d)(am|pm)/, '$1 $2');
  if (/^\d{1,2}\s?(am|pm)$/.test(normalized)) {
    normalized = normalized.replace(/^(\d{1,2})\s?(am|pm)$/, '$1:00 $2');
  }
  const patterns = ['h:mm a', 'h a', 'h:mma', 'ha', 'H:mm'];
  for (const pattern of patterns) {
    try {
      const dateObj = parse(normalized, pattern, new Date());
      if (!isNaN(dateObj.getTime())) return format(dateObj, 'hh:mm a');
    } catch {}
  }
  const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
  return isNaN(dateObj.getTime()) ? time : format(dateObj, 'hh:mm a');
};

const KeeperCard: React.FC<KeeperCardProps> = ({
  keeperName, childName, date, time, description, image,
  stackPosition = 0, totalInStack = 1, isActive = false, onTabClick, index = 0, activeIndex
}) => {
  const children = useKicacoStore(state => state.children);
  const childProfile = children.find(c => c.name === childName);
  let colorIndex = index;
  if (childProfile?.color) {
    const matchIndex = keeperCardAccentColors.findIndex(c => c === childProfile.color);
    if (matchIndex !== -1) colorIndex = matchIndex;
  }
  const overlayColor = darkRainbowColors[colorIndex % darkRainbowColors.length];
  const isTodayKeeper = date ? isToday(parse(date, 'yyyy-MM-dd', new Date())) : false;
  const imageUrl = image || getKicacoEventPhoto(keeperName || 'keeper');

  // Stacking view is now the only view
  const visibleTabHeight = 56;
  const activeTransformOffset = 16; // The translateY offset for active cards
  
  // Calculate the card's vertical offset
  // Cards stack from bottom to top with the new, tighter spacing
  let cardOffset = (totalInStack - 1 - stackPosition) * visibleTabHeight;
  
  // If there's an active card below this one, push this card up
  if (activeIndex !== null && activeIndex !== undefined && activeIndex > stackPosition) {
    cardOffset += 176; // Push up by the amount the active card pops up (240 - 64)
  }
  
  // If this card is active, compensate for its transform
  if (isActive) {
    cardOffset += 176;
  }
  
  console.log(`Card ${stackPosition}: offset=${cardOffset}px, active=${isActive}, activeIndex=${activeIndex}`);
  
  return (
    <div
      className="absolute left-0 right-0 h-[240px]"
      style={{
        top: `${cardOffset}px`,
        zIndex: totalInStack - stackPosition,
        transition: 'all 300ms ease-in-out',
      }}
    >
      <div
        className="relative w-full h-full rounded-2xl shadow-lg overflow-hidden bg-black"
        style={{
          transform: isActive ? 'translateY(-176px) scale(1.02)' : 'translateY(0)',
          transition: 'all 300ms ease-in-out',
          boxShadow: isActive 
            ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
            : '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        
        {/* A single overlay for the entire card */}
        <div className="absolute inset-0 bg-black/[.65]" />
        
        {/* Tab overlay, with a soft bottom glow */}
        <div 
          className="absolute top-0 left-0 right-0 h-[67px] backdrop-blur-sm" 
          style={{
            boxShadow: `
              inset 0 10px 15px -10px ${childProfile?.color ? overlayColor + '90' : 'transparent'}, 
              inset 0 -15px 20px -15px ${childProfile?.color ? overlayColor + '50' : 'transparent'}
            `
          }}
        />
        
        {/* Accent line */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 h-[2px] w-[40px] rounded-full"
          style={{
            top: '8px',
            background: childProfile?.color ? keeperCardAccentColors[colorIndex % keeperCardAccentColors.length] : 'transparent',
          }}
        />
        
        {/* Tab header */}
        <div
          className="absolute inset-x-0 top-0 h-[64px] flex items-center justify-between px-4 text-white cursor-pointer"
          onClick={onTabClick}
        >
          <div className="flex flex-col justify-center">
            <span className="text-sm font-semibold">{keeperName}</span>
            {childName && <span className="text-xs opacity-80">{childName}</span>}
          </div>
          <span 
            className="text-sm font-medium" 
            style={{ transform: 'translateY(-8px)' }}
          >
            {formatDate(date)}
          </span>
        </div>
        
        {isTodayKeeper && (
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              boxShadow: `inset 0 0 20px rgba(248, 182, 194, 0.6)`,
              border: '1px solid rgba(248, 182, 194, 0.4)',
            }}
          />
        )}
        {isActive && description && (
          <div className="absolute inset-x-0 bottom-0 bg-black/50 px-4 py-3 text-white rounded-b-2xl">
            <div className="text-sm text-gray-200">{description}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeeperCard;