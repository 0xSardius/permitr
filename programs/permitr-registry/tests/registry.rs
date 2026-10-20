//! LiteSVM tests for the Permitr registry: every statutory invariant the
//! program encodes, authority gating, citation limits, and version pinning.
//! Run via `anchor test` (builds the .so first) or `anchor build && cargo test`.

use anchor_lang::{
    prelude::Pubkey, solana_program::instruction::Instruction, AccountDeserialize,
    InstructionData, ToAccountMetas,
};
use litesvm::LiteSVM;
use permitr_registry::{
    accounts as acc, instruction as ix, BasisKind, Citation, CiteSource, FederalSubtype,
    IssuerRecord, IssuerRecordArgs, Pathway, RegistryConfig, Status, CONFIG_SEED, ID,
    ISSUER_SEED,
};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;

const BPF_LOADER_UPGRADEABLE: Pubkey =
    anchor_lang::pubkey!("BPFLoaderUpgradeab1e11111111111111111111111");

// Anchor custom error codes (6000 + variant index in RegistryError).
const UNAUTHORIZED: u32 = 6000;
const UNKNOWN_NOT_WRITABLE: u32 = 6001;
const STATUS_PATHWAY_MISMATCH: u32 = 6002;
const EXCEPTION_REQUIRES_S18: u32 = 6003;
const FEDERAL_SUBTYPE_MISMATCH: u32 = 6004;
const CITATION_COUNT_INVALID: u32 = 6005;
const BOOK_NOT_PRIMARY: u32 = 6006;
const CITATION_TOO_LONG: u32 = 6007;
const ISSUER_NAME_TOO_LONG: u32 = 6008;
const QUALIFIED_REQUIRES_CITATIONS: u32 = 6009;
const CITATION_EMPTY: u32 = 6011;
const ISSUER_NAME_EMPTY: u32 = 6012;

struct Env {
    svm: LiteSVM,
    authority: Keypair,
}

fn config_pda() -> Pubkey {
    Pubkey::find_program_address(&[CONFIG_SEED], &ID).0
}

fn record_pda(mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[ISSUER_SEED, mint.as_ref()], &ID).0
}

fn program_data_pda() -> Pubkey {
    Pubkey::find_program_address(&[ID.as_ref()], &BPF_LOADER_UPGRADEABLE).0
}

/// LiteSVM deploys upgradeable programs with no upgrade authority; patch the
/// ProgramData metadata (bincode: u32 tag, u64 slot, Option<Pubkey>) so
/// `authority` is the upgrade authority, as on devnet.
fn set_upgrade_authority(svm: &mut LiteSVM, authority: &Pubkey) {
    let pd = program_data_pda();
    let mut account = svm.get_account(&pd).expect("programdata");
    account.data[12] = 1;
    account.data[13..45].copy_from_slice(authority.as_ref());
    svm.set_account(pd, account).unwrap();
}

fn send(env: &mut Env, ixs: &[Instruction], signer: &Keypair) -> Result<(), String> {
    let tx = Transaction::new_signed_with_payer(
        ixs,
        Some(&signer.pubkey()),
        &[signer],
        env.svm.latest_blockhash(),
    );
    let res = env.svm.send_transaction(tx).map(|_| ()).map_err(|e| format!("{:?}", e.err));
    env.svm.expire_blockhash();
    res
}

fn assert_code(res: Result<(), String>, code: u32) {
    let err = res.expect_err("expected the transaction to fail");
    assert!(
        err.contains(&format!("Custom({code})")),
        "expected custom error {code}, got {err}"
    );
}

fn init_ix(authority: &Pubkey, version: u32) -> Instruction {
    Instruction {
        program_id: ID,
        accounts: acc::InitializeRegistry {
            authority: *authority,
            program: ID,
            program_data: program_data_pda(),
            config: config_pda(),
            system_program: anchor_lang::system_program::ID,
        }
        .to_account_metas(None),
        data: ix::InitializeRegistry { version }.data(),
    }
}

fn upsert_ix(authority: &Pubkey, mint: &Pubkey, args: IssuerRecordArgs) -> Instruction {
    Instruction {
        program_id: ID,
        accounts: acc::UpsertIssuerRecord {
            authority: *authority,
            config: config_pda(),
            mint: *mint,
            record: record_pda(mint),
            system_program: anchor_lang::system_program::ID,
        }
        .to_account_metas(None),
        data: ix::UpsertIssuerRecord { args }.data(),
    }
}

