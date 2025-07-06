import React from 'react';
import { SmartButton } from '../../hooks/useKicacoFlow';

interface Props {
  button: SmartButton;
  onClick: () => void;
  isSelected?: boolean;
  getChildColor?: (id: string) => string;
  fadeUnselected?: boolean;
}

export const ChildSelectionButton: React.FC<Props> = ({ button, onClick, isSelected = false, getChildColor, fadeUnselected = false }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const shouldFade = fadeUnselected && !isSelected;
  const childColor = getChildColor ? getChildColor(button.id) : '#217e8f';
  const fadedColor = childColor + '40';

  const getButtonStyle = (): React.CSSProperties => {
    let s: React.CSSProperties = {
      width: '90px',
      padding: '5px 8px',
      border: isSelected ? '3px solid #217e8f' : '1px solid #9ca3af',
      borderRadius: '5px',
      fontWeight: 600,
      fontSize: '12px',
      lineHeight: '14px',
      background: shouldFade ? fadedColor : childColor,
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
      s = {
        ...s,
        background: childColor,
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
    <div className="child-selection-button">
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
        className="child-selection-button__btn transition focus:outline-none focus:ring-1 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
      >
        {button.label}
      </button>
      {button.description && (
        <div className="child-selection-button__description text-sm text-gray-500 mt-1">{button.description}</div>
      )}
    </div>
  );
}; 