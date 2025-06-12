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
        className={`profiles-roles-subheader w-full bg-gray-50 ${className}`}
      >
        <section className="px-6 pt-4 pb-3">
          <div className="flex items-end justify-between w-full">
            <div className="flex items-center space-x-2">
              {React.cloneElement(icon as React.ReactElement, { size: 16, strokeWidth: 1.5, className: 'text-[#217e8f]' })}
              <h2 className="text-gray-700 text-base font-normal">{title}</h2>
            </div>
            {action && (
              <div className="flex items-center">
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