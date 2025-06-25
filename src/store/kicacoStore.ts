import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format } from 'date-fns';
import { generateRecurringEvents, generateRecurringKeepers } from '../utils/recurringEvents';

// Helper to generate dynamic mock dates
const getMockDate = (dayOffset: number): string => {
  return format(addDays(new Date(), dayOffset), 'yyyy-MM-dd');
};

type Event = {
  childName: string;
  eventName: string;
  date: string;
  time?: string;
  location?: string;
  isAllDay?: boolean;
  noTimeYet?: boolean;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | null;
  recurringEndDate?: string | null;
  recurringDays?: string[] | null; // For weekly: ['monday', 'wednesday']
  recurringParentId?: string; // Links generated events to their parent
};

type ChatMessage = {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  type?: string;
  event?: any;
};

type Keeper = {
  childName: string;
  keeperName: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  isAllDay?: boolean;
  noTimeYet?: boolean;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | null;
  recurringEndDate?: string | null;
  recurringDays?: string[] | null;
  recurringParentId?: string;
};

export type ChildProfile = {
  id: string;
  name: string;
  dob: string;
  school: string;
  nickname?: string;
  color?: string;
};

type KicacoState = {
  threadId: string | null;
  setThreadId: (id: string) => void;

  latestEvent: Event | null;
  setLatestEvent: (event: Partial<Event>) => void;

  eventInProgress: Partial<Event> | null;
  setEventInProgress: (event: Partial<Event> | null) => void;

  events: Event[];
  addEvent: (event: Partial<Event>) => void;
  updateEvent: (index: number, event: Partial<Event>) => void;
  removeEvent: (index: number) => void;

  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  removeMessageById: (id: string) => void;

  keepers: Keeper[];
  addKeeper: (keeper: Partial<Keeper>) => void;
  updateKeeper: (index: number, keeper: Partial<Keeper>) => void;
  removeKeeper: (index: number) => void;

  children: ChildProfile[];
  addChild: (child: ChildProfile) => void;
  updateChild: (child: ChildProfile) => void;

  drawerHeight: number | null;
  setDrawerHeight: (height: number) => void;
  chatScrollPosition: number | null;
  setChatScrollPosition: (position: number | null) => void;

  // UI state management
  hasIntroPlayed: boolean;
  setHasIntroPlayed: (played: boolean) => void;
  disableIntro: boolean;
  setDisableIntro: (disable: boolean) => void;
  blurbGone: boolean;
  setBlurbGone: (gone: boolean) => void;
};

// --- MOCK DATA ---
const mockChildren: ChildProfile[] = [
  { id: 'child1', name: 'Alex', dob: '05/15/2018', school: 'Sunshine Elementary', color: '#c0e2e7' },
  { id: 'child2', name: 'Emma', dob: '03/22/2020', school: 'Sunshine Elementary', color: '#ffd8b5' },
  { id: 'child3', name: 'Leo', dob: '01/10/2022', school: 'Little Sprouts Daycare', color: '#bbf7d0' },
];

