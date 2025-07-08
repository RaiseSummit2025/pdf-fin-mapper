import { supabase } from '@/integrations/supabase/client';
import { FinancialData } from '@/types/financial';

export interface UploadResult {
  success: boolean;
  uploadId?: string;
  error?: string;
}

export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  extractedCount?: number;
  error?: string;
}

export class SupabasePdfService {
  
  async uploadPdf(file: File): Promise<UploadResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const storagePath = `uploads/${filename}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('pdf-uploads')
        .upload(storagePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create upload record
      const { data: uploadRecord, error: dbError } = await supabase
        .from('pdf_uploads')
        .insert({
          filename: file.name,
          storage_path: storagePath,
          file_size: file.size,
          processing_status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Trigger PDF processing
      const { error: processError } = await supabase.functions.invoke('extract-pdf', {
        body: { upload_id: uploadRecord.id }
      });

      if (processError) {
        console.error('Processing trigger error:', processError);
        // Don't throw error here, as the file is uploaded and processing can be retried
      }

      return {
        success: true,
        uploadId: uploadRecord.id
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getProcessingStatus(uploadId: string): Promise<ProcessingStatus> {
    try {
      const { data, error } = await supabase
        .from('pdf_uploads')
        .select('processing_status, extracted_records_count, error_message')
        .eq('id', uploadId)
        .single();

      if (error) {
        throw new Error(`Failed to get status: ${error.message}`);
      }

      return {
        status: data.processing_status as ProcessingStatus['status'],
        extractedCount: data.extracted_records_count || 0,
        error: data.error_message || undefined
      };

    } catch (error) {
      console.error('Status check error:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getExtractedData(uploadId: string): Promise<FinancialData | null> {
    try {
      // Get upload info
      const { data: upload, error: uploadError } = await supabase
        .from('pdf_uploads')
        .select('filename, created_at')
        .eq('id', uploadId)
        .single();

      if (uploadError) {
        throw new Error(`Upload not found: ${uploadError.message}`);
      }

      // Get trial balance data
      const { data: trialBalances, error: dataError } = await supabase
        .from('trial_balances')
        .select('*')
        .eq('upload_id', uploadId)
        .order('account_number');

      if (dataError) {
        throw new Error(`Failed to get data: ${dataError.message}`);
      }

      if (!trialBalances || trialBalances.length === 0) {
        return null;
      }

      // Convert to FinancialData format
      const entries = trialBalances.map((tb, index) => ({
        id: tb.id,
        date: tb.period || tb.created_at.split('T')[0],
        description: tb.account_description,
        amount: tb.balance,
        highLevelCategory: this.categorizeEntry(tb.account_description).highLevelCategory,
        mainGrouping: this.categorizeEntry(tb.account_description).mainGrouping,
        ifrsCategory: this.categorizeEntry(tb.account_description).ifrsCategory,
        originalLine: `${tb.account_number || ''} ${tb.account_description} ${tb.balance}`
      }));

      return {
        companyName: upload.filename.replace(/\.pdf$/i, ''),
        reportPeriod: trialBalances[0]?.period || upload.created_at.split('T')[0],
        lastUpdated: new Date().toISOString(),
        entries
      };

    } catch (error) {
      console.error('Data retrieval error:', error);
      return null;
    }
  }

  async getAllUploads() {
    try {
      const { data, error } = await supabase
        .from('pdf_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get uploads: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('Upload list error:', error);
      return [];
    }
  }

  private categorizeEntry(description: string) {
    const lowerDesc = description.toLowerCase();
    
    // Enhanced IFRS mapping
    const mappings = [
      // Assets
      { keywords: ['cash', 'bank'], category: 'Cash and Cash Equivalents', level: 'Assets', group: 'Current Assets' },
      { keywords: ['receivable', 'debtors'], category: 'Trade and Other Receivables', level: 'Assets', group: 'Current Assets' },
      { keywords: ['inventory', 'stock'], category: 'Inventories', level: 'Assets', group: 'Current Assets' },
      { keywords: ['property', 'plant', 'equipment', 'building', 'land'], category: 'Property, Plant and Equipment', level: 'Assets', group: 'Non-current Assets' },
      
      // Liabilities
      { keywords: ['payable', 'creditors'], category: 'Trade and Other Payables', level: 'Liabilities', group: 'Current Liabilities' },
      { keywords: ['loan', 'borrowing'], category: 'Borrowings', level: 'Liabilities', group: 'Non-current Liabilities' },
      { keywords: ['tax'], category: 'Tax Liabilities', level: 'Liabilities', group: 'Current Liabilities' },
      
      // Equity
      { keywords: ['capital', 'share'], category: 'Share Capital', level: 'Equity', group: 'Equity' },
      { keywords: ['retained', 'earnings'], category: 'Retained Earnings', level: 'Equity', group: 'Equity' },
      
      // Revenue & Expenses
      { keywords: ['revenue', 'sales', 'income'], category: 'Revenue', level: 'Revenue', group: 'Revenue' },
      { keywords: ['expense', 'cost'], category: 'General and Administrative Expenses', level: 'Expenses', group: 'Operating Expenses' },
      { keywords: ['salary', 'wage'], category: 'Employee Benefits', level: 'Expenses', group: 'Operating Expenses' }
    ];

    for (const mapping of mappings) {
      if (mapping.keywords.some(keyword => lowerDesc.includes(keyword))) {
        return {
          ifrsCategory: mapping.category,
          highLevelCategory: mapping.level as any,
          mainGrouping: mapping.group
        };
      }
    }

    return {
      ifrsCategory: 'Uncategorized',
      highLevelCategory: 'Assets' as const,
      mainGrouping: 'Current Assets'
    };
  }
}