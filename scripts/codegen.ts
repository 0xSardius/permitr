/**
 * Generate a @solana/kit-native TypeScript client from the Anchor IDL.
 * Output is checked into git (sdk/generated) so consumers don't run codegen.
 */
import { createFromRoot } from "codama";
import { rootNodeFromAnchor, type AnchorIdl } from "@codama/nodes-from-anchor";
import { renderVisitor } from "@codama/renderers-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const idl = JSON.parse(
  readFileSync(path.join(root, "target/idl/permitr_registry.json"), "utf8"),
) as AnchorIdl;

const codama = createFromRoot(rootNodeFromAnchor(idl));
codama.accept(renderVisitor(path.join(root, "sdk/generated")));
console.log("Generated kit client at sdk/generated");
