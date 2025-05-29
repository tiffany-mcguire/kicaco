// import React from 'react';
import { UploadIcon, CameraIconMD, MicIcon, ClipboardIcon2 } from '../components/icons.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/ChatBubble';
import IconButton from '../components/IconButton';
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import GlobalChatDrawer from '../components/GlobalChatDrawer';
import { extractJsonFromMessage } from '../utils/parseAssistantResponse';
import { useKicacoStore } from '../store/kicacoStore';
import EventConfirmationCard from '../components/EventConfirmationCard';
import { runAssistantFunction } from '../utils/runAssistantFunction';
import { sendMessageToAssistant, createOpenAIThread } from '../utils/talkToKicaco';
import { extractKnownFields, getNextFieldToPrompt, isFirstMessage } from '../utils/kicacoFlow';
import { ParsedFields } from '../utils/kicacoFlow';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { getKicacoEventPhoto } from '../utils/getKicacoEventPhoto';
import { parse, format } from 'date-fns';
import PasswordModal from '../components/PasswordModal';
import PostSignupOptions from '../components/PostSignupOptions';

const intro = [
  "Hi, I'm Kicaco! You can chat with me about events and I'll remember everything for you.",
  "Type it, say it, snap a photo, upload a flyer, or paste in a note - whatever makes your day easier, I'll turn it into a real event. No forms, no fuss.",
  "Want to give it a try? Tell me about your next event! If you miss any vital details, I'll be sure to ask for them.",
];