fn cite_ix(authority: &Pubkey, mint: &Pubkey, kind: BasisKind, citations: Vec<Citation>) -> Instruction {
    Instruction {
        program_id: ID,
        accounts: acc::SetCitationBasis {
            authority: *authority,
            config: config_pda(),
            mint: *mint,
            record: record_pda(mint),
        }
        .to_account_metas(None),
        data: ix::SetCitationBasis { kind, citations }.data(),
    }
}

fn bump_ix(authority: &Pubkey) -> Instruction {
    Instruction {
        program_id: ID,
        accounts: acc::BumpRegistryVersion {
            authority: *authority,
            config: config_pda(),
        }
        .to_account_metas(None),
        data: ix::BumpRegistryVersion {}.data(),
    }
}

fn args(pathway: Pathway, subtype: FederalSubtype, status: Status) -> IssuerRecordArgs {
    IssuerRecordArgs {
        issuer_name: "Test Issuer".to_string(),
        pathway,
        federal_subtype: subtype,
        status,
    }
}

fn cite(authority: CiteSource, reference: &str, summary: &str) -> Citation {
    Citation {
        authority,
        reference: reference.to_string(),
        summary: summary.to_string(),
    }
}

fn statute() -> Vec<Citation> {
    vec![cite(CiteSource::Statute, "PL 119-27 §2(23)", "test summary")]
}

const ALL_BASES: [BasisKind; 4] = [
    BasisKind::Pathway,
    BasisKind::Status,
    BasisKind::Reserve,
    BasisKind::Redemption,
];

fn setup() -> Env {
    let mut svm = LiteSVM::new();
    let so = concat!(env!("CARGO_MANIFEST_DIR"), "/../../target/deploy/permitr_registry.so");
    svm.add_program_from_file(ID, so)
        .expect("run `anchor build` before `cargo test`");
    let authority = Keypair::new();
    svm.airdrop(&authority.pubkey(), 10_000_000_000).unwrap();
    set_upgrade_authority(&mut svm, &authority.pubkey());
    let mut env = Env { svm, authority };
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    send(&mut env, &[init_ix(&a, 1)], &auth).expect("initialize");
    env
}

fn funded(env: &mut Env) -> Keypair {
    let k = Keypair::new();
    env.svm.airdrop(&k.pubkey(), 1_000_000_000).unwrap();
    k
}

/// upsert (non-qualified) -> 4x citations -> upsert PathwayQualified.
fn seed_qualified(env: &mut Env, mint: &Pubkey, pathway: Pathway, subtype: FederalSubtype) {
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    send(env, &[upsert_ix(&a, mint, args(pathway, subtype, Status::NoPathwayIdentified))], &auth)
        .expect("stage upsert");
    for kind in ALL_BASES {
        send(env, &[cite_ix(&a, mint, kind, statute())], &auth).expect("cite");
    }
    send(env, &[upsert_ix(&a, mint, args(pathway, subtype, Status::PathwayQualified))], &auth)
        .expect("promote");
}

fn record(env: &Env, mint: &Pubkey) -> IssuerRecord {
    let account = env.svm.get_account(&record_pda(mint)).expect("record");
    IssuerRecord::try_deserialize(&mut account.data.as_slice()).unwrap()
}

fn config(env: &Env) -> RegistryConfig {
    let account = env.svm.get_account(&config_pda()).expect("config");
    RegistryConfig::try_deserialize(&mut account.data.as_slice()).unwrap()
}

// ── happy path ──────────────────────────────────────────────────────────

#[test]
fn qualified_record_round_trips_with_citations_and_version() {
    let mut env = setup();
    let mint = Pubkey::new_unique();
    seed_qualified(&mut env, &mint, Pathway::FederalQualified, FederalSubtype::UninsuredNationalBank);

    let r = record(&env, &mint);
    assert!(r.mint == mint);
    assert!(r.issuer_name == "Test Issuer");
    assert!(r.pathway == Pathway::FederalQualified);
    assert!(r.federal_subtype == FederalSubtype::UninsuredNationalBank);
    assert!(r.status == Status::PathwayQualified);
    assert_eq!(r.pathway_basis.len(), 1);
    assert_eq!(r.status_basis.len(), 1);
    assert_eq!(r.reserve_basis.len(), 1);
    assert_eq!(r.redemption_basis.len(), 1);
    assert_eq!(r.registry_version, 1);
}

