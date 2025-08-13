import { sportsFlowProgressMap } from './flowProgress';

export type SportsFlowStepId = keyof typeof sportsFlowProgressMap | 'complete';

type TitleGenerator = (ctx: {
	eventPreview: {
		subtype?: string;
		selectedMonth?: string;
		currentDayForTime?: number;
		currentDayForLocation?: number;
		selectedDates?: string[];
	};
}) => string;

type StepConfig = {
	title: string | TitleGenerator;
};

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const sportsFlowSteps: Record<SportsFlowStepId, StepConfig> = {
	initial: { title: 'Add Event or Keeper' },
	eventCategory: { title: 'Event Category' },
	keeperCategory: { title: 'Keeper Category' },
	sportsType: { title: '' },
	eventSubtype: { title: '' },
	eventType: {
		title: ({ eventPreview }) => {
			const subtype = eventPreview.subtype || 'soccer';
			const capitalized = subtype.charAt(0).toUpperCase() + subtype.slice(1);
			return `${capitalized} Event Type`;
		}
	},
	whichChild: { title: 'Child Selection' },
	whenDate: { title: 'Select Date' },
	monthPart: {
		title: ({ eventPreview }) => {
			const { selectedMonth = '' } = eventPreview;
			const [monthStr, yearStr] = selectedMonth.split('-');
			const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
			const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
			const monthIndex = monthNames.indexOf(monthStr as any);
			return `${monthIndex >= 0 ? fullMonthNames[monthIndex] : 'the month'} ${yearStr || new Date().getFullYear()}`;
		}
	},
	repeatingSameTime: { title: 'Multi-Event Times' },
	whenTimePeriod: { title: 'Event Time' },
	daySpecificTime: {
		title: ({ eventPreview }) => `What time for ${dayNames[eventPreview.currentDayForTime ?? 0]}?`
	},
	dayBasedTimeGrid: { title: 'Day-Based Times' },
	customTimeSelection: { title: 'Custom Times' },
	repeatingSameLocation: { title: 'Multi-Event Locations' },
	whereLocation: { title: 'Event Location' },
	daySpecificLocation: {
		title: ({ eventPreview }) => `What location for ${dayNames[eventPreview.currentDayForLocation ?? 0]}?`
	},
	dayBasedLocationSelection: { title: 'Day-Based Locations' },
	customLocationSelection: { title: 'Custom Locations' },
	eventNotes: { title: 'Notes (Optional)' },
	confirmation: {
		title: ({ eventPreview }) => {
			const count = eventPreview.selectedDates?.length || 0;
			return count > 1 ? 'Your events have been created!' : 'Your event has been created!';
		}
	},
	complete: { title: 'Ready to create your event!' }
};

export const getFlowStepTitle = (stepId: SportsFlowStepId, ctx: { eventPreview: any }): string => {
	const step = sportsFlowSteps[stepId];
	if (!step) return 'Next step...';
	return typeof step.title === 'function' ? step.title(ctx) : step.title;
};