// Date/time formatting helpers
function formatDateMMDDYYYY(date: Date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

function formatTimeAMPM(date: Date) {
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

function toTitleCase(str: string) {
  return str.replace(/\b\w+/g, txt => txt[0].toUpperCase() + txt.slice(1).toLowerCase());
}

// Add formatTime helper from EventCard
function formatTime(time?: string) {
  if (!time) return '';
  let normalized = time.trim().toLowerCase();
  normalized = normalized.replace(/(\d)(am|pm)/, '$1 $2');
  if (/^\d{1,2}\s?(am|pm)$/.test(normalized)) {
    normalized = normalized.replace(/^(\d{1,2})\s?(am|pm)$/, '$1:00 $2');
  }
  const patterns = ['h:mm a', 'h a', 'h:mma', 'ha', 'H:mm'];
  for (const pattern of patterns) {
    try {
      const dateObj = parse(normalized, pattern, new Date());
      if (!isNaN(dateObj.getTime())) {
        return format(dateObj, 'hh:mm a').toUpperCase();
      }
    } catch {}
  }
  const dateObj = new Date(`1970-01-01T${normalized.replace(/ /g, '')}`);
  if (!isNaN(dateObj.getTime())) {
    return format(dateObj, 'hh:mm a').toUpperCase();
  }
  return time;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [hasIntroPlayed, setHasIntroPlayed] = useState(() => {
    return localStorage.getItem('kicaco_intro_played') === 'true';
  });
  const introStartedRef = useRef(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [collectedFields, setCollectedFields] = useState<ParsedFields>({});
  const { 
    messages, 
    addMessage, 
    removeMessageById, 
    setLatestEvent,
    eventInProgress,
    setEventInProgress,
    addEvent
  } = useKicacoStore();
  const headerRef = useRef<HTMLDivElement>(null);
  const subheaderRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [drawerHeight, setDrawerHeight] = useState(44); // initial: minimized height + gap
  const [drawerTop, setDrawerTop] = useState(window.innerHeight); // initial: bottom of viewport
  const [subheaderBottom, setSubheaderBottom] = useState(0);
  const [scrollOverflow, setScrollOverflow] = useState<'auto' | 'hidden'>('auto');
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatDrawerRef = useRef<any>(null);

  // Animated message reveal state
  const [visibleCount, setVisibleCount] = useState(0);

  // --- NEW: Track if blurb has been shown/should be hidden forever ---
  const [blurbGone, setBlurbGone] = useState(() => {
    return localStorage.getItem('kicaco_blurb_gone') === 'true';
  });
  const events = useKicacoStore(state => state.events);
  const keepers = useKicacoStore(state => state.keepers);
  // In the future, also check keepers.length > 0

  useEffect(() => {
    console.log('Events:', events);
    console.log('Keepers:', keepers);
    if ((events.length > 0 || keepers.length > 0) && !blurbGone) {
      setBlurbGone(true);
      localStorage.setItem('kicaco_blurb_gone', 'true');
    }
  }, [events, keepers, blurbGone]);

  // Staggered intro messages
  useEffect(() => {
    if (hasIntroPlayed || introStartedRef.current) return;
    introStartedRef.current = true;

    const introMessages = [
      "Hi, I'm Kicaco! You can chat with me about events and I'll remember everything for you.",
      "Type it, say it, snap a photo, upload a flyer, or paste in a note – whatever makes your day easier, I'll turn it into a real event. No forms, no fuss.",
      "Want to give it a try? Tell me about your next event! If you miss any vital details, I'll be sure to ask for them."
    ];

    introMessages.forEach((text, i) => {
      setTimeout(() => {
        addMessage({
          id: crypto.randomUUID(),
          sender: 'assistant',
          content: text
        });
      }, i * 800); // Stagger every 800ms
    });

    setHasIntroPlayed(true);
    localStorage.setItem('kicaco_intro_played', 'true');
  }, [hasIntroPlayed, addMessage]);

  // Initialize thread and run test case
  useEffect(() => {
    const initThread = async () => {
      const id = await createOpenAIThread();
      setThreadId(id);
    };
    initThread();
  }, []);

  const [pendingEvent, setPendingEvent] = useState<any>(null);
  const [eventCreationMessage, setEventCreationMessage] = useState<string>("");
  const [currentEventFields, setCurrentEventFields] = useState<any>({});
  const [showSignup, setShowSignup] = useState(false);
  const [signupStep, setSignupStep] = useState<number | null>(null);
  const [signupData, setSignupData] = useState<{ name?: string; email?: string; password?: string }>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPostSignupOptions, setShowPostSignupOptions] = useState(false);

  // Track the most recent event's childName for use in signup flow
  const latestChildName = useKicacoStore(state => (state.events[0]?.childName || 'your child'));

  const handleSend = async () => {
    if (!input.trim() || !threadId) {
      console.log('No input or threadId:', { input, threadId });
      return;
    }

    // Signup flow logic
    if (showSignup && signupStep !== null) {
      if (signupStep === 0) {
        setSignupData(prev => ({ ...prev, name: input.trim() }));
        addMessage({
          id: crypto.randomUUID(),
          sender: 'user',
          content: input.trim()
        });
        setInput('');
        setSignupStep(1);
        setTimeout(() => {
          addMessage({
            id: crypto.randomUUID(),
            sender: 'assistant',
            content: 'Great! What email would you like to use?'
          });
        }, 400);
        return;
      }
      if (signupStep === 1) {
        setSignupData(prev => ({ ...prev, email: input.trim() }));
        addMessage({
          id: crypto.randomUUID(),
          sender: 'user',
          content: input.trim()
        });
        setInput('');
        setShowPasswordModal(true);
        return;
      }
      if (signupStep === 2) {
        setSignupStep(3);
        setTimeout(() => {
          addMessage({
            id: crypto.randomUUID(),
            sender: 'assistant',
            content: `Is this calendar just for ${latestChildName}'s schedule or would you like to add another child profile?`
          });
        }, 400);
        return;
      }
      // After this, you can handle more steps or finish the signup
      return;
    }

    const userText = input.trim();
    setInput('');

    // Track the original event-creation message (the one that started the event flow)
    const eventKeywords = [
      'have', 'attend', 'go to', 'set', 'schedule', 'add', 'plan', 'join', 'host',
      'tomorrow', 'tonight', 'next week', 'next friday', 'this friday',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'
    ];
    let isNewEvent = false;
    if (
      eventKeywords.some(kw => userText.toLowerCase().includes(kw)) &&
      (!eventCreationMessage || eventCreationMessage.length === 0)
    ) {
      setEventCreationMessage(userText);
      isNewEvent = true;
    }

    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      sender: 'user' as const,
      content: userText
    };
    console.log('Adding user message:', userMessage);
    addMessage(userMessage);

    // Add thinking message
    const thinkingMessage = {
      id: 'thinking',
      sender: 'assistant' as const,
      content: 'Kicaco is thinking',
    };
    addMessage(thinkingMessage);

    // Update current event fields
    let updatedFields = { ...currentEventFields };
    const extractedFields = extractKnownFields(userText, currentEventFields);
    console.log('Extracted fields:', extractedFields);
    // Merge all extracted fields into updatedFields
    Object.assign(updatedFields, extractedFields);
    setCurrentEventFields(updatedFields);

    // Process message with kicacoFlow
    console.time("Total Message Lifecycle");
    console.time("API Response Time");
    
    try {
      const assistantResponse = await sendMessageToAssistant(threadId, userText);
      
      // Robust event extraction from code block or plain JSON
      let eventObj = null;
      try {
        // Try to extract JSON from code block
        const codeBlockMatch = assistantResponse.match(/```json\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
          const parsed = JSON.parse(codeBlockMatch[1]);
          if (parsed.event) eventObj = parsed.event;
        } else {
          // Try plain JSON
          try {
            const parsed = JSON.parse(assistantResponse);
            if (parsed.event) eventObj = parsed.event;
          } catch {
            // Try to extract JSON from anywhere in the message
            const firstBrace = assistantResponse.indexOf('{');
            if (firstBrace !== -1) {
              const jsonSubstring = assistantResponse.slice(firstBrace);
              try {
                const parsed = JSON.parse(jsonSubstring);
                if (parsed.event) eventObj = parsed.event;
              } catch {}
            }
          }
        }
      } catch {
        // Not JSON — just chat
      }
      if (eventObj) {
        // Overwrite eventObj fields with locally tracked currentEventFields
        eventObj = { ...eventObj, ...updatedFields };
        addEvent(eventObj);        // Add event to store immediately
        console.log('Event added to store:', eventObj);
        setTimeout(() => {
          console.log('Current events array:', useKicacoStore.getState().events);
        }, 100);
        setPendingEvent(eventObj); // Show confirmation modal
      }
      // Remove thinking message before adding the real response
      removeMessageById('thinking');

      // Generate the confirmation message from the locally resolved event object
      if (eventObj) {
        const formattedDate = eventObj.date ? format(parse(eventObj.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy') : '';
        const formattedTime = formatTime(eventObj.time);
        const confirmationMsg = `Okay! I've saved ${eventObj.childName}'s ${eventObj.eventName} for ${formattedDate} at ${formattedTime} in ${eventObj.location}.`;
        const assistantMessage = {
          id: crypto.randomUUID(),
          sender: 'assistant' as const,
          type: 'event_confirmation',
          content: confirmationMsg,
          event: eventObj
        };
        addMessage(assistantMessage);
        // Auto-scroll after confirmation message
        setTimeout(() => {
          const scrollContainer = scrollRef.current;
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }, 100);
      } else {
        const assistantMessage = {
          id: crypto.randomUUID(),
          sender: 'assistant' as const,
          content: assistantResponse
        };
        addMessage(assistantMessage);
      }
    } catch (error) {
      console.error('Error in message handling:', error);
      removeMessageById('thinking');
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.'
      });
    }

    console.timeEnd("API Response Time");
    console.timeEnd("Total Message Lifecycle");
  };

  // Log messages and visibleCount changes
  useEffect(() => {
    console.log('Messages updated:', messages);
    console.log('Visible count:', visibleCount);
  }, [messages, visibleCount]);

  // Update visibleCount when messages change
  useEffect(() => {
    if (messages.length > visibleCount) {
      console.log('Updating visibleCount from', visibleCount, 'to', messages.length);
      setVisibleCount(messages.length);
    }
  }, [messages.length, visibleCount]);

  // Update drawerTop when drawer height changes
  const handleDrawerHeightChange = (height: number) => {
    setDrawerHeight(height);
    setDrawerTop(window.innerHeight - height);
  };

  // Update subheaderBottom on mount and resize
  useLayoutEffect(() => {
    function updateSubheaderBottom() {
      if (subheaderRef.current) {
        setSubheaderBottom(subheaderRef.current.getBoundingClientRect().bottom);
      }
    }
    updateSubheaderBottom();
    window.addEventListener('resize', updateSubheaderBottom);
    return () => window.removeEventListener('resize', updateSubheaderBottom);
  }, []);

  // Lock/unlock scroll based on drawer position
  useEffect(() => {
    // If drawer is fully open (docked at top), lock scroll
    if (drawerHeight > 44 + 8) {
      setScrollOverflow('auto');
    } else {
      setScrollOverflow('hidden');
    }
  }, [drawerHeight]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <GlobalHeader ref={headerRef} />
      {/* Subheader (for double header effect) */}
      <div ref={subheaderRef} className="w-full bg-white z-10 profiles-roles-subheader">
        <section className="mb-2 px-4 pt-4">
          <div style={{width:'180px'}}>
            <div className="h-0.5 bg-[#c0e2e7] rounded w-full mb-0" style={{ opacity: 0.75 }}></div>
            <div className="flex items-center space-x-2 pl-1">
              <svg width="16" height="16" fill="rgba(185,17,66,0.75)" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>
              <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Upcoming Events</h2>
            </div>
            <div className="h-0.5 bg-[#c0e2e7] rounded w-full mt-0" style={{ opacity: 0.75 }}></div>
          </div>
          {!blurbGone && (
            <p className="mt-2 text-gray-700 text-[15px] leading-snug font-medium w-full text-left section-blurb" style={{marginBottom: 0, paddingBottom: 0}}>
              Kicaco gives you a clear and up-to-date view of what's next, so you never miss a practice, recital, or class party.
            </p>
          )}
        </section>
        {/* Upcoming Events Cards */}
        {events.length > 0 && (
          <div className="flex flex-col w-full pt-2 pb-2 px-4">
            {events.map((event, idx) => (
              <div key={event.eventName + event.date + idx}>
                <EventCard
                  image={getKicacoEventPhoto(event.eventName)}
                  name={event.eventName}
                  date={event.date}
                  time={event.time}
                  location={event.location}
                />
              </div>
            ))}
          </div>
        )}
        {/* Keepers */}
        <section className="mb-2 px-4">
          <div className="mt-2" style={{width:'180px'}}>
            <div className="h-0.5 bg-[#f8b6c2] rounded w-full mb-0" style={{ opacity: 0.75 }}></div>
            <div className="flex items-center space-x-2 pl-1">
              <svg width="16" height="16" fill="rgba(185,17,66,0.75)" viewBox="0 0 512 512"><path d="M16 96C16 69.49 37.49 48 64 48C90.51 48 112 69.49 112 96C112 122.5 90.51 144 64 144C37.49 144 16 122.5 16 96zM480 64C497.7 64 512 78.33 512 96C512 113.7 497.7 128 480 128H192C174.3 128 160 113.7 160 96C160 78.33 174.3 64 192 64H480zM480 224C497.7 224 512 238.3 512 256C512 273.7 497.7 288 480 288H192C174.3 288 160 273.7 160 256C160 238.3 174.3 224 192 224H480zM480 384C497.7 384 512 398.3 512 416C512 433.7 497.7 448 480 448H192C174.3 448 160 433.7 160 416C160 398.3 174.3 384 192 384H480zM16 416C16 389.5 37.49 368 64 368C90.51 368 112 389.5 112 416C112 442.5 90.51 464 64 464C37.49 464 16 442.5 16 416zM112 256C112 282.5 90.51 304 64 304C37.49 304 16 282.5 16 256C16 229.5 37.49 208 64 208C90.51 208 112 229.5 112 256z"/></svg>
              <h2 className="text-[#b91142] text-lg font-medium tracking-tight">Keepers</h2>
            </div>
            <div className="h-0.5 bg-[#f8b6c2] rounded w-full mt-0" style={{ opacity: 0.75 }}></div>
          </div>
          <p className="mt-2 text-gray-700 text-[15px] leading-snug font-medium w-full text-left section-blurb" style={{marginBottom: 0, paddingBottom: 0}}>
            Kicaco keeps all of your child's due dates, deadlines, and time-sensitive tasks visible, so nothing slips through the cracks.
          </p>
        </section>
        {/* Keepers Cards */}
        {keepers.length > 0 && (
          <div className="flex flex-col items-center w-full pt-2 pb-2">
            {keepers.map((keeper, idx) => (
              <div key={keeper.keeperName + keeper.date + idx} className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-pink-200 flex items-center p-3 mb-4 transition hover:shadow-2xl">
                <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border border-pink-200 mr-4 bg-pink-100 flex items-center justify-center">
                  <span role="img" aria-label="keeper" style={{fontSize: 32}}>📒</span>
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h3 className="text-base font-bold text-pink-900 truncate mb-0.5">{keeper.keeperName}</h3>
                  {keeper.date && <div className="text-sm text-pink-600 mb-0.5 truncate">Date: {keeper.date}</div>}
                  {keeper.time && <div className="text-sm text-pink-600 mb-0.5 truncate">Time: {keeper.time}</div>}
                  {keeper.location && <div className="text-sm text-pink-600 truncate">Location: {keeper.location}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <GlobalChatDrawer ref={chatDrawerRef} onHeightChange={handleDrawerHeightChange} initialPosition="top">
        <div ref={scrollRef} className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4 overflow-y-auto max-h-full">
          {messages.map((msg, idx) => {
            if (msg.type === 'event_confirmation' && msg.event) {
              return (
                <ChatBubble key={msg.id} side="left" className="w-full max-w-[95vw] sm:max-w-3xl">
                  <div>
                    <EventCard
                      image={getKicacoEventPhoto(msg.event.eventName)}
                      name={msg.event.eventName}
                      date={msg.event.date}
                      time={msg.event.time}
                      location={msg.event.location}
                    />
                    <div className="mt-2 text-left w-full text-sm text-gray-900">{
                      msg.content.replace(/Want to change anything\??/, '').trim()
                    }</div>
                    <div className="mt-3 text-xs text-gray-500 font-inter">
                      Want to save this and keep building your child's schedule? Create an account to save and manage all your events in one place. No forms, just your name and email to get started!
                    </div>
                    <button
                      className="mt-3 h-[30px] px-2 border border-[#c0e2e7] rounded-md font-nunito font-semibold text-xs sm:text-sm text-[#217e8f] bg-white shadow-[-2px_2px_0px_rgba(0,0,0,0.25)] hover:shadow-[0_0_16px_4px_#c0e2e7aa,-2px_2px_0px_rgba(0,0,0,0.25)] transition-all duration-200 focus:outline-none w-[140px] active:scale-95 active:shadow-[0_0_16px_4px_#c0e2e7aa,-2px_2px_0px_rgba(0,0,0,0.15)]"
                      onClick={() => {
                        setShowSignup(true);
                        setSignupStep(0);
                        setSignupData({});
                        addMessage({
                          id: crypto.randomUUID(),
                          sender: 'assistant',
                          content: "Let's get you set up! What's your name?"
                        });
                      }}
                    >
                      Create an account
                    </button>
                  </div>
                </ChatBubble>
              );
            }
            if (msg.type === 'post_signup_options') {
              return (
                <ChatBubble key={msg.id} side="left" className="w-full max-w-[95vw] sm:max-w-3xl">
                  <PostSignupOptions onRemindLater={() => setShowPostSignupOptions(false)} />
                </ChatBubble>
              );
            }
            return (
              <ChatBubble
                key={msg.id}
                side={msg.sender === 'user' ? 'right' : 'left'}
              >
                {msg.content}
              </ChatBubble>
            );
          })}
        </div>
      </GlobalChatDrawer>
      {pendingEvent && (
        <EventConfirmationCard
          {...pendingEvent}
          onConfirm={() => {
            addEvent(pendingEvent);
            setLatestEvent(pendingEvent);
            setPendingEvent(null);
            addMessage({
              id: crypto.randomUUID(),
              sender: 'assistant',
              content: `Got it! "${pendingEvent.eventName || pendingEvent.name}" is now on your calendar.`
            });
          }}
          onCancel={() => setPendingEvent(null)}
        />
      )}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={(password) => {
          setSignupData(prev => ({ ...prev, password }));
          setShowPasswordModal(false);
          setSignupStep(2);
          // Add post-signup options message
          setTimeout(() => {
            addMessage({
              id: crypto.randomUUID(),
              sender: 'assistant',
              type: 'post_signup_options',
              content: ''
            });
          }, 400);
        }}
      />
      <GlobalFooter
        ref={footerRef}
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSend}
      />
    </div>
  );
} 