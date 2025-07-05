
import React, { useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Key, Bot, MessageCircle } from 'lucide-react';

const ChatPage = () => {
  const [apiKeys, setApiKeys] = useState({
    groq: localStorage.getItem('groq_api_key') || '',
    openai: localStorage.getItem('openai_api_key') || '',
  });
  const [showChat, setShowChat] = useState(false);

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    localStorage.setItem(`${provider}_api_key`, value);
  };

  const handleStartChat = () => {
    if (apiKeys.groq || apiKeys.openai) {
      setShowChat(true);
    }
  };

  const hasApiKeys = apiKeys.groq || apiKeys.openai;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Bot className="w-8 h-8" />
          AI Chatbot
        </h1>
        <p className="text-gray-600">Chat with LLaMA models via Groq or OpenAI GPT models</p>
      </div>

      {!showChat ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Enter your API keys to start chatting with AI models. Your keys are stored locally for testing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groq-key">Groq API Key (for LLaMA models)</Label>
                <Input
                  id="groq-key"
                  type="password"
                  placeholder="Enter your Groq API key..."
                  value={apiKeys.groq}
                  onChange={(e) => handleApiKeyChange('groq', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Get your key from <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">console.groq.com</a>
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key (for GPT models)</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="Enter your OpenAI API key..."
                  value={apiKeys.openai}
                  onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">platform.openai.com</a>
                </p>
              </div>

              <Button 
                onClick={handleStartChat}
                disabled={!hasApiKeys}
                className="w-full mt-4"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Chatting
              </Button>
            </CardContent>
          </Card>

          {hasApiKeys && (
            <Card>
              <CardHeader>
                <CardTitle>Available Models</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {apiKeys.groq && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Groq (LLaMA)</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• LLaMA 3.1 70B</li>
                        <li>• LLaMA 3.1 8B</li>
                        <li>• LLaMA 3 70B</li>
                        <li>• LLaMA 3 8B</li>
                      </ul>
                    </div>
                  )}
                  {apiKeys.openai && (
                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">OpenAI</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• GPT-4</li>
                        <li>• GPT-4 Turbo</li>
                        <li>• GPT-3.5 Turbo</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => setShowChat(false)}
            className="mb-4"
          >
            ← Back to Settings
          </Button>
          <ChatInterface apiKeys={apiKeys} />
        </div>
      )}
    </div>
  );
};

export default ChatPage;
