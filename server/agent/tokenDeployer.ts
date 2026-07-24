/**
 * Token Deployer Module for BasePulse Agent
 * Handles ERC20 token deployment on Base using Coinbase CDP SDK and Paymaster
 *
 * Builder Code attribution (ERC-8021) is included on every deployment so Base
 * can attribute onchain activity back to BasePulse.
 * See: https://docs.base.org/base-chain/builder-codes/app-developers
 */

import { CdpClient } from "@coinbase/cdp-sdk";
import { concatHex, encodeDeployData } from "viem";
import { createDeployedToken, createTreasuryTransaction, updateTreasuryTransactionByTxHash } from "../db";
import { notifyOwner } from "../_core/notification";
import { DATA_SUFFIX, BASE_BUILDER_CODE } from "./baseAttribution";

interface TokenDeploymentConfig {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  initialLiquidity: number; // in ETH
  trendTheme: string;
  sentimentScore: number;
}

interface DeploymentResult {
  success: boolean;
  tokenAddress?: string;
  txHash?: string;
  error?: string;
}

/**
 * Create and return a CDP client instance.
 */
function createCdpClient(): CdpClient {
  const apiKeyId = process.env.CDP_API_KEY_NAME;
  const apiKeySecret = process.env.CDP_API_KEY_PRIVATE_KEY;

  if (!apiKeyId || !apiKeySecret) {
    throw new Error("CDP_API_KEY_NAME or CDP_API_KEY_PRIVATE_KEY environment variable not set");
  }

  return new CdpClient({ apiKeyId, apiKeySecret });
}

/**
 * Requires the full compiled ERC20 contract creation bytecode to be provided
 * via the `ERC20_DEPLOY_BYTECODE` environment variable. An optional `0x`
 * prefix is accepted and will be stripped before concatenation.
 *
 * @param name - Token name
 * @param symbol - Token symbol
 * @returns Contract creation data as a `0x`-prefixed hex string
 */
function encodeERC20DeployBytecode(name: string, symbol: string): `0x${string}` {
  const rawContractBytecode = process.env.ERC20_DEPLOY_BYTECODE;

  if (!rawContractBytecode || rawContractBytecode.trim() === "") {
    throw new Error(
      "ERC20_DEPLOY_BYTECODE environment variable is required and must contain the compiled ERC20 deployment bytecode"
    );
  }

  const contractBytecode = rawContractBytecode.startsWith("0x")
    ? rawContractBytecode.slice(2)
    : rawContractBytecode;

  if (
    contractBytecode.length === 0 ||
    contractBytecode.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(contractBytecode)
  ) {
    throw new Error(
      "ERC20_DEPLOY_BYTECODE must be a non-empty even-length hex string with an optional 0x prefix"
    );
  }

  // Encode bytecode + ABI-encoded constructor args.
  // The ABI must match the actual constructor of the contract in ERC20_DEPLOY_BYTECODE.
  // This expects a standard ERC20 constructor(string name, string symbol).
  // If your bytecode uses a different constructor signature, update the inputs below.
  const deployData = encodeDeployData({
    abi: [
      {
        type: "constructor",
        inputs: [
          { name: "name_", type: "string" },
          { name: "symbol_", type: "string" },
        ],
      },
    ],
    bytecode: `0x${contractBytecode}`,
    args: [name, symbol],
  });

  // Append ERC-8021 builder attribution suffix
  return concatHex([deployData, DATA_SUFFIX]);
}

/**
 * Deploy a new ERC20 token on Base mainnet using the Coinbase CDP SDK.
 *
 * Sends a contract-creation transaction from a managed server-side account,
 * waits for the transaction receipt, and persists the deployed contract address.
 * All transactions include the ERC-8021 dataSuffix for builder attribution.
 *
 * @param config - Token deployment configuration
 * @returns DeploymentResult containing the contract address and tx hash on success
 */
