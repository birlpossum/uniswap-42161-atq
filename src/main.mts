import { ContractTag } from "atq-types";
import { endpoint, PAGE } from "./constants";
import { POOL_QUERY } from "./query";

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
  let skip = 0;

  while (true) {
    const { pools } = await fetchSubgraph<{ pools: any[] }>(apiKey, PAGE, skip);
    if (pools.length === 0) break;

    for (const p of pools) {
      if (!p.token0?.symbol || !p.token1?.symbol) continue;

      tags.push({
        "Contract Address": p.id,
        "Public Name Tag": `${p.token0.symbol}/${p.token1.symbol} ${(p.feeTier / 10000).toFixed(2)}%`,
        "Project Name": "Uniswap V3",
        "UI/Website Link": "",
        "Public Note": "",
      });
    }
    skip += PAGE;
  }
  return tags;
}
