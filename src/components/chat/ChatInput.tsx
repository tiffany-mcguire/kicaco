import React, { useState } from 'react';
import { useKicacoStore } from '../../store/kicacoStore';
import { extractJsonFromMessage, validateParsedResponse } from '../../utils/parseAssistantResponse';
import { sendMessageToAssistant } from '../../utils/talkToKicaco';

const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const {
    threadId,
    addMessage,
    setEventInProgress,
  } = useKicacoStore();

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    try {
      setIsSending(true);
      const userText = input.trim();
      setInput('');

      // Add user message
      addMessage({
        id: crypto.randomUUID(),
        sender: 'user',
        content: userText
      });

      // Validate thread
      if (!threadId) {
        throw new Error('No active conversation thread. Please refresh the page.');
      }

      // Send message and get response
      const assistantReply = await sendMessageToAssistant(threadId, userText);
      
      if (!assistantReply) {
        throw new Error('No response received from assistant.');
      }

      // Parse and validate response
      const parsedResponse = extractJsonFromMessage(assistantReply);
      if (!validateParsedResponse(parsedResponse)) {
        throw new Error(parsedResponse.error || 'Invalid response format');
      }

      // Add assistant message
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: parsedResponse.type === 'json' ? JSON.stringify(parsedResponse.content, null, 2) : parsedResponse.content
      });

      // Handle JSON response
      if (parsedResponse.type === 'json') {
        setEventInProgress(parsedResponse.content);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      // Add error message to chat
      addMessage({
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: `I'm having trouble processing your message. ${error instanceof Error ? error.message : 'Please try again.'}`
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-center p-3 border-t bg-white dark:bg-gray-800">
      <input
        type="text"
        className="w-full rounded-full border border-[#c0e2e7] px-4 py-2 focus:outline-none text-base bg-white text-black placeholder-gray-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus:shadow-[0_0_8px_2px_#c0e2e7,0_2px_8px_rgba(0,0,0,0.08)]"
        style={{ color: '#000' }}
        placeholder="Type a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isSending) handleSend();
        }}
        disabled={isSending}
      />
      <button
        onClick={handleSend}
        disabled={isSending}
        className={`ml-3 px-4 py-2 bg-fuchsia-700 text-white rounded-xl transition ${
          isSending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-fuchsia-800'
        }`}
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

export default ChatInput; 