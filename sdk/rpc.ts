/**
 * Shared devnet RPC client — no filesystem, no keys. Safe to import from the
 * examiner's Next bundle (scripts/lib.ts holds the keypair loader and must
 * never be). Override with RPC_URL (e.g. a Helius devnet endpoint).
 */
import { createSolanaRpc } from "@solana/kit";

export const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";

export const rpc = createSolanaRpc(RPC_URL);

/** Default ceiling for a single RPC round-trip on the screening path. */
export const RPC_TIMEOUT_MS = 10_000;

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/** Reject if `p` does not settle within `ms`. */
export function withTimeout<T>(p: Promise<T>, ms: number, label = "RPC call"): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
