import { ContractTag, ITagService } from "atq-types";
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
  query Pools($first: Int!, $lastTimestamp: Int!) {
    pools(
      first: $first
      orderBy: createdAtTimestamp
      orderDirection: asc
      where: { createdAtTimestamp_gt: $lastTimestamp }
    ) {
      id
      feeTier           # returns 500, 3000, 10000
      token0 { symbol }
      token1 { symbol }
      createdAtTimestamp
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
  chainId: string,
  addSuffix = false,
): ContractTag | null {
  // Skip if token symbol is missing or invalid
  if (!sym0 || !sym1) return null;
  const base = `${sym0}/${sym1} ${fee}`;
  const suffix = addSuffix ? `-${address.slice(-4)}` : "";
  const name = base + suffix;
  // Skip if label exceeds 50 characters (registry constraint)
  if (name.length > 50) return null;
  return {
    "Contract Address": `eip155:${chainId}:${address}`,
    "Public Name Tag": name,
    "Project Name": "Uniswap v3",
    "UI/Website Link": "https://uniswap.org",
    "Public Note": `The liquidity pool contract on Uniswap v3 for ${sym0}/${sym1} (fee ${fee}).`,
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
  lastTimestamp: number,
): Promise<T> {
  const resp = await fetch(endpoint(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: POOL_QUERY, variables: { first, lastTimestamp } }),
  });
  const json = (await resp.json()) as GraphResponse<T>;
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

class TagService implements ITagService {
  async returnTags(chainId: string, apiKey: string | null): Promise<ContractTag[]> {
    if (Number(chainId) !== 42161)
      throw new Error(`Unsupported Chain ID: ${chainId}.`);
    if (!apiKey) throw new Error("API key is required");

    const tags: ContractTag[] = [];
    const seenAddr  = new Set<string>();
    const seenLabel = new Set<string>();
    let lastTimestamp = 0;

    while (true) {
      const { pools } = await fetchSubgraph<{ pools: any[] }>(apiKey, PAGE, lastTimestamp);
      if (pools.length === 0) break;

      // Policy change effective August 1, 2025: No longer required to ensure unique Project+Public Name Tag submissions, provided Contract Address is unique and all other fields are compliant.
      for (const p of pools) {
        const sym0 = cleanSymbol(p.token0.symbol);
        const sym1 = cleanSymbol(p.token1.symbol);
        const fee  = (p.feeTier / 10000).toFixed(2) + "%";

        // Only skip duplicate contract address
        if (seenAddr.has(p.id)) continue;

        let tag = buildTag(p.id, sym0, sym1, fee, chainId, false);
        // Skip if tag could not be built (invalid/missing data)
        if (!tag) continue;

        seenAddr.add(p.id);
        tags.push(tag);
      }
      if (pools.length < PAGE) break;
      lastTimestamp = Number(pools[pools.length - 1].createdAtTimestamp);
    }
    return tags;
  }
}

const tagService = new TagService();
export const returnTags = tagService.returnTags.bind(tagService);
