import React from 'react';

type StickyActionBarProps = {
	primaryLabel: string;
	onPrimary: () => void;
	secondaryLabel?: string;
	onSecondary?: () => void;
	disabled?: boolean;
	className?: string;
};

// Bottom-pinned action bar; styling mirrors existing full-width button placement
export const StickyActionBar: React.FC<StickyActionBarProps> = ({
	primaryLabel,
	onPrimary,
	secondaryLabel,
	onSecondary,
	disabled,
	className = '',
}) => {
	return (
		<div className={`sticky bottom-0 bg-white pt-3 ${className}`}>
			<div className="flex items-center justify-between">
				{secondaryLabel && onSecondary ? (
					<button onClick={onSecondary} className="text-[#217e8f] text-[13px]">{secondaryLabel}</button>
				) : <div />}
				<button
					onClick={onPrimary}
					disabled={disabled}
					className={`kicaco-flow__child-selection-continue ${disabled ? 'kicaco-flow__child-selection-continue--disabled' : 'kicaco-flow__child-selection-continue--active'}`}
				>
					{primaryLabel}
				</button>
			</div>
		</div>
	);
};

export default StickyActionBar;


