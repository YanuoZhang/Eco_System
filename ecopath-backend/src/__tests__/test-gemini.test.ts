import { summarizeText } from "../gemini";

console.log("🚀 test-gemini.test.ts started");

async function main() {
  const summary = await summarizeText(
    "Australia is experiencing record-breaking floods due to climate change."
  );
  console.log("✅ Summary:", summary);
  console.log("🎯 Test finished");
}

main().catch(err => console.error("❌ Test failed:", err));
