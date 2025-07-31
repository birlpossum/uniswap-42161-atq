import { returnTags } from "../dist/main.mjs";

async function main() {
  const key = process.env.GRAPH_API_KEY;
  if (!key) {
    console.error("Please set GRAPH_API_KEY environment variable.");
    process.exit(1);
  }
  console.time("fetch");
  const tags = await returnTags(42161, key);
  console.timeEnd("fetch");

  console.log("Sample (first 10):");
  console.table(tags.slice(0, 10));
  console.log("Total tags fetched:", tags.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
