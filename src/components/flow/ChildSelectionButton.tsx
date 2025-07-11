import React from 'react';
import { SmartButton } from '../../hooks/useKicacoFlow';

interface Props {
  button: SmartButton;
  onClick: () => void;
  isSelected?: boolean;
  getChildColor?: (id: string) => string;
  fadeUnselected?: boolean;
}

// Function to generate a vibrant, darker outline color for selection
const getVibrantOutlineColor = (childColor: string): string => {
  // Map common child colors to their vibrant outline equivalents
  const colorMap: { [key: string]: string } = {
    '#f8b6c2': '#e91e63', // Pink -> Vibrant pink
    '#fbd3a2': '#ff6f00', // Orange -> Vibrant orange
    '#ffd8b5': '#ff6f00', // Emma's orange -> Vibrant orange
    '#fde68a': '#ffc107', // Yellow -> Vibrant yellow
    '#bbf7d0': '#00c853', // Green -> Vibrant green
    '#c0e2e7': '#00bcd4', // Blue -> Vibrant cyan
    '#d1d5fa': '#3f51b5', // Indigo -> Vibrant indigo
    '#e9d5ff': '#9c27b0', // Purple -> Vibrant purple
    '#217e8f': '#006064', // Default teal -> Darker teal
  };
  
  // Return mapped color or generate a darker version
  return colorMap[childColor] || `color-mix(in srgb, ${childColor} 85%, black)`;
};

export const ChildSelectionButton: React.FC<Props> = ({ button, onClick, isSelected = false, getChildColor, fadeUnselected = false }) => {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const shouldFade = fadeUnselected && !isSelected;
  const childColor = getChildColor ? getChildColor(button.id) : '#217e8f';
  const fadedColor = `color-mix(in srgb, ${childColor} 60%, white)`;
  const vibrantOutlineColor = getVibrantOutlineColor(childColor);

  const getButtonStyle = (): React.CSSProperties => {
    let s: React.CSSProperties = {
      width: '115px',
      height: '30px',
      padding: '0px 0px',
      border: isSelected 
        ? `2px solid ${vibrantOutlineColor}` 
        : `0.5px solid color-mix(in srgb, ${childColor} 75%, black)`,
      borderRadius: '6px',
      fontWeight: isSelected ? 600 : 500,
      fontSize: '13px',
      lineHeight: '20px',
      background: isSelected ? childColor : (shouldFade ? fadedColor : fadedColor),
      color: '#374151',
      outline: 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      boxShadow: isSelected 
        ? `0 4px 12px rgba(0,0,0,0.15), 0 0 0 2px ${vibrantOutlineColor}25` 
        : `0 0 2px color-mix(in srgb, ${childColor} 75%, black)`,
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
        background: isSelected ? childColor : fadedColor,
        border: isSelected 
          ? `2px solid ${vibrantOutlineColor}` 
          : `0.5px solid color-mix(in srgb, ${childColor} 75%, black)`,
        boxShadow: isSelected 
          ? `0 4px 12px rgba(0,0,0,0.15), 0 0 0 2px ${vibrantOutlineColor}25` 
          : `0 0 2px color-mix(in srgb, ${childColor} 75%, black)`
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
        <div className="child-selection-button__description text-xs text-gray-500 mt-1">{button.description}</div>
      )}
    </div>
  );
}; 