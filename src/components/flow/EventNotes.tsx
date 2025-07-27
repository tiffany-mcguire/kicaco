import React, { useState } from 'react';
import { SmartButton, FlowContext } from '../../hooks/useKicacoFlow';
import { SmartActionButton } from './SmartActionButton';
import ProgressIndicator from './ProgressIndicator';

interface Props {
  eventNotes: string;
  setEventNotes: (notes: string) => void;
  currentButtons: SmartButton[];
  handleButtonSelect: (buttonId: string) => void;
  contactFields?: {
    contactName: string;
    phoneNumber: string;
    email: string;
    websiteUrl: string;
  };
  setContactFields?: (fields: {
    contactName: string;
    phoneNumber: string;
    email: string;
    websiteUrl: string;
  }) => void;
  flowContext?: FlowContext;
  setFlowContext?: React.Dispatch<React.SetStateAction<FlowContext>>;
  createdEvents?: any[];
  setCreatedEvents?: React.Dispatch<React.SetStateAction<any[]>>;
  setCurrentEventIndex?: React.Dispatch<React.SetStateAction<number>>;
}

export const EventNotes: React.FC<Props> = ({
  eventNotes,
  setEventNotes,
  currentButtons,
  handleButtonSelect,
  contactFields,
  setContactFields,
  flowContext,
  setFlowContext,
  createdEvents,
  setCreatedEvents,
  setCurrentEventIndex
}) => {
  const [websiteUrl, setWebsiteUrl] = useState(contactFields?.websiteUrl || '');
  const [contactName, setContactName] = useState(contactFields?.contactName || '');
  const [phoneNumber, setPhoneNumber] = useState(contactFields?.phoneNumber || '');
  const [email, setEmail] = useState(contactFields?.email || '');

  // When in edit mode, ensure notes and contact fields are populated from the flowContext
  React.useEffect(() => {
    if (flowContext?.isEditMode) {
      if (flowContext.eventPreview?.notes !== undefined) {
        setEventNotes(flowContext.eventPreview.notes);
      }
      if (flowContext.eventPreview?.contactName !== undefined) {
        setContactName(flowContext.eventPreview.contactName);
        updateContactFields('contactName', flowContext.eventPreview.contactName);
      }
      if (flowContext.eventPreview?.phoneNumber !== undefined) {
        setPhoneNumber(flowContext.eventPreview.phoneNumber);
        updateContactFields('phoneNumber', flowContext.eventPreview.phoneNumber);
      }
      if (flowContext.eventPreview?.email !== undefined) {
        setEmail(flowContext.eventPreview.email);
        updateContactFields('email', flowContext.eventPreview.email);
      }
      if (flowContext.eventPreview?.websiteUrl !== undefined) {
        setWebsiteUrl(flowContext.eventPreview.websiteUrl);
        updateContactFields('websiteUrl', flowContext.eventPreview.websiteUrl);
      }
    }
  }, [flowContext?.isEditMode]);

  const updateContactFields = (field: string, value: string) => {
    const newFields = {
      contactName,
      phoneNumber,
      email,
      websiteUrl,
      [field]: value
    };
    setContactFields?.(newFields);
  };

  return (
    <>
      <div className="event-notes bg-white rounded-lg shadow-sm p-4 mb-8">
      <div className="border border-gray-200 rounded-md p-4 space-y-3 focus-within:ring-2 focus-within:ring-[#c0e2e7] focus-within:border-[#c0e2e7] transition-all">
        {/* Main Notes */}
        <div>
          <textarea 
            value={eventNotes} 
            onChange={(e) => setEventNotes(e.target.value)} 
            placeholder="Add any notes about this event..."
            className="w-full border-none outline-none resize-none text-gray-900 placeholder-gray-400" 
            rows={3} 
          />
        </div>

        {/* Embedded Structured Fields */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {/* Contact Name */}
          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-20 flex-shrink-0">Contact:</span>
            <input
              type="text"
              value={contactName}
              onChange={(e) => {
                setContactName(e.target.value);
                updateContactFields('contactName', e.target.value);
              }}
              placeholder="Contact name..."
              className="flex-1 border-none outline-none text-sm text-gray-600 placeholder-gray-300 bg-transparent"
            />
          </div>

          {/* Phone Number */}
          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-20 flex-shrink-0">Phone:</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                updateContactFields('phoneNumber', e.target.value);
              }}
              placeholder="Phone number..."
              className="flex-1 border-none outline-none text-sm text-gray-600 placeholder-gray-300 bg-transparent"
            />
          </div>

          {/* Email */}
          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-20 flex-shrink-0">Email:</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                updateContactFields('email', e.target.value);
              }}
              placeholder="email@example.com"
              className="flex-1 border-none outline-none text-sm text-gray-600 placeholder-gray-300 bg-transparent"
            />
          </div>

          {/* Website */}
          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-20 flex-shrink-0">Website:</span>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => {
                setWebsiteUrl(e.target.value);
                updateContactFields('websiteUrl', e.target.value);
              }}
              placeholder="https://..."
              className="flex-1 border-none outline-none text-sm text-gray-600 placeholder-gray-300 bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="event-notes__actions mt-4">
        {currentButtons.map((button: SmartButton) => (
          <div key={button.id} className="event-notes__action-item flex items-end justify-between gap-3 max-[375px]:gap-2">
            {button.description && (
              <span className="event-notes__action-description text-[13px] text-gray-500 max-[375px]:text-[11px]">{button.description}</span>
            )}
            <div className="flex-shrink-0">
              <SmartActionButton 
                button={{ id: button.id, label: button.label }} 
                onClick={() => handleButtonSelect(button.id)} 
                isChildButton={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Progress Indicator Card */}
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      {flowContext?.isEditMode ? (
        <div className="flex justify-between items-center">
          <div className="flex-1 pr-4">
            <ProgressIndicator flowStep={flowContext.step} />
          </div>
          <div>
            <button
          onClick={() => {
            if (!flowContext || !setFlowContext || !setCreatedEvents || !setCurrentEventIndex) return;
            
                          // Save the current notes and contact fields to the flow context
              const updatedFlowContext = {
                ...flowContext,
                eventPreview: {
                  ...flowContext.eventPreview,
                  notes: eventNotes,
                  contactName: contactName,
                  phoneNumber: phoneNumber,
                  email: email,
                  websiteUrl: websiteUrl
                }
              };
              setFlowContext(updatedFlowContext);
              
              // Recreate events using the same logic as the Create Event button
              const { subtype, eventType } = updatedFlowContext.eventPreview;
              const formattedSubtype = subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : '';
              const formattedEventType = eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : '';
              const fullEventName = [formattedSubtype, formattedEventType].filter(Boolean).join(' ');

            const baseEvent = {
              eventName: fullEventName || 'Event',
              childName: flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 ? flowContext.eventPreview.selectedChildren.join(', ') : '',
              date: flowContext.eventPreview.date || '',
              time: flowContext.eventPreview.time || '',
              location: flowContext.eventPreview.location || '',
              notes: eventNotes || '',
              contactName: contactName || '',
              phoneNumber: phoneNumber || '',
              email: email || '',
              websiteUrl: websiteUrl || '',
              eventType: flowContext.eventPreview.eventType || '',
              category: flowContext.eventPreview.category || ''
            };

            const events = (flowContext.eventPreview.selectedDates && flowContext.eventPreview.selectedDates.length > 0)
              ? flowContext.eventPreview.selectedDates.map(date => {
                const [year, month, day] = date.split('-').map(Number);
                const eventDate = new Date(year, month - 1, day);
                const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                
                let eventTime = flowContext.eventPreview.dayBasedTimes?.[date] || flowContext.eventPreview.dayBasedTimes?.[dayOfWeek] || baseEvent.time;
                let eventLocation = flowContext.eventPreview.dateBasedLocations?.[date] || flowContext.eventPreview.dayBasedLocations?.[dayOfWeek] || baseEvent.location;

                return { ...baseEvent, date, time: eventTime, location: eventLocation };
              }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
              : [baseEvent];

            setCreatedEvents(events);
            setCurrentEventIndex(0);
            setFlowContext({ 
              ...flowContext, 
              step: 'confirmation',
              isEditMode: false
            });
          }}
          className="text-[#c4828d] hover:text-white transition-colors font-medium text-sm"
        >
          Resave Event
        </button>
          </div>
        </div>
      ) : (
        <ProgressIndicator flowStep={flowContext?.step || 'eventNotes'} />
      )}
    </div>
    </>
  );
}; 