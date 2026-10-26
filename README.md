# BasePulse

BasePulse is an evidence-first Base agent project. Its repository contains a Base token-deployment path, a fail-closed trend-analysis loop, an Arc mainnet proof registry and read-only treasury tools, a Base Registry browser, and ClaimBot payment/data components.

## Verified status

| Capability                         | Current status                                                                                  | Evidence requirement                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Base ERC-20 deployment through CDP | Implemented code path; requires credentials, compiled bytecode, funds, and a successful receipt | Transaction hash, successful Base receipt, and contract address                   |
| Social trend ingestion             | Requires a configured HTTPS feed; no generated fallback                                         | Each post must include an HTTPS source URL and a timestamp less than 24 hours old |
| Base onchain metrics               | Requires a configured HTTPS metrics source; no generated fallback                               | Chain ID 8453, observation less than 15 minutes old, and an HTTPS evidence URL    |
| Trend analysis                     | Implemented with source-index validation                                                        | Every returned trend must cite supplied post indexes                              |
| Liquidity deployment               | **Not implemented**                                                                             | No claim until a real transaction and pool address exist                          |
| Fee collection                     | **Not implemented**                                                                             | No claim until a real collection transaction exists                               |
| Treasury reinvestment              | **Not implemented**                                                                             | No claim until a real transfer/swap transaction exists                            |
| Arc proof registry                 | Deployed and independently verified on Arc mainnet                                              | See [Arc treasury evidence](docs/ARC_TREASURY.md)                                 |
| NEAR Intents                       | Submission planning exists; implementation is not on `main`                                     | See [NEAR submission brief](docs/NEAR_HACKATHON_SUBMISSION.md)                    |

The dashboard displays stored database records. Its recorded treasury net is **not** represented as a live wallet balance.

## Non-fabrication rule

- No generated posts, random market values, fabricated opportunities, pretend transactions, or success responses.
- Missing credentials or evidence stop the relevant operation.
- A deployment is successful only after a successful onchain receipt returns a contract address.
- Unimplemented functionality is labeled unimplemented instead of being replaced by simulation.

## Autonomous-loop configuration

The loop is off unless `BASEPULSE_AGENT_ENABLED=true`. When enabled, it also requires:

```bash
BASEPULSE_SOCIAL_FEED_URL=https://your-source.example/posts
BASEPULSE_SOCIAL_FEED_BEARER_TOKEN=
BASEPULSE_ONCHAIN_METRICS_URL=https://your-source.example/base-metrics
BASEPULSE_ONCHAIN_METRICS_BEARER_TOKEN=
```

Social response:

```json
{
  "posts": [
    {
      "text": "Original post text",
      "sourceUrl": "https://public-source.example/post/123",
      "publishedAt": "2026-10-23T20:00:00.000Z"
    }
  ]
}
```

Metrics response:

```json
{
  "chainId": 8453,
  "volume24h": 0,
  "volumeUSD24h": 0,
  "activeAddresses": 0,
  "transactionCount": 0,
  "observedAt": "2026-10-23T20:00:00.000Z",
  "sourceUrl": "https://public-source.example/evidence"
}
```

The numeric values above document the response shape only. BasePulse does not ship them as runtime data.

## Base deployment requirements

```bash
CDP_API_KEY_NAME=
CDP_API_KEY_PRIVATE_KEY=
ERC20_DEPLOY_BYTECODE=
BASE_BUILDER_CODE=bc_hi2cipof
```

`ERC20_DEPLOY_BYTECODE` must be real compiled creation bytecode for a contract whose constructor is `(string name, string symbol)`. Builder attribution is encoded with the official `ox/erc8021` implementation.

The deployer does not claim to create liquidity. It records the receipt-derived gas cost after confirmation.

## Run and verify

```bash
pnpm install
pnpm test
pnpm check
pnpm dev
```

Arc deployment verification is handled separately by `.github/workflows/arc-verify-deploy.yml` and `scripts/verify-arc-deployment.mjs`.

## Evidence documents

- [Arc treasury integration and mainnet proof](docs/ARC_TREASURY.md)
- [Arc microgrant submission facts](docs/ARC_MICROGRANTS_SUBMISSION.md)
- [NEAR submission brief and incomplete-work disclosure](docs/NEAR_HACKATHON_SUBMISSION.md)
- [ClaimBot x402 evidence policy](claimbot-x402/README.md)

## Security

- Never commit wallet keys, API secrets, session cookies, or seed phrases.
- Keep the autonomous loop disabled until verified sources, spending policy, and funded execution credentials are deliberately configured.
- Treat database rows as records, not proof; use public receipts and contract state for onchain claims.
- Review token bytecode and transaction parameters before enabling mainnet execution.
