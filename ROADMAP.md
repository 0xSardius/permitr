# Permitr — Road to Submission (due Oct 31, 2026)

Working checklist from conference-week E2E slice → complete submission.
Judging Nov 5–Dec 5, awards Dec 12. Owner key: 🧑 author-gated · 🤖 buildable · 🤝 both.

## ▶ Final sprint (Oct 18 → Oct 24) — supersedes Phases 1–4 below

Triage from the Oct 18 full review (program, SDK/agent, examiner/docs, live health).
Phases 1–4 are kept for history; anything not listed here is cut or post-hackathon.

### Must-fix (submission blockers)
- [x] 🤖 **Examiner: refuse forged records** — attestations not issued under the Permitr credential+schema render a refusal page with generic OG metadata (today they get the full verdict banner + citations).
- [x] 🤖 **Examiner: fail-closed styling** — green/"allowed" only when `decision === 0`; unknown decisions neutral and counted separately on /supervision; flag Allowed/Rerouted with `status !== PathwayQualified`.
- [x] 🤖 **Examiner: version honesty** — when `record.registryVersion !== attestation.registry_version` or the hash mismatches, label citations "current registry record (vN), not the set pinned at decision"; subtype only when the attestation's pathway is FederalQualified; mismatch copy states facts, not "registry amended".
- [x] 🤖 **Program: no uncited qualification** — `PathwayQualified` requires all four citation bases non-empty; pathway change clears bases; seed order becomes upsert(non-qualified) → 4× citations → promote. SDK also refuses empty bases / `r.mint !== mint` / non-permitted pathway.
- [x] 🤖 **Program: `set_citation_basis` re-pins `registry_version`** to `config.version`.
- [x] 🤖 **Program: lock `initialize_registry`** to the program upgrade authority; `checked_add` → typed error; reject empty citation strings.
- [x] 🤖 **Program upgrade deploy + reseed** on devnet; `pnpm verify-registry` green. *(Upgrade Oct 20, slot 513311065; registry v3 with USDC reclassified to StateQualified.)*
- [x] 🤖 **SDK: devnet-only signing** — `registerExactSvmScheme(..., { networks: [devnet] })`; drop non-devnet `accepts`; selector requires exact match with the screened requirement (scheme/network/asset/amount/payTo); `maxAmount` cap.
- [x] 🤖 **Agent demo fixes** — model id `claude-sonnet-5` → `claude-sonnet-5-5`; strip `raw` (bigint) from `screenMint` result; host allowlist + one purchase per run.
- [ ] 🧑 **Top up CDP agent wallet SOL** (0.00125 SOL as of Oct 18).
- [ ] 🧑 **Back up program keypair** — local copy at `~/.config/solana/backups/` done Oct 20; off-machine copy pending.
- [ ] 🧑 **Citation review** — *Oct 20: primary-source re-verification applied (SPEC §2); USDC reclassified (v3). Open: `_draft` decision / author book review; re-issue on-chain countersignatures with corrected text; refresh examiner home-page samples to v3 attestations.* Original note: all 5 seed files still `_draft`. Resolve strings outside SPEC §2's verified set: USDG ANPRM cited as "FR Doc. 2025-18226" vs SPEC "90 FR 46592"; §18(a)(3); MAS framework; "≤93-day Treasuries" / "7 days' notice" details. Then drop `_draft`, fix README's contradictory "DRAFT"/"author-reviewed", reseed.
- [x] 🤝 **GENIUS status re-verification** — what happened at the Jul 18 final-rules deadline; re-verify "8 NPRMs, zero finals", "no §5 approvals", "pre-effective-date" copy (PRD/README/seed). If the law moved → registry version bump (demo beat).
- [ ] 🤖 **Wording** — PRD:15 "permitted payment stablecoin"; README/PRD tagline → permitted-issuer framing; rename roadmap `assert_permitted` → `assert_pathway_qualified`; soften "nothing to subpoena but the chain".

