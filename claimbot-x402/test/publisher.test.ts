import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_CLAIMBOT_ARKIV_PUBLISHER, resolveArkivPublisherAddress } from "../src/publisher.ts";

const expected = "0x4aBAf297bd37bb3FA0036b45976A92a46d903688";
test("the designated publisher is used by default", () => {
  assert.equal(resolveArkivPublisherAddress(undefined), expected);
  assert.equal(DEFAULT_CLAIMBOT_ARKIV_PUBLISHER, expected);
});
test("a deployment can explicitly override the trusted writer", () => {
  assert.equal(resolveArkivPublisherAddress("0x1111111111111111111111111111111111111111"), "0x1111111111111111111111111111111111111111");
});
test("no empty, zero or malformed publisher may be trusted", () => {
  assert.throws(() => resolveArkivPublisherAddress(""), /nonzero EVM/);
  assert.throws(() => resolveArkivPublisherAddress("0x0000000000000000000000000000000000000000"), /nonzero EVM/);
  assert.throws(() => resolveArkivPublisherAddress("0xinvalid"), /nonzero EVM/);
});
