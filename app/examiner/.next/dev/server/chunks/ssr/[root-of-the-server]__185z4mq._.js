module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[project]/app/examiner/lib/chain.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DECISION_LABELS",
    ()=>DECISION_LABELS,
    "PATHWAY_PLAIN",
    ()=>PATHWAY_PLAIN,
    "PERMITR_CREDENTIAL",
    ()=>PERMITR_CREDENTIAL,
    "PERMITR_PAYMENT_SCHEMA",
    ()=>PERMITR_PAYMENT_SCHEMA,
    "STATUS_PLAIN",
    ()=>STATUS_PLAIN,
    "SUBTYPE_LABELS",
    ()=>SUBTYPE_LABELS,
    "loadAttestation",
    ()=>loadAttestation
]);
/**
 * Examiner View data layer — fetches a Permitr payment attestation from
 * devnet, decodes it against the permitr-payment schema, cross-references
 * the registry record for the evaluated mint, and independently recomputes
 * the citation hash. Everything rendered is read from chain; nothing is
 * trusted from the URL beyond the attestation address itself.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$solana$2b$addresses$40$6$2e$10$2e$0_fastestsmallesttextencoderdecoder$40$1$2e$0$2e$22_typescript$40$5$2e$9$2e$3$2f$node_modules$2f40$solana$2f$addresses$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@solana+addresses@6.10.0_fastestsmallesttextencoderdecoder@1.0.22_typescript@5.9.3/node_modules/@solana/addresses/dist/index.node.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$solana$2b$rpc$40$6$2e$10$2e$0_fastestsmallesttextencoderdecoder$40$1$2e$0$2e$22_typescript$40$5$2e$9$2e$3$2f$node_modules$2f40$solana$2f$rpc$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@solana+rpc@6.10.0_fastestsmallesttextencoderdecoder@1.0.22_typescript@5.9.3/node_modules/@solana/rpc/dist/index.node.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$sas$2d$lib$40$1$2e$0$2e$10_fastestsmallesttextencoderdecoder$40$1$2e$0$2e$22_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$sas$2d$lib$2f$dist$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/sas-lib@1.0.10_fastestsmallesttextencoderdecoder@1.0.22_typescript@5.9.3/node_modules/sas-lib/dist/src/index.js [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../../../sdk/generated/index.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '../../../sdk/citation-hash.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
;
;
const PERMITR_CREDENTIAL = "91qxSAdW6T3BshWVvP6o68hoLDrFfnFoeRNT68qP6ex8";
const PERMITR_PAYMENT_SCHEMA = "8fi4naNQJYMQ7uWpvBGMWbrvuvyf6vgp7eLvbTHTJb2Y";
const rpc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$solana$2b$rpc$40$6$2e$10$2e$0_fastestsmallesttextencoderdecoder$40$1$2e$0$2e$22_typescript$40$5$2e$9$2e$3$2f$node_modules$2f40$solana$2f$rpc$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createSolanaRpc"])(process.env.RPC_URL ?? "https://api.devnet.solana.com");
const sasRpc = rpc;
const DECISION_LABELS = [
    "Allowed",
    "Blocked",
    "Rerouted"
];
const STATUS_PLAIN = {
    [Status.PathwayQualified]: {
        label: "Pathway Qualified",
        plain: "An anticipated permitted-payment-stablecoin-issuer pathway was identified for this asset's issuer, with citations."
    },
    [Status.ExceptionConditionsUnmet]: {
        label: "Exception — Conditions Unmet",
        plain: "The §18 foreign-issuer exception was identified, but its conditions are not currently satisfiable. The payment was blocked."
    },
    [Status.NoPathwayIdentified]: {
        label: "No Pathway Identified",
        plain: "No statutory pathway to permitted-issuer status was identified. The payment was blocked."
    },
    [Status.Unknown]: {
        label: "Unknown (no registry record)",
        plain: "No registry record existed for this asset. Under Permitr's fail-closed rule, unknown assets are blocked — never allowed."
    }
};
const PATHWAY_PLAIN = {
    [Pathway.IdiSubsidiary]: {
        label: "Insured Depository Institution Subsidiary",
        plain: "GENIUS Act §2(23)(A) — subsidiary of an insured depository institution."
    },
    [Pathway.FederalQualified]: {
        label: "Federal Qualified Issuer",
        plain: "GENIUS Act §2(23)(B) via §2(11) — federally qualified payment stablecoin issuer."
    },
    [Pathway.StateQualified]: {
        label: "State Qualified Issuer",
        plain: "GENIUS Act §2(23)(C), §2(31) — approved by a State payment stablecoin regulator."
    },
    [Pathway.ForeignSection18]: {
        label: "§18 Foreign-Issuer Exception",
        plain: "Not a permitted pathway: §18 is an exception to the §3 prohibition, conditional on Treasury comparability, OCC registration, and US-held reserves."
    },
    [Pathway.NoPathway]: {
        label: "No Pathway",
        plain: "No statutory basis identified."
    }
};
const SUBTYPE_LABELS = {
    [FederalSubtype.OccApprovedNonbank]: "OCC-approved nonbank (§2(11)(A))",
    [FederalSubtype.UninsuredNationalBank]: "Uninsured national bank / national trust (§2(11)(B))",
    [FederalSubtype.FederalBranch]: "Federal branch (§2(11)(C))"
};
async function loadAttestation(attestationAddress) {
    const maybe = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$sas$2d$lib$40$1$2e$0$2e$10_fastestsmallesttextencoderdecoder$40$1$2e$0$2e$22_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$sas$2d$lib$2f$dist$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchMaybeAttestation"])(sasRpc, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$solana$2b$addresses$40$6$2e$10$2e$0_fastestsmallesttextencoderdecoder$40$1$2e$0$2e$22_typescript$40$5$2e$9$2e$3$2f$node_modules$2f40$solana$2f$addresses$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["address"])(attestationAddress));
    if (!maybe.exists) return null;
    const att = maybe.data;
    const issuedByPermitr = String(att.credential) === PERMITR_CREDENTIAL && String(att.schema) === PERMITR_PAYMENT_SCHEMA;
    const schema = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$sas$2d$lib$40$1$2e$0$2e$10_fastestsmallesttextencoderdecoder$40$1$2e$0$2e$22_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$sas$2d$lib$2f$dist$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchSchema"])(sasRpc, att.schema);
    const decoded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$sas$2d$lib$40$1$2e$0$2e$10_fastestsmallesttextencoderdecoder$40$1$2e$0$2e$22_typescript$40$5$2e$9$2e$3$2f$node_modules$2f$sas$2d$lib$2f$dist$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deserializeAttestationData"])(schema.data, att.data);
    // cross-reference the registry record for the evaluated mint
    let record = null;
    try {
        const [pda] = await findRecordPda({
            mint: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$solana$2b$addresses$40$6$2e$10$2e$0_fastestsmallesttextencoderdecoder$40$1$2e$0$2e$22_typescript$40$5$2e$9$2e$3$2f$node_modules$2f40$solana$2f$addresses$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["address"])(decoded.mint)
        });
        const maybeRecord = await fetchMaybeIssuerRecord(rpc, pda);
        record = maybeRecord.exists ? maybeRecord.data : null;
    } catch  {
        record = null;
    }
    const fields = [
        "pathway",
        "status",
        "reserve",
        "redemption"
    ];
    const citations = record ? fields.flatMap((field)=>{
        const basis = {
            pathway: record.pathwayBasis,
            status: record.statusBasis,
            reserve: record.reserveBasis,
            redemption: record.redemptionBasis
        }[field];
        return basis.map((c)=>({
                field,
                authority: CiteSource[c.authority],
                reference: c.reference,
                summary: c.summary
            }));
    }) : [];
    // independent verification: recompute the citation hash from the registry
    const hashVerified = record ? Buffer.from(citationHash(record)).equals(Buffer.from(decoded.citation_hash)) : null;
    return {
        attestationAddress,
        decoded,
        issuedByPermitr,
        record,
        citations,
        hashVerified
    };
}
;
}),
"[project]/app/examiner/app/a/[address]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AuditRecord,
    "generateMetadata",
    ()=>generateMetadata,
    "revalidate",
    ()=>revalidate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$examiner$2f$lib$2f$chain$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/app/examiner/lib/chain.ts [app-rsc] (ecmascript) <locals>");
(()=>{
    const e = new Error("Cannot find module '../../../../../sdk/generated/index.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
;
;
const revalidate = 300; // attestations are immutable; cache renders
function fmt(ts) {
    return new Date(Number(ts) * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}
async function generateMetadata({ params }) {
    const { address } = await params;
    try {
        const rec = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$examiner$2f$lib$2f$chain$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["loadAttestation"])(address);
        if (!rec) return {
            title: "Attestation not found — Permitr"
        };
        const decision = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$examiner$2f$lib$2f$chain$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DECISION_LABELS"][rec.decoded.decision] ?? "Evaluated";
        const issuer = rec.record?.issuerName ?? rec.decoded.mint.slice(0, 8) + "…";
        const cite = rec.citations.find((c)=>c.field === "status")?.reference;
        return {
            title: `Permitr Audit Record — ${decision}: ${issuer}`,
            description: cite ? `${decision} under ${cite}. Registry v${rec.decoded.registry_version}, independently verifiable onchain.` : `Payment ${decision.toLowerCase()} by Permitr GENIUS Act screening.`
        };
    } catch  {
        return {
            title: "Permitr Audit Record"
        };
    }
}
async function AuditRecord({ params }) {
    const { address } = await params;
    const rec = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$examiner$2f$lib$2f$chain$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["loadAttestation"])(address).catch(()=>null);
    if (!rec) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    const d = rec.decoded;
    const decision = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$examiner$2f$lib$2f$chain$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DECISION_LABELS"][d.decision] ?? `Decision ${d.decision}`;
    const bannerClass = d.decision === 1 ? "blocked" : d.decision === 2 ? "rerouted" : "allowed";
    const status = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$examiner$2f$lib$2f$chain$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["STATUS_PLAIN"][d.status];
    const pathway = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$examiner$2f$lib$2f$chain$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["PATHWAY_PLAIN"][d.pathway];
    const subtype = rec.record && rec.record.federalSubtype !== FederalSubtype.NotApplicable ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$examiner$2f$lib$2f$chain$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["SUBTYPE_LABELS"][rec.record.federalSubtype] : null;
    const isTx = d.payment_ref.length > 60; // tx sigs vs screen ids
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                children: "Permitr Audit Record"
            }, void 0, false, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "docmeta",
                children: [
                    "Attestation ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: rec.attestationAddress
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 60,
                        columnNumber: 21
                    }, this),
                    " · ",
                    rec.issuedByPermitr ? "issued under the Permitr credential" : "⚠ NOT issued under the Permitr credential",
                    " · ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: `https://explorer.solana.com/address/${rec.attestationAddress}?cluster=devnet`,
                        children: "view raw onchain"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `banner ${bannerClass}`,
                children: [
                    "Payment ",
                    decision.toUpperCase(),
                    d.decision === 2 && " — non-qualified asset refused, paid with a qualified asset"
                ]
            }, void 0, true, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Asset & issuer"
            }, void 0, false, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Asset (SPL mint)"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 80,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                            children: d.mint
                        }, void 0, false, {
                            fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                            lineNumber: 82,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 81,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Issuer"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: rec.record?.issuerName ?? "No registry record (fail-closed: blocked)"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Issuer pathway"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: pathway ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: pathway.label
                                }, void 0, false, {
                                    fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                                    lineNumber: 90,
                                    columnNumber: 15
                                }, this),
                                subtype ? ` — ${subtype}` : null,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                                    lineNumber: 92,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        color: "var(--muted)"
                                    },
                                    children: pathway.plain
                                }, void 0, false, {
                                    fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                                    lineNumber: 93,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true) : "n/a"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Screening status"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: status?.label ?? d.status
                            }, void 0, false, {
                                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                                lineNumber: 101,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "var(--muted)"
                                },
                                children: status?.plain
                            }, void 0, false, {
                                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                                lineNumber: 103,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: [
                    "Statutory citations (registry v",
                    d.registry_version,
                    ")"
                ]
            }, void 0, true, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this),
            rec.citations.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "No registry record exists for this asset. Under Permitr’s fail-closed rule, the absence of a record is itself the basis for blocking: an unknown asset is never treated as permitted."
            }, void 0, false, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 109,
                columnNumber: 9
            }, this),
            rec.citations.map((c, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "cite",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "authority",
                            children: c.authority
                        }, void 0, false, {
                            fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                            lineNumber: 117,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "field",
                            children: [
                                c.field,
                                " basis"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                            lineNumber: 118,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "reference",
                            children: c.reference
                        }, void 0, false, {
                            fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                            lineNumber: 119,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "summary",
                            children: c.summary
                        }, void 0, false, {
                            fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                            lineNumber: 120,
                            columnNumber: 11
                        }, this)
                    ]
                }, i, true, {
                    fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                    lineNumber: 116,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Verification"
            }, void 0, false, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 124,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Evaluated at"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: fmt(d.timestamp)
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Registry version"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: [
                            "v",
                            d.registry_version,
                            " — pinned at decision time; later registry changes cannot alter this record"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Payment reference"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: isTx ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: `https://explorer.solana.com/tx/${d.payment_ref}?cluster=devnet`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                    children: [
                                        d.payment_ref.slice(0, 20),
                                        "…"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                                    lineNumber: 137,
                                    columnNumber: 15
                                }, this),
                                " (settlement transaction)"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                            lineNumber: 136,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                            children: d.payment_ref
                        }, void 0, false, {
                            fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                            lineNumber: 141,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 134,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: "Citation hash"
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 144,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                            children: [
                                Buffer.from(d.citation_hash).toString("hex").slice(0, 24),
                                "…"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                            lineNumber: 146,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                        lineNumber: 145,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: `verify ${rec.hashVerified === null ? "" : rec.hashVerified ? "ok" : "fail"}`,
                children: rec.hashVerified === null ? "Citation hash cannot be recomputed: no registry record exists for this asset (consistent with a fail-closed block)." : rec.hashVerified ? "✓ Independently verified: the citation hash recomputed from the current onchain registry record matches the hash pinned in this attestation." : "✗ The current registry record's citations differ from those pinned here — the registry has been amended since this decision. The attestation remains an accurate record of what was cited at decision time."
            }, void 0, false, {
                fileName: "[project]/app/examiner/app/a/[address]/page.tsx",
                lineNumber: 151,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/app/examiner/app/a/[address]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/examiner/app/a/[address]/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__185z4mq._.js.map