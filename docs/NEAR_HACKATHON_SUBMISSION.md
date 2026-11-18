# BasePulse Cross-Chain Treasury Agent

## NEAR Build Beyond Boundaries submission brief

**Primary track:** Autonomous Business  
**Secondary fit:** Agent Economy; AI Security & Defense; Memecoins With Mechanics  
**Deadline listed in this draft:** November 14, 2026 at 23:59 UTC (passed as of November 18, 2026; confirm any current program window with the organizer).  
**Official program:** https://www.near.org/blog/near-hackathon-build-beyond-boundaries

## One-line pitch

BasePulse turns verified social signals into constrained, auditable treasury actions across Base and NEAR while preserving human-defined spending limits and an onchain receipt for every decision.

## Problem

Autonomous agents can discover opportunities, but giving them unrestricted wallet access is unsafe. Teams need an agent that can identify a signal, propose an action, enforce policy, execute across chains, and prove exactly what happened.

## Existing BasePulse foundation

The repository contains these Base-side components:

| Capability               | Existing implementation                                    | NEAR extension                                                            |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Signal discovery         | `server/agent/trendMonitor.ts`                             | Reuse the normalized trend and confidence output as intent input          |
| Autonomous orchestration | `server/agent/autonomousLoop.ts`                           | Add a policy-gated cross-chain execution stage                            |
| Base token execution     | `server/agent/tokenDeployer.ts`                            | Keep Base execution; route cross-chain actions through a NEAR adapter     |
| Treasury records         | `server/db.ts` and treasury tables                         | Store intent ID, policy result, destination chain, tx hash, and outcome   |
| Audit proof              | `contracts/ArcTreasuryProof.sol` and Base transaction logs | Anchor a signed execution receipt after each completed or rejected intent |
| Operator visibility      | React dashboard and tRPC backend                           | Show quote, approval policy, execution status, and receipt                |

Code presence is not deployment or usage evidence. The Arc registry is independently verified on Arc mainnet; the repository does not link an end-to-end Base trend-to-token transaction.

### Current implementation status

The NEAR Intents/1Click adapter, policy gate, durable idempotency ledger, admin tRPC routes, provider-status tracking, and tests are implemented in this repository. Quotes are simulations by default; live deposits require explicit configuration and a separate wallet transfer. This brief contains no public funded-swap transaction evidence. NEAR MPC Chain Signatures are not implemented. Do not claim a completed cross-chain execution until testnet transactions and a matching public demo are linked.

## Proposed system

1. **Detect:** BasePulse scores a social trend and produces structured evidence.
2. **Propose:** The agent creates a typed treasury intent, including asset, amount, destination, purpose, expiry, and maximum slippage.
3. **Guard:** A deterministic policy engine checks daily budget, per-action cap, allowlisted assets/chains, confidence threshold, cooldown, and emergency pause.
4. **Quote:** A NEAR Intents adapter requests an executable route.
5. **Execute (target, not demonstrated):** The current flow requires a separate explicit origin-wallet transfer. Automated signing through NEAR MPC Chain Signatures is not implemented.
6. **Verify:** BasePulse waits for destination-chain confirmation and records the result.
7. **Receipt:** The service writes a tamper-evident audit receipt containing the intent hash, policy decision, transaction hash, timestamps, and final status.

## Security constraints

- Default to disabled; testnet execution still requires real source evidence and real testnet receipts.
- Deny unknown assets, chains, recipients, and expired intents.
- Enforce both per-action and rolling daily spending caps.
- Require an idempotency key so retries cannot spend twice.
- Reject stale or excessive-slippage quotes.
- Keep signing material outside prompts, logs, and the browser.
- Record rejected intents as well as successful ones.
- Provide an emergency pause that blocks new execution without erasing evidence.

## Hackathon MVP

A credible working submission must demonstrate one complete testnet flow:

- ingest a current trend signal with public source evidence;
- produce a typed cross-chain treasury intent;
- reject one intent that violates a spending rule;
- approve one intent that satisfies policy;
- execute the approved route through NEAR infrastructure;
- show the destination transaction and audit receipt in the dashboard;
- safely replay the same request without a second spend.

## Deliverables and proof

- Public source repository.
- Public working deployment.
- Public demo post with video or screenshots.
- NEAR account for prize payout.
- Transaction links for the NEAR-side action and destination-chain result.
- Test output proving spending-limit rejection and idempotent replay.
- Architecture diagram and concise setup instructions.
- Clear disclosure of testnet versus mainnet behavior.

## Submission description draft

**Draft only:** This project has implemented NEAR Intents/1Click policy, quoting, and status tracking. A funded cross-chain swap, public end-to-end deployment, and transaction-backed receipt are not demonstrated here. Keep this as a proposed submission until those proofs exist.

## Remaining proof and delivery work

1. Link the exact deployed revision and public working deployment.
2. Run and document the full funded testnet flow, including a rejected policy case, an approved action, origin and destination transaction links, and idempotent replay.
3. Add a dashboard view only if it can show the persisted lifecycle and verifiable receipts.
4. Implement Chain Signatures only if it is in scope, then document and prove that signer flow separately.
5. Update the submission text and deadline only after confirming current organizer requirements.

## Definition of done

The adapter code and tests exist, but the integration is not proven operational until a public deployment executes the testnet flow, transaction links are verifiable, and the public demo matches the deployed revision. This file is a draft, not proof of submission or award.
