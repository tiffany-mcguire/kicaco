import React, { ReactNode, forwardRef } from 'react';

interface GlobalSubheaderProps {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
}

const GlobalSubheader = forwardRef<HTMLDivElement, GlobalSubheaderProps>(
  ({ icon, title, action, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`profiles-roles-subheader w-full bg-white subheader-z-index ${className}`}
      >
        <section className="mb-2 px-4 pt-4">
          <div className="flex items-start justify-between w-full">
            <div style={{ width: '180px' }} className="py-1">
              <div className="flex items-center space-x-2 pl-1">
                {React.cloneElement(icon as React.ReactElement, { size: 16, strokeWidth: 2, className: 'text-[#00647a] opacity-80' })}
                <h2 className="text-[#00647a] text-lg font-medium tracking-tight">{title}</h2>
              </div>
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