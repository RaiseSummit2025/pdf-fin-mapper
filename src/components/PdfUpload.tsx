import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowRight, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { FinancialEntry, FinancialData } from '@/types/financial';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
}

interface SortableItemProps {
  id: string;
  entry: FinancialEntry;
  onRemove: (id: string) => void;
}

// IFRS Category Mapping Dictionary - maps account descriptions to predefined IFRS categories
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
  'lease asset': { ifrsCategory: 'Right-of-Use Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'right-of-use': { ifrsCategory: 'Right-of-Use Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'software': { ifrsCategory: 'Intangible Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'patent': { ifrsCategory: 'Intangible Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'trademark': { ifrsCategory: 'Intangible Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'license': { ifrsCategory: 'Intangible Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'goodwill': { ifrsCategory: 'Goodwill', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'deferred tax asset': { ifrsCategory: 'Deferred Tax Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  
  // Assets - Current
  'cash': { ifrsCategory: 'Cash and Cash Equivalents', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'bank': { ifrsCategory: 'Cash and Cash Equivalents', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'petty cash': { ifrsCategory: 'Cash and Cash Equivalents', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'deposit': { ifrsCategory: 'Cash and Cash Equivalents', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'accounts receivable': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'trade receivable': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'receivable': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'debtor': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'other receivable': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'prepayment': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'inventory': { ifrsCategory: 'Inventories', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'stock': { ifrsCategory: 'Inventories', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'raw material': { ifrsCategory: 'Inventories', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'work in progress': { ifrsCategory: 'Inventories', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'finished goods': { ifrsCategory: 'Inventories', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  
  // Equity
  'share capital': { ifrsCategory: 'Share Capital', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'capital': { ifrsCategory: 'Share Capital', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'ordinary share': { ifrsCategory: 'Share Capital', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'share premium': { ifrsCategory: 'Share Premium', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'retained earnings': { ifrsCategory: 'Retained Earnings', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'retained profit': { ifrsCategory: 'Retained Earnings', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'accumulated profit': { ifrsCategory: 'Retained Earnings', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'owner equity': { ifrsCategory: 'Retained Earnings', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'profit for the year': { ifrsCategory: 'Retained Earnings', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  
  // Liabilities - Non-current
  'long term loan': { ifrsCategory: 'Borrowings', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  'term loan': { ifrsCategory: 'Borrowings', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  'bank loan': { ifrsCategory: 'Borrowings', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  'lease liability': { ifrsCategory: 'Lease Liabilities', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  'provision': { ifrsCategory: 'Provisions', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  'deferred tax liability': { ifrsCategory: 'Deferred Tax Liabilities', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  
  // Liabilities - Current
  'accounts payable': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'trade payable': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'payable': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'creditor': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'accrual': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'accrued expense': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'short term loan': { ifrsCategory: 'Borrowings', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'overdraft': { ifrsCategory: 'Borrowings', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'tax payable': { ifrsCategory: 'Tax Liabilities', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'income tax': { ifrsCategory: 'Tax Liabilities', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  
  // Revenue
  'revenue': { ifrsCategory: 'Revenue', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  'sales': { ifrsCategory: 'Revenue', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  'income': { ifrsCategory: 'Revenue', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  'service income': { ifrsCategory: 'Revenue', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  'other income': { ifrsCategory: 'Other Operating Income', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  'miscellaneous income': { ifrsCategory: 'Other Operating Income', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  
  // Expenses
  'cost of sales': { ifrsCategory: 'Cost of Sales', highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales' },
  'cost of goods sold': { ifrsCategory: 'Cost of Sales', highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales' },
  'material': { ifrsCategory: 'Cost of Sales', highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales' },
  'direct labor': { ifrsCategory: 'Cost of Sales', highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales' },
  'manufacturing': { ifrsCategory: 'Cost of Sales', highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales' },
  'salary': { ifrsCategory: 'Employee Benefits', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'wage': { ifrsCategory: 'Employee Benefits', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'employee': { ifrsCategory: 'Employee Benefits', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'payroll': { ifrsCategory: 'Employee Benefits', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'rent': { ifrsCategory: 'General and Administrative Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'office': { ifrsCategory: 'General and Administrative Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'administrative': { ifrsCategory: 'General and Administrative Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'professional fee': { ifrsCategory: 'General and Administrative Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'legal': { ifrsCategory: 'General and Administrative Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'audit': { ifrsCategory: 'General and Administrative Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'marketing': { ifrsCategory: 'Selling Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'advertising': { ifrsCategory: 'Selling Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'sales commission': { ifrsCategory: 'Selling Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'promotion': { ifrsCategory: 'Selling Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'depreciation': { ifrsCategory: 'Depreciation and Amortisation', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'amortisation': { ifrsCategory: 'Depreciation and Amortisation', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'interest expense': { ifrsCategory: 'Finance Costs', highLevelCategory: 'Expenses', mainGrouping: 'Financial Costs' },
  'finance cost': { ifrsCategory: 'Finance Costs', highLevelCategory: 'Expenses', mainGrouping: 'Financial Costs' },
  'tax expense': { ifrsCategory: 'Income Tax Expense', highLevelCategory: 'Expenses', mainGrouping: 'Tax' },
};

// Fuzzy matching function to map account descriptions to IFRS categories
const mapDescriptionToIFRS = (description: string): { ifrsCategory: string; highLevelCategory: FinancialEntry['highLevelCategory']; mainGrouping: string } => {
  const lowerDesc = description.toLowerCase();
  
  // Try exact matches first
  for (const [keyword, mapping] of Object.entries(IFRS_MAPPING_DICTIONARY)) {
    if (lowerDesc.includes(keyword)) {
      return mapping;
    }
  }
  
  // Fallback to uncategorized
  return {
    ifrsCategory: 'Uncategorized',
    highLevelCategory: 'Assets',
    mainGrouping: 'Current Assets'
  };
};

// Simulate realistic PDF parsing with proper IFRS mapping
const parseFinancialData = (fileName: string): FinancialData => {
  const companyName = fileName.replace('.pdf', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Corporation';
  
  // Simulate realistic trial balance or financial statement data
  const rawAccountData = [
    { accountNo: '1000', description: 'Cash at Bank', amount: 89000, type: 'debit' },
    { accountNo: '1010', description: 'Petty Cash Fund', amount: 2500, type: 'debit' },
    { accountNo: '1020', description: 'Short-term Bank Deposits', amount: 65000, type: 'debit' },
    { accountNo: '1100', description: 'Accounts Receivable - Trade', amount: 145000, type: 'debit' },
    { accountNo: '1110', description: 'Other Receivables and Prepayments', amount: 23000, type: 'debit' },
    { accountNo: '1200', description: 'Inventory - Raw Materials', amount: 78000, type: 'debit' },
    { accountNo: '1210', description: 'Inventory - Work in Progress', amount: 45000, type: 'debit' },
    { accountNo: '1220', description: 'Inventory - Finished Goods', amount: 67000, type: 'debit' },
    { accountNo: '1500', description: 'Land and Buildings at Cost', amount: 580000, type: 'debit' },
    { accountNo: '1510', description: 'Plant and Machinery - Net', amount: 420000, type: 'debit' },
    { accountNo: '1520', description: 'Motor Vehicles at NBV', amount: 85000, type: 'debit' },
    { accountNo: '1530', description: 'Office Equipment and Fixtures', amount: 45000, type: 'debit' },
    { accountNo: '1600', description: 'Right-of-Use Assets - Property Leases', amount: 125000, type: 'debit' },
    { accountNo: '1700', description: 'Computer Software and Licenses', amount: 78000, type: 'debit' },
    { accountNo: '1710', description: 'Patents and Trademarks', amount: 125000, type: 'debit' },
    { accountNo: '1800', description: 'Goodwill on Business Combinations', amount: 95000, type: 'debit' },
    { accountNo: '1900', description: 'Deferred Tax Asset', amount: 32000, type: 'debit' },
    
    // Liabilities
    { accountNo: '2000', description: 'Accounts Payable - Trade', amount: 89000, type: 'credit' },
    { accountNo: '2010', description: 'Accrued Expenses and Other Payables', amount: 34000, type: 'credit' },
    { accountNo: '2100', description: 'Short-term Bank Loans', amount: 45000, type: 'credit' },
    { accountNo: '2110', description: 'Tax Payable - Current', amount: 28000, type: 'credit' },
    { accountNo: '2120', description: 'Lease Liability - Current Portion', amount: 15000, type: 'credit' },
    { accountNo: '2500', description: 'Bank Loan - Term (Secured)', amount: 235000, type: 'credit' },
    { accountNo: '2510', description: 'Lease Liability - Property', amount: 98000, type: 'credit' },
    { accountNo: '2520', description: 'Provision for Employee Benefits', amount: 35000, type: 'credit' },
    { accountNo: '2600', description: 'Deferred Tax Liability', amount: 28000, type: 'credit' },
    
    // Equity
    { accountNo: '3000', description: 'Ordinary Share Capital', amount: 200000, type: 'credit' },
    { accountNo: '3100', description: 'Share Premium Account', amount: 150000, type: 'credit' },
    { accountNo: '3200', description: 'Retained Earnings - Prior Years', amount: 285000, type: 'credit' },
    { accountNo: '3210', description: 'Profit for the Current Year', amount: 145000, type: 'credit' },
    
    // Revenue
    { accountNo: '4000', description: 'Revenue from Sales - Domestic', amount: 980000, type: 'credit' },
    { accountNo: '4010', description: 'Revenue from Sales - Export', amount: 420000, type: 'credit' },
    { accountNo: '4100', description: 'Other Operating Income', amount: 25000, type: 'credit' },
    
    // Expenses
    { accountNo: '5000', description: 'Cost of Raw Materials Consumed', amount: 485000, type: 'debit' },
    { accountNo: '5010', description: 'Direct Labor Costs', amount: 225000, type: 'debit' },
    { accountNo: '5020', description: 'Manufacturing Overhead Costs', amount: 145000, type: 'debit' },
    { accountNo: '6000', description: 'Salary and Wages - Operations', amount: 185000, type: 'debit' },
    { accountNo: '6010', description: 'Executive Salaries and Benefits', amount: 120000, type: 'debit' },
    { accountNo: '6100', description: 'Office Rent and Rates', amount: 48000, type: 'debit' },
    { accountNo: '6110', description: 'Professional Fees - Legal and Audit', amount: 35000, type: 'debit' },
    { accountNo: '6200', description: 'Marketing and Advertising Expenses', amount: 75000, type: 'debit' },
    { accountNo: '6210', description: 'Sales Commission and Incentives', amount: 42000, type: 'debit' },
    { accountNo: '6300', description: 'Depreciation Expense - PPE', amount: 65000, type: 'debit' },
    { accountNo: '6400', description: 'Interest Expense on Bank Loans', amount: 18000, type: 'debit' },
    { accountNo: '6500', description: 'Income Tax Expense', amount: 45000, type: 'debit' },
  ];

  const entries: FinancialEntry[] = rawAccountData.map((account, index) => {
    const mapping = mapDescriptionToIFRS(account.description);
    const finalAmount = account.type === 'credit' ? account.amount : account.amount;
    
    console.log(`Mapping "${account.description}" to IFRS category: ${mapping.ifrsCategory}`);
    
    return {
      id: `${account.accountNo}_${index}`,
      date: '2023-12-31',
      description: account.description,
      amount: finalAmount,
      highLevelCategory: mapping.highLevelCategory,
      mainGrouping: mapping.mainGrouping,
      ifrsCategory: mapping.ifrsCategory,
      originalLine: `${account.accountNo} | ${account.description} | ${account.type === 'debit' ? account.amount : 0} | ${account.type === 'credit' ? account.amount : 0}`
    };
  });

  console.log('Generated financial entries with IFRS mapping:', entries);
  
  return {
    companyName,
    reportPeriod: 'Year Ended 31 December 2023',
    entries,
    lastUpdated: new Date().toISOString()
  };
};

const SortableItem = ({ id, entry, onRemove }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(amount);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border rounded-lg p-3 cursor-move hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
              #{entry.id.split('_')[0]}
            </span>
            <span className="text-xs text-gray-400">{entry.date}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">{entry.description}</p>
          <p className="text-xs text-gray-500">
            Original: {entry.originalLine || 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <span className="text-sm font-bold text-gray-900">{formatCurrency(entry.amount)}</span>
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export function PdfUpload() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showMappingEngine, setShowMappingEngine] = useState(false);
  const [mappedData, setMappedData] = useState<FinancialData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [unmappedEntries, setUnmappedEntries] = useState<string[]>([]);
  const { toast } = useToast();
  const { setFinancialData, setIsProcessedData } = useFinancialData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const processingSteps: ProcessingStep[] = [
    {
      id: 'upload',
      label: 'File Upload',
      status: 'pending',
      description: 'Uploading PDF file to processing server'
    },
    {
      id: 'mapping',
      label: 'IFRS Mapping',
      status: 'pending',
      description: 'Mapping extracted items to IFRS categories'
    },
    {
      id: 'validation',
      label: 'Data Validation',
      status: 'pending',
      description: 'Validating extracted data and checking for completeness'
    },
    {
      id: 'completion',
      label: 'Processing Complete',
      status: 'pending',
      description: 'Financial data ready for analysis and review'
    }
  ];

  const [steps, setSteps] = useState<ProcessingStep[]>(processingSteps);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setShowMappingEngine(false);
      setSteps(processingSteps.map(step => ({ ...step, status: 'pending' })));
      setProgress(0);
      setCurrentStep(0);
      console.log('PDF file selected:', file.name, 'Size:', file.size);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF file containing financial statements.",
        variant: "destructive"
      });
    }
  };

  const simulateProcessing = async () => {
    setIsProcessing(true);
    let generatedData: FinancialData | null = null;
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'processing' } : step
      ));
      
      const delays = [800, 1200, 600, 400];
      await new Promise(resolve => setTimeout(resolve, delays[i] || 1000));
      
      if (i === steps.length - 1) {
        generatedData = parseFinancialData(uploadedFile?.name || 'Financial Report');
        setFinancialData(generatedData);
        setIsProcessedData(true);
        
        // Track unmapped entries
        const unmapped = generatedData.entries
          .filter(entry => entry.ifrsCategory === 'Uncategorized')
          .map(entry => entry.description);
        setUnmappedEntries(unmapped);
        
        if (unmapped.length > 0) {
          console.log('Unmapped entries found:', unmapped);
        }
        
        console.log('Generated financial data with IFRS mapping:', generatedData);
      }
      
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'completed' } : step
      ));
      
      setProgress(((i + 1) / steps.length) * 100);
    }
    
    setIsProcessing(false);
    if (generatedData) {
      setMappedData(generatedData);
      setShowMappingEngine(true);
      console.log('Processing complete, showing mapping engine');
    }
    
    toast({
      title: "Processing Complete",
      description: `Successfully extracted ${generatedData?.entries.length || 0} financial line items and mapped to IFRS categories.`
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    console.log('Drag started:', event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !mappedData) {
      console.log('Drag ended without valid drop target');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('Drag ended:', { activeId, overId });

    const draggedEntry = mappedData.entries.find(entry => entry.id === activeId);
    if (!draggedEntry) {
      console.log('Could not find dragged entry');
      return;
    }

    const [targetHighLevel, targetGrouping, targetCategory] = overId.split('::');

    if (!targetHighLevel || !targetGrouping || !targetCategory) {
      console.log('Invalid drop target format:', overId);
      return;
    }

    const updatedEntries = mappedData.entries.map(entry => 
      entry.id === activeId 
        ? { 
            ...entry, 
            highLevelCategory: targetHighLevel as any,
            mainGrouping: targetGrouping,
            ifrsCategory: targetCategory
          }
        : entry
    );

    const updatedData = { ...mappedData, entries: updatedEntries };
    setMappedData(updatedData);
    setFinancialData(updatedData);

    console.log('Updated entry mapping:', {
      entryId: activeId,
      description: draggedEntry.description,
      newCategory: targetCategory,
      newGrouping: targetGrouping,
      newHighLevel: targetHighLevel
    });

    toast({
      title: "Item Remapped",
      description: `"${draggedEntry.description}" moved to ${targetCategory}`,
    });
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(amount);

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const IFRSCategory = ({ 
    title, 
    entries, 
    dropId,
    description
  }: { 
    title: string; 
    entries: FinancialEntry[];
    dropId: string;
    description?: string;
  }) => {
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    
    return (
      <div 
        id={dropId}
        className="border-2 border-dashed border-gray-200 rounded-lg p-4 min-h-[140px] hover:border-blue-300 transition-colors bg-gray-50/30"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 text-sm mb-1">{title}</h4>
            {description && (
              <p className="text-xs text-gray-500 mb-2">{description}</p>
            )}
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs mb-1">
              {entries.length} items
            </Badge>
            <div className="text-xs font-semibold text-gray-700">
              {total !== 0 ? formatCurrency(Math.abs(total)) : '$0'}
            </div>
          </div>
        </div>
        
        {entries.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            <GripVertical className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p>Drop financial items here</p>
          </div>
        ) : (
          <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {entries.map((entry) => (
                <SortableItem
                  key={entry.id}
                  id={entry.id}
                  entry={entry}
                  onRemove={() => {}}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    );
  };

  const MappingEngine = () => {
    if (!mappedData) return null;

    const nonCurrentAssets = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Assets' && e.mainGrouping === 'Non-current Assets'
    );
    const currentAssets = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Assets' && e.mainGrouping === 'Current Assets'
    );
    const equity = mappedData.entries.filter(e => e.highLevelCategory === 'Equity');
    const nonCurrentLiabilities = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Non-current Liabilities'
    );
    const currentLiabilities = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Current Liabilities'
    );
    const revenue = mappedData.entries.filter(e => e.highLevelCategory === 'Revenue');
    const expenses = mappedData.entries.filter(e => e.highLevelCategory === 'Expenses');

    const totalAssets = [...nonCurrentAssets, ...currentAssets].reduce((sum, e) => sum + e.amount, 0);
    const totalLiabilitiesEquity = [...nonCurrentLiabilities, ...currentLiabilities, ...equity].reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = revenue.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">IFRS Mapping Engine</h2>
              <p className="text-gray-600">Drag and drop financial line items to reassign IFRS categories</p>
              {unmappedEntries.length > 0 && (
                <p className="text-orange-600 text-sm mt-1">
                  ⚠️ {unmappedEntries.length} items need manual classification
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {mappedData.entries.length} line items
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                Balance: {formatCurrency(totalAssets - totalLiabilitiesEquity)}
              </Badge>
            </div>
          </div>

          {unmappedEntries.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">Unmapped Entries Detected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 mb-2">
                  The following {unmappedEntries.length} entries could not be automatically mapped and need manual classification:
                </p>
                <div className="text-xs text-orange-600 space-y-1">
                  {unmappedEntries.map((desc, idx) => (
                    <div key={idx}>• {desc}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="balance-sheet" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="balance-sheet" className="text-blue-600">
                📘 Balance Sheet
              </TabsTrigger>
              <TabsTrigger value="income-statement" className="text-red-600">
                📕 Income Statement
              </TabsTrigger>
            </TabsList>

            <TabsContent value="balance-sheet" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <h3 className="text-xl font-bold text-blue-900">Assets</h3>
                    <p className="text-sm text-blue-700 mt-1">Total: {formatCurrency(totalAssets)}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Non-current Assets</h4>
                    <div className="space-y-3">
                      <IFRSCategory 
                        title="Property, Plant and Equipment" 
                        entries={nonCurrentAssets.filter(e => e.ifrsCategory === 'Property, Plant and Equipment')}
                        dropId="Assets::Non-current Assets::Property, Plant and Equipment"
                        description="Tangible assets with useful life > 1 year"
                      />
                      <IFRSCategory 
                        title="Right-of-Use Assets" 
                        entries={nonCurrentAssets.filter(e => e.ifrsCategory === 'Right-of-Use Assets')}
                        dropId="Assets::Non-current Assets::Right-of-Use Assets"
                        description="Assets under lease arrangements (IFRS 16)"
                      />
                      <IFRSCategory 
                        title="Intangible Assets" 
                        entries={nonCurrentAssets.filter(e => e.ifrsCategory === 'Intangible Assets')}
                        dropId="Assets::Non-current Assets::Intangible Assets"
                        description="Non-physical assets (software, patents, etc.)"
                      />
                      <IFRSCategory 
                        title="Goodwill" 
                        entries={nonCurrentAssets.filter(e => e.ifrsCategory === 'Goodwill')}
                        dropId="Assets::Non-current Assets::Goodwill"
                        description="Excess of acquisition cost over fair value"
                      />
                      <IFRSCategory 
                        title="Deferred Tax Assets" 
                        entries={nonCurrentAssets.filter(e => e.ifrsCategory === 'Deferred Tax Assets')}
                        dropId="Assets::Non-current Assets::Deferred Tax Assets"
                        description="Future tax benefits"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Current Assets</h4>
                    <div className="space-y-3">
                      <IFRSCategory 
                        title="Cash and Cash Equivalents" 
                        entries={currentAssets.filter(e => e.ifrsCategory === 'Cash and Cash Equivalents')}
                        dropId="Assets::Current Assets::Cash and Cash Equivalents"
                        description="Cash, bank deposits, short-term investments"
                      />
                      <IFRSCategory 
                        title="Trade and Other Receivables" 
                        entries={currentAssets.filter(e => e.ifrsCategory === 'Trade and Other Receivables')}
                        dropId="Assets::Current Assets::Trade and Other Receivables"
                        description="Amounts owed by customers and others"
                      />
                      <IFRSCategory 
                        title="Inventories" 
                        entries={currentAssets.filter(e => e.ifrsCategory === 'Inventories')}
                        dropId="Assets::Current Assets::Inventories"
                        description="Raw materials, WIP, finished goods"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                    <h3 className="text-xl font-bold text-red-900">Liabilities & Equity</h3>
                    <p className="text-sm text-red-700 mt-1">Total: {formatCurrency(totalLiabilitiesEquity)}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Equity</h4>
                    <div className="space-y-3">
                      <IFRSCategory 
                        title="Share Capital" 
                        entries={equity.filter(e => e.ifrsCategory === 'Share Capital')}
                        dropId="Equity::Equity::Share Capital"
                        description="Nominal value of issued shares"
                      />
                      <IFRSCategory 
                        title="Share Premium" 
                        entries={equity.filter(e => e.ifrsCategory === 'Share Premium')}
                        dropId="Equity::Equity::Share Premium"
                        description="Excess over nominal value on share issue"
                      />
                      <IFRSCategory 
                        title="Retained Earnings" 
                        entries={equity.filter(e => e.ifrsCategory === 'Retained Earnings')}
                        dropId="Equity::Equity::Retained Earnings"
                        description="Accumulated profits less dividends"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Non-current Liabilities</h4>
                    <div className="space-y-3">
                      <IFRSCategory 
                        title="Borrowings" 
                        entries={nonCurrentLiabilities.filter(e => e.ifrsCategory === 'Borrowings')}
                        dropId="Liabilities::Non-current Liabilities::Borrowings"
                        description="Long-term loans and finance arrangements"
                      />
                      <IFRSCategory 
                        title="Lease Liabilities" 
                        entries={nonCurrentLiabilities.filter(e => e.ifrsCategory === 'Lease Liabilities')}
                        dropId="Liabilities::Non-current Liabilities::Lease Liabilities"
                        description="Long-term lease payment obligations"
                      />
                      <IFRSCategory 
                        title="Provisions" 
                        entries={nonCurrentLiabilities.filter(e => e.ifrsCategory === 'Provisions')}
                        dropId="Liabilities::Non-current Liabilities::Provisions"
                        description="Long-term provisions and contingencies"
                      />
                      <IFRSCategory 
                        title="Deferred Tax Liabilities" 
                        entries={nonCurrentLiabilities.filter(e => e.ifrsCategory === 'Deferred Tax Liabilities')}
                        dropId="Liabilities::Non-current Liabilities::Deferred Tax Liabilities"
                        description="Future tax obligations"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Current Liabilities</h4>
                    <div className="space-y-3">
                      <IFRSCategory 
                        title="Trade and Other Payables" 
                        entries={currentLiabilities.filter(e => e.ifrsCategory === 'Trade and Other Payables')}
                        dropId="Liabilities::Current Liabilities::Trade and Other Payables"
                        description="Amounts owed to suppliers and others"
                      />
                      <IFRSCategory 
                        title="Borrowings" 
                        entries={currentLiabilities.filter(e => e.ifrsCategory === 'Borrowings')}
                        dropId="Liabilities::Current Liabilities::Borrowings"
                        description="Short-term loans and overdrafts"
                      />
                      <IFRSCategory 
                        title="Tax Liabilities" 
                        entries={currentLiabilities.filter(e => e.ifrsCategory === 'Tax Liabilities')}
                        dropId="Liabilities::Current Liabilities::Tax Liabilities"
                        description="Current tax payable"
                      />
                      <IFRSCategory 
                        title="Lease Liabilities" 
                        entries={currentLiabilities.filter(e => e.ifrsCategory === 'Lease Liabilities')}
                        dropId="Liabilities::Current Liabilities::Lease Liabilities"
                        description="Current portion of lease obligations"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="income-statement" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <h3 className="text-xl font-bold text-green-900">Revenue & Income</h3>
                    <p className="text-sm text-green-700 mt-1">Total: {formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Revenue" 
                      entries={revenue.filter(e => e.ifrsCategory === 'Revenue')}
                      dropId="Revenue::Revenue::Revenue"
                      description="Revenue from contracts with customers"
                    />
                    <IFRSCategory 
                      title="Other Operating Income" 
                      entries={revenue.filter(e => e.ifrsCategory === 'Other Operating Income')}
                      dropId="Revenue::Revenue::Other Operating Income"
                      description="Other income from operations"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <h3 className="text-xl font-bold text-orange-900">Expenses</h3>
                    <p className="text-sm text-orange-700 mt-1">Total: {formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Cost of Sales" 
                      entries={expenses.filter(e => e.ifrsCategory === 'Cost of Sales')}
                      dropId="Expenses::Cost of Sales::Cost of Sales"
                      description="Direct costs of producing goods/services"
                    />
                    <IFRSCategory 
                      title="Employee Benefits" 
                      entries={expenses.filter(e => e.ifrsCategory === 'Employee Benefits')}
                      dropId="Expenses::Operating Expenses::Employee Benefits"
                      description="Salaries, wages, and staff costs"
                    />
                    <IFRSCategory 
                      title="General and Administrative Expenses" 
                      entries={expenses.filter(e => e.ifrsCategory === 'General and Administrative Expenses')}
                      dropId="Expenses::Operating Expenses::General and Administrative Expenses"
                      description="Administrative and overhead expenses"
                    />
                    <IFRSCategory 
                      title="Selling Expenses" 
                      entries={expenses.filter(e => e.ifrsCategory === 'Selling Expenses')}
                      dropId="Expenses::Operating Expenses::Selling Expenses"
                      description="Sales and marketing related expenses"
                    />
                    <IFRSCategory 
                      title="Depreciation and Amortisation" 
                      entries={expenses.filter(e => e.ifrsCategory === 'Depreciation and Amortisation')}
                      dropId="Expenses::Operating Expenses::Depreciation and Amortisation"
                      description="Depreciation of assets and amortisation"
                    />
                    <IFRSCategory 
                      title="Finance Costs" 
                      entries={expenses.filter(e => e.ifrsCategory === 'Finance Costs')}
                      dropId="Expenses::Financial Costs::Finance Costs"
                      description="Interest and other finance charges"
                    />
                    <IFRSCategory 
                      title="Income Tax Expense" 
                      entries={expenses.filter(e => e.ifrsCategory === 'Income Tax Expense')}
                      dropId="Expenses::Tax::Income Tax Expense"
                      description="Current and deferred tax expense"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center pt-6 border-t">
            <Button 
              onClick={() => window.location.href = '/mapping'}
              size="lg"
              className="gap-2"
            >
              Continue to Full Mapping Interface
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white border rounded-lg p-3 shadow-lg border-l-4 border-l-blue-500 opacity-80">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {mappedData.entries.find(e => e.id === activeId)?.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(mappedData.entries.find(e => e.id === activeId)?.amount || 0)}
                  </span>
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload PDF Report</h1>
        <p className="text-muted-foreground">Upload financial statements in PDF format for automated extraction and analysis</p>
      </div>

      {/* Show Mapping Engine after processing completes */}
      {showMappingEngine && <MappingEngine />}

      {/* Original upload interface - hide when mapping engine is shown */}
      {!showMappingEngine && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  {uploadedFile ? 'File Selected' : 'Click to upload PDF'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload Annual Reports, Financial Statements, or audit reports (PDF only)
                </p>
                {uploadedFile && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{uploadedFile.name}</span>
                    <span className="text-muted-foreground">
                      ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {uploadedFile && !isProcessing && progress === 0 && (
                <Button onClick={simulateProcessing} className="w-full" size="lg">
                  Start Processing
                </Button>
              )}

              {isProcessing && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </div>
              )}

              {progress === 100 && !isProcessing && !showMappingEngine && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Processing Complete</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      step.status === 'processing' ? 'bg-blue-50' : 
                      step.status === 'completed' ? 'bg-green-50' :
                      'bg-gray-50'
                    }`}
                  >
                    {getStepIcon(step.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{step.label}</p>
                        <Badge 
                          variant={
                            step.status === 'completed' ? 'default' :
                            step.status === 'processing' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
