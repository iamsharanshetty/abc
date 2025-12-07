# WebRep Project Architecture

## Project Overview

SaaS platform that converts static websites into AI-powered conversational representatives.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL + Vector Store)
- **AI/ML:** OpenAI Embeddings API
- **Web Scraping:** Axios + Puppeteer
- **Testing:** Vitest
- **Package Manager:** pnpm

---

## Project Structure

```
webrep/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── analyze/       # Main analysis endpoint
│   │   ├── status/        # Status checker
│   │   ├── ingest/        # Data ingestion
│   │   ├── test-parser/   # Parser testing
│   │   └── debug-scraper/ # Debug utilities
│   └── page.tsx           # Main UI
│
├── lib/                   # Core business logic
│   ├── config.ts          # Environment config
│   ├── database.types.ts  # Supabase types
│   │
│   ├── errors/            # Error handling
│   │   ├── AppError.ts
│   │   └── errorHandler.ts
│   │
│   ├── middleware/        # Request middleware
│   │   └── rateLimiter.ts
│   │
│   ├── utils/             # Utilities
│   │   ├── logger.ts
│   │   └── validation.ts
│   │
│   ├── services/          # Core services
│   │   ├── embeddings.ts      # OpenAI embedding generation
│   │   ├── scraper.ts         # HTTP-based scraping
│   │   ├── browserScraper.ts  # Puppeteer scraping
│   │   ├── contentParser.ts   # HTML parsing
│   │   ├── cache.ts           # Caching layer
│   │   ├── deduplication.ts   # Duplicate detection
│   │   └── rateLimiter.ts     # API rate limiting
│   │
│   └── supabase/          # Database
│       └── server.ts
│
└── tests/                 # Testing
    ├── unit/
    └── integration/
```

---

## Core Services Documentation

### 1. **Scraping Pipeline**

#### WebScraper (`lib/services/scraper.ts`)

- **Purpose:** HTTP-based website scraping
- **Tech:** Axios + Cheerio
- **Use Case:** Static sites, server-rendered pages
- **Key Methods:**
  - `scrapeWebsite()`: Main entry point
  - `scrapePage(url)`: Single page scraping
  - `extractLinks(html)`: Link extraction

#### BrowserScraper (`lib/services/browserScraper.ts`)

- **Purpose:** JavaScript-rendered site scraping
- **Tech:** Puppeteer
- **Use Case:** SPAs (React, Vue, Angular)
- **Key Methods:**
  - `scrapeWebsite()`: Main entry point
  - `scrapePage(url)`: Single page scraping
  - `closeBrowser()`: Cleanup

#### ContentParser (`lib/services/contentParser.ts`)

- **Purpose:** Extract meaningful content from HTML
- **Features:**
  - Removes junk (nav, footer, ads)
  - Extracts main content, headings, paragraphs
  - Quality scoring
  - Boilerplate detection
- **Key Methods:**
  - `parse(html, url)`: Main parser
  - `calculateQualityScore()`: Content quality
  - `extractMainContent()`: Content extraction

---

### 2. **Embedding Pipeline**

#### EmbeddingService (`lib/services/embeddings.ts`)

- **Purpose:** Generate and store vector embeddings
- **Features:**
  - Smart chunking (semantic boundaries)
  - Deduplication (chunk-level)
  - Batch processing (parallel)
  - Section-based keying
- **Key Methods:**
  - `storeEmbeddings()`: Main entry point
  - `generateEmbedding()`: OpenAI API call
  - `chunkTextSmartly()`: Smart text chunking
  - `deduplicateChunks()`: Remove duplicates

**Optimizations:**

1. Smart chunking by paragraphs/sentences
2. Chunk deduplication (saves ~30-50% cost)
3. Low-value chunk filtering
4. Parallel batch processing

---

### 3. **Caching & Optimization**

#### CacheService (`lib/services/cache.ts`)

- **Purpose:** Prevent re-scraping recently analyzed sites
- **Cache Duration:** 24 hours
- **Key Methods:**
  - `isCached(url)`: Check if URL cached
  - `getCacheEntry(url)`: Get cached data
  - `invalidate(url)`: Force refresh

#### DeduplicationService (`lib/services/deduplication.ts`)

- **Purpose:** Detect duplicate pages during scraping
- **Method:** Content hashing (SHA-256)
- **Key Methods:**
  - `isDuplicate()`: Check if page is duplicate
  - `getStats()`: Deduplication statistics

