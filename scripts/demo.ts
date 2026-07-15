/**
 * One-command demo: boots the resource server, runs the Permitr Agent
 * (AI-narrated if ANTHROPIC_API_KEY is set, deterministic otherwise),
 * then shuts down. This is the spine of the 3-minute demo video.
 */
import "dotenv/config";
import { spawn } from "node:child_process";

const PORT = process.env.PORT ?? "4021";

async function waitForHealth(timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${PORT}/healthz`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("resource server did not come up");
}

console.log("━━━ Permitr demo ━━━");
console.log("[1/3] starting x402 resource server (offers ShadyUSD first, USDC second)…");
const server = spawn("npx", ["tsx", "app/resource-server/index.ts"], {
  stdio: "ignore",
  detached: false,
});
try {
  await waitForHealth();
  console.log("[2/3] server up. Releasing the agent…\n");

  const agentScript = process.env.ANTHROPIC_API_KEY
    ? "app/agent/index.ts"
    : "app/agent/pay.ts";
  const agent = spawn("npx", ["tsx", agentScript], { stdio: "inherit" });
  const code: number = await new Promise((r) => agent.on("exit", r));

  console.log("\n[3/3] demo complete.");
  process.exitCode = code ?? 1;
} finally {
  server.kill();
}
