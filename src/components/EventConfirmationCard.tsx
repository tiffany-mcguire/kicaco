import React from 'react';

// Helper to get a Kicaco event photo by event type/name
const KICACO_EVENT_PHOTOS: Record<string, string> = {
  concert: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=facearea&w=80&h=80',
  soccer: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=facearea&w=80&h=80',
  default: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=facearea&w=80&h=80',
  // ...add more as needed
};

function getKicacoEventPhoto(eventName: string) {
  if (!eventName) return KICACO_EVENT_PHOTOS.default;
  const name = eventName.toLowerCase();
  if (name.includes('concert')) return KICACO_EVENT_PHOTOS.concert;
  if (name.includes('soccer')) return KICACO_EVENT_PHOTOS.soccer;
  // ...add more mappings as needed
  return KICACO_EVENT_PHOTOS.default;
}

interface Props {
  eventName: string;
  date: string;
  time: string;
  location: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EventConfirmationCard({ eventName, date, time, location, onConfirm, onCancel }: Props) {
  const imageUrl = getKicacoEventPhoto(eventName);
  return (
    <div style={{
      background: '#f7f7fa',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      padding: '24px',
      margin: '24px auto',
      maxWidth: 400,
      textAlign: 'center',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <img
          src={imageUrl}
          alt="Event"
          style={{ width: 64, height: 64, borderRadius: 12, marginRight: 16, objectFit: 'cover' }}
        />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>{eventName}</div>
          <div style={{ fontSize: 15, color: '#444', marginTop: 4 }}>Date: {date}</div>
          <div style={{ fontSize: 15, color: '#444' }}>Time: {time}</div>
          <div style={{ fontSize: 15, color: '#444' }}>Location: {location}</div>
        </div>
      </div>
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
  );
} 