// ── authority gating ────────────────────────────────────────────────────

#[test]
fn non_authority_cannot_write() {
    let mut env = setup();
    let mint = Pubkey::new_unique();
    seed_qualified(&mut env, &mint, Pathway::IdiSubsidiary, FederalSubtype::NotApplicable);
    let rogue = funded(&mut env);
    let r = rogue.pubkey();

    let res = send(&mut env, &[upsert_ix(&r, &mint, args(Pathway::NoPathway, FederalSubtype::NotApplicable, Status::NoPathwayIdentified))], &rogue);
    assert_code(res, UNAUTHORIZED);
    let res = send(&mut env, &[cite_ix(&r, &mint, BasisKind::Status, statute())], &rogue);
    assert_code(res, UNAUTHORIZED);
    let res = send(&mut env, &[bump_ix(&r)], &rogue);
    assert_code(res, UNAUTHORIZED);
}

#[test]
fn initialize_requires_upgrade_authority() {
    let mut svm = LiteSVM::new();
    let so = concat!(env!("CARGO_MANIFEST_DIR"), "/../../target/deploy/permitr_registry.so");
    svm.add_program_from_file(ID, so).unwrap();
    let upgrade_authority = Keypair::new();
    set_upgrade_authority(&mut svm, &upgrade_authority.pubkey());
    let rogue = Keypair::new();
    svm.airdrop(&rogue.pubkey(), 1_000_000_000).unwrap();
    let mut env = Env { svm, authority: upgrade_authority };

    let r = rogue.pubkey();
    assert_code(send(&mut env, &[init_ix(&r, 1)], &rogue), UNAUTHORIZED);
}

#[test]
fn initialize_cannot_run_twice() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    assert!(send(&mut env, &[init_ix(&a, 2)], &auth).is_err());
    assert_eq!(config(&env).version, 1);
}

// ── statutory invariants ────────────────────────────────────────────────

#[test]
fn section_18_can_never_be_pathway_qualified() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    for pathway in [Pathway::ForeignSection18, Pathway::NoPathway] {
        let mint = Pubkey::new_unique();
        let res = send(&mut env, &[upsert_ix(&a, &mint, args(pathway, FederalSubtype::NotApplicable, Status::PathwayQualified))], &auth);
        assert_code(res, STATUS_PATHWAY_MISMATCH);
    }
}

#[test]
fn section_18_record_with_full_citations_still_cannot_qualify() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::ForeignSection18, FederalSubtype::NotApplicable, Status::ExceptionConditionsUnmet))], &auth).unwrap();
    for kind in ALL_BASES {
        send(&mut env, &[cite_ix(&a, &mint, kind, statute())], &auth).unwrap();
    }
    let res = send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::ForeignSection18, FederalSubtype::NotApplicable, Status::PathwayQualified))], &auth);
    assert_code(res, STATUS_PATHWAY_MISMATCH);
}

#[test]
fn exception_status_only_for_section_18() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    let res = send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::StateQualified, FederalSubtype::NotApplicable, Status::ExceptionConditionsUnmet))], &auth);
    assert_code(res, EXCEPTION_REQUIRES_S18);
}

#[test]
fn federal_subtype_set_iff_federal_pathway() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let subtypes = [
        FederalSubtype::OccApprovedNonbank,
        FederalSubtype::UninsuredNationalBank,
        FederalSubtype::FederalBranch,
        FederalSubtype::NotApplicable,
    ];
    let pathways = [
        Pathway::IdiSubsidiary,
        Pathway::FederalQualified,
        Pathway::StateQualified,
        Pathway::ForeignSection18,
        Pathway::NoPathway,
    ];
    for pathway in pathways {
        for subtype in subtypes {
            let mint = Pubkey::new_unique();
            let status = if pathway == Pathway::ForeignSection18 {
                Status::ExceptionConditionsUnmet
            } else {
                Status::NoPathwayIdentified
            };
            let res = send(&mut env, &[upsert_ix(&a, &mint, args(pathway, subtype, status))], &auth);
            let valid = (pathway == Pathway::FederalQualified) == (subtype != FederalSubtype::NotApplicable);
            if valid {
                assert!(res.is_ok(), "{:?}/{:?} should be accepted", pathway as u8, subtype as u8);
            } else {
                assert_code(res, FEDERAL_SUBTYPE_MISMATCH);
            }
        }
    }
}

