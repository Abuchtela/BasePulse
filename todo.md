# BasePulse verified work list

An item is complete only when its evidence is linked. Code presence alone is not proof of a live integration.

## Confirmed

- [x] Arc mainnet proof registry deployed and independently checked — evidence in `docs/ARC_TREASURY.md`
- [x] Arc read-only RPC and receipt verification code added
- [x] ClaimBot trusted-publisher validation rejects manufactured opportunity results
- [x] ERC-8021 suffix generation changed to the official `ox/erc8021` implementation
- [x] Generated social posts and random onchain metrics removed
- [x] Pretend fee-collection and reinvestment success paths removed

## Requires real evidence

- [ ] Configure and verify a production social feed with public source URLs
- [ ] Configure and verify a Base-mainnet metrics feed with evidence URLs
- [ ] Execute one end-to-end trend decision without generated data
- [ ] Verify a Base token deployment transaction produced by that decision
- [ ] Implement liquidity deployment and record the real pool address and transaction
- [ ] Implement fee collection and record the real transaction
- [ ] Implement treasury reinvestment and record the real transaction
- [ ] Reconcile the recorded treasury ledger against a public wallet balance
- [ ] Implement and verify NEAR Intents execution onchain
- [ ] Run x402 payment verification with real settlement evidence
- [ ] Record a walkthrough using only live evidence and public transaction links

## Release gate

- [ ] `pnpm test` passes
- [ ] `pnpm check` passes
- [ ] No generated, random, or fabricated production data paths remain
- [ ] Every public success claim has a public source URL or transaction hash
