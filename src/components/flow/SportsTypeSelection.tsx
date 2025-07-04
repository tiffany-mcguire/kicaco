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
    <>
      <div className="flex items-end justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 ml-1">Your Family's Sports</h3>
        <button 
          onClick={() => setFlowContext({ ...flowContext, step: 'eventCategory' })} 
          className="text-[#217e8f] text-xs hover:underline"
        >
          ← Event Category
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="space-y-3">
          {getPersonalizedSports().map((button: SmartButton) => 
            <SmartActionButton 
              key={button.id} 
              button={button} 
              onClick={() => handleButtonSelect(button.id)} 
            />
          )}
        </div>
      </div>
      
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-600 ml-1">All Sports</h3>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
        <div className="space-y-3">
          {getAllSportsAlphabetical().map((button: SmartButton) => 
            <SmartActionButton 
              key={button.id} 
              button={button} 
              onClick={() => handleButtonSelect(button.id)} 
            />
          )}
        </div>
      </div>
    </>
  );
}; 