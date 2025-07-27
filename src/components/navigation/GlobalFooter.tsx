import React, { forwardRef, ReactNode, useState, useEffect, useRef } from 'react';
import { IconButton, ClipboardIcon2, UploadIcon, SendIcon, MicIcon } from '../common';
import { useKicacoStore } from '../../store/kicacoStore';
import { smartPaste, analyzeContentForEvents } from '../../utils/shareHandler';
import { getApiClientInstance } from '../../utils/apiClient';
import { generateUUID } from '../../utils/uuid';

interface GlobalFooterProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend?: () => void;
  onUploadClick?: () => void;
  placeholder?: string;
  leftButtons?: ReactNode;
  rightButtons?: ReactNode;
  className?: string;
  disabled?: boolean;
  clearActiveButton?: boolean; // New prop to clear active state
}

const GlobalFooter = forwardRef<HTMLDivElement, GlobalFooterProps>(
  ({ value, onChange, onSend, onUploadClick, placeholder = 'Type a message…', leftButtons, rightButtons, className = '', disabled = false, clearActiveButton = false }, ref) => {
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [pasteProcessing, setPasteProcessing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Access Kicaco store for smart paste functionality
    const { 
      threadId, 
      setThreadId,
      addMessage, 
      removeMessageById, 
      addEvent, 
      addKeeper 
    } = useKicacoStore();

    const handleButtonClick = (buttonName: string) => {
      setActiveButton(prev => (prev === buttonName ? null : buttonName));
    };

    // Function to blur input and minimize keyboard
    const blurInput = () => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    };

    // Enhanced send handler with keyboard management
    const handleSend = () => {
      if (onSend && !disabled && value.trim()) {
        onSend();
        // Clear the send button active state immediately after sending
        setActiveButton(null);
        // Blur input to minimize keyboard after sending
        setTimeout(() => blurInput(), 100);
      }
    };

    // Built-in smart paste functionality
    const handleSmartPaste = async () => {
      console.log('🚀 Smart paste button clicked in GlobalFooter!', { pasteProcessing, threadId });
      
      if (pasteProcessing) {
        console.log('❌ Paste blocked: already processing');
        return;
      }

      // If no thread exists, create one first
      let currentThreadId = threadId;
      if (!currentThreadId) {
        console.log('📝 No thread found, creating one for smart paste...');
        try {
          setPasteProcessing(true);
          const apiClient = getApiClientInstance();
          const intro = "Hi, I'm Kicaco! You can chat with me about events and I'll remember everything for you.";
          currentThreadId = await apiClient.createThread(intro);
          setThreadId(currentThreadId);
          console.log('✅ Thread created for smart paste:', currentThreadId);
        } catch (error) {
          console.error('❌ Failed to create thread for smart paste:', error);
          addMessage({
            id: generateUUID(),
            sender: 'assistant',
            content: 'I had trouble getting ready to help you. Please try refreshing the page and try again.'
          });
          setPasteProcessing(false);
          return;
        }
      }

      try {
        setPasteProcessing(true);
        console.log('📋 Starting clipboard read...');
        
        // Get clipboard content
        const pasteContent = await smartPaste();
        console.log('📋 Clipboard result:', pasteContent);
        
        if (!pasteContent) {
          console.log('❌ No paste content found');
          addMessage({
            id: generateUUID(),
            sender: 'assistant',
            content: 'No content found in clipboard. Try copying some text, a link, or an image first!'
          });
          return;
        }

        // Analyze content for events
        const analysis = analyzeContentForEvents(pasteContent);
        console.log('🔍 Content analysis:', analysis);

        // Process based on content type
        if (pasteContent.type === 'file' && pasteContent.files && pasteContent.files.length > 0) {
          console.log('📎 Processing file content...');
          // Handle pasted images (screenshots, etc.)
          const imageFile = pasteContent.files[0];
          
          // Use existing image upload flow
          const apiClient = getApiClientInstance();
          
          try {
            const response = await apiClient.uploadImage(
              currentThreadId!, 
              imageFile, 
              "Please analyze this pasted image and extract ALL event information. Create events/keepers immediately with any information you find."
            );
            
            // Handle created events/keepers
            if (response.createdEvents && response.createdEvents.length > 0) {
              response.createdEvents.forEach(event => addEvent(event));
            }
            if (response.createdKeepers && response.createdKeepers.length > 0) {
              response.createdKeepers.forEach(keeper => addKeeper(keeper));
            }
            
            // Add AI response
            addMessage({
              id: generateUUID(),
              sender: 'assistant',
              content: response.response
            });
            
          } catch (error) {
            console.error('❌ File processing error:', error);
            addMessage({
              id: generateUUID(),
              sender: 'assistant',
              content: 'Sorry, I had trouble processing that image. Please try again.'
            });
          }
        } else {
          console.log('📝 Processing text content...');
          // Handle text/URL content
          const displayContent = pasteContent.title 
            ? `${pasteContent.title}\n${pasteContent.text || ''}`
            : pasteContent.text || pasteContent.url || '';

          console.log('📝 Display content:', displayContent);

          // Add user message showing what was pasted
          addMessage({
            id: generateUUID(),
            sender: 'user',
            content: `📋 Pasted: ${displayContent}`
          });

          // Add current date context for better date resolution
          const currentDate = new Date();
          const dateContext = `CURRENT CONTEXT: Today is ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${currentDate.getFullYear()}). When creating events, use the current year as context but allow events in any future year (2025, 2026, 2027, etc.) based on the content.`;
          
          const message = analysis.hasEvents 
            ? `${dateContext}\n\nI pasted this content: "${displayContent}". Please analyze this and extract any events or tasks. Create them immediately if you find clear information, then ask for any missing details.`
            : `${dateContext}\n\nI pasted this: "${displayContent}". This might contain schedule information - can you help me turn this into events or tasks?`;

          console.log('🤖 Sending message to AI:', message);

          // Add thinking message
          const thinkingMessageId = 'thinking-paste-globalfooter';
          addMessage({
            id: thinkingMessageId,
            sender: 'assistant',
            content: 'Kicaco is thinking'
          });

          try {
            const apiClient = getApiClientInstance();
            const messageResponse = await apiClient.sendMessage(currentThreadId!, message);
            
            // Handle any events/keepers that were created during message processing
            if (messageResponse.createdEvents && messageResponse.createdEvents.length > 0) {
              console.log('Events created/updated during paste:', messageResponse.createdEvents);
              messageResponse.createdEvents.forEach(event => {
                addEvent(event);
              });
            }
            
            if (messageResponse.createdKeepers && messageResponse.createdKeepers.length > 0) {
              console.log('Keepers created/updated during paste:', messageResponse.createdKeepers);
              messageResponse.createdKeepers.forEach(keeper => {
                addKeeper(keeper);
              });
            }
            
            removeMessageById(thinkingMessageId);
            addMessage({
              id: generateUUID(),
              sender: 'assistant',
              content: messageResponse.response,
            });
          } catch (error) {
            console.error("Error processing paste message:", error);
            removeMessageById(thinkingMessageId);
            addMessage({
              id: generateUUID(),
              sender: 'assistant',
              content: "Sorry, I encountered an error processing your paste. Please try again.",
            });
          }
        }

        // Clear active state
        setActiveButton(null);

      } catch (error) {
        console.error('Error in smart paste:', error);
        
        // Provide helpful guidance for iOS users without breaking the UX
        const errorMessage = error instanceof Error ? error.message : '';
        console.log('🚨 Smart paste error type:', errorMessage);
        
        if (errorMessage.includes('CLIPBOARD_NOT_SUPPORTED')) {
          addMessage({
            id: generateUUID(),
            sender: 'assistant',
            content: '📋 Your browser doesn\'t support clipboard access yet. Try this instead: copy your text, then type it into the chat - I\'ll still process it with AI! Or use the upload button for images.'
          });
        } else if (errorMessage.includes('user interaction') || errorMessage.includes('NotAllowedError')) {
          addMessage({
            id: generateUUID(),
            sender: 'assistant',
            content: 'Hmm, I need clipboard permission first. Try copying your content again and then tapping paste immediately after. iOS Safari can be picky about clipboard timing!'
          });
        } else if (errorMessage.includes('permission')) {
          addMessage({
            id: generateUUID(),
            sender: 'assistant',
            content: 'Looks like I need clipboard access. Go to Safari Settings → Advanced → Website Data → Allow clipboard access, or try the share feature from your Messages app instead!'
          });
        } else {
          addMessage({
            id: generateUUID(),
            sender: 'assistant',
            content: '🤔 I don\'t see anything in your clipboard yet. Try this: copy some text from Messages, Mail, or Safari, then immediately tap the paste button again. The timing matters on iOS!'
          });
        }
      } finally {
        console.log('🔄 Resetting pasteProcessing to false');
        setPasteProcessing(false);
      }
    };

    // Clear active button when clearActiveButton prop changes to true
    useEffect(() => {
      if (clearActiveButton) {
        setActiveButton(null);
      }
    }, [clearActiveButton]);

    // Also clear active button when clicking elsewhere (existing behavior for other similar components)
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const footer = document.querySelector('.global-footer');
        if (footer && !footer.contains(event.target as Node)) {
          setActiveButton(null);
          // Also blur input when clicking outside footer to minimize keyboard
          blurInput();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    return (
      <footer
        ref={ref}
        className={`global-footer fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.08)] z-50 h-16 ${className}`}
      >
        {/* Subtle gradient accent line */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, rgba(248,182,194,0.5) 0%, rgba(255,216,181,0.5) 16%, rgba(253,230,138,0.5) 33%, rgba(187,247,208,0.5) 50%, rgba(192,226,231,0.5) 66%, rgba(209,213,250,0.5) 83%, rgba(233,213,255,0.5) 100%)'
          }}
        />
        
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex gap-1">
            {leftButtons ?? <>
              <IconButton 
                variant="frameless" 
                IconComponent={props => <ClipboardIcon2 {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} 
                aria-label="Paste" 
                isActive={activeButton === 'paste'}
                disabled={disabled || pasteProcessing}
                onClick={() => {
                  console.log('🔥 Paste button clicked in GlobalFooter!', { disabled, pasteProcessing, threadId });
                  handleButtonClick('paste');
                  handleSmartPaste();
                }}
              />
              <IconButton 
                variant="frameless" 
                IconComponent={props => <UploadIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} 
                aria-label="Upload" 
                isActive={activeButton === 'upload'}
                onClick={() => {
                  handleButtonClick('upload');
                  onUploadClick?.();
                }}
              />
            </>}
          </div>
          <div className="flex-1 mx-3">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={onChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && onSend && !disabled) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="footer-chat w-full rounded-full border border-gray-200 px-4 py-2 focus:outline-none bg-gray-50 text-gray-700 transition-all duration-200 focus:border-[#c0e2e7] focus:bg-white focus:shadow-[0_0_0_3px_rgba(192,226,231,0.1)]"
              placeholder={placeholder}
              disabled={disabled}
            />
          </div>
          <div className="flex gap-1">
            {rightButtons ?? <>
              <IconButton 
                variant="frameless" 
                IconComponent={props => <SendIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} 
                aria-label="Send" 
                disabled={disabled || !value.trim()}
                isActive={activeButton === 'send'}
                onClick={() => {
                  handleButtonClick('send');
                  handleSend();
                }}
              />
              <IconButton 
                variant="frameless" 
                IconComponent={props => <MicIcon {...props} className="w-6 h-6 sm:w-8 sm:h-8" />} 
                aria-label="Mic" 
                disabled={disabled} 
                isActive={activeButton === 'mic'}
                onClick={() => handleButtonClick('mic')}
              />
            </>}
          </div>
        </div>
      </footer>
    );
  }
);

export default GlobalFooter; 