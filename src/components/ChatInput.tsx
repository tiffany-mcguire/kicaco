import React, { useState } from 'react';
import { useKicacoStore } from '../store/kicacoStore';
import { extractJsonFromMessage } from '../utils/parseAssistantResponse';
import { sendMessageToAssistant } from '../utils/talkToKicaco';

const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const {
    threadId,
    addMessage,
    setEventInProgress,
  } = useKicacoStore();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');

    addMessage({
      id: crypto.randomUUID(),
      sender: 'user',
      content: userText
    });

    const assistantReply = await sendMessageToAssistant(threadId, userText);

    addMessage({
      id: crypto.randomUUID(),
      sender: 'assistant',
      content: assistantReply
    });

    const parsed = extractJsonFromMessage(assistantReply);
    if (parsed) {
      setEventInProgress(parsed);
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
          if (e.key === 'Enter') handleSend();
        }}
      />
      <button
        onClick={handleSend}
        className="ml-3 px-4 py-2 bg-fuchsia-700 text-white rounded-xl hover:bg-fuchsia-800 transition"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput; 