### Should-fix (cheap credibility)
- [x] 🤖 **Program tests (LiteSVM)** — happy path, authority gating, §18-never-qualified, subtype grid, Unknown unwritable, citation limits at exact boundaries (incl. multi-byte §), versioning, uncited-qualification regression, re-init rejected, max-size tx < 1232 bytes.
- [ ] 🤖 **SDK tests** — queryRegistry never throws (miss/reject/hang/truncated/bad enum/bad base58); allowed only for PathwayQualified; citationHash golden vectors; selector blocks on mismatch/non-devnet; no pay if pre-pay attest fails.
- [ ] 🤖 **CI** — GitHub Actions: anchor build, tsc, tests, examiner build; badge in README.
- [ ] 🤖 **Examiner robustness** — `error.tsx`/`not-found.tsx`; RPC error ≠ 404; /supervision gPA try/catch + row cap; stop importing `scripts/lib` (keypair loader) into the Next bundle; disclaimer above the citations; `encodeURIComponent` + `<label>` on address input; docket table overflow-x.
- [ ] 🤖 **Attestation robustness** — post-pay attestation failure returns tx sig + `attestationError` (pending record on disk); never attest Allowed for an unsettled payment; `sendIxs` checks PDA exists before retry; RPC/fetch timeouts → Unknown.
- [ ] 🤖 **RPC reliability** — Helius devnet `RPC_URL` everywhere incl. Vercel.
- [ ] 🤖 **Repo hygiene** — stale "Day 2"/"no screening yet" headers; move spikes to `scripts/spikes/`; `dotenv` to deps; `sdk/` stops importing from `scripts/`.
- [ ] 🤖 *(Maybe, ~½ day)* **CPI `assert_pathway_qualified(mint)`** — read-only record + config, require qualified + cited + current version, return data; one LiteSVM test.

### Story & submission
- [ ] 🧑→🤖 **Pitch deck** — interview (book/origin, primary ask, tone) → build → iterate. Frame per product dialogue: stablecoins as the wedge into "compliance status of asset/issuer/transaction under U.S. law"; ADAC flywheel slide.
- [ ] 🤝 **Demo video** (3 min) + fallback cut.
- [ ] 🧑 **Real book chapter** for the gated resource.
- [ ] 🤝 **DoraHacks writeup** + rubric alignment.
- [ ] 🤖 **Fresh E2E run** after reseed; re-record stale artifacts; README sample links (all 5).
- [ ] 🤝 **Rehearsals** ×2 clean.
- [ ] 🧑 **Submit by Oct 24.**

### Product-dialogue candidates (optional — decide before building)
- [ ] 🤝 **Source labeling completeness** — `CiteSource` already has Statute/ProposedRule/AgencyAction/ForeignRegime/BookSection; consider appending `FinalRule` and an explicit interpretation variant (append-only = Borsh-compatible), and surface the source label prominently in the Examiner.
- [ ] 🤝 **Institution beat in the demo** — a bank/processor checks a coin and pulls an examiner-ready record before the agent scene.
- [ ] 🤝 **Schema headroom** — framing only for Oct 31 (no account-layout change); platform story on roadmap slide.

### Cut for Oct 31 (post-hackathon)
npm SDK publish · signed verdicts · CDP facilitator as primary · Token-2022 payment demo · compliance copilot · examination reporting v2 · upstream @x402/svm bug report (nice-to-have).

## Phase 1 — Foundation hardening (now → Jul 31)

