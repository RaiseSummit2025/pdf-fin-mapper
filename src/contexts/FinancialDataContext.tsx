
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FinancialData } from '@/types/financial';
import { mockFinancialData } from '@/data/mockData';

interface FinancialDataContextType {
  currentFinancialData: FinancialData;
  selectedFileId: string | null;
  isProcessedData: boolean;
  updateFileData: (fileId: string, data: FinancialData) => void;
  setSelectedFile: (fileId: string, data: FinancialData) => void;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

interface FinancialDataProviderProps {
  children: ReactNode;
}

export const FinancialDataProvider: React.FC<FinancialDataProviderProps> = ({ children }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileDataMap, setFileDataMap] = useState<Record<string, FinancialData>>({});
  const [isProcessedData, setIsProcessedData] = useState(false);

  const currentFinancialData = selectedFileId && fileDataMap[selectedFileId] 
    ? fileDataMap[selectedFileId] 
    : mockFinancialData;

  const updateFileData = (fileId: string, data: FinancialData) => {
    setFileDataMap(prev => ({
      ...prev,
      [fileId]: data
    }));
  };

  const setSelectedFile = (fileId: string, data: FinancialData) => {
    setSelectedFileId(fileId);
    setFileDataMap(prev => ({
      ...prev,
      [fileId]: data
    }));
    setIsProcessedData(true);
  };

  return (
    <FinancialDataContext.Provider value={{
      currentFinancialData,
      selectedFileId,
      isProcessedData,
      updateFileData,
      setSelectedFile
    }}>
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = (): FinancialDataContextType => {
  const context = useContext(FinancialDataContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
};
