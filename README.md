# BasePulse

BasePulse is a TypeScript web application and evidence-first agent project for Base. It combines an authenticated dashboard and Base Registry browser with components for verified trend analysis, Base token deployment, Arc treasury proofs, and ClaimBot.

The project is intentionally explicit about what is implemented and what remains incomplete. It does not substitute generated data or simulated transactions for external evidence.

## What is included

| Area | Current status |
| --- | --- |
| Trend analysis | Uses supplied social posts and requires returned trends to cite their source-post indexes. |
| Autonomous Base agent | Disabled by default. When enabled, requires configured live HTTPS social and Base metrics sources; stale or invalid evidence stops an iteration. |
| Base token deployment | CDP deployment path requires credentials and real compiled ERC-20 creation bytecode. Success is recorded only after a successful Base receipt returns a contract address. |
| Liquidity, fee collection, reinvestment | Not implemented. Base token deployment does not create a liquidity pool. |
| Base Registry browser | Included in the web application. Authenticated registry requests can use `BASE_API_KEY`. |
| Arc treasury | Includes read-only Arc queries and a separate wallet-approved proof registry. The registry records hashes; it does not hold or transfer funds. See [Arc treasury documentation](docs/ARC_TREASURY.md). |
| ClaimBot | Payment and data components are documented in [claimbot-x402](claimbot-x402/README.md). |
| NEAR Intents | Submission planning exists; execution is not implemented on `main`. See the [NEAR submission brief](docs/NEAR_HACKATHON_SUBMISSION.md). |

The dashboard displays stored database records. Its treasury net is a recorded ledger value, not a live wallet balance or independent proof of an onchain event.

## How the agent works

When explicitly enabled, the autonomous loop follows this evidence-gated flow:

1. Fetch recent posts from a configured HTTPS social feed.
2. Fetch Base onchain metrics from a configured HTTPS source.
3. Analyze only the supplied posts and require trends to cite the supporting post indexes.
4. Apply configured sentiment, mention, volume, and daily deployment limits.
5. If a deployment is triggered, submit it through CDP and record it only after confirmation.

The loop rejects social posts older than 24 hours and metrics not observed within 15 minutes. Metrics must identify Base with chain ID `8453` and include an HTTPS evidence URL. Missing, stale, malformed, or unsupported inputs fail closed; there is no generated-data fallback.

## Requirements

- Node.js 22 or newer
- pnpm
- MySQL, if using database-backed application features

## Local setup

From the repository root:

```bash
pnpm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env` for database-backed features. To create and apply the database migrations, run:

```bash
pnpm db:push
```

Start the application:

```bash
pnpm dev
```

The server uses port `3000` by default and looks for the next available port if that one is busy. Open `http://localhost:3000/`; the dashboard is at `/dashboard` and may require authentication.

## Configuration

The complete variable list and safe defaults are in [`.env.example`](.env.example). Important settings include:

- `DATABASE_URL` — MySQL connection string for database-backed features.
- `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`, and `ERC20_DEPLOY_BYTECODE` — required for Base token deployment. The bytecode must be real compiled creation bytecode for a contract whose constructor is `(string name, string symbol)`.
- `BASE_BUILDER_CODE` — ERC-8021 Builder Code used for Base transaction attribution.
- `BASEPULSE_AGENT_ENABLED` — set to `true` only when deliberately enabling the autonomous loop. It is disabled otherwise.
- `BASEPULSE_SOCIAL_FEED_URL` and `BASEPULSE_ONCHAIN_METRICS_URL` — HTTPS evidence sources required when the loop is enabled. Optional bearer-token variables are also available.
- `BASE_API_KEY` — optional credential for authenticated Base Registry API requests.

The loop's thresholds and interval can be set with `BASEPULSE_AGENT_INTERVAL_MINUTES`, `BASEPULSE_MIN_SENTIMENT_SCORE`, `BASEPULSE_MIN_MENTIONS`, `BASEPULSE_MIN_VOLUME_24H_USD`, and `BASEPULSE_MAX_DEPLOYMENTS_PER_DAY`. Deployment requires funded execution credentials; review bytecode and transaction parameters before enabling it.

## Development commands

```bash
pnpm dev       # Start the development server
pnpm test      # Run the test suite
pnpm check     # Type-check the project
pnpm build     # Build the client and server
pnpm start     # Run the production server after building
```

## Project documentation

- [Verified agent architecture and known limitations](AGENT_ARCHITECTURE.md)
- [Arc treasury integration and mainnet proof](docs/ARC_TREASURY.md)
- [Arc microgrant submission facts](docs/ARC_MICROGRANTS_SUBMISSION.md)
- [NEAR submission brief and incomplete-work disclosure](docs/NEAR_HACKATHON_SUBMISSION.md)
- [NEAR Intents integration notes](docs/NEAR_INTENTS_INTEGRATION.md)
- [ClaimBot x402 evidence policy](claimbot-x402/README.md)

## Security and verification

- Never commit wallet keys, API secrets, session cookies, or seed phrases.
- Keep the autonomous loop disabled until its evidence sources, spending policy, and funded execution credentials have been reviewed.
- Treat database rows as records, not proof. Verify onchain claims with public receipts and contract state.
- Do not describe liquidity deployment, fee collection, or treasury reinvestment as available until backed by real implementations and evidence.
