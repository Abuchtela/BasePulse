# Circle Arc Microgrants — BasePulse Arc USDC Treasury

> **Status:** Deployed and independently verified on Arc mainnet (chain 5042). Live proof recording demonstrated. This document is a submission aid, **not** evidence of a DoraHacks submission or grant award.

## Application fields
- **Build name:** BasePulse Arc USDC Treasury
- **Category:** Infrastructure / Developer Tools (choose the closest available option)
- **Project website:** https://abuchtela.github.io/BasePulse/
- **GitHub repository / Arc implementation:** https://github.com/Abuchtela/BasePulse/tree/feature/arc-usdc-treasury
- **Builder profile:** https://github.com/Abuchtela

### Vision (250-character limit)
BasePulse Arc USDC Treasury reads live balances and transaction receipts on Arc mainnet and anchors audit proofs in a deployed onchain registry, giving developers transparent, verifiable USDC treasury evidence.

### Project description
BasePulse Arc USDC Treasury combines real-time blockchain observability with a deployed, noncustodial proof registry on Circle's Arc mainnet. The public dashboard lets users inspect Arc network status, public USDC balances, and transaction receipts without a wallet connection. An owner-controlled Solidity registry can permanently record a bytes32 hash and emits a public onchain event. This experiment establishes a verifiable audit trail for future agent-driven USDC treasury reporting, without custody or automated spending.

**Live proof, not simulated data:** We deployed ArcTreasuryProof.sol on Arc mainnet and successfully recorded its first proof, anchoring the deployment transaction hash. Our CI rebuilds the Solidity source and checks the actual creation transaction, onchain bytecode, proof event, and recorded state.

## Onchain evidence
| Artifact | Verified value |
| --- | --- |
| Chain | Arc Mainnet, chain ID 5042 |
| Contract address | `0xa8ffe853e041b0033441a4bea272a5cbb032e9c6` |
| Deployment transaction | `0xc4a13b5e5c15b24f69f06a48e55927333992efe2b68cb948370bb0c8f455b910` |
| Deployment block | 25,760,713 |
| Proof transaction (not the deployment transaction) | `0xa29565ca13c91df360705106b2dcd5d1e822cb415f388cf5a0b5dc0cf290d45b` |
| Proof block | 25,761,240 |
| Anchored bytes32 digest | `0xc4a13b5e5c15b24f69f06a48e55927333992efe2b68cb948370bb0c8f455b910` |
| Proof count on independent verification | 1 |
| Proof event, recorded(bytes32) state | Verified true by CI |

- **Contract explorer:** https://explorer.arc.io/address/0xa8ffe853e041b0033441a4bea272a5cbb032e9c6
- **Deployment explorer:** https://explorer.arc.io/tx/0xc4a13b5e5c15b24f69f06a48e55927333992efe2b68cb948370bb0c8f455b910
- **Proof explorer:** https://explorer.arc.io/tx/0xa29565ca13c91df360705106b2dcd5d1e822cb415f388cf5a0b5dc0cf290d45b
- **Machine-readable verification:** https://abuchtela.github.io/BasePulse/arc-deployment-verified.json
- **Source contract:** https://github.com/Abuchtela/BasePulse/blob/feature/arc-usdc-treasury/contracts/ArcTreasuryProof.sol
- **Verification script:** https://github.com/Abuchtela/BasePulse/blob/feature/arc-usdc-treasury/scripts/verify-arc-deployment.mjs

## Limitations (honest disclosures)
- No custody, user payouts, token deployment, liquidity management, or autonomous trading on Arc is implemented by this registry.
- Read-only treasury queries do not capture unlimited history; the recent-transfer index covers a bounded block window.
- No audit, outside users, traction, or grant award is claimed.
- Browser-wallet interaction is optional for proof anchoring. Viewing the dashboard is free.
- Submission and eligibility decisions are handled by DoraHacks/Circle, not by this project or GitHub CI.

## DoraHacks submission
Open https://dorahacks.io/hackathon/arc-microgrants/detail and submit the build with its live website and the feature-branch source link above. Review the entered fields, then complete final submission under your own DoraHacks account. The program information supplied by the organizer gives a closing deadline of **October 14, 2026 at 23:59 ET**.
