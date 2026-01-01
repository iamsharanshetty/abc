// test-env.js
// Run this to check if your environment variables are loading correctly
// Usage: node test-env.js

console.log("\n=================================");
console.log("🔍 ENVIRONMENT VARIABLES TEST");
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
      console.log(`   Preview: ${test.value.substring(0, 15)}...`);
    } else {
      console.log(`   Value: ${test.value}`);
    }
  }
});

console.log("\n=================================");

if (hasErrors) {
  console.log("❌ RESULT: ERRORS FOUND!");
  console.log("\nPlease fix the issues above.");
  console.log("Make sure your .env.local file exists in the project root.");
  console.log("After fixing, restart your server: npm run dev");
  process.exit(1);
} else {
  console.log("✅ RESULT: ALL CHECKS PASSED!");
  console.log("\nYour environment variables are configured correctly.");
}

console.log("=================================\n");
