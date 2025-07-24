import React from 'react';
import { EventCard } from '../calendar';
import { StackedChildBadges } from '../common';
import { getKicacoEventPhoto } from '../../utils/getKicacoEventPhoto';
import { SmartActionButton } from './SmartActionButton';
import { ChevronLeft, ChevronRight, Share2, Calendar, Waves } from 'lucide-react';
import { format, parse } from 'date-fns';

interface ConfirmationScreenProps {
  createdEvents: any[];
  currentEventIndex: number;
  setCurrentEventIndex: React.Dispatch<React.SetStateAction<number>>;
  currentButtons: any[];
  handleButtonSelect: (buttonId: string) => void;
  getChildColor: (childId: string) => string;
  flowContext: any;
  setFlowContext: React.Dispatch<React.SetStateAction<any>>;
}

export default function ConfirmationScreen({
  createdEvents,
  currentEventIndex,
  setCurrentEventIndex,
  currentButtons,
  handleButtonSelect,
  getChildColor,
  flowContext,
  setFlowContext
}: ConfirmationScreenProps) {
  if (!createdEvents || createdEvents.length === 0) {
    return null;
  }

  const currentEvent = createdEvents[currentEventIndex];

  const navigateToStep = (step: string) => {
    const newContext = { ...flowContext };
    newContext.step = step;
    newContext.isEditMode = true; // Flag to indicate we're in edit mode
    setFlowContext(newContext);
  };

  return (
    <div className="kicaco-flow__step-container">
      {/* Confirmation Modal Container (embedded) */}
      <div className="kicaco-flow__confirmation-modal">
        <div className="kicaco-flow__confirmation-header">
          <div className="kicaco-flow__confirmation-header-content">
            <span className="kicaco-flow__confirmation-title">
              Added: {createdEvents.length} {createdEvents.length === 1 ? "event" : "events"}
            </span>
            {createdEvents.length > 1 && (
              <div className="kicaco-flow__confirmation-navigation">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setCurrentEventIndex((prev) => (prev - 1 + createdEvents.length) % createdEvents.length); 
                  }} 
                  className="kicaco-flow__confirmation-nav-btn kicaco-flow__confirmation-nav-btn--prev"
                >
                  <ChevronLeft size={12} />
                </button>
                <span className="kicaco-flow__confirmation-nav-counter">
                  {currentEventIndex + 1}/{createdEvents.length}
                </span>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setCurrentEventIndex((prev) => (prev + 1) % createdEvents.length); 
                  }} 
                  className="kicaco-flow__confirmation-nav-btn kicaco-flow__confirmation-nav-btn--next"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="kicaco-flow__confirmation-content">
          <div className="kicaco-flow__confirmation-content-bg"></div>
          <div className="kicaco-flow__confirmation-event-container">
            <EventCard
              image={getKicacoEventPhoto(currentEvent?.eventName || 'default')}
              name={currentEvent?.eventName || 'Event'}
              childName={currentEvent?.childName}
              date={currentEvent?.date}
              time={currentEvent?.time}
              location={currentEvent?.location}
              notes={currentEvent?.notes}
              contactName={currentEvent?.contactName}
              phoneNumber={currentEvent?.phoneNumber}
              email={currentEvent?.email}
              websiteUrl={currentEvent?.websiteUrl}
              showEventInfo={false}
            />
            <div className="kicaco-flow__confirmation-event-overlay">
              <div className="kicaco-flow__confirmation-event-header">
                <div className="kicaco-flow__confirmation-event-info">
                  <StackedChildBadges 
                    childName={currentEvent?.childName} 
                    size="md" 
                    maxVisible={3}
                    className="kicaco-flow__confirmation-child-badges"
                  />
                  <div className="kicaco-flow__confirmation-event-details">
                    <div className="kicaco-flow__confirmation-event-name-container">
                      <span className="kicaco-flow__confirmation-event-name">
                        {currentEvent?.eventName?.split(' ').map((word: string) => 
                          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        ).join(' ') || 'Event'}
                      </span>
                      {currentEvent?.location && (
                        <span className="kicaco-flow__confirmation-event-location">
                          {currentEvent.location.split('-').map((word: string) => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          ).join(' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="kicaco-flow__confirmation-event-meta">
                  <span className="kicaco-flow__confirmation-event-date">
                    {currentEvent?.date && 
                      format(parse(currentEvent.date, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d')}
                  </span>
                  {currentEvent?.time && (
                    <span className="kicaco-flow__confirmation-event-time">
                      {(() => {
                        const time = currentEvent.time;
                        const match = time.match(/(\d{1,4}):?(\d{2})?\s*(am|pm)/i);
                        if (match) {
                          let [, timeDigits, explicitMinutes, period] = match;
                          let hours, minutes;
                          
                          if (explicitMinutes) {
                            hours = timeDigits;
                            minutes = explicitMinutes;
                          } else if (timeDigits.length <= 2) {
                            hours = timeDigits;
                            minutes = '00';
                          } else {
                            hours = timeDigits.slice(0, -2);
                            minutes = timeDigits.slice(-2);
                          }
                          
                          const formattedHours = hours.padStart(2, '0');
                          const formattedMinutes = minutes.padStart(2, '0');
                          return `${formattedHours}:${formattedMinutes} ${period.toUpperCase()}`;
                        }
                        return time;
                      })()}
                    </span>
                  )}
                </div>
              </div>
              <div 
                className="kicaco-flow__confirmation-event-divider"
                style={{ 
                  background: `linear-gradient(90deg, transparent, ${currentEvent?.date ? 
                    (['#e9d5ff', '#f8b6c2', '#ffd8b5', '#fde68a', '#bbf7d0', '#c0e2e7', '#d1d5fa'][parse(currentEvent.date, 'yyyy-MM-dd', new Date()).getDay()]) : 
                    '#c0e2e7'}, transparent)`
                }}
              />
            </div>
          </div>
        </div>
              </div>

        {/* Edit Navigation */}
        <div className="flex items-center justify-between mt-6 text-sm">
          <span className="text-gray-700 font-medium">Edit:</span>
          <button 
            className="text-[#c4828d] hover:text-white transition-colors font-medium"
            onClick={() => navigateToStep('whichChild')}
          >
            Child
          </button>
          <span className="text-gray-400">|</span>
          <button 
            className="text-[#c4828d] hover:text-white transition-colors font-medium"
            onClick={() => {
              // Navigate to appropriate date step based on current selection
              if (flowContext.eventPreview.selectedMonth) {
                navigateToStep('monthPart');
              } else {
                navigateToStep('whenDate');
              }
            }}
          >
            Date
          </button>
          <span className="text-gray-400">|</span>
          <button 
            className="text-[#c4828d] hover:text-white transition-colors font-medium"
            onClick={() => {
              // Navigate to appropriate time step based on current pattern
              const timePattern = flowContext.eventPreview.currentTimePattern;
              if (timePattern === 'dayBased') {
                navigateToStep('dayBasedTimeGrid');
              } else if (timePattern === 'custom') {
                navigateToStep('customTimeSelection');
              } else {
                navigateToStep('whenTimePeriod');
              }
            }}
          >
            Time
          </button>
          <span className="text-gray-400">|</span>
          <button 
            className="text-[#c4828d] hover:text-white transition-colors font-medium"
            onClick={() => {
              // Navigate to appropriate location step based on current pattern
              const locationPattern = flowContext.eventPreview.currentLocationPattern;
              if (locationPattern === 'dayBased') {
                navigateToStep('dayBasedLocationSelection');
              } else if (locationPattern === 'custom') {
                navigateToStep('customLocationSelection');
              } else {
                navigateToStep('whereLocation');
              }
            }}
          >
            Location
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-6">
        <SmartActionButton
          button={{ 
            id: 'share-event', 
            label: (
              <span className="flex items-center gap-1.5">
                <Share2 size={14} />
                Share Event
              </span>
            ) as any
          }}
          onClick={() => {}}
          isChildButton={false}
          getChildColor={getChildColor}
        />
        <SmartActionButton
          button={{ 
            id: 'export-event', 
            label: (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                Export Event
              </span>
            ) as any
          }}
          onClick={() => {}}
          isChildButton={false}
          getChildColor={getChildColor}
        />
        <SmartActionButton
          button={{ 
            id: 'create-new', 
            label: (
              <span className="flex items-center gap-1.5">
                <Waves size={16} strokeWidth={1.5} className="text-white" />
                Create New
              </span>
            ) as any
          }}
          onClick={() => {}}
          isChildButton={false}
          getChildColor={getChildColor}
        />
      </div>

    </div>
  );
} 