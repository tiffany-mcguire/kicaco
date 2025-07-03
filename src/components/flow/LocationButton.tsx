import React from 'react';
import { SmartButton } from '../../hooks/useKicacoFlow';

interface Props {
  button: SmartButton;
  onClick: () => void;
}

export const LocationButton: React.FC<Props> = ({ button, onClick }) => (
  <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
    <button
      onClick={onClick}
      className="bg-[#217e8f] text-white text-xs px-2 py-1 rounded-md hover:bg-[#1a6b7a] transition-colors duration-200 flex-shrink-0"
    >
      Select
    </button>
    <div className="flex-1">
      <div className="text-sm font-medium text-gray-900">{button.label}</div>
      {button.description && (
        <div className="text-xs text-gray-500 mt-1">{button.description}</div>
      )}
    </div>
  </div>
); 