import { ContractTag } from "atq-types";

/** Decode 32-byte hex (with/without 0x) → printable ASCII, strip junk */
export function cleanSymbol(raw: string): string {
  const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    raw = Buffer.from(hex, "hex")
      .toString("utf8")
      .replace(/\u0000/g, "");
  }
  const txt = raw.replace(/[^0-]/g, "").trim(); // printable ASCII
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
  const suffix = addSuffix ? ` #${address.slice(-4)}` : "";
  const name = base + suffix;

  if (name.length > 128) return null;

  return {
    "Contract Address": address,
    "Public Name Tag": name,
    "Project Name": "Uniswap V3",
    "UI/Website Link": `https://app.uniswap.org/#/pools/${address}`,
    "Public Note": `Liquidity-pool contract for ${sym0}/${sym1} (fee ${fee}).`,
  };
}
