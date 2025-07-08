
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
  addExcelData: (filename: string, excelData: any) => void;
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

  const addExcelData = (filename: string, excelData: any) => {
    console.log('Adding Excel data:', excelData);
    
    // Convert Excel data to FinancialData format
    const entries = excelData.sampleRows?.map((row: any[], index: number) => {
      const description = String(row[0] || '').trim();
      const amount = parseFloat(String(row[1] || '0').replace(/[^0-9.-]/g, '')) || 0;
      
      // Determine category based on description keywords
      let highLevelCategory: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses' = 'Assets';
      let mainGrouping = 'Current Assets';
      let ifrsCategory = 'Cash and Cash Equivalents';
      
      const desc = description.toLowerCase();
      
      if (desc.includes('revenue') || desc.includes('sales') || desc.includes('income')) {
        highLevelCategory = 'Revenue';
        mainGrouping = 'Operating Revenue';
        ifrsCategory = 'Revenue from Contracts with Customers';
      } else if (desc.includes('expense') || desc.includes('cost') || desc.includes('depreciation')) {
        highLevelCategory = 'Expenses';
        mainGrouping = 'Operating Expenses';
        ifrsCategory = 'Cost of Sales';
      } else if (desc.includes('liability') || desc.includes('payable') || desc.includes('debt')) {
        highLevelCategory = 'Liabilities';
        mainGrouping = 'Current Liabilities';
        ifrsCategory = 'Trade and Other Payables';
      } else if (desc.includes('equity') || desc.includes('capital') || desc.includes('retained')) {
        highLevelCategory = 'Equity';
        mainGrouping = 'Share Capital';
        ifrsCategory = 'Share Capital';
      } else if (desc.includes('fixed') || desc.includes('property') || desc.includes('equipment')) {
        highLevelCategory = 'Assets';
        mainGrouping = 'Non-current Assets';
        ifrsCategory = 'Property, Plant and Equipment';
      }

      return {
        id: `excel-${index}`,
        date: new Date().toISOString().split('T')[0],
        description: description || `Item ${index + 1}`,
        amount: amount,
        highLevelCategory,
        mainGrouping,
        ifrsCategory,
        originalLine: row.join(' | ')
      };
    }) || [];

    const financialData: FinancialData = {
      companyName: excelData.fileName?.replace(/\.[^/.]+$/, '') || 'Uploaded Company',
      reportPeriod: new Date().getFullYear().toString(),
      entries: entries.filter(entry => entry.description && entry.description !== 'Item 1'), // Filter out empty entries
      lastUpdated: new Date().toISOString()
    };

    const newFile: FileData = {
      id: `excel-${Date.now()}`,
      filename: excelData.fileName || filename,
      uploadDate: new Date().toISOString(),
      data: financialData
    };

    console.log('Created financial data:', financialData);
    addFile(newFile);
    setIsProcessedData(true);
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
      setIsProcessedData,
      addExcelData
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
