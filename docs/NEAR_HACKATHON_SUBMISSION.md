# BasePulse Cross-Chain Treasury Agent

## NEAR Build Beyond Boundaries submission brief

**Primary track:** Autonomous Business  
**Secondary fit:** Agent Economy; AI Security & Defense; Memecoins With Mechanics  
**Submission deadline:** November 14, 2026 at 23:59 UTC (5:59 PM CST)  
**Official program:** https://www.near.org/blog/near-hackathon-build-beyond-boundaries

## One-line pitch

BasePulse turns verified social signals into constrained, auditable treasury actions across Base and NEAR while preserving human-defined spending limits and an onchain receipt for every decision.

## Problem

Autonomous agents can discover opportunities, but giving them unrestricted wallet access is unsafe. Teams need an agent that can identify a signal, propose an action, enforce policy, execute across chains, and prove exactly what happened.

## Existing BasePulse foundation

The current repository already contains the Base-side foundation:

| Capability | Existing implementation | NEAR extension |
| --- | --- | --- |
| Signal discovery | `server/agent/trendMonitor.ts` | Reuse the normalized trend and confidence output as intent input |
| Autonomous orchestration | `server/agent/autonomousLoop.ts` | Add a policy-gated cross-chain execution stage |
| Base token execution | `server/agent/tokenDeployer.ts` | Keep Base execution; route cross-chain actions through a NEAR adapter |
| Treasury records | `server/db.ts` and treasury tables | Store intent ID, policy result, destination chain, tx hash, and outcome |
| Audit proof | `contracts/ArcTreasuryProof.sol` and Base transaction logs | Anchor a signed execution receipt after each completed or rejected intent |
| Operator visibility | React dashboard and tRPC backend | Show quote, approval policy, execution status, and receipt |

These are verified repository components. NEAR Intents and Chain Signatures are the proposed hackathon extension and must not be presented as complete until the adapter is implemented and tested.

## Proposed system

1. **Detect:** BasePulse scores a social trend and produces structured evidence.
2. **Propose:** The agent creates a typed treasury intent, including asset, amount, destination, purpose, expiry, and maximum slippage.
3. **Guard:** A deterministic policy engine checks daily budget, per-action cap, allowlisted assets/chains, confidence threshold, cooldown, and emergency pause.
4. **Quote:** A NEAR Intents adapter requests an executable route.
5. **Execute:** An approved intent is signed through the NEAR/Chain Signatures integration; raw private keys are never returned to the model.
6. **Verify:** BasePulse waits for destination-chain confirmation and records the result.
7. **Receipt:** The service writes a tamper-evident audit receipt containing the intent hash, policy decision, transaction hash, timestamps, and final status.

## Security constraints

- Default to simulation mode.
- Deny unknown assets, chains, recipients, and expired intents.
- Enforce both per-action and rolling daily spending caps.
- Require an idempotency key so retries cannot spend twice.
- Reject stale or excessive-slippage quotes.
- Keep signing material outside prompts, logs, and the browser.
- Record rejected intents as well as successful ones.
- Provide an emergency pause that blocks new execution without erasing evidence.

## Hackathon MVP

A credible working submission must demonstrate one complete testnet flow:

- ingest a sample trend signal;
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

**BasePulse Cross-Chain Treasury Agent** is a policy-controlled autonomous business agent. It monitors social signals, turns qualified opportunities into typed treasury intents, and executes approved actions across Base and NEAR-compatible routes. Every action passes deterministic spending, allowlist, expiry, slippage, cooldown, and replay checks. BasePulse records both rejected and completed decisions and anchors a verifiable receipt containing the policy outcome and transaction evidence. The result is an agent that can operate a treasury without handing an LLM unrestricted wallet authority.

## Build sequence

1. Define `TreasuryIntent`, `PolicyDecision`, and `ExecutionReceipt` schemas.
2. Implement the deterministic policy evaluator and unit tests.
3. Implement a NEAR adapter behind a simulation-by-default interface.
4. Wire the adapter into `autonomousLoop.ts` after trend validation.
5. Persist intent lifecycle data and expose it through tRPC.
6. Add dashboard views for pending, rejected, submitted, and confirmed intents.
7. Run the end-to-end testnet flow and capture transaction evidence.
8. Publish the deployment and record the demo.

## Definition of done

The NEAR integration is complete only when a public deployment can execute the testnet flow, the repository tests pass, transaction links are verifiable, and the public demo accurately matches the code. This document alone is submission preparation, not proof that the NEAR integration is already working.
