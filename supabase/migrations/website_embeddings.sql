-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the website_embeddings table with improvements
CREATE TABLE website_embeddings (
  id bigserial PRIMARY KEY,
  website_url text NOT NULL,
  page_url text NOT NULL,
  content_section text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX website_embeddings_website_url_idx 
  ON website_embeddings(website_url);

CREATE INDEX website_embeddings_page_url_idx 
  ON website_embeddings(page_url);

-- Create vector similarity search index
CREATE INDEX website_embeddings_embedding_idx 
  ON website_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create compound index for common query patterns
CREATE INDEX website_embeddings_website_page_idx 
  ON website_embeddings(website_url, page_url);

-- Add helpful comments
COMMENT ON TABLE website_embeddings IS 'Stores vector embeddings for website content';
COMMENT ON COLUMN website_embeddings.website_url IS 'Base URL of the website';
COMMENT ON COLUMN website_embeddings.page_url IS 'Full URL of the specific page';
COMMENT ON COLUMN website_embeddings.content_section IS 'Text content that was embedded';
COMMENT ON COLUMN website_embeddings.embedding IS 'Vector embedding (1536 dimensions for OpenAI ada-002)';
COMMENT ON COLUMN website_embeddings.metadata IS 'Additional metadata (title, chunk info, etc.)';



-- Check if table exists and see its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'website_embeddings'
ORDER BY ordinal_position;

-- Verify all indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'website_embeddings'
ORDER BY indexname;