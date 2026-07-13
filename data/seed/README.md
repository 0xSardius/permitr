# Seed registry data — DRAFT, pending author review

Every `reference`/`summary` string below is drafted **only** from source-verified anchors
(GPO slip law PL 119-27 via govinfo; Federal Register documents; agency press releases —
verified Jul 13, 2026). Nothing is invented. All entries are **DRAFT** until reviewed by
the author against the book. `TODO(book)` marks the optional BookSection analysis layer
the author may add (max 1 per basis, never primary).

Classifications are anticipated pathways as of the registry version — no §5 approvals
exist pre-effective-date. Not legal advice (see repo README).

| File | Coin | Mint | Role |
|---|---|---|---|
| `usdc.json` | USDC | devnet `4zMM…ncDU` (transactable) | PathwayQualified — reroute target |
| `pyusd-v1-historical.json` | PYUSD | devnet `CXk2…Uynm` | v1 state classification (versioning beat) |
| `pyusd.json` | PYUSD | devnet `CXk2…Uynm` | v2 federal (current truth) |
| `usdg.json` | USDG | mainnet `2u1t…jGWH` (display-only) | ExceptionConditionsUnmet — blocked w/ cited path |
| `shadyusd.json` | ShadyUSD | self-minted at seed time | NoPathwayIdentified — blocked |

Seeding order (scripts/seed.ts): initialize v1 → upsert usdc/pyusd-v1/usdg/shadyusd →
bump to v2 → upsert pyusd (demo shows the pathway migration; attestations pin versions).
