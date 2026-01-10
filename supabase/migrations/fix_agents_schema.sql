-- Migration: Fix agents table schema to use UUID with auto-generation
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing table if there are conflicts (CAREFUL: This deletes data!)
-- Only run this if you're in development and can afford to lose test data
-- DROP TABLE IF EXISTS leads CASCADE;
-- DROP TABLE IF EXISTS conversations CASCADE;
-- DROP TABLE IF EXISTS agents CASCADE;

-- Step 2: Create agents table with proper UUID auto-generation
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  website_url text NOT NULL,
  role text NOT NULL CHECK (role IN ('sales', 'support', 'training', 'custom')),
  system_prompt text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'training')),
  settings jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 3: Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON agents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_website_url ON agents(website_url);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at DESC);

-- Step 5: Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
CREATE POLICY "Users can view their own agents"
  ON agents FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own agents" ON agents;
CREATE POLICY "Users can create their own agents"
  ON agents FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
CREATE POLICY "Users can update their own agents"
  ON agents FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;
CREATE POLICY "Users can delete their own agents"
  ON agents FOR DELETE
  USING (user_id = auth.uid());

-- Step 7: Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'agents'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Agents table schema fixed!';
  RAISE NOTICE '📋 ID column: uuid with auto-generation';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Triggers configured';
END $$;