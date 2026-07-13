# Permitr — Technical Implementation Spec

Companion to `PRD.md`. This is the doc you (or a coding agent) build directly from.
**Target:** Solana devnet · Anchor (Rust) · TypeScript agent · SAS attestations.

---

## 0. Environment (WSL2 / Ubuntu)

**Keep the project inside the WSL filesystem** (`~/dev/permitr`), *never* under `/mnt/c/...` — cross-mount Rust builds are pathologically slow and break file watching.

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
# Anchor via avm
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest && avm use latest
# Node (via nvm) + pnpm
```

Devnet setup:
```bash
solana config set --url devnet
solana-keygen new -o ~/.config/solana/id.json
solana airdrop 5
```

**Toolchain note (verified Jul 13, 2026):** installed pairing is anchor-cli 1.1.2 + Agave 4.0.2. Anchor 1.1.x's best-tested pairing is **Solana CLI 3.1.10** (Anchor's own CI pin); no documented breakage with 4.x, but no endorsement either. If `anchor build` misbehaves at all, immediately `agave-install init 3.1.10` rather than debugging.

**Day-1 gate:** `anchor build && anchor deploy --provider.cluster devnet` succeeds before anything else is attempted.

**Day-1 spikes (time-boxed ~1–2h each, same day — do not defer to the day that depends on them):**
1. CDP Solana server wallet created; devnet SOL + USDC via `cdp.solana.requestFaucet` (supplement SOL from faucet.solana.com); facilitator answers on Solana devnet.
2. One SAS attest + fetch round-trip on devnet (`sas-lib`; follow the official gill-based devnet demo).

---

## 1. Repo layout

```
permitr/
├── PRD.md
├── SPEC.md
├── README.md            # incl. disclaimer (PRD §8)
├── LICENSE              # Apache-2.0
├── programs/
│   └── permitr-registry/    # Anchor program (Rust)
├── app/
│   ├── agent/           # Permitr Agent (x402 consumer, TS)
│   ├── resource-server/ # x402-gated endpoint serving the book chapter
│   └── examiner/        # Examiner View (web)
├── sdk/                 # TS client: queryRegistry(mint) -> Verdict
├── data/
│   └── seed/            # 4 IssuerRecord seed entries (JSON) + citations
└── scripts/             # deploy, seed, demo-run
```

---

## 2. Core data model — `IssuerRecord`

One PDA per token mint. **This is the core IP; get the schema right before writing the program.**

Enums are aligned to the enacted statute (PL 119-27): §2(23) defines exactly **three** permitted-issuer categories, and the foreign route is an **exception** (§18) available only to issuers who are definitionally *not* permitted issuers (§2(12)) — it must not sit inside a "permitted" frame.

```rust
#[account]
#[derive(InitSpace)]
pub struct IssuerRecord {
    pub mint: Pubkey,               // SPL mint this record certifies
    #[max_len(64)]
    pub issuer_name: String,        // "Circle National Trust, N.A.", "Paxos Trust Company", ...
    pub pathway: Pathway,           // which statutory pathway/exception (or none)
    pub federal_subtype: FederalSubtype, // §2(11)(A)-(C); NotApplicable unless FederalQualified
    pub status: Status,             // verdict (anticipated classification, cited)
    #[max_len(2)]
    pub pathway_basis: Vec<Citation>,    // [primary authority, optional BookSection analysis]
    #[max_len(2)]
    pub status_basis: Vec<Citation>,     // why this status, cited (supports negative-citation pattern)
    #[max_len(2)]
    pub reserve_basis: Vec<Citation>,    // reserve requirement + source
    #[max_len(2)]
    pub redemption_basis: Vec<Citation>, // redemption requirement + source
    pub registry_version: u32,      // pinned into every attestation
    pub updated_at: i64,            // unix ts
    pub authority: Pubkey,          // owner-gated writes (MVP)
    pub bump: u8,                   // PDA bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum Pathway {
    IdiSubsidiary,        // §2(23)(A) — subsidiary of insured depository institution
    FederalQualified,     // §2(23)(B) via §2(11) — see FederalSubtype
    StateQualified,       // §2(23)(C), §2(31), §4(c) ($10B election)
    ForeignSection18,     // §18 EXCEPTION — not a permitted pathway (§2(12))
    NoPathway,            // no statutory basis identified (e.g. ShadyUSD)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum FederalSubtype {
    OccApprovedNonbank,       // §2(11)(A)
    UninsuredNationalBank,    // §2(11)(B) — nat'l trust charters (Circle, Paxos)
    FederalBranch,            // §2(11)(C)
    NotApplicable,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum Status {
    PathwayQualified,         // anticipated permitted-issuer pathway, cited → agent may pay
    ExceptionConditionsUnmet, // §18 identified; conditions not currently satisfiable → BLOCK, render the path
    NoPathwayIdentified,      // → BLOCK
    Unknown,                  // CLIENT-SIDE ONLY: no PDA / RPC failure → BLOCK (never written on-chain)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Citation {
    pub authority: CiteSource,
    #[max_len(96)]
    pub reference: String,      // "GENIUS Act §18(a), PL 119-27" / "OCC NPRM, 91 FR 10202" / "Ch. 4 §2"
    #[max_len(160)]
    pub summary: String,        // one plain-English line for the Examiner View
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum CiteSource {
    Statute,       // PL 119-27 sections
    ProposedRule,  // NPRMs + ANPRMs (OCC 91 FR 10202, FINCEN-2026-0100, ...)
    AgencyAction,  // OCC approvals/conversions, Treasury determinations
    ForeignRegime, // e.g. MAS stablecoin framework (USDG redemption basis)
    BookSection,   // author's analysis layer — always second in a Vec, never primary
}
```

**Citation conventions (confirmed):** each `*_basis` is a `Vec<Citation>` (max 2): primary authority first, optional `BookSection` analysis second — Examiner View renders "Authority: … · Analysis: …". **Negative-citation pattern** (USDG status): `reference` cites the closest affirmative act ("Treasury GENIUS ANPRM, 90 FR 46592 (Sept 19, 2025)"), `summary` carries the negative finding ("No comparability determination for Singapore/MAS as of this registry version") — the version pin makes the negative claim auditable. **§2(11) call:** OCC national trust charters (Circle National Trust, Paxos Trust) classify as `FederalQualified / UninsuredNationalBank` per §2(11)(B), with status noting no §5 approval has occurred pre-effective-date.

Sizing via `#[derive(InitSpace)]` + `#[max_len]` (space = `8 + IssuerRecord::INIT_SPACE`); ~2.4 KB per record with 2-citation Vecs — rent is trivial. `Status::Unknown` exists only for clean u8 ↔ TS mapping; it originates client-side on a PDA miss or RPC error, never on-chain.

> ⚠️ **Citation strings — DRAFT status.** Statutory anchors are now source-verified against the GPO slip law (PL 119-27, govinfo): §2(23) definition, §2(11)/(12)/(31) issuer types, §3(a)/(b)(1)/(g) prohibitions, §4(a)(1)(A) reserves, §4(a)(1)(B) redemption, §4(c) state election, §18 foreign exception, §20 effective date — plus NPRM dockets (OCC 91 FR 10202; FDIC RIN 3064-AG19; FinCEN docket FINCEN-2026-0100; Treasury state-principles FR Doc. 2026-06489). Final `reference`/`summary` strings are drafted from these anchors **pending author review against the book** — never invent references beyond the verified set.

**PDA derivation:** `seeds = [b"issuer", mint.as_ref()]`.

**Account sizing:** cap `String` lengths explicitly (e.g. `issuer_name` ≤ 64, `reference` ≤ 96, `summary` ≤ 160) and compute `space` accordingly — don't leave it unbounded.

---

## 3. Program instructions

| Instruction | Signer | Effect |
|---|---|---|
| `initialize_registry(version: u32)` | authority | Creates registry config PDA; sets version |
| `upsert_issuer_record(args: IssuerRecordArgs)` | authority | Creates/updates the `IssuerRecord` PDA for a mint |
| `bump_registry_version()` | authority | Increments version (pinned into future attestations) |

Reads are client-side (fetch PDA by mint; no instruction needed). Optionally add a CPI-friendly `assert_permitted(mint)` if you want on-chain consumers — **not required for the demo, skip it if time is tight.**

**Fail-closed rule (important — allowlist, not blocklist):** the agent's decision function allows a payment **only if `status == PathwayQualified`**. Everything else falls through to block: `ExceptionConditionsUnmet`, `NoPathwayIdentified`, `Unknown`, a missing PDA, a null pathway, **and any RPC error/timeout** — `queryRegistry` returns `Unknown` on failure rather than throwing, so infrastructure failure can never fail open. Say this out loud in the demo — judges will look for it.

---

## 4. Query interface (SDK)

```ts
type Verdict = {
  mint: string;
  status: "PathwayQualified" | "ExceptionConditionsUnmet" | "NoPathwayIdentified" | "Unknown";
  allowed: boolean;   // derived: status === "PathwayQualified" — the ONLY true case
  pathway: Pathway | null;
  federalSubtype: FederalSubtype | null;
  citations: { field: string; authority: string; reference: string; summary: string }[];
  registryVersion: number;
};

queryRegistry(mint: string): Promise<Verdict>
// PDA fetch. Fail-closed: PDA miss OR any RPC error → status "Unknown", allowed false. Never throws.
```

---

## 5. SAS attestation schema

Emitted once per **evaluated** payment (both approvals *and* blocks — blocks are the more interesting audit record).

| Field | Type | Notes |
|---|---|---|
| `payment_ref` | string | x402 payment id / tx sig |
| `mint` | pubkey | coin evaluated |
| `status` | u8 | verdict enum |
| `pathway` | u8 | pathway enum |
| `registry_version` | u32 | pinned — this is what makes it audit-defensible |
| `citation_hash` | [u8;32] | SHA-256 of the Borsh serialization of the ordered citation set `[pathway_basis, status_basis, reserve_basis, redemption_basis]` — canonical preimage so the Examiner View can independently recompute and confirm |
| `decision` | u8 | Allowed \| Blocked \| Rerouted |
| `timestamp` | i64 | |

Round-trip (attest + verify) must be proven working in prep — before Day 3 depends on it.

---

## 6. Agent flow (`app/agent`)

The 402's `accepts` array lists **multiple assets** — `[ShadyUSD, USDC]` — so the registry is genuinely decision-relevant: Permitr's job is screening every offered mint and choosing the one that qualifies. (No single-offer hand-waving; the server really would accept ShadyUSD.)

```
1. GET gated resource            -> 402 + accepts: [ShadyUSD, USDC]
2. queryRegistry(ShadyUSD)       -> NoPathwayIdentified + citations
3. BLOCK. Emit SAS attestation (decision=Blocked). Surface cited reason.
4. queryRegistry(USDC)           -> PathwayQualified / FederalQualified (UninsuredNationalBank)
5. Reroute to USDC (the only offered mint with allowed=true)
6. Pay via x402 SVM "exact" scheme, CDP Solana server wallet, devnet USDC
7. Facilitator verifies/settles -> resource unlocked (book chapter)
8. Emit SAS attestation (decision=Rerouted/Allowed, registry_version pinned)
9. Examiner View renders both attestations
```

**Packages (x402 v2 — use the scoped `@x402/*` line, not legacy unscoped v1):** client `@x402/fetch` + `@x402/svm` (`registerExactSvmScheme`); server `@x402/express` (or hono); facilitator config `@coinbase/x402`. Network identifier (CAIP-2): `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` (devnet).

Config: **primary** facilitator CDP (`https://api.cdp.coinbase.com/platform/v2/x402`, CDP API keys, free tier 1k tx/mo); **fallback** `https://x402.org/facilitator` (no API key, Solana devnet `exact`) — if CDP onboarding stalls, the demo doesn't. Agent wallet funded with devnet USDC + SOL (CDP faucet + faucet.solana.com).

---

## 7. Examiner View (`app/examiner`)

Single page. Input: attestation id → renders:

- **Verdict banner** — Blocked / Allowed / Rerouted
- **Coin + issuer + pathway** in plain English ("Paxos Trust Company — US state-qualified issuer, NYDFS supervision")
- **Citations** — each with source, reference, plain-English summary
- **Registry version + timestamp** ("evaluated against registry v3, 2026-07-16")
- **Payment reference** (link to Solscan)
- **Disclaimer** (PRD §8) — visible, not hidden in a footer

This is the artifact the judges remember. Make it look like a document, not a dashboard.

---

## 8. Build order (maps to PRD §7)

1. **Registry** — program, deploy, seed 4 entries, `queryRegistry` returns correct verdicts. *(Day 1)*
2. **Payment rail** — x402 gated endpoint + agent pays devnet USDC. Isolate this; it has the highest external-dependency risk. *(Day 2)*
3. **Integration** — block → reroute → pay → attest. *(Day 3)*
4. **Examiner View + rehearsal.** *(Day 4)*

**Fallback:** if the Anchor program is fighting you by end of Day 1, drop the custom program and store `IssuerRecord`s as SAS attestations under a registry schema. Same data model, no Rust. Protect the demo, not the architecture.

---

## 9. Pre-flight checklist

- [ ] Citation strings finalized from verified statutory anchors + book (**author review — blocking**; drafts may seed marked DRAFT)
- [ ] Mint addresses (source-verified Jul 13, 2026 — **re-verify on-chain before seeding**):
  - USDC devnet (transactable): `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (Circle docs)
  - USDC mainnet (display ref): `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
  - PYUSD devnet (Paxos-published; Token-2022): `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`
  - PYUSD mainnet (display ref; Token-2022): `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`
  - USDG mainnet (display-only — no devnet mint exists; Token-2022): `2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH`
  - ShadyUSD: self-minted on devnet (Day 1 script)
- [ ] CDP account + Solana server wallet; devnet SOL + USDC funded (`cdp.solana.requestFaucet`; top up SOL at faucet.solana.com)
- [ ] SAS schema registered against program `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` (same ID devnet/mainnet) via `sas-lib`; one attest + `fetchAttestation`/`deserializeAttestationData` round-trip proven
- [ ] `anchor deploy` to devnet succeeds
- [ ] Apache-2.0 LICENSE + README disclaimer in repo
- [ ] Pre-recorded demo fallback captured once the flow works
