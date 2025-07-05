
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

interface ApiKeys {
  groq: string;
  openai: string;
}

export const useChatApi = () => {
  const [isLoading, setIsLoading] = useState(false);

  const isOpenAIModel = (model: string) => {
    return model.startsWith('gpt-');
  };

  const sendToGroq = async (request: ChatRequest, apiKey: string): Promise<ChatResponse> => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: request.temperature || 0.7,
        top_p: request.top_p || 0.9,
        max_tokens: request.max_tokens || 1024,
        stream: request.stream || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      model: request.model,
      prompt: request.prompt,
      completion: data.choices[0]?.message?.content || 'No response generated',
      tokens_used: data.usage?.total_tokens || 0,
      time_ms: 100, // Approximate
    };
  };

  const sendToOpenAI = async (request: ChatRequest, apiKey: string): Promise<ChatResponse> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: request.temperature || 0.7,
        top_p: request.top_p || 0.9,
        max_tokens: request.max_tokens || 1024,
        stream: request.stream || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      model: request.model,
      prompt: request.prompt,
      completion: data.choices[0]?.message?.content || 'No response generated',
      tokens_used: data.usage?.total_tokens || 0,
      time_ms: 100, // Approximate
    };
  };

  const sendMessage = async (request: ChatRequest, apiKeys: ApiKeys): Promise<ChatResponse> => {
    setIsLoading(true);
    try {
      if (isOpenAIModel(request.model)) {
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key is required for GPT models');
        }
        return await sendToOpenAI(request, apiKeys.openai);
      } else {
        if (!apiKeys.groq) {
          throw new Error('Groq API key is required for LLaMA models');
        }
        return await sendToGroq(request, apiKeys.groq);
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
};
