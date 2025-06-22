import React from 'react';
import { format, parse } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { StackedChildBadges } from '../common';

interface EventCardProps {
  image: string;
  name: string;
  childName?: string;
  date?: string;
  time?: string;
  location?: string;
  notes?: string;
  noHeaderSpace?: boolean;
  showEventInfo?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  carouselControls?: React.ReactNode;
  carouselSwipeHandler?: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

const formatDate = (date?: string) => {
  if (!date) return '';
  try {
    const d = parse(date, 'yyyy-MM-dd', new Date());
    if (!isNaN(d.getTime())) {
      return format(d, 'EEEE, MMMM d');
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



// Day colors for accent line (same as upcoming events)
const dayColors: { [key: number]: string } = {
  0: '#f8b6c2', 1: '#ffd8b5', 2: '#fde68a', 3: '#bbf7d0',
  4: '#c0e2e7', 5: '#d1d5fa', 6: '#e9d5ff',
};

const EventCard: React.FC<EventCardProps> = ({
  image,
  name,
  childName,
  date,
  time,
  location,
  notes,
  noHeaderSpace = false,
  showEventInfo = false,
  onEdit,
  onDelete,
  carouselControls,
  carouselSwipeHandler
}) => {
  // Parse multiple children from comma-separated string
  const childNames = childName ? childName.split(',').map(name => name.trim()).filter(name => name) : [];

  // Get day of week for color coding
  const dayOfWeek = date ? parse(date, 'yyyy-MM-dd', new Date()).getDay() : 0;
  const accentColor = dayColors[dayOfWeek];

  // Transform birthday party names to possessive form
  const displayName = (() => {
    if (name.toLowerCase().includes('birthday')) {
      // Check if there's a name in parentheses (e.g., "Birthday Party (Sarah)")
      const parenthesesMatch = name.match(/\(([^)]+)\)/);
      if (parenthesesMatch) {
        const birthdayChild = parenthesesMatch[1];
        const possessiveName = birthdayChild.endsWith('s') ? `${birthdayChild}'` : `${birthdayChild}'s`;
        
        // Remove the parentheses part and create the new name
        const baseEventName = name.replace(/\s*\([^)]+\)/, '').trim();
        
        // If it's just "Birthday Party" or "Birthday", format it nicely
        if (baseEventName.toLowerCase() === 'birthday party' || baseEventName.toLowerCase() === 'birthday') {
          return `${possessiveName} Birthday Party`;
        }
        
        // Otherwise prepend the possessive name
        return `${possessiveName} ${baseEventName}`;
      }
      
      // If no parentheses but we have a childName and it's their birthday, use possessive form
      if (childNames.length === 1 && (name.toLowerCase() === 'birthday party' || name.toLowerCase() === 'birthday')) {
        const possessiveName = childNames[0].endsWith('s') ? `${childNames[0]}'` : `${childNames[0]}'s`;
        return `${possessiveName} Birthday Party`;
      }
    }
    return name;
  })();

  return (
    <div className="relative w-full min-h-[240px] rounded-xl overflow-hidden text-white">
      {/* Background image */}
      <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      
      {/* A single overlay for the entire card */}
      <div className="absolute inset-0 bg-black/[.65]" />
      
      {/* Info Panel */}
      {showEventInfo ? (
        /* Full event info for pages like Home that need it */
        <div className={`absolute inset-x-0 top-0 p-4 flex flex-col ${
          noHeaderSpace ? 'pt-16' : 'pt-16'
        }`}>
          <div>
            <div className="flex justify-between items-start mb-3">
              <div 
                className="flex flex-col flex-1"
                {...(carouselSwipeHandler && carouselControls ? carouselSwipeHandler : {})}
              >
                <div className="flex items-center gap-1.5">
                  <StackedChildBadges childName={childName} size="md" maxVisible={3} />
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold">
                      {displayName}
                    </h3>
                    {location && (
                      <span className="text-xs text-gray-200 mt-0.5">{location}</span>
                    )}
                  </div>
                  {carouselControls}
                </div>
              </div>
              <div className="flex flex-col items-end">
                {date && (
                  <div className="text-sm font-medium text-white">
                    {formatDate(date)}
                  </div>
                )}
                {time && (
                  <div className="text-xs text-gray-300 mt-0.5">
                    {formatTime(time)}
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div 
                className="absolute left-0 right-0 h-[1.5px] mb-3 opacity-60"
                style={{ 
                  background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
                }}
              />
              <div className="pt-4">
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
                {notes ? (
                  <p className="text-xs text-gray-200">{notes}</p>
                ) : (
                  <p className="text-xs italic text-gray-400">—</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Just notes section for pages with their own tab overlay like UpcomingEvents */
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
          {notes ? (
            <p className="text-xs text-gray-200">{notes}</p>
          ) : (
            <p className="text-xs italic text-gray-400">—</p>
          )}
        </div>
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
  );
};

export default EventCard;