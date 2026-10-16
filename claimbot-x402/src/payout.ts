/** Public payout destination designated for ClaimBot USDC receipts. Not a signing key. */
export const DEFAULT_CLAIMBOT_USDC_RECEIVER = "0x748f6614Ea6289664bC8BeB84835E2F24fE52482" as const;

/** Deployment-specific X402_PAY_TO takes precedence; never accept malformed or zero addresses. */
export function resolvePayoutAddress(configured: string | undefined = process.env.X402_PAY_TO): string {
  const address = configured ?? DEFAULT_CLAIMBOT_USDC_RECEIVER;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address) || /^0x0{40}$/i.test(address)) {
    throw new Error("X402_PAY_TO must be a nonzero EVM receiving address");
  }
  return address;
}
