import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { encodeAbiParameters, encodeEventTopics, parseAbi, type TransactionReceipt } from "viem";
import type { PaymentRequired } from "@x402/core/types";
import { ExactEvmScheme as ServerScheme } from "@x402/evm/exact/server";
import { checkoutOffer, USDC_BY_NETWORK } from "../src/checkoutPolicy.ts";
import { verifyPaymentReceipt } from "../src/receipt.ts";
import { isPayableOpportunity } from "../src/arkivReader.ts";

// Unit vectors only. These are never served as opportunities, transactions or settlement evidence.
const payer = "0x0000000000000000000000000000000000000001";
const payTo = "0x748f6614Ea6289664bC8BeB84835E2F24fE52482";
const network = "eip155:84532";
const nonce = `0x${"01".repeat(32)}` as `0x${string}`;
const tx = `0x${"02".repeat(32)}` as `0x${string}`;
const expected = {network,payTo,amount:"100000",resource:"https://claimbot-x402.vercel.app/api/opportunities?project=BasePulse"};
const offer = {scheme:"exact",network,payTo,amount:"100000",asset:USDC_BY_NETWORK[network],maxTimeoutSeconds:60,extra:{name:"USDC",version:"2"}};
const challenge = {x402Version:2,resource:{url:expected.resource},accepts:[offer]} as PaymentRequired;
test("checkout pins the report, chain, token, price, receiver and signing domain",()=>assert.deepEqual(checkoutOffer(challenge,expected),offer));
test("checkout accepts the installed server SDK's real price and chain-specific signing domain",async()=>{
  const scheme = new ServerScheme();
  for (const network of ["eip155:84532","eip155:8453"] as const) {
    const parsed = await scheme.parsePrice("$0.10",network);
    const sdkOffer = {...offer,...parsed,network};
    assert.deepEqual(checkoutOffer({...challenge,accepts:[sdkOffer]},{...expected,network}),sdkOffer);
  }
});
for (const [name,changes] of Object.entries({
  "wrong receiver":{payTo:payer}, "wrong chain":{network:"eip155:8453"},
  "wrong asset":{asset:payer}, "higher price":{amount:"100001"},
  "invalid timeout":{maxTimeoutSeconds:3600}, "wrong signing domain":{extra:{name:"Other",version:"2"}},
  "approval-based transfer":{extra:{name:"USDC",version:"2",assetTransferMethod:"permit2"}},
})) test(`checkout rejects ${name} before signing`,()=>assert.throws(()=>checkoutOffer({...challenge,accepts:[{...offer,...changes}]} as PaymentRequired,expected)));
test("checkout rejects a challenge for another report",()=>assert.throws(()=>checkoutOffer({...challenge,resource:{url:expected.resource.replace("BasePulse","ClaimBot")}},expected)));
test("checkout enforces the independent 0.10 USDC ceiling",()=>assert.throws(()=>checkoutOffer(challenge,{...expected,amount:"100001"})));

const abi = parseAbi(["event Transfer(address indexed from, address indexed to, uint256 value)","event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)"]);
const transfer = {address:USDC_BY_NETWORK[network],topics:encodeEventTopics({abi,eventName:"Transfer",args:{from:payer,to:payTo}}),data:encodeAbiParameters([{type:"uint256"}],[100000n])};
const authorization = {address:USDC_BY_NETWORK[network],topics:encodeEventTopics({abi,eventName:"AuthorizationUsed",args:{authorizer:payer,nonce}}),data:"0x"};
const receipt = {status:"success",transactionHash:tx,blockNumber:1n,blockHash:tx,logs:[transfer,authorization]} as unknown as TransactionReceipt;
const payment = {network,transaction:tx,payer,payTo,amount:"100000",nonce};
test("receipt verifier requires both a matching USDC transfer and exact authorization",()=>assert.equal(verifyPaymentReceipt(receipt,payment).verified,true));
test("a facilitator transaction hash alone never counts as proof",()=>assert.throws(()=>verifyPaymentReceipt({...receipt,logs:[]},payment)));
test("a reverted transaction cannot be marked paid",()=>assert.throws(()=>verifyPaymentReceipt({...receipt,status:"reverted"},payment)));
test("an unrelated transfer to the receiver cannot be reused",()=>assert.throws(()=>verifyPaymentReceipt(receipt,{...payment,nonce:tx})));
test("another token emitting the same events cannot be marked paid",()=>assert.throws(()=>verifyPaymentReceipt({...receipt,logs:receipt.logs.map(log=>({...log,address:payer}))},payment)));
test("a different payment amount cannot be marked paid",()=>assert.throws(()=>verifyPaymentReceipt(receipt,{...payment,amount:"1"})));
test("a different sender cannot be marked paid",()=>assert.throws(()=>verifyPaymentReceipt(receipt,{...payment,payer:payTo})));
const draft = JSON.parse(readFileSync(new URL("../data/verified-opportunity.json",import.meta.url),"utf8"));
const checked = new Date(draft.verifiedAt);
test("the actual source-checked draft passes current eligibility checks",()=>assert.equal(isPayableOpportunity(draft,"BasePulse",checked),true));
test("an unpublished deadline requires an explicit null date",()=>{
  assert.equal(isPayableOpportunity({...draft,deadline:null,deadlineType:"not-published"},"BasePulse",checked),true);
  assert.equal(isPayableOpportunity({...draft,deadline:null},"BasePulse",checked),false);
  assert.equal(isPayableOpportunity({...draft,deadlineType:"not-published"},"BasePulse",checked),false);
});
test("records without published deadlines still expire after seven days without source rechecking",()=>assert.equal(isPayableOpportunity({...draft,deadline:null,deadlineType:"not-published"},"BasePulse",new Date(checked.valueOf()+7*86400000+1)),false));
