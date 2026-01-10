// scripts/test-embeddings-setup.ts
// Run this to verify your database is properly configured
// Usage: npx tsx scripts/test-embeddings-setup.ts

import { createServiceClient } from "@/lib/supabase/service";

async function testDatabaseSetup() {
  console.log("🔍 Testing Embeddings Database Setup\n");
  console.log("=".repeat(60));

  const supabase = createServiceClient();
  let allPassed = true;

  // Test 1: Check if table exists
  console.log("\n1️⃣  Checking if website_embeddings table exists...");
  try {
    const { error } = await supabase
      .from("website_embeddings")
      .select("id")
      .limit(1);

    if (error) {
      console.error("   ❌ Table doesn't exist or has wrong schema");
      console.error("   Error:", error.message);
      allPassed = false;
    } else {
      console.log("   ✅ Table exists");
    }
  } catch (error) {
    console.error("   ❌ Error:", error);
    allPassed = false;
  }

  // Test 2: Check if match_website_content function exists
  console.log("\n2️⃣  Checking if match_website_content() function exists...");
  try {
    const testEmbedding = JSON.stringify(Array(1536).fill(0));

    const { error } = await supabase.rpc("match_website_content", {
      query_embedding: testEmbedding,
      match_threshold: 0.5,
      match_count: 1,
      website_url_filter: "https://test.com",
    });

    if (error) {
      if (
        error.message.includes("function") &&
        error.message.includes("does not exist")
      ) {
        console.error("   ❌ Function doesn't exist!");
        console.error("   You need to run: vector_search_function.sql");
        allPassed = false;
      } else {
        // Function exists but returned error (that's OK for test)
        console.log("   ✅ Function exists");
      }
    } else {
      console.log("   ✅ Function exists and works");
    }
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
    allPassed = false;
  }

  // Test 3: Check if match_documents function exists
  console.log("\n3️⃣  Checking if match_documents() function exists...");
  try {
    const testEmbedding = JSON.stringify(Array(1536).fill(0));

    const { error } = await supabase.rpc("match_documents", {
      query_embedding: testEmbedding,
      match_threshold: 0.5,
      match_count: 1,
      filter_website_url: "https://test.com",
    });

    if (error) {
      if (
        error.message.includes("function") &&
        error.message.includes("does not exist")
      ) {
        console.error("   ❌ Function doesn't exist!");
        console.error("   You need to run: create_chat_logs.sql");
        allPassed = false;
      } else {
        // Function exists (error is due to our test data)
        console.log("   ✅ Function exists");
      }
    } else {
      console.log("   ✅ Function exists and works");
    }
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
    allPassed = false;
  }

  // Test 4: Check if check_embeddings_exist function exists
  console.log("\n4️⃣  Checking if check_embeddings_exist() function exists...");
  try {
    const { error } = await supabase.rpc("check_embeddings_exist", {
      website_url_filter: "https://test.com",
    });

    if (error) {
      if (
        error.message.includes("function") &&
        error.message.includes("does not exist")
      ) {
        console.error("   ❌ Function doesn't exist!");
        console.error("   You need to run: add_check_embeddings_exist.sql");
        allPassed = false;
      } else {
        console.log("   ✅ Function exists");
      }
    } else {
      console.log("   ✅ Function exists and works");
    }
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
    allPassed = false;
  }

  // Test 5: Check for existing embeddings
  console.log("\n5️⃣  Checking for existing embeddings...");
  try {
    const { data, error, count } = await supabase
      .from("website_embeddings")
      .select("website_url, page_url", { count: "exact" })
      .limit(10);

    if (error) {
      console.error("   ❌ Error:", error.message);
      allPassed = false;
    } else {
      if (count === 0) {
        console.log("   ⚠️  No embeddings found in database");
        console.log(
          "   This is normal if you haven't ingested any websites yet"
        );
      } else {
        console.log(`   ✅ Found ${count} embeddings`);

        // Show unique websites
        const uniqueWebsites = new Set(
          data?.map((d: { website_url: string }) => d.website_url) || []
        );
        console.log(`   Websites in database:`);
        uniqueWebsites.forEach((url) => {
          console.log(`      - ${url}`);
        });
      }
    }
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
    allPassed = false;
  }

  // Test 6: Check embedding column structure
  console.log("\n6️⃣  Checking embedding column structure...");
  try {
    const { data, error } = await supabase
      .from("website_embeddings")
      .select("embedding")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is OK
      console.error("   ❌ Error:", error.message);
      allPassed = false;
    } else if (data) {
      console.log("   ✅ Embedding column exists and has data");
    } else {
      console.log("   ✅ Embedding column exists (no data yet)");
    }
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
    allPassed = false;
  }

  // Test 7: Check agent helper functions
  console.log("\n7️⃣  Checking agent helper functions...");
  try {
    const { error } = await supabase.rpc("get_agent_stats", {
      p_agent_id: "test-agent-id",
    });

    if (error) {
      if (
        error.message.includes("function") &&
        error.message.includes("does not exist")
      ) {
        console.error("   ❌ get_agent_stats function doesn't exist!");
        allPassed = false;
      } else {
        console.log("   ✅ Agent helper functions exist");
      }
    } else {
      console.log("   ✅ Agent helper functions exist and work");
    }
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
    allPassed = false;
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 SUMMARY\n");

  if (allPassed) {
    console.log("✅ All tests passed! Your database is properly configured.");
    console.log("\nNext steps:");
    console.log("1. Ingest a website: POST /api/ingest");
    console.log("2. Test chat: POST /api/v2/chat");
    console.log("3. Debug: GET /api/debug/embeddings?url=YOUR_URL");
  } else {
    console.log("❌ Some tests failed. Please fix the issues above.");
    console.log("\nMost likely fixes:");
    console.log("1. Run website_embeddings.sql in Supabase SQL Editor");
    console.log("2. Run vector_search_function.sql in Supabase SQL Editor");
    console.log("3. Run add_check_embeddings_exist.sql in Supabase SQL Editor");
    console.log("4. Run agents_conversation_leads.sql for agent functions");
    console.log("5. Re-run this test script");
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

// Run the tests
testDatabaseSetup()
  .then(() => {
    console.log("Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
