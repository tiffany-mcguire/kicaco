import React from 'react';
import { SmartActionButton } from './SmartActionButton';
import { SmartButton, FlowContext } from '../../hooks/useKicacoFlow';

interface Props {
  flowContext: FlowContext;
  setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>;
  getPersonalizedSports: () => SmartButton[];
  getAllSportsAlphabetical: () => SmartButton[];
  handleButtonSelect: (buttonId: string) => void;
}

export const SportsTypeSelection: React.FC<Props> = ({ 
  flowContext, 
  setFlowContext, 
  getPersonalizedSports, 
  getAllSportsAlphabetical, 
  handleButtonSelect 
}) => {
  return (
    <div className="sports-type-selection">
      <div className="sports-type-selection__family-header flex items-end justify-between mb-2">
        <h3 className="sports-type-selection__family-title text-sm font-medium text-gray-600 ml-1">Your Family's Sports</h3>
        <button 
          onClick={() => setFlowContext({ ...flowContext, step: 'eventCategory' })} 
          className="sports-type-selection__back-btn text-[#217e8f] text-[13px]"
        >
          ← Event Category
        </button>
      </div>
      <div className="sports-type-selection__family-section bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="sports-type-selection__family-list space-y-3">
          {getPersonalizedSports().map((button: SmartButton) => 
            <div key={button.id} className="flex items-end justify-between">
              {button.description && (
                <div className="text-xs text-gray-500 flex-1 pr-3">{button.description}</div>
              )}
              <div className="flex-shrink-0">
                <SmartActionButton 
                  button={{ id: button.id, label: button.label }} 
                  onClick={() => handleButtonSelect(button.id)} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="sports-type-selection__all-header mb-2">
        <h3 className="sports-type-selection__all-title text-sm font-medium text-gray-600 ml-1">All Sports</h3>
      </div>
      <div className="sports-type-selection__all-section bg-white rounded-lg shadow-sm p-4 mb-8">
        <div className="sports-type-selection__all-list space-y-3">
          {getAllSportsAlphabetical().map((button: SmartButton) => 
            <div key={button.id} className="flex items-end justify-between">
              {button.description && (
                <div className="text-xs text-gray-500 flex-1 pr-3">{button.description}</div>
              )}
              <div className="flex-shrink-0">
                <SmartActionButton 
                  button={{ id: button.id, label: button.label }} 
                  onClick={() => handleButtonSelect(button.id)} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 