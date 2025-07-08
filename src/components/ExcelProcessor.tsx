
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import * as XLSX from 'xlsx';

function ExcelProcessor() {
  const { addExcelData } = useFinancialData();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [conversionStatus, setConversionStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOriginalFileName(selectedFile.name);
      setError(null);
      setResult(null);
      setConversionStatus('');
    }
  };

  const convertExcelToCSV = async (excelFile: File) => {
    try {
      setConversionStatus('Reading Excel file...');
      
      const buffer = await excelFile.arrayBuffer();
      
      setConversionStatus('Converting Excel to worksheet...');
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      setConversionStatus('Converting worksheet to CSV...');
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      
      const csvFile = new File([csvContent], excelFile.name.replace(/\.(xlsx|xls)$/i, '.csv'), {
        type: 'text/csv',
      });
      
      setConversionStatus('Excel successfully converted to CSV');
      return csvFile;
    } catch (error: any) {
      console.error('Error converting Excel to CSV:', error);
      setConversionStatus('');
      throw new Error(`Failed to convert Excel to CSV: ${error.message}`);
    }
  };

  const processFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setProcessing(true);
    setError(null);
    
    try {
      let fileToProcess = file;
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        console.log('Converting Excel file to CSV...');
        fileToProcess = await convertExcelToCSV(file);
        console.log('Conversion complete');
      } else if (!file.name.endsWith('.csv')) {
        throw new Error('Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      }
      
      const formData = new FormData();
      formData.append('file', fileToProcess);
      
      setConversionStatus('Sending CSV to server for processing...');
      
      const { data, error: functionError } = await supabase.functions.invoke('process-csv', {
        body: formData,
      });
      
      if (functionError) throw functionError;
      
      console.log('File processed successfully:', data);
      setResult(data);
      setConversionStatus('');
      
      // Add the processed data to the financial context
      addExcelData(originalFileName, data);
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process file');
      setConversionStatus('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Excel/CSV File Processor</h2>
      
      <div className="flex gap-4 mb-6">
        <input 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          onChange={handleFileChange} 
          disabled={processing}
          className="flex-1 p-2 border border-border rounded-md"
        />
        <button 
          onClick={processFile} 
          disabled={!file || processing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : 'Process File'}
        </button>
      </div>
      
      {file && (
        <div className="bg-muted p-4 rounded-md mb-6">
          <p><strong>Selected file:</strong> {originalFileName}</p>
          <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
          <p><strong>Type:</strong> {file.type || 'Unknown'}</p>
        </div>
      )}
      
      {conversionStatus && (
        <div className="bg-green-50 p-4 rounded-md mb-6">
          <p className="text-green-800">{conversionStatus}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <h3 className="font-semibold text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-green-50 p-4 rounded-md">
          <h3 className="font-semibold text-green-800 mb-4">Processing Complete!</h3>
          <p><strong>File:</strong> {result.fileName} (Originally: {originalFileName})</p>
          <p><strong>Rows:</strong> {result.rowCount}</p>
          <p><strong>Columns:</strong> {result.summary?.columns}</p>
          
          {result.headers && (
            <>
              <h4 className="font-semibold mt-4 mb-2">Headers</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {result.headers.map((header: string, index: number) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{header}</span>
                ))}
              </div>
            </>
          )}
          
          {result.sampleRows && (
            <>
              <h4 className="font-semibold mt-4 mb-2">Sample Data (First 5 Rows)</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      {result.headers?.map((header: string, index: number) => (
                        <th key={index} className="border border-border p-2 text-left">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.sampleRows.map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="border border-border p-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          <p className="mt-4 text-green-700">
            ✅ Data has been processed and is now available in the Dashboard, Underlying Data, Mapping, and Financial Statements sections.
          </p>
        </div>
      )}
    </div>
  );
}

export default ExcelProcessor;
