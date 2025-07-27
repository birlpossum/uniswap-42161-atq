// src/constants.ts
export const PAGE = 1000; // The Graph caps page size at 1 000

/**
 * Canonical Uniswap-V3 subgraph on Arbitrum One
 * Deployment ID: FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM
 */
export function endpoint(apiKey?: string): string {
  // If CI or a dev machine runs with no real key, fall back to the public host.
  if (!apiKey || apiKey === "dummy") {
    return "https://api.thegraph.com/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM";
  }

  // Preferred high-throughput gateway that requires an API key.
  return `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM`;
}
