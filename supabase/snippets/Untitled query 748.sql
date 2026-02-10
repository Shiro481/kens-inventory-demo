-- New fields added to sales table
ALTER TABLE "sales" 
ADD COLUMN receipt_number TEXT UNIQUE,
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_email TEXT,
ADD COLUMN transaction_status TEXT DEFAULT 'completed',
ADD COLUMN staff_id TEXT,
ADD COLUMN notes TEXT;