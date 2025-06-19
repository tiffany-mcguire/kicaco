import React, { useState } from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement> & { style?: React.CSSProperties }>;
  style?: React.CSSProperties;
  variant?: 'default' | 'frameless';
}

const styles = {
  Button: {
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '32px',
    height: '32px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#c0e2e7',
    boxSizing: 'border-box',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    color: '#c1c1c1',
    backgroundColor: 'rgba(0,0,0,0)',
    outline: 'none',
    overflow: 'visible',
    padding: 0,
    transition: 'transform 0.08s cubic-bezier(.4,1,.3,1), box-shadow 0.18s cubic-bezier(.4,1,.3,1), border-color 0.18s cubic-bezier(.4,1,.3,1)',
  } as React.CSSProperties,
  FramelessButton: {
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '40px',
    height: '40px',
    border: 'none',
    boxSizing: 'border-box',
    borderRadius: '8px',
    color: '#6b7280',
    backgroundColor: 'transparent',
    outline: 'none',
    overflow: 'visible',
    padding: 0,
    transition: 'transform 0.15s ease, background-color 0.15s ease, color 0.15s ease',
  } as React.CSSProperties,
  Icon: {
    color: '#c1c1c1',
    fill: '#c1c1c1',
    width: '22px',
    height: '22px',
    fontSize: '22px',
    display: 'block',
    margin: 'auto',
    transition: 'color 0.18s cubic-bezier(.4,1,.3,1), fill 0.18s cubic-bezier(.4,1,.3,1)',
  } as React.CSSProperties,
  FramelessIcon: {
    color: 'currentColor',
    fill: 'currentColor',
    width: '24px',
    height: '24px',
    fontSize: '24px',
    display: 'block',
    margin: 'auto',
    transition: 'color 0.15s ease',
  } as React.CSSProperties,
};

const IconButton: React.FC<IconButtonProps> = ({ IconComponent, style, variant = 'default', ...props }) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  
  const isFrameless = variant === 'frameless';

  const getButtonStyle = () => {
    if (isFrameless) {
      let s = { ...styles.FramelessButton, ...style };
      
      // Check if this is a header button by looking at the color
      const isHeaderButton = style?.color === '#ffffff';
      
      if (hovered || focused) {
        if (isHeaderButton) {
          // For header buttons: white background with teal icon
          s = {
            ...s,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            color: '#217e8f',
          };
        } else {
          // For footer buttons: keep the original light teal behavior
          s = {
            ...s,
            backgroundColor: 'rgba(192, 226, 231, 0.2)',
            color: '#217e8f',
          };
        }
      }
      if (pressed) {
        if (isHeaderButton) {
          s = { 
            ...s, 
            transform: 'scale(0.9)',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            color: '#1a6e7e', // Slightly darker teal when pressed
          };
        } else {
          s = { 
            ...s, 
            transform: 'scale(0.9)',
            backgroundColor: 'rgba(192, 226, 231, 0.3)',
          };
        }
      }
      return s;
    }
    
    // Original framed button styles
    let s = { ...styles.Button, ...style };
    if (hovered || focused) {
      s = {
        ...s,
        boxShadow: '0 0 12px 2px rgba(192,226,231,0.4), 0 4px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        borderColor: '#c0e2e7',
        outline: 'none',
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.95)', boxShadow: '0 0 8px 1px rgba(192,226,231,0.3), 0 1px 2px rgba(0,0,0,0.12)', borderColor: '#c0e2e7' };
    }
    s.outline = 'none';
    return s;
  };

  return (
    <button
      type="button"
      style={getButtonStyle()}
      {...props}
      onMouseDown={e => { setPressed(true); props.onMouseDown?.(e); }}
      onMouseUp={e => { setPressed(false); props.onMouseUp?.(e); }}
      onMouseLeave={e => { setPressed(false); setHovered(false); props.onMouseLeave?.(e); }}
      onMouseOver={e => { setHovered(true); props.onMouseOver?.(e); }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); setPressed(false); props.onBlur?.(e); }}
      tabIndex={0}
      className={isFrameless ? "transition-all" : "transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95 active:shadow-[0_0_16px_4px_#c0e2e7aa,-2px_2px_0px_rgba(0,0,0,0.15)]"}
    >
      {IconComponent ? <IconComponent style={isFrameless ? styles.FramelessIcon : styles.Icon} /> : null}
    </button>
  );
};

export default IconButton; 