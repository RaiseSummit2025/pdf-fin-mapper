export interface FinancialEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  highLevelCategory: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  mainGrouping: string;
  ifrsCategory: string;
  originalLine?: string;
}

export interface FinancialStatement {
  period: string;
  entries: FinancialEntry[];
}

export interface MappingCategory {
  name: string;
  entries: FinancialEntry[];
  total: number;
}

export interface FinancialData {
  companyName: string;
  reportPeriod: string;
  entries: FinancialEntry[];
  lastUpdated: string;
}