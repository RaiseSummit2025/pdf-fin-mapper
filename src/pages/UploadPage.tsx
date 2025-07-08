
import { PdfUpload } from '@/components/PdfUpload';
import ExcelProcessor from '@/components/ExcelProcessor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Zap } from 'lucide-react';

const UploadPage = () => {
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
          <ExcelProcessor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UploadPage;
