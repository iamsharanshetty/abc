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
        console.error("   You need to run: vector_search_functions.sql");
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

  // Test 3: Check if match_website_embeddings function exists
  console.log(
    "\n3️⃣  Checking if match_website_embeddings() function exists..."
  );
  try {
    // For this function, we need to pass a vector type, not a string
    // So we'll just check via a different method
    const { data, error } = await supabase.rpc("match_website_embeddings", {
      query_embedding: "[0.1]", // This will fail, but tells us if function exists
      match_threshold: 0.5,
      match_count: 1,
      website_url: "https://test.com",
    });

    if (error) {
      if (
        error.message.includes("function") &&
        error.message.includes("does not exist")
      ) {
        console.error("   ❌ Function doesn't exist!");
        console.error("   You need to run: vector_search_functions.sql");
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
        console.error("   You need to run: vector_search_functions.sql");
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
        const uniqueWebsites = new Set(data?.map((d) => d.website_url) || []);
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

  // Test 6: Check vector extension
  console.log("\n6️⃣  Checking if pgvector extension is enabled...");
  try {
    const { data, error } = await supabase
      .from("pg_extension")
      .select("extname")
      .eq("extname", "vector");

    if (error) {
      console.error(
        "   ⚠️  Cannot check extensions (this is OK in production)"
      );
    } else if (data && data.length > 0) {
      console.log("   ✅ pgvector extension is enabled");
    } else {
      console.error("   ❌ pgvector extension not found");
      console.error("   Run: CREATE EXTENSION vector;");
      allPassed = false;
    }
  } catch (error: any) {
    console.log("   ⚠️  Cannot verify extension status");
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 SUMMARY\n");

  if (allPassed) {
    console.log("✅ All tests passed! Your database is properly configured.");
    console.log("\nNext steps:");
    console.log("1. Ingest a website: POST /api/v2/ingest");
    console.log("2. Test chat: POST /api/v2/chat");
    console.log("3. Debug: GET /api/debug/embeddings?url=YOUR_URL");
  } else {
    console.log("❌ Some tests failed. Please fix the issues above.");
    console.log("\nMost likely fix:");
    console.log("1. Run vector_search_functions.sql in Supabase SQL Editor");
    console.log("2. Verify the table schema is correct");
    console.log("3. Re-run this test script");
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
