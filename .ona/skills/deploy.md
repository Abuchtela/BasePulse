---
name: deploy
description: Deploy BasePulse to production. Use when asked to deploy, release, or ship the project.
---

# Deployment

## Prerequisites

- All tests pass: `pnpm test`
- TypeScript is clean: `pnpm check`
- All required environment variables are set in the target environment.
- You are on the default branch with a clean working tree.

## Steps

1. Build the production bundle:
   ```bash
   pnpm build
   ```
   This produces:
   - `dist/` — compiled server entry point (ESM)
   - `dist/public/` — Vite frontend assets

2. Run database migrations against the production database:
   ```bash
   pnpm db:push
   ```

3. Start the production server:
   ```bash
   pnpm start
   ```
   The server reads `NODE_ENV=production` and serves the built frontend from `dist/`.

## Notes

- Secrets must be configured in the deployment environment, not committed to the repo.
- The build step bundles the server with esbuild and the frontend with Vite — both must succeed.
- Update this skill with platform-specific deploy commands (e.g. `fly deploy`, `railway up`) once a hosting target is chosen.
