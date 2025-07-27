import React from 'react';

interface ProgressIndicatorProps {
  flowStep: string;
  totalSteps?: number;
  className?: string;
  compact?: boolean;
}

// Map flow steps to progress numbers based on the user's specification
const getProgressStep = (flowStep: string): number => {
  const stepMap: { [key: string]: number } = {
    // 1/11 - Add Event or Keeper
    'initial': 1,
    
    // 2/11 - Event Category
    'eventCategory': 2,
    'keeperCategory': 2,
    
    // 3/11 - Your Family's Sports/All Sports  
    'sportsType': 3,
    'eventSubtype': 3,
    
    // 4/11 - [Sport] Event Type
    'eventType': 4,
    
    // 5/11 - Child Selection
    'whichChild': 5,
    
    // 6/11 - Date Selection
    'whenDate': 6,
    'monthPart': 6,
    
    // 7/11 - Multi-Event Times
    'repeatingSameTime': 7,
    
    // 8/11 - Time for All Dates/Day-Based Times/Custom Times
    'whenTimePeriod': 8,
    'daySpecificTime': 8,
    'dayBasedTimeGrid': 8,
    'customTimeSelection': 8,
    
    // 9/11 - Multi-Event Locations
    'repeatingSameLocation': 9,
    
    // 10/11 - Location for All Dates/Day-Based/Custom Locations
    'whereLocation': 10,
    'daySpecificLocation': 10,
    'dayBasedLocationSelection': 10,
    'customLocationSelection': 10,
    
    // 11/11 - Notes/Create Event
    'eventNotes': 11
  };
  
  return stepMap[flowStep] || 1;
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  flowStep,
  totalSteps = 11,
  className = ''
}) => {
  const currentStep = getProgressStep(flowStep);
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className={`${className}`}>
            {/* Modern stepping stones progress */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 whitespace-nowrap">{currentStep}/{totalSteps}</span>
        <div className="flex items-end">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber <= currentStep;
            const isCurrent = stepNumber === currentStep;
            const isNext = stepNumber === currentStep + 1;
            
            return (
              <React.Fragment key={stepNumber}>
                <div
                  className={`
                    relative transition-all duration-500 ease-out
                    ${isCompleted || isCurrent
                      ? 'w-3 h-1.5 rounded-full' 
                      : 'w-2 h-1 rounded-full'
                    }
                  `}
                  style={{
                    background: isCompleted || isCurrent
                      ? `linear-gradient(45deg, #2f8fa4 0%, #5fb3c7 50%, #c0e2e7 100%)`
                      : isNext 
                        ? 'linear-gradient(45deg, #d1d5db 0%, #e5e7eb 100%)'
                        : '#f3f4f6',
                    boxShadow: (isCompleted || isCurrent)
                      ? '0 2px 4px rgba(47, 143, 164, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                      : 'none',

                  }}
                >
                  {/* Cute sparkle effect for current step */}
                  {isCurrent && (
                    <div 
                      className="absolute -top-1 -right-0.5 w-1 h-1 bg-white rounded-full opacity-60 animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                  )}
                </div>
                {/* Connecting line between steps */}
                {stepNumber < totalSteps && (
                  <div 
                    className="w-1 h-px transition-all duration-300"
                    style={{
                      background: isCompleted 
                        ? 'linear-gradient(90deg, #c0e2e7 0%, #e5e7eb 100%)'
                        : '#f3f4f6'
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 