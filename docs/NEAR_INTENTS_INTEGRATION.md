# NEAR Intents integration

BasePulse now integrates NEAR Intents through the official 1Click TypeScript SDK. The integration is fail-closed: it is disabled by default, quotes are simulations by default, and only an authenticated BasePulse administrator can prepare or submit a treasury action.

## Implemented flow

1. Discover current 1Click assets with `near.tokens`.
2. Submit a typed `TreasuryIntent` to `near.quote`.
3. Validate asset and recipient allowlists, per-action and daily USD limits, slippage, expiry, and trend confidence.
4. Store the intent, provider quote, signature, policy result, and receipt hash in `near_intent_executions`.
5. In live mode, transfer the exact quoted asset amount from the origin wallet to the returned deposit address.
6. Register that origin-chain transaction with `near.submitDeposit`.
7. Poll `near.status` to record the NEAR intent hashes and destination-chain transaction hashes.

The service never accepts a caller-provided daily-spend total. It derives live spending from durable database records. A unique idempotency key prevents a process restart or retried request from producing a second action.

## Routes

All mutation and asset-discovery routes require an authenticated admin session.

| tRPC route | Purpose |
| --- | --- |
| `near.config` | Public, non-secret readiness summary |
| `near.tokens` | Current supported asset IDs, optionally filtered by blockchain |
| `near.quote` | Policy evaluation plus dry or live 1Click quote |
| `near.submitDeposit` | Associate the already-sent origin transaction with its signed quote |
| `near.status` | Refresh provider state and persist final transaction evidence |

## Safe configuration

```env
NEAR_INTENTS_ENABLED=true
NEAR_INTENTS_LIVE_EXECUTION=false
ONE_CLICK_JWT=
NEAR_INTENTS_REFERRAL=basepulse
NEAR_INTENTS_MAX_ACTION_USD=10
NEAR_INTENTS_MAX_DAILY_USD=25
NEAR_INTENTS_MAX_SLIPPAGE_BPS=100
NEAR_INTENTS_MIN_TREND_CONFIDENCE=70
NEAR_INTENTS_ALLOWED_ORIGIN_ASSETS=asset-id-from-near.tokens
NEAR_INTENTS_ALLOWED_DESTINATION_ASSETS=asset-id-from-near.tokens
NEAR_INTENTS_ALLOWED_RECIPIENTS=exact-recipient,exact-refund-address
```

Keep `NEAR_INTENTS_LIVE_EXECUTION=false` until a simulation quote succeeds with the intended assets. A live quote returns a deposit address; it does not itself move funds. The wallet transfer remains a separate, explicit action, after which its transaction hash can be submitted for tracking.

## Verification

```bash
pnpm check:near
pnpm test
pnpm build
```

Coverage includes allowlists, spending caps, slippage, expiry, trend confidence, simulation enforcement, deterministic receipt hashing, idempotent retries across service instances, and daily-budget accounting after a deposit is submitted.

## Accuracy boundary

This implementation uses NEAR Intents/1Click for cross-chain routing and settlement. It does not yet request NEAR MPC Chain Signatures. The two technologies are related but separate, and BasePulse does not claim Chain Signatures until that signer flow is implemented and proven on testnet.
