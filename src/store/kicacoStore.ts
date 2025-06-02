import { create } from 'zustand';

type Event = {
  childName: string;
  eventName: string;
  date: string;
  time?: string;
  location?: string;
  isAllDay?: boolean;
  noTimeYet?: boolean;
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
  isAllDay?: boolean;
  noTimeYet?: boolean;
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

  drawerHeight: number | null;
  setDrawerHeight: (height: number) => void;
  chatScrollPosition: number | null;
  setChatScrollPosition: (position: number | null) => void;
};

export const useKicacoStore = create<KicacoState>((set) => ({
  threadId: null,
  setThreadId: (id) => set({ threadId: id }),

  latestEvent: null,
  setLatestEvent: (event) => set({ latestEvent: event as Event }),

  eventInProgress: null,
  setEventInProgress: (event) => set({ eventInProgress: event }),

  events: [],
  addEvent: (event) =>
    set((state) => ({ events: [event as Event, ...state.events] })),

  messages: [],
  addMessage: (message) => {
    console.log('Adding message to store:', message);
    set((state) => {
      const newMessages = [...state.messages, message];
      console.log('New messages array:', newMessages);
      return { messages: newMessages };
    });
  },
  clearMessages: () => set({ messages: [] }),
  removeMessageById: (id) => 
    set((state) => ({
      messages: state.messages.filter(msg => msg.id !== id)
    })),

  keepers: [],
  addKeeper: (keeper) =>
    set((state) => ({ keepers: [keeper as Keeper, ...state.keepers] })),

  drawerHeight: null,
  setDrawerHeight: (height) => set({ drawerHeight: height }),
  chatScrollPosition: null,
  setChatScrollPosition: (position) => set({ chatScrollPosition: position }),
})); 