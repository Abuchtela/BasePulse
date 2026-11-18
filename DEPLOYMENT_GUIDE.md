# BasePulse setup and deployment

This file describes repository setup only. It is not evidence that the main
BasePulse application is deployed or that its autonomous loop has been run.
See the [verified status table](README.md#verified-status) before presenting
capabilities as complete.

## Local development

Requirements: Node.js 22+, pnpm, and a MySQL database.

```sh
pnpm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env`, then apply the repository migrations and start the
development server:

```sh
pnpm db:push
pnpm dev
```

Run the existing checks with:

```sh
pnpm check
pnpm test
pnpm build
```

The root `.env.example` documents the current environment variables. Keep
credentials out of source control. The autonomous loop is disabled unless
`BASEPULSE_AGENT_ENABLED=true`; enabling it also requires configured, fresh
HTTPS social and Base metrics sources, CDP credentials, and valid deployment
bytecode. Do not enable live operations until inputs, bytecode, spending limits,
and transaction parameters have been reviewed. NEAR Intents live execution is
separately disabled by default; see
[NEAR Intents integration](docs/NEAR_INTENTS_INTEGRATION.md).

## Production hosting

[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) is a hosting runbook, not a
deployment record. Before claiming a production deployment, publish the working
URL, hosting provider, deployed Git commit, health-check result, and relevant
feature-specific evidence. The repository currently does not link a verified
production deployment of the main BasePulse application.

For Arc's separate static demo, see
[Arc deployment evidence](docs/ARC_TREASURY.md). ClaimBot has its own public
HTTP smoke record in
[ClaimBot production verification](claimbot-x402/PRODUCTION_VERIFICATION.md);
that smoke does not prove a paid x402 settlement.
