import { supabase } from '@/integrations/supabase/client';

export interface ExcelUploadResult {
  success: boolean;
  records_count?: number;
  sheets_count?: number;
  error?: string;
  upload_id?: string;
}

class ExcelService {
  async uploadExcelFile(file: File): Promise<ExcelUploadResult> {
    try {
      console.log('Starting Excel file upload:', file.name);

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

      if (uploadError) {
        console.error('Failed to create upload record:', uploadError);
        throw new Error('Failed to create upload record');
      }

      console.log('Upload record created:', upload.id);

      // Upload file to storage
      const filePath = `${upload.id}/${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('excel-uploads')
        .upload(filePath, file);

      if (storageError) {
        console.error('File upload failed:', storageError);
        await this.updateUploadStatus(upload.id, 'failed', storageError.message);
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

      // Process the Excel file
      const { data: processResult, error: processError } = await supabase.functions
        .invoke('process-excel', {
          body: { upload_id: upload.id }
        });

      if (processError) {
        console.error('Excel processing failed:', processError);
        await this.updateUploadStatus(upload.id, 'failed', processError.message);
        throw new Error(`Excel processing failed: ${processError.message}`);
      }

      console.log('Excel processing completed:', processResult);

      return {
        success: true,
        records_count: processResult?.records_count || 0,
        sheets_count: processResult?.sheets_count || 0,
        upload_id: upload.id
      };

    } catch (error) {
      console.error('Excel upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  private async updateUploadStatus(uploadId: string, status: string, errorMessage?: string) {
    await supabase
      .from('excel_uploads')
      .update({
        processing_status: status,
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', uploadId);
  }

  async getExcelUploads() {
    const { data, error } = await supabase
      .from('excel_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch Excel uploads:', error);
      return [];
    }

    return data || [];
  }

  async getExcelData(uploadId: string) {
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
  }
}

export const excelService = new ExcelService();