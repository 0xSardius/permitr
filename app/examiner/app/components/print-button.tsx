"use client";

/** Records portability: print / save-as-PDF of the rendered audit record.
 * The PDF is a convenience copy; the onchain attestation stays canonical. */
export function PrintButton() {
  return (
    <button className="print-btn no-print" onClick={() => window.print()}>
      Print / save as PDF
    </button>
  );
}
