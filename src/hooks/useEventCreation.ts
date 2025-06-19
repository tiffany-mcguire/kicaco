import { useState, useCallback } from 'react';
import { useKicacoStore } from '../store/kicacoStore';
import { sendMessageToAssistant } from '../utils/talkToKicaco';
import { getApiClientInstance } from '../utils/apiClient';
import { extractKnownFields } from '../utils/kicacoFlow';

import { generateUUID } from '../utils/uuid';
export const useEventCreation = () => {
  const [eventCreationMessage, setEventCreationMessage] = useState<string>("");
  const [currentEventFields, setCurrentEventFields] = useState<any>({});
  const { 
    threadId,
    addMessage, 
    removeMessageById,
    addEvent,
    setLatestEvent
  } = useKicacoStore();

  const handleEventMessage = useCallback(async (userText: string) => {
    if (!threadId) {
      throw new Error('No thread ID available');
    }

    // Track if this is a new event
    const eventKeywords = [
      'have', 'attend', 'go to', 'set', 'schedule', 'add', 'plan', 'join', 'host',
      'tomorrow', 'tonight', 'next week', 'next friday', 'this friday',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const isNewEvent = eventKeywords.some(kw => userText.toLowerCase().includes(kw)) && !eventCreationMessage;

    if (isNewEvent) {
      setEventCreationMessage(userText);
    }

    // Add user message
    const userMessage = {
      id: generateUUID(),
      sender: 'user' as const,
      content: userText
    };
    addMessage(userMessage);

    // Add thinking message
    const thinkingId = 'thinking';
    addMessage({
      id: thinkingId,
      sender: 'assistant' as const,
      content: 'Kicaco is thinking',
    });

    // Extract fields
    const baseFields = isNewEvent ? {} : currentEventFields;
    const extractedFields = extractKnownFields(userText, baseFields);
    const updatedFields = { ...baseFields, ...extractedFields };
    setCurrentEventFields(updatedFields);

    try {
      const apiClient = getApiClientInstance();
      const assistantResponse = await apiClient.sendMessage(threadId, userText);
      
      // Try to extract event JSON
      let eventObj = null;
      try {
        // Try code block
        const codeBlockMatch = assistantResponse.match(/```json\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
          const parsed = JSON.parse(codeBlockMatch[1]);
          if (parsed.event) eventObj = parsed.event;
        } else {
          // Try plain JSON
          try {
            const parsed = JSON.parse(assistantResponse);
            if (parsed.event) eventObj = parsed.event;
          } catch {
            // Try to find JSON in the message
            const firstBrace = assistantResponse.indexOf('{');
            if (firstBrace !== -1) {
              const jsonSubstring = assistantResponse.slice(firstBrace);
              try {
                const parsed = JSON.parse(jsonSubstring);
                if (parsed.event) eventObj = parsed.event;
              } catch {}
            }
          }
        }
      } catch {}

      removeMessageById(thinkingId);

      if (eventObj) {
        // Merge with tracked fields
        const finalEvent = { ...eventObj, ...updatedFields };
        addEvent(finalEvent);
        
        // Reset state
        setCurrentEventFields({});
        setEventCreationMessage("");
        setLatestEvent(finalEvent);
        
        // Add confirmation message
        addMessage({
          id: generateUUID(),
          sender: 'assistant' as const,
          type: 'event_confirmation',
          content: '',
          event: finalEvent
        });
      } else {
        // Regular assistant response
        addMessage({
          id: generateUUID(),
          sender: 'assistant' as const,
          content: assistantResponse
        });
      }
    } catch (error: any) {
      console.error('Error in message handling:', error);
      removeMessageById(thinkingId);
      
      // Provide more specific error messages
      let errorMessage = 'Sorry, I encountered an error. ';
      if (error.message?.includes('API key') || error.message?.includes('Authentication')) {
        errorMessage = 'There\'s an issue with the API configuration. Please contact support.';
      } else if (error.message?.includes('Network') || error.message?.includes('network')) {
        errorMessage = 'I\'m having trouble connecting. Please check your internet connection and try again.';
      } else if (error.message?.includes('CORS') || error.message?.includes('browser')) {
        errorMessage = 'Your browser is blocking the connection. Try using the desktop version or a different browser.';
      } else {
        errorMessage += 'Please try again in a moment.';
      }
      
      addMessage({
        id: generateUUID(),
        sender: 'assistant' as const,
        content: errorMessage
      });
    }
  }, [threadId, eventCreationMessage, currentEventFields, addMessage, removeMessageById, addEvent, setLatestEvent, setCurrentEventFields, setEventCreationMessage]);

  return {
    handleEventMessage,
    eventCreationMessage,
    currentEventFields
  };
}; 