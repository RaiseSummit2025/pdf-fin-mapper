
import { useState, useEffect } from 'react';
import { PdfUpload } from '@/components/PdfUpload';
import { ExcelProcessor } from '@/components/ExcelProcessor';
import { ExcelUpload } from '@/components/ExcelUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExcelUpload {
  id: string;
  filename: string;
  file_size: number;
  processing_status: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  total_records_count?: number;
  sheets_count?: number;
}

const UploadPage = () => {
  const [excelUploads, setExcelUploads] = useState<ExcelUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExcelUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('excel_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Excel uploads:', error);
        return;
      }

      setExcelUploads(data || []);
    } catch (error) {
      console.error('Error fetching Excel uploads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExcelUploads();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">File Upload</h1>
        <p className="text-gray-600">Upload PDF files or process Excel/CSV files to extract and analyze data</p>
      </div>

      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            PDF Upload
          </TabsTrigger>
          <TabsTrigger value="processor" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Excel Processor
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pdf" className="mt-6">
          <PdfUpload />
        </TabsContent>
        
        <TabsContent value="processor" className="mt-6">
          <div className="space-y-6">
            <ExcelUpload />
            <ExcelProcessor uploads={excelUploads} onRefresh={fetchExcelUploads} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UploadPage;
