// src/constants.mts
export const PAGE = 1000; // subgraph max page size

// Canonical Uniswap-V3 subgraph deployment on Arbitrum One
// same ID we discussed earlier: FbCGRf…Pe9aJM
export function endpoint(apiKey?: string): string {
  // If no API key (or a placeholder like "dummy") is provided, fall back to the
  // public The Graph endpoint that does **not** require authentication.  This
  // keeps local and CI test runs from failing when a real key is unavailable.
  if (!apiKey || apiKey === "dummy") {
    return "https://api.thegraph.com/subgraphs/id/FQ6JYszEKApsBpAmiHesRsd9Ygc6mzmpNRANeVQFYoVX";
  }

  // Otherwise use the high-throughput gated endpoint that requires an API key.
  return (
    "https://gateway-arbitrum.network.thegraph.com/api/" +
    apiKey +
    "/subgraphs/id/FQ6JYszEKApsBpAmiHesRsd9Ygc6mzmpNRANeVQFYoVX"
  );
}
