
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
              #{entry.id}
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

  const generateEnhancedRealisticData = (fileName: string): FinancialData => {
    const companyName = fileName.replace('.pdf', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Corporation';
    
    const entries: FinancialEntry[] = [
      // Non-Current Assets - More realistic entries
      { id: '1001', date: '2023-12-31', description: 'Land and Buildings', amount: 580000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Property, Plant and Equipment', originalLine: 'Land & buildings at cost less depreciation' },
      { id: '1002', date: '2023-12-31', description: 'Plant and Machinery', amount: 420000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Property, Plant and Equipment', originalLine: 'Plant & machinery - net book value' },
      { id: '1003', date: '2023-12-31', description: 'Motor Vehicles', amount: 85000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Property, Plant and Equipment', originalLine: 'Motor vehicles at NBV' },
      { id: '1004', date: '2023-12-31', description: 'Office Equipment', amount: 45000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Property, Plant and Equipment', originalLine: 'Office equipment and fixtures' },
      { id: '1005', date: '2023-12-31', description: 'Lease Assets - Buildings', amount: 125000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Right-of-Use Assets', originalLine: 'Right-of-use assets - property leases' },
      { id: '1006', date: '2023-12-31', description: 'Software Licenses', amount: 78000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Intangible Assets', originalLine: 'Computer software and licenses' },
      { id: '1007', date: '2023-12-31', description: 'Patents and Trademarks', amount: 125000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Intangible Assets', originalLine: 'Intellectual property rights' },
      { id: '1008', date: '2023-12-31', description: 'Goodwill on Acquisition', amount: 95000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Goodwill', originalLine: 'Goodwill arising on business combinations' },
      { id: '1009', date: '2023-12-31', description: 'Deferred Tax Assets', amount: 32000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Deferred Tax Assets', originalLine: 'Deferred tax asset - timing differences' },
      
      // Current Assets - Enhanced entries
      { id: '2001', date: '2023-12-31', description: 'Cash at Bank', amount: 89000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Cash and Cash Equivalents', originalLine: 'Current account - Bank of Commerce' },
      { id: '2002', date: '2023-12-31', description: 'Short-term Deposits', amount: 65000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Cash and Cash Equivalents', originalLine: 'Term deposits - 90 days' },
      { id: '2003', date: '2023-12-31', description: 'Petty Cash', amount: 2500, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Cash and Cash Equivalents', originalLine: 'Cash on hand - petty cash fund' },
      { id: '2004', date: '2023-12-31', description: 'Trade Debtors', amount: 145000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Trade and Other Receivables', originalLine: 'Trade receivables - customers' },
      { id: '2005', date: '2023-12-31', description: 'Other Receivables', amount: 23000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Trade and Other Receivables', originalLine: 'Sundry debtors and prepayments' },
      { id: '2006', date: '2023-12-31', description: 'Raw Materials', amount: 78000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Inventories', originalLine: 'Raw materials and components' },
      { id: '2007', date: '2023-12-31', description: 'Work in Progress', amount: 45000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Inventories', originalLine: 'Work-in-progress at lower of cost/NRV' },
      { id: '2008', date: '2023-12-31', description: 'Finished Goods', amount: 67000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Inventories', originalLine: 'Finished goods inventory' },
      
      // Equity - Enhanced entries
      { id: '3001', date: '2023-12-31', description: 'Ordinary Share Capital', amount: 200000, highLevelCategory: 'Equity', mainGrouping: 'Equity', ifrsCategory: 'Share Capital', originalLine: '200,000 ordinary shares of $1 each' },
      { id: '3002', date: '2023-12-31', description: 'Share Premium Account', amount: 150000, highLevelCategory: 'Equity', mainGrouping: 'Equity', ifrsCategory: 'Share Premium', originalLine: 'Share premium on issue of shares' },
      { id: '3003', date: '2023-12-31', description: 'Retained Profits', amount: 285000, highLevelCategory: 'Equity', mainGrouping: 'Equity', ifrsCategory: 'Retained Earnings', originalLine: 'Accumulated profits brought forward' },
      { id: '3004', date: '2023-12-31', description: 'Current Year Earnings', amount: 145000, highLevelCategory: 'Equity', mainGrouping: 'Equity', ifrsCategory: 'Retained Earnings', originalLine: 'Profit for the current year' },
      
      // Non-Current Liabilities - Enhanced entries  
      { id: '4001', date: '2023-12-31', description: 'Bank Loan - Term', amount: 235000, highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities', ifrsCategory: 'Borrowings', originalLine: 'Term loan - secured on property' },
      { id: '4002', date: '2023-12-31', description: 'Lease Liability - Property', amount: 98000, highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities', ifrsCategory: 'Lease Liabilities', originalLine: 'Lease obligations - property leases' },
      { id: '4003', date: '2023-12-31', description: 'Deferred Tax Liability', amount: 28000, highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities', ifrsCategory: 'Deferred Tax Liabilities', originalLine: 'Deferred tax - accelerated depreciation' },
      { id: '4004', date: '2023-12-31', description: 'Long-term Provisions', amount: 35000, highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities', ifrsCategory: 'Provisions', originalLine: 'Provision for employee benefits' },
      
      // Current Liabilities - Enhanced entries
      { id: '5001', date: '2023-12-31', description: 'Trade Creditors', amount: 89000, highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities', ifrsCategory: 'Trade and Other Payables', originalLine: 'Trade payables - suppliers' },
      { id: '5002', date: '2023-12-31', description: 'Accrued Expenses', amount: 34000, highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities', ifrsCategory: 'Trade and Other Payables', originalLine: 'Accruals and other payables' },
      { id: '5003', date: '2023-12-31', description: 'Short-term Borrowings', amount: 45000, highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities', ifrsCategory: 'Borrowings', originalLine: 'Bank overdraft and short-term loans' },
      { id: '5004', date: '2023-12-31', description: 'Tax Payable', amount: 28000, highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities', ifrsCategory: 'Tax Liabilities', originalLine: 'Current tax liability' },
      { id: '5005', date: '2023-12-31', description: 'Lease Liability - Current', amount: 15000, highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities', ifrsCategory: 'Lease Liabilities', originalLine: 'Current portion of lease liabilities' },
      
      // Revenue - Enhanced entries
      { id: '6001', date: '2023-12-31', description: 'Sales Revenue - Domestic', amount: 980000, highLevelCategory: 'Revenue', mainGrouping: 'Revenue', ifrsCategory: 'Revenue', originalLine: 'Revenue from contracts with customers - domestic' },
      { id: '6002', date: '2023-12-31', description: 'Sales Revenue - Export', amount: 420000, highLevelCategory: 'Revenue', mainGrouping: 'Revenue', ifrsCategory: 'Revenue', originalLine: 'Revenue from contracts with customers - export' },
      { id: '6003', date: '2023-12-31', description: 'Other Operating Income', amount: 25000, highLevelCategory: 'Revenue', mainGrouping: 'Revenue', ifrsCategory: 'Other Operating Income', originalLine: 'Miscellaneous operating income' },
      
      // Expenses - Enhanced entries
      { id: '7001', date: '2023-12-31', description: 'Raw Materials Consumed', amount: 485000, highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales', ifrsCategory: 'Cost of Sales', originalLine: 'Cost of raw materials and components' },
      { id: '7002', date: '2023-12-31', description: 'Direct Labor', amount: 225000, highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales', ifrsCategory: 'Cost of Sales', originalLine: 'Direct labor costs' },
      { id: '7003', date: '2023-12-31', description: 'Manufacturing Overheads', amount: 145000, highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales', ifrsCategory: 'Cost of Sales', originalLine: 'Manufacturing overhead allocation' },
      { id: '7004', date: '2023-12-31', description: 'Executive Salaries', amount: 120000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'Employee Benefits', originalLine: 'Directors and senior management remuneration' },
      { id: '7005', date: '2023-12-31', description: 'Staff Wages', amount: 185000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'Employee Benefits', originalLine: 'Wages and salaries - operations' },
      { id: '7006', date: '2023-12-31', description: 'Office Rent', amount: 48000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'General and Administrative Expenses', originalLine: 'Rent and rates - office premises' },
      { id: '7007', date: '2023-12-31', description: 'Professional Fees', amount: 35000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'General and Administrative Expenses', originalLine: 'Legal and professional fees' },
      { id: '7008', date: '2023-12-31', description: 'Marketing Expenses', amount: 75000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'Selling Expenses', originalLine: 'Advertising and marketing costs' },
      { id: '7009', date: '2023-12-31', description: 'Sales Commission', amount: 42000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'Selling Expenses', originalLine: 'Sales commissions and incentives' },
      { id: '7010', date: '2023-12-31', description: 'Depreciation Expense', amount: 65000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'Depreciation and Amortisation', originalLine: 'Depreciation of property, plant & equipment' },
      { id: '7011', date: '2023-12-31', description: 'Interest on Borrowings', amount: 18000, highLevelCategory: 'Expenses', mainGrouping: 'Financial Costs', ifrsCategory: 'Finance Costs', originalLine: 'Interest expense on bank loans' },
      { id: '7012', date: '2023-12-31', description: 'Income Tax Expense', amount: 45000, highLevelCategory: 'Expenses', mainGrouping: 'Tax', ifrsCategory: 'Income Tax Expense', originalLine: 'Current and deferred tax expense' }
    ];

    return {
      companyName,
      reportPeriod: 'Year Ended 31 December 2023',
      entries,
      lastUpdated: new Date().toISOString()
    };
  };

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
      
      // Simulate processing time with different delays for each step
      const delays = [800, 1200, 600, 400];
      await new Promise(resolve => setTimeout(resolve, delays[i] || 1000));
      
      if (i === steps.length - 1) {
        generatedData = generateEnhancedRealisticData(uploadedFile?.name || 'Financial Report');
        setFinancialData(generatedData);
        setIsProcessedData(true);
        console.log('Generated enhanced financial data:', generatedData);
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

    // Find the entry being dragged
    const draggedEntry = mappedData.entries.find(entry => entry.id === activeId);
    if (!draggedEntry) {
      console.log('Could not find dragged entry');
      return;
    }

    // Parse the drop target to extract category information
    const [targetHighLevel, targetGrouping, targetCategory] = overId.split('::');

    if (!targetHighLevel || !targetGrouping || !targetCategory) {
      console.log('Invalid drop target format:', overId);
      return;
    }

    // Update the entry with new categorization
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

  // Enhanced IFRS Category Component with proper drop zones
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

  // Main Mapping Engine Component
  const MappingEngine = () => {
    if (!mappedData) return null;

    // Filter entries by categories with enhanced grouping
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

    // Calculate totals for balance sheet verification
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
                {/* Assets Panel */}
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

                {/* Liabilities & Equity Panel */}
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
                {/* Revenue Panel */}
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

                {/* Expenses Panel */}
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
