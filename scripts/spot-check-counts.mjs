import { returnTags } from "../dist/main.mjs";

async function main() {
  const key = process.env.GRAPH_API_KEY;
  if (!key) {
    console.error("Please set GRAPH_API_KEY environment variable.");
    process.exit(1);
  }
  const tags = await returnTags(42161, key);
  console.log("total tags  →", tags.length); // expect ≥22 000
  const dup = new Set(), seen = new Set();
  for (const t of tags) {
    if (seen.has(t["Contract Address"])) dup.add(t["Contract Address"]);
    else seen.add(t["Contract Address"]);
  }
  console.log("duplicate addresses →", dup.size); // expect 0
  const blanks = tags.filter(t => !t["Public Name Tag"].trim()).length;
  console.log("blank symbols →", blanks); // expect 0
}

main().catch(err => { console.error(err); process.exit(1); });
