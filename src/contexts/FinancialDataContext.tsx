import { createContext, useContext, useState, ReactNode } from 'react';
import { FinancialData } from '@/types/financial';
import { mockFinancialData } from '@/data/mockData';

interface FinancialDataContextType {
  financialData: FinancialData;
  setFinancialData: (data: FinancialData) => void;
  isProcessedData: boolean;
  setIsProcessedData: (processed: boolean) => void;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [financialData, setFinancialData] = useState<FinancialData>(mockFinancialData);
  const [isProcessedData, setIsProcessedData] = useState(false);

  return (
    <FinancialDataContext.Provider value={{
      financialData,
      setFinancialData,
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