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
  
  // Debug utilities
  refreshMockData: () => void;
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
  
  // Upcoming events (next week) - Enhanced with new image categories
  { eventName: 'Dentist Appointment', childName: 'Emma', date: getMockDate(2), time: '10:30 AM', location: 'Dr. Smile\'s Office' },
  { eventName: 'Library Day', childName: 'Leo', date: getMockDate(3), time: '11:00 AM', location: 'City Library', notes: 'Return the dinosaur books.' },
  { eventName: 'Birthday Party', childName: 'Alex', date: getMockDate(5), time: '2:00 PM', location: '123 Fun Street', notes: 'Sarah\'s birthday party' },
  { eventName: 'Karate Class', childName: 'Alex', date: getMockDate(7), time: '6:30 PM', location: 'Community Center', notes: 'Practice for the belt test.' },
  { eventName: 'Swimming Lesson', childName: 'Emma', date: getMockDate(9), time: '11:00 AM', location: 'Community Pool' },
  { eventName: 'Playground Playdate', childName: 'Leo', date: getMockDate(12), time: '3:00 PM', location: 'Central Park', notes: 'Playing with Noah' },
  
  // School & Educational Events
  { eventName: 'Math Tutoring', childName: 'Alex', date: getMockDate(14), time: '4:00 PM', location: 'Learning Center', notes: 'Session with Mrs. Johnson' },
  { eventName: 'Homework Club', childName: 'Emma', date: getMockDate(16), time: '3:30 PM', location: 'After School Program' },
  { eventName: 'Parent-Teacher Conference', childName: 'Leo', date: getMockDate(18), time: '5:00 PM', location: 'Little Sprouts Daycare', notes: 'Meeting with Ms. Sarah' },
  { eventName: 'Picture Day', childName: 'Alex', date: getMockDate(20), time: '9:00 AM', location: 'School', notes: 'Wear the blue shirt!' },
  { eventName: 'Book Fair', childName: 'Emma', date: getMockDate(22), time: '2:00 PM', location: 'School Library', notes: 'Budget: $20' },
  { eventName: 'Natural History Museum', childName: 'Leo', date: getMockDate(24), time: '9:30 AM', location: 'Natural History Museum', notes: 'School field trip - Dinosaur exhibit!' },
  { eventName: 'Art Class', childName: 'Emma', date: getMockDate(26), time: '1:00 PM', location: 'Community Center', notes: 'Painting landscapes today' },
  { eventName: 'Clothes Shopping', childName: 'Alex', date: getMockDate(28), time: '10:00 AM', location: 'Target', notes: 'Back-to-school supplies and wardrobe' },
  
  // Sports & Activities
  { eventName: 'Basketball Game', childName: 'Alex', date: getMockDate(30), time: '6:00 PM', location: 'School Gym', notes: 'vs Eagles - Season starts next month!' },
  { eventName: 'Tennis Lesson', childName: 'Leo', date: getMockDate(32), time: '10:00 AM', location: 'Tennis Club' },
  { eventName: 'Teen Sports Camp', childName: 'Emma', date: getMockDate(34), time: '8:00 AM', location: 'Sports Complex', notes: 'Week-long camp' },
  { eventName: 'Playground Meetup', childName: 'Leo', date: getMockDate(36), time: '3:00 PM', location: 'Riverside Park', notes: 'With the neighborhood kids' },
  { eventName: 'Cheerleading Practice', childName: 'Emma', date: getMockDate(38), time: '4:00 PM', location: 'School Gym' },
  { eventName: 'Football Game', childName: 'Alex', date: getMockDate(40), time: '7:00 PM', location: 'High School Stadium', notes: 'Homecoming game!' },
  
  // Medical & Health
  { eventName: 'Eye Exam', childName: 'Emma', date: getMockDate(42), time: '2:30 PM', location: 'Vision Center', notes: 'Annual check' },
  { eventName: 'Vaccine Appointment', childName: 'Leo', date: getMockDate(44), time: '11:00 AM', location: 'Pediatric Clinic', notes: 'School required shots' },
  { eventName: 'Prescription Pickup', childName: 'Alex', date: getMockDate(46), time: '4:00 PM', location: 'CVS Pharmacy', notes: 'Allergy medication' },
  { eventName: 'Physical Exam', childName: 'Emma', date: getMockDate(48), time: '9:00 AM', location: 'Family Doctor', notes: 'Sports clearance' },
  
  // Personal Care & Shopping
  { eventName: 'Haircut Appt', childName: 'Leo', date: getMockDate(50), time: '2:30 PM', location: 'Kids Cuts Salon' },
  { eventName: 'Clothes Shopping', childName: 'Emma', date: getMockDate(52), time: '11:00 AM', location: 'Mall', notes: 'Back-to-school - New semester wardrobe' },
  { eventName: 'Donate Clothes', childName: 'Alex', date: getMockDate(54), time: '10:00 AM', location: 'Goodwill', notes: 'Clean out closet - old clothes' },
  
  // Entertainment & Social
  { eventName: 'Music Concert', childName: 'Emma', date: getMockDate(56), time: '7:00 PM', location: 'School Auditorium', notes: 'Emma is performing!' },
  { eventName: 'Scout Meeting', childName: 'Alex', date: getMockDate(58), time: '6:00 PM', location: 'Scout Hall', notes: 'Working on camping badge' },
  { eventName: 'Game Night', childName: 'Leo', date: getMockDate(60), time: '6:30 PM', location: 'Home', notes: 'Family board game night' },
  { eventName: 'Ice Cream Social', childName: 'Emma', date: getMockDate(62), time: '3:00 PM', location: 'School Cafeteria', notes: 'End of year celebration' },
  { eventName: 'Bake Sale', childName: 'Alex', date: getMockDate(64), time: '8:00 AM', location: 'School Entrance', notes: 'Fundraiser for field trip' },
  
  // Transportation & Travel
  { eventName: 'Carpool to Soccer', childName: 'Leo', date: getMockDate(66), time: '3:30 PM', location: 'Pick up at school', notes: 'Mrs. Johnson driving' },
  { eventName: 'Family Vacation', childName: 'Emma', date: getMockDate(68), time: '6:00 AM', location: 'Airport', notes: 'Flight to Disney World!' },
  { eventName: 'Work from Home Day', childName: 'Alex', date: getMockDate(70), time: '9:00 AM', location: 'Home', notes: 'Parent working from home' },
  
  // Educational Outings
  { eventName: 'Aquarium Visit', childName: 'Leo', date: getMockDate(72), time: '10:00 AM', location: 'City Aquarium', notes: 'Marine life exhibit' },
  { eventName: 'Art Museum Tour', childName: 'Emma', date: getMockDate(74), time: '1:00 PM', location: 'Metropolitan Art Museum', notes: 'School group tour' },
  { eventName: 'Nature Hike', childName: 'Alex', date: getMockDate(76), time: '8:00 AM', location: 'State Park', notes: 'Scout outdoor activity' },
  
  // Zoo Visits
  { eventName: 'Zoo Visit', childName: 'Leo', date: getMockDate(78), time: '10:30 AM', location: 'City Zoo', notes: 'Bear exhibit - New habitat opening' },
  { eventName: 'Zoo Field Trip', childName: 'Emma', date: getMockDate(80), time: '9:00 AM', location: 'City Zoo', notes: 'School trip - See the giraffes and tigers' },
  { eventName: 'Red Panda Feeding', childName: 'Alex', date: getMockDate(82), time: '2:00 PM', location: 'City Zoo', notes: 'Special behind-the-scenes tour' },
  
  // School-specific events
  { eventName: 'School Bus Safety', childName: 'Leo', date: getMockDate(84), time: '8:30 AM', location: 'School Parking Lot', notes: 'Required training - Start of year safety' },
  { eventName: 'Locker Setup', childName: 'Emma', date: getMockDate(86), time: '12:00 PM', location: 'Middle School', notes: 'Get combination and practice opening' },
  { eventName: 'School Orientation', childName: 'Alex', date: getMockDate(88), time: '10:00 AM', location: 'High School', notes: 'Find all the classrooms and hallways' },
  { eventName: 'Teacher Meet & Greet', childName: 'Leo', date: getMockDate(90), time: '2:00 PM', location: 'Elementary School', notes: 'Meet the new teacher and classroom' },
  { eventName: 'School Snacks Prep', childName: 'Emma', date: getMockDate(92), time: '7:00 AM', location: 'Kitchen', notes: 'Pack healthy snacks for week' },
  { eventName: 'High School Orientation', childName: 'Alex', date: getMockDate(94), time: '9:00 AM', location: 'High School', notes: 'Teens at school program' },
];

