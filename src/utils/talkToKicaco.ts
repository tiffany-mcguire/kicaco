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

export async function createOpenAIThread(): Promise<string> {
  // Clear memory when starting a new thread
  conversationController.transitionToMode(ConversationMode.INTRO);
  
  // If we already have a thread, return it
  if (currentThreadId) {
    console.log(`🧵 Reusing existing thread: ${currentThreadId}`);
    return currentThreadId;
  }

  const t0 = performance.now();
  const thread = await openai.beta.threads.create();
  const t1 = performance.now();
  console.log(`🧵 New thread created in ${Math.round(t1 - t0)}ms: ${thread.id}`);
  
  // Store the new thread ID
  currentThreadId = thread.id;
  return thread.id;
}

// Add a function to clear the thread (useful for testing or resetting conversation)
export function clearThread(): void {
  currentThreadId = null;
  conversationController.transitionToMode(ConversationMode.INTRO);
  console.log('🧵 Thread cleared');
}

async function pollRunStatus(threadId: string, runId: string, maxWaitTime: number): Promise<string> {
  let runStatus = 'in_progress';
  let waited = 0;
  let attempts = 0;
  const pollStart = performance.now();
  
  // Start with fast polling (100ms) for the first 20 attempts
  const INITIAL_INTERVAL = 100;
  const MAX_ATTEMPTS_BEFORE_BACKOFF = 20;
  const MAX_INTERVAL = 1000;
  const BACKOFF_FACTOR = 1.2; // More gradual backoff

  while (
    runStatus !== 'completed' &&
    runStatus !== 'failed' &&
    runStatus !== 'cancelled' &&
    waited < maxWaitTime
  ) {
    const pollIterationStart = performance.now();
    const updatedRun = await openai.beta.threads.runs.retrieve(threadId, runId);
    const pollIterationEnd = performance.now();
    
    runStatus = updatedRun.status;
    attempts++;
    
    // Log each poll attempt with timing
    if (verbose) {
      console.log(`⏱️ Poll #${attempts} took ${Math.round(pollIterationEnd - pollIterationStart)}ms, status: ${runStatus}`);
    }

    // If we're done, return immediately
    if (runStatus === 'completed' || runStatus === 'failed' || runStatus === 'cancelled') {
      const pollEnd = performance.now();
      console.log(`✅ Run ${runStatus} after ${attempts} attempts, total polling time: ${Math.round(pollEnd - pollStart)}ms`);
      return runStatus;
    }

    // Calculate next interval
    let interval;
    if (attempts < MAX_ATTEMPTS_BEFORE_BACKOFF) {
      interval = INITIAL_INTERVAL;
    } else {
      // More gradual backoff after initial fast polling
      interval = Math.min(
        INITIAL_INTERVAL * Math.pow(BACKOFF_FACTOR, attempts - MAX_ATTEMPTS_BEFORE_BACKOFF),
        MAX_INTERVAL
      );
    }

    // Add a small random jitter to prevent thundering herd
    interval += Math.random() * 50;

    await new Promise(res => setTimeout(res, interval));
    waited += interval;
  }

  const pollEnd = performance.now();
  console.log(`⏱️ Polling stopped after ${attempts} attempts, total time: ${Math.round(pollEnd - pollStart)}ms`);

  if (waited >= maxWaitTime) {
    console.error(`Run timed out after ${maxWaitTime}ms. Final status: ${runStatus}`);
    throw new Error("Kicaco got stuck thinking. Please try again.");
  }

  return runStatus;
}

