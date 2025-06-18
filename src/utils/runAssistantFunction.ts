console.log('OPENAI KEY:', import.meta.env.VITE_OPENAI_API_KEY);
import OpenAI from 'openai';

console.log('VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY);

declare global {
  interface ImportMeta {
    env: {
      VITE_OPENAI_API_KEY: string;
      VITE_ASSISTANT_ID: string;
      VITE_OPENAI_PROJECT_ID: string;
    };
  }
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Make sure this env var is set
  dangerouslyAllowBrowser: true
});

export async function runAssistantFunction({
  assistantId,
  threadId,
  functionName,
  parameters
}: {
  assistantId: string;
  threadId: string;
  functionName: string;
  parameters: Record<string, any>;
}) {
  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      tools: [{ type: 'function', function: { name: functionName } }],
      tool_choice: {
        type: 'function',
        function: { name: functionName }
      }
    });

    // Submit the tool call input
    const outputs = [
      {
        tool_call_id: run.required_action?.submit_tool_outputs.tool_calls[0].id || '',
        output: JSON.stringify(parameters)
      }
    ];
    
    const result = await openai.beta.threads.runs.submitToolOutputs(run.id, {
      thread_id: threadId,
      tool_outputs: outputs
    });

    return result;
  } catch (err) {
    console.error('Error running assistant function:', err);
    return null;
  }
} 