const mockEvents: Event[] = [
  // A few past events to show history
  { eventName: 'Science Fair', childName: 'Alex', date: getMockDate(-7), time: '1:00 PM', location: 'School Gymnasium', notes: 'Alex won 2nd place!' },
  { eventName: 'Ballet Practice', childName: 'Emma', date: getMockDate(-5), time: '4:30 PM', location: 'Dance Studio' },
  { eventName: 'Pediatric Check-up', childName: 'Leo', date: getMockDate(-3), time: '10:00 AM', location: 'Pediatric Clinic', notes: 'Annual checkup - all good!' },
  
  // Today's events
  { eventName: 'Soccer Practice', childName: 'Alex', date: getMockDate(0), time: '4:00 PM', location: 'Heatherwood Field', notes: 'Remember to bring shin guards!' },
  
  // Upcoming events (next week)
  { eventName: 'Dentist Appointment', childName: 'Emma', date: getMockDate(2), time: '10:30 AM', location: 'Dr. Smile\'s Office' },
  { eventName: 'Library Day', childName: 'Leo', date: getMockDate(3), time: '11:00 AM', location: 'City Library', notes: 'Return the dinosaur books.' },
  { eventName: 'Birthday Party', childName: 'Alex', date: getMockDate(5), time: '2:00 PM', location: '123 Fun Street', notes: 'Sarah\'s birthday party' },
  { eventName: 'Karate Class', childName: 'Alex', date: getMockDate(7), time: '6:30 PM', location: 'Community Center', notes: 'Practice for the belt test.' },
  { eventName: 'Swimming Lesson', childName: 'Emma', date: getMockDate(9), time: '11:00 AM', location: 'Community Pool' },
  { eventName: 'Playdate', childName: 'Leo', date: getMockDate(12), time: '3:00 PM', location: 'Central Park', notes: 'Playing with Noah' },
  
  // Additional events to showcase new images
  { eventName: 'Math Tutoring', childName: 'Alex', date: getMockDate(14), time: '4:00 PM', location: 'Learning Center', notes: 'Session with Mrs. Johnson' },
  { eventName: 'Haircut Appointment', childName: 'Leo', date: getMockDate(16), time: '2:30 PM', location: 'Kids Cuts Salon' },
  { eventName: 'Homework Club', childName: 'Emma', date: getMockDate(18), time: '3:30 PM', location: 'After School Program' },
  { eventName: 'Basketball Game', childName: 'Alex', date: getMockDate(20), time: '6:00 PM', location: 'School Gym', notes: 'vs Eagles - Season starts next month!' },
  { eventName: 'Music Concert', childName: 'Emma', date: getMockDate(22), time: '7:00 PM', location: 'School Auditorium', notes: 'Emma is performing!' },
  { eventName: 'Tennis Lesson', childName: 'Leo', date: getMockDate(24), time: '10:00 AM', location: 'Tennis Club' },
  { eventName: 'Art Class', childName: 'Emma', date: getMockDate(26), time: '1:00 PM', location: 'Community Center', notes: 'Painting landscapes today' },
  { eventName: 'Scout Meeting', childName: 'Alex', date: getMockDate(28), time: '6:00 PM', location: 'Scout Hall', notes: 'Working on camping badge' },
];

const mockKeepers: Keeper[] = [
  // Past Keepers
  { keeperName: 'Buy ballet shoes', childName: 'Emma', date: getMockDate(-5), description: 'Size 12 - pink - COMPLETED' },
  { keeperName: 'Pay soccer registration', childName: 'Alex', date: getMockDate(-2), description: 'Spring season - PAID' },
  
  // Upcoming Keepers
  { keeperName: 'Return library books', childName: 'Leo', date: getMockDate(1), description: '3 books about dinosaurs.' },
  { keeperName: 'Sign permission slip', childName: 'Emma', date: getMockDate(4), description: 'For the school field trip.' },
  { keeperName: 'RSVP to birthday party', childName: 'Alex', date: getMockDate(6), description: 'For Sarah\'s party.' },
  { keeperName: 'Schedule yearly check-up', childName: 'Leo', date: getMockDate(10) },
  { keeperName: 'Buy school supplies', childName: 'Emma', date: getMockDate(15), description: 'Notebooks, pencils, and art supplies for new semester' },
  { keeperName: 'Submit homework assignment', childName: 'Alex', date: getMockDate(17), description: 'Science project due tomorrow' },
  { keeperName: 'Schedule dentist appointment', childName: 'Leo', date: getMockDate(21), description: 'Routine cleaning and check-up' },
  { keeperName: 'Pick up vaccine records', childName: 'Emma', date: getMockDate(25), description: 'For school enrollment' },
];


