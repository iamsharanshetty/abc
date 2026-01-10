const fs = require("fs");
const path = require("path");

// Configuration: Define which files to consolidate into which groups
const consolidationGroups = {
  "01-backend-api-routes.md": {
    description: "All API route handlers",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized.match(/^app\/api\/.*\/route\.ts$/) &&
        !file.includes(".backup")
      );
    },
  },

  "02-backend-services.md": {
    description: "Core backend services and business logic",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return normalized.match(/^lib\/services\/.*\.ts$/);
    },
  },

  "03-database-and-supabase.md": {
    description: "Database configuration, types, and Supabase setup",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized.match(/^lib\/supabase\/.*\.ts$/) ||
        normalized.match(/^lib\/database.*\.ts$/) ||
        normalized.match(/^supabase\/migrations\/.*\.sql$/)
      );
    },
  },

  "04-ai-agent-and-langchain.md": {
    description: "AI agent, LangChain integration, and prompt management",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized === "lib/services/aiAgent.ts" ||
        normalized === "lib/services/langchainService.ts" ||
        normalized === "lib/openai.ts"
      );
    },
  },

  "05-content-parsing-embeddings.md": {
    description: "Content parsing, scraping, and embedding generation",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized === "lib/services/contentParser.ts" ||
        normalized === "lib/services/embeddings.ts" ||
        normalized === "lib/services/scraper.ts" ||
        normalized === "lib/services/browserScraper.ts" ||
        normalized === "app/actions/generate-embeddings.ts"
      );
    },
  },

  "06-queue-and-jobs.md": {
    description:
      "Queue management, job processing, and Trigger.dev integration",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized.match(/^jobs\/.*\.ts$/) ||
        normalized.match(/^src\/trigger\/.*\.ts$/) ||
        normalized === "trigger.config.ts"
      );
    },
  },

  "07-error-handling-validation.md": {
    description: "Error handling, validation, and middleware",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized.match(/^lib\/errors\/.*\.ts$/) ||
        normalized === "lib/validation.ts" ||
        normalized === "lib/utils/validation.ts" ||
        normalized.match(/^lib\/middleware\/.*\.ts$/) ||
        normalized === "middleware.ts"
      );
    },
  },

  "08-analytics-crm.md": {
    description: "Analytics, CRM integration, and logging",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized === "lib/services/analytics.ts" ||
        normalized === "lib/services/crmService.ts" ||
        normalized === "lib/utils/logger.ts"
      );
    },
  },

  "09-other-backend-services.md": {
    description: "Other backend utilities and services",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized === "lib/services/cache.ts" ||
        normalized === "lib/services/deduplication.ts" ||
        normalized === "lib/services/rateLimiter.ts" ||
        normalized === "lib/services/errorHandlingService.ts" ||
        normalized === "lib/services/tester.ts" ||
        normalized === "lib/services/comprehensiveTester.ts"
      );
    },
  },

  "10-frontend-pages.md": {
    description: "Frontend pages and layouts",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        (normalized.match(/^app\/.*\/page\.tsx$/) ||
          normalized.match(/^app\/.*\/layout\.tsx$/)) &&
        !normalized.includes("api")
      );
    },
  },

  "11-frontend-components.md": {
    description: "React components",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return normalized.match(/^components\/.*\.tsx$/);
    },
  },

  "12-types-config-utils.md": {
    description:
      "TypeScript types, interfaces, configuration, and utility files",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized.match(/^types\/.*\.ts$/) ||
        normalized === "lib/config.ts" ||
        normalized === "lib/utils.ts" ||
        normalized.match(/^lib\/actions\/.*\.ts$/)
      );
    },
  },

  "13-tests.md": {
    description: "All test files",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized.match(/^tests\/.*\.ts$/) || normalized === "vitest.config.ts"
      );
    },
  },

  "14-config-and-setup.md": {
    description: "Project configuration files",
    filter: (file) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        file === "package.json" ||
        file === "tsconfig.json" ||
        normalized === "next.config.mjs" ||
        normalized === "postcss.config.mjs" ||
        normalized === "eslint.config.mjs" ||
        file === "README.md" ||
        file === "ARCHITECTURE.md"
      );
    },
  },
};

// Recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
  try {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      // Skip unnecessary directories
      if (
        [
          "node_modules",
          ".next",
          "dist",
          "build",
          ".git",
          "coverage",
          ".vercel",
          ".turbo",
          "out",
          ".trigger",
        ].includes(file)
      ) {
        return;
      }

      const fullPath = path.join(dirPath, file);

      try {
        const stat = fs.statSync(fullPath);
        const relativePath = path.relative(baseDir, fullPath);

        if (stat.isDirectory()) {
          arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, baseDir);
        } else {
          arrayOfFiles.push(relativePath);
        }
      } catch (err) {
        // Skip files we can't access
      }
    });
  } catch (err) {
    console.error(`Error reading ${dirPath}: ${err.message}`);
  }

  return arrayOfFiles;
}

// Main consolidation function
function consolidateProject(projectPath, outputDir) {
  console.log("🚀 Starting project consolidation...\n");

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}\n`);
  }

  // Get all files in the project
  const allFiles = getAllFiles(projectPath);
  console.log(`📁 Found ${allFiles.length} total files\n`);

  // Track which files were included
  const includedFiles = new Set();

  // Process each consolidation group
  Object.entries(consolidationGroups).forEach(([outputFile, config]) => {
    console.log(`📝 Creating ${outputFile}...`);

    let consolidatedContent = `# ${outputFile
      .replace(".md", "")
      .replace(/-/g, " ")
      .toUpperCase()}\n\n`;
    consolidatedContent += `**Description:** ${config.description}\n\n`;
    consolidatedContent += `**Generated:** ${new Date().toISOString()}\n\n`;
    consolidatedContent += `---\n\n`;

    let filesIncluded = 0;

    allFiles.forEach((file) => {
      // Skip backup files
      if (file.includes(".backup") || file.includes("node_modules")) {
        return;
      }

      // Check if file matches filter
      if (config.filter(file)) {
        try {
          const fullPath = path.join(projectPath, file);
          const content = fs.readFileSync(fullPath, "utf8");
          const ext = path.extname(file).substring(1) || "txt";

          // Normalize path for display (forward slashes)
          const displayPath = file.replace(/\\/g, "/");

          consolidatedContent += `## File: ${displayPath}\n\n`;
          consolidatedContent += `\`\`\`${ext}\n`;
          consolidatedContent += content;
          consolidatedContent += `\n\`\`\`\n\n`;
          consolidatedContent += `---\n\n`;

          filesIncluded++;
          includedFiles.add(file);
        } catch (error) {
          console.error(`   ⚠️  Error reading ${file}: ${error.message}`);
        }
      }
    });

    // Write consolidated file
    const outputPath = path.join(outputDir, outputFile);
    fs.writeFileSync(outputPath, consolidatedContent, "utf8");
    console.log(`   ✅ Included ${filesIncluded} files\n`);
  });

  console.log("🎉 Consolidation complete!\n");
  console.log(`📂 Output location: ${outputDir}\n`);
  console.log(
    `📊 Total files consolidated: ${includedFiles.size} out of ${allFiles.length}\n`
  );

  // Create a summary file
  const summaryPath = path.join(outputDir, "00-REVIEW-GUIDE.md");
  let summary = `# Code Review Guide for WebRep Project\n\n`;
  summary += `**Generated:** ${new Date().toISOString()}\n\n`;
  summary += `This guide helps you navigate through the consolidated files for code review.\n\n`;
  summary += `## 📊 Summary\n\n`;
  summary += `- Total files in project: ${allFiles.length}\n`;
  summary += `- Files consolidated: ${includedFiles.size}\n`;
  summary += `- Consolidated into: ${
    Object.keys(consolidationGroups).length
  } files\n\n`;
  summary += `## 📋 Review Order - 3 BATCHES\n\n`;
  summary += `### BATCH 1: Foundation & Core Logic (Files 14, 12, 03, 07, 05)\n`;
  summary += `**Upload these 5 files first:**\n\n`;
  summary += `1. **14-config-and-setup.md**\n`;
  summary += `   - Why: Understand project setup, dependencies, and configuration\n`;
  summary += `   - Focus: Security (exposed secrets), dependency vulnerabilities\n\n`;
  summary += `2. **12-types-config-utils.md**\n`;
  summary += `   - Why: Review data structures and type definitions\n`;
  summary += `   - Focus: Type safety, proper TypeScript usage\n\n`;
  summary += `3. **03-database-and-supabase.md**\n`;
  summary += `   - Why: Understand database schema and setup\n`;
  summary += `   - Focus: Security (SQL injection), indexes, RLS policies\n\n`;
  summary += `4. **07-error-handling-validation.md**\n`;
  summary += `   - Why: Review error handling patterns and validation logic\n`;
  summary += `   - Focus: Input validation, error exposure, security\n\n`;
  summary += `5. **05-content-parsing-embeddings.md**\n`;
  summary += `   - Why: Review core content processing logic (Cycles 2-3)\n`;
  summary += `   - Focus: Security (XSS), performance, memory management\n\n`;

  summary += `---\n\n`;
  summary += `### BATCH 2: AI, Services & Queue (Files 04, 02, 06, 08, 09)\n`;
  summary += `**Upload these 5 files after addressing Batch 1 feedback:**\n\n`;
  summary += `1. **04-ai-agent-and-langchain.md**\n`;
  summary += `   - Why: Review AI/LLM integration (Cycle 5)\n`;
  summary += `   - Focus: Prompt injection, API key security, rate limiting\n\n`;
  summary += `2. **02-backend-services.md**\n`;
  summary += `   - Why: Review core backend services\n`;
  summary += `   - Focus: Architecture, coupling, error handling\n\n`;
  summary += `3. **06-queue-and-jobs.md**\n`;
  summary += `   - Why: Review queue management (Cycle 4)\n`;
  summary += `   - Focus: Reliability, idempotency, error recovery\n\n`;
  summary += `4. **08-analytics-crm.md**\n`;
  summary += `   - Why: Review analytics and CRM features (Cycle 5)\n`;
  summary += `   - Focus: PII handling, webhook security, data privacy\n\n`;
  summary += `5. **09-other-backend-services.md**\n`;
  summary += `   - Why: Review supporting services (cache, rate limiter, etc.)\n`;
  summary += `   - Focus: Performance, reliability, proper implementation\n\n`;

  summary += `---\n\n`;
  summary += `### BATCH 3: API, Frontend & Tests (Files 01, 11, 10, 13)\n`;
  summary += `**Upload these 4 files after addressing Batch 2 feedback:**\n\n`;
  summary += `1. **01-backend-api-routes.md**\n`;
  summary += `   - Why: Review API endpoints and request handling\n`;
  summary += `   - Focus: Authentication, authorization, input validation\n\n`;
  summary += `2. **11-frontend-components.md**\n`;
  summary += `   - Why: Review React components\n`;
  summary += `   - Focus: Performance, accessibility, proper React patterns\n\n`;
  summary += `3. **10-frontend-pages.md**\n`;
  summary += `   - Why: Review page structure and routing\n`;
  summary += `   - Focus: SEO, loading states, error boundaries\n\n`;
  summary += `4. **13-tests.md**\n`;
  summary += `   - Why: Review test coverage and quality\n`;
  summary += `   - Focus: Coverage gaps, test quality, edge cases\n\n`;

  summary += `---\n\n`;
  summary += `## 🎯 What to Look For in Each Review\n\n`;
  summary += `### 🔒 Security Issues (Priority 1 - CRITICAL)\n`;
  summary += `- [ ] Exposed API keys or secrets in code\n`;
  summary += `- [ ] SQL injection vulnerabilities\n`;
  summary += `- [ ] XSS vulnerabilities (unescaped user input)\n`;
  summary += `- [ ] Prompt injection in AI prompts\n`;
  summary += `- [ ] Missing authentication/authorization checks\n`;
  summary += `- [ ] Missing input validation\n`;
  summary += `- [ ] CORS misconfiguration\n`;
  summary += `- [ ] Insecure webhook endpoints\n`;
  summary += `- [ ] PII data not properly protected\n\n`;

  summary += `### 🐛 Code Quality Issues (Priority 2 - HIGH)\n`;
  summary += `- [ ] Unused imports/variables/functions\n`;
  summary += `- [ ] Duplicate code blocks\n`;
  summary += `- [ ] Functions longer than 50 lines\n`;
  summary += `- [ ] Deep nesting (more than 3 levels)\n`;
  summary += `- [ ] Missing error handling (try-catch)\n`;
  summary += `- [ ] Poor naming conventions\n`;
  summary += `- [ ] Missing comments for complex logic\n`;
  summary += `- [ ] Using \`any\` type in TypeScript\n\n`;

  summary += `### ⚡ Performance Issues (Priority 3 - MEDIUM)\n`;
  summary += `- [ ] N+1 query problems\n`;
  summary += `- [ ] Missing database indexes\n`;
  summary += `- [ ] Inefficient algorithms (nested loops)\n`;
  summary += `- [ ] Missing caching for expensive operations\n`;
  summary += `- [ ] Memory leaks (unreleased resources)\n`;
  summary += `- [ ] Unnecessary re-renders in React\n`;
  summary += `- [ ] Large bundle sizes\n\n`;

  summary += `### ✨ Best Practices (Priority 4 - LOW)\n`;
  summary += `- [ ] Inconsistent code style\n`;
  summary += `- [ ] Missing JSDoc comments\n`;
  summary += `- [ ] Not following SOLID principles\n`;
  summary += `- [ ] Inconsistent error messages\n`;
  summary += `- [ ] Missing environment variable validation\n`;
  summary += `- [ ] Insufficient logging\n\n`;

  summary += `## 📝 Review Template Message\n\n`;
  summary += `Use this template when requesting each batch review:\n\n`;
  summary += `\`\`\`\n`;
  summary += `I'm working on the WebRep project - an AI agent platform that converts\n`;
  summary += `websites into conversational sales agents.\n\n`;
  summary += `We've completed Cycles 2-5:\n`;
  summary += `- Cycles 2-3: Content parsing, embeddings, vector storage\n`;
  summary += `- Cycle 4: Queue management with Trigger.dev\n`;
  summary += `- Cycle 5: OpenAI integration, AI agent, CRM features, lead capture\n\n`;
  summary += `Now in Cycle 6 (ALE-35): Code Review & Refactoring\n\n`;
  summary += `This is BATCH [X] of 3: [Brief description]\n\n`;
  summary += `Please review for:\n`;
  summary += `1. Security vulnerabilities (CRITICAL priority)\n`;
  summary += `2. Code quality issues (unused code, large functions, duplicates)\n`;
  summary += `3. Performance bottlenecks\n`;
  summary += `4. TypeScript/typing issues\n`;
  summary += `5. Error handling gaps\n`;
  summary += `6. Best practice violations\n\n`;
  summary += `Prioritize: Critical security issues > High priority bugs > Medium/Low issues\n`;
  summary += `\`\`\`\n\n`;

  summary += `## 📊 Track Your Progress\n\n`;
  summary += `Create a file called \`REVIEW-FINDINGS.md\` to track all issues:\n\n`;
  summary += `\`\`\`markdown\n`;
  summary += `# Code Review Findings\n\n`;
  summary += `## BATCH 1: Foundation & Core\n`;
  summary += `- [ ] CRITICAL: [Issue] - File: [file] Line: [line]\n`;
  summary += `- [ ] HIGH: [Issue] - File: [file]\n`;
  summary += `- [ ] MEDIUM: [Issue] - File: [file]\n\n`;
  summary += `## BATCH 2: AI & Services\n`;
  summary += `[Same structure]\n\n`;
  summary += `## BATCH 3: API & Frontend\n`;
  summary += `[Same structure]\n`;
  summary += `\`\`\`\n\n`;

  summary += `## 🚀 Good Luck!\n\n`;
  summary += `Remember:\n`;
  summary += `- Fix CRITICAL issues immediately before moving to next batch\n`;
  summary += `- Test after each change\n`;
  summary += `- Document your decisions\n`;
  summary += `- Don't try to fix everything at once\n`;

  fs.writeFileSync(summaryPath, summary, "utf8");
  console.log("📋 Created review guide: 00-REVIEW-GUIDE.md\n");
}

// Run the consolidation
const projectPath = process.argv[2] || ".";
const outputDir =
  process.argv[3] ||
  "C:\\Users\\User\\Documents\\Alenta_dumpers\\cycle-6\\Consolidated";

console.log(`Project path: ${path.resolve(projectPath)}`);
console.log(`Output directory: ${outputDir}\n`);

consolidateProject(projectPath, outputDir);

console.log(
  "✨ Done! Check the output directory for your consolidated files.\n"
);
console.log("📖 Start by reading: 00-REVIEW-GUIDE.md\n");
