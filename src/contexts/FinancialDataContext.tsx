
import { createContext, useContext, useState, ReactNode } from 'react';
import { FinancialData } from '@/types/financial';
import { mockFinancialData } from '@/data/mockData';

interface FileData {
  id: string;
  filename: string;
  uploadDate: string;
  data: FinancialData;
}

interface FinancialDataContextType {
  files: FileData[];
  selectedFileId: string | null;
  currentFinancialData: FinancialData;
  addFile: (file: FileData) => void;
  removeFile: (fileId: string) => void;
  selectFile: (fileId: string) => void;
  updateFileData: (fileId: string, data: FinancialData) => void;
  isProcessedData: boolean;
  setIsProcessedData: (processed: boolean) => void;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileData[]>([
    {
      id: 'mock-file-1',
      filename: 'Sample Financial Statement.pdf',
      uploadDate: new Date().toISOString(),
      data: mockFinancialData
    }
  ]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>('mock-file-1');
  const [isProcessedData, setIsProcessedData] = useState(false);

  const currentFinancialData = files.find(f => f.id === selectedFileId)?.data || mockFinancialData;

  const addFile = (file: FileData) => {
    setFiles(prev => [...prev, file]);
    setSelectedFileId(file.id);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId);
      setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  };

  const selectFile = (fileId: string) => {
    setSelectedFileId(fileId);
  };

  const updateFileData = (fileId: string, data: FinancialData) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, data } : f
    ));
  };

  return (
    <FinancialDataContext.Provider value={{
      files,
      selectedFileId,
      currentFinancialData,
      addFile,
      removeFile,
      selectFile,
      updateFileData,
      isProcessedData,
      setIsProcessedData
    }}>
      {children}
    </FinancialDataContext.Provider>
  );
}

export function useFinancialData() {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
}

// Legacy compatibility
export const useFinancialDataLegacy = () => {
  const context = useFinancialData();
  return {
    financialData: context.currentFinancialData,
    setFinancialData: (data: FinancialData) => {
      if (context.selectedFileId) {
        context.updateFileData(context.selectedFileId, data);
      }
    }
  };
};
