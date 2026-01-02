// test-env.js - FIXED VERSION
// This version loads .env.local properly before testing
// Usage: node test-env.js

const fs = require("fs");
const path = require("path");

console.log("\n=================================");
console.log("🔍 ENVIRONMENT VARIABLES TEST");
console.log("=================================\n");

// Function to load .env.local file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");

  console.log("1. Checking for .env.local file...");
  console.log(`   Looking at: ${envPath}`);

  if (!fs.existsSync(envPath)) {
    console.log("   ❌ .env.local file NOT FOUND!\n");
    console.log("   Create a .env.local file in your project root with:");
    console.log("   OPENAI_API_KEY=sk-proj-xxx");
    console.log("   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co");
    console.log("   etc.\n");
    return false;
  }

  console.log("   ✅ .env.local file FOUND\n");

  console.log("2. Loading environment variables...");
  const envContent = fs.readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");
  let loadedCount = 0;

  lines.forEach((line) => {
    // Skip comments and empty lines
    line = line.trim();
    if (!line || line.startsWith("#")) return;

    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Set environment variable
      process.env[key] = value;
      loadedCount++;
    }
  });

  console.log(`   ✅ Loaded ${loadedCount} variables\n`);
  return true;
}

// Load the .env.local file
if (!loadEnvFile()) {
  process.exit(1);
}

console.log("=================================");
console.log("📋 CHECKING REQUIRED VARIABLES");
console.log("=================================\n");

const tests = [
  {
    name: "OPENAI_API_KEY",
    value: process.env.OPENAI_API_KEY,
    required: true,
    validator: (val) => val && val.startsWith("sk-"),
  },
  {
    name: "ALENTA_OPENAI_KEY",
    value: process.env.ALENTA_OPENAI_KEY,
    required: false,
    validator: (val) => val && val.startsWith("sk-"),
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    value: process.env.NEXT_PUBLIC_SUPABASE_URL,
    required: true,
    validator: (val) => val && val.includes("supabase"),
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    required: true,
    validator: (val) => val && val.length > 20,
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    required: true,
    validator: (val) => val && val.length > 20,
  },
];

let hasErrors = false;
let passedCount = 0;

tests.forEach((test) => {
  const exists = !!test.value;
  const isValid = test.value ? test.validator(test.value) : false;

  if (!exists && test.required) {
    console.log(`❌ ${test.name}: NOT FOUND (REQUIRED!)`);
    hasErrors = true;
  } else if (!exists && !test.required) {
    console.log(`⚠️  ${test.name}: NOT FOUND (optional)`);
  } else if (!isValid) {
    console.log(`❌ ${test.name}: FOUND but INVALID format`);
    console.log(`   First 15 chars: ${test.value.substring(0, 15)}...`);
    hasErrors = true;
  } else {
    console.log(`✅ ${test.name}: FOUND and valid`);
    if (test.name.includes("KEY") || test.name.includes("SECRET")) {
      console.log(
        `   Preview: ${test.value.substring(0, 15)}...${test.value.substring(
          test.value.length - 10
        )}`
      );
    } else {
      console.log(`   Value: ${test.value}`);
    }
    passedCount++;
  }
});

console.log("\n=================================");
console.log("📊 SUMMARY");
console.log("=================================\n");

if (hasErrors) {
  console.log("❌ RESULT: ERRORS FOUND!");
  console.log(
    `   Passed: ${passedCount} / ${
      tests.filter((t) => t.required).length
    } required tests`
  );
  console.log("\nPlease fix the issues above in your .env.local file.");
  console.log("After fixing, restart your server: npm run dev");
  process.exit(1);
} else {
  console.log("✅ RESULT: ALL CHECKS PASSED!");
  console.log(`   Passed: ${passedCount} tests`);
  console.log("\nYour environment variables are configured correctly.");
  console.log("Next step: Run the database test");
  console.log("Command: node test-database.js");
}

console.log("=================================\n");
