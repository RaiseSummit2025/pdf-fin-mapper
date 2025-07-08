
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, FileSpreadsheet, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExcelUpload {
  id: string;
  filename: string;
  file_size: number;
  processing_status: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  total_records_count?: number;
  sheets_count?: number;
}

interface ExcelProcessorProps {
  uploads: ExcelUpload[];
  onRefresh: () => void;
}

export const ExcelProcessor = ({ uploads, onRefresh }: ExcelProcessorProps) => {
  const [processingUploads, setProcessingUploads] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Poll for processing status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const hasProcessing = uploads.some(upload => upload.processing_status === 'processing');
      if (hasProcessing) {
        onRefresh();
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [uploads, onRefresh]);

  const handleProcess = async (uploadId: string) => {
    setProcessingUploads(prev => new Set(prev).add(uploadId));
    
    try {
      console.log('Starting Excel processing for upload:', uploadId);
      
      const { data, error } = await supabase.functions.invoke('process-excel', {
        body: { upload_id: uploadId }
      });

      if (error) {
        console.error('Excel processing error:', error);
        throw new Error(error.message);
      }

      if (data?.error) {
        console.error('Excel processing function error:', data.error);
        throw new Error(data.error);
      }

      console.log('Excel processing completed:', data);
      
      toast({
        title: "Excel Processing Complete",
        description: `Processed ${data.total_records_count} records from ${data.sheets_count} sheets`,
      });

      onRefresh(); // Refresh the uploads list
      
    } catch (error) {
      console.error('Excel processing failed:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setProcessingUploads(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
    }
  };

  const handleDelete = async (uploadId: string) => {
    try {
      const { error } = await supabase
        .from('excel_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;

      toast({
        title: "Upload Deleted",
        description: "Excel upload has been deleted successfully",
      });

      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the upload",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileSpreadsheet className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'processing':
        return 'secondary' as const;
      case 'failed':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  if (!uploads || uploads.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No Excel files uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Excel Files ({uploads.length})</h3>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {uploads.map((upload) => (
        <Card key={upload.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(upload.processing_status)}
                <CardTitle className="text-base">{upload.filename}</CardTitle>
              </div>
              <Badge variant={getStatusBadgeVariant(upload.processing_status)}>
                {upload.processing_status}
              </Badge>
            </div>
            <CardDescription>
              Size: {(upload.file_size / 1024).toFixed(1)} KB • 
              Uploaded: {new Date(upload.created_at).toLocaleString()}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            {upload.processing_status === 'processing' && (
              <div className="mb-4">
                <Progress value={undefined} className="h-2" />
                <p className="text-sm text-gray-600 mt-2">Processing Excel file...</p>
              </div>
            )}

            {upload.processing_status === 'completed' && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Processing Complete</span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Extracted {upload.total_records_count} records from {upload.sheets_count} sheets
                </div>
                {upload.completed_at && (
                  <div className="text-xs text-green-600 mt-1">
                    Completed: {new Date(upload.completed_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {upload.processing_status === 'failed' && upload.error_message && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Processing Failed</span>
                </div>
                <div className="text-sm text-red-700 mt-1">{upload.error_message}</div>
              </div>
            )}

            <div className="flex gap-2">
              {upload.processing_status === 'pending' && (
                <Button
                  onClick={() => handleProcess(upload.id)}
                  disabled={processingUploads.has(upload.id)}
                  size="sm"
                >
                  {processingUploads.has(upload.id) ? 'Processing...' : 'Process'}
                </Button>
              )}
              
              {upload.processing_status === 'failed' && (
                <Button
                  onClick={() => handleProcess(upload.id)}
                  disabled={processingUploads.has(upload.id)}
                  size="sm"
                  variant="outline"
                >
                  {processingUploads.has(upload.id) ? 'Retrying...' : 'Retry'}
                </Button>
              )}

              <Button
                onClick={() => handleDelete(upload.id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
