import React, { ReactNode, forwardRef } from 'react';

interface GlobalSubheaderProps {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
  frameColor?: string; // Optional, for custom frame color per page
  frameOpacity?: number; // Optional, for custom frame opacity per page
}

const GlobalSubheader = forwardRef<HTMLDivElement, GlobalSubheaderProps>(
  ({ icon, title, action, className = '', frameColor, frameOpacity }, ref) => {
    const color = frameColor || '#2e8b57';
    const opacity = typeof frameOpacity === 'number' ? frameOpacity : 0.25;
    return (
      <div
        ref={ref}
        className={`profiles-roles-subheader w-full bg-white subheader-z-index ${className}`}
      >
        <section className="mb-2 px-4 pt-4">
          <div className="flex items-start justify-between w-full">
            <div style={{ width: '180px' }}>
              <div className="h-0.5 rounded w-full mb-0" style={{ backgroundColor: color, opacity }}></div>
              <div className="flex items-center space-x-2 pl-1">
                {icon}
                <h2 className="text-[#b91142] text-lg font-medium tracking-tight">{title}</h2>
              </div>
              <div className="h-0.5 rounded w-full mt-0" style={{ backgroundColor: color, opacity }}></div>
            </div>
            {action && (
              <div className="flex items-center" style={{ height: '30px', marginTop: '0px' }}>
                {action}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }
);

export default GlobalSubheader; 