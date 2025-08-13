import React, { useState } from 'react';
import { SmartActionButton } from './SmartActionButton';
import { SmartButton, FlowContext } from '../../hooks/useKicacoFlow';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
  const [isAllSportsExpanded, setIsAllSportsExpanded] = useState(false);

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
      
      {!isAllSportsExpanded && (
        <div className="sports-type-selection__all-header mb-2">
          <h3 className="sports-type-selection__all-title text-sm font-medium text-gray-600 ml-1">All Sports</h3>
        </div>
      )}
      
      {isAllSportsExpanded ? (
        <>
          <div className="sports-type-selection__all-header flex items-end justify-between mb-2">
            <h3 className="sports-type-selection__all-title text-sm font-medium text-gray-600 ml-1">All Sports</h3>
            <button 
              onClick={() => setIsAllSportsExpanded(false)}
              className="sports-type-selection__back-btn text-[#217e8f] text-[13px]"
            >
              ← Collapse
            </button>
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
        </>
      ) : (
        <div className="sports-type-selection__all-collapsed bg-white rounded-lg shadow-sm p-4 mb-8">
          <button 
            onClick={() => setIsAllSportsExpanded(true)}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-md p-2 -m-2"
          >
            <div className="flex items-center gap-2">
              <ChevronRight size={16} className="text-[#217e8f]" />
              <span className="text-sm text-[#217e8f]">Expand for more sports options</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}; 