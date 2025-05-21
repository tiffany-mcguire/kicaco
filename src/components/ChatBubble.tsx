import React from 'react';
import clsx from 'clsx';

export default function ChatBubble({ children, side = 'left' }: { children: React.ReactNode; side?: 'left' | 'right' }) {
  const isLeft = side === 'left';
  const bubbleColor = isLeft ? '#e5e5ea' : '#c0e2e7';

  return (
    <div className={clsx('chat-bubble w-full flex mb-2', isLeft ? 'justify-start' : 'justify-end')}>
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
          {children}

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