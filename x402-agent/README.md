# BasePulse x402 Buyer

Standalone buyer module for BasePulse. It uses a CDP-managed wallet to answer HTTP `402 Payment Required` challenges automatically.

## Safety defaults

- Base Sepolia by default (no real USDC)
- USDC only
- $0.25 maximum per payment by default
- $5 rolling 24-hour budget by default
- Mainnet requires both `X402_ENVIRONMENT=production` and `ALLOW_MAINNET_X402=true`
- Optional Base builder-code attribution via `BASE_BUILDER_CODE`

## Setup

Requires Node.js 22+ and these Coinbase credentials:

- `CDP_API_KEY_ID`
- `CDP_API_KEY_SECRET`
- `CDP_WALLET_SECRET`

Copy `.env.example` values into your runtime environment, then install and run:

```bash
cd x402-agent
npm install
npm start -- https://x402.vercel.app/protected
```

The first run prints the CDP-managed EVM address. On the default development environment, fund that address with Base Sepolia USDC before testing a paid endpoint.

## Mainnet

Mainnet spends real USDC. It stays disabled unless you deliberately set:

```bash
X402_ENVIRONMENT=production
ALLOW_MAINNET_X402=true
```

Adjust limits with `X402_MAX_PER_PAYMENT_USD` and `X402_DAILY_BUDGET_USD`.

## Next integration point

BasePulse's autonomous loop can call this buyer after a service-selection step. Service discovery should use the CDP/x402 Bazaar, then pass the selected endpoint URL to the buyer. Keep service scoring separate from payment execution so price, output schema, trust, and budget policy can be evaluated before any wallet signature is made.