---

### 4. **API Routes**

#### `/api/analyze` (POST)

**Purpose:** Main analysis endpoint
**Flow:**

1. Validate URL
2. Check cache (24hr)
3. Scrape website (HTTP → Browser fallback)
4. Parse content
5. Generate embeddings
6. Store in Supabase

**Response:**

```typescript
{
  success: true,
  data: {
    websiteUrl: string,
    pagesScraped: number,
    pagesProcessed: number,
    message: string,
    deduplication: {...}
  }
}
```

#### `/api/status` (GET)

**Purpose:** Check if URL is analyzed
**Query:** `?url=https://example.com`

#### `/api/debug-scraper` (GET)

**Purpose:** Debug scraping issues
**Output:** Detailed diagnostics

---

## Data Flow

```
User Input (URL)
    ↓
Validation (validation.ts)
    ↓
Cache Check (cache.ts)
    ↓
Scraping (scraper.ts or browserScraper.ts)
    ↓
Content Parsing (contentParser.ts)
    ↓
Deduplication (deduplication.ts)
    ↓
Chunking (embeddings.ts)
    ↓
Embedding Generation (OpenAI API)
    ↓
Storage (Supabase Vector Store)
    ↓
Response to User
```

---

## Key Configurations

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Optional
LOG_LEVEL=info
MAX_PAGES_TO_SCRAPE=50
```

### Config (`lib/config.ts`)

- Scraping timeouts
- Rate limits
- Chunking parameters
- Quality thresholds

---

## Error Handling

### Error Types (`lib/errors/AppError.ts`)

- `ValidationError` (400)
- `ScrapingError` (500)
- `EmbeddingError` (500)
- `RateLimitError` (429)

### Centralized Handler (`lib/errors/errorHandler.ts`)

All API routes use `handleError()` for consistent error responses.

---

## Testing Strategy

### Unit Tests (`tests/unit/`)

- `contentParser.test.ts`: Parser logic
- `validation.test.ts`: Input validation
- `cache.test.ts`: Cache operations
- `deduplication.test.ts`: Duplicate detection

### Integration Tests (`tests/integration/`)

- `api.test.ts`: API endpoint tests

---

## Rate Limiting

### API Rate Limits

- `/api/analyze`: 5 requests/minute
- `/api/status`: 30 requests/minute

### OpenAI Rate Limits

- Handled by `lib/services/rateLimiter.ts`
- Retry logic with exponential backoff

---

## Database Schema

### Table: `website_embeddings`

```typescript
{
  id: string (uuid)
  website_url: string
  page_url: string
  content_section: string
  embedding: vector(1536)
  metadata: jsonb {
    title: string
    scrapedAt: string
    contentLength: number
    chunkIndex: number
    section: string
    sectionLevel: number
  }
  created_at: timestamp
}
```

---

## Performance Metrics

- **Proposal Generation:** ≤ 60 seconds
- **Prototype Generation:** ≤ 3 minutes
- **Content Classification:** ≥ 90% accuracy
- **Embedding Cost Savings:** ~30-50% (via deduplication)

---

## Common Patterns

### Adding a New Service

1. Create file in `lib/services/`
2. Add type definitions
3. Implement error handling
4. Add unit tests
5. Document in this file

### Adding a New API Route

1. Create `app/api/[name]/route.ts`
2. Import required services
3. Use `handleError()` for errors
4. Add rate limiting if needed
5. Add integration test

### Modifying Parser Logic

1. Edit `lib/services/contentParser.ts`
2. Update `JUNK_SELECTORS` or `CONTENT_SELECTORS`
3. Run tests: `pnpm test`
4. Test with real websites using `/api/debug-scraper`

---

## Future Enhancements

- Voice-based agents
- Avatar integration
- Multi-language support
- Advanced CRM integrations
- Real-time analytics dashboard

---

## Quick Reference

### Run Development Server

```bash
pnpm dev
```

### Run Tests

```bash
pnpm test
```

### Build for Production

```bash
pnpm build
```

### Type Check

```bash
pnpm type-check
```

---

## Contact & Support

- Project Lead: Hussain
- Product Vision: Dr. Ehsan Gharadjedaghi
- QA & Ops: Nagarjun H. Bharadwaj, Devaraju HM
