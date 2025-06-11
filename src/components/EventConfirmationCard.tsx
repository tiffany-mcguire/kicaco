import React from 'react';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import EventCard from './EventCard';

interface Props {
  eventName: string;
  childName?: string;
  date: string;
  time: string;
  location: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EventConfirmationCard({ eventName, childName, date, time, location, onConfirm, onCancel }: Props) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.5)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        padding: '24px',
        margin: '24px',
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
      }}>
        <EventCard
          image={getKicacoEventPhoto(eventName)}
          name={eventName}
          childName={childName}
          date={date}
          time={time}
          location={location}
        />
        <div style={{ fontSize: 15, color: '#444', margin: '16px 0 20px 0' }}>
          Want to save this and keep building your child's schedule? Create an account to save and manage all your events in one place. No forms, just your name and email to get started!
        </div>
        <button
          style={{
            background: '#217e8f',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 8,
            width: '100%',
          }}
          onClick={onConfirm}
        >
          Create an account
        </button>
        <button
          style={{
            background: 'none',
            color: '#b91142',
            border: 'none',
            borderRadius: 8,
            padding: '6px 12px',
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
          }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 