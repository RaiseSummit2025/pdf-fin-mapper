
import { useState } from 'react';

interface ChatRequest {
  model: string;
  prompt: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatResponse {
  id: string;
  model: string;
  prompt: string;
  completion: string;
  tokens_used: number;
  time_ms: number;
}

export const useChatApi = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (request: ChatRequest): Promise<ChatResponse> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/infer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to mock response for development
      return {
        id: Date.now().toString(),
        model: request.model,
        prompt: request.prompt,
        completion: "I'm a mock response since the Groq API isn't configured yet. Please set up your VITE_GROQ_API_KEY environment variable and implement the backend API endpoint.",
        tokens_used: 50,
        time_ms: 100,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
};
