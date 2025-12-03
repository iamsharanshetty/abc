import { runTests } from "@/lib/services/tester";

async function main() {
  console.log("Starting content parser tests...\n");
  await runTests();
}

main().catch(console.error);
