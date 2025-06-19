const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for long system prompts

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  project: process.env.VITE_OPENAI_PROJECT_ID || process.env.OPENAI_PROJECT_ID,
});

// Store thread IDs in memory (use Redis or DB for production)
const threadStore = new Map();

// Create thread endpoint
app.post('/api/threads', async (req, res) => {
  try {
    console.log('Creating thread for session:', req.headers['x-session-id']);
    
    const thread = await openai.beta.threads.create();
    console.log('Thread created:', thread.id);
    
    // Send system prompt
    const systemPrompt = req.body.systemPrompt || 'You are a helpful assistant.';
    console.log('System prompt length:', systemPrompt.length);
    
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: systemPrompt
    });
    
    // Store thread ID with session/user ID
    const sessionId = req.headers['x-session-id'] || 'default';
    threadStore.set(sessionId, thread.id);
    
    res.json({ threadId: thread.id });
  } catch (error) {
    console.error('Error creating thread:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    res.status(500).json({ 
      error: 'Failed to create thread',
      details: error.message 
    });
  }
});

// Helper function to handle function calls
async function handleFunctionCalls(threadId, runId) {
  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    
    if (run.status !== 'requires_action' || !run.required_action) {
      return run;
    }
    
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
    const toolOutputs = [];
    
    console.log(`Processing ${toolCalls.length} function calls...`);
    
    for (const toolCall of toolCalls) {
      console.log(`Function call: ${toolCall.function.name}`);
      console.log(`Arguments: ${toolCall.function.arguments}`);
      
      let output;
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      
      // Handle different function types
      switch (functionName) {
        case 'create_event':
          output = {
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              success: true,
              event: {
                id: `event_${Date.now()}`,
                name: args.name || 'New Event',
                date: args.date,
                time: args.time,
                childName: args.childName,
                category: args.category || 'general'
              }
            })
          };
          break;
          
        case 'create_keeper':
          output = {
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              success: true,
              keeper: {
                id: `keeper_${Date.now()}`,
                name: args.name || 'New Keeper',
                dueDate: args.dueDate,
                childName: args.childName,
                category: args.category || 'general'
              }
            })
          };
          break;
          
        case 'get_events':
          output = {
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              success: true,
              events: []  // Return empty array for now
            })
          };
          break;
          
        default:
          // Generic response for unknown functions
          output = {
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              success: true,
              message: `Function ${functionName} executed successfully`,
              args: args
            })
          };
      }
      
      toolOutputs.push(output);
    }
    
    // Submit the tool outputs
    console.log('Submitting tool outputs...');
    const updatedRun = await openai.beta.threads.runs.submitToolOutputs(
      threadId,
      runId,
      { tool_outputs: toolOutputs }
    );
    
    return updatedRun;
  } catch (error) {
    console.error('Error handling function calls:', error);
    throw error;
  }
}

// Send message endpoint
app.post('/api/messages', async (req, res) => {
  try {
    const { threadId, message } = req.body;
    
    if (!threadId || !message) {
      return res.status(400).json({ error: 'Missing threadId or message' });
    }
    
    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });
    
    // Create run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.VITE_ASSISTANT_ID || process.env.ASSISTANT_ID
    });
    
    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      console.log(`Run status: ${runStatus.status}`);
      
      if (runStatus.status === 'completed') {
        break;
      }
      
      if (runStatus.status === 'failed') {
        throw new Error('Run failed: ' + runStatus.last_error?.message);
      }
      
      if (runStatus.status === 'cancelled') {
        throw new Error('Run was cancelled');
      }
      
      if (runStatus.status === 'expired') {
        throw new Error('Run expired');
      }
      
      // Handle requires_action (function calling)
      if (runStatus.status === 'requires_action') {
        console.log('Run requires action - handling function calls...');
        runStatus = await handleFunctionCalls(threadId, run.id);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;
    }
    
    if (runStatus.status !== 'completed') {
      throw new Error(`Run did not complete. Final status: ${runStatus.status}`);
    }
    
    // Get messages
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];
    
    // Extract text content
    let content = '';
    if (typeof lastMessage.content === 'string') {
      content = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      content = lastMessage.content
        .map(item => item.text?.value || '')
        .join('');
    }
    
    res.json({ response: content });
  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    env: {
      hasApiKey: !!process.env.VITE_OPENAI_API_KEY,
      hasAssistantId: !!process.env.VITE_ASSISTANT_ID,
      hasProjectId: !!process.env.VITE_OPENAI_PROJECT_ID
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 