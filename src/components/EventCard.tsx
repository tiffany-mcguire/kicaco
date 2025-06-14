import React from 'react';
import { format, parse } from 'date-fns';

interface EventCardProps {
  image: string;
  name: string;
  childName?: string;
  date?: string;
  time?: string;
  location?: string;
  notes?: string;
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

// Rainbow colors fallback
const childColors = [
  '#f8b6c2', // Pink
  '#fbd3a2', // Orange (updated from #ffd8b5)
  '#fde68a', // Yellow
  '#bbf7d0', // Green
  '#c0e2e7', // Blue
  '#d1d5fa', // Indigo
  '#e9d5ff', // Purple
];

const EventCard: React.FC<EventCardProps> = ({
  image,
  name,
  childName,
  date,
  time,
  location,
  notes
}) => {
  return (
    <div className="relative w-full transition-transform duration-300 hover:scale-[1.01] min-h-[240px] rounded-xl overflow-hidden text-white">
      {/* Background image */}
      <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      
      {/* A single overlay for the entire card */}
      <div className="absolute inset-0 bg-black/[.65]" />
      
      {/* Info Panel now pinned to the top */}
      <div className="absolute inset-x-0 top-0 p-4 flex flex-col pt-16">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-semibold flex-1 pr-4">
            {name}
            {childName && <span className="text-xs font-normal text-gray-200 ml-1">({childName})</span>}
          </h3>
          <div className="text-sm text-right font-semibold">
            {formatDate(date)}
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-300 mt-1">
          <div>{location}</div>
          <div>{formatTime(time)}</div>
        </div>

        {notes && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <h4 className="text-xs font-bold mb-1 text-gray-300">Notes</h4>
            <p className="text-xs text-gray-200">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;