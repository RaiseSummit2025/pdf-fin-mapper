
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Bot } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableProviders: {
    groq: boolean;
    openai: boolean;
  };
}

const GROQ_MODELS = [
  { id: 'llama-3.1-70b-versatile', name: 'LLaMA 3.1 70B', provider: 'Groq' },
  { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B', provider: 'Groq' },
  { id: 'llama3-70b-8192', name: 'LLaMA 3 70B', provider: 'Groq' },
  { id: 'llama3-8b-8192', name: 'LLaMA 3 8B', provider: 'Groq' },
];

const OPENAI_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
];

export const ModelSelector = ({ selectedModel, onModelChange, availableProviders }: ModelSelectorProps) => {
  const availableModels = [
    ...(availableProviders.groq ? GROQ_MODELS : []),
    ...(availableProviders.openai ? OPENAI_MODELS : []),
  ];

  return (
    <div className="flex items-center gap-3">
      <Bot className="w-5 h-5 text-gray-600" />
      <div className="flex-1">
        <Label htmlFor="model-select" className="text-sm font-medium text-gray-700">
          AI Model
        </Label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger id="model-select" className="w-full mt-1">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {availableProviders.groq && (
              <>
                <SelectItem disabled value="groq-header" className="font-medium text-green-600">
                  Groq (LLaMA Models)
                </SelectItem>
                {GROQ_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </>
            )}
            {availableProviders.openai && availableProviders.groq && (
              <SelectItem disabled value="separator" className="h-px bg-gray-200 my-1">
                ―――――――――――
              </SelectItem>
            )}
            {availableProviders.openai && (
              <>
                <SelectItem disabled value="openai-header" className="font-medium text-blue-600">
                  OpenAI (GPT Models)
                </SelectItem>
                {OPENAI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
