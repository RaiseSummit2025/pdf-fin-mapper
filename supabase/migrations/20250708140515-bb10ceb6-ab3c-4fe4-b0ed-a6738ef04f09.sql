
-- Create excel_uploads table
CREATE TABLE public.excel_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT,
  processing_status TEXT DEFAULT 'pending',
  error_message TEXT,
  sheets_count INTEGER,
  total_records_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create pdf_uploads table
CREATE TABLE public.pdf_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  processing_status TEXT DEFAULT 'pending',
  error_message TEXT,
  extracted_records_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create excel_data table
CREATE TABLE public.excel_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.excel_uploads(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  column_name TEXT,
  cell_value TEXT,
  data_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trial_balances table
CREATE TABLE public.trial_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.excel_uploads(id) ON DELETE CASCADE,
  account_number TEXT,
  account_description TEXT NOT NULL,
  debit DECIMAL,
  credit DECIMAL,
  balance DECIMAL NOT NULL,
  period TEXT,
  page_number INTEGER,
  confidence_score DECIMAL DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('excel-uploads', 'excel-uploads', false),
  ('pdf-uploads', 'pdf-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (basic policies for now)
ALTER TABLE public.excel_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_balances ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (you may want to restrict these later)
CREATE POLICY "Allow all operations on excel_uploads" ON public.excel_uploads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on pdf_uploads" ON public.pdf_uploads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on excel_data" ON public.excel_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on trial_balances" ON public.trial_balances FOR ALL USING (true) WITH CHECK (true);

-- Create storage policies
CREATE POLICY "Allow all operations on excel-uploads bucket" ON storage.objects FOR ALL USING (bucket_id = 'excel-uploads') WITH CHECK (bucket_id = 'excel-uploads');
CREATE POLICY "Allow all operations on pdf-uploads bucket" ON storage.objects FOR ALL USING (bucket_id = 'pdf-uploads') WITH CHECK (bucket_id = 'pdf-uploads');
