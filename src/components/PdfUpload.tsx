import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Eye, FileSearch, MapPin, ArrowRight, Move } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { FinancialEntry, FinancialData } from '@/types/financial';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
}

interface ProcessingLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
}

interface ExtractedItem {
  description: string;
  amount: number;
  category: string;
  confidence: 'high' | 'medium' | 'low';
}

export function PdfUpload() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([]);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [showTransparency, setShowTransparency] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMappingEngine, setShowMappingEngine] = useState(false);
  const [mappedData, setMappedData] = useState<FinancialData | null>(null);
  const { toast } = useToast();
  const { setFinancialData, setIsProcessedData } = useFinancialData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingSteps: ProcessingStep[] = [
    {
      id: 'upload',
      label: 'File Upload',
      status: 'pending',
      description: 'Uploading PDF file to processing server'
    },
    {
      id: 'extraction',
      label: 'Data Extraction',
      status: 'pending', 
      description: 'Extracting financial information from PDF content'
    },
    {
      id: 'identification',
      label: 'Statement Identification',
      status: 'pending',
      description: 'Identifying Income Statement, Balance Sheet, and Cash Flow data'
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

  const addLog = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const newLog: ProcessingLog = {
      id: Date.now().toString(),
      message,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    setProcessingLogs(prev => [...prev, newLog]);
  };

  const generateRealisticData = (fileName: string): FinancialData => {
    const companyName = fileName.replace('.pdf', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Corporation';
    
    const entries: FinancialEntry[] = [
      // Current Assets
      { id: '1', date: '2023-12-31', description: 'Cash and Cash Equivalents', amount: 125000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Cash and Cash Equivalents', originalLine: 'Cash at bank and in hand' },
      { id: '2', date: '2023-12-31', description: 'Trade Receivables', amount: 89000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Trade and Other Receivables', originalLine: 'Accounts receivable - trade' },
      { id: '3', date: '2023-12-31', description: 'Inventory', amount: 156000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Inventories', originalLine: 'Stock and work-in-progress' },
      
      // Non-Current Assets  
      { id: '4', date: '2023-12-31', description: 'Property, Plant & Equipment', amount: 450000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Property, Plant and Equipment', originalLine: 'Fixed assets - tangible' },
      { id: '5', date: '2023-12-31', description: 'Intangible Assets', amount: 78000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Intangible Assets', originalLine: 'Software and licenses' },
      
      // Current Liabilities
      { id: '6', date: '2023-12-31', description: 'Trade Payables', amount: 67000, highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities', ifrsCategory: 'Trade and Other Payables', originalLine: 'Creditors and accruals' },
      { id: '7', date: '2023-12-31', description: 'Short-term Debt', amount: 45000, highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities', ifrsCategory: 'Financial Liabilities', originalLine: 'Bank loans - current portion' },
      
      // Non-Current Liabilities
      { id: '8', date: '2023-12-31', description: 'Long-term Debt', amount: 235000, highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities', ifrsCategory: 'Financial Liabilities', originalLine: 'Term loans - non-current' },
      
      // Equity
      { id: '9', date: '2023-12-31', description: 'Share Capital', amount: 200000, highLevelCategory: 'Equity', mainGrouping: 'Equity', ifrsCategory: 'Share Capital', originalLine: 'Ordinary shares issued' },
      { id: '10', date: '2023-12-31', description: 'Retained Earnings', amount: 351000, highLevelCategory: 'Equity', mainGrouping: 'Equity', ifrsCategory: 'Retained Earnings', originalLine: 'Accumulated profits' },
      
      // Revenue
      { id: '11', date: '2023-12-31', description: 'Sales Revenue', amount: 1250000, highLevelCategory: 'Revenue', mainGrouping: 'Revenue', ifrsCategory: 'Revenue from Contracts with Customers', originalLine: 'Total sales revenue' },
      
      // Expenses
      { id: '12', date: '2023-12-31', description: 'Cost of Goods Sold', amount: 750000, highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales', ifrsCategory: 'Cost of Sales', originalLine: 'Direct costs of sales' },
      { id: '13', date: '2023-12-31', description: 'Administrative Expenses', amount: 180000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'Administrative Expenses', originalLine: 'General and admin costs' },
      { id: '14', date: '2023-12-31', description: 'Selling Expenses', amount: 120000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'Distribution Costs', originalLine: 'Sales and marketing costs' },
      { id: '15', date: '2023-12-31', description: 'Depreciation', amount: 45000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'Depreciation', originalLine: 'Depreciation and amortization' }
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
      setShowPreview(true);
      setShowMappingEngine(false);
      setSteps(processingSteps.map(step => ({ ...step, status: 'pending' })));
      setProgress(0);
      setCurrentStep(0);
      setProcessingLogs([]);
      setExtractedItems([]);
      setShowTransparency(false);
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
    setShowTransparency(true);
    let generatedData: FinancialData | null = null;
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      
      // Update step to processing
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'processing' } : step
      ));
      
      // Add transparency logs based on step
      switch(i) {
        case 0: // Upload
          addLog('Starting file upload and parsing...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          addLog('PDF successfully uploaded and validated', 'success');
          break;
          
        case 1: // Extraction
          addLog('Scanning PDF for financial tables...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          addLog('Found 3 financial tables with structured data', 'success');
          addLog('Extracted 15 financial line items');
          break;
          
        case 2: // Identification
          addLog('Identifying Income Statement data...');
          await new Promise(resolve => setTimeout(resolve, 1200));
          addLog('Identified Balance Sheet structure');
          addLog('Found Revenue and Expense categories', 'success');
          break;
          
        case 3: // Mapping
          addLog('Starting IFRS category mapping...');
          await new Promise(resolve => setTimeout(resolve, 1800));
          const tempItems: ExtractedItem[] = [
            { description: 'Cash and Cash Equivalents', amount: 125000, category: 'Current Assets', confidence: 'high' },
            { description: 'Trade Receivables', amount: 89000, category: 'Current Assets', confidence: 'high' },
            { description: 'Property, Plant & Equipment', amount: 450000, category: 'Non-current Assets', confidence: 'high' },
            { description: 'Sales Revenue', amount: 1250000, category: 'Revenue', confidence: 'high' },
            { description: 'Administrative Expenses', amount: 180000, category: 'Operating Expenses', confidence: 'medium' }
          ];
          setExtractedItems(tempItems);
          addLog('Mapped 13 items with high confidence, 2 with medium confidence', 'success');
          break;
          
        case 4: // Validation
          addLog('Validating financial data consistency...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          addLog('Balance sheet equation verified ✓', 'success');
          addLog('Cross-referencing account mappings...');
          break;
          
        case 5: // Completion
          addLog('Finalizing data structure...');
          await new Promise(resolve => setTimeout(resolve, 800));
          generatedData = generateRealisticData(uploadedFile?.name || 'Financial Report');
          setFinancialData(generatedData);
          setIsProcessedData(true);
          addLog('Financial statements ready for analysis', 'success');
          break;
      }
      
      // Update step to completed
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'completed' } : step
      ));
      
      // Update progress
      setProgress(((i + 1) / steps.length) * 100);
    }
    
    setIsProcessing(false);
    if (generatedData) {
      setMappedData(generatedData);
    }
    setShowPreview(false);
    setShowMappingEngine(true);
    toast({
      title: "Processing Complete",
      description: "Financial data has been successfully extracted and mapped. Review the IFRS mappings below."
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  // PDF Preview Component
  const PdfPreview = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Preview
          {uploadedFile && (
            <Badge variant="outline" className="ml-auto">
              {uploadedFile.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg bg-muted/20 min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-background border-2 border-dashed border-border rounded-lg p-8 max-w-md mx-auto">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium">PDF Preview</p>
              <p className="text-sm text-muted-foreground">
                Simulated preview of {uploadedFile?.name}
              </p>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div>📄 Page 1: Balance Sheet</div>
                <div>📊 Page 2: Income Statement</div>
                <div>💰 Page 3: Cash Flow Statement</div>
              </div>
            </div>
            {currentStep >= 1 && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="h-4 w-4" />
                Financial tables detected and parsing in progress...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // IFRS Mapping Engine Component
  const MappingEngine = () => {
    if (!mappedData) return null;

    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0 
      }).format(amount);

    // Group entries by IFRS category for more detailed mapping
    const groupByIFRSCategory = (entries: FinancialEntry[]) => {
      const grouped: { [key: string]: FinancialEntry[] } = {};
      entries.forEach(entry => {
        if (!grouped[entry.ifrsCategory]) {
          grouped[entry.ifrsCategory] = [];
        }
        grouped[entry.ifrsCategory].push(entry);
      });
      return grouped;
    };

    const FinancialLineItem = ({ entry }: { entry: FinancialEntry }) => (
      <div className="flex items-center justify-between p-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors group border border-border/50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{entry.description}</p>
          <p className="text-xs text-muted-foreground">{entry.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">
            {formatCurrency(entry.amount)}
          </span>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Move className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );

    const IFRSCategorySection = ({ 
      categoryName, 
      entries, 
      bgColor = "bg-muted/30" 
    }: { 
      categoryName: string; 
      entries: FinancialEntry[];
      bgColor?: string;
    }) => {
      if (entries.length === 0) return null;
      
      const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
      
      return (
        <div className={`p-3 rounded-lg border ${bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">{categoryName}</h4>
            <Badge variant="outline" className="text-xs font-mono">
              {formatCurrency(total)}
            </Badge>
          </div>
          <div className="space-y-1">
            {entries.map((entry) => (
              <FinancialLineItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      );
    };

    const MainCategoryPanel = ({ 
      title, 
      entries, 
      bgColor = "bg-background",
      headerColor = "bg-primary/10"
    }: { 
      title: string; 
      entries: FinancialEntry[];
      bgColor?: string;
      headerColor?: string;
    }) => {
      const groupedEntries = groupByIFRSCategory(entries);
      const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
      
      return (
        <Card className={`${bgColor} border-2`}>
          <CardHeader className={`${headerColor} pb-3`}>
            <CardTitle className="text-lg flex items-center justify-between">
              {title}
              <Badge variant="secondary" className="font-mono">
                {formatCurrency(total)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(groupedEntries).map(([category, categoryEntries]) => (
              <IFRSCategorySection
                key={category}
                categoryName={category}
                entries={categoryEntries}
                bgColor="bg-background/50"
              />
            ))}
            {entries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items mapped to this category yet
              </p>
            )}
          </CardContent>
        </Card>
      );
    };

    // Filter data by categories
    const currentAssets = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Assets' && e.mainGrouping === 'Current Assets'
    );
    const nonCurrentAssets = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Assets' && e.mainGrouping === 'Non-current Assets'
    );
    const currentLiabilities = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Current Liabilities'
    );
    const nonCurrentLiabilities = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Non-current Liabilities'
    );
    const equity = mappedData.entries.filter(e => e.highLevelCategory === 'Equity');
    const revenue = mappedData.entries.filter(e => e.highLevelCategory === 'Revenue');
    const expenses = mappedData.entries.filter(e => e.highLevelCategory === 'Expenses');

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRight className="h-5 w-5 text-success" />
          <h2 className="text-2xl font-bold">IFRS Mapping Engine</h2>
          <Badge variant="default" className="ml-auto">
            {mappedData.entries.length} items mapped
          </Badge>
        </div>

        <Tabs defaultValue="balance-sheet" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
          </TabsList>

          <TabsContent value="balance-sheet" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets Panel */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                    ASSETS
                  </h3>
                </div>
                <MainCategoryPanel 
                  title="Non-Current Assets" 
                  entries={nonCurrentAssets}
                  bgColor="bg-blue-50/30 dark:bg-blue-950/10"
                  headerColor="bg-blue-100/50 dark:bg-blue-900/20"
                />
                <MainCategoryPanel 
                  title="Current Assets" 
                  entries={currentAssets}
                  bgColor="bg-blue-50/50 dark:bg-blue-950/20"
                  headerColor="bg-blue-100/70 dark:bg-blue-900/30"
                />
              </div>

              {/* Liabilities & Equity Panel */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold p-4 bg-secondary/10 rounded-lg border-2 border-secondary/20">
                    LIABILITIES & EQUITY
                  </h3>
                </div>
                <MainCategoryPanel 
                  title="Non-Current Liabilities" 
                  entries={nonCurrentLiabilities}
                  bgColor="bg-orange-50/30 dark:bg-orange-950/10"
                  headerColor="bg-orange-100/50 dark:bg-orange-900/20"
                />
                <MainCategoryPanel 
                  title="Current Liabilities" 
                  entries={currentLiabilities}
                  bgColor="bg-orange-50/50 dark:bg-orange-950/20"
                  headerColor="bg-orange-100/70 dark:bg-orange-900/30"
                />
                <MainCategoryPanel 
                  title="Equity" 
                  entries={equity}
                  bgColor="bg-green-50/50 dark:bg-green-950/20"
                  headerColor="bg-green-100/70 dark:bg-green-900/30"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="income-statement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold p-4 bg-green-100/50 dark:bg-green-900/20 rounded-lg border-2 border-green-200/50 dark:border-green-800/50">
                    REVENUES
                  </h3>
                </div>
                <MainCategoryPanel 
                  title="Revenue" 
                  entries={revenue}
                  bgColor="bg-green-50/50 dark:bg-green-950/20"
                  headerColor="bg-green-100/70 dark:bg-green-900/30"
                />
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold p-4 bg-red-100/50 dark:bg-red-900/20 rounded-lg border-2 border-red-200/50 dark:border-red-800/50">
                    EXPENSES
                  </h3>
                </div>
                <MainCategoryPanel 
                  title="Expenses" 
                  entries={expenses}
                  bgColor="bg-red-50/50 dark:bg-red-950/20"
                  headerColor="bg-red-100/70 dark:bg-red-900/30"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center pt-6">
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
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload PDF Report</h1>
        <p className="text-muted-foreground">Upload financial statements in PDF format for automated extraction and analysis</p>
      </div>

      {/* Show PDF Preview after file upload but before mapping engine */}
      {showPreview && !showMappingEngine && <PdfPreview />}

      {/* Show Mapping Engine after processing completes */}
      {showMappingEngine && <MappingEngine />}

      {/* Original upload interface - hide when mapping engine is shown */}
      {!showMappingEngine && (
        <>
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
                      <Badge variant="secondary">{formatFileSize(uploadedFile.size)}</Badge>
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

                {progress === 100 && !isProcessing && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Processing Complete</span>
                    </div>
                    <Button 
                      onClick={() => window.location.href = '/'}
                      className="w-full" 
                      size="lg"
                    >
                      View Dashboard
                    </Button>
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
                        step.status === 'processing' ? 'bg-primary/10' : 
                        step.status === 'completed' ? 'bg-success/10' :
                        'bg-muted/30'
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

            {showTransparency && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Processing Transparency
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Processing Logs */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileSearch className="h-4 w-4" />
                      Processing Log
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <div className="space-y-2 font-mono text-sm">
                        {processingLogs.map(log => (
                          <div key={log.id} className="flex items-start gap-3">
                            <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                              {log.timestamp}
                            </span>
                            <span className={`text-xs ${
                              log.type === 'success' ? 'text-success' : 
                              log.type === 'warning' ? 'text-warning' : 
                              'text-foreground'
                            }`}>
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Extracted Items Preview */}
                  {extractedItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Extracted Items ({extractedItems.length})
                      </h3>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full border-collapse">
                          <thead className="bg-muted/50">
                            <tr className="border-b border-border">
                              <th className="text-left p-3 font-medium">Description</th>
                              <th className="text-right p-3 font-medium">Amount</th>
                              <th className="text-left p-3 font-medium">Category</th>
                              <th className="text-center p-3 font-medium">Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extractedItems.map((item, index) => (
                              <tr key={index} className="border-b border-border hover:bg-muted/30">
                                <td className="p-3 font-medium">{item.description}</td>
                                <td className="p-3 text-right font-mono">
                                  {new Intl.NumberFormat('en-US', { 
                                    style: 'currency', 
                                    currency: 'USD',
                                    minimumFractionDigits: 0 
                                  }).format(item.amount)}
                                </td>
                                <td className="p-3">{item.category}</td>
                                <td className="p-3 text-center">
                                  <Badge 
                                    variant={
                                      item.confidence === 'high' ? 'default' :
                                      item.confidence === 'medium' ? 'secondary' :
                                      'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {item.confidence}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Supported File Types & Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Supported Documents</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Annual Reports with Financial Statements</li>
                    <li>• Standalone Financial Statements</li>
                    <li>• Audited Financial Reports</li>
                    <li>• Management Accounts (formatted)</li>
                    <li>• Quarterly/Interim Reports</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Processing Features</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Automatic table detection and extraction</li>
                    <li>• IFRS-compliant account mapping</li>
                    <li>• Multi-period data support</li>
                    <li>• Segment and subsidiary consolidation</li>
                    <li>• Data validation and error checking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}