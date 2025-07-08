import { PdfUpload } from '@/components/PdfUpload';
import { ExcelUpload } from '@/components/ExcelUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, FileSpreadsheet } from 'lucide-react';

const UploadPage = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">File Upload</h1>
        <p className="text-gray-600">Upload PDF files or Excel/CSV files to extract and analyze data</p>
      </div>

      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            PDF Upload
          </TabsTrigger>
          <TabsTrigger value="excel" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Excel/CSV Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pdf" className="mt-6">
          <PdfUpload />
        </TabsContent>
        
        <TabsContent value="excel" className="mt-6">
          <ExcelUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UploadPage;