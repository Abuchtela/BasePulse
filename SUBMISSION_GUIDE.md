# BasePulse grant-review evidence brief

> **Status snapshot: November 18, 2026.** This is an evidence brief, not proof
> of a grant application, competition entry, award, or project traction. The
> repository does not establish that the older Base Build submission was made.
> Do not use prior versions of this file as a factual project description.

## What is verifiable

### Arc mainnet proof registry

The strongest public onchain evidence is a non-custodial Arc registry deployment
and a separate successful proof-recording transaction:

- Chain: Arc mainnet, chain ID `5042`.
- Contract: [`0xa8ffe853e041b0033441a4bea272a5cbb032e9c6`](https://explorer.arc.io/address/0xa8ffe853e041b0033441a4bea272a5cbb032e9c6).
- Creation transaction: [`0xc4a13b5e5c15b24f69f06a48e55927333992efe2b68cb948370bb0c8f455b910`](https://explorer.arc.io/tx/0xc4a13b5e5c15b24f69f06a48e55927333992efe2b68cb948370bb0c8f455b910).
- Proof-recording transaction: [`0xa29565ca13c91df360705106b2dcd5d1e822cb415f388cf5a0b5dc0cf290d45b`](https://explorer.arc.io/tx/0xa29565ca13c91df360705106b2dcd5d1e822cb415f388cf5a0b5dc0cf290d45b).
- [Machine-readable verification record](https://abuchtela.github.io/BasePulse/arc-deployment-verified.json) and [technical description](docs/ARC_TREASURY.md).

The registry records hashes and emits an event. It does not custody or transfer
USDC, execute treasury actions, or prove user adoption. The anchored digest is
the registry creation transaction hash, not a financial report.

### Base agent

The repository contains a fail-closed trend-analysis and CDP token-deployment
code path. The autonomous loop requires externally configured evidence feeds
and is disabled by default. This brief has no public transaction evidence of a
Base token deployed by BasePulse or of an end-to-end sourced trend-to-deployment
run. Liquidity deployment, fee collection, and treasury reinvestment are not
implemented. See the [status table](README.md#verified-status) and
[outstanding evidence checklist](todo.md).

### NEAR Intents and ClaimBot

NEAR Intents/1Click policy, quote, and tracking code exists in the repository,
but this brief has no public funded-swap transaction evidence; NEAR MPC Chain
Signatures are not implemented. See [integration limitations](docs/NEAR_INTENTS_INTEGRATION.md).

ClaimBot's revision-bound public HTTP smoke passed on October 25, 2026, against
the tested commit described in
[production verification](claimbot-x402/PRODUCTION_VERIFICATION.md). The
observed empty-state responses were HTTP 404 before a payment challenge.
Neither that smoke nor unit tests establish a paid request, settlement, or
publisher transaction.

## Grant and competition status

No evidence in this repository confirms a Base Build submission, an Arc
microgrant submission, a NEAR hackathon submission, or an award. The prior Arc
draft lists an October 14, 2026 deadline; the prior NEAR draft lists November
14, 2026. Both dates have passed. Confirm any current application window and
submission status with the program organizer rather than reusing those drafts.

## Required before claiming more

- Publish an end-to-end Base execution with source URLs, decision record, and
  explorer-verifiable transaction and contract address.
- Produce a funded NEAR testnet execution with origin and destination
  transaction links, or keep it labeled as unproven.
- Publish current trusted Arkiv records and demonstrate x402 challenge,
  successful payment, and settlement/receiver evidence, or keep payment
  capability labeled unproven.
- Link the exact deployed revision and public URL for each hosted component.
- Provide dated demo and user/outcome evidence before claiming adoption, impact,
  or traction.

Database rows, implementation code, passing unit tests, deployment instructions,
and static-site availability are not substitutes for those proofs.
