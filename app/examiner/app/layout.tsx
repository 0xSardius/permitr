import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Permitr Examiner View",
  description:
    "Plain-English audit records for GENIUS Act stablecoin payment screening — onchain SAS attestations rendered with statutory citations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <footer className="disclaimer">
          <strong>Not legal advice.</strong> Permitr is a machine-readable
          mirror of public law with citations. It is a research and
          engineering tool, not legal advice and not a legal determination of
          any issuer&rsquo;s status. Classifications are illustrative and cite
          the statute and proposed rules in effect at the registry version
          shown.
        </footer>
      </body>
    </html>
  );
}
