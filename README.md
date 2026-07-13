# Permitr

**Permitted payment stablecoin certification for the GENIUS Act era.**

Everyone screens the counterparty. Nobody certifies the coin. Permitr is a citation-backed, versioned onchain registry answering: *is this stablecoin's issuer a "permitted payment stablecoin issuer" under the GENIUS Act (PL 119-27) — and under which pathway?* — wired into agent payments (x402) and rendered as examiner-ready audit records (Solana Attestation Service).

> ## ⚠️ Not legal advice
>
> Permitr is a machine-readable mirror of public law with citations. It is a research and engineering tool, **not legal advice** and not a legal determination of any issuer's status. Classifications are illustrative and cite the statute and proposed rules in effect at the registry version shown.

## What it does

- **Permitr Registry** (Anchor program, Solana devnet) — one `IssuerRecord` PDA per SPL mint. Every substantive field carries a citation (statute § / proposed rule docket / agency action / foreign regime, with an optional book-analysis layer). Records pin the registry version they were authored under. Program-level invariants enforce the statute's structure — e.g. the §18 foreign-issuer *exception* can never be recorded as a permitted pathway (§2(12), §2(23)).
- **Permitr Agent** (TypeScript, x402) — screens every mint offered in a 402 `accepts` list before paying. **Fail-closed allowlist:** a payment is allowed only for `PathwayQualified` mints; missing records, RPC errors, and everything else block.
- **Permitr Attestations** (SAS) — every evaluated payment, blocks included, emits an onchain attestation pinning the verdict, pathway, citations hash, and registry version.
- **Examiner View** (web) — renders any attestation as a plain-English audit record with citations. The trail an examiner can sign off on.

## Architecture

```
x402 402 accepts:[mintA, mintB]          Permitr Registry (Anchor, devnet)
        │                                 IssuerRecord PDA per mint
        ▼                                 pathway · status · citations · version
  Permitr Agent ──queryRegistry(mint)──►  ┌────────────────────────────┐
        │  allowlist: PathwayQualified    │ authority · owner-gated    │
        ▼                                 └────────────────────────────┘
  block / reroute / pay (x402 SVM exact, devnet USDC)
        │
        ▼
  SAS attestation (verdict + citation hash + registry version)
        │
        ▼
  Examiner View — plain-English audit record with citations
```

## Repo layout

```
programs/permitr-registry/   Anchor program (registry)
sdk/                         TS client: queryRegistry(mint) -> Verdict
app/agent/                   x402 payment agent (CDP Solana server wallet)
app/resource-server/         x402-gated resource endpoint
app/examiner/                Examiner View (web)
data/seed/                   Seed IssuerRecords + citations (DRAFT, author-reviewed)
scripts/                     deploy / seed / demo
```

## Status

Hackathon build (BLI Legal Tech Hackathon 2026) — **Solana devnet only**. Seed registry covers four illustrative records: USDC (federal qualified), PYUSD (federal — with its Dec 2025 NYDFS→OCC pathway migration as the registry-versioning showcase), USDG (§18 foreign-issuer exception, conditions unmet — blocked with the cited path), and a fictional ShadyUSD (no pathway — blocked).

As of July 2026 no §5 approvals have been granted, no state regime is certified, and the Act is not yet effective: **every classification is an anticipated pathway, cited, as of the registry version shown.**

## License

Apache-2.0 — see [LICENSE](LICENSE).
