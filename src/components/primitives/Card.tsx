import React from 'react';

type CardProps = {
	className?: string;
	children: React.ReactNode;
};

// Visual wrapper used across Flow screens; preserves existing styling
export const Card: React.FC<CardProps> = ({ className = '', children }) => {
	return (
		<div className={`bg-white rounded-lg shadow-sm p-4 mt-4 ${className}`}>
			{children}
		</div>
	);
};

export default Card;


