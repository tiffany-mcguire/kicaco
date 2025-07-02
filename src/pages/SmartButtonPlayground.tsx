import React, { useState } from 'react';
import { GlobalHeader, GlobalSubheader, GlobalFooter } from '../components/navigation';
import { GlobalChatDrawer } from '../components/chat';
import { useKicacoStore } from '../store/kicacoStore';
import { useChatScrollManagement } from '../hooks/useChatScrollManagement';
import { Settings, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { EventCard } from '../components/calendar';
import { StackedChildBadges } from '../components/common';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { format, parse } from 'date-fns';

// Types for our smart button flow
interface FlowContext {
  step: string;
  selections: Record<string, any>;
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
    repeatingSameLocation?: boolean;
    dayBasedLocations?: Record<string, string>; // Maps day-of-week to location
    currentDayForLocation?: number; // Current day being set for day-based location
  };
}

interface SmartButton {
  id: string;
  label: string;
  description?: string;
}

export default function SmartButtonPlayground() {
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

  const {
    drawerHeight: storedDrawerHeight,
    setDrawerHeight: setStoredDrawerHeight,
    chatScrollPosition,
    setChatScrollPosition,
    messages
  } = useKicacoStore();

  const { chatContentScrollRef } = useChatScrollManagement({
    messages,
    chatScrollPosition,
    setChatScrollPosition,
    pageName: 'SmartButtonPlayground'
  });

  // Initial question and options
  const getInitialButtons = (): SmartButton[] => [
    {
      id: 'event',
      label: 'Event',
      description: 'Something to attend or participate in'
    },
    {
      id: 'keeper',
      label: 'Keeper',
      description: 'A task or deadline to remember'
    }
  ];

  // Event category options
  const getEventCategoryButtons = (): SmartButton[] => [
    {
      id: 'sports',
      label: 'Sports',
      description: 'Games, practices, tournaments, lessons'
    },
    {
      id: 'medical',
      label: 'Medical',
      description: 'Appointments, checkups, procedures'
    },
    {
      id: 'school',
      label: 'School',
      description: 'Classes, meetings, field trips, events'
    },
    {
      id: 'social',
      label: 'Social',
      description: 'Parties, playdates, gatherings'
    },
    {
      id: 'activities',
      label: 'Activities',
      description: 'Lessons, clubs, performances, hobbies'
    },
    {
      id: 'family',
      label: 'Family',
      description: 'Outings, vacations, family time'
    }
  ];

  // Sports options with personalized grouping
  const getPersonalizedSports = (): SmartButton[] => [
    // Based on mock data - Emma plays soccer, Alex plays basketball, Leo plays tennis
    {
      id: 'soccer',
      label: 'Soccer',
      description: 'Football, futsal, indoor/outdoor'
    },
    {
      id: 'basketball',
      label: 'Basketball',
      description: 'Games, practices, tournaments'
    },
    {
      id: 'tennis',
      label: 'Tennis',
      description: 'Lessons, matches, tournaments'
    }
  ];

  const getAllSportsAlphabetical = (): SmartButton[] => [
    {
      id: 'american-football',
      label: 'Amer Football',
      description: 'American football, flag football, tackle'
    },
    {
      id: 'baseball',
      label: 'Baseball',
      description: 'Baseball, softball, tee-ball'
    },
    {
      id: 'cheerleading',
      label: 'Cheerleading',
      description: 'Cheer practice, competitions'
    },
    {
      id: 'cross-country',
      label: 'Cross Country',
      description: 'Running, meets, training'
    },
    {
      id: 'dance',
      label: 'Dance',
      description: 'Ballet, jazz, hip-hop, recitals'
    },
    {
      id: 'golf',
      label: 'Golf',
      description: 'Lessons, tournaments, practice'
    },
    {
      id: 'gymnastics',
      label: 'Gymnastics',
      description: 'Classes, meets, competitions'
    },
    {
      id: 'hockey',
      label: 'Hockey',
      description: 'Ice hockey, field hockey'
    },
    {
      id: 'karate',
      label: 'Karate',
      description: 'Martial arts, belt tests'
    },
    {
      id: 'lacrosse',
      label: 'Lacrosse',
      description: 'Games, practices, tournaments'
    },
    {
      id: 'swimming',
      label: 'Swimming',
      description: 'Lessons, meets, lap swimming'
    },
    {
      id: 'track-field',
      label: 'Track & Field',
      description: 'Running, jumping, throwing events'
    },
    {
      id: 'volleyball',
      label: 'Volleyball',
      description: 'Indoor, outdoor, beach volleyball'
    },
    {
      id: 'wrestling',
      label: 'Wrestling',
      description: 'Matches, tournaments, practice'
    },
    {
      id: 'other-sport',
      label: 'Other Sport',
      description: 'Any other sport or activity'
    }
  ];

  // Event type options for sports (e.g., after selecting Soccer)
  const getSportsEventTypeButtons = (): SmartButton[] => [
    {
      id: 'game',
      label: 'Game',
      description: 'Match, scrimmage, tournament game'
    },
    {
      id: 'practice',
      label: 'Practice',
      description: 'Team practice, training session'
    },
    {
      id: 'lesson',
      label: 'Lesson',
      description: 'Private lesson, coaching session'
    },
    {
      id: 'tournament',
      label: 'Tournament',
      description: 'Multi-game tournament or event'
    }
  ];

  // Child selection (mock data with colors)
  const getChildButtons = (): SmartButton[] => [
    {
      id: 'emma',
      label: 'Emma',
      description: 'Age 8, loves soccer and art'
    },
    {
      id: 'alex',
      label: 'Alex',
      description: 'Age 6, plays basketball'
    },
    {
      id: 'leo',
      label: 'Leo',
      description: 'Age 10, tennis player'
    }
  ];

  // Child colors matching the mock data
  const getChildColor = (childId: string): string => {
    const colors: { [key: string]: string } = {
      'emma': '#ffd8b5', // Orange
      'alex': '#c0e2e7',  // Blue
      'leo': '#bbf7d0'    // Green
    };
    return colors[childId] || '#217e8f'; // Default to teal if not found
  };

  // Date options with specific dates
  const getDateButtons = (): SmartButton[] => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const thisWeekend = new Date(today);
    thisWeekend.setDate(today.getDate() + (6 - today.getDay())); // This Saturday
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (8 - today.getDay())); // Next Monday

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return [
      {
        id: 'custom-date',
        label: 'Custom',
        description: 'Select any date or dates'
      },
      {
        id: 'today',
        label: 'Today',
        description: formatDate(today)
      },
      {
        id: 'tomorrow',
        label: 'Tomorrow',
        description: formatDate(tomorrow)
      },
      {
        id: 'this-saturday',
        label: 'This Saturday',
        description: formatDate(thisWeekend)
      },
      {
        id: 'next-monday',
        label: 'Next Monday',
        description: formatDate(nextMonday)
      }
    ];
  };

  // Time picker state
  const [timePickerState, setTimePickerState] = useState({
    hour: '',
    minute: '',
    ampm: '',
    activeDropdown: '' // 'hour', 'minute', 'ampm', or ''
  });

  // Time picker options
  const getHourOptions = () => {
    const hours = [];
    for (let i = 1; i <= 12; i++) {
      hours.push(i.toString());
    }
    return hours;
  };

  const getMinuteOptions = () => ['00', '15', '30', '45'];

  const getAmPmOptions = () => ['AM', 'PM'];



  // Location options with smart suggestions
  const getLocationButtons = (): SmartButton[] => [
    {
      id: 'westfield-park',
      label: 'Westfield Park',
      description: 'Main soccer field, 123 Park Ave'
    },
    {
      id: 'school-field',
      label: 'School Field',
      description: 'Lincoln Elementary field'
    },
    {
      id: 'sports-complex',
      label: 'Sports Complex',
      description: 'City Sports Complex, Field 2'
    },
    {
      id: 'custom-location',
      label: 'Other Location',
      description: 'Enter a different location'
    }
  ];

  // Month options for custom date selection (next 3 months, excluding current month if coming from repeat)
  const getMonthButtons = (): SmartButton[] => {
    const today = new Date();
    const months = [];
    
    // Get the month we just completed (if any)
    const justCompletedMonth = flowContext.eventPreview.selectedMonth;
    
    for (let i = 0; i < 4; i++) { // Look at 4 months to ensure we have 3 options after filtering
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const monthId = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase().replace(' ', '-');
      
      // Skip the month we just completed
      if (monthId === justCompletedMonth) continue;
      
      months.push({
        id: monthId,
        label: monthName.split(' ')[0], // Just the month name
        description: undefined // Remove redundant description
      });
      
      // Stop once we have 3 months
      if (months.length >= 3) break;
    }
    
    // Add "Other month" option
    months.push({
      id: 'other-month',
      label: 'Other month',
      description: undefined
    });
    
    // Add "Other year" option
    months.push({
      id: 'other-year',
      label: 'Other year',
      description: undefined
    });
    
    return months;
  };

  // Get remaining months in current year (for when "Other month" is selected)
  const getRemainingMonthsInYear = (): SmartButton[] => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const remainingMonths = [];
    
    // Get the month we just completed (if any)
    const justCompletedMonth = flowContext.eventPreview.selectedMonth;
    
    // Find the last month shown in the main list (the 3rd month after today)
    const lastShownMonthIndex = today.getMonth() + 2; // +2 because we show 3 months starting from current
    
    // Add only the months that come after the last shown month in the current year
    for (let monthIndex = lastShownMonthIndex + 1; monthIndex < 12; monthIndex++) {
      const month = new Date(currentYear, monthIndex, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const monthId = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase().replace(' ', '-');
      
      // Skip the month we just completed
      if (monthId === justCompletedMonth) continue;
      
      remainingMonths.push({
        id: monthId,
        label: monthName.split(' ')[0], // Just the month name
        description: undefined // Remove redundant description
      });
    }
    
    return remainingMonths;
  };

  // Options for repeating in another month
  const getRepeatAnotherMonthButtons = (): SmartButton[] => [
    {
      id: 'yes-another-month',
      label: 'Yes',
      description: pattern 
          ? "We'll suggest matching days based on your pattern"
          : "Pick any additional dates you need"
    },
    {
      id: 'no-another-month',
      label: 'No',
      description: 'Continue with the selected dates'
    }
  ];

  // Helper function to detect if selected dates follow a day-of-week pattern
  const detectDayOfWeekPattern = (selectedDates: string[]): number[] | null => {
    if (selectedDates.length < 2) return null;
    
    const daysOfWeek = selectedDates.map(dateStr => {
      const date = new Date(dateStr);
      const jsDay = date.getDay(); // 0=Sunday, 1=Monday, etc.
      return jsDay === 0 ? 6 : jsDay - 1; // Convert to Monday-first
    });
    
    // Check if all dates are the same day of week
    const uniqueDays = [...new Set(daysOfWeek)];
    if (uniqueDays.length === 1) {
      return uniqueDays; // Single day pattern (e.g., all Mondays)
    }
    
    // Check if there's a consistent multi-day pattern
    if (uniqueDays.length <= 3 && selectedDates.length >= uniqueDays.length * 2) {
      // Sort the unique days to check for patterns like "Mon/Wed/Fri"
      uniqueDays.sort((a, b) => a - b);
      return uniqueDays;
    }
    
    return null; // No clear pattern
  };

  // Options for same location across all occurrences
  const getRepeatingSameLocationButtons = (): SmartButton[] => [
    {
      id: 'same-location-yes',
      label: 'Same location',
      description: 'All occurrences at the same location'
    },
    {
      id: 'same-location-by-day',
      label: 'Day-based',
      description: 'Set locations by day of week'
    },
    {
      id: 'same-location-no',
      label: 'Custom',
      description: 'Set individual locations for each occurrence'
    }
  ];

  // Options for same time across all occurrences
  const getRepeatingSameTimeButtons = (): SmartButton[] => [
    {
      id: 'same-time-yes',
      label: 'Same time',
      description: 'All occurrences at the same time'
    },
    {
      id: 'same-time-by-day',
      label: 'Day-based',
      description: 'Set times by day of week'
    },
    {
      id: 'same-time-no',
      label: 'Custom',
      description: 'Set individual times for each occurrence'
    }
  ];

  // Get unique days of the week from selected dates for day-based time setting
  const getUniqueDaysOfWeek = (selectedDates: string[]): SmartButton[] => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const uniqueDays = new Set<number>();
    
    selectedDates.forEach(dateStr => {
      // Parse YYYY-MM-DD format explicitly to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      const jsDay = date.getDay();
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to Monday-first
      uniqueDays.add(dayOfWeek);
    });
    
    return Array.from(uniqueDays)
      .sort((a, b) => a - b) // Sort Monday to Sunday
      .map(dayIndex => {
        const dayName = dayNames[dayIndex];
        const datesForThisDay = selectedDates.filter(dateStr => {
          // Parse YYYY-MM-DD format explicitly to avoid timezone issues
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day); // month is 0-indexed
          const jsDay = date.getDay();
          const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
          return dayOfWeek === dayIndex;
        });
        
        return {
          id: `day-${dayIndex}`,
          label: `Set ${dayName}s`,
          description: `${datesForThisDay.length} occurrence${datesForThisDay.length > 1 ? 's' : ''}`
        };
             });
   };

  // Get time period buttons for day-based time selection
  const getTimePeriodButtons = (): SmartButton[] => [
    {
      id: 'morning',
      label: 'Morning',
      description: '8-11 AM'
    },
    {
      id: 'afternoon', 
      label: 'Afternoon',
      description: '12-3 PM'
    },
    {
      id: 'after-school',
      label: 'After School', 
      description: '3-6 PM'
    },
    {
      id: 'evening',
      label: 'Evening',
      description: '6-8 PM'
    }
  ];

  // Get specific dates for a selected month, organized by calendar weeks with proper alignment
  const getMonthDates = (monthId: string) => {
    const [monthStr, yearStr] = monthId.split('-');
    
    // Parse the month from the monthId (e.g., "jul-2025" -> July 2025)
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = monthNames.indexOf(monthStr);
    const year = parseInt(yearStr);
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    const weeks: (SmartButton | null)[][] = [];
    let currentWeek: (SmartButton | null)[] = new Array(7).fill(null); // 7 slots for each day of week
    
    // Generate all dates for the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, monthIndex, day);
      const jsDay = date.getDay(); // 0 = Sunday, 6 = Saturday
      // Convert to Monday-first: Monday=0, Tuesday=1, ..., Sunday=6
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayName = dayNames[dayOfWeek];
      const dayNum = day.toString().padStart(2, '0');
      
      const button: SmartButton = {
        id: `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${dayNum}`,
        label: `${dayName} ${dayNum}`,
        description: undefined
      };
      
      // If it's Monday and we already have a button in the Monday slot, start new week
      if (dayOfWeek === 0 && currentWeek[0] !== null) {
        weeks.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
      
      // Place the button in the correct day-of-week position
      currentWeek[dayOfWeek] = button;
      
      // If it's Sunday, end the current week
      if (dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
    }
    
    // Add any remaining days as the final week
    if (currentWeek.some(day => day !== null)) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const handleButtonSelect = (buttonId: string) => {
    const newContext = {
      ...flowContext,
      selections: {
        ...flowContext.selections,
        [flowContext.step]: buttonId
      }
    };

    // Update step based on selection
    if (flowContext.step === 'initial') {
      if (buttonId === 'event') {
        newContext.step = 'eventCategory';
        newContext.eventPreview.type = 'event';
      } else if (buttonId === 'keeper') {
        newContext.step = 'keeperCategory';
        newContext.eventPreview.type = 'keeper';
      }
    } else if (flowContext.step === 'eventCategory') {
      newContext.eventPreview.category = buttonId;
      if (buttonId === 'sports') {
        newContext.step = 'sportsType';
      } else {
        // For other categories, we'll add their flows later
        newContext.step = 'eventSubtype';
      }
    } else if (flowContext.step === 'sportsType') {
      newContext.step = 'eventType';
      newContext.eventPreview.subtype = buttonId;
    } else if (flowContext.step === 'eventType') {
      newContext.step = 'whichChild';
      newContext.eventPreview.eventType = buttonId;
    } else if (flowContext.step === 'whichChild') {
      // Handle multiple child selection
      const currentSelected = flowContext.eventPreview.selectedChildren || [];
      const isDeselecting = currentSelected.includes(buttonId);
      const newSelected = isDeselecting
        ? currentSelected.filter(id => id !== buttonId)
        : [...currentSelected, buttonId];
      
      newContext.eventPreview.selectedChildren = newSelected;
      
      // Keep the single child field for backward compatibility (use first selected)
      newContext.eventPreview.child = newSelected.length > 0 ? newSelected[0] : undefined;
      
      // Don't automatically advance - let user select multiple children and use the continue button
      newContext.step = 'whichChild';
    } else if (flowContext.step === 'whichChild' && buttonId === 'continue-child-selection') {
      // Handle continue button from child selection
      newContext.step = 'whenDate';
    } else if (flowContext.step === 'whenDate') {
      if (buttonId === 'custom-date') {
        newContext.step = 'customDatePicker';
        newContext.eventPreview.date = 'custom-date-selected';
      } else {
        newContext.step = 'whenTimePeriod';
        newContext.eventPreview.date = buttonId;
      }
    } else if (flowContext.step === 'customDatePicker') {
      if (buttonId === 'other-month') {
        // Show the remaining months in the current year
        setShowOtherMonths(true);
        return; // Don't update flowContext, just show the additional months
      } else if (buttonId === 'other-year') {
        // TODO: Handle other year selection
        return;
      } else {
        // Month selected, now choose specific date(s)
        newContext.step = 'monthPart';
        newContext.eventPreview.selectedMonth = buttonId;
        setShowOtherMonths(false); // Reset the other months display
        
        // If we're coming from 'repeatAnotherMonth' and have a pattern, preselect matching dates
        const existingDates = flowContext.eventPreview.selectedDates || [];
        const pattern = detectDayOfWeekPattern(existingDates);
        
        if (pattern && existingDates.length > 0) {
          // Generate dates for the new month that match the pattern
          const monthWeeks = getMonthDates(buttonId);
          const preselectDates: string[] = [];
          
          monthWeeks.forEach(week => {
            week.forEach(button => {
              if (button) {
                const date = new Date(button.id);
                const jsDay = date.getDay();
                const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
                
                if (pattern.includes(dayOfWeek)) {
                  preselectDates.push(button.id);
                }
              }
            });
          });
          
          newContext.eventPreview.selectedDates = [...existingDates, ...preselectDates];
          newContext.eventPreview.hasPatternPreselection = true;
        } else {
          newContext.eventPreview.selectedDates = existingDates; // Keep existing dates
          newContext.eventPreview.hasPatternPreselection = false;
        }
      }
    } else if (flowContext.step === 'repeatAnotherMonth') {
      if (buttonId === 'yes-another-month') {
        // Go back to month selection to add more dates
        newContext.step = 'customDatePicker';
      } else {
        // Continue to time setup - only show repeatingSameTime if multiple dates
        const selectedDates = flowContext.eventPreview.selectedDates || [];
        newContext.step = selectedDates.length > 1 ? 'repeatingSameTime' : 'whenTimePeriod';
      }
    } else if (flowContext.step === 'repeatingSameTime') {
      if (buttonId === 'same-time-yes') {
        newContext.eventPreview.repeatingSameTime = true;
        newContext.step = 'whenTimePeriod';
      } else if (buttonId === 'same-time-by-day') {
        newContext.eventPreview.repeatingSameTime = false;
        newContext.step = 'dayBasedTimeSelection';
        newContext.eventPreview.dayBasedTimes = {};
        // Set the first day to configure
        const selectedDates = flowContext.eventPreview.selectedDates || [];
        const uniqueDays = getUniqueDaysOfWeek(selectedDates);
        if (uniqueDays.length > 0) {
          const firstDayIndex = parseInt(uniqueDays[0].id.split('-')[1]);
          newContext.eventPreview.currentDayForTime = firstDayIndex;
        }
      } else {
        newContext.eventPreview.repeatingSameTime = false;
        newContext.step = 'customTimeSelection';
      }
    } else if (flowContext.step === 'dayBasedTimeSelection') {
      // This step shows the list of days to set times for
      const dayIndex = parseInt(buttonId.split('-')[1]);
      newContext.eventPreview.currentDayForTime = dayIndex;
      newContext.step = 'daySpecificTime';
          } else if (flowContext.step === 'daySpecificTime') {
      // Store the time for the current day
      const currentDay = flowContext.eventPreview.currentDayForTime!;
      newContext.eventPreview.dayBasedTimes = {
        ...flowContext.eventPreview.dayBasedTimes,
        [currentDay]: buttonId
      };
      
      // Check if we need to set more days
      const selectedDates = flowContext.eventPreview.selectedDates || [];
      const uniqueDays = getUniqueDaysOfWeek(selectedDates);
      const remainingDays = uniqueDays.filter(day => {
        const dayIndex = parseInt(day.id.split('-')[1]);
        return !newContext.eventPreview.dayBasedTimes![dayIndex];
      });
      
      if (remainingDays.length > 0) {
        // More days to set
        newContext.step = 'dayBasedTimeSelection';
      } else {
        // All days have times, continue to location choice
        const selectedDates = flowContext.eventPreview.selectedDates || [];
        newContext.step = selectedDates.length > 1 ? 'repeatingSameLocation' : 'whereLocation';
      }
    } else if (flowContext.step === 'whenTimePeriod') {
      const selectedDates = flowContext.eventPreview.selectedDates || [];
      newContext.step = selectedDates.length > 1 ? 'repeatingSameLocation' : 'whereLocation';
      newContext.eventPreview.time = buttonId;
    } else if (flowContext.step === 'repeatingSameLocation') {
      if (buttonId === 'same-location-yes') {
        newContext.eventPreview.repeatingSameLocation = true;
        newContext.step = 'whereLocation';
      } else if (buttonId === 'same-location-by-day') {
        newContext.eventPreview.repeatingSameLocation = false;
        newContext.step = 'dayBasedLocationSelection';
        newContext.eventPreview.dayBasedLocations = {};
        // Set the first day to configure
        const selectedDates = flowContext.eventPreview.selectedDates || [];
        const uniqueDays = getUniqueDaysOfWeek(selectedDates);
        if (uniqueDays.length > 0) {
          const firstDayIndex = parseInt(uniqueDays[0].id.split('-')[1]);
          newContext.eventPreview.currentDayForLocation = firstDayIndex;
        }
      } else {
        newContext.eventPreview.repeatingSameLocation = false;
        newContext.step = 'customLocationSelection';
      }
    } else if (flowContext.step === 'dayBasedLocationSelection') {
      // This step shows the list of days to set locations for
      const dayIndex = parseInt(buttonId.split('-')[1]);
      newContext.eventPreview.currentDayForLocation = dayIndex;
      newContext.step = 'daySpecificLocation';
    } else if (flowContext.step === 'daySpecificLocation') {
      // Store the location for the current day
      const currentDay = flowContext.eventPreview.currentDayForLocation!;
      newContext.eventPreview.dayBasedLocations = {
        ...flowContext.eventPreview.dayBasedLocations,
        [currentDay]: buttonId
      };
      
      // Check if we need to set more days
      const selectedDates = flowContext.eventPreview.selectedDates || [];
      const uniqueDays = getUniqueDaysOfWeek(selectedDates);
      const remainingDays = uniqueDays.filter(day => {
        const dayIndex = parseInt(day.id.split('-')[1]);
        return !newContext.eventPreview.dayBasedLocations![dayIndex];
      });
      
      if (remainingDays.length > 0) {
        // More days to set
        newContext.step = 'dayBasedLocationSelection';
      } else {
        // All days have locations, continue to notes
        newContext.step = 'eventNotes';
      }
    } else if (flowContext.step === 'whereLocation') {
      newContext.step = 'eventNotes';
      newContext.eventPreview.location = buttonId;
    } else if (flowContext.step === 'eventNotes' && buttonId === 'create-event') {
      newContext.step = 'complete';
      newContext.eventPreview.notes = eventNotes;
      
      // Create the event object(s)
      const baseEvent = {
        eventName: newContext.eventPreview.subtype || 'Event',
        childName: newContext.eventPreview.child ? 
          newContext.eventPreview.child.charAt(0).toUpperCase() + newContext.eventPreview.child.slice(1) : '',
        date: newContext.eventPreview.date || '',
        time: newContext.eventPreview.time || '',
        location: newContext.eventPreview.location || '',
        notes: eventNotes || '',
        eventType: newContext.eventPreview.eventType || '',
        category: newContext.eventPreview.category || ''
      };

      // Handle multiple dates if they exist (recurring events)
      const events = newContext.eventPreview.selectedDates && newContext.eventPreview.selectedDates.length > 0
        ? newContext.eventPreview.selectedDates.map(date => {
            let eventTime = baseEvent.time;
            let eventLocation = baseEvent.location;
            
            // Parse YYYY-MM-DD format explicitly to avoid timezone issues
            const [year, month, day] = date.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day);
            const jsDay = eventDate.getDay();
            const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to Monday-first
            
            // If we have day-based times, use the specific time for this date's day of week
            if (newContext.eventPreview.dayBasedTimes) {
              const dayTime = newContext.eventPreview.dayBasedTimes[dayOfWeek];
              if (dayTime) {
                eventTime = dayTime;
              }
            }
            
            // If we have day-based locations, use the specific location for this date's day of week
            if (newContext.eventPreview.dayBasedLocations) {
              const dayLocation = newContext.eventPreview.dayBasedLocations[dayOfWeek];
              if (dayLocation) {
                eventLocation = dayLocation;
              }
            }
            
            return { ...baseEvent, date, time: eventTime, location: eventLocation };
          })
        : [baseEvent];

      setCreatedEvents(events);
      setCurrentEventIndex(0);
      setShowConfirmation(true);
      
      // Here you would typically save the event(s) to your backend/store
      console.log('Creating event(s) with details:', events);
    }

    setFlowContext(newContext);
    
    // Reset showOtherMonths when leaving customDatePicker step
    if (flowContext.step === 'customDatePicker' && newContext.step !== 'customDatePicker') {
      setShowOtherMonths(false);
    }
  };

  const getCurrentButtons = () => {
    switch (flowContext.step) {
      case 'initial':
        return getInitialButtons();
      case 'eventCategory':
        return getEventCategoryButtons();
      case 'sportsType':
        return []; // Will be handled by custom sports layout
      case 'eventType':
        return getSportsEventTypeButtons();
      case 'whichChild':
        return getChildButtons();
      case 'whenDate':
        return getDateButtons();
      case 'customDatePicker':
        return getMonthButtons();
      case 'monthPart':
        return []; // Will use custom layout with sections
      case 'repeatAnotherMonth':
        return getRepeatAnotherMonthButtons();
      case 'repeatingSameTime':
        return getRepeatingSameTimeButtons();
      case 'dayBasedTimeSelection':
        return []; // Will use custom layout with inactive/active states
      case 'daySpecificTime':
        return []; // Will use time picker like whenTimePeriod
      case 'whenTimePeriod':
        return []; // Will use custom layout with time categories
      case 'repeatingSameLocation':
        return getRepeatingSameLocationButtons();
      case 'dayBasedLocationSelection':
        return []; // Will use custom layout with inactive/active states
      case 'daySpecificLocation':
        return getLocationButtons();
      case 'whereLocation':
        return getLocationButtons();
      case 'eventNotes':
        return [
          {
            id: 'create-event',
            label: 'Create Event',
            description: 'Save this event to your calendar'
          }
        ];
      default:
        return [];
    }
  };

  const getCurrentQuestion = () => {
    switch (flowContext.step) {
      case 'initial':
        return "What would you like to add?";
      case 'eventCategory':
        return "Event type";
      case 'sportsType':
        return "";
      case 'eventType':
        return "What type of soccer event?";
      case 'whichChild':
        return "Which child is this for?";
      case 'whenDate':
        const sport = flowContext.eventPreview.subtype || 'soccer';
        const eventType = flowContext.eventPreview.eventType || 'game';
        return `${sport.charAt(0).toUpperCase() + sport.slice(1)} ${eventType} dates`;
      case 'customDatePicker':
        return "Which month?";
      case 'monthPart':
        const selectedMonth = flowContext.eventPreview.selectedMonth || '';
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const [monthStr, yearStr] = selectedMonth.split('-');
        const monthIndex = monthNames.indexOf(monthStr);
        const monthName = monthIndex >= 0 ? fullMonthNames[monthIndex] : 'the month';
        const year = yearStr || new Date().getFullYear();
        
        return `${monthName} ${year}`;
      case 'repeatAnotherMonth':
        return "Is this event recurring in another month?";
      case 'repeatingSameTime':
        return "Multi-Event Times";
      case 'dayBasedTimeSelection':
        const dayBasedTimes = flowContext.eventPreview.dayBasedTimes || {};
        const selectedDates = flowContext.eventPreview.selectedDates || [];
        const uniqueDays = getUniqueDaysOfWeek(selectedDates);
        const remainingDays = uniqueDays.filter(day => {
          const dayIndex = parseInt(day.id.split('-')[1]);
          return !dayBasedTimes[dayIndex];
        });
        return remainingDays.length === uniqueDays.length 
          ? 'Set times for each day of the week'
          : 'Select time for next day:';
      case 'daySpecificTime':
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const currentDay = flowContext.eventPreview.currentDayForTime;
        return `What time for ${dayNames[currentDay!]}?`;
      case 'whenTimePeriod':
        const sportTime = flowContext.eventPreview.subtype || 'soccer';
        const eventTypeTime = flowContext.eventPreview.eventType || 'game';
        return `${sportTime.charAt(0).toUpperCase() + sportTime.slice(1)} ${eventTypeTime} time`;
      case 'whenSpecificTime':
        return "What specific time?";
      case 'repeatingSameLocation':
        return "Multi-Event Locations";
      case 'dayBasedLocationSelection':
        const dayBasedLocations = flowContext.eventPreview.dayBasedLocations || {};
        const selectedDatesForLocation = flowContext.eventPreview.selectedDates || [];
        const uniqueDaysForLocation = getUniqueDaysOfWeek(selectedDatesForLocation);
        const remainingDaysForLocation = uniqueDaysForLocation.filter(day => {
          const dayIndex = parseInt(day.id.split('-')[1]);
          return !dayBasedLocations[dayIndex];
        });
        return remainingDaysForLocation.length === uniqueDaysForLocation.length 
          ? 'Set locations for each day of the week'
          : 'Select location for next day:';
      case 'daySpecificLocation':
        const dayNamesForLocation = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const currentDayForLocation = flowContext.eventPreview.currentDayForLocation;
        return `What location for ${dayNamesForLocation[currentDayForLocation!]}?`;
      case 'whereLocation':
        return "Event Location";
      case 'eventNotes':
        return "Notes (optional)";
      case 'complete':
        return "Ready to create your event!";
      default:
        return "Next step...";
    }
  };

  const currentButtons = getCurrentButtons();
  const currentQuestion = getCurrentQuestion();

  // Small uniform teal button component with single-line description
  const SmartActionButton = ({ button, onClick }: { button: SmartButton; onClick: () => void }) => {
    const [hovered, setHovered] = React.useState(false);
    const [pressed, setPressed] = React.useState(false);
    const [focused, setFocused] = React.useState(false);

    const getButtonStyle = () => {
      // Use child color if this is a child selection button
      const isChildButton = flowContext.step === 'whichChild';
      const buttonColor = isChildButton ? getChildColor(button.id) : '#217e8f';
      
      let s = {
        width: '90px',
        padding: '5px 8px',
        border: isChildButton ? '1px solid #9ca3af' : 'none',
        boxSizing: 'border-box' as const,
        borderRadius: '5px',
        fontWeight: isChildButton ? 600 : 400,
        fontSize: '12px',
        lineHeight: '14px',
        background: buttonColor,
        color: isChildButton ? '#374151' : '#ffffff',
        outline: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        textAlign: 'center' as const,
        display: 'flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
      } as React.CSSProperties;
      
      if (hovered || focused) {
        // Darken the button color for hover state
        const hoverColor = isChildButton ? 
          (button.id === 'emma' ? '#e6c299' : // Darker orange
           button.id === 'alex' ? '#a0d4db' : // Darker blue  
           button.id === 'leo' ? '#9ff0c4' : // Darker green
           '#1a6e7e') : '#1a6e7e'; // Default darker teal
        
        s = {
          ...s,
          background: hoverColor,
          border: isChildButton ? '1px solid #6b7280' : 'none', // Darker gray border on hover
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
        };
      }
      if (pressed) {
        s = { 
          ...s, 
          transform: 'scale(0.95)'
        };
      }
      return s;
    };

    return (
      <div>
        <button
          style={getButtonStyle()}
          onClick={onClick}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => { setPressed(false); setHovered(false); }}
          onMouseOver={() => setHovered(true)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setPressed(false); }}
          className="transition focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
        >
          {button.label}
        </button>
        {button.description && (
          <div className="text-sm text-gray-500 mt-1">
            {button.description}
          </div>
        )}
      </div>
    );
  };

  // Light day colors for date buttons (Monday-first ROYGBIV order, shifted to fix display)
  const dayColors: { [key: number]: string } = {
    0: '#ffd8b580', // Monday - Red/Pink (shift from Tuesday position)
    1: '#fde68a80', // Tuesday - Orange (shift from Wednesday position)
    2: '#bbf7d080', // Wednesday - Yellow (shift from Thursday position)
    3: '#c0e2e780', // Thursday - Green (shift from Friday position)
    4: '#d1d5fa80', // Friday - Blue (shift from Saturday position)
    5: '#e9d5ff80', // Saturday - Indigo (shift from Sunday position)
    6: '#f8b6c280', // Sunday - Violet (shift from Monday position)
  };

  // Small date button component for condensed date selection
  // Time picker dropdown button component
  const TimePickerButton = ({ 
    label, 
    value, 
    options, 
    isActive, 
    onToggle, 
    onSelect 
  }: { 
    label: string; 
    value: string; 
    options: string[]; 
    isActive: boolean; 
    onToggle: () => void; 
    onSelect: (option: string) => void; 
  }) => {
    return (
      <div className="relative">
        <button
          onClick={onToggle}
          className="bg-[#217e8f] text-white text-xs font-medium px-2 py-1 rounded-md hover:bg-[#1a6b7a] transition-colors duration-200 min-w-12 text-center"
        >
          {value || label}
        </button>
        
        {isActive && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-12">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => onSelect(option)}
                className="block w-full px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md text-left"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Location selection button component
  const LocationButton = ({ button, onClick }: { button: SmartButton; onClick: () => void }) => {
    return (
      <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
        <button
          onClick={onClick}
          className="bg-[#217e8f] text-white text-xs px-2 py-1 rounded-md hover:bg-[#1a6b7a] transition-colors duration-200 flex-shrink-0"
        >
          Select
        </button>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{button.label}</div>
          {button.description && (
            <div className="text-xs text-gray-500 mt-1">{button.description}</div>
          )}
        </div>
      </div>
    );
  };

  const SmallDateButton = ({ 
    button, 
    onClick, 
    isSelected = false, 
    isRepeatingMode = false 
  }: { 
    button: SmartButton; 
    onClick: () => void; 
    isSelected?: boolean; 
    isRepeatingMode?: boolean; 
  }) => {
    // Check if any dates are selected to determine if we should fade unselected ones
    const hasAnySelection = (flowContext.eventPreview.selectedDates?.length || 0) > 0;
    const shouldFade = hasAnySelection && !isSelected;
    const [hovered, setHovered] = React.useState(false);
    const [pressed, setPressed] = React.useState(false);
    const [focused, setFocused] = React.useState(false);

    // Extract day of week from button ID (YYYY-MM-DD format)
    const buttonDate = new Date(button.id);
    const jsDay = buttonDate.getDay(); // 0=Sunday, 1=Monday, etc.
    // Convert to Monday-first: Monday=0, Tuesday=1, ..., Sunday=6
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
    const dayColor = dayColors[dayOfWeek];

    const getButtonStyle = () => {
      let s = {
        width: '100%',
        height: '32px',
        padding: '4px 2px',
        border: isSelected ? '3px solid #217e8f' : '1px solid #9ca3af',
        boxSizing: 'border-box' as const,
        borderRadius: '4px',
        fontWeight: 600,
        fontSize: '10px',
        lineHeight: '12px',
        background: isSelected 
          ? (() => {
              // Medium day colors for selection (shifted to match default colors)
              const selectedDayColors: { [key: number]: string } = {
                0: '#ffd8b5', // Monday - Red/Pink (shifted from Tuesday position)
                1: '#fde68a', // Tuesday - Orange (shifted from Wednesday position)
                2: '#bbf7d0', // Wednesday - Yellow (shifted from Thursday position)
                3: '#c0e2e7', // Thursday - Green (shifted from Friday position)
                4: '#d1d5fa', // Friday - Blue (shifted from Saturday position)
                5: '#e9d5ff', // Saturday - Indigo (shifted from Sunday position)
                6: '#f8b6c2', // Sunday - Violet (shifted from Monday position)
              };
              return selectedDayColors[dayOfWeek];
            })()
          : shouldFade
          ? (() => {
              // Extra faded colors when other dates are selected
              const fadedDayColors: { [key: number]: string } = {
                0: '#ffd8b540', // Monday - Very faded
                1: '#fde68a40', // Tuesday - Very faded
                2: '#bbf7d040', // Wednesday - Very faded
                3: '#c0e2e740', // Thursday - Very faded
                4: '#d1d5fa40', // Friday - Very faded
                5: '#e9d5ff40', // Saturday - Very faded
                6: '#f8b6c240', // Sunday - Very faded
              };
              return fadedDayColors[dayOfWeek];
            })()
          : dayColor,
        color: '#374151', // Always use gray text
        outline: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        boxShadow: isSelected ? '0 2px 6px rgba(33,126,143,0.3)' : '0 1px 2px rgba(0,0,0,0.08)',
        textAlign: 'center' as const,
        display: 'flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
      } as React.CSSProperties;
      
      if (hovered || focused) {
        // Medium colors for hover state (shifted to match default colors)
        const hoverDayColors: { [key: number]: string } = {
          0: '#ffd8b5', // Monday - Red/Pink (shifted from Tuesday position)
          1: '#fde68a', // Tuesday - Orange (shifted from Wednesday position)
          2: '#bbf7d0', // Wednesday - Yellow (shifted from Thursday position)
          3: '#c0e2e7', // Thursday - Green (shifted from Friday position)
          4: '#d1d5fa', // Friday - Blue (shifted from Saturday position)
          5: '#e9d5ff', // Saturday - Indigo (shifted from Sunday position)
          6: '#f8b6c2', // Sunday - Violet (shifted from Monday position)
        };
        
        // If this date should be faded but is being hovered, show normal hover color
        const hoverColor = shouldFade && !isSelected ? hoverDayColors[dayOfWeek] : hoverDayColors[dayOfWeek];
        
        s = {
          ...s,
          background: hoverColor,
          border: isSelected ? '3px solid #217e8f' : '1px solid #6b7280',
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
        };
      }
      if (pressed) {
        s = { 
          ...s, 
          transform: 'scale(0.95)'
        };
      }
      return s;
    };

    return (
      <button
        style={getButtonStyle()}
        onClick={onClick}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => { setPressed(false); setHovered(false); }}
        onMouseOver={() => setHovered(true)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setPressed(false); }}
        className="transition focus:outline-none focus:ring-1 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
      >
        {button.label}
      </button>
    );
  };

  // Child selection button component with selection styling
  const ChildSelectionButton = ({ 
    button, 
    onClick, 
    isSelected = false 
  }: { 
    button: SmartButton; 
    onClick: () => void; 
    isSelected?: boolean; 
  }) => {
    // Check if any children are selected to determine if we should fade unselected ones
    const hasAnySelection = (flowContext.eventPreview.selectedChildren?.length || 0) > 0;
    const shouldFade = hasAnySelection && !isSelected;
    const [hovered, setHovered] = React.useState(false);
    const [pressed, setPressed] = React.useState(false);
    const [focused, setFocused] = React.useState(false);

    const getButtonStyle = () => {
      const childColor = getChildColor(button.id);
      
      let s = {
        width: '90px',
        padding: '5px 8px',
        border: isSelected ? '3px solid #217e8f' : '1px solid #9ca3af',
        boxSizing: 'border-box' as const,
        borderRadius: '5px',
        fontWeight: 600,
        fontSize: '12px',
        lineHeight: '14px',
        background: shouldFade 
          ? (() => {
              // Extra faded colors when other children are selected
              const fadedColors: { [key: string]: string } = {
                'emma': '#ffd8b540', // Very faded orange
                'alex': '#c0e2e740',  // Very faded blue
                'leo': '#bbf7d040',   // Very faded green
              };
              return fadedColors[button.id] || childColor + '40';
            })()
          : childColor,
        color: '#374151', // Always use gray text
        outline: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        boxShadow: isSelected ? '0 2px 6px rgba(33,126,143,0.3)' : '0 1px 2px rgba(0,0,0,0.08)',
        textAlign: 'center' as const,
        display: 'flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
      } as React.CSSProperties;
      
      if (hovered || focused) {
        // If this child should be faded but is being hovered, show normal hover color
        const hoverColor = shouldFade && !isSelected ? childColor : childColor;
        
        s = {
          ...s,
          background: hoverColor,
          border: isSelected ? '3px solid #217e8f' : '1px solid #6b7280',
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
        };
      }
      if (pressed) {
        s = { 
          ...s, 
          transform: 'scale(0.95)'
        };
      }
      return s;
    };

    return (
      <div>
        <button
          style={getButtonStyle()}
          onClick={onClick}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => { setPressed(false); setHovered(false); }}
          onMouseOver={() => setHovered(true)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setPressed(false); }}
          className="transition focus:outline-none focus:ring-1 focus:ring-[#c0e2e7] focus:ring-offset-1 active:scale-95"
        >
          {button.label}
        </button>
        {button.description && (
          <div className="text-sm text-gray-500 mt-1">
            {button.description}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Global Header */}
      <GlobalHeader />
      
      {/* Global Subheader */}
      <GlobalSubheader 
        icon={<Settings />}
        title="Smart Button Playground"
      />

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto px-4 py-6 pb-24"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          height: '0' // Forces flex-1 to work properly with overflow
        }}
      >
                <div className="max-w-md mx-auto">
          
          {/* Section Header */}
          <div className="flex items-end justify-between mb-2">
            <div className="ml-1">
              <h2 className="text-sm font-medium text-gray-600">
                {currentQuestion}
              </h2>
            </div>
            
            {/* Go back button for event type selection */}
            {flowContext.step === 'eventType' && (
              <button
                onClick={() => setFlowContext({ step: 'sportsType', selections: { type: 'event', category: 'sports' }, eventPreview: { type: 'event', category: 'sports' } })}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Select other sport
              </button>
            )}
            
            {/* Go back button for child selection */}
            {flowContext.step === 'whichChild' && (
              <button
                onClick={() => {
                  // Go back to event type selection, preserving the selected sport
                  const selectedSport = flowContext.eventPreview.subtype || 'soccer';
                  setFlowContext({ 
                    step: 'eventType', 
                    selections: { 
                      type: 'event', 
                      category: 'sports', 
                      subtype: selectedSport 
                    }, 
                    eventPreview: { 
                      type: 'event', 
                      category: 'sports', 
                      subtype: selectedSport 
                    } 
                  });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← {flowContext.eventPreview.subtype ? 
                  `${flowContext.eventPreview.subtype.charAt(0).toUpperCase() + flowContext.eventPreview.subtype.slice(1)} event type` : 
                  'Soccer event type'}
              </button>
            )}
            
            {/* Go back button for date selection */}
            {flowContext.step === 'whenDate' && (
              <button
                onClick={() => {
                  // Go back to child selection, preserving previous selections
                  setFlowContext({
                    ...flowContext,
                    step: 'whichChild'
                  });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Select other child
              </button>
            )}
            
            {/* Go back button for custom date picker */}
            {flowContext.step === 'customDatePicker' && (
              <button
                onClick={() => {
                  // Go back to date selection, preserving previous selections
                  setFlowContext({
                    ...flowContext,
                    step: 'whenDate'
                  });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← {(() => {
                  const sport = flowContext.eventPreview.subtype || 'soccer';
                  const eventType = flowContext.eventPreview.eventType || 'game';
                  return `${sport.charAt(0).toUpperCase() + sport.slice(1)} ${eventType} quick dates`;
                })()}
              </button>
            )}
            
            {/* Go back button for month part (specific date selection) */}
            {flowContext.step === 'monthPart' && (
              <button
                onClick={() => {
                  // Go back to month selection, preserving previous selections
                  setFlowContext({
                    ...flowContext,
                    step: 'customDatePicker'
                  });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Select different month
              </button>
            )}
            
            {/* Go back button for time selection */}
            {flowContext.step === 'whenTimePeriod' && (
              <button
                onClick={() => {
                  // Go back to date selection, preserving previous selections
                  setFlowContext({
                    ...flowContext,
                    step: 'whenDate'
                  });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Select other dates
              </button>
            )}
            
            {/* Go back button for location selection */}
            {flowContext.step === 'whereLocation' && (
              <button
                onClick={() => {
                  // Go back to time selection, preserving previous selections
                  setFlowContext({
                    ...flowContext,
                    step: 'whenTimePeriod'
                  });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Change time
              </button>
            )}
            
            {/* Go back button for notes */}
            {flowContext.step === 'eventNotes' && (
              <button
                onClick={() => {
                  // Go back to location selection, preserving previous selections
                  setFlowContext({
                    ...flowContext,
                    step: 'whereLocation'
                  });
                }}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Change location
              </button>
            )}
            
            {/* General go back to create keeper button for other steps */}
            {!['initial', 'sportsType', 'eventType', 'whichChild', 'whenDate', 'customDatePicker', 'monthPart', 'whenTimePeriod', 'whereLocation', 'eventNotes'].includes(flowContext.step) && (
              <button
                onClick={() => setFlowContext({ step: 'initial', selections: {}, eventPreview: {} })}
                className="text-[#217e8f] text-xs hover:underline"
              >
                ← Go back to create keeper
              </button>
            )}

            {flowContext.step === 'customDatePicker' && flowContext.eventPreview.selectedMonth && (
              <button
                onClick={() => {
                  // Go back to edit the previous month
                  const newContext = {
                    ...flowContext,
                    step: 'monthPart',
                    eventPreview: {
                      ...flowContext.eventPreview,
                      hasPatternPreselection: false
                    }
                  };
                  setFlowContext(newContext);
                }}
                className="text-xs font-medium text-[#217e8f] hover:text-[#1a6e7e] transition-colors"
              >
                {(() => {
                  const monthId = flowContext.eventPreview.selectedMonth || '';
                  const [monthStr] = monthId.split('-');
                  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                  const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                  const monthIndex = monthNames.indexOf(monthStr);
                  const monthName = monthIndex >= 0 ? fullMonthNames[monthIndex] : 'Previous';
                  return `← Go back to ${monthName}`;
                })()}
              </button>
            )}
            {flowContext.step === 'monthPart' && (
              <button
                onClick={() => {
                  // Continue to next step with selected dates
                  const selectedDates = flowContext.eventPreview.selectedDates || [];
                  if (selectedDates.length > 0) {
                                      const newContext = {
                    ...flowContext,
                    step: selectedDates.length > 1 ? 'repeatAnotherMonth' : 'whenTimePeriod',
                    eventPreview: {
                      ...flowContext.eventPreview,
                      date: selectedDates.join(', '),
                      isRepeating: selectedDates.length > 1
                    }
                  };
                    setFlowContext(newContext);
                  }
                }}
                disabled={!flowContext.eventPreview.selectedDates?.length}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  flowContext.eventPreview.selectedDates?.length 
                    ? 'bg-[#217e8f] text-white hover:bg-[#1a6e7e]' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {(() => {
                  const count = flowContext.eventPreview.selectedDates?.length || 0;
                  if (count === 0) return 'Select date(s)';
                  if (count === 1) return 'Date selected';
                  return 'Dates selected';
                })()}
              </button>
            )}
          </div>

          {/* Smart Buttons Card */}
          {flowContext.step === 'sportsType' ? (
            // Two separate cards for sports selection
            <>
              {/* Your family's sports section */}
              <div className="flex items-end justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 ml-1">Your family's sports</h3>
                <button
                  onClick={() => setFlowContext({ step: 'eventCategory', selections: { type: 'event' }, eventPreview: { type: 'event' } })}
                  className="text-[#217e8f] text-xs hover:underline"
                >
                  ← Event type
                </button>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="space-y-3">
                  {getPersonalizedSports().map((button: SmartButton) => (
                    <SmartActionButton
                      key={button.id}
                      button={button}
                      onClick={() => handleButtonSelect(button.id)}
                    />
                  ))}
                </div>
              </div>
              
              {/* All sports section */}
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-600 ml-1">All sports</h3>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
                <div className="space-y-3">
                  {getAllSportsAlphabetical().map((button: SmartButton) => (
                    <SmartActionButton
                      key={button.id}
                      button={button}
                      onClick={() => handleButtonSelect(button.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : flowContext.step === 'whenTimePeriod' || flowContext.step === 'daySpecificTime' ? (
            // Time picker with dropdowns
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex justify-center gap-4">
                <TimePickerButton
                  label="Hour"
                  value={timePickerState.hour}
                  options={getHourOptions()}
                  isActive={timePickerState.activeDropdown === 'hour'}
                  onToggle={() => setTimePickerState(prev => ({ 
                    ...prev, 
                    activeDropdown: prev.activeDropdown === 'hour' ? '' : 'hour' 
                  }))}
                  onSelect={(hour) => {
                    setTimePickerState(prev => ({ ...prev, hour, activeDropdown: '' }));
                    // Check if we have all components to proceed
                    if (timePickerState.minute && timePickerState.ampm) {
                      const timeString = `${hour}:${timePickerState.minute} ${timePickerState.ampm}`;
                      handleButtonSelect(timeString.toLowerCase().replace(' ', '').replace(':', ''));
                    }
                  }}
                />
                
                <TimePickerButton
                  label="Minute"
                  value={timePickerState.minute}
                  options={getMinuteOptions()}
                  isActive={timePickerState.activeDropdown === 'minute'}
                  onToggle={() => setTimePickerState(prev => ({ 
                    ...prev, 
                    activeDropdown: prev.activeDropdown === 'minute' ? '' : 'minute' 
                  }))}
                  onSelect={(minute) => {
                    setTimePickerState(prev => ({ ...prev, minute, activeDropdown: '' }));
                    // Check if we have all components to proceed
                    if (timePickerState.hour && timePickerState.ampm) {
                      const timeString = `${timePickerState.hour}:${minute} ${timePickerState.ampm}`;
                      handleButtonSelect(timeString.toLowerCase().replace(' ', '').replace(':', ''));
                    }
                  }}
                />
                
                <TimePickerButton
                  label="AM/PM"
                  value={timePickerState.ampm}
                  options={getAmPmOptions()}
                  isActive={timePickerState.activeDropdown === 'ampm'}
                  onToggle={() => setTimePickerState(prev => ({ 
                    ...prev, 
                    activeDropdown: prev.activeDropdown === 'ampm' ? '' : 'ampm' 
                  }))}
                  onSelect={(ampm) => {
                    setTimePickerState(prev => ({ ...prev, ampm, activeDropdown: '' }));
                    // Check if we have all components to proceed
                    if (timePickerState.hour && timePickerState.minute) {
                      const timeString = `${timePickerState.hour}:${timePickerState.minute} ${ampm}`;
                      handleButtonSelect(timeString.toLowerCase().replace(' ', '').replace(':', ''));
                    }
                  }}
                />
              </div>
            </div>
          ) : flowContext.step === 'customDatePicker' ? (
            // Month selection for custom dates with expandable layout
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8 relative">
              <div className="text-sm font-medium text-gray-600 mb-4">
                {new Date().getFullYear()} <span className="text-xs font-normal text-gray-400">(Current year)</span>
              </div>
              <div className={`${showOtherMonths ? 'grid grid-cols-2 gap-6' : ''}`}>
                {/* Main month buttons (left column or full width) */}
                <div className="space-y-3 flex flex-col items-center">
                  {getMonthButtons().map((button) => (
                    <SmartActionButton
                      key={button.id}
                      button={button}
                      onClick={() => handleButtonSelect(button.id)}
                    />
                  ))}
                </div>
                
                {/* Additional months (right column, only shown when Other month is selected) */}
                {showOtherMonths && (
                  <div className="space-y-3 flex flex-col items-center">
                    {getRemainingMonthsInYear().map((button) => (
                      <SmartActionButton
                        key={button.id}
                        button={button}
                        onClick={() => handleButtonSelect(button.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : flowContext.step === 'monthPart' ? (
            // Custom date layout organized by calendar weeks
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8 relative">
              {!flowContext.eventPreview.hasPatternPreselection && (
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 leading-none whitespace-nowrap">
                  Select one date or many for this event
                </div>
              )}
              {flowContext.eventPreview.hasPatternPreselection && (
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 leading-none whitespace-nowrap">
                  Matching days preselected - tap to deselect
                </div>
              )}
              {(() => {
                const monthWeeks = getMonthDates(flowContext.eventPreview.selectedMonth || '');
                return (
                  <>
                    {monthWeeks.map((week, weekIndex) => (
                      <div key={weekIndex} className={weekIndex > 0 ? "mt-3" : ""}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Week {weekIndex + 1}</h4>
                        <div className="grid grid-cols-7 gap-1">
                          {week.map((button, dayIndex) => (
                            button ? (
                              <SmallDateButton
                                key={button.id}
                                button={button}
                                isSelected={flowContext.eventPreview.selectedDates?.includes(button.id)}
                                isRepeatingMode={true}
                                onClick={() => {
                                  // Always handle multiple selection in monthPart
                                  const currentSelected = flowContext.eventPreview.selectedDates || [];
                                  const isDeselecting = currentSelected.includes(button.id);
                                  const newSelected = isDeselecting
                                    ? currentSelected.filter(id => id !== button.id)
                                    : [...currentSelected, button.id];
                                  
                                  const newContext = {
                                    ...flowContext,
                                    eventPreview: {
                                      ...flowContext.eventPreview,
                                      selectedDates: newSelected,
                                      // Clear the pattern preselection flag if user deselects any date
                                      hasPatternPreselection: isDeselecting ? false : flowContext.eventPreview.hasPatternPreselection
                                    }
                                  };
                                  setFlowContext(newContext);
                                }}
                              />
                            ) : (
                              <div key={dayIndex} className="h-8"></div>
                            )
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          ) : flowContext.step === 'whereLocation' ? (
            // Location selection with Select buttons
            <div className="bg-white rounded-lg shadow-sm px-4 py-2 mb-8">
              {currentButtons.map((button) => (
                <LocationButton
                  key={button.id}
                  button={button}
                  onClick={() => handleButtonSelect(button.id)}
                />
              ))}
            </div>
          ) : flowContext.step === 'eventNotes' ? (
            // Notes input with Create Event button
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <textarea
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                placeholder="Add any notes about this event (optional)..."
                className="w-full p-3 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] focus:border-transparent"
                rows={3}
              />
              <div className="mt-4">
                {currentButtons.map((button) => (
                  <div key={button.id} className="flex items-center gap-3">
                    <button
                      onClick={() => handleButtonSelect(button.id)}
                      className="bg-[#217e8f] text-white text-xs px-2 py-1 rounded-md hover:bg-[#1a6b7a] transition-colors duration-200"
                    >
                      {button.label}
                    </button>
                    {button.description && (
                      <span className="text-sm text-gray-500">{button.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : flowContext.step === 'dayBasedTimeSelection' ? (
            // Day-based time selection with inactive/active states
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <div className="space-y-3">
                {(() => {
                  const selectedDates = flowContext.eventPreview.selectedDates || [];
                  const uniqueDays = getUniqueDaysOfWeek(selectedDates);
                  const dayBasedTimes = flowContext.eventPreview.dayBasedTimes || {};
                  
                  return uniqueDays.map((dayButton) => {
                    const dayIndex = parseInt(dayButton.id.split('-')[1]);
                    const isCompleted = !!dayBasedTimes[dayIndex];
                    
                    return (
                      <div key={dayButton.id} className="flex items-center gap-3">
                        <button
                          onClick={() => !isCompleted && handleButtonSelect(dayButton.id)}
                          disabled={isCompleted}
                          className={`
                            ${isCompleted 
                              ? 'bg-[#c0e2e7] text-gray-600 cursor-not-allowed opacity-60' 
                              : 'bg-[#217e8f] text-white hover:bg-[#1a6b7a]'
                            }
                            text-xs px-2 py-1 rounded-md transition-colors duration-200 w-[90px]
                          `}
                        >
                          {isCompleted 
                            ? `${dayButton.label.replace('Set ', '')} set`
                            : dayButton.label
                          }
                        </button>
                                                  <span className="text-sm text-gray-500">{dayButton.description}</span>
                        {isCompleted && (
                          <button
                            onClick={() => handleButtonSelect(dayButton.id)}
                            className="text-[#217e8f] text-xs hover:text-[#1a6b7a] transition-colors duration-200 ml-1"
                          >
                            Edit {dayButton.label.replace('Set ', '')}
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : flowContext.step === 'dayBasedLocationSelection' ? (
            // Day-based location selection with inactive/active states
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <div className="space-y-3">
                {(() => {
                  const selectedDates = flowContext.eventPreview.selectedDates || [];
                  const uniqueDays = getUniqueDaysOfWeek(selectedDates);
                  const dayBasedLocations = flowContext.eventPreview.dayBasedLocations || {};
                  
                  return uniqueDays.map((dayButton) => {
                    const dayIndex = parseInt(dayButton.id.split('-')[1]);
                    const isCompleted = !!dayBasedLocations[dayIndex];
                    
                    return (
                      <div key={dayButton.id} className="flex items-center gap-3">
                        <button
                          onClick={() => !isCompleted && handleButtonSelect(dayButton.id)}
                          disabled={isCompleted}
                          className={`
                            ${isCompleted 
                              ? 'bg-[#c0e2e7] text-gray-600 cursor-not-allowed opacity-60' 
                              : 'bg-[#217e8f] text-white hover:bg-[#1a6b7a]'
                            }
                            text-xs px-2 py-1 rounded-md transition-colors duration-200 w-[90px]
                          `}
                        >
                          {isCompleted 
                            ? `${dayButton.label.replace('Set ', '')} set`
                            : dayButton.label
                          }
                        </button>
                        <span className="text-sm text-gray-500">{dayButton.description}</span>
                        {isCompleted && (
                          <button
                            onClick={() => handleButtonSelect(dayButton.id)}
                            className="text-[#217e8f] text-xs hover:text-[#1a6b7a] transition-colors duration-200 ml-1"
                          >
                            Edit {dayButton.label.replace('Set ', '')}
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : flowContext.step === 'whichChild' ? (
            // Child selection with multi-select and continue button
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <div className="text-center mb-4">
                <div className="text-[10px] text-gray-400 leading-none">
                  Select one child or more for this event
                </div>
              </div>
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-3 flex-1">
                  {currentButtons.map((button) => (
                    <ChildSelectionButton
                      key={button.id}
                      button={button}
                      isSelected={flowContext.eventPreview.selectedChildren?.includes(button.id) || false}
                      onClick={() => handleButtonSelect(button.id)}
                    />
                  ))}
                </div>
                <button
                  onClick={() => {
                    const selectedChildren = flowContext.eventPreview.selectedChildren || [];
                    if (selectedChildren.length > 0) {
                      setFlowContext({
                        ...flowContext,
                        step: 'whenDate'
                      });
                    }
                  }}
                  disabled={!flowContext.eventPreview.selectedChildren?.length}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ml-4 ${
                    flowContext.eventPreview.selectedChildren?.length 
                      ? 'bg-[#217e8f] text-white hover:bg-[#1a6e7e]' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {(() => {
                    const count = flowContext.eventPreview.selectedChildren?.length || 0;
                    if (count === 0) return 'Select child(ren)';
                    if (count === 1) return 'Child selected';
                    return 'Children selected';
                  })()}
                </button>
              </div>
            </div>
          ) : (
            // Standard button layout for other steps
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <div className="space-y-3">
                {currentButtons.map((button) => (
                  <SmartActionButton
                    key={button.id}
                    button={button}
                    onClick={() => handleButtonSelect(button.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Event Preview (if we have selections) */}
          {Object.keys(flowContext.selections).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Building...</h3>
              <div className="text-sm text-gray-700 space-y-1">
                {flowContext.eventPreview.type && (
                  <div>Type: {flowContext.eventPreview.type}</div>
                )}
                {flowContext.eventPreview.category && (
                  <div>Category: {flowContext.eventPreview.category}</div>
                )}
                {flowContext.eventPreview.subtype && (
                  <div>Sport: {flowContext.eventPreview.subtype}</div>
                )}
                {flowContext.eventPreview.eventType && (
                  <div>Event Type: {flowContext.eventPreview.eventType}</div>
                )}
                {flowContext.eventPreview.selectedChildren && flowContext.eventPreview.selectedChildren.length > 0 && (
                  <div>Children: {flowContext.eventPreview.selectedChildren.join(', ')}</div>
                )}
                {flowContext.eventPreview.child && !flowContext.eventPreview.selectedChildren && (
                  <div>Child: {flowContext.eventPreview.child}</div>
                )}
                {flowContext.eventPreview.date && (
                  <div>Date: {flowContext.eventPreview.date}</div>
                )}
                {flowContext.eventPreview.time && (
                  <div>Time: {flowContext.eventPreview.time}</div>
                )}
                {flowContext.eventPreview.location && (
                  <div>Location: {flowContext.eventPreview.location}</div>
                )}
                {flowContext.eventPreview.notes && (
                  <div>Notes: {flowContext.eventPreview.notes}</div>
                )}
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="bg-white rounded-lg shadow-sm p-4 text-xs text-gray-600">
            <strong>Debug:</strong>
            <pre className="mt-2 whitespace-pre-wrap text-xs">
              {JSON.stringify(flowContext, null, 2)}
            </pre>
          </div>

        </div>
      </main>

      {/* Global Footer */}
      <GlobalFooter
        value=""
        onChange={() => {}}
        placeholder="Or describe what you want to add..."
      />

      {/* Global Chat Drawer */}
      <GlobalChatDrawer
        drawerHeight={storedDrawerHeight || 100}
        onHeightChange={setStoredDrawerHeight}
        scrollContainerRefCallback={(node) => {
          if (node && chatContentScrollRef && 'current' in chatContentScrollRef) {
            chatContentScrollRef.current = node;
          }
        }}
      >
        <div className="h-full bg-white">
          {/* Chat content would go here */}
          <div className="p-4 text-center text-gray-500 text-sm">
            Chat integration coming soon...
          </div>
        </div>
      </GlobalChatDrawer>

      {/* Event Creation Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md ring-2 ring-[#217e8f] rounded-xl">
            {/* Dark Teal Tab Header - Same height as weekly view tabs */}
            <div 
              className="bg-[#217e8f] text-white px-4 py-2 rounded-t-xl relative border-b"
              style={{
                borderBottomColor: '#c0e2e7',
                boxShadow: 'inset 0 8px 15px -3px #0000001A, inset 0 -8px 15px -3px #0000001A'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {createdEvents.length === 1 
                    ? "Your event has been created" 
                    : "Your events have been created"}
                </span>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="text-white hover:text-gray-200 transition-colors flex items-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Event Card with sharp outside corners, rounded inside */}
            <div className="relative h-[240px] w-full">
              {/* White border frame with sharp top corners - thicker border */}
              <div className="absolute inset-0 bg-white" style={{ borderRadius: '0 0 12px 12px' }}></div>
              
              {/* Rounded cutout for the event card - adjusted for top border */}
              <div className="absolute top-3 left-2 right-2 bottom-2 rounded-xl overflow-hidden">
                <EventCard
                  image={getKicacoEventPhoto(createdEvents[currentEventIndex]?.eventName || 'default')}
                  name={createdEvents[currentEventIndex]?.eventName || 'Event'}
                  childName={createdEvents[currentEventIndex]?.childName}
                  date={createdEvents[currentEventIndex]?.date}
                  time={createdEvents[currentEventIndex]?.time}
                  location={createdEvents[currentEventIndex]?.location}
                  notes={createdEvents[currentEventIndex]?.notes}
                  showEventInfo={false}
                />

                {/* Event info overlay - EXACTLY like Daily View */}
                <div className="absolute top-0 left-0 right-0 z-10 h-[56px] backdrop-blur-sm">
                  <div className="flex h-full items-center justify-between px-4">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <StackedChildBadges 
                        childName={createdEvents[currentEventIndex]?.childName} 
                        size="md" 
                        maxVisible={3}
                        className="flex-shrink-0"
                      />
                      <div className="flex items-center gap-1 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-white">
                            {createdEvents[currentEventIndex]?.eventName?.split(' ').map((word: string) => 
                              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            ).join(' ') || 'Event'}
                          </span>
                          {createdEvents[currentEventIndex]?.location && (
                            <span className="text-xs text-gray-200 mt-0.5">
                              {createdEvents[currentEventIndex].location.split('-').map((word: string) => 
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              ).join(' ')}
                            </span>
                          )}
                        </div>
                        {/* Carousel controls */}
                        {createdEvents.length > 1 && (
                          <div className="flex items-center gap-0.5 bg-white/50 rounded-full px-1 py-0 flex-shrink-0">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCurrentEventIndex(prev => (prev - 1 + createdEvents.length) % createdEvents.length); 
                              }} 
                              className="text-gray-800 hover:text-gray-900 p-0"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <span className="text-gray-800 text-[10px] font-medium">
                              {currentEventIndex + 1}/{createdEvents.length}
                            </span>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCurrentEventIndex(prev => (prev + 1) % createdEvents.length); 
                              }} 
                              className="text-gray-800 hover:text-gray-900 p-0"
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col justify-center items-end flex-shrink-0 ml-2">
                      <span className="text-sm font-medium text-white whitespace-nowrap">
                        {createdEvents[currentEventIndex]?.date && 
                          format(parse(createdEvents[currentEventIndex].date, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d')}
                      </span>
                      {createdEvents[currentEventIndex]?.time && (
                        <span className="text-xs text-gray-200 mt-0.5 whitespace-nowrap">
                          {(() => {
                            const time = createdEvents[currentEventIndex].time;
                            // Handle formats like "4:30pm", "430pm", "4pm"
                            const match = time.match(/(\d{1,4}):?(\d{2})?\s*(am|pm)/i);
                            if (match) {
                              let [, timeDigits, explicitMinutes, period] = match;
                              let hours, minutes;
                              
                              if (explicitMinutes) {
                                // Format like "4:30pm"
                                hours = timeDigits;
                                minutes = explicitMinutes;
                              } else if (timeDigits.length <= 2) {
                                // Format like "4pm"
                                hours = timeDigits;
                                minutes = '00';
                              } else {
                                // Format like "430pm" - split into hours and minutes
                                hours = timeDigits.slice(0, -2);
                                minutes = timeDigits.slice(-2);
                              }
                              
                              const formattedHours = hours.padStart(2, '0');
                              const formattedMinutes = minutes.padStart(2, '0');
                              return `${formattedHours}:${formattedMinutes} ${period.toUpperCase()}`;
                            }
                            return time;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ 
                    background: `linear-gradient(90deg, transparent, ${createdEvents[currentEventIndex]?.date ? 
                      (['#f8b6c2', '#ffd8b5', '#fde68a', '#bbf7d0', '#c0e2e7', '#d1d5fa', '#e9d5ff'][parse(createdEvents[currentEventIndex].date, 'yyyy-MM-dd', new Date()).getDay()]) : 
                      '#c0e2e7'}, transparent)`
                  }}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 