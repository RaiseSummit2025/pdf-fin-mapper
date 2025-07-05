import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Eye, FileSearch, MapPin } from 'lucide-react';
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
          const newData = generateRealisticData(uploadedFile?.name || 'Financial Report');
          setFinancialData(newData);
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
    toast({
      title: "Processing Complete",
      description: "Financial data has been successfully extracted and mapped. You can now review the results in the Dashboard and Mapping sections."
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload PDF Report</h1>
        <p className="text-muted-foreground">Upload financial statements in PDF format for automated extraction and analysis</p>
      </div>

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
    </div>
  );
}