# Permitr — Road to Submission (due Oct 31, 2026)

Working checklist from conference-week E2E slice → complete submission.
Judging Nov 5–Dec 5, awards Dec 12. Owner key: 🧑 author-gated · 🤖 buildable · 🤝 both.

## Phase 1 — Foundation hardening (now → Jul 31)

- [ ] 🤝 **Final-rules response** — statutory deadline **Jul 18** for GENIUS final rules. If finals drop: registry v3 bump, citation updates (ProposedRule → final rule cites), announce. If they slip: the "8 NPRMs, zero finals" stat stays live in the deck. *(Watch item — highest urgency.)*
- [ ] 🧑 **Citation review** — author pass over all DRAFT seed citations vs the book; finalize `reference`/`summary` strings; reseed.
- [ ] 🤖 **Program tests** — LiteSVM suite: init/upsert/bump/set_citation_basis happy paths + every invariant (§18-never-qualified, subtype iff federal, Unknown unwritable, citation limits, authority gating).
- [ ] 🤖 **SDK tests** — fail-closed behavior (PDA miss, RPC error, malformed data → Unknown/blocked), citation-hash determinism, countersignature lookup.
- [ ] 🤖 **CI** — GitHub Actions: program build, root typecheck, tests, examiner build. Green badge in README.
- [ ] 🤖 **CPI `assert_permitted(mint)`** — the enforcement-ladder rung: an onchain instruction other programs can CPI to gate on the registry. Small program addition + one integration test + docs. (Answers "why is this a blockchain" in code.)
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
