
import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';

const ChatPage = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Chatbot</h1>
        <p className="text-gray-600">Chat with LLaMA models powered by Groq API</p>
      </div>
      <ChatInterface />
    </div>
  );
};

export default ChatPage;
