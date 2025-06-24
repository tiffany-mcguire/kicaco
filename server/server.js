const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for long system prompts

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

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
async function handleFunctionCalls(threadId, runId, createdEventsTracker = [], createdKeepersTracker = []) {
  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    
    if (run.status !== 'requires_action' || !run.required_action) {
      return { run, createdEvents: createdEventsTracker, createdKeepers: createdKeepersTracker };
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
        case 'updateEvent':
          const eventData = {
            eventName: args.eventName || args.name || 'New Event',
            date: args.date,
            time: args.time,
            childName: args.childName,
            location: args.location,
            isAllDay: args.isAllDay || false,
            noTimeYet: args.noTimeYet || false,
            notes: args.notes || '',
            isRecurring: args.isRecurring || false,
            recurringPattern: args.recurringPattern || null, // 'weekly', 'daily', 'monthly'
            recurringEndDate: args.recurringEndDate || null,
            recurringDays: args.recurringDays || null // For weekly: ['monday', 'wednesday'] 
          };
          
          // Check if this is an update to an existing event (same name, child, date)
          const existingIndex = createdEventsTracker.findIndex(event => 
            event.eventName === eventData.eventName && 
            event.date === eventData.date &&
            // Be flexible with childName matching when it's empty
            (!event.childName || !eventData.childName || event.childName === eventData.childName)
          );
          
          if (existingIndex !== -1) {
            // Update existing event instead of creating duplicate
            createdEventsTracker[existingIndex] = { ...createdEventsTracker[existingIndex], ...eventData };
            console.log('Updated existing event (via updateEvent):', createdEventsTracker[existingIndex]);
          } else {
            // Track the created event
            createdEventsTracker.push(eventData);
            console.log('Tracked new event:', eventData);
          }
          
          // Identify missing required fields
          const missingFields = [];
          if (!eventData.eventName || eventData.eventName === 'New Event') {
            missingFields.push('eventName');
          }
          if (!eventData.date) {
            missingFields.push('date');
          }
          if (!eventData.childName) {
            missingFields.push('childName');
          }
          if (!eventData.time && !eventData.isAllDay && !eventData.noTimeYet) {
            missingFields.push('time');
          }
          if (!eventData.location) {
            missingFields.push('location');
          }
          
          output = {
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              success: true,
              event: {
                id: `event_${Date.now()}`,
                ...eventData,
                category: args.category || 'general'
              },
              missingRequiredFields: missingFields,
              message: missingFields.length > 0 
                ? `Event created but missing: ${missingFields.join(', ')}. Please ask for these.`
                : 'Event created with all required information.'
            })
          };
          break;
          
        case 'updateKeeper':
          const keeperData = {
            keeperName: args.keeperName || args.name || 'New Keeper',
            date: args.date || args.dueDate,
            childName: args.childName,
            description: args.description || '',
            time: args.time,
            location: args.location,
            isRecurring: args.isRecurring || false,
            recurringPattern: args.recurringPattern || null,
            recurringEndDate: args.recurringEndDate || null,
            recurringDays: args.recurringDays || null
          };
          
          // Check if this is an update to an existing keeper (same name, child, date)
          const existingKeeperIndex = createdKeepersTracker.findIndex(keeper => 
            keeper.keeperName === keeperData.keeperName && 
            keeper.date === keeperData.date &&
            // Be flexible with childName matching when it's empty
            (!keeper.childName || !keeperData.childName || keeper.childName === keeperData.childName)
          );
          
          if (existingKeeperIndex !== -1) {
            // Update existing keeper instead of creating duplicate
            createdKeepersTracker[existingKeeperIndex] = { ...createdKeepersTracker[existingKeeperIndex], ...keeperData };
            console.log('Updated existing keeper (via updateKeeper):', createdKeepersTracker[existingKeeperIndex]);
          } else {
            // Track the created keeper
            createdKeepersTracker.push(keeperData);
            console.log('Tracked new keeper:', keeperData);
          }
          
          // Identify missing required fields for keepers
          const keeperMissingFields = [];
          if (!keeperData.keeperName || keeperData.keeperName === 'New Keeper') {
            keeperMissingFields.push('keeperName');
          }
          if (!keeperData.date) {
            keeperMissingFields.push('date');
          }
          if (!keeperData.childName) {
            keeperMissingFields.push('childName');
          }
          
          output = {
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              success: true,
              keeper: {
                id: `keeper_${Date.now()}`,
                ...keeperData,
                category: args.category || 'general'
              },
              missingRequiredFields: keeperMissingFields,
              message: keeperMissingFields.length > 0 
                ? `Keeper created but missing: ${keeperMissingFields.join(', ')}. Please ask for these.`
                : 'Keeper created with all required information.'
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
    
    return { run: updatedRun, createdEvents: createdEventsTracker, createdKeepers: createdKeepersTracker };
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
    
    // Check for active runs and wait for them to complete BEFORE adding message
    console.log('Checking for active runs on thread:', threadId);
    let waitAttempts = 0;
    const maxWaitAttempts = 10; // Wait up to 10 seconds
    
    while (waitAttempts < maxWaitAttempts) {
      try {
        const existingRuns = await openai.beta.threads.runs.list(threadId, { limit: 3 });
        const activeRuns = existingRuns.data.filter(run => 
          ['queued', 'in_progress', 'requires_action'].includes(run.status)
        );
        
        if (activeRuns.length === 0) {
          console.log('No active runs found, proceeding with message...');
          break;
        }
        
        console.log(`Found ${activeRuns.length} active runs. Waiting... (attempt ${waitAttempts + 1}/${maxWaitAttempts})`);
        activeRuns.forEach(run => {
          console.log(`- Run ${run.id}: ${run.status}`);
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        waitAttempts++;
      } catch (checkError) {
        console.log('Error checking for active runs:', checkError.message);
        break;
      }
    }
    
    if (waitAttempts >= maxWaitAttempts) {
      throw new Error('Another operation is in progress. Please wait a moment and try again.');
    }
    
    // Add message to thread (only after ensuring no active runs)
    console.log('Adding message to thread...');
    
    // Add current date context to regular messages for consistency
    const currentDate = new Date();
    const dateContext = `CURRENT CONTEXT: Today is ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${currentDate.getFullYear()}). When creating events, use the current year as context but allow events in any future year (2025, 2026, 2027, etc.) based on the content.`;
    const messageWithContext = `${dateContext}\n\n${message}`;
    
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: messageWithContext
    });
    
    // Create run (should succeed now that we've ensured no active runs)
    console.log('Creating run...');
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.VITE_ASSISTANT_ID || process.env.ASSISTANT_ID
    });
    console.log(`Successfully created run: ${run.id}`);
    
    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    const maxAttempts = 30;
    let attempts = 0;
    
    // Track created/updated events and keepers during this message
    const createdEvents = [];
    const createdKeepers = [];
    
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
        const result = await handleFunctionCalls(threadId, run.id, createdEvents, createdKeepers);
        runStatus = result.run;
        console.log('Events after function calls:', createdEvents);
        console.log('Keepers after function calls:', createdKeepers);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;
    }
    
    if (runStatus.status !== 'completed') {
      console.error(`Run did not complete within ${maxAttempts} attempts. Final status: ${runStatus.status}`);
      console.error('Run details:', runStatus);
      throw new Error(`Run timed out. Final status: ${runStatus.status}. Please try again.`);
    }
    
    // Get messages
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];
    
    // Check if the last message is from the assistant
    if (lastMessage.role !== 'assistant') {
      console.log('Warning: Run completed but no assistant message was generated. Last message was from:', lastMessage.role);
      // This can happen when the assistant calls a function but doesn't generate a follow-up message
      // Return a generic response to avoid returning the user's own message
      return res.json({ 
        response: '', 
        warning: 'Assistant completed without generating a message',
        createdEvents: createdEvents,
        createdKeepers: createdKeepers
      });
    }
    
    // Extract text content
    let content = '';
    if (typeof lastMessage.content === 'string') {
      content = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      content = lastMessage.content
        .map(item => item.text?.value || '')
        .join('');
    }
    
    res.json({ 
      response: content,
      createdEvents: createdEvents,
      createdKeepers: createdKeepers
    });
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

