import React from 'react';
import ProgressIndicator from './ProgressIndicator';
import Card from '../primitives/Card';

type ProgressCardProps = {
	stepId: string;
	isEditMode?: boolean;
	rightSlot?: React.ReactNode;
	className?: string;
};

// Wraps ProgressIndicator in the standard card UI, optional right-side action
export const ProgressCard: React.FC<ProgressCardProps> = ({ stepId, isEditMode, rightSlot, className = '' }) => {
	return (
		<Card className={className}>
			{isEditMode ? (
				<div className="flex justify-between items-center">
					<div className="flex-1 pr-4">
						<ProgressIndicator flowStep={stepId} isEditMode={isEditMode} />
					</div>
					<div>{rightSlot}</div>
				</div>
			) : (
				<ProgressIndicator flowStep={stepId} isEditMode={isEditMode} />
			)}
		</Card>
	);
};

export default ProgressCard;


