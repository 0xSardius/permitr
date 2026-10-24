"use client";

// An RPC outage is not a verdict: this page never says "blocked", "allowed"
// or "not found" — only that the record could not be read right now.
export default function RecordError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Record temporarily unavailable</h1>
      <div className="banner anomaly">
        The Solana devnet RPC did not return this record. Nothing is shown
        rather than a partial or unverified record. This is not a screening
        decision of any kind.
      </div>
      <p>
        <button className="print-btn" style={{ float: "none" }} onClick={() => reset()}>
          Try again
        </button>{" "}
        <a href="/">← Home</a>
      </p>
    </>
  );
}
