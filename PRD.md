# Permitr — Product Requirements Document (v3.0, canonical)

**Project:** Permitr — permitted-payment-stablecoin certification for the GENIUS Act era
**Tagline:** *Permitr — permitted payment stablecoin certification for the GENIUS Act era.*
**Components:** Permitr Registry (Anchor program) · Permitr Attestations (SAS) · Examiner View (web) · Permitr Agent (x402 demo consumer)
**Chain:** Solana — **committed**. Bounty note (updated Jul 13, 2026): Chainlink Labs is a confirmed sponsor (tiers "$1k–$25k", per-sponsor terms unpublished — pull from DoraHacks #1904 in a browser / ask at kickoff); CRE **does** support Solana as of mid-2026, so the old "EVM-oriented, not pursued" rationale is stale. Discipline unchanged: no bounty retrofitting during conference week; a CRE-feeds-Permitr angle (registry update pipeline / reserve-evidence aggregation) is a possible **November** play if terms fit.
**Event:** BLI Legal Tech Hackathon 2026 (Law · Finance · Compliance) — conference kickoff Jul 13–17 · judging Nov 5–Dec 5 · awards Dec 12
**Status:** v3.1 — v3.0 updated with source-verified statute (PL 119-27, govinfo) and rulemaking findings; supersedes GENIUS-Oracle-Solana-PRD-v2, PRD v1.1 (EVM), and the Solana addendum.
**Last updated:** July 13, 2026

---

## 1. Summary & positioning

Permitr is onchain compliance infrastructure for the GENIUS Act era: a canonical, citation-backed registry answering **"Is this stablecoin a permitted payment stablecoin under the GENIUS Act — and under which issuer pathway?"**, plus a Solana Attestation Service (SAS) layer that turns every agent payment into an examination-ready audit record.

**One-liner:** *Everyone screens the counterparty. Nobody certifies the coin. Permitr certifies the coin — on the chain where agent payments actually scale — and leaves the trail an examiner can sign off on.*

**Institutional framing:** KYA (Know Your Agent) verifies the *agent*. Permitr verifies the *asset*. **KYA + Know-Your-Asset.**

**Why Solana:** SAS is a compliance-native attestation primitive (built for jurisdiction/sanctions/credential attestations); x402 settles fast and final with sub-cent fees; the regulated-stablecoin ecosystem on Solana is real and institutional (native USDC, PYUSD, Visa/Mastercard settlement). Permitr uses the purpose-built compliance primitive rather than bolting compliance onto a general-purpose one.

## 2. Why now

1. **Regulatory clock.** GENIUS Act (PL 119-27) enacted Jul 18, 2025. NPRMs all live, comment periods now closed: OCC (Feb 25, 2026, 91 FR 10202 — closed May 1), Treasury state-principles (Apr 3 — closed Jun 2), FDIC (Apr 7 — closed Jun 9), FinCEN/OFAC AML/sanctions (Apr 10 — closed Jun 9); joint CIP NPRM (Jun 22 — comments open to Aug 21). **No final rules yet; the statutory deadline for finals is Jul 18, 2026 — during conference week.** Issuance prohibition (§3(a)) effective the earlier of Jan 18, 2027 or 120 days post-final-rules (§20) — if finals land on deadline, effectiveness falls ~mid-Nov 2026, **inside the judging window**. Distinct, later deadline: the §3(b)(1) ban on intermediaries offering/selling non-permitted stablecoins begins **Jul 18, 2028**. Infrastructure must precede both.
2. **The wedge (documented gaps).** Counterparty screening is commoditized (CDP facilitator KYT/OFAC, ClearAgent, Google AP2). But (a) **no one certifies the coin's GENIUS status or issuer pathway**, and (b) industry analysis states no agent-payment protocol yet produces an audit trail an internal-audit team would sign off on without supplementation.
3. **Institutional demand.** Anchorage Digital Ventures' RFS has dedicated categories for "Stablecoins, FinFra & The GENIUS Act Era," "Agentic Wallets & KYA," and "Agent-to-Agent Settlement Rails." Rolling applications → real post-hackathon path.
4. **Solana is where it's real.** Native USDC as a post-GENIUS payments backbone; Visa USDC bank settlement on Solana (Dec 2025); Mastercard six-stablecoin settlement incl. Solana (Jun 2026); x402 on Solana at 35M+ tx / $10M+ volume.

## 3. Goals & success metrics

| Goal | Metric |
|---|---|
| Win / place / take a top bounty | Working E2E demo; survives "doesn't X already do this?" |
| Originality defensibility | No competitor certifies issuer *pathway*; cite the gaps |
| Technical credibility | Anchor registry + SAS attestation genuinely onchain; real x402 payment on devnet |
| Legal depth (audience fit) | Demo shows pathway **gradations** (federal / state / foreign / blocked), not a binary |
| Book synergy | Book is the registry's spec; gated demo resource is a book chapter |

*Replace these with the official rubric weights once MDBA supplies them.*

**Non-goals:** legal determinations; production regulatory accuracy; mainnet; custody; KYC onboarding; issuing a stablecoin (would conflict with neutrality); building remittance or neobank product surface.

## 4. Architecture

### Layer 1 — Permitr Registry (core IP) — Anchor program
Rust/Anchor; one `IssuerRecord` PDA per token mint. Fields: mint, issuer, **issuer pathway**, reserve basis, redemption basis, status, **citation per field** (statute / proposed rule / book section), registry version. Owner-gated writes; public reads. Full spec: `SPEC.md`.

**Governance answer:** records mirror statutory criteria + proposed rules **with citations** — Permitr encodes the law, it does not opine. Classifications are illustrative-with-citation, not legal rulings. Roadmap: issuer/regulator self-attestation via SAS.

### Layer 2 — Permitr Attestations — SAS
Per evaluated payment, a SAS attestation: payment ref, mint, verdict, issuer pathway, registry version, citation hash, timestamp.

### Layer 3 — Examiner View (web)
Renders any SAS attestation as a plain-English audit record with citations, shareable by link. **This is the judge-facing artifact — build it, don't skip it.** Must carry the §8 disclaimer visibly.

**Stack decision:** Next.js on Vercel — chosen for the judging surface, not the tech: a stable production URL for the §9 shareable-link deliverable and the §10 QR close, plus server-rendered link previews so a pasted link reads as an audit document ("Permitr Audit Record — Blocked: ShadyUSD — GENIUS Act §3(a)"). Scope-guarded to one dynamic route + address input; styled as a document (think "a PDF that happens to be a webpage"), never a dashboard.

### Layer 4 — Permitr Agent (demo consumer)
TypeScript; CDP Solana server wallet; x402 SVM "exact" scheme; USDC (SPL) on devnet. Flow: request gated resource → `402` → query registry on offered mint → non-permitted → **block with cited reason** → reroute to a permitted mint → pay → emit SAS attestation. Gated resource = a chapter of the book.

## 5. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR1 | Anchor registry program: `IssuerRecord` PDA per mint, owner-gated writes, citation per field | P0 |
| FR2 | Query interface returning `{verdict, issuerPathway, citations, registryVersion}` for a mint | P0 |
| FR3 | SAS attestation emitted per evaluated payment | P0 |
| FR4 | Examiner View: plain-English render + citations + disclaimer, shareable link | P0 |
| FR5 | Permitr Agent: full x402-SVM block → reroute → pay → attest on devnet | P0 |
| FR6 | Visible "not legal advice" disclaimer in Examiner View and README | P0 |
| FR7 | Public repo, open-source license (Apache-2.0), demo video, pitch deck | P0 (submission) |
| FR8 | Book-grounded compliance copilot ("why was this blocked?") | P2 stretch |
| FR9 | Integrator SDK snippet (10-line registry check for any x402 server) | P2 stretch |
| FR10 | Neobank demo skin | P3 stretch |

## 6. Seed registry (4 entries — 3 real coins, 3 pathways)

| Coin | Issuer | Pathway illustrated | Demo role |
|---|---|---|---|
| **USDC** | Circle — Circle National Trust, N.A. (**final OCC approval Jul 10, 2026**) | Federal qualified issuer (§2(23)(B), §2(11)) | Pathway-qualified — reroute target; "approved three days ago" |
| **PYUSD** | Paxos Trust Company (**NYDFS → OCC national trust charter, Dec 12, 2025**) | Federal qualified — **the versioning beat**: registry v1 (historical state classification, §2(31)/§4(c)) → v2 (federal) | Pathway-migration story; state pathway narrated via PYUSD's history + NYDFS's Jun 9, 2026 proposed GENIUS-alignment reg |
| **USDG** | Paxos Digital Singapore Pte. Ltd. (MAS Major Payment Institution) | **§18 foreign-issuer exception** — *not* a permitted pathway (§2(12)); **no Treasury comparability determination exists yet** | **Blocked-with-cited-path** — the nuance beat: blocked *differently* than ShadyUSD |
| **ShadyUSD** | fictional, unregulated | No pathway (§3(a) prohibition) | **Blocked** — headline beat |

Mint addresses source-verified Jul 13, 2026 (see SPEC §9); re-verify on-chain before seeding. **As of Jul 13, 2026 no §5 approvals have been granted, no state regime is certified, and the Act is not yet effective — every classification is an *anticipated pathway*, cited, as of the registry version shown (§8).** Stated proactively, this is a credibility feature, not a caveat.

## 7. 4-day conference build plan (Jul 13–17)

**Goal: a working E2E slice by Day 4 — not a finished product.** Real judging is November; this slice buys kickoff credibility, mentor feedback, and book marketing.

| Day | Build | Done-when |
|---|---|---|
| **1** | WSL/Anchor toolchain; deploy registry program to devnet; seed 4 entries + citations; query works | Query returns correct verdict + pathway + citations for all 4 mints |
| **2** | x402 SVM happy path: gated endpoint (book chapter) + agent pays devnet USDC via CDP Solana wallet | One autonomous SPL-USDC payment settles E2E |
| **3** | Wire registry into agent (block ShadyUSD → reroute to USDC → pay) + SAS attestation on approval | Block-and-reroute clean; attestation verifiable onchain |
| **4** | Examiner View + disclaimer; demo rehearsal; pre-recorded fallback | 3-min demo runs twice, unattended |

**Hard cuts:** copilot, SDK, neobank skin, ZK, >4 entries, mainnet, anything Chainlink CRE.
**De-risk order:** registry (the product) → payment rail (highest external-dep risk) → integration → polish.
**Fallback if Anchor eats the clock:** store issuer records as SAS attestations instead of a custom program. All onchain state goes through SAS; no Rust. **Protect the demo, not the architecture.**

## 8. Legal posture (product requirement, not a footnote)

Displayed in the Examiner View, the README, and the pitch:

> Permitr is a machine-readable mirror of public law with citations. It is a research and engineering tool, **not legal advice** and not a legal determination of any issuer's status. Classifications are illustrative and cite the statute and proposed rules in effect at the registry version shown.

Rationale: the panel contains actual lawyers and regulators. Stating this before you're asked converts the hardest question into a credibility signal.

## 9. Submission deliverables (DoraHacks)

- Public repo, **Apache-2.0** (open source reinforces the public-infrastructure positioning and preserves bounty eligibility).
- 3-minute demo video (script in §10) + pre-recorded fallback clip.
- Pitch deck: problem → gap → Permitr → demo → ecosystem → roadmap → book.
- Devnet program ID + a sample Examiner View link.
- README with quickstart, architecture, disclaimer.

*Confirm exact submission mechanics/rubric with MDBA contact.*

## 10. Demo script (3 min)

1. **Hook (15s).** "Agents are spending stablecoins autonomously on Solana at real volume. The GENIUS Act says not every coin is permitted — and permitted coins qualify through *different* pathways. No agent can tell them apart. Permitr can."
2. **Block (40s).** Agent offered **ShadyUSD** → registry blocks it — §3(a) citation on screen: no pathway exists.
3. **Nuance (35s).** **USDG** blocked *differently*: §18 exception identified, conditions unmet — Treasury has made no comparability determination. "Permitr doesn't just say no. It says *why*, and what would change the answer." Then **PYUSD**: registry v1 shows its NYDFS state classification, v2 shows the Dec 2025 federal conversion — the law moved, the registry versioned, every attestation pins the version it was judged under.
4. **Pay (30s).** Reroute to USDC → x402 settles on devnet → book chapter unlocks.
5. **Examiner View (30s).** SAS attestation as a plain-English audit record. "The trail the industry says doesn't exist yet."
6. **Close (30s).** KYA verifies the agent, Permitr verifies the asset; Anchorage RFS as demand. "The book is the spec; Permitr is the reference implementation." QR.

### Pitch ammunition (verified during build week, Jul 13–15)

1. **The naive-client proof.** The x402 default selector pays `accepts[0]` — we *observed* an unscreened client attempt the ShadyUSD payment (it failed only for lack of tokens). Permitr doesn't prevent a hypothetical; it prevents the protocol's **default behavior**. (Side-product: found and documented the `@x402/svm` selector-drop bug — upstream report filed = ecosystem credibility.)
2. **The agent flags legal nuance unprompted.** In its first run, the agent's audit report noted that Circle's classification is "an anticipated pathway — no §5 approval exists pre-effective-date," verbatim from the registry's citation strings. Architecture doing the work: compliance enforced in code, precision stored in cited data, narration by the model — the LLM *cannot* invent a compliance decision.
3. **Everything is independently verifiable.** Program, credential, schema, block attestations, payment attestations, and the payment itself are all linked from the README as devnet explorer URLs — judges can check every claim without trusting us.

## 11. Hard-question prep

| Question | Answer |
|---|---|
| Who decides what's permitted? | The law. Citations per field; we mirror, we don't opine. Roadmap: issuer/regulator SAS self-attestation. |
| Doesn't CDP's facilitator do compliance? | It screens **counterparties** (KYT/OFAC), not the **coin's** GENIUS status/pathway. Different layer — we plug in beside it. |
| Doesn't Chainlink Proof of Reserve already do this? | PoR answers "is it **backed**?" (quantitative, continuous). Permitr answers "is the issuer **permitted**, under which pathway?" (legal, cited, versioned). A fully-collateralized coin from an unlicensed issuer passes PoR and fails GENIUS — PoR can't see a charter conversion. Solvency ≠ permission. Roadmap: PoR/NAV feeds (e.g., the S&P Global USDG SmartData feed, live on Base) plug into the registry as the *evidence* layer under the §4(a)(1)(A) reserve requirement Permitr cites as *authority*. (No PoR feed is verified live on Solana as of Jul 2026.) |
| Doesn't Chainlink ACE cover compliance? | ACE **enforces customer-supplied policies** over identity/eligibility inputs (CCID/vLEI — the *counterparty* axis); per Chainlink's own docs, rules are "defined by users, not by ACE," it publishes **no legal determinations** of GENIUS issuer status, and it is **EVM-only**. Enforcement needs authority: Permitr supplies the cited, versioned determinations an ACE-style policy would consume — on the asset axis, on Solana. Layered stack: PoR = evidence, ACE = enforcement, Permitr = authority. |
| The Act isn't effective yet. | Effective Jan 18, 2027 at the latest — and the statutory deadline for final rules is **Jul 18, 2026**; if agencies hit it, effectiveness pulls forward to ~Nov 2026, *inside this judging window*. Rulemaking comment periods are already closed. Infrastructure precedes the deadline. |
| The Act regulates *issuers*, not coins. | Correct — §2(23) attaches "permitted" to the issuer; there is no defined term "permitted payment stablecoin" in the Act. The statutory formula is "payment stablecoin *issued by* a permitted payment stablecoin issuer" (§3(b)(1), §3(g), §17). That's exactly why the registry is an **IssuerRecord** keyed by mint. |
| Isn't the foreign route a permitted pathway? | No — a foreign issuer is *definitionally* not a permitted issuer (§2(12)). §18 is an **exception** to the §3 prohibition, conditional on a Treasury comparability determination, OCC registration, and US-held reserves. Permitr models it as an exception and blocks while conditions are unmet — strict fail-closed. |
| Is this legal advice? | No — §8. A cited, machine-readable mirror of public law. |
| Rules change mid-build? | Versioned registry; attestations pin the version used at payment time. That's *better* audit practice, not a bug. |
| Isn't this just a lookup table? | Lookup **+** issuer-pathway logic **+** onchain SAS attestation **+** examiner rendering **+** live agent integration. |
| The check is client-side — can't an agent just skip it? | Yes, like every compliance control ever: OFAC screening doesn't make wires impossible, it makes checking cheap and skipping attributable. The product is the **attested decision**. Enforcement ladder: client selector (today) → server-side gating of `accepts` → onchain CPI `assert_permitted` → Token-2022 transfer hooks (PYUSD/USDG are already Token-2022 mints). Only an onchain registry can climb that ladder — a signed API can't bind a program. |
| Why Solana, not Base? | SAS is compliance-native; native USDC; Visa/Mastercard settlement live; x402 volume is here. Deliberate, not default. |

## 12. Roadmap (pitch slide)

- **Permitr-as-an-x402-service:** expose the registry query itself as an x402-gated endpoint — any agent pays a micro-fee in USDC and receives `{verdict, pathway, citations}`. Flips Permitr from x402 *consumer* to *provider*, making it a machine-payable agent-to-agent settlement service (maps directly to Anchorage's Agent-to-Agent Settlement Rails category). Two-sided x402: one agent sells compliance data, another pays for it to gate its own payment.
- Issuer/regulator self-attestation via SAS.
- Integrator SDK — every Solana neobank/fintech needs this by Jan 2027.
- **Reserve-evidence layer** feeding the registry: pluggable independent evidence (Chainlink PoR/SmartData-NAV feeds, issuer monthly reports per §4(a)(1)(C), ZK proof-of-reserve-adequacy — Anchorage ZK-compliance category) under the §4(a)(1)(A) requirement the registry cites as authority. Stale or sub-1:1 evidence degrades a verdict — Permitr becomes a conditions *monitor*, not just a classifier.
- Book-grounded compliance copilot.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Anchor/Rust eats the timeline | Minimal program; SAS-only fallback (§7) |
| Live demo fails on stage | Pre-recorded fallback; two clean rehearsals required |
| "Lookup table" critique | Pathway nuance + SAS attestation + Examiner View on screen |
| Citation staleness | Versioned registry; re-sync when final rules drop |
| Final rules drop during conference week (statutory deadline Jul 18, 2026) | Treat as a demo *opportunity*: bump registry version live; note effectiveness may pull into the judging window |
| Bounties favor EVM | Partially stale (CRE supports Solana as of mid-2026); still lean on grand prize + differentiation first — verify per-sponsor terms on DoraHacks #1904 before any bounty-driven scope change |
| Seed mint address wrong | Verify all mints before seeding (Day 1 gate) |

## 14. Open items (chase with MDBA contact)

1. Official judging **rubric** → replace §3 metrics with real weights.
2. **Team size** cap.
3. Submission mechanics/deadlines on DoraHacks.
4. Per-sponsor bounty terms — pull DoraHacks #1904 in a browser (blocks automated fetch) and/or ask the Chainlink table at kickoff. CRE now supports Solana; a CRE-feeds-Permitr angle is November-eligible **only if** terms fit — no conference-week retrofitting.
