import fs from "fs";
import { returnTags } from "../dist/main.mjs";

async function main() {
  const key = process.env.GRAPH_API_KEY;
  if (!key) {
    console.error("Please set GRAPH_API_KEY environment variable.");
    process.exit(1);
  }
  const tags = await returnTags(42161, key);
  const header = [
    "Contract Address",
    "Public Name Tag",
    "Project Name",
    "UI/Website Link",
    "Public Note"
  ];
  const csv =
    header.join(",") +
    "\n" +
    tags.map(t => header.map(h => (t[h] ?? "").replace(/"/g, '""')).join(",")).join("\n");
  fs.writeFileSync("uniswap-arb-tags.csv", csv);
  console.log("Exported to uniswap-arb-tags.csv");
}

main().catch(err => { console.error(err); process.exit(1); });
