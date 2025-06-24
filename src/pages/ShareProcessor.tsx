import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useKicacoStore } from '../store/kicacoStore';
import { getApiClientInstance } from '../utils/apiClient';
import { generateUUID } from '../utils/uuid';
import { motion } from 'framer-motion';
import { Upload, MessageSquare, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface ProcessingState {
  status: 'analyzing' | 'processing' | 'complete' | 'error';
  message: string;
  progress: number;
  createdEvents: any[];
  createdKeepers: any[];
  assistantResponse?: string;
}

const ShareProcessor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'analyzing',
    message: 'Analyzing shared content...',
    progress: 0,
    createdEvents: [],
    createdKeepers: []
  });

  const { 
    threadId, 
    addMessage, 
    addEvent, 
    addKeeper,
    setDrawerHeight
  } = useKicacoStore();

  // Extract share data from URL parameters or FormData
  useEffect(() => {
    const extractShareData = async () => {
      try {
        // Check if this is a POST request with FormData (from share target)
        if (window.location.search.includes('title=') || window.location.search.includes('text=')) {
          const title = searchParams.get('title') || '';
          const text = searchParams.get('text') || '';
          const url = searchParams.get('url') || '';
          
          setShareData({ title, text, url });
        } else {
          // Handle programmatic sharing (future enhancement)
          const storedShareData = sessionStorage.getItem('kicaco_share_data');
          if (storedShareData) {
            const data = JSON.parse(storedShareData);
            setShareData(data);
            sessionStorage.removeItem('kicaco_share_data');
          }
        }
      } catch (error) {
        console.error('Error extracting share data:', error);
        setProcessing({
          status: 'error',
          message: 'Failed to process shared content',
          progress: 0,
          createdEvents: [],
          createdKeepers: []
        });
      }
    };

    extractShareData();
  }, [searchParams]);

  // Process the shared content
  useEffect(() => {
    if (!shareData || !threadId) return;

    const processSharedContent = async () => {
      try {
        setProcessing(prev => ({ ...prev, status: 'processing', message: 'Processing with AI...', progress: 25 }));

        // Create a comprehensive message from the shared data
        const sharedContent = [
          shareData.title && `Title: ${shareData.title}`,
          shareData.text && `Content: ${shareData.text}`,
          shareData.url && `URL: ${shareData.url}`
        ].filter(Boolean).join('\n\n');

        const message = `I received this content from another app:\n\n${sharedContent}\n\nPlease analyze this and extract any events or tasks. Create them immediately if you find clear information, then ask for any missing details.`;

        // Add to chat history
        addMessage({
          id: generateUUID(),
          sender: 'user',
          content: `📱 Shared from another app:\n${sharedContent}`
        });

        setProcessing(prev => ({ ...prev, progress: 50 }));

        // Send to AI
        const apiClient = getApiClientInstance();
        const response = await apiClient.sendMessage(threadId, message);

        setProcessing(prev => ({ ...prev, progress: 75 }));

        // Handle created events/keepers
        const createdEvents = response.createdEvents || [];
        const createdKeepers = response.createdKeepers || [];

        createdEvents.forEach(event => addEvent(event));
        createdKeepers.forEach(keeper => addKeeper(keeper));

        // Add AI response to chat
        if (response.response) {
          addMessage({
            id: generateUUID(),
            sender: 'assistant',
            content: response.response
          });
        }

        setProcessing({
          status: 'complete',
          message: `Created ${createdEvents.length} events and ${createdKeepers.length} keepers`,
          progress: 100,
          createdEvents,
          createdKeepers,
          assistantResponse: response.response
        });

      } catch (error) {
        console.error('Error processing shared content:', error);
        setProcessing({
          status: 'error',
          message: 'Failed to process shared content. Please try again.',
          progress: 0,
          createdEvents: [],
          createdKeepers: []
        });
      }
    };

    processSharedContent();
  }, [shareData, threadId, addMessage, addEvent, addKeeper]);

  const handleContinueToChat = () => {
    // Open chat drawer to continue the conversation
    setDrawerHeight(400);
    navigate('/');
  };

  const handleViewCalendar = () => {
    navigate('/');
  };

  if (!shareData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#217e8f] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#217e8f] text-white p-4">
        <h1 className="text-lg font-semibold">Processing Shared Content</h1>
        <p className="text-sm opacity-90">Kicaco is analyzing your shared information</p>
      </div>

      {/* Content */}
      <div className="p-4 max-w-md mx-auto">
        {/* Shared Content Preview */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Upload size={16} />
            Shared Content
          </h2>
          {shareData.title && (
            <p className="text-sm font-medium text-gray-900 mb-1">{shareData.title}</p>
          )}
          {shareData.text && (
            <p className="text-sm text-gray-600 mb-2">{shareData.text}</p>
          )}
          {shareData.url && (
            <p className="text-xs text-blue-600 truncate">{shareData.url}</p>
          )}
        </div>

        {/* Processing Status */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            {processing.status === 'analyzing' && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#217e8f]"></div>
            )}
            {processing.status === 'processing' && (
              <div className="animate-pulse">
                <MessageSquare className="h-5 w-5 text-[#217e8f]" />
              </div>
            )}
            {processing.status === 'complete' && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {processing.status === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="text-sm font-medium text-gray-900">
              {processing.message}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <motion.div
              className="bg-[#217e8f] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${processing.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Results Summary */}
          {processing.status === 'complete' && (
            <div className="space-y-2">
              {processing.createdEvents.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  <span>{processing.createdEvents.length} events created</span>
                </div>
              )}
              {processing.createdKeepers.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle size={14} />
                  <span>{processing.createdKeepers.length} keepers created</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {processing.status === 'complete' && (
          <div className="space-y-3">
            <button
              onClick={handleContinueToChat}
              className="w-full bg-[#217e8f] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#1a6670] transition-colors"
            >
              Continue Conversation
            </button>
            <button
              onClick={handleViewCalendar}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              View Calendar
            </button>
          </div>
        )}

        {processing.status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Back to Kicaco
          </button>
        )}
      </div>
    </div>
  );
};

export default ShareProcessor; 