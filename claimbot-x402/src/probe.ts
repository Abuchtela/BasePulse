import { resolveArkivPublisherAddress } from "./publisher.js";
import { queryTrustedOpenOpportunities } from "./arkivReader.js";

async function main(){
 const now = new Date();
 const publisher = resolveArkivPublisherAddress(process.env.ARKIV_TRUSTED_PUBLISHER);
 for(const target of ["ClaimBot","BasePulse"] as const){
   const records = await queryTrustedOpenOpportunities(target, publisher, process.env.ARKIV_RPC_URL, now);
   console.log(JSON.stringify({checkedAt:now.toISOString(),network:"Arkiv Tiramisu",publisher,target,eligibleRecordCount:records.length,keys:records.map(x=>x.key)}));
 }
}
main().catch(error=>{console.error("LIVE ARKIV READ FAILED:",error instanceof Error?error.message:String(error));process.exitCode=1;});
