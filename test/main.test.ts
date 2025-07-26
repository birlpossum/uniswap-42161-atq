import { describe, it, expect } from "vitest";
import { returnTags } from "../src/main.mts";

describe("returnTags stub", () => {
  it("throws Unsupported error", async () => {
    await expect(returnTags(1, "key")).rejects.toThrow("Unsupported");
  });
});
