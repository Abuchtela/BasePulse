# ClaimBot x402 verified opportunities API

The seller responds with **real, trusted-publisher Arkiv records**, not mock opportunities.
It filters for eligible, unexpired, HTTPS-source opportunities.

## Setup (Node.js 22+)

From the repository root:

```sh
npm ci --prefix claimbot-arkiv
npm install --prefix claimbot-x402
npm run check --prefix claimbot-x402
npm test --prefix claimbot-x402
ARKIV_TRUSTED_PUBLISHER=0xYOUR_ARKIV_PUBLISHER npm run start --prefix claimbot-x402
```

`X402_PAY_TO`: optional explicit payout override. ClaimBot's configured receiving address defaults to `0x748f6614Ea6289664bC8BeB84835E2F24fE52482` (public address supplied by the project owner). Verify it is correct before accepting real payments. The address is also recorded in `.env.example`.
`ARKIV_TRUSTED_PUBLISHER`: the EVM account that actually publishes ClaimBot's verified records on Arkiv. The seller refuses to start without both addresses.
These are **public addresses**, not private keys. The receiving wallet is preselected; the trusted Arkiv publisher must still be explicitly supplied.

Defaults: Base Sepolia test USDC; $0.10/request; public testnet facilitator.
Optional: `ARKIV_RPC_URL`, `X402_FACILITATOR_URL`, `X402_PRICE`, `PORT`.

```sh
curl -i http://localhost:4021/health
curl -i 'http://localhost:4021/api/opportunities?project=ClaimBot'
```

An invalid project returns 400, unavailable Arkiv data returns 503, and zero eligible verified records return 404. All three happen **before a payment is requested**. With records present, requests without payment receive HTTP 402. A compatible client can pay and obtain the preflighted report.

## Mainnet

Require all of `X402_NETWORK=base`, `ALLOW_MAINNET_X402_SELLER=true`, and `X402_FACILITATOR_URL` set to an HTTPS facilitator supporting Base mainnet. Do this only after a verified Base Sepolia 402 -> 200 round trip, correct USDC settlement and receiver balance, and confirmed source records. This seller never creates Arkiv records; run the separate `claimbot-arkiv` publisher.

The shared BasePulse buyer remains `x402-agent` with independent spending safeguards. GitHub unit tests do not demonstrate a real settlement or production deployment.
