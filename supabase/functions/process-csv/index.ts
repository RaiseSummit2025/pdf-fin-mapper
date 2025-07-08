
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVProcessingResult {
  fileName: string;
  rowCount: number;
  headers: string[];
  sampleRows: string[][];
  summary: {
    columns: number;
    hasHeaders: boolean;
  };
}

serve(async (req) => {
  console.log('Process CSV function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Environment variables check
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Processing CSV file:', file.name, 'Size:', file.size);

    // Read file content
    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse CSV (simple parsing - assumes comma-separated values)
    const rows = lines.map(line => {
      // Simple CSV parsing - handle quoted values
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    });

    // Extract headers (assume first row contains headers)
    const headers = rows[0] || [];
    const dataRows = rows.slice(1);
    
    console.log(`Parsed CSV: ${headers.length} columns, ${dataRows.length} data rows`);

    // Create an upload record for tracking
    const { data: upload, error: uploadError } = await supabase
      .from('excel_uploads')
      .insert({
        filename: file.name,
        file_size: file.size,
        processing_status: 'completed',
        sheets_count: 1,
        total_records_count: dataRows.length,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (uploadError || !upload) {
      console.error('Failed to create upload record:', uploadError);
      throw new Error(`Failed to create upload record: ${uploadError?.message || 'Unknown error'}`);
    }

    // Store raw CSV data
    for (let i = 0; i < Math.min(dataRows.length, 1000); i++) { // Limit to first 1000 rows
      const row = dataRows[i];
      if (row && row.length > 0) {
        try {
          await supabase
            .from('excel_data')
            .insert({
              upload_id: upload.id,
              sheet_name: 'CSV_Data',
              row_number: i + 2, // +2 because we skip header and arrays are 0-indexed
              column_name: 'csv_row',
              cell_value: JSON.stringify(row),
              data_type: 'array'
            });
        } catch (insertError) {
          console.error(`Error inserting row ${i + 1}:`, insertError);
        }
      }
    }

    // Try to extract financial data
    const financialEntries = extractFinancialDataFromCSV(dataRows, headers, file.name);
    
    // Insert financial data into trial_balances table
    if (financialEntries.length > 0) {
      const trialBalanceRecords = financialEntries.map(entry => ({
        upload_id: upload.id,
        account_number: entry.account_number || null,
        account_description: entry.account_description,
        debit: entry.debit || null,
        credit: entry.credit || null,
        balance: entry.balance,
        period: entry.period || null,
        page_number: null,
        confidence_score: entry.confidence_score || 0.7
      }));

      const { error: insertError } = await supabase
        .from('trial_balances')
        .insert(trialBalanceRecords);

      if (insertError) {
        console.error('Failed to insert trial balance records:', insertError);
      } else {
        console.log('Successfully inserted trial balance records:', trialBalanceRecords.length);
      }
    }

    const result: CSVProcessingResult = {
      fileName: file.name,
      rowCount: dataRows.length,
      headers: headers,
      sampleRows: dataRows.slice(0, 5), // First 5 rows as sample
      summary: {
        columns: headers.length,
        hasHeaders: true
      }
    };

    console.log('CSV processing completed successfully');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('CSV processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});

function extractFinancialDataFromCSV(rows: string[][], headers: string[], filename: string) {
  const entries = [];
  
  // Try to identify column indices for financial data
  const accountColIndex = headers.findIndex(h => 
    h.toLowerCase().includes('account')
  );
  const descriptionColIndex = headers.findIndex(h => 
    h.toLowerCase().includes('description') || h.toLowerCase().includes('name')
  );
  const debitColIndex = headers.findIndex(h => 
    h.toLowerCase().includes('debit')
  );
  const creditColIndex = headers.findIndex(h => 
    h.toLowerCase().includes('credit')
  );
  const balanceColIndex = headers.findIndex(h => 
    h.toLowerCase().includes('balance') || h.toLowerCase().includes('amount')
  );

  console.log('Column mapping:', {
    account: accountColIndex,
    description: descriptionColIndex,
    debit: debitColIndex,
    credit: creditColIndex,
    balance: balanceColIndex
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    try {
      const entry = parseCSVRow(
        row, 
        accountColIndex, 
        descriptionColIndex, 
        debitColIndex, 
        creditColIndex, 
        balanceColIndex,
        filename,
        i + 1
      );
      
      if (entry) {
        entries.push(entry);
      }
    } catch (parseError) {
      console.error(`Error parsing CSV row ${i + 1}:`, parseError);
    }
  }

  console.log(`Extracted ${entries.length} financial entries from CSV`);
  return entries;
}

function parseCSVRow(
  row: string[], 
  accountIdx: number, 
  descIdx: number, 
  debitIdx: number, 
  creditIdx: number, 
  balanceIdx: number,
  filename: string,
  rowNumber: number
) {
  const description = descIdx >= 0 ? row[descIdx]?.trim() : row[0]?.trim();
  
  if (!description || description === '') return null;

  const accountNumber = accountIdx >= 0 ? row[accountIdx]?.trim() : undefined;
  const debit = debitIdx >= 0 ? parseAmount(row[debitIdx]) : undefined;
  const credit = creditIdx >= 0 ? parseAmount(row[creditIdx]) : undefined;
  
  let balance = 0;
  if (balanceIdx >= 0) {
    balance = parseAmount(row[balanceIdx]) || 0;
  } else if (debit !== undefined || credit !== undefined) {
    balance = (debit || 0) - (credit || 0);
  }

  if (Math.abs(balance) === 0 && !debit && !credit) return null;

  return {
    account_number: accountNumber,
    account_description: description,
    debit: debit,
    credit: credit,
    balance: balance,
    period: extractPeriodFromFilename(filename),
    confidence_score: 0.7
  };
}

function parseAmount(value: string): number | undefined {
  if (!value || value.trim() === '') return undefined;
  
  let cleanValue = value.trim();
  
  // Handle negative values in parentheses
  const isNegative = cleanValue.includes('(') && cleanValue.includes(')');
  cleanValue = cleanValue.replace(/[\$£€¥₹,()]/g, '').trim();
  
  const parsed = parseFloat(cleanValue);
  if (isNaN(parsed)) return undefined;
  
  return isNegative ? -parsed : parsed;
}

function extractPeriodFromFilename(filename: string): string | undefined {
  const yearMatch = filename.match(/(\d{4})/);
  return yearMatch ? `${yearMatch[1]}-12-31` : undefined;
}
