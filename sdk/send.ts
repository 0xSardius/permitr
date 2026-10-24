/** Send-and-confirm for SDK writers (attestations) and scripts. Keyless. */
import {
  appendTransactionMessageInstructions,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Instruction,
  type KeyPairSigner,
  type Signature,
} from "@solana/kit";
import { rpc } from "./rpc";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type SendOptions = {
  /** Called before each retry. If it reports the intended effect is already
   * onchain (e.g. the attestation PDA exists), the earlier attempt landed and
   * no duplicate is sent. */
  landed?: () => Promise<boolean>;
};

async function confirmed(signature: Signature): Promise<boolean> {
  try {
    const { value } = await rpc.getSignatureStatuses([signature]).send();
    const s = value[0];
    return (
      !s?.err &&
      (s?.confirmationStatus === "confirmed" || s?.confirmationStatus === "finalized")
    );
  } catch {
    return false;
  }
}

/**
 * Send + confirm by HTTP polling (no websockets: the public devnet RPC
 * throttles ws connections hard), with pacing + backoff for HTTP 429s.
 * Before every retry it checks whether a previous attempt already landed —
 * a confirmation timeout does not mean the transaction failed.
 */
export async function sendIxs(
  payer: KeyPairSigner,
  ixs: Instruction[],
  opts: SendOptions = {},
): Promise<string> {
  const delays = [0, 2_000, 5_000, 12_000];
  const attempts: Signature[] = [];
  let lastError: unknown;
  for (const delay of delays) {
    if (delay) {
      await sleep(delay);
      for (const sig of attempts) if (await confirmed(sig)) return sig;
      if (opts.landed && (await opts.landed().catch(() => false)))
        return attempts.at(-1) ?? "";
    }
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
      attempts.push(signature);
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
