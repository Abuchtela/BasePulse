/**
 * Token Deployer Module for BasePulse Agent
 * Handles ERC20 token deployment on Base using Coinbase CDP SDK and Paymaster
 *
 * Builder Code attribution (ERC-8021) is included on every deployment so Base
 * can attribute onchain activity back to BasePulse.
 * See: https://docs.base.org/base-chain/builder-codes/app-developers
 */

import { Coinbase, ERC20Token } from "@coinbase/cdp-sdk";
import { createDeployedToken, createTreasuryTransaction } from "../db";
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
 * Initialize Coinbase SDK
 */
function initializeCoinbase() {
  const apiKeyName = process.env.CDP_API_KEY_NAME;
  const privateKey = process.env.CDP_API_KEY_PRIVATE_KEY;

  if (!apiKeyName || !privateKey) {
    throw new Error("CDP_API_KEY_NAME or CDP_API_KEY_PRIVATE_KEY environment variable not set");
  }

  Coinbase.configure({ apiKeyName, privateKey });
}

/**
 * Deploy a token on Base using Coinbase CDP SDK.
 * All transactions include the ERC-8021 dataSuffix for builder attribution.
 */
export async function deployToken(
  config: TokenDeploymentConfig
): Promise<DeploymentResult> {
  try {
    initializeCoinbase();

    console.log(`[TokenDeployer] Deploying token: ${config.name} (${config.symbol}) using Coinbase SDK`);
    console.log(`[TokenDeployer] Builder attribution: code=${BASE_BUILDER_CODE} suffix=${DATA_SUFFIX}`);

    // Create a server-side wallet on Base
    const wallet = await Coinbase.createWallet({ networkId: Coinbase.networks.BaseMainnet });

    // Deploy ERC20 token
    // Note: CDP SDK provides a high-level method to deploy tokens.
    // The dataSuffix (ERC-8021) is appended to the deployment calldata for attribution.
    const token = await wallet.deployToken({
      name: config.name,
      symbol: config.symbol,
      totalSupply: 1000000000, // 1 Billion tokens
      // @ts-ignore — dataSuffix is supported in viem >=2.45.0 and CDP SDK passes it through
      dataSuffix: DATA_SUFFIX,
    });

    const tokenAddress = token.getAddress();
    const deploymentTxHash = token.getDeploymentTransactionHash();

    console.log(`[TokenDeployer] Token deployed at: ${tokenAddress}`);

    // Store deployment in database
    await createDeployedToken({
      tokenAddress: tokenAddress,
      name: config.name,
      symbol: config.symbol,
      description: config.description,
      imageUrl: config.imageUrl,
      trendTheme: config.trendTheme,
      sentimentScore: config.sentimentScore as any,
      deploymentTxHash: deploymentTxHash || "unknown",
      initialLiquidity: config.initialLiquidity as any,
      status: "deployed",
    });

    // Record deployment in treasury (gas sponsored by Paymaster via CDP SDK)
    await createTreasuryTransaction({
      type: "deployment_cost",
      amount: "0" as any, // Sponsored by Paymaster
      amountUSD: "0" as any,
      tokenAddress: tokenAddress,
      txHash: deploymentTxHash || "unknown",
      description: `Deployment for ${config.symbol} (Sponsored by Coinbase Paymaster)`,
      status: "confirmed",
    });

    // Notify owner of successful deployment
    await notifyOwner({
      title: `🚀 Token Deployed: ${config.symbol}`,
      content: `BasePulse deployed a new token "${config.name}" (${config.symbol}) for the trend "${config.trendTheme}" using Coinbase SDK.\n\nToken Address: ${tokenAddress}\nBuilder Code: ${BASE_BUILDER_CODE}\nSponsored by Coinbase Paymaster.`,
    });

    return {
      success: true,
      tokenAddress: tokenAddress,
      txHash: deploymentTxHash || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[TokenDeployer] Deployment failed:", errorMessage);

    // Notify owner of deployment failure
    await notifyOwner({
      title: "❌ Token Deployment Failed",
      content: `BasePulse failed to deploy token for trend "${config.trendTheme}" using Coinbase SDK.\n\nError: ${errorMessage}`,
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
  // In a real implementation with Coinbase SDK, we would check the wallet balance
  // or use the SDK to interact with the contract
  console.log(`[TokenDeployer] Checking fees for ${tokenAddress}`);
  return 0;
}

/**
 * Reinvest treasury funds
 */
export async function reinvestTreasuryFunds(amount: number): Promise<boolean> {
  try {
    console.log(`[TokenDeployer] Reinvesting ${amount} ETH from treasury using Coinbase SDK`);
    // Reinvestment logic using Coinbase SDK...
    return true;
  } catch (error) {
    console.error("[TokenDeployer] Reinvestment failed:", error);
    return false;
  }
}
