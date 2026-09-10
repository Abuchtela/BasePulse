# BasePulse Production Deployment

This guide is for moving BasePulse off the temporary Manus URL and onto a stable production host.

## What changed

This repo now includes:

- `Dockerfile` for production container builds
- `railway.json` for Railway deployment
- `/healthz` health-check endpoint
- Safer autonomous-agent startup controlled by `BASEPULSE_AGENT_ENABLED`

By default, the dashboard can run without automatically starting the token-deployment loop. Turn the agent loop on only after secrets, wallet funding, and safety limits are correct.

## Recommended host

Use Railway first because BasePulse needs a long-running Node server and a MySQL database.

## Deploy on Railway

1. Go to Railway and create a new project.
2. Choose **Deploy from GitHub repo**.
3. Select `Abuchtela/BasePulse`.
4. Add a MySQL database service.
5. Copy the MySQL connection URL into the app service as `DATABASE_URL`.
6. Add the required environment variables listed below.
7. Deploy.
8. Open `/healthz` on the deployed URL to confirm the server is alive.
9. Open `/dashboard` to view the BasePulse dashboard.

## Required environment variables

Minimum for the web server/database:

```bash
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
BASEPULSE_AGENT_ENABLED=false
```

Recommended Base/API variables:

```bash
BASE_API_KEY=
BASE_BUILDER_CODE=bc_hi2cipof
CDP_API_KEY_NAME=
CDP_API_KEY_PRIVATE_KEY=
```

Only set these when you are ready for autonomous/onchain behavior:

```bash
BASEPULSE_AGENT_ENABLED=true
BASEPULSE_AGENT_INTERVAL_MINUTES=15
BASEPULSE_MIN_SENTIMENT_SCORE=60
BASEPULSE_MIN_MENTIONS=5
BASEPULSE_MIN_VOLUME_24H_USD=100000
BASEPULSE_MAX_DEPLOYMENTS_PER_DAY=10
AGENT_PRIVATE_KEY=
AGENT_OWNER_OPENID=
```

Social/API integrations:

```bash
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
NEYNAR_API_KEY=
```

Analytics, optional:

```bash
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

## Important safety note

Do not enable `BASEPULSE_AGENT_ENABLED=true` until:

- The agent wallet is funded only with money you are willing to risk.
- `BASEPULSE_MAX_DEPLOYMENTS_PER_DAY` is set conservatively.
- You have confirmed token deployment behavior on a test setup.
- Private keys are stored only in the hosting provider's secret/environment settings.

Never commit `.env`, private keys, API keys, seed phrases, or database credentials to GitHub.

## Health check

After deployment, visit:

```text
https://YOUR-APP-URL/healthz
```

Expected response:

```json
{
  "status": "ok",
  "service": "basepulse",
  "nodeEnv": "production",
  "agentEnabled": false
}
```

## If deployment fails

Check these first:

1. Missing `DATABASE_URL`
2. MySQL service not reachable from the app
3. Build error from TypeScript or missing dependencies
4. Secrets pasted with extra quotes or spaces
5. Agent enabled without required wallet/API credentials

## Domain setup

After Railway gives you a working URL, connect a custom domain like:

```text
basepulse.xyz
app.basepulse.xyz
basepulse.dev
```

Use the DNS records Railway provides. Keep `basepulse.manus.space` only as an old demo URL, not the main production identity.
