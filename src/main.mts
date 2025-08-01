import { ContractTag } from "atq-types";
// --- constants ---
export const PAGE = 1000; // The Graph caps page size at 1 000
/**
 * Canonical Uniswap-V3 subgraph on Arbitrum One
 * Deployment ID: FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM
 */
export function endpoint(apiKey?: string): string {
  if (!apiKey || apiKey === "dummy") {
    return "https://api.thegraph.com/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM";
  }
  return `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM`;
}

// --- query ---
export const POOL_QUERY = `
  query Pools($first: Int!, $skip: Int!) {
    pools(
      first: $first
      skip:  $skip
      orderBy: createdAtTimestamp
      orderDirection: asc
    ) {
      id
      feeTier           # returns 500, 3000, 10000
      token0 { symbol }
      token1 { symbol }
    }
  }
`;

// --- utils ---
/** Decode 32-byte hex (with/without 0x) → printable ASCII, strip junk */
export function cleanSymbol(raw: string): string {
  const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    raw = Buffer.from(hex, "hex")
      .toString("utf8")
      .replace(/\u0000/g, "");
  }
  const txt = raw.replace(/[^\u0002-\u007f]/g, "").trim(); // printable ASCII
  return txt.length >= 2 && txt.length <= 32 ? txt : "";
}
/** Build a tag; caller decides whether to add a uniqueness suffix */
export function buildTag(
  address: string,
  sym0: string,
  sym1: string,
  fee: string,
  addSuffix = false,
): ContractTag | null {
  if (!sym0 || !sym1) return null;
  const base = `${sym0}/${sym1} ${fee}`;
  const suffix = addSuffix ? `-${address.slice(-4)}` : "";
  const name = base + suffix;
  if (name.length > 50) return null;
  return {
    "Contract Address": address,
    "Public Name Tag": name,
    "Project Name": "Uniswap V3",
    "UI/Website Link": `https://app.uniswap.org/explore/pools/arbitrum/${address}`,
    "Public Note": `Liquidity-pool contract for ${sym0}/${sym1} (fee ${fee}).`,
  };
}

// --- main logic ---
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
  if (Number(chainId) !== 42161)
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
