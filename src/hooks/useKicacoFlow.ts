import { useState } from 'react';
import * as logic from './useKicacoFlowLogic';

// Types
export interface FlowContext {
  step: string;
  selections: Record<string, any>;
  isEditMode?: boolean; // Flag to track if we're in edit mode
  eventPreview: {
    type?: string;
    category?: string;
    subtype?: string;
    eventType?: string;
    child?: string;
    selectedChildren?: string[]; // Array of selected child IDs
    date?: string;
    selectedMonth?: string;
    timePeriod?: string;
    time?: string;
    location?: string;
    notes?: string;
    isRepeating?: boolean;
    selectedDates?: string[];
    repeatingSameTime?: boolean;
    hasPatternPreselection?: boolean;
    dayBasedTimes?: Record<string, string>; // Maps day-of-week to time
    currentDayForTime?: number; // Current day being set for day-based timing
    currentTimePattern?: 'same' | 'dayBased' | 'custom'; // Track which time pattern was most recently selected
    repeatingSameLocation?: boolean;
    dayBasedLocations?: Record<string, string>; // Maps day-of-week to location
    currentDayForLocation?: number; // Current day being set for day-based location
    currentLocationPattern?: 'same' | 'dayBased' | 'custom'; // Track which location pattern was most recently selected
    isComingFromOtherMonth?: boolean; // Flag to track if we're coming from "Other month" choice
    monthToExclude?: string; // Specific month to exclude when showing other month options
    dateBasedLocations?: Record<string, string>; // Maps specific dates to locations for custom location selection
  };
}

export interface SmartButton {
  id: string;
  label: string;
  description?: string;
}

/**
 * Hook that encapsulates all state & logic for the Kicaco conversational flow.
 * It uses helper functions from `useKicacoFlowLogic.ts` to keep this file clean.
 */
export function useKicacoFlow() {
  // ---------------- State ----------------
  const [flowContext, setFlowContext] = useState<FlowContext>({
    step: 'initial',
    selections: {},
    eventPreview: {}
  });

  const [showOtherMonths, setShowOtherMonths] = useState(false);
  const [eventNotes, setEventNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<any[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  // Time picker state
  const [timePickerState, setTimePickerState] = useState({
    hour: '',
    minute: '',
    ampm: '',
    activeDropdown: '' // 'hour', 'minute', 'ampm', or ''
  });

  // Location picker state
  const [editingLocationForDate, setEditingLocationForDate] = useState<string | null>(null);
  const [customLocationInput, setCustomLocationInput] = useState('');

  // --------------------------------------------------------------------------------
  // API returned to the component
  // --------------------------------------------------------------------------------

  const currentButtons = logic.getCurrentButtons(flowContext);
  const currentQuestion = logic.getCurrentQuestion(flowContext);

  const handleButtonSelect = (buttonId: string) => {
    logic.handleButtonSelect({
      buttonId,
      flowContext,
      eventNotes,
      setFlowContext,
      setShowOtherMonths,
      setCreatedEvents,
      setCurrentEventIndex,
      setShowConfirmation,
    });
  };

  return {
    // State and setters
    flowContext,
    setFlowContext,
    timePickerState,
    setTimePickerState,
    showOtherMonths,
    setShowOtherMonths,
    eventNotes,
    setEventNotes,
    showConfirmation,
    setShowConfirmation,
    createdEvents,
    setCreatedEvents,
    currentEventIndex,
    setCurrentEventIndex,
    editingLocationForDate,
    setEditingLocationForDate,
    customLocationInput,
    setCustomLocationInput,

    // Derived values from logic
    currentButtons,
    currentQuestion,

    // Handlers
    handleButtonSelect,

    // Simple helpers
    getChildColor: logic.getChildColor,
    dayColors: logic.dayColors,
    getHourOptions: logic.getHourOptions,
    getMinuteOptions: logic.getMinuteOptions,
    getAmPmOptions: logic.getAmPmOptions,

    // Complex helpers (for UI rendering)
    getPersonalizedSports: logic.getPersonalizedSports,
    getAllSportsAlphabetical: logic.getAllSportsAlphabetical,
    getMonthDates: logic.getMonthDates,
    getRemainingMonthsInYear: () => logic.getRemainingMonthsInYear(flowContext),
    getUniqueDaysOfWeek: logic.getUniqueDaysOfWeek,
  };
} 