#[test]
fn unknown_status_is_never_writable() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    let res = send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::NoPathway, FederalSubtype::NotApplicable, Status::Unknown))], &auth);
    assert_code(res, UNKNOWN_NOT_WRITABLE);
}

// ── no uncited qualification ────────────────────────────────────────────

#[test]
fn fresh_record_cannot_be_qualified_without_citations() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    let res = send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::IdiSubsidiary, FederalSubtype::NotApplicable, Status::PathwayQualified))], &auth);
    assert_code(res, QUALIFIED_REQUIRES_CITATIONS);
}

#[test]
fn partially_cited_record_cannot_be_qualified() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::IdiSubsidiary, FederalSubtype::NotApplicable, Status::NoPathwayIdentified))], &auth).unwrap();
    for kind in &ALL_BASES[..3] {
        send(&mut env, &[cite_ix(&a, &mint, *kind, statute())], &auth).unwrap();
    }
    let res = send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::IdiSubsidiary, FederalSubtype::NotApplicable, Status::PathwayQualified))], &auth);
    assert_code(res, QUALIFIED_REQUIRES_CITATIONS);
}

#[test]
fn pathway_change_clears_citations_and_blocks_qualification() {
    // The PYUSD story: state-qualified (v1) -> federal-qualified (v2).
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    seed_qualified(&mut env, &mint, Pathway::StateQualified, FederalSubtype::NotApplicable);

    let res = send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::FederalQualified, FederalSubtype::UninsuredNationalBank, Status::PathwayQualified))], &auth);
    assert_code(res, QUALIFIED_REQUIRES_CITATIONS);
    // the failed tx changed nothing
    assert!(record(&env, &mint).pathway == Pathway::StateQualified);
    assert_eq!(record(&env, &mint).status_basis.len(), 1);

    // the supported flow: stage the new pathway (clears stale citations),
    // re-cite, then promote
    send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::FederalQualified, FederalSubtype::UninsuredNationalBank, Status::NoPathwayIdentified))], &auth).unwrap();
    let r = record(&env, &mint);
    assert!(r.pathway_basis.is_empty() && r.status_basis.is_empty());
    assert!(r.reserve_basis.is_empty() && r.redemption_basis.is_empty());

    seed_qualified(&mut env, &mint, Pathway::FederalQualified, FederalSubtype::UninsuredNationalBank);
    assert!(record(&env, &mint).status == Status::PathwayQualified);
}

#[test]
fn same_pathway_upsert_preserves_citations() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    seed_qualified(&mut env, &mint, Pathway::IdiSubsidiary, FederalSubtype::NotApplicable);
    let mut renamed = args(Pathway::IdiSubsidiary, FederalSubtype::NotApplicable, Status::PathwayQualified);
    renamed.issuer_name = "Renamed Issuer".to_string();
    send(&mut env, &[upsert_ix(&a, &mint, renamed)], &auth).unwrap();
    let r = record(&env, &mint);
    assert!(r.issuer_name == "Renamed Issuer");
    assert_eq!(r.pathway_basis.len(), 1);
}

// ── citation & name limits ──────────────────────────────────────────────

#[test]
fn citation_count_must_be_one_or_two() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::NoPathway, FederalSubtype::NotApplicable, Status::NoPathwayIdentified))], &auth).unwrap();

    assert_code(send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, vec![])], &auth), CITATION_COUNT_INVALID);
    let three = vec![statute()[0].clone(), statute()[0].clone(), statute()[0].clone()];
    assert_code(send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, three)], &auth), CITATION_COUNT_INVALID);
    let two = vec![statute()[0].clone(), cite(CiteSource::BookSection, "Book ch. 1", "analysis")];
    assert!(send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, two)], &auth).is_ok());
}

#[test]
fn book_section_cannot_be_primary() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::NoPathway, FederalSubtype::NotApplicable, Status::NoPathwayIdentified))], &auth).unwrap();
    let res = send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, vec![cite(CiteSource::BookSection, "Book ch. 1", "analysis")])], &auth);
    assert_code(res, BOOK_NOT_PRIMARY);
}

