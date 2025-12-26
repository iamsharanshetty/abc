-- Migration: Create agents, conversations and leads tables with RLS
-- Date: 2025-01-01
-- Description: Core tables for AI agents, conversation history, and lead capture

-- ============================================
-- PART 1: Create Agents Table
-- ============================================

-- Create agents table (must be first due to foreign key dependencies)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sales', 'support', 'training')),
  system_prompt TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'training')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add comments for agents table
COMMENT ON TABLE agents IS 'AI agents configured for different websites and roles';
COMMENT ON COLUMN agents.id IS 'Unique agent identifier (user-generated or UUID)';
COMMENT ON COLUMN agents.user_id IS 'Owner of the agent (reference to auth.users)';
COMMENT ON COLUMN agents.name IS 'Human-readable name for the agent';
COMMENT ON COLUMN agents.website_url IS 'Website URL this agent is trained on';
COMMENT ON COLUMN agents.role IS 'Agent role: sales, support, or training';
COMMENT ON COLUMN agents.system_prompt IS 'Custom system prompt for agent behavior';
COMMENT ON COLUMN agents.status IS 'Agent status: active, inactive, or training';
COMMENT ON COLUMN agents.metadata IS 'Additional configuration (features, limits, etc.)';

-- ============================================
-- PART 2: Create Conversations Table
-- ============================================

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add comments for conversations table
COMMENT ON TABLE conversations IS 'Chat conversation history for all agents';
COMMENT ON COLUMN conversations.id IS 'Unique conversation identifier';
COMMENT ON COLUMN conversations.agent_id IS 'Agent that handled this conversation';
COMMENT ON COLUMN conversations.user_message IS 'User input message';
COMMENT ON COLUMN conversations.assistant_response IS 'Agent response message';
COMMENT ON COLUMN conversations.metadata IS 'Additional data (IP, user agent, session info, etc.)';

-- ============================================
-- PART 3: Create Leads Table
-- ============================================

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  interest TEXT,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new',
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_to_webhook BOOLEAN DEFAULT FALSE,
  webhook_sent_at TIMESTAMP WITH TIME ZONE
);

-- Add comments for leads table
COMMENT ON TABLE leads IS 'Captured leads from agent conversations';
COMMENT ON COLUMN leads.id IS 'Unique lead identifier (auto-generated UUID)';
COMMENT ON COLUMN leads.agent_id IS 'Agent that captured this lead';
COMMENT ON COLUMN leads.conversation_id IS 'Conversation where lead was captured (nullable)';
COMMENT ON COLUMN leads.name IS 'Lead contact name';
COMMENT ON COLUMN leads.email IS 'Lead email address';
COMMENT ON COLUMN leads.phone IS 'Lead phone number';
COMMENT ON COLUMN leads.company IS 'Lead company/organization';
COMMENT ON COLUMN leads.interest IS 'Lead interest or inquiry details';
COMMENT ON COLUMN leads.status IS 'Lead status (new, contacted, qualified, etc.)';
COMMENT ON COLUMN leads.sent_to_webhook IS 'Whether lead was sent to external webhook';
COMMENT ON COLUMN leads.webhook_sent_at IS 'Timestamp when webhook was triggered';

