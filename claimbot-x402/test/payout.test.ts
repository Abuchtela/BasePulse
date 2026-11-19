import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_CLAIMBOT_USDC_RECEIVER, resolvePayoutAddress } from "../src/payout.ts";

test("ClaimBot pays the designated user wallet by default", () => {
  assert.equal(resolvePayoutAddress(undefined), "0x748f6614Ea6289664bC8BeB84835E2F24fE52482");
  assert.equal(DEFAULT_CLAIMBOT_USDC_RECEIVER, "0x748f6614Ea6289664bC8BeB84835E2F24fE52482");
});

test("a deployment can explicitly override the receiving address", () => {
  assert.equal(resolvePayoutAddress("0x1111111111111111111111111111111111111111"), "0x1111111111111111111111111111111111111111");
});

test("an invalid or zero address cannot receive payments", () => {
  assert.throws(() => resolvePayoutAddress(""), /nonzero EVM/);
  assert.throws(() => resolvePayoutAddress("0x0000000000000000000000000000000000000000"), /nonzero EVM/);
  assert.throws(() => resolvePayoutAddress("not-an-address"), /nonzero EVM/);
});
