import React from 'react';
import { format, parse } from 'date-fns';

interface EventCardProps {
  image: string;
  name: string;
  childName?: string;
  date?: string;
  time?: string;
  location?: string;
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
}) => {
  return (
    <div
      className="relative w-full transition-transform duration-300 hover:scale-[1.01] min-h-[240px]"
    >
      {/* Background image */}
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

      {/* Glass panel pinned to lower third */}
      <div
        className="
          absolute inset-x-0 bottom-0
          h-1/3
          bg-black/25 backdrop-blur-sm
          px-4 py-3
          text-white
          flex flex-row justify-between items-center
        "
      >
        {/* Left side → Title + child name + Location */}
        <div className="flex flex-col text-sm space-y-1">
          <h3 className="text-base font-semibold flex items-baseline flex-wrap gap-x-1">
            {name}
            {childName && (
              <span className="text-sm font-normal text-gray-300">
                ({childName})
              </span>
            )}
          </h3>
          {location && <div>{location}</div>}
        </div>

        {/* Right side → Date bold + Time */}
        <div className="flex flex-col items-start text-sm space-y-1 text-gray-100">
          {date && <div className="font-semibold">{formatDate(date)}</div>}
          {time && <div>{formatTime(time)}</div>}
        </div>
      </div>
    </div>
  );
};

export default EventCard;