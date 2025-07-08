
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { excelService } from '@/services/excelService';

interface UploadStatus {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  fileName?: string;
}

export const ExcelUpload = () => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false
  });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    console.log('Starting Excel file upload:', file.name, 'Size:', file.size);

    // Reset status
    setUploadStatus({
      isUploading: true,
      progress: 10,
      error: null,
      success: false,
      fileName: file.name
    });

    try {
      // Upload progress simulation
      setUploadStatus(prev => ({ ...prev, progress: 30 }));

      const result = await excelService.uploadExcelFile(file);
      
      setUploadStatus(prev => ({ ...prev, progress: 80 }));

      if (result.success) {
        setUploadStatus({
          isUploading: false,
          progress: 100,
          error: null,
          success: true,
          fileName: file.name
        });

        toast({
          title: "Excel file uploaded successfully!",
          description: `Processed ${result.records_count || 0} records from ${result.sheets_count || 0} sheets.`,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Excel upload error:', error);
      setUploadStatus({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false,
        fileName: file.name
      });

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload Excel file',
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
        handleFileSelect(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel (.xlsx, .xls) or CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUploadClick = () => {
    if (uploadStatus.isUploading) return;
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setUploadStatus({
      isUploading: false,
      progress: 0,
      error: null,
      success: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Excel & CSV Upload
          </CardTitle>
          <CardDescription>
            Upload Excel files (.xlsx, .xls) or CSV files to extract financial data and trial balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div
            onClick={handleUploadClick}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
              ${uploadStatus.isUploading 
                ? 'border-muted-foreground/50 bg-muted/20 cursor-not-allowed' 
                : uploadStatus.success 
                ? 'border-green-500/50 bg-green-50 hover:bg-green-100' 
                : uploadStatus.error 
                ? 'border-red-500/50 bg-red-50 hover:bg-red-100' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/10'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              {uploadStatus.isUploading ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : uploadStatus.success ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : uploadStatus.error ? (
                <XCircle className="w-12 h-12 text-red-600" />
              ) : (
                <div className="relative">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <FileSpreadsheet className="w-6 h-6 text-primary absolute -bottom-1 -right-1" />
                </div>
              )}
              
              <div className="space-y-2">
                {uploadStatus.isUploading ? (
                  <div>
                    <p className="text-lg font-medium text-foreground">Processing Excel file...</p>
                    {uploadStatus.fileName && (
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <File className="w-4 h-4" />
                        {uploadStatus.fileName}
                      </p>
                    )}
                  </div>
                ) : uploadStatus.success ? (
                  <div>
                    <p className="text-lg font-medium text-green-700">Upload completed successfully!</p>
                    {uploadStatus.fileName && (
                      <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                        <File className="w-4 h-4" />
                        {uploadStatus.fileName}
                      </p>
                    )}
                  </div>
                ) : uploadStatus.error ? (
                  <div>
                    <p className="text-lg font-medium text-red-700">Upload failed</p>
                    {uploadStatus.fileName && (
                      <p className="text-sm text-red-600 flex items-center justify-center gap-2">
                        <File className="w-4 w-4" />
                        {uploadStatus.fileName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Drop your Excel file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports .xlsx, .xls, and .csv files up to 100MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {uploadStatus.isUploading && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Upload Progress</span>
                <span className="font-medium">{uploadStatus.progress}%</span>
              </div>
              <Progress value={uploadStatus.progress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                Uploading and extracting financial data...
              </p>
            </div>
          )}

          {uploadStatus.error && (
            <Alert className="mt-6" variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <strong>Error:</strong> {uploadStatus.error}
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus.success && (
            <div className="mt-6 space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="ml-2 text-green-800">
                  <strong>Success!</strong> Your Excel file has been processed and the data is now available for analysis.
                  You can view the extracted data in the Data section.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button 
                  onClick={resetUpload} 
                  variant="outline" 
                  className="flex-1"
                >
                  Upload Another File
                </Button>
                <Button 
                  onClick={() => window.location.href = '/data'} 
                  className="flex-1"
                >
                  View Data
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
