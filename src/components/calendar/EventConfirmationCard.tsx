
import { getKicacoEventPhoto } from '../../utils/getKicacoEventPhoto';
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
            border: '1px solid #217e8f',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 400,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: 8,
            width: '100%',
            height: '36px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease',
          }}
          onClick={onConfirm}
        >
          Create an account
        </button>
        <button
          style={{
            background: '#fff',
            color: '#b91142',
            border: '1px solid #e7c0c0',
            borderRadius: '6px',
            padding: '0px 8px',
            fontWeight: 400,
            fontSize: '14px',
            cursor: 'pointer',
            height: '30px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease',
          }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 