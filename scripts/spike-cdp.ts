/**
 * Day-2 spike: CDP Server Wallet on Solana devnet — create/fetch the agent's
 * account, request faucet funds (USDC + SOL), confirm balances via RPC.
 * Credentials come from .env (CDP_API_KEY_ID / CDP_API_KEY_SECRET /
 * CDP_WALLET_SECRET) — never logged.
 */
import "dotenv/config";
import { CdpClient } from "@coinbase/cdp-sdk";
import { address } from "@solana/kit";
import { rpc } from "./lib.js";

const USDC_DEVNET = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const cdp = new CdpClient();

// 1. enumerate existing accounts (the portal faucet may have funded one already)
const existing = await cdp.solana.listAccounts({});
console.log(`Existing CDP Solana accounts: ${existing.accounts.length}`);
for (const a of existing.accounts) {
  console.log(`  ${a.name ?? "(unnamed)"}: ${a.address}`);
}

// 2. the agent's account (idempotent by name)
const agent = await cdp.solana.getOrCreateAccount({ name: "permitr-agent" });
console.log(`\npermitr-agent: ${agent.address}`);

// 3. faucet — SOL for fees, USDC for the x402 payment
for (const token of ["sol", "usdc"] as const) {
  try {
    const res = await cdp.solana.requestFaucet({
      address: agent.address,
      token,
    });
    console.log(`faucet ${token}: ${res.signature}`);
  } catch (e) {
    console.log(`faucet ${token} failed (may be rate-limited): ${String(e).slice(0, 120)}`);
  }
}

// 4. confirm balances on devnet
await sleep(15_000);
const sol = await rpc.getBalance(address(agent.address)).send();
console.log(`\nSOL balance: ${Number(sol.value) / 1e9}`);
const tokens = await rpc
  .getTokenAccountsByOwner(
    address(agent.address),
    { mint: USDC_DEVNET },
    { encoding: "jsonParsed" },
  )
  .send();
const usdc =
  tokens.value[0]?.account.data.parsed.info.tokenAmount.uiAmountString ?? "0";
console.log(`USDC balance: ${usdc}`);

console.log(`\n✅ CDP spike complete — agent wallet live on devnet.`);
