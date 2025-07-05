import { FinancialEntry, FinancialData } from '@/types/financial';

export const mockFinancialEntries: FinancialEntry[] = [
  // Assets
  {
    id: '1',
    date: '2023-12-31',
    description: 'Cash and Cash Equivalents',
    amount: 125000,
    highLevelCategory: 'Assets',
    mainGrouping: 'Current Assets',
    ifrsCategory: 'Cash and Cash Equivalents',
    originalLine: 'Cash and bank balances'
  },
  {
    id: '2',
    date: '2023-12-31',
    description: 'Trade Receivables',
    amount: 85000,
    highLevelCategory: 'Assets',
    mainGrouping: 'Current Assets',
    ifrsCategory: 'Trade and Other Receivables',
    originalLine: 'Accounts receivable - trade'
  },
  {
    id: '3',
    date: '2023-12-31',
    description: 'Property, Plant and Equipment',
    amount: 450000,
    highLevelCategory: 'Assets',
    mainGrouping: 'Non-current Assets',
    ifrsCategory: 'Property, Plant and Equipment',
    originalLine: 'Fixed assets - property and equipment'
  },
  {
    id: '4',
    date: '2023-12-31',
    description: 'Intangible Assets',
    amount: 75000,
    highLevelCategory: 'Assets',
    mainGrouping: 'Non-current Assets',
    ifrsCategory: 'Intangible Assets',
    originalLine: 'Goodwill and intangible assets'
  },
  // Liabilities
  {
    id: '5',
    date: '2023-12-31',
    description: 'Trade Payables',
    amount: 45000,
    highLevelCategory: 'Liabilities',
    mainGrouping: 'Current Liabilities',
    ifrsCategory: 'Trade and Other Payables',
    originalLine: 'Accounts payable - trade'
  },
  {
    id: '6',
    date: '2023-12-31',
    description: 'Long-term Debt',
    amount: 200000,
    highLevelCategory: 'Liabilities',
    mainGrouping: 'Non-current Liabilities',
    ifrsCategory: 'Borrowings',
    originalLine: 'Long-term bank loans'
  },
  // Equity
  {
    id: '7',
    date: '2023-12-31',
    description: 'Share Capital',
    amount: 100000,
    highLevelCategory: 'Equity',
    mainGrouping: 'Equity',
    ifrsCategory: 'Share Capital',
    originalLine: 'Issued share capital'
  },
  {
    id: '8',
    date: '2023-12-31',
    description: 'Retained Earnings',
    amount: 390000,
    highLevelCategory: 'Equity',
    mainGrouping: 'Equity',
    ifrsCategory: 'Retained Earnings',
    originalLine: 'Accumulated profits'
  },
  // Revenue
  {
    id: '9',
    date: '2023-12-31',
    description: 'Revenue from Sales',
    amount: 850000,
    highLevelCategory: 'Revenue',
    mainGrouping: 'Revenue',
    ifrsCategory: 'Revenue',
    originalLine: 'Sales revenue'
  },
  // Expenses
  {
    id: '10',
    date: '2023-12-31',
    description: 'Cost of Goods Sold',
    amount: 520000,
    highLevelCategory: 'Expenses',
    mainGrouping: 'Cost of Sales',
    ifrsCategory: 'Cost of Sales',
    originalLine: 'Cost of goods sold'
  },
  {
    id: '11',
    date: '2023-12-31',
    description: 'Administrative Expenses',
    amount: 125000,
    highLevelCategory: 'Expenses',
    mainGrouping: 'Operating Expenses',
    ifrsCategory: 'Administrative Expenses',
    originalLine: 'General and administrative expenses'
  },
  {
    id: '12',
    date: '2023-12-31',
    description: 'Selling Expenses',
    amount: 85000,
    highLevelCategory: 'Expenses',
    mainGrouping: 'Operating Expenses',
    ifrsCategory: 'Distribution Costs',
    originalLine: 'Sales and marketing expenses'
  }
];

export const mockFinancialData: FinancialData = {
  companyName: 'Sample Corporation Ltd',
  reportPeriod: 'Year Ended December 31, 2023',
  entries: mockFinancialEntries,
  lastUpdated: new Date().toISOString()
};

export const ifrsCategories = {
  assets: {
    current: [
      'Cash and Cash Equivalents',
      'Trade and Other Receivables', 
      'Inventories',
      'Prepaid Expenses',
      'Other Current Assets'
    ],
    nonCurrent: [
      'Property, Plant and Equipment',
      'Investment Property',
      'Intangible Assets',
      'Investments in Associates',
      'Other Non-current Assets'
    ]
  },
  liabilities: {
    current: [
      'Trade and Other Payables',
      'Short-term Borrowings',
      'Current Portion of Long-term Debt',
      'Accrued Expenses',
      'Other Current Liabilities'
    ],
    nonCurrent: [
      'Borrowings',
      'Deferred Tax Liabilities',
      'Employee Benefits',
      'Provisions',
      'Other Non-current Liabilities'
    ]
  },
  equity: [
    'Share Capital',
    'Share Premium',
    'Retained Earnings',
    'Other Comprehensive Income',
    'Non-controlling Interests'
  ],
  income: [
    'Revenue',
    'Other Income',
    'Finance Income',
    'Share of Profit of Associates'
  ],
  expenses: [
    'Cost of Sales',
    'Distribution Costs',
    'Administrative Expenses',
    'Other Expenses',
    'Finance Costs',
    'Tax Expense'
  ]
};