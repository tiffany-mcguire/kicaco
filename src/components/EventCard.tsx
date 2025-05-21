import React from 'react';

interface EventCardProps {
  image: string;
  name: string;
  date: string;
  time: string;
  location: string;
}

const EventCard: React.FC<EventCardProps> = ({
  image,
  name,
  date,
  time,
  location,
}) => {
  return (
    <div className="flex w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      {/* Image container */}
      <div className="w-32 h-32 flex-shrink-0">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content container */}
      <div className="flex-1 p-4 flex flex-col justify-center">
        <h3 className="text-lg font-bold mb-1">{name}</h3>
        <p className="text-sm text-gray-600 mb-0.5">{date}</p>
        <p className="text-sm text-gray-600 mb-0.5">{time}</p>
        <p className="text-sm text-gray-600">{location}</p>
      </div>
    </div>
  );
};

export default EventCard; 