// src/query.mts
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
