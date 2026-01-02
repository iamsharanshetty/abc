// test-database.js - FIXED VERSION
// This version loads .env.local properly before testing
// Usage: node test-database.js

const fs = require("fs");
const path = require("path");

// Function to load .env.local file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    console.log("❌ .env.local file NOT FOUND!");
    console.log("Please create it first.\n");
    return false;
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");

  lines.forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  });

  return true;
}

async function testDatabase() {
  console.log("\n=================================");
  console.log("🔍 DATABASE CONNECTION TEST");
  console.log("=================================\n");

  // Load .env.local first
  console.log("1. Loading .env.local file...");
  if (!loadEnvFile()) {
    process.exit(1);
  }
  console.log("   ✅ Environment loaded\n");

  // Check if we have Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("2. Checking Supabase credentials...");
  console.log("   URL:", supabaseUrl ? "✅ FOUND" : "❌ NOT FOUND");
  console.log("   Key:", supabaseKey ? "✅ FOUND" : "❌ NOT FOUND");

  if (!supabaseUrl || !supabaseKey) {
    console.log("\n❌ Missing Supabase credentials!");
    console.log("Please add to .env.local:");
    console.log("   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co");
    console.log("   SUPABASE_SERVICE_ROLE_KEY=xxx");
    process.exit(1);
  }

  // Try to import Supabase
  let createClient;
  try {
    console.log("\n3. Loading Supabase module...");
    const supabaseModule = await import("@supabase/supabase-js");
    createClient = supabaseModule.createClient;
    console.log("   ✅ Supabase module loaded");
  } catch (err) {
    console.log("   ❌ Supabase module NOT FOUND");
    console.log("   Run: npm install @supabase/supabase-js");
    process.exit(1);
  }

  // Create Supabase client
  console.log("\n4. Creating Supabase client...");
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log("   ✅ Client created");

  // Test connection by fetching agents
  console.log("\n5. Testing database connection...");
  try {
    const { data: agents, error } = await supabase
      .from("agents")
      .select("*")
      .limit(10);

    if (error) {
      console.log("   ❌ Database error:", error.message);
      console.log("\n   Possible causes:");
      console.log('   - Table "agents" does not exist');
      console.log("   - Incorrect database credentials");
      console.log("   - Row Level Security (RLS) blocking access");
      console.log(
        "\n   💡 TIP: Make sure you're using SUPABASE_SERVICE_ROLE_KEY"
      );
      console.log("   The service role key bypasses RLS policies.");
      process.exit(1);
    }

    console.log("   ✅ Connection successful!");
    console.log("\n=================================");
    console.log("📊 AGENTS IN DATABASE");
    console.log("=================================\n");

    if (!agents || agents.length === 0) {
      console.log("⚠️  No agents found in database!\n");
      console.log("This is normal if you just set up the project.");
      console.log("\nTo create an agent:");
      console.log("1. Start your server: npm run dev");
      console.log("2. Go to: http://localhost:3000/dashboard/create");
      console.log("3. Enter a website URL and create an agent");
      console.log("4. Wait for processing to complete");
      console.log("5. Run this test again\n");

      console.log("OR test with a direct agent ID:");
      console.log("http://localhost:3000/embed/chat/YOUR_AGENT_ID");
      console.log("\n=================================\n");
      process.exit(0);
    }

    console.log(`✅ Found ${agents.length} agent(s):\n`);

    agents.forEach((agent, index) => {
      const settings =
        typeof agent.settings === "string"
          ? JSON.parse(agent.settings)
          : agent.settings || {};

      console.log(`${index + 1}. ${agent.name || "Unnamed Agent"}`);
      console.log(`   ID: ${agent.id}`);
      console.log(`   Role: ${agent.role || "Not set"}`);
      console.log(`   Status: ${agent.status || "Unknown"}`);
      console.log(`   Website: ${settings?.url || "Not set"}`);
      console.log(
        `   Created: ${
          agent.created_at
            ? new Date(agent.created_at).toLocaleDateString()
            : "Unknown"
        }`
      );

      // Check if agent has required fields
      const issues = [];
      if (agent.status !== "active") issues.push("Not active");
      if (!settings?.url) issues.push("No website URL");

      if (issues.length > 0) {
        console.log(`   ⚠️  Issues: ${issues.join(", ")}`);
      } else {
        console.log(`   ✅ Ready to use`);
        console.log(
          `   📍 Test URL: http://localhost:3000/embed/chat/${agent.id}`
        );
      }
      console.log("");
    });

    // Check for demo agent
    console.log("=================================");
    console.log("🎯 DEMO PAGE CHECK");
    console.log("=================================\n");

    const demoAgent = agents.find((a) => a.id === "demo");
    if (demoAgent) {
      console.log('✅ "demo" agent found - Demo page will work!');
      console.log("   URL: http://localhost:3000/demo-embed");
    } else {
      console.log('⚠️  No agent with ID "demo" found');
      console.log('\nThe /demo-embed page needs an agent with ID "demo".');
      console.log("\n💡 SOLUTION: Use the embed URL with a real agent ID:");
      console.log(`   http://localhost:3000/embed/chat/${agents[0].id}`);
      console.log("\nOr update your demo page to use this agent ID.");
    }

    // Check embeddings
    console.log("\n=================================");
    console.log("📚 WEBSITE EMBEDDINGS CHECK");
    console.log("=================================\n");

    const { data: embeddings, error: embError } = await supabase
      .from("website_embeddings")
      .select("website_url")
      .limit(5);

    if (embError) {
      console.log("⚠️  Could not check embeddings:", embError.message);
      console.log("   This table might not exist yet.");
    } else if (!embeddings || embeddings.length === 0) {
      console.log("⚠️  No website embeddings found");
      console.log("\nEmbeddings are created when you:");
      console.log("- Create a new agent with a website URL");
      console.log("- The system scrapes and processes the website");
      console.log("- This can take 1-2 minutes");
      console.log("\nWithout embeddings, the agent cannot answer questions.");
    } else {
      console.log("✅ Embeddings found!");
      console.log(`   Found embeddings for ${embeddings.length} website(s)`);
      console.log(
        "\nYour agents can now answer questions about these websites."
      );
    }

    console.log("\n=================================");
    console.log("✅ DATABASE TEST COMPLETE!");
    console.log("=================================\n");

    if (agents.length > 0 && agents[0].status === "active") {
      console.log("🎉 Everything looks good!");
      console.log("\n📍 Next step: Test the chat interface");
      console.log(`   URL: http://localhost:3000/embed/chat/${agents[0].id}`);
      console.log("\n   Or start your server and visit the dashboard:");
      console.log("   npm run dev");
      console.log("   http://localhost:3000/dashboard");
    } else {
      console.log("⚠️  Database is connected, but you need to:");
      console.log("   1. Create an agent (if none exist)");
      console.log('   2. Make sure agents are "active" status');
      console.log("   3. Wait for website processing to complete");
    }

    console.log("\n=================================\n");
  } catch (err) {
    console.log("   ❌ Unexpected error:", err.message);
    console.log("\n   Stack trace:");
    console.log(err.stack);
    process.exit(1);
  }
}

// Run the test
testDatabase().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
