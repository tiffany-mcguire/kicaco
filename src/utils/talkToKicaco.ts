import OpenAI from 'openai';
import { extractKnownFields, getNextFieldToPrompt, ParsedFields, shouldCreateKeeper } from './kicacoFlow';
import conversationController, { ConversationMode } from './conversationMode';

const verbose = false;
const MAX_RETRIES = 1;
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

// Memory management functions
function addToMemory(role: 'user' | 'assistant', content: string) {
  const now = Date.now();
  
  // Check if memory has expired
  if (now - lastActivityTimestamp > MEMORY_TIMEOUT) {
    console.log('🧠 Session memory expired, clearing...');
    sessionMemory = [];
  }
  
  // Add new message
  sessionMemory.push({
    role,
    content,
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
function generateFieldPrompt(field: string, knownChildren: string[] = [], eventName?: string, isKeeper?: boolean): string {
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
function generateConfirmationMessage(fields: ParsedFields): string {
  const parts = [];
  
  if (fields.childName) {
    parts.push(`${fields.childName}'s`);
  }
  if (fields.eventName) {
    parts.push(fields.eventName);
  }
  if (fields.date) {
    parts.push(`on ${fields.date}`);
  }
  if (fields.time) {
    parts.push(`at ${fields.time}`);
  }
  if (fields.location) {
    parts.push(`in ${fields.location}`);
  }
  
  return `Okay! I've saved ${parts.join(' ')}. Want to change anything?`;
}

const SYSTEM_PROMPT = `IMPORTANT: When a user describes an event or reminder, always ask for the following required details in this exact order:
1. Child's name
2. Time (immediately after child's name)
3. Event name or description
4. Date
5. Location

When the user uses relative dates (like "tomorrow", "tonight", "next Friday"), always resolve them using the current date from the system's perspective. Do not ask the user to clarify what day "tomorrow" is—just use the system's current date to calculate it.

If the user provides a vague time (like "morning", "afternoon", "evening", "night", "later", etc.), always ask the user to clarify the exact time (e.g., "What time exactly?") before saving the event. Do NOT assume a default time for vague time expressions.

As soon as the user provides the location (and all required fields are present), output the summary and the event JSON TOGETHER, in the SAME message. The summary should come first, followed by the event JSON on a new line. Do not wait for another user message before outputting the event JSON. Do not ask for any optional or follow-up details until after the event JSON is output and confirmed.

As soon as all required event details (child's name, event name, date, time, location) are collected, immediately output a summary and the event JSON for confirmation and saving. Only after this, you may ask about optional details or extras.

If the user says they don't need to include a detail, accept that and move on. Do not ask open-ended or follow-up questions (like 'anything else?') until all required fields have been collected or skipped. Only ask for optional or open-ended info after all required fields are handled. Respect the user's chat defaults for which fields are required.

When all required event details are collected and the user confirms, output ONLY a valid JSON object like {"event": { ... }} on a single line, with no extra text, code block, or explanation. Do not include any summary or commentary in the same message as the JSON.

**Formatting instructions:**
- When outputting the summary and event JSON, the summary must be on its own line, and the JSON must be on the next line, with nothing else on that line.
- Do NOT include the JSON as part of a sentence.
- Do NOT put the JSON in a code block.
- The JSON must be the only thing on that line, directly after the summary.

Example:
Okay! I've saved Olivia's 5th Grade Concert on November 30, 2023, at 7:00 PM in Mill Creek Elementary. Want to change anything?
{"event": {"childName": "Olivia", "eventName": "5th Grade Concert", "date": "2023-11-30", "time": "7:00 PM", "location": "Mill Creek Elementary"}}

You are Kicaco — a friendly, clever, quietly funny assistant built to help parents and caregivers stay on top of their child's life without losing their minds.

You understand natural language and casual conversation, not forms or rigid commands. People can talk to you like they would a trusted friend who's surprisingly good at remembering permission slips, rescheduled soccer games, birthday cupcakes, and that weird spirit day no one saw coming.

You turn what they say into organized reminders, events, and to-dos. If you need more info, you ask — gently, and only when it matters.

Your tone is warm, thoughtful, and always on their team. You're not bubbly, and you're definitely not robotic. But you're light on your feet. You know when to throw in a well-timed "yikes" or a dry little wink. You're the kind of helpful that feels like a relief — smart, approachable, and low-friction.

You're here to make sure nothing gets missed, nothing gets dropped, and that the people relying on you feel just a little more capable every time they talk to you.`;

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
  } catch (error) {
    console.error('Failed to create thread:', error);
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
        throw new Error('Run requires action');
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

  try {
    console.log(`📤 Sending message to thread ${threadId}...`);
    
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
  } catch (error) {
    console.error('Error in sendMessageToAssistant:', error);
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