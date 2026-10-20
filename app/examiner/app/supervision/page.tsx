import type { Metadata } from "next";
import {
  STATUS_PLAIN,
  classifyDecision,
  listPaymentAttestations,
} from "../../lib/chain";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Permitr Supervision View — screening docket",
  description:
    "Every payment-screening decision on the Permitr trail, enumerated directly from chain. Examination reporting preview.",
};

function fmt(ts: bigint): string {
  return new Date(Number(ts) * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 16) + " UTC";
}

export default async function Supervision() {
  const records = await listPaymentAttestations().catch(() => null);
  if (!records)
    return (
      <>
        <h1>Permitr Supervision View</h1>
        <div className="banner anomaly">
          Docket temporarily unavailable: the Solana devnet RPC did not return
          the attestation set. No decisions are shown rather than a partial or
          stale docket. Individual audit records remain verifiable at their
          own addresses.
        </div>
      </>
    );
  const counts = { total: records.length, blocked: 0, rerouted: 0, allowed: 0, anomalous: 0 };
  for (const r of records) {
    const { banner } = classifyDecision(r.decoded.decision, r.decoded.status);
    if (banner === "blocked") counts.blocked++;
    else if (banner === "rerouted") counts.rerouted++;
    else if (banner === "allowed") counts.allowed++;
    else counts.anomalous++;
  }

  return (
    <>
      <h1>Permitr Supervision View</h1>
      <p className="docmeta">
        Screening docket · enumerated directly from chain · examination
        reporting preview
      </p>
      <p>
        Every payment evaluated on the Permitr trail, discovered onchain from
        the Permitr credential — no Permitr-operated database or indexer; any
        party can re-derive this docket from public chain data. As of this
        render: <strong>{counts.total} decisions</strong> — {counts.allowed}{" "}
        allowed, {counts.rerouted} rerouted, {counts.blocked} blocked
        {counts.anomalous > 0 && `, ${counts.anomalous} anomalous`}. Each entry
        links to its full audit record.
      </p>

      <h2>Docket</h2>
      <table className="docket">
        <thead>
          <tr>
            <th>Date</th>
            <th>Decision</th>
            <th>Asset</th>
            <th>Screening status</th>
            <th>Reg. v</th>
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const v = classifyDecision(r.decoded.decision, r.decoded.status);
            return (
            <tr key={r.address}>
              <td className="mono">{fmt(r.decoded.timestamp)}</td>
              <td>
                <span
                  className={`decision ${v.anomaly ? "anomaly" : `d${r.decoded.decision}`}`}
                >
                  {v.label}
                </span>
              </td>
              <td className="mono">{r.decoded.mint.slice(0, 8)}…</td>
              <td>{STATUS_PLAIN[r.decoded.status]?.label ?? r.decoded.status}</td>
              <td>v{r.decoded.registry_version}</td>
              <td>
                <a href={`/a/${r.address}`}>view</a>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
        Preview scope: decisions attested under the Permitr credential on
        Solana devnet. Roadmap: filters by entity/period, CSV export, and
        per-regulator views for certified-issuer supervision.
      </p>
    </>
  );
}
