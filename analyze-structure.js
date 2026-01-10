const fs = require("fs");
const path = require("path");

console.log("🔍 Analyzing your project structure...\n");

// Get all files recursively
function getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath, depth = 0) {
  if (depth > 10) return arrayOfFiles; // Prevent too deep recursion

  try {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      // Skip common large/unnecessary directories
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
        ].includes(file)
      ) {
        return;
      }

      const fullPath = path.join(dirPath, file);

      try {
        const stat = fs.statSync(fullPath);
        const relativePath = path.relative(baseDir, fullPath);

        if (stat.isDirectory()) {
          arrayOfFiles = getAllFiles(
            fullPath,
            arrayOfFiles,
            baseDir,
            depth + 1
          );
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

// Analyze project structure
function analyzeProject(projectPath) {
  const allFiles = getAllFiles(projectPath);

  console.log(`📊 Total files found: ${allFiles.length}\n`);

  // Categorize files
  const categories = {
    "API Routes (app/api/**/route.ts)": [],
    "Services (lib/services/**/*.ts)": [],
    "Components (components/**/*.tsx)": [],
    "Pages (app/**/page.tsx)": [],
    "Types (types/**/*.ts)": [],
    "Tests (tests/**/*.ts)": [],
    "Config Files": [],
    "Jobs/Trigger (jobs, src/trigger)": [],
    "Database/Supabase": [],
    "Other TypeScript": [],
    "Other Files": [],
  };

  allFiles.forEach((file) => {
    const normalized = file.replace(/\\/g, "/"); // Normalize Windows paths

    if (normalized.match(/app\/api\/.*\/route\.ts$/)) {
      categories["API Routes (app/api/**/route.ts)"].push(file);
    } else if (normalized.match(/lib\/services\/.*\.ts$/)) {
      categories["Services (lib/services/**/*.ts)"].push(file);
    } else if (normalized.match(/components\/.*\.tsx$/)) {
      categories["Components (components/**/*.tsx)"].push(file);
    } else if (normalized.match(/app\/.*\/page\.tsx$/)) {
      categories["Pages (app/**/page.tsx)"].push(file);
    } else if (normalized.match(/types\/.*\.ts$/)) {
      categories["Types (types/**/*.ts)"].push(file);
    } else if (normalized.match(/tests\/.*\.ts$/)) {
      categories["Tests (tests/**/*.ts)"].push(file);
    } else if (
      normalized.match(/jobs\/.*\.ts$/) ||
      normalized.match(/src\/trigger\/.*\.ts$/)
    ) {
      categories["Jobs/Trigger (jobs, src/trigger)"].push(file);
    } else if (
      normalized.match(/supabase\//) ||
      normalized.includes("database")
    ) {
      categories["Database/Supabase"].push(file);
    } else if (file.match(/\.(json|mjs|config\.(ts|js|mjs)|md)$/)) {
      categories["Config Files"].push(file);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      categories["Other TypeScript"].push(file);
    } else {
      categories["Other Files"].push(file);
    }
  });

  // Print summary
  console.log("📁 FILE CATEGORIES:\n");
  Object.entries(categories).forEach(([category, files]) => {
    console.log(`${category}: ${files.length} files`);
    if (files.length > 0 && files.length <= 20) {
      files.forEach((f) => console.log(`   - ${f}`));
    } else if (files.length > 20) {
      files.slice(0, 10).forEach((f) => console.log(`   - ${f}`));
      console.log(`   ... and ${files.length - 10} more`);
    }
    console.log("");
  });

  // Check for specific important files
  console.log("🔍 CHECKING FOR KEY FILES:\n");
  const keyFiles = [
    "app/api/analyze/route.ts",
    "app/api/ingest/route.ts",
    "app/api/v2/chat/route.ts",
    "lib/services/aiAgent.ts",
    "lib/services/contentParser.ts",
    "lib/services/embeddings.ts",
    "lib/services/langchainService.ts",
    "lib/supabase/client.ts",
    "jobs/ingest-website.ts",
    "package.json",
    "tsconfig.json",
  ];

  keyFiles.forEach((keyFile) => {
    const normalized = keyFile.replace(/\//g, path.sep);
    const found = allFiles.find(
      (f) => f === normalized || f.endsWith(normalized)
    );
    console.log(`${found ? "✅" : "❌"} ${keyFile}`);
  });

  console.log("\n");

  // Show directory structure (top level)
  console.log("📂 TOP-LEVEL DIRECTORY STRUCTURE:\n");
  try {
    const topLevel = fs.readdirSync(projectPath);
    topLevel.forEach((item) => {
      const fullPath = path.join(projectPath, item);
      const stat = fs.statSync(fullPath);
      if (
        stat.isDirectory() &&
        !["node_modules", ".next", ".git"].includes(item)
      ) {
        console.log(`📁 ${item}/`);
        try {
          const subItems = fs.readdirSync(fullPath);
          const dirs = subItems
            .filter((sub) => {
              try {
                return fs.statSync(path.join(fullPath, sub)).isDirectory();
              } catch {
                return false;
              }
            })
            .slice(0, 5);
          dirs.forEach((dir) => console.log(`   📁 ${dir}/`));
          if (subItems.length > dirs.length) {
            console.log(
              `   ... and ${subItems.length - dirs.length} more items`
            );
          }
        } catch (err) {
          console.log(`   (cannot read)`);
        }
      }
    });
  } catch (err) {
    console.error("Error reading top level:", err.message);
  }

  return categories;
}

// Run analysis
const projectPath = process.argv[2] || ".";
console.log(`Analyzing: ${path.resolve(projectPath)}\n`);
console.log("=".repeat(70) + "\n");

analyzeProject(projectPath);

console.log("\n" + "=".repeat(70));
console.log("💡 Next Steps:");
console.log("1. Check if the key files are found (✅)");
console.log("2. Look at the file categories to see where your files are");
console.log(
  "3. I will create a fixed consolidation script based on this analysis"
);
console.log("=".repeat(70));
