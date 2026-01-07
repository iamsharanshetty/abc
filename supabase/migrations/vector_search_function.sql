-- Create the vector similarity search function
-- This function finds the most similar content chunks to a query embedding

CREATE OR REPLACE FUNCTION match_website_content(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  website_url_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  website_url TEXT,
  page_url TEXT,
  content_section TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_vector vector(1536);
BEGIN
  -- Convert the JSON string to a vector type
  -- The input is a string like "[0.1, 0.2, ...]"
  query_vector := query_embedding::vector;
  
  RETURN QUERY
  SELECT
    website_embeddings.id,
    website_embeddings.website_url,
    website_embeddings.page_url,
    website_embeddings.content_section,
    -- Calculate cosine similarity (1 - cosine distance)
    1 - (website_embeddings.embedding <=> query_vector) AS similarity,
    website_embeddings.metadata
  FROM website_embeddings
  WHERE 
    -- Filter by website URL if provided
    (website_url_filter IS NULL OR website_embeddings.website_url = website_url_filter)
    -- Only return results above the similarity threshold
    AND (1 - (website_embeddings.embedding <=> query_vector)) >= match_threshold
  ORDER BY 
    -- Sort by similarity (highest first)
    website_embeddings.embedding <=> query_vector
  LIMIT match_count;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION match_website_content IS 
'Finds the most semantically similar content chunks to a query embedding using cosine similarity';

-- Grant execute permissions (adjust based on your RLS policies)
GRANT EXECUTE ON FUNCTION match_website_content TO authenticated;
GRANT EXECUTE ON FUNCTION match_website_content TO anon;
GRANT EXECUTE ON FUNCTION match_website_content TO service_role;