import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PATHWAY_PLAIN,
  STATUS_PLAIN,
  SUBTYPE_LABELS,
  classifyDecision,
  PERMITR_CREDENTIAL,
  PERMITR_PAYMENT_SCHEMA,
  getCountersignatures,
  loadAttestation,
  type ForeignAttestation,
} from "../../../lib/chain";
import { PrintButton } from "../../components/print-button";
import { Pathway } from "../../../../../sdk/generated/index";

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
    if (rec.kind === "foreign")
      return {
        title: "Not a Permitr audit record",
        description:
          "This attestation was not issued under the Permitr credential and is not rendered as a Permitr record.",
      };
    const { label, anomaly } = classifyDecision(rec.decoded.decision, rec.decoded.status);
    const issuer = rec.record?.issuerName ?? rec.decoded.mint.slice(0, 8) + "…";
    // only quote a citation when it is provably the one pinned at decision
    const cite = rec.hashVerified
      ? rec.citations.find((c) => c.field === "status")?.reference
      : undefined;
    return {
      title: `Permitr Audit Record — ${label}: ${issuer}`,
      description: anomaly
        ? "Anomalous Permitr record — not a payment approval."
        : cite
          ? `${label} under ${cite}. Registry v${rec.decoded.registry_version}, independently verifiable onchain.`
          : `Payment ${label.toLowerCase()} by Permitr GENIUS Act screening. Registry v${rec.decoded.registry_version}.`,
    };
  } catch {
    return { title: "Permitr Audit Record" };
  }
}

export default async function AuditRecord({ params }: Props) {
  const { address } = await params;
  const rec = await loadAttestation(address).catch(() => null);
  if (!rec) notFound();
  if (rec.kind === "foreign") return <ForeignRecord rec={rec} />;
  const countersignatures = await getCountersignatures(rec.decoded.mint).catch(
    () => [],
  );

  const d = rec.decoded;
  const verdict = classifyDecision(d.decision, d.status);
  const status = STATUS_PLAIN[d.status];
  const pathway = PATHWAY_PLAIN[d.pathway];
  // the subtype comes from the current record, so only show it when the
  // record still agrees with the pathway this attestation pinned
  const subtype =
    d.pathway === Pathway.FederalQualified &&
    rec.record?.pathway === Pathway.FederalQualified
      ? (SUBTYPE_LABELS[rec.record.federalSubtype] ?? null)
      : null;
  const pinnedCitations = rec.hashVerified === true;
  const isTx = d.payment_ref.length > 60; // tx sigs vs screen ids

  return (
    <>
      <PrintButton />
      <h1>Permitr Audit Record</h1>
      <p className="docmeta">
        Attestation <code>{rec.attestationAddress}</code>
        {" · issued under the Permitr credential · "}
        <a
          href={`https://explorer.solana.com/address/${rec.attestationAddress}?cluster=devnet`}
        >
          view raw onchain
        </a>
      </p>

      <div className={`banner ${verdict.banner}`}>
        {verdict.anomaly ? (
          <>
            ANOMALOUS RECORD — decision code {d.decision} with screening status{" "}
            {status?.label ?? d.status}. This record does not evidence an
            allowed payment.
          </>
        ) : (
          <>
            Payment {verdict.label.toUpperCase()}
            {d.decision === 2 &&
              " — non-qualified asset refused, paid with a qualified asset"}
          </>
        )}
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

      <h2>
        {pinnedCitations || !rec.record
          ? `Statutory citations (registry v${d.registry_version})`
          : `Current registry citations (v${rec.record.registryVersion})`}
      </h2>
      {rec.record && !pinnedCitations && (
        <p className="verify fail">
          These are the citations on the registry record as it stands today
          {rec.versionMatches === false
            ? ` (v${rec.record.registryVersion}; this decision pinned v${d.registry_version})`
            : ""}
          . They could not be verified as the citation set relied on at
          decision time — see Verification below.
        </p>
      )}
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
          v{d.registry_version} — pinned in this attestation at decision time
          (the attestation itself is immutable)
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
            : `✗ Hash mismatch: the citation hash recomputed from the current registry record (v${rec.record?.registryVersion}) does not match the hash pinned in this attestation (v${d.registry_version}). The citations shown above are the current record's and are not verified as those relied on at decision time.`}
      </p>
    </>
  );
}

function ForeignRecord({ rec }: { rec: ForeignAttestation }) {
  return (
    <>
      <h1>Not a Permitr audit record</h1>
      <div className="banner anomaly">
        This attestation exists onchain but was not issued under the Permitr
        credential and payment schema. It is not decoded or presented as a
        Permitr decision, and it is not evidence of any Permitr screening.
      </div>
      <dl>
        <dt>Attestation</dt>
        <dd>
          <code>{rec.attestationAddress}</code>
        </dd>
        <dt>Credential</dt>
        <dd>
          <code>{rec.credential}</code>
          <br />
          <span style={{ color: "var(--muted)" }}>
            expected <code>{PERMITR_CREDENTIAL}</code>
          </span>
        </dd>
        <dt>Schema</dt>
        <dd>
          <code>{rec.schema}</code>
          <br />
          <span style={{ color: "var(--muted)" }}>
            expected <code>{PERMITR_PAYMENT_SCHEMA}</code>
          </span>
        </dd>
      </dl>
      <p>
        <a
          href={`https://explorer.solana.com/address/${rec.attestationAddress}?cluster=devnet`}
        >
          View raw onchain
        </a>
      </p>
    </>
  );
}
