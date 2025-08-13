export const sportsFlowProgressMap: Record<string, number> = {
	// 1/12 - Add Event or Keeper
	initial: 1,

	// 2/12 - Event Category
	eventCategory: 2,
	keeperCategory: 2,

	// 3/12 - Your Family's Sports/All Sports
	sportsType: 3,
	eventSubtype: 3,

	// 4/12 - [Sport] Event Type
	eventType: 4,

	// 5/12 - Child Selection
	whichChild: 5,

	// 6/12 - Date Selection
	whenDate: 6,
	monthPart: 6,

	// 7/12 - Multi-Event Times
	repeatingSameTime: 7,

	// 8/12 - Time for All Dates/Day-Based Times/Custom Times
	whenTimePeriod: 8,
	daySpecificTime: 8,
	dayBasedTimeGrid: 8,
	customTimeSelection: 8,

	// 9/12 - Multi-Event Locations
	repeatingSameLocation: 9,

	// 10/12 - Location for All Dates/Day-Based/Custom Locations
	whereLocation: 10,
	daySpecificLocation: 10,
	dayBasedLocationSelection: 10,
	customLocationSelection: 10,

	// 11/12 - Notes/Create Event
	eventNotes: 11,

	// 12/12 - Confirmation
	confirmation: 12
};

export const getTotalStepsFromProgressMap = (progressMap: Record<string, number>): number => {
	return Object.values(progressMap).reduce((max, n) => (n > max ? n : max), 0);
};


