
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { X, Send, Bot, User } from 'lucide-react';
import { ReconciliationResult } from './ReconciliationBadge';

interface ValidationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ValidationChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  reconciliationResult: ReconciliationResult | null;
  onApplyChanges: (changes: any) => void;
}

export const ValidationChatAssistant = ({ 
  isOpen, 
  onClose, 
  reconciliationResult,
  onApplyChanges 
}: ValidationChatAssistantProps) => {
  const [messages, setMessages] = useState<ValidationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(amount);

  useEffect(() => {
    if (isOpen && reconciliationResult) {
      const initialMessage: ValidationMessage = {
        id: '1',
        role: 'assistant',
        content: `For the ${reconciliationResult.category} category, I found a discrepancy:\n\n` +
          `• Mapped components total: ${formatCurrency(reconciliationResult.mappedTotal)}\n` +
          `• Reported total: ${reconciliationResult.reportedTotal ? formatCurrency(reconciliationResult.reportedTotal) : 'Not available'}\n` +
          `• Difference: ${formatCurrency(reconciliationResult.difference)}\n` +
          `• Source pages: ${reconciliationResult.sourcePages.join(', ')}\n\n` +
          `Contributing items:\n${reconciliationResult.contributingItems.map(item => `• ${item}`).join('\n')}\n\n` +
          `Would you like to review and adjust the mapping?`,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, reconciliationResult]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ValidationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response based on user input
    setTimeout(() => {
      let aiResponse = '';
      const input = inputValue.toLowerCase();

      if (input.includes('what lines') || input.includes('which items')) {
        aiResponse = `The following items are currently mapped to ${reconciliationResult?.category}:\n\n` +
          `${reconciliationResult?.contributingItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
      } else if (input.includes('exclude') || input.includes('remove')) {
        aiResponse = `I can help you exclude items from this category. Please specify which line item you'd like to move or exclude, and I'll update the mapping accordingly.`;
      } else if (input.includes('move') || input.includes('reclassify')) {
        aiResponse = `I can help you move line items to different IFRS categories. Which item would you like to reclassify and to which category?`;
      } else if (input.includes('add') || input.includes('missing')) {
        aiResponse = `I can help you add missing items. Please describe the item you'd like to add or specify the page number where it appears in the PDF.`;
      } else {
        aiResponse = `I understand you want to review the ${reconciliationResult?.category} mapping. You can:\n\n` +
          `• Ask "What lines were included?" to see all mapped items\n` +
          `• Say "Exclude [item name]" to remove an item\n` +
          `• Say "Move [item] to [category]" to reclassify\n` +
          `• Say "Add missing item from page X" to include overlooked items`;
      }

      const assistantMessage: ValidationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[600px] h-[500px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Review & Validate Mapping</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4">
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about the discrepancy or request changes..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
