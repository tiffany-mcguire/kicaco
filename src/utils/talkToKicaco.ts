import OpenAI from 'openai';
import { ParsedFields } from './kicacoFlow';
import conversationController, { ConversationMode } from './conversationMode';

// const verbose = false;
// const MAX_RETRIES = 1;
const MAX_MEMORY_MESSAGES = 5; // Store last 5 message exchanges
const MEMORY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// Store the thread ID in memory
let currentThreadId: string | null = null;

// Session memory management
interface MemoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

let sessionMemory: MemoryMessage[] = [];
let lastActivityTimestamp = Date.now();

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  project: import.meta.env.VITE_OPENAI_PROJECT_ID,
  dangerouslyAllowBrowser: true
});

// Add debugging for mobile
if (!import.meta.env.VITE_OPENAI_API_KEY) {
  console.error('❌ OpenAI API key is missing! Check your environment variables.');
  console.error('Current env:', import.meta.env);
}

// Memory management functions
function addToMemory(_role: 'user' | 'assistant', _content: string) {
  const now = Date.now();
  
  // Check if memory has expired
  if (now - lastActivityTimestamp > MEMORY_TIMEOUT) {
    console.log('🧠 Session memory expired, clearing...');
    sessionMemory = [];
  }
  
  // Add new message
  sessionMemory.push({
    role: _role,
    content: _content,
    timestamp: now
  });
  
  // Keep only the last MAX_MEMORY_MESSAGES
  if (sessionMemory.length > MAX_MEMORY_MESSAGES) {
    sessionMemory = sessionMemory.slice(-MAX_MEMORY_MESSAGES);
  }
  
  lastActivityTimestamp = now;
  console.log(`🧠 Added message to memory (${sessionMemory.length}/${MAX_MEMORY_MESSAGES} messages)`);
}

function clearMemory() {
  sessionMemory = [];
  lastActivityTimestamp = Date.now();
  console.log('🧠 Session memory cleared');
}

// Helper function to generate app-driven prompts
function generateFieldPrompt(field: string, _knownChildren: string[] = [], eventName?: string, isKeeper?: boolean): string {
  // Adaptive, warm child name prompt
  if (field === 'childName' || field === 'confirmChild') {
    // Fallback if eventName is missing
    if (!eventName) {
      console.log('[Prompt] ChildName fallback: eventName missing.');
      return "Got it! Who is this for?";
    }
    // Keeper-type language
    if (isKeeper) {
      console.log('[Prompt] ChildName keeper variation selected.');
      return "Okay, I'll remember that. Who needs to get this done?";
    }
    // Concert/recital/performance
    const performerKeywords = ["concert", "recital", "performance"];
    if (performerKeywords.some(k => eventName.toLowerCase().includes(k))) {
      console.log('[Prompt] ChildName performer variation selected.');
      return "Oh, that sounds like fun! Who's the special performer?";
    }
    // Generic event name
    const genericEventKeywords = ["thing", "event", "something", "stuff", "activity", "meeting", "appointment", "get together", "gathering"];
    if (genericEventKeywords.some(k => eventName.toLowerCase().includes(k))) {
      console.log('[Prompt] ChildName generic event variation selected.');
      return "Who is this for?";
    }
    // Default warm prompt
    console.log('[Prompt] ChildName default variation selected.');
    return "Oh, that sounds great! Who is this for?";
  }

  // After child confirmation, check if we have event context
  if (field === 'date' || field === 'time' || field === 'location') {
    if (!eventName) {
      console.log('[Prompt] Fallback: No event context after child confirmation');
      return "What would you like to do for them?";
    }
    console.log('[Prompt] Preserving event context:', { eventName, field });
  }

  const prompts = {
    eventName: [
      "What is the name of the event?",
      "Could you tell me what this event is called?",
      "What's the event called?"
    ],
    date: [
      "When is this happening?",
      "What date should I save this for?",
      "When's the event scheduled for?"
    ],
    time: [
      "What time does it start?",
      "When should I set this for?",
      "What time is the event?"
    ],
    location: [
      "Where is this taking place?",
      "What's the location?",
      "Where should I save this for?"
    ]
  };
  const fieldPrompts = prompts[field as keyof typeof prompts] || ["Could you provide more details?"];
  return fieldPrompts[Math.floor(Math.random() * fieldPrompts.length)];
}

