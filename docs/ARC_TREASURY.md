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
- The Arc mainnet contract has now been independently verified against a mined creation receipt, deployed bytecode and owner (details below). Microgrant approval is not guaranteed.
- Never include credentials in the repository.

References: https://docs.arc.io/integrate/infrastructure/indexing-events and https://docs.arc.io/arc/references/evm-differences.

## Public demo
The standalone mainnet dashboard lives in `docs/arc-demo/index.html`. Workflow `.github/workflows/arc-verify-deploy.yml` verifies unit tests, type checking, Solidity bytecode, Arc RPC access, and the actual mainnet contract's creation receipt before publishing the GitHub Pages site. The public dashboard is at https://abuchtela.github.io/BasePulse/.

## Onchain proof registry — mainnet deployment

`contracts/ArcTreasuryProof.sol` is a minimal Solidity contract with `owner`, `proofCount`, and an owner-only `recordProof(bytes32)` method. It emits a permanent public `TreasuryProofRecorded` event but cannot transfer any currency.

The GitHub Actions workflow compiles the contract with **solc 0.8.28**, generates `ArcTreasuryProof.json` (ABI, deployment bytecode, selector), and publishes it with the dashboard at https://abuchtela.github.io/BasePulse/.

1. Open the dashboard **inside a wallet's in-app browser**. The wallet must support Arc mainnet (chain 5042) and have a small amount of Arc USDC for network gas.
2. Click **Deploy proof registry on Arc**. Review any network-fee estimate; approve contract creation only if it fits your budget. Do **not** share a seed phrase or private key.
3. The dashboard waits for a successful receipt and verifies that contract code exists at the returned address. Save the **contract address and deployment transaction hash** for the grant submission.
4. Optionally anchor a public 32-byte audit proof hash with the owner wallet, verify the transaction, and link its explorer record.

**Mainnet deployment independently verified (October 13, 2026):** Arc RPC chain ID 5042 returned a successful contract-creation receipt in block 25,760,713; the compiled Solidity creation bytecode matched the transaction input, contract bytecode exists at the address, and owner() equals the sender. proofCount() returned 1. Re-verification runs on every feature-branch publish.

- **Contract address:** `0xa8ffe853e041b0033441a4bea272a5cbb032e9c6`
- **Creation transaction:** `0xc4a13b5e5c15b24f69f06a48e55927333992efe2b68cb948370bb0c8f455b910`
- **Creation block:** `25760713`
- **Deployer wallet:** `0x748f6614ea6289664bc8beb84835e2f24fe52482`
- **Contract:** https://explorer.arc.io/address/0xa8ffe853e041b0033441a4bea272a5cbb032e9c6
- **Creation transaction:** https://explorer.arc.io/tx/0xc4a13b5e5c15b24f69f06a48e55927333992efe2b68cb948370bb0c8f455b910
- **Live CI verification record:** https://abuchtela.github.io/BasePulse/arc-deployment-verified.json

The separately provided transaction `0xa29565ca13c91df360705106b2dcd5d1e822cb415f388cf5a0b5dc0cf290d45b` is **not** the creation transaction: its receipt is in block 25761240 with `contractAddress = null`. The verification script separately checks whether it is an onchain proof anchoring call. Never represent it as the creation transaction.

Solidity is intentionally unaudited and limited to hash attestations. No automatic or unattended spending is implemented.
