import React from 'react';

export const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => {
  const styles = {
    Icon: {
      color: '#c1c1c1',
      fill: '#c1c1c1',
      fontSize: '28px',
      width: '28px',
      height: '28px',
      ...(props.style || {})
    },
  };

  return (
    <svg style={styles.Icon} viewBox="0 0 24 24">
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="M5 20h14v-2H5v2zm0-10h4v6h6v-6h4l-7-7-7 7z" />
    </svg>
  );
};

export const CameraIconMD = (props: React.SVGProps<SVGSVGElement>) => {
  const styles = {
    Icon: {
      color: '#c1c1c1',
      fill: '#c1c1c1',
      fontSize: '28px',
      width: '28px',
      height: '28px',
      ...(props.style || {})
    },
  };

  return (
    <svg style={styles.Icon} viewBox="0 0 24 24">
      <g transform="translate(0, 1.5)">
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 1 0 0-6.4z" />
        <path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
      </g>
    </svg>
  );
};

export const MicIcon = (props: React.SVGProps<SVGSVGElement>) => {
  const styles = {
    Icon: {
      color: '#c1c1c1',
      fill: '#c1c1c1',
      fontSize: '28px',
      width: '28px',
      height: '28px',
      ...(props.style || {})
    },
  };

  return (
    <svg style={styles.Icon} viewBox="0 0 24 24">
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
    </svg>
  );
};

export const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg style={{ color: '#c1c1c1', fill: '#c1c1c1', width: '14px', height: '14px', fontSize: '14px', ...(props.style || {}) }} viewBox="0 0 24 24">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

export const ClipboardIcon2 = (props: React.SVGProps<SVGSVGElement>) => {
  const styles = {
    Icon: {
      color: '#c1c1c1',
      fill: '#c1c1c1',
      fontSize: '28px',
      width: '28px',
      height: '28px',
      ...(props.style || {})
    },
  };

  return (
    <svg style={styles.Icon} viewBox="0 0 24 24">
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="M5 5h2v3h10V5h2v6h2V5c0-1.1-.9-2-2-2h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v-2H5V5zm7-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
      <path d="m18.01 13-1.42 1.41 1.58 1.58H12v2h6.17l-1.58 1.59 1.42 1.41 3.99-4z" />
    </svg>
  );
}; 