import React from 'react';
import { SmartButton } from '../../hooks/useKicacoFlow';

interface Props {
  button: SmartButton;
  onClick: () => void;
}

export const LocationButton: React.FC<Props> = ({ button, onClick }) => (
  <div className="location-button flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
    <button
      onClick={onClick}
      className="location-button__select-btn bg-[#217e8f] text-white text-xs px-2 py-1 rounded-md hover:bg-[#1a6b7a] transition-colors duration-200 flex-shrink-0"
    >
      Select
    </button>
    <div className="location-button__content flex-1">
      <div className="location-button__label text-sm font-medium text-gray-900">{button.label}</div>
      {button.description && (
        <div className="location-button__description text-xs text-gray-500 mt-1">{button.description}</div>
      )}
    </div>
  </div>
); 