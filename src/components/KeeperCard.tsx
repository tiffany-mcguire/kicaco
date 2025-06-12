import React from 'react';
import { format, parse } from 'date-fns';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';

interface KeeperCardProps {
  keeperName: string;
  childName?: string;
  date: string;
  time?: string;
  description?: string;
  stackPosition?: number;
  totalInStack?: number;
  isHovered?: boolean;
  onHover?: (isHovered: boolean) => void;
}

const formatDate = (date?: string) => {
  if (!date) return '';
  try {
    const d = parse(date, 'yyyy-MM-dd', new Date());
    if (!isNaN(d.getTime())) {
      return format(d, 'MM/dd/yyyy');
    }
  } catch {}
  return date;
};

const formatTime = (time?: string) => {
  if (!time) return '';
  let normalized = time.trim().toLowerCase();
  normalized = normalized.replace(/(\d)(am|pm)/, '$1 $2');
  if (/^\d{1,2}\s?(am|pm)$/.test(normalized)) {
    normalized = normalized.replace(/^(\d{1,2})\s?(am|pm)$/, '$1:00 $2');
  }

  const patterns = ['h:mm a', 'h a', 'h:mma', 'ha', 'H:mm'];
  for (const pattern of patterns) {
    try {
      const dateObj = parse(normalized, pattern, new Date());
      if (!isNaN(dateObj.getTime())) {
        return format(dateObj, 'hh:mm a');
      }
    } catch {}
  }

  const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
  if (!isNaN(dateObj.getTime())) {
    return format(dateObj, 'hh:mm a');
  }

  return time;
};

const KeeperCard: React.FC<KeeperCardProps> = ({ 
  keeperName, 
  childName,
  date, 
  time,
  description,
  stackPosition = 0,
  totalInStack = 1,
  isHovered = false,
  onHover
}) => {
  // Calculate stacking offset - cards stack from right to left to show bookends
  const offset = stackPosition * -50; // Negative offset to stack leftward, showing date bookends
  
  // Get the appropriate image for this keeper
  const image = getKicacoEventPhoto(keeperName || 'keeper');

  return (
    <div 
      className="absolute transition-all duration-300"
      style={{
        transform: `translateX(${isHovered ? 0 : offset}px)`,
        zIndex: isHovered ? 50 : totalInStack - stackPosition,
        right: 0,
        width: '100%',
        maxWidth: '400px',
        height: '240px',
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <div className="relative w-full h-full transition-transform duration-300 hover:scale-[1.01]">
        {/* Background image */}
        <img
          src={image}
          alt={keeperName}
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>

        {/* Side edge glass panel for date when stacked - the "bookend" */}
        {stackPosition > 0 && !isHovered && (
          <div className="absolute inset-y-0 right-0 w-12 bg-black/25 backdrop-blur-sm flex items-center justify-center rounded-r-xl">
            <div className="text-white text-xs font-semibold rotate-90 whitespace-nowrap">
              {formatDate(date)}
            </div>
          </div>
        )}

        {/* Bottom glass panel - same as EventCard */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/25 backdrop-blur-sm px-4 py-3 text-white flex flex-row justify-between items-center rounded-b-xl">
          {/* Left side → Title + child name */}
          <div className="flex flex-col text-sm space-y-1">
            <h3 className="text-base font-semibold flex items-baseline flex-wrap gap-x-1">
              {keeperName}
              {childName && (
                <span className="text-sm font-normal text-gray-300">
                  ({childName})
                </span>
              )}
            </h3>
            {description && <div className="text-xs text-gray-200">{description}</div>}
          </div>

          {/* Right side → Date bold + Time */}
          <div className="flex flex-col items-start text-sm space-y-1 text-gray-100">
            {date && <div className="font-semibold">{formatDate(date)}</div>}
            {time && <div>{formatTime(time)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeeperCard; 