- [ ] 🤝 **Final-rules response** — statutory deadline **Jul 18** for GENIUS final rules. If finals drop: registry v3 bump, citation updates (ProposedRule → final rule cites), announce. If they slip: the "8 NPRMs, zero finals" stat stays live in the deck. *(Watch item — highest urgency.)*
- [ ] 🧑 **Citation review** — author pass over all DRAFT seed citations vs the book; finalize `reference`/`summary` strings; reseed.
- [ ] 🤖 **Program tests** — LiteSVM suite: init/upsert/bump/set_citation_basis happy paths + every invariant (§18-never-qualified, subtype iff federal, Unknown unwritable, citation limits, authority gating).
- [ ] 🤖 **SDK tests** — fail-closed behavior (PDA miss, RPC error, malformed data → Unknown/blocked), citation-hash determinism, countersignature lookup.
- [ ] 🤖 **CI** — GitHub Actions: program build, root typecheck, tests, examiner build. Green badge in README.
- [ ] 🤖 **CPI `assert_pathway_qualified(mint)`** (renamed — "permitted" attaches to issuers) — the enforcement-ladder rung: an onchain instruction other programs can CPI to gate on the registry. Small program addition + one integration test + docs. (Answers "why is this a blockchain" in code.)
- [ ] 🤖 **RPC reliability** — Helius (or similar) devnet key via `RPC_URL` everywhere; retire public-RPC flakiness from the demo path.
- [ ] 🤖 **Upstream bug report** — file the `@x402/svm` selector-drop issue with repro (ecosystem credibility; reference in submission).
- [ ] 🤖 **Code-review pass** — security + quality review of program and SDK (judges may read code).

## Phase 2 — Feature complete (August)

- [ ] 🤖 **FR9: Integrator SDK** — extract `permitrPay`/`queryRegistry` into a clean `sdk/` package with a 10-line integration example; publish to npm as `permitr-sdk` (or document as workspace package).
- [ ] 🤖 **Signed verdicts** — `/verdict` responses signed by the Permitr service key so buyers can prove what they were told (oracle-countersigned verdicts, rung one of the trust roadmap).
- [ ] 🤖 **Examination reporting v2** — supervision docket filters (asset / period / decision), CSV export, per-regulator view keyed by countersignature credential.
- [ ] 🤖 **CDP facilitator as primary** — wire CDP-hosted facilitator via API keys (x402.org stays fallback); aligns the demo with the production Coinbase stack.
- [ ] 🤖 **Registry expansion** — add records as the charter wave lands (Ripple/RLUSD, Fidelity, BofA, etc. as public actions occur; each with verified citations). More rows = the reference-data thesis visibly compounding. 🧑 citation sign-off per record.
- [ ] 🤖 *(Optional)* **Token-2022 payment demo** — pay in devnet PYUSD to prove Token-2022 handling end-to-end.

## Phase 3 — Story complete (September)

- [ ] 🧑→🤖 **Pitch deck** — interview answers (book/origin, primary ask, tone) → deck build → score → iterate. *(Interview pending since Jul 15.)*
- [ ] 🤝 **Demo video** — 3-min produced video (Remotion project or polished screen capture); §10 beats; pre-recorded fallback cut.
- [ ] 🧑 **Real book chapter** — replace the placeholder gated resource with actual chapter content.
- [ ] 🤖 **Examiner polish** — design/taste pass, mobile, per-record OG images, home page landing copy.
- [ ] 🧑 *(Decision)* **Custom domain** — permitr.xyz or similar.
- [ ] 🤖 *(Stretch, FR8)* **Compliance copilot** — "why was this blocked?" chat grounded in statute + book excerpts, on the examiner site. Only if Phases 1–2 are green.

## Phase 4 — Submission (Oct 1 → Oct 31)

- [ ] 🤝 **DoraHacks writeup** — submit-to-hackathon pass; description, links, addresses.
- [ ] 🤝 **Rubric alignment** — when MDBA publishes weights, audit every deliverable against them.
- [ ] 🤖 **Fresh E2E verification** — reseed if needed, rerun everything, re-record anything stale.
- [ ] 🤝 **Rehearsals** — live demo ×2 clean + fallback video verified.
- [ ] 🧑 **Submit by Oct 24** — one-week buffer. Hard rule.
- [ ] 🧑 *(Parallel)* Bounty decisions (Chainlink terms), Anchorage RFS application.

## Standing rules
- Fail closed; devnet only; no invented legal content; SIMULATED labels on demo credentials; public law + public records only.
- Ship each item = commit + push (auto-deploys examiner); keep `pnpm demo` green at all times — never break the demo to build a feature.

## Cut list (deliberate)
Neobank skin (FR10) · agent self-attestation · mainnet anything · confidential supervisory data · ZK proof-of-reserve (pitch slide only).
