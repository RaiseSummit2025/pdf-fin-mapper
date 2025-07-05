
// Backend API implementation for Groq integration
// This would typically be in a separate backend service

interface GroqRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqClient {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createChatCompletion(request: GroqRequest): Promise<GroqResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Validation functions
export const validateModel = (model: string): boolean => {
  const validModels = [
    'llama3-70b-8192',
    'llama3-8b-8192',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
  ];
  return validModels.includes(model);
};

export const validatePrompt = (prompt: string): { valid: boolean; error?: string } => {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }
  if (prompt.length > 32000) {
    return { valid: false, error: 'Prompt too long (max 32,000 characters)' };
  }
  return { valid: true };
};
