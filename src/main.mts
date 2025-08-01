import fetch from "node-fetch";
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
const POOL_QUERY = `
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

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function containsHtmlOrMarkdown(text: string): boolean {
  return /<[^>]+>/.test(text);
}

function truncateString(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 3) + "...";
  }
  return text;
}

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
/**
 * Transform pools into ContractTag objects, applying policy and field validation.
 */
function transformPoolsToTags(chainId: string, pools: any[]): ContractTag[] {
  const validPools: any[] = [];
  pools.forEach((p) => {
    const fee = (p.feeTier / 10000).toFixed(2) + "%";
    const poolSymbolInvalid = containsHtmlOrMarkdown(p.token0.symbol) || containsHtmlOrMarkdown(p.token1.symbol) || !p.token0.symbol || !p.token1.symbol;
    if (poolSymbolInvalid) {
      console.log("Pool rejected due to HTML content in token symbol: " + JSON.stringify(p));
    } else {
      validPools.push(p);
    }
  });
  return validPools.map((p) => {
    const maxSymbolsLength = 45;
    const sym0 = truncateString(p.token0.symbol, maxSymbolsLength);
    const sym1 = truncateString(p.token1.symbol, maxSymbolsLength);
    const fee = (p.feeTier / 10000).toFixed(2) + "%";
    return {
      "Contract Address": `eip155:${chainId}:${p.id}`,
      "Public Name Tag": `${sym0}/${sym1} ${fee}`,
      "Project Name": "Uniswap v3",
      "UI/Website Link": "https://uniswap.org",
      "Public Note": `The liquidity pool contract on Uniswap v3 for ${sym0}/${sym1} (fee ${fee}).`,
    };
  });
}


// --- main logic ---
interface GraphResponse<T> {
  data: T;
  errors?: unknown;
}

async function fetchPools(apiKey: string, lastTimestamp: number): Promise<any[]> {
  const resp = await fetch(endpoint(apiKey), {
    method: "POST",
    headers,
    body: JSON.stringify({ query: POOL_QUERY, variables: { first: PAGE, lastTimestamp } }),
  });
  if (!resp.ok) {
    throw new Error(`HTTP error: ${resp.status}`);
  }
  const json = (await resp.json()) as {
    data?: { pools: any[] };
    errors?: { message: string }[];
  };
  if (json.errors) {
    json.errors.forEach((error) => {
      console.error(`GraphQL error: ${error.message}`);
    });
    throw new Error("GraphQL errors occurred: see logs for details.");
  }
  if (!json.data || !json.data.pools) {
    throw new Error("No pools data found.");
  }
  return json.data.pools;
}


class TagService implements ITagService {
  returnTags = async (
    chainId: string,
    apiKey: string
  ): Promise<ContractTag[]> => {
    if (Number(chainId) !== 42161)
      throw new Error(`Unsupported Chain ID: ${chainId}.`);
    if (!apiKey) throw new Error("API key is required");
    let lastTimestamp = 0;
    const tags: ContractTag[] = [];
    const seenAddr = new Set<string>();
    while (true) {
      let pools: any[];
      try {
        pools = await fetchPools(apiKey, lastTimestamp);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`An error occurred: ${error.message}`);
          throw new Error(`Failed fetching data: ${error}`);
        } else {
          console.error("An unknown error occurred.");
          throw new Error("An unknown error occurred during fetch operation.");
        }
      }
      if (pools.length === 0) break;
      // Policy change effective August 1, 2025: No longer required to ensure unique Project+Public Name Tag submissions, provided Contract Address is unique and all other fields are compliant.
      for (const p of pools) {
        if (seenAddr.has(p.id)) continue;
        const tagsForPool = transformPoolsToTags(chainId, [p]);
        if (tagsForPool.length === 0) continue;
        seenAddr.add(p.id);
        tags.push(...tagsForPool);
      }
      if (pools.length < PAGE) break;
      lastTimestamp = Number(pools[pools.length - 1].createdAtTimestamp);
    }
    return tags;
  };
}

const tagService = new TagService();
export const returnTags = tagService.returnTags;
