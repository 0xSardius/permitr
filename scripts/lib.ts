/** Shared helpers for scripts: RPC client, wallet signer, send-and-confirm. */
import {
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Instruction,
  type KeyPairSigner,
} from "@solana/kit";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export const rpc = createSolanaRpc("https://api.devnet.solana.com");

export async function loadWallet(): Promise<KeyPairSigner> {
  const keyfile =
    process.env.SOLANA_KEYPAIR ??
    path.join(homedir(), ".config/solana/id.json");
  const bytes = new Uint8Array(JSON.parse(readFileSync(keyfile, "utf8")));
  return createKeyPairSignerFromBytes(bytes);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Send + confirm by HTTP polling (no websockets: the public devnet RPC
 * throttles ws connections hard), with pacing + backoff for HTTP 429s.
 */
export async function sendIxs(
  payer: KeyPairSigner,
  ixs: Instruction[],
): Promise<string> {
  const delays = [0, 2_000, 5_000, 12_000];
  let lastError: unknown;
  for (const delay of delays) {
    if (delay) await sleep(delay);
    try {
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
      const tx = await pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayerSigner(payer, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) => appendTransactionMessageInstructions(ixs, m),
        (m) => signTransactionMessageWithSigners(m),
      );
      const signature = getSignatureFromTransaction(tx);
      const wire = getBase64EncodedWireTransaction(tx);
      await rpc
        .sendTransaction(wire, {
          encoding: "base64",
          preflightCommitment: "confirmed",
        })
        .send();

      // poll for confirmation (~2s intervals, up to ~60s)
      for (let i = 0; i < 30; i++) {
        await sleep(2_000);
        const { value } = await rpc
          .getSignatureStatuses([signature])
          .send();
        const status = value[0];
        if (status?.err) throw new Error(`tx ${signature} failed: ${JSON.stringify(status.err)}`);
        if (
          status?.confirmationStatus === "confirmed" ||
          status?.confirmationStatus === "finalized"
        ) {
          await sleep(700); // pace successive sends below the rate limit
          return signature;
        }
      }
      throw new Error(`tx ${signature} not confirmed in time`);
    } catch (e) {
      lastError = e;
      const msg = String(e);
      // retry only transient failures; simulation/program errors surface immediately
      if (!/429|Too Many Requests|TRANSPORT|timed? ?out|not confirmed|fetch failed/i.test(msg))
        throw e;
    }
  }
  throw lastError;
}
