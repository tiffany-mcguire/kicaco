import React from 'react';
import { SmartButton } from '../../hooks/useKicacoFlow';

interface Props {
  button: SmartButton;
  onClick: () => void;
  isChildButton?: boolean;
  getChildColor?: (id: string) => string;
}

export const SmartActionButton: React.FC<Props> = ({ button, onClick, isChildButton = false, getChildColor }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const getButtonStyle = (): React.CSSProperties => {
    const buttonColor = isChildButton && getChildColor ? getChildColor(button.id) : '#217e8f';

    let s: React.CSSProperties = {
      width: '90px',
      padding: '5px 8px',
      border: isChildButton ? '1px solid #9ca3af' : 'none',
      boxSizing: 'border-box',
      borderRadius: '5px',
      fontWeight: isChildButton ? 600 : 400,
      fontSize: '12px',
      lineHeight: '14px',
      background: buttonColor,
      color: isChildButton ? '#374151' : '#ffffff',
      outline: 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    };

    if (hovered || focused) {
      const hoverColor = isChildButton && getChildColor
        ? getChildColor(button.id)
        : '#1a6e7e';
      s = {
        ...s,
        background: hoverColor,
        border: isChildButton ? '1px solid #6b7280' : 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)' };
    }
    return s;
  };

  return (
    <div className="smart-action-button">
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
        className="smart-action-button__btn transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
      >
        {button.label}
      </button>
      {button.description && (
        <div className="smart-action-button__description text-xs text-gray-500 mt-1">{button.description}</div>
      )}
    </div>
  );
}; 