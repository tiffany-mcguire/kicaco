interface ParsedResponse {
  type: 'json' | 'text';
  content: any;
  error?: string;
}

export function extractJsonFromMessage(message: string): ParsedResponse {
  if (!message) {
    return {
      type: 'text',
      content: null,
      error: 'Empty message received'
    };
  }

  // Try to find JSON in code blocks
  const jsonMatch = message.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        type: 'json',
        content: parsed
      };
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return {
        type: 'text',
        content: message,
        error: 'Invalid JSON format in response'
      };
    }
  }

  // If no JSON found, return the message as text
  return {
    type: 'text',
    content: message
  };
}

export function validateParsedResponse(response: ParsedResponse): boolean {
  if (response.type === 'json') {
    // Add any specific validation rules for JSON responses here
    return response.content !== null && typeof response.content === 'object';
  }
  return response.content !== null && typeof response.content === 'string';
} 