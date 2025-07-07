
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { FileText, Trash2, Calendar, Building } from 'lucide-react';
import { format } from 'date-fns';

export function FileSelector() {
  const { files, selectedFileId, selectFile, removeFile } = useFinancialData();
  const [showDetails, setShowDetails] = useState(false);

  const selectedFile = files.find(f => f.id === selectedFileId);

  if (files.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No Files Uploaded</p>
          <p className="text-muted-foreground">Upload a PDF file to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selected File
          </span>
          <Badge variant="outline">{files.length} file{files.length !== 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedFileId || ''} onValueChange={selectFile}>
              <SelectTrigger>
                <SelectValue placeholder="Select a file" />
              </SelectTrigger>
              <SelectContent>
                {files.map((file) => (
                  <SelectItem key={file.id} value={file.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{file.filename}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        {showDetails && selectedFile && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Upload Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedFile.uploadDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.data.companyName || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Entries</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.data.entries.length} items
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Report Period: {selectedFile.data.reportPeriod || 'Not specified'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFile(selectedFile.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
