# Arc Studio build prompt: BasePulse SpendGuard

Create a production-minded Solidity contract named `ArcSpendGuard` for Arc that lets a single owner wallet make tightly controlled USDC treasury payments while preserving a simple onchain audit trail.

Requirements:

- Solidity `^0.8.28`, MIT licensed, no external imports.
- Fix the Arc USDC ERC-20 predeploy address as `0x3600000000000000000000000000000000000000`.
- The contract must not custody funds. It should use `transferFrom(owner, recipient, amount)`, so the owner gives only a limited ERC-20 allowance and keeps wallet custody.
- Only the owner can execute a payment or change policy.
- Each payment takes a unique `bytes32 intentId`, recipient, amount, and expiry timestamp.
- Reject zero intent IDs, duplicate intent IDs, zero recipients, zero amounts, expired intents, paused operation, recipients not on the allowlist, payments above the per-transaction cap, or payments that would exceed a rolling UTC-day cap.
- Track daily spend using `block.timestamp / 1 days`; reset the tracked amount when the day number changes.
- Record used intent IDs before the external token call to prevent replay/reentrancy.
- Use a low-level token call that accepts either a boolean `true` return value or no return data, and reverts on failure.
- Emit clear events for payment execution, recipient allowlist changes, limit changes, pause changes, and ownership transfer.
- Add custom errors rather than revert strings.
- Add two-step ownership transfer (`proposeOwner` and `acceptOwnership`).
- Expose view helpers for the current UTC day and remaining daily capacity.
- Keep the implementation compact and readable. Do not add upgradeability, arbitrary token support, delegates, automation, or hidden privileged paths.
- Include NatSpec comments that state the security model: owner-approved transactions, owner-controlled ERC-20 allowance, public events, and no unattended execution.

Return the complete Solidity source only. This is for BasePulse, an autonomous social-trend-to-token agent; SpendGuard is the wallet-controlled Arc payment boundary and audit layer.
