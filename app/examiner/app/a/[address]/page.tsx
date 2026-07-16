import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DECISION_LABELS,
  PATHWAY_PLAIN,
  STATUS_PLAIN,
  SUBTYPE_LABELS,
  getCountersignatures,
  loadAttestation,
} from "../../../lib/chain";
import { PrintButton } from "../../components/print-button";
import { FederalSubtype } from "../../../../../sdk/generated/index";

export const revalidate = 300; // attestations are immutable; cache renders

type Props = { params: Promise<{ address: string }> };

function fmt(ts: bigint | number): string {
  return new Date(Number(ts) * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  try {
    const rec = await loadAttestation(address);
    if (!rec) return { title: "Attestation not found — Permitr" };
    const decision = DECISION_LABELS[rec.decoded.decision] ?? "Evaluated";
    const issuer = rec.record?.issuerName ?? rec.decoded.mint.slice(0, 8) + "…";
    const cite = rec.citations.find((c) => c.field === "status")?.reference;
    return {
      title: `Permitr Audit Record — ${decision}: ${issuer}`,
      description: cite
        ? `${decision} under ${cite}. Registry v${rec.decoded.registry_version}, independently verifiable onchain.`
        : `Payment ${decision.toLowerCase()} by Permitr GENIUS Act screening.`,
    };
  } catch {
    return { title: "Permitr Audit Record" };
  }
}

export default async function AuditRecord({ params }: Props) {
  const { address } = await params;
  const rec = await loadAttestation(address).catch(() => null);
  if (!rec) notFound();
  const countersignatures = await getCountersignatures(rec.decoded.mint).catch(
    () => [],
  );

  const d = rec.decoded;
  const decision = DECISION_LABELS[d.decision] ?? `Decision ${d.decision}`;
  const bannerClass =
    d.decision === 1 ? "blocked" : d.decision === 2 ? "rerouted" : "allowed";
  const status = STATUS_PLAIN[d.status];
  const pathway = PATHWAY_PLAIN[d.pathway];
  const subtype =
    rec.record && rec.record.federalSubtype !== FederalSubtype.NotApplicable
      ? SUBTYPE_LABELS[rec.record.federalSubtype]
      : null;
  const isTx = d.payment_ref.length > 60; // tx sigs vs screen ids

  return (
    <>
      <PrintButton />
      <h1>Permitr Audit Record</h1>
      <p className="docmeta">
        Attestation <code>{rec.attestationAddress}</code>
        {" · "}
        {rec.issuedByPermitr
          ? "issued under the Permitr credential"
          : "⚠ NOT issued under the Permitr credential"}
        {" · "}
        <a
          href={`https://explorer.solana.com/address/${rec.attestationAddress}?cluster=devnet`}
        >
          view raw onchain
        </a>
      </p>

      <div className={`banner ${bannerClass}`}>
        Payment {decision.toUpperCase()}
        {d.decision === 2 && " — non-qualified asset refused, paid with a qualified asset"}
      </div>

      <h2>Asset &amp; issuer</h2>
      <dl>
        <dt>Asset (SPL mint)</dt>
        <dd>
          <code>{d.mint}</code>
        </dd>
        <dt>Issuer</dt>
        <dd>{rec.record?.issuerName ?? "No registry record (fail-closed: blocked)"}</dd>
        <dt>Issuer pathway</dt>
        <dd>
          {pathway ? (
            <>
              <strong>{pathway.label}</strong>
              {subtype ? ` — ${subtype}` : null}
              <br />
              <span style={{ color: "var(--muted)" }}>{pathway.plain}</span>
            </>
          ) : (
            "n/a"
          )}
        </dd>
        <dt>Screening status</dt>
        <dd>
          <strong>{status?.label ?? d.status}</strong>
          <br />
          <span style={{ color: "var(--muted)" }}>{status?.plain}</span>
        </dd>
      </dl>

      <h2>Statutory citations (registry v{d.registry_version})</h2>
      {rec.citations.length === 0 && (
        <p>
          No registry record exists for this asset. Under Permitr&rsquo;s
          fail-closed rule, the absence of a record is itself the basis for
          blocking: an unknown asset is never treated as permitted.
        </p>
      )}
      {rec.citations.map((c, i) => (
        <div className="cite" key={i}>
          <span className="authority">{c.authority}</span>
          <span className="field">{c.field} basis</span>
          <div className="reference">{c.reference}</div>
          <p className="summary">{c.summary}</p>
        </div>
      ))}

      {countersignatures.length > 0 && (
        <>
          <h2>Regulator actions on file</h2>
          {countersignatures.map((c) => (
            <div className="cite" key={c.attestation}>
              <span className="authority">
                {c.simulated ? "⚠ SIMULATED CREDENTIAL" : "Regulator"}
              </span>
              <span className="field">{c.regulator}</span>
              <div className="reference">{c.reference}</div>
              <p className="summary">
                {c.summary}{" "}
                <a
                  href={`https://explorer.solana.com/address/${c.attestation}?cluster=devnet`}
                >
                  (onchain countersignature)
                </a>
              </p>
            </div>
          ))}
        </>
      )}

      <h2>Verification</h2>
      <dl>
        <dt>Evaluated at</dt>
        <dd>{fmt(d.timestamp)}</dd>
        <dt>Registry version</dt>
        <dd>
          v{d.registry_version} — pinned at decision time; later registry
          changes cannot alter this record
        </dd>
        <dt>Payment reference</dt>
        <dd>
          {isTx ? (
            <a href={`https://explorer.solana.com/tx/${d.payment_ref}?cluster=devnet`}>
              <code>{d.payment_ref.slice(0, 20)}…</code> (settlement
              transaction)
            </a>
          ) : (
            <code>{d.payment_ref}</code>
          )}
        </dd>
        <dt>Citation hash</dt>
        <dd>
          <code>
            {Buffer.from(d.citation_hash).toString("hex").slice(0, 24)}…
          </code>
        </dd>
      </dl>
      <p
        className={`verify ${
          rec.hashVerified === null ? "" : rec.hashVerified ? "ok" : "fail"
        }`}
      >
        {rec.hashVerified === null
          ? "Citation hash cannot be recomputed: no registry record exists for this asset (consistent with a fail-closed block)."
          : rec.hashVerified
            ? "✓ Independently verified: the citation hash recomputed from the current onchain registry record matches the hash pinned in this attestation."
            : "✗ The current registry record's citations differ from those pinned here — the registry has been amended since this decision. The attestation remains an accurate record of what was cited at decision time."}
      </p>
    </>
  );
}
