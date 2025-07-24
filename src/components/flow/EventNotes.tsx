import React, { useState } from 'react';
import { SmartButton } from '../../hooks/useKicacoFlow';
import { SmartActionButton } from './SmartActionButton';

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
}

export const EventNotes: React.FC<Props> = ({
  eventNotes,
  setEventNotes,
  currentButtons,
  handleButtonSelect,
  contactFields,
  setContactFields
}) => {
  const [websiteUrl, setWebsiteUrl] = useState(contactFields?.websiteUrl || '');
  const [contactName, setContactName] = useState(contactFields?.contactName || '');
  const [phoneNumber, setPhoneNumber] = useState(contactFields?.phoneNumber || '');
  const [email, setEmail] = useState(contactFields?.email || '');

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
  );
}; 