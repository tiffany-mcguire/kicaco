import React from 'react';
import { format, parse, isToday } from 'date-fns';
import { getKicacoEventPhoto } from '../../utils/getKicacoEventPhoto';
import { useKicacoStore } from '../../store/kicacoStore';
import { Trash2 } from 'lucide-react';
import { StackedChildBadges } from '../common';

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
  onEdit?: () => void;
  onDelete?: () => void;
}



// Day colors for accent line (same as EventCard and UpcomingEvents)
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

const formatDate = (date?: string) => {
  if (!date) return '';
  try {
    const d = parse(date, 'yyyy-MM-dd', new Date());
    return isNaN(d.getTime()) ? date : format(d, 'EEEE, MMMM d');
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
  stackPosition = 0, totalInStack = 1, isActive = false, onTabClick, index = 0, activeIndex, onEdit, onDelete
}) => {

  
  // Get day of week for color coding
  const dayOfWeek = date ? parse(date, 'yyyy-MM-dd', new Date()).getDay() : 0;
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
        className="relative w-full h-full rounded-xl overflow-hidden bg-white"
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
        
        {/* Tab overlay on top of the KeeperCard (matching EventDayStackCard) */}
        <div className="absolute top-0 left-0 right-0 z-10 h-[56px] backdrop-blur-sm">
          <div className="flex h-full items-center justify-between px-4" onClick={onTabClick}>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                {childName && (
                  <StackedChildBadges 
                    childName={childName} 
                    size="sm" 
                    maxVisible={3}
                  />
                )}
                <span className="text-sm font-semibold text-white">{keeperName}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center items-end">
              <span className="text-sm font-medium text-white">{formatDate(date)}</span>
              {time && (
                <span className="text-xs text-gray-200 mt-0.5">{formatTime(time)}</span>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${dayColors[dayOfWeek]}, transparent)` }}/>
        </div>
        
        {/* Info Panel with Notes - always visible like EventCard */}
        <div className="absolute inset-x-0 top-14 p-4 text-white">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-bold text-gray-300">Notes</h4>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="text-xs text-gray-300 hover:text-white transition-colors bg-black/30 rounded-full px-1.5 py-0.5"
              >
                Edit
              </button>
            )}
          </div>
          {description ? (
            <p className="text-xs text-gray-200">{description}</p>
          ) : (
            <p className="text-xs italic text-gray-400">—</p>
          )}
        </div>
        
        {isTodayKeeper && (
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              boxShadow: `inset 0 0 20px rgba(248, 182, 194, 0.6)`,
              border: '1px solid rgba(248, 182, 194, 0.4)',
            }}
          />
        )}
        
        {/* Delete button at bottom center */}
        {onDelete && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1 bg-black/30 text-gray-300 hover:text-[#e7a5b4] text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeeperCard;