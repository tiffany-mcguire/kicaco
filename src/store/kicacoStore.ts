import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addDays, format } from 'date-fns';

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

  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  removeMessageById: (id: string) => void;

  keepers: Keeper[];
  addKeeper: (keeper: Partial<Keeper>) => void;

  children: ChildProfile[];
  addChild: (child: ChildProfile) => void;
  updateChild: (child: ChildProfile) => void;

  drawerHeight: number | null;
  setDrawerHeight: (height: number) => void;
  chatScrollPosition: number | null;
  setChatScrollPosition: (position: number | null) => void;
};

// --- MOCK DATA ---
const mockChildren: ChildProfile[] = [
  { id: 'child1', name: 'Alex', dob: '05/15/2018', school: 'Sunshine Elementary', color: '#c0e2e7' },
  { id: 'child2', name: 'Emma', dob: '03/22/2020', school: 'Sunshine Elementary', color: '#ffd8b5' },
  { id: 'child3', name: 'Leo', dob: '01/10/2022', school: 'Little Sprouts Daycare', color: '#bbf7d0' },
];

const mockEvents: Event[] = [
  // Past Events (relative to today)
  { eventName: 'Science Fair', childName: 'Alex', date: getMockDate(-30), time: '1:00 PM', location: 'School Gymnasium', notes: 'Alex won 2nd place!' },
  { eventName: 'Ballet Practice', childName: 'Emma', date: getMockDate(-28), time: '4:30 PM', location: 'Dance Studio' },
  { eventName: 'Doctor Appointment', childName: 'Leo', date: getMockDate(-25), time: '10:00 AM', location: 'Pediatric Clinic', notes: 'Annual checkup - all good!' },
  { eventName: 'Soccer Tournament', childName: 'Alex', date: getMockDate(-20), time: '9:00 AM', location: 'Sports Complex' },
  { eventName: 'Piano Recital', childName: 'Emma', date: getMockDate(-18), time: '6:00 PM', location: 'Music Hall' },
  { eventName: 'Playdate with Lily', childName: 'Leo', date: getMockDate(-15), time: '2:00 PM', location: 'Community Playground' },
  { eventName: 'School Play', childName: 'Alex', date: getMockDate(-12), time: '7:00 PM', location: 'School Auditorium' },
  { eventName: 'Art Exhibition', childName: 'Emma', date: getMockDate(-10), time: '3:00 PM', location: 'Art Gallery' },
  { eventName: 'Swimming Lesson', childName: 'Leo', date: getMockDate(-8), time: '11:00 AM', location: 'YMCA Pool' },
  { eventName: 'Birthday Party (Mike)', childName: 'Alex', date: getMockDate(-5), time: '1:00 PM', location: 'Jump Zone' },
  { eventName: 'Dentist Cleaning', childName: 'Emma', date: getMockDate(-3), time: '2:30 PM', location: 'Happy Teeth Dental' },
  { eventName: 'Story Time', childName: 'Leo', date: getMockDate(-1), time: '10:30 AM', location: 'Public Library' },
  
  // Upcoming Events (relative to today)
  { eventName: 'Soccer Practice', childName: 'Alex', date: getMockDate(0), time: '4:00 PM', location: 'Heatherwood Field', notes: 'Remember to bring shin guards and a water bottle!' },
  { eventName: 'Team Dinner', childName: 'Alex', date: getMockDate(0), time: '6:00 PM', location: 'Pizza Palace', notes: 'Team celebration after the big game.' },
  { eventName: 'Dentist Appointment', childName: 'Emma', date: getMockDate(1), time: '10:30 AM', location: 'Dr. Smile\'s Office' },
  { eventName: 'Library Day', childName: 'Leo', date: getMockDate(2), time: '11:00 AM', location: 'City Library', notes: 'Return the dinosaur books.' },
  { eventName: 'Book Club', childName: 'Leo', date: getMockDate(2), time: '5:00 PM', location: 'City Library' },
  { eventName: 'Birthday Party (Sarah)', childName: 'Alex', date: getMockDate(3), time: '2:00 PM', location: '123 Fun Street' },
  { eventName: 'Tae Kwon Do', childName: 'Emma', date: getMockDate(4), time: '5:00 PM', location: 'Martial Arts Center' },
  { eventName: 'Karate Class', childName: 'Alex', date: getMockDate(4), time: '6:30 PM', location: 'Community Center', notes: 'Practice for the belt test.' },
  { eventName: 'Playdate with Noah', childName: 'Leo', date: getMockDate(5), time: '3:00 PM', location: 'Central Park' },
  { eventName: 'School Field Trip', childName: 'Alex', date: getMockDate(6), time: '9:00 AM', location: 'Science Museum' },
  { eventName: 'Swim Lesson', childName: 'Emma', date: getMockDate(8), time: '11:00 AM', location: 'Community Pool' },
  { eventName: 'Art Class', childName: 'Leo', date: getMockDate(10), time: '4:30 PM', location: 'Art Studio' },
  { eventName: 'Soccer Game', childName: 'Alex', date: getMockDate(12), time: '6:00 PM', location: 'Heatherwood Field' },
  { eventName: 'Parent-Teacher Conference', childName: 'Emma', date: getMockDate(14), time: '5:30 PM', location: 'Sunshine Elementary' },
  { eventName: 'Music Lesson', childName: 'Leo', date: getMockDate(15), time: '3:30 PM', location: 'Music School' },
  { eventName: 'Movie Night', childName: 'Alex', date: getMockDate(17), time: '7:00 PM', location: 'Home' },
  { eventName: 'Gymnastics', childName: 'Emma', date: getMockDate(18), time: '4:00 PM', location: 'Gymnastics Center' },
  { eventName: 'Doctor Check-up', childName: 'Leo', date: getMockDate(20), time: '9:30 AM', location: 'Pediatric Clinic' },
  { eventName: 'Family Dinner', childName: 'Alex', date: getMockDate(22), time: '6:30 PM', location: 'Grandma\'s House' },
  { eventName: 'Ballet Recital', childName: 'Emma', date: getMockDate(25), time: '2:00 PM', location: 'Community Theater' },
  { eventName: 'Zoo Trip', childName: 'Leo', date: getMockDate(28), time: '10:00 AM', location: 'City Zoo' },
  // Events in the near future
  { eventName: 'Fireworks Show', childName: 'Alex', date: getMockDate(30), time: '9:00 PM', location: 'Lakefront Park' },
  { eventName: 'Summer Camp Day 1', childName: 'Emma', date: getMockDate(35), time: '8:30 AM', location: 'Camp Kicaco' },
  { eventName: 'Summer Camp Day 2', childName: 'Emma', date: getMockDate(36), time: '8:30 AM', location: 'Camp Kicaco' },
  { eventName: 'Summer Camp Day 3', childName: 'Emma', date: getMockDate(37), time: '8:30 AM', location: 'Camp Kicaco' },
  { eventName: 'Summer Camp Day 4', childName: 'Emma', date: getMockDate(38), time: '8:30 AM', location: 'Camp Kicaco' },
  { eventName: 'Summer Camp Day 5', childName: 'Emma', date: getMockDate(39), time: '8:30 AM', location: 'Camp Kicaco' },
  { eventName: 'Beach Day', childName: 'Leo', date: getMockDate(42), time: '10:00 AM', location: 'Sunnyvale Beach' },
  { eventName: 'Baseball Game', childName: 'Alex', date: getMockDate(44), time: '1:00 PM', location: 'City Stadium' },
  { eventName: 'Pottery Class', childName: 'Emma', date: getMockDate(46), time: '4:00 PM', location: 'Clay Studio' },
  { eventName: 'Aquarium Visit', childName: 'Leo', date: getMockDate(48), time: '11:00 AM', location: 'Marine World' },
  { eventName: 'Picnic in the Park', childName: 'Alex', date: getMockDate(50), time: '12:30 PM', location: 'Greenfield Park' },
  { eventName: 'Coding Club', childName: 'Emma', date: getMockDate(52), time: '5:00 PM', location: 'Tech Center' },
  { eventName: 'Nature Hike', childName: 'Leo', date: getMockDate(55), time: '9:00 AM', location: 'Mountain Trail' },
  { eventName: 'Skating Lesson', childName: 'Alex', date: getMockDate(58), time: '4:30 PM', location: 'Skating Rink' },
  { eventName: 'Story Time', childName: 'Emma', date: getMockDate(60), time: '10:00 AM', location: 'Bookstore' },
  { eventName: 'Visit to Farm', childName: 'Leo', date: getMockDate(62), time: '1:00 PM', location: 'Old MacDonald\'s Farm' },
  { eventName: 'End of Summer BBQ', childName: 'Alex', date: getMockDate(65), time: '5:00 PM', location: 'Home' },
  { eventName: 'School Supply Shopping', childName: 'Emma', date: getMockDate(68), time: '2:00 PM', location: 'Super Store' },
  { eventName: 'Dentist Follow-up', childName: 'Emma', date: getMockDate(70), time: '11:00 AM', location: 'Dr. Smile\'s Office' },
  { eventName: 'Karate Belt Test', childName: 'Alex', date: getMockDate(72), time: '10:00 AM', location: 'Dojo' },
];