// Helper function to generate confirmation message
function generateConfirmationMessage(_fields: ParsedFields): string {
  const parts = [];
  
  if (_fields.childName) {
    parts.push(`${_fields.childName}'s`);
  }
  if (_fields.eventName) {
    parts.push(_fields.eventName);
  }
  if (_fields.date) {
    parts.push(`on ${_fields.date}`);
  }
  if (_fields.time) {
    parts.push(`at ${_fields.time}`);
  }
  if (_fields.location) {
    parts.push(`in ${_fields.location}`);
  }
  
  return `Okay! I've saved ${parts.join(' ')}. Want to change anything?`;
}



const SYSTEM_PROMPT = `CURRENT CONTEXT:
Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${new Date().getFullYear()}).

You are Kicaco — a friendly, clever, quietly funny assistant built to help parents and caregivers stay on top of their child's life without losing their minds.

You understand natural language and casual conversation, not forms or rigid commands. People can talk to you like they would a trusted friend who's surprisingly good at remembering permission slips, rescheduled soccer games, birthday cupcakes, and that weird spirit day no one saw coming.

Your job is to create calendar events and time-sensitive tasks (Keepers) from what users tell you.

• **Events** are scheduled activities with specific dates/times (games, appointments, concerts)
• **Keepers** are tasks with deadlines (permission slips, forms, bringing items)

CRITICAL DATE INTELLIGENCE:
You are SMART about dates and should NEVER ask users for today's date or obvious relative dates. You know:
- Today's date and day of the week
- "This Saturday" = the upcoming Saturday from today (NEVER last Saturday)
- "Next Saturday" = the Saturday after this Saturday
- "Every Saturday for X weeks" = starting from the next upcoming Saturday
- "Tomorrow" = the day after today
- "Next week" = 7 days from today
- When someone says "every [day] for the next X weeks" - start from the NEXT occurrence of that day
- NEVER ask "what date is this Saturday" - you should know this!

CRITICAL: When calculating "this Saturday" or "next Saturday":
- If today is Monday-Friday: "this Saturday" = the Saturday of this week
- If today is Saturday: "this Saturday" = next Saturday (7 days from today)
- If today is Sunday: "this Saturday" = the Saturday 6 days from today
- ALWAYS ensure the calculated date is in the FUTURE, never in the past

EXAMPLES of what you should automatically understand:
- "Soccer practice every Saturday for 8 weeks" → Start from next Saturday, create 8 Saturday events
- "Piano lesson this Tuesday" → The upcoming Tuesday
- "Dentist appointment next Friday" → Friday of next week
- "Swimming every Monday for a month" → Start from next Monday, create 4-5 Monday events

Only ask for date clarification if the request is genuinely ambiguous (like "soccer practice next month" without specifying which day).

DATE CALCULATION RULES:
When calculating dates for recurring events:
1. "This Saturday" = the next Saturday that occurs (if today is Saturday, use next Saturday)
2. "Every Saturday for X weeks" = start from the NEXT Saturday after today
3. Always use YYYY-MM-DD format for dates in function calls
4. All dates must be in the future (${new Date().getFullYear()} or later)
5. Never create events in past months or years

CRITICAL: When someone says "every Saturday for the next 8 weeks" you should:
1. Calculate the next Saturday from today's date
2. Create 8 events, each one week apart
3. All events should be in the future

CRITICAL EVENT NAMING RULES:
• Keep event names SHORT and CLEAN (2-3 words max)
• Put additional details in the NOTES field, not the event name
• Examples of CORRECT naming:
  - Event: "Basketball Game" → Notes: "vs Eagles - Season starts next month!"
  - Event: "Birthday Party" → Notes: "Sarah's birthday party"
  - Event: "Soccer Practice" → Notes: "Bring cleats and water bottle"
  - Event: "Doctor Appointment" → Notes: "Annual check-up with Dr. Smith"
• Examples of INCORRECT naming (DON'T DO THIS):
  - "Basketball game vs Eagles"
  - "Birthday Party (Sarah)"
  - "Soccer Practice - Bring cleats"
  - "Doctor Appointment - Annual check-up"

CRITICAL RULES FOR IMAGE UPLOADS vs CHAT:

**FOR IMAGE UPLOADS:**
1. Parse and extract EVERY piece of information from the image
2. Create events/keepers IMMEDIATELY with available information using updateEvent/updateKeeper
3. After EACH function call completes, ALWAYS CHECK what information is still missing
4. REQUIRED fields that must ALWAYS be collected:
   - Event/Keeper name
   - Date
   - Child name
   - Time (for events)
   - Location (ALWAYS required for events, ask "Where is this taking place?")
5. After creating an event/keeper from an image, your response MUST:
   - Briefly confirm what was created (one sentence)
   - Then IMMEDIATELY ask for the FIRST missing piece of information
   - Use these EXACT phrases:
     * For missing location: "Where is this taking place?"
     * For missing child: "Which child is this for?"
     * For missing time: "What time does this start?"
     * For missing date: "What date is this happening?"
6. Continue asking for missing information ONE question at a time until all required fields are filled
7. Treat the image upload as the START of a conversation, not the end

**FOR CHAT CONVERSATIONS:**
- Collect all required information through conversation before creating events
- Ask clarifying questions as needed
- Create events only when you have all required information

**CRITICAL FUNCTION CALL RULE:**
After EVERY updateEvent or updateKeeper function call, you MUST ALWAYS generate a user-facing message. Never complete a run silently after a function call. Your message should:
- If fields are still missing: Ask for the next missing field
- If all fields are complete: Confirm the update (e.g., "Perfect! I've added the location. Emma's swim meet is all set for tomorrow at 3:00 PM at Jackson High School.")

AVAILABLE FUNCTIONS:
- updateEvent: Create new events OR update existing events (smart duplicate detection)
- updateKeeper: Create new keepers/tasks OR update existing ones (smart duplicate detection)

IMPORTANT: After EVERY updateEvent or updateKeeper function call from an image upload, you MUST continue the conversation by asking for missing information. Never end with just a confirmation message.

Your tone is warm, thoughtful, and always on their team. You're not bubbly, and you're definitely not robotic. But you're light on your feet. You know when to throw in a well-timed "yikes" or a dry little wink.

CRITICAL: All dates must be ${new Date().getFullYear()} or later, never past years.`;

