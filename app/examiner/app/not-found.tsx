export default function NotFound() {
  return (
    <>
      <h1>No audit record at this address</h1>
      <p className="docmeta">Solana devnet · Permitr Examiner View</p>
      <p>
        No attestation account exists at this address on Solana devnet, or
        the address is not valid base58. Check the address and try again.
      </p>
      <p>
        <a href="/">← Look up another record</a>
      </p>
    </>
  );
}
