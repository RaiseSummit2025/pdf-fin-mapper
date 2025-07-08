import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowRight, GripVertical, Download, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { FinancialEntry, FinancialData } from '@/types/financial';
import { FileSelector } from '@/components/FileSelector';
import { SupabasePdfService, ProcessingStatus } from '@/services/supabasePdfService';
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
  DropAnimation,
  defaultDropAnimationSideEffects,
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

interface DraggableAmountProps {
  id: string;
  amount: number;
  description: string;
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
  'right-of-use': { ifrsCategory: 'Right-of-Use Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'lease asset': { ifrsCategory: 'Right-of-Use Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'software': { ifrsCategory: 'Intangible Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'patent': { ifrsCategory: 'Intangible Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'trademark': { ifrsCategory: 'Intangible Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'license': { ifrsCategory: 'Intangible Assets', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'goodwill': { ifrsCategory: 'Goodwill', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  'investment property': { ifrsCategory: 'Investment Property', highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets' },
  
  // Assets - Current
  'cash': { ifrsCategory: 'Cash and Cash Equivalents', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'bank': { ifrsCategory: 'Cash and Cash Equivalents', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'petty cash': { ifrsCategory: 'Cash and Cash Equivalents', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'accounts receivable': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'trade receivable': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'receivable': { ifrsCategory: 'Trade and Other Receivables', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'inventory': { ifrsCategory: 'Inventories', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  'stock': { ifrsCategory: 'Inventories', highLevelCategory: 'Assets', mainGrouping: 'Current Assets' },
  
  // Equity
  'share capital': { ifrsCategory: 'Share Capital', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'capital': { ifrsCategory: 'Share Capital', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'share premium': { ifrsCategory: 'Share Premium', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'retained earnings': { ifrsCategory: 'Retained Earnings', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'retained profit': { ifrsCategory: 'Retained Earnings', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'other reserves': { ifrsCategory: 'Other Reserves', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  'non-controlling': { ifrsCategory: 'Non-controlling Interests', highLevelCategory: 'Equity', mainGrouping: 'Equity' },
  
  // Liabilities - Non-current
  'long term loan': { ifrsCategory: 'Borrowings', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  'term loan': { ifrsCategory: 'Borrowings', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  'lease liability': { ifrsCategory: 'Lease Liabilities', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  'provision': { ifrsCategory: 'Provisions', highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities' },
  
  // Liabilities - Current
  'accounts payable': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'trade payable': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'payable': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'accrual': { ifrsCategory: 'Trade and Other Payables', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'short term loan': { ifrsCategory: 'Borrowings', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  'tax payable': { ifrsCategory: 'Tax Liabilities', highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities' },
  
  // Revenue
  'revenue': { ifrsCategory: 'Revenue', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  'sales': { ifrsCategory: 'Revenue', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  'income': { ifrsCategory: 'Revenue', highLevelCategory: 'Revenue', mainGrouping: 'Revenue' },
  
  // Expenses
  'cost of sales': { ifrsCategory: 'Cost of Sales', highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales' },
  'salary': { ifrsCategory: 'Employee Benefits', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'wage': { ifrsCategory: 'Employee Benefits', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'rent': { ifrsCategory: 'General and Administrative Expenses', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'depreciation': { ifrsCategory: 'Depreciation and Amortisation', highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses' },
  'interest expense': { ifrsCategory: 'Finance Costs', highLevelCategory: 'Expenses', mainGrouping: 'Financial Costs' },
};

// Parse a single line of text into a description and numeric amount
// Supports values like "1,234.00", "$1,234.00" and "(1,234.00)"
const parseLine = (line: string): { description: string; amount: number } | null => {
  const match = line.match(/^(.+?)\s+[\($]?\$?(-?[\d,]+(?:\.\d+)?)\)?$/);
  if (!match) return null;
  const [, desc, amountStr] = match;
  const numeric = amountStr.replace(/[\$,()]/g, '');
  const amount = parseFloat(numeric) * (amountStr.includes('(') ? -1 : 1);
  if (isNaN(amount)) return null;
  return { description: desc.trim(), amount };
};

// Enhanced PDF parsing with proper data structure
const parseActualPDFData = async (file: File): Promise<FinancialData | null> => {
  console.log('Attempting to parse PDF:', file.name);

  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
    const worker = await import('pdfjs-dist/build/pdf.worker?worker');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it: any) => it.str).join(' ') + '\n';
    }

    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const entries: FinancialEntry[] = [];

    lines.forEach((line, index) => {
      const parsed = parseLine(line);
      if (!parsed) return;
      const mapping = mapDescriptionToIFRS(parsed.description);
      entries.push({
        id: String(index + 1),
        date: new Date().toISOString().split('T')[0],
        description: parsed.description,
        amount: parsed.amount,
        highLevelCategory: mapping.highLevelCategory,
        mainGrouping: mapping.mainGrouping,
        ifrsCategory: mapping.ifrsCategory,
        originalLine: line,
      });
    });

    if (!entries.length) return null;

    return {
      companyName: file.name.replace(/\.pdf$/i, ''),
      reportPeriod: '',
      lastUpdated: new Date().toISOString(),
      entries,
    };
  } catch (err) {
    console.error('PDF parsing failed', err);
    return null;
  }
};

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

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

const DraggableAmount = ({ id, amount, description }: DraggableAmountProps) => {
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-1 cursor-grab active:cursor-grabbing hover:bg-blue-100 transition-colors"
      title={description}
    >
      <span className="text-sm font-semibold text-blue-900">{formatCurrency(amount)}</span>
      <GripVertical className="h-3 w-3 text-blue-600" />
    </div>
  );
};

export function PdfUpload() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMappingEngine, setShowMappingEngine] = useState(false);
  const [mappedData, setMappedData] = useState<FinancialData | null>(null);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();
  const { addFile, currentFinancialData, updateFileData, selectedFileId } = useFinancialData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfService = new SupabasePdfService();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const processingSteps: ProcessingStep[] = [
    {
      id: 'upload',
      label: 'File Upload',
      status: 'pending',
      description: 'Uploading PDF file'
    },
    {
      id: 'mapping',
      label: 'IFRS Mapping',
      status: 'pending',
      description: 'Mapping to IFRS categories'
    },
    {
      id: 'validation',
      label: 'Data Validation',
      status: 'pending',
      description: 'Validating extracted data'
    },
    {
      id: 'completion',
      label: 'Processing Complete',
      status: 'pending',
      description: 'Ready for analysis'
    }
  ];

  const [steps, setSteps] = useState<ProcessingStep[]>(processingSteps);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setShowMappingEngine(false);
      setMappedData(null);
      setExtractionResult(null);
      setSteps(processingSteps.map(step => ({ ...step, status: 'pending' })));
      setProgress(0);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF file.",
        variant: "destructive"
      });
    }
  };

  // Status polling effect
  useEffect(() => {
    if (!currentUploadId || !isProcessing) return;

    const pollStatus = async () => {
      const status = await pdfService.getProcessingStatus(currentUploadId);
      setProcessingStatus(status);

      if (status.status === 'completed') {
        const extractedData = await pdfService.getExtractedData(currentUploadId);
        if (extractedData) {
          setMappedData(extractedData);
          const newFileData = {
            id: currentUploadId,
            filename: uploadedFile?.name || 'Unknown',
            uploadDate: new Date().toISOString(),
            data: extractedData
          };
          addFile(newFileData);
          setShowMappingEngine(true);
          setProgress(100);
          setSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
          
          toast({
            title: "Processing Complete",
            description: `Extracted ${status.extractedCount} financial entries`,
          });
        }
        setIsProcessing(false);
        setCurrentUploadId(null);
      } else if (status.status === 'failed') {
        setSteps(prev => prev.map(step => ({ ...step, status: 'error' })));
        setIsProcessing(false);
        setCurrentUploadId(null);
        
        toast({
          title: "Processing Failed",
          description: status.error || 'Unknown error occurred',
          variant: "destructive"
        });
      } else if (status.status === 'processing') {
        setProgress(50); // Show progress during processing
        setSteps(prev => prev.map((step, index) => 
          index <= 1 ? { ...step, status: 'completed' } : 
          index === 2 ? { ...step, status: 'processing' } : step
        ));
      }
    };

    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [currentUploadId, isProcessing, uploadedFile?.name, pdfService, addFile, toast]);

  const processStructuredPDF = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Step 1: File Upload
      setSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'processing' } : step
      ));
      
      const uploadResult = await pdfService.uploadPdf(uploadedFile);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      setCurrentUploadId(uploadResult.uploadId!);
      setProgress(25);
      setSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'completed' } :
        index === 1 ? { ...step, status: 'processing' } : step
      ));
      
      toast({
        title: "Upload Successful",
        description: "PDF uploaded and processing started",
      });
      
    } catch (error) {
      console.error('Processing failed:', error);
      setSteps(prev => prev.map(step => 
        step.status === 'processing' ? { ...step, status: 'error' } : step
      ));
      setIsProcessing(false);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  };

  const downloadRawData = () => {
    if (!extractionResult || !extractionResult.entries) return;
    
    const jsonData = JSON.stringify(extractionResult.entries, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parsed_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !mappedData) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('Drag end:', { activeId, overId });

    // Find the dragged entry
    const draggedEntry = mappedData.entries.find(entry => entry.id === activeId);
    if (!draggedEntry) return;

    // Handle drops on category containers (identified by '::' in the id)
    if (overId.includes('::')) {
      const [targetHighLevel, targetGrouping, targetCategory] = overId.split('::');

      const updatedEntries = mappedData.entries.map(entry => 
        entry.id === activeId 
          ? { 
              ...entry, 
              highLevelCategory: targetHighLevel as FinancialEntry['highLevelCategory'],
              mainGrouping: targetGrouping,
              ifrsCategory: targetCategory
            }
          : entry
      );

      const updatedData = { ...mappedData, entries: updatedEntries };
      setMappedData(updatedData);
      updateFileData(selectedFileId, updatedData);

      toast({
        title: "Item Remapped",
        description: `${draggedEntry.description} moved to ${targetCategory}`,
      });
    }
    // Handle swapping between entries
    else {
      const targetEntry = mappedData.entries.find(entry => entry.id === overId);
      if (!targetEntry || activeId === overId) return;

      const updatedEntries = mappedData.entries.map(entry => {
        if (entry.id === activeId) {
          return {
            ...entry,
            highLevelCategory: targetEntry.highLevelCategory,
            mainGrouping: targetEntry.mainGrouping,
            ifrsCategory: targetEntry.ifrsCategory
          };
        }
        if (entry.id === overId) {
          return {
            ...entry,
            highLevelCategory: draggedEntry.highLevelCategory,
            mainGrouping: draggedEntry.mainGrouping,
            ifrsCategory: draggedEntry.ifrsCategory
          };
        }
        return entry;
      });

      const updatedData = { ...mappedData, entries: updatedEntries };
      setMappedData(updatedData);
      updateFileData(selectedFileId, updatedData);

      toast({
        title: "Items Swapped",
        description: `Swapped categories between ${draggedEntry.description} and ${targetEntry.description}`,
      });
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));

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
    dropId 
  }: { 
    title: string; 
    entries: FinancialEntry[];
    dropId: string;
  }) => (
    <div 
      id={dropId}
      className="border border-gray-200 rounded-lg p-4 min-h-[120px] bg-white hover:border-blue-300 transition-colors"
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
        <Badge variant="outline" className="text-xs">
          {entries.length}
        </Badge>
      </div>
      
      {entries.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-200 rounded">
          <div className="text-xs opacity-60">Drop amounts here</div>
        </div>
      ) : (
        <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                <span className="text-gray-700 truncate flex-1 mr-2 text-xs">{entry.description}</span>
                <DraggableAmount 
                  id={entry.id}
                  amount={entry.amount}
                  description={entry.description}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );

  const MappingEngine = () => {
    const dataToUse = mappedData;
    
    if (!dataToUse || !dataToUse.entries.length) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">IFRS Mapping Engine</h2>
              <p className="text-gray-600">No structured data found in the uploaded PDF</p>
            </div>
            {extractionResult && extractionResult.entries && (
              <Button variant="outline" onClick={downloadRawData} className="gap-2">
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
            )}
          </div>
          
          
          <div className="text-center text-gray-500 py-12 border border-gray-200 rounded-lg">
            <p className="text-lg mb-2">No Financial Data Available</p>
            <p className="text-sm">The uploaded PDF does not contain recognizable financial data structure.</p>
            <p className="text-sm mt-2">Please upload a PDF with structured financial statements or trial balance.</p>
          </div>
          
          <div className="flex justify-center pt-6 border-t">
            <Button 
              onClick={() => {
                setShowMappingEngine(false);
                setUploadedFile(null);
                setProgress(0);
                setSteps(processingSteps.map(step => ({ ...step, status: 'pending' })));
              }}
              variant="outline"
            >
              Upload Another File
            </Button>
          </div>
        </div>
      );
    }

    const nonCurrentAssets = dataToUse.entries.filter(e => 
      e.highLevelCategory === 'Assets' && e.mainGrouping === 'Non-current Assets'
    );
    const currentAssets = dataToUse.entries.filter(e => 
      e.highLevelCategory === 'Assets' && e.mainGrouping === 'Current Assets'
    );
    const equity = dataToUse.entries.filter(e => e.highLevelCategory === 'Equity');
    const nonCurrentLiabilities = dataToUse.entries.filter(e => 
      e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Non-current Liabilities'
    );
    const currentLiabilities = dataToUse.entries.filter(e => 
      e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Current Liabilities'
    );

    // Group entries by IFRS category
    const groupedAssets = {
      ppe: nonCurrentAssets.filter(e => e.ifrsCategory === 'Property, Plant and Equipment'),
      rou: nonCurrentAssets.filter(e => e.ifrsCategory === 'Right-of-Use Assets'),
      intangible: nonCurrentAssets.filter(e => e.ifrsCategory === 'Intangible Assets'),
      goodwill: nonCurrentAssets.filter(e => e.ifrsCategory === 'Goodwill'),
      investment: nonCurrentAssets.filter(e => e.ifrsCategory === 'Investment Property'),
      cash: currentAssets.filter(e => e.ifrsCategory === 'Cash and Cash Equivalents'),
      receivables: currentAssets.filter(e => e.ifrsCategory === 'Trade and Other Receivables'),
      inventory: currentAssets.filter(e => e.ifrsCategory === 'Inventories'),
    };

    const groupedEquityLiabilities = {
      shareCapital: equity.filter(e => e.ifrsCategory === 'Share Capital'),
      sharePremium: equity.filter(e => e.ifrsCategory === 'Share Premium'),
      otherReserves: equity.filter(e => e.ifrsCategory === 'Other Reserves'),
      retainedEarnings: equity.filter(e => e.ifrsCategory === 'Retained Earnings'),
      nonControlling: equity.filter(e => e.ifrsCategory === 'Non-controlling Interests'),
      borrowings: [...nonCurrentLiabilities, ...currentLiabilities].filter(e => e.ifrsCategory === 'Borrowings'),
      leases: [...nonCurrentLiabilities, ...currentLiabilities].filter(e => e.ifrsCategory === 'Lease Liabilities'),
      payables: currentLiabilities.filter(e => e.ifrsCategory === 'Trade and Other Payables'),
      provisions: nonCurrentLiabilities.filter(e => e.ifrsCategory === 'Provisions'),
      tax: currentLiabilities.filter(e => e.ifrsCategory === 'Tax Liabilities'),
    };

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
              <p className="text-gray-600">Drag amounts to reassign IFRS categories</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-100 text-blue-800">
                {dataToUse.entries.length} items
              </Badge>
              {extractionResult && extractionResult.entries && (
                <Button variant="outline" onClick={downloadRawData} className="gap-2">
                  <Download className="h-4 w-4" />
                  Raw JSON
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="balance-sheet" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="balance-sheet" className="text-blue-600">
                Balance Sheet
              </TabsTrigger>
              <TabsTrigger value="income-statement" className="text-red-600">
                Income Statement
              </TabsTrigger>
            </TabsList>

            <TabsContent value="balance-sheet" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assets */}
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900">Assets</h3>
                    <p className="text-sm text-blue-700">Non-current Assets</p>
                  </div>
                  
                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Property, Plant and Equipment" 
                      entries={groupedAssets.ppe}
                      dropId="Assets::Non-current Assets::Property, Plant and Equipment"
                    />
                    <IFRSCategory 
                      title="Right-of-Use Assets" 
                      entries={groupedAssets.rou}
                      dropId="Assets::Non-current Assets::Right-of-Use Assets"
                    />
                    <IFRSCategory 
                      title="Investment Property" 
                      entries={groupedAssets.investment}
                      dropId="Assets::Non-current Assets::Investment Property"
                    />
                    <IFRSCategory 
                      title="Intangible Assets" 
                      entries={groupedAssets.intangible}
                      dropId="Assets::Non-current Assets::Intangible Assets"
                    />
                    <IFRSCategory 
                      title="Goodwill" 
                      entries={groupedAssets.goodwill}
                      dropId="Assets::Non-current Assets::Goodwill"
                    />
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
                    <p className="text-sm text-blue-700">Current Assets</p>
                  </div>

                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Cash and Cash Equivalents" 
                      entries={groupedAssets.cash}
                      dropId="Assets::Current Assets::Cash and Cash Equivalents"
                    />
                    <IFRSCategory 
                      title="Trade and Other Receivables" 
                      entries={groupedAssets.receivables}
                      dropId="Assets::Current Assets::Trade and Other Receivables"
                    />
                    <IFRSCategory 
                      title="Inventories" 
                      entries={groupedAssets.inventory}
                      dropId="Assets::Current Assets::Inventories"
                    />
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900">Liabilities & Equity</h3>
                    <p className="text-sm text-purple-700">Equity</p>
                  </div>
                  
                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Share Capital" 
                      entries={groupedEquityLiabilities.shareCapital}
                      dropId="Equity::Equity::Share Capital"
                    />
                    <IFRSCategory 
                      title="Share Premium" 
                      entries={groupedEquityLiabilities.sharePremium}
                      dropId="Equity::Equity::Share Premium"
                    />
                    <IFRSCategory 
                      title="Other Reserves" 
                      entries={groupedEquityLiabilities.otherReserves}
                      dropId="Equity::Equity::Other Reserves"
                    />
                    <IFRSCategory 
                      title="Retained Earnings" 
                      entries={groupedEquityLiabilities.retainedEarnings}
                      dropId="Equity::Equity::Retained Earnings"
                    />
                    <IFRSCategory 
                      title="Non-controlling Interests" 
                      entries={groupedEquityLiabilities.nonControlling}
                      dropId="Equity::Equity::Non-controlling Interests"
                    />
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 border border-red-200 mt-6">
                    <p className="text-sm text-red-700">Liabilities</p>
                  </div>

                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Borrowings" 
                      entries={groupedEquityLiabilities.borrowings}
                      dropId="Liabilities::Non-current Liabilities::Borrowings"
                    />
                    <IFRSCategory 
                      title="Lease Liabilities" 
                      entries={groupedEquityLiabilities.leases}
                      dropId="Liabilities::Non-current Liabilities::Lease Liabilities"
                    />
                    <IFRSCategory 
                      title="Trade and Other Payables" 
                      entries={groupedEquityLiabilities.payables}
                      dropId="Liabilities::Current Liabilities::Trade and Other Payables"
                    />
                    <IFRSCategory 
                      title="Tax Liabilities" 
                      entries={groupedEquityLiabilities.tax}
                      dropId="Liabilities::Current Liabilities::Tax Liabilities"
                    />
                    <IFRSCategory 
                      title="Provisions" 
                      entries={groupedEquityLiabilities.provisions}
                      dropId="Liabilities::Non-current Liabilities::Provisions"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="income-statement" className="space-y-6">
              <div className="text-center text-gray-500 py-12">
                <p>No income statement data available in uploaded file</p>
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

        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeId && dataToUse ? (
            <div className="bg-blue-50 border border-blue-200 rounded px-3 py-1 shadow-lg">
              <span className="text-sm font-semibold text-blue-900">
                {formatCurrency(dataToUse.entries.find(e => e.id === activeId)?.amount || 0)}
              </span>
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

      <FileSelector />

      {showMappingEngine && <MappingEngine />}

      {!showMappingEngine && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced PDF Upload</CardTitle>
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
                  Upload trial balance or financial statements (PDF only)
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Enhanced extraction supports structured table data with account numbers, debits, credits
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
                <Button onClick={processStructuredPDF} className="w-full" size="lg">
                  Process PDF with Backend Extraction
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      step.status === 'processing' ? 'bg-blue-50' : 
                      step.status === 'completed' ? 'bg-green-50' :
                      step.status === 'error' ? 'bg-red-50' :
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
                            step.status === 'error' ? 'destructive' :
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
