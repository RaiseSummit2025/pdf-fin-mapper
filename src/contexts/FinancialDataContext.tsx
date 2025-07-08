
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

  const parseExcelAmount = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    
    let cleanValue = String(value).trim();
    
    // Handle negative values in parentheses
    const isNegative = cleanValue.includes('(') && cleanValue.includes(')');
    cleanValue = cleanValue.replace(/[\$£€¥₹,()]/g, '').trim();
    
    const parsed = parseFloat(cleanValue);
    if (isNaN(parsed)) return 0;
    
    return isNegative ? -parsed : parsed;
  };

  const addExcelData = (filename: string, excelData: any) => {
    console.log('Adding Excel data:', excelData);
    
    // Convert Excel data to FinancialData format
    const entries = excelData.sampleRows?.map((row: any[], index: number) => {
      // Try different column combinations to find description and amount
      let description = '';
      let amount = 0;
      
      // Strategy 1: Look for text in first column, number in second or third
      if (row.length >= 2) {
        const firstCol = String(row[0] || '').trim();
        const secondCol = parseExcelAmount(row[1]);
        const thirdCol = row.length > 2 ? parseExcelAmount(row[2]) : null;
        
        // If first column is text and second is number
        if (firstCol && !isNaN(secondCol) && secondCol !== 0) {
          description = firstCol;
          amount = secondCol;
        }
        // If first column is text and third is number (might be account | description | balance format)
        else if (firstCol && thirdCol !== null && !isNaN(thirdCol) && thirdCol !== 0) {
          description = String(row[1] || firstCol).trim();
          amount = thirdCol;
        }
        // Last resort: use whatever we can find
        else if (firstCol) {
          description = firstCol;
          // Look for any number in the row
          for (let i = 1; i < row.length; i++) {
            const cellAmount = parseExcelAmount(row[i]);
            if (!isNaN(cellAmount) && cellAmount !== 0) {
              amount = cellAmount;
              break;
            }
          }
        }
      }
      
      // Skip rows without meaningful data
      if (!description || description.toLowerCase().includes('total') || description.toLowerCase().includes('account')) {
        return null;
      }
      
      // Determine category based on description keywords
      let highLevelCategory: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses' = 'Assets';
      let mainGrouping = 'Current Assets';
      let ifrsCategory = 'Cash and Cash Equivalents';
      
      const desc = description.toLowerCase();
      
      if (desc.includes('revenue') || desc.includes('sales') || desc.includes('income') || desc.includes('service')) {
        highLevelCategory = 'Revenue';
        mainGrouping = 'Operating Revenue';
        ifrsCategory = 'Revenue from Contracts with Customers';
      } else if (desc.includes('expense') || desc.includes('cost') || desc.includes('depreciation') || desc.includes('salary') || desc.includes('rent')) {
        highLevelCategory = 'Expenses';
        mainGrouping = 'Operating Expenses';
        ifrsCategory = 'Cost of Sales';
      } else if (desc.includes('liability') || desc.includes('payable') || desc.includes('debt') || desc.includes('loan')) {
        highLevelCategory = 'Liabilities';
        mainGrouping = 'Current Liabilities';
        ifrsCategory = 'Trade and Other Payables';
      } else if (desc.includes('equity') || desc.includes('capital') || desc.includes('retained') || desc.includes('share')) {
        highLevelCategory = 'Equity';
        mainGrouping = 'Share Capital';
        ifrsCategory = 'Share Capital';
      } else if (desc.includes('fixed') || desc.includes('property') || desc.includes('equipment') || desc.includes('building')) {
        highLevelCategory = 'Assets';
        mainGrouping = 'Non-current Assets';
        ifrsCategory = 'Property, Plant and Equipment';
      } else if (desc.includes('cash') || desc.includes('bank')) {
        highLevelCategory = 'Assets';
        mainGrouping = 'Current Assets';
        ifrsCategory = 'Cash and Cash Equivalents';
      } else if (desc.includes('receivable') || desc.includes('debtor')) {
        highLevelCategory = 'Assets';
        mainGrouping = 'Current Assets';
        ifrsCategory = 'Trade and Other Receivables';
      }

      return {
        id: `excel-${index}`,
        date: new Date().toISOString().split('T')[0],
        description: description,
        amount: amount,
        highLevelCategory,
        mainGrouping,
        ifrsCategory,
        originalLine: row.join(' | ')
      };
    }).filter(entry => entry !== null) || [];

    const financialData: FinancialData = {
      companyName: excelData.fileName?.replace(/\.[^/.]+$/, '') || 'Uploaded Company',
      reportPeriod: new Date().getFullYear().toString(),
      entries: entries,
      lastUpdated: new Date().toISOString()
    };

    const newFile: FileData = {
      id: `excel-${Date.now()}`,
      filename: excelData.fileName || filename,
      uploadDate: new Date().toISOString(),
      data: financialData
    };

    console.log('Created financial data with entries:', entries.length);
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
