
import { supabase } from '@/integrations/supabase/client';

export interface ExcelUploadResult {
  success: boolean;
  records_count?: number;
  sheets_count?: number;
  error?: string;
  upload_id?: string;
}

interface ExcelUpload {
  id: string;
  filename: string;
  storage_path?: string;
  processing_status?: string;
  file_size?: number;
  error_message?: string;
  sheets_count?: number;
  total_records_count?: number;
  created_at: string;
  completed_at?: string;
}

class ExcelService {
  async uploadExcelFile(file: File): Promise<ExcelUploadResult> {
    try {
      console.log('Starting Excel file upload:', file.name, 'Size:', file.size);

      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum allowed size is 100MB.');
      }

      // Validate file type
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
      
      if (!isValidType) {
        throw new Error('Invalid file type. Please select an Excel (.xlsx, .xls) or CSV file.');
      }

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
      const filePath = `${upload.id}/${file.name}`;
      console.log('Uploading file to storage path:', filePath);
      
      const { error: storageError } = await supabase.storage
        .from('excel-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error('File upload failed:', storageError);
        await this.updateUploadStatus(upload.id, 'failed', `Storage error: ${storageError.message}`);
        throw new Error(`File upload failed: ${storageError.message}`);
      }

      console.log('File uploaded to storage successfully');

      // Update upload record with storage path and status
      const { error: pathUpdateError } = await supabase
        .from('excel_uploads')
        .update({
          storage_path: filePath,
          processing_status: 'processing'
        })
        .eq('id', upload.id);

      if (pathUpdateError) {
        console.error('Failed to update storage path:', pathUpdateError);
      }

      // Process the Excel file using the edge function
      console.log('Processing Excel file with upload_id:', upload.id);
      
      try {
        // Add timeout and better error handling for the function call
        console.log('Invoking process-excel function...');
        
        const { data, error } = await supabase.functions.invoke('process-excel', {
          body: { upload_id: upload.id },
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('Function invocation completed');
        console.log('Function response data:', data);
        console.log('Function response error:', error);
        
        if (error) {
          console.error('Function invocation error:', error);
          throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
        }

        // Check if the processing was successful
        if (!data) {
          console.error('No data returned from function');
          await this.updateUploadStatus(upload.id, 'failed', 'No response from processing function');
          throw new Error('No response received from processing function');
        }

        if (!data.success) {
          const errorMsg = data.error || 'Processing failed - function returned unsuccessful result';
          console.error('Processing failed:', errorMsg);
          await this.updateUploadStatus(upload.id, 'failed', errorMsg);
          throw new Error(errorMsg);
        }

        console.log('Excel processing completed successfully');
        return {
          success: true,
          records_count: data.total_records_count || 0,
          sheets_count: data.sheets_count || 0,
          upload_id: upload.id
        };

      } catch (functionError) {
        console.error('Function processing error:', functionError);
        const errorMessage = functionError instanceof Error ? functionError.message : 'Unknown function error';
        await this.updateUploadStatus(upload.id, 'failed', `Processing error: ${errorMessage}`);
        throw new Error(`Processing failed: ${errorMessage}`);
      }

    } catch (error) {
      console.error('Excel upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  private async updateUploadStatus(uploadId: string, status: string, errorMessage?: string) {
    try {
      await supabase
        .from('excel_uploads')
        .update({
          processing_status: status,
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', uploadId);
    } catch (error) {
      console.error('Failed to update upload status:', error);
    }
  }

  async getExcelUploads(): Promise<ExcelUpload[]> {
    try {
      const { data, error } = await supabase
        .from('excel_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch Excel uploads:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch Excel uploads:', error);
      return [];
    }
  }

  async getExcelData(uploadId: string) {
    try {
      const { data, error } = await supabase
        .from('excel_data')
        .select('*')
        .eq('upload_id', uploadId)
        .order('row_number');

      if (error) {
        console.error('Failed to fetch Excel data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch Excel data:', error);
      return [];
    }
  }

  async getTrialBalances(uploadId: string) {
    try {
      const { data, error } = await supabase
        .from('trial_balances')
        .select('*')
        .eq('upload_id', uploadId)
        .order('account_description');

      if (error) {
        console.error('Failed to fetch trial balances:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch trial balances:', error);
      return [];
    }
  }
}

export const excelService = new ExcelService();
