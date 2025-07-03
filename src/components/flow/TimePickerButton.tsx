import React from 'react';

interface Props {
  label: string;
  value: string;
  options: string[];
  isActive: boolean;
  onToggle: () => void;
  onSelect: (option: string) => void;
}

export const TimePickerButton: React.FC<Props> = ({ label, value, options, isActive, onToggle, onSelect }) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="bg-[#217e8f] text-white text-xs font-medium px-2 py-1 rounded-md hover:bg-[#1a6b7a] transition-colors duration-200 min-w-12 text-center"
      >
        {value || label}
      </button>

      {isActive && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-12">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className="block w-full px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md text-left"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 