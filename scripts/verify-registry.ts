/**
 * Day-1 DoD check: queryRegistry returns the correct verdict + pathway +
 * citations for all four seed mints, and an unknown mint fails closed.
 * Exits non-zero on any mismatch.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { queryRegistry } from "../sdk/index";
import { rpc } from "./lib";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const shadyMint = readFileSync(
  path.join(root, "data/seed/shadyusd.mint"),
  "utf8",
).trim();

const CASES: {
  name: string;
  mint: string;
  status: string;
  allowed: boolean;
  pathway: string | null;
}[] = [
  {
    name: "USDC",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    status: "PathwayQualified",
    allowed: true,
    pathway: "FederalQualified",
  },
  {
    name: "PYUSD",
    mint: "CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM",
    status: "PathwayQualified",
    allowed: true,
    pathway: "FederalQualified",
  },
  {
    name: "USDG",
    mint: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
    status: "ExceptionConditionsUnmet",
    allowed: false,
    pathway: "ForeignSection18",
  },
  {
    name: "ShadyUSD",
    mint: shadyMint,
    status: "NoPathwayIdentified",
    allowed: false,
    pathway: "NoPathway",
  },
  {
    name: "unknown mint (fail-closed)",
    mint: "So11111111111111111111111111111111111111112", // wSOL — deliberately unregistered
    status: "Unknown",
    allowed: false,
    pathway: null,
  },
];

let failures = 0;
for (const c of CASES) {
  const v = await queryRegistry(rpc, c.mint);
  const ok =
    v.status === c.status && v.allowed === c.allowed && v.pathway === c.pathway;
  if (!ok) failures++;
  console.log(
    `${ok ? "✅" : "❌"} ${c.name}: status=${v.status} allowed=${v.allowed} pathway=${v.pathway} v=${v.registryVersion} citations=${v.citations.length}`,
  );
  if (!ok)
    console.log(
      `   expected status=${c.status} allowed=${c.allowed} pathway=${c.pathway}`,
    );
}

if (failures) {
  console.error(`\n${failures} case(s) failed`);
  process.exit(1);
}
console.log("\nAll registry verdicts correct — Day-1 DoD met.");
