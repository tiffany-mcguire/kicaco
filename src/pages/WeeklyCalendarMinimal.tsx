import React from 'react';

export default function WeeklyCalendarMinimal() {
  console.log('📍 WeeklyCalendarMinimal: Component is rendering');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '24px' }}>Minimal Weekly Calendar</h1>
      <p style={{ color: '#666', fontSize: '16px' }}>
        This is the most basic version possible.
      </p>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        marginTop: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px'
      }}>
        <p>✅ React is working</p>
        <p>✅ Component is mounted</p>
        <p>✅ Styles are applied</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
} 