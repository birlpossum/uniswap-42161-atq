import fetch from "node-fetch";

async function main() {
  const key = process.env.GRAPH_API_KEY;
  if (!key) {
    console.error("Please set GRAPH_API_KEY environment variable.");
    process.exit(1);
  }
  const endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${key}/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM`;
  const body = JSON.stringify({ query: "{ factories { poolCount } }" });
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
  const json = await resp.json();
  const count = json?.data?.factories?.[0]?.poolCount;
  console.log("factories[0].totalPoolCount →", count);
}

main().catch(err => { console.error(err); process.exit(1); });
