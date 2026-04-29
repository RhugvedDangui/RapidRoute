-- Create routes table for RapidRoute Phase 2
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  batch_id TEXT,
  order_sequence TEXT,
  total_distance NUMERIC,
  total_time INTEGER,
  polyline TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_routes_batch_id ON routes(batch_id);

-- Disable RLS for development (or create appropriate policies)
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
