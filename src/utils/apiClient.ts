// API client that can use either direct OpenAI or backend proxy
import { generateUUID } from './uuid';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const USE_BACKEND_PROXY = import.meta.env.VITE_USE_BACKEND_PROXY === 'true';

export interface ApiClient {
  createThread(systemPrompt: string): Promise<string>;
  sendMessage(threadId: string, message: string): Promise<string>;
}

// Backend proxy implementation
class BackendApiClient implements ApiClient {
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = localStorage.getItem('kicaco_session_id') || generateUUID();
    localStorage.setItem('kicaco_session_id', this.sessionId);
  }

  async createThread(systemPrompt: string): Promise<string> {
    try {
      console.log('Creating thread via backend:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({ systemPrompt })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.threadId;
    } catch (error: any) {
      console.error('Error creating thread via backend:', error);
      console.error('API URL:', API_BASE_URL);
      console.error('Error details:', error.message);
      throw new Error('Failed to create conversation. Please check your connection.');
    }
  }

  async sendMessage(threadId: string, message: string): Promise<string> {
    try {
      console.log('Sending message via backend:', { API_BASE_URL, threadId, message });
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({ threadId, message })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error: any) {
      console.error('Error sending message via backend:', error);
      console.error('API URL:', API_BASE_URL);
      console.error('Error details:', error.message);
      throw new Error('Failed to send message. Please try again.');
    }
  }
}

// Direct OpenAI implementation (existing code)
class DirectOpenAIClient implements ApiClient {
  async createThread(systemPrompt: string): Promise<string> {
    // Import the existing createOpenAIThread function
    const { createOpenAIThread } = await import('./talkToKicaco');
    return createOpenAIThread();
  }

  async sendMessage(threadId: string, message: string): Promise<string> {
    // Import the existing sendMessageToAssistant function
    const { sendMessageToAssistant } = await import('./talkToKicaco');
    return sendMessageToAssistant(threadId, message);
  }
}

// Factory function to get the appropriate client
export function getApiClient(): ApiClient {
  if (USE_BACKEND_PROXY) {
    console.log('🔌 Using backend proxy for API calls');
    return new BackendApiClient();
  } else {
    console.log('🔌 Using direct OpenAI API calls');
    return new DirectOpenAIClient();
  }
}

// Singleton instance
let apiClient: ApiClient | null = null;

export function getApiClientInstance(): ApiClient {
  if (!apiClient) {
    apiClient = getApiClient();
  }
  return apiClient;
} 