# ClaimBot x402 paid opportunities API

A real x402 seller route for **live Arkiv-verified records**, not mock opportunities.
The route calls the existing `claimbot-arkiv/src/client.ts` reader, filters for eligible unexpired records, and fails closed (503) when Arkiv cannot be reached.

## Install and start
Run from the repository root (Node 22+):

```sh
cd claimbot-x402
npm install
X402_PAY_TO=0xYOUR_REAL_RECEIVING_WALLET npm start
```

By default, payments are **Base Sepolia test USDC** ($0.10) using the public testnet facilitator.
Optional `ARKIV_RPC_URL` overrides the existing Arkiv Tiramisu endpoint. The receiving wallet must be your own valid address.

```sh
curl -i 'http://localhost:4021/api/opportunities?project=ClaimBot'
```

Expected: HTTP 402 payment challenge before a verified payment. An x402-compatible client can pay and retry. After settlement the route queries **live Arkiv** for open opportunities; it can legitimately return an empty list.

## Production safety
- Set `X402_NETWORK=base`, `ALLOW_MAINNET_X402_SELLER=true`, and `X402_FACILITATOR_URL` (a production-capable HTTPS facilitator) explicitly.
- Keep signing credentials out of this seller: it only needs a **public receiving wallet address**.
- Query delivery is not yet tested with real payments. Confirm live 402 -> paid 200, facilitator settlement, receiver balance and response accuracy before advertising.
- This seller does **not** create source records. The existing ClaimBot publisher must put verified records on Arkiv first.
- Do not claim a paid report exists if no eligible records have been published.
- Buyer module remains in `x402-agent`; do not enable spending without an explicit test budget.
