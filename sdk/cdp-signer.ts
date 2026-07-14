/**
 * Adapt a CDP Server Wallet Solana account into a @solana/kit
 * TransactionModifyingSigner, usable as the x402 SVM ClientSvmSigner.
 *
 * The private key never leaves CDP's TEE: we serialize the transaction,
 * CDP signs it server-side (authenticated by the Wallet Secret), and we
 * decode the signed wire bytes back into a kit transaction.
 */
import {
  address,
  getBase64EncodedWireTransaction,
  getTransactionDecoder,
  type Transaction,
  type TransactionModifyingSigner,
} from "@solana/kit";

type CdpSolanaAccount = {
  address: string;
  signTransaction: (options: {
    transaction: string;
  }) => Promise<{ signedTransaction: string }>;
};

export function cdpKitSigner(
  account: CdpSolanaAccount,
): TransactionModifyingSigner {
  return {
    address: address(account.address),
    async modifyAndSignTransactions(transactions: readonly Transaction[]) {
      const decoder = getTransactionDecoder();
      return Promise.all(
        transactions.map(async (tx) => {
          const wire = getBase64EncodedWireTransaction(tx);
          const { signedTransaction } = await account.signTransaction({
            transaction: wire,
          });
          const signed = decoder.decode(
            Buffer.from(signedTransaction, "base64"),
          );
          // preserve the input's branded lifetime/size metadata; only the
          // signatures map changes
          return Object.freeze({ ...tx, signatures: signed.signatures });
        }),
      );
    },
  } as unknown as TransactionModifyingSigner;
}
