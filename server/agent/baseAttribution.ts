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

import { Attribution } from "ox/erc8021";

// Builder code registered on base.dev
export const BASE_BUILDER_CODE = process.env.BASE_BUILDER_CODE || "bc_hi2cipof";

/**
 * Compute the canonical ERC-8021 suffix with the implementation recommended
 * by Base. Do not hand-roll or shorten the schema marker.
 */
export function getAttributionSuffix(
  code: string = BASE_BUILDER_CODE
): `0x${string}` {
  if (!/^bc_[a-z0-9]+$/i.test(code)) {
    throw new Error("BASE_BUILDER_CODE must be a registered bc_ code");
  }
  return Attribution.toDataSuffix({ codes: [code] });
}

/**
 * Returns the dataSuffix as a hex string ready to append to transaction calldata.
 * Use this with viem's sendTransaction({ ..., dataSuffix: getDataSuffix() })
 */
export const DATA_SUFFIX = getAttributionSuffix(BASE_BUILDER_CODE);

console.log(`[Attribution] Builder code: ${BASE_BUILDER_CODE}`);
console.log(`[Attribution] dataSuffix:   ${DATA_SUFFIX}`);
