
import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Bot } from 'lucide-react';

const ChatPage = () => {
  // API keys are now handled by the backend
  const mockApiKeys = { groq: 'backend', openai: 'backend' };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Bot className="w-8 h-8" />
          AI Chatbot
        </h1>
        <p className="text-gray-600">Chat with LLaMA models powered by Groq - Text and Speech Input Supported</p>
      </div>

      <ChatInterface apiKeys={mockApiKeys} />
    </div>
  );
};

export default ChatPage;
