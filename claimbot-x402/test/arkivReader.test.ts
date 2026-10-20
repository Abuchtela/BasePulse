import assert from "node:assert/strict";
import { test } from "node:test";
import { isPayableOpportunity, distinctByOpportunityId } from "../src/arkivReader.ts";

const now = new Date("2026-10-19T00:00:00Z");
const valid = {
 id: "official-grant-1", title:"Verified official funding", officialSourceUrl:"https://grants.example.org/opportunity",
 eligibility:["Open source developers"], deadline:"2026-12-01T00:00:00Z", payout:"100 USDC",
 fit:"Matches ClaimBot", smallestNextStep:"Review requirements", targetProject:"ClaimBot",
 status:"open", verifiedAt:"2026-10-18T00:00:00Z",
};
test("accepts a current, attributed opportunity",()=>assert.equal(isPayableOpportunity(valid,"ClaimBot",now),true));
test("rejects an expired opportunity",()=>assert.equal(isPayableOpportunity({...valid, deadline:"2026-10-18T00:00:00Z"},"ClaimBot",now),false));
test("rejects untrusted protocols",()=>assert.equal(isPayableOpportunity({...valid,officialSourceUrl:"http://untrusted.example.com"},"ClaimBot",now),false));
test("rejects wrong target project",()=>assert.equal(isPayableOpportunity(valid,"BasePulse",now),false));
test("rejects empty eligibility",()=>assert.equal(isPayableOpportunity({...valid, eligibility:[]},"ClaimBot",now),false));
test("rejects future verifiedAt",()=>assert.equal(isPayableOpportunity({...valid, verifiedAt:"2026-10-21T00:00:00Z"},"ClaimBot",now),false));
test("rejects stale official-source verification timestamps",()=>assert.equal(isPayableOpportunity({...valid,verifiedAt:"2026-10-01T00:00:00Z"},"ClaimBot",now),false));
test("accepts verification exactly at the seven-day limit",()=>assert.equal(isPayableOpportunity({...valid,verifiedAt:"2026-10-12T00:00:00Z"},"ClaimBot",now),true));
test("rejects verification one millisecond older than seven days",()=>assert.equal(isPayableOpportunity({...valid,verifiedAt:"2026-10-11T23:59:59.999Z"},"ClaimBot",now),false));
test("paid results are deduplicated by opportunity ID",()=>{
 const first={opportunity:{id:"same"},key:"first"};
 const repeated={opportunity:{id:"same"},key:"second"};
 const other={opportunity:{id:"new"},key:"third"};
 assert.deepEqual(distinctByOpportunityId([first,repeated,other]),[first,other]);
});