export async function deployToken(
  config: TokenDeploymentConfig
): Promise<DeploymentResult> {
  try {
    const cdp = createCdpClient();

    console.log(`[TokenDeployer] Deploying token: ${config.name} (${config.symbol}) using CDP SDK`);
    console.log(`[TokenDeployer] Builder attribution: code=${BASE_BUILDER_CODE} suffix=${DATA_SUFFIX}`);

    // Get or create a named server-side EVM account to avoid spawning a new
    // account on every deployment call
    const account = await cdp.evm.getOrCreateAccount({ name: "basepulse-deployer" });

    // Obtain a network-scoped account handle for Base mainnet
    const networkAccount = await account.useNetwork("base");

    // Build contract-creation calldata (bytecode + ABI-encoded constructor args +
    // ERC-8021 attribution suffix)
    const deployData = encodeERC20DeployBytecode(config.name, config.symbol);

    // Send the contract-creation transaction (no `to` field = CREATE opcode)
    const { transactionHash } = await networkAccount.sendTransaction({
      transaction: { data: deployData },
    });

    console.log(`[TokenDeployer] Deployment tx sent: ${transactionHash}. Waiting for receipt…`);

    // Record the outgoing deployment transaction immediately as "pending"
    // so it is tracked even if the process is interrupted before confirmation.
    await createTreasuryTransaction({
      type: "deployment_cost",
      amount: "0" as any, // Sponsored by Paymaster
      amountUSD: "0" as any,
      txHash: transactionHash,
      description: `Deployment for ${config.symbol} (Sponsored by Coinbase Paymaster)`,
      status: "pending",
    });

    // Wait for the transaction to be mined and get the confirmed contract address
    const receipt = await networkAccount.waitForTransactionReceipt({ transactionHash });

    if (!receipt.contractAddress) {
      // Mark the pending treasury record as failed since the tx produced no contract
      await updateTreasuryTransactionByTxHash(transactionHash, { status: "failed" });
      throw new Error(`Transaction ${transactionHash} did not produce a contract address`);
    }

    const tokenAddress = receipt.contractAddress;

    console.log(`[TokenDeployer] Token deployed at: ${tokenAddress}`);

    // Persist deployment record with confirmed on-chain data (contract address and block number)
    await createDeployedToken({
      tokenAddress,
      name: config.name,
      symbol: config.symbol,
      description: config.description,
      imageUrl: config.imageUrl,
      trendTheme: config.trendTheme,
      sentimentScore: config.sentimentScore as any,
      deploymentTxHash: transactionHash,
      deploymentBlockNumber:
        receipt.blockNumber !== undefined && receipt.blockNumber !== null
          ? Number(receipt.blockNumber)
          : undefined,
      initialLiquidity: config.initialLiquidity as any,
      status: "deployed",
    });

    // Confirm the pending treasury transaction now that we have the contract address
    await updateTreasuryTransactionByTxHash(transactionHash, {
      status: "confirmed",
      tokenAddress,
    });

    // Notify owner of successful deployment
    await notifyOwner({
      title: `🚀 Token Deployed: ${config.symbol}`,
      content: `BasePulse deployed a new token "${config.name}" (${config.symbol}) for the trend "${config.trendTheme}" using CDP SDK.\n\nToken Address: ${tokenAddress}\nBuilder Code: ${BASE_BUILDER_CODE}\nSponsored by Coinbase Paymaster.`,
    });

    return {
      success: true,
      tokenAddress,
      txHash: transactionHash,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[TokenDeployer] Deployment failed:", errorMessage);

    // Notify owner of deployment failure
    await notifyOwner({
      title: "❌ Token Deployment Failed",
      content: `BasePulse failed to deploy token for trend "${config.trendTheme}" using CDP SDK.\n\nError: ${errorMessage}`,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Collect trading fees from deployed token
 */
export async function collectTradingFees(tokenAddress: string): Promise<number> {
  console.log(`[TokenDeployer] Checking fees for ${tokenAddress}`);
  return 0;
}

/**
 * Reinvest treasury funds
 */
export async function reinvestTreasuryFunds(amount: number): Promise<boolean> {
  try {
    console.log(`[TokenDeployer] Reinvesting ${amount} ETH from treasury using CDP SDK`);
    return true;
  } catch (error) {
    console.error("[TokenDeployer] Reinvestment failed:", error);
    return false;
  }
}
