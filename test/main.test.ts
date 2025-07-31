import { test, expect } from "vitest";
import { returnTags } from "../src/main.mts";

/**
 * Needs ~10-20 s on a cold Graph gateway.
 * Third argument sets a per-test timeout in ms.
 */
test("returns plenty of pools on Arbitrum", async () => {
  const key = process.env.GRAPH_API_KEY ?? "dummy";
  const tags = await returnTags(42161, key);
  expect(tags.length).toBeGreaterThan(19_000);
}, 120_000); // 2-minute timeout
