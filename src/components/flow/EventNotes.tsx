import React from 'react';
import { SmartButton } from '../../hooks/useKicacoFlow';

interface Props {
  eventNotes: string;
  setEventNotes: (notes: string) => void;
  currentButtons: SmartButton[];
  handleButtonSelect: (buttonId: string) => void;
}

export const EventNotes: React.FC<Props> = ({
  eventNotes,
  setEventNotes,
  currentButtons,
  handleButtonSelect
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
      <textarea 
        value={eventNotes} 
        onChange={(e) => setEventNotes(e.target.value)} 
        placeholder="Add any notes..." 
        className="w-full p-3 border border-gray-200 rounded-md" 
        rows={3} 
      />
      <div className="mt-4">
        {currentButtons.map((button: SmartButton) => (
          <div key={button.id} className="flex items-center gap-3">
            <button 
              onClick={() => handleButtonSelect(button.id)} 
              className="bg-[#217e8f] text-white text-xs px-2 py-1 rounded-md"
            >
              {button.label}
            </button>
            {button.description && (
              <span className="text-sm text-gray-500">{button.description}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 