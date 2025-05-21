import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  Button: {
    width: '140px',
    height: '30px',
    padding: '0px 8px',
    border: '1px solid #c0e2e7',
    boxSizing: 'border-box' as const,
    borderRadius: '6px',
    fontFamily: 'Nunito',
    fontWeight: 600,
    fontSize: '14px',
    lineHeight: '20px',
    boxShadow: '-2px 2px 0px rgba(0,0,0,0.25)',
    background: '#fff',
    color: '#217e8f',
    outline: 'none',
    transition: 'transform 0.08s cubic-bezier(.4,1,.3,1), box-shadow 0.18s cubic-bezier(.4,1,.3,1), border-color 0.18s cubic-bezier(.4,1,.3,1)',
  } as React.CSSProperties,
};

const defaultProps = {
  label: 'Add Keeper',
};

const AddKeeperButton = (props: { label?: string }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  const getButtonStyle = () => {
    let s = { ...styles.Button, borderColor: '#c0e2e7' };
    if (hovered || focused) {
      s = {
        ...s,
        boxShadow: '0 0 16px 4px #c0e2e7aa, -2px 2px 0px rgba(0,0,0,0.25)',
        borderColor: '#c0e2e7',
        outline: 'none',
      };
    }
    if (pressed) {
      s = { ...s, transform: 'scale(0.92)', borderColor: '#c0e2e7' };
    }
    s.outline = 'none';
    return s;
  };

  const handleClick = () => {
    setTimeout(() => navigate('/add-keeper'), 150);
  };

  return (
    <button
      style={getButtonStyle()}
      tabIndex={0}
      type="button"
      onClick={handleClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseOver={() => setHovered(true)}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setPressed(false); }}
    >
      {props.label ?? defaultProps.label}
    </button>
  );
};

export default AddKeeperButton; 