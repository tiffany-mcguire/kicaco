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
  stackPosition?: number;
  totalInStack?: number;
  isActive?: boolean;
  onTabClick?: () => void;
  priority?: 'high' | 'medium' | 'low';
  index?: number;
}

const darkRainbowColors = [
  '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7',
];
const lightRainbowColors = [
  '#f8b6c2', '#ffd8b5', '#fde68a', '#bbf7d0', '#c0e2e7', '#d1d5fa', '#e9d5ff',
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
  keeperName, childName, date, time, description,
  stackPosition = 0, totalInStack = 1, isActive = false, onTabClick, index = 0
}) => {
  const children = useKicacoStore(state => state.children);
  const childProfile = children.find(c => c.name === childName);
  let colorIndex = index;
  if (childProfile?.color) {
    const matchIndex = lightRainbowColors.findIndex(c => c === childProfile.color);
    if (matchIndex !== -1) colorIndex = matchIndex;
  }
  const overlayColor = darkRainbowColors[colorIndex % darkRainbowColors.length];
  const isTodayKeeper = date ? isToday(parse(date, 'yyyy-MM-dd', new Date())) : false;
  const image = getKicacoEventPhoto(keeperName || 'keeper');

  // Stacking view for homepage
  if (totalInStack > 1) {
    const visibleTabHeight = 64;
    const activeTransformOffset = 16; // The translateY offset for active cards
    
    // Calculate base position
    let cardOffset = (totalInStack - 1 - stackPosition) * visibleTabHeight;
    
    // Compensate for active card transform
    if (isActive) {
      cardOffset += activeTransformOffset;
    }

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
            transform: isActive ? 'translateY(-16px)' : 'translateY(0)',
            transition: 'all 300ms ease-in-out',
          }}
        >
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          
          {/* Tab area with blur and rounded top corners */}
          <div 
            className="absolute inset-x-0 top-0 h-[80px] backdrop-blur-sm rounded-t-2xl"
            style={{
              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.4) 64px, rgba(0, 0, 0, 0.2) 80px)',
            }}
          />
          
          {/* Tab header */}
          <div
            className="absolute inset-x-0 top-0 h-[64px] flex items-center justify-between px-4 text-white cursor-pointer"
            onClick={!isActive ? onTabClick : undefined}
          >
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-sm">{keeperName}</span>
              {childName && <span className="text-xs opacity-80">{childName}</span>}
            </div>
            <span className="text-sm font-medium">{formatDate(date)}</span>
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
            <div className="absolute inset-x-0 bottom-0 bg-black/25 backdrop-blur-sm px-4 py-3 text-white rounded-b-2xl">
              <div className="text-sm text-gray-200">{description}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single card view (No changes here)
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg">
      <img src={image} alt={keeperName} className="absolute inset-0 w-full h-full object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/25 backdrop-blur-sm px-4 py-3 text-white flex flex-row justify-between items-center rounded-b-xl">
        <div className="flex flex-col text-sm space-y-1">
          <h3 className="text-base font-semibold flex items-baseline flex-wrap gap-x-1">
            {keeperName}
            {childName && <span className="text-sm font-normal text-gray-300">({childName})</span>}
          </h3>
          {description && <div className="text-xs text-gray-200">{description}</div>}
        </div>
        <div className="flex flex-col items-start text-sm space-y-1 text-gray-100">
          {date && <div className="font-semibold">{formatDate(date)}</div>}
          {time && <div>{formatTime(time)}</div>}
        </div>
      </div>
    </div>
  );
};

export default KeeperCard;