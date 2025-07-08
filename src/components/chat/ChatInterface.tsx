
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import { useChatApi } from '@/hooks/useChatApi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  apiKeys: {
    groq: string;
    openai: string;
  };
}

export const ChatInterface = ({ apiKeys }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('llama3-70b-8192');
  const { sendMessage, isLoading } = useChatApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('Sending message with model:', selectedModel);
      const response = await sendMessage({
        model: selectedModel,
        prompt: content,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
        stream: false,
      }, apiKeys);

      console.log('Received response:', response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.completion,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      toast({
        title: "Message sent successfully",
        description: `Used ${response.tokens_used} tokens`,
      });

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to send message. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg bg-white">
      <div className="p-4 border-b border-gray-200">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          availableProviders={{ groq: !!apiKeys.groq, openai: !!apiKeys.openai }}
        />
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Start a conversation with the AI!</p>
              <p className="text-sm mt-2">Ask questions about financial data, get help with analysis, or just chat.</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-gray-200">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};
