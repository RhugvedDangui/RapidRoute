-- Create batches table for RapidRoute
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ,
  total_orders INTEGER,
  estimated_distance NUMERIC,
  estimated_time INTEGER,
  estimated_cost NUMERIC
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_batches_created_at ON batches(created_at);

-- Disable RLS for development (or create appropriate policies)
ALTER TABLE batches DISABLE ROW LEVEL SECURITY;
