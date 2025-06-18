import React from 'react';
import { format, parse } from 'date-fns';
import { useKicacoStore } from '../store/kicacoStore';

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
  carouselControls?: React.ReactNode;
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
  carouselControls
}) => {
  const children = useKicacoStore(state => state.children);
  const childProfile = childName ? children.find(c => c.name === childName) : null;
  const childIndex = childName ? children.findIndex(c => c.name === childName) : -1;
  const childColor = childProfile?.color || (childIndex >= 0 ? childColors[childIndex % childColors.length] : null);

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
      if (childName && (name.toLowerCase() === 'birthday party' || name.toLowerCase() === 'birthday')) {
        const possessiveName = childName.endsWith('s') ? `${childName}'` : `${childName}'s`;
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
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                {childName && childColor && (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-gray-700 text-[10px] font-semibold ring-1 ring-gray-400 flex-shrink-0"
                    style={{ backgroundColor: childColor }}
                  >
                    {childName.charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="text-sm font-semibold">
                  {displayName}
                </h3>
                {carouselControls}
              </div>
              {location && (
                <span className="text-xs text-gray-200 mt-0.5" style={{ marginLeft: childName && childColor ? '22px' : '0' }}>{location}</span>
              )}
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
    </div>
  );
};

export default EventCard;