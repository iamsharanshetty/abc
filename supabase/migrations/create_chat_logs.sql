-- Create chat_logs table
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'unhelpful', NULL)),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_chat_logs_agent_id ON chat_logs(agent_id);
CREATE INDEX idx_chat_logs_timestamp ON chat_logs(timestamp DESC);
CREATE INDEX idx_chat_logs_session_id ON chat_logs(session_id);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  session_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  message TEXT,
  source TEXT DEFAULT 'chat',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for leads
CREATE INDEX idx_leads_agent_id ON leads(agent_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_website_url text
)
RETURNS TABLE (
  id uuid,
  website_url text,
  page_url text,
  content_section text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    website_embeddings.id,
    website_embeddings.website_url,
    website_embeddings.page_url,
    website_embeddings.content_section,
    1 - (website_embeddings.embedding <=> query_embedding) as similarity
  FROM website_embeddings
  WHERE website_embeddings.website_url = filter_website_url
    AND 1 - (website_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY website_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create RLS policies
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can do everything on chat_logs"
  ON chat_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on leads"
  ON leads FOR ALL
  USING (auth.role() = 'service_role');