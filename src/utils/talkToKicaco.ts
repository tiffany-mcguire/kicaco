import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  project: import.meta.env.VITE_OPENAI_PROJECT_ID,
  dangerouslyAllowBrowser: true
});

export async function createOpenAIThread(): Promise<string> {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

export async function sendMessageToAssistant(threadId: string, userMessage: string): Promise<string> {
  console.log('Using assistant ID:', import.meta.env.VITE_ASSISTANT_ID);
  // Send the user's message to the thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: userMessage,
  });

  // Start a run for the assistant
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: import.meta.env.VITE_ASSISTANT_ID,
  });

  // Poll for run completion
  let runStatus = run.status;
  let runId = run.id;
  while (runStatus !== 'completed' && runStatus !== 'failed' && runStatus !== 'cancelled') {
    await new Promise(res => setTimeout(res, 1000));
    const updatedRun = await openai.beta.threads.runs.retrieve(threadId, runId);
    runStatus = updatedRun.status;
  }

  // Get the latest assistant message
  const messages = await openai.beta.threads.messages.list(threadId);
  const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
  if (assistantMessage && Array.isArray(assistantMessage.content)) {
    const textBlock = assistantMessage.content.find(block => block.type === 'text');
    if (textBlock && 'text' in textBlock && textBlock.text.value) {
      return textBlock.text.value;
    }
  }
  return 'No reply from assistant.';
} 