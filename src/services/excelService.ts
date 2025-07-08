
import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  error?: string;
  records_count?: number;
  sheets_count?: number;
}

class ExcelService {
  async uploadExcelFile(file: File): Promise<UploadResult> {
    try {
      console.log('Starting Excel file upload:', file.name, 'Size:', file.size);

      // Create upload record
      console.log('Creating upload record...');
      const { data: upload, error: uploadError } = await supabase
        .from('excel_uploads')
        .insert({
          filename: file.name,
          file_size: file.size,
          processing_status: 'uploading'
        })
        .select()
        .single();

      if (uploadError || !upload) {
        console.error('Failed to create upload record:', uploadError);
        throw new Error(`Failed to create upload record: ${uploadError?.message || 'Unknown error'}`);
      }

      console.log('Upload record created with ID:', upload.id);

      // Upload file to storage
      const storagePath = `${upload.id}/${file.name}`;
      console.log('Uploading file to storage path:', storagePath);

      const { error: storageError } = await supabase.storage
        .from('excel-uploads')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error('Storage upload failed:', storageError);
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      console.log('File uploaded to storage successfully');

      // Update upload record with storage path and processing status
      await supabase
        .from('excel_uploads')
        .update({
          storage_path: storagePath,
          processing_status: 'processing'
        })
        .eq('id', upload.id);

      // Determine if this is a CSV file or Excel file
      const isCSV = file.name.toLowerCase().endsWith('.csv') || 
                   file.type === 'text/csv' || 
                   file.type === 'application/csv';

      console.log('Processing file with upload_id:', upload.id);
      console.log('File type detected:', isCSV ? 'CSV' : 'Excel');

      // Choose the appropriate function based on file type
      const functionName = isCSV ? 'process-csv' : 'process-excel';
      console.log('Invoking', functionName, 'function...');

      let result;
      if (isCSV) {
        // For CSV files, send the file directly to process-csv function
        const formData = new FormData();
        formData.append('file', file);
        
        const { data, error } = await supabase.functions.invoke('process-csv', {
          body: formData
        });
        
        result = { data, error };
      } else {
        // For Excel files, send upload_id to process-excel function
        const { data, error } = await supabase.functions.invoke('process-excel', {
          body: { upload_id: upload.id }
        });
        
        result = { data, error };
      }

      console.log('Function invocation completed');
      console.log('Function response data:', result.data);
      console.log('Function response error:', result.error);

      if (result.error) {
        console.error('Function invocation error:', result.error);
        await this.updateUploadStatus(upload.id, 'failed', `Edge function error: ${result.error.message}`);
        throw new Error(`Edge function error: ${result.error.message}`);
      }

      if (result.data?.error) {
        console.error('Function processing error:', result.data.error);
        await this.updateUploadStatus(upload.id, 'failed', `Processing error: ${result.data.error}`);
        throw new Error(`Processing error: ${result.data.error}`);
      }

      // Success - the function should have updated the status
      return {
        success: true,
        records_count: result.data?.total_records_count || result.data?.rowCount || 0,
        sheets_count: result.data?.sheets_count || 1
      };

    } catch (error) {
      console.error('Excel upload error:', error);
      throw new Error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateUploadStatus(uploadId: string, status: string, errorMessage?: string) {
    try {
      const updateData: any = {
        processing_status: status,
        completed_at: new Date().toISOString()
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      await supabase
        .from('excel_uploads')
        .update(updateData)
        .eq('id', uploadId);
    } catch (error) {
      console.error('Failed to update upload status:', error);
    }
  }
}

export const excelService = new ExcelService();