#[test]
fn citation_lengths_are_byte_bounded_including_multibyte_section_sign() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::NoPathway, FederalSubtype::NotApplicable, Status::NoPathwayIdentified))], &auth).unwrap();

    // "§" is 2 bytes in UTF-8: "§" + 94 ASCII = 96 bytes (max), +1 = 97.
    let ref_96 = format!("§{}", "a".repeat(94));
    let ref_97 = format!("§{}", "a".repeat(95));
    let sum_160 = format!("§{}", "b".repeat(158));
    let sum_161 = format!("§{}", "b".repeat(159));
    assert_eq!(ref_96.len(), 96);
    assert_eq!(sum_160.len(), 160);

    assert!(send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, vec![cite(CiteSource::Statute, &ref_96, &sum_160)])], &auth).is_ok());
    assert_code(send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, vec![cite(CiteSource::Statute, &ref_97, "s")])], &auth), CITATION_TOO_LONG);
    assert_code(send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, vec![cite(CiteSource::Statute, "r", &sum_161)])], &auth), CITATION_TOO_LONG);
}

#[test]
fn citation_strings_must_be_non_empty() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::NoPathway, FederalSubtype::NotApplicable, Status::NoPathwayIdentified))], &auth).unwrap();
    assert_code(send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, vec![cite(CiteSource::Statute, "", "s")])], &auth), CITATION_EMPTY);
    assert_code(send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, vec![cite(CiteSource::Statute, "r", "")])], &auth), CITATION_EMPTY);
}

#[test]
fn issuer_name_bounds() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mut long = args(Pathway::NoPathway, FederalSubtype::NotApplicable, Status::NoPathwayIdentified);
    long.issuer_name = "x".repeat(65);
    assert_code(send(&mut env, &[upsert_ix(&a, &Pubkey::new_unique(), long)], &auth), ISSUER_NAME_TOO_LONG);
    let mut empty = args(Pathway::NoPathway, FederalSubtype::NotApplicable, Status::NoPathwayIdentified);
    empty.issuer_name = String::new();
    assert_code(send(&mut env, &[upsert_ix(&a, &Pubkey::new_unique(), empty)], &auth), ISSUER_NAME_EMPTY);
}

#[test]
fn max_size_citation_write_fits_in_one_transaction() {
    let env = setup();
    let a = env.authority.pubkey();
    let mint = Pubkey::new_unique();
    let max = cite(CiteSource::Statute, &"r".repeat(96), &"s".repeat(160));
    let ix = cite_ix(&a, &mint, BasisKind::Status, vec![max.clone(), cite(CiteSource::BookSection, &"r".repeat(96), &"s".repeat(160))]);
    let message = Message::new(&[ix], Some(&a));
    let tx_len = 1 + 64 + message.serialize().len(); // sig count + 1 sig + message
    assert!(tx_len <= 1232, "max citation write is {tx_len} bytes");
}

// ── versioning ──────────────────────────────────────────────────────────

#[test]
fn bump_pins_new_version_only_on_rewrite() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    seed_qualified(&mut env, &mint, Pathway::IdiSubsidiary, FederalSubtype::NotApplicable);

    send(&mut env, &[bump_ix(&a)], &auth).unwrap();
    assert_eq!(config(&env).version, 2);
    assert_eq!(record(&env, &mint).registry_version, 1, "existing record keeps its pinned version");

    // rewriting citations re-pins (set_citation_basis), as does an upsert
    send(&mut env, &[cite_ix(&a, &mint, BasisKind::Status, statute())], &auth).unwrap();
    assert_eq!(record(&env, &mint).registry_version, 2);

    send(&mut env, &[bump_ix(&a)], &auth).unwrap();
    send(&mut env, &[upsert_ix(&a, &mint, args(Pathway::IdiSubsidiary, FederalSubtype::NotApplicable, Status::PathwayQualified))], &auth).unwrap();
    assert_eq!(record(&env, &mint).registry_version, 3);
}

#[test]
fn record_pda_must_match_mint() {
    let mut env = setup();
    let a = env.authority.pubkey();
    let auth = env.authority.insecure_clone();
    let mint = Pubkey::new_unique();
    let other = Pubkey::new_unique();
    seed_qualified(&mut env, &mint, Pathway::IdiSubsidiary, FederalSubtype::NotApplicable);
    let mut ix = cite_ix(&a, &other, BasisKind::Status, statute());
    ix.accounts[3].pubkey = record_pda(&mint); // record for a different mint
    assert!(send(&mut env, &[ix], &auth).is_err());
}
