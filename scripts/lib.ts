/** Shared helpers for scripts: RPC client, wallet signer, send-and-confirm. */
import { createKeyPairSignerFromBytes, type KeyPairSigner } from "@solana/kit";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

// keyless pieces live in the SDK so the examiner bundle never pulls this file
export { rpc } from "../sdk/rpc";
export { sendIxs } from "../sdk/send";

export async function loadWallet(): Promise<KeyPairSigner> {
  const keyfile =
    process.env.SOLANA_KEYPAIR ??
    path.join(homedir(), ".config/solana/id.json");
  const bytes = new Uint8Array(JSON.parse(readFileSync(keyfile, "utf8")));
  return createKeyPairSignerFromBytes(bytes);
}
