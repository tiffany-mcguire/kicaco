import { useState, useRef, useEffect } from 'react';
import { FlowContext } from './useKicacoFlow';

export function useFlowPickers(flowContext: FlowContext, setFlowContext: React.Dispatch<React.SetStateAction<FlowContext>>) {
  const [editingTimeForDate, setEditingTimeForDate] = useState<string | null>(null);
  const [editingTimeForDay, setEditingTimeForDay] = useState<number | null>(null);
  const [editingLocationForDay, setEditingLocationForDay] = useState<number | null>(null);
  const [showFullPickerFor, setShowFullPickerFor] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState({ hour: '', minute: '', ampm: '' });
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const [hasUserScrolledScrollable, setHasUserScrolledScrollable] = useState(false);
  const scrollableTimeRef = useRef<HTMLDivElement>(null);
  const singleTimeScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingTimeForDate && !showFullPickerFor && scrollableTimeRef.current && !hasUserScrolledScrollable) {
      // Scroll to noon-ish time only if user hasn't manually scrolled
      const noonElement = scrollableTimeRef.current.querySelector('[data-time="12:00 PM"]');
      if (noonElement) {
        noonElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [editingTimeForDate, showFullPickerFor, hasUserScrolledScrollable]);

  // Handle return from custom picker to scrollable times for CustomTimeSelection
  useEffect(() => {
    if (flowContext.step === 'customTimeSelection' && showFullPickerFor === null && scrollableTimeRef.current && !hasUserScrolledScrollable) {
      // Only scroll to noon if user hasn't manually scrolled
      const noonElement = scrollableTimeRef.current.querySelector('[data-time="12:00 PM"]');
      if (noonElement) {
        noonElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showFullPickerFor, hasUserScrolledScrollable]);

  useEffect(() => {
    if (flowContext.step === 'whenTimePeriod' && singleTimeScrollRef.current) {
      // Scroll to noon-ish time for single time picker on initial load
      const noonElement = singleTimeScrollRef.current.querySelector('[data-time="12:00 PM"]');
      if (noonElement) {
        noonElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
      setHasUserScrolled(false); // Reset scroll tracking when step changes
    }
  }, [flowContext.step]);

  // Handle return from custom picker to scrollable times
  useEffect(() => {
    if (flowContext.step === 'whenTimePeriod' && showFullPickerFor === null && singleTimeScrollRef.current && !hasUserScrolled) {
      // Only scroll to noon if user hasn't manually scrolled
      const noonElement = singleTimeScrollRef.current.querySelector('[data-time="12:00 PM"]');
      if (noonElement) {
        noonElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showFullPickerFor, hasUserScrolled]);

  // Track user scrolling for single time picker
  useEffect(() => {
    const scrollContainer = singleTimeScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setHasUserScrolled(true);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Track user scrolling for scrollable time picker
  useEffect(() => {
    const scrollContainer = scrollableTimeRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setHasUserScrolledScrollable(true);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset scroll tracking when step changes
  useEffect(() => {
    if (flowContext.step === 'customTimeSelection' || flowContext.step === 'dayBasedTimeGrid') {
      setHasUserScrolledScrollable(false);
    }
  }, [flowContext.step]);

  const handleSetTimeForDate = (date: string, time: string, setTimePickerState?: any) => {
    setFlowContext({
      ...flowContext,
      eventPreview: {
        ...flowContext.eventPreview,
        dayBasedTimes: {
          ...flowContext.eventPreview.dayBasedTimes,
          [date]: time,
        }
      }
    });
    setEditingTimeForDate(null); // Close the picker
    if (setTimePickerState) {
      setTimePickerState({ hour: '', minute: '', ampm: '', activeDropdown: '' }); // Reset picker
    }
  };

  const handleSetTimeForDay = (dayIndex: number, time: string) => {
    setFlowContext({
      ...flowContext,
      eventPreview: {
        ...flowContext.eventPreview,
        dayBasedTimes: {
          ...flowContext.eventPreview.dayBasedTimes,
          [dayIndex]: time,
        }
      }
    });
    setEditingTimeForDay(null);
    setShowFullPickerFor(null);
    setCustomTime({ hour: '', minute: '', ampm: '' });
  };

  const handleSetLocationForDay = (dayIndex: number, location: string) => {
    setFlowContext({
      ...flowContext,
      eventPreview: {
        ...flowContext.eventPreview,
        dayBasedLocations: {
          ...flowContext.eventPreview.dayBasedLocations,
          [dayIndex]: location,
        }
      }
    });
    setEditingLocationForDay(null);
    setShowFullPickerFor(null);
  };

  const handleSetLocationForDate = (date: string, location: string, setCustomLocationInput?: any) => {
    setFlowContext({
      ...flowContext,
      eventPreview: {
        ...flowContext.eventPreview,
        dateBasedLocations: {
          ...flowContext.eventPreview.dateBasedLocations,
          [date]: location,
        }
      }
    });
    if (setCustomLocationInput) {
      setCustomLocationInput('');
    }
  };

  const areAllTimesSet = (flowContext.eventPreview.selectedDates || []).every(
    date => !!flowContext.eventPreview.dayBasedTimes?.[date]
  );

  const areAllLocationsSet = (flowContext.eventPreview.selectedDates || []).every(
    date => !!flowContext.eventPreview.dateBasedLocations?.[date]
  );

  return {
    editingTimeForDate,
    setEditingTimeForDate,
    editingTimeForDay,
    setEditingTimeForDay,
    editingLocationForDay,
    setEditingLocationForDay,
    showFullPickerFor,
    setShowFullPickerFor,
    customTime,
    setCustomTime,
    scrollableTimeRef,
    singleTimeScrollRef,
    handleSetTimeForDate,
    handleSetTimeForDay,
    handleSetLocationForDay,
    handleSetLocationForDate,
    areAllTimesSet,
    areAllLocationsSet,
  };
} 