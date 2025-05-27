import React from 'react';
import { format, parse } from 'date-fns';

interface EventCardProps {
  image: string;
  name: string;
  date?: string;
  time?: string;
  location?: string;
}

const formatDate = (date?: string) => {
  if (!date) return '';
  // Try to parse ISO or fallback to original
  try {
    const d = parse(date, 'yyyy-MM-dd', new Date());
    if (!isNaN(d.getTime())) {
      return format(d, 'MM/dd/yyyy');
    }
  } catch {}
  return date;
};

const EventCard: React.FC<EventCardProps> = ({
  image,
  name,
  date,
  time,
  location,
}) => {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 flex items-center p-3 mb-4 transition hover:shadow-2xl" style={{ marginLeft: '16px' }}>
      {/* Image */}
      <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border border-gray-200 mr-4 bg-gray-100">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <h3 className="text-base font-bold text-gray-900 truncate mb-0.5">{name}</h3>
        {date && <div className="text-sm text-gray-600 mb-0.5 truncate">Date: {formatDate(date)}</div>}
        {time && <div className="text-sm text-gray-600 mb-0.5 truncate">Time: {time}</div>}
        {location && <div className="text-sm text-gray-600 truncate">Location: {location}</div>}
      </div>
    </div>
  );
};

export default EventCard;

// Responsive styles for small screens
const style = document.createElement('style');
style.innerHTML = `
@media (max-width: 400px) {
  .w-full.max-w-md.bg-white.rounded-2xl.shadow-xl.border.border-gray-200.flex.items-center.p-3.mb-4.transition.hover\:shadow-2xl {
    flex-direction: column;
    align-items: flex-start;
    padding: 8px !important;
  }
  .w-14.h-14.flex-shrink-0.rounded-full.overflow-hidden.border.border-gray-200.mr-4.bg-gray-100 {
    margin-right: 0 !important;
    margin-bottom: 8px;
  }
  .flex-1.flex.flex-col.justify-center.min-w-0 {
    width: 100%;
  }
}
@media (max-width: 400px) {
  .profiles-roles-subheader {
    flex-direction: column !important;
    align-items: flex-start !important;
    padding: 8px 4px !important;
    font-size: 14px !important;
  }
}
`;
document.head.appendChild(style); 