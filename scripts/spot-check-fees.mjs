import { returnTags } from "../dist/main.mjs";

async function main() {
  const key = process.env.GRAPH_API_KEY;
  if (!key) {
    console.error("Please set GRAPH_API_KEY environment variable.");
    process.exit(1);
  }
  const tags = await returnTags(42161, key);
  const buckets = {};
  for (const t of tags) {
    const fee = t["Public Name Tag"].split(" ").pop(); // "0.30%"
    buckets[fee] = (buckets[fee] || 0) + 1;
  }
  console.log("fee buckets:", buckets);
}

main().catch(err => { console.error(err); process.exit(1); });
