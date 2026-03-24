---
name: setup
description: Bootstrap BasePulse in a new environment. Use when asked to set up the project, install dependencies, or prepare a fresh environment.
---

# Project Setup

## Steps

1. Copy `.env.example` to `.env` and fill in all required values:
   - `DATABASE_URL` — MySQL connection string
   - `CDP_API_KEY_NAME` / `CDP_API_KEY_PRIVATE_KEY` — Coinbase Developer Platform
   - `AGENT_PRIVATE_KEY` / `AGENT_OWNER_OPENID` — agent wallet
   - `X_API_KEY` / `X_API_SECRET` / `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` — X (Twitter) API
   - `NEYNAR_API_KEY` — Farcaster

2. Install dependencies (runs automatically on `postDevcontainerStart`):
   ```bash
   pnpm install
   ```

3. Run database migrations:
   ```bash
   pnpm db:push
   ```

4. Start the dev server:
   ```bash
   pnpm dev
   ```
   The app is available on port 5000.

5. Verify the setup:
   ```bash
   pnpm check   # TypeScript
   pnpm test    # Vitest
   ```

## Notes

- Never commit `.env` — it is in `.gitignore`.
- `pnpm-lock.yaml` is committed; do not modify it manually.
- The dev server serves both the Express API and the Vite frontend on port 5000.