-- ============================================
-- PART 4: Create Indexes for Performance
-- ============================================

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_website_url ON agents(website_url);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at DESC);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_created ON conversations(agent_id, created_at DESC);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_captured_at ON leads(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_conversation_id ON leads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_leads_webhook_pending ON leads(agent_id, sent_to_webhook) 
  WHERE sent_to_webhook = FALSE;

-- ============================================
-- PART 5: Create Vector Search Function
-- ============================================

-- Function for semantic similarity search using pgvector
CREATE OR REPLACE FUNCTION match_website_content(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  website_url_filter text
)
RETURNS TABLE (
  id bigint,
  content_section text,
  page_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    website_embeddings.id,
    website_embeddings.content_section,
    website_embeddings.page_url,
    1 - (website_embeddings.embedding <=> query_embedding) as similarity
  FROM website_embeddings
  WHERE website_embeddings.website_url = website_url_filter
    AND 1 - (website_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY website_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_website_content IS 'Searches for semantically similar content using vector embeddings';

-- ============================================
-- PART 6: Create Helper Functions
-- ============================================

-- Function to get agent statistics
CREATE OR REPLACE FUNCTION get_agent_stats(p_agent_id TEXT)
RETURNS TABLE (
  total_conversations BIGINT,
  total_leads BIGINT,
  leads_today BIGINT,
  conversations_today BIGINT,
  avg_response_length NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM conversations WHERE agent_id = p_agent_id) as total_conversations,
    (SELECT COUNT(*) FROM leads WHERE agent_id = p_agent_id) as total_leads,
    (SELECT COUNT(*) FROM leads WHERE agent_id = p_agent_id AND captured_at >= CURRENT_DATE) as leads_today,
    (SELECT COUNT(*) FROM conversations WHERE agent_id = p_agent_id AND created_at >= CURRENT_DATE) as conversations_today,
    (SELECT AVG(LENGTH(assistant_response)) FROM conversations WHERE agent_id = p_agent_id) as avg_response_length;
END;
$$;

-- Function to get leads pending webhook delivery
CREATE OR REPLACE FUNCTION get_leads_pending_webhook(p_agent_id TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  agent_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  captured_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.agent_id,
    l.name,
    l.email,
    l.phone,
    l.company,
    l.captured_at
  FROM leads l
  WHERE 
    l.sent_to_webhook = FALSE
    AND (p_agent_id IS NULL OR l.agent_id = p_agent_id)
  ORDER BY l.captured_at DESC;
END;
$$;

-- ============================================
-- PART 7: Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 8: Create RLS Policies for Agents
-- ============================================

-- Policy: Users can view their own agents
CREATE POLICY "Users can view their own agents"
  ON agents FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can create their own agents
CREATE POLICY "Users can create their own agents"
  ON agents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own agents
CREATE POLICY "Users can update their own agents"
  ON agents FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own agents
CREATE POLICY "Users can delete their own agents"
  ON agents FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- PART 9: Create RLS Policies for Conversations
-- ============================================

-- Policy: Users can view conversations for their agents
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Policy: System can insert conversations (public API access)
CREATE POLICY "System can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

-- Policy: Users can delete their conversations
CREATE POLICY "Users can delete their conversations"
  ON conversations FOR DELETE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PART 10: Create RLS Policies for Leads
-- ============================================

-- Policy: Users can view leads for their agents
CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Policy: System can insert leads (public API access)
CREATE POLICY "System can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their leads
CREATE POLICY "Users can update their own leads"
  ON leads FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their leads
CREATE POLICY "Users can delete their own leads"
  ON leads FOR DELETE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PART 11: Verification Queries
-- ============================================

-- Check agents table structure
DO $$ 
BEGIN
  RAISE NOTICE 'Verifying agents table...';
END $$;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'agents'
ORDER BY ordinal_position;

-- Check conversations table structure
DO $$ 
BEGIN
  RAISE NOTICE 'Verifying conversations table...';
END $$;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Check leads table structure
DO $$ 
BEGIN
  RAISE NOTICE 'Verifying leads table...';
END $$;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Verify indexes
DO $$ 
BEGIN
  RAISE NOTICE 'Verifying indexes...';
END $$;

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('agents', 'conversations', 'leads')
ORDER BY tablename, indexname;

-- Verify RLS policies
DO $$ 
BEGIN
  RAISE NOTICE 'Verifying RLS policies...';
END $$;

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('agents', 'conversations', 'leads')
ORDER BY tablename, policyname;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Created tables: agents, conversations, leads';
  RAISE NOTICE '🔍 Created 15+ indexes for optimal performance';
  RAISE NOTICE '🔐 Enabled RLS with comprehensive policies';
  RAISE NOTICE '⚙️  Created helper functions for stats and webhooks';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Next steps:';
  RAISE NOTICE '   1. Test creating an agent via your API';
  RAISE NOTICE '   2. Test conversation logging';
  RAISE NOTICE '   3. Test lead capture workflow';
  RAISE NOTICE '   4. Configure webhook endpoints';
END $$;