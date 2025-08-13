import React from 'react';
import { sportsFlowProgressMap, getTotalStepsFromProgressMap } from '../../constants/flowProgress';

interface ProgressIndicatorProps {
  flowStep: string;
  totalSteps?: number;
  className?: string;
  compact?: boolean;
  isEditMode?: boolean;
}

// Source of truth for progress steps, defaulting to sports flow for now
const getProgressStep = (flowStep: string): number => {
  return sportsFlowProgressMap[flowStep] || 1;
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  flowStep,
  totalSteps = 12,
  className = '',
  isEditMode = false
}) => {
  const currentStep = getProgressStep(flowStep);
  const resolvedTotalSteps = totalSteps ?? getTotalStepsFromProgressMap(sportsFlowProgressMap);
  
  return (
    <div className={`${className}`}>
      {/* Modern vertical bar progress indicator with step count */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {isEditMode ? 'Edit' : `${currentStep}/${resolvedTotalSteps}`}
        </span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: resolvedTotalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = isEditMode ? true : stepNumber <= currentStep;
            
            // Calculate which color to use (4 bars per color for 12 total bars)
            let color;
            if (stepNumber <= 4) {
              color = '#2f8fa4';  // First 4 bars - primary teal
            } else if (stepNumber <= 8) {
              color = '#5fb3c7';  // Next 4 bars - medium teal
            } else {
              color = '#c0e2e7';  // Last 4 bars - light blue
            }
            
            return (
              <div
                key={stepNumber}
                className={`
                  h-6 transition-all duration-300 ease-out
                  ${isCompleted ? 'w-2' : 'w-1.5'}
                `}
                style={{
                  backgroundColor: isCompleted ? color : '#e5e7eb',  // Inactive - light gray
                  opacity: isCompleted ? 1 : 0.3,
                  borderRadius: '2px',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 