// Image upload and analysis endpoint
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { threadId, prompt } = req.body;
    
    if (!threadId) {
      return res.status(400).json({ error: 'Missing threadId' });
    }

    console.log('Processing image upload:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      threadId,
      prompt: prompt || 'No custom prompt provided'
    });

    // Upload the image file to OpenAI first
    console.log('Uploading image to OpenAI...');
    
    // Create a File object from the buffer
    const fileBlob = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype
    });
    
    const file = await openai.files.create({
      file: fileBlob,
      purpose: 'vision'
    });
    console.log('Image uploaded to OpenAI:', file.id);

    // Create message with text and image file, including current date context
    const currentDate = new Date();
    const dateContext = `CURRENT CONTEXT: Today is ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${currentDate.getFullYear()}). When creating events, use the current year as context but allow events in any future year (2025, 2026, 2027, etc.) based on the content.`;
    
    const messageText = `${dateContext}\n\n${prompt || "Please analyze this image and extract ALL event information. Create events/keepers immediately with any information you find. After creating them, you MUST ask follow-up questions for any missing required information (location, child name, time, etc.) one at a time. Treat this as the START of a conversation, not the end."}`;
    
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: [
        {
          type: "text",
          text: messageText
        },
        {
          type: "image_file",
          image_file: {
            file_id: file.id
          }
        }
      ]
    });

    // Create a run with the assistant to process the analysis and potentially create events
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.VITE_ASSISTANT_ID || process.env.ASSISTANT_ID
    });

    // Poll for completion (same logic as regular messages)
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    const maxAttempts = 30;
    let attempts = 0;
    
    // Track created events and keepers throughout the run
    const createdEvents = [];
    const createdKeepers = [];

    while (attempts < maxAttempts) {
      console.log(`Assistant run status: ${runStatus.status}`);

      if (runStatus.status === 'completed') {
        break;
      }

      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed: ' + runStatus.last_error?.message);
      }

      if (runStatus.status === 'cancelled') {
        throw new Error('Assistant run was cancelled');
      }

      if (runStatus.status === 'expired') {
        throw new Error('Assistant run expired');
      }

      // Handle requires_action (function calling)
      if (runStatus.status === 'requires_action') {
        console.log('Assistant requires action - handling function calls...');
        const result = await handleFunctionCalls(threadId, run.id, createdEvents, createdKeepers);
        runStatus = result.run;
        console.log('After handling function calls, createdEvents:', createdEvents);
        console.log('After handling function calls, createdKeepers:', createdKeepers);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Assistant run did not complete. Final status: ${runStatus.status}`);
    }

    // Get the assistant's initial response to see if it's asking questions or ready to create events
    const initialMessages = await openai.beta.threads.messages.list(threadId);
    const initialMessage = initialMessages.data[0];
    
    let initialContent = '';
    if (typeof initialMessage.content === 'string') {
      initialContent = initialMessage.content;
    } else if (Array.isArray(initialMessage.content)) {
      initialContent = initialMessage.content
        .map(item => item.text?.value || '')
        .join('');
    }
    
    console.log('Assistant initial response:', initialContent);
    
    // Let the assistant follow its system prompt naturally - no automatic follow-ups
    let content = initialContent;

    // Get ALL messages from the thread to find any events created during the entire process
    const allMessages = await openai.beta.threads.messages.list(threadId);
    console.log('All messages in thread:', allMessages.data.length);
    
    // Also check if there were any function calls that created events
    const allRuns = await openai.beta.threads.runs.list(threadId);
    console.log('All runs for this upload:', allRuns.data.length);
    
    // Log what we're sending back
    console.log('Final created events being sent to frontend:', createdEvents);
    console.log('Final created keepers being sent to frontend:', createdKeepers);

    res.json({ 
      response: content,
      imageInfo: {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      createdEvents: createdEvents, // Return the events we tracked
      createdKeepers: createdKeepers // Return the keepers we tracked
    });

  } catch (error) {
    console.error('Error processing image upload:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    
    if (error.message.includes('Only image files are allowed')) {
      res.status(400).json({ 
        error: 'Invalid file type. Please upload an image file (JPG, PNG, GIF, or WebP).',
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to process image',
        details: error.message 
      });
    }
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