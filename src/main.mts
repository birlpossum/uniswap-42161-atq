import { ContractTag } from "atq-types";

/**
 * Return address tags for a given chain.
 * Stub implementation – replace with protocol-specific logic.
 */
export async function returnTags(chainId: number, _apiKey: string): Promise<ContractTag[]> {
  throw new Error(`Unsupported Chain ID: ${chainId}.`);
}
