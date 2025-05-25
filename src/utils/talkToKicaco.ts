import OpenAI from 'openai';

const verbose = false;
const MAX_RETRIES = 1;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  project: import.meta.env.VITE_OPENAI_PROJECT_ID,
  dangerouslyAllowBrowser: true
});

export async function createOpenAIThread(): Promise<string> {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

async function pollRunStatus(threadId: string, runId: string, maxWaitTime: number): Promise<string> {
  let runStatus = 'in_progress';
  let waited = 0;
  let interval = 300;

  while (
    runStatus !== 'completed' &&
    runStatus !== 'failed' &&
    runStatus !== 'cancelled' &&
    waited < maxWaitTime
  ) {
    await new Promise(res => setTimeout(res, interval));
    waited += interval;

    const updatedRun = await openai.beta.threads.runs.retrieve(threadId, runId);
    runStatus = updatedRun.status;

    if (verbose) console.log('Polling run status:', runStatus, 'waited:', waited, 'ms');

    // Increase interval up to a reasonable cap (e.g., 1500ms)
    interval = Math.min(interval * 1.5, 1500);
  }

  if (waited >= maxWaitTime) {
    console.error(`Run timed out after ${maxWaitTime}ms. Final status: ${runStatus}`);
    throw new Error("Kicaco got stuck thinking. Please try again.");
  }

  return runStatus;
}

export async function sendMessageToAssistant(threadId: string, userMessage: string): Promise<string> {
  if (verbose) console.log('Using assistant ID:', import.meta.env.VITE_ASSISTANT_ID);
  
  // Send the user's message to the thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: userMessage,
  });

  let retryCount = 0;
  let runStatus: string;

  while (retryCount <= MAX_RETRIES) {
    try {
      // Start a run for the assistant
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: import.meta.env.VITE_ASSISTANT_ID,
      });

      runStatus = await pollRunStatus(threadId, run.id, 10000);
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

  // Retrieve messages only after run completes to avoid premature or duplicate API calls
  const messages = await openai.beta.threads.messages.list(threadId);
  const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
  
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

  return textBlock.text.value;
} 