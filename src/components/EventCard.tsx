import React from 'react';

interface EventCardProps {
  image: string;
  name: string;
  date?: string;
  time?: string;
  location?: string;
}

const EventCard: React.FC<EventCardProps> = ({
  image,
  name,
  date,
  time,
  location,
}) => {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 flex items-center p-3 mb-4 transition hover:shadow-2xl">
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
        {date && <div className="text-sm text-gray-600 mb-0.5 truncate">Date: {date}</div>}
        {time && <div className="text-sm text-gray-600 mb-0.5 truncate">Time: {time}</div>}
        {location && <div className="text-sm text-gray-600 truncate">Location: {location}</div>}
      </div>
    </div>
  );
};

export default EventCard; 