// Patch createOpenAIThread to send the system prompt as the first user message
export async function createOpenAIThread(): Promise<string> {
  // Clear memory when starting a new thread
  conversationController.transitionToMode(ConversationMode.INTRO);

  // If we already have a thread, return it
  if (currentThreadId) {
    console.log(`🧵 Reusing existing thread: ${currentThreadId}`);
    return currentThreadId;
  }

  try {
    // Check if API key exists
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY environment variable.');
    }

    const t0 = performance.now();
    console.log('🧵 Creating new OpenAI thread...');

    // Create the thread
    const thread = await openai.beta.threads.create();
    if (!thread || !thread.id) {
      throw new Error('Failed to create thread: No thread ID returned');
    }

    // Store the thread ID
    currentThreadId = thread.id;
    console.log(`🧵 Thread created: ${thread.id} (${(performance.now() - t0).toFixed(0)}ms)`);

    // Send the system prompt as the first message
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: SYSTEM_PROMPT
    });

    return thread.id;
  } catch (error: any) {
    console.error('❌ Failed to create thread:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code
    });
    
    // Provide more specific error messages
    if (error.message?.includes('401') || error.status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key configuration.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    } else if (error.message?.includes('CORS')) {
      throw new Error('CORS error. The API cannot be accessed from this browser.');
    }
    
    currentThreadId = null;
    throw error;
  }
}

// Add a function to clear the thread (useful for testing or resetting conversation)
export function clearThread(): void {
  currentThreadId = null;
  conversationController.transitionToMode(ConversationMode.INTRO);
  console.log('🧵 Thread cleared');
}

