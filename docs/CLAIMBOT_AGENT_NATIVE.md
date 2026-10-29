# ClaimBot Agent-Native opportunity review

New work for the Builder.io Agent-Native Hackathon, starting October 29, 2026.
The existing `claimbot-x402` seller and `claimbot-arkiv` publisher are unchanged.

## Implemented

- Official Agent-Native 0.222.0 Chat runtime, with a ClaimBot review workspace at `/home`.
- Save an organizer's HTTPS URL and actual pasted source text; no seeded opportunities.
- Shared typed actions for UI and agent: create, list, read, update.
- PostgreSQL/PGlite persistence with private caller-and-org filtering.
- Source statements require exact quotations present in the immutable source.
- Fit inference and unknown facts are separate; text support is not live-site verification.
- Editable checklists; completed items require an evidence link or note.
- Revision-checked writes reject concurrent stale edits.
- Agent analysis is routed to the real shared sidebar/model runtime, not a canned response.

## Run

Requires Node >=22.22 and pnpm.

```sh
cd claimbot-agent-native
pnpm install
pnpm typecheck
pnpm agent-native:doctor
pnpm dev
```

If the host cannot enumerate network interfaces, use `pnpm exec vite --host 127.0.0.1` for a loopback-only local server.
No authentication bypass is configured. Local PGlite data is not committed.
Use the runtime's existing Settings → Model connection; do not place keys in code or chats.

Production needs a persistent PostgreSQL `DATABASE_URL`, production authentication,
and a configured real model through Agent-Native. Do not replace the existing
x402 deployment root with this app unintentionally.

## Verification and submission boundary

Typechecking and framework doctor are local code checks, not proof of a successful
model turn, live deployment, or hackathon entry. A public Clips recording of the
actual working app is required. No recording or entry is fabricated by this code.

Before recording, verify with a real current opportunity: save source → ask the
connected model to analyze → inspect quotes and unknowns → edit checklist → reload
and confirm persistence. Also verify stale edits are rejected and signed-out
requests cannot read records. State any remaining limitations honestly.

Rules: https://www.builder.io/hackathon/rules
Deadline: November 9, 2026, 11:59 PM America/Los_Angeles (November 10, 07:59 UTC).
Identify the existing ClaimBot/x402/Arkiv code as pre-existing work. Claim only the
new Agent-Native workspace and source-review workflow as hackathon-period work.
