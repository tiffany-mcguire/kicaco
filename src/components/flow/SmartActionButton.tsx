import React from 'react';
import { SmartButton } from '../../hooks/useKicacoFlow';

interface Props {
  button: SmartButton;
  onClick: () => void;
  isChildButton?: boolean;
  getChildColor?: (id: string) => string;
  customStyle?: 'month-navigation' | undefined;
  isSelectedFutureYearMonth?: boolean;
}

export const SmartActionButton: React.FC<Props> = ({ button, onClick, isChildButton = false, getChildColor, customStyle, isSelectedFutureYearMonth = false }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const getButtonStyle = (): React.CSSProperties => {
    // Handle month navigation custom style
    if (customStyle === 'month-navigation') {
      let s: React.CSSProperties = {
        width: '115px',
        height: '30px',
        padding: '0px 0px',
        border: '2px solid #059669',
        boxSizing: 'border-box',
        borderRadius: '6px',
        fontWeight: 500,
        fontSize: '13px',
        lineHeight: '20px',
        background: '#10b981',
        color: '#ffffff',
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

      // Apply inverted styling for selected future year months
      if (isSelectedFutureYearMonth) {
        s = {
          ...s,
          background: '#ffffff',
          color: '#059669',
          border: '2px solid #059669'
        };
      }

      if (hovered || focused) {
        if (isSelectedFutureYearMonth) {
          s = {
            ...s,
            background: '#f0fdf4',
            border: '2px solid #047857',
            color: '#047857',
            boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
          };
        } else {
          s = {
            ...s,
            background: '#059669',
            border: '2px solid #047857',
            boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
          };
        }
      }
      if (pressed) {
        s = { ...s, transform: 'scale(0.95)' };
      }
      return s;
    }

    // Default styling for regular buttons
    const buttonColor = isChildButton && getChildColor ? getChildColor(button.id) : '#2f8fa4';

    let s: React.CSSProperties = {
      width: '115px',
      height: '30px',
      padding: '0px 0px',
      border: isChildButton ? '1px solid #9ca3af' : '2px solid #217e8f',
      boxSizing: 'border-box',
      borderRadius: '6px',
      fontWeight: isChildButton ? 600 : 500,
      fontSize: '13px',
      lineHeight: '20px',
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
        : '#217e8f';
      s = {
        ...s,
        background: hoverColor,
        border: isChildButton ? '1px solid #6b7280' : '2px solid #217e8f',
        boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)' };
    }
    return s;
  };

  const handleClick = () => {
    onClick();
    // Always reset hover state immediately after click
    // The component will re-render with updated props and show correct styling
    setHovered(false);
    setFocused(false);
    setPressed(false);
  };

  return (
    <div className="smart-action-button">
      <button
        style={getButtonStyle()}
        onClick={handleClick}
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