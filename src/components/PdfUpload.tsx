
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

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
}

interface DragItem {
  id: string;
  entry: FinancialEntry;
}

export function PdfUpload() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showMappingEngine, setShowMappingEngine] = useState(false);
  const [mappedData, setMappedData] = useState<FinancialData | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
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

  const generateRealisticData = (fileName: string): FinancialData => {
    const companyName = fileName.replace('.pdf', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Corporation';
    
    const entries: FinancialEntry[] = [
      // Non-Current Assets
      { id: '1', date: '2023-12-31', description: 'Property, Plant & Equipment', amount: 450000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Property, Plant and Equipment', originalLine: 'Fixed assets - tangible' },
      { id: '2', date: '2023-12-31', description: 'Right-of-Use Assets', amount: 125000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Right-of-Use Assets', originalLine: 'Lease assets' },
      { id: '3', date: '2023-12-31', description: 'Intangible Assets', amount: 78000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Intangible Assets', originalLine: 'Software and licenses' },
      { id: '4', date: '2023-12-31', description: 'Goodwill', amount: 95000, highLevelCategory: 'Assets', mainGrouping: 'Non-current Assets', ifrsCategory: 'Goodwill', originalLine: 'Goodwill on acquisition' },
      
      // Current Assets
      { id: '5', date: '2023-12-31', description: 'Cash and Cash Equivalents', amount: 125000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Cash and Cash Equivalents', originalLine: 'Cash at bank and in hand' },
      { id: '6', date: '2023-12-31', description: 'Trade Receivables', amount: 89000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Trade and Other Receivables', originalLine: 'Accounts receivable - trade' },
      { id: '7', date: '2023-12-31', description: 'Inventory', amount: 156000, highLevelCategory: 'Assets', mainGrouping: 'Current Assets', ifrsCategory: 'Inventories', originalLine: 'Stock and work-in-progress' },
      
      // Non-Current Liabilities
      { id: '8', date: '2023-12-31', description: 'Long-term Debt', amount: 235000, highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities', ifrsCategory: 'Financial Liabilities', originalLine: 'Term loans - non-current' },
      { id: '9', date: '2023-12-31', description: 'Lease Liabilities', amount: 98000, highLevelCategory: 'Liabilities', mainGrouping: 'Non-current Liabilities', ifrsCategory: 'Lease Liabilities', originalLine: 'Lease obligations - non-current' },
      
      // Current Liabilities
      { id: '10', date: '2023-12-31', description: 'Trade Payables', amount: 67000, highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities', ifrsCategory: 'Trade and Other Payables', originalLine: 'Creditors and accruals' },
      { id: '11', date: '2023-12-31', description: 'Short-term Debt', amount: 45000, highLevelCategory: 'Liabilities', mainGrouping: 'Current Liabilities', ifrsCategory: 'Financial Liabilities', originalLine: 'Bank loans - current portion' },
      
      // Equity
      { id: '12', date: '2023-12-31', description: 'Share Capital', amount: 200000, highLevelCategory: 'Equity', mainGrouping: 'Equity', ifrsCategory: 'Share Capital', originalLine: 'Ordinary shares issued' },
      { id: '13', date: '2023-12-31', description: 'Share Premium', amount: 150000, highLevelCategory: 'Equity', mainGrouping: 'Equity', ifrsCategory: 'Share Premium', originalLine: 'Share premium account' },
      { id: '14', date: '2023-12-31', description: 'Retained Earnings', amount: 351000, highLevelCategory: 'Equity', mainGrouping: 'Equity', ifrsCategory: 'Retained Earnings', originalLine: 'Accumulated profits' },
      
      // Revenue
      { id: '15', date: '2023-12-31', description: 'Sales Revenue', amount: 1250000, highLevelCategory: 'Revenue', mainGrouping: 'Revenue', ifrsCategory: 'Revenue', originalLine: 'Total sales revenue' },
      
      // Expenses
      { id: '16', date: '2023-12-31', description: 'Cost of Goods Sold', amount: 750000, highLevelCategory: 'Expenses', mainGrouping: 'Cost of Sales', ifrsCategory: 'Cost of Sales', originalLine: 'Direct costs of sales' },
      { id: '17', date: '2023-12-31', description: 'Administrative Expenses', amount: 180000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'General and Administrative Expenses', originalLine: 'General and admin costs' },
      { id: '18', date: '2023-12-31', description: 'Selling Expenses', amount: 120000, highLevelCategory: 'Expenses', mainGrouping: 'Operating Expenses', ifrsCategory: 'Selling Expenses', originalLine: 'Sales and marketing costs' }
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
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (i === steps.length - 1) {
        generatedData = generateRealisticData(uploadedFile?.name || 'Financial Report');
        setFinancialData(generatedData);
        setIsProcessedData(true);
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
    }
    
    toast({
      title: "Processing Complete",
      description: "Financial data has been successfully extracted and mapped."
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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, entry: FinancialEntry) => {
    setDraggedItem({ id: entry.id, entry });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string, targetGrouping: string, targetHighLevel: string) => {
    e.preventDefault();
    
    if (!draggedItem || !mappedData) return;
    
    const updatedEntries = mappedData.entries.map(entry => 
      entry.id === draggedItem.id 
        ? { 
            ...entry, 
            ifrsCategory: targetCategory,
            mainGrouping: targetGrouping,
            highLevelCategory: targetHighLevel as any
          }
        : entry
    );
    
    const updatedData = { ...mappedData, entries: updatedEntries };
    setMappedData(updatedData);
    setFinancialData(updatedData);
    setDraggedItem(null);
    
    toast({
      title: "Item Moved",
      description: `${draggedItem.entry.description} moved to ${targetCategory}`,
    });
  };

  // IFRS Category Component
  const IFRSCategory = ({ 
    title, 
    entries, 
    targetCategory,
    targetGrouping,
    targetHighLevel
  }: { 
    title: string; 
    entries: FinancialEntry[];
    targetCategory: string;
    targetGrouping: string;
    targetHighLevel: string;
  }) => {
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    
    return (
      <div 
        className="border-2 border-dashed border-gray-200 rounded-lg p-4 min-h-[120px] hover:border-blue-300 transition-colors"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, targetCategory, targetGrouping, targetHighLevel)}
      >
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-700">{title}</h4>
          <Badge variant="outline" className="text-xs">
            {total > 0 ? formatCurrency(total) : '0'}
          </Badge>
        </div>
        
        {entries.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            <GripVertical className="h-6 w-6 mx-auto mb-2 opacity-50" />
            Drop accounts here
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                draggable
                onDragStart={(e) => handleDragStart(e, entry)}
                className="bg-white border rounded p-2 cursor-move hover:shadow-sm transition-shadow flex justify-between items-center"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.description}</p>
                  <p className="text-xs text-gray-500">{entry.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatCurrency(entry.amount)}</span>
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Main Mapping Engine Component
  const MappingEngine = () => {
    if (!mappedData) return null;

    // Filter entries by categories
    const nonCurrentAssets = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Assets' && e.mainGrouping === 'Non-current Assets'
    );
    const currentAssets = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Assets' && e.mainGrouping === 'Current Assets'
    );
    const nonCurrentLiabilities = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Non-current Liabilities'
    );
    const currentLiabilities = mappedData.entries.filter(e => 
      e.highLevelCategory === 'Liabilities' && e.mainGrouping === 'Current Liabilities'
    );
    const equity = mappedData.entries.filter(e => e.highLevelCategory === 'Equity');
    const revenue = mappedData.entries.filter(e => e.highLevelCategory === 'Revenue');
    const expenses = mappedData.entries.filter(e => e.highLevelCategory === 'Expenses');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">IFRS Mapping Engine</h2>
            <p className="text-gray-600">Drag and drop to reassign financial line items</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {mappedData.entries.length} items mapped
          </Badge>
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
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Non-current Assets</h4>
                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Property, Plant and Equipment" 
                      entries={nonCurrentAssets.filter(e => e.ifrsCategory === 'Property, Plant and Equipment')}
                      targetCategory="Property, Plant and Equipment"
                      targetGrouping="Non-current Assets"
                      targetHighLevel="Assets"
                    />
                    <IFRSCategory 
                      title="Right-of-Use Assets" 
                      entries={nonCurrentAssets.filter(e => e.ifrsCategory === 'Right-of-Use Assets')}
                      targetCategory="Right-of-Use Assets"
                      targetGrouping="Non-current Assets"
                      targetHighLevel="Assets"
                    />
                    <IFRSCategory 
                      title="Intangible Assets" 
                      entries={nonCurrentAssets.filter(e => e.ifrsCategory === 'Intangible Assets')}
                      targetCategory="Intangible Assets"
                      targetGrouping="Non-current Assets"
                      targetHighLevel="Assets"
                    />
                    <IFRSCategory 
                      title="Goodwill" 
                      entries={nonCurrentAssets.filter(e => e.ifrsCategory === 'Goodwill')}
                      targetCategory="Goodwill"
                      targetGrouping="Non-current Assets"
                      targetHighLevel="Assets"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Current Assets</h4>
                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Cash and Cash Equivalents" 
                      entries={currentAssets.filter(e => e.ifrsCategory === 'Cash and Cash Equivalents')}
                      targetCategory="Cash and Cash Equivalents"
                      targetGrouping="Current Assets"
                      targetHighLevel="Assets"
                    />
                    <IFRSCategory 
                      title="Trade and Other Receivables" 
                      entries={currentAssets.filter(e => e.ifrsCategory === 'Trade and Other Receivables')}
                      targetCategory="Trade and Other Receivables"
                      targetGrouping="Current Assets"
                      targetHighLevel="Assets"
                    />
                    <IFRSCategory 
                      title="Inventories" 
                      entries={currentAssets.filter(e => e.ifrsCategory === 'Inventories')}
                      targetCategory="Inventories"
                      targetGrouping="Current Assets"
                      targetHighLevel="Assets"
                    />
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Panel */}
              <div className="space-y-6">
                <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <h3 className="text-xl font-bold text-red-900">Liabilities & Equity</h3>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Equity</h4>
                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Share Capital" 
                      entries={equity.filter(e => e.ifrsCategory === 'Share Capital')}
                      targetCategory="Share Capital"
                      targetGrouping="Equity"
                      targetHighLevel="Equity"
                    />
                    <IFRSCategory 
                      title="Share Premium" 
                      entries={equity.filter(e => e.ifrsCategory === 'Share Premium')}
                      targetCategory="Share Premium"
                      targetGrouping="Equity"
                      targetHighLevel="Equity"
                    />
                    <IFRSCategory 
                      title="Retained Earnings" 
                      entries={equity.filter(e => e.ifrsCategory === 'Retained Earnings')}
                      targetCategory="Retained Earnings"
                      targetGrouping="Equity"
                      targetHighLevel="Equity"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Non-current Liabilities</h4>
                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Financial Liabilities" 
                      entries={nonCurrentLiabilities.filter(e => e.ifrsCategory === 'Financial Liabilities')}
                      targetCategory="Financial Liabilities"
                      targetGrouping="Non-current Liabilities"
                      targetHighLevel="Liabilities"
                    />
                    <IFRSCategory 
                      title="Lease Liabilities" 
                      entries={nonCurrentLiabilities.filter(e => e.ifrsCategory === 'Lease Liabilities')}
                      targetCategory="Lease Liabilities"
                      targetGrouping="Non-current Liabilities"
                      targetHighLevel="Liabilities"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Current Liabilities</h4>
                  <div className="space-y-3">
                    <IFRSCategory 
                      title="Trade and Other Payables" 
                      entries={currentLiabilities.filter(e => e.ifrsCategory === 'Trade and Other Payables')}
                      targetCategory="Trade and Other Payables"
                      targetGrouping="Current Liabilities"
                      targetHighLevel="Liabilities"
                    />
                    <IFRSCategory 
                      title="Financial Liabilities" 
                      entries={currentLiabilities.filter(e => e.ifrsCategory === 'Financial Liabilities')}
                      targetCategory="Financial Liabilities"
                      targetGrouping="Current Liabilities"
                      targetHighLevel="Liabilities"
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
                  <h3 className="text-xl font-bold text-green-900">Revenue</h3>
                </div>
                <div className="space-y-3">
                  <IFRSCategory 
                    title="Revenue" 
                    entries={revenue}
                    targetCategory="Revenue"
                    targetGrouping="Revenue"
                    targetHighLevel="Revenue"
                  />
                </div>
              </div>

              {/* Expenses Panel */}
              <div className="space-y-6">
                <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <h3 className="text-xl font-bold text-orange-900">Expenses</h3>
                </div>
                <div className="space-y-3">
                  <IFRSCategory 
                    title="Cost of Sales" 
                    entries={expenses.filter(e => e.ifrsCategory === 'Cost of Sales')}
                    targetCategory="Cost of Sales"
                    targetGrouping="Cost of Sales"
                    targetHighLevel="Expenses"
                  />
                  <IFRSCategory 
                    title="General and Administrative Expenses" 
                    entries={expenses.filter(e => e.ifrsCategory === 'General and Administrative Expenses')}
                    targetCategory="General and Administrative Expenses"
                    targetGrouping="Operating Expenses"
                    targetHighLevel="Expenses"
                  />
                  <IFRSCategory 
                    title="Selling Expenses" 
                    entries={expenses.filter(e => e.ifrsCategory === 'Selling Expenses')}
                    targetCategory="Selling Expenses"
                    targetGrouping="Operating Expenses"
                    targetHighLevel="Expenses"
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
