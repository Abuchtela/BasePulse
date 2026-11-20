# BasePulse agent architecture — verified state

## Execution boundary

The autonomous loop is disabled by default. Enabling it requires live HTTPS social and Base-mainnet metrics sources. Either source being absent, stale, malformed, or unsupported aborts the iteration. There is no generated-data fallback.

```text
verified posts -> evidence-linked LLM analysis -> verified Base metrics
               -> threshold decision -> CDP deployment -> successful receipt
               -> database record
```

## Components

### `server/agent/verifiedSources.ts`

- Requires HTTPS endpoints.
- Requires social timestamps within 24 hours.
- Requires Base chain ID `8453` and metrics observed within 15 minutes.
- Requires public HTTPS evidence URLs.
- Throws instead of manufacturing missing inputs.

### `server/agent/trendMonitor.ts`

- Sends only supplied posts to the LLM.
- Requires the model to return supporting post indexes.
- Derives mention counts and evidence URLs from those indexes instead of trusting an invented count.
- Stores the evidence URLs, metrics source, observation timestamp, and chain ID.

### `server/agent/autonomousLoop.ts`

- Runs only when explicitly enabled.
- Applies sentiment, mention, volume, and daily deployment limits.
- Does not collect fees or reinvest funds; those paths are not implemented.
- Records a successful deployment only after the deployer returns confirmed onchain evidence.

### `server/agent/tokenDeployer.ts`

- Uses a named CDP server account on Base.
- Requires explicit compiled creation bytecode.
- Appends the ERC-8021 Builder Code suffix.
- Waits for a successful receipt and contract address.
- Records receipt-derived gas cost.
- Does not create or claim a liquidity pool.

### `server/agent/baseAttribution.ts`

- Uses `Attribution.toDataSuffix` from `ox/erc8021`, matching Base's official integration guidance.
- Rejects values that are not `bc_` Builder Codes.

### Arc treasury integration

- Read-only network, balance, transfer, and transaction queries live under `server/arc`.
- `contracts/ArcTreasuryProof.sol` is a noncustodial hash registry; it does not transfer funds.
- The deployed mainnet address and verification transactions are documented in `docs/ARC_TREASURY.md`.

### ClaimBot

- `claimbot-x402` rejects fabricated opportunities and reads only records from its configured trusted Arkiv publisher.
- Unit tests do not count as x402 settlement proof.

## Stored records versus proof

The MySQL tables store token, trend, treasury, social, and agent records. A row is not independent proof of an onchain or social event. Public source URLs, transaction hashes, receipts, contract bytecode, and contract state are the verification layer.

The dashboard labels its treasury figure as a recorded ledger net, not a live wallet balance.

## Known incomplete functionality

- Base liquidity deployment
- Trading-fee collection
- Treasury reinvestment
- Production social-feed configuration
- Production Base metrics-feed configuration
- End-to-end proof of an autonomous Base deployment from verified social evidence
- NEAR Intents execution on `main`

These items must remain labeled incomplete until backed by real transactions or independently inspectable source evidence.
