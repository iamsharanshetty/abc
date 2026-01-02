-- Migration: Add feedback system and CRM/notification tracking
-- Date: 2025-01-01
-- Description: Adds feedback columns to conversations and CRM sync tracking to leads
-- Prerequisites: Run after 20250101000002_create_agents_conversations_leads.sql

-- ============================================
-- PART 1: Add Feedback Columns to Conversations
-- ============================================

-- Add feedback columns to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS feedback_rating INTEGER CHECK (feedback_rating IN (1, -1)),
ADD COLUMN IF NOT EXISTS feedback_comment TEXT,
ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP WITH TIME ZONE;

-- Add comments for clarity
COMMENT ON COLUMN conversations.feedback_rating IS 'User feedback: 1 for thumbs up, -1 for thumbs down';
COMMENT ON COLUMN conversations.feedback_comment IS 'Optional feedback comment, max 500 chars (validated in app)';
COMMENT ON COLUMN conversations.feedback_submitted_at IS 'Timestamp when feedback was submitted';

-- Add index for analytics queries on feedback
CREATE INDEX IF NOT EXISTS idx_conversations_feedback 
ON conversations(agent_id, feedback_rating) 
WHERE feedback_rating IS NOT NULL;

-- Add index for feedback timestamp
CREATE INDEX IF NOT EXISTS idx_conversations_feedback_submitted 
ON conversations(feedback_submitted_at DESC) 
WHERE feedback_submitted_at IS NOT NULL;

-- ============================================
-- PART 2: Add Email & CRM Tracking to Leads
-- ============================================

-- Add email notification tracking
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- Add CRM sync tracking
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS crm_synced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS crm_sync_id TEXT,
ADD COLUMN IF NOT EXISTS crm_synced_at TIMESTAMP WITH TIME ZONE;

-- Add comments for clarity
COMMENT ON COLUMN leads.email_sent IS 'Whether email notification was sent for this lead';
COMMENT ON COLUMN leads.email_sent_at IS 'Timestamp when email notification was sent';
COMMENT ON COLUMN leads.crm_synced IS 'Whether lead was synced to CRM (HubSpot, Salesforce, etc)';
COMMENT ON COLUMN leads.crm_sync_id IS 'CRM contact ID (e.g., HubSpot contact ID)';
COMMENT ON COLUMN leads.crm_synced_at IS 'Timestamp when lead was synced to CRM';

-- Add indexes for CRM sync queries
CREATE INDEX IF NOT EXISTS idx_leads_crm_sync 
ON leads(agent_id, crm_synced) 
WHERE crm_synced = FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_email_sent 
ON leads(agent_id, email_sent) 
WHERE email_sent = FALSE;

-- Add index for CRM sync ID lookups
CREATE INDEX IF NOT EXISTS idx_leads_crm_sync_id 
ON leads(crm_sync_id) 
WHERE crm_sync_id IS NOT NULL;

-- ============================================
-- PART 3: Update RLS Policies for Feedback
-- ============================================

-- Drop existing policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can update feedback on their conversations'
  ) THEN
    DROP POLICY "Users can update feedback on their conversations" ON conversations;
    RAISE NOTICE 'Dropped existing policy: Users can update feedback on their conversations';
  END IF;
END $$;

-- Create policy for users to update feedback
CREATE POLICY "Users can update feedback on their conversations"
  ON conversations FOR UPDATE
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

COMMENT ON POLICY "Users can update feedback on their conversations" ON conversations 
IS 'Allows users to update feedback (rating, comment) on conversations for their agents';

-- ============================================
-- PART 4: Create Helper Functions for Feedback
-- ============================================

