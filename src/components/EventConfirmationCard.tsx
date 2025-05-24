import React from 'react';
import { useKicacoStore } from '../store/kicacoStore';
import { getImageForCategory } from '../utils/getImageForCategory';

type Props = {
  onConfirm: () => void;
  onCancel?: () => void;
};

const EventConfirmationCard: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const { eventInProgress } = useKicacoStore();

  if (!eventInProgress) return null;

  const imageUrl = getImageForCategory(eventInProgress.imageCategory || 'default');

  const {
    childName,
    eventName,
    date,
    time,
    location,
    isAllDay,
    noTimeYet,
  } = eventInProgress;

  const formattedDate = new Date(date || '').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-2xl bg-white shadow-xl p-4 border border-gray-200 max-w-md mx-auto mt-6">
      <img
        src={imageUrl}
        alt="Event"
        className="w-full h-40 object-cover rounded-xl mb-4"
      />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Here's what I've got:</h2>
      <ul className="text-sm text-gray-700 space-y-1 mb-4">
        {childName && <li><strong>Child's Name:</strong> {childName}</li>}
        {eventName && <li><strong>Event:</strong> {eventName}</li>}
        {date && <li><strong>Date:</strong> {formattedDate}</li>}
        {time && !noTimeYet && <li><strong>Time:</strong> {time}</li>}
        {isAllDay && <li><strong>Time:</strong> All day</li>}
        {noTimeYet && !time && !isAllDay && <li><strong>Time:</strong> TBD</li>}
        {location && <li><strong>Location:</strong> {location}</li>}
      </ul>
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:underline"
          >
            Not quite
          </button>
        )}
        <button
          onClick={onConfirm}
          className="bg-fuchsia-700 text-white rounded-xl px-4 py-2 text-sm hover:bg-fuchsia-800 transition"
        >
          Yes, save it
        </button>
      </div>
    </div>
  );
};

export default EventConfirmationCard; 