# BasePulse Arc USDC Treasury (separate integration)

This branch adds read-only Arc treasury functionality and a separate, optional wallet-approved onchain proof registry to BasePulse. The proof registry never holds or transfers USDC; transactions require explicit wallet approval and USDC network fees.

## API (tRPC)
- `arc.status({network:"testnet"})`: verify network identity and read latest block.
- `arc.balance({network:"testnet",address:"0x..."})`: read a wallet's USDC balance.
- `arc.transfers({network:"testnet",address:"0x...",blocks:200})`: unified USDC Transfer events, capped at 500 blocks and 50 returned records.
- `arc.transaction({network:"testnet",hash:"0x..."})`: transaction status, gas fee, and decoded USDC transfer proof.

Supports `mainnet` or `testnet`. Default is testnet. Mainnet defaults to Circle's documented `https://rpc.mainnet.arc.io` and testnet defaults to `https://rpc.testnet.arc.io`. Optional `ARC_MAINNET_RPC_URL` and `ARC_TESTNET_RPC_URL` may override these with HTTPS RPC endpoints. RPC chain IDs are checked to prevent accidentally mixing networks.

## Test and demonstrate
```bash
pnpm install
pnpm test
pnpm check
pnpm dev
```
Then call the above tRPC queries through your existing BasePulse client. Use a **public** wallet address, not a seed phrase or private key.

## Cautions
- Data comes from the Arc RPC and is not simulated. Network access is required.
- Arc native USDC uses 18 decimal places for gas accounting; predeploy USDC ERC-20 events use 6 decimal places. These balances represent the same asset and must not be added together.
- The recent-transfer query specifically indexes ERC-20 Transfer logs at `0x3600000000000000000000000000000000000000`. Arc emits unified ERC-20 Transfer logs at the USDC predeploy for both native and ERC-20 sends per Circle's indexing guide. History is still limited to the requested recent-block window.
- Transfer history is a bounded block scan rather than a full wallet history.
- A successful onchain transaction or Arc-mainnet microgrant eligibility has **not** yet been demonstrated by this code; obtain a mainnet transaction hash as proof.
- Never include credentials in the repository.

References: https://docs.arc.io/integrate/infrastructure/indexing-events and https://docs.arc.io/arc/references/evm-differences.

## Public demo
The standalone mainnet dashboard lives in `docs/arc-demo/index.html`. Workflow `.github/workflows/arc-verify-deploy.yml` verifies unit tests, type checking, and Arc RPC access, then attempts GitHub Pages publication. GitHub Pages must be enabled and permitted in this repository for the publication stage to succeed. A hosted web dashboard reading mainnet is not itself an onchain smart-contract deployment; provide a real Arc mainnet transaction or deployed contract as grant evidence if required.

## Onchain proof registry — mainnet deployment

`contracts/ArcTreasuryProof.sol` is a minimal Solidity contract with `owner`, `proofCount`, and an owner-only `recordProof(bytes32)` method. It emits a permanent public `TreasuryProofRecorded` event but cannot transfer any currency.

The GitHub Actions workflow compiles the contract with **solc 0.8.28**, generates `ArcTreasuryProof.json` (ABI, deployment bytecode, selector), and publishes it with the dashboard at https://abuchtela.github.io/BasePulse/.

1. Open the dashboard **inside a wallet's in-app browser**. The wallet must support Arc mainnet (chain 5042) and have a small amount of Arc USDC for network gas.
2. Click **Deploy proof registry on Arc**. Review any network-fee estimate; approve contract creation only if it fits your budget. Do **not** share a seed phrase or private key.
3. The dashboard waits for a successful receipt and verifies that contract code exists at the returned address. Save the **contract address and deployment transaction hash** for the grant submission.
4. Optionally anchor a public 32-byte audit proof hash with the owner wallet, verify the transaction, and link its explorer record.

**Honesty requirement:** A compiled contract and hosted deploy button are *not* an Arc mainnet deployment. Claim deployment only after a funded wallet broadcasts a transaction and an Arc mainnet receipt reports success with a contract address.

Solidity is intentionally unaudited and limited to hash attestations. No automatic or unattended spending is implemented.
