
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, FileText, AlertCircle, Database, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProcessingResult {
  fileName: string;
  rowCount: number;
  summary: {
    columns: number;
  };
  headers: string[];
  sampleRows: string[][];
}

interface ProcessingStatus {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  fileName?: string;
  fileSize?: number;
  currentStep?: string;
  result?: ProcessingResult;
  conversionStatus?: string;
}

export const ExcelProcessor = () => {
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    error: null,
    success: false
  });
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const convertExcelToCSV = async (excelFile: File): Promise<File> => {
    try {
      setStatus(prev => ({ ...prev, conversionStatus: 'Reading Excel file...' }));
      
      const buffer = await excelFile.arrayBuffer();
      
      setStatus(prev => ({ ...prev, conversionStatus: 'Converting Excel to worksheet...' }));
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      setStatus(prev => ({ ...prev, conversionStatus: 'Converting worksheet to CSV...' }));
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      
      const csvFile = new File([csvContent], excelFile.name.replace(/\.(xlsx|xls)$/i, '.csv'), {
        type: 'text/csv',
      });
      
      setStatus(prev => ({ ...prev, conversionStatus: 'Excel successfully converted to CSV' }));
      return csvFile;
    } catch (error) {
      console.error('Error converting Excel to CSV:', error);
      throw new Error(`Failed to convert Excel to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    console.log('Starting file processing:', file.name, 'Size:', file.size);

    setStatus({
      isProcessing: true,
      progress: 10,
      error: null,
      success: false,
      fileName: file.name,
      fileSize: file.size,
      currentStep: 'Starting processing...'
    });

    try {
      let fileToProcess = file;
      
      // If it's an Excel file, convert it to CSV first
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        console.log('Converting Excel file to CSV...');
        setStatus(prev => ({ ...prev, progress: 20, currentStep: 'Converting Excel to CSV...' }));
        fileToProcess = await convertExcelToCSV(file);
        console.log('Conversion complete');
      } else if (!file.name.endsWith('.csv')) {
        throw new Error('Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', fileToProcess);
      
      setStatus(prev => ({ 
        ...prev, 
        progress: 60, 
        currentStep: 'Sending CSV to server for processing...',
        conversionStatus: 'Sending CSV to server for processing...'
      }));
      
      // Call the Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('process-csv', {
        body: formData
      });
      
      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Processing function failed');
      }

      if (!data) {
        throw new Error('No response received from processing function');
      }
      
      console.log('File processed successfully:', data);
      
      setStatus({
        isProcessing: false,
        progress: 100,
        error: null,
        success: true,
        fileName: file.name,
        fileSize: file.size,
        currentStep: 'Processing completed!',
        result: data
      });

      toast({
        title: "File processed successfully!",
        description: `Processed ${data.rowCount} rows with ${data.summary.columns} columns.`,
      });

    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      
      setStatus({
        isProcessing: false,
        progress: 0,
        error: errorMessage,
        success: false,
        fileName: file.name,
        fileSize: file.size,
        currentStep: 'Processing failed'
      });

      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/csv'
      ];
      
      const isValidType = validTypes.includes(file.type) || 
                         file.name.toLowerCase().endsWith('.xlsx') || 
                         file.name.toLowerCase().endsWith('.xls') || 
                         file.name.toLowerCase().endsWith('.csv');
      
      if (isValidType) {
        processFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel (.xlsx, .xls) or CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const resetProcessor = () => {
    setStatus({
      isProcessing: false,
      progress: 0,
      error: null,
      success: false
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Excel & CSV Processor
          </CardTitle>
          <CardDescription>
            Upload Excel files (.xlsx, .xls) or CSV files to extract and analyze data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={status.isProcessing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                ${status.isProcessing 
                  ? 'border-muted-foreground/50 bg-muted/20 cursor-not-allowed' 
                  : status.success 
                  ? 'border-green-500/50 bg-green-50 hover:bg-green-100' 
                  : status.error 
                  ? 'border-red-500/50 bg-red-50 hover:bg-red-100' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/10 cursor-pointer'
                }
              `}
            >
              <div className="flex flex-col items-center gap-4">
                {status.isProcessing ? (
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                ) : status.success ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : status.error ? (
                  <XCircle className="w-12 h-12 text-red-600" />
                ) : (
                  <div className="relative">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <FileSpreadsheet className="w-6 h-6 text-primary absolute -bottom-1 -right-1" />
                  </div>
                )}
                
                <div className="space-y-2">
                  {status.isProcessing ? (
                    <div>
                      <p className="text-lg font-medium text-foreground">Processing file...</p>
                      <p className="text-sm text-muted-foreground">{status.currentStep}</p>
                    </div>
                  ) : status.success ? (
                    <div>
                      <p className="text-lg font-medium text-green-700">Processing completed!</p>
                      <p className="text-sm text-green-600">File processed successfully</p>
                    </div>
                  ) : status.error ? (
                    <div>
                      <p className="text-lg font-medium text-red-700">Processing failed</p>
                      <p className="text-sm text-red-600">Please try again</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-foreground">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports .xlsx, .xls, and .csv files
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* File Information */}
          {status.fileName && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {status.fileName}
                  </p>
                  {status.fileSize && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(status.fileSize)}
                    </p>
                  )}
                  {status.conversionStatus && (
                    <p className="text-xs text-blue-600 mt-1">
                      {status.conversionStatus}
                    </p>
                  )}
                </div>
                {status.success && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {status.error && (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                {status.isProcessing && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {status.isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{status.currentStep}</span>
                <span className="font-medium">{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="w-full" />
            </div>
          )}

          {/* Error Alert */}
          {status.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {status.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {status.success && status.result && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> File processed successfully with {status.result.rowCount} rows and {status.result.summary.columns} columns.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Rows</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{status.result.rowCount}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Columns</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{status.result.summary.columns}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">File</span>
                  </div>
                  <p className="text-sm font-medium text-purple-600 truncate">{status.result.fileName}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Column Headers</h4>
                <div className="flex flex-wrap gap-2">
                  {status.result.headers.map((header, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                      {header}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Sample Data (First 5 Rows)</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {status.result.headers.map((header, index) => (
                          <TableHead key={index}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {status.result.sampleRows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Button onClick={resetProcessor} variant="outline" className="w-full">
                Process Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
