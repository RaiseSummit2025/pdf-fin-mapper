-- Create storage bucket for Excel files
INSERT INTO storage.buckets (id, name, public) VALUES ('excel-uploads', 'excel-uploads', false);

-- Create policies for Excel uploads storage bucket
CREATE POLICY "Allow all operations on excel-uploads bucket" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'excel-uploads');

-- Create table for tracking Excel file uploads
CREATE TABLE public.excel_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  storage_path TEXT,
  file_size INTEGER,
  processing_status TEXT DEFAULT 'pending',
  error_message TEXT,
  sheets_count INTEGER DEFAULT 0,
  total_records_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.excel_uploads ENABLE ROW LEVEL SECURITY;

-- Create policy for excel_uploads
CREATE POLICY "Allow all operations on excel_uploads" 
ON public.excel_uploads 
FOR ALL 
USING (true);

-- Create table for storing extracted Excel data
CREATE TABLE public.excel_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID NOT NULL,
  sheet_name TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  column_name TEXT,
  cell_value TEXT,
  data_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.excel_data ENABLE ROW LEVEL SECURITY;

-- Create policy for excel_data
CREATE POLICY "Allow all operations on excel_data" 
ON public.excel_data 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_excel_data_upload_id ON public.excel_data(upload_id);
CREATE INDEX idx_excel_data_sheet_name ON public.excel_data(sheet_name);
CREATE INDEX idx_excel_data_row_number ON public.excel_data(row_number);