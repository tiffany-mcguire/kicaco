import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from './ChatBubble';
import { EventCard } from '../calendar';
import { PostSignupOptions } from '../common';
import { getKicacoEventPhoto } from '../../utils/getKicacoEventPhoto';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  type?: string;
  event?: any;
}

interface ChatMessageListProps {
  messages: Message[];
  onCreateAccount?: () => void;
  onRemindLater?: () => void;
  latestChildName?: string;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  onCreateAccount,
  onRemindLater,
  latestChildName = 'your child'
}) => {
  // Track which messages have already been animated
  const animatedMessagesRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    // Add new message IDs to the animated set
    messages.forEach(msg => {
      animatedMessagesRef.current.add(msg.id);
    });
  }, [messages]);

  return (
    <div className="space-y-1 mt-2 flex flex-col items-start px-2 pb-4">
      <AnimatePresence initial={false}>
        {messages.map((msg, index) => {
          // Only animate if this is a new message (not in our animated set from previous render)
          const isNewMessage = !animatedMessagesRef.current.has(msg.id) || index === messages.length - 1;
          
          if (msg.type === 'event_confirmation' && msg.event) {
            return (
              <motion.div
                key={msg.id}
                initial={isNewMessage ? { opacity: 0, scale: 0.95, y: 10 } : false}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <ChatBubble side="left" className="w-full max-w-[95vw] sm:max-w-3xl">
                  <div>
                    <EventCard
                      image={getKicacoEventPhoto(msg.event.eventName)}
                      name={msg.event.eventName}
                      childName={msg.event.childName}
                      date={msg.event.date}
                      time={msg.event.time}
                      location={msg.event.location}
                    />
                    <div className="mt-2 text-left w-full text-sm text-gray-900">
                      Want to save this and keep building your child's schedule? Create an account to save and manage all your events in one place. No forms, just your name and email to get started!
                    </div>
                    {onCreateAccount && (
                      <button
                        className="mt-3 h-[30px] px-2 border border-[#c0e2e7] rounded-md font-semibold text-xs sm:text-sm text-[#217e8f] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_0_12px_2px_rgba(192,226,231,0.4),0_4px_6px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.12)] active:scale-95 active:shadow-[0_0_8px_1px_rgba(192,226,231,0.3),0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-200 focus:outline-none w-[140px]"
                        onClick={onCreateAccount}
                      >
                        Create an account
                      </button>
                    )}
                  </div>
                </ChatBubble>
              </motion.div>
            );
          }
          if (msg.type === 'post_signup_options') {
            return (
              <motion.div
                key={msg.id}
                initial={isNewMessage ? { opacity: 0, scale: 0.95, y: 10 } : false}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <ChatBubble side="left" className="w-full max-w-[95vw] sm:max-w-3xl">
                  <PostSignupOptions onRemindLater={onRemindLater || (() => {})} />
                </ChatBubble>
              </motion.div>
            );
          }
          return (
            <motion.div
              key={msg.id}
              initial={isNewMessage ? { opacity: 0, scale: 0.95, y: 10 } : false}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <ChatBubble
                side={msg.sender === 'user' ? 'right' : 'left'}
              >
                {msg.content}
              </ChatBubble>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ChatMessageList; 