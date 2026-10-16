import assert from "node:assert/strict";
import { test } from "node:test";
import { loadPaidOpportunities, RequestPreflightError } from "../src/preflight.ts";

test("invalid project is rejected before Arkiv is called", async () => {
  let invoked = false;
  await assert.rejects(loadPaidOpportunities("other", async () => { invoked = true; return []; }),
    (error: unknown) => error instanceof RequestPreflightError && error.status === 400);
  assert.equal(invoked, false);
});

test("a valid paid report retains data and project scope", async () => {
  const report = {id:"verified-1", source:"https://example.org"};
  let seen = "";
  const value = await loadPaidOpportunities("ClaimBot", async project => { seen = project; return [report]; });
  assert.deepEqual(value, {project:"ClaimBot", count:1, results:[report]});
  assert.equal(seen, "ClaimBot");
});

test("empty data refuses payment by returning 404", async () => {
  await assert.rejects(loadPaidOpportunities("BasePulse", async () => []),
    (error: unknown) => error instanceof RequestPreflightError && error.status === 404);
});

test("upstream failure refuses payment by returning 503", async () => {
  await assert.rejects(loadPaidOpportunities("BasePulse", async () => {throw Error("rpc down");}),
    (error: unknown) => error instanceof RequestPreflightError && error.status === 503);
});

test("malformed upstream data refuses payment by returning 503", async () => {
  await assert.rejects(loadPaidOpportunities("ClaimBot", async () => null as never),
    (error: unknown) => error instanceof RequestPreflightError && error.status === 503);
});
