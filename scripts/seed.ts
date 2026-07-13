/**
 * Seed the Permitr registry on devnet from data/seed/*.json.
 *
 * Sequence (idempotent):
 *   1. initialize_registry(v1) if config doesn't exist
 *   2. upsert USDC, PYUSD (v1 historical state classification), USDG
 *   3. create the fictional ShadyUSD mint (once; address cached to
 *      data/seed/shadyusd.mint) and upsert its record
 *   4. bump registry to v2 (once) and upsert PYUSD's current federal record
 *      — the pathway-migration / versioning demo beat
 *
 * Citation strings come from the DRAFT seed files (source-verified anchors,
 * pending author review). This script never invents legal content.
 */
import { generateKeyPairSigner } from "@solana/kit";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getInitializeMintInstruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { address } from "@solana/kit";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWallet, rpc, sendIxs } from "./lib.js";
import {
  fetchMaybeRegistryConfig,
  findConfigPda,
  getBumpRegistryVersionInstructionAsync,
  getInitializeRegistryInstructionAsync,
  getSetCitationBasisInstructionAsync,
  getUpsertIssuerRecordInstructionAsync,
  BasisKind,
  CiteSource,
  FederalSubtype,
  Pathway,
  Status,
  type Citation,
} from "../sdk/generated/index.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const seedDir = path.join(root, "data/seed");

type SeedCitation = { authority: string; reference: string; summary: string };
type SeedRecord = {
  mint: string | null;
  issuerName: string;
  pathway: string;
  federalSubtype: string;
  status: string;
  pathwayBasis: SeedCitation[];
  statusBasis: SeedCitation[];
  reserveBasis: SeedCitation[];
  redemptionBasis: SeedCitation[];
};

function loadSeed(name: string): SeedRecord {
  const seed: SeedRecord = JSON.parse(
    readFileSync(path.join(seedDir, name), "utf8"),
  );
  // Preflight: on-chain limits are BYTES (Rust str::len), not chars —
  // §/—/≤ are multi-byte. Fail fast with the exact offending field.
  for (const [field, cites] of Object.entries({
    pathwayBasis: seed.pathwayBasis,
    statusBasis: seed.statusBasis,
    reserveBasis: seed.reserveBasis,
    redemptionBasis: seed.redemptionBasis,
  })) {
    for (const c of cites) {
      const refLen = Buffer.byteLength(c.reference);
      const sumLen = Buffer.byteLength(c.summary);
      if (refLen > 96 || sumLen > 160)
        throw new Error(
          `${name} ${field}: reference=${refLen}B (max 96) summary=${sumLen}B (max 160)`,
        );
    }
  }
  return seed;
}

function toCitations(cs: SeedCitation[]): Citation[] {
  return cs.map((c) => ({
    authority: CiteSource[c.authority as keyof typeof CiteSource],
    reference: c.reference,
    summary: c.summary,
  }));
}

async function upsert(authority: Awaited<ReturnType<typeof loadWallet>>, seed: SeedRecord, mint: string) {
  // Two-step write: core record first, then one tx per citation basis —
  // a full record exceeds the 1232-byte transaction limit.
  const coreIx = await getUpsertIssuerRecordInstructionAsync({
    authority,
    mint: address(mint),
    issuerName: seed.issuerName,
    pathway: Pathway[seed.pathway as keyof typeof Pathway],
    federalSubtype:
      FederalSubtype[seed.federalSubtype as keyof typeof FederalSubtype],
    status: Status[seed.status as keyof typeof Status],
  });
  const sig = await sendIxs(authority, [coreIx]);

  const bases: [BasisKind, SeedCitation[]][] = [
    [BasisKind.Pathway, seed.pathwayBasis],
    [BasisKind.Status, seed.statusBasis],
    [BasisKind.Reserve, seed.reserveBasis],
    [BasisKind.Redemption, seed.redemptionBasis],
  ];
  for (const [kind, cites] of bases) {
    const ix = await getSetCitationBasisInstructionAsync({
      authority,
      mint: address(mint),
      kind,
      citations: toCitations(cites),
    });
    await sendIxs(authority, [ix]);
  }
  console.log(
    `  upserted ${seed.issuerName} (${mint.slice(0, 8)}…) + 4 citation bases: ${sig}`,
  );
}

async function createShadyMint(authority: Awaited<ReturnType<typeof loadWallet>>): Promise<string> {
  const cache = path.join(seedDir, "shadyusd.mint");
  if (existsSync(cache)) return readFileSync(cache, "utf8").trim();

  const mint = await generateKeyPairSigner();
  const space = BigInt(getMintSize());
  const rent = await rpc.getMinimumBalanceForRentExemption(space).send();
  await sendIxs(authority, [
    getCreateAccountInstruction({
      payer: authority,
      newAccount: mint,
      lamports: rent,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }),
    getInitializeMintInstruction({
      mint: mint.address,
      decimals: 6,
      mintAuthority: authority.address,
    }),
  ]);
  writeFileSync(cache, mint.address);
  console.log(`  created ShadyUSD devnet mint: ${mint.address}`);
  return mint.address;
}

const authority = await loadWallet();
console.log(`Seeding as ${authority.address}`);

// 1. init config at v1 (idempotent)
const [configPda] = await findConfigPda();
let config = await fetchMaybeRegistryConfig(rpc, configPda);
if (!config.exists) {
  const ix = await getInitializeRegistryInstructionAsync({
    authority,
    version: 1,
  });
  await sendIxs(authority, [ix]);
  console.log("Registry initialized at v1");
  config = await fetchMaybeRegistryConfig(rpc, configPda);
}
if (!config.exists) throw new Error("config init failed");
console.log(`Registry version: ${config.data.version}`);

// 2. v1 records
if (config.data.version === 1) {
  const usdc = loadSeed("usdc.json");
  await upsert(authority, usdc, usdc.mint!);
  const pyusdV1 = loadSeed("pyusd-v1-historical.json");
  await upsert(authority, pyusdV1, pyusdV1.mint!);
  const usdg = loadSeed("usdg.json");
  await upsert(authority, usdg, usdg.mint!);

  // 3. ShadyUSD
  const shady = loadSeed("shadyusd.json");
  const shadyMint = await createShadyMint(authority);
  await upsert(authority, shady, shadyMint);

  // 4. the versioning beat: the legal landscape moved (Paxos NYDFS→OCC,
  // Dec 12, 2025) → bump version, upsert PYUSD's current federal record.
  const bumpIx = await getBumpRegistryVersionInstructionAsync({ authority });
  await sendIxs(authority, [bumpIx]);
  console.log("Registry bumped to v2 (Paxos charter conversion)");
}

const pyusd = loadSeed("pyusd.json");
await upsert(authority, pyusd, pyusd.mint!);

console.log("Seed complete.");
