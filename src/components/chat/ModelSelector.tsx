
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const AVAILABLE_MODELS = [
  { id: 'llama3-70b-8192', name: 'LLaMA 3 70B', description: 'Most capable model' },
  { id: 'llama3-8b-8192', name: 'LLaMA 3 8B', description: 'Faster responses' },
  { id: 'llama-3.1-70b-versatile', name: 'LLaMA 3.1 70B', description: 'Latest version' },
  { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B', description: 'Ultra-fast' },
];

export const ModelSelector = ({ selectedModel, onModelChange }: ModelSelectorProps) => {
  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="model-select">Model:</Label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger id="model-select" className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-gray-500">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
