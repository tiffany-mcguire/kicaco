import React from 'react';

interface ProgressIndicatorProps {
  flowStep: string;
  totalSteps?: number;
  className?: string;
  compact?: boolean;
  isEditMode?: boolean;
}

// Map flow steps to progress numbers based on the user's specification
const getProgressStep = (flowStep: string): number => {
  const stepMap: { [key: string]: number } = {
    // 1/12 - Add Event or Keeper
    'initial': 1,
    
    // 2/12 - Event Category
    'eventCategory': 2,
    'keeperCategory': 2,
    
    // 3/12 - Your Family's Sports/All Sports  
    'sportsType': 3,
    'eventSubtype': 3,
    
    // 4/12 - [Sport] Event Type
    'eventType': 4,
    
    // 5/12 - Child Selection
    'whichChild': 5,
    
    // 6/12 - Date Selection
    'whenDate': 6,
    'monthPart': 6,
    
    // 7/12 - Multi-Event Times
    'repeatingSameTime': 7,
    
    // 8/12 - Time for All Dates/Day-Based Times/Custom Times
    'whenTimePeriod': 8,
    'daySpecificTime': 8,
    'dayBasedTimeGrid': 8,
    'customTimeSelection': 8,
    
    // 9/12 - Multi-Event Locations
    'repeatingSameLocation': 9,
    
    // 10/12 - Location for All Dates/Day-Based/Custom Locations
    'whereLocation': 10,
    'daySpecificLocation': 10,
    'dayBasedLocationSelection': 10,
    'customLocationSelection': 10,
    
    // 11/12 - Notes/Create Event
    'eventNotes': 11,
    
    // 12/12 - Confirmation
    'confirmation': 12
  };
  
  return stepMap[flowStep] || 1;
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  flowStep,
  totalSteps = 12,
  className = '',
  isEditMode = false
}) => {
  const currentStep = getProgressStep(flowStep);
  
  return (
    <div className={`${className}`}>
      {/* Modern vertical bar progress indicator with step count */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {isEditMode ? 'Edit' : `${currentStep}/${totalSteps}`}
        </span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: totalSteps }, (_, index) => {
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