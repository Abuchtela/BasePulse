# Arkiv integration friction report

## Confirmed during implementation

1. Contest requirements specify SDK `0.8.x`, while older quickstarts can show `0.6.x`. This implementation pins `@arkiv-network/sdk` to `0.8.1` and follows the current typed-attribute API.
2. Application timestamps require `u64`; a bare JavaScript number is inferred as `i32` and cannot hold Unix milliseconds.
3. Queryable scalar fields belong in attributes, while the eligibility list and explanatory text belong in the JSON payload.
4. Arkiv entity expiry is block-based network lifetime, not the grant application deadline. ClaimBot therefore stores the exact application deadline separately in `deadline_at`.

## To update after the live Tiramisu smoke test

- Faucet experience and time to fund the dedicated test signer
- Transaction confirmation time and explorer links
- Any SDK or RPC error reproduced during the first write/read-back
- Final query latency and pagination behavior

