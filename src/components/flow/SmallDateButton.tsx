import React from 'react';
import { SmartButton } from '../../hooks/useKicacoFlow';

interface Props {
  button: SmartButton;
  onClick: () => void;
  isSelected?: boolean;
  fadeUnselected?: boolean;
  dayColors: { [key: number]: string };
}

export const SmallDateButton: React.FC<Props> = ({ button, onClick, isSelected = false, fadeUnselected = false, dayColors }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const jsDay = new Date(button.id).getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Monday-first mapping

  const getButtonStyle = (): React.CSSProperties => {
    const shouldFade = fadeUnselected && !isSelected;

    const baseColor = dayColors[dayOfWeek];
    const selectedColors: { [key: number]: string } = {
      0: '#ffd8b5',
      1: '#fde68a',
      2: '#bbf7d0',
      3: '#c0e2e7',
      4: '#d1d5fa',
      5: '#e9d5ff',
      6: '#f8b6c2'
    };
    const fadedColor = baseColor.replace('80', '40');

    let s: React.CSSProperties = {
      width: '100%',
      height: '32px',
      padding: '4px 2px',
      border: isSelected ? '3px solid #217e8f' : '1px solid #9ca3af',
      borderRadius: '4px',
      fontWeight: 600,
      fontSize: '10px',
      lineHeight: '12px',
      background: isSelected ? selectedColors[dayOfWeek] : shouldFade ? fadedColor : baseColor,
      color: '#374151',
      outline: 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      boxShadow: isSelected ? '0 2px 6px rgba(33,126,143,0.3)' : '0 1px 2px rgba(0,0,0,0.08)',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    };

    if (hovered || focused) {
      const hoverColor = selectedColors[dayOfWeek];
      s = {
        ...s,
        background: hoverColor,
        border: isSelected ? '3px solid #217e8f' : '1px solid #6b7280',
        boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)' };
    }
    return s;
  };

  return (
    <button
      style={getButtonStyle()}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => {
        setPressed(false);
        setHovered(false);
      }}
      onMouseOver={() => setHovered(true)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setPressed(false);
      }}
      className="small-date-button__btn transition focus:outline-none focus:ring-1 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
    >
      {button.label}
    </button>
  );
}; 