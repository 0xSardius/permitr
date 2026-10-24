import { redirect } from "next/navigation";

// One sample per gradation — the registry doesn't say yes/no, it says HOW
// (or why not), and each kind of decision leaves a different audit record.
// All issued Oct 23, 2026 under registry v3 (hash-verified against the
// current record); regenerate after any registry version bump.
const SAMPLES = [
  {
    address: "B2ZWYZn6YdtqDPAUJ2sWRCBRkRVEhHwkaar3SHbJWTFJ",
    label:
      "Allowed — USDC (Circle), anticipated State qualified pathway; agent purchased a compliance verdict",
  },
  {
    address: "5wYWuUwpyqLcaECscV9DhJX2KCbCiJAGoGqW1LgLmZBZ",
    label:
      "Rerouted — non-qualified asset refused, paid with pathway-qualified USDC instead",
  },
  {
    address: "Gr87yFxL5jpgt4Z5KG7dzndWAbQ1KPZF4xTJd3sijiTM",
    label: "Blocked — ShadyUSD, no statutory pathway (§3(a), §3(g))",
  },
  {
    address: "556uoAvf85eU4vLxZEPhWX7J3hJ9U5MQHZ4b35XTyDg8",
    label:
      "Blocked, with a path — USDG (MAS, Singapore): §18 exception identified, conditions unmet (no Treasury comparability determination)",
  },
  {
    address: "HyhjCc97ADZ4Mmc55F9wZvXdVFcXwJm96XnLVnvdPaXp",
    label:
      "Blocked, fail-closed — unregistered mint (wSOL): no registry record, unknown is never allowed",
  },
];

async function lookup(formData: FormData) {
  "use server";
  const addr = String(formData.get("address") ?? "").trim();
  if (addr) redirect(`/a/${encodeURIComponent(addr)}`);
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
        <label htmlFor="address">Attestation address</label>
        <input
          id="address"
          name="address"
          autoComplete="off"
          spellCheck={false}
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
