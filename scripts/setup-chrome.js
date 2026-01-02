// scripts/setup-chrome.js
const { execSync } = require("child_process");

// Only install Chrome locally, not in Vercel/serverless environments
const isServerless =
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_VERSION ||
  process.env.TRIGGER_ENV;

if (!isServerless) {
  console.log("📦 Installing Chrome for local development...");
  try {
    execSync("npx puppeteer browsers install chrome", { stdio: "inherit" });
    console.log("✅ Chrome installed successfully");
  } catch (error) {
    console.error("⚠️  Failed to install Chrome, but continuing anyway");
    console.error("You may need to run: npx puppeteer browsers install chrome");
  }
} else {
  console.log(
    "☁️  Serverless environment detected, skipping Chrome installation"
  );
  console.log("   @sparticuz/chromium will be used instead");
}
