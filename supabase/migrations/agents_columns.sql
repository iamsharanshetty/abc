-- Migration: Add missing columns to agents table
-- This migration adds the website_url, updated_at, system_prompt, and metadata columns
-- that are expected by the Agent TypeScript interface

-- Add website_url column (required)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS website_url TEXT NOT NULL DEFAULT '';

-- Add updated_at column with auto-update trigger
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add system_prompt column (optional)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS system_prompt TEXT;

-- Add metadata column (optional JSONB)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create or replace function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON agents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to populate website_url from settings if available
-- This assumes the URL is stored in settings.url
UPDATE agents 
SET website_url = COALESCE(
    (settings->>'url')::TEXT,
    ''
)
WHERE website_url = '';

-- Add comment to document the schema
COMMENT ON COLUMN agents.website_url IS 'The website URL that this agent is trained on';
COMMENT ON COLUMN agents.updated_at IS 'Timestamp of last update, automatically maintained';
COMMENT ON COLUMN agents.system_prompt IS 'Optional custom system prompt override';
COMMENT ON COLUMN agents.metadata IS 'Optional additional metadata as JSONB';