export async function sendMessageToAssistant(threadId: string, userMessage: string): Promise<string> {
  const t0 = performance.now();
  console.log('📤 Starting assistant message flow...');

  if (verbose) console.log('Using assistant ID:', import.meta.env.VITE_ASSISTANT_ID);
  
  // Handle mode-specific logic
  const currentMode = conversationController.getCurrentMode();
  
  // Get prior context from collected fields
  const prevFields = conversationController.getCollectedFields();
  console.log('🔍 Prior collected fields:', prevFields);
  
  // Extract fields from current message
  const parsedFields = extractKnownFields(userMessage);
  console.log('🔍 Fields from current message:', parsedFields);
  
  // Merge fields from current message with prior context
  const mergedFields = {
    ...prevFields,
    ...parsedFields,
    // Preserve event context unless explicitly cleared
    eventName: parsedFields.eventName || prevFields.eventName,
    isKeeper: parsedFields.isKeeper !== undefined ? parsedFields.isKeeper : prevFields.isKeeper
  };
  console.log('🔍 Merged fields:', mergedFields);
  
  const eventName = mergedFields.eventName || '';
  const isKeeper = mergedFields.isKeeper || shouldCreateKeeper(userMessage);
  
  // Get list of known children
  let knownChildren: string[] = [];
  if (window.demoMode) {
    knownChildren = [];
    window.childProfiles = [];
    window.confirmedChild = null;
    sessionMemory = [];
    console.log('[Demo] Demo mode: childProfiles, confirmedChild, and sessionMemory reset.');
  } else {
    if (window.childProfiles && Array.isArray(window.childProfiles)) {
      knownChildren = window.childProfiles.map((c: any) => c.name).filter(Boolean);
    }
  }
  
  if (currentMode === ConversationMode.INTRO) {
    if (conversationController.shouldTransitionToFlow(userMessage, mergedFields)) {
      console.log('🎯 Detected event/keeper content, transitioning to FLOW mode');
      conversationController.transitionToMode(ConversationMode.FLOW);
      conversationController.cancelPendingIntroMessage();
      
      // Update fields before getting next prompt
      conversationController.updateCollectedFields(mergedFields);
      
      const nextField = getNextFieldToPrompt(mergedFields, knownChildren);
      if (nextField) {
        const fieldPrompt = generateFieldPrompt(nextField, knownChildren, eventName, isKeeper);
        return fieldPrompt;
      }
    } else {
      const introMessage = conversationController.getIntroMessage();
      if (introMessage) {
        conversationController.incrementIntroMessages();
        return introMessage;
      }
    }
  }
  
  let promptMessage = userMessage;
  
  if (currentMode === ConversationMode.FLOW) {
    // Check if this is a child name confirmation
    const isChildConfirmation = parsedFields.childName && !prevFields.childName && 
      !parsedFields.eventName && !parsedFields.date && !parsedFields.time && !parsedFields.location;
    
    if (isChildConfirmation) {
      console.log('👶 Child name confirmation detected:', parsedFields.childName);
      
      // Check for prior event context
      const hasEventContext = prevFields.eventName || prevFields.date || prevFields.time || 
                            prevFields.location || prevFields.isKeeper;
      
      console.log('🔍 Event context check:', {
        hasEventContext,
        priorFields: prevFields,
        mergedFields
      });
      
      // Update fields while preserving context
      conversationController.updateCollectedFields(mergedFields);
      
      if (hasEventContext) {
        console.log('✅ Preserved event context, moving to next field');
        const nextField = getNextFieldToPrompt(mergedFields, knownChildren);
        if (nextField) {
          const fieldPrompt = generateFieldPrompt(nextField, knownChildren, prevFields.eventName || '', isKeeper);
          console.log(`📝 Next prompt after child confirmation: ${fieldPrompt}`);
          return fieldPrompt;
        }
      } else {
        console.log('⚠️ No event context found, triggering fallback');
        return `What are you planning for ${parsedFields.childName}?`;
      }
    }
    
    // Regular field collection flow
    conversationController.updateCollectedFields(mergedFields);
    const nextField = getNextFieldToPrompt(mergedFields, knownChildren);
    
    if (nextField) {
      const fieldPrompt = generateFieldPrompt(nextField, knownChildren, eventName, isKeeper);
      promptMessage = `${userMessage}\n\n${fieldPrompt}`;
      console.log(`📝 Adding field prompt for ${nextField}: ${fieldPrompt}`);
    } else {
      conversationController.transitionToMode(ConversationMode.CONFIRMATION);
      promptMessage = generateConfirmationMessage(mergedFields);
      console.log('📝 All fields collected, generating confirmation message');
    }
  } else if (currentMode === ConversationMode.CONFIRMATION) {
    // Do NOT prompt for relationship in CONFIRMATION mode
    console.log('[Relationship] Skipping relationship prompt in CONFIRMATION mode.');
    // Check if user wants to edit
    if (userMessage.toLowerCase().includes('yes') || 
        userMessage.toLowerCase().includes('change') || 
        userMessage.includes('edit')) {
      conversationController.transitionToMode(ConversationMode.FLOW);
      const nextField = getNextFieldToPrompt(conversationController.getCollectedFields(), knownChildren);
      if (nextField) {
        promptMessage = generateFieldPrompt(nextField, knownChildren, eventName, isKeeper);
      }
    } else {
      // User confirmed, transition to signup
      conversationController.transitionToMode(ConversationMode.SIGNUP);
      const eventObj = conversationController.getCollectedFields();
      promptMessage = `__EVENT_SIGNUP__${encodeURIComponent(JSON.stringify(eventObj))}`;
    }
  } else if (currentMode === ConversationMode.SIGNUP) {
    // Only in SIGNUP mode, prompt for relationship if needed
    // (Add your relationship prompt logic here if required)
    console.log('[Relationship] Allowed to prompt for relationship in SIGNUP mode.');
    // ...
  }
  
  // Send the message to the thread
  const messageStart = performance.now();
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: promptMessage,
  });
  const messageEnd = performance.now();
  console.log(`📝 User message created in ${Math.round(messageEnd - messageStart)}ms`);

  let retryCount = 0;
  let runStatus: string = 'in_progress';

  while (retryCount <= MAX_RETRIES) {
    try {
      // Start a run for the assistant
      const runStart = performance.now();
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: import.meta.env.VITE_ASSISTANT_ID,
      });
      const runEnd = performance.now();
      console.log(`🏃 Run created in ${Math.round(runEnd - runStart)}ms`);

      const pollStart = performance.now();
      runStatus = await pollRunStatus(threadId, run.id, 10000);
      const pollEnd = performance.now();
      console.log(`⏱️ Run completed in ${Math.round(pollEnd - pollStart)}ms`);
      
      break; // If we get here, the run completed successfully
    } catch (error) {
      if (retryCount === MAX_RETRIES) {
        console.error('All retry attempts failed:', error);
        throw error; // Re-throw the last error if we're out of retries
      }
      retryCount++;
      console.log(`Retry attempt ${retryCount} of ${MAX_RETRIES}`);
      await new Promise(res => setTimeout(res, 1000)); // Wait 1s before retry
    }
  }

  if (runStatus === 'failed' || runStatus === 'cancelled') {
    console.error('Assistant run failed or was cancelled:', runStatus);
    return 'Sorry, I encountered an error processing your request.';
  }

  // Retrieve messages only after run completes
  const retrieveStart = performance.now();
  const messages = await openai.beta.threads.messages.list(threadId);
  const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
  const retrieveEnd = performance.now();
  console.log(`📥 Messages retrieved in ${Math.round(retrieveEnd - retrieveStart)}ms`);
  
  if (!assistantMessage) {
    console.error('No assistant message found in thread');
    return 'No reply from assistant.';
  }

  if (!Array.isArray(assistantMessage.content)) {
    console.error('Assistant message content is not in expected format');
    return 'No reply from assistant.';
  }

  const textBlock = assistantMessage.content.find(block => block.type === 'text');
  if (!textBlock || !('text' in textBlock) || !textBlock.text.value) {
    console.error('No valid text content found in assistant message');
    return 'No reply from assistant.';
  }

  const t1 = performance.now();
  console.log(`🧪 Total end-to-end latency: ${Math.round(t1 - t0)}ms`);

  return textBlock.text.value;
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