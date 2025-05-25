import React from 'react';
import clsx from 'clsx';

const ThinkingWave = () => {
  const text = "Kicaco is thinking...";
  return (
    <span className="thinking-wave">
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="wave-char"
          style={{ animationDelay: `${i * 0.05}s`, whiteSpace: char === ' ' ? 'pre' : undefined }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export default function ChatBubble({ children, side = 'left' }: { children: React.ReactNode; side?: 'left' | 'right' }) {
  const isLeft = side === 'left';
  const bubbleColor = isLeft ? '#e5e5ea' : '#c0e2e7';

  const renderContent = () => {
    if (typeof children === 'string' && children === 'Kicaco is thinking') {
      return <ThinkingWave />;
    }
    return children;
  };

  return (
    <div className={clsx('chat-bubble w-full flex mb-px', isLeft ? 'justify-start' : 'justify-end')}>
      <div className="relative max-w-[75%] px-3 py-2">
        <div
          className={clsx(
            'relative px-4 py-3 text-sm text-gray-900 border shadow-sm',
            isLeft
              ? 'bg-[#e5e5ea] border-[#e5e7eb]'
              : 'bg-[#c0e2e7] border-[#b5dbe2]'
          )}
          style={{ borderRadius: 17 }}
        >
          {renderContent()}

          {/* Tail shaped like a thick comma */}
          <svg
            className={clsx(
              'absolute',
              isLeft ? 'left-[-10px] bottom-[5px]' : 'right-[-10px] bottom-[5px]'
            )}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isLeft ? 'scaleX(1)' : 'scaleX(-1)',
            }}
          >
            <path
              d="M0,16 C4,12 7,9 9,4 C10,2 11,1 16,16 Z"
              fill={bubbleColor}
            />
          </svg>
        </div>
      </div>
    </div>
  );
} 