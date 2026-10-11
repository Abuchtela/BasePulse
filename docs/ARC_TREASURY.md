# BasePulse Arc USDC Treasury (separate integration)

This branch adds read-only Arc treasury functionality next to the existing BasePulse agent; it does not send payments or deploy contracts.

## API (tRPC)
- `arc.status({network:"testnet"})`: verify network identity and read latest block.
- `arc.balance({network:"testnet",address:"0x..."})`: read a wallet's USDC balance.
- `arc.transfers({network:"testnet",address:"0x...",blocks:200})`: unified USDC Transfer events, capped at 500 blocks and 50 returned records.
- `arc.transaction({network:"testnet",hash:"0x..."})`: transaction status, gas fee, and decoded USDC transfer proof.

Supports `mainnet` or `testnet`. Default is testnet. Set `ARC_MAINNET_RPC_URL` to your HTTPS mainnet RPC endpoint before using mainnet; we intentionally avoid guessing public mainnet endpoints. Testnet defaults to `https://rpc.testnet.arc.network`; override with `ARC_TESTNET_RPC_URL`. RPC chain IDs are checked to prevent accidentally mixing networks.

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
- Native and ERC-20 USDC transfers emit unified events at `0x3600000000000000000000000000000000000000`. Do not treat the system emitter as another independent transfer.
- Transfer history is a bounded block scan rather than a full wallet history.
- A successful onchain transaction or Arc-mainnet microgrant eligibility has **not** yet been demonstrated by this code; obtain a mainnet transaction hash as proof.
- Never include credentials in the repository.

References: https://docs.arc.io/integrate/infrastructure/indexing-events and https://docs.arc.io/arc/references/evm-differences.
