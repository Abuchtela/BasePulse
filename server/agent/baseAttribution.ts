/**
 * Base ERC-8021 Builder Code Attribution
 *
 * The builder code (bc_hi2cipof) is used to tag onchain transactions so Base
 * can attribute activity back to BasePulse for analytics and future rewards.
 *
 * Spec: https://docs.base.org/base-chain/builder-codes/app-developers
 *
 * The dataSuffix is appended to transaction calldata. It encodes the builder
 * code using the ERC-8021 format: a 16-byte suffix where the last 8 bytes are
 * the magic marker 0x8021802180218021 and the first 8 bytes encode the code.
 */

import { encodePacked, keccak256, toHex } from "viem";

// Builder code registered on base.dev
export const BASE_BUILDER_CODE = process.env.BASE_BUILDER_CODE || "bc_hi2cipof";

/**
 * Compute the ERC-8021 dataSuffix for the given builder code.
 * Uses the same algorithm as ox's Attribution.toDataSuffix().
 *
 * Format: 0x + <8-byte truncated keccak of code> + 8021802180218021
 */
export function getAttributionSuffix(code: string = BASE_BUILDER_CODE): `0x${string}` {
  // Hash the builder code and take first 8 bytes
  const hash = keccak256(encodePacked(["string"], [code]));
  const codeBytes = hash.slice(2, 18); // first 8 bytes = 16 hex chars
  // ERC-8021 magic marker (8 bytes)
  const magic = "8021802180218021";
  return `0x${codeBytes}${magic}`;
}

/**
 * Returns the dataSuffix as a hex string ready to append to transaction calldata.
 * Use this with viem's sendTransaction({ ..., dataSuffix: getDataSuffix() })
 */
export const DATA_SUFFIX = getAttributionSuffix(BASE_BUILDER_CODE);

console.log(`[Attribution] Builder code: ${BASE_BUILDER_CODE}`);
console.log(`[Attribution] dataSuffix:   ${DATA_SUFFIX}`);
