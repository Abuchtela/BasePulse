# ClaimBot production verification

Public HTTP checks are independent of Vercel management API access. They never
sign a payment or prove payment settlement.

## Run

After deploying, bind the check to the exact full Git commit:

```sh
EXPECTED_SHA=<40-character-deployed-commit> python3 claimbot-x402/scripts/production-smoke.py
```

The main-branch workflow waits up to eight minutes for `/health.revision` to
match its commit, and checks it again after probing. Health uses
`VERCEL_GIT_COMMIT_SHA`; if that system variable is absent, revision verification
fails closed. Check that Vercel system environment variables are exposed.
Manual dispatch from another branch is skipped to avoid checking a preview
revision against the production alias.

For an explicitly unbound inspection of the current production snapshot:

```sh
ALLOW_CURRENT_SNAPSHOT=1 python3 claimbot-x402/scripts/production-smoke.py
```

This mode does not verify which revision is deployed. CI never uses it.

## Investigation: October 23, 2026 (America/Chicago)

Vercel resolved `claimbot-x402.vercel.app` to production deployment
`dpl_6gRewrYPpbgvFKfmqrch3eztC5XQ`, ready, from `main` commit
`e133026df7d4ea97fbcc3b70b9bb5d54cfb4e12d` in `Abuchtela/BasePulse`.
Its deployment hostname is
`claimbot-x402-d5ulgia4r-abuchtelas-projects.vercel.app`.

Public checks actually passed against the current snapshot:

- `/health`: 200, service `claimbot-x402`, Base Sepolia `eip155:84532`.
- `/config`: 200; `payTo` is `0x748f6614Ea6289664bC8BeB84835E2F24fE52482`;
  `publisher` is `0x4aBAf297bd37bb3FA0036b45976A92a46d903688`;
  signing network is Arkiv Tiramisu.
- `/publish.html` and `/publisher.js`: 200; expected publisher UI text and
  wallet request code present. No wallet transaction or browser interaction tested.
- Invalid project: 400, expected validation error, no payment challenge.
- ClaimBot and BasePulse: 404, expected no-eligible-records error, no payment challenge.

The existing deployment does not expose a revision marker. A revision-bound run
against the PR head deliberately failed; the current production snapshot must
not be presented as verification of PR #75 or this repair.

Scoped project and environment metadata requests both returned 403:
`Not authorized: Trying to access resource under scope "abuchtelas-projects"`.
Team ID: `team_5xBPu7Y4cVZbHAi2onKj82im`.
Project ID: `prj_Pry9lyVB7wuYEd1UYcJRRwi44iIW`.
The protected-URL fetch also failed at `read_protection_bypass`, HTTP 403.
This is management connection authorization, not an observed public API 403.
The recovery response requests team authorization, but the advertised team
authorization operation is not exposed in this session. No authenticated Vercel
CLI is installed/configured here. Deployment protection was not changed.

Still pending: authorize this Vercel connection for the team/project; inspect
root directory (`claimbot-x402` expected), production branch, build/runtime
configuration and scoped environment metadata. Effective public config matches
expected values, but dashboard overrides and RPC/facilitator settings cannot be
confirmed through the blocked management API. Merge/deploy this repair and run
the revision-bound CI before calling the PR verified. A 404 empty state does not
exercise the facilitator, paid response, or settlement path.