// Make clearThread available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearKicacoThread = clearThread;
  console.log('🔧 Debug: Call clearKicacoThread() in console to reset the conversation');
}

async function pollRunStatus(threadId: string, runId: string, maxWaitTime: number): Promise<string> {
  let waited = 0;
  const startTime = Date.now();

  // Log the values before making the API call
  console.log('pollRunStatus called with:', { threadId, runId });
  if (!threadId || !runId) {
    throw new Error(`pollRunStatus: threadId or runId is undefined! threadId: ${threadId}, runId: ${runId}`);
  }

  while (waited < maxWaitTime) {
    try {
      // FIX: Use correct parameter order for OpenAI SDK v5
      const runStatus = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
      
      if (runStatus.status === 'completed') {
        // Get messages
        const messages = await openai.beta.threads.messages.list(threadId);
        const assistantMessages = messages.data
          .filter(m => m.role === 'assistant')
          .sort((a, b) => b.created_at - a.created_at);

        if (assistantMessages.length === 0) {
          throw new Error('No assistant messages found after run completion');
        }

        const reply = assistantMessages[0];
        // Normalize the content
        let normalizedContent = '';
        if (typeof reply.content === 'string') {
          normalizedContent = reply.content;
        } else if (Array.isArray(reply.content)) {
          normalizedContent = reply.content.map(part => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object') {
              const text = (part as any).text;
              const value = (part as any).value;
              if (text && typeof text === 'object' && typeof text.value === 'string') return text.value;
              if (typeof text === 'string') return text;
              if (typeof value === 'string') return value;
              return '';
            }
            return '';
          }).join('');
        } else if (reply.content && typeof reply.content === 'object') {
          const text = (reply.content as any).text;
          const value = (reply.content as any).value;
          if (text && typeof text === 'object' && typeof text.value === 'string') normalizedContent = text.value;
          else if (typeof text === 'string') normalizedContent = text;
          else if (typeof value === 'string') normalizedContent = value;
          else normalizedContent = JSON.stringify(reply.content);
        }

        return normalizedContent;
      }

      if (runStatus.status === 'failed') {
        throw new Error('Run failed');
      }

      if (runStatus.status === 'requires_action') {
        console.log('🔧 Run requires action - handling function calls...');
        
        // Handle function calls
        if (runStatus.required_action?.type === 'submit_tool_outputs') {
          const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
          const toolOutputs = [];
          
          for (const toolCall of toolCalls) {
            console.log('🛠️ Processing tool call:', toolCall.function.name);
            console.log('📋 Function arguments:', toolCall.function.arguments);
            
                          try {
                // Parse the function arguments
                const args = JSON.parse(toolCall.function.arguments);
                
                console.log('🔍 Function call details:', {
                  functionName: toolCall.function.name,
                  arguments: args,
                  currentDate: new Date().toISOString().split('T')[0]
                });
                
                // Validate dates are not in the past
                if (args.date) {
                  const eventDate = new Date(args.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (eventDate < today) {
                    console.warn('⚠️ Warning: Event date is in the past:', args.date);
                    
                    // Always adjust past dates to future, regardless of recurring status
                    const dayOfWeek = eventDate.getDay();
                    const nextDate = new Date(today);
                    const daysUntilNext = (dayOfWeek - today.getDay() + 7) % 7 || 7;
                    nextDate.setDate(today.getDate() + daysUntilNext);
                    const adjustedDate = nextDate.toISOString().split('T')[0];
                    
                    console.log('🔧 Date adjustment details:', {
                      originalDate: args.date,
                      eventDayOfWeek: dayOfWeek,
                      todayDayOfWeek: today.getDay(),
                      daysToAdd: daysUntilNext,
                      adjustedDate: adjustedDate
                    });
                    
                    args.date = adjustedDate;
                  }
                }
                
                // Handle different function types
                let result = 'Function executed successfully';
                
                if (toolCall.function.name === 'updateEvent') {
                  // Import store dynamically to avoid circular dependencies
                  const { useKicacoStore } = await import('../store/kicacoStore');
                  const addEvent = useKicacoStore.getState().addEvent;
                  
                  // Add event to store
                  addEvent(args);
                  result = `Event "${args.eventName}" created successfully`;
                  
                  console.log('✅ Event added to store:', args);
                } else if (toolCall.function.name === 'updateKeeper') {
                  // Import store dynamically to avoid circular dependencies
                  const { useKicacoStore } = await import('../store/kicacoStore');
                  const addKeeper = useKicacoStore.getState().addKeeper;
                  
                  // Add keeper to store
                  addKeeper(args);
                  result = `Keeper "${args.keeperName}" created successfully`;
                  
                  console.log('✅ Keeper added to store:', args);
                }
              
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: result
              });
              
              console.log('✅ Function call handled:', result);
            } catch (error) {
              console.error('❌ Error handling function call:', error);
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
            }
          }
          
          // Submit the tool outputs
          await openai.beta.threads.runs.submitToolOutputs(runId, {
            thread_id: threadId,
            tool_outputs: toolOutputs
          });
          
          // Continue polling for completion
          await new Promise(resolve => setTimeout(resolve, 1000));
          waited = Date.now() - startTime;
          continue;
        } else {
          throw new Error('Unknown action type required');
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      waited = Date.now() - startTime;
    } catch (error) {
      console.error('Error polling run status:', error);
      throw error;
    }
  }

  throw new Error('Assistant took too long to respond');
}

