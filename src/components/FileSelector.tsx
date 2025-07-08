
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { supabase } from '@/integrations/supabase/client';
import { FileSpreadsheet, FileText } from 'lucide-react';

interface FileOption {
  id: string;
  name: string;
  type: 'pdf' | 'excel';
  status: string;
  uploadedAt: string;
  recordCount?: number;
}

export function FileSelector() {
  const { selectedFileId, setSelectedFile } = useFinancialData();
  const [files, setFiles] = useState<FileOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      // Fetch PDF uploads
      const { data: pdfData, error: pdfError } = await supabase
        .from('pdf_uploads')
        .select('*')
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: false });

      // Fetch Excel uploads
      const { data: excelData, error: excelError } = await supabase
        .from('excel_uploads')
        .select('*')
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: false });

      if (pdfError) console.error('Error fetching PDF files:', pdfError);
      if (excelError) console.error('Error fetching Excel files:', excelError);

      const fileOptions: FileOption[] = [];

      // Add PDF files
      if (pdfData) {
        pdfData.forEach(pdf => {
          fileOptions.push({
            id: pdf.id,
            name: pdf.filename,
            type: 'pdf',
            status: pdf.processing_status,
            uploadedAt: pdf.created_at,
            recordCount: pdf.extracted_records_count || undefined
          });
        });
      }

      // Add Excel files
      if (excelData) {
        excelData.forEach(excel => {
          fileOptions.push({
            id: excel.id,
            name: excel.filename,
            type: 'excel',
            status: excel.processing_status,
            uploadedAt: excel.created_at,
            recordCount: excel.total_records_count || undefined
          });
        });
      }

      // Sort by upload date (most recent first)
      fileOptions.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      setFiles(fileOptions);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileSelect = async (fileId: string) => {
    const selectedFile = files.find(f => f.id === fileId);
    if (!selectedFile) return;

    try {
      if (selectedFile.type === 'excel') {
        // Fetch Excel data and convert to financial entries
        const { data: excelData, error } = await supabase
          .from('excel_data')
          .select('*')
          .eq('upload_id', fileId);

        if (error) {
          console.error('Error fetching Excel data:', error);
          return;
        }

        // Convert Excel data to financial entries format
        const entries = excelData?.map((row, index) => ({
          id: row.id,
          date: row.cell_value?.includes('2022') || row.cell_value?.includes('2023') || row.cell_value?.includes('2024') 
            ? row.cell_value.split(';')[0] || '2024-01-01' 
            : '2024-01-01',
          description: row.cell_value?.split(';')[2] || row.cell_value || 'Unknown',
          amount: parseFloat(row.cell_value?.split(';')[6] || '0') || 0,
          highLevelCategory: determineCategory(row.cell_value?.split(';')[2] || ''),
          mainGrouping: determineMainGrouping(row.cell_value?.split(';')[2] || ''),
          ifrsCategory: determineIFRSCategory(row.cell_value?.split(';')[2] || ''),
          originalLine: row.cell_value || ''
        })) || [];

        const financialData = {
          companyName: 'Processed Excel Data',
          reportPeriod: '2024',
          entries,
          lastUpdated: new Date().toISOString()
        };

        setSelectedFile(fileId, financialData);
      } else {
        // Handle PDF files (existing logic)
        const { data: trialBalances, error } = await supabase
          .from('trial_balances')
          .select('*')
          .eq('upload_id', fileId);

        if (error) {
          console.error('Error fetching trial balances:', error);
          return;
        }

        const entries = trialBalances?.map(tb => ({
          id: tb.id,
          date: '2024-01-01',
          description: tb.account_description,
          amount: tb.balance,
          highLevelCategory: determineCategory(tb.account_description),
          mainGrouping: determineMainGrouping(tb.account_description),
          ifrsCategory: determineIFRSCategory(tb.account_description),
          originalLine: `${tb.account_number || ''} ${tb.account_description}`.trim()
        })) || [];

        const financialData = {
          companyName: 'Processed PDF Data',
          reportPeriod: '2024',
          entries,
          lastUpdated: new Date().toISOString()
        };

        setSelectedFile(fileId, financialData);
      }
    } catch (error) {
      console.error('Error processing file selection:', error);
    }
  };

  // Helper functions to determine categories
  const determineCategory = (description: string): 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses' => {
    const desc = description.toLowerCase();
    if (desc.includes('asset') || desc.includes('cash') || desc.includes('inventory') || desc.includes('receivable')) return 'Assets';
    if (desc.includes('liability') || desc.includes('payable') || desc.includes('debt') || desc.includes('loan')) return 'Liabilities';
    if (desc.includes('equity') || desc.includes('capital') || desc.includes('retained')) return 'Equity';
    if (desc.includes('revenue') || desc.includes('income') || desc.includes('sales')) return 'Revenue';
    return 'Expenses';
  };

  const determineMainGrouping = (description: string): string => {
    const category = determineCategory(description);
    const desc = description.toLowerCase();
    
    if (category === 'Assets') {
      return desc.includes('current') || desc.includes('cash') || desc.includes('inventory') ? 'Current Assets' : 'Non-current Assets';
    }
    if (category === 'Liabilities') {
      return desc.includes('current') || desc.includes('short') ? 'Current Liabilities' : 'Non-current Liabilities';
    }
    return category;
  };

  const determineIFRSCategory = (description: string): string => {
    const desc = description.toLowerCase();
    if (desc.includes('cash')) return 'Cash and cash equivalents';
    if (desc.includes('inventory')) return 'Inventories';
    if (desc.includes('receivable')) return 'Trade and other receivables';
    if (desc.includes('payable')) return 'Trade and other payables';
    if (desc.includes('revenue')) return 'Revenue';
    if (desc.includes('expense')) return 'Operating expenses';
    return 'Other';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading files...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select File</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedFileId || ''} onValueChange={handleFileSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a processed file to analyze" />
          </SelectTrigger>
          <SelectContent>
            {files.map((file) => (
              <SelectItem key={file.id} value={file.id}>
                <div className="flex items-center gap-2 w-full">
                  {file.type === 'pdf' ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  <span className="flex-1 truncate">{file.name}</span>
                  {file.recordCount && (
                    <Badge variant="secondary" className="ml-2">
                      {file.recordCount} records
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {files.length === 0 && (
          <div className="mt-4 text-center text-muted-foreground">
            <p>No processed files available</p>
            <p className="text-sm mt-1">Upload and process PDF or Excel files to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
