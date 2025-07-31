import { ContractTag } from "atq-types";
import { endpoint, PAGE } from "./constants.js";
import { POOL_QUERY } from "./query.js";
import { cleanSymbol, buildTag } from "./utils.js";

interface GraphResponse<T> {
  data: T;
  errors?: unknown;
}

async function fetchSubgraph<T>(
  apiKey: string,
  first: number,
  skip: number,
): Promise<T> {
  const resp = await fetch(endpoint(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: POOL_QUERY, variables: { first, skip } }),
  });
  const json = (await resp.json()) as GraphResponse<T>;
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

export async function returnTags(
  chainId: number,
  apiKey: string,
): Promise<ContractTag[]> {
  if (chainId !== 42161)
    throw new Error(`Unsupported Chain ID: ${chainId}.`);

  const tags: ContractTag[] = [];
  const seenAddr  = new Set<string>();
  const seenLabel = new Set<string>();
  let skip = 0;

  while (true) {
    const { pools } = await fetchSubgraph<{ pools: any[] }>(apiKey, PAGE, skip);
    if (pools.length === 0) break;

    for (const p of pools) {
      const sym0 = cleanSymbol(p.token0.symbol);
      const sym1 = cleanSymbol(p.token1.symbol);
      const fee  = (p.feeTier / 10000).toFixed(2) + "%";

      if (seenAddr.has(p.id)) continue;

      // 1️⃣ try plain label
      let tag = buildTag(p.id, sym0, sym1, fee, false);
      if (!tag) continue;

      const key = `${tag["Project Name"]}|${tag["Public Name Tag"]}`;

      // 2️⃣ if collision, rebuild with suffix
      if (seenLabel.has(key)) {
        tag = buildTag(p.id, sym0, sym1, fee, true)!;
      }

      seenAddr.add(p.id);
      seenLabel.add(`${tag["Project Name"]}|${tag["Public Name Tag"]}`);
      tags.push(tag);
    }
    skip += PAGE;
  }
  return tags;
}
