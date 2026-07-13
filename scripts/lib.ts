/** Shared helpers for scripts: RPC clients, wallet signer, send-and-confirm. */
import {
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
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
export const rpcSubscriptions = createSolanaRpcSubscriptions(
  "wss://api.devnet.solana.com",
);

export async function loadWallet(): Promise<KeyPairSigner> {
  const keyfile =
    process.env.SOLANA_KEYPAIR ??
    path.join(homedir(), ".config/solana/id.json");
  const bytes = new Uint8Array(JSON.parse(readFileSync(keyfile, "utf8")));
  return createKeyPairSignerFromBytes(bytes);
}

const sendAndConfirm = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

export async function sendIxs(
  payer: KeyPairSigner,
  ixs: Instruction[],
): Promise<string> {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const tx = await pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstructions(ixs, m),
    (m) => signTransactionMessageWithSigners(m),
  );
  assertIsTransactionWithBlockhashLifetime(tx);
  await sendAndConfirm(tx, { commitment: "confirmed" });
  return getSignatureFromTransaction(tx);
}
