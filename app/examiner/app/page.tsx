import { redirect } from "next/navigation";

// One sample per gradation — the registry doesn't say yes/no, it says HOW
// (or why not), and each kind of decision leaves a different audit record.
const SAMPLES = [
  {
    address: "8t9TGiSPjjDj4gsYkC4HqsazUDUSkSCoSZiAi4C25vfK",
    label:
      "Allowed — USDC (Circle), federal qualified pathway; agent purchased a compliance verdict",
  },
  {
    address: "HwRxY1t1w3iPRnk5xoX43QiYe4P2ug8ysdzRYq35QYEy",
    label:
      "Rerouted — non-qualified asset refused, paid with pathway-qualified USDC instead",
  },
  {
    address: "4Vx6rgL8uT4Fb6orbHsy2pn2NjS3GfVJAS6tLyhv2S7W",
    label: "Blocked — ShadyUSD, no statutory pathway (§3(a), §3(g))",
  },
  {
    address: "AYrF49PjGsASvR4C4SBTHJuWrWh1BVffHDadMYhoYGJe",
    label:
      "Blocked, with a path — USDG (MAS, Singapore): §18 exception identified, conditions unmet (no Treasury comparability determination)",
  },
  {
    address: "D3SGdXV2VkwUF6CcDVUd6L2QB3adURvuWWzsnMgdXktg",
    label:
      "Blocked, fail-closed — unregistered mint (wSOL): no registry record, unknown is never allowed",
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
      <p>
        <a href="/supervision">
          → Supervision View: the full screening docket, enumerated from chain
        </a>
      </p>
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
