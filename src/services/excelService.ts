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

      console.log('Upload record created:', upload.id);

      // Upload file to storage
      const filePath = `${upload.id}/${file.name}`;
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

      console.log('File uploaded to storage:', filePath);

      // Update upload record with storage path
      await supabase
        .from('excel_uploads')
        .update({
          storage_path: filePath,
          processing_status: 'processing'
        })
        .eq('id', upload.id);

      // Process the Excel file using edge function
      console.log('Invoking process-excel function...');
      
      try {
        const { data: processResult, error: processError } = await supabase.functions.invoke('process-excel', {
          body: { upload_id: upload.id }
        });

        if (processError) {
          console.error('Excel processing failed:', processError);
          await this.updateUploadStatus(upload.id, 'failed', `Processing error: ${processError.message}`);
          throw new Error(`Excel processing failed: ${processError.message}`);
        }

        console.log('Excel processing completed:', processResult);

        // Check if the processing was successful
        if (!processResult || !processResult.success) {
          const errorMsg = processResult?.error || 'Processing failed - no response from server';
          await this.updateUploadStatus(upload.id, 'failed', errorMsg);
          throw new Error(errorMsg);
        }

        await this.updateUploadStatus(upload.id, 'completed');

        return {
          success: true,
          records_count: processResult.total_records_count || 0,
          sheets_count: processResult.sheets_count || 0,
          upload_id: upload.id
        };

      } catch (functionError) {
        console.error('Function invocation error:', functionError);
        await this.updateUploadStatus(upload.id, 'failed', `Function error: ${functionError.message}`);
        throw new Error(`Processing failed: ${functionError.message}`);
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
