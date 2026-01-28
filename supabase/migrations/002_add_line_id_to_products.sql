-- Add line_id to products table to link products to specific production lines
-- Run this in your Supabase SQL Editor

-- Add line_id column to products
ALTER TABLE products
ADD COLUMN line_id UUID REFERENCES lines(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_products_line_id ON products(line_id);

-- Update RLS policy for products to include line relationship
-- (existing policies remain valid as they check is_active)
