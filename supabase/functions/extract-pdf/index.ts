import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RawFinancialEntry {
  account_number: string;
  description: string;
  date: string;
  debit?: number;
  credit?: number;
  balance: number;
  direction: 'debit' | 'credit';
  raw_line?: string;
  page_number?: number;
  confidence_score?: number;
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

    // Get upload record
    const { data: upload, error: uploadError } = await supabase
      .from('pdf_uploads')
      .select('*')
      .eq('id', upload_id)
      .single();

    if (uploadError || !upload) {
      throw new Error('Upload not found');
    }

    // Update status to processing
    await supabase
      .from('pdf_uploads')
      .update({ processing_status: 'processing' })
      .eq('id', upload_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('pdf-uploads')
      .download(upload.storage_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download PDF file');
    }

    // Convert file to array buffer for processing
    const arrayBuffer = await fileData.arrayBuffer();
    
    // Import PDF.js for server-side processing
    const pdfjs = await import('https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.mjs');
    
    // Process PDF
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const doc = await loadingTask.promise;
    
    const extractedEntries: RawFinancialEntry[] = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const textItems = textContent.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height
      }));
      
      const rows = groupTextItemsByRows(textItems);
      const pageEntries = parseTableData(rows, upload.filename, pageNum);
      extractedEntries.push(...pageEntries);
    }

    // Insert extracted data into trial_balances table
    const trialBalanceRecords = extractedEntries.map(entry => ({
      upload_id: upload_id,
      account_number: entry.account_number || null,
      account_description: entry.description,
      debit: entry.debit || null,
      credit: entry.credit || null,
      balance: entry.balance,
      period: entry.date || null,
      page_number: entry.page_number || null,
      confidence_score: entry.confidence_score || 0.8
    }));

    const { error: insertError } = await supabase
      .from('trial_balances')
      .insert(trialBalanceRecords);

    if (insertError) {
      throw new Error(`Failed to insert records: ${insertError.message}`);
    }

    // Update upload status to completed
    await supabase
      .from('pdf_uploads')
      .update({
        processing_status: 'completed',
        completed_at: new Date().toISOString(),
        extracted_records_count: extractedEntries.length
      })
      .eq('id', upload_id);

    return new Response(
      JSON.stringify({
        success: true,
        extracted_count: extractedEntries.length,
        message: 'PDF processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Update upload status to failed if upload_id exists
    const { upload_id } = await req.json().catch(() => ({}));
    if (upload_id) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('pdf_uploads')
        .update({
          processing_status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', upload_id);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions for PDF processing
function groupTextItemsByRows(textItems: any[]): any[] {
  const tolerance = 5;
  const rows: any[] = [];
  
  textItems.sort((a, b) => b.y - a.y);
  
  for (const item of textItems) {
    let foundRow = rows.find(row => Math.abs(row.y - item.y) <= tolerance);
    
    if (foundRow) {
      foundRow.items.push(item);
    } else {
      rows.push({
        y: item.y,
        items: [item]
      });
    }
  }
  
  rows.forEach(row => {
    row.items.sort((a: any, b: any) => a.x - b.x);
    row.text = row.items.map((item: any) => item.text).join(' ').trim();
  });
  
  return rows.filter(row => row.text.length > 0);
}

function parseTableData(tableRows: any[], filename: string, pageNumber: number): RawFinancialEntry[] {
  const entries: RawFinancialEntry[] = [];
  const currentDate = new Date().toISOString().split('T')[0];
  
  const periodMatch = filename.match(/(\d{4})/);
  const period = periodMatch ? `${periodMatch[1]}-12-31` : currentDate;
  
  for (const row of tableRows) {
    const text = row.text;
    if (!text || text.length < 10) continue;
    
    const parsedEntry = parseFinancialLine(text, period, pageNumber);
    if (parsedEntry) {
      entries.push(parsedEntry);
    }
  }
  
  return entries;
}

function parseFinancialLine(line: string, defaultDate: string, pageNumber: number): RawFinancialEntry | null {
  if (isHeaderLine(line)) return null;
  
  // Pattern 1: Account# Description Amount
  let match = line.match(/^(\d+)\s+(.+?)\s+([\d,.\-()$£€¥₹\s]+)$/);
  if (match) {
    const [, accountNumber, description, amountStr] = match;
    const amount = normalizeAmount(amountStr);
    
    return {
      account_number: accountNumber.trim(),
      description: description.trim(),
      date: defaultDate,
      balance: amount,
      direction: amount >= 0 ? 'debit' : 'credit',
      raw_line: line,
      page_number: pageNumber,
      confidence_score: 0.9
    };
  }
  
  // Pattern 2: Description Debit Credit
  match = line.match(/^(.+?)\s+([\d,.\-()$£€¥₹\s]+)\s+([\d,.\-()$£€¥₹\s]+)$/);
  if (match) {
    const [, description, debitStr, creditStr] = match;
    const debit = normalizeAmount(debitStr);
    const credit = normalizeAmount(creditStr);
    const balance = debit - credit;
    
    return {
      account_number: extractAccountNumber(description) || '',
      description: cleanDescription(description),
      date: defaultDate,
      debit,
      credit,
      balance,
      direction: balance >= 0 ? 'debit' : 'credit',
      raw_line: line,
      page_number: pageNumber,
      confidence_score: 0.8
    };
  }
  
  // Pattern 3: Simple Description Amount
  match = line.match(/^(.+?)\s+([\d,.\-()$£€¥₹\s]+)$/);
  if (match) {
    const [, description, amountStr] = match;
    const amount = normalizeAmount(amountStr);
    
    if (Math.abs(amount) > 100) {
      return {
        account_number: extractAccountNumber(description) || '',
        description: cleanDescription(description),
        date: defaultDate,
        balance: amount,
        direction: amount >= 0 ? 'debit' : 'credit',
        raw_line: line,
        page_number: pageNumber,
        confidence_score: 0.7
      };
    }
  }
  
  return null;
}

function normalizeAmount(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  let cleanValue = String(value).trim();
  
  const isNegative = cleanValue.includes('(') && cleanValue.includes(')');
  cleanValue = cleanValue.replace(/[\$£€¥₹,()]/g, '');
  
  const parsed = parseFloat(cleanValue);
  if (isNaN(parsed)) return 0;
  
  return isNegative ? -parsed : parsed;
}

function isHeaderLine(line: string): boolean {
  const lowerLine = line.toLowerCase();
  const headerKeywords = [
    'trial balance', 'balance sheet', 'income statement', 'profit and loss',
    'account number', 'description', 'debit', 'credit', 'balance',
    'total', 'subtotal', 'page', 'date:', 'period:', 'company'
  ];
  
  return headerKeywords.some(keyword => lowerLine.includes(keyword)) ||
         line.trim().length < 5 ||
         /^[\s\-_=]+$/.test(line);
}

function extractAccountNumber(description: string): string | null {
  const match = description.match(/^(\d{3,6})\s*/);
  return match ? match[1] : null;
}

function cleanDescription(description: string): string {
  return description
    .replace(/^\d{3,6}\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}