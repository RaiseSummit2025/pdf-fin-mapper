-- Create excel_uploads table
CREATE TABLE public.excel_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  storage_path TEXT,
  processing_status TEXT DEFAULT 'pending',
  file_size INTEGER,
  error_message TEXT,
  records_count INTEGER DEFAULT 0,
  sheets_count INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create excel_data table
CREATE TABLE public.excel_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID NOT NULL REFERENCES public.excel_uploads(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.excel_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (similar to existing PDF tables)
CREATE POLICY "Allow all operations on excel_uploads" 
ON public.excel_uploads 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on excel_data" 
ON public.excel_data 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create storage bucket for excel uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('excel-uploads', 'excel-uploads', false);

-- Create storage policies for excel uploads
CREATE POLICY "Allow all operations on excel storage" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'excel-uploads') 
WITH CHECK (bucket_id = 'excel-uploads');

-- Create indexes for better performance
CREATE INDEX idx_excel_data_upload_id ON public.excel_data(upload_id);
CREATE INDEX idx_excel_data_sheet_name ON public.excel_data(sheet_name);
CREATE INDEX idx_excel_uploads_created_at ON public.excel_uploads(created_at);