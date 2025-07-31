import { ContractTag } from "atq-types";

/** Decode bytes32 → ASCII, strip non-printable & emoji, max 10 chars */
/** Decode 32-byte hex symbols (with _or without_ 0x) → printable ASCII. */
export function cleanSymbol(raw: string): string {
  // If raw is 32-byte hex, allow optional 0x prefix
  const hex32 = raw.startsWith("0x") ? raw.slice(2) : raw;
  if (/^[0-9a-fA-F]{64}$/.test(hex32)) {
    raw = Buffer.from(hex32, "hex")
      .toString("utf8")
      .replace(/\u0000/g, "");
  }

  // Strip everything except ASCII letters, numbers, space, . _ - /
  const ascii = raw.replace(/[^A-Za-z0-9 ._\-/]/g, "").trim();

  // Require 2-10 chars; otherwise treat as invalid (pool will be skipped)
  return ascii.length >= 2 && ascii.length <= 10 ? ascii : "";
}

/** Build a fully-compliant ContractTag or return null if invalid */
export function buildTag(
  address: string,
  sym0: string,
  sym1: string,
  fee: string,
): ContractTag | null {
  if (!sym0 || !sym1) return null;

  const name = `${sym0}/${sym1} ${fee}`;
  if (name.length > 128) return null;

  const note = `Liquidity-pool contract for ${sym0}/${sym1} (fee ${fee}).`;

  return {
    "Contract Address": address,
    "Public Name Tag": name,
    "Project Name": "Uniswap V3",
    "UI/Website Link": `https://app.uniswap.org/explore/pools/arbitrum/${address}`,
    "Public Note": note,
  };
}
