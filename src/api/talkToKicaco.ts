interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function talkToKicaco(): Promise<Message> {
  // TODO: Implement OpenAI Assistant API integration
  return {
    role: 'assistant',
    content: 'This is a placeholder response. OpenAI integration coming soon.',
  };
} 