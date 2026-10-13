# ClaimBot × Arkiv: Opportunity Provenance

ClaimBot stores verified builder opportunities as public, independently queryable Arkiv entities. Every record includes the official source, eligibility, exact deadline, payout, project fit and smallest next step.

## Contest baseline

- Existing repository: `Abuchtela/BasePulse`
- Baseline commit before this integration: `fa20752b0b0a722b5e8b78eb1fd3e817b88ba5f4`
- New work: this directory plus `/arkiv/schema.md` and `/arkiv/friction.md`
- Network: Arkiv Tiramisu testnet, chain ID `7738577`

## Run

```bash
npm install
npm test
npm run typecheck
npm run check:rpc
npm run query -- ClaimBot
```

Publishing requires a dedicated funded Tiramisu development key. Never use a production wallet:

```bash
ARKIV_PRIVATE_KEY=0x... npm run publish -- --broadcast
```

The publisher refuses missing/invalid keys, the wrong chain, an unfunded signer and duplicate opportunity IDs from the same creator.

## Submission evidence still required

- Public deployment judges can open
- One confirmed Tiramisu entity and transaction
- Wallet address that created the entity
- Demo video no longer than three minutes
- Final `/arkiv/friction.md` after a real write and query