const mockKeepers: Keeper[] = [
  // Past Keepers
  { keeperName: 'Buy ballet shoes', childName: 'Emma', date: getMockDate(-5), description: 'Size 12 - pink - COMPLETED' },
  { keeperName: 'Pay soccer registration', childName: 'Alex', date: getMockDate(-2), description: 'Spring season - PAID' },
  
  // Upcoming Keepers - Enhanced with new image categories
  { keeperName: 'Return library books', childName: 'Leo', date: getMockDate(1), description: '3 books about dinosaurs.' },
  { keeperName: 'Sign permission slip', childName: 'Emma', date: getMockDate(4), description: 'For the school field trip.' },
  { keeperName: 'RSVP to birthday party', childName: 'Alex', date: getMockDate(6), description: 'For Sarah\'s party.' },
  { keeperName: 'Schedule yearly check-up', childName: 'Leo', date: getMockDate(10) },
  { keeperName: 'Buy school supplies', childName: 'Emma', date: getMockDate(15), description: 'Notebooks, pencils, and art supplies for new semester' },
  { keeperName: 'Submit assignment', childName: 'Alex', date: getMockDate(17), description: 'Science homework project due tomorrow' },
  { keeperName: 'Schedule dentist appt', childName: 'Leo', date: getMockDate(21), description: 'Routine cleaning and check-up' },
  { keeperName: 'Pick up vaccine records', childName: 'Emma', date: getMockDate(25), description: 'For school enrollment' },
  
  // School & Educational Keepers
  { keeperName: 'Pack school backpack', childName: 'Alex', date: getMockDate(27), description: 'Check list for tomorrow\'s classes' },
  { keeperName: 'Organize school locker', childName: 'Emma', date: getMockDate(29), description: 'Clean out old papers and organize supplies' },
  { keeperName: 'Prepare school snacks', childName: 'Leo', date: getMockDate(31), description: 'Healthy snacks for the week' },
  { keeperName: 'Book fair money', childName: 'Alex', date: getMockDate(33), description: 'Give $20 for book purchases' },
  { keeperName: 'Picture day outfit', childName: 'Emma', date: getMockDate(35), description: 'Lay out nice clothes the night before' },
  
  // Medical & Health Keepers
  { keeperName: 'Schedule eye exam', childName: 'Leo', date: getMockDate(37), description: 'Annual vision check before school starts' },
  { keeperName: 'Refill prescription', childName: 'Alex', date: getMockDate(39), description: 'Allergy medication running low' },
  { keeperName: 'Physical exam forms', childName: 'Emma', date: getMockDate(41), description: 'Submit sports clearance paperwork' },
  
  // Personal Care & Shopping Keepers
  { keeperName: 'Schedule haircut', childName: 'Leo', date: getMockDate(43), description: 'Before school pictures' },
  { keeperName: 'School clothes shopping', childName: 'Alex', date: getMockDate(45), description: 'Back-to-school wardrobe for new semester' },
  { keeperName: 'Donate old clothes', childName: 'Emma', date: getMockDate(47), description: 'Clean out closet and donate to charity' },
  { keeperName: 'Fold laundry', childName: 'Leo', date: getMockDate(49), description: 'Weekly laundry organization - don\'t forget to put away!' },
  
  // Transportation & Travel Keepers
  { keeperName: 'Arrange carpool', childName: 'Alex', date: getMockDate(51), description: 'Coordinate rides for soccer practice' },
  { keeperName: 'Pack for family vacation', childName: 'Emma', date: getMockDate(53), description: 'Make packing list and prepare suitcase' },
  { keeperName: 'Work from home setup', childName: 'Leo', date: getMockDate(55), description: 'Prepare quiet space for parent\'s WFH day' },
  
  // Entertainment & Social Keepers
  { keeperName: 'Game night prep', childName: 'Alex', date: getMockDate(57), description: 'Choose games and prepare snacks' },
  { keeperName: 'Bake sale contribution', childName: 'Emma', date: getMockDate(59), description: 'Bake cookies for school fundraiser' },
  { keeperName: 'Scout badge requirements', childName: 'Leo', date: getMockDate(61), description: 'Complete camping badge activities' },
  
  // Educational Outings Keepers
  { keeperName: 'Permission slip', childName: 'Alex', date: getMockDate(63), description: 'Aquarium field trip - Submit forms and payment' },
  { keeperName: 'Art museum tour prep', childName: 'Emma', date: getMockDate(65), description: 'Research exhibits we\'ll see' },
  { keeperName: 'Nature hike gear', childName: 'Leo', date: getMockDate(67), description: 'Pack hiking boots and water bottle' },
  
  // Zoo & Animal Keepers
  { keeperName: 'Zoo membership renewal', childName: 'Alex', date: getMockDate(69), description: 'Annual family membership expires soon' },
  { keeperName: 'Permission slip', childName: 'Emma', date: getMockDate(71), description: 'Zoo field trip - Submit forms and emergency contacts' },
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
      
      // Debug utilities
      refreshMockData: () => set({ events: mockEvents, keepers: mockKeepers }),
    }),
    {
      name: 'kicaco-storage-v5',
    }
  )
);