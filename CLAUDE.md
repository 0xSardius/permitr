# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Permitr — a Solana devnet hackathon project (BLI Legal Tech Hackathon 2026) that certifies whether a stablecoin's issuer has a "permitted payment stablecoin issuer" pathway under the GENIUS Act (PL 119-27), and gates x402 agent payments on that verdict. Judged by lawyers and regulators: **cited legal reasoning and auditability outrank crypto novelty.**

Read `PRD.md` (product, demo script, legal posture) and `SPEC.md` (the build-from doc: schema, instructions, agent flow, verified mint addresses) before doing anything. Both were source-verified against the enacted statute and 2026 rulemakings on Jul 13, 2026 — do not "correct" their legal framing from memory.

## Hard rules (non-negotiable)

1. **Never fabricate legal content.** Citation `reference`/`summary` strings come only from the source-verified anchors in SPEC §2 or from the author's book. If a citation is missing, write a clearly marked `TODO` placeholder — never invent a statute section, docket number, or rule reference. This gets demoed to regulators.
2. **Fail closed, allowlist-style.** A payment is allowed **only** when `status == PathwayQualified`. Missing PDA, RPC error, timeout, null pathway, or any other status → block. `queryRegistry` returns `Unknown` on failure; it never throws and nothing upstream may treat "no verdict" as "proceed."
3. **Devnet only.** Never target mainnet. Mainnet mint addresses appear in the registry as display references only.
4. **Statute framing matters:** "permitted" attaches to the *issuer* (§2(23)), never say "permitted stablecoin" in code/UI copy where precision counts; the foreign route (§18) is an *exception*, not a permitted pathway — keep `ForeignSection18` out of any "permitted" framing.

## Toolchain & commands

Installed: rustc 1.93.1 · **solana-cli pinned to 3.1.10** (Agave 4.0.2 is CONFIRMED broken with anchor-cli 1.1.2 — `cargo-build-sbf` 4.0.0 panics in toolchain.rs; do not `agave-install` back to 4.x) · anchor-cli 1.1.2 · avm 0.32.1 · node 24 · pnpm. Project must stay on the WSL Linux filesystem (never `/mnt/c`).

```bash
solana config set --url devnet          # ALWAYS devnet; config may drift back to mainnet
anchor build
anchor deploy --provider.cluster devnet
anchor test                             # LiteSVM Rust tests via cargo test
```

Program ID (devnet): `3cwNTm2FHSViLLm2gVp62DqS2ttLbHigXWw4XDTbo35Y` (keypair in `target/deploy/permitr_registry-keypair.json` — gitignored; back it up before regenerating target/).

Planned layout (SPEC §1): `programs/permitr-registry/` (Anchor), `app/agent/` (x402 consumer), `app/resource-server/` (x402-gated endpoint), `app/examiner/` (Examiner View web), `sdk/` (TS `queryRegistry`), `data/seed/` (4 seed records), `scripts/` (deploy/seed/demo). TypeScript uses pnpm.

## Architecture (big picture)

Four layers; the data model is the core IP:

- **Registry (Anchor program):** one `IssuerRecord` PDA per SPL mint (`seeds = [b"issuer", mint]`), owner-gated writes, public reads. Every substantive field carries a `Citation` (`pathway_basis`, `status_basis`, `reserve_basis`, `redemption_basis` — see SPEC §2 — four citation slots answering distinct examiner questions). Enums mirror the statute exactly (three permitted categories from §2(23) + `ForeignSection18` exception + `NoPathway`). A config PDA holds `registry_version`; `Status::Unknown` is client-side only (PDA miss), never written on-chain.
- **SDK:** `queryRegistry(mint) → Verdict` — PDA fetch, allowlist fail-closed (rule 2).
- **Agent (x402):** the agent loop is built on the **Vercel AI SDK** (agent framework — tool-calling loop, model orchestration); the payment layer is x402, and the registry check is implemented as the **payment-requirements selector** in `wrapFetchWithPayment` (`@x402/fetch` + `@x402/svm`; use scoped `@x402/*` v2 packages, never legacy unscoped v1). The 402's `accepts` lists multiple mints; the selector screens each, blocks the non-qualified (emitting a SAS attestation per decision), and picks the allowed one. CDP facilitator primary, `x402.org/facilitator` fallback. Network: `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1`.
- **SAS attestations + Examiner View:** every evaluated payment (blocks included) emits a Solana Attestation Service attestation (`sas-lib`, program `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`) pinning `registry_version` and a `citation_hash` (SHA-256 over Borsh of the ordered citation set). The Examiner View renders an attestation as a plain-English audit document with citations and the PRD §8 disclaimer — it is the judge-facing artifact.

Mint strategy: USDC + self-minted ShadyUSD are devnet-transactable; PYUSD devnet mint exists (Token-2022); USDG is display-only (no devnet mint). Verified addresses in SPEC §9 — re-verify on-chain before seeding.

## Workflow

Commit and push **incrementally, per feature** to `origin main` (https://github.com/0xSardius/permitr) — don't batch a day's work into one commit. Standing authorization: no need to ask before committing/pushing completed, verified work.

## Solana skill

`.claude/skills/solana-dev` (copied from the Solana Foundation skill) covers Anchor patterns, @solana/kit, testing (LiteSVM/Mollusk/Surfpool), Token-2022, security checklists, a version compatibility matrix, and common errors — consult its `references/` before debugging toolchain or Anchor issues, and prefer its stack choices (@solana/kit for scripts; web3.js only at compat boundaries such as x402 SDK interop).