-- Function to get feedback statistics for an agent
CREATE OR REPLACE FUNCTION get_agent_feedback_stats(p_agent_id TEXT)
RETURNS TABLE (
  total_feedback BIGINT,
  positive_count BIGINT,
  negative_count BIGINT,
  satisfaction_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE feedback_rating IS NOT NULL) as total_feedback,
    COUNT(*) FILTER (WHERE feedback_rating = 1) as positive_count,
    COUNT(*) FILTER (WHERE feedback_rating = -1) as negative_count,
    CASE 
      WHEN COUNT(*) FILTER (WHERE feedback_rating IS NOT NULL) > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE feedback_rating = 1)::NUMERIC / 
         COUNT(*) FILTER (WHERE feedback_rating IS NOT NULL)::NUMERIC) * 100, 
        2
      )
      ELSE 0
    END as satisfaction_rate
  FROM conversations
  WHERE agent_id = p_agent_id;
END;
$$;

COMMENT ON FUNCTION get_agent_feedback_stats IS 'Returns feedback statistics for a specific agent';

-- Function to get recent negative feedback with comments
CREATE OR REPLACE FUNCTION get_recent_negative_feedback(
  p_agent_id TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  conversation_id TEXT,
  user_message TEXT,
  assistant_response TEXT,
  feedback_comment TEXT,
  feedback_submitted_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_message,
    c.assistant_response,
    c.feedback_comment,
    c.feedback_submitted_at
  FROM conversations c
  WHERE 
    c.agent_id = p_agent_id
    AND c.feedback_rating = -1
    AND c.feedback_comment IS NOT NULL
  ORDER BY c.feedback_submitted_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_recent_negative_feedback IS 'Returns recent negative feedback with comments for analysis';

-- ============================================
-- PART 5: Create Helper Functions for CRM Sync
-- ============================================

-- Function to get leads pending CRM sync
CREATE OR REPLACE FUNCTION get_leads_pending_crm_sync(p_agent_id TEXT DEFAULT NULL)
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
    l.crm_synced = FALSE
    AND l.email IS NOT NULL  -- Only leads with email can be synced
    AND (p_agent_id IS NULL OR l.agent_id = p_agent_id)
  ORDER BY l.captured_at DESC;
END;
$$;

COMMENT ON FUNCTION get_leads_pending_crm_sync IS 'Returns leads that need to be synced to CRM';

-- Function to get leads pending email notification
CREATE OR REPLACE FUNCTION get_leads_pending_email(p_agent_id TEXT DEFAULT NULL)
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
    l.email_sent = FALSE
    AND (p_agent_id IS NULL OR l.agent_id = p_agent_id)
  ORDER BY l.captured_at DESC;
END;
$$;

COMMENT ON FUNCTION get_leads_pending_email IS 'Returns leads pending email notification';

-- Function to mark lead as synced to CRM
CREATE OR REPLACE FUNCTION mark_lead_crm_synced(
  p_lead_id UUID,
  p_crm_sync_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE leads
  SET 
    crm_synced = TRUE,
    crm_sync_id = p_crm_sync_id,
    crm_synced_at = NOW()
  WHERE id = p_lead_id;
  
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION mark_lead_crm_synced IS 'Marks a lead as successfully synced to CRM';

-- Function to mark lead email as sent
CREATE OR REPLACE FUNCTION mark_lead_email_sent(p_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE leads
  SET 
    email_sent = TRUE,
    email_sent_at = NOW()
  WHERE id = p_lead_id;
  
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION mark_lead_email_sent IS 'Marks a lead email notification as sent';

-- ============================================
-- PART 6: Create Analytics Views
-- ============================================

-- View for daily feedback summary
CREATE OR REPLACE VIEW daily_feedback_summary AS
SELECT
  agent_id,
  DATE(feedback_submitted_at) as feedback_date,
  COUNT(*) as total_feedback,
  COUNT(*) FILTER (WHERE feedback_rating = 1) as positive_count,
  COUNT(*) FILTER (WHERE feedback_rating = -1) as negative_count,
  ROUND(
    (COUNT(*) FILTER (WHERE feedback_rating = 1)::NUMERIC / 
     COUNT(*)::NUMERIC) * 100, 
    2
  ) as satisfaction_rate
FROM conversations
WHERE feedback_rating IS NOT NULL
GROUP BY agent_id, DATE(feedback_submitted_at)
ORDER BY feedback_date DESC;

COMMENT ON VIEW daily_feedback_summary IS 'Daily aggregated feedback statistics per agent';

-- View for CRM sync status
CREATE OR REPLACE VIEW crm_sync_status AS
SELECT
  agent_id,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE crm_synced = TRUE) as synced_count,
  COUNT(*) FILTER (WHERE crm_synced = FALSE) as pending_count,
  COUNT(*) FILTER (WHERE email_sent = TRUE) as email_sent_count,
  MAX(crm_synced_at) as last_sync_time
FROM leads
GROUP BY agent_id;

COMMENT ON VIEW crm_sync_status IS 'CRM sync status summary per agent';

-- ============================================
-- PART 7: Verification Queries
-- ============================================

-- Check conversations table structure
DO $$ 
BEGIN
  RAISE NOTICE 'Checking conversations table...';
END $$;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'conversations' 
  AND column_name IN ('feedback_rating', 'feedback_comment', 'feedback_submitted_at')
ORDER BY ordinal_position;

-- Check leads table structure
DO $$ 
BEGIN
  RAISE NOTICE 'Checking leads table...';
END $$;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
  AND column_name IN ('email_sent', 'email_sent_at', 'crm_synced', 'crm_sync_id', 'crm_synced_at')
ORDER BY ordinal_position;

-- Check indexes
DO $$ 
BEGIN
  RAISE NOTICE 'Checking indexes...';
END $$;

SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename IN ('conversations', 'leads')
  AND (indexname LIKE '%feedback%' OR indexname LIKE '%crm%' OR indexname LIKE '%email%')
ORDER BY tablename, indexname;

-- Check functions
DO $$ 
BEGIN
  RAISE NOTICE 'Checking helper functions...';
END $$;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%feedback%' 
    OR routine_name LIKE '%crm%' 
    OR routine_name LIKE '%email%'
  )
ORDER BY routine_name;

-- Check views
DO $$ 
BEGIN
  RAISE NOTICE 'Checking views...';
END $$;

SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND (table_name LIKE '%feedback%' OR table_name LIKE '%crm%')
ORDER BY table_name;

-- ============================================
-- PART 8: Test Helper Functions
-- ============================================

-- Test feedback stats function (will return zeros if no data)
DO $$ 
BEGIN
  RAISE NOTICE 'Testing feedback stats function...';
END $$;

SELECT * FROM get_agent_feedback_stats('test-agent-id');

-- Test pending CRM sync function
DO $$ 
BEGIN
  RAISE NOTICE 'Testing CRM sync function...';
END $$;

SELECT COUNT(*) as pending_crm_sync FROM get_leads_pending_crm_sync();

-- Test pending email function
DO $$ 
BEGIN
  RAISE NOTICE 'Testing email notification function...';
END $$;

SELECT COUNT(*) as pending_emails FROM get_leads_pending_email();

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 New columns added:';
  RAISE NOTICE '   - conversations: feedback_rating, feedback_comment, feedback_submitted_at';
  RAISE NOTICE '   - leads: email_sent, email_sent_at, crm_synced, crm_sync_id, crm_synced_at';
  RAISE NOTICE '🔍 New indexes created for better query performance';
  RAISE NOTICE '🔐 RLS policies updated for feedback updates';
  RAISE NOTICE '⚙️  Helper functions created for feedback and CRM sync';
  RAISE NOTICE '📈 Analytics views created for reporting';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Next steps:';
  RAISE NOTICE '   1. Implement feedback UI in your chat widget';
  RAISE NOTICE '   2. Set up CRM integration (HubSpot, Salesforce, etc.)';
  RAISE NOTICE '   3. Configure email notification system';
  RAISE NOTICE '   4. Test feedback submission and retrieval';
END $$;