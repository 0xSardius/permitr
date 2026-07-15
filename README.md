<img src="assets/logo.svg" width="320" alt="Permitr — certify the coin">

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
- **Examiner View** (web) — renders any attestation as a plain-English audit record with citations, **live at [permitr.vercel.app](https://permitr.vercel.app)**. Every page independently recomputes the citation hash from the onchain registry. Sample records: [a blocked payment](https://permitr.vercel.app/a/4Vx6rgL8uT4Fb6orbHsy2pn2NjS3GfVJAS6tLyhv2S7W) · [a rerouted payment](https://permitr.vercel.app/a/HwRxY1t1w3iPRnk5xoX43QiYe4P2ug8ysdzRYq35QYEy). The trail an examiner can sign off on.

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

## Quickstart (devnet)

Prereqs: Node 20+, pnpm, Solana CLI (keypair at `~/.config/solana/id.json`, devnet). Rust/Anchor only needed to rebuild the program.

```bash
pnpm install

# query the live registry (no funds needed)
pnpm verify-registry       # all 4 seed verdicts + the fail-closed case

# full demo: boots the gated server, agent screens/blocks/reroutes/pays/attests
pnpm demo                  # AI-narrated with ANTHROPIC_API_KEY in .env;
                           # deterministic output without it
```

Paying requires devnet USDC + SOL in the payer (CDP server wallet via `.env` credentials, or the local keypair as fallback — see `scripts/spike-cdp.ts` for programmatic faucets). Redeploying the registry: `anchor build && anchor deploy --provider.cluster devnet`, then `pnpm codegen && pnpm seed`.

## Live on devnet (verify everything yourself)

| Artifact | Address |
|---|---|
| Registry program | [`3cwNTm2FHSViLLm2gVp62DqS2ttLbHigXWw4XDTbo35Y`](https://explorer.solana.com/address/3cwNTm2FHSViLLm2gVp62DqS2ttLbHigXWw4XDTbo35Y?cluster=devnet) |
| SAS credential (Permitr) | [`91qxSAdW6T3BshWVvP6o68hoLDrFfnFoeRNT68qP6ex8`](https://explorer.solana.com/address/91qxSAdW6T3BshWVvP6o68hoLDrFfnFoeRNT68qP6ex8?cluster=devnet) |
| SAS schema (permitr-payment v1) | [`8fi4naNQJYMQ7uWpvBGMWbrvuvyf6vgp7eLvbTHTJb2Y`](https://explorer.solana.com/address/8fi4naNQJYMQ7uWpvBGMWbrvuvyf6vgp7eLvbTHTJb2Y?cluster=devnet) |
| Sample block attestation (ShadyUSD rejected, §3(a) cited) | [`4Vx6rgL8uT4Fb6orbHsy2pn2NjS3GfVJAS6tLyhv2S7W`](https://explorer.solana.com/address/4Vx6rgL8uT4Fb6orbHsy2pn2NjS3GfVJAS6tLyhv2S7W?cluster=devnet) |
| Sample rerouted-payment attestation | [`HwRxY1t1w3iPRnk5xoX43QiYe4P2ug8ysdzRYq35QYEy`](https://explorer.solana.com/address/HwRxY1t1w3iPRnk5xoX43QiYe4P2ug8ysdzRYq35QYEy?cluster=devnet) |
| Sample x402 payment (devnet USDC) | [`4mFXX946…AnP9nL`](https://explorer.solana.com/tx/4mFXX946mvkfpYznVNJyQuzcFJRY4jdZQtuGdTdPNDoYPG1YGmKovu9ECYzVJ6C7TutiU4rbJEnEjDwdRpAnP9nL?cluster=devnet) |
| ShadyUSD (fictional test mint) | `5pq1R1sx4xLW7YYjKLKr8dCPbFzahv7ppLDXAk5uXcxC` |

Seed registry records (per-mint PDAs, seeds `["issuer", mint]`): USDC devnet `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (federal pathway), PYUSD devnet `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM` (the v1→v2 pathway-migration record), USDG mainnet ref `2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH` (§18 exception, conditions unmet → blocked), ShadyUSD (no pathway → blocked). Citations are DRAFT pending author review.

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
