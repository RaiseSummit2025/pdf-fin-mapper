import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as XLSX from 'https://cdn.skypack.dev/xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialEntry {
  account_number?: string;
  account_description: string;
  debit?: number;
  credit?: number;
  balance: number;
  period?: string;
  confidence_score?: number;
  sheet_name: string;
  row_number: number;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { upload_id } = await req.json();
    
    if (!upload_id) {
      throw new Error('Upload ID is required');
    }

    console.log('Processing Excel upload:', upload_id);

    // Get upload record
    const { data: upload, error: uploadError } = await supabase
      .from('excel_uploads')
      .select('*')
      .eq('id', upload_id)
      .single();

    if (uploadError || !upload) {
      console.error('Upload not found:', uploadError);
      throw new Error('Upload not found');
    }

    // Update status to processing
    await supabase
      .from('excel_uploads')
      .update({ processing_status: 'processing' })
      .eq('id', upload_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('excel-uploads')
      .download(upload.storage_path);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      throw new Error('Failed to download Excel file');
    }

    console.log('Downloaded file:', upload.filename, 'Size:', fileData.size);

    // Convert file to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    
    // Parse Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log('Excel sheets found:', workbook.SheetNames);
    
    let totalRecords = 0;
    const financialEntries: FinancialEntry[] = [];
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log('Processing sheet:', sheetName);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log(`Sheet ${sheetName} has ${jsonData.length} rows`);
      
      // Store raw data in excel_data table
      for (let i = 0; i < jsonData.length; i++) {
        const rowData = jsonData[i] as any[];
        if (rowData && rowData.length > 0) {
          await supabase
            .from('excel_data')
            .insert({
              upload_id: upload_id,
              sheet_name: sheetName,
              row_number: i + 1,
              column_name: 'row_data',
              cell_value: JSON.stringify(rowData),
              data_type: 'array'
            });
          totalRecords++;
        }
      }
      
      // Try to extract financial data
      const sheetFinancials = extractFinancialData(jsonData, sheetName, upload.filename);
      financialEntries.push(...sheetFinancials);
    }

    console.log('Extracted financial entries:', financialEntries.length);

    // Insert financial data into trial_balances table
    if (financialEntries.length > 0) {
      const trialBalanceRecords = financialEntries.map(entry => ({
        upload_id: upload_id,
        account_number: entry.account_number || null,
        account_description: entry.account_description,
        debit: entry.debit || null,
        credit: entry.credit || null,
        balance: entry.balance,
        period: entry.period || null,
        page_number: null, // Excel doesn't have pages
        confidence_score: entry.confidence_score || 0.8
      }));

      const { error: insertError } = await supabase
        .from('trial_balances')
        .insert(trialBalanceRecords);

      if (insertError) {
        console.error('Failed to insert trial balance records:', insertError);
        throw new Error(`Failed to insert trial balance records: ${insertError.message}`);
      }

      console.log('Inserted trial balance records:', trialBalanceRecords.length);
    }

    // Update upload status to completed
    await supabase
      .from('excel_uploads')
      .update({
        processing_status: 'completed',
        completed_at: new Date().toISOString(),
        total_records_count: totalRecords,
        sheets_count: workbook.SheetNames.length
      })
      .eq('id', upload_id);

    console.log('Excel processing completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        total_records_count: totalRecords,
        sheets_count: workbook.SheetNames.length,
        financial_entries_count: financialEntries.length,
        message: 'Excel file processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Excel processing error:', error);
    
    // Try to get upload_id from request for error updating
    try {
      const body = await req.json();
      const { upload_id } = body;
      
      if (upload_id) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('excel_uploads')
          .update({
            processing_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', upload_id);
      }
    } catch (updateError) {
      console.error('Error updating upload status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to extract financial data from Excel rows
function extractFinancialData(rows: any[][], sheetName: string, filename: string): FinancialEntry[] {
  const entries: FinancialEntry[] = [];
  
  // Skip first few rows that might be headers
  let dataStartRow = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    if (row && row.length > 0) {
      const firstCell = String(row[0] || '').toLowerCase();
      if (firstCell.includes('account') || firstCell.includes('description') || 
          firstCell.includes('debit') || firstCell.includes('credit') ||
          firstCell.includes('balance')) {
        dataStartRow = i + 1;
        break;
      }
    }
  }

  console.log(`Starting data extraction from row ${dataStartRow} in sheet ${sheetName}`);

  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const entry = parseExcelRow(row, sheetName, i + 1, filename);
    if (entry) {
      entries.push(entry);
    }
  }

  console.log(`Extracted ${entries.length} financial entries from sheet ${sheetName}`);
  return entries;
}

function parseExcelRow(row: any[], sheetName: string, rowNumber: number, filename: string): FinancialEntry | null {
  // Try to detect different Excel formats
  
  // Format 1: Account Number | Description | Balance
  if (row.length >= 3) {
    const accountNum = String(row[0] || '').trim();
    const description = String(row[1] || '').trim();
    const balance = normalizeExcelAmount(row[2]);
    
    if (description && !isNaN(balance) && Math.abs(balance) > 0) {
      return {
        account_number: accountNum || undefined,
        account_description: description,
        balance: balance,
        period: extractPeriodFromFilename(filename),
        confidence_score: 0.8,
        sheet_name: sheetName,
        row_number: rowNumber
      };
    }
  }

  // Format 2: Description | Debit | Credit
  if (row.length >= 3) {
    const description = String(row[0] || '').trim();
    const debit = normalizeExcelAmount(row[1]);
    const credit = normalizeExcelAmount(row[2]);
    
    if (description && (!isNaN(debit) || !isNaN(credit))) {
      const balance = (isNaN(debit) ? 0 : debit) - (isNaN(credit) ? 0 : credit);
      
      return {
        account_description: description,
        debit: isNaN(debit) ? undefined : debit,
        credit: isNaN(credit) ? undefined : credit,
        balance: balance,
        period: extractPeriodFromFilename(filename),
        confidence_score: 0.7,
        sheet_name: sheetName,
        row_number: rowNumber
      };
    }
  }

  // Format 3: Account | Description | Debit | Credit | Balance
  if (row.length >= 5) {
    const accountNum = String(row[0] || '').trim();
    const description = String(row[1] || '').trim();
    const debit = normalizeExcelAmount(row[2]);
    const credit = normalizeExcelAmount(row[3]);
    const balance = normalizeExcelAmount(row[4]);
    
    if (description && !isNaN(balance)) {
      return {
        account_number: accountNum || undefined,
        account_description: description,
        debit: isNaN(debit) ? undefined : debit,
        credit: isNaN(credit) ? undefined : credit,
        balance: balance,
        period: extractPeriodFromFilename(filename),
        confidence_score: 0.9,
        sheet_name: sheetName,
        row_number: rowNumber
      };
    }
  }

  return null;
}

function normalizeExcelAmount(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return NaN;
  
  let cleanValue = String(value).trim();
  
  // Handle negative values in parentheses
  const isNegative = cleanValue.includes('(') && cleanValue.includes(')');
  cleanValue = cleanValue.replace(/[\$£€¥₹,()]/g, '').trim();
  
  const parsed = parseFloat(cleanValue);
  if (isNaN(parsed)) return NaN;
  
  return isNegative ? -parsed : parsed;
}

function extractPeriodFromFilename(filename: string): string | undefined {
  const yearMatch = filename.match(/(\d{4})/);
  return yearMatch ? `${yearMatch[1]}-12-31` : undefined;
}