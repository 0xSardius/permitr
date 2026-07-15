import { redirect } from "next/navigation";

const SAMPLES = [
  {
    address: "4Vx6rgL8uT4Fb6orbHsy2pn2NjS3GfVJAS6tLyhv2S7W",
    label: "Blocked — ShadyUSD, no statutory pathway (§3(a))",
  },
  {
    address: "HwRxY1t1w3iPRnk5xoX43QiYe4P2ug8ysdzRYq35QYEy",
    label: "Rerouted — paid with USDC after blocking ShadyUSD",
  },
];

async function lookup(formData: FormData) {
  "use server";
  const addr = String(formData.get("address") ?? "").trim();
  if (addr) redirect(`/a/${addr}`);
}

export default function Home() {
  return (
    <>
      <h1>Permitr Examiner View</h1>
      <p className="docmeta">
        GENIUS Act payment-screening audit records · Solana devnet
      </p>
      <p>
        Every payment evaluated by the Permitr Agent — allowed, blocked, or
        rerouted — leaves an onchain attestation pinning the verdict, the
        issuer pathway, the registry version, and a hash of the statutory
        citations it was judged under. Paste an attestation address to render
        it as a plain-English audit record.
      </p>
      <form className="lookup" action={lookup}>
        <input
          name="address"
          placeholder="Attestation address (base58)"
          required
        />
        <button type="submit">Render</button>
      </form>
      <h2>Sample records</h2>
      <ul className="samples">
        {SAMPLES.map((s) => (
          <li key={s.address}>
            <a href={`/a/${s.address}`}>{s.label}</a>
          </li>
        ))}
      </ul>
    </>
  );
}
