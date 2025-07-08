import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { excelService } from '@/services/excelService';

interface UploadStatus {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
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

    // Reset status
    setUploadStatus({
      isUploading: true,
      progress: 0,
      error: null,
      success: false
    });

    try {
      // Simulate progress
      setUploadStatus(prev => ({ ...prev, progress: 20 }));

      const result = await excelService.uploadExcelFile(file);
      
      setUploadStatus(prev => ({ ...prev, progress: 60 }));

      if (result.success) {
        setUploadStatus({
          isUploading: false,
          progress: 100,
          error: null,
          success: true
        });

        toast({
          title: "Excel file uploaded successfully!",
          description: `Processed ${result.records_count} records from ${result.sheets_count} sheets.`,
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
        success: false
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
        'text/csv'
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
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
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setUploadStatus({
      isUploading: false,
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
            Excel File Upload
          </CardTitle>
          <CardDescription>
            Upload Excel files (.xlsx, .xls) or CSV files to extract and analyze data
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
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              border-gray-300 hover:border-gray-400
              ${uploadStatus.isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <div className="flex flex-col items-center gap-4">
              {uploadStatus.isUploading ? (
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
              ) : uploadStatus.success ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : uploadStatus.error ? (
                <XCircle className="w-12 h-12 text-red-500" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400" />
              )}
              
              <div>
                {uploadStatus.isUploading ? (
                  <p className="text-lg font-medium">Processing Excel file...</p>
                ) : uploadStatus.success ? (
                  <p className="text-lg font-medium text-green-600">File uploaded successfully!</p>
                ) : uploadStatus.error ? (
                  <p className="text-lg font-medium text-red-600">Upload failed</p>
                ) : (
                  <p className="text-lg font-medium">Click to select an Excel file</p>
                )}
                
                {!uploadStatus.isUploading && !uploadStatus.success && !uploadStatus.error && (
                  <p className="text-sm text-gray-500 mt-2">
                    Supports .xlsx, .xls, and .csv files
                  </p>
                )}
              </div>
            </div>
          </div>

          {uploadStatus.isUploading && (
            <div className="mt-4">
              <Progress value={uploadStatus.progress} className="w-full" />
              <p className="text-sm text-gray-500 mt-2">
                Uploading and processing... {uploadStatus.progress}%
              </p>
            </div>
          )}

          {uploadStatus.error && (
            <Alert className="mt-4" variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadStatus.error}
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus.success && (
            <div className="mt-4 space-y-2">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Excel file processed successfully! You can now view the extracted data in the Data page.
                </AlertDescription>
              </Alert>
              <Button onClick={resetUpload} variant="outline" className="w-full">
                Upload Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};