
import pdfplumber from 'pdfplumber';
import { FinancialEntry, FinancialData } from '@/types/financial';

export interface RawFinancialEntry {
  account_number: string;
  description: string;
  date: string;
  debit?: number;
  credit?: number;
  balance: number;
  direction: 'debit' | 'credit';
  raw_line?: string;
}

export interface ExtractionResult {
  success: boolean;
  entries: RawFinancialEntry[];
  errors: string[];
  raw_tables?: any[];
  debug_info?: any;
}

// Enhanced IFRS Category Mapping Dictionary
const IFRS_MAPPING_DICTIONARY: Record<string, { ifrsCategory: string; highLevelCategory: FinancialEntry['highLevelCategory']; mainGrouping: string }> = {
  // Assets - Non-current
  'land': { ifrsCategory: 'Property, Plant and Equipment', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'building': { ifrsCategory: 'Property, Plant and Equipment', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'property': { ifrsCategory: 'Property, Plant and Equipment', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'plant': { ifrsCategory: 'Property, Plant and Equipment', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'machinery': { ifrsCategory: 'Property, Plant and Equipment', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'equipment': { ifrsCategory: 'Property, Plant and Equipment', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'vehicle': { ifrsCategory: 'Property, Plant and Equipment', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'furniture': { ifrsCategory: 'Property, Plant and Equipment', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'fixture': { ifrsCategory: 'Property, Plant and Equipment', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'software': { ifrsCategory: 'Intangible Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'goodwill': { ifrsCategory: 'Goodwill', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  
  // Assets - Current
  'cash': { ifrsCategory: 'Cash and Cash Equivalents', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'bank': { ifrsCategory: 'Cash and Cash Equivalents', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'receivable': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'inventory': { ifrsCategory: 'Inventories', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'stock': { ifrsCategory: 'Inventories', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  
  // Equity
  'capital': { ifrsCategory: 'Share Capital', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'retained earnings': { ifrsCategory: 'Retained Earnings', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'reserves': { ifrsCategory: 'Other Reserves', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  
  // Liabilities
  'payable': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'loan': { ifrsCategory: 'Borrowings', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  'tax': { ifrsCategory: 'Tax Liabilities', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  
  // Revenue & Expenses
  'revenue': { ifrsCategory: 'Revenue', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  'sales': { ifrsCategory: 'Revenue', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  'expense': { ifrsCategory: 'General and Administrative Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'cost': { ifrsCategory: 'Cost of Sales', highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales' },
  'salary': { ifrsCategory: 'Employee Benefits', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'rent': { ifrsCategory: 'General and Administrative Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'depreciation': { ifrsCategory: 'Depreciation and Amortisation', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'interest': { ifrsCategory: 'Finance Costs', highLevelCategory: 'Expenses', mainGrouping: 'Financial Costs' },
};

// Normalize currency values
const normalizeAmount = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  let cleanValue = String(value).trim();
  
  // Handle parentheses as negative (3,000) → -3000
  const isNegative = cleanValue.includes('(') && cleanValue.includes(')');
  
  // Remove currency symbols, commas, parentheses
  cleanValue = cleanValue.replace(/[\$£€¥₹,()]/g, '');
  
  // Parse the number
  const parsed = parseFloat(cleanValue);
  if (isNaN(parsed)) return 0;
  
  return isNegative ? -parsed : parsed;
};

// Map description to IFRS category
const mapDescriptionToIFRS = (description: string) => {
  const lowerDesc = description.toLowerCase();
  const sortedEntries = Object.entries(IFRS_MAPPING_DICTIONARY).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [keyword, mapping] of sortedEntries) {
    if (lowerDesc.includes(keyword)) {
      return mapping;
    }
  }
  
  return {
    ifrsCategory: 'Uncategorized',
    highLevelCategory: 'Assets' as const,
    mainGrouping: 'Current Assets'
  };
};

// Extract structured data from PDF using pdfplumber
export const extractStructuredPDFData = async (file: File, debugMode: boolean = false): Promise<ExtractionResult> => {
  console.log('Starting structured PDF extraction for:', file.name);
  
  const result: ExtractionResult = {
    success: false,
    entries: [],
    errors: [],
    raw_tables: [],
    debug_info: {}
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Note: pdfplumber is a Python library, so we'll use a hybrid approach
    // For now, we'll enhance the existing pdfjs extraction with better parsing
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
    const worker = await import('pdfjs-dist/build/pdf.worker?worker');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    const doc = await pdfjs.getDocument({ data: uint8Array }).promise;
    
    let allText = '';
    const extractedTables: any[] = [];
    
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract text items with positioning
      const textItems = textContent.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height
      }));
      
      // Group text items by approximate rows (similar Y coordinates)
      const rows = groupTextItemsByRows(textItems);
      extractedTables.push(...rows);
      
      allText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }

    if (debugMode) {
      result.raw_tables = extractedTables;
      result.debug_info = { 
        totalPages: doc.numPages,
        extractedRows: extractedTables.length,
        rawTextLength: allText.length
      };
    }

    // Parse the extracted table data
    const entries = parseTableData(extractedTables, file.name);
    
    result.entries = entries;
    result.success = entries.length > 0;
    
    if (entries.length === 0) {
      result.errors.push('No structured financial data found in PDF');
    }

    console.log(`Extracted ${entries.length} entries from ${file.name}`);
    return result;

  } catch (error) {
    console.error('PDF extraction error:', error);
    result.errors.push(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

// Group text items by rows based on Y coordinates
const groupTextItemsByRows = (textItems: any[]): any[] => {
  const tolerance = 5; // Y-coordinate tolerance for grouping
  const rows: any[] = [];
  
  // Sort by Y coordinate (top to bottom)
  textItems.sort((a, b) => b.y - a.y);
  
  for (const item of textItems) {
    // Find existing row with similar Y coordinate
    let foundRow = rows.find(row => Math.abs(row.y - item.y) <= tolerance);
    
    if (foundRow) {
      foundRow.items.push(item);
    } else {
      rows.push({
        y: item.y,
        items: [item]
      });
    }
  }
  
  // Sort items within each row by X coordinate (left to right)
  rows.forEach(row => {
    row.items.sort((a: any, b: any) => a.x - b.x);
    row.text = row.items.map((item: any) => item.text).join(' ').trim();
  });
  
  return rows.filter(row => row.text.length > 0);
};

// Parse table data into structured financial entries
const parseTableData = (tableRows: any[], filename: string): RawFinancialEntry[] => {
  const entries: RawFinancialEntry[] = [];
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Extract period from filename if possible
  const periodMatch = filename.match(/(\d{4})/);
  const period = periodMatch ? `${periodMatch[1]}-12-31` : currentDate;
  
  for (const row of tableRows) {
    const text = row.text;
    if (!text || text.length < 10) continue; // Skip very short lines
    
    // Try to parse as financial statement line
    const parsedEntry = parseFinancialLine(text, period);
    if (parsedEntry) {
      entries.push(parsedEntry);
    }
  }
  
  return entries;
};

// Parse individual financial statement line
const parseFinancialLine = (line: string, defaultDate: string): RawFinancialEntry | null => {
  // Skip headers and non-data lines
  if (isHeaderLine(line)) return null;
  
  // Pattern 1: Account# Description Amount (common trial balance format)
  let match = line.match(/^(\d+)\s+(.+?)\s+([\d,.\-()$£€¥₹\s]+)$/);
  if (match) {
    const [, accountNumber, description, amountStr] = match;
    const amount = normalizeAmount(amountStr);
    
    return {
      account_number: accountNumber.trim(),
      description: description.trim(),
      date: defaultDate,
      balance: amount,
      direction: amount >= 0 ? 'debit' : 'credit',
      raw_line: line
    };
  }
  
  // Pattern 2: Description Debit Credit (detailed trial balance)
  match = line.match(/^(.+?)\s+([\d,.\-()$£€¥₹\s]+)\s+([\d,.\-()$£€¥₹\s]+)$/);
  if (match) {
    const [, description, debitStr, creditStr] = match;
    const debit = normalizeAmount(debitStr);
    const credit = normalizeAmount(creditStr);
    const balance = debit - credit;
    
    return {
      account_number: extractAccountNumber(description) || '',
      description: cleanDescription(description),
      date: defaultDate,
      debit,
      credit,
      balance,
      direction: balance >= 0 ? 'debit' : 'credit',
      raw_line: line
    };
  }
  
  // Pattern 3: Simple Description Amount
  match = line.match(/^(.+?)\s+([\d,.\-()$£€¥₹\s]+)$/);
  if (match) {
    const [, description, amountStr] = match;
    const amount = normalizeAmount(amountStr);
    
    if (Math.abs(amount) > 100) { // Filter out small/irrelevant amounts
      return {
        account_number: extractAccountNumber(description) || '',
        description: cleanDescription(description),
        date: defaultDate,
        balance: amount,
        direction: amount >= 0 ? 'debit' : 'credit',
        raw_line: line
      };
    }
  }
  
  return null;
};

// Check if line is a header/non-data line
const isHeaderLine = (line: string): boolean => {
  const lowerLine = line.toLowerCase();
  const headerKeywords = [
    'trial balance', 'balance sheet', 'income statement', 'profit and loss',
    'account number', 'description', 'debit', 'credit', 'balance',
    'total', 'subtotal', 'page', 'date:', 'period:', 'company'
  ];
  
  return headerKeywords.some(keyword => lowerLine.includes(keyword)) ||
         line.trim().length < 5 ||
         /^[\s\-_=]+$/.test(line); // Lines with only separators
};

// Extract account number from description if embedded
const extractAccountNumber = (description: string): string | null => {
  const match = description.match(/^(\d{3,6})\s*/);
  return match ? match[1] : null;
};

// Clean description by removing account numbers and extra whitespace
const cleanDescription = (description: string): string => {
  return description
    .replace(/^\d{3,6}\s*/, '') // Remove leading account number
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

// Convert raw entries to Lovable format
export const convertToLovableFormat = (rawEntries: RawFinancialEntry[], filename: string): FinancialData => {
  const entries: FinancialEntry[] = rawEntries.map((raw, index) => {
    const mapping = mapDescriptionToIFRS(raw.description);
    
    return {
      id: `${raw.account_number || index + 1}`,
      date: raw.date,
      description: raw.description,
      amount: raw.balance,
      highLevelCategory: mapping.highLevelCategory,
      mainGrouping: mapping.mainGrouping,
      ifrsCategory: mapping.ifrsCategory,
      originalLine: raw.raw_line
    };
  });

  return {
    companyName: filename.replace(/\.pdf$/i, ''),
    reportPeriod: rawEntries[0]?.date || new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    entries
  };
};