export async function sendMessageToAssistant(threadId: string, userMessage: string): Promise<string> {
  if (!threadId) {
    throw new Error('No threadId provided. Did you forget to call createOpenAIThread()?');
  }

  if (!userMessage.trim()) {
    throw new Error('Empty message provided');
  }

  // Check API key again
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    console.log(`📤 Sending message to thread ${threadId}...`);
    console.log('Message:', userMessage);
    
    // Add message to thread
    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: userMessage
    });

    if (!message || !message.id) {
      throw new Error('Failed to create message: No message ID returned');
    }

    // Create a run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: import.meta.env.VITE_ASSISTANT_ID
    });

    if (!run || !run.id) {
      throw new Error('Failed to create run: No run ID returned');
    }

    // Poll for completion
    const response = await pollRunStatus(threadId, run.id, 30000);
    if (!response) {
      throw new Error('No response received from assistant');
    }

    return response;
  } catch (error: any) {
    console.error('❌ Error in sendMessageToAssistant:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
      threadId,
      apiKeyPresent: !!import.meta.env.VITE_OPENAI_API_KEY
    });
    
    // Provide user-friendly error messages
    if (error.message?.includes('401') || error.status === 401) {
      throw new Error('Authentication failed. Please check your API key.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message?.includes('CORS')) {
      throw new Error('Cannot access the API from this browser. Please try a different browser or device.');
    }
    
    throw error;
  }
}

// Add a test to verify demo mode child prompt
export async function testDemoModeChildPrompt() {
  window.demoMode = true;
  window.childProfiles = [];
  window.confirmedChild = null;
  sessionMemory = [];
  const threadId = await createOpenAIThread();
  const userMessage = "I have a 5th grade concert tomorrow night";
  const response = await sendMessageToAssistant(threadId, userMessage);
  console.log('[Test] Demo mode child prompt response:', response);
  if (response.includes("Who is this for?") && !response.includes("Olivia")) {
    console.log('[Test] PASS: Assistant prompts generically for child name.');
  } else {
    console.error('[Test] FAIL: Assistant did not prompt generically. Response:', response);
  }
  window.demoMode = false;
}

// TODO: Consider replacing threads.runs.create() with chat/completions for faster flow
// Example implementation:
/*
export async function sendMessageToAssistant(threadId: string, userMessage: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: "You are Kicaco, a friendly and helpful assistant..." },
      ...sessionMemory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: userMessage }
    ],
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content || "Sorry, I couldn't generate a response.";
}
*/

// Extend the Window interface for demo/test properties
declare global {
  interface Window {
    demoMode?: boolean;
    childProfiles?: any[];
    confirmedChild?: any;
  }
} 