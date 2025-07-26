// src/constants.mts
export const PAGE = 1000; // subgraph max page size

// Canonical Uniswap-V3 subgraph deployment on Arbitrum One
// same ID we discussed earlier: FbCGRf…Pe9aJM
export function endpoint(apiKey: string): string {
  return (
    "https://gateway-arbitrum.network.thegraph.com/api/" +
    apiKey +
    "/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM"
  );
}