export const useKicacoStore = create(
  persist<KicacoState>(
    (set) => ({
      threadId: null,
      setThreadId: (id: string) => set({ threadId: id }),

      latestEvent: null,
      setLatestEvent: (event: Partial<Event>) => set({ latestEvent: event as Event }),

      eventInProgress: null,
      setEventInProgress: (event: Partial<Event> | null) => set({ eventInProgress: event }),

      events: mockEvents,
      addEvent: (event: Partial<Event>) =>
        set((state) => {
          // Check if an event with the same name and date already exists
          // Be flexible with childName matching when it's empty
          const existingIndex = state.events.findIndex(e => 
            e.eventName === event.eventName && 
            e.date === event.date &&
            // Match if either has empty/undefined childName, or if they're the same
            (!e.childName || !event.childName || e.childName === event.childName)
          );
          
          if (existingIndex !== -1) {
            // Update existing event
            console.log('Updating existing event:', event);
            const updatedEvents = [...state.events];
            updatedEvents[existingIndex] = { ...updatedEvents[existingIndex], ...event } as Event;
            return { events: updatedEvents };
          } else {
            // Handle recurring events
            if (event.isRecurring && event.recurringPattern && event.recurringEndDate) {
              console.log('Adding recurring event:', event);
              const recurringEvents = generateRecurringEvents(event as Event);
              return { events: [...recurringEvents, ...state.events] };
            } else {
              // Add single event
              console.log('Adding new event:', event);
              return { events: [event as Event, ...state.events] };
            }
          }
        }),
      updateEvent: (index: number, event: Partial<Event>) =>
        set((state) => ({
          events: state.events.map((e, i) => i === index ? { ...e, ...event } as Event : e)
        })),
      removeEvent: (index: number) =>
        set((state) => ({
          events: state.events.filter((_, i) => i !== index)
        })),

      messages: [],
      addMessage: (message: ChatMessage) => {
        set((state) => ({ messages: [...state.messages, message] }));
      },
      clearMessages: () => set({ messages: [] }),
      removeMessageById: (id: string) => 
        set((state) => ({
          messages: state.messages.filter(msg => msg.id !== id)
        })),

      keepers: mockKeepers,
      addKeeper: (keeper: Partial<Keeper>) => {
        set((state) => {
          // Check if a keeper with the same name and date already exists
          // Be flexible with childName matching when it's empty
          const existingIndex = state.keepers.findIndex(k => 
            k.keeperName === keeper.keeperName && 
            k.date === keeper.date &&
            // Match if either has empty/undefined childName, or if they're the same
            (!k.childName || !keeper.childName || k.childName === keeper.childName)
          );
          
          if (existingIndex !== -1) {
            // Update existing keeper
            console.log('Updating existing keeper:', keeper);
            const updatedKeepers = [...state.keepers];
            updatedKeepers[existingIndex] = { ...updatedKeepers[existingIndex], ...keeper } as Keeper;
            return { keepers: updatedKeepers };
          } else {
            // Handle recurring keepers
            if (keeper.isRecurring && keeper.recurringPattern && keeper.recurringEndDate) {
              console.log('Adding recurring keeper:', keeper);
              const recurringKeepers = generateRecurringKeepers(keeper as Keeper);
              return { keepers: [...recurringKeepers, ...state.keepers] };
            } else {
              // Add single keeper
              console.log('Adding new keeper:', keeper);
              return { keepers: [keeper as Keeper, ...state.keepers] };
            }
          }
        });
      },
      updateKeeper: (index: number, keeper: Partial<Keeper>) =>
        set((state) => ({
          keepers: state.keepers.map((k, i) => i === index ? { ...k, ...keeper } as Keeper : k)
        })),
      removeKeeper: (index: number) =>
        set((state) => ({
          keepers: state.keepers.filter((_, i) => i !== index)
        })),

      children: mockChildren,
      addChild: (child: ChildProfile) =>
        set((state) => ({ children: [...state.children, child] })),
      updateChild: (updatedChild: ChildProfile) =>
        set((state) => ({
          children: state.children.map((child) =>
            child.id === updatedChild.id ? updatedChild : child
          ),
        })),

      drawerHeight: null,
      setDrawerHeight: (height: number) => set({ drawerHeight: height }),
      chatScrollPosition: null,
      setChatScrollPosition: (position: number | null) => set({ chatScrollPosition: position }),

      // UI state management
      hasIntroPlayed: false,
      setHasIntroPlayed: (played: boolean) => set({ hasIntroPlayed: played }),
      disableIntro: false,
      setDisableIntro: (disable: boolean) => set({ disableIntro: disable }),
      blurbGone: false,
      setBlurbGone: (gone: boolean) => set({ blurbGone: gone }),
    }),
    {
      name: 'kicaco-storage-v5',
    }
  )
);