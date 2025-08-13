import React from 'react';

type ListRowProps = {
	title?: string;
	description?: string;
	right?: React.ReactNode;
	className?: string;
};

// Horizontal row used for description + right-aligned action button
export const ListRow: React.FC<ListRowProps> = ({ title, description, right, className = '' }) => {
	return (
		<div className={`flex items-end justify-between min-h-[30px] ${className}`}>
			{(title || description) && (
				<div className="text-[12.5px] text-gray-500 flex-1 pr-3 max-h-[30px] overflow-hidden leading-tight">
					{title ? <div className="font-medium text-gray-700 text-sm">{title}</div> : null}
					{description}
				</div>
			)}
			{right ? <div className="flex-shrink-0">{right}</div> : null}
		</div>
	);
};

export default ListRow;