const mockKeepers: Keeper[] = [
  // Past Keepers
  { keeperName: 'Submit field trip form', childName: 'Alex', date: getMockDate(-15), description: 'Science museum permission slip - COMPLETED' },
  { keeperName: 'Buy ballet shoes', childName: 'Emma', date: getMockDate(-10), description: 'Size 12 - pink' },
  { keeperName: 'Schedule flu shot', childName: 'Leo', date: getMockDate(-7), description: 'Done at last checkup' },
  { keeperName: 'Pay soccer registration', childName: 'Alex', date: getMockDate(-5), description: 'Spring season - PAID' },
  
  // Upcoming Keepers
  { keeperName: 'Return library books', childName: 'Alex', date: getMockDate(3), description: '3 books about dinosaurs.' },
  { keeperName: 'Sign permission slip', childName: 'Emma', date: getMockDate(5), description: 'For the trip to the Science Museum.' },
  { keeperName: 'RSVP to birthday party', childName: 'Leo', date: getMockDate(8), description: 'For Noah\'s party.' },
  { keeperName: 'Schedule yearly check-up', childName: 'Alex', date: getMockDate(15) },
  { keeperName: 'Buy new soccer cleats', childName: 'Emma', date: getMockDate(22), description: 'Size 10.' },
  { keeperName: 'Pay for summer camp', childName: 'Leo', date: getMockDate(27) },
];


export const useKicacoStore = create(
  persist<KicacoState>(
    (set, get) => ({
      threadId: null,
      setThreadId: (id: string) => set({ threadId: id }),

      latestEvent: null,
      setLatestEvent: (event: Partial<Event>) => set({ latestEvent: event as Event }),

      eventInProgress: null,
      setEventInProgress: (event: Partial<Event> | null) => set({ eventInProgress: event }),

      events: mockEvents,
      addEvent: (event: Partial<Event>) =>
        set((state) => ({ events: [event as Event, ...state.events] })),

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
        set((state) => ({ keepers: [keeper as Keeper, ...state.keepers] }));
      },

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
    }),
    {
      name: 'kicaco-storage-v3',
    }
  )
);