/** The Arkiv public publisher address designated by the project owner. Not a signing key. */
export const DEFAULT_CLAIMBOT_ARKIV_PUBLISHER = "0x4aBAf297bd37bb3FA0036b45976A92a46d903688" as const;

/** Only use source records written by this account, or an explicitly configured override. */
export function resolveArkivPublisherAddress(configured: string | undefined): `0x${string}` {
  const value = configured ?? DEFAULT_CLAIMBOT_ARKIV_PUBLISHER;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value) || /^0x0{40}$/i.test(value)) {
    throw new Error("ARKIV_TRUSTED_PUBLISHER must be a nonzero EVM address");
  }
  return value as `0x